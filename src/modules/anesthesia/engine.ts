/**
 * The anaesthesia session engine.
 *
 * One object that owns a running scenario: the drug solvers, the virtual patient,
 * the waveform engine, the alarms, the timeline, and the event log. It advances
 * in exact 100 ms ticks and emits the full state message the worker protocol
 * defines.
 *
 * It is FORWARD ONLY — dose in, prediction out. It exposes no function that
 * accepts a target concentration and returns a dose; the target-solving code
 * lives outside this module and `tests/arch/boundaries.test.ts` fails the build if
 * that ever stops being true.
 */

import { AlarmEngine, type ActiveAlarm } from '@platform/alarms/alarms';
import { CompartmentSolver, STEP_MINUTES } from '@platform/kernel/compartments';
import { clamp } from '@platform/kernel/numeric';
import type { Attribution, DrugConcentration, EngineEvent, EquipmentSnapshot, LearnerAction } from '@platform/kernel/protocol';
import { createRng, type Rng } from '@platform/kernel/rng';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import { evaluateEnvelope } from './pharmacology/envelope';
import { getModel, parametersFor, selectDefaultModel, MODEL_SET_REVISION } from './pharmacology/registry';
import { normalizedEffect } from './pharmacology/pd';
import type { PharmacologyModel } from './pharmacology/types';
import { getFluid, MAX_FLUID_BOLUS_ML } from './content/fluids';
import {
  getBloodProduct, MAX_PRBC_UNITS_PER_ACTION,
} from './content/blood-products';
import { oxygenDeliveryMlPerMin } from './physiology/oxygen-delivery';
import type { Covariates } from './pharmacology/body-composition';
import {
  RESPIRATORY_PROFILES, VirtualPatient, baselineSvr, healthyChildRespiratoryProfile,
  JAW_THRUST_CPAP_SECONDS, neuromuscularState, stepLaryngospasm,
  stepUpperAirwayObstruction,
  stepOpioidVentilatoryImpairment,
  qualitativeTwitchAssessment, rocuroniumEffectSiteForTrainOfFourRatio,
  type LaryngoscopyResult, type PatientProfile, type PatientState, type VentilatorSettings,
} from './physiology';
import { WaveformEngine, restingDrive, type ArtifactId, type RhythmId, type WaveformFrame } from './waveforms';
import type { Scenario as ScenarioDocument, TimelineEvent } from './scenarios/types';
import { evaluatePredicate, parsePredicate, type StatePredicate } from './scenarios/predicate';

/** The engine's own version, recorded in every transcript. */
export const ENGINE_VERSION = '0.1.0-alpha.42';

/** Source-banded adult perioperative IV epinephrine boluses modeled by this slice. */
export const EPINEPHRINE_IV_BOUNDS = { minMicrograms: 10, maxMicrograms: 50 } as const;
export const DANTROLENE_DOSE_MG_PER_KG = 2.5;
/** Fixed interaction bound for placing the configured rescue supraglottic airway. */
export const SGA_INSERTION_SECONDS = 15;
/** Fixed delay for the independent cuff sample in the arterial-line teaching case. */
export const NIBP_CYCLE_SECONDS = 20;
/** Blood-column approximation: 10 cm of vertical error changes pressure by about 7.5 mmHg. */
export const ARTERIAL_HYDROSTATIC_MMHG_PER_CM = 0.75;
export const ARTERIAL_MISLEVELING_CM = 20;
const HYPERTENSIVE_EMERGENCY_BLOCKED_ACTION_TYPES = new Set([
  'bolus', 'infusion', 'ventilator', 'call-for-help', 'airway-device', 'laryngoscopy',
  'vasopressor', 'ephedrine', 'inhaled-bronchodilator', 'epinephrine', 'inject-crisis',
  'neuromuscular-reversal', 'chest-compressions', 'cardiac-arrest-epinephrine',
  'defibrillation', 'seizure-suppression', 'lipid-emulsion', 'dantrolene',
  'active-cooling', 'fluid', 'blood-bank-request', 'blood-product', 'coagulation-labs',
  'hypnotic-line', 'airway-maneuver', 'silence-alarm', 'artifact', 'arterial-line',
  'capnography-line', 'breathing-circuit', 'rhythm',
  'anaphylaxis', 'blood-loss', 'cardiac-tamponade', 'crystalloid', 'difficult-airway',
  'equipment-failure', 'high-spinal', 'laryngospasm', 'local-anesthetic-toxicity',
  'malignant-hyperthermia', 'obstruction', 'opioid-ventilatory-impairment',
  'perioperative-hyperglycemia', 'perioperative-hypothermia', 'rhythm-change',
  'sepsis-pattern', 'shock-pattern', 'status-epilepticus', 'surgical-stimulus',
  'tension-pneumothorax', 'thermal-response', 'upper-airway-obstruction',
  'venous-air-embolism',
]);
const PACEMAKER_CAPTURE_FAILURE_BLOCKED_ACTION_TYPES = HYPERTENSIVE_EMERGENCY_BLOCKED_ACTION_TYPES;
const TRANSCUTANEOUS_PACING_CAPTURE_BLOCKED_ACTION_TYPES = HYPERTENSIVE_EMERGENCY_BLOCKED_ACTION_TYPES;
const ACUTE_SEVERE_ASTHMA_BLOCKED_ACTION_TYPES = HYPERTENSIVE_EMERGENCY_BLOCKED_ACTION_TYPES;
const COPD_TRANSITION_BLOCKED_ACTION_TYPES = HYPERTENSIVE_EMERGENCY_BLOCKED_ACTION_TYPES;
const CAP_HYPOXEMIA_BLOCKED_ACTION_TYPES = HYPERTENSIVE_EMERGENCY_BLOCKED_ACTION_TYPES;
const POST_PE_DYSPNEA_BLOCKED_ACTION_TYPES = HYPERTENSIVE_EMERGENCY_BLOCKED_ACTION_TYPES;
const APE_SUPPORT_BLOCKED_ACTION_TYPES = HYPERTENSIVE_EMERGENCY_BLOCKED_ACTION_TYPES;
const POST_TENSION_PNEUMOTHORAX_BLOCKED_ACTION_TYPES = HYPERTENSIVE_EMERGENCY_BLOCKED_ACTION_TYPES;
const LARGE_PLEURAL_EFFUSION_BLOCKED_ACTION_TYPES = HYPERTENSIVE_EMERGENCY_BLOCKED_ACTION_TYPES;
const BRONCHIECTASIS_MUCUS_BLOCKED_ACTION_TYPES = new Set([
  ...HYPERTENSIVE_EMERGENCY_BLOCKED_ACTION_TYPES, 'mucus-plugging-response',
]);
const CHRONIC_OPIOID_HYPOVENTILATION_BLOCKED_ACTION_TYPES = new Set([
  ...HYPERTENSIVE_EMERGENCY_BLOCKED_ACTION_TYPES, 'opioid-ventilatory-response',
  'opioid-toxicity-response',
]);
const NEUROMUSCULAR_RESPIRATORY_FAILURE_BLOCKED_ACTION_TYPES = new Set([
  ...HYPERTENSIVE_EMERGENCY_BLOCKED_ACTION_TYPES, 'mucus-plugging-response',
  'opioid-ventilatory-response', 'opioid-toxicity-response',
]);
const OBESITY_HYPOVENTILATION_BLOCKED_ACTION_TYPES = new Set([
  ...HYPERTENSIVE_EMERGENCY_BLOCKED_ACTION_TYPES, 'mucus-plugging-response',
  'opioid-ventilatory-response', 'opioid-toxicity-response',
]);
const NONINVASIVE_VENTILATION_SELECTION_BLOCKED_ACTION_TYPES = new Set([
  ...HYPERTENSIVE_EMERGENCY_BLOCKED_ACTION_TYPES, 'mucus-plugging-response',
  'opioid-ventilatory-response', 'opioid-toxicity-response', 'copd-exacerbation-response',
  'acute-pulmonary-edema-response', 'obesity-hypoventilation-response',
  'neuromuscular-respiratory-failure-response',
]);
/** Fixed teaching calibration for exhausted-absorbent breakthrough at 1 L/min fresh-gas flow. */
export const EXHAUSTED_ABSORBENT_INSPIRED_CO2_MMHG = 8;

export const LAST_LIPID_CONCENTRATION_PERCENT = 20;
export const LAST_LIPID_MAX_ML_PER_KG = 12;
export const LAST_LIPID_BOLUS_SECONDS = 180;
/** Bounded initial infusion course; the safety ceiling remains a ceiling, not a target. */
export const LAST_LIPID_INITIAL_INFUSION_SECONDS = 20 * 60;

/** ASRA 2020 initial 20% lipid dosing, with 70 kg assigned to the fixed-dose band. */
export function lastLipidProtocolForWeight(weightKg: number) {
  if (!Number.isFinite(weightKg) || weightKg <= 0) throw new Error('Weight must be finite and positive.');
  return weightKg < 70
    ? {
      band: 'under-70-kg' as const,
      initialBolusMl: 1.5 * weightKg,
      infusionMlPerMin: 0.25 * weightKg,
      maxTotalMl: LAST_LIPID_MAX_ML_PER_KG * weightKg,
    }
    : {
      band: '70-kg-or-more' as const,
      initialBolusMl: 100,
      infusionMlPerMin: 250 / 20,
      maxTotalMl: LAST_LIPID_MAX_ML_PER_KG * weightKg,
    };
}

export type Scenario = ScenarioDocument;

/**
 * What the anaesthesia machine can actually deliver.
 *
 * These are the machine's limits, not the physiology's. A setting outside them is
 * clamped and the learner is told, exactly as a real machine refuses a dial
 * position that does not exist.
 */
export const VENTILATOR_BOUNDS = {
  /**
   * The low side of the inspired fraction is NOT clamped here. It has its own
   * guard, which refuses the setting outright and explains that a real machine
   * carries the same interlock — a better answer than silently moving the dial,
   * and the thing the learner is meant to take away.
   */
  fio2: { min: 0.21, max: 1, guardedBelow: true },
  tidalVolumeMl: { min: 0, max: 1500, guardedBelow: false },
  respiratoryRateBpm: { min: 0, max: 60, guardedBelow: false },
  freshGasFlowLPerMin: { min: 0.5, max: 15, guardedBelow: false },
  peep: { min: 0, max: 30, guardedBelow: false },
  sevofluranePercent: { min: 0, max: 8, guardedBelow: false },
} as const;

/**
 * The end-tidal oxygen fraction at which the functional residual capacity counts
 * as denitrogenated. The conventional teaching endpoint for preoxygenation.
 */
export const PREOXYGENATION_END_TIDAL_TARGET = 0.9;

/** A drug the learner can give, with its resolved model. */
export interface ActiveDrug {
  readonly drugId: string;
  readonly model: PharmacologyModel;
  readonly solver: CompartmentSolver;
  /** Current infusion rate in the model's dose unit per minute. */
  infusionRate: number;
  /** Millilitres remaining in the syringe. An exhausted syringe cannot be pushed. */
  syringeRemainingMl: number;
  /** The tick the current infusion started at, or null when none is running. */
  infusionSinceTick: number | null;
  readonly concentration: number;
  readonly typicalDose: number;
  readonly selectionReason: string;
  readonly deliveryModes: readonly ('bolus' | 'infusion')[];
}

export interface EngineTick {
  readonly tick: number;
  readonly state: PatientState;
  readonly concentrations: readonly DrugConcentration[];
  readonly attribution: readonly Attribution[];
  readonly alarms: readonly ActiveAlarm[];
  readonly events: readonly EngineEvent[];
  readonly warnings: readonly string[];
  readonly waveforms: WaveformFrame;
  readonly alarmBurden: boolean;
  readonly equipment: EquipmentSnapshot;
}

/** Timeline events that are currently applying. */
interface RunningEvent {
  readonly id: string;
  readonly type: string;
  readonly value: number;
  readonly untilTick: number;
}

export interface EngineOptions {
  readonly scenario: Scenario;
  readonly seed: number;
  readonly practiceRegion: string;
}

export class AnesthesiaEngine {
  readonly scenario: Scenario;
  readonly practiceRegion: string;
  readonly seed: number;
  private readonly rng: Rng;
  private readonly patient: VirtualPatient;
  private readonly waveforms: WaveformEngine;
  private readonly alarmEngine = new AlarmEngine();
  private readonly drugs = new Map<string, ActiveDrug>();
  private readonly covariates: Covariates;
  private readonly firedEvents = new Set<string>();
  /**
   * Every `when:` predicate, parsed once at construction.
   *
   * Parsed here rather than at each tick so a malformed predicate is a loud
   * failure when the scenario loads, not a silent one ten minutes into a
   * session — and so parsing is not repeated 36,000 times an hour.
   */
  private readonly predicates = new Map<string, StatePredicate>();
  /**
   * Events whose condition was true on the previous tick.
   *
   * Timeline events are EDGE-triggered. Without this a repeatable event on
   * `spo2Percent < 90` would fire ten times a second for as long as the patient
   * stayed desaturated, which is not a scenario, it is a stuck key.
   */
  private readonly conditionHeld = new Set<string>();
/** True once the physiology has arrested the patient. It does not clear. */
  private arrestedByHypoxia = false;
  /** Unmodelled settings already reported, so each is said once per session. */
  private readonly reportedUnmodelled = new Set<string>();
  /**
   * The last state the physiology produced.
   *
   * A `when:` predicate is decided against this rather than against the tick it
   * fires in, because the state for a tick does not exist until after the
   * timeline for that tick has been read. The cost is one tick — 100 ms — of
   * latency, which is stated here rather than hidden.
   */
  private lastState: Readonly<Record<string, number>> = {};
  private running: RunningEvent[] = [];
  private currentTick = 0;
  private ventilator: VentilatorSettings;
  private rhythm: RhythmId = 'sinus';
  /** The Cormack-Lehane grade of the last laryngoscopy, or null before the first. */
  private lastGrade: number | null = null;
  /** A sampled attempt that completes only after its simulated duration elapses. */
  private pendingLaryngoscopy: {
    readonly result: LaryngoscopyResult;
    readonly completesAtTick: number;
    readonly configuredFailure: boolean;
  } | null = null;
  private pendingSupraglotticInsertion: { readonly completesAtTick: number } | null = null;
  private helpRequestedAtTick: number | null = null;
  /** Null outside the configured teaching course; otherwise assisted facemask delivery fraction. */
  private difficultAirwayMaskFraction: number | null = null;
  private readonly artifacts = new Set<ArtifactId>();
  /** Learner-recorded discrimination step for a displayed capnography failure. */
  private capnographyVentilationCrossChecked = false;
  /** Circle-system state; unlike a sample-line artifact, rebreathing changes the patient. */
  private co2AbsorbentExhausted = false;
  private inspiredCo2MmHg = 0;
  private circuitCapnogramAssessed = false;
  private circuitAbsorbentReplaced = false;
  /** Learner-visible arterial sensor state; canonical pressure remains in the patient. */
  private arterialWaveformAssessed = false;
  private arterialLeveledAndZeroed = false;
  private pendingNibpCompletesAtTick: number | null = null;
  private nibpMeanArterialMmHg: number | null = null;
  private nibpMeasuredAtTick: number | null = null;
  private pendingEvents: EngineEvent[] = [];
  private vasopressorEffect = 0;
  /** Distinct alpha/beta/bronchodilator teaching effect; never substituted by generic vasopressor. */
  private epinephrineEffect = 0;
  private epinephrineTotalMicrograms = 0;
  private lastEpinephrineTick: number | null = null;
  private crystalloidTotalMl = 0;
  private packedRedBloodCellUnits = 0;
  private freshFrozenPlasmaUnits = 0;
  private coagulationPanelReported = false;
  private bloodProductsReleased = false;
  private bloodProductTotalMl = 0;
  private dantroleneTotalMg = 0;
  private dantroleneEffectFraction = 0;
  private lastDantroleneTick: number | null = null;
  private activeCooling = false;
  /** Latent susceptibility declared by content; exposure, not the event, starts physiology. */
  private malignantHyperthermiaSusceptibility = 0;
  /** Persistent crisis drive after genuine volatile exposure. */
  private malignantHyperthermiaActivation = 0;
  private lastExposure: { agentId: string; tick: number } | null = null;
  /** Persistent mediator severity after a modeled exposure. */
  private anaphylaxisSeverity = 0;
  /** Persistent toxicity after the scenario's modeled intravascular exposure. */
  private localAnestheticToxicitySeverity = 0;
  private statusEpilepticusSeverity = 0;
  private seizureSuppressed = false;
  private seizureActivityFraction = 0;
  private lipidEmulsionTotalMl = 0;
  private lipidEmulsionBolusRemainingMl = 0;
  private lipidEmulsionInfusionMlPerMin = 0;
  private lipidEmulsionInfusionStartedAtTick: number | null = null;
  private lipidEmulsionEffectFraction = 0;
  private lastLipidEmulsionTick: number | null = null;
  /** Scripted arrest is isolated from the irreversible hypoxic-arrest guard. */
  private cardiacArrestActive = false;
  private chestCompressionsActive = false;
  private chestCompressionTicks = 0;
  private lastChestCompressionTick: number | null = null;
  private arrestEpinephrineTotalMg = 0;
  private lastArrestEpinephrineTick: number | null = null;
  private defibrillationShockCount = 0;
  private lastDefibrillationEnergyJ: number | null = null;
  private roscAtTick: number | null = null;
  /** Manual author-tool crises are transcript actions, never hidden state edits. */
  private readonly injectedCrises = new Set<string>();
  private lastInjectedCrisis: { crisisId: string; tick: number } | null = null;
  private injectedBloodLossMlPerMin = 0;
  private injectedBronchospasmSeverity = 0;
  private highSpinalSeverity = 0;
  private highSpinalFraction = 0;
  private ephedrineTotalMg = 0;
  private lastEphedrineTick: number | null = null;
  private preeclampsiaBloodPressureChecks = 0;
  private lastPreeclampsiaBloodPressure: {
    systolicMmHg: number; diastolicMmHg: number; meanArterialMmHg: number; tick: number;
  } | null = null;
  private labetalolTotalMg = 0;
  private lastLabetalolTick: number | null = null;
  private labetalolEffectFraction = 0;
  private magnesiumSulfateTotalG = 0;
  private lastMagnesiumSulfateTick: number | null = null;
  private venousAirEmbolismSeverity = 0;
  private venousAirEmbolismFraction = 0;
  private venousAirEntryControlled = false;
  private venousAirEntryControlledAtTick: number | null = null;
  private tensionPneumothoraxSeverity = 0;
  private tensionPneumothoraxFraction = 0;
  private pneumothoraxAssessedAtTick: number | null = null;
  private pneumothoraxDecompressedAtTick: number | null = null;
  private cardiacTamponadeSeverity = 0;
  private cardiacTamponadeFraction = 0;
  private tamponadeContextReviewedAtTick: number | null = null;
  private tamponadePocusReviewedAtTick: number | null = null;
  private tamponadeDefinitiveControlAtTick: number | null = null;
  private tamponadeReassessedAtTick: number | null = null;
  private emergencyAnaphylaxisPatternReviewedAtTick: number | null = null;
  private emergencyAnaphylaxisPositionedAndHelpedAtTick: number | null = null;
  private emergencyAnaphylaxisImEpinephrineAtTick: number | null = null;
  private emergencyAnaphylaxisOxygenAtTick: number | null = null;
  private emergencyAnaphylaxisCrystalloidAtTick: number | null = null;
  private emergencyAnaphylaxisReassessedAtTick: number | null = null;
  private adultAsthmaSeverityReviewedAtTick: number | null = null;
  private adultAsthmaControlledOxygenAtTick: number | null = null;
  private adultAsthmaBronchodilatorBundleAtTick: number | null = null;
  private adultAsthmaCorticosteroidIntentAtTick: number | null = null;
  private adultAsthmaReassessedAtTick: number | null = null;
  private copdSeverityReviewedAtTick: number | null = null;
  private copdControlledOxygenAtTick: number | null = null;
  private copdBronchodilatorBundleAtTick: number | null = null;
  private copdCorticosteroidIntentAtTick: number | null = null;
  private copdAntibioticIntentAtTick: number | null = null;
  private copdReassessedAtTick: number | null = null;
  private pulmonaryEdemaPatternReviewedAtTick: number | null = null;
  private pulmonaryEdemaNivAtTick: number | null = null;
  private pulmonaryEdemaDiureticIntentAtTick: number | null = null;
  private pulmonaryEdemaVasodilatorIntentAtTick: number | null = null;
  private pulmonaryEdemaReassessedAtTick: number | null = null;
  private pulmonaryEmbolismSeverityReviewedAtTick: number | null = null;
  private pulmonaryEmbolismOxygenAtTick: number | null = null;
  private pulmonaryEmbolismAnticoagulationAtTick: number | null = null;
  private pulmonaryEmbolismDeteriorationAtTick: number | null = null;
  private pulmonaryEmbolismEscalationAtTick: number | null = null;
  private stemiPatternReviewedAtTick: number | null = null;
  private stemiPathwayActivatedAtTick: number | null = null;
  private stemiAspirinAtTick: number | null = null;
  private stemiAdditionalAntithromboticsAtTick: number | null = null;
  private stemiReassessedAtTick: number | null = null;
  private unstableNarrowTachycardiaReviewedAtTick: number | null = null;
  private unstableNarrowTachycardiaPreparedAtTick: number | null = null;
  private unstableNarrowTachycardiaCardiovertedAtTick: number | null = null;
  private unstableNarrowTachycardiaReassessedAtTick: number | null = null;
  private unstableBradycardiaReviewedAtTick: number | null = null;
  private unstableBradycardiaSupportedAtTick: number | null = null;
  private unstableBradycardiaAtropineAtTick: number | null = null;
  private unstableBradycardiaReassessedAtTick: number | null = null;
  private statusEpilepticusReviewedAtTick: number | null = null;
  private statusEpilepticusSupportedAtTick: number | null = null;
  private statusEpilepticusLorazepamAtTick: number | null = null;
  private statusEpilepticusReassessedAtTick: number | null = null;
  private acuteStrokePresentationReviewedAtTick: number | null = null;
  private acuteStrokeSystemActivatedAtTick: number | null = null;
  private acuteStrokeImagingReviewedAtTick: number | null = null;
  private acuteStrokeTenecteplaseAtTick: number | null = null;
  private acuteStrokeThrombectomyActivatedAtTick: number | null = null;
  private acuteStrokeReassessedAtTick: number | null = null;
  private ichDeteriorationReviewedAtTick: number | null = null;
  private ichPathwayActivatedAtTick: number | null = null;
  private ichFindingsReviewedAtTick: number | null = null;
  private ichReversalAtTick: number | null = null;
  private ichPressureControlAtTick: number | null = null;
  private ichEscalatedAtTick: number | null = null;
  private dkaPresentationReviewedAtTick: number | null = null;
  private dkaFluidsAtTick: number | null = null;
  private dkaPotassiumAtTick: number | null = null;
  private dkaInsulinAtTick: number | null = null;
  private dkaDextroseAtTick: number | null = null;
  private dkaTransitionAtTick: number | null = null;
  private hyperkalemiaPatternReviewedAtTick: number | null = null;
  private hyperkalemiaCalciumAtTick: number | null = null;
  private hyperkalemiaPostCalciumEcgAtTick: number | null = null;
  private hyperkalemiaInsulinGlucoseAtTick: number | null = null;
  private hyperkalemiaBetaAgonistAtTick: number | null = null;
  private hyperkalemiaRemovalAtTick: number | null = null;
  private hyperkalemiaReassessedAtTick: number | null = null;
  private hyponatremiaPatternReviewedAtTick: number | null = null;
  private hyponatremiaStabilizedAtTick: number | null = null;
  private hyponatremiaHypertonicAtTick: number | null = null;
  private hyponatremiaReassessedAtTick: number | null = null;
  private hyponatremiaGuardrailsAtTick: number | null = null;
  private opioidPatternReviewedAtTick: number | null = null;
  private opioidVentilationAtTick: number | null = null;
  private opioidAntagonistAtTick: number | null = null;
  private opioidInitialReassessmentAtTick: number | null = null;
  private opioidRecurrenceReviewedAtTick: number | null = null;
  private opioidRecurrencePlanAtTick: number | null = null;
  private heatStrokePatternReviewedAtTick: number | null = null;
  private heatStrokeSupportAtTick: number | null = null;
  private heatStrokeCoolingAtTick: number | null = null;
  private heatStrokeTargetAtTick: number | null = null;
  private heatStrokeSurveillanceAtTick: number | null = null;
  private traumaActivatedAtTick: number | null = null;
  private traumaCatastrophicHemorrhageAtTick: number | null = null;
  private traumaAirwayBreathingAtTick: number | null = null;
  private traumaCirculationAtTick: number | null = null;
  private traumaDisabilityExposureAtTick: number | null = null;
  private traumaRepeatedAtTick: number | null = null;
  private aorticInitialReviewedAtTick: number | null = null;
  private aorticEvolutionReviewedAtTick: number | null = null;
  private aorticEscalatedAtTick: number | null = null;
  private aorticAntiImpulseAtTick: number | null = null;
  private aorticImagingAtTick: number | null = null;
  private aorticHandedOffAtTick: number | null = null;
  private ardsBaselineAtTick: number | null = null;
  private ardsPbwAtTick: number | null = null;
  private ardsProtectionAtTick: number | null = null;
  private ardsReassessmentAtTick: number | null = null;
  private ardsEscalationAtTick: number | null = null;
  private hypoxemiaSignalAtTick: number | null = null;
  private hypoxemiaSupportAtTick: number | null = null;
  private hypoxemiaDeliveryPathAtTick: number | null = null;
  private hypoxemiaBedsidePatternAtTick: number | null = null;
  private hypoxemiaEscalationAtTick: number | null = null;
  private dyssynchronyGraphicsAtTick: number | null = null;
  private dyssynchronyDriversAtTick: number | null = null;
  private dyssynchronyClassificationAtTick: number | null = null;
  private dyssynchronyCorrectionAtTick: number | null = null;
  private dyssynchronyReassessmentAtTick: number | null = null;
  private autoPeepFlowAtTick: number | null = null;
  private autoPeepMeasurementAtTick: number | null = null;
  private autoPeepClassificationAtTick: number | null = null;
  private autoPeepCorrectionAtTick: number | null = null;
  private autoPeepReassessmentAtTick: number | null = null;
  private mucusSupportAtTick: number | null = null;
  private mucusIndicatorsAtTick: number | null = null;
  private mucusSuctionAtTick: number | null = null;
  private mucusReassessmentAtTick: number | null = null;
  private mucusEscalationAtTick: number | null = null;
  private unplannedExtubationSupportAtTick: number | null = null;
  private unplannedExtubationAssessmentAtTick: number | null = null;
  private unplannedExtubationFailureAtTick: number | null = null;
  private unplannedExtubationAirwayPlanAtTick: number | null = null;
  private unplannedExtubationReassessmentAtTick: number | null = null;
  private sbtReadinessAtTick: number | null = null;
  private sbtStartedAtTick: number | null = null;
  private sbtFailureAtTick: number | null = null;
  private sbtRecoveryAtTick: number | null = null;
  private sbtPlanAtTick: number | null = null;
  private postIntubationPressureAtTick: number | null = null;
  private postIntubationDangerAtTick: number | null = null;
  private postIntubationMechanismAtTick: number | null = null;
  private postIntubationSupportAtTick: number | null = null;
  private postIntubationReassessmentAtTick: number | null = null;
  private cardiogenicShockRecognitionAtTick: number | null = null;
  private cardiogenicShockPhenotypeAtTick: number | null = null;
  private cardiogenicShockBridgeAtTick: number | null = null;
  private cardiogenicShockCauseControlAtTick: number | null = null;
  private cardiogenicShockReassessmentAtTick: number | null = null;
  private mixedShockRecognitionAtTick: number | null = null;
  private mixedShockHemodynamicsAtTick: number | null = null;
  private mixedShockSupportAtTick: number | null = null;
  private mixedShockCausesAtTick: number | null = null;
  private mixedShockReassessmentAtTick: number | null = null;
  private rvFailureRecognitionAtTick: number | null = null;
  private rvFailurePhenotypeAtTick: number | null = null;
  private rvFailureSupportAtTick: number | null = null;
  private rvFailureTriggersAtTick: number | null = null;
  private rvFailureReassessmentAtTick: number | null = null;
  private massivePeRecognitionAtTick: number | null = null;
  private massivePePatternAtTick: number | null = null;
  private massivePeSupportAtTick: number | null = null;
  private massivePeEcmoAtTick: number | null = null;
  private massivePeReassessmentAtTick: number | null = null;
  private upperGiHemorrhageRecognitionAtTick: number | null = null;
  private upperGiHemorrhagePatternAtTick: number | null = null;
  private upperGiHemorrhageResuscitationAtTick: number | null = null;
  private upperGiHemorrhageHemostasisAtTick: number | null = null;
  private upperGiHemorrhageReassessmentAtTick: number | null = null;
  private criticalCareStatusRecognitionAtTick: number | null = null;
  private criticalCareStatusPatternAtTick: number | null = null;
  private criticalCareStatusPathwayAtTick: number | null = null;
  private criticalCareStatusCausesAtTick: number | null = null;
  private criticalCareStatusReassessmentAtTick: number | null = null;
  private postArrestTemperatureRecognitionAtTick: number | null = null;
  private postArrestTemperatureContextAtTick: number | null = null;
  private postArrestTemperatureProtocolAtTick: number | null = null;
  private postArrestTemperatureGuardrailsAtTick: number | null = null;
  private postArrestTemperatureReassessmentAtTick: number | null = null;
  private intracranialHypertensionRecognitionAtTick: number | null = null;
  private intracranialHypertensionContextAtTick: number | null = null;
  private intracranialHypertensionProtectionAtTick: number | null = null;
  private intracranialHypertensionRescueAtTick: number | null = null;
  private intracranialHypertensionReassessmentAtTick: number | null = null;
  private akiFluidOverloadRecognitionAtTick: number | null = null;
  private akiFluidOverloadContextAtTick: number | null = null;
  private akiFluidOverloadFluidPlanAtTick: number | null = null;
  private akiFluidOverloadSupportAtTick: number | null = null;
  private akiFluidOverloadReassessmentAtTick: number | null = null;
  private severeAcidemiaRecognitionAtTick: number | null = null;
  private severeAcidemiaAnalysisAtTick: number | null = null;
  private severeAcidemiaVentilationAtTick: number | null = null;
  private severeAcidemiaCausePlanAtTick: number | null = null;
  private severeAcidemiaReassessmentAtTick: number | null = null;
  private icuHandoffReadinessAtTick: number | null = null;
  private icuHandoffContentAtTick: number | null = null;
  private icuHandoffCrossCheckAtTick: number | null = null;
  private icuHandoffEscalationAtTick: number | null = null;
  private icuHandoffAcceptanceAtTick: number | null = null;
  private ventilatorDisconnectionRecognizedAtTick: number | null = null;
  private ventilatorDisconnectionBridgedAtTick: number | null = null;
  private ventilatorDisconnectionInspectedAtTick: number | null = null;
  private ventilatorDisconnectionRestoredAtTick: number | null = null;
  private ventilatorDisconnectionReassessedAtTick: number | null = null;
  private delayedVasopressorDiscordanceAtTick: number | null = null;
  private delayedVasopressorPathAtTick: number | null = null;
  private delayedVasopressorClassifiedAtTick: number | null = null;
  private delayedVasopressorProtocolAtTick: number | null = null;
  private delayedVasopressorReassessedAtTick: number | null = null;
  private pulseOximeterDiscordanceAtTick: number | null = null;
  private pulseOximeterPlethAtTick: number | null = null;
  private pulseOximeterProbePerfusionAtTick: number | null = null;
  private pulseOximeterCorroboratedAtTick: number | null = null;
  private pulseOximeterReassessedAtTick: number | null = null;
  private tubeMigrationRecognizedAtTick: number | null = null;
  private tubeMigrationSupportedAtTick: number | null = null;
  private tubeMigrationPositionReviewedAtTick: number | null = null;
  private tubeMigrationCorrectionAtTick: number | null = null;
  private tubeMigrationReassessedAtTick: number | null = null;
  private septicResuscitationContextAtTick: number | null = null;
  private septicResuscitationPerfusionAtTick: number | null = null;
  private septicResuscitationFluidResponseAtTick: number | null = null;
  private septicResuscitationPlanAtTick: number | null = null;
  private septicResuscitationReassessedAtTick: number | null = null;
  private stableChestPainStabilityAtTick: number | null = null;
  private stableChestPainPatternAtTick: number | null = null;
  private stableChestPainLikelihoodAtTick: number | null = null;
  private stableChestPainTestingAtTick: number | null = null;
  private stableChestPainSafetyNetAtTick: number | null = null;
  private nstemiTrajectoryAtTick: number | null = null;
  private nstemiVerificationAtTick: number | null = null;
  private nstemiVeryHighRiskAtTick: number | null = null;
  private nstemiStrategyAtTick: number | null = null;
  private nstemiHandoffAtTick: number | null = null;
  private heartFailureStatusAtTick: number | null = null;
  private heartFailureResponseAtTick: number | null = null;
  private heartFailureToleranceAtTick: number | null = null;
  private heartFailureTransitionAtTick: number | null = null;
  private heartFailureReadinessAtTick: number | null = null;
  private afRvrStabilityAtTick: number | null = null;
  private afRvrContextAtTick: number | null = null;
  private afRvrRateIntentAtTick: number | null = null;
  private afRvrStrokePreventionAtTick: number | null = null;
  private afRvrReassessmentAtTick: number | null = null;
  private clinicStemiPatternAtTick: number | null = null;
  private clinicStemiDangerAtTick: number | null = null;
  private clinicStemiTransferAtTick: number | null = null;
  private clinicStemiBridgeAtTick: number | null = null;
  private clinicStemiHandoffAtTick: number | null = null;
  private postInfarctionShockTrajectoryAtTick: number | null = null;
  private postInfarctionShockCausesAtTick: number | null = null;
  private postInfarctionShockTransferAtTick: number | null = null;
  private postInfarctionShockBridgeAtTick: number | null = null;
  private postInfarctionShockHandoffAtTick: number | null = null;
  private stableNarrowStabilityAtTick: number | null = null;
  private stableNarrowContextAtTick: number | null = null;
  private stableNarrowVagalAtTick: number | null = null;
  private stableNarrowVagalResponseAtTick: number | null = null;
  private stableNarrowAdenosineAtTick: number | null = null;
  private stableNarrowReassessmentAtTick: number | null = null;
  private stableWideStabilityAtTick: number | null = null;
  private stableWideContextAtTick: number | null = null;
  private stableWideReadinessAtTick: number | null = null;
  private stableWideMedicationAtTick: number | null = null;
  private stableWideNonresponseAtTick: number | null = null;
  private stableWideCardioversionAtTick: number | null = null;
  private stableWideReassessmentAtTick: number | null = null;
  private symptomaticBradycardiaStabilityAtTick: number | null = null;
  private symptomaticBradycardiaContextAtTick: number | null = null;
  private symptomaticBradycardiaCorrelationAtTick: number | null = null;
  private symptomaticBradycardiaPacingEvaluationAtTick: number | null = null;
  private symptomaticBradycardiaHandoffAtTick: number | null = null;
  private completeHeartBlockStabilityAtTick: number | null = null;
  private completeHeartBlockContextAtTick: number | null = null;
  private completeHeartBlockPathwayAtTick: number | null = null;
  private completeHeartBlockReassessmentAtTick: number | null = null;
  private completeHeartBlockHandoffAtTick: number | null = null;
  private torsadesRecognitionAtTick: number | null = null;
  private torsadesShockIntentAtTick: number | null = null;
  private torsadesPostShockAtTick: number | null = null;
  private torsadesContextAtTick: number | null = null;
  private torsadesRecurrenceIntentAtTick: number | null = null;
  private torsadesHandoffAtTick: number | null = null;
  private hyperkalemicConductionReconciledAtTick: number | null = null;
  private hyperkalemicConductionCalciumResponseAtTick: number | null = null;
  private hyperkalemicConductionShiftSurveillanceAtTick: number | null = null;
  private hyperkalemicConductionRemovalDeviceAtTick: number | null = null;
  private hyperkalemicConductionLaterPanelAtTick: number | null = null;
  private hyperkalemicConductionHandoffAtTick: number | null = null;
  private pericardialTamponadeTrajectoryAtTick: number | null = null;
  private pericardialTamponadeDrainageResponseAtTick: number | null = null;
  private pericardialTamponadeEtiologyAtTick: number | null = null;
  private pericardialTamponadeSurveillanceAtTick: number | null = null;
  private pericardialTamponadeHandoffAtTick: number | null = null;
  private rightVentricularInfarctionReconciledAtTick: number | null = null;
  private rightVentricularInfarctionPhenotypeAtTick: number | null = null;
  private rightVentricularInfarctionReperfusionAtTick: number | null = null;
  private rightVentricularInfarctionSupportAtTick: number | null = null;
  private rightVentricularInfarctionHandoffAtTick: number | null = null;
  private hypertensiveEmergencyMeasurementAtTick: number | null = null;
  private hypertensiveEmergencyOrganInjuryAtTick: number | null = null;
  private hypertensiveEmergencyPhenotypeAtTick: number | null = null;
  private hypertensiveEmergencyReductionIntentAtTick: number | null = null;
  private hypertensiveEmergencyLaterPanelAtTick: number | null = null;
  private hypertensiveEmergencyHandoffAtTick: number | null = null;
  private pacemakerCaptureFailureRecognitionAtTick: number | null = null;
  private pacemakerCaptureFailureRescueAtTick: number | null = null;
  private pacemakerCaptureFailureDeviceSystemAtTick: number | null = null;
  private pacemakerCaptureFailureCausesAtTick: number | null = null;
  private pacemakerCaptureFailureLaterPanelAtTick: number | null = null;
  private pacemakerCaptureFailureHandoffAtTick: number | null = null;
  private transcutaneousPacingRecognitionAtTick: number | null = null;
  private transcutaneousPacingPulselessResponseAtTick: number | null = null;
  private transcutaneousPacingCausesBridgeAtTick: number | null = null;
  private transcutaneousPacingHandoffAtTick: number | null = null;
  private acuteSevereAsthmaTreatmentAtTick: number | null = null;
  private acuteSevereAsthmaFailureAtTick: number | null = null;
  private acuteSevereAsthmaEscalationAtTick: number | null = null;
  private acuteSevereAsthmaRisksAtTick: number | null = null;
  private acuteSevereAsthmaHandoffAtTick: number | null = null;
  private copdTransitionReadinessAtTick: number | null = null;
  private copdTransitionRespiratoryNeedsAtTick: number | null = null;
  private copdTransitionMedicationAtTick: number | null = null;
  private copdTransitionCoordinationAtTick: number | null = null;
  private copdTransitionHandoffAtTick: number | null = null;
  private capHypoxemiaSupportAtTick: number | null = null;
  private capHypoxemiaEvidenceAtTick: number | null = null;
  private capHypoxemiaSeverityAtTick: number | null = null;
  private capHypoxemiaTreatmentIntentAtTick: number | null = null;
  private capHypoxemiaHandoffAtTick: number | null = null;
  private postPeDyspneaTrajectoryAtTick: number | null = null;
  private postPeDyspneaSafetyAtTick: number | null = null;
  private postPeDyspneaEvidenceAtTick: number | null = null;
  private postPeDyspneaReferralAtTick: number | null = null;
  private postPeDyspneaHandoffAtTick: number | null = null;
  private apeSupportTrajectoryAtTick: number | null = null;
  private apeSupportFailureAtTick: number | null = null;
  private apeSupportWholePatientAtTick: number | null = null;
  private apeSupportEscalationAtTick: number | null = null;
  private apeSupportHandoffAtTick: number | null = null;
  private postTensionPneumothoraxTrajectoryAtTick: number | null = null;
  private postTensionPneumothoraxDrainageResponseAtTick: number | null = null;
  private postTensionPneumothoraxSystemAtTick: number | null = null;
  private postTensionPneumothoraxEtiologyAtTick: number | null = null;
  private postTensionPneumothoraxHandoffAtTick: number | null = null;
  private largePleuralEffusionTrajectoryAtTick: number | null = null;
  private largePleuralEffusionIntentAtTick: number | null = null;
  private largePleuralEffusionResponseAtTick: number | null = null;
  private largePleuralEffusionFluidAtTick: number | null = null;
  private largePleuralEffusionEvaluationAtTick: number | null = null;
  private largePleuralEffusionHandoffAtTick: number | null = null;
  private bronchiectasisMucusTrajectoryAtTick: number | null = null;
  private bronchiectasisMucusEvidenceAtTick: number | null = null;
  private bronchiectasisMucusClearanceIntentAtTick: number | null = null;
  private bronchiectasisMucusResponseAtTick: number | null = null;
  private bronchiectasisMucusEscalationAtTick: number | null = null;
  private bronchiectasisMucusHandoffAtTick: number | null = null;
  private chronicOpioidHypoventilationTrajectoryAtTick: number | null = null;
  private chronicOpioidHypoventilationEvidenceAtTick: number | null = null;
  private chronicOpioidHypoventilationAlternativesAtTick: number | null = null;
  private chronicOpioidHypoventilationPlanAtTick: number | null = null;
  private chronicOpioidHypoventilationHandoffAtTick: number | null = null;
  private neuromuscularRespiratoryFailureTrajectoryAtTick: number | null = null;
  private neuromuscularRespiratoryFailureRecognitionAtTick: number | null = null;
  private neuromuscularRespiratoryFailureEscalationAtTick: number | null = null;
  private neuromuscularRespiratoryFailureReviewAtTick: number | null = null;
  private neuromuscularRespiratoryFailureOwnershipAtTick: number | null = null;
  private neuromuscularRespiratoryFailureHandoffAtTick: number | null = null;
  private obesityHypoventilationPhenotypeAtTick: number | null = null;
  private obesityHypoventilationAwakeEvidenceAtTick: number | null = null;
  private obesityHypoventilationSleepEvidenceAtTick: number | null = null;
  private obesityHypoventilationRecognitionAtTick: number | null = null;
  private obesityHypoventilationPlanAtTick: number | null = null;
  private obesityHypoventilationHandoffAtTick: number | null = null;
  private nivSelectionTrajectoryAtTick: number | null = null;
  private nivSelectionSuitabilityAtTick: number | null = null;
  private nivSelectionAtTick: number | null = null;
  private nivSelectionResponseAtTick: number | null = null;
  private nivSelectionFailureGuardsAtTick: number | null = null;
  private nivSelectionHandoffAtTick: number | null = null;
  private nivSelectionLastUnsupportedChoice: 'cpap' | 'high-flow' | null = null;
  private aspirationRiskCuesReviewedAtTick: number | null = null;
  private aspirationRiskClassification: 'elevated' | 'routine' | null = null;
  private aspirationRiskClassifiedAtTick: number | null = null;
  private aspirationRiskPlan: 'defer-and-replan' | 'proceed-routine' | null = null;
  private aspirationRiskPlanAtTick: number | null = null;
  private emergenceMonitorReviewedAtTick: number | null = null;
  private emergenceBlockClassification: 'residual' | 'recovered' | null = null;
  private emergenceBlockClassifiedAtTick: number | null = null;
  private emergencePlan: 'defer-extubation-and-support' | 'proceed-to-extubation' | null = null;
  private emergencePlanAtTick: number | null = null;
  private delayedEmergenceSupportReviewedAtTick: number | null = null;
  private delayedEmergenceExposureReviewedAtTick: number | null = null;
  private delayedEmergenceMetabolicReviewedAtTick: number | null = null;
  private delayedEmergenceNeurologicExamAtTick: number | null = null;
  private delayedEmergenceEscalation: 'urgent-neurologic-evaluation' | 'continue-routine-recovery' | null = null;
  private delayedEmergenceEscalatedAtTick: number | null = null;
  private extubationQuantitativeRecoveryReviewedAtTick: number | null = null;
  private extubationAwakeAirwayReviewedAtTick: number | null = null;
  private extubationGasExchangeReviewedAtTick: number | null = null;
  private extubationAirwayPlanReviewedAtTick: number | null = null;
  private extubationReadinessDecision: 'ready-for-planned-awake-extubation'
    | 'continue-support-and-reassess' | null = null;
  private extubationReadinessDecidedAtTick: number | null = null;
  /** Static starting snapshot for the bounded emergence decision vignette. */
  private readonly configuredResidualRocuroniumCe: number;
  /** Bounded teaching opposition to the current rocuronium effect-site concentration. */
  private neuromuscularReversalFraction = 0;
  private postTetanicCount = 0;
  private lastNeuromuscularReversal: {
    agent: 'sugammadex' | 'neostigmine'; doseMgPerKg: number | null; tick: number;
  } | null = null;
  /** A learner fluid bolus waiting to reach the circulation on the next tick. */
  private pendingCrystalloidMl = 0;
  private pendingPackedRedCellUnits = 0;
  private pendingPackedRedCellVolumeMl = 0;
  private pendingPackedRedCellHemoglobinG = 0;
  private pendingFreshFrozenPlasmaVolumeMl = 0;
  /** Physical delivery state, intentionally separate from the pump's commanded rate. */
  private hypnoticLineConnected = true;
  /** Whether the learner has deliberately inspected the line since its last failure. */
  private hypnoticLineInspected = false;
  /** Persistent functional closure set by the scenario, 0 fully patent to 1 fully closed. */
  private upperAirwayClosureFraction = 0;
  private postExtubationObstructionSeverity = 0;
  private opioidVentilatoryImpairmentSeverity = 0;
  private opioidVentilatoryImpairmentTarget = 0;
  private furtherOpioidHeldAtTick: number | null = null;
  private naloxoneIntentAtTick: number | null = null;
  private perioperativeTemperatureTargetC: number | null = null;
  private coreTemperatureConfirmedAtTick: number | null = null;
  private forcedAirWarmingAtTick: number | null = null;
  private warmedBulkFluidsAtTick: number | null = null;
  private hyperglycemicGlucoseMgPerDl: number | null = null;
  private pointOfCareGlucoseConfirmedAtTick: number | null = null;
  private insulinProtocolIntentAtTick: number | null = null;
  private repeatPointOfCareAtTick: number | null = null;
  private repeatPointOfCareGlucoseMgPerDl: number | null = null;
  private ciedDeviceRecordReviewedAtTick: number | null = null;
  private ciedProcedureRiskReviewedAtTick: number | null = null;
  private ciedPlan: 'coordinate-asynchronous-pacing' | 'apply-unverified-magnet'
    | 'proceed-no-change' | null = null;
  private ciedPlanAtTick: number | null = null;
  private ciedBackupAndRestorationDocumentedAtTick: number | null = null;
  private postoperativeReceiverReadyAtTick: number | null = null;
  private postoperativePatientAndCourseAtTick: number | null = null;
  private postoperativeCurrentStateAtTick: number | null = null;
  private postoperativeRisksActionsOwnershipAtTick: number | null = null;
  private postoperativeReceiverReadbackAtTick: number | null = null;
  private postoperativeTransferAcceptedAtTick: number | null = null;
  private undifferentiatedShockActive = false;
  private shockPerfusionReviewedAtTick: number | null = null;
  private shockLactateReviewedAtTick: number | null = null;
  private shockFocusedEchoReviewedAtTick: number | null = null;
  private shockPassiveLegRaiseAtTick: number | null = null;
  private shockFluidChallengeAtTick: number | null = null;
  private shockPerfusionReassessedAtTick: number | null = null;
  private shockEscalationAtTick: number | null = null;
  private septicShockActive = false;
  private sepsisInfectionAndOrganDysfunctionReviewedAtTick: number | null = null;
  private sepsisCulturesAndLactateAtTick: number | null = null;
  private sepsisAntimicrobialIntentAtTick: number | null = null;
  private sepsisInitialCrystalloidAtTick: number | null = null;
  private sepsisPostFluidReassessmentAtTick: number | null = null;
  private sepsisNorepinephrineIntentAtTick: number | null = null;
  private sepsisSourceControlEscalationAtTick: number | null = null;
  private hemorrhagicShockActive = false;
  private traumaMechanismAndPerfusionReviewedAtTick: number | null = null;
  private traumaPelvicStabilizationAtTick: number | null = null;
  private traumaMajorHemorrhageActivatedAtTick: number | null = null;
  private traumaRedCellsAtTick: number | null = null;
  private traumaCoagulationAndTemperatureAtTick: number | null = null;
  private traumaReassessedAtTick: number | null = null;
  private traumaDefinitiveControlEscalatedAtTick: number | null = null;
  /** Exclusive tick at which the bounded held airway maneuver ends. */
  private jawThrustCpapUntilTick = 0;
  /** Current lower-airway obstruction, retained for truthful equipment/accessibility output. */
  private bronchospasmSeverity = 0;
  private bronchodilatorEffectFraction = 0;
  private salbutamolTotalMg = 0;
  private lastSalbutamolTick: number | null = null;
  private preoxygenationTicks = 0;
  private lastEffectSitePeak = new Map<string, number>();

  constructor(options: EngineOptions) {
    this.scenario = options.scenario;
    this.practiceRegion = options.practiceRegion;
    this.seed = options.seed;
    this.rng = createRng(options.seed, 'session');
    this.configuredResidualRocuroniumCe = options.scenario.equipment.startingTrainOfFourRatio === undefined
      ? 0
      : rocuroniumEffectSiteForTrainOfFourRatio(
        options.scenario.equipment.startingTrainOfFourRatio,
      );

    const p = options.scenario.patient;
    this.covariates = {
      ageYears: p.ageYears, weightKg: p.weightKg, heightCm: p.heightCm, sex: p.sex,
      opioidsCoadministered: true,
    };

    const profile: PatientProfile = {
      hemodynamics: {
        baselineHeartRateBpm: p.baseline.heartRateBpm,
        baselineMapMmHg: p.baseline.meanArterialMmHg,
        baselineStrokeVolumeMl: p.baseline.strokeVolumeMl,
        arterialStiffness: p.baseline.arterialStiffness,
        fixedStrokeVolume: p.baseline.fixedStrokeVolume,
        baroreflexGain: p.baseline.baroreflexGain,
        bloodVolumeMl: p.baseline.bloodVolumeMl,
        hemoglobinGPerDl: p.baseline.hemoglobinGPerDl,
      },
      respiratory: p.respiratory.profile === 'healthy-child'
        ? healthyChildRespiratoryProfile(p.ageYears, p.weightKg)
        : RESPIRATORY_PROFILES[p.respiratory.profile],
      airway: { difficulty: p.airway.difficulty, difficultMaskVentilation: p.airway.difficultMaskVentilation },
      coreTemperatureC: p.baseline.coreTemperatureC,
      ageYears: p.ageYears,
      initialCoagulationFactorFraction: p.baseline.coagulationFactorFraction,
      initialFibrinogenGPerL: p.baseline.fibrinogenGPerL,
    };
    this.patient = new VirtualPatient(
      profile,
      this.rng.fork('patient'),
      options.scenario.equipment.ventilator.fio2,
      options.scenario.equipment.ventilator.sevofluranePercent ?? 0,
    );
    if (options.scenario.equipment.airwayDevice === 'tracheal-tube') {
      this.patient.airway.intubated = true;
    }
    this.waveforms = new WaveformEngine({ seed: options.seed, tickSeconds: 0.1 });

    const v = options.scenario.equipment.ventilator;
    this.ventilator = {
      mode: v.mode, tidalVolumeMl: v.tidalVolumeMl, respiratoryRateBpm: v.respiratoryRateBpm,
      fio2: v.fio2, freshGasFlowLPerMin: v.freshGasFlowLPerMin ?? 1,
      peep: 0, delivering: v.delivering, sevofluranePercent: v.sevofluranePercent ?? 0,
    };

    for (const entry of options.scenario.formulary) {
      const selection = entry.modelId !== undefined
        ? { model: getModel(entry.modelId), reason: 'Named by the scenario.' }
        : selectDefaultModel(entry.drugId, this.covariates);
      const parameters = parametersFor(selection.model, this.covariates);
      this.drugs.set(entry.drugId, {
        drugId: entry.drugId,
        model: selection.model,
        solver: new CompartmentSolver(parameters, STEP_MINUTES),
        infusionRate: 0,
        infusionSinceTick: null,
        syringeRemainingMl: entry.syringeVolumeMl,
        concentration: entry.concentration,
        typicalDose: entry.typicalDose,
        selectionReason: selection.reason,
        deliveryModes: entry.deliveryModes ?? ['bolus', 'infusion'],
      });
      // The choice and its reason are recorded in the transcript.
      this.pendingEvents.push({
        tick: 0, severity: 'info', category: 'model',
        eventId: `model-${entry.drugId}`,
        message: `${entry.drugId}: ${selection.model.id}. ${selection.reason}`,
        data: { drugId: entry.drugId, modelId: selection.model.id },
      });
    }

    // Predicates are parsed once, here, so a scenario with a malformed one says
    // so at load rather than never firing the event and never saying why.
    for (const event of this.scenario.timeline) {
      if (event.when === undefined) continue;
      try {
        this.predicates.set(event.id, parsePredicate(event.when));
      } catch (error) {
        this.log('warning', 'scenario', `bad-predicate-${event.id}`,
          `Timeline event "${event.id}" has a condition this engine cannot read, so it will never `
          + `fire: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  get tick(): number { return this.currentTick; }
  get modelSetRevision(): string { return MODEL_SET_REVISION; }

  /** The drugs available, for the syringe tray. */
  formulary(): ActiveDrug[] {
    return [...this.drugs.values()];
  }

  /** Envelope evaluation for a drug's active model, for the confidence label. */
  confidenceFor(drugId: string) {
    const drug = this.drugs.get(drugId);
    if (!drug) throw new Error(`Drug not in this scenario's formulary: ${drugId}`);
    return evaluateEnvelope(drug.model, this.covariates);
  }

  /** Apply a learner action at the current tick. */
  /**
   * A finite, non-negative number from an action payload, or null.
   *
   * Action payloads come from a control a learner typed into, a URL, or a
   * transcript file — none of which this engine controls. A NaN dose used to
   * propagate straight into the compartment solver and come out the far side as
   * a patient with a mean arterial pressure of zero: a corpse that looked like
   * physiology rather than like the bad input it was.
   */
  private static finiteAmount(value: unknown): number | null {
    const amount = Number(value);
    return Number.isFinite(amount) && amount >= 0 ? amount : null;
  }

  apply(action: LearnerAction): void {
    const hypertensiveEmergency = this.scenario.timeline.some((event) =>
      event.type === 'narrative' && event.target === 'hypertensive-emergency-reassessment');
    if (hypertensiveEmergency && HYPERTENSIVE_EMERGENCY_BLOCKED_ACTION_TYPES.has(action.type)) {
      this.log('warning', 'assessment', `hypertensive-emergency-generic-action-refused-${this.currentTick}`,
        'This intent-only hypertensive-emergency lesson does not expose generic treatment, procedure, device, rhythm, artifact, or crisis-injection actions. Nothing changed.',
        { actionType: action.type });
      return;
    }
    const pacemakerCaptureFailure = this.scenario.timeline.some((event) =>
      event.type === 'narrative' && event.target === 'pacemaker-capture-failure-reassessment');
    if (pacemakerCaptureFailure && PACEMAKER_CAPTURE_FAILURE_BLOCKED_ACTION_TYPES.has(action.type)) {
      this.log('warning', 'assessment', `pacemaker-capture-failure-generic-action-refused-${this.currentTick}`,
        'This review-only pacemaker-capture-failure lesson does not expose generic treatment, pacing, device, procedure, rhythm, artifact, or crisis-injection actions. Nothing changed.',
        { actionType: action.type });
      return;
    }
    const transcutaneousPacingCapture = this.scenario.timeline.some((event) =>
      event.type === 'narrative'
        && event.target === 'transcutaneous-pacing-mechanical-capture-reassessment');
    if (transcutaneousPacingCapture
      && TRANSCUTANEOUS_PACING_CAPTURE_BLOCKED_ACTION_TYPES.has(action.type)) {
      this.log('warning', 'assessment', `transcutaneous-pacing-generic-action-refused-${this.currentTick}`,
        'This review-only transcutaneous-pacing lesson does not expose generic treatment, pacing, procedure, rhythm, artifact, or crisis-injection actions. Nothing changed.',
        { actionType: action.type });
      return;
    }
    const acuteSevereAsthma = this.scenario.timeline.some((event) =>
      event.type === 'narrative' && event.target === 'acute-severe-asthma-reassessment');
    if (acuteSevereAsthma && ACUTE_SEVERE_ASTHMA_BLOCKED_ACTION_TYPES.has(action.type)) {
      this.log('warning', 'assessment', `acute-severe-asthma-generic-action-refused-${this.currentTick}`,
        'This reassessment-only asthma lesson does not expose generic medication, oxygen, airway, ventilator, procedure, rhythm, artifact, or crisis-injection actions. Nothing changed.',
        { actionType: action.type });
      return;
    }
    const copdTransition = this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'copd-exacerbation-transition-reassessment');
    if (copdTransition && COPD_TRANSITION_BLOCKED_ACTION_TYPES.has(action.type)) {
      this.log('warning', 'assessment', `copd-transition-generic-action-refused-${this.currentTick}`,
        'This transition-review lesson does not expose generic testing, treatment, oxygen, airway, ventilator, procedure, rhythm, artifact, or crisis-injection actions. Nothing changed.',
        { actionType: action.type });
      return;
    }
    const capHypoxemia = this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'community-acquired-pneumonia-hypoxemia-reassessment');
    if (capHypoxemia && CAP_HYPOXEMIA_BLOCKED_ACTION_TYPES.has(action.type)) {
      this.log('warning', 'assessment', `cap-hypoxemia-generic-action-refused-${this.currentTick}`,
        'This reassessment-only pneumonia lesson does not expose generic testing, treatment, oxygen, airway, ventilator, procedure, rhythm, artifact, or crisis-injection actions. Nothing changed.',
        { actionType: action.type });
      return;
    }
    const postPeDyspnea = this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'post-pulmonary-embolism-persistent-dyspnea-reassessment');
    if (postPeDyspnea && POST_PE_DYSPNEA_BLOCKED_ACTION_TYPES.has(action.type)) {
      this.log('warning', 'assessment', `post-pe-dyspnea-generic-action-refused-${this.currentTick}`,
        'This reassessment-only post-PE lesson does not expose generic testing, treatment, oxygen, airway, ventilator, procedure, rhythm, artifact, or crisis-injection actions. Nothing changed.',
        { actionType: action.type });
      return;
    }
    const apeSupport = this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'acute-pulmonary-edema-respiratory-support-reassessment');
    if (apeSupport && APE_SUPPORT_BLOCKED_ACTION_TYPES.has(action.type)) {
      this.log('warning', 'assessment', `ape-support-generic-action-refused-${this.currentTick}`,
        'This reassessment-only pulmonary edema lesson does not expose generic testing, treatment, oxygen, airway, ventilator, procedure, rhythm, artifact, or crisis-injection actions. Nothing changed.',
        { actionType: action.type });
      return;
    }
    const postTensionPneumothorax = this.scenario.timeline.some((event) =>
      event.type === 'narrative'
        && event.target === 'spontaneous-tension-pneumothorax-post-drainage-reassessment');
    if (postTensionPneumothorax
      && POST_TENSION_PNEUMOTHORAX_BLOCKED_ACTION_TYPES.has(action.type)) {
      this.log('warning', 'assessment', `post-tension-pneumothorax-generic-action-refused-${this.currentTick}`,
        'This review-only post-drainage lesson does not expose generic testing, treatment, oxygen, airway, ventilator, pleural procedure, rhythm, artifact, or crisis-injection actions. Nothing changed.',
        { actionType: action.type });
      return;
    }
    const largePleuralEffusion = this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'large-unilateral-pleural-effusion-reassessment');
    if (largePleuralEffusion && LARGE_PLEURAL_EFFUSION_BLOCKED_ACTION_TYPES.has(action.type)) {
      this.log('warning', 'assessment', `large-pleural-effusion-generic-action-refused-${this.currentTick}`,
        'This review-only pleural-effusion lesson does not expose generic testing, treatment, oxygen, airway, ventilator, pleural procedure, rhythm, artifact, or crisis-injection actions. Nothing changed.',
        { actionType: action.type });
      return;
    }
    const bronchiectasisMucus = this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'bronchiectasis-mucus-plugging-reassessment');
    if (bronchiectasisMucus && BRONCHIECTASIS_MUCUS_BLOCKED_ACTION_TYPES.has(action.type)) {
      this.log('warning', 'assessment', `bronchiectasis-mucus-generic-action-refused-${this.currentTick}`,
        'This review-only bronchiectasis lesson does not expose generic testing, oxygen, medication, airway-clearance, suction, airway, ventilator, rhythm, artifact, procedure, or crisis actions. Nothing changed.',
        { actionType: action.type });
      return;
    }
    const chronicOpioidHypoventilation = this.scenario.timeline.some((event) =>
      event.type === 'narrative'
        && event.target === 'chronic-opioid-related-hypoventilation-reassessment');
    if (chronicOpioidHypoventilation
      && CHRONIC_OPIOID_HYPOVENTILATION_BLOCKED_ACTION_TYPES.has(action.type)) {
      this.log('warning', 'assessment',
        `chronic-opioid-hypoventilation-generic-action-refused-${this.currentTick}`,
        'This longitudinal sleep-breathing lesson does not expose generic testing, opioid or naloxone actions, oxygen, positive-pressure support, airway, ventilator, procedure, rhythm, artifact, or crisis actions. Nothing changed.',
        { actionType: action.type });
      return;
    }
    const neuromuscularRespiratoryFailure = this.scenario.timeline.some((event) =>
      event.type === 'narrative'
        && event.target === 'neuromuscular-respiratory-failure-reassessment');
    if (neuromuscularRespiratoryFailure
      && NEUROMUSCULAR_RESPIRATORY_FAILURE_BLOCKED_ACTION_TYPES.has(action.type)) {
      this.log('warning', 'assessment',
        `neuromuscular-respiratory-failure-generic-action-refused-${this.currentTick}`,
        'This reassessment-only neuromuscular lesson does not expose generic testing, neuromuscular-reversal, medication, oxygen, airway-clearance, suction, airway, ventilator, procedure, rhythm, artifact, opioid, or crisis actions. Nothing changed.',
        { actionType: action.type });
      return;
    }
    const obesityHypoventilation = this.scenario.timeline.some((event) =>
      event.type === 'narrative' && event.target === 'obesity-hypoventilation-reassessment');
    if (obesityHypoventilation && OBESITY_HYPOVENTILATION_BLOCKED_ACTION_TYPES.has(action.type)) {
      this.log('warning', 'assessment', `obesity-hypoventilation-generic-action-refused-${this.currentTick}`,
        'This stable reassessment does not expose generic testing, medication, oxygen, PAP, airway, ventilator, procedure, rhythm, artifact, opioid, or crisis actions. Nothing changed.',
        { actionType: action.type });
      return;
    }
    const nivSelection = this.scenario.timeline.some((event) =>
      event.type === 'narrative' && event.target === 'noninvasive-ventilation-selection');
    if (nivSelection && NONINVASIVE_VENTILATION_SELECTION_BLOCKED_ACTION_TYPES.has(action.type)) {
      this.log('warning', 'assessment', `noninvasive-ventilation-selection-generic-action-refused-${this.currentTick}`,
        'This selection lesson does not expose generic medication, oxygen, mask, airway, ventilator, procedure, rhythm, artifact, or adjacent-crisis actions. Nothing changed.',
        { actionType: action.type });
      return;
    }
    switch (action.type) {
      case 'bolus': {
        const amount = AnesthesiaEngine.finiteAmount(action.payload.amount);
        if (amount === null) {
          this.log('warning', 'drug', `bad-dose-${this.currentTick}`,
            `A dose of "${String(action.payload.amount)}" is not a number of `
            + `${String(action.payload.unit ?? 'units')}. Nothing was given.`);
          break;
        }
        this.giveBolus(String(action.payload.drugId), amount, String(action.payload.unit ?? ''));
        break;
      }
      case 'infusion': {
        const rate = AnesthesiaEngine.finiteAmount(action.payload.rate);
        if (rate === null) {
          this.log('warning', 'drug', `bad-rate-${this.currentTick}`,
            `An infusion rate of "${String(action.payload.rate)}" is not a number. `
            + 'The rate was left where it was.');
          break;
        }
        this.setInfusion(String(action.payload.drugId), rate, String(action.payload.unit ?? ''));
        break;
      }
      case 'ventilator': {
        // Only the settings that are actually usable are taken. A ventilator
        // does not accept a respiratory rate of NaN and neither does this.
        const payload = action.payload as Record<string, unknown>;
        const settings: { -readonly [K in keyof VentilatorSettings]?: VentilatorSettings[K] } = {};
        for (const [field, bound] of Object.entries(VENTILATOR_BOUNDS)) {
          if (!(field in payload)) continue;
          const value = AnesthesiaEngine.finiteAmount(payload[field]);
          if (value === null) {
            this.log('warning', 'ventilator', `bad-${field}-${this.currentTick}`,
              `"${String(payload[field])}" is not a usable ${field}. That setting was ignored.`);
            continue;
          }
          // Clamped to what the machine can actually deliver rather than merely
          // to a finite number: a respiratory rate of a million is arithmetic,
          // not ventilation, and no anaesthesia machine would accept it.
          const floor = bound.guardedBelow ? 0 : bound.min;
          const clamped = clamp(value, floor, bound.max);
          if (clamped !== value) {
            this.log('warning', 'ventilator', `clamped-${field}-${this.currentTick}`,
              `${field} of ${value} is outside what the machine delivers `
              + `(${bound.min} to ${bound.max}). It was set to ${clamped}.`);
          }
          (settings as Record<string, number>)[field] = clamped;
        }
        if (typeof payload.delivering === 'boolean') settings.delivering = payload.delivering;
        if (payload.mode === 'volume-control' || payload.mode === 'pressure-control' || payload.mode === 'manual') {
          settings.mode = payload.mode;
        }
        this.setVentilator(settings);
        break;
      }
      case 'call-for-help': {
        const context = action.payload.context;
        const supported = context === 'airway' || context === 'high-spinal'
          || context === 'venous-air-embolism' || context === 'bronchospasm'
          || context === 'tension-pneumothorax';
        const inactivePneumothorax = context === 'tension-pneumothorax'
          && this.tensionPneumothoraxSeverity <= 0
          && this.tensionPneumothoraxFraction <= 0.05;
        if (!supported || inactivePneumothorax || this.helpRequestedAtTick !== null) {
          this.log('warning', 'airway', `airway-help-refused-${this.currentTick}`,
            !supported
              ? 'Help requires a supported airway or modeled crisis context. No request was recorded.'
              : inactivePneumothorax
                ? 'No active modeled pleural event is available for this help request.'
              : 'Help has already been requested. No duplicate request was recorded.');
          break;
        }
        this.helpRequestedAtTick = this.currentTick;
        this.log('warning', 'airway', `airway-help-requested-${this.currentTick}`,
          context === 'high-spinal'
            ? 'High-spinal help requested. Team arrival, communication, and provider actions are not modeled.'
            : context === 'venous-air-embolism'
              ? 'Help requested for the abrupt cardiopulmonary change. Team arrival, communication, and provider actions are not modeled.'
              : context === 'tension-pneumothorax'
                ? 'Help requested for the combined breathing and circulation change. Team arrival, examination, and provider actions are not modeled.'
              : context === 'bronchospasm'
                ? 'Help requested for the lower-airway obstruction pattern. Team arrival, examination, and provider actions are not modeled.'
                : 'Additional airway help requested. Team arrival and provider skill are not modeled.',
          { context });
        break;
      }
      case 'airway-device': {
        const unavailable = this.difficultAirwayMaskFraction === null
          || action.payload.device !== 'supraglottic-airway'
          || this.patient.airway.intubated
          || this.patient.airway.supraglotticAirwayPlaced
          || this.pendingLaryngoscopy !== null
          || this.pendingSupraglotticInsertion !== null;
        if (unavailable) {
          this.log('warning', 'airway', `sga-insertion-refused-${this.currentTick}`,
            'A rescue supraglottic airway could not be started: it must be configured for this '
            + 'scenario, named exactly, and no airway device or procedure may already be in place.');
          break;
        }
        this.pendingSupraglotticInsertion = {
          completesAtTick: this.currentTick + SGA_INSERTION_SECONDS * TICKS_PER_SECOND,
        };
        // Placement interrupts the commanded breaths as well as their physical
        // delivery. Completion never restarts them behind the learner's back;
        // ventilation must be explicitly resumed and then confirmed from gas
        // exchange.
        this.setVentilator({ delivering: false });
        this.log('warning', 'airway', `sga-insertion-start-${this.currentTick}`,
          `Supraglottic-airway insertion started. Assisted ventilation is interrupted for the `
          + `${SGA_INSERTION_SECONDS}-second modeled insertion.`, {
          device: 'supraglottic-airway', durationSeconds: SGA_INSERTION_SECONDS,
        });
        break;
      }
      case 'laryngoscopy': {
        if (this.patient.airway.intubated || this.patient.airway.supraglotticAirwayPlaced
          || this.pendingLaryngoscopy || this.pendingSupraglotticInsertion) {
          this.log('warning', 'airway', `laryngoscopy-refused-${this.currentTick}`,
            this.patient.airway.intubated
              ? 'The tracheal tube is already in place. No new attempt was started.'
              : this.patient.airway.supraglotticAirwayPlaced
                ? 'A supraglottic airway is in place. Removal or intubation through it is not modeled.'
                : 'An airway procedure is already in progress. No overlapping attempt was started.');
          break;
        }
        const technique = action.payload.technique === 'video' ? 'video' : 'direct';
        const sampled = this.patient.beginLaryngoscopy(technique);
        const configuredFailure = this.difficultAirwayMaskFraction !== null;
        const result: LaryngoscopyResult = configuredFailure ? {
          ...sampled,
          intubated: false,
          narrative: `Cormack-Lehane grade ${sampled.grade} view; intubation unsuccessful on `
            + `attempt ${this.patient.airway.attempts} in the configured difficult-airway course.`,
        } : sampled;
        this.pendingLaryngoscopy = {
          result,
          completesAtTick: this.currentTick + result.durationSeconds * TICKS_PER_SECOND,
          configuredFailure,
        };
        this.log('warning', 'airway', `laryngoscopy-start-${this.patient.airway.attempts}`,
          `${technique === 'video' ? 'Video' : 'Direct'} laryngoscopy started. `
          + `The patient will be unventilated for the modelled ${result.durationSeconds}-second attempt.`, {
          attempt: this.patient.airway.attempts, technique, durationSeconds: result.durationSeconds,
        });
        break;
      }
      case 'vasopressor': {
        const effect = AnesthesiaEngine.finiteAmount(action.payload.effect ?? 0.4);
        if (effect === null) {
          this.log('warning', 'drug', `bad-vasopressor-${this.currentTick}`,
            `A vasopressor effect of "${String(action.payload.effect)}" is not usable. Nothing was given.`);
          break;
        }
        this.vasopressorEffect = Math.min(this.vasopressorEffect + effect, 1);
        this.log('info', 'drug', `vasopressor-${this.currentTick}`,
          'Vasopressor given. Response from an Open Sim Lab teaching model, not a published population model.');
        break;
      }
      case 'ephedrine': {
        const doseMg = AnesthesiaEngine.finiteAmount(action.payload.doseMg);
        const active = this.highSpinalSeverity > 0 || this.highSpinalFraction > 0.01;
        if (action.payload.route !== 'iv' || doseMg === null
          || ![6, 12].includes(doseMg) || this.ephedrineTotalMg + doseMg > 30 || !active) {
          this.log('warning', 'drug', `bad-ephedrine-${this.currentTick}`,
            !active
              ? 'The bounded ephedrine action is available only after the modeled high-spinal event.'
              : 'Ephedrine requires a listed 6 or 12 mg IV bolus and no more than 30 mg cumulatively in this teaching case. Nothing was given.');
          break;
        }
        this.ephedrineTotalMg += doseMg;
        this.lastEphedrineTick = this.currentTick;
        this.vasopressorEffect = clamp(this.vasopressorEffect + doseMg / 12, 0, 1);
        this.log('warning', 'drug', `ephedrine-iv-${this.currentTick}`,
          `Ephedrine ${doseMg} mg IV given. The pressure response is a bounded teaching effect, not an individual prediction.`, {
            drugId: 'ephedrine', route: 'iv', doseMg,
            cumulativeDoseMg: this.ephedrineTotalMg, teachingModel: true,
          });
        break;
      }
      case 'preeclampsia-response': {
        const supported = this.scenario.timeline.some(
          (event) => event.type === 'narrative' && event.target === 'persistent-severe-preeclampsia',
        );
        const response = action.payload.action;
        if (!supported || ![
          'repeat-blood-pressure', 'labetalol-20mg-iv', 'magnesium-sulfate-4g-iv',
        ].includes(String(response))) {
          this.log('warning', 'drug', `preeclampsia-response-refused-${this.currentTick}`,
            supported
              ? 'The maternal-response action was not one of the three listed actions. No state changed.'
              : 'The bounded maternal-response actions are available only in the declared severe-preeclampsia lesson.');
          break;
        }
        const observed = Object.keys(this.lastState).length > 0
          ? this.lastState : this.patient.snapshot();
        if (response === 'repeat-blood-pressure') {
          const reading = {
            systolicMmHg: Number(observed.systolicMmHg),
            diastolicMmHg: Number(observed.diastolicMmHg),
            meanArterialMmHg: Number(observed.meanArterialMmHg),
            tick: this.currentTick,
          };
          this.preeclampsiaBloodPressureChecks += 1;
          this.lastPreeclampsiaBloodPressure = reading;
          this.log('warning', 'monitor', `preeclampsia-blood-pressure-${this.currentTick}`,
            `Repeat blood pressure: ${reading.systolicMmHg.toFixed(0)}/${reading.diastolicMmHg.toFixed(0)} mmHg (mean ${reading.meanArterialMmHg.toFixed(0)}).`, {
              ...reading, checkNumber: this.preeclampsiaBloodPressureChecks,
              afterLabetalol: this.labetalolTotalMg > 0,
            });
          break;
        }
        if (this.preeclampsiaBloodPressureChecks === 0) {
          this.log('warning', 'drug', `preeclampsia-treatment-before-confirmation-${this.currentTick}`,
            'Repeat the blood pressure to confirm the declared persistent severe-range pattern before using this bounded treatment branch. Nothing was given.');
          break;
        }
        if (response === 'labetalol-20mg-iv') {
          if (this.labetalolTotalMg > 0) {
            this.log('warning', 'drug', `labetalol-refused-${this.currentTick}`,
              'The one-dose labetalol teaching branch has already been used. Escalation and alternative agents are outside this lesson.');
            break;
          }
          this.labetalolTotalMg = 20;
          this.lastLabetalolTick = this.currentTick;
          this.log('warning', 'drug', `labetalol-iv-${this.currentTick}`,
            'Labetalol 20 mg IV given. Pressure now follows a bounded teaching response, not individual pharmacokinetics or a predicted patient result.', {
              drugId: 'labetalol', route: 'iv', doseMg: 20, teachingModel: true,
            });
          break;
        }
        if (this.magnesiumSulfateTotalG > 0) {
          this.log('warning', 'drug', `magnesium-sulfate-refused-${this.currentTick}`,
            'The one-dose magnesium-sulfate teaching branch has already been used. Maintenance, renal adjustment, serum levels, and toxicity treatment are outside this lesson.');
          break;
        }
        this.magnesiumSulfateTotalG = 4;
        this.lastMagnesiumSulfateTick = this.currentTick;
        this.log('warning', 'drug', `magnesium-sulfate-iv-${this.currentTick}`,
          'Magnesium sulfate 4 g IV loading dose started for seizure prophylaxis. It does not lower pressure in this model and is not an antihypertensive.', {
            drugId: 'magnesium-sulfate', route: 'iv', doseG: 4,
            indication: 'seizure-prophylaxis', antihypertensive: false,
          });
        break;
      }
      case 'control-venous-air-entry': {
        const active = this.venousAirEmbolismSeverity > 0 || this.venousAirEmbolismFraction > 0.05;
        if (action.payload.method !== 'stop-entry' || !active || this.venousAirEntryControlled) {
          this.log('warning', 'crisis', `venous-air-entry-control-refused-${this.currentTick}`,
            !active
              ? 'No active modeled venous-air-entry event is available for this bounded action.'
              : this.venousAirEntryControlled
                ? 'Further modeled air entry has already been stopped.'
                : 'The bounded source-control action requires the listed stop-entry method. No state changed.');
          break;
        }
        this.venousAirEntryControlled = true;
        this.venousAirEntryControlledAtTick = this.currentTick;
        this.venousAirEmbolismSeverity = 0;
        this.log('critical', 'crisis', `venous-air-entry-controlled-${this.currentTick}`,
          'Intent to stop further venous air entry accepted. The residual monitor pattern now clears on a bounded teaching trajectory; finding or physically controlling a source is not simulated.', {
            method: 'stop-entry', teachingModel: true,
          });
        break;
      }
      case 'pneumothorax-response': {
        const response = action.payload.action;
        const active = this.tensionPneumothoraxSeverity > 0
          || this.tensionPneumothoraxFraction > 0.05;
        if (!active || !['assess-bilateral-ventilation', 'decompress-left-chest']
          .includes(String(response))) {
          this.log('warning', 'crisis', `pneumothorax-response-refused-${this.currentTick}`,
            !active
              ? 'No active modeled pleural event is available for this bounded response.'
              : 'The pleural-response action was not one of the listed actions. No state changed.');
          break;
        }
        if (response === 'assess-bilateral-ventilation') {
          if (this.pneumothoraxAssessedAtTick !== null) {
            this.log('warning', 'crisis', `pneumothorax-assessment-refused-${this.currentTick}`,
              'Bilateral ventilation has already been assessed. No duplicate assessment was recorded.');
            break;
          }
          this.pneumothoraxAssessedAtTick = this.currentTick;
          const hasTrachealTube = this.patient.airway.intubated;
          this.log('critical', 'crisis', `pneumothorax-assessed-${this.currentTick}`,
            `Bilateral check: left chest movement and air entry are markedly reduced; right air entry is present. ${hasTrachealTube ? 'The tracheal tube remains at its documented depth.' : 'No tracheal tube is present in this fixed vignette.'} This finding supports, but does not by itself prove, the suspected pleural cause.`, {
              side: 'left', leftAirEntry: 'markedly-reduced', rightAirEntry: 'present',
              tubeDepthUnchanged: hasTrachealTube,
            });
          break;
        }
        if (this.pneumothoraxDecompressedAtTick !== null) {
          this.log('warning', 'crisis', `pneumothorax-decompression-refused-${this.currentTick}`,
            'Left-chest decompression intent has already been accepted. No duplicate action was recorded.');
          break;
        }
        this.pneumothoraxDecompressedAtTick = this.currentTick;
        this.tensionPneumothoraxSeverity = 0;
        this.log('critical', 'crisis', `pneumothorax-decompressed-${this.currentTick}`,
          'Immediate left-chest decompression intent accepted. The monitor pattern now clears on a bounded teaching trajectory; technique, site, equipment, and procedural complications are not simulated.', {
            side: 'left', action: 'decompression-intent', teachingModel: true,
          });
        break;
      }
      case 'cardiac-tamponade-assessment': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'cardiac-tamponade'
          && event.target === 'traumatic-pericardial-pressure');
        const active = supported && (this.cardiacTamponadeSeverity > 0
          || this.cardiacTamponadeFraction > 0.05);
        const valid = [
          'review-context-and-perfusion', 'review-fixed-pocus',
          'record-definitive-control-intent', 'reassess-perfusion',
        ].includes(response);
        if (!active || !valid) {
          this.log('warning', 'assessment', `cardiac-tamponade-refused-${this.currentTick}`,
            active
              ? 'The tamponade action was not one of the listed choices. Nothing changed.'
              : 'The bounded tamponade choices are available only while the declared event is active.');
          break;
        }
        if (response === 'review-context-and-perfusion') {
          if (this.tamponadeContextReviewedAtTick !== null) {
            this.log('warning', 'assessment', `tamponade-context-refused-${this.currentTick}`,
              'The fixed trauma and perfusion evidence has already been reviewed.');
            break;
          }
          this.tamponadeContextReviewedAtTick = this.currentTick;
          this.log('critical', 'assessment', `tamponade-context-reviewed-${this.currentTick}`,
            'Fixed evidence: penetrating central-chest trauma, tachycardia, narrowing pulse pressure, cool skin, inattention, and falling end-tidal carbon dioxide accompany shock without unilateral ventilation loss. This pattern requires immediate cause-directed evaluation; it is not diagnostic proof.');
          break;
        }
        if (response === 'review-fixed-pocus') {
          if (this.tamponadeContextReviewedAtTick === null) {
            this.log('warning', 'assessment', `tamponade-pocus-order-refused-${this.currentTick}`,
              'Review the mechanism and whole-patient perfusion evidence before the fixed POCUS finding.');
            break;
          }
          if (this.tamponadePocusReviewedAtTick !== null) {
            this.log('warning', 'assessment', `tamponade-pocus-refused-${this.currentTick}`,
              'The fixed POCUS finding has already been reviewed.');
            break;
          }
          this.tamponadePocusReviewedAtTick = this.currentTick;
          this.log('critical', 'assessment', `tamponade-pocus-reviewed-${this.currentTick}`,
            'Fixed POCUS statement: pericardial fluid is present with right-sided chamber collapse in this hemodynamically unstable trauma vignette. Image acquisition, views, interpretation error, and alternative causes are not simulated.');
          break;
        }
        if (response === 'record-definitive-control-intent') {
          if (this.tamponadePocusReviewedAtTick === null) {
            this.log('warning', 'assessment', `tamponade-control-order-refused-${this.currentTick}`,
              'Review the fixed POCUS finding before recording immediate definitive-control intent.');
            break;
          }
          if (this.tamponadeDefinitiveControlAtTick !== null) {
            this.log('warning', 'assessment', `tamponade-control-refused-${this.currentTick}`,
              'Immediate definitive-control intent has already been recorded.');
            break;
          }
          this.tamponadeDefinitiveControlAtTick = this.currentTick;
          this.log('critical', 'assessment', `tamponade-control-recorded-${this.currentTick}`,
            'Immediate trauma, surgical, and resuscitation-team transfer for definitive tamponade control was recorded. The obstructive physiology remains active because no procedure or treatment is simulated.',
            { intentOnly: true, treatmentDelivered: false });
          break;
        }
        if (this.tamponadeDefinitiveControlAtTick === null
          || this.currentTick <= this.tamponadeDefinitiveControlAtTick) {
          this.log('warning', 'assessment', `tamponade-reassessment-order-refused-${this.currentTick}`,
            'Record definitive-control intent and allow the next engine tick before reassessment.');
          break;
        }
        if (this.tamponadeReassessedAtTick !== null) {
          this.log('warning', 'assessment', `tamponade-reassessment-refused-${this.currentTick}`,
            'The fixed post-control perfusion reassessment has already been recorded.');
          break;
        }
        this.tamponadeReassessedAtTick = this.currentTick;
        this.log('advisory', 'assessment', `tamponade-perfusion-reassessed-${this.currentTick}`,
          'The canonical monitor remains compatible with unresolved obstructive shock after accepted definitive-control intent. Continued deterioration requires live definitive care; no response, technical success, or outcome is simulated.',
          { definitiveControlIntentRecorded: true, treatmentDelivered: false,
            physiologyResolved: false });
        break;
      }
      case 'emergency-anaphylaxis-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some(
          (event) => event.type === 'narrative' && event.target === 'emergency-anaphylaxis',
        );
        const valid = [
          'review-systemic-pattern', 'position-and-call-for-help', 'give-im-epinephrine',
          'give-high-flow-oxygen', 'begin-fixed-crystalloid', 'reassess-response',
        ].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `emergency-anaphylaxis-refused-${this.currentTick}`,
            supported
              ? 'The emergency-anaphylaxis action was not one of the listed choices. Nothing changed.'
              : 'The bounded emergency-anaphylaxis choices are available only in the declared lesson.');
          break;
        }
        if (response === 'review-systemic-pattern') {
          if (this.emergencyAnaphylaxisPatternReviewedAtTick !== null) {
            this.log('warning', 'assessment', `emergency-anaphylaxis-pattern-refused-${this.currentTick}`,
              'The fixed airway, breathing, circulation, and exposure pattern has already been reviewed.');
            break;
          }
          this.emergencyAnaphylaxisPatternReviewedAtTick = this.currentTick;
          this.log('critical', 'assessment', `emergency-anaphylaxis-pattern-reviewed-${this.currentTick}`,
            'Fixed evidence: abrupt lip and tongue swelling, widespread wheeze, hypoxemia, hypotension, and impaired perfusion followed a food exposure. Skin findings are absent in this vignette; the pattern supports immediate treatment without making the simulator a diagnostic test.');
          break;
        }
        if (this.emergencyAnaphylaxisPatternReviewedAtTick === null) {
          this.log('warning', 'assessment', `emergency-anaphylaxis-order-refused-${this.currentTick}`,
            'Review the fixed systemic pattern before recording response actions.');
          break;
        }
        if (response === 'position-and-call-for-help') {
          if (this.emergencyAnaphylaxisPositionedAndHelpedAtTick !== null) {
            this.log('warning', 'assessment', `emergency-anaphylaxis-position-refused-${this.currentTick}`,
              'Recumbent positioning and emergency help have already been recorded.');
            break;
          }
          this.emergencyAnaphylaxisPositionedAndHelpedAtTick = this.currentTick;
          this.log('critical', 'assessment', `emergency-anaphylaxis-positioned-${this.currentTick}`,
            'Recumbent positioning, trigger avoidance, continuous monitoring, and immediate emergency help were recorded. Physical positioning, staffing, communication, and trigger verification are not simulated.');
          break;
        }
        if (this.emergencyAnaphylaxisPositionedAndHelpedAtTick === null) {
          this.log('warning', 'assessment', `emergency-anaphylaxis-support-order-refused-${this.currentTick}`,
            'Record positioning and emergency help before first-line treatment.');
          break;
        }
        if (response === 'give-im-epinephrine') {
          if (this.emergencyAnaphylaxisImEpinephrineAtTick !== null) {
            this.log('warning', 'drug', `emergency-anaphylaxis-epinephrine-refused-${this.currentTick}`,
              'The fixed initial intramuscular epinephrine action has already been accepted.');
            break;
          }
          this.emergencyAnaphylaxisImEpinephrineAtTick = this.currentTick;
          this.epinephrineEffect = 1;
          this.epinephrineTotalMicrograms += 500;
          this.lastEpinephrineTick = this.currentTick;
          this.log('critical', 'drug', `epinephrine-im-emergency-${this.currentTick}`,
            'Epinephrine 500 micrograms IM in the anterolateral thigh recorded as the fixed adult first-line action. Preparation, injection technique, absorption, and individual response are not simulated.', {
              drugId: 'epinephrine', route: 'im', doseMicrograms: 500, teachingModel: true,
            });
          break;
        }
        if (this.emergencyAnaphylaxisImEpinephrineAtTick === null) {
          this.log('warning', 'assessment', `emergency-anaphylaxis-adjunct-order-refused-${this.currentTick}`,
            'Record first-line intramuscular epinephrine before supportive adjuncts.');
          break;
        }
        if (response === 'give-high-flow-oxygen') {
          if (this.emergencyAnaphylaxisOxygenAtTick !== null) {
            this.log('warning', 'equipment', `emergency-anaphylaxis-oxygen-refused-${this.currentTick}`,
              'High-flow oxygen intent has already been recorded.');
            break;
          }
          this.emergencyAnaphylaxisOxygenAtTick = this.currentTick;
          this.ventilator = { ...this.ventilator, fio2: 1 };
          this.log('critical', 'equipment', `emergency-anaphylaxis-oxygen-${this.currentTick}`,
            'High-flow oxygen by non-rebreather mask was recorded. Mask fit, flow, airway procedures, and delivered concentration are not simulated.');
          break;
        }
        if (response === 'begin-fixed-crystalloid') {
          if (this.emergencyAnaphylaxisCrystalloidAtTick !== null) {
            this.log('warning', 'fluid', `emergency-anaphylaxis-fluid-refused-${this.currentTick}`,
              'The fixed initial crystalloid bolus has already been recorded.');
            break;
          }
          this.emergencyAnaphylaxisCrystalloidAtTick = this.currentTick;
          this.pendingCrystalloidMl += 1500;
          this.crystalloidTotalMl += 1500;
          this.log('critical', 'fluid', `emergency-anaphylaxis-fluid-${this.currentTick}`,
            'A fixed 1,500 mL isotonic crystalloid bolus was recorded for cardiovascular instability. Access, delivery rate, individualized volume, and fluid complications are not simulated.', {
              fluidId: 'balanced-crystalloid', volumeMl: 1500, teachingModel: true,
            });
          break;
        }
        if (this.emergencyAnaphylaxisOxygenAtTick === null
          || this.emergencyAnaphylaxisCrystalloidAtTick === null
          || this.currentTick <= Math.max(
            this.emergencyAnaphylaxisOxygenAtTick, this.emergencyAnaphylaxisCrystalloidAtTick,
          )) {
          this.log('warning', 'assessment', `emergency-anaphylaxis-reassessment-order-refused-${this.currentTick}`,
            'Record oxygen and initial crystalloid, then allow the next engine tick before reassessment.');
          break;
        }
        if (this.emergencyAnaphylaxisReassessedAtTick !== null) {
          this.log('warning', 'assessment', `emergency-anaphylaxis-reassessment-refused-${this.currentTick}`,
            'The bounded response has already been reassessed.');
          break;
        }
        this.emergencyAnaphylaxisReassessedAtTick = this.currentTick;
        this.log('advisory', 'assessment', `emergency-anaphylaxis-reassessed-${this.currentTick}`,
          'Airway, breathing, circulation, mental status, and the canonical monitor response were reassessed. Repeat-dose timing, refractory treatment, observation, referral, and outcome remain outside this initial-response vignette.');
        break;
      }
      case 'adult-asthma-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some(
          (event) => event.type === 'narrative' && event.target === 'adult-asthma',
        );
        const valid = [
          'review-severity-and-mimics', 'record-controlled-oxygen',
          'give-fixed-inhaled-bronchodilators', 'record-early-corticosteroid-intent',
          'reassess-after-initial-treatment',
        ].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `adult-asthma-refused-${this.currentTick}`,
            supported
              ? 'The adult-asthma action was not one of the listed choices. Nothing changed.'
              : 'The bounded adult-asthma choices are available only in the declared lesson.');
          break;
        }
        if (response === 'review-severity-and-mimics') {
          if (this.adultAsthmaSeverityReviewedAtTick !== null) {
            this.log('warning', 'assessment', `adult-asthma-severity-refused-${this.currentTick}`,
              'The fixed severity and immediate-mimic review has already been recorded.');
            break;
          }
          this.adultAsthmaSeverityReviewedAtTick = this.currentTick;
          this.log('critical', 'assessment', `adult-asthma-severity-reviewed-${this.currentTick}`,
            'Fixed assessment: words only, respiratory rate 34/min, accessory-muscle use, widespread expiratory wheeze, SpO₂ 91% on room air, and peak expiratory flow 32% predicted. No urticaria, angioedema, focal air-entry loss, fever, or edema is authored. This supports a severe asthma-exacerbation response without proving the diagnosis.');
          break;
        }
        if (this.adultAsthmaSeverityReviewedAtTick === null) {
          this.log('warning', 'assessment', `adult-asthma-order-refused-${this.currentTick}`,
            'Review severity and immediate alternative causes before recording treatment.');
          break;
        }
        if (response === 'record-controlled-oxygen') {
          if (this.adultAsthmaControlledOxygenAtTick !== null) {
            this.log('warning', 'equipment', `adult-asthma-oxygen-refused-${this.currentTick}`,
              'Controlled oxygen has already been recorded.');
            break;
          }
          this.adultAsthmaControlledOxygenAtTick = this.currentTick;
          this.ventilator = { ...this.ventilator, fio2: 0.4 };
          this.log('critical', 'equipment', `adult-asthma-oxygen-${this.currentTick}`,
            'Controlled oxygen was recorded for SpO₂ below 92%, with a fixed adult target of 92–95%. Device, flow, titration technique, and actual delivered concentration are not simulated.');
          break;
        }
        if (response === 'give-fixed-inhaled-bronchodilators') {
          if (this.adultAsthmaBronchodilatorBundleAtTick !== null) {
            this.log('warning', 'drug', `adult-asthma-bronchodilator-refused-${this.currentTick}`,
              'The fixed initial inhaled bronchodilator bundle has already been recorded.');
            break;
          }
          this.adultAsthmaBronchodilatorBundleAtTick = this.currentTick;
          this.salbutamolTotalMg += 0.6;
          this.lastSalbutamolTick = this.currentTick;
          this.bronchodilatorEffectFraction = clamp(
            this.bronchodilatorEffectFraction + 0.75, 0, 1,
          );
          this.log('critical', 'drug', `adult-asthma-bronchodilators-${this.currentTick}`,
            'A fixed severe-presentation pMDI-and-spacer bundle of 6 salbutamol puffs and 4 ipratropium puffs was recorded. Inhaler strength, preparation, technique, lung delivery, repeat dosing, toxicity, and individual response are not simulated.', {
              route: 'inhaled-pmdi-spacer', salbutamolPuffs: 6, ipratropiumPuffs: 4,
              teachingModel: true,
            });
          break;
        }
        if (response === 'record-early-corticosteroid-intent') {
          if (this.adultAsthmaCorticosteroidIntentAtTick !== null) {
            this.log('warning', 'drug', `adult-asthma-corticosteroid-refused-${this.currentTick}`,
              'Early systemic-corticosteroid intent has already been recorded.');
            break;
          }
          this.adultAsthmaCorticosteroidIntentAtTick = this.currentTick;
          this.log('critical', 'drug', `adult-asthma-corticosteroid-${this.currentTick}`,
            'Early systemic-corticosteroid intent within the first hour was recorded. Drug, dose, route, contraindications, delayed pharmacology, and prescription are outside this vignette.', {
              intentOnly: true, timingWindowMinutes: 60,
            });
          break;
        }
        if (this.adultAsthmaControlledOxygenAtTick === null
          || this.adultAsthmaBronchodilatorBundleAtTick === null
          || this.adultAsthmaCorticosteroidIntentAtTick === null
          || this.currentTick <= Math.max(
            this.adultAsthmaControlledOxygenAtTick,
            this.adultAsthmaBronchodilatorBundleAtTick,
            this.adultAsthmaCorticosteroidIntentAtTick,
          )) {
          this.log('warning', 'assessment', `adult-asthma-reassessment-order-refused-${this.currentTick}`,
            'Record controlled oxygen, inhaled bronchodilators, and early corticosteroid intent, then allow the next engine tick before reassessment.');
          break;
        }
        if (this.adultAsthmaReassessedAtTick !== null) {
          this.log('warning', 'assessment', `adult-asthma-reassessment-refused-${this.currentTick}`,
            'The fixed post-treatment reassessment has already been recorded.');
          break;
        }
        this.adultAsthmaReassessedAtTick = this.currentTick;
        this.log('advisory', 'assessment', `adult-asthma-reassessed-${this.currentTick}`,
          'Symptoms, speech, work of breathing, saturation, canonical waveform response, and fixed repeat peak flow were reassessed. Peak flow is now 55% predicted. Repeat treatment, magnesium, ventilatory support, disposition, prevention planning, and outcome remain outside this initial-response vignette.', {
            repeatPeakExpiratoryFlowPercentPredicted: 55, teachingModel: true,
          });
        break;
      }
      case 'copd-exacerbation-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some(
          (event) => event.type === 'narrative' && event.target === 'copd-exacerbation',
        );
        const valid = [
          'review-severity-and-mimics', 'record-controlled-oxygen',
          'give-air-driven-bronchodilators', 'record-five-day-corticosteroid-intent',
          'record-antibiotic-indication', 'reassess-and-review-ventilatory-support',
        ].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `copd-exacerbation-refused-${this.currentTick}`,
            supported
              ? 'The COPD-exacerbation action was not one of the listed choices. Nothing changed.'
              : 'The bounded COPD-exacerbation choices are available only in the declared lesson.');
          break;
        }
        if (response === 'review-severity-and-mimics') {
          if (this.copdSeverityReviewedAtTick !== null) {
            this.log('warning', 'assessment', `copd-exacerbation-severity-refused-${this.currentTick}`,
              'The fixed severity, mimic, and blood-gas review has already been recorded.');
            break;
          }
          this.copdSeverityReviewedAtTick = this.currentTick;
          this.log('critical', 'assessment', `copd-exacerbation-severity-reviewed-${this.currentTick}`,
            'Fixed assessment: increased dyspnea, short-phrase speech, respiratory rate 28/min, heart rate 104/min, accessory-muscle use, diffuse wheeze, increased purulent sputum, and SpO₂ 90% on room air. Authored blood gas: pH 7.36, PaCO₂ 52 mmHg, PaO₂ 58 mmHg. No focal consolidation, edema, pneumothorax, abrupt pleuritic onset, or new unilateral leg finding is authored. This supports a moderate COPD-exacerbation response without proving the diagnosis.');
          break;
        }
        if (this.copdSeverityReviewedAtTick === null) {
          this.log('warning', 'assessment', `copd-exacerbation-order-refused-${this.currentTick}`,
            'Review severity, immediate mimics, and the fixed blood gas before treatment.');
          break;
        }
        if (response === 'record-controlled-oxygen') {
          if (this.copdControlledOxygenAtTick !== null) {
            this.log('warning', 'equipment', `copd-exacerbation-oxygen-refused-${this.currentTick}`,
              'Controlled oxygen has already been recorded.');
            break;
          }
          this.copdControlledOxygenAtTick = this.currentTick;
          this.ventilator = { ...this.ventilator, fio2: 0.28 };
          this.log('critical', 'equipment', `copd-exacerbation-oxygen-${this.currentTick}`,
            'Controlled oxygen was recorded with a fixed target of 88-92% and a plan for serial blood-gas review. Device, flow, titration technique, and actual delivered concentration are not simulated.');
          break;
        }
        if (response === 'give-air-driven-bronchodilators') {
          if (this.copdBronchodilatorBundleAtTick !== null) {
            this.log('warning', 'drug', `copd-exacerbation-bronchodilator-refused-${this.currentTick}`,
              'The fixed initial bronchodilator bundle has already been recorded.');
            break;
          }
          this.copdBronchodilatorBundleAtTick = this.currentTick;
          this.bronchodilatorEffectFraction = clamp(
            this.bronchodilatorEffectFraction + 0.6, 0, 1,
          );
          this.log('critical', 'drug', `copd-exacerbation-bronchodilators-${this.currentTick}`,
            'A fixed air-driven short-acting beta₂-agonist plus short-acting anticholinergic intent was recorded. Agent, dose, preparation, technique, lung delivery, repeat dosing, toxicity, and individual response are not simulated.', {
              route: 'air-driven-inhaled-bundle', beta2Agonist: true,
              anticholinergic: true, teachingModel: true,
            });
          break;
        }
        if (response === 'record-five-day-corticosteroid-intent') {
          if (this.copdCorticosteroidIntentAtTick !== null) {
            this.log('warning', 'drug', `copd-exacerbation-corticosteroid-refused-${this.currentTick}`,
              'The short-course systemic-corticosteroid intent has already been recorded.');
            break;
          }
          this.copdCorticosteroidIntentAtTick = this.currentTick;
          this.log('critical', 'drug', `copd-exacerbation-corticosteroid-${this.currentTick}`,
            'A 40 mg prednisone-equivalent daily systemic-corticosteroid intent for 5 days was recorded. Agent, route, contraindications, delayed pharmacology, and prescription are outside this vignette.', {
              intentOnly: true, prednisoneEquivalentMgPerDay: 40, durationDays: 5,
            });
          break;
        }
        if (response === 'record-antibiotic-indication') {
          if (this.copdAntibioticIntentAtTick !== null) {
            this.log('warning', 'drug', `copd-exacerbation-antibiotic-refused-${this.currentTick}`,
              'The authored antibiotic indication has already been recorded.');
            break;
          }
          this.copdAntibioticIntentAtTick = this.currentTick;
          this.log('critical', 'drug', `copd-exacerbation-antibiotic-${this.currentTick}`,
            'Antibiotic intent was recorded because increased purulent sputum is authored. Agent selection, allergies, cultures, resistance, route, dose, duration, delayed pharmacology, and prescription are not simulated.', {
              indication: 'purulent-sputum', intentOnly: true,
            });
          break;
        }
        if (this.copdControlledOxygenAtTick === null
          || this.copdBronchodilatorBundleAtTick === null
          || this.copdCorticosteroidIntentAtTick === null
          || this.copdAntibioticIntentAtTick === null
          || this.currentTick <= Math.max(
            this.copdControlledOxygenAtTick, this.copdBronchodilatorBundleAtTick,
            this.copdCorticosteroidIntentAtTick, this.copdAntibioticIntentAtTick,
          )) {
          this.log('warning', 'assessment', `copd-exacerbation-reassessment-order-refused-${this.currentTick}`,
            'Record controlled oxygen, bronchodilators, corticosteroid intent, and the antibiotic indication, then allow the next engine tick before reassessment.');
          break;
        }
        if (this.copdReassessedAtTick !== null) {
          this.log('warning', 'assessment', `copd-exacerbation-reassessment-refused-${this.currentTick}`,
            'The fixed post-treatment reassessment has already been recorded.');
          break;
        }
        this.copdReassessedAtTick = this.currentTick;
        this.log('advisory', 'assessment', `copd-exacerbation-reassessed-${this.currentTick}`,
          'Dyspnea, speech, work of breathing, saturation, and the canonical waveform response improved. Fixed repeat blood gas: pH 7.38 and PaCO₂ 48 mmHg. No current acidosis or worsening distress is authored, so immediate noninvasive ventilation is not selected; continued serial review and escalation for deterioration remain essential but outside this vignette.', {
            repeatPh: 7.38, repeatPaco2MmHg: 48,
            immediateNoninvasiveVentilationSelected: false, teachingModel: true,
          });
        break;
      }
      case 'acute-pulmonary-edema-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some(
          (event) => event.type === 'narrative' && event.target === 'acute-pulmonary-edema',
        );
        const valid = [
          'review-pattern-mimics-and-precipitants', 'record-niv-and-titrated-oxygen',
          'record-loop-diuretic-intent', 'record-vasodilator-intent',
          'reassess-breathing-pressure-and-perfusion',
        ].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `acute-pulmonary-edema-refused-${this.currentTick}`,
            supported
              ? 'The acute-pulmonary-edema action was not one of the listed choices. Nothing changed.'
              : 'The bounded acute-pulmonary-edema choices are available only in the declared lesson.');
          break;
        }
        if (response === 'review-pattern-mimics-and-precipitants') {
          if (this.pulmonaryEdemaPatternReviewedAtTick !== null) {
            this.log('warning', 'assessment', `acute-pulmonary-edema-pattern-refused-${this.currentTick}`,
              'The fixed pattern, mimic, and precipitant review has already been recorded.');
            break;
          }
          this.pulmonaryEdemaPatternReviewedAtTick = this.currentTick;
          this.log('critical', 'assessment', `acute-pulmonary-edema-pattern-reviewed-${this.currentTick}`,
            'Fixed assessment: abrupt severe dyspnea and orthopnea, short-phrase speech, respiratory rate 32/min, SpO₂ 90%, blood pressure 188/112 mmHg, diffuse crackles, elevated jugular venous pressure, and cool but perfused extremities. Authored ECG shows sinus tachycardia without ST elevation; chest radiograph shows bilateral perihilar interstitial-alveolar opacity; focused ultrasound shows diffuse bilateral B-lines with preserved LV systolic contraction. No fever, focal consolidation, unilateral ventilation loss, abrupt pleuritic onset, or unstable arrhythmia is authored. ACS, ischemia, medication lapse, renal dysfunction, valve disease, and other precipitants still require real evaluation.');
          break;
        }
        if (this.pulmonaryEdemaPatternReviewedAtTick === null) {
          this.log('warning', 'assessment', `acute-pulmonary-edema-order-refused-${this.currentTick}`,
            'Review the whole pattern, immediate mimics, and precipitants before treatment.');
          break;
        }
        if (response === 'record-niv-and-titrated-oxygen') {
          if (this.pulmonaryEdemaNivAtTick !== null) {
            this.log('warning', 'equipment', `acute-pulmonary-edema-niv-refused-${this.currentTick}`,
              'NIV and titrated-oxygen intent has already been recorded.');
            break;
          }
          this.pulmonaryEdemaNivAtTick = this.currentTick;
          this.ventilator = {
            ...this.ventilator, mode: 'pressure-control', fio2: 0.4, peep: 8,
            respiratoryRateBpm: 22, delivering: true,
          };
          this.log('critical', 'equipment', `acute-pulmonary-edema-niv-${this.currentTick}`,
            'Early noninvasive positive-pressure support with titrated oxygen was recorded for severe work of breathing, respiratory rate above 25/min, and SpO₂ at 90%. A bounded FiO₂ 0.40 and PEEP 8 cmH₂O teaching setting is displayed; interface choice, fit, pressure titration, synchrony, contraindications, and airway rescue are not simulated.', {
              intentOnly: true, fio2: 0.4, peepCmH2o: 8, teachingModel: true,
            });
          break;
        }
        if (response === 'record-loop-diuretic-intent') {
          if (this.pulmonaryEdemaDiureticIntentAtTick !== null) {
            this.log('warning', 'drug', `acute-pulmonary-edema-diuretic-refused-${this.currentTick}`,
              'Loop-diuretic intent has already been recorded.');
            break;
          }
          this.pulmonaryEdemaDiureticIntentAtTick = this.currentTick;
          this.log('critical', 'drug', `acute-pulmonary-edema-diuretic-${this.currentTick}`,
            'IV loop-diuretic intent was recorded for authored fluid overload and congestion. Agent, prior-dose adjustment, dose, delivery, urine output, renal function, electrolytes, resistance, and individual response are outside this vignette.', { intentOnly: true });
          break;
        }
        if (response === 'record-vasodilator-intent') {
          if (this.pulmonaryEdemaVasodilatorIntentAtTick !== null) {
            this.log('warning', 'drug', `acute-pulmonary-edema-vasodilator-refused-${this.currentTick}`,
              'Vasodilator intent has already been recorded.');
            break;
          }
          this.pulmonaryEdemaVasodilatorIntentAtTick = this.currentTick;
          this.log('critical', 'drug', `acute-pulmonary-edema-vasodilator-${this.currentTick}`,
            'IV vasodilator intent was recorded because systolic pressure is safely above 110 mmHg in this hypertensive pulmonary-edema vignette. Agent, dose, delivery, titration, contraindications, ischemia evaluation, and individual response are not simulated.', { intentOnly: true, qualifyingSystolicMmHg: 188 });
          break;
        }
        if (this.pulmonaryEdemaNivAtTick === null
          || this.pulmonaryEdemaDiureticIntentAtTick === null
          || this.pulmonaryEdemaVasodilatorIntentAtTick === null
          || this.currentTick <= Math.max(this.pulmonaryEdemaNivAtTick,
            this.pulmonaryEdemaDiureticIntentAtTick,
            this.pulmonaryEdemaVasodilatorIntentAtTick)) {
          this.log('warning', 'assessment', `acute-pulmonary-edema-reassessment-order-refused-${this.currentTick}`,
            'Record NIV with titrated oxygen, loop-diuretic intent, and vasodilator intent, then allow the next engine tick before reassessment.');
          break;
        }
        if (this.pulmonaryEdemaReassessedAtTick !== null) {
          this.log('warning', 'assessment', `acute-pulmonary-edema-reassessment-refused-${this.currentTick}`,
            'The fixed post-treatment reassessment has already been recorded.');
          break;
        }
        this.pulmonaryEdemaReassessedAtTick = this.currentTick;
        this.log('advisory', 'assessment', `acute-pulmonary-edema-reassessed-${this.currentTick}`,
          'Work of breathing, respiratory rate, oxygenation, blood pressure, mental status, and peripheral perfusion were reassessed. The bounded monitor now shows RR 22/min, SpO₂ 96%, and blood pressure 146/86 mmHg. Congestion, urine output, renal function, electrolytes, precipitant evaluation, support weaning, disposition, and outcome remain outside this initial-response vignette.');
        break;
      }
      case 'pulmonary-embolism-deterioration-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) =>
          event.type === 'narrative' && event.target === 'pulmonary-embolism-deterioration');
        const valid = ['review-confirmed-pe-severity', 'record-titrated-oxygen',
          'record-therapeutic-anticoagulation-intent', 'reassess-for-deterioration',
          'activate-pert-and-record-reperfusion-intent'].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `pulmonary-embolism-refused-${this.currentTick}`,
            supported ? 'The pulmonary-embolism action was not one of the listed choices. Nothing changed.'
              : 'The bounded pulmonary-embolism choices are available only in the declared lesson.');
          break;
        }
        if (response === 'review-confirmed-pe-severity') {
          if (this.pulmonaryEmbolismSeverityReviewedAtTick !== null) {
            this.log('warning', 'assessment', `pulmonary-embolism-severity-refused-${this.currentTick}`,
              'The fixed pulmonary-embolism severity review has already been recorded.');
            break;
          }
          this.pulmonaryEmbolismSeverityReviewedAtTick = this.currentTick;
          this.log('critical', 'assessment', `pulmonary-embolism-severity-reviewed-${this.currentTick}`,
            'Fixed initial assessment: sudden dyspnea and pleuritic pain, HR 124/min, RR 30/min, SpO₂ 90%, BP 112/70 mmHg, alert mentation, and warm perfused extremities. Authored CTPA confirms bilateral main and lobar acute pulmonary emboli; focused echocardiography shows RV enlargement and systolic dysfunction without pericardial effusion; troponin and BNP are elevated, with lactate 1.8 mmol/L. This is a fixed Category C3R pattern, not a live diagnostic calculation.');
          break;
        }
        if (this.pulmonaryEmbolismSeverityReviewedAtTick === null) {
          this.log('warning', 'assessment', `pulmonary-embolism-order-refused-${this.currentTick}`,
            'Review the confirmed pulmonary embolism, severity markers, pressure, and perfusion first.');
          break;
        }
        if (response === 'record-titrated-oxygen') {
          if (this.pulmonaryEmbolismOxygenAtTick !== null) {
            this.log('warning', 'equipment', `pulmonary-embolism-oxygen-refused-${this.currentTick}`,
              'Titrated-oxygen intent has already been recorded.');
            break;
          }
          this.pulmonaryEmbolismOxygenAtTick = this.currentTick;
          this.ventilator = { ...this.ventilator, fio2: 0.4, delivering: true };
          this.log('critical', 'equipment', `pulmonary-embolism-oxygen-${this.currentTick}`,
            'Titrated supplemental-oxygen intent was recorded. Deep sedation and mechanical ventilation are deliberately not selected because acute RV dysfunction can decompensate when compensatory sympathetic tone and preload are lost. Device choice, flow, escalation, and airway rescue are outside this vignette.',
            { intentOnly: true, fio2: 0.4, invasiveVentilationSelected: false });
          break;
        }
        if (response === 'record-therapeutic-anticoagulation-intent') {
          if (this.pulmonaryEmbolismAnticoagulationAtTick !== null) {
            this.log('warning', 'drug', `pulmonary-embolism-anticoagulation-refused-${this.currentTick}`,
              'Therapeutic-anticoagulation intent has already been recorded.');
            break;
          }
          this.pulmonaryEmbolismAnticoagulationAtTick = this.currentTick;
          this.log('critical', 'drug', `pulmonary-embolism-anticoagulation-${this.currentTick}`,
            'Immediate therapeutic-anticoagulation intent was recorded for confirmed acute PE without an authored absolute contraindication. Agent, dose, renal adjustment, laboratory monitoring, bleeding assessment, and interaction with a reperfusion strategy are outside this vignette.', { intentOnly: true });
          break;
        }
        if (response === 'reassess-for-deterioration') {
          if (this.pulmonaryEmbolismOxygenAtTick === null
            || this.pulmonaryEmbolismAnticoagulationAtTick === null
            || this.currentTick <= Math.max(this.pulmonaryEmbolismOxygenAtTick,
              this.pulmonaryEmbolismAnticoagulationAtTick)) {
            this.log('warning', 'assessment', `pulmonary-embolism-reassessment-order-refused-${this.currentTick}`,
              'Record oxygen and anticoagulation intents, then allow the next engine tick before serial reassessment.');
            break;
          }
          if (this.pulmonaryEmbolismDeteriorationAtTick !== null) {
            this.log('warning', 'assessment', `pulmonary-embolism-reassessment-refused-${this.currentTick}`,
              'The fixed pulmonary-embolism deterioration has already been revealed.');
            break;
          }
          this.pulmonaryEmbolismDeteriorationAtTick = this.currentTick;
          this.log('critical', 'assessment', `pulmonary-embolism-deterioration-recognized-${this.currentTick}`,
            'Serial reassessment now shows persistent BP 78/50 mmHg, HR 138/min, cool mottled extremities, delayed capillary refill, new confusion, and fixed lactate 4.8 mmol/L despite oxygenation improving to 92%. The authored pattern has progressed to Category E1 cardiopulmonary failure with cardiogenic shock.');
          break;
        }
        if (this.pulmonaryEmbolismDeteriorationAtTick === null) {
          this.log('warning', 'assessment', `pulmonary-embolism-escalation-order-refused-${this.currentTick}`,
            'Reassess and recognize the authored cardiopulmonary deterioration before escalation.');
          break;
        }
        if (this.pulmonaryEmbolismEscalationAtTick !== null) {
          this.log('warning', 'assessment', `pulmonary-embolism-escalation-refused-${this.currentTick}`,
            'Multidisciplinary escalation and reperfusion-strategy intent have already been recorded.');
          break;
        }
        this.pulmonaryEmbolismEscalationAtTick = this.currentTick;
        this.log('critical', 'assessment', `pulmonary-embolism-escalation-${this.currentTick}`,
          'Immediate pulmonary embolism response-team activation and urgent reperfusion-strategy intent were recorded for Category E1 deterioration. Systemic thrombolysis, catheter therapy, mechanical thrombectomy, and surgical embolectomy require real contraindication review, local expertise, and individualized selection; none is performed or preferred here.', { intentOnly: true, category: 'E1' });
        break;
      }
      case 'stemi-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) =>
          event.type === 'narrative' && event.target === 'stemi');
        const valid = ['review-stemi-pattern', 'activate-stemi-pathway',
          'record-aspirin-load', 'record-p2y12-anticoagulation-intent',
          'reassess-and-handoff'].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `stemi-refused-${this.currentTick}`,
            supported ? 'The STEMI action was not one of the listed choices. Nothing changed.'
              : 'The bounded STEMI choices are available only in the declared lesson.');
          break;
        }
        if (response === 'review-stemi-pattern') {
          if (this.stemiPatternReviewedAtTick !== null) {
            this.log('warning', 'assessment', `stemi-pattern-refused-${this.currentTick}`,
              'The fixed STEMI pattern has already been reviewed.');
            break;
          }
          this.stemiPatternReviewedAtTick = this.currentTick;
          this.log('critical', 'assessment', `stemi-pattern-reviewed-${this.currentTick}`,
            'Fixed assessment: 45 minutes of ongoing central pressure radiating to the left arm with diaphoresis and nausea; HR 104/min, BP 146/92 mmHg, RR 20/min, SpO₂ 95%, warm perfusion, and no heart failure or shock. Authored 12-lead ECG shows ST elevation in V2-V5 with reciprocal inferior ST depression. The bedside lead-II monitor is not the diagnostic 12-lead. No tearing pain, pulse asymmetry, neurologic deficit, pericarditic pattern, pneumothorax pattern, or recent PDE5-inhibitor exposure is authored.');
          break;
        }
        if (this.stemiPatternReviewedAtTick === null) {
          this.log('warning', 'assessment', `stemi-order-refused-${this.currentTick}`,
            'Review symptom timing, the fixed 12-lead ECG, hemodynamics, oxygenation, and immediate alternatives first.');
          break;
        }
        if (response === 'activate-stemi-pathway') {
          if (this.stemiPathwayActivatedAtTick !== null) {
            this.log('warning', 'assessment', `stemi-pathway-refused-${this.currentTick}`,
              'The STEMI pathway and primary-PCI intent have already been activated.');
            break;
          }
          this.stemiPathwayActivatedAtTick = this.currentTick;
          this.log('critical', 'assessment', `stemi-pathway-activated-${this.currentTick}`,
            'The STEMI pathway, interventional team, and immediate primary-PCI intent were activated without waiting for biomarker results in this declared PCI-capable setting. Transport logistics, angiography, access, lesion anatomy, PCI technique, stent choice, and actual reperfusion are not simulated.', { intentOnly: true, strategy: 'primary-pci' });
          break;
        }
        if (response === 'record-aspirin-load') {
          if (this.stemiAspirinAtTick !== null) {
            this.log('warning', 'drug', `stemi-aspirin-refused-${this.currentTick}`,
              'The initial aspirin loading intent has already been recorded.');
            break;
          }
          this.stemiAspirinAtTick = this.currentTick;
          this.log('critical', 'drug', `stemi-aspirin-${this.currentTick}`,
            'An initial oral aspirin loading intent of 162-325 mg was recorded after the authored absence of allergy or absolute contraindication. Formulation, exact dose within the guideline range, administration, absorption, bleeding, and maintenance therapy are outside this vignette.', { intentOnly: true, loadingDoseMinimumMg: 162, loadingDoseMaximumMg: 325 });
          break;
        }
        if (response === 'record-p2y12-anticoagulation-intent') {
          if (this.stemiAdditionalAntithromboticsAtTick !== null) {
            this.log('warning', 'drug', `stemi-antithrombotics-refused-${this.currentTick}`,
              'P2Y12-inhibitor and parenteral-anticoagulation intents have already been recorded.');
            break;
          }
          this.stemiAdditionalAntithromboticsAtTick = this.currentTick;
          this.log('critical', 'drug', `stemi-antithrombotics-${this.currentTick}`,
            'P2Y12-inhibitor loading and parenteral-anticoagulation intents were recorded for the authored primary-PCI pathway. Agent selection, dose, contraindications, renal adjustment, prior therapy, laboratory monitoring, bleeding risk, and cath-lab protocol are outside this vignette.', { intentOnly: true });
          break;
        }
        if (this.stemiPathwayActivatedAtTick === null || this.stemiAspirinAtTick === null
          || this.stemiAdditionalAntithromboticsAtTick === null
          || this.currentTick <= Math.max(this.stemiPathwayActivatedAtTick,
            this.stemiAspirinAtTick, this.stemiAdditionalAntithromboticsAtTick)) {
          this.log('warning', 'assessment', `stemi-reassessment-order-refused-${this.currentTick}`,
            'Activate the reperfusion pathway and record both antithrombotic intents, then allow the next engine tick before reassessment.');
          break;
        }
        if (this.stemiReassessedAtTick !== null) {
          this.log('warning', 'assessment', `stemi-reassessment-refused-${this.currentTick}`,
            'The fixed pre-reperfusion reassessment and handoff have already been recorded.');
          break;
        }
        this.stemiReassessedAtTick = this.currentTick;
        this.log('advisory', 'assessment', `stemi-reassessed-${this.currentTick}`,
          'Pre-reperfusion reassessment: ongoing pain, HR 104/min, BP 146/92 mmHg, SpO₂ 95% on room air, warm perfusion, sinus rhythm, and no authored ventricular arrhythmia, heart failure, shock, or mechanical complication. Routine oxygen remains unselected because saturation is at least 90%. A time-stamped handoff to the activated reperfusion team was recorded; procedure and outcome remain outside this lesson.');
        break;
      }
      case 'unstable-narrow-tachycardia-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'unstable-narrow-complex-tachycardia');
        const valid = ['review-rhythm-and-instability', 'prepare-synchronized-cardioversion',
          'record-synchronized-cardioversion-intent', 'reassess-rhythm-and-perfusion']
          .includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `unstable-narrow-tachycardia-refused-${this.currentTick}`,
            supported ? 'The unstable-tachycardia action was not one of the listed choices. Nothing changed.'
              : 'The bounded unstable-tachycardia choices are available only in the declared lesson.');
          break;
        }
        if (response === 'review-rhythm-and-instability') {
          if (this.unstableNarrowTachycardiaReviewedAtTick !== null) {
            this.log('warning', 'assessment', `unstable-narrow-tachycardia-review-refused-${this.currentTick}`,
              'The fixed rhythm and instability review has already been recorded.');
            break;
          }
          this.unstableNarrowTachycardiaReviewedAtTick = this.currentTick;
          this.log('critical', 'assessment', `unstable-narrow-tachycardia-reviewed-${this.currentTick}`,
            'Fixed assessment: abrupt persistent regular tachycardia at 188/min; authored 12-lead ECG shows QRS 0.08 second with no clearly visible preceding P waves. BP is 76/48 mmHg with drowsiness, ischemic chest discomfort, cool mottled extremities, and delayed capillary refill. SpO₂ is 94% and there is no acute heart failure. The bedside teaching waveform does not encode atrial mechanism and is not a diagnostic rhythm strip. The tachycardia is authored as the cause of instability.');
          break;
        }
        if (this.unstableNarrowTachycardiaReviewedAtTick === null) {
          this.log('warning', 'assessment', `unstable-narrow-tachycardia-order-refused-${this.currentTick}`,
            'Review the rhythm features and whole-patient instability before treatment.');
          break;
        }
        if (response === 'prepare-synchronized-cardioversion') {
          if (this.unstableNarrowTachycardiaPreparedAtTick !== null) {
            this.log('warning', 'equipment', `unstable-narrow-tachycardia-preparation-refused-${this.currentTick}`,
              'Immediate support and synchronized-cardioversion preparation have already been recorded.');
            break;
          }
          this.unstableNarrowTachycardiaPreparedAtTick = this.currentTick;
          this.log('critical', 'equipment', `unstable-narrow-tachycardia-prepared-${this.currentTick}`,
            'Patent airway and breathing were confirmed; help, continuous rhythm/pressure/oximetry monitoring, IV access, and synchronized-cardioversion pad preparation were recorded. Routine oxygen was not selected because SpO₂ is 94%. Actual access, pad placement, device operation, and synchronization-marker verification are not simulated.', { intentOnly: true, routineOxygenSelected: false });
          break;
        }
        if (response === 'record-synchronized-cardioversion-intent') {
          if (this.unstableNarrowTachycardiaPreparedAtTick === null) {
            this.log('warning', 'assessment', `unstable-narrow-tachycardia-cardioversion-order-refused-${this.currentTick}`,
              'Record immediate support and synchronized-cardioversion preparation first.');
            break;
          }
          if (this.unstableNarrowTachycardiaCardiovertedAtTick !== null) {
            this.log('warning', 'equipment', `unstable-narrow-tachycardia-cardioversion-refused-${this.currentTick}`,
              'The bounded synchronized-cardioversion intent has already been recorded.');
            break;
          }
          this.unstableNarrowTachycardiaCardiovertedAtTick = this.currentTick;
          this.rhythm = 'sinus';
          this.log('critical', 'equipment', `unstable-narrow-tachycardia-cardioverted-${this.currentTick}`,
            'Prompt synchronized-cardioversion intent was recorded, with sedation only if feasible and without delaying the shock. Device-specific energy selection, synchronized-marker verification, sedation choice or delivery, shock delivery, and procedural competence are outside this vignette.', { intentOnly: true, synchronized: true, sedationOnlyIfFeasible: true });
          break;
        }
        if (this.unstableNarrowTachycardiaCardiovertedAtTick === null
          || this.currentTick <= this.unstableNarrowTachycardiaCardiovertedAtTick) {
          this.log('warning', 'assessment', `unstable-narrow-tachycardia-reassessment-order-refused-${this.currentTick}`,
            'Record synchronized-cardioversion intent, then allow the next engine tick before reassessment.');
          break;
        }
        if (this.unstableNarrowTachycardiaReassessedAtTick !== null) {
          this.log('warning', 'assessment', `unstable-narrow-tachycardia-reassessment-refused-${this.currentTick}`,
            'The fixed post-cardioversion reassessment has already been recorded.');
          break;
        }
        this.unstableNarrowTachycardiaReassessedAtTick = this.currentTick;
        this.log('advisory', 'assessment', `unstable-narrow-tachycardia-reassessed-${this.currentTick}`,
          'Fixed post-cardioversion reassessment: regular sinus rhythm 92/min, BP 118/72 mmHg, alert mentation, resolving ischemic discomfort, warm extremities, and improved capillary refill. Refractory or recurrent tachycardia, causal investigation, medication therapy, anticoagulation questions, disposition, and outcome remain outside this vignette.');
        break;
      }
      case 'unstable-bradycardia-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'unstable-bradycardia');
        const valid = ['review-bradycardia-and-compromise', 'record-bradycardia-support',
          'record-atropine-intent', 'reassess-bradycardia-response'].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `unstable-bradycardia-refused-${this.currentTick}`,
            supported ? 'The unstable-bradycardia action was not one of the listed choices. Nothing changed.'
              : 'The bounded unstable-bradycardia choices are available only in the declared lesson.');
          break;
        }
        if (response === 'review-bradycardia-and-compromise') {
          if (this.unstableBradycardiaReviewedAtTick !== null) {
            this.log('warning', 'assessment', `unstable-bradycardia-review-refused-${this.currentTick}`,
              'The fixed bradycardia and compromise review has already been recorded.');
            break;
          }
          this.unstableBradycardiaReviewedAtTick = this.currentTick;
          this.log('critical', 'assessment', `unstable-bradycardia-reviewed-${this.currentTick}`,
            'Fixed assessment: regular sinus bradycardia at 38/min with a palpable pulse. BP is 78/46 mmHg with drowsiness, ischemic chest discomfort, cool mottled extremities, and delayed capillary refill. SpO₂ is 91% on room air, the airway is patent, and breathing is spontaneous. The bradycardia is authored as clinically inappropriate and associated with cardiopulmonary compromise; definitive cause is not diagnosed.');
          break;
        }
        if (this.unstableBradycardiaReviewedAtTick === null) {
          this.log('warning', 'assessment', `unstable-bradycardia-order-refused-${this.currentTick}`,
            'Review the rate, rhythm, pulse, and cardiopulmonary compromise before treatment.');
          break;
        }
        if (response === 'record-bradycardia-support') {
          if (this.unstableBradycardiaSupportedAtTick !== null) {
            this.log('warning', 'equipment', `unstable-bradycardia-support-refused-${this.currentTick}`,
              'The immediate bradycardia support bundle has already been recorded.');
            break;
          }
          this.unstableBradycardiaSupportedAtTick = this.currentTick;
          this.log('critical', 'equipment', `unstable-bradycardia-supported-${this.currentTick}`,
            'Patent airway and spontaneous breathing were confirmed; oxygen, help, continuous cardiorespiratory monitoring, pulse monitoring, and vascular access were recorded. Positive-pressure ventilation was not selected because breathing remained adequate. Actual oxygen delivery, access, and equipment operation are not simulated.', { intentOnly: true, oxygenSelected: true, positivePressureVentilationSelected: false });
          break;
        }
        if (response === 'record-atropine-intent') {
          if (this.unstableBradycardiaSupportedAtTick === null) {
            this.log('warning', 'assessment', `unstable-bradycardia-atropine-order-refused-${this.currentTick}`,
              'Record immediate assessment and support before atropine intent.');
            break;
          }
          if (this.unstableBradycardiaAtropineAtTick !== null) {
            this.log('warning', 'equipment', `unstable-bradycardia-atropine-refused-${this.currentTick}`,
              'The fixed atropine intent has already been recorded.');
            break;
          }
          this.unstableBradycardiaAtropineAtTick = this.currentTick;
          this.rhythm = 'sinus';
          this.log('critical', 'equipment', `unstable-bradycardia-atropine-${this.currentTick}`,
            'A fixed 1 mg IV atropine intent was recorded for persistent bradycardia with cardiopulmonary compromise. Medication preparation and delivery, repeat dosing, contraindication assessment, and individual response prediction are outside this vignette.', { intentOnly: true, doseMg: 1, route: 'iv' });
          break;
        }
        if (this.unstableBradycardiaAtropineAtTick === null
          || this.currentTick <= this.unstableBradycardiaAtropineAtTick) {
          this.log('warning', 'assessment', `unstable-bradycardia-reassessment-order-refused-${this.currentTick}`,
            'Record atropine intent, then allow the next engine tick before reassessment.');
          break;
        }
        if (this.unstableBradycardiaReassessedAtTick !== null) {
          this.log('warning', 'assessment', `unstable-bradycardia-reassessment-refused-${this.currentTick}`,
            'The fixed post-atropine reassessment has already been recorded.');
          break;
        }
        this.unstableBradycardiaReassessedAtTick = this.currentTick;
        this.log('advisory', 'assessment', `unstable-bradycardia-reassessed-${this.currentTick}`,
          'Fixed reassessment: regular sinus rhythm 68/min, BP 112/70 mmHg, SpO₂ 96%, alert mentation, resolving ischemic discomfort, warm extremities, and improved capillary refill. Reversible-cause evaluation and escalation remain necessary. Repeated atropine, pacing, adrenergic infusions, definitive diagnosis, recurrence, disposition, and outcome remain outside this lesson.');
        break;
      }
      case 'status-epilepticus-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'status-epilepticus');
        const valid = ['review-convulsive-status', 'record-status-stabilization',
          'give-lorazepam-4-mg-iv', 'reassess-after-lorazepam'].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `status-epilepticus-refused-${this.currentTick}`,
            supported ? 'The status-epilepticus action was not one of the listed choices. Nothing changed.'
              : 'The bounded status-epilepticus choices are available only in the declared lesson.');
          break;
        }
        if (response === 'review-convulsive-status') {
          if (this.statusEpilepticusReviewedAtTick !== null) {
            this.log('warning', 'assessment', `status-epilepticus-review-refused-${this.currentTick}`,
              'The fixed convulsive-status pattern has already been reviewed.');
            break;
          }
          this.statusEpilepticusReviewedAtTick = this.currentTick;
          this.log('critical', 'assessment', `status-epilepticus-reviewed-${this.currentTick}`,
            'Fixed assessment: generalized bilateral convulsive activity has continued for 6 minutes 20 seconds without recovery. The airway is patent between convulsive movements, breathing is spontaneous, SpO₂ is 92% on room air, a pulse is present, and bedside glucose is not yet known. This meets the operational treatment threshold for generalized convulsive status epilepticus; cause is not diagnosed.');
          break;
        }
        if (this.statusEpilepticusReviewedAtTick === null) {
          this.log('warning', 'assessment', `status-epilepticus-order-refused-${this.currentTick}`,
            'Review seizure type, duration, recovery, airway, breathing, circulation, and glucose status first.');
          break;
        }
        if (response === 'record-status-stabilization') {
          if (this.statusEpilepticusSupportedAtTick !== null) {
            this.log('warning', 'equipment', `status-epilepticus-support-refused-${this.currentTick}`,
              'The immediate status-epilepticus stabilization bundle has already been recorded.');
            break;
          }
          this.statusEpilepticusSupportedAtTick = this.currentTick;
          this.log('critical', 'equipment', `status-epilepticus-supported-${this.currentTick}`,
            'Airway positioning, suction readiness, titrated oxygen, cardiorespiratory monitoring, blood pressure, vascular access, help, and a point-of-care glucose of 118 mg/dL were recorded in parallel. The patient was protected from injury without restraint. Physical care, specimen acquisition, and equipment operation are not simulated.',
            { intentOnly: true, pointOfCareGlucoseMgPerDl: 118 });
          break;
        }
        if (response === 'give-lorazepam-4-mg-iv') {
          if (this.statusEpilepticusSupportedAtTick === null) {
            this.log('warning', 'assessment', `status-epilepticus-lorazepam-order-refused-${this.currentTick}`,
              'Record immediate stabilization and point-of-care glucose before the medication action.');
            break;
          }
          if (this.statusEpilepticusLorazepamAtTick !== null) {
            this.log('warning', 'drug', `status-epilepticus-lorazepam-refused-${this.currentTick}`,
              'The bounded 4 mg IV lorazepam action has already been accepted.');
            break;
          }
          this.statusEpilepticusLorazepamAtTick = this.currentTick;
          this.seizureSuppressed = true;
          this.log('critical', 'drug', `status-epilepticus-lorazepam-${this.currentTick}`,
            'Lorazepam 4 mg IV was accepted as the fixed first-line benzodiazepine action. The modeled convulsions stop on the next physiology update. Preparation, physical delivery, pharmacokinetics, contraindication assessment, and individual treatment response are not predicted.',
            { drugId: 'lorazepam', route: 'iv', doseMg: 4, teachingModel: true });
          break;
        }
        if (this.statusEpilepticusLorazepamAtTick === null
          || this.currentTick <= this.statusEpilepticusLorazepamAtTick) {
          this.log('warning', 'assessment', `status-epilepticus-reassessment-order-refused-${this.currentTick}`,
            'Give the bounded lorazepam action, then allow the next engine tick before reassessment.');
          break;
        }
        if (this.statusEpilepticusReassessedAtTick !== null) {
          this.log('warning', 'assessment', `status-epilepticus-reassessment-refused-${this.currentTick}`,
            'The fixed post-lorazepam reassessment has already been recorded.');
          break;
        }
        this.statusEpilepticusReassessedAtTick = this.currentTick;
        this.log('advisory', 'assessment', `status-epilepticus-reassessed-${this.currentTick}`,
          'Fixed reassessment: visible generalized convulsions have stopped, spontaneous ventilation and a pulse remain present, and oxygen saturation is 96% with support. Airway and ventilation surveillance continues. Persistent or recurrent seizure would require prompt second-line antiseizure therapy; EEG, causal evaluation, repeat or alternate medication, airway procedures, recurrence, disposition, and outcome are outside this lesson.');
        break;
      }
      case 'acute-ischemic-stroke-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some(
          (event) => event.type === 'narrative' && event.target === 'acute-ischemic-stroke',
        );
        const valid = ['review-stroke-presentation', 'activate-stroke-system',
          'review-stroke-imaging-and-eligibility', 'record-tenecteplase-20-mg-intent',
          'activate-thrombectomy-transfer', 'reassess-and-handoff-stroke'].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `acute-stroke-refused-${this.currentTick}`,
            supported ? 'The acute-stroke action was not one of the listed choices. Nothing changed.'
              : 'The bounded acute-stroke choices are available only in the declared lesson.');
          break;
        }
        if (response === 'review-stroke-presentation') {
          if (this.acuteStrokePresentationReviewedAtTick !== null) {
            this.log('warning', 'assessment', `acute-stroke-review-refused-${this.currentTick}`,
              'The fixed acute-stroke presentation has already been reviewed.');
            break;
          }
          this.acuteStrokePresentationReviewedAtTick = this.currentTick;
          this.log('critical', 'assessment', `acute-stroke-reviewed-${this.currentTick}`,
            'Fixed presentation: witnessed sudden aphasia, right facial weakness, and right arm weakness are disabling; last known well was 70 minutes ago. Glucose is 112 mg/dL, BP is 168/94 mmHg, the airway is protected, and breathing is spontaneous. This screen does not perform an examination or score severity.');
          break;
        }
        if (this.acuteStrokePresentationReviewedAtTick === null) {
          this.log('warning', 'assessment', `acute-stroke-order-refused-${this.currentTick}`,
            'Review the disabling deficit, last-known-well time, glucose, pressure, airway, and breathing first.');
          break;
        }
        if (response === 'activate-stroke-system') {
          if (this.acuteStrokeSystemActivatedAtTick !== null) {
            this.log('warning', 'assessment', `acute-stroke-activation-refused-${this.currentTick}`,
              'The stroke system has already been activated.');
            break;
          }
          this.acuteStrokeSystemActivatedAtTick = this.currentTick;
          this.log('critical', 'assessment', `acute-stroke-system-activated-${this.currentTick}`,
            'Stroke-system activation, monitoring, vascular access, laboratory workflow, and parallel noncontrast CT plus CTA workflow were recorded. Team performance, access, specimen collection, transport, and imaging acquisition are not simulated.', { intentOnly: true, lastKnownWellMinutes: 70 });
          break;
        }
        if (this.acuteStrokeSystemActivatedAtTick === null) {
          this.log('warning', 'assessment', `acute-stroke-activation-order-refused-${this.currentTick}`,
            'Activate the stroke system before reviewing the authored imaging and eligibility screen.');
          break;
        }
        if (response === 'review-stroke-imaging-and-eligibility') {
          if (this.acuteStrokeImagingReviewedAtTick !== null) {
            this.log('warning', 'assessment', `acute-stroke-imaging-refused-${this.currentTick}`,
              'The authored imaging and eligibility findings have already been reviewed.');
            break;
          }
          this.acuteStrokeImagingReviewedAtTick = this.currentTick;
          this.log('critical', 'assessment', `acute-stroke-imaging-reviewed-${this.currentTick}`,
            'Authored findings: noncontrast CT shows no intracranial hemorrhage; CTA shows a left M1 large-vessel occlusion. BP is 168/94 mmHg and no thrombolysis contraindication is authored. This fixed screen does not interpret images or adjudicate real eligibility.');
          break;
        }
        if (this.acuteStrokeImagingReviewedAtTick === null) {
          this.log('warning', 'assessment', `acute-stroke-imaging-order-refused-${this.currentTick}`,
            'Review the authored CT, CTA, pressure, and contraindication findings before reperfusion intent.');
          break;
        }
        if (response === 'record-tenecteplase-20-mg-intent') {
          if (this.acuteStrokeTenecteplaseAtTick !== null) {
            this.log('warning', 'drug', `acute-stroke-tenecteplase-refused-${this.currentTick}`,
              'The fixed tenecteplase intent has already been recorded.');
            break;
          }
          this.acuteStrokeTenecteplaseAtTick = this.currentTick;
          this.log('critical', 'drug', `acute-stroke-tenecteplase-${this.currentTick}`,
            'A fixed local-protocol tenecteplase 20 mg IV intent was recorded for this 80 kg patient within 4.5 hours. The 0.25 mg/kg teaching calculation is capped at 25 mg. Preparation, physical delivery, contraindication adjudication, pharmacology, and treatment response are not simulated.',
            { intentOnly: true, drugId: 'tenecteplase', route: 'iv', doseMg: 20, doseMgPerKg: 0.25, weightKg: 80 });
          break;
        }
        if (this.acuteStrokeTenecteplaseAtTick === null) {
          this.log('warning', 'assessment', `acute-stroke-thrombectomy-order-refused-${this.currentTick}`,
            'Record the eligible thrombolysis intent before closing the parallel thrombectomy pathway.');
          break;
        }
        if (response === 'activate-thrombectomy-transfer') {
          if (this.acuteStrokeThrombectomyActivatedAtTick !== null) {
            this.log('warning', 'assessment', `acute-stroke-thrombectomy-refused-${this.currentTick}`,
              'The thrombectomy transfer pathway has already been activated.');
            break;
          }
          this.acuteStrokeThrombectomyActivatedAtTick = this.currentTick;
          this.log('critical', 'assessment', `acute-stroke-thrombectomy-activated-${this.currentTick}`,
            'The endovascular pathway and immediate thrombectomy-capable-center transfer were activated for the authored left M1 occlusion without waiting for thrombolysis response. Transfer, procedure selection, thrombectomy, and reperfusion are not simulated.', { intentOnly: true, occlusion: 'left-m1' });
          break;
        }
        if (this.acuteStrokeThrombectomyActivatedAtTick === null) {
          this.log('warning', 'assessment', `acute-stroke-reassessment-order-refused-${this.currentTick}`,
            'Activate the parallel thrombectomy transfer pathway before reassessment and handoff.');
          break;
        }
        if (this.acuteStrokeReassessedAtTick !== null) {
          this.log('warning', 'assessment', `acute-stroke-reassessment-refused-${this.currentTick}`,
            'The fixed acute-stroke reassessment has already been recorded.');
          break;
        }
        this.acuteStrokeReassessedAtTick = this.currentTick;
        this.log('advisory', 'assessment', `acute-stroke-reassessed-${this.currentTick}`,
          'Fixed surveillance and handoff: airway remains protected, breathing remains spontaneous, BP is 168/94 mmHg, and no overt bleeding is authored. Deficits are not re-scored and no treatment response is claimed. Last-known-well, activation, imaging, thrombolysis-intent, and transfer clocks accompany the thrombectomy handoff.');
        break;
      }
      case 'intracranial-hemorrhage-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'intracranial-hemorrhage-deterioration');
        const valid = ['review-ich-deterioration', 'activate-ich-pathway',
          'review-ich-findings-and-coagulopathy', 'record-warfarin-reversal-intent',
          'record-smooth-ich-pressure-control', 'escalate-ich-neurocritical-care'].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `ich-response-refused-${this.currentTick}`,
            supported ? 'The intracranial-hemorrhage action was not one of the listed choices. Nothing changed.'
              : 'The bounded intracranial-hemorrhage choices are available only in the declared lesson.');
          break;
        }
        if (response === 'review-ich-deterioration') {
          if (this.ichDeteriorationReviewedAtTick !== null) {
            this.log('warning', 'assessment', `ich-review-refused-${this.currentTick}`,
              'The fixed deterioration pattern has already been reviewed.');
            break;
          }
          this.ichDeteriorationReviewedAtTick = this.currentTick;
          this.log('critical', 'assessment', `ich-deterioration-reviewed-${this.currentTick}`,
            'Fixed serial assessment: eye opening and coherent speech have decreased over 15 minutes after sudden headache, vomiting, dysarthria, and left weakness. BP is 202/112 mmHg, glucose is 126 mg/dL, SpO₂ is 96% on room air, breathing is spontaneous, and secretions are currently handled. Airway protection requires continuous reassessment; this screen does not perform an examination or score consciousness.');
          break;
        }
        if (this.ichDeteriorationReviewedAtTick === null) {
          this.log('warning', 'assessment', `ich-order-refused-${this.currentTick}`,
            'Review the serial neurologic change, airway, breathing, circulation, glucose, and pressure first.');
          break;
        }
        if (response === 'activate-ich-pathway') {
          if (this.ichPathwayActivatedAtTick !== null) {
            this.log('warning', 'assessment', `ich-pathway-refused-${this.currentTick}`,
              'The intracranial-hemorrhage pathway has already been activated.');
            break;
          }
          this.ichPathwayActivatedAtTick = this.currentTick;
          this.log('critical', 'assessment', `ich-pathway-activated-${this.currentTick}`,
            'Intracranial-hemorrhage activation, head elevation, nothing-by-mouth status, monitoring, access, laboratory workflow, and airway-equipment readiness were recorded. Physical care, equipment use, access, specimen collection, and team performance are not simulated.', { intentOnly: true });
          break;
        }
        if (this.ichPathwayActivatedAtTick === null) {
          this.log('warning', 'assessment', `ich-pathway-order-refused-${this.currentTick}`,
            'Activate immediate support and the intracranial-hemorrhage pathway before reviewing fixed CT and coagulopathy findings.');
          break;
        }
        if (response === 'review-ich-findings-and-coagulopathy') {
          if (this.ichFindingsReviewedAtTick !== null) {
            this.log('warning', 'assessment', `ich-findings-refused-${this.currentTick}`,
              'The authored hemorrhage and coagulopathy findings have already been reviewed.');
            break;
          }
          this.ichFindingsReviewedAtTick = this.currentTick;
          this.log('critical', 'assessment', `ich-findings-reviewed-${this.currentTick}`,
            'Authored findings: CT shows a 28 mL right thalamic hemorrhage with intraventricular extension and early hydrocephalus, without authored herniation. Warfarin was last taken yesterday evening and INR is 3.2. This fixed screen does not interpret imaging, estimate expansion, or adjudicate a real reversal plan.');
          break;
        }
        if (this.ichFindingsReviewedAtTick === null) {
          this.log('warning', 'assessment', `ich-findings-order-refused-${this.currentTick}`,
            'Review the authored CT, anticoagulant, last-dose timing, and INR before treatment intent.');
          break;
        }
        if (response === 'record-warfarin-reversal-intent') {
          if (this.ichReversalAtTick !== null) {
            this.log('warning', 'drug', `ich-reversal-refused-${this.currentTick}`,
              'The fixed warfarin-reversal intent has already been recorded.');
            break;
          }
          this.ichReversalAtTick = this.currentTick;
          this.log('critical', 'drug', `ich-reversal-${this.currentTick}`,
            'Warfarin was stopped and urgent 4-factor PCC plus IV vitamin K intent was recorded without waiting for another coagulation result. Product selection, patient-specific dosing, preparation, physical delivery, INR response, thrombosis, and hematoma response are not simulated.',
            { intentOnly: true, anticoagulant: 'warfarin', reversal: '4f-pcc-plus-iv-vitamin-k', authoredInr: 3.2 });
          break;
        }
        if (this.ichReversalAtTick === null) {
          this.log('warning', 'assessment', `ich-pressure-order-refused-${this.currentTick}`,
            'Record urgent warfarin-reversal intent before completing the parallel pressure strategy.');
          break;
        }
        if (response === 'record-smooth-ich-pressure-control') {
          if (this.ichPressureControlAtTick !== null) {
            this.log('warning', 'assessment', `ich-pressure-refused-${this.currentTick}`,
              'The bounded pressure-control intent has already been recorded.');
            break;
          }
          this.ichPressureControlAtTick = this.currentTick;
          this.log('critical', 'assessment', `ich-pressure-control-${this.currentTick}`,
            'Smooth, sustained systolic pressure control toward 140 mmHg, with a maintenance range of 130–150 mmHg and avoidance of less than 130 mmHg, was recorded for this authored presentation. Agent selection, titration, measurement technique, variability, cerebral perfusion, and individual response are not simulated.',
            { intentOnly: true, targetSystolicMmHg: 140, lowerBoundSystolicMmHg: 130, upperBoundSystolicMmHg: 150 });
          break;
        }
        if (this.ichPressureControlAtTick === null) {
          this.log('warning', 'assessment', `ich-escalation-order-refused-${this.currentTick}`,
            'Record the parallel pressure-control intent before closing the urgent escalation and handoff.');
          break;
        }
        if (this.ichEscalatedAtTick !== null) {
          this.log('warning', 'assessment', `ich-escalation-refused-${this.currentTick}`,
            'The neurocritical and neurosurgical escalation has already been recorded.');
          break;
        }
        this.ichEscalatedAtTick = this.currentTick;
        this.log('advisory', 'assessment', `ich-escalated-${this.currentTick}`,
          'Immediate transfer to neurocritical and neurosurgical capability was activated for worsening alertness, intraventricular extension, and early hydrocephalus. Fixed handoff includes symptom onset, 15-minute deterioration, airway surveillance, CT, warfarin timing, INR, reversal intent, and pressure plan. Airway intervention, ventricular drainage, surgery, expansion, complications, disposition, and outcome remain outside this lesson.', { intentOnly: true });
        break;
      }
      case 'diabetic-ketoacidosis-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'diabetic-ketoacidosis');
        const valid = ['review-dka-presentation', 'record-dka-fluids-and-monitoring',
          'record-dka-potassium-replacement', 'record-dka-insulin-intent',
          'add-dextrose-and-continue-insulin', 'confirm-dka-resolution-and-transition'].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `dka-response-refused-${this.currentTick}`,
            supported ? 'The DKA action was not one of the listed choices. Nothing changed.'
              : 'The bounded DKA choices are available only in the declared lesson.');
          break;
        }
        if (response === 'review-dka-presentation') {
          if (this.dkaPresentationReviewedAtTick !== null) {
            this.log('warning', 'assessment', `dka-review-refused-${this.currentTick}`,
              'The fixed DKA presentation has already been reviewed.');
            break;
          }
          this.dkaPresentationReviewedAtTick = this.currentTick;
          this.log('critical', 'assessment', `dka-reviewed-${this.currentTick}`,
            'Fixed assessment: type 1 diabetes and glucose 486 mg/dL, β-hydroxybutyrate 5.4 mmol/L, venous pH 7.16, and bicarbonate 11 mmol/L establish moderate DKA. The patient is alert, dehydrated, and breathing deeply. Potassium is 3.2 mmol/L, and a kinked infusion set is the authored precipitant. No infection or mixed HHS is authored.');
          break;
        }
        if (this.dkaPresentationReviewedAtTick === null) {
          this.log('warning', 'assessment', `dka-order-refused-${this.currentTick}`,
            'Review diabetes or hyperglycemia, ketones, acidosis, severity, potassium, volume status, and precipitants first.');
          break;
        }
        if (response === 'record-dka-fluids-and-monitoring') {
          if (this.dkaFluidsAtTick !== null) {
            this.log('warning', 'equipment', `dka-fluids-refused-${this.currentTick}`,
              'The initial DKA fluid and monitoring intent has already been recorded.');
            break;
          }
          this.dkaFluidsAtTick = this.currentTick;
          this.log('critical', 'equipment', `dka-fluids-${this.currentTick}`,
            'Initial isotonic crystalloid, cardiac and vital-sign monitoring, access, urine-output observation, hourly glucose, and 4-hour electrolyte, creatinine, β-hydroxybutyrate, and venous-pH panels were recorded. Fluid selection, volume, rate, physical delivery, specimens, devices, and patient response are not simulated.', { intentOnly: true });
          break;
        }
        if (this.dkaFluidsAtTick === null) {
          this.log('warning', 'assessment', `dka-fluids-order-refused-${this.currentTick}`,
            'Record initial fluid resuscitation and serial monitoring before electrolyte and insulin intent.');
          break;
        }
        if (response === 'record-dka-potassium-replacement') {
          if (this.dkaPotassiumAtTick !== null) {
            this.log('warning', 'drug', `dka-potassium-refused-${this.currentTick}`,
              'The bounded potassium-replacement step has already been recorded.');
            break;
          }
          this.dkaPotassiumAtTick = this.currentTick;
          this.log('critical', 'drug', `dka-potassium-${this.currentTick}`,
            'Potassium replacement and repeat monitoring were recorded while insulin remained withheld at 3.2 mmol/L. Fixed repeat potassium is 3.7 mmol/L, so the insulin gate is now open. Product, dose, concentration, access, infusion rate, physical delivery, ECG response, and individual kinetics are not simulated.', { intentOnly: true, initialPotassiumMmolPerL: 3.2, repeatPotassiumMmolPerL: 3.7 });
          break;
        }
        if (this.dkaPotassiumAtTick === null) {
          this.log('warning', 'assessment', `dka-potassium-order-refused-${this.currentTick}`,
            'Potassium is 3.2 mmol/L. Record replacement and a repeat above 3.5 mmol/L before insulin intent.');
          break;
        }
        if (response === 'record-dka-insulin-intent') {
          if (this.dkaInsulinAtTick !== null) {
            this.log('warning', 'drug', `dka-insulin-refused-${this.currentTick}`,
              'The bounded IV insulin intent has already been recorded.');
            break;
          }
          this.dkaInsulinAtTick = this.currentTick;
          this.log('critical', 'drug', `dka-insulin-${this.currentTick}`,
            'A local-protocol short-acting IV insulin infusion intent was recorded after potassium reached the authored 3.7 mmol/L. Dose selection, preparation, pump programming, delivery, glucose fall, ketone clearance, and potassium shift are not simulated.', { intentOnly: true, route: 'iv', medicationClass: 'short-acting-insulin' });
          break;
        }
        if (this.dkaInsulinAtTick === null) {
          this.log('warning', 'assessment', `dka-dextrose-order-refused-${this.currentTick}`,
            'Record insulin intent only after the potassium gate before reviewing the fixed treatment panel.');
          break;
        }
        if (response === 'add-dextrose-and-continue-insulin') {
          if (this.dkaDextroseAtTick !== null) {
            this.log('warning', 'drug', `dka-dextrose-refused-${this.currentTick}`,
              'The bounded dextrose-plus-insulin continuation has already been recorded.');
            break;
          }
          this.dkaDextroseAtTick = this.currentTick;
          this.log('critical', 'drug', `dka-dextrose-${this.currentTick}`,
            'Fixed interval panel: glucose 238 mg/dL, β-hydroxybutyrate 2.2 mmol/L, venous pH 7.24, bicarbonate 15 mmol/L, and potassium 4.1 mmol/L. Dextrose-containing fluid and continued protocol-guided insulin intent were recorded because glucose improved before ketoacidosis resolved. Fluid concentration, insulin rate, delivery, and kinetics are not simulated.', { intentOnly: true, glucoseMgPerDl: 238, betaHydroxybutyrateMmolPerL: 2.2, venousPh: 7.24, bicarbonateMmolPerL: 15, potassiumMmolPerL: 4.1 });
          break;
        }
        if (this.dkaDextroseAtTick === null) {
          this.log('warning', 'assessment', `dka-transition-order-refused-${this.currentTick}`,
            'Add dextrose and continue insulin through the unresolved fixed panel before transition.');
          break;
        }
        if (this.dkaTransitionAtTick !== null) {
          this.log('warning', 'assessment', `dka-transition-refused-${this.currentTick}`,
            'The fixed DKA resolution and transition have already been reviewed.');
          break;
        }
        this.dkaTransitionAtTick = this.currentTick;
        this.log('advisory', 'assessment', `dka-transition-${this.currentTick}`,
          'Fixed resolution panel: glucose 186 mg/dL, β-hydroxybutyrate 0.4 mmol/L, venous pH 7.32, bicarbonate 19 mmol/L, and potassium 4.0 mmol/L. Plasma ketone plus pH or bicarbonate criteria are met; anion gap and urine ketones were not used alone. Protocol-guided subcutaneous insulin overlap, replacement of the failed infusion set, sick-day education, supply access, and follow-up were recorded for handoff. Dosing, delivery, device testing, disposition, recurrence, and outcome are not simulated.', { intentOnly: true, glucoseMgPerDl: 186, betaHydroxybutyrateMmolPerL: 0.4, venousPh: 7.32, bicarbonateMmolPerL: 19, potassiumMmolPerL: 4.0 });
        break;
      }
      case 'hyperkalemia-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'hyperkalemia-with-ecg-change');
        const valid = ['review-hyperkalemia-pattern', 'record-hyperkalemia-calcium-intent',
          'review-hyperkalemia-post-calcium-ecg',
          'record-hyperkalemia-insulin-glucose', 'record-hyperkalemia-beta-agonist',
          'record-hyperkalemia-removal-and-cause-control', 'reassess-hyperkalemia'].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `hyperkalemia-response-refused-${this.currentTick}`,
            supported ? 'The hyperkalemia action was not one of the listed choices. Nothing changed.'
              : 'The bounded hyperkalemia choices are available only in the declared lesson.');
          break;
        }
        if (response === 'review-hyperkalemia-pattern') {
          if (this.hyperkalemiaPatternReviewedAtTick !== null) {
            this.log('warning', 'assessment', `hyperkalemia-review-refused-${this.currentTick}`,
              'The fixed hyperkalemia pattern has already been reviewed.');
            break;
          }
          this.hyperkalemiaPatternReviewedAtTick = this.currentTick;
          this.log('critical', 'assessment', `hyperkalemia-reviewed-${this.currentTick}`,
            'Fixed review: a nonhemolyzed repeat potassium is 7.1 mmol/L with bradycardia, peaked T waves, P-wave flattening, and QRS 140 ms. The patient has stage 4 CKD, dehydration, lisinopril exposure, and a new trimethoprim course. Glucose is 108 mg/dL; no arrest is authored. This screen does not acquire labs or interpret a real ECG.');
          break;
        }
        if (this.hyperkalemiaPatternReviewedAtTick === null) {
          this.log('warning', 'assessment', `hyperkalemia-order-refused-${this.currentTick}`,
            'Review ABCDE, the confirmed potassium, ECG toxicity, glucose, renal function, and drivers first.');
          break;
        }
        if (response === 'record-hyperkalemia-calcium-intent') {
          if (this.hyperkalemiaCalciumAtTick !== null) {
            this.log('warning', 'drug', `hyperkalemia-calcium-refused-${this.currentTick}`,
              'The bounded calcium-salt intent has already been recorded.');
            break;
          }
          this.hyperkalemiaCalciumAtTick = this.currentTick;
          this.log('critical', 'drug', `hyperkalemia-calcium-${this.currentTick}`,
            'Immediate local-protocol IV calcium-salt intent was recorded for ECG toxicity. Calcium can stabilize the myocardium but does not remove or shift potassium. Salt selection, dose, access, delivery, repeat dosing, and individual response are not simulated; this intent click does not change the ECG or potassium.', { intentOnly: true, potassiumMmolPerL: 7.1, treatmentDeliveredByLearner: false, ecgChanged: false });
          break;
        }
        if (this.hyperkalemiaCalciumAtTick === null) {
          this.log('warning', 'assessment', `hyperkalemia-calcium-order-refused-${this.currentTick}`,
            'Protect the myocardium for the authored ECG toxicity before recording potassium-shifting intent.');
          break;
        }
        if (response === 'review-hyperkalemia-post-calcium-ecg') {
          if (this.hyperkalemiaPostCalciumEcgAtTick !== null) {
            this.log('warning', 'assessment', `hyperkalemia-post-calcium-refused-${this.currentTick}`,
              'The authored post-team ECG report has already been reviewed.');
            break;
          }
          if (this.currentTick <= this.hyperkalemiaCalciumAtTick) {
            this.log('warning', 'assessment', `hyperkalemia-post-calcium-time-refused-${this.currentTick}`,
              'Allow a later simulated tick before reviewing the treating-team response. Intent alone does not change conduction.');
            break;
          }
          this.hyperkalemiaPostCalciumEcgAtTick = this.currentTick;
          this.log('critical', 'assessment', `hyperkalemia-post-calcium-ecg-${this.currentTick}`,
            'Fixed later treating-team report after delivered local-protocol care: HR 62/min, visible P waves, QRS 104 ms, and less prominent T waves. Potassium remains 7.1 mmol/L. ECG improvement is an authored response, not learner delivery, biochemical resolution, or proof of one cause.', { potassiumMmolPerL: 7.1, repeatQrsMs: 104, treatmentDeliveredByLearner: false });
          break;
        }
        if (response === 'record-hyperkalemia-insulin-glucose') {
          if (this.hyperkalemiaInsulinGlucoseAtTick !== null) {
            this.log('warning', 'drug', `hyperkalemia-insulin-refused-${this.currentTick}`,
              'The bounded insulin-glucose intent has already been recorded.');
            break;
          }
          this.hyperkalemiaInsulinGlucoseAtTick = this.currentTick;
          this.log('critical', 'drug', `hyperkalemia-insulin-glucose-${this.currentTick}`,
            'Local-protocol IV insulin-glucose intent was recorded with baseline and structured post-treatment glucose surveillance. Dose, glucose formulation, infusion, potassium shift, hypoglycemia, and rescue are not simulated.', { intentOnly: true, baselineGlucoseMgPerDl: 108 });
          break;
        }
        if (response === 'record-hyperkalemia-beta-agonist') {
          if (this.hyperkalemiaBetaAgonistAtTick !== null) {
            this.log('warning', 'drug', `hyperkalemia-beta-agonist-refused-${this.currentTick}`,
              'The bounded beta-2 agonist intent has already been recorded.');
            break;
          }
          this.hyperkalemiaBetaAgonistAtTick = this.currentTick;
          this.log('critical', 'drug', `hyperkalemia-beta-agonist-${this.currentTick}`,
            'Adjunct nebulized beta-2 agonist intent was recorded as one temporary shifting lane, not as sole therapy. Agent, dose, delivery, response variability, and adverse effects are not simulated.', { intentOnly: true });
          break;
        }
        if (response === 'record-hyperkalemia-removal-and-cause-control') {
          if (this.hyperkalemiaRemovalAtTick !== null) {
            this.log('warning', 'assessment', `hyperkalemia-removal-refused-${this.currentTick}`,
              'The potassium-removal and cause-control plan has already been recorded.');
            break;
          }
          this.hyperkalemiaRemovalAtTick = this.currentTick;
          this.log('critical', 'assessment', `hyperkalemia-removal-${this.currentTick}`,
            'Lisinopril and trimethoprim were held; dehydration and kidney injury evaluation, renal consultation, local potassium-removal strategy, and urgent dialysis contingency for refractory severe hyperkalemia were recorded. Binder, diuretic, fluid, and dialysis selection or delivery are not simulated.', { intentOnly: true });
          break;
        }
        if (this.hyperkalemiaPostCalciumEcgAtTick === null
          || this.hyperkalemiaInsulinGlucoseAtTick === null
          || this.hyperkalemiaBetaAgonistAtTick === null
          || this.hyperkalemiaRemovalAtTick === null) {
          this.log('warning', 'assessment', `hyperkalemia-reassessment-order-refused-${this.currentTick}`,
            'Review the post-team ECG and complete both shifting lanes plus removal and cause control before final reassessment.');
          break;
        }
        if (this.currentTick <= Math.max(this.hyperkalemiaPostCalciumEcgAtTick,
          this.hyperkalemiaInsulinGlucoseAtTick, this.hyperkalemiaBetaAgonistAtTick,
          this.hyperkalemiaRemovalAtTick)) {
          this.log('warning', 'assessment', `hyperkalemia-reassessment-time-refused-${this.currentTick}`,
            'Allow a later simulated tick before reviewing the authored 1-hour potassium, glucose, and ECG panel.');
          break;
        }
        if (this.hyperkalemiaReassessedAtTick !== null) {
          this.log('warning', 'assessment', `hyperkalemia-reassessment-refused-${this.currentTick}`,
            'The fixed hyperkalemia reassessment has already been recorded.');
          break;
        }
        this.hyperkalemiaReassessedAtTick = this.currentTick;
        this.log('advisory', 'assessment', `hyperkalemia-reassessed-${this.currentTick}`,
          'Fixed 1-hour reassessment: potassium 5.8 mmol/L, glucose 92 mg/dL, HR 68/min, visible P waves, QRS 98 ms, and no new instability. Severe toxicity improved, but CKD and temporary shifting create rebound risk. Continued ECG, potassium, glucose, renal, removal, and recurrence surveillance were handed off; dialysis, later course, disposition, and outcome are outside this lesson.', { potassiumMmolPerL: 5.8, glucoseMgPerDl: 92, qrsMs: 98 });
        break;
      }
      case 'hyponatremia-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'severe-hyponatremia-with-seizure');
        const valid = ['review-hyponatremia-pattern', 'record-hyponatremia-stabilization',
          'record-hypertonic-saline-intent', 'reassess-hyponatremia-first-hour',
          'record-hyponatremia-guardrails-and-cause-plan'].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `hyponatremia-response-refused-${this.currentTick}`,
            supported ? 'The hyponatremia action was not one of the listed choices. Nothing changed.'
              : 'The bounded hyponatremia choices are available only in the declared lesson.');
          break;
        }
        if (response === 'review-hyponatremia-pattern') {
          if (this.hyponatremiaPatternReviewedAtTick !== null) {
            this.log('warning', 'assessment', `hyponatremia-review-refused-${this.currentTick}`,
              'The fixed severe symptomatic hyponatremia pattern has already been reviewed.');
            break;
          }
          this.hyponatremiaPatternReviewedAtTick = this.currentTick;
          this.log('critical', 'assessment', `hyponatremia-reviewed-${this.currentTick}`,
            'Fixed review: a witnessed generalized seizure has stopped, but deep somnolence persists with repeat sodium 112 mmol/L, glucose 96 mg/dL, and measured serum osmolality 238 mOsm/kg. No ongoing convulsion, trauma, hyperglycemia, or exogenous osmole is authored. This screen does not examine the patient, validate samples, or interpret real laboratory data.');
          break;
        }
        if (this.hyponatremiaPatternReviewedAtTick === null) {
          this.log('warning', 'assessment', `hyponatremia-order-refused-${this.currentTick}`,
            'Review the fixed neurologic state, sodium, glucose, osmolality, and immediate exclusions first.');
          break;
        }
        if (response === 'record-hyponatremia-stabilization') {
          if (this.hyponatremiaStabilizedAtTick !== null) {
            this.log('warning', 'assessment', `hyponatremia-stabilization-refused-${this.currentTick}`,
              'The bounded stabilization and escalation bundle has already been recorded.');
            break;
          }
          this.hyponatremiaStabilizedAtTick = this.currentTick;
          this.log('critical', 'assessment', `hyponatremia-stabilized-${this.currentTick}`,
            'Injury protection, airway and breathing support, oxygen and suction readiness, continuous monitoring, vascular access, point-of-care glucose review, and critical-care plus endocrine or renal help were recorded in parallel. Examination, equipment use, access, testing, airway care, and team performance are not simulated.', { intentOnly: true });
          break;
        }
        if (this.hyponatremiaStabilizedAtTick === null) {
          this.log('warning', 'assessment', `hyponatremia-stabilization-order-refused-${this.currentTick}`,
            'Record parallel stabilization, monitoring, access, glucose review, and expert escalation before sodium-directed intent.');
          break;
        }
        if (response === 'record-hypertonic-saline-intent') {
          if (this.hyponatremiaHypertonicAtTick !== null) {
            this.log('warning', 'drug', `hyponatremia-hypertonic-refused-${this.currentTick}`,
              'The bounded hypertonic-saline intent has already been recorded.');
            break;
          }
          this.hyponatremiaHypertonicAtTick = this.currentTick;
          this.log('critical', 'drug', `hyponatremia-hypertonic-${this.currentTick}`,
            'Immediate local-protocol intermittent hypertonic-saline bolus intent was recorded in a close-monitoring environment, with a first-hour 5 mmol/L rise target and repeat neurologic and sodium review. Concentration, bolus volume, access, preparation, delivery, sodium kinetics, and individual response are not simulated.', { intentOnly: true, initialSodiumMmolPerL: 112, firstHourTargetRiseMmolPerL: 5 });
          break;
        }
        if (this.hyponatremiaHypertonicAtTick === null) {
          this.log('warning', 'assessment', `hyponatremia-hypertonic-order-refused-${this.currentTick}`,
            'Record immediate symptom-led hypertonic-saline intent before the authored first-hour reassessment.');
          break;
        }
        if (response === 'reassess-hyponatremia-first-hour') {
          if (this.hyponatremiaReassessedAtTick !== null) {
            this.log('warning', 'assessment', `hyponatremia-reassessment-refused-${this.currentTick}`,
              'The fixed first-hour hyponatremia reassessment has already been reviewed.');
            break;
          }
          this.hyponatremiaReassessedAtTick = this.currentTick;
          this.log('advisory', 'assessment', `hyponatremia-reassessed-${this.currentTick}`,
            'Fixed first-hour panel: sodium 117 mmol/L, a 5 mmol/L rise; the patient opens her eyes, answers simple questions with residual confusion, breathes spontaneously, and has no recurrent seizure. Urine output has risen from 35 to 180 mL/h, a warning that correction could accelerate. These are authored findings, not a predicted response.', { sodiumMmolPerL: 117, sodiumRiseMmolPerL: 5, urineOutputMlPerHour: 180 });
          break;
        }
        if (this.hyponatremiaReassessedAtTick === null) {
          this.log('warning', 'assessment', `hyponatremia-guardrails-order-refused-${this.currentTick}`,
            'Review the fixed first-hour neurologic, sodium, and urine-output response before closing the rescue phase.');
          break;
        }
        if (this.hyponatremiaGuardrailsAtTick !== null) {
          this.log('warning', 'assessment', `hyponatremia-guardrails-refused-${this.currentTick}`,
            'The correction guardrails and cause plan have already been recorded.');
          break;
        }
        this.hyponatremiaGuardrailsAtTick = this.currentTick;
        this.log('critical', 'assessment', `hyponatremia-guardrails-${this.currentTick}`,
          'Hypertonic-saline intent was stopped after neurologic improvement and a 5 mmol/L rise. A maximum total rise of 10 mmol/L in the first 24 hours and 8 mmol/L per 24 hours thereafter, serial sodium and urine-output review, chlorthalidone hold, paired serum and urine cause evaluation, thyroid and adrenal review, and a specialist plan to halt or reverse overcorrection were handed off. Testing, diagnosis, fluid selection, desmopressin or free-water treatment, later course, disposition, and outcome are outside this lesson.', { intentOnly: true, firstDayMaximumRiseMmolPerL: 10, laterDailyMaximumRiseMmolPerL: 8 });
        break;
      }
      case 'opioid-toxicity-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'opioid-toxicity');
        const valid = ['review-opioid-toxicity-pattern', 'record-opioid-ventilation-support',
          'record-opioid-naloxone-intent', 'reassess-opioid-initial-response',
          'review-opioid-recurrence', 'record-opioid-recurrence-and-safety-plan'].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `opioid-toxicity-response-refused-${this.currentTick}`,
            supported ? 'The opioid-toxicity action was not one of the listed choices. Nothing changed.'
              : 'The bounded opioid-toxicity choices are available only in the declared lesson.');
          break;
        }
        if (response === 'review-opioid-toxicity-pattern') {
          if (this.opioidPatternReviewedAtTick !== null) {
            this.log('warning', 'assessment', `opioid-toxicity-review-refused-${this.currentTick}`,
              'The fixed opioid-toxicity pattern has already been reviewed.');
            break;
          }
          this.opioidPatternReviewedAtTick = this.currentTick;
          this.log('critical', 'assessment', `opioid-toxicity-reviewed-${this.currentTick}`,
            'Fixed review: the patient is unresponsive with a definite pulse 58/min, respirations 4/min, SpO₂ 78%, end-tidal CO₂ 68 mmHg, pinpoint pupils, glucose 102 mg/dL, and a reported fentanyl exposure. No trauma, focal deficit, seizure, or arrest is authored; co-exposure remains possible. This screen does not examine the patient, confirm a pulse, or acquire real monitor or laboratory data.');
          break;
        }
        if (this.opioidPatternReviewedAtTick === null) {
          this.log('warning', 'assessment', `opioid-toxicity-order-refused-${this.currentTick}`,
            'Review responsiveness, pulse, breathing, oxygenation, carbon dioxide, glucose, exposure, and immediate mimics first.');
          break;
        }
        if (response === 'record-opioid-ventilation-support') {
          if (this.opioidVentilationAtTick !== null) {
            this.log('warning', 'assessment', `opioid-ventilation-refused-${this.currentTick}`,
              'The bounded airway, breathing, and escalation bundle has already been recorded.');
            break;
          }
          this.opioidVentilationAtTick = this.currentTick;
          this.log('critical', 'assessment', `opioid-ventilation-${this.currentTick}`,
            'Emergency response activation, airway opening, oxygen, effective bag-mask ventilation, continuous cardiorespiratory monitoring, vascular access, and glucose review were recorded immediately. Airway maneuvers, ventilation quality, oxygen delivery, access, testing, and team performance are not simulated.', { intentOnly: true });
          break;
        }
        if (this.opioidVentilationAtTick === null) {
          this.log('warning', 'assessment', `opioid-ventilation-order-refused-${this.currentTick}`,
            'Support airway and breathing immediately rather than waiting for an opioid antagonist to work.');
          break;
        }
        if (response === 'record-opioid-naloxone-intent') {
          if (this.opioidAntagonistAtTick !== null) {
            this.log('warning', 'drug', `opioid-naloxone-refused-${this.currentTick}`,
              'The bounded naloxone intent has already been recorded.');
            break;
          }
          this.opioidAntagonistAtTick = this.currentTick;
          this.log('critical', 'drug', `opioid-naloxone-${this.currentTick}`,
            'Local-protocol naloxone intent was recorded while ventilation continued, titrated toward normal spontaneous breathing and protective airway reflexes rather than mandatory full arousal. Product, route, dose, access, delivery, pharmacology, withdrawal, and individual response are not simulated.', { intentOnly: true });
          break;
        }
        if (this.opioidAntagonistAtTick === null) {
          this.log('warning', 'assessment', `opioid-naloxone-order-refused-${this.currentTick}`,
            'Record ventilation plus local-protocol naloxone intent before reviewing the authored response.');
          break;
        }
        if (response === 'reassess-opioid-initial-response') {
          if (this.opioidInitialReassessmentAtTick !== null) {
            this.log('warning', 'assessment', `opioid-initial-reassessment-refused-${this.currentTick}`,
              'The fixed initial opioid-toxicity reassessment has already been reviewed.');
            break;
          }
          this.opioidInitialReassessmentAtTick = this.currentTick;
          this.log('advisory', 'assessment', `opioid-initial-reassessed-${this.currentTick}`,
            'Fixed initial response: spontaneous respirations 14/min, SpO₂ 97% with oxygen, end-tidal CO₂ 43 mmHg, pulse 72/min, and response to voice with persistent drowsiness. No severe withdrawal is authored. Ventilation adequacy, not full wakefulness, is the immediate endpoint; this panel is not an individual prediction.', { respiratoryRatePerMin: 14, spo2Percent: 97, etco2MmHg: 43, pulsePerMin: 72 });
          break;
        }
        if (this.opioidInitialReassessmentAtTick === null) {
          this.log('warning', 'assessment', `opioid-recurrence-order-refused-${this.currentTick}`,
            'Review the fixed initial breathing and responsiveness panel before advancing the observation clock.');
          break;
        }
        if (response === 'review-opioid-recurrence') {
          if (this.opioidRecurrenceReviewedAtTick !== null) {
            this.log('warning', 'assessment', `opioid-recurrence-review-refused-${this.currentTick}`,
              'The fixed recurrent respiratory-depression panel has already been reviewed.');
            break;
          }
          this.opioidRecurrenceReviewedAtTick = this.currentTick;
          this.log('critical', 'assessment', `opioid-recurrence-reviewed-${this.currentTick}`,
            'Fixed 25-minute observation panel: respirations have fallen to 7/min, SpO₂ to 90% with oxygen, end-tidal CO₂ has risen to 58 mmHg, drowsiness has deepened, and a pulse remains present at 64/min. Recurrent respiratory depression is authored to teach that opioid effect can outlast naloxone.', { respiratoryRatePerMin: 7, spo2Percent: 90, etco2MmHg: 58, pulsePerMin: 64 });
          break;
        }
        if (this.opioidRecurrenceReviewedAtTick === null) {
          this.log('warning', 'assessment', `opioid-recurrence-plan-order-refused-${this.currentTick}`,
            'Recognize the fixed recurrent respiratory depression before recording renewed rescue and observation.');
          break;
        }
        if (this.opioidRecurrencePlanAtTick !== null) {
          this.log('warning', 'assessment', `opioid-recurrence-plan-refused-${this.currentTick}`,
            'The recurrent-depression response and safety plan have already been recorded.');
          break;
        }
        this.opioidRecurrencePlanAtTick = this.currentTick;
        this.log('critical', 'assessment', `opioid-recurrence-plan-${this.currentTick}`,
          'Renewed airway and ventilation support, repeat local-protocol naloxone intent, prolonged-antagonist and higher-acuity escalation contingencies, co-exposure and complication evaluation, and monitored observation until recurrence risk is low with normal consciousness and vital signs were recorded. Naloxone supply plus use-instruction intent and treatment linkage were added to the eventual discharge handoff. Delivery, later response, observation duration, counseling, dispensing, disposition, and outcome are outside this lesson.', { intentOnly: true });
        break;
      }
      case 'heat-stroke-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'exertional-heat-stroke');
        const valid = ['review-heat-stroke-pattern', 'record-heat-stroke-support',
          'record-cold-water-immersion', 'reassess-heat-stroke-cooling-target',
          'record-heat-stroke-organ-surveillance'].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `heat-stroke-response-refused-${this.currentTick}`,
            supported ? 'The heat-stroke action was not one of the listed choices. Nothing changed.'
              : 'The bounded heat-stroke choices are available only in the declared lesson.');
          break;
        }
        if (response === 'review-heat-stroke-pattern') {
          if (this.heatStrokePatternReviewedAtTick !== null) {
            this.log('warning', 'assessment', `heat-stroke-review-refused-${this.currentTick}`,
              'The fixed exertional-heat-stroke pattern has already been reviewed.');
            break;
          }
          this.heatStrokePatternReviewedAtTick = this.currentTick;
          this.log('critical', 'assessment', `heat-stroke-reviewed-${this.currentTick}`,
            'Fixed review: exertional collapse is accompanied by agitation, confusion, incoherent speech, rectal core temperature 41.3°C, HR 146/min, BP 92/54 mmHg, glucose 110 mg/dL, and sodium 139 mmol/L. No trauma, seizure, focal deficit, infection, stimulant exposure, or rigidity is authored. This screen does not examine the patient, measure temperature, test blood, or exclude real mimics.');
          break;
        }
        if (this.heatStrokePatternReviewedAtTick === null) {
          this.log('warning', 'assessment', `heat-stroke-order-refused-${this.currentTick}`,
            'Review exertion, CNS dysfunction, rectal core temperature, ABCs, glucose, sodium, trauma, medications, and immediate mimics first.');
          break;
        }
        if (response === 'record-heat-stroke-support') {
          if (this.heatStrokeSupportAtTick !== null) {
            this.log('warning', 'assessment', `heat-stroke-support-refused-${this.currentTick}`,
              'The bounded heat-stroke support bundle has already been recorded.');
            break;
          }
          this.heatStrokeSupportAtTick = this.currentTick;
          this.log('critical', 'assessment', `heat-stroke-supported-${this.currentTick}`,
            'Emergency response activation, ABC support, continuous monitoring, glucose review, removal of insulating clothing, cooling-team preparation, airway access, and transport coordination were recorded without delaying active cooling. Examination, equipment, airway care, monitoring, and team performance are not simulated.', { intentOnly: true });
          break;
        }
        if (this.heatStrokeSupportAtTick === null) {
          this.log('warning', 'assessment', `heat-stroke-support-order-refused-${this.currentTick}`,
            'Record parallel support and prepare a safe rapid-cooling path before immersion intent.');
          break;
        }
        if (response === 'record-cold-water-immersion') {
          if (this.heatStrokeCoolingAtTick !== null) {
            this.log('warning', 'assessment', `heat-stroke-cooling-refused-${this.currentTick}`,
              'The bounded cold-water-immersion intent has already been recorded.');
            break;
          }
          this.heatStrokeCoolingAtTick = this.currentTick;
          this.log('critical', 'assessment', `heat-stroke-cooling-${this.currentTick}`,
            'Immediate whole-body cold-water-immersion intent was recorded with continuous rectal core-temperature monitoring, maintained airway access, and cooling-centered transport coordination. Setup, water temperature, immersion technique, cooling rate, airway safety, transport, and individual response are not simulated.', { intentOnly: true, initialCoreTemperatureC: 41.3, stopBelowC: 39 });
          break;
        }
        if (this.heatStrokeCoolingAtTick === null) {
          this.log('warning', 'assessment', `heat-stroke-cooling-order-refused-${this.currentTick}`,
            'Record rapid whole-body cooling before reviewing the authored target panel.');
          break;
        }
        if (response === 'reassess-heat-stroke-cooling-target') {
          if (this.heatStrokeTargetAtTick !== null) {
            this.log('warning', 'assessment', `heat-stroke-target-refused-${this.currentTick}`,
              'The fixed heat-stroke cooling target has already been reviewed.');
            break;
          }
          this.heatStrokeTargetAtTick = this.currentTick;
          this.log('advisory', 'assessment', `heat-stroke-target-${this.currentTick}`,
            'Fixed 14-minute cooling panel: rectal core temperature 38.9°C, HR 118/min, BP 104/62 mmHg, and coherent short answers with residual fatigue. Active cooling was stopped below 39°C to limit overshoot. These are authored findings, not a modeled cooling rate or individual prediction.', { coreTemperatureC: 38.9, elapsedMinutes: 14, heartRatePerMin: 118 });
          break;
        }
        if (this.heatStrokeTargetAtTick === null) {
          this.log('warning', 'assessment', `heat-stroke-surveillance-order-refused-${this.currentTick}`,
            'Review and stop at the fixed cooling target before closing the thermal rescue phase.');
          break;
        }
        if (this.heatStrokeSurveillanceAtTick !== null) {
          this.log('warning', 'assessment', `heat-stroke-surveillance-refused-${this.currentTick}`,
            'The heat-stroke organ-injury surveillance plan has already been recorded.');
          break;
        }
        this.heatStrokeSurveillanceAtTick = this.currentTick;
        this.log('critical', 'assessment', `heat-stroke-surveillance-${this.currentTick}`,
          'Critical-care handoff recorded serial neurologic, renal, hepatic, coagulation, creatine-kinase, electrolyte, glucose, urine-output, and temperature surveillance with supportive complication management. Antipyretics and dantrolene were explicitly excluded because heat stroke is hyperthermia, not a raised hypothalamic set point or malignant hyperthermia. Tests, fluids, procedures, later injury, disposition, recovery, and outcome are outside this lesson.', { intentOnly: true });
        break;
      }
      case 'trauma-primary-survey-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'trauma-primary-survey');
        const valid = ['activate-trauma-primary-survey', 'control-trauma-catastrophic-hemorrhage',
          'review-trauma-airway-and-breathing', 'record-trauma-circulation-response',
          'review-trauma-disability-and-exposure', 'repeat-trauma-primary-survey'].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `trauma-primary-survey-response-refused-${this.currentTick}`,
            supported ? 'The trauma-primary-survey action was not one of the listed choices. Nothing changed.'
              : 'The bounded trauma-primary-survey choices are available only in the declared lesson.');
          break;
        }
        if (response === 'activate-trauma-primary-survey') {
          if (this.traumaActivatedAtTick !== null) {
            this.log('warning', 'assessment', `trauma-activation-refused-${this.currentTick}`,
              'The structured trauma handoff and response have already been activated.');
            break;
          }
          this.traumaActivatedAtTick = this.currentTick;
          this.log('critical', 'assessment', `trauma-activated-${this.currentTick}`,
            'The 35-minute high-energy mechanism, suspected injuries, vital signs, failed direct pressure, treatment so far, and arrival needs were received. Trauma and major-hemorrhage responses were activated with an explicit <C>ABCDE sequence and repeat-survey plan. Team activation, leadership, communication, and handoff performance are not simulated.', { intentOnly: true });
          break;
        }
        if (this.traumaActivatedAtTick === null) {
          this.log('warning', 'assessment', `trauma-activation-order-refused-${this.currentTick}`,
            'Receive the structured handoff, activate the trauma response, and declare the survey order first.');
          break;
        }
        if (response === 'control-trauma-catastrophic-hemorrhage') {
          if (this.traumaCatastrophicHemorrhageAtTick !== null) {
            this.log('warning', 'assessment', `trauma-hemorrhage-refused-${this.currentTick}`,
              'The bounded catastrophic-hemorrhage control intent has already been recorded.');
            break;
          }
          this.traumaCatastrophicHemorrhageAtTick = this.currentTick;
          this.log('critical', 'assessment', `trauma-hemorrhage-controlled-${this.currentTick}`,
            'After failed direct pressure, local-protocol tourniquet intent proximal to the life-threatening left lower-leg hemorrhage was recorded with application time and distal-limb handoff. Fixed review reports no ongoing visible external flow. Pressure, placement, tightening, device selection, limb assessment, pain, and tissue outcome are not simulated.', { intentOnly: true });
          break;
        }
        if (this.traumaCatastrophicHemorrhageAtTick === null) {
          this.log('warning', 'assessment', `trauma-hemorrhage-order-refused-${this.currentTick}`,
            'Control the authored catastrophic external hemorrhage before continuing the survey.');
          break;
        }
        if (response === 'review-trauma-airway-and-breathing') {
          if (this.traumaAirwayBreathingAtTick !== null) {
            this.log('warning', 'assessment', `trauma-airway-breathing-refused-${this.currentTick}`,
              'The fixed trauma airway-and-breathing panel has already been reviewed.');
            break;
          }
          this.traumaAirwayBreathingAtTick = this.currentTick;
          this.log('advisory', 'assessment', `trauma-airway-breathing-reviewed-${this.currentTick}`,
            'Fixed A and B review: the patient still speaks coherently with a currently patent airway under in-line spinal-motion precautions; RR 26/min, SpO₂ 96% with oxygen, bilateral breath sounds and chest movement remain present, and no severe respiratory compromise or tension pattern is authored. Examination, spinal protection, oxygen delivery, and airway or chest procedures are not simulated.', { spo2Percent: 96, respiratoryRatePerMin: 26 });
          break;
        }
        if (this.traumaAirwayBreathingAtTick === null) {
          this.log('warning', 'assessment', `trauma-airway-breathing-order-refused-${this.currentTick}`,
            'Review airway with spinal-motion precautions and breathing before the circulation path.');
          break;
        }
        if (response === 'record-trauma-circulation-response') {
          if (this.traumaCirculationAtTick !== null) {
            this.log('warning', 'assessment', `trauma-circulation-refused-${this.currentTick}`,
              'The bounded trauma-circulation response has already been recorded.');
            break;
          }
          this.traumaCirculationAtTick = this.currentTick;
          this.log('critical', 'assessment', `trauma-circulation-${this.currentTick}`,
            'Persistent HR 124/min and BP 88/56 mmHg after external-flow control plus the authored unstable pelvis triggered purpose-made pelvic-binder, warmed blood-component major-hemorrhage, early local-protocol tranexamic-acid, calcium and coagulation surveillance, and immediate definitive-control intent. A fixed minimal eFAST statement shows free fluid in the right upper quadrant; it directs rather than delays surgery or interventional planning and does not exclude other bleeding. Examination, access, product or dose selection, delivery, binder placement, imaging, procedures, and response are not simulated.', { intentOnly: true, heartRatePerMin: 124, systolicBpMmHg: 88 });
          break;
        }
        if (this.traumaCirculationAtTick === null) {
          this.log('warning', 'assessment', `trauma-circulation-order-refused-${this.currentTick}`,
            'Complete the bounded circulation, hemorrhage, and definitive-control path before D and E.');
          break;
        }
        if (response === 'review-trauma-disability-and-exposure') {
          if (this.traumaDisabilityExposureAtTick !== null) {
            this.log('warning', 'assessment', `trauma-disability-exposure-refused-${this.currentTick}`,
              'The fixed disability-and-exposure panel has already been reviewed.');
            break;
          }
          this.traumaDisabilityExposureAtTick = this.currentTick;
          this.log('advisory', 'assessment', `trauma-disability-exposure-reviewed-${this.currentTick}`,
            'Fixed D and E review: the patient is confused but follows commands, pupils are equal, glucose is 118 mg/dL, and no lateralizing deficit is authored. Full exposure and a coordinated posterior-surface review found no second catastrophic external bleed; core temperature remains 35.6°C. Warm environment, blankets, warmed resuscitation, and immediate re-covering were recorded. Examination, log-roll, spinal protection, warming, and occult-injury exclusion are not simulated.', { glucoseMgPerDl: 118, coreTemperatureC: 35.6 });
          break;
        }
        if (this.traumaDisabilityExposureAtTick === null) {
          this.log('warning', 'assessment', `trauma-repeat-order-refused-${this.currentTick}`,
            'Complete disability, glucose, exposure, posterior review, and heat-loss prevention before repeating the survey.');
          break;
        }
        if (this.traumaRepeatedAtTick !== null) {
          this.log('warning', 'assessment', `trauma-repeat-refused-${this.currentTick}`,
            'The fixed repeated trauma survey has already been recorded.');
          break;
        }
        this.traumaRepeatedAtTick = this.currentTick;
        this.log('critical', 'assessment', `trauma-repeated-${this.currentTick}`,
          'Repeated <C>ABCDE: no visible limb rebleeding; airway remains patent with coherent speech; bilateral breathing remains present with SpO₂ 97% on oxygen; HR is 112/min and BP 100/62 mmHg after the authored bounded response; commands are followed; temperature is 35.8°C after heat-loss measures. Persistent abdominal and pelvic concern plus positive eFAST were handed directly to the definitive-control team with times, trends, interventions, and remaining uncertainties. No procedure, transport, later deterioration, disposition, or outcome is simulated.', { heartRatePerMin: 112, systolicBpMmHg: 100, spo2Percent: 97, coreTemperatureC: 35.8 });
        break;
      }
      case 'acute-aortic-syndrome-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'acute-aortic-syndrome');
        const valid = ['review-aortic-initial-pattern', 'repeat-aortic-asymmetry-exam',
          'activate-aortic-pathway', 'record-aortic-anti-impulse-intent',
          'prioritize-aortic-imaging', 'repeat-and-handoff-aortic-evolution'].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `acute-aortic-syndrome-response-refused-${this.currentTick}`,
            supported ? 'The acute-aortic-syndrome action was not one of the listed choices. Nothing changed.'
              : 'The bounded acute-aortic-syndrome choices are available only in the declared lesson.');
          break;
        }
        if (response === 'review-aortic-initial-pattern') {
          if (this.aorticInitialReviewedAtTick !== null) {
            this.log('warning', 'assessment', `aortic-initial-refused-${this.currentTick}`,
              'The incomplete initial presentation has already been reviewed.');
            break;
          }
          this.aorticInitialReviewedAtTick = this.currentTick;
          this.log('advisory', 'assessment', `aortic-initial-reviewed-${this.currentTick}`,
            'Initial synthesis: abrupt severe pain maximal at onset and now between the shoulder blades is a high-risk aortic feature, but bilateral pressures, pulses, perfusion, and neurologic examination are authored as symmetric and the ECG is nondiagnostic. Acute coronary and other dangerous chest-pain causes remain plausible; no diagnosis or default antithrombotic pathway was recorded.', { leftArmSystolicBpMmHg: 198, rightArmSystolicBpMmHg: 194, heartRatePerMin: 104 });
          break;
        }
        if (this.aorticInitialReviewedAtTick === null) {
          this.log('warning', 'assessment', `aortic-initial-order-refused-${this.currentTick}`,
            'Review the incomplete initial pain, ECG, bilateral pressure, pulse, perfusion, and neurologic pattern first.');
          break;
        }
        if (response === 'repeat-aortic-asymmetry-exam') {
          if (this.aorticEvolutionReviewedAtTick !== null) {
            this.log('warning', 'assessment', `aortic-evolution-refused-${this.currentTick}`,
              'The fixed evolving asymmetry panel has already been revealed.');
            break;
          }
          this.aorticEvolutionReviewedAtTick = this.currentTick;
          this.log('critical', 'assessment', `aortic-evolution-reviewed-${this.currentTick}`,
            'Six minutes later the pain migrates toward the abdomen. Repeat fixed findings now show left-arm BP 202/108 mmHg and right-arm BP 166/92 mmHg, a newly weak right radial pulse, a cool left foot with diminished pedal pulse and delayed capillary refill, and new mild left-arm drift with clear speech. Glucose is 112 mg/dL. These multi-territory changes raise urgent malperfusion concern but do not constitute definitive diagnosis.', { leftArmSystolicBpMmHg: 202, rightArmSystolicBpMmHg: 166, pressureDifferenceMmHg: 36, glucoseMgPerDl: 112 });
          break;
        }
        if (this.aorticEvolutionReviewedAtTick === null) {
          this.log('warning', 'assessment', `aortic-evolution-order-refused-${this.currentTick}`,
            'Repeat bilateral pressures, pulses, limb perfusion, and neurologic findings before selecting a pathway.');
          break;
        }
        if (response === 'activate-aortic-pathway') {
          if (this.aorticEscalatedAtTick !== null) {
            this.log('warning', 'assessment', `aortic-escalation-refused-${this.currentTick}`,
              'The multidisciplinary aortic pathway has already been activated.');
            break;
          }
          this.aorticEscalatedAtTick = this.currentTick;
          this.log('critical', 'assessment', `aortic-pathway-activated-${this.currentTick}`,
            'The evolving pain, 36 mmHg inter-arm systolic difference, pulse deficit, limb-perfusion change, and focal neurologic finding triggered immediate multidisciplinary aortic and critical-care escalation. Unsupported routine coronary anticoagulation or thrombolysis and isolated stroke thrombolysis were paused pending urgent definitive evaluation. Consultation, transfer, and treatment eligibility are not simulated.', { intentOnly: true });
          break;
        }
        if (this.aorticEscalatedAtTick === null) {
          this.log('warning', 'assessment', `aortic-escalation-order-refused-${this.currentTick}`,
            'Escalate the evolving multi-territory aortic concern before treatment or imaging workflow.');
          break;
        }
        if (response === 'record-aortic-anti-impulse-intent') {
          if (this.aorticAntiImpulseAtTick !== null) {
            this.log('warning', 'assessment', `aortic-anti-impulse-refused-${this.currentTick}`,
              'The bounded anti-impulse and analgesia intent has already been recorded.');
            break;
          }
          this.aorticAntiImpulseAtTick = this.currentTick;
          this.log('critical', 'assessment', `aortic-anti-impulse-${this.currentTick}`,
            'ICU-level monitoring, arterial-line intent, titrated analgesia, and local-protocol intravenous rate control were recorded before any added vasodilator intent. Targets are HR 60–80/min and SBP below 120 mmHg only if the lowest pressure still preserves end-organ perfusion; evolving brain and limb perfusion make that guardrail explicit. Drug selection, contraindication review, dosing, line placement, delivery, and individual response are not simulated.', { intentOnly: true, targetHeartRateMin: 60, targetHeartRateMax: 80, targetSystolicBpBelowMmHg: 120 });
          break;
        }
        if (this.aorticAntiImpulseAtTick === null) {
          this.log('warning', 'assessment', `aortic-anti-impulse-order-refused-${this.currentTick}`,
            'Record monitored analgesia and rate-first, perfusion-preserving anti-impulse intent before imaging workflow.');
          break;
        }
        if (response === 'prioritize-aortic-imaging') {
          if (this.aorticImagingAtTick !== null) {
            this.log('warning', 'assessment', `aortic-imaging-refused-${this.currentTick}`,
              'Urgent definitive aortic imaging intent has already been recorded.');
            break;
          }
          this.aorticImagingAtTick = this.currentTick;
          this.log('critical', 'assessment', `aortic-imaging-prioritized-${this.currentTick}`,
            'Urgent definitive CT imaging of the aorta and branch vessels was prioritized because the patient remains transportable; TEE or MRI remains a context-dependent alternative when CT is unsuitable. The scan is not yet available. Acquisition, contrast decisions, transport risk, interpretation, classification, and operative choice are outside this lesson.', { intentOnly: true, resultAvailable: false });
          break;
        }
        if (this.aorticImagingAtTick === null) {
          this.log('warning', 'assessment', `aortic-imaging-order-refused-${this.currentTick}`,
            'Prioritize urgent definitive aortic imaging before the final serial handoff.');
          break;
        }
        if (this.aorticHandedOffAtTick !== null) {
          this.log('warning', 'assessment', `aortic-handoff-refused-${this.currentTick}`,
            'The final fixed serial assessment and uncertainty handoff have already been recorded.');
          break;
        }
        this.aorticHandedOffAtTick = this.currentTick;
        this.log('critical', 'assessment', `aortic-evolution-handed-off-${this.currentTick}`,
          'Before imaging, repeat fixed assessment shows pain still present, HR 82/min, left-arm BP 156/88 mmHg, right-arm BP 132/78 mmHg, persistent weak right radial and left pedal pulses, a still-cool left foot, and unchanged mild left-arm drift with clear speech. Times, trends, treatment intents, competing diagnoses, malperfusion concern, and the unavailable scan were handed to the aortic team. No diagnosis, image result, procedure, transfer, disposition, or outcome is simulated.', { heartRatePerMin: 82, leftArmSystolicBpMmHg: 156, rightArmSystolicBpMmHg: 132, imagingAvailable: false });
        break;
      }
      case 'ards-lung-protective-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'ards-lung-protective-ventilation');
        const valid = ['review-ards-baseline', 'calculate-ards-pbw', 'record-ards-protective-settings',
          'reassess-ards-protection', 'record-ards-peep-prone-escalation'].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `ards-lung-protective-response-refused-${this.currentTick}`,
            supported ? 'The ARDS action was not one of the listed choices. Nothing changed.'
              : 'The bounded ARDS choices are available only in the declared lesson.');
          break;
        }
        if (response === 'review-ards-baseline') {
          if (this.ardsBaselineAtTick !== null) { this.log('warning', 'assessment', `ards-baseline-refused-${this.currentTick}`, 'The fixed baseline has already been reviewed.'); break; }
          this.ardsBaselineAtTick = this.currentTick;
          this.log('critical', 'assessment', `ards-baseline-reviewed-${this.currentTick}`,
            'Baseline review: 500 mL at 24/min, PEEP 8 cm H₂O, FiO₂ 0.70, SpO₂ 90%, PaO₂ 64 mmHg, pH 7.36, PaCO₂ 42 mmHg, and authored plateau pressure 32 cm H₂O with passive synchrony and MAP 72 mmHg. Gas sampling, airway verification, ventilator measurements, and ARDS diagnosis are not simulated.', { tidalVolumeMl: 500, plateauPressureCmH2O: 32, pao2MmHg: 64 });
          break;
        }
        if (this.ardsBaselineAtTick === null) { this.log('warning', 'assessment', `ards-baseline-order-refused-${this.currentTick}`, 'Review oxygenation, mechanics, support, synchrony, and circulation first.'); break; }
        if (response === 'calculate-ards-pbw') {
          if (this.ardsPbwAtTick !== null) { this.log('warning', 'assessment', `ards-pbw-refused-${this.currentTick}`, 'The fixed predicted-body-weight basis has already been reviewed.'); break; }
          this.ardsPbwAtTick = this.currentTick;
          this.log('advisory', 'assessment', `ards-pbw-calculated-${this.currentTick}`,
            'For the authored 170 cm adult woman, predicted body weight is 61.5 kg. The current 500 mL is 8.1 mL/kg predicted body weight; actual 92 kg weight is not the tidal-volume basis. This is a fixed teaching calculation, not a bedside calculator.', { predictedBodyWeightKg: 61.5, currentMlPerKgPbw: 8.1 });
          break;
        }
        if (this.ardsPbwAtTick === null) { this.log('warning', 'assessment', `ards-pbw-order-refused-${this.currentTick}`, 'Establish the height-and-sex predicted-body-weight basis before setting tidal volume.'); break; }
        if (response === 'record-ards-protective-settings') {
          if (this.ardsProtectionAtTick !== null) { this.log('warning', 'assessment', `ards-protection-refused-${this.currentTick}`, 'The protective-setting intent has already been recorded.'); break; }
          this.ardsProtectionAtTick = this.currentTick;
          this.log('critical', 'assessment', `ards-protection-recorded-${this.currentTick}`,
            'A 370 mL tidal-volume intent (about 6 mL/kg predicted body weight) and plateau-pressure limit below 30 cm H₂O were recorded, with respiratory-rate adjustment delegated to the current protocol and pH response. Ventilator programming, inspiratory hold, auto-PEEP, dead space, and delivered mechanics are not simulated.', { intentOnly: true, tidalVolumeMl: 370, mlPerKgPbw: 6, plateauLimitCmH2O: 30 });
          break;
        }
        if (this.ardsProtectionAtTick === null) { this.log('warning', 'assessment', `ards-protection-order-refused-${this.currentTick}`, 'Record predicted-body-weight lung protection before reassessment.'); break; }
        if (response === 'reassess-ards-protection') {
          if (this.ardsReassessmentAtTick !== null) { this.log('warning', 'assessment', `ards-reassessment-refused-${this.currentTick}`, 'The fixed post-change panel has already been reviewed.'); break; }
          this.ardsReassessmentAtTick = this.currentTick;
          this.log('critical', 'assessment', `ards-protection-reassessed-${this.currentTick}`,
            'Fixed response after 30 minutes: delivered tidal volume 370 mL, plateau pressure 27 cm H₂O, SpO₂ 91%, PaO₂ 66 mmHg, pH 7.29, PaCO₂ 52 mmHg, passive synchrony, and MAP 70 mmHg. The bounded hypercapnia was accepted while pH, mechanics, synchrony, and circulation remain under review; no individualized target or outcome is predicted.', { tidalVolumeMl: 370, plateauPressureCmH2O: 27, ph: 7.29, paco2MmHg: 52, mapMmHg: 70 });
          break;
        }
        if (this.ardsReassessmentAtTick === null) { this.log('warning', 'assessment', `ards-reassessment-order-refused-${this.currentTick}`, 'Reassess mechanics, gas exchange, synchrony, and circulation before escalating support.'); break; }
        if (this.ardsEscalationAtTick !== null) { this.log('warning', 'assessment', `ards-escalation-refused-${this.currentTick}`, 'The bounded PEEP, oxygen, and prone-team intent has already been recorded.'); break; }
        this.ardsEscalationAtTick = this.currentTick;
        this.log('critical', 'assessment', `ards-escalation-recorded-${this.currentTick}`,
          'Persistent moderate-severe hypoxemia triggered local protocolized PEEP/FiO₂ adjustment with pressure, oxygen-toxicity, barotrauma, and hemodynamic surveillance plus an experienced-team prolonged prone-positioning intent for more than 12 hours daily. Recruitment maneuvers, sedation, paralysis, physical turning, complications, ECMO, later course, and outcome are outside this lesson.', { intentOnly: true, proneHoursPerDayGreaterThan: 12 });
        break;
      }
      case 'escalating-hypoxemia-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'escalating-hypoxemia');
        const valid = ['validate-hypoxemia-signal', 'support-hypoxemia-and-call-help',
          'trace-hypoxemia-delivery-path', 'integrate-hypoxemia-bedside-pattern',
          'escalate-and-reassess-hypoxemia'].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `escalating-hypoxemia-response-refused-${this.currentTick}`,
            supported ? 'The hypoxemia action was not one of the listed choices. Nothing changed.'
              : 'The bounded hypoxemia choices are available only in the declared lesson.');
          break;
        }
        if (response === 'validate-hypoxemia-signal') {
          if (this.hypoxemiaSignalAtTick !== null) { this.log('warning', 'assessment', `hypoxemia-signal-refused-${this.currentTick}`, 'The fixed signal panel has already been reviewed.'); break; }
          this.hypoxemiaSignalAtTick = this.currentTick;
          this.log('critical', 'assessment', `hypoxemia-signal-validated-${this.currentTick}`,
            'The decline is credible: SpO₂ fell from 94% to 84% over 6 minutes, the pleth remains strong and regular, and fixed PaO₂ is 51 mmHg. Signal inspection and arterial sampling are not simulated, and concordance does not diagnose the cause.', { spo2Percent: 84, pao2MmHg: 51, declineMinutes: 6 });
          break;
        }
        if (this.hypoxemiaSignalAtTick === null) { this.log('warning', 'assessment', `hypoxemia-signal-order-refused-${this.currentTick}`, 'Corroborate the urgent saturation decline before narrowing the problem.'); break; }
        if (response === 'support-hypoxemia-and-call-help') {
          if (this.hypoxemiaSupportAtTick !== null) { this.log('warning', 'assessment', `hypoxemia-support-refused-${this.currentTick}`, 'Immediate support and help have already been recorded.'); break; }
          this.hypoxemiaSupportAtTick = this.currentTick;
          this.log('critical', 'assessment', `hypoxemia-support-recorded-${this.currentTick}`,
            'Immediate higher oxygen intent, continuous monitoring, and senior ICU plus respiratory-therapy help were recorded while troubleshooting proceeds. Backup oxygenation equipment is requested if the ventilator or circuit proves unreliable. Oxygen delivery, hand ventilation, and team performance are not simulated.', { intentOnly: true, seniorHelp: true, respiratoryTherapyHelp: true });
          break;
        }
        if (this.hypoxemiaSupportAtTick === null) { this.log('warning', 'assessment', `hypoxemia-support-order-refused-${this.currentTick}`, 'Support oxygenation and call experienced help while troubleshooting proceeds.'); break; }
        if (response === 'trace-hypoxemia-delivery-path') {
          if (this.hypoxemiaDeliveryPathAtTick !== null) { this.log('warning', 'assessment', `hypoxemia-delivery-path-refused-${this.currentTick}`, 'The fixed delivery-path panel has already been reviewed.'); break; }
          this.hypoxemiaDeliveryPathAtTick = this.currentTick;
          this.log('critical', 'assessment', `hypoxemia-delivery-path-reviewed-${this.currentTick}`,
            'Fixed outside-in check: oxygen source and circuit are connected, delivered FiO₂ matches the command, a continuous capnogram persists, tube depth remains 23 cm at the teeth, cuff state is unchanged, and the authored suction-path check passes. These proxy controls do not manipulate equipment, prove position, or exclude intermittent failure.', { oxygenSourceConnected: true, circuitConnected: true, tubeDepthCm: 23, suctionPathPasses: true });
          break;
        }
        if (this.hypoxemiaDeliveryPathAtTick === null) { this.log('warning', 'assessment', `hypoxemia-delivery-path-order-refused-${this.currentTick}`, 'Trace the oxygen source, circuit, tube, capnography, and suction path before narrowing the differential.'); break; }
        if (response === 'integrate-hypoxemia-bedside-pattern') {
          if (this.hypoxemiaBedsidePatternAtTick !== null) { this.log('warning', 'assessment', `hypoxemia-bedside-pattern-refused-${this.currentTick}`, 'The fixed bedside pattern has already been integrated.'); break; }
          this.hypoxemiaBedsidePatternAtTick = this.currentTick;
          this.log('critical', 'assessment', `hypoxemia-bedside-pattern-reviewed-${this.currentTick}`,
            'Fixed bedside panel: bilateral but coarse air entry, symmetric chest movement, peak pressure rising from 31 to 36 cm H₂O, plateau pressure 29 cm H₂O, persistent capnogram with ETCO₂ 43 mmHg, HR 108/min, and MAP 73 mmHg without a new unilateral or obstructive-shock pattern. Findings support unresolved bilateral parenchymal hypoxemia but do not exclude pneumothorax, embolism, atelectasis, infection, edema, or tube and equipment problems.', { peakPressureCmH2O: 36, plateauPressureCmH2O: 29, etco2MmHg: 43, mapMmHg: 73 });
          break;
        }
        if (this.hypoxemiaBedsidePatternAtTick === null) { this.log('warning', 'assessment', `hypoxemia-bedside-pattern-order-refused-${this.currentTick}`, 'Integrate chest, pressure, capnography, and circulation findings before escalation.'); break; }
        if (this.hypoxemiaEscalationAtTick !== null) { this.log('warning', 'assessment', `hypoxemia-escalation-refused-${this.currentTick}`, 'The bounded escalation and reassessment have already been recorded.'); break; }
        this.hypoxemiaEscalationAtTick = this.currentTick;
        this.log('critical', 'assessment', `hypoxemia-escalation-reassessed-${this.currentTick}`,
          'Urgent repeat gas and bedside imaging intent, protocolized lung-protective FiO₂/PEEP escalation, and ongoing pressure and hemodynamic surveillance were recorded with senior and respiratory-therapy review. Fixed reassessment after 15 minutes: SpO₂ 92%, PaO₂ 68 mmHg, plateau pressure 29 cm H₂O, ETCO₂ 44 mmHg, and MAP 72 mmHg. Imaging result, diagnosis, individualized settings, procedures, later course, and outcome remain outside this lesson.', { intentOnly: true, reassessmentMinutes: 15, spo2Percent: 92, pao2MmHg: 68, plateauPressureCmH2O: 29, mapMmHg: 72 });
        break;
      }
      case 'ventilator-dyssynchrony-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'ventilator-dyssynchrony');
        const valid = ['review-dyssynchrony-patient-and-graphics', 'review-dyssynchrony-drivers',
          'classify-dyssynchrony-pattern', 'record-dyssynchrony-correction-intent',
          'reassess-dyssynchrony-response'].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `ventilator-dyssynchrony-response-refused-${this.currentTick}`,
            supported ? 'The dyssynchrony action was not one of the listed choices. Nothing changed.'
              : 'The bounded dyssynchrony choices are available only in the declared lesson.');
          break;
        }
        if (response === 'review-dyssynchrony-patient-and-graphics') {
          if (this.dyssynchronyGraphicsAtTick !== null) { this.log('warning', 'assessment', `dyssynchrony-graphics-refused-${this.currentTick}`, 'The fixed patient and graphics panel has already been reviewed.'); break; }
          this.dyssynchronyGraphicsAtTick = this.currentTick;
          this.log('critical', 'assessment', `dyssynchrony-graphics-reviewed-${this.currentTick}`,
            'Fixed 20-breath observation: visible inspiratory effort, pressure-time scooping, premature cycling followed by continued effort, 8 double triggers, and stacked delivered volume up to 760 mL despite a 420 mL command. Peak pressure is 30 cm H₂O; the last passive plateau was 22 cm H₂O. Examination and waveform acquisition are not simulated.', { observedBreaths: 20, doubleTriggers: 8, commandedTidalVolumeMl: 420, stackedVolumeMl: 760 });
          break;
        }
        if (this.dyssynchronyGraphicsAtTick === null) { this.log('warning', 'assessment', `dyssynchrony-graphics-order-refused-${this.currentTick}`, 'Read patient effort with pressure, flow, volume, and delivered breaths first.'); break; }
        if (response === 'review-dyssynchrony-drivers') {
          if (this.dyssynchronyDriversAtTick !== null) { this.log('warning', 'assessment', `dyssynchrony-drivers-refused-${this.currentTick}`, 'The fixed driver panel has already been reviewed.'); break; }
          this.dyssynchronyDriversAtTick = this.currentTick;
          this.log('critical', 'assessment', `dyssynchrony-drivers-reviewed-${this.currentTick}`,
            'Fixed driver panel: the patient indicates chest-tube-site pain 6/10, temperature 37.9°C, scant secretions, unchanged tube depth and cuff state, connected circuit, no authored auto-PEEP, no new wheeze or unilateral chest pattern, SpO₂ 93%, pH 7.31, PaCO₂ 50 mmHg, and MAP 77 mmHg. These findings narrow but do not exclude airway, lung, neurologic, metabolic, device, or drive causes.', { painScore: 6, autoPeepCmH2O: 0, spo2Percent: 93, ph: 7.31, paco2MmHg: 50 });
          break;
        }
        if (this.dyssynchronyDriversAtTick === null) { this.log('warning', 'assessment', `dyssynchrony-drivers-order-refused-${this.currentTick}`, 'Review reversible patient, airway, equipment, gas, and circulation drivers before classifying the interaction.'); break; }
        if (response === 'classify-dyssynchrony-pattern') {
          if (this.dyssynchronyClassificationAtTick !== null) { this.log('warning', 'assessment', `dyssynchrony-classification-refused-${this.currentTick}`, 'The bounded dyssynchrony pattern has already been classified.'); break; }
          this.dyssynchronyClassificationAtTick = this.currentTick;
          this.log('critical', 'assessment', `dyssynchrony-pattern-classified-${this.currentTick}`,
            'The authored pattern is classified as insufficient inspiratory flow plus premature cycling with double triggering and potentially injurious stacked volume. It is not classified as auto-triggering, ineffective effort, reverse triggering, auto-PEEP, obstruction, or universal proof of one mechanism.', { flowStarvation: true, prematureCycling: true, doubleTriggering: true });
          break;
        }
        if (this.dyssynchronyClassificationAtTick === null) { this.log('warning', 'assessment', `dyssynchrony-classification-order-refused-${this.currentTick}`, 'Classify the observed interaction before recording a correction.'); break; }
        if (response === 'record-dyssynchrony-correction-intent') {
          if (this.dyssynchronyCorrectionAtTick !== null) { this.log('warning', 'assessment', `dyssynchrony-correction-refused-${this.currentTick}`, 'The bounded correction intent has already been recorded.'); break; }
          this.dyssynchronyCorrectionAtTick = this.currentTick;
          this.log('critical', 'assessment', `dyssynchrony-correction-recorded-${this.currentTick}`,
            'Analgesia-first reassessment and respiratory-therapy adjustment intent were recorded to better match inspiratory flow and cycling while preserving predicted-body-weight tidal volume, plateau-pressure, oxygenation, and hemodynamic guardrails. No drug, dose, mode, flow, trigger, cycling value, sedation depth, or paralysis is selected or delivered.', { intentOnly: true, analgesiaFirst: true, preserveLungProtection: true });
          break;
        }
        if (this.dyssynchronyCorrectionAtTick === null) { this.log('warning', 'assessment', `dyssynchrony-correction-order-refused-${this.currentTick}`, 'Record cause-directed, lung-protective correction intent before reassessment.'); break; }
        if (this.dyssynchronyReassessmentAtTick !== null) { this.log('warning', 'assessment', `dyssynchrony-reassessment-refused-${this.currentTick}`, 'The fixed post-adjustment panel has already been reviewed.'); break; }
        this.dyssynchronyReassessmentAtTick = this.currentTick;
        this.log('critical', 'assessment', `dyssynchrony-response-reassessed-${this.currentTick}`,
          'Fixed response after 10 minutes: pain report 3/10, less visible effort, pressure scooping resolved in the observed panel, 1 double trigger in 20 breaths, delivered tidal volumes 420–450 mL, peak pressure 27 cm H₂O, plateau pressure 22 cm H₂O, SpO₂ 94%, ETCO₂ 42 mmHg, and MAP 76 mmHg. This is an authored response, not a prescription, waveform interpretation credential, or outcome prediction.', { reassessmentMinutes: 10, painScore: 3, doubleTriggers: 1, maximumTidalVolumeMl: 450, plateauPressureCmH2O: 22 });
        break;
      }
      case 'auto-peep-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'auto-peep');
        const valid = ['review-auto-peep-patient-and-flow', 'measure-auto-peep',
          'classify-auto-peep-pattern', 'record-auto-peep-correction-intent',
          'reassess-auto-peep-response'].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `auto-peep-response-refused-${this.currentTick}`,
            supported ? 'The auto-PEEP action was not one of the listed choices. Nothing changed.'
              : 'The bounded auto-PEEP choices are available only in the declared lesson.');
          break;
        }
        if (response === 'review-auto-peep-patient-and-flow') {
          if (this.autoPeepFlowAtTick !== null) { this.log('warning', 'assessment', `auto-peep-flow-refused-${this.currentTick}`, 'The fixed patient and expiratory-flow panel has already been reviewed.'); break; }
          this.autoPeepFlowAtTick = this.currentTick;
          this.log('critical', 'assessment', `auto-peep-flow-reviewed-${this.currentTick}`,
            'Fixed whole-patient panel: expiratory flow remains below zero when the next breath begins at 28/min, peak pressure is 35 cm H₂O, passive plateau is 22 cm H₂O, several efforts fail to trigger, SpO₂ is 92%, pH 7.24, PaCO₂ 64 mmHg, HR 112/min, and MAP 62 mmHg. This raises concern for incomplete exhalation but does not by itself quantify intrinsic PEEP or diagnose its cause.', { respiratoryRateBpm: 28, peakPressureCmH2O: 35, plateauPressureCmH2O: 22, expiratoryFlowReachesZero: false, mapMmHg: 62 });
          break;
        }
        if (this.autoPeepFlowAtTick === null) { this.log('warning', 'assessment', `auto-peep-flow-order-refused-${this.currentTick}`, 'Review the patient, expiratory flow, timing, pressures, gas exchange, and circulation first.'); break; }
        if (response === 'measure-auto-peep') {
          if (this.autoPeepMeasurementAtTick !== null) { this.log('warning', 'assessment', `auto-peep-measurement-refused-${this.currentTick}`, 'The fixed passive expiratory-hold panel has already been reviewed.'); break; }
          this.autoPeepMeasurementAtTick = this.currentTick;
          this.log('critical', 'assessment', `auto-peep-measured-${this.currentTick}`,
            'During the authored passive window, the expiratory-hold proxy reports total PEEP 16 cm H₂O with set PEEP 5 cm H₂O: intrinsic PEEP is therefore 11 cm H₂O. A real hold can be invalidated or underestimate trapping when effort, expiratory-muscle activity, airway closure, or heterogeneous emptying is present.', { passiveWindow: true, setPeepCmH2O: 5, totalPeepCmH2O: 16, intrinsicPeepCmH2O: 11 });
          break;
        }
        if (this.autoPeepMeasurementAtTick === null) { this.log('warning', 'assessment', `auto-peep-measurement-order-refused-${this.currentTick}`, 'Review the valid passive expiratory-hold panel before classifying the pattern.'); break; }
        if (response === 'classify-auto-peep-pattern') {
          if (this.autoPeepClassificationAtTick !== null) { this.log('warning', 'assessment', `auto-peep-classification-refused-${this.currentTick}`, 'The bounded dynamic-hyperinflation pattern has already been classified.'); break; }
          this.autoPeepClassificationAtTick = this.currentTick;
          this.log('critical', 'assessment', `auto-peep-pattern-classified-${this.currentTick}`,
            'The authored pattern is classified as obstructive dynamic hyperinflation with auto-PEEP: prolonged emptying plus a short expiratory interval traps gas, adds an inspiratory threshold load, and plausibly contributes to failed triggering and low pressure. It does not prove the distribution of trapped gas, exclude pneumothorax or equipment problems, or establish one universal treatment.', { dynamicHyperinflation: true, intrinsicPeepCmH2O: 11, failedTriggering: true, hemodynamicConcern: true });
          break;
        }
        if (this.autoPeepClassificationAtTick === null) { this.log('warning', 'assessment', `auto-peep-classification-order-refused-${this.currentTick}`, 'Classify the observed and measured pattern before recording a correction.'); break; }
        if (response === 'record-auto-peep-correction-intent') {
          if (this.autoPeepCorrectionAtTick !== null) { this.log('warning', 'assessment', `auto-peep-correction-refused-${this.currentTick}`, 'The bounded correction intent has already been recorded.'); break; }
          this.autoPeepCorrectionAtTick = this.currentTick;
          this.log('critical', 'assessment', `auto-peep-correction-recorded-${this.currentTick}`,
            'Senior ICU and respiratory-therapy review, obstruction-treatment intent, lower minute-ventilation demand, and more expiratory time were recorded while retaining predicted-body-weight volume, plateau-pressure, gas-exchange, and hemodynamic guardrails. External PEEP requires individualized assessment of effort and expiratory flow limitation; no drug, dose, mode, rate, flow, inspiratory time, trigger, PEEP value, sedation, or paralysis is selected or delivered.', { intentOnly: true, seniorHelp: true, respiratoryTherapyHelp: true, treatObstruction: true, preserveExpiratoryTime: true, preserveLungProtection: true });
          break;
        }
        if (this.autoPeepCorrectionAtTick === null) { this.log('warning', 'assessment', `auto-peep-correction-order-refused-${this.currentTick}`, 'Record cause-directed correction intent before reassessment.'); break; }
        if (this.autoPeepReassessmentAtTick !== null) { this.log('warning', 'assessment', `auto-peep-reassessment-refused-${this.currentTick}`, 'The fixed post-adjustment panel has already been reviewed.'); break; }
        this.autoPeepReassessmentAtTick = this.currentTick;
        this.log('critical', 'assessment', `auto-peep-response-reassessed-${this.currentTick}`,
          'Fixed response after 10 minutes: expiratory flow reaches zero before the next breath, total PEEP is 9 cm H₂O with set PEEP 5 cm H₂O and intrinsic PEEP 4 cm H₂O, peak pressure is 30 cm H₂O, plateau pressure remains 22 cm H₂O, all observed efforts trigger, SpO₂ is 93%, pH 7.27, PaCO₂ 58 mmHg, HR 98/min, and MAP 72 mmHg. The bounded hypercapnia remains under protocolized review; this is an authored response, not a setting prescription or outcome prediction.', { reassessmentMinutes: 10, expiratoryFlowReachesZero: true, totalPeepCmH2O: 9, intrinsicPeepCmH2O: 4, peakPressureCmH2O: 30, plateauPressureCmH2O: 22, mapMmHg: 72 });
        break;
      }
      case 'mucus-plugging-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'mucus-plugging');
        const valid = ['support-mucus-plugging-and-call-help', 'review-mucus-plugging-indicators',
          'record-indicated-airway-suction-intent', 'reassess-mucus-plugging-response',
          'escalate-persistent-mucus-plugging'].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `mucus-plugging-response-refused-${this.currentTick}`,
            supported ? 'The mucus-plugging action was not one of the listed choices. Nothing changed.'
              : 'The bounded mucus-plugging choices are available only in the declared lesson.');
          break;
        }
        if (response === 'support-mucus-plugging-and-call-help') {
          if (this.mucusSupportAtTick !== null) { this.log('warning', 'assessment', `mucus-support-refused-${this.currentTick}`, 'Oxygenation support and help have already been recorded.'); break; }
          this.mucusSupportAtTick = this.currentTick;
          this.log('critical', 'assessment', `mucus-support-recorded-${this.currentTick}`,
            'Immediate oxygen-support intent, continuous monitoring, and respiratory-therapy plus senior ICU help were recorded while airway resistance is assessed. Oxygen delivery, team arrival, and rescue ventilation are not simulated.', { intentOnly: true, respiratoryTherapyHelp: true, seniorHelp: true });
          break;
        }
        if (this.mucusSupportAtTick === null) { this.log('warning', 'assessment', `mucus-support-order-refused-${this.currentTick}`, 'Support oxygenation and call experienced help before airway-clearance intent.'); break; }
        if (response === 'review-mucus-plugging-indicators') {
          if (this.mucusIndicatorsAtTick !== null) { this.log('warning', 'assessment', `mucus-indicators-refused-${this.currentTick}`, 'The fixed retained-secretion panel has already been reviewed.'); break; }
          this.mucusIndicatorsAtTick = this.currentTick;
          this.log('critical', 'assessment', `mucus-indicators-reviewed-${this.currentTick}`,
            'Fixed panel: coarse central sounds, visible thick tracheal-tube secretion, sawtooth expiratory flow, peak pressure 38 cm H₂O with passive plateau 23 cm H₂O, reduced left-base air entry, SpO₂ 87%, ETCO₂ 46 mmHg with continuous capnogram, HR 108/min, MAP 74 mmHg, unchanged tube depth and cuff, and connected circuit. These converge on retained secretion but do not diagnose location or exclude other airway, pleural, parenchymal, or equipment causes.', { visibleSecretions: true, sawtoothFlow: true, peakPressureCmH2O: 38, plateauPressureCmH2O: 23, spo2Percent: 87 });
          break;
        }
        if (this.mucusIndicatorsAtTick === null) { this.log('warning', 'assessment', `mucus-indicators-order-refused-${this.currentTick}`, 'Review the patient, airway, graphics, mechanics, gas exchange, and circulation before suction intent.'); break; }
        if (response === 'record-indicated-airway-suction-intent') {
          if (this.mucusSuctionAtTick !== null) { this.log('warning', 'assessment', `mucus-suction-refused-${this.currentTick}`, 'The bounded suction intent has already been recorded.'); break; }
          this.mucusSuctionAtTick = this.currentTick;
          this.log('critical', 'assessment', `mucus-suction-recorded-${this.currentTick}`,
            'Preoxygenated, as-needed, initially shallow artificial-airway suction intent was recorded with routine saline instillation avoided and immediate physiologic reassessment required. No catheter, system, depth, pressure, duration, technique, secretion removal, or complication is simulated.', { intentOnly: true, preoxygenation: true, asNeeded: true, shallowFirst: true, routineSaline: false });
          break;
        }
        if (this.mucusSuctionAtTick === null) { this.log('warning', 'assessment', `mucus-suction-order-refused-${this.currentTick}`, 'Record indicated airway-clearance intent before reviewing a response.'); break; }
        if (response === 'reassess-mucus-plugging-response') {
          if (this.mucusReassessmentAtTick !== null) { this.log('warning', 'assessment', `mucus-reassessment-refused-${this.currentTick}`, 'The fixed post-suction panel has already been reviewed.'); break; }
          this.mucusReassessmentAtTick = this.currentTick;
          this.log('critical', 'assessment', `mucus-response-reassessed-${this.currentTick}`,
            'Fixed response after the suction proxy: the catheter passes, thick secretion is reported removed, the sawtooth flow pattern resolves, peak pressure falls to 30 cm H₂O with plateau 23 cm H₂O, SpO₂ rises to 92%, ETCO₂ is 44 mmHg, HR is 98/min, and MAP is 76 mmHg. Reduced left-base air entry persists, so central-airway improvement does not close the case.', { catheterPasses: true, secretionRemoved: true, sawtoothFlow: false, peakPressureCmH2O: 30, plateauPressureCmH2O: 23, spo2Percent: 92, persistentFocalFinding: true });
          break;
        }
        if (this.mucusReassessmentAtTick === null) { this.log('warning', 'assessment', `mucus-reassessment-order-refused-${this.currentTick}`, 'Reassess the whole patient after airway-clearance intent before escalation.'); break; }
        if (this.mucusEscalationAtTick !== null) { this.log('warning', 'assessment', `mucus-escalation-refused-${this.currentTick}`, 'The persistent focal concern has already been escalated.'); break; }
        this.mucusEscalationAtTick = this.currentTick;
        this.log('critical', 'assessment', `mucus-escalation-recorded-${this.currentTick}`,
          'Urgent chest-imaging intent and experienced airway evaluation were recorded for persistent left-base volume-loss concern while tube migration, pneumothorax, consolidation, blood, foreign body, and equipment problems remain open. Bronchoscopy is not routine; its indication, timing, findings, technique, complications, and outcome remain outside this lesson.', { intentOnly: true, imaging: true, experiencedAirwayReview: true, routineBronchoscopy: false });
        break;
      }
      case 'unplanned-extubation-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'unplanned-extubation');
        const valid = ['support-unplanned-extubation-and-call-help',
          'assess-unplanned-extubation-tolerance', 'classify-unplanned-extubation-failure',
          'record-unplanned-extubation-airway-plan',
          'reassess-unplanned-extubation-response'].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `unplanned-extubation-response-refused-${this.currentTick}`,
            supported ? 'The unplanned-extubation action was not one of the listed choices. Nothing changed.'
              : 'The bounded unplanned-extubation choices are available only in the declared lesson.');
          break;
        }
        if (response === 'support-unplanned-extubation-and-call-help') {
          if (this.unplannedExtubationSupportAtTick !== null) { this.log('warning', 'assessment', `unplanned-extubation-support-refused-${this.currentTick}`, 'Oxygenation support and experienced help have already been recorded.'); break; }
          this.unplannedExtubationSupportAtTick = this.currentTick;
          this.log('critical', 'assessment', `unplanned-extubation-support-recorded-${this.currentTick}`,
            'The unplanned extubation was announced. Immediate face-mask oxygen, continuous monitoring, and respiratory-therapy, senior ICU, and airway help were recorded. Oxygen delivery, mask ventilation, team arrival, and procedures are not simulated.', { intentOnly: true, oxygenSupport: true, respiratoryTherapyHelp: true, seniorHelp: true, airwayHelp: true });
          break;
        }
        if (this.unplannedExtubationSupportAtTick === null) { this.log('warning', 'assessment', `unplanned-extubation-support-order-refused-${this.currentTick}`, 'Announce the event, support oxygenation, and call experienced help before the tolerance assessment.'); break; }
        if (response === 'assess-unplanned-extubation-tolerance') {
          if (this.unplannedExtubationAssessmentAtTick !== null) { this.log('warning', 'assessment', `unplanned-extubation-assessment-refused-${this.currentTick}`, 'The fixed post-extubation tolerance panel has already been reviewed.'); break; }
          this.unplannedExtubationAssessmentAtTick = this.currentTick;
          this.log('critical', 'assessment', `unplanned-extubation-tolerance-assessed-${this.currentTick}`,
            'Fixed whole-patient panel: airway remains patent but voice and cough are weak with pooled secretions; respiratory rate is 36/min with accessory use; SpO₂ is 86% despite face-mask oxygen; pH is 7.27 and PaCO₂ 58 mmHg; alertness is declining; HR is 116/min and MAP 78 mmHg. The event alone does not mandate reintubation, but these findings test airway protection, work, oxygenation, ventilation, brain, and circulation.', { airwayPatent: true, respiratoryRateBpm: 36, weakCough: true, pooledSecretions: true, spo2Percent: 86, pH: 7.27, paCo2MmHg: 58, decliningAlertness: true });
          break;
        }
        if (this.unplannedExtubationAssessmentAtTick === null) { this.log('warning', 'assessment', `unplanned-extubation-assessment-order-refused-${this.currentTick}`, 'Review the whole-patient tolerance panel before deciding on a definitive airway.'); break; }
        if (response === 'classify-unplanned-extubation-failure') {
          if (this.unplannedExtubationFailureAtTick !== null) { this.log('warning', 'assessment', `unplanned-extubation-failure-refused-${this.currentTick}`, 'Post-extubation respiratory failure has already been recorded.'); break; }
          this.unplannedExtubationFailureAtTick = this.currentTick;
          this.log('critical', 'assessment', `unplanned-extubation-failure-classified-${this.currentTick}`,
            'The combined severe work, hypoxemia, respiratory acidemia, weak secretion clearance, and declining alertness were classified as an authored failing post-extubation trajectory requiring prompt reintubation. This is a case-specific classification, not a universal rule for every unplanned extubation.', { classification: 'failing', promptReintubation: true, automaticForEveryEvent: false });
          break;
        }
        if (this.unplannedExtubationFailureAtTick === null) { this.log('warning', 'assessment', `unplanned-extubation-failure-order-refused-${this.currentTick}`, 'Classify the observed trajectory before recording the airway plan.'); break; }
        if (response === 'record-unplanned-extubation-airway-plan') {
          if (this.unplannedExtubationAirwayPlanAtTick !== null) { this.log('warning', 'assessment', `unplanned-extubation-plan-refused-${this.currentTick}`, 'The bounded experienced-airway plan has already been recorded.'); break; }
          this.unplannedExtubationAirwayPlanAtTick = this.currentTick;
          this.log('critical', 'assessment', `unplanned-extubation-airway-plan-recorded-${this.currentTick}`,
            'Experienced-team preoxygenation and prompt reintubation intent were recorded with hemodynamic preparation and a difficult-airway backup. Noninvasive support will not be used to delay a failing airway. No oxygen interface, drug, dose, device, technique, attempt, placement, or complication is simulated.', { intentOnly: true, preoxygenation: true, promptReintubation: true, hemodynamicPreparation: true, difficultAirwayBackup: true, nivDelay: false });
          break;
        }
        if (this.unplannedExtubationAirwayPlanAtTick === null) { this.log('warning', 'assessment', `unplanned-extubation-plan-order-refused-${this.currentTick}`, 'Record the experienced-airway plan before reviewing its fixed response.'); break; }
        if (this.unplannedExtubationReassessmentAtTick !== null) { this.log('warning', 'assessment', `unplanned-extubation-reassessment-refused-${this.currentTick}`, 'The fixed airway and patient-response panel has already been reviewed.'); break; }
        this.unplannedExtubationReassessmentAtTick = this.currentTick;
        this.log('critical', 'assessment', `unplanned-extubation-response-reassessed-${this.currentTick}`,
          'Fixed reported response: continuous exhaled-carbon-dioxide waveform is present, bilateral ventilation is reported, tube depth and cuff state are documented, SpO₂ is 95%, ETCO₂ is 43 mmHg, peak pressure is 28 cm H₂O, HR is 104/min, MAP is 75 mmHg, and alertness is improving. A non-punitive handoff requests review of securement, sedation and delirium, mobility, staffing, observation, and communication around the repositioning event.', { continuousCapnogram: true, bilateralVentilation: true, tubeDepthDocumented: true, cuffStateDocumented: true, spo2Percent: 95, etCo2MmHg: 43, incidentReview: true });
        break;
      }
      case 'spontaneous-breathing-trial-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'spontaneous-breathing-trial');
        const valid = ['review-sbt-readiness', 'start-bounded-sbt', 'recognize-sbt-failure',
          'stop-failed-sbt-and-recover', 'plan-after-failed-sbt'].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `sbt-response-refused-${this.currentTick}`,
            supported ? 'The spontaneous-breathing-trial action was not one of the listed choices. Nothing changed.'
              : 'The bounded spontaneous-breathing-trial choices are available only in the declared lesson.');
          break;
        }
        if (response === 'review-sbt-readiness') {
          if (this.sbtReadinessAtTick !== null) { this.log('warning', 'assessment', `sbt-readiness-refused-${this.currentTick}`, 'The fixed readiness panel has already been reviewed.'); break; }
          this.sbtReadinessAtTick = this.currentTick;
          this.log('advisory', 'assessment', `sbt-readiness-reviewed-${this.currentTick}`,
            'Fixed readiness panel: the pneumonia is improving; the patient is awake, follows commands, and initiates breaths; SpO₂ is 95% on FiO₂ 0.35 and PEEP 5 cm H₂O; HR is 94/min and MAP 73 mmHg without escalating vasopressor support; cough is moderate and secretions are manageable. An RSBI is not required to offer a standardized trial.', { improvingCause: true, awake: true, spontaneousEffort: true, fio2: 0.35, peepCmH2O: 5, stableCirculation: true, rsbiRequired: false });
          break;
        }
        if (this.sbtReadinessAtTick === null) { this.log('warning', 'assessment', `sbt-readiness-order-refused-${this.currentTick}`, 'Review standardized readiness before starting a trial.'); break; }
        if (response === 'start-bounded-sbt') {
          if (this.sbtStartedAtTick !== null) { this.log('warning', 'assessment', `sbt-start-refused-${this.currentTick}`, 'The bounded trial has already been recorded.'); break; }
          this.sbtStartedAtTick = this.currentTick;
          this.log('advisory', 'assessment', `sbt-started-${this.currentTick}`,
            'A local 30-minute SBT using pressure support 5 cm H₂O was recorded with FiO₂ unchanged at 0.35 and continuous patient-centered monitoring. SBTs may be conducted with or without pressure support; no ventilator is programmed and no universal method is prescribed.', { intentOnly: true, durationMinutes: 30, pressureSupportCmH2O: 5, fio2: 0.35, fio2Increased: false });
          break;
        }
        if (this.sbtStartedAtTick === null) { this.log('warning', 'assessment', `sbt-start-order-refused-${this.currentTick}`, 'Start the bounded trial before reviewing its tolerance panel.'); break; }
        if (response === 'recognize-sbt-failure') {
          if (this.sbtFailureAtTick !== null) { this.log('warning', 'assessment', `sbt-failure-refused-${this.currentTick}`, 'Trial intolerance has already been recorded.'); break; }
          this.sbtFailureAtTick = this.currentTick;
          this.log('critical', 'assessment', `sbt-failure-recognized-${this.currentTick}`,
            'Fixed 30-minute panel: respiratory rate 36/min, tidal volume 220 mL, accessory-muscle use, diaphoresis, visible distress, SpO₂ 88%, HR 124/min, and MAP 68 mmHg. The convergent work, breathing pattern, oxygenation, circulation, comfort, and trajectory establish authored trial failure; no one threshold is universal.', { respiratoryRateBpm: 36, tidalVolumeMl: 220, accessoryUse: true, diaphoresis: true, distress: true, spo2Percent: 88, heartRateBpm: 124, mapMmHg: 68, classification: 'failed' });
          break;
        }
        if (this.sbtFailureAtTick === null) { this.log('warning', 'assessment', `sbt-failure-order-refused-${this.currentTick}`, 'Recognize the convergent intolerance pattern before stopping the trial.'); break; }
        if (response === 'stop-failed-sbt-and-recover') {
          if (this.sbtRecoveryAtTick !== null) { this.log('warning', 'assessment', `sbt-recovery-refused-${this.currentTick}`, 'Prior support and the fixed recovery panel have already been recorded.'); break; }
          this.sbtRecoveryAtTick = this.currentTick;
          this.log('critical', 'assessment', `sbt-recovery-reviewed-${this.currentTick}`,
            'The failed trial was stopped and prior support was restored. Fixed response after 10 minutes: respiratory rate 20/min, commanded tidal volume 420 mL, accessory use and distress resolve, SpO₂ is 95% on FiO₂ 0.35, HR is 101/min, and MAP is 72 mmHg. This is an authored recovery, not ventilator programming or outcome prediction.', { intentOnly: true, priorSupportRestored: true, reassessmentMinutes: 10, respiratoryRateBpm: 20, tidalVolumeMl: 420, spo2Percent: 95, heartRateBpm: 101, mapMmHg: 72 });
          break;
        }
        if (this.sbtRecoveryAtTick === null) { this.log('warning', 'assessment', `sbt-recovery-order-refused-${this.currentTick}`, 'Stop the failed trial and review recovery before planning another assessment.'); break; }
        if (this.sbtPlanAtTick !== null) { this.log('warning', 'assessment', `sbt-plan-refused-${this.currentTick}`, 'The reversible-cause and reassessment plan has already been recorded.'); break; }
        this.sbtPlanAtTick = this.currentTick;
        this.log('advisory', 'assessment', `sbt-plan-recorded-${this.currentTick}`,
          'Respiratory load, weakness, fluid and cardiac load, pain, anxiety, sedation, nutrition, electrolytes, sleep, and secretions were handed off for review before another standardized daily assessment. Extubation was not recorded: even a successful SBT would require separate airway-protection, secretion, neurologic, risk, goals-of-care, and post-extubation-support decisions.', { reversibleDriversReview: true, repeatStandardizedAssessment: true, extubation: false, sbtSuccessEqualsExtubationReadiness: false });
        break;
      }
      case 'post-intubation-hypotension-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'post-intubation-hypotension');
        const valid = ['validate-post-intubation-pressure-and-call-help',
          'review-post-intubation-danger-pattern', 'classify-post-intubation-hemodynamics',
          'record-post-intubation-support-intent',
          'reassess-post-intubation-hypotension'].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `post-intubation-hypotension-response-refused-${this.currentTick}`,
            supported ? 'The post-intubation hypotension action was not one of the listed choices. Nothing changed.'
              : 'The bounded post-intubation hypotension choices are available only in the declared lesson.');
          break;
        }
        if (response === 'validate-post-intubation-pressure-and-call-help') {
          if (this.postIntubationPressureAtTick !== null) { this.log('warning', 'assessment', `post-intubation-pressure-refused-${this.currentTick}`, 'Pressure validation and experienced help have already been recorded.'); break; }
          this.postIntubationPressureAtTick = this.currentTick;
          this.log('critical', 'assessment', `post-intubation-pressure-validated-${this.currentTick}`,
            'A pulsatile invasive MAP of 46 mmHg, central pulse, 5-second capillary refill, warm extremities, and unchanged severe hypotension were confirmed while senior ICU and bedside help were called. Pressure acquisition, examination, and team arrival are not simulated.', { mapMmHg: 46, pulsePresent: true, capillaryRefillSeconds: 5, warmExtremities: true, seniorHelp: true });
          break;
        }
        if (this.postIntubationPressureAtTick === null) { this.log('warning', 'assessment', `post-intubation-pressure-order-refused-${this.currentTick}`, 'Validate severe hypotension and call experienced help before classifying its mechanism.'); break; }
        if (response === 'review-post-intubation-danger-pattern') {
          if (this.postIntubationDangerAtTick !== null) { this.log('warning', 'assessment', `post-intubation-danger-refused-${this.currentTick}`, 'The fixed immediate-danger panel has already been reviewed.'); break; }
          this.postIntubationDangerAtTick = this.currentTick;
          this.log('critical', 'assessment', `post-intubation-danger-reviewed-${this.currentTick}`,
            'Fixed panel: continuous capnogram, SpO₂ 95%, reported bilateral ventilation, peak pressure 27 cm H₂O, plateau 21 cm H₂O, expiratory flow reaching zero, sinus tachycardia, no external bleeding, and no new rash, wheeze, or facial swelling. The timing, recent drugs, positive-pressure transition, sepsis, volume history, pump, and obstructive alternatives remain under review.', { continuousCapnogram: true, bilateralVentilation: true, peakPressureCmH2O: 27, plateauPressureCmH2O: 21, expiratoryFlowReachesZero: true, sinusRhythm: true, externalBleeding: false, allergicPattern: false });
          break;
        }
        if (this.postIntubationDangerAtTick === null) { this.log('warning', 'assessment', `post-intubation-danger-order-refused-${this.currentTick}`, 'Review immediate airway, ventilation, rhythm, bleeding, allergy, pump, and obstructive alternatives first.'); break; }
        if (response === 'classify-post-intubation-hemodynamics') {
          if (this.postIntubationMechanismAtTick !== null) { this.log('warning', 'assessment', `post-intubation-mechanism-refused-${this.currentTick}`, 'The bounded hemodynamic pattern has already been classified.'); break; }
          this.postIntubationMechanismAtTick = this.currentTick;
          this.log('critical', 'assessment', `post-intubation-mechanism-classified-${this.currentTick}`,
            'A fixed passive-leg-raise proxy raises stroke volume from 48 to 57 mL while the lung panel remains clear. Together with warm shock, sepsis, recent induction, and positive-pressure transition, this supports mixed vasodilation and preload sensitivity; it does not diagnose one cause or exclude pump, obstructive, occult bleeding, drug, or equipment problems.', { strokeVolumeBeforeMl: 48, strokeVolumeAfterMl: 57, strokeVolumeIncreasePercent: 19, fluidResponsiveProxy: true, classification: 'mixed-vasodilated-preload-sensitive' });
          break;
        }
        if (this.postIntubationMechanismAtTick === null) { this.log('warning', 'assessment', `post-intubation-mechanism-order-refused-${this.currentTick}`, 'Classify the whole hemodynamic pattern before recording support.'); break; }
        if (response === 'record-post-intubation-support-intent') {
          if (this.postIntubationSupportAtTick !== null) { this.log('warning', 'assessment', `post-intubation-support-refused-${this.currentTick}`, 'The bounded hemodynamic support intent has already been recorded.'); break; }
          this.postIntubationSupportAtTick = this.currentTick;
          this.log('critical', 'assessment', `post-intubation-support-recorded-${this.currentTick}`,
            'Concurrent norepinephrine intent toward an initial MAP near 65 mmHg and a cautious 250 mL balanced-crystalloid challenge were recorded with immediate pressure, perfusion, dynamic-response, lung, and gas-exchange reassessment. No access, concentration, rate, dose, pump, fluid, or drug delivery is simulated.', { intentOnly: true, norepinephrine: true, initialMapTargetMmHg: 65, balancedCrystalloidChallengeMl: 250, concurrentSupport: true });
          break;
        }
        if (this.postIntubationSupportAtTick === null) { this.log('warning', 'assessment', `post-intubation-support-order-refused-${this.currentTick}`, 'Record cause-linked support before reviewing the fixed response.'); break; }
        if (this.postIntubationReassessmentAtTick !== null) { this.log('warning', 'assessment', `post-intubation-reassessment-refused-${this.currentTick}`, 'The fixed support-response panel has already been reviewed.'); break; }
        this.postIntubationReassessmentAtTick = this.currentTick;
        this.log('critical', 'assessment', `post-intubation-response-reassessed-${this.currentTick}`,
          'Fixed response after 5 minutes: MAP is 67 mmHg, HR 108/min, capillary refill 3 seconds, stroke volume 58 mL, SpO₂ 96%, peak pressure 27 cm H₂O, plateau 21 cm H₂O, and lungs remain clear without a new oxygenation penalty. Ongoing septic-shock resuscitation, serial perfusion, source treatment, and alternate-cause review remain open.', { reassessmentMinutes: 5, mapMmHg: 67, heartRateBpm: 108, capillaryRefillSeconds: 3, strokeVolumeMl: 58, spo2Percent: 96, lungsRemainClear: true });
        break;
      }
      case 'cardiogenic-shock-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'cardiogenic-shock');
        const valid = ['recognize-cardiogenic-shock-trajectory',
          'review-cardiogenic-shock-cause-and-phenotype', 'record-cardiogenic-shock-bridge',
          'escalate-cardiogenic-shock-cause-control',
          'reassess-cardiogenic-shock-trajectory'].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `cardiogenic-shock-response-refused-${this.currentTick}`,
            supported ? 'The cardiogenic-shock action was not one of the listed choices. Nothing changed.'
              : 'The bounded cardiogenic-shock choices are available only in the declared lesson.');
          break;
        }
        if (response === 'recognize-cardiogenic-shock-trajectory') {
          if (this.cardiogenicShockRecognitionAtTick !== null) { this.log('warning', 'assessment', `cardiogenic-shock-recognition-refused-${this.currentTick}`, 'The perfusion trajectory and shock-team activation have already been recorded.'); break; }
          this.cardiogenicShockRecognitionAtTick = this.currentTick;
          this.log('critical', 'assessment', `cardiogenic-shock-trajectory-recognized-${this.currentTick}`,
            'MAP 58 mmHg accompanies cool mottling, 5-second capillary refill, new confusion, urine output 10 mL/h, and lactate rising from 3.1 to 4.8 mmol/L. Multidisciplinary shock and catheterization help were activated from the worsening perfusion trajectory, not pressure alone.', { mapMmHg: 58, capillaryRefillSeconds: 5, urineOutputMlPerHour: 10, lactateFromMmolPerL: 3.1, lactateToMmolPerL: 4.8, shockTeam: true, catheterizationTeam: true });
          break;
        }
        if (this.cardiogenicShockRecognitionAtTick === null) { this.log('warning', 'assessment', `cardiogenic-shock-recognition-order-refused-${this.currentTick}`, 'Recognize the perfusion trajectory and activate experienced shock help first.'); break; }
        if (response === 'review-cardiogenic-shock-cause-and-phenotype') {
          if (this.cardiogenicShockPhenotypeAtTick !== null) { this.log('warning', 'assessment', `cardiogenic-shock-phenotype-refused-${this.currentTick}`, 'The fixed cause-and-phenotype panel has already been reviewed.'); break; }
          this.cardiogenicShockPhenotypeAtTick = this.currentTick;
          this.log('critical', 'assessment', `cardiogenic-shock-phenotype-reviewed-${this.currentTick}`,
            'Fixed panel: persistent anterior ST elevation, severe LV systolic dysfunction with anterior and apical akinesis, preserved RV size, bilateral B-lines, no effusion, and no reported acute severe MR or VSD. This supports an acute-MI, left-sided congested phenotype without excluding evolving mechanical, rhythm, right-heart, or noncardiac causes.', { anteriorStElevation: true, severeLvDysfunction: true, preservedRvSize: true, bilateralBLines: true, pericardialEffusion: false, acuteSevereMrReported: false, vsdReported: false });
          break;
        }
        if (this.cardiogenicShockPhenotypeAtTick === null) { this.log('warning', 'assessment', `cardiogenic-shock-phenotype-order-refused-${this.currentTick}`, 'Review the cause, phenotype, congestion, and dangerous alternatives before recording a bridge.'); break; }
        if (response === 'record-cardiogenic-shock-bridge') {
          if (this.cardiogenicShockBridgeAtTick !== null) { this.log('warning', 'assessment', `cardiogenic-shock-bridge-refused-${this.currentTick}`, 'The bounded bridge intent has already been recorded.'); break; }
          this.cardiogenicShockBridgeAtTick = this.currentTick;
          this.log('critical', 'assessment', `cardiogenic-shock-bridge-recorded-${this.currentTick}`,
            'Norepinephrine bridge intent was recorded against pressure and tissue perfusion while definitive care mobilized. Primary fluid loading was withheld in this left-sided congested phenotype. No universal target, access, concentration, rate, dose, pump, fluid, or drug delivery is simulated.', { norepinephrine: true, perfusionLinked: true, primaryFluidLoading: false, intentOnly: true });
          break;
        }
        if (this.cardiogenicShockBridgeAtTick === null) { this.log('warning', 'assessment', `cardiogenic-shock-bridge-order-refused-${this.currentTick}`, 'Record a phenotype-linked bridge before definitive cause control.'); break; }
        if (response === 'escalate-cardiogenic-shock-cause-control') {
          if (this.cardiogenicShockCauseControlAtTick !== null) { this.log('warning', 'assessment', `cardiogenic-shock-cause-control-refused-${this.currentTick}`, 'The definitive cause-control pathway has already been recorded.'); break; }
          this.cardiogenicShockCauseControlAtTick = this.currentTick;
          this.log('critical', 'assessment', `cardiogenic-shock-cause-control-escalated-${this.currentTick}`,
            'Prompt culprit-vessel revascularization was prioritized through the active catheterization pathway. Inotrope, invasive-hemodynamic, transfer, and temporary-support choices remained multidisciplinary and trajectory dependent; no routine device or immediate multivessel intervention was recorded.', { culpritVesselRevascularization: true, routineDevice: false, routineImmediateMultivesselIntervention: false, expertSelection: true });
          break;
        }
        if (this.cardiogenicShockCauseControlAtTick === null) { this.log('warning', 'assessment', `cardiogenic-shock-cause-control-order-refused-${this.currentTick}`, 'Prioritize cause control before reviewing the fixed response.'); break; }
        if (this.cardiogenicShockReassessmentAtTick !== null) { this.log('warning', 'assessment', `cardiogenic-shock-reassessment-refused-${this.currentTick}`, 'The fixed trajectory reassessment has already been reviewed.'); break; }
        this.cardiogenicShockReassessmentAtTick = this.currentTick;
        this.log('critical', 'assessment', `cardiogenic-shock-trajectory-reassessed-${this.currentTick}`,
          'Fixed response after 10 minutes: MAP is 68 mmHg, HR 104/min, capillary refill 3 seconds, mentation is clearer, SpO₂ is 94%, crackles persist, and urine and lactate response remain too early to declare. Revascularization, serial perfusion, rhythm, congestion, organ trajectory, and escalation work remain open.', { reassessmentMinutes: 10, mapMmHg: 68, heartRateBpm: 104, capillaryRefillSeconds: 3, spo2Percent: 94, cracklesPersist: true, urineResponseKnown: false, lactateResponseKnown: false });
        break;
      }
      case 'mixed-shock-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'mixed-shock');
        const valid = ['recognize-mixed-shock-discordance', 'classify-mixed-shock-hemodynamics',
          'record-mixed-shock-support', 'address-mixed-shock-causes',
          'reassess-mixed-shock-trajectory'].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `mixed-shock-response-refused-${this.currentTick}`,
            supported ? 'The mixed-shock action was not one of the listed choices. Nothing changed.'
              : 'The bounded mixed-shock choices are available only in the declared lesson.');
          break;
        }
        if (response === 'recognize-mixed-shock-discordance') {
          if (this.mixedShockRecognitionAtTick !== null) { this.log('warning', 'assessment', `mixed-shock-recognition-refused-${this.currentTick}`, 'The discordant trajectory and experienced-team activation have already been recorded.'); break; }
          this.mixedShockRecognitionAtTick = this.currentTick;
          this.log('critical', 'assessment', `mixed-shock-discordance-recognized-${this.currentTick}`,
            'MAP 54 mmHg accompanies rising lactate, oliguria, confusion, mottled knees, warm hands, fever, pulmonary congestion, pneumonia, and known LV dysfunction despite reported vasoactive support. Shock, cardiac, and infection help were activated because one pure-shock label does not explain the trajectory.', { mapMmHg: 54, lactateFromMmolPerL: 3.4, lactateToMmolPerL: 5.1, urineOutputMlPerHour: 10, warmHands: true, mottledKnees: true, shockTeam: true, cardiacTeam: true, infectionTeam: true });
          break;
        }
        if (this.mixedShockRecognitionAtTick === null) { this.log('warning', 'assessment', `mixed-shock-recognition-order-refused-${this.currentTick}`, 'Recognize the discordant whole-patient trajectory and activate experienced help first.'); break; }
        if (response === 'classify-mixed-shock-hemodynamics') {
          if (this.mixedShockHemodynamicsAtTick !== null) { this.log('warning', 'assessment', `mixed-shock-hemodynamics-refused-${this.currentTick}`, 'The fixed mixed-hemodynamic panel has already been reviewed.'); break; }
          this.mixedShockHemodynamicsAtTick = this.currentTick;
          this.log('critical', 'assessment', `mixed-shock-hemodynamics-classified-${this.currentTick}`,
            'Fixed panel: cardiac index 1.7 L/min/m², wedge pressure 24 mmHg, CVP 11 mmHg, SVR 720 dyn·s/cm⁵, LVEF 25%, preserved RV size, B-lines, and pneumonia consolidation. In treatment context this supports a cardiac-vasodilatory mixed phenotype; the values are authored prompts, not universal diagnostic cutoffs.', { cardiacIndexLPerMinM2: 1.7, wedgePressureMmHg: 24, cvpMmHg: 11, svrDynSecPerCm5: 720, lvefPercent: 25, cardiacVasodilatoryPhenotype: true, universalCutoffs: false });
          break;
        }
        if (this.mixedShockHemodynamicsAtTick === null) { this.log('warning', 'assessment', `mixed-shock-hemodynamics-order-refused-${this.currentTick}`, 'Integrate output, filling pressure, vascular tone, treatment context, and the whole patient before recording support.'); break; }
        if (response === 'record-mixed-shock-support') {
          if (this.mixedShockSupportAtTick !== null) { this.log('warning', 'assessment', `mixed-shock-support-refused-${this.currentTick}`, 'The bounded mixed-physiology support intent has already been recorded.'); break; }
          this.mixedShockSupportAtTick = this.currentTick;
          this.log('critical', 'assessment', `mixed-shock-support-recorded-${this.currentTick}`,
            'Vascular-tone support and expert review of output support were recorded concurrently, with pressure, perfusion, rhythm, and congestion guardrails. Blind fluid loading was withheld because filling pressure and lung congestion are already high. No universal agent, target, access, dose, pump, fluid, or drug delivery is simulated.', { toneSupport: true, outputSupportReview: true, concurrentSupport: true, primaryFluidLoading: false, intentOnly: true });
          break;
        }
        if (this.mixedShockSupportAtTick === null) { this.log('warning', 'assessment', `mixed-shock-support-order-refused-${this.currentTick}`, 'Record support for both physiological halves before reviewing cause control.'); break; }
        if (response === 'address-mixed-shock-causes') {
          if (this.mixedShockCausesAtTick !== null) { this.log('warning', 'assessment', `mixed-shock-causes-refused-${this.currentTick}`, 'The parallel cause-control pathways have already been recorded.'); break; }
          this.mixedShockCausesAtTick = this.currentTick;
          this.log('critical', 'assessment', `mixed-shock-causes-addressed-${this.currentTick}`,
            'Cardiac ischemia, mechanical-complication, rhythm, congestion, and device-escalation review remained active alongside pneumonia antimicrobial, culture, source, and complication work. The mixed label did not close either cause pathway.', { cardiacCausePathway: true, pneumoniaCausePathway: true, mechanicalAlternativesOpen: true, mixedLabelClosesCauses: false });
          break;
        }
        if (this.mixedShockCausesAtTick === null) { this.log('warning', 'assessment', `mixed-shock-causes-order-refused-${this.currentTick}`, 'Keep cardiac and infectious cause-control pathways active before reviewing the fixed response.'); break; }
        if (this.mixedShockReassessmentAtTick !== null) { this.log('warning', 'assessment', `mixed-shock-reassessment-refused-${this.currentTick}`, 'The fixed mixed-shock reassessment has already been reviewed.'); break; }
        this.mixedShockReassessmentAtTick = this.currentTick;
        this.log('critical', 'assessment', `mixed-shock-trajectory-reassessed-${this.currentTick}`,
          'Fixed response after 10 minutes: MAP is 66 mmHg, HR 112/min, capillary refill 3 seconds, cardiac index 1.9 L/min/m², SVR 850 dyn·s/cm⁵, wedge pressure 23 mmHg, and SpO₂ 94%. Congestion persists; urine and lactate response remain too early to declare. Both cause pathways and serial organ trajectory remain open.', { reassessmentMinutes: 10, mapMmHg: 66, heartRateBpm: 112, capillaryRefillSeconds: 3, cardiacIndexLPerMinM2: 1.9, svrDynSecPerCm5: 850, wedgePressureMmHg: 23, spo2Percent: 94, congestionPersists: true, urineResponseKnown: false, lactateResponseKnown: false });
        break;
      }
      case 'right-ventricular-failure-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'right-ventricular-failure');
        const valid = ['recognize-rv-failure-trajectory', 'review-rv-failure-phenotype',
          'record-rv-failure-support', 'address-rv-failure-triggers',
          'reassess-rv-failure-trajectory'].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `rv-failure-response-refused-${this.currentTick}`,
            supported ? 'The right-ventricular-failure action was not one of the listed choices. Nothing changed.'
              : 'The bounded right-ventricular-failure choices are available only in the declared lesson.');
          break;
        }
        if (response === 'recognize-rv-failure-trajectory') {
          if (this.rvFailureRecognitionAtTick !== null) { this.log('warning', 'assessment', `rv-failure-recognition-refused-${this.currentTick}`, 'The congestion-underperfusion trajectory and experienced-team activation have already been recorded.'); break; }
          this.rvFailureRecognitionAtTick = this.currentTick;
          this.log('critical', 'assessment', `rv-failure-trajectory-recognized-${this.currentTick}`,
            'MAP 58 mmHg accompanies cool extremities, 5-second capillary refill, slowing mentation, urine output 12 mL/h, lactate rising from 2.8 to 4.3 mmol/L, elevated JVP, edema, and abdominal distension. Pulmonary-hypertension, cardiac, and shock help were activated from simultaneous systemic congestion and underperfusion.', { mapMmHg: 58, capillaryRefillSeconds: 5, urineOutputMlPerHour: 12, lactateFromMmolPerL: 2.8, lactateToMmolPerL: 4.3, systemicCongestion: true, underperfusion: true, pulmonaryHypertensionTeam: true, cardiacTeam: true, shockTeam: true });
          break;
        }
        if (this.rvFailureRecognitionAtTick === null) { this.log('warning', 'assessment', `rv-failure-recognition-order-refused-${this.currentTick}`, 'Recognize the congestion-underperfusion trajectory and activate experienced help first.'); break; }
        if (response === 'review-rv-failure-phenotype') {
          if (this.rvFailurePhenotypeAtTick !== null) { this.log('warning', 'assessment', `rv-failure-phenotype-refused-${this.currentTick}`, 'The fixed RV phenotype panel has already been reviewed.'); break; }
          this.rvFailurePhenotypeAtTick = this.currentTick;
          this.log('critical', 'assessment', `rv-failure-phenotype-reviewed-${this.currentTick}`,
            'Fixed panel: severe RV dilation and systolic dysfunction, systolic septal flattening, a small underfilled LV, no effusion, CVP 18 mmHg, wedge pressure 10 mmHg, and cardiac index 1.8 L/min/m². This supports a pressure-loaded RV-failure phenotype with high right-sided filling pressure and low output; the authored values are not universal diagnostic or treatment cutoffs.', { severeRvDilation: true, reducedRvSystolicFunction: true, systolicSeptalFlattening: true, smallUnderfilledLv: true, pericardialEffusion: false, cvpMmHg: 18, wedgePressureMmHg: 10, cardiacIndexLPerMinM2: 1.8, pressureLoadedRvPhenotype: true, universalCutoffs: false });
          break;
        }
        if (this.rvFailurePhenotypeAtTick === null) { this.log('warning', 'assessment', `rv-failure-phenotype-order-refused-${this.currentTick}`, 'Review the fixed RV phenotype and hemodynamic context before recording support.'); break; }
        if (response === 'record-rv-failure-support') {
          if (this.rvFailureSupportAtTick !== null) { this.log('warning', 'assessment', `rv-failure-support-refused-${this.currentTick}`, 'The bounded RV-support intent has already been recorded.'); break; }
          this.rvFailureSupportAtTick = this.currentTick;
          this.log('critical', 'assessment', `rv-failure-support-recorded-${this.currentTick}`,
            'Expert-selected intent was recorded to protect systemic perfusion, oxygenation, acid-base balance, sinus rhythm, RV contractility, and pulmonary afterload while individualizing preload from congestion, output, and response. Neither reflex fluid loading nor reflex decongestion was selected. No universal target, agent, access, dose, pump, oxygen, ventilation, fluid, diuresis, or drug delivery is simulated.', { systemicPerfusionReview: true, oxygenationAcidBaseReview: true, sinusRhythmReview: true, rvContractilityReview: true, pulmonaryAfterloadReview: true, individualizedPreload: true, reflexFluidLoading: false, reflexDecongestion: false, intentOnly: true });
          break;
        }
        if (this.rvFailureSupportAtTick === null) { this.log('warning', 'assessment', `rv-failure-support-order-refused-${this.currentTick}`, 'Record an individualized RV-support intent before reviewing triggers.'); break; }
        if (response === 'address-rv-failure-triggers') {
          if (this.rvFailureTriggersAtTick !== null) { this.log('warning', 'assessment', `rv-failure-triggers-refused-${this.currentTick}`, 'The reversible-trigger and pulmonary-vascular pathways have already been recorded.'); break; }
          this.rvFailureTriggersAtTick = this.currentTick;
          this.log('critical', 'assessment', `rv-failure-triggers-addressed-${this.currentTick}`,
            'Hypoxia, acidosis, infection, arrhythmia, ischemia, acute pulmonary embolism, medication interruption, and airway-pressure contributors remained under review while specialist pulmonary-vascular therapy was reconciled. The RV-failure phenotype did not close the precipitant search.', { hypoxiaAcidosisReview: true, infectionReview: true, arrhythmiaIschemiaReview: true, pulmonaryEmbolismReview: true, medicationInterruptionReview: true, airwayPressureReview: true, specialistPulmonaryVascularPathway: true, precipitantSearchClosed: false });
          break;
        }
        if (this.rvFailureTriggersAtTick === null) { this.log('warning', 'assessment', `rv-failure-triggers-order-refused-${this.currentTick}`, 'Keep reversible triggers and the specialist pulmonary-vascular pathway active before reassessment.'); break; }
        if (this.rvFailureReassessmentAtTick !== null) { this.log('warning', 'assessment', `rv-failure-reassessment-refused-${this.currentTick}`, 'The fixed RV-failure reassessment has already been reviewed.'); break; }
        this.rvFailureReassessmentAtTick = this.currentTick;
        this.log('critical', 'assessment', `rv-failure-trajectory-reassessed-${this.currentTick}`,
          'Fixed response after 10 minutes: MAP is 66 mmHg, HR 108/min in sinus rhythm, capillary refill is 3 seconds, mentation is clearer, SpO₂ is 94%, CVP is 17 mmHg, and cardiac index is 2.0 L/min/m². Edema and JVP elevation persist; urine and lactate response remain too early to declare. Serial RV, congestion, perfusion, oxygenation, trigger, and organ trajectories remain open.', { reassessmentMinutes: 10, mapMmHg: 66, heartRateBpm: 108, sinusRhythm: true, capillaryRefillSeconds: 3, spo2Percent: 94, cvpMmHg: 17, cardiacIndexLPerMinM2: 2, systemicCongestionPersists: true, urineResponseKnown: false, lactateResponseKnown: false });
        break;
      }
      case 'massive-pulmonary-embolism-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'massive-pulmonary-embolism');
        const valid = ['recognize-refractory-pe-shock', 'review-refractory-pe-pattern',
          'record-refractory-pe-support', 'activate-pe-ecmo-bridge',
          'reassess-pe-ecmo-trajectory'].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `massive-pe-response-refused-${this.currentTick}`,
            supported ? 'The massive-pulmonary-embolism action was not one of the listed choices. Nothing changed.'
              : 'The bounded massive-pulmonary-embolism choices are available only in the declared lesson.');
          break;
        }
        if (response === 'recognize-refractory-pe-shock') {
          if (this.massivePeRecognitionAtTick !== null) { this.log('warning', 'assessment', `massive-pe-recognition-refused-${this.currentTick}`, 'Category E2R recognition and rescue-team activation have already been recorded.'); break; }
          this.massivePeRecognitionAtTick = this.currentTick;
          this.log('critical', 'assessment', `massive-pe-shock-recognized-${this.currentTick}`,
            'Confirmed acute PE accompanies MAP 50 mmHg despite 3 reported vasoactive infusions, lactate rising from 5.2 to 8.1 mmol/L, 6-second refill, mottling, oliguria, altered mentation, and SpO₂ 82% on invasive ventilation. Category E2R refractory cardiopulmonary failure triggered PERT, shock, resuscitation, perfusion, and ECMO-capable team activation.', { category: 'E2R', mapMmHg: 50, vasoactiveInfusionsReported: 3, lactateFromMmolPerL: 5.2, lactateToMmolPerL: 8.1, capillaryRefillSeconds: 6, urineOutputMlPerHour: 5, spo2Percent: 82, pertActivated: true, ecmoCapableTeamActivated: true });
          break;
        }
        if (this.massivePeRecognitionAtTick === null) { this.log('warning', 'assessment', `massive-pe-recognition-order-refused-${this.currentTick}`, 'Recognize refractory PE cardiopulmonary failure and activate rescue teams first.'); break; }
        if (response === 'review-refractory-pe-pattern') {
          if (this.massivePePatternAtTick !== null) { this.log('warning', 'assessment', `massive-pe-pattern-refused-${this.currentTick}`, 'The fixed obstructive-shock panel has already been reviewed.'); break; }
          this.massivePePatternAtTick = this.currentTick;
          this.log('critical', 'assessment', `massive-pe-pattern-reviewed-${this.currentTick}`,
            'Fixed CT confirms acute central PE; echo reports severe RV dilation and hypokinesis, septal flattening, a small LV, and no effusion. Continuous capnography and bilateral ventilation are reported, with no tension-pneumothorax or active external bleeding pattern. This supports acute obstructive RV failure without closing bleeding or coexisting-cause review.', { acuteCentralPeConfirmed: true, severeRvDilation: true, severeRvHypokinesis: true, septalFlattening: true, smallLv: true, pericardialEffusion: false, bilateralVentilationReported: true, tensionPneumothoraxPattern: false, activeExternalBleedingPattern: false });
          break;
        }
        if (this.massivePePatternAtTick === null) { this.log('warning', 'assessment', `massive-pe-pattern-order-refused-${this.currentTick}`, 'Review the fixed PE, RV, ventilation, perfusion, bleeding, and alternate-cause context before support.'); break; }
        if (response === 'record-refractory-pe-support') {
          if (this.massivePeSupportAtTick !== null) { this.log('warning', 'assessment', `massive-pe-support-refused-${this.currentTick}`, 'The bounded RV-sensitive support review has already been recorded.'); break; }
          this.massivePeSupportAtTick = this.currentTick;
          this.log('critical', 'assessment', `massive-pe-support-recorded-${this.currentTick}`,
            'RV-sensitive systemic-perfusion, oxygenation, ventilatory-pressure, rhythm, and anticoagulation review was recorded while avoiding blind fluid loading. No universal target, fluid plan, agent, access, dose, oxygen or ventilator change, anticoagulation, or drug delivery is simulated.', { systemicPerfusionReview: true, oxygenationReview: true, ventilatoryPressureReview: true, rhythmReview: true, anticoagulationReview: true, blindFluidLoading: false, intentOnly: true });
          break;
        }
        if (this.massivePeSupportAtTick === null) { this.log('warning', 'assessment', `massive-pe-support-order-refused-${this.currentTick}`, 'Record RV-sensitive support review before activating the rescue bridge.'); break; }
        if (response === 'activate-pe-ecmo-bridge') {
          if (this.massivePeEcmoAtTick !== null) { this.log('warning', 'assessment', `massive-pe-ecmo-refused-${this.currentTick}`, 'The resource-dependent VA-ECMO bridge pathway has already been activated.'); break; }
          this.massivePeEcmoAtTick = this.currentTick;
          this.log('critical', 'assessment', `massive-pe-ecmo-activated-${this.currentTick}`,
            'VA-ECMO candidacy, perfusion, and cannulation pathways were activated as resource-dependent temporary support for Category E2 refractory PE shock. The bridge supports perfusion and oxygenation; it does not remove thrombus, guarantee candidacy, or establish one universal device strategy. Cannulation and ECMO delivery are not simulated.', { category: 'E2', vaEcmoPathwayActivated: true, resourceDependent: true, candidacyRequired: true, temporarySupport: true, thrombusTreatment: false, deviceDelivered: false });
          break;
        }
        if (this.massivePeEcmoAtTick === null) { this.log('warning', 'assessment', `massive-pe-ecmo-order-refused-${this.currentTick}`, 'Activate the resource-ready rescue bridge before reviewing the fixed response.'); break; }
        if (this.massivePeReassessmentAtTick !== null) { this.log('warning', 'assessment', `massive-pe-reassessment-refused-${this.currentTick}`, 'The fixed post-bridge trajectory has already been reviewed.'); break; }
        this.massivePeReassessmentAtTick = this.currentTick;
        this.log('critical', 'assessment', `massive-pe-trajectory-reassessed-${this.currentTick}`,
          'Fixed response after specialist bridge initiation: MAP is 68 mmHg, HR 112/min, capillary refill 3 seconds, SpO₂ 94%, and mentation cannot yet be assessed. Severe RV dysfunction and the embolic burden remain; urine and lactate response are too early to declare. Additional thrombolysis, catheter, thrombectomy, or surgical therapy remains individualized because benefit on VA-ECMO is not established.', { mapMmHg: 68, heartRateBpm: 112, capillaryRefillSeconds: 3, spo2Percent: 94, severeRvDysfunctionPersists: true, thrombusPersists: true, urineResponseKnown: false, lactateResponseKnown: false, adjunctiveReperfusionBenefitEstablished: false });
        break;
      }
      case 'upper-gi-hemorrhage-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'upper-gi-hemorrhage');
        const valid = ['recognize-recurrent-upper-gi-hemorrhage',
          'review-upper-gi-hemorrhage-pattern', 'record-upper-gi-hemorrhage-resuscitation',
          'activate-repeat-endoscopy-pathway',
          'reassess-upper-gi-hemorrhage-trajectory'].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `upper-gi-hemorrhage-response-refused-${this.currentTick}`,
            supported ? 'The upper-GI-hemorrhage action was not one of the listed choices. Nothing changed.'
              : 'The bounded upper-GI-hemorrhage choices are available only in the declared lesson.');
          break;
        }
        if (response === 'recognize-recurrent-upper-gi-hemorrhage') {
          if (this.upperGiHemorrhageRecognitionAtTick !== null) { this.log('warning', 'assessment', `upper-gi-hemorrhage-recognition-refused-${this.currentTick}`, 'Recurrent hemorrhage recognition and experienced-team activation have already been recorded.'); break; }
          this.upperGiHemorrhageRecognitionAtTick = this.currentTick;
          this.log('critical', 'assessment', `upper-gi-hemorrhage-recognized-${this.currentTick}`,
            'New hematemesis and melena accompany MAP 55 mmHg, HR 122/min, 5-second refill, cool extremities, oliguria, lactate rising from 2.1 to 4.6 mmol/L, and hemoglobin falling from 8.4 to 6.8 g/dL. Recurrent upper-GI hemorrhage triggered GI, hemorrhage, critical-care, and blood-bank activation.', { mapMmHg: 55, heartRateBpm: 122, capillaryRefillSeconds: 5, urineOutputMlPerHour: 10, lactateFromMmolPerL: 2.1, lactateToMmolPerL: 4.6, hemoglobinFromGPerDl: 8.4, hemoglobinToGPerDl: 6.8, giTeamActivated: true, hemorrhageTeamActivated: true, bloodBankActivated: true });
          break;
        }
        if (this.upperGiHemorrhageRecognitionAtTick === null) { this.log('warning', 'assessment', `upper-gi-hemorrhage-recognition-order-refused-${this.currentTick}`, 'Recognize the recurrent bleeding and impaired-perfusion trajectory and activate experienced help first.'); break; }
        if (response === 'review-upper-gi-hemorrhage-pattern') {
          if (this.upperGiHemorrhagePatternAtTick !== null) { this.log('warning', 'assessment', `upper-gi-hemorrhage-pattern-refused-${this.currentTick}`, 'The fixed bleeding, perfusion, airway, medication, and alternate-source panel has already been reviewed.'); break; }
          this.upperGiHemorrhagePatternAtTick = this.currentTick;
          this.log('critical', 'assessment', `upper-gi-hemorrhage-pattern-reviewed-${this.currentTick}`,
            'Fixed review reports recurrent hematemesis and melena after prior duodenal-ulcer hemostasis, a soft nontender abdomen, no cirrhosis or known varices, no external bleeding, and no chest-pain or focal-neurologic pattern. Airway protection, medications, coagulation, comorbidity, and other bleeding sources remain under review; hemoglobin is one part of the trajectory, not a stand-alone perfusion measure.', { recurrentHematemesis: true, melena: true, priorDuodenalUlcerHemostasis: true, cirrhosisReported: false, knownVarices: false, externalBleeding: false, airwayReviewOpen: true, alternateSourceReviewOpen: true, hemoglobinStandalonePerfusionMeasure: false });
          break;
        }
        if (this.upperGiHemorrhagePatternAtTick === null) { this.log('warning', 'assessment', `upper-gi-hemorrhage-pattern-order-refused-${this.currentTick}`, 'Review the fixed bleeding, perfusion, airway, medication, and alternate-source context before recording resuscitation.'); break; }
        if (response === 'record-upper-gi-hemorrhage-resuscitation') {
          if (this.upperGiHemorrhageResuscitationAtTick !== null) { this.log('warning', 'assessment', `upper-gi-hemorrhage-resuscitation-refused-${this.currentTick}`, 'The individualized resuscitation and transfusion review has already been recorded.'); break; }
          this.upperGiHemorrhageResuscitationAtTick = this.currentTick;
          this.log('critical', 'assessment', `upper-gi-hemorrhage-resuscitation-recorded-${this.currentTick}`,
            'Hemodynamic support, large-bore access, serial blood count, coagulation, fibrinogen, chemistry, lactate, type and crossmatch, medication, comorbidity, and blood-bank review were recorded. Restrictive red-cell transfusion intent was individualized to active bleeding and the whole patient; 7 g/dL was not treated as a universal trigger. No access, specimen, fluid, blood product, oxygen, or drug was delivered.', { hemodynamicSupportReview: true, largeBoreAccessReview: true, serialLaboratoryReview: true, typeAndCrossmatchReview: true, bloodBankReview: true, restrictiveTransfusionIntent: true, universalHemoglobinTrigger: false, productDelivered: false, intentOnly: true });
          break;
        }
        if (this.upperGiHemorrhageResuscitationAtTick === null) { this.log('warning', 'assessment', `upper-gi-hemorrhage-resuscitation-order-refused-${this.currentTick}`, 'Record individualized resuscitation and transfusion review before definitive-hemostasis escalation.'); break; }
        if (response === 'activate-repeat-endoscopy-pathway') {
          if (this.upperGiHemorrhageHemostasisAtTick !== null) { this.log('warning', 'assessment', `upper-gi-hemorrhage-hemostasis-refused-${this.currentTick}`, 'The repeat-endoscopy and failure-escalation pathways have already been activated.'); break; }
          this.upperGiHemorrhageHemostasisAtTick = this.currentTick;
          this.log('critical', 'assessment', `upper-gi-hemorrhage-hemostasis-activated-${this.currentTick}`,
            'Repeat endoscopy was activated for recurrent ulcer bleeding while resuscitation continued. Transcatheter angiographic embolization remained the next pathway after failed repeat endoscopic hemostasis, with surgery preserved when embolization is unavailable or fails. No endoscopy, embolization, surgery, or hemostasis is simulated.', { repeatEndoscopyActivated: true, embolizationAfterEndoscopicFailure: true, surgeryAfterUnavailableOrFailedEmbolization: true, proceedsAlongsideResuscitation: true, procedureDelivered: false });
          break;
        }
        if (this.upperGiHemorrhageHemostasisAtTick === null) { this.log('warning', 'assessment', `upper-gi-hemorrhage-hemostasis-order-refused-${this.currentTick}`, 'Activate repeat endoscopy and preserve failure pathways before reviewing the fixed response.'); break; }
        if (this.upperGiHemorrhageReassessmentAtTick !== null) { this.log('warning', 'assessment', `upper-gi-hemorrhage-reassessment-refused-${this.currentTick}`, 'The fixed post-bridge trajectory has already been reviewed.'); break; }
        this.upperGiHemorrhageReassessmentAtTick = this.currentTick;
        this.log('critical', 'assessment', `upper-gi-hemorrhage-trajectory-reassessed-${this.currentTick}`,
          'Fixed response after the authored resuscitation bridge: MAP is 68 mmHg, HR 104/min, capillary refill is 3 seconds, and mentation is clearer. No further hematemesis occurs during this brief window, but hemostasis is not proven; repeat endoscopy, serial hemoglobin, lactate, urine output, medication decisions, organ trajectory, and failure pathways remain open.', { mapMmHg: 68, heartRateBpm: 104, capillaryRefillSeconds: 3, mentationClearer: true, hematemesisDuringBriefWindow: false, hemostasisProven: false, hemoglobinResponseKnown: false, lactateResponseKnown: false, urineResponseKnown: false });
        break;
      }
      case 'critical-care-status-epilepticus-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'critical-care-status-epilepticus');
        const valid = ['recognize-refractory-status-epilepticus',
          'review-refractory-status-pattern', 'activate-refractory-status-pathway',
          'address-refractory-status-causes',
          'reassess-refractory-status-trajectory'].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `critical-care-status-response-refused-${this.currentTick}`,
            supported ? 'The critical-care status-epilepticus action was not one of the listed choices. Nothing changed.'
              : 'The bounded refractory-status choices are available only in the declared lesson.');
          break;
        }
        if (response === 'recognize-refractory-status-epilepticus') {
          if (this.criticalCareStatusRecognitionAtTick !== null) { this.log('warning', 'assessment', `critical-care-status-recognition-refused-${this.currentTick}`, 'Refractory electrographic status recognition and experienced-team activation have already been recorded.'); break; }
          this.criticalCareStatusRecognitionAtTick = this.currentTick;
          this.log('critical', 'assessment', `critical-care-status-recognized-${this.currentTick}`,
            'Fixed continuous EEG reports recurrent evolving electrographic seizures without recovery despite reported adequate lorazepam and levetiracetam. Visible convulsions stopped 12 minutes ago, but absent movement did not establish seizure control. Neurocritical-care, epilepsy, EEG, pharmacy, airway, and critical-care teams were activated.', { emergentTherapyReported: true, urgentTherapyReported: true, electrographicSeizuresPersist: true, visibleConvulsionsPresent: false, consciousnessRecovered: false, refractoryStatusPattern: true, neurocriticalCareActivated: true, epilepsyEegActivated: true });
          break;
        }
        if (this.criticalCareStatusRecognitionAtTick === null) { this.log('warning', 'assessment', `critical-care-status-recognition-order-refused-${this.currentTick}`, 'Recognize refractory electrographic status and activate experienced help first.'); break; }
        if (response === 'review-refractory-status-pattern') {
          if (this.criticalCareStatusPatternAtTick !== null) { this.log('warning', 'assessment', `critical-care-status-pattern-refused-${this.currentTick}`, 'The fixed EEG and systemic-risk panel has already been reviewed.'); break; }
          this.criticalCareStatusPatternAtTick = this.currentTick;
          this.log('critical', 'assessment', `critical-care-status-pattern-reviewed-${this.currentTick}`,
            'Fixed review links persistent EEG seizures and absent recovery with an intubated airway, reported bilateral ventilation and capnography, MAP 62 mmHg, HR 118/min, SpO₂ 94%, temperature 38.1°C, oliguria, and lactate 4.2 mmol/L. Glucose, electrolytes, medication delivery, physiology, and dangerous mimics remain active; the browser does not acquire or interpret EEG.', { continuousEegReportAuthored: true, airwaySecuredReported: true, bilateralVentilationReported: true, mapMmHg: 62, heartRateBpm: 118, spo2Percent: 94, temperatureC: 38.1, urineOutputMlPerHour: 18, lactateMmolPerL: 4.2, eegAcquiredOrInterpreted: false });
          break;
        }
        if (this.criticalCareStatusPatternAtTick === null) { this.log('warning', 'assessment', `critical-care-status-pattern-order-refused-${this.currentTick}`, 'Review the fixed EEG, airway, ventilation, perfusion, medication, and mimic context before activating refractory therapy.'); break; }
        if (response === 'activate-refractory-status-pathway') {
          if (this.criticalCareStatusPathwayAtTick !== null) { this.log('warning', 'assessment', `critical-care-status-pathway-refused-${this.currentTick}`, 'The continuous-anesthetic and EEG pathway has already been activated.'); break; }
          this.criticalCareStatusPathwayAtTick = this.currentTick;
          this.log('critical', 'assessment', `critical-care-status-pathway-activated-${this.currentTick}`,
            'Expert-selected continuous anesthetic therapy was activated with continuous EEG, ventilation, oxygenation, pressure, perfusion, temperature, and organ-support guardrails. No universal agent, dose, EEG depth, burst-suppression target, duration, access, pump, airway, ventilation, fluid, or drug delivery is simulated.', { continuousAnestheticPathwayActivated: true, continuousEegRequired: true, ventilationGuardrail: true, hemodynamicGuardrail: true, universalAgentOrDose: false, universalBurstSuppressionTarget: false, therapyDelivered: false });
          break;
        }
        if (this.criticalCareStatusPathwayAtTick === null) { this.log('warning', 'assessment', `critical-care-status-pathway-order-refused-${this.currentTick}`, 'Activate the expert refractory-status and continuous-EEG pathway before cause review.'); break; }
        if (response === 'address-refractory-status-causes') {
          if (this.criticalCareStatusCausesAtTick !== null) { this.log('warning', 'assessment', `critical-care-status-causes-refused-${this.currentTick}`, 'The reversible and dangerous cause pathways have already been recorded.'); break; }
          this.criticalCareStatusCausesAtTick = this.currentTick;
          this.log('critical', 'assessment', `critical-care-status-causes-addressed-${this.currentTick}`,
            'Metabolic, glucose, electrolyte, toxic, medication, infectious, structural, vascular, immune, and other cause pathways remained active alongside seizure suppression, including immediate treatment of any confirmed time-critical reversible cause. No specimen, test, imaging, lumbar puncture, diagnosis, or cause-directed therapy is simulated.', { metabolicCauseReview: true, toxicMedicationCauseReview: true, infectiousCauseReview: true, structuralVascularCauseReview: true, immuneCauseReview: true, causeSearchClosed: false, causeTreatmentDelivered: false });
          break;
        }
        if (this.criticalCareStatusCausesAtTick === null) { this.log('warning', 'assessment', `critical-care-status-causes-order-refused-${this.currentTick}`, 'Keep reversible and dangerous causes active before reviewing the fixed response.'); break; }
        if (this.criticalCareStatusReassessmentAtTick !== null) { this.log('warning', 'assessment', `critical-care-status-reassessment-refused-${this.currentTick}`, 'The fixed refractory-status reassessment has already been reviewed.'); break; }
        this.criticalCareStatusReassessmentAtTick = this.currentTick;
        this.log('critical', 'assessment', `critical-care-status-trajectory-reassessed-${this.currentTick}`,
          'Fixed response after specialist pathway activation: the authored EEG reports no electrographic seizure during a brief 10-minute window, MAP is 68 mmHg, HR 102/min, SpO₂ 96%, and temperature is 37.9°C. Durable seizure control, recurrence, EEG background, consciousness, anesthetic adverse effects, cause, organ recovery, weaning, prognosis, and outcome remain unknown.', { reassessmentMinutes: 10, electrographicSeizureDuringWindow: false, durableSeizureControlProven: false, mapMmHg: 68, heartRateBpm: 102, spo2Percent: 96, temperatureC: 37.9, consciousnessRecovered: false, causeKnown: false });
        break;
      }
      case 'targeted-temperature-management-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'targeted-temperature-management');
        const valid = ['recognize-post-arrest-temperature-control',
          'review-post-arrest-temperature-context', 'activate-post-arrest-temperature-protocol',
          'record-temperature-control-guardrails',
          'reassess-post-arrest-temperature-trajectory'].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `post-arrest-temperature-response-refused-${this.currentTick}`,
            supported ? 'The post-arrest temperature action was not one of the listed choices. Nothing changed.'
              : 'The bounded post-arrest temperature choices are available only in the declared lesson.');
          break;
        }
        if (response === 'recognize-post-arrest-temperature-control') {
          if (this.postArrestTemperatureRecognitionAtTick !== null) { this.log('warning', 'assessment', `post-arrest-temperature-recognition-refused-${this.currentTick}`, 'Temperature-control eligibility and experienced-team activation have already been recorded.'); break; }
          this.postArrestTemperatureRecognitionAtTick = this.currentTick;
          this.log('critical', 'assessment', `post-arrest-temperature-recognized-${this.currentTick}`,
            'The adult patient remains unresponsive to verbal commands after ROSC and core temperature is 38.3°C and rising. Deliberate protocolized temperature control and post-arrest, cardiac, neurologic, nursing, pharmacy, and temperature-control help were activated without making a neurologic prognosis.', { adultPostRosc: true, followsVerbalCommands: false, coreTemperatureC: 38.3, deliberateTemperatureControlIndicated: true, postArrestTeamActivated: true, neurologicPrognosisMade: false });
          break;
        }
        if (this.postArrestTemperatureRecognitionAtTick === null) { this.log('warning', 'assessment', `post-arrest-temperature-recognition-order-refused-${this.currentTick}`, 'Recognize temperature-control eligibility and activate experienced post-arrest help first.'); break; }
        if (response === 'review-post-arrest-temperature-context') {
          if (this.postArrestTemperatureContextAtTick !== null) { this.log('warning', 'assessment', `post-arrest-temperature-context-refused-${this.currentTick}`, 'The fixed post-ROSC neurologic and systemic context has already been reviewed.'); break; }
          this.postArrestTemperatureContextAtTick = this.currentTick;
          this.log('critical', 'assessment', `post-arrest-temperature-context-reviewed-${this.currentTick}`,
            'Fixed review reports no command following, equal reactive pupils, no current clinical or electrographic seizure, perfusing sinus rhythm, MAP 68 mmHg on reported support, bilateral ventilation, SpO₂ 96%, EtCO₂ 36 mmHg, no external bleeding, oliguria, lactate 5.1 mmol/L, and active arrest-cause evaluation. No isolated sign was used for prognosis.', { followsCommands: false, pupilsEqualReactive: true, currentClinicalSeizure: false, currentElectrographicSeizure: false, perfusingSinusRhythm: true, mapMmHg: 68, spo2Percent: 96, etco2MmHg: 36, externalBleeding: false, arrestCauseEvaluationOpen: true, isolatedPrognosticSignUsed: false });
          break;
        }
        if (this.postArrestTemperatureContextAtTick === null) { this.log('warning', 'assessment', `post-arrest-temperature-context-order-refused-${this.currentTick}`, 'Review the fixed neurologic, temperature, perfusion, oxygenation, ventilation, seizure, and cause context before choosing a protocol.'); break; }
        if (response === 'activate-post-arrest-temperature-protocol') {
          if (this.postArrestTemperatureProtocolAtTick !== null) { this.log('warning', 'assessment', `post-arrest-temperature-protocol-refused-${this.currentTick}`, 'The individualized protocolized temperature strategy has already been activated.'); break; }
          this.postArrestTemperatureProtocolAtTick = this.currentTick;
          this.log('critical', 'assessment', `post-arrest-temperature-protocol-activated-${this.currentTick}`,
            'An individualized local protocol was activated to maintain temperature within 32°C to 37.5°C for at least 36 hours while avoiding fever. No temperature within the range was treated as universally superior, and no cooling or warming device, fluid, medication, target-selection rule, or outcome benefit is simulated.', { minimumTemperatureC: 32, maximumTemperatureC: 37.5, minimumDurationHours: 36, feverAvoidance: true, universalBestTarget: false, deviceUsed: false, intentOnly: true });
          break;
        }
        if (this.postArrestTemperatureProtocolAtTick === null) { this.log('warning', 'assessment', `post-arrest-temperature-protocol-order-refused-${this.currentTick}`, 'Activate an individualized protocolized temperature range before recording guardrails.'); break; }
        if (response === 'record-temperature-control-guardrails') {
          if (this.postArrestTemperatureGuardrailsAtTick !== null) { this.log('warning', 'assessment', `post-arrest-temperature-guardrails-refused-${this.currentTick}`, 'Temperature-control monitoring and rewarming guardrails have already been recorded.'); break; }
          this.postArrestTemperatureGuardrailsAtTick = this.currentTick;
          this.log('critical', 'assessment', `post-arrest-temperature-guardrails-recorded-${this.currentTick}`,
            'Continuous core-temperature, shivering, sedation, ventilation, oxygenation, perfusion, rhythm, electrolytes, glucose, skin, device, and organ review were recorded. Routine rapid cold-IV-fluid loading was not selected, and rewarming faster than 0.5°C/h was avoided. No measurement, fluid, drug, device, cooling, warming, or shivering treatment is simulated.', { continuousCoreTemperatureReview: true, shiveringSedationReview: true, ventilationPerfusionReview: true, electrolyteGlucoseReview: true, skinDeviceReview: true, routineRapidColdIvFluid: false, maximumRewarmingRateCPerHour: 0.5, treatmentDelivered: false });
          break;
        }
        if (this.postArrestTemperatureGuardrailsAtTick === null) { this.log('warning', 'assessment', `post-arrest-temperature-guardrails-order-refused-${this.currentTick}`, 'Record temperature-control and whole-patient guardrails before reviewing the fixed response.'); break; }
        if (this.postArrestTemperatureReassessmentAtTick !== null) { this.log('warning', 'assessment', `post-arrest-temperature-reassessment-refused-${this.currentTick}`, 'The fixed post-arrest temperature reassessment has already been reviewed.'); break; }
        this.postArrestTemperatureReassessmentAtTick = this.currentTick;
        this.log('critical', 'assessment', `post-arrest-temperature-trajectory-reassessed-${this.currentTick}`,
          'Fixed response after 45 minutes: core temperature is 37.4°C within the selected protocol range, MAP is 70 mmHg, HR 92/min, SpO₂ 97%, and EtCO₂ 36 mmHg. Command following remains absent. Temperature durability, shivering, cause, seizures, cardiac function, organ recovery, neurologic recovery, neuroprognostication, and outcome remain open.', { reassessmentMinutes: 45, coreTemperatureC: 37.4, mapMmHg: 70, heartRateBpm: 92, spo2Percent: 97, etco2MmHg: 36, followsCommands: false, durableTemperatureControlProven: false, neurologicPrognosisMade: false });
        break;
      }
      case 'intracranial-hypertension-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'intracranial-hypertension');
        const valid = ['recognize-intracranial-hypertension',
          'review-intracranial-hypertension-context', 'activate-first-tier-brain-protection',
          'activate-individualized-hyperosmolar-rescue',
          'reassess-intracranial-hypertension-trajectory'].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `intracranial-hypertension-response-refused-${this.currentTick}`,
            supported ? 'The intracranial-hypertension action was not one of the listed choices. Nothing changed.'
              : 'The bounded intracranial-hypertension choices are available only in the declared lesson.');
          break;
        }
        if (response === 'recognize-intracranial-hypertension') {
          if (this.intracranialHypertensionRecognitionAtTick !== null) { this.log('warning', 'assessment', `intracranial-hypertension-recognition-refused-${this.currentTick}`, 'Intracranial-hypertension recognition and experienced-team activation have already been recorded.'); break; }
          this.intracranialHypertensionRecognitionAtTick = this.currentTick;
          this.log('critical', 'assessment', `intracranial-hypertension-recognized-${this.currentTick}`,
            'A consistent ICP waveform at 28 mmHg for 8 minutes, CPP 54 mmHg, and the fixed examination and imaging context triggered neurocritical, neurosurgical, nursing, respiratory-therapy, and pharmacy help. The pattern was not treated as a stand-alone diagnosis or prognosis.', { icpMmHg: 28, sustainedMinutes: 8, cppMmHg: 54, treatmentThresholdMmHg: 22, neurocriticalTeamActivated: true, neurosurgicalTeamActivated: true, diagnosisMade: false, prognosisMade: false });
          break;
        }
        if (this.intracranialHypertensionRecognitionAtTick === null) { this.log('warning', 'assessment', `intracranial-hypertension-recognition-order-refused-${this.currentTick}`, 'Recognize the sustained ICP and inadequate CPP pattern and activate experienced help first.'); break; }
        if (response === 'review-intracranial-hypertension-context') {
          if (this.intracranialHypertensionContextAtTick !== null) { this.log('warning', 'assessment', `intracranial-hypertension-context-refused-${this.currentTick}`, 'The fixed monitor, examination, imaging, systemic, and reversible-driver context has already been reviewed.'); break; }
          this.intracranialHypertensionContextAtTick = this.currentTick;
          this.log('critical', 'assessment', `intracranial-hypertension-context-reviewed-${this.currentTick}`,
            'Fixed review confirmed the reported ICP waveform and unchanged pupils, diffuse edema without a reported new evacuable lesion, head elevation only 10° with neck rotation, intermittent dyssynchrony, normoxia, EtCO₂ 40 mmHg, MAP 82 mmHg, temperature 37.7°C, no current seizure, sodium 140 mmol/L, preserved urine output, and no new bleeding or hypotension. Monitor fidelity, examination, and repeat imaging remain active clinical questions.', { waveformReportedConsistent: true, pupilChange: false, newEvacuableLesionReported: false, headElevationDegrees: 10, neckNeutral: false, dyssynchrony: true, hypoxemia: false, hypotension: false, currentSeizure: false, contextClosed: false });
          break;
        }
        if (this.intracranialHypertensionContextAtTick === null) { this.log('warning', 'assessment', `intracranial-hypertension-context-order-refused-${this.currentTick}`, 'Review the fixed monitor, examination, imaging, systemic, and reversible-driver context before activating protection.'); break; }
        if (response === 'activate-first-tier-brain-protection') {
          if (this.intracranialHypertensionProtectionAtTick !== null) { this.log('warning', 'assessment', `intracranial-hypertension-protection-refused-${this.currentTick}`, 'The first-tier positioning and systemic brain-protection intents have already been recorded.'); break; }
          this.intracranialHypertensionProtectionAtTick = this.currentTick;
          this.log('critical', 'assessment', `intracranial-hypertension-protection-activated-${this.currentTick}`,
            'Neutral head position and individualized elevation for venous drainage were recorded with oxygenation, ventilation, perfusion, temperature, analgesia, sedation, synchrony, glucose, sodium, and seizure-surveillance protection. CPP was individualized within 60–70 mmHg without aggressively forcing it above 70, and prolonged prophylactic aggressive hyperventilation was not selected. No positioning, monitoring, oxygen, ventilation, fluid, or drug delivery is simulated.', { venousDrainageProtected: true, systemicBrainProtection: true, minimumCppMmHg: 60, maximumCppMmHg: 70, forceCppAbove70: false, prophylacticAggressiveHyperventilation: false, treatmentDelivered: false });
          break;
        }
        if (this.intracranialHypertensionProtectionAtTick === null) { this.log('warning', 'assessment', `intracranial-hypertension-protection-order-refused-${this.currentTick}`, 'Activate positioning and systemic brain protection before hyperosmolar rescue.'); break; }
        if (response === 'activate-individualized-hyperosmolar-rescue') {
          if (this.intracranialHypertensionRescueAtTick !== null) { this.log('warning', 'assessment', `intracranial-hypertension-rescue-refused-${this.currentTick}`, 'The individualized hyperosmolar rescue intent and safety review have already been recorded.'); break; }
          this.intracranialHypertensionRescueAtTick = this.currentTick;
          this.log('critical', 'assessment', `intracranial-hypertension-rescue-activated-${this.currentTick}`,
            'Expert-selected hyperosmolar rescue intent was activated with agent suitability, sodium, chloride, osmolality, renal function, volume status, access, fluid balance, and response review. Hypertonic sodium is conditionally favored for initial TBI-related ICP management in the cited guideline, while mannitol remains an effective alternative when it is unsuitable. No universal agent, formulation, concentration, dose, or route was selected, and no treatment or outcome benefit is simulated.', { hyperosmolarRescueIntent: true, universalAgent: false, concentrationSelected: false, doseSelected: false, routeSelected: false, sodiumRenalVolumeGuardrails: true, treatmentDelivered: false, neurologicOutcomeExpected: false });
          break;
        }
        if (this.intracranialHypertensionRescueAtTick === null) { this.log('warning', 'assessment', `intracranial-hypertension-rescue-order-refused-${this.currentTick}`, 'Activate individualized hyperosmolar rescue and safety guardrails before reviewing the fixed response.'); break; }
        if (this.intracranialHypertensionReassessmentAtTick !== null) { this.log('warning', 'assessment', `intracranial-hypertension-reassessment-refused-${this.currentTick}`, 'The fixed ICP and CPP reassessment has already been reviewed.'); break; }
        this.intracranialHypertensionReassessmentAtTick = this.currentTick;
        this.log('critical', 'assessment', `intracranial-hypertension-trajectory-reassessed-${this.currentTick}`,
          'Fixed response after 15 minutes: reported ICP is 19 mmHg, MAP 84 mmHg, calculated CPP 65 mmHg, HR 84/min, SpO₂ 97%, EtCO₂ 38 mmHg, and temperature 37.5°C. Pupils remain unchanged and no new herniation sign is reported. Monitor fidelity, durability, recurrent pressure, examination, imaging, drain or surgical escalation, recovery, prognosis, and outcome remain open.', { reassessmentMinutes: 15, icpMmHg: 19, mapMmHg: 84, cppMmHg: 65, heartRateBpm: 84, spo2Percent: 97, etco2MmHg: 38, temperatureC: 37.5, pupilChange: false, newHerniationSign: false, durableControlProven: false, neurologicOutcomeProven: false });
        break;
      }
      case 'aki-fluid-overload-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'acute-kidney-injury-with-fluid-overload');
        const valid = ['recognize-aki-fluid-overload', 'review-aki-fluid-overload-context',
          'limit-fluid-and-review-diuretic-response',
          'activate-individualized-kidney-support-pathway',
          'reassess-aki-fluid-overload-trajectory'].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `aki-fluid-overload-response-refused-${this.currentTick}`,
            supported ? 'The AKI fluid-overload action was not one of the listed choices. Nothing changed.'
              : 'The bounded AKI fluid-overload choices are available only in the declared lesson.');
          break;
        }
        if (response === 'recognize-aki-fluid-overload') {
          if (this.akiFluidOverloadRecognitionAtTick !== null) { this.log('warning', 'assessment', `aki-fluid-overload-recognition-refused-${this.currentTick}`, 'The harmful AKI fluid-accumulation pattern and team activation have already been recorded.'); break; }
          this.akiFluidOverloadRecognitionAtTick = this.currentTick;
          this.log('critical', 'assessment', `aki-fluid-overload-recognized-${this.currentTick}`,
            'Severe oliguric AKI, +8.2 L cumulative balance, 9 kg weight gain, worsening pulmonary edema, rising oxygen support, and poor reported diuretic response triggered critical-care, nephrology, nursing, respiratory-therapy, and pharmacy help. No single creatinine, BUN, urine-output, or fluid-percentage value was used as an automatic kidney-support trigger.', { cumulativeBalanceLiters: 8.2, weightGainKg: 9, urineOutputMlPerKgHour: 0.15, spo2Percent: 91, nephrologyActivated: true, automaticSingleValueTrigger: false });
          break;
        }
        if (this.akiFluidOverloadRecognitionAtTick === null) { this.log('warning', 'assessment', `aki-fluid-overload-recognition-order-refused-${this.currentTick}`, 'Recognize the harmful kidney, fluid, and organ trajectory and activate experienced help first.'); break; }
        if (response === 'review-aki-fluid-overload-context') {
          if (this.akiFluidOverloadContextAtTick !== null) { this.log('warning', 'assessment', `aki-fluid-overload-context-refused-${this.currentTick}`, 'The fixed AKI causes, urgent complications, kidney capacity, and treatment context have already been reviewed.'); break; }
          this.akiFluidOverloadContextAtTick = this.currentTick;
          this.log('critical', 'assessment', `aki-fluid-overload-context-reviewed-${this.currentTick}`,
            'Fixed review integrated urine, balance, weight, respiratory support, perfusion, potassium, ECG, acid-base, BUN, uremic complications, obstruction, toxin, infection treatment, medications, contrast, hemodynamics, abdominal pressure, and intrinsic-kidney causes. Fluid demand exceeds reported kidney capacity, but exact urgency, reversibility, recovery, goals, and prescription remain open.', { lifeThreateningHyperkalemiaReported: false, severeRefractoryAcidemiaReported: false, uremicComplicationReported: false, pulmonaryOrganDysfunction: true, obstructionReported: false, kidneyCapacityExceeded: true, contextClosed: false });
          break;
        }
        if (this.akiFluidOverloadContextAtTick === null) { this.log('warning', 'assessment', `aki-fluid-overload-context-order-refused-${this.currentTick}`, 'Review causes, urgent complications, kidney capacity, and treatment context before changing the fluid plan.'); break; }
        if (response === 'limit-fluid-and-review-diuretic-response') {
          if (this.akiFluidOverloadFluidPlanAtTick !== null) { this.log('warning', 'assessment', `aki-fluid-overload-fluid-plan-refused-${this.currentTick}`, 'The nonessential-fluid limit and reported diuretic-response review have already been recorded.'); break; }
          this.akiFluidOverloadFluidPlanAtTick = this.currentTick;
          this.log('critical', 'assessment', `aki-fluid-overload-fluid-plan-recorded-${this.currentTick}`,
            'Nonessential fluid and sodium were stopped in the plan; infusions, antimicrobials, medications, nutrition, and inputs were reconciled while perfusion and necessary treatment were preserved. The poor reported response to an adequate loop-diuretic challenge was recorded without blind repeated escalation. No accounting, restriction, nutrition change, fluid, or diuretic delivery is simulated.', { nonessentialFluidLimited: true, sodiumIntakeReviewed: true, necessaryTherapyPreserved: true, poorDiureticResponseReviewed: true, blindDiureticEscalation: false, treatmentDelivered: false });
          break;
        }
        if (this.akiFluidOverloadFluidPlanAtTick === null) { this.log('warning', 'assessment', `aki-fluid-overload-fluid-plan-order-refused-${this.currentTick}`, 'Limit further nonessential accumulation and review the reported diuretic response before kidney-support planning.'); break; }
        if (response === 'activate-individualized-kidney-support-pathway') {
          if (this.akiFluidOverloadSupportAtTick !== null) { this.log('warning', 'assessment', `aki-fluid-overload-support-refused-${this.currentTick}`, 'The individualized kidney-support pathway and guardrails have already been recorded.'); break; }
          this.akiFluidOverloadSupportAtTick = this.currentTick;
          this.log('critical', 'assessment', `aki-fluid-overload-support-activated-${this.currentTick}`,
            'Critical care and nephrology activated individualized kidney-support planning for refractory fluid demand, with urgent initiation preserved for life-threatening fluid, electrolyte, or acid-base imbalance. Hemodynamics, access, modality, dose, anticoagulation, solute and medication clearance, net removal, goals, preferences, resources, and repeated response remain expert decisions. Accelerated initiation was not treated as universally beneficial, and no setup or therapy is simulated.', { kidneySupportPlanning: true, emergencyIndicationsPreserved: true, universalStartTime: false, accessSelected: false, modalitySelected: false, doseSelected: false, treatmentDelivered: false });
          break;
        }
        if (this.akiFluidOverloadSupportAtTick === null) { this.log('warning', 'assessment', `aki-fluid-overload-support-order-refused-${this.currentTick}`, 'Activate individualized kidney-support planning before reviewing the fixed response.'); break; }
        if (this.akiFluidOverloadReassessmentAtTick !== null) { this.log('warning', 'assessment', `aki-fluid-overload-reassessment-refused-${this.currentTick}`, 'The fixed fluid, respiratory, kidney, and metabolic reassessment has already been reviewed.'); break; }
        this.akiFluidOverloadReassessmentAtTick = this.currentTick;
        this.log('critical', 'assessment', `aki-fluid-overload-trajectory-reassessed-${this.currentTick}`,
          'Fixed response after 6 hours: net balance is −1.1 L, SpO₂ 95% on unchanged FiO₂ 0.50, HR 96/min, MAP 74 mmHg, potassium 5.1 mmol/L, pH 7.31, and temperature 37.3°C. Oliguria persists. Ongoing removal, hemodynamic tolerance, solute control, modality, medication dosing, nutrition, kidney recovery, duration, prognosis, and outcome remain open.', { reassessmentHours: 6, netBalanceLiters: -1.1, spo2Percent: 95, fio2: 0.5, heartRateBpm: 96, mapMmHg: 74, potassiumMmolL: 5.1, ph: 7.31, oliguriaPersists: true, kidneyRecoveryProven: false, outcomeProven: false });
        break;
      }
      case 'severe-acidemia-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'severe-acidemia');
        const valid = ['recognize-severe-acidemia', 'analyze-severe-acidemia-context',
          'protect-severe-acidemia-ventilation', 'activate-severe-acidemia-cause-plan',
          'reassess-severe-acidemia-trajectory'].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `severe-acidemia-response-refused-${this.currentTick}`,
            supported ? 'The severe-acidemia action was not one of the listed choices. Nothing changed.'
              : 'The bounded severe-acidemia choices are available only in the declared lesson.');
          break;
        }
        if (response === 'recognize-severe-acidemia') {
          if (this.severeAcidemiaRecognitionAtTick !== null) { this.log('warning', 'assessment', `severe-acidemia-recognition-refused-${this.currentTick}`, 'The severe mixed-acidemia pattern and team activation have already been recorded.'); break; }
          this.severeAcidemiaRecognitionAtTick = this.currentTick;
          this.log('critical', 'assessment', `severe-acidemia-recognized-${this.currentTick}`,
            'pH 7.09 with shock, PaCO₂ 48 mmHg, bicarbonate 14 mmol/L, lactate 8.1 mmol/L, potassium 5.7 mmol/L, and AKI triggered critical-care, respiratory-therapy, nursing, pharmacy, nephrology, and source-control help. pH was treated as a severity signal, not a diagnosis or automatic prescription.', { ph: 7.09, paco2MmHg: 48, bicarbonateMmolL: 14, lactateMmolL: 8.1, potassiumMmolL: 5.7, automaticPhPrescription: false });
          break;
        }
        if (this.severeAcidemiaRecognitionAtTick === null) { this.log('warning', 'assessment', `severe-acidemia-recognition-order-refused-${this.currentTick}`, 'Recognize the severe gas and organ trajectory and activate experienced help first.'); break; }
        if (response === 'analyze-severe-acidemia-context') {
          if (this.severeAcidemiaAnalysisAtTick !== null) { this.log('warning', 'assessment', `severe-acidemia-analysis-refused-${this.currentTick}`, 'The fixed gas, compensation, cause, and urgent-complication review has already been recorded.'); break; }
          this.severeAcidemiaAnalysisAtTick = this.currentTick;
          this.log('critical', 'assessment', `severe-acidemia-analyzed-${this.currentTick}`,
            'The repeated arterial gas confirmed high-anion-gap metabolic acidosis plus respiratory acidosis: expected PaCO₂ was approximately 29 ±2 mmHg for bicarbonate 14 mmol/L, but actual PaCO₂ was 48 mmHg. Perfusion, lactate, ketones, kidney and gastrointestinal losses, chloride, medications, ventilation, potassium and ECG, and toxin contexts remained in review.', { mixedMetabolicAndRespiratoryAcidemia: true, expectedPaco2MmHg: 29, expectedRangeMmHg: 2, actualPaco2MmHg: 48, causeClosed: false });
          break;
        }
        if (this.severeAcidemiaAnalysisAtTick === null) { this.log('warning', 'assessment', `severe-acidemia-analysis-order-refused-${this.currentTick}`, 'Confirm the sample and map metabolic, respiratory, electrolyte, perfusion, kidney, and cause context before stabilization choices.'); break; }
        if (response === 'protect-severe-acidemia-ventilation') {
          if (this.severeAcidemiaVentilationAtTick !== null) { this.log('warning', 'assessment', `severe-acidemia-ventilation-refused-${this.currentTick}`, 'The safe ventilatory-compensation plan has already been recorded.'); break; }
          this.severeAcidemiaVentilationAtTick = this.currentTick;
          this.log('critical', 'assessment', `severe-acidemia-ventilation-protected-${this.currentTick}`,
            'Airway, circuit, synchrony, minute ventilation, plateau pressure, and auto-PEEP were reviewed; safe compensatory ventilation was restored without forcing a normal pH or using injurious mechanics. This records intent only: no ventilator assessment, setting, breath, or response is performed.', { compensationProtected: true, normalPhTarget: false, injuriousVentilationAccepted: false, ventilationDelivered: false });
          break;
        }
        if (this.severeAcidemiaVentilationAtTick === null) { this.log('warning', 'assessment', `severe-acidemia-ventilation-order-refused-${this.currentTick}`, 'Protect safe ventilatory compensation before reviewing the cause-directed and buffer or kidney-support plan.'); break; }
        if (response === 'activate-severe-acidemia-cause-plan') {
          if (this.severeAcidemiaCausePlanAtTick !== null) { this.log('warning', 'assessment', `severe-acidemia-cause-plan-refused-${this.currentTick}`, 'The cause-directed, buffer, and kidney-support planning guardrails have already been recorded.'); break; }
          this.severeAcidemiaCausePlanAtTick = this.currentTick;
          this.log('critical', 'assessment', `severe-acidemia-cause-plan-activated-${this.currentTick}`,
            'Shock, infection, oxygen delivery, and source-control work continued. Bicarbonate was considered in the specific septic-shock, severe-acidemia, and AKI context, not as a universal hemodynamic rescue or mortality benefit. Life-threatening acid-base imbalance preserved urgent kidney-support assessment; exact buffer, fluid, vasopressor, electrolyte, antidote, and kidney-support choices remained expert decisions. Nothing was delivered.', { causeDirectedPlan: true, bicarbonateUniversal: false, mortalityBenefitClaimed: false, urgentKidneySupportAssessmentPreserved: true, treatmentDelivered: false });
          break;
        }
        if (this.severeAcidemiaCausePlanAtTick === null) { this.log('warning', 'assessment', `severe-acidemia-cause-plan-order-refused-${this.currentTick}`, 'Activate cause-directed care and individualized buffer and kidney-support planning before reviewing the fixed response.'); break; }
        if (this.severeAcidemiaReassessmentAtTick !== null) { this.log('warning', 'assessment', `severe-acidemia-reassessment-refused-${this.currentTick}`, 'The fixed gas and organ reassessment has already been reviewed.'); break; }
        this.severeAcidemiaReassessmentAtTick = this.currentTick;
        this.log('critical', 'assessment', `severe-acidemia-trajectory-reassessed-${this.currentTick}`,
          'Fixed response after 30 minutes: pH is 7.23, PaCO₂ 32 mmHg, bicarbonate 13 mmol/L, lactate 6.9 mmol/L, potassium 5.2 mmol/L, HR 112/min, MAP 68 mmHg, SpO₂ 95% on unchanged FiO₂ 0.40, and temperature 38.2°C. Metabolic acidosis and the septic source remain active. Durability, safe mechanics, clearance, kidney trajectory, source control, prescription, recovery, and outcome remain open.', { reassessmentMinutes: 30, ph: 7.23, paco2MmHg: 32, bicarbonateMmolL: 13, lactateMmolL: 6.9, potassiumMmolL: 5.2, mapMmHg: 68, causeResolved: false, outcomeProven: false });
        break;
      }
      case 'icu-hidden-deterioration-handoff-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'icu-handoff-with-hidden-deterioration');
        const valid = ['establish-icu-handoff-readiness', 'receive-icu-handoff-content',
          'cross-check-hidden-deterioration', 'escalate-icu-handoff-deterioration',
          'synthesize-accept-and-reassess-icu-handoff'].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `icu-hidden-handoff-response-refused-${this.currentTick}`,
            supported ? 'The ICU handoff action was not one of the listed choices. Nothing changed.'
              : 'The bounded hidden-deterioration handoff choices are available only in the declared lesson.');
          break;
        }
        if (response === 'establish-icu-handoff-readiness') {
          if (this.icuHandoffReadinessAtTick !== null) { this.log('warning', 'assessment', `icu-hidden-handoff-readiness-refused-${this.currentTick}`, 'Receiver readiness and responsibility boundaries have already been recorded.'); break; }
          this.icuHandoffReadinessAtTick = this.currentTick;
          this.log('critical', 'assessment', `icu-hidden-handoff-readiness-established-${this.currentTick}`,
            'Receiver identity, shared attention, monitoring continuity, question opportunity, and uninterrupted bedside coverage were established before content transfer. Staffing, workload, interruptions, and communication quality are not measured.', { receiverIdentified: true, monitoringContinuity: true, bedsideCoverageContinuous: true, communicationQualityMeasured: false });
          break;
        }
        if (this.icuHandoffReadinessAtTick === null) { this.log('warning', 'assessment', `icu-hidden-handoff-readiness-order-refused-${this.currentTick}`, 'Establish receiver readiness, monitoring continuity, and bedside coverage before receiving content.'); break; }
        if (response === 'receive-icu-handoff-content') {
          if (this.icuHandoffContentAtTick !== null) { this.log('warning', 'assessment', `icu-hidden-handoff-content-refused-${this.currentTick}`, 'The fixed outgoing handoff content has already been received.'); break; }
          this.icuHandoffContentAtTick = this.currentTick;
          this.log('critical', 'assessment', `icu-hidden-handoff-content-received-${this.currentTick}`,
            'The outgoing “stable on low-dose support” claim, patient summary, active support, dated data, task list, pending cholangitis source control, and contingencies were received as claims requiring bedside verification, not accepted as ground truth.', { outgoingSeverityClaim: 'stable', claimVerified: false, sourceControlPending: true });
          break;
        }
        if (this.icuHandoffContentAtTick === null) { this.log('warning', 'assessment', `icu-hidden-handoff-content-order-refused-${this.currentTick}`, 'Receive the fixed illness-severity, summary, support, task, and contingency content before cross-checking it.'); break; }
        if (response === 'cross-check-hidden-deterioration') {
          if (this.icuHandoffCrossCheckAtTick !== null) { this.log('warning', 'assessment', `icu-hidden-handoff-cross-check-refused-${this.currentTick}`, 'The fixed bedside, trend, device, infusion, and record cross-check has already been recorded.'); break; }
          this.icuHandoffCrossCheckAtTick = this.currentTick;
          this.log('critical', 'assessment', `icu-hidden-handoff-deterioration-cross-checked-${this.currentTick}`,
            'Dated trends disproved “stable”: HR 94→118/min, MAP 70→64 mmHg despite reported norepinephrine 0.08→0.22 mcg/kg/min, refill 2→5 seconds, lactate 3.1→5.8 mmol/L, urine 30→5 mL/h, and EtCO₂ 35→30 mmHg. The patient, monitor, airway and circuit, access, infusion path, pumps, concentrations, rates, compatibility, medications, labs, urine, orders, and documentation were included in the fixed review; alternate causes remain open.', { stableClaimCorrected: true, severity: 'worsening-shock', supportIncreasing: true, alternateCausesOpen: true, verificationPerformed: false });
          break;
        }
        if (this.icuHandoffCrossCheckAtTick === null) { this.log('warning', 'assessment', `icu-hidden-handoff-cross-check-order-refused-${this.currentTick}`, 'Cross-check the outgoing claim against the patient, dated trends, devices, infusions, orders, and pending source control before escalation or acceptance.'); break; }
        if (response === 'escalate-icu-handoff-deterioration') {
          if (this.icuHandoffEscalationAtTick !== null) { this.log('warning', 'assessment', `icu-hidden-handoff-escalation-refused-${this.currentTick}`, 'The worsening-shock escalation, contingencies, and ownership have already been recorded.'); break; }
          this.icuHandoffEscalationAtTick = this.currentTick;
          this.log('critical', 'assessment', `icu-hidden-handoff-deterioration-escalated-${this.currentTick}`,
            'Critical-care, nursing, pharmacy, respiratory-therapy, and urgent source-control escalation were activated for worsening shock. Immediate airway, breathing, perfusion, infusion-path, laboratory, antimicrobial, and source priorities; failure triggers; contingencies; and named task ownership were recorded before transfer acceptance. No assessment, communication, treatment, or source control is performed.', { escalationActivated: true, triggersExplicit: true, contingenciesExplicit: true, ownershipNamed: true, treatmentDelivered: false });
          break;
        }
        if (this.icuHandoffEscalationAtTick === null) { this.log('warning', 'assessment', `icu-hidden-handoff-escalation-order-refused-${this.currentTick}`, 'Escalate the corrected worsening-shock state with priorities, triggers, contingencies, and named owners before synthesis and acceptance.'); break; }
        if (this.icuHandoffAcceptanceAtTick !== null) { this.log('warning', 'assessment', `icu-hidden-handoff-acceptance-refused-${this.currentTick}`, 'Receiver synthesis, accepted ownership, and the fixed reassessment have already been recorded.'); break; }
        this.icuHandoffAcceptanceAtTick = this.currentTick;
        this.log('critical', 'assessment', `icu-hidden-handoff-synthesized-accepted-reassessed-${this.currentTick}`,
          'The receiver synthesized worsening shock, active support, pending source control, immediate tasks, triggers, contingencies, owners, and escalation route before acknowledging responsibility. Fixed 15-minute bridge response: HR 108/min, MAP 70 mmHg, EtCO₂ 33 mmHg, SpO₂ 96% on unchanged FiO₂ 0.35, and temperature 38.9°C. Lactate, urine, source control, durability, recovery, and outcome remain open.', { receiverSynthesis: true, responsibilityAccepted: true, reassessmentMinutes: 15, heartRateBpm: 108, mapMmHg: 70, etco2MmHg: 33, sourceControlComplete: false, outcomeProven: false });
        break;
      }
      case 'ventilator-circuit-disconnection-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'ventilator-circuit-disconnection');
        const valid = ['recognize-ventilator-circuit-disconnection',
          'bridge-ventilator-circuit-disconnection', 'inspect-ventilator-circuit-disconnection',
          'restore-ventilator-circuit-support', 'reassess-ventilator-circuit-response'].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `ventilator-disconnection-response-refused-${this.currentTick}`,
            supported ? 'The ventilator-disconnection action was not one of the listed choices. Nothing changed.'
              : 'The bounded circuit-disconnection choices are available only in the declared lesson.');
          break;
        }
        if (response === 'recognize-ventilator-circuit-disconnection') {
          if (this.ventilatorDisconnectionRecognizedAtTick !== null) { this.log('warning', 'assessment', `ventilator-disconnection-recognition-refused-${this.currentTick}`, 'Loss of delivered ventilation has already been recognized.'); break; }
          this.ventilatorDisconnectionRecognizedAtTick = this.currentTick;
          this.log('critical', 'assessment', `ventilator-disconnection-recognized-${this.currentTick}`,
            'Commanded volume control 420 mL at 20/min was separated from exhaled tidal volume 0, minute ventilation 0, airway pressure and measured PEEP 0, absent capnography, a coherent falling saturation, and the whole patient. The fixed alarm is corroborating evidence, not a diagnosis.', { commandedTidalVolumeMl: 420, exhaledTidalVolumeMl: 0, deliveredVentilationLost: true, alarmDiagnosesCause: false });
          break;
        }
        if (this.ventilatorDisconnectionRecognizedAtTick === null) { this.log('warning', 'assessment', `ventilator-disconnection-recognition-order-refused-${this.currentTick}`, 'Recognize loss of delivered ventilation from the patient and independent signals before continuing.'); break; }
        if (response === 'bridge-ventilator-circuit-disconnection') {
          if (this.ventilatorDisconnectionBridgedAtTick !== null) { this.log('warning', 'assessment', `ventilator-disconnection-bridge-refused-${this.currentTick}`, 'Immediate help and alternative oxygenation and ventilation intent have already been recorded.'); break; }
          this.ventilatorDisconnectionBridgedAtTick = this.currentTick;
          this.log('critical', 'assessment', `ventilator-disconnection-bridged-${this.currentTick}`,
            'Respiratory-therapy and senior ICU help were activated, and immediate alternative oxygenation and ventilation intent was recorded while oxygen reserve was falling. No oxygen, ventilation, equipment handling, or care is delivered.', { helpActivated: true, alternativeVentilationIntent: true, careDelivered: false });
          break;
        }
        if (this.ventilatorDisconnectionBridgedAtTick === null) { this.log('warning', 'assessment', `ventilator-disconnection-bridge-order-refused-${this.currentTick}`, 'Record immediate help and alternative oxygenation and ventilation intent before troubleshooting the circuit.'); break; }
        if (response === 'inspect-ventilator-circuit-disconnection') {
          if (this.ventilatorDisconnectionInspectedAtTick !== null) { this.log('warning', 'assessment', `ventilator-disconnection-inspection-refused-${this.currentTick}`, 'The fixed patient-to-source review has already been recorded.'); break; }
          this.ventilatorDisconnectionInspectedAtTick = this.currentTick;
          this.log('critical', 'assessment', `ventilator-disconnection-inspected-${this.currentTick}`,
            'The patient, pleth, pulse, airway, capnography, commanded and exhaled breaths, pressure, circuit from patient to ventilator, filters, accessories, ventilator, and gas source were included in the fixed review. It localizes complete circuit discontinuity while tube displacement or obstruction, pneumothorax, device failure, apnea, and monitor failure were considered; no physical inspection occurred.', { circuitDiscontinuityLocalized: true, alternateCausesConsidered: true, physicalInspectionPerformed: false });
          break;
        }
        if (this.ventilatorDisconnectionInspectedAtTick === null) { this.log('warning', 'assessment', `ventilator-disconnection-inspection-order-refused-${this.currentTick}`, 'Trace the patient, airway, circuit, ventilator, and gas source before recording restoration.'); break; }
        if (response === 'restore-ventilator-circuit-support') {
          if (this.ventilatorDisconnectionRestoredAtTick !== null) { this.log('warning', 'assessment', `ventilator-disconnection-restoration-refused-${this.currentTick}`, 'Circuit continuity and established support have already been restored in the teaching state.'); break; }
          this.ventilatorDisconnectionRestoredAtTick = this.currentTick;
          this.setVentilator({ delivering: true });
          this.log('critical', 'assessment', `ventilator-disconnection-restored-${this.currentTick}`,
            'Reconnection and restoration of the established ventilator support were recorded after immediate bridging and the source-to-patient review. This changes only the authored teaching state; no connection was physically handled.', { circuitContinuityRestored: true, physicalReconnectionPerformed: false });
          break;
        }
        if (this.ventilatorDisconnectionRestoredAtTick === null) { this.log('warning', 'assessment', `ventilator-disconnection-restoration-order-refused-${this.currentTick}`, 'Restore circuit continuity and established support before assessing the response.'); break; }
        if (this.ventilatorDisconnectionReassessedAtTick !== null) { this.log('warning', 'assessment', `ventilator-disconnection-reassessment-refused-${this.currentTick}`, 'The fixed whole-system response has already been recorded.'); break; }
        this.ventilatorDisconnectionReassessedAtTick = this.currentTick;
        this.log('critical', 'assessment', `ventilator-disconnection-reassessed-${this.currentTick}`,
          'Fixed 2-minute response: exhaled tidal volume 410 mL, minute ventilation 8.2 L/min, peak pressure 27 cm H₂O, measured PEEP 8 cm H₂O, EtCO₂ 36 mmHg with a continuous waveform, SpO₂ 94% on unchanged FiO₂ 0.45, HR 98/min, and MAP 77 mmHg. Delivered ventilation is restored; physical reconnection, reserve prediction, durability, and outcome remain outside the model.', { reassessmentMinutes: 2, exhaledTidalVolumeMl: 410, minuteVentilationLMin: 8.2, deliveredVentilationRestored: true, physicalReconnectionPerformed: false, outcomeProven: false });
        break;
      }
      case 'delayed-vasopressor-delivery-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'delayed-vasopressor-delivery');
        const valid = ['review-vasopressor-command-delivery-discordance',
          'trace-vasopressor-source-to-patient-path', 'classify-vasopressor-dead-space-startup-delay',
          'activate-vasopressor-startup-safety-plan', 'reassess-vasopressor-delivery-and-perfusion'].includes(response);
        if (!supported || !valid) { this.log('warning', 'assessment', `vasopressor-delivery-response-refused-${this.currentTick}`, supported ? 'The delayed-delivery action was not one of the listed choices. Nothing changed.' : 'The bounded delayed-delivery choices are available only in the declared lesson.'); break; }
        if (response === 'review-vasopressor-command-delivery-discordance') {
          if (this.delayedVasopressorDiscordanceAtTick !== null) { this.log('warning', 'assessment', `vasopressor-delivery-discordance-refused-${this.currentTick}`, 'Command-versus-delivery discordance has already been reviewed.'); break; }
          this.delayedVasopressorDiscordanceAtTick = this.currentTick;
          this.log('critical', 'assessment', `vasopressor-delivery-discordance-reviewed-${this.currentTick}`, 'The RUNNING command and elapsed time were reconciled with persistent shock and the fixed record of no catheter-tip drug arrival. Pump command, line transit, patient delivery, and physiologic effect remain separate states.', { pumpRunning: true, deliveryDocumented: false, effectObserved: false });
          break;
        }
        if (this.delayedVasopressorDiscordanceAtTick === null) { this.log('warning', 'assessment', `vasopressor-delivery-discordance-order-refused-${this.currentTick}`, 'Review command-versus-delivery discordance before tracing or correcting the infusion path.'); break; }
        if (response === 'trace-vasopressor-source-to-patient-path') {
          if (this.delayedVasopressorPathAtTick !== null) { this.log('warning', 'assessment', `vasopressor-delivery-path-refused-${this.currentTick}`, 'The fixed source-to-patient path has already been reviewed.'); break; }
          this.delayedVasopressorPathAtTick = this.currentTick;
          this.log('critical', 'assessment', `vasopressor-delivery-path-traced-${this.currentTick}`, 'The labeled syringe, pump fit and event log, tubing compliance and resistance, valves and connectors, mixing point, 0.6 mL downstream segment, 2 mL/h carrier, stopcock state and level, dedicated catheter, occlusion status, and patient were included in the fixed trace. No equipment was inspected or manipulated.', { downstreamVolumeMl: 0.6, carrierFlowMlHour: 2, physicalInspectionPerformed: false });
          break;
        }
        if (this.delayedVasopressorPathAtTick === null) { this.log('warning', 'assessment', `vasopressor-delivery-path-order-refused-${this.currentTick}`, 'Trace the full declared source-to-patient path before classifying the delay.'); break; }
        if (response === 'classify-vasopressor-dead-space-startup-delay') {
          if (this.delayedVasopressorClassifiedAtTick !== null) { this.log('warning', 'assessment', `vasopressor-delivery-classification-refused-${this.currentTick}`, 'The fixed delayed-delivery pattern has already been classified.'); break; }
          this.delayedVasopressorClassifiedAtTick = this.currentTick;
          this.log('critical', 'assessment', `vasopressor-delivery-delay-classified-${this.currentTick}`, 'The fixed record supports delayed patient delivery from downstream dead-space transit and startup mechanics. Wrong drug, concentration, rate, route, access, occlusion, extravasation, incompatibility, pump fault, changing shock, and measurement error remain open.', { classification: 'dead-space-and-startup-delay', alternativesOpen: true, bedsideCalculationPerformed: false });
          break;
        }
        if (this.delayedVasopressorClassifiedAtTick === null) { this.log('warning', 'assessment', `vasopressor-delivery-classification-order-refused-${this.currentTick}`, 'Classify the fixed delivery pattern while preserving alternatives before activating a correction plan.'); break; }
        if (response === 'activate-vasopressor-startup-safety-plan') {
          if (this.delayedVasopressorProtocolAtTick !== null) { this.log('warning', 'assessment', `vasopressor-delivery-protocol-refused-${this.currentTick}`, 'The local safe-start or changeover protocol has already been activated.'); break; }
          this.delayedVasopressorProtocolAtTick = this.currentTick;
          this.log('critical', 'assessment', `vasopressor-delivery-protocol-activated-${this.currentTick}`, 'Bedside nursing, pharmacy, and critical-care help and the local device-specific safe-start or changeover protocol were activated with an explicit guard against flushing or purging concentrated vasopressor into the patient. No pump programming, line manipulation, flush, bolus, prescription, or drug delivery occurred.', { protocolActivated: true, flushIntoPatient: false, drugDeliveredByControl: false });
          break;
        }
        if (this.delayedVasopressorProtocolAtTick === null) { this.log('warning', 'assessment', `vasopressor-delivery-protocol-order-refused-${this.currentTick}`, 'Activate the bounded safe-start or changeover plan before reassessing delivery and perfusion.'); break; }
        if (this.delayedVasopressorReassessedAtTick !== null) { this.log('warning', 'assessment', `vasopressor-delivery-reassessment-refused-${this.currentTick}`, 'The fixed delivery and perfusion response has already been recorded.'); break; }
        this.delayedVasopressorReassessedAtTick = this.currentTick;
        this.log('critical', 'assessment', `vasopressor-delivery-reassessed-${this.currentTick}`, 'Fixed 5-minute response: documented drug arrival, MAP 67 mmHg, HR 108/min, refill 3 seconds, EtCO₂ 32 mmHg, unchanged SpO₂ 95% on FiO₂ 0.40, and temperature 38.9°C. Shock, source control, dose adequacy, line durability, later perfusion, and outcome remain open.', { deliveryDocumented: true, drugDeliveredByControl: false, outcomeProven: false });
        break;
      }
      case 'pulse-oximeter-artifact-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'pulse-oximeter-motion-artifact');
        const valid = ['recognize-pulse-oximeter-discordance',
          'inspect-pleth-and-pulse-rate-coherence', 'review-probe-motion-and-perfusion',
          'corroborate-oxygenation-independently', 'reassess-pulse-oximeter-signal'].includes(response);
        if (!supported || !valid) { this.log('warning', 'assessment', `pulse-ox-response-refused-${this.currentTick}`, supported ? 'The pulse-oximeter action was not one of the listed choices. Nothing changed.' : 'The bounded signal-quality choices are available only in the declared lesson.'); break; }
        if (response === 'recognize-pulse-oximeter-discordance') {
          if (this.pulseOximeterDiscordanceAtTick !== null) { this.log('warning', 'assessment', `pulse-ox-discordance-refused-${this.currentTick}`, 'The display-versus-patient discordance has already been reviewed.'); break; }
          this.pulseOximeterDiscordanceAtTick = this.currentTick;
          this.log('critical', 'assessment', `pulse-ox-discordance-recognized-${this.currentTick}`, 'The isolated 82% display and oximeter pulse 132/min were separated from ECG 86/min, the whole patient, and canonical modeled oxygenation. Display, signal, alarm, perfusion, and patient remain distinct states.', { displayedSpo2Percent: 82, canonicalSpo2Percent: 97, displayedPulseRateBpm: 132, ecgRateBpm: 86 });
          break;
        }
        if (this.pulseOximeterDiscordanceAtTick === null) { this.log('warning', 'assessment', `pulse-ox-discordance-order-refused-${this.currentTick}`, 'Recognize the display-versus-patient discordance before interrogating the signal path.'); break; }
        if (response === 'inspect-pleth-and-pulse-rate-coherence') {
          if (this.pulseOximeterPlethAtTick !== null) { this.log('warning', 'assessment', `pulse-ox-pleth-refused-${this.currentTick}`, 'Pleth quality and pulse-rate coherence have already been reviewed.'); break; }
          this.pulseOximeterPlethAtTick = this.currentTick;
          this.log('critical', 'assessment', `pulse-ox-pleth-inspected-${this.currentTick}`, 'The fixed pleth is irregular and low amplitude, and its 132/min pulse does not match ECG 86/min. Signal quality is poor; this lowers confidence without diagnosing artifact.', { signalQuality: 'poor', pulseRateCoherent: false, diagnosisProven: false });
          break;
        }
        if (this.pulseOximeterPlethAtTick === null) { this.log('warning', 'assessment', `pulse-ox-pleth-order-refused-${this.currentTick}`, 'Inspect pleth quality and pulse-rate coherence before reviewing the probe path.'); break; }
        if (response === 'review-probe-motion-and-perfusion') {
          if (this.pulseOximeterProbePerfusionAtTick !== null) { this.log('warning', 'assessment', `pulse-ox-probe-refused-${this.currentTick}`, 'The fixed probe, motion, temperature, and perfusion record has already been reviewed.'); break; }
          this.pulseOximeterProbePerfusionAtTick = this.currentTick;
          this.log('critical', 'assessment', `pulse-ox-probe-perfusion-reviewed-${this.currentTick}`, 'The fixed record declares shivering, a cool low-perfusion finger, intact but motion-affected probe contact, and no physical probe assessment. Motion and reduced local perfusion can degrade this signal, but alternatives remain open.', { motionPresent: true, localPerfusion: 'low', physicalAssessmentPerformed: false, alternativesOpen: true });
          break;
        }
        if (this.pulseOximeterProbePerfusionAtTick === null) { this.log('warning', 'assessment', `pulse-ox-probe-order-refused-${this.currentTick}`, 'Review the declared probe, motion, temperature, and local perfusion before corroborating oxygenation.'); break; }
        if (response === 'corroborate-oxygenation-independently') {
          if (this.pulseOximeterCorroboratedAtTick !== null) { this.log('warning', 'assessment', `pulse-ox-corroboration-refused-${this.currentTick}`, 'The fixed independent oxygenation evidence has already been reviewed.'); break; }
          this.pulseOximeterCorroboratedAtTick = this.currentTick;
          this.log('critical', 'assessment', `pulse-ox-oxygenation-corroborated-${this.currentTick}`, 'The awake, speaking patient, stable respiratory pattern and circulation, and fixed arterial panel SaO₂ 97%/PaO₂ 94 mmHg corroborate oxygenation in this authored state. EtCO₂ 37 mmHg supports ventilation but cannot exclude hypoxemia.', { sao2Percent: 97, pao2MmHg: 94, capnographyExcludesHypoxemia: false, arterialSampleObtainedByControl: false });
          break;
        }
        if (this.pulseOximeterCorroboratedAtTick === null) { this.log('warning', 'assessment', `pulse-ox-corroboration-order-refused-${this.currentTick}`, 'Corroborate oxygenation before recording the clean-site reassessment.'); break; }
        if (this.pulseOximeterReassessedAtTick !== null) { this.log('warning', 'assessment', `pulse-ox-reassessment-refused-${this.currentTick}`, 'The fixed clean-site response has already been recorded.'); break; }
        this.pulseOximeterReassessedAtTick = this.currentTick;
        this.artifacts.delete('pulse-oximeter-motion');
        this.waveforms.setArtifact('pulse-oximeter-motion', false);
        this.log('critical', 'assessment', `pulse-ox-signal-reassessed-${this.currentTick}`, 'Fixed clean-site reassessment: displayed SpO₂ 97%, pulse 86/min, and a regular stronger pleth now agree with unchanged ECG 86/min, MAP 76 mmHg, EtCO₂ 37 mmHg, RR 16/min, and patient observations. No oxygen or treatment was delivered; diagnosis, future signal durability, evolving illness, and outcome remain open.', { displayedSpo2Percent: 97, displayedPulseRateBpm: 86, signalQuality: 'good', treatmentDelivered: false, outcomeProven: false });
        break;
      }
      case 'endotracheal-tube-migration-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'endotracheal-tube-migration-after-repositioning');
        const valid = ['recognize-post-repositioning-ventilation-change',
          'bridge-post-repositioning-oxygenation', 'integrate-tube-depth-and-bilateral-ventilation',
          'record-experienced-tube-correction-intent',
          'reassess-tube-position-and-gas-exchange'].includes(response);
        if (!supported || !valid) { this.log('warning', 'assessment', `tube-migration-response-refused-${this.currentTick}`, supported ? 'The tube-migration action was not one of the listed choices. Nothing changed.' : 'The bounded tube-position choices are available only in the declared lesson.'); break; }
        if (response === 'recognize-post-repositioning-ventilation-change') {
          if (this.tubeMigrationRecognizedAtTick !== null) { this.log('warning', 'assessment', `tube-migration-recognition-refused-${this.currentTick}`, 'The post-repositioning change has already been recognized.'); break; }
          this.tubeMigrationRecognizedAtTick = this.currentTick;
          this.log('critical', 'assessment', `tube-migration-change-recognized-${this.currentTick}`, 'The immediate post-turn fall in exhaled volume and oxygenation, rise in peak pressure and EtCO₂, persistent capnogram, and new unilateral ventilation were recognized without assigning a final cause.', { movementLinked: true, finalCauseAssigned: false });
          break;
        }
        if (this.tubeMigrationRecognizedAtTick === null) { this.log('warning', 'assessment', `tube-migration-recognition-order-refused-${this.currentTick}`, 'Recognize the post-repositioning ventilation change before support or airway correction.'); break; }
        if (response === 'bridge-post-repositioning-oxygenation') {
          if (this.tubeMigrationSupportedAtTick !== null) { this.log('warning', 'assessment', `tube-migration-support-refused-${this.currentTick}`, 'Immediate support and experienced help have already been recorded.'); break; }
          this.tubeMigrationSupportedAtTick = this.currentTick;
          this.log('critical', 'assessment', `tube-migration-support-activated-${this.currentTick}`, 'Respiratory-therapy, senior ICU, and experienced airway help and immediate oxygenation and ventilation support intent were recorded before final classification. No care was delivered.', { helpActivated: true, supportIntent: true, careDelivered: false });
          break;
        }
        if (this.tubeMigrationSupportedAtTick === null) { this.log('warning', 'assessment', `tube-migration-support-order-refused-${this.currentTick}`, 'Record immediate support and experienced help before the position review.'); break; }
        if (response === 'integrate-tube-depth-and-bilateral-ventilation') {
          if (this.tubeMigrationPositionReviewedAtTick !== null) { this.log('warning', 'assessment', `tube-migration-position-refused-${this.currentTick}`, 'The fixed airway-position panel has already been reviewed.'); break; }
          this.tubeMigrationPositionReviewedAtTick = this.currentTick;
          this.log('critical', 'assessment', `tube-migration-position-reviewed-${this.currentTick}`, 'The fixed review compares 22 cm before the turn with 25 cm now, intact securement and unchanged cuff state, markedly reduced left ventilation, preserved right ventilation and capnography, exhaled volume 310 mL, peak pressure 36 cm H₂O, and worsening gas exchange. It supports right-mainstem migration while mucus plugging, pneumothorax, atelectasis, consolidation, circuit, ventilator, and other causes remain open. No examination or inspection occurred.', { beforeDepthCm: 22, currentDepthCm: 25, position: 'right-mainstem', physicalAssessmentPerformed: false, alternativesOpen: true });
          break;
        }
        if (this.tubeMigrationPositionReviewedAtTick === null) { this.log('warning', 'assessment', `tube-migration-position-order-refused-${this.currentTick}`, 'Integrate the complete airway-position panel before correction intent.'); break; }
        if (response === 'record-experienced-tube-correction-intent') {
          if (this.tubeMigrationCorrectionAtTick !== null) { this.log('warning', 'assessment', `tube-migration-correction-refused-${this.currentTick}`, 'Experienced-airway correction intent has already been recorded.'); break; }
          this.tubeMigrationCorrectionAtTick = this.currentTick;
          this.log('critical', 'assessment', `tube-migration-correction-recorded-${this.currentTick}`, 'Experienced-airway tube correction and resecurement intent were recorded for this authored migrated tube. The 22 cm response is a case fact, not a universal target; no tube was touched or moved.', { correctionIntent: true, physicalTubeMovementPerformed: false, universalDepthTarget: false });
          break;
        }
        if (this.tubeMigrationCorrectionAtTick === null) { this.log('warning', 'assessment', `tube-migration-correction-order-refused-${this.currentTick}`, 'Record bounded experienced-airway correction intent before response proof.'); break; }
        if (this.tubeMigrationReassessedAtTick !== null) { this.log('warning', 'assessment', `tube-migration-reassessment-refused-${this.currentTick}`, 'The fixed multi-signal response has already been recorded.'); break; }
        this.tubeMigrationReassessedAtTick = this.currentTick;
        this.log('critical', 'assessment', `tube-migration-reassessed-${this.currentTick}`, 'Fixed 3-minute response: tube mark 22 cm, typed tracheal position, bilateral ventilation, exhaled volume 410 mL, peak pressure 27 cm H₂O, plateau 21, PEEP 8, continuous EtCO₂ 39 mmHg, SpO₂ 96% on unchanged FiO₂ 0.50, HR 94/min, and MAP 77 mmHg. Physical correction, imaging, durability, diagnosis, and outcome remain outside the model.', { bilateralVentilation: true, physicalTubeMovementPerformed: false, outcomeProven: false });
        break;
      }
      case 'septic-shock-resuscitation-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'septic-shock-resuscitation');
        const valid = ['reconcile-septic-shock-resuscitation-so-far',
          'reassess-septic-shock-perfusion', 'test-septic-shock-fluid-responsiveness',
          'individualize-septic-shock-support-and-source-control',
          'reassess-septic-shock-trajectory'].includes(response);
        if (!supported || !valid) { this.log('warning', 'assessment', `septic-resuscitation-response-refused-${this.currentTick}`, supported ? 'The septic-resuscitation action was not one of the listed choices. Nothing changed.' : 'The bounded persistent-shock choices are available only in the declared lesson.'); break; }
        if (response === 'reconcile-septic-shock-resuscitation-so-far') {
          if (this.septicResuscitationContextAtTick !== null) { this.log('warning', 'assessment', `septic-resuscitation-context-refused-${this.currentTick}`, 'The reported resuscitation context has already been reconciled.'); break; }
          this.septicResuscitationContextAtTick = this.currentTick;
          this.log('critical', 'assessment', `septic-resuscitation-context-reconciled-${this.currentTick}`, 'The fixed record separates reported cultures, empiric antimicrobials, 2,100 mL balanced crystalloid, and a running norepinephrine command from actual delivery evidence and the persistent patient response.', { reportedCrystalloidMl: 2100, commandDeliveryEffectSeparated: true });
          break;
        }
        if (this.septicResuscitationContextAtTick === null) { this.log('warning', 'assessment', `septic-resuscitation-context-order-refused-${this.currentTick}`, 'Reconcile prior resuscitation claims before reassessing or changing the plan.'); break; }
        if (response === 'reassess-septic-shock-perfusion') {
          if (this.septicResuscitationPerfusionAtTick !== null) { this.log('warning', 'assessment', `septic-resuscitation-perfusion-refused-${this.currentTick}`, 'The fixed perfusion trajectory has already been reviewed.'); break; }
          this.septicResuscitationPerfusionAtTick = this.currentTick;
          this.log('critical', 'assessment', `septic-resuscitation-perfusion-reviewed-${this.currentTick}`, 'MAP 64 mmHg was joined with reduced attention, refill 5 seconds, mottling to the knees, urine 12 mL/h, lactate 5.8 to 6.4 mmol/L, gas exchange, and respiratory tolerance. Pressure alone did not close perfusion.', { mapAloneClosesResuscitation: false, lactateInterpretedInContext: true });
          break;
        }
        if (this.septicResuscitationPerfusionAtTick === null) { this.log('warning', 'assessment', `septic-resuscitation-perfusion-order-refused-${this.currentTick}`, 'Review serial tissue perfusion before testing whether further fluid has a target.'); break; }
        if (response === 'test-septic-shock-fluid-responsiveness') {
          if (this.septicResuscitationFluidResponseAtTick !== null) { this.log('warning', 'assessment', `septic-resuscitation-fluid-response-refused-${this.currentTick}`, 'The fixed dynamic and lung panels have already been reviewed.'); break; }
          this.septicResuscitationFluidResponseAtTick = this.currentTick;
          this.log('critical', 'assessment', `septic-resuscitation-fluid-response-reviewed-${this.currentTick}`, 'Fixed passive-leg-raise stroke volume changes from 48 to 49 mL (+2%) and the fixed lung panel has new diffuse B-lines after reported initial fluid. These case facts do not support a blind repeat bolus; they are not universal cutoffs and no maneuver or scan occurred.', { passiveLegRaiseStrokeVolumeChangePercent: 2, diffuseBLines: true, blindRepeatFluidOffered: false, physicalAssessmentPerformed: false });
          break;
        }
        if (this.septicResuscitationFluidResponseAtTick === null) { this.log('warning', 'assessment', `septic-resuscitation-fluid-response-order-refused-${this.currentTick}`, 'Review the fixed dynamic response and lung tolerance before recording the parallel plan.'); break; }
        if (response === 'individualize-septic-shock-support-and-source-control') {
          if (this.septicResuscitationPlanAtTick !== null) { this.log('warning', 'assessment', `septic-resuscitation-plan-refused-${this.currentTick}`, 'The individualized support and source-control plan has already been recorded.'); break; }
          this.septicResuscitationPlanAtTick = this.currentTick;
          this.log('critical', 'assessment', `septic-resuscitation-plan-recorded-${this.currentTick}`, 'Senior critical-care, nursing, pharmacy, respiratory, procedural, and source-control help were activated. Patient-specific pressure, flow, rhythm, access, perfusion, and urgent biliary source-control review proceed together without selecting a dose, giving fluid or drug, adjusting a device, or performing drainage.', { supportReview: true, urgentSourceControlIntent: true, treatmentDeliveredByControl: false });
          break;
        }
        if (this.septicResuscitationPlanAtTick === null) { this.log('warning', 'assessment', `septic-resuscitation-plan-order-refused-${this.currentTick}`, 'Record individualized support and urgent source-control intent before trajectory reassessment.'); break; }
        if (this.septicResuscitationReassessedAtTick !== null) { this.log('warning', 'assessment', `septic-resuscitation-reassessment-refused-${this.currentTick}`, 'The fixed 10-minute trajectory has already been recorded.'); break; }
        this.septicResuscitationReassessedAtTick = this.currentTick;
        this.log('critical', 'assessment', `septic-resuscitation-trajectory-reassessed-${this.currentTick}`, 'Fixed 10-minute response: MAP 68 mmHg, HR 110/min, refill 4 seconds, unchanged urine 12 mL/h, lactate not yet repeated, SpO₂ 94% on unchanged FiO₂ 0.35, RR 23/min, EtCO₂ 33 mmHg, and temperature 39.0°C. Persistent hypoperfusion, source control, support needs, alternate causes, organ failure, durability, and outcome remain open.', { lactateRepeated: false, sourceControlPerformedByControl: false, outcomeProven: false });
        break;
      }
      case 'stable-chest-pain-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'stable-chest-pain-evaluation');
        const valid = ['verify-stable-chest-pain-trajectory',
          'characterize-stable-chest-pain-pattern',
          'estimate-stable-chest-pain-clinical-likelihood',
          'record-stable-chest-pain-testing-intent',
          'safety-net-stable-chest-pain-follow-up'].includes(response);
        if (!supported || !valid) { this.log('warning', 'assessment', `stable-chest-pain-response-refused-${this.currentTick}`, supported ? 'The stable-chest-pain action was not one of the listed choices. Nothing changed.' : 'The bounded stable-chest-pain choices are available only in the declared lesson.'); break; }
        if (response === 'verify-stable-chest-pain-trajectory') {
          if (this.stableChestPainStabilityAtTick !== null) { this.log('warning', 'assessment', `stable-chest-pain-stability-refused-${this.currentTick}`, 'The fixed stability and acute-change screen has already been reviewed.'); break; }
          this.stableChestPainStabilityAtTick = this.currentTick;
          this.log('advisory', 'assessment', `stable-chest-pain-stability-verified-${this.currentTick}`, 'Three months of reproducible exertional symptoms resolving with rest, without recent change, rest or prolonged symptoms, syncope, marked dyspnea, or instability, support a stable trajectory in this authored record. Acute-change triggers remain explicit.', { stableTrajectory: true, acuteConcernPresent: false });
          break;
        }
        if (this.stableChestPainStabilityAtTick === null) { this.log('warning', 'assessment', `stable-chest-pain-stability-order-refused-${this.currentTick}`, 'Verify stability and acute-change triggers before characterizing or testing.'); break; }
        if (response === 'characterize-stable-chest-pain-pattern') {
          if (this.stableChestPainPatternAtTick !== null) { this.log('warning', 'assessment', `stable-chest-pain-pattern-refused-${this.currentTick}`, 'The fixed symptom and functional pattern has already been characterized.'); break; }
          this.stableChestPainPatternAtTick = this.currentTick;
          this.log('advisory', 'assessment', `stable-chest-pain-pattern-characterized-${this.currentTick}`, 'Central pressure begins after about 6 minutes of brisk walking or 2 flights, resolves within 4 minutes of rest, occurs 2 or 3 times weekly, and has not progressed. The pattern is recorded without calling it atypical or assigning a cause.', { causeAssigned: false, atypicalDescriptorUsed: false });
          break;
        }
        if (this.stableChestPainPatternAtTick === null) { this.log('warning', 'assessment', `stable-chest-pain-pattern-order-refused-${this.currentTick}`, 'Characterize the complete stable symptom pattern before estimating clinical likelihood.'); break; }
        if (response === 'estimate-stable-chest-pain-clinical-likelihood') {
          if (this.stableChestPainLikelihoodAtTick !== null) { this.log('warning', 'assessment', `stable-chest-pain-likelihood-refused-${this.currentTick}`, 'The fixed risk-factor-weighted likelihood review has already been recorded.'); break; }
          this.stableChestPainLikelihoodAtTick = this.currentTick;
          this.log('advisory', 'assessment', `stable-chest-pain-likelihood-reviewed-${this.currentTick}`, 'Age, sex, symptoms, hypertension, current tobacco use, LDL 168 mg/dL, fixed examination claims, and a resting sinus ECG report without ischemic ST-T change were integrated. The authored likelihood is not very low; no exact score or coronary diagnosis was calculated.', { clinicalLikelihood: 'not-very-low', exactScoreCalculated: false, diagnosisAssigned: false });
          break;
        }
        if (this.stableChestPainLikelihoodAtTick === null) { this.log('warning', 'assessment', `stable-chest-pain-likelihood-order-refused-${this.currentTick}`, 'Review the whole clinical likelihood before recording a testing pathway.'); break; }
        if (response === 'record-stable-chest-pain-testing-intent') {
          if (this.stableChestPainTestingAtTick !== null) { this.log('warning', 'assessment', `stable-chest-pain-testing-refused-${this.currentTick}`, 'The shared patient-specific testing intent has already been recorded.'); break; }
          this.stableChestPainTestingAtTick = this.currentTick;
          this.log('advisory', 'assessment', `stable-chest-pain-testing-recorded-${this.currentTick}`, 'Patient-specific noninvasive-testing intent was recorded through shared decision-making and a local pathway. The clinical question, test strengths and limitations, exercise capacity, ECG interpretability, radiation and contrast, comorbidity, preference, access, expertise, and local quality remain part of selection. No test was ordered or performed.', { sharedDecisionMaking: true, universalTestSelected: false, testPerformed: false });
          break;
        }
        if (this.stableChestPainTestingAtTick === null) { this.log('warning', 'assessment', `stable-chest-pain-testing-order-refused-${this.currentTick}`, 'Record the shared patient-specific testing pathway before follow-up and safety net.'); break; }
        if (this.stableChestPainSafetyNetAtTick !== null) { this.log('warning', 'assessment', `stable-chest-pain-safety-net-refused-${this.currentTick}`, 'Follow-up and the acute-change safety net have already been recorded.'); break; }
        this.stableChestPainSafetyNetAtTick = this.currentTick;
        this.log('advisory', 'assessment', `stable-chest-pain-safety-net-recorded-${this.currentTick}`, 'Follow-up and urgent reassessment for rest or prolonged symptoms, increasing frequency, severity, duration or lower threshold, syncope, marked dyspnea, instability, or another acute concern were recorded. No disposition, diagnosis, treatment, event forecast, or outcome was supplied.', { urgentChangeTriggersExplicit: true, outcomePredicted: false });
        break;
      }
      case 'clinic-stemi-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'stemi-recognition-and-first-actions');
        const valid = ['reconcile-clinic-stemi-pattern', 'screen-clinic-stemi-danger',
          'activate-clinic-stemi-transfer', 'record-clinic-stemi-bridge',
          'reassess-clinic-stemi-handoff'].includes(response);
        if (!supported || !valid) { this.log('warning', 'assessment', `clinic-stemi-response-refused-${this.currentTick}`, supported ? 'The clinic STEMI action was not one of the listed choices. Nothing changed.' : 'The bounded clinic STEMI choices are available only in the declared lesson.'); break; }
        if (response === 'reconcile-clinic-stemi-pattern') {
          if (this.clinicStemiPatternAtTick !== null) { this.log('warning', 'assessment', `clinic-stemi-pattern-refused-${this.currentTick}`, 'The symptom and fixed ECG trajectory has already been reconciled.'); break; }
          this.clinicStemiPatternAtTick = this.currentTick;
          this.log('critical', 'assessment', `clinic-stemi-pattern-reconciled-${this.currentTick}`, 'Twenty-two minutes of ongoing central pressure, diaphoresis, and nausea were reconciled with the fixed diagnostic inferior-STEMI 12-lead report and current physiology. The ECG was not acquired or interpreted in this lab.', { authoredDiagnosis: 'inferior-stemi', liveEcgInterpreted: false });
          break;
        }
        if (this.clinicStemiPatternAtTick === null) { this.log('warning', 'assessment', `clinic-stemi-order-refused-${this.currentTick}`, 'Reconcile the time-sensitive symptom and fixed ECG trajectory before recording the response.'); break; }
        if (response === 'activate-clinic-stemi-transfer') {
          if (this.clinicStemiTransferAtTick !== null) { this.log('warning', 'assessment', `clinic-stemi-transfer-refused-${this.currentTick}`, 'EMS and the regional reperfusion pathway have already been activated.'); break; }
          this.clinicStemiTransferAtTick = this.currentTick;
          this.log('critical', 'assessment', `clinic-stemi-transfer-activated-${this.currentTick}`, 'EMS and the regional STEMI/reperfusion system were activated from the non-PCI clinic. The fixed ECG is transmitted and the system-selected receiving team is pre-alerted. Private transport and biomarker delay were rejected; the regional system retains individualized destination and reperfusion selection.', { emsActivated: true, biomarkerDelayUsed: false, selfTransportSelected: false, downstreamTherapySelected: false });
          break;
        }
        if (response === 'screen-clinic-stemi-danger') {
          if (this.clinicStemiDangerAtTick !== null) { this.log('warning', 'assessment', `clinic-stemi-danger-refused-${this.currentTick}`, 'Current danger, alternative, bleeding, allergy, and oxygenation context has already been screened.'); break; }
          this.clinicStemiDangerAtTick = this.currentTick;
          this.log('critical', 'assessment', `clinic-stemi-danger-screened-${this.currentTick}`, 'The patient remains alert and warm at BP 128/76 mmHg, HR 62/min, and SpO₂ 96% on room air. No shock, acute heart failure, sustained arrhythmia, mechanical-complication finding, dissection pattern, active bleeding, or aspirin contraindication is authored. Escalation continues in parallel.', { hemodynamicallyStable: true, hypoxemiaPresent: false, routineOxygenSelected: false });
          break;
        }
        if (this.clinicStemiDangerAtTick === null) { this.log('warning', 'assessment', `clinic-stemi-danger-order-refused-${this.currentTick}`, 'Screen current danger in parallel before recording the clinic bridge.'); break; }
        if (this.clinicStemiTransferAtTick === null) { this.log('warning', 'assessment', `clinic-stemi-transfer-order-refused-${this.currentTick}`, 'Activate EMS and the receiving reperfusion pathway before recording the clinic bridge.'); break; }
        if (response === 'record-clinic-stemi-bridge') {
          if (this.clinicStemiBridgeAtTick !== null) { this.log('warning', 'assessment', `clinic-stemi-bridge-refused-${this.currentTick}`, 'The setting-bounded clinic bridge has already been recorded.'); break; }
          this.clinicStemiBridgeAtTick = this.currentTick;
          this.log('critical', 'assessment', `clinic-stemi-bridge-recorded-${this.currentTick}`, 'Protocol-bounded aspirin suitability and monitored-transport intent were recorded with rhythm, defibrillation readiness, access, and change triggers. No drug was delivered; routine oxygen, P2Y12 inhibitor, anticoagulant, fibrinolytic, and PCI selection were not supplied.', { aspirinIntentOnly: true, routineOxygenSelected: false, downstreamTherapySelected: false, treatmentDelivered: false });
          break;
        }
        if (this.clinicStemiBridgeAtTick === null
          || this.currentTick <= Math.max(this.clinicStemiDangerAtTick ?? 0,
            this.clinicStemiTransferAtTick ?? 0, this.clinicStemiBridgeAtTick ?? 0)) {
          this.log('warning', 'assessment', `clinic-stemi-handoff-order-refused-${this.currentTick}`, 'Record activation, the parallel danger screen, and the clinic bridge, then allow the next engine tick before reassessment and handoff.');
          break;
        }
        if (this.clinicStemiHandoffAtTick !== null) { this.log('warning', 'assessment', `clinic-stemi-handoff-refused-${this.currentTick}`, 'Reassessment and the receiving-team handoff have already been recorded.'); break; }
        this.clinicStemiHandoffAtTick = this.currentTick;
        this.log('critical', 'assessment', `clinic-stemi-handoff-recorded-${this.currentTick}`, 'Symptoms, exact onset, fixed ECG report, rhythm, pressure, perfusion, oxygenation, allergy, medication, interventions, and interval change were reassessed and handed off after a later engine tick. Reperfusion, complications, disposition, and outcome remain open.', { exactOnsetHandedOff: true, receivingTeamPrealerted: true, outcomePredicted: false });
        break;
      }
      case 'nstemi-risk-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'nstemi-risk-reassessment');
        const valid = ['reconcile-nstemi-serial-trajectory', 'verify-nstemi-and-alternatives',
          'screen-nstemi-very-high-risk-features', 'record-nstemi-invasive-strategy',
          'record-nstemi-monitoring-and-handoff'].includes(response);
        if (!supported || !valid) { this.log('warning', 'assessment', `nstemi-risk-response-refused-${this.currentTick}`, supported ? 'The NSTEMI risk-reassessment action was not one of the listed choices. Nothing changed.' : 'The bounded NSTEMI risk-reassessment choices are available only in the declared lesson.'); break; }
        if (response === 'reconcile-nstemi-serial-trajectory') {
          if (this.nstemiTrajectoryAtTick !== null) { this.log('warning', 'assessment', `nstemi-risk-trajectory-refused-${this.currentTick}`, 'The serial symptom, ECG-report, and troponin trajectory has already been reconciled.'); break; }
          this.nstemiTrajectoryAtTick = this.currentTick;
          this.log('warning', 'assessment', `nstemi-risk-trajectory-reconciled-${this.currentTick}`, 'Five hours after 25 minutes of central pressure, the patient is pain-free. Fixed high-sensitivity troponin rises from 18 to 146 ng/L above the assay-specific 99th percentile; fixed ECG reports change from horizontal ST depression in V4-V6 to lateral T-wave inversion. One isolated value was not used.', { serialEvidence: true, isolatedValueUsed: false });
          break;
        }
        if (this.nstemiTrajectoryAtTick === null) { this.log('warning', 'assessment', `nstemi-risk-order-refused-${this.currentTick}`, 'Reconcile the complete serial trajectory before classifying risk or strategy.'); break; }
        if (response === 'verify-nstemi-and-alternatives') {
          if (this.nstemiVerificationAtTick !== null) { this.log('warning', 'assessment', `nstemi-risk-verification-refused-${this.currentTick}`, 'The authored NSTEMI conclusion and myocardial-injury alternatives have already been reviewed.'); break; }
          this.nstemiVerificationAtTick = this.currentTick;
          this.log('warning', 'assessment', `nstemi-risk-verification-recorded-${this.currentTick}`, 'The authored case integrates ischemic symptoms, dynamic ECG reports, and an assay-bounded troponin rise as confirmed NSTEMI. Alternate ischemic and nonischemic causes of myocardial injury remain part of real assessment; no live diagnosis or test interpretation occurred.', { authoredDiagnosis: 'nstemi', liveDiagnosisMade: false });
          break;
        }
        if (this.nstemiVerificationAtTick === null) { this.log('warning', 'assessment', `nstemi-risk-verification-order-refused-${this.currentTick}`, 'Verify the authored conclusion and preserve myocardial-injury alternatives before screening current danger.'); break; }
        if (response === 'screen-nstemi-very-high-risk-features') {
          if (this.nstemiVeryHighRiskAtTick !== null) { this.log('warning', 'assessment', `nstemi-risk-danger-refused-${this.currentTick}`, 'Current very-high-risk features have already been screened.'); break; }
          this.nstemiVeryHighRiskAtTick = this.currentTick;
          this.log('warning', 'assessment', `nstemi-risk-danger-screened-${this.currentTick}`, 'Current screen: pain-free, BP 132/78 mmHg, warm perfusion, no acute heart failure, life-threatening arrhythmia, arrest, mechanical complication, or recurrent dynamic ST change. No current very-high-risk feature is authored. Stability is reassessed, not inherited.', { currentVeryHighRisk: false, immediateEscalationTriggerPresent: false });
          break;
        }
        if (this.nstemiVeryHighRiskAtTick === null) { this.log('warning', 'assessment', `nstemi-risk-danger-order-refused-${this.currentTick}`, 'Re-screen current very-high-risk features before recording invasive strategy.'); break; }
        if (response === 'record-nstemi-invasive-strategy') {
          if (this.nstemiStrategyAtTick !== null) { this.log('warning', 'assessment', `nstemi-risk-strategy-refused-${this.currentTick}`, 'The risk-bounded invasive-strategy intent has already been recorded.'); break; }
          this.nstemiStrategyAtTick = this.currentTick;
          this.log('warning', 'assessment', `nstemi-risk-strategy-recorded-${this.currentTick}`, 'High ischemic risk, bleeding risk, kidney function, comorbidity, preference, and local capability were reviewed before recording inpatient invasive-strategy intent. Exact timing follows the applicable regional pathway and evolving risk; no universal clock, exact score, medication, angiography, or procedure was supplied.', { ischemicRisk: 'high', exactScoreCalculated: false, universalTimingSelected: false, procedurePerformed: false });
          break;
        }
        if (this.nstemiStrategyAtTick === null) { this.log('warning', 'assessment', `nstemi-risk-strategy-order-refused-${this.currentTick}`, 'Record risk- and region-bounded invasive strategy before handoff ownership.'); break; }
        if (this.nstemiHandoffAtTick !== null) { this.log('warning', 'assessment', `nstemi-risk-handoff-refused-${this.currentTick}`, 'Monitoring, change triggers, ownership, and the next reassessment have already been recorded.'); break; }
        this.nstemiHandoffAtTick = this.currentTick;
        this.log('warning', 'assessment', `nstemi-risk-handoff-recorded-${this.currentTick}`, 'Serial symptoms, ECG, rhythm, pressure, perfusion, oxygenation, heart failure, bleeding, and renal context remain monitored. Recurrent or refractory pain, instability, heart failure, life-threatening arrhythmia, arrest, mechanical concern, or recurrent dynamic ECG change trigger immediate escalation. Ownership and next reassessment were recorded without determining disposition or outcome.', { ownerNamed: true, changeTriggersExplicit: true, outcomePredicted: false });
        break;
      }
      case 'heart-failure-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'acute-decompensated-heart-failure');
        const valid = ['reconcile-heart-failure-congestion-and-perfusion',
          'review-heart-failure-diuretic-response', 'review-heart-failure-tolerance-and-precipitant',
          'record-heart-failure-transition-intent',
          'reassess-heart-failure-discharge-readiness'].includes(response);
        if (!supported || !valid) { this.log('warning', 'assessment', `heart-failure-response-refused-${this.currentTick}`, supported ? 'The heart-failure reassessment action was not one of the listed choices. Nothing changed.' : 'The bounded heart-failure reassessment choices are available only in the declared lesson.'); break; }
        if (response === 'reconcile-heart-failure-congestion-and-perfusion') {
          if (this.heartFailureStatusAtTick !== null) { this.log('warning', 'assessment', `heart-failure-status-refused-${this.currentTick}`, 'The fixed congestion and perfusion status has already been reconciled.'); break; }
          this.heartFailureStatusAtTick = this.currentTick;
          this.log('warning', 'assessment', `heart-failure-status-reconciled-${this.currentTick}`, 'Dyspnea has improved, but orthopnea, elevated JVP, bibasal crackles, edema, and weight above the documented clinic value show residual congestion. HR 84/min, BP 118/73 mmHg, SpO₂ 94% on room air, and warm extremities do not suggest authored shock or respiratory failure.', { residualCongestion: true, hypoperfusionAuthored: false });
          break;
        }
        if (this.heartFailureStatusAtTick === null) { this.log('warning', 'assessment', `heart-failure-order-refused-${this.currentTick}`, 'Reconcile current congestion and perfusion before judging response or transition.'); break; }
        if (response === 'review-heart-failure-diuretic-response') {
          if (this.heartFailureResponseAtTick !== null) { this.log('warning', 'assessment', `heart-failure-diuretic-response-refused-${this.currentTick}`, 'The reported decongestion response has already been reviewed.'); break; }
          this.heartFailureResponseAtTick = this.currentTick;
          this.log('warning', 'assessment', `heart-failure-diuretic-response-reviewed-${this.currentTick}`, 'After reported IV loop-diuretic treatment, weight changed from 77.2 to 75.8 kg, recorded net balance is −1.6 L, urine output is 2.4 L, and dyspnea improved. Persistent orthopnea, JVP elevation, crackles, edema, and weight above the documented clinic value show only partial decongestion. No dose or target was calculated and no treatment was delivered.', { partialResponse: true, residualCongestion: true, doseCalculated: false, treatmentDelivered: false });
          break;
        }
        if (this.heartFailureResponseAtTick === null) { this.log('warning', 'assessment', `heart-failure-response-order-refused-${this.currentTick}`, 'Review the reported decongestion response before tolerance and precipitant context.'); break; }
        if (response === 'review-heart-failure-tolerance-and-precipitant') {
          if (this.heartFailureToleranceAtTick !== null) { this.log('warning', 'assessment', `heart-failure-tolerance-refused-${this.currentTick}`, 'Kidney, electrolyte, hemodynamic, and precipitant context has already been reviewed.'); break; }
          this.heartFailureToleranceAtTick = this.currentTick;
          this.log('warning', 'assessment', `heart-failure-tolerance-reviewed-${this.currentTick}`, 'Creatinine changed from 1.1 to 1.3 mg/dL with sodium 137 mmol/L, potassium 3.7 mmol/L, magnesium 1.9 mg/dL, BP 118/73 mmHg, and warm perfusion. The change was reviewed in the whole clinical trajectory rather than used alone to stop or intensify therapy. Missed medications and high sodium exposure are authored context; other precipitants remain part of real evaluation.', { isolatedCreatinineUsed: false, precipitantReviewExplicit: true });
          break;
        }
        if (this.heartFailureToleranceAtTick === null) { this.log('warning', 'assessment', `heart-failure-tolerance-order-refused-${this.currentTick}`, 'Review tolerance and precipitant context before recording transition intent.'); break; }
        if (response === 'record-heart-failure-transition-intent') {
          if (this.heartFailureTransitionAtTick !== null) { this.log('warning', 'assessment', `heart-failure-transition-refused-${this.currentTick}`, 'The bounded decongestion and transition intent has already been recorded.'); break; }
          this.heartFailureTransitionAtTick = this.currentTick;
          this.log('warning', 'assessment', `heart-failure-transition-recorded-${this.currentTick}`, 'Individualized continued-decongestion, oral-transition, and guideline-directed-therapy review intent was recorded with kidney function, electrolytes, pressure, symptoms, contraindications, adherence, access, preference, education, and follow-up preserved. No medication, dose, regimen, order, or treatment was supplied.', { individualizedIntent: true, doseCalculated: false, treatmentDelivered: false });
          break;
        }
        if (this.heartFailureTransitionAtTick === null) { this.log('warning', 'assessment', `heart-failure-transition-order-refused-${this.currentTick}`, 'Record the individualized transition intent before discharge-readiness reassessment.'); break; }
        if (this.heartFailureReadinessAtTick !== null) { this.log('warning', 'assessment', `heart-failure-readiness-refused-${this.currentTick}`, 'Discharge readiness and ownership have already been reassessed.'); break; }
        this.heartFailureReadinessAtTick = this.currentTick;
        this.log('warning', 'assessment', `heart-failure-readiness-reassessed-${this.currentTick}`, 'Persistent orthopnea, JVP elevation, crackles, edema, and weight above the documented clinic value mean this authored snapshot is not discharge-ready. Medication and monitoring ownership, self-management education, change triggers, early follow-up, and the next reassessment were recorded without determining disposition, prognosis, or outcome.', { residualCongestion: true, dischargeReady: false, ownerNamed: true, outcomePredicted: false });
        break;
      }
      case 'af-rvr-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'atrial-fibrillation-with-rapid-response');
        const valid = ['reconcile-af-rvr-rhythm-and-stability', 'review-af-rvr-context-and-triggers',
          'record-af-rvr-rate-control-intent', 'record-af-rvr-stroke-prevention-intent',
          'reassess-af-rvr-trajectory-and-follow-up'].includes(response);
        if (!supported || !valid) { this.log('warning', 'assessment', `af-rvr-response-refused-${this.currentTick}`, supported ? 'The AF-with-rapid-response action was not one of the listed choices. Nothing changed.' : 'The bounded AF-with-rapid-response choices are available only in the declared lesson.'); break; }
        if (response === 'reconcile-af-rvr-rhythm-and-stability') {
          if (this.afRvrStabilityAtTick !== null) { this.log('warning', 'assessment', `af-rvr-stability-refused-${this.currentTick}`, 'The authored rhythm and current stability have already been reconciled.'); break; }
          this.afRvrStabilityAtTick = this.currentTick;
          this.log('warning', 'assessment', `af-rvr-stability-reconciled-${this.currentTick}`, 'The fixed diagnostic report names atrial fibrillation with an irregular narrow-complex rate of 142/min. BP 119/71 mmHg, alert mentation, warm perfusion, and no authored shock, ischemic discomfort, acute heart failure, or syncope support a hemodynamically stable pathway now. Heart rate alone did not define instability.', { hemodynamicallyStable: true, instabilityDefinedByRateAlone: false });
          break;
        }
        if (this.afRvrStabilityAtTick === null) { this.log('warning', 'assessment', `af-rvr-order-refused-${this.currentTick}`, 'Reconcile rhythm and current stability before rate, rhythm, or stroke-prevention planning.'); break; }
        if (response === 'review-af-rvr-context-and-triggers') {
          if (this.afRvrContextAtTick !== null) { this.log('warning', 'assessment', `af-rvr-context-refused-${this.currentTick}`, 'The duration, prior-history, ventricular-function, and trigger context has already been reviewed.'); break; }
          this.afRvrContextAtTick = this.currentTick;
          this.log('warning', 'assessment', `af-rvr-context-reviewed-${this.currentTick}`, 'Palpitations were noticed 6 hours ago, but the last symptom-free check was 3 days ago, so AF duration is uncertain. Prior AF, medications and adherence, LVEF 55%, hypertension, diabetes, hemoglobin, electrolytes, TSH, temperature, infection, alcohol, stimulants, and medication change were reviewed without inventing an acute cause.', { durationCertain: false, lvefPercent: 55, triggerDiagnosed: false });
          break;
        }
        if (this.afRvrContextAtTick === null) { this.log('warning', 'assessment', `af-rvr-context-order-refused-${this.currentTick}`, 'Review duration, history, ventricular function, and contributors before recording rate-control intent.'); break; }
        if (response === 'record-af-rvr-rate-control-intent') {
          if (this.afRvrRateIntentAtTick !== null) { this.log('warning', 'assessment', `af-rvr-rate-refused-${this.currentTick}`, 'The patient-specific acute rate-control intent has already been recorded.'); break; }
          this.afRvrRateIntentAtTick = this.currentTick;
          this.log('warning', 'assessment', `af-rvr-rate-intent-recorded-${this.currentTick}`, 'Patient-specific acute rate-control intent was recorded using current stability, LVEF, pressure, symptoms, comorbidity, contraindications, interactions, and anticipated response. No universal target, agent, dose, prescription, medication delivery, or rhythm conversion was supplied.', { intentOnly: true, universalTargetSelected: false, treatmentDelivered: false });
          break;
        }
        if (this.afRvrRateIntentAtTick === null) { this.log('warning', 'assessment', `af-rvr-rate-order-refused-${this.currentTick}`, 'Record bounded rate-control intent before stroke-prevention planning.'); break; }
        if (response === 'record-af-rvr-stroke-prevention-intent') {
          if (this.afRvrStrokePreventionAtTick !== null) { this.log('warning', 'assessment', `af-rvr-stroke-refused-${this.currentTick}`, 'The thromboembolic, bleeding, preference, and cardioversion context has already been reviewed.'); break; }
          this.afRvrStrokePreventionAtTick = this.currentTick;
          this.log('warning', 'assessment', `af-rvr-stroke-prevention-recorded-${this.currentTick}`, 'Validated thromboembolic-risk review, bleeding context, kidney function, interactions, preferences, uncertain AF duration, and cardioversion implications were recorded separately from rate control. The authored risk is not low; no exact score, anticoagulant, dose, eligibility decision, or treatment was supplied.', { strokeRisk: 'not-low', exactScoreCalculated: false, anticoagulantSelected: false, treatmentDelivered: false });
          break;
        }
        if (this.afRvrStrokePreventionAtTick === null) { this.log('warning', 'assessment', `af-rvr-stroke-order-refused-${this.currentTick}`, 'Review stroke prevention and cardioversion context before reassessing the trajectory.'); break; }
        if (this.afRvrReassessmentAtTick !== null) { this.log('warning', 'assessment', `af-rvr-reassessment-refused-${this.currentTick}`, 'The fixed AF trajectory and follow-up ownership have already been reassessed.'); break; }
        this.afRvrReassessmentAtTick = this.currentTick;
        this.log('warning', 'assessment', `af-rvr-trajectory-reassessed-${this.currentTick}`, 'Fixed reassessment: the rhythm remains atrial fibrillation with ventricular rate 96/min, BP 120/72 mmHg, improved palpitations, alert mentation, warm perfusion, and no authored ischemia or acute heart failure. Monitoring, instability triggers, owner, rhythm follow-up, risk-factor review, and the next reassessment were recorded. Better rate did not erase AF or stroke-prevention questions.', { rhythmRemainsAf: true, heartRateBpm: 96, ownerNamed: true, outcomePredicted: false });
        break;
      }
      case 'post-infarction-shock-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'post-infarction-cardiogenic-shock-escalation');
        const valid = ['reconcile-post-infarction-shock-trajectory',
          'reopen-post-infarction-shock-causes', 'contact-post-infarction-shock-center',
          'record-post-infarction-shock-bridge', 'handoff-post-infarction-shock-trajectory']
          .includes(response);
        if (!supported || !valid) { this.log('warning', 'assessment', `post-infarction-shock-response-refused-${this.currentTick}`, supported ? 'The post-infarction shock action was not one of the listed choices. Nothing changed.' : 'These post-infarction shock choices are available only in the declared lesson.'); break; }
        if (response === 'reconcile-post-infarction-shock-trajectory') {
          if (this.postInfarctionShockTrajectoryAtTick !== null) { this.log('warning', 'assessment', `post-infarction-shock-trajectory-refused-${this.currentTick}`, 'The serial perfusion trajectory has already been reconciled.'); break; }
          this.postInfarctionShockTrajectoryAtTick = this.currentTick;
          this.log('warning', 'assessment', `post-infarction-shock-trajectory-reconciled-${this.currentTick}`, 'Verified initial support raised MAP from 57 to 64 mmHg, but worsening attention, cool mottling, refill 5 seconds, urine 8 mL/h, rising lactate, and persistent congestion establish inadequate response and ongoing multi-organ hypoperfusion. Agent, dose, target, and continued adequacy remain unmodeled.', { pressureAloneUsed: false, shockResolved: false, initialSupportDelivered: true, responseAdequate: false });
          break;
        }
        if (this.postInfarctionShockTrajectoryAtTick === null) { this.log('warning', 'assessment', `post-infarction-shock-order-refused-${this.currentTick}`, 'Reconcile the serial perfusion trajectory before cause review or escalation.'); break; }
        if (response === 'reopen-post-infarction-shock-causes') {
          if (this.postInfarctionShockCausesAtTick !== null) { this.log('warning', 'assessment', `post-infarction-shock-causes-refused-${this.currentTick}`, 'The reported care, fixed findings, and open causes have already been reviewed.'); break; }
          this.postInfarctionShockCausesAtTick = this.currentTick;
          this.log('warning', 'assessment', `post-infarction-shock-causes-reopened-${this.currentTick}`, 'Reported culprit-vessel PCI, infusion delivery and effect, ECG, LV and RV function, mechanical complications, rhythm, congestion, hemoglobin, access-site bleeding, infection or vasodilation, PE, tamponade, and medication or device problems were reconciled. Fixed negatives are snapshots, not permanent exclusions.', { causeClosed: false, mechanicalCausesRemainOpen: true });
          break;
        }
        if (response === 'contact-post-infarction-shock-center') {
          if (this.postInfarctionShockTransferAtTick !== null) { this.log('warning', 'assessment', `post-infarction-shock-transfer-refused-${this.currentTick}`, 'The shock-team and advanced-center transfer pathway has already been activated.'); break; }
          this.postInfarctionShockTransferAtTick = this.currentTick;
          this.log('warning', 'assessment', `post-infarction-shock-center-contacted-${this.currentTick}`, 'The local multidisciplinary shock team was activated and the regional advanced shock center was contacted for consultation and potential-transfer evaluation. Stability, contraindications, preferences, accepting-center selection, and whether or when transfer occurs remain open.', { regionalCenterContacted: true, transferCompleted: false, routineDeviceSelected: false });
          break;
        }
        if (this.postInfarctionShockCausesAtTick === null || this.postInfarctionShockTransferAtTick === null) { this.log('warning', 'assessment', `post-infarction-shock-bridge-order-refused-${this.currentTick}`, 'Reopen causes and activate the shock/transfer pathway before recording the transport bridge.'); break; }
        if (response === 'record-post-infarction-shock-bridge') {
          if (this.postInfarctionShockBridgeAtTick !== null) { this.log('warning', 'assessment', `post-infarction-shock-bridge-refused-${this.currentTick}`, 'The individualized transport bridge has already been recorded.'); break; }
          this.postInfarctionShockBridgeAtTick = this.currentTick;
          this.log('warning', 'assessment', `post-infarction-shock-bridge-recorded-${this.currentTick}`, 'An expert, phenotype- and trajectory-dependent transport bridge was recorded across perfusion, congestion, oxygenation, rhythm, access, organ injury, candidacy, risk, and available resources. No blind fluid load, universal target, fixed drug or dose, or routine device was selected or delivered.', { blindFluidLoading: false, universalTargetSelected: false, routineDeviceSelected: false, treatmentDelivered: false });
          break;
        }
        if (this.postInfarctionShockBridgeAtTick === null || this.currentTick <= this.postInfarctionShockBridgeAtTick) { this.log('warning', 'assessment', `post-infarction-shock-handoff-order-refused-${this.currentTick}`, 'Record the bridge, allow reassessment time to pass, then hand off the unresolved trajectory.'); break; }
        if (this.postInfarctionShockHandoffAtTick !== null) { this.log('warning', 'assessment', `post-infarction-shock-handoff-refused-${this.currentTick}`, 'The elapsed reassessment and transfer handoff has already been recorded.'); break; }
        this.postInfarctionShockHandoffAtTick = this.currentTick;
        this.log('warning', 'assessment', `post-infarction-shock-handoff-recorded-${this.currentTick}`, 'Elapsed fixed reassessment shows MAP 67 mmHg, but drowsiness, mottling, oliguria, lactate 5.1 mmol/L, and congestion persist. Shock is not resolved. Perfusion, open causes, support adequacy, organ risk, transport readiness, owners, and change triggers were handed off.', { shockResolved: false, ownerNamed: true, outcomePredicted: false });
        break;
      }
      case 'stable-narrow-tachycardia-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'regular-narrow-complex-tachycardia');
        const valid = ['reconcile-stable-regular-narrow-tachycardia',
          'review-stable-regular-narrow-context', 'record-stable-regular-narrow-vagal-intent',
          'review-stable-regular-narrow-vagal-response',
          'record-stable-regular-narrow-adenosine-intent',
          'reassess-stable-regular-narrow-trajectory'].includes(response);
        if (!supported || !valid) { this.log('warning', 'assessment', `stable-narrow-tachycardia-response-refused-${this.currentTick}`, supported ? 'The stable regular-narrow action was not one of the listed choices. Nothing changed.' : 'These stable regular-narrow choices are available only in the declared lesson.'); break; }
        if (response === 'reconcile-stable-regular-narrow-tachycardia') {
          if (this.stableNarrowStabilityAtTick !== null) { this.log('warning', 'assessment', `stable-narrow-tachycardia-stability-refused-${this.currentTick}`, 'The rhythm and whole-patient stability have already been reconciled.'); break; }
          this.stableNarrowStabilityAtTick = this.currentTick;
          this.log('warning', 'assessment', `stable-narrow-tachycardia-stability-reconciled-${this.currentTick}`, 'The fixed 12-lead report describes a regular narrow rhythm at 176/min. BP 124/78 mmHg, alert mentation, warm perfusion, and no authored shock, ischemic discomfort, acute heart failure, or syncope support a stable pathway now. Heart rate alone did not define instability.', { hemodynamicallyStable: true, instabilityDefinedByRateAlone: false });
          break;
        }
        if (this.stableNarrowStabilityAtTick === null) { this.log('warning', 'assessment', `stable-narrow-tachycardia-order-refused-${this.currentTick}`, 'Reconcile rhythm and whole-patient stability before the monitored pathway.'); break; }
        if (response === 'review-stable-regular-narrow-context') {
          if (this.stableNarrowContextAtTick !== null) { this.log('warning', 'assessment', `stable-narrow-tachycardia-context-refused-${this.currentTick}`, 'The rhythm context, contributors, contraindications, and readiness have already been reviewed.'); break; }
          this.stableNarrowContextAtTick = this.currentTick;
          this.log('warning', 'assessment', `stable-narrow-tachycardia-context-reviewed-${this.currentTick}`, 'Abrupt onset, prior episodes, fixed ECG description, prior sinus ECG, medications, stimulants, reversible contributors, active bronchospasm, conduction disease, transplant context, access, continuous rhythm/pressure/oximetry, and resuscitation readiness were reviewed. The phenotype does not prove AVNRT, AVRT, atrial tachycardia, or flutter.', { mechanismProven: false, routineOxygenSelected: false, resuscitationReady: true });
          break;
        }
        if (this.stableNarrowContextAtTick === null) { this.log('warning', 'assessment', `stable-narrow-tachycardia-context-order-refused-${this.currentTick}`, 'Review context and monitored readiness before vagal intent.'); break; }
        if (response === 'record-stable-regular-narrow-vagal-intent') {
          if (this.stableNarrowVagalAtTick !== null) { this.log('warning', 'assessment', `stable-narrow-tachycardia-vagal-refused-${this.currentTick}`, 'The coached vagal-maneuver intent has already been recorded.'); break; }
          this.stableNarrowVagalAtTick = this.currentTick;
          this.log('warning', 'assessment', `stable-narrow-tachycardia-vagal-intent-recorded-${this.currentTick}`, 'Coached modified-Valsalva intent was recorded while the patient remained stable and monitored. Physical performance, effort quality, carotid massage, and psychomotor competence are not simulated.', { intentOnly: true, carotidMassage: false });
          break;
        }
        if (response === 'review-stable-regular-narrow-vagal-response') {
          if (this.stableNarrowVagalAtTick === null || this.currentTick <= this.stableNarrowVagalAtTick) { this.log('warning', 'assessment', `stable-narrow-tachycardia-vagal-response-order-refused-${this.currentTick}`, 'Record vagal intent, allow an engine tick, then review the authored response.'); break; }
          if (this.stableNarrowVagalResponseAtTick !== null) { this.log('warning', 'assessment', `stable-narrow-tachycardia-vagal-response-refused-${this.currentTick}`, 'The authored vagal response has already been reviewed.'); break; }
          this.stableNarrowVagalResponseAtTick = this.currentTick;
          this.log('warning', 'assessment', `stable-narrow-tachycardia-vagal-response-reviewed-${this.currentTick}`, 'Fixed response: regular narrow-complex tachycardia persists at 174/min with BP 123/77 mmHg, alert mentation, warm perfusion, and no new instability. Nonconversion does not establish one mechanism.', { converted: false, hemodynamicallyStable: true, mechanismProven: false });
          break;
        }
        if (this.stableNarrowVagalResponseAtTick === null) { this.log('warning', 'assessment', `stable-narrow-tachycardia-adenosine-order-refused-${this.currentTick}`, 'Review the elapsed vagal nonresponse before adenosine intent.'); break; }
        if (response === 'record-stable-regular-narrow-adenosine-intent') {
          if (this.stableNarrowAdenosineAtTick !== null) { this.log('warning', 'assessment', `stable-narrow-tachycardia-adenosine-refused-${this.currentTick}`, 'The protocol-bounded adenosine intent has already been recorded.'); break; }
          this.stableNarrowAdenosineAtTick = this.currentTick;
          this.log('warning', 'assessment', `stable-narrow-tachycardia-adenosine-intent-recorded-${this.currentTick}`, 'Protocol-bounded adenosine intent was recorded for the authored stable regular narrow rhythm after contraindication, access, monitoring, and resuscitation-readiness review. No dose, preparation, delivery, exact mechanism, or guaranteed conversion was supplied.', { intentOnly: true, doseSelected: false, treatmentDelivered: false, mechanismProven: false });
          break;
        }
        if (this.stableNarrowAdenosineAtTick === null || this.currentTick <= this.stableNarrowAdenosineAtTick) { this.log('warning', 'assessment', `stable-narrow-tachycardia-reassessment-order-refused-${this.currentTick}`, 'Record adenosine intent, allow an engine tick, then reassess the authored trajectory.'); break; }
        if (this.stableNarrowReassessmentAtTick !== null) { this.log('warning', 'assessment', `stable-narrow-tachycardia-reassessment-refused-${this.currentTick}`, 'The fixed rhythm response and follow-up have already been reassessed.'); break; }
        this.stableNarrowReassessmentAtTick = this.currentTick;
        this.rhythm = 'sinus';
        this.log('warning', 'assessment', `stable-narrow-tachycardia-trajectory-reassessed-${this.currentTick}`, 'Fixed reassessment: sinus rhythm 88/min, BP 122/76 mmHg, improved palpitations, alert mentation, and warm perfusion. Rhythm capture, adverse effects, recurrence and instability triggers, patient-taught vagal strategy, owner, and cardiology/electrophysiology follow-up were recorded. Conversion did not prove one mechanism or guarantee cure.', { converted: true, mechanismProven: false, ownerNamed: true, outcomePredicted: false });
        break;
      }
      case 'stable-wide-tachycardia-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'wide-complex-tachycardia');
        const valid = ['reconcile-stable-wide-complex-tachycardia', 'review-wide-complex-context',
          'prepare-wide-complex-pathway', 'record-wide-complex-procainamide-pathway',
          'review-wide-complex-medication-nonresponse', 'record-wide-complex-cardioversion-intent',
          'reassess-wide-complex-trajectory'].includes(response);
        if (!supported || !valid) { this.log('warning', 'assessment', `stable-wide-tachycardia-response-refused-${this.currentTick}`, supported ? 'The wide-complex action was not one of the listed choices. Nothing changed.' : 'These wide-complex choices are available only in the declared lesson.'); break; }
        if (response === 'reconcile-stable-wide-complex-tachycardia') {
          if (this.stableWideStabilityAtTick !== null) { this.log('warning', 'assessment', `stable-wide-stability-refused-${this.currentTick}`, 'Pulse, rhythm, and stability were already reconciled.'); break; }
          this.stableWideStabilityAtTick = this.currentTick;
          this.log('warning', 'assessment', `stable-wide-stability-reconciled-${this.currentTick}`, 'A palpable pulse, BP 118/72 mmHg, alert mentation, warm perfusion, and no authored shock, ischemic discomfort, acute heart failure, or syncope support a stable pathway now. The regular monomorphic QRS is 158 ms; rate alone does not define stability.', { pulsePresent: true, hemodynamicallyStable: true, instabilityDefinedByRateAlone: false }); break;
        }
        if (this.stableWideStabilityAtTick === null) { this.log('warning', 'assessment', `stable-wide-order-refused-${this.currentTick}`, 'Confirm pulse and reconcile whole-patient stability first.'); break; }
        if (response === 'review-wide-complex-context') {
          if (this.stableWideContextAtTick !== null) { this.log('warning', 'assessment', `stable-wide-context-refused-${this.currentTick}`, 'The wide-rhythm context was already reviewed.'); break; }
          this.stableWideContextAtTick = this.currentTick;
          this.log('warning', 'assessment', `stable-wide-context-reviewed-${this.currentTick}`, 'Regular monomorphic morphology, prior narrow ECG, remote infarct, preserved reported LVEF, ischemic features, potassium, magnesium, QT, medications, pacing, pre-excitation, aberrancy, and toxic or metabolic contributors were reviewed. Structural disease raises concern for VT without proving one mechanism.', { mechanismProven: false, potentialVtTreatedSafely: true }); break;
        }
        if (this.stableWideContextAtTick === null) { this.log('warning', 'assessment', `stable-wide-context-order-refused-${this.currentTick}`, 'Review morphology and context before preparing the pathway.'); break; }
        if (response === 'prepare-wide-complex-pathway') {
          if (this.stableWideReadinessAtTick !== null) { this.log('warning', 'assessment', `stable-wide-readiness-refused-${this.currentTick}`, 'The monitored pathway was already prepared.'); break; }
          this.stableWideReadinessAtTick = this.currentTick;
          this.log('warning', 'equipment', `stable-wide-readiness-recorded-${this.currentTick}`, 'Continuous rhythm, pressure and oximetry, IV access, expert consultation, pads, defibrillator readiness, and instability triggers were recorded. SpO2 97% did not prompt routine oxygen.', { expertConsulted: true, cardioversionReady: true, routineOxygenSelected: false }); break;
        }
        if (this.stableWideReadinessAtTick === null) { this.log('warning', 'assessment', `stable-wide-readiness-order-refused-${this.currentTick}`, 'Prepare monitoring, expert help, and rescue capability before the authored medication path.'); break; }
        if (response === 'record-wide-complex-procainamide-pathway') {
          if (this.stableWideMedicationAtTick !== null) { this.log('warning', 'assessment', `stable-wide-medication-refused-${this.currentTick}`, 'The authored medication path was already recorded.'); break; }
          this.stableWideMedicationAtTick = this.currentTick;
          this.log('warning', 'assessment', `stable-wide-medication-path-recorded-${this.currentTick}`, 'The treating team selected one monitored procainamide pathway after confirming no heart-failure history or current signs and no prolonged-QT report. The learner did not select a dose, calculate a rate, prepare or deliver medication, or stack antiarrhythmics.', { authoredAgent: 'procainamide', doseSelected: false, learnerTreatmentDelivered: false, stackedAgents: false }); break;
        }
        if (response === 'review-wide-complex-medication-nonresponse') {
          if (this.stableWideMedicationAtTick === null || this.currentTick <= this.stableWideMedicationAtTick) { this.log('warning', 'assessment', `stable-wide-nonresponse-order-refused-${this.currentTick}`, 'Record the authored medication path, allow an engine tick, then review the reported response.'); break; }
          if (this.stableWideNonresponseAtTick !== null) { this.log('warning', 'assessment', `stable-wide-nonresponse-refused-${this.currentTick}`, 'The fixed medication response was already reviewed.'); break; }
          this.stableWideNonresponseAtTick = this.currentTick;
          this.log('warning', 'assessment', `stable-wide-medication-nonresponse-reviewed-${this.currentTick}`, 'Fixed treating-team report after the monitored course: regular monomorphic WCT persists at 158/min, BP 114/70 mmHg, with a pulse, alert mentation, warm perfusion, and no new instability. Nonresponse does not prove a mechanism or a universal drug sequence.', { converted: false, hemodynamicallyStable: true, mechanismProven: false }); break;
        }
        if (this.stableWideNonresponseAtTick === null) { this.log('warning', 'assessment', `stable-wide-cardioversion-order-refused-${this.currentTick}`, 'Review the elapsed fixed medication nonresponse before escalation in this authored course.'); break; }
        if (response === 'record-wide-complex-cardioversion-intent') {
          if (this.stableWideCardioversionAtTick !== null) { this.log('warning', 'assessment', `stable-wide-cardioversion-refused-${this.currentTick}`, 'Synchronized-cardioversion intent was already recorded.'); break; }
          this.stableWideCardioversionAtTick = this.currentTick;
          this.log('warning', 'assessment', `stable-wide-cardioversion-intent-recorded-${this.currentTick}`, 'Protocol-bounded synchronized-cardioversion intent was recorded after persistent WCT in this authored course. Energy, synchronization-marker verification, sedation, device operation, and shock delivery are not simulated.', { intentOnly: true, shockDelivered: false }); break;
        }
        if (this.stableWideCardioversionAtTick === null || this.currentTick <= this.stableWideCardioversionAtTick) { this.log('warning', 'assessment', `stable-wide-reassessment-order-refused-${this.currentTick}`, 'Record cardioversion intent, allow an engine tick, then reassess the fixed report.'); break; }
        if (this.stableWideReassessmentAtTick !== null) { this.log('warning', 'assessment', `stable-wide-reassessment-refused-${this.currentTick}`, 'The fixed trajectory was already reassessed.'); break; }
        this.stableWideReassessmentAtTick = this.currentTick;
        this.rhythm = 'sinus';
        this.log('warning', 'assessment', `stable-wide-trajectory-reassessed-${this.currentTick}`, 'Fixed post-team report: sinus rhythm 84/min, BP 120/74 mmHg, resolved palpitations, palpable pulse, alert mentation, and warm perfusion. Adverse effects, rhythm capture, cause, ischemic and structural evaluation, recurrence triggers, owner, and cardiology/electrophysiology follow-up remain explicit. Conversion is not diagnostic proof or cure.', { converted: true, mechanismProven: false, ownerNamed: true, outcomePredicted: false }); break;
      }
      case 'aspiration-risk-assessment': {
        const supported = this.scenario.timeline.some(
          (event) => event.type === 'narrative' && event.target === 'aspiration-risk-recognition',
        );
        const response = String(action.payload.action ?? '');
        const valid = [
          'review-cues', 'classify-elevated', 'classify-routine',
          'defer-and-replan', 'proceed-routine',
        ].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `aspiration-risk-refused-${this.currentTick}`,
            supported
              ? 'The aspiration-risk action was not one of the listed choices. No decision was recorded.'
              : 'The bounded aspiration-risk choices are available only in the declared recognition lesson.');
          break;
        }
        if (response === 'review-cues') {
          if (this.aspirationRiskCuesReviewedAtTick !== null) {
            this.log('warning', 'assessment', `aspiration-risk-review-refused-${this.currentTick}`,
              'The medication, symptom, fasting, and urgency cues have already been reviewed.');
            break;
          }
          this.aspirationRiskCuesReviewedAtTick = this.currentTick;
          this.log('advisory', 'assessment', `aspiration-risk-cues-reviewed-${this.currentTick}`,
            'Focused review: semaglutide dose escalation, a dose increase three days ago, current nausea and bloating, an ordinary fasting interval, and an elective procedure. Fasting time alone does not resolve this patient-specific delayed-emptying concern.', {
              doseEscalation: true, gastrointestinalSymptoms: true,
              ordinaryFastingInterval: true, electiveProcedure: true,
            });
          break;
        }
        if (this.aspirationRiskCuesReviewedAtTick === null) {
          this.log('warning', 'assessment', `aspiration-risk-order-refused-${this.currentTick}`,
            'Review the medication, symptom, fasting, and urgency cues before classifying or choosing a plan.');
          break;
        }
        if (response.startsWith('classify-')) {
          if (this.aspirationRiskClassification !== null) {
            this.log('warning', 'assessment', `aspiration-risk-classification-refused-${this.currentTick}`,
              'An aspiration-risk classification has already been recorded for this attempt.');
            break;
          }
          this.aspirationRiskClassification = response === 'classify-elevated' ? 'elevated' : 'routine';
          this.aspirationRiskClassifiedAtTick = this.currentTick;
          this.log('advisory', 'assessment', `aspiration-risk-classified-${this.aspirationRiskClassification}-${this.currentTick}`,
            this.aspirationRiskClassification === 'elevated'
              ? 'Elevated delayed-gastric-emptying risk recorded. The classification comes from the combined escalation-phase and active-symptom pattern, not from GLP-1 use alone.'
              : 'Routine fasting risk recorded. This does not account for the declared escalation-phase and active gastrointestinal symptoms.', {
              classification: this.aspirationRiskClassification,
            });
          break;
        }
        if (this.aspirationRiskClassification === null) {
          this.log('warning', 'assessment', `aspiration-risk-plan-order-refused-${this.currentTick}`,
            'Classify the reviewed risk pattern before choosing a disposition.');
          break;
        }
        if (this.aspirationRiskPlan !== null) {
          this.log('warning', 'assessment', `aspiration-risk-plan-refused-${this.currentTick}`,
            'A disposition has already been recorded for this attempt.');
          break;
        }
        this.aspirationRiskPlan = response === 'defer-and-replan'
          ? 'defer-and-replan' : 'proceed-routine';
        this.aspirationRiskPlanAtTick = this.currentTick;
        this.log('advisory', 'assessment', `aspiration-risk-plan-${this.aspirationRiskPlan}-${this.currentTick}`,
          this.aspirationRiskPlan === 'defer-and-replan'
            ? 'Elective deferral and shared replanning recorded. This vignette does not set a universal medication-hold interval or choose a later anesthetic technique.'
            : 'Routine same-day progression recorded despite the declared escalation-phase and active gastrointestinal symptoms.', {
            plan: this.aspirationRiskPlan, classification: this.aspirationRiskClassification,
          });
        break;
      }
      case 'symptomatic-bradycardia-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'symptomatic-sinus-bradycardia-reassessment');
        const valid = ['reconcile-symptomatic-bradycardia-stability',
          'review-symptomatic-bradycardia-context', 'correlate-symptomatic-bradycardia-record',
          'record-symptomatic-bradycardia-pacing-evaluation',
          'handoff-symptomatic-bradycardia-plan'].includes(response);
        if (!supported || !valid) { this.log('warning', 'assessment', `symptomatic-bradycardia-response-refused-${this.currentTick}`, supported ? 'The symptomatic-bradycardia action was not one of the listed choices. Nothing changed.' : 'These longitudinal bradycardia choices are available only in the declared lesson.'); break; }
        if (response === 'reconcile-symptomatic-bradycardia-stability') {
          if (this.symptomaticBradycardiaStabilityAtTick !== null) { this.log('warning', 'assessment', `symptomatic-bradycardia-stability-refused-${this.currentTick}`, 'The rate, symptoms, pulse, and stability were already reconciled.'); break; }
          this.symptomaticBradycardiaStabilityAtTick = this.currentTick;
          this.log('advisory', 'assessment', `symptomatic-bradycardia-stability-reconciled-${this.currentTick}`, 'Fixed sinus bradycardia is 44/min with a palpable pulse, BP 134/72 mmHg, alert mentation, warm perfusion, SpO2 98% on room air, and no authored hypotension, shock, ischemic discomfort, acute heart failure, or syncope. Chronic fatigue and exertional lightheadedness matter, but do not equal acute instability.', { hemodynamicallyStable: true, symptomaticMeansUnstable: false }); break;
        }
        if (this.symptomaticBradycardiaStabilityAtTick === null) { this.log('warning', 'assessment', `symptomatic-bradycardia-order-refused-${this.currentTick}`, 'Reconcile rate, pulse, symptoms, and current stability before longitudinal review.'); break; }
        if (response === 'review-symptomatic-bradycardia-context') {
          if (this.symptomaticBradycardiaContextAtTick !== null) { this.log('warning', 'assessment', `symptomatic-bradycardia-context-refused-${this.currentTick}`, 'The reversible and physiologic context was already reviewed.'); break; }
          this.symptomaticBradycardiaContextAtTick = this.currentTick;
          this.log('advisory', 'assessment', `symptomatic-bradycardia-context-reviewed-${this.currentTick}`, 'Medication indication, necessity and adherence; thyroid, electrolyte, temperature, hemoglobin, infection, hypoxemia, sleep, ischemic, structural, exercise and physiologic context were reviewed. No cause was declared and no beta blocker or other medication was reflexively stopped.', { causeProven: false, medicationChanged: false }); break;
        }
        if (response === 'correlate-symptomatic-bradycardia-record') {
          if (this.symptomaticBradycardiaCorrelationAtTick !== null) { this.log('warning', 'assessment', `symptomatic-bradycardia-correlation-refused-${this.currentTick}`, 'The fixed ambulatory record and diary were already correlated.'); break; }
          this.symptomaticBradycardiaCorrelationAtTick = this.currentTick;
          this.log('advisory', 'assessment', `symptomatic-bradycardia-correlation-reviewed-${this.currentTick}`, 'The pre-authored completed patch and diary repeatedly align typical exertional lightheadedness with sinus 38-44/min. No high-grade AV block, long pause, atrial fibrillation, or ventricular arrhythmia is reported. Correlation supports evaluation without making one heart-rate or pause cutoff diagnostic or proving sinus-node dysfunction.', { temporalCorrelationPresent: true, highGradeAvBlockPresent: false, mechanismProven: false, thresholdUsed: false }); break;
        }
        if (this.symptomaticBradycardiaContextAtTick === null || this.symptomaticBradycardiaCorrelationAtTick === null) { this.log('warning', 'assessment', `symptomatic-bradycardia-pacing-order-refused-${this.currentTick}`, 'Complete both reversible-context and symptom-rhythm correlation review before pacing evaluation.'); break; }
        if (response === 'record-symptomatic-bradycardia-pacing-evaluation') {
          if (this.symptomaticBradycardiaPacingEvaluationAtTick !== null) { this.log('warning', 'assessment', `symptomatic-bradycardia-pacing-refused-${this.currentTick}`, 'Shared pacing-evaluation intent was already recorded.'); break; }
          this.symptomaticBradycardiaPacingEvaluationAtTick = this.currentTick;
          this.log('advisory', 'assessment', `symptomatic-bradycardia-pacing-evaluation-recorded-${this.currentTick}`, 'Individualized cardiology/electrophysiology pacing evaluation and shared-decision intent were recorded around symptom burden, goals, preferences, alternatives, expected quality-of-life aim, and procedural and long-term device tradeoffs. No eligibility conclusion, device, mode, lead, date, procedure, guaranteed benefit, or mortality claim was supplied.', { intentOnly: true, deviceSelected: false, outcomePredicted: false }); break;
        }
        if (this.symptomaticBradycardiaPacingEvaluationAtTick === null) { this.log('warning', 'assessment', `symptomatic-bradycardia-handoff-order-refused-${this.currentTick}`, 'Record the shared pacing evaluation before closing the longitudinal plan.'); break; }
        if (this.symptomaticBradycardiaHandoffAtTick !== null) { this.log('warning', 'assessment', `symptomatic-bradycardia-handoff-refused-${this.currentTick}`, 'The symptom safety net, owner, and follow-up were already recorded.'); break; }
        this.symptomaticBradycardiaHandoffAtTick = this.currentTick;
        this.log('advisory', 'assessment', `symptomatic-bradycardia-handoff-recorded-${this.currentTick}`, 'Symptom tracking, locally determined reassessment, a named owner, and urgent triggers for syncope, hypotension, confusion, shock, ischemic discomfort, dyspnea or acute heart failure, worsening hypoxemia, poor perfusion, or pulse loss were recorded. The current rhythm remains sinus bradycardia; symptom, cause, medication, preference, device, and outcome questions remain open.', { ownerNamed: true, rhythmChanged: false, treatmentDelivered: false }); break;
      }
      case 'complete-heart-block-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'complete-heart-block');
        const valid = ['reconcile-complete-heart-block-stability',
          'review-complete-heart-block-context', 'activate-complete-heart-block-pathway',
          'reassess-complete-heart-block-trajectory',
          'handoff-complete-heart-block-pacing-plan'].includes(response);
        if (!supported || !valid) { this.log('warning', 'assessment', `complete-heart-block-response-refused-${this.currentTick}`, supported ? 'The complete-heart-block action was not one of the listed choices. Nothing changed.' : 'These complete-heart-block choices are available only in the declared lesson.'); break; }
        if (response === 'reconcile-complete-heart-block-stability') {
          if (this.completeHeartBlockStabilityAtTick !== null) { this.log('warning', 'assessment', `complete-heart-block-stability-refused-${this.currentTick}`, 'The fixed block, pulse, symptoms, and current stability were already reconciled.'); break; }
          this.completeHeartBlockStabilityAtTick = this.currentTick;
          this.log('advisory', 'assessment', `complete-heart-block-stability-reconciled-${this.currentTick}`, 'The fixed diagnostic report establishes complete AV block with independent atrial activity at 82/min and a regular wide ventricular escape at 34/min. A mechanical pulse, BP 116/70 mmHg, alert mentation, warm perfusion, SpO2 98% on room air, and no current hypotension, shock, ischemic discomfort, acute heart failure, or syncope establish stability now without making the block low risk.', { mechanicalPulsePresent: true, hemodynamicallyStable: true, ventricularRateBpm: 34, atrialRateBpm: 82 }); break;
        }
        if (this.completeHeartBlockStabilityAtTick === null) { this.log('warning', 'assessment', `complete-heart-block-order-refused-${this.currentTick}`, 'Reconcile the fixed AV-dissociation report, mechanical pulse, and current whole-patient stability first.'); break; }
        if (response === 'review-complete-heart-block-context') {
          if (this.completeHeartBlockContextAtTick !== null) { this.log('warning', 'assessment', `complete-heart-block-context-refused-${this.currentTick}`, 'The fixed reversible and structural context was already reviewed.'); break; }
          this.completeHeartBlockContextAtTick = this.currentTick;
          this.log('advisory', 'assessment', `complete-heart-block-context-reviewed-${this.currentTick}`, 'The fixed initial medication, toxic, temperature, electrolyte, thyroid, ischemic, infectious, inflammatory, procedural, physiologic, and structural context was reviewed. No reversible cause is identified in this authored initial panel, but absence is not proved and cause remains open.', { reversibleCauseIdentified: false, absenceProven: false, acquiredBlockAuthored: true }); break;
        }
        if (response === 'activate-complete-heart-block-pathway') {
          if (this.completeHeartBlockPathwayAtTick !== null) { this.log('warning', 'assessment', `complete-heart-block-pathway-refused-${this.currentTick}`, 'The monitored pacing-capable pathway was already activated.'); break; }
          this.completeHeartBlockPathwayAtTick = this.currentTick;
          this.log('advisory', 'assessment', `complete-heart-block-pathway-activated-${this.currentTick}`, 'Continuous rhythm, pulse, pressure, and oximetry monitoring; access readiness; pads and external backup availability; cardiology/electrophysiology consultation; pacing-capable care; and triggers for hypotension, altered mentation, shock, ischemic discomfort, acute heart failure, syncope, escape failure, or pulse loss were recorded. Cause review continues in parallel. No routine oxygen, atropine gate, treatment, pacing, or capture is supplied.', { intentOnly: true, pacingDelivered: false, captureAssessed: false, routineOxygenSelected: false }); break;
        }
        if (this.completeHeartBlockContextAtTick === null || this.completeHeartBlockPathwayAtTick === null) { this.log('warning', 'assessment', `complete-heart-block-reassessment-order-refused-${this.currentTick}`, 'Complete both cause review and pacing-capable escalation before reassessing the persistent block.'); break; }
        if (response === 'reassess-complete-heart-block-trajectory') {
          if (this.completeHeartBlockReassessmentAtTick !== null) { this.log('warning', 'assessment', `complete-heart-block-reassessment-refused-${this.currentTick}`, 'The persistent block was already reassessed.'); break; }
          if (this.currentTick <= Math.max(this.completeHeartBlockContextAtTick, this.completeHeartBlockPathwayAtTick)) { this.log('warning', 'assessment', `complete-heart-block-elapsed-time-refused-${this.currentTick}`, 'Allow a later simulated tick before reviewing persistence. No consultation, transfer, or procedure is implied.'); break; }
          this.completeHeartBlockReassessmentAtTick = this.currentTick;
          this.log('advisory', 'assessment', `complete-heart-block-trajectory-reassessed-${this.currentTick}`, 'At the later check, the fixed complete AV block persists with ventricular escape 34/min, a palpable pulse, BP 116/70 mmHg, alert mentation, warm perfusion, and SpO2 98% on room air. Stability has not resolved the acquired block; no treatment, paced rhythm, or capture is simulated.', { blockPersists: true, pacingDelivered: false, captureAssessed: false }); break;
        }
        if (this.completeHeartBlockReassessmentAtTick === null) { this.log('warning', 'assessment', `complete-heart-block-handoff-order-refused-${this.currentTick}`, 'Reassess the persistent complete block before definitive evaluation handoff.'); break; }
        if (this.completeHeartBlockHandoffAtTick !== null) { this.log('warning', 'assessment', `complete-heart-block-handoff-refused-${this.currentTick}`, 'The pacing evaluation and ownership handoff were already recorded.'); break; }
        this.completeHeartBlockHandoffAtTick = this.currentTick;
        this.log('advisory', 'assessment', `complete-heart-block-handoff-recorded-${this.currentTick}`, 'Guideline-supported permanent-pacing evaluation for authored acquired complete AV block without an identified reversible or physiologic cause, shared goals and tradeoffs, current perfusion, open causes, monitored contingency, named owners, and acute-change triggers were handed off. No eligibility adjudication, device, mode, lead, implant, program, capture claim, disposition, benefit, or outcome was supplied.', { intentOnly: true, deviceSelected: false, pacingDelivered: false, captureAssessed: false }); break;
      }
      case 'torsades-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'torsades-de-pointes');
        const valid = ['reconcile-torsades-pulse-and-pattern',
          'record-torsades-unsynchronized-shock-intent', 'review-torsades-post-shock-rhythm',
          'review-torsades-long-qt-context', 'record-torsades-recurrence-suppression-intent',
          'handoff-torsades-recurrence-plan'].includes(response);
        if (!supported || !valid) { this.log('warning', 'assessment', `torsades-response-refused-${this.currentTick}`, supported ? 'The torsades action was not one of the listed choices. Nothing changed.' : 'These torsades choices are available only in the declared lesson.'); break; }
        if (response === 'reconcile-torsades-pulse-and-pattern') {
          if (this.torsadesRecognitionAtTick !== null) { this.log('warning', 'assessment', `torsades-recognition-refused-${this.currentTick}`, 'The polymorphic rhythm, pulse, and compromise were already reconciled.'); break; }
          this.torsadesRecognitionAtTick = this.currentTick;
          this.log('critical', 'assessment', `torsades-recognition-recorded-${this.currentTick}`, 'The fixed report and teaching trace show sustained polymorphic VT near 220/min in preceding long-QT context. A weak mechanical pulse, BP 74/42 mmHg, acute confusion, and poor perfusion are authored. This is electrically unstable torsades with a pulse, not stable monomorphic WCT or pulseless VF.', { pulsePresent: true, polymorphic: true, prolongedQtContext: true, hemodynamicallyCompromised: true }); break;
        }
        if (this.torsadesRecognitionAtTick === null) { this.log('warning', 'assessment', `torsades-order-refused-${this.currentTick}`, 'Confirm the fixed polymorphic rhythm, mechanical pulse, and compromise before recording the emergency response.'); break; }
        if (response === 'record-torsades-unsynchronized-shock-intent') {
          if (this.torsadesShockIntentAtTick !== null) { this.log('warning', 'assessment', `torsades-shock-refused-${this.currentTick}`, 'Immediate unsynchronized-shock intent was already recorded.'); break; }
          this.torsadesShockIntentAtTick = this.currentTick;
          this.log('critical', 'assessment', `torsades-unsynchronized-shock-intent-recorded-${this.currentTick}`, 'Immediate unsynchronized high-energy shock intent, experienced help, pads and defibrillator readiness, repeated pulse checks, and arrest-pathway transition for pulse loss were recorded. Magnesium, QT review, synchronization, and energy calculation did not delay the shock-first plan. Device operation, energy selection, sedation, and shock delivery are not simulated.', { intentOnly: true, unsynchronized: true, shockDeliveredByLearner: false, pulsePresent: true }); break;
        }
        if (this.torsadesShockIntentAtTick === null) { this.log('warning', 'assessment', `torsades-shock-order-refused-${this.currentTick}`, 'Record immediate unsynchronized-shock intent before cause or magnesium work.'); break; }
        if (response === 'review-torsades-post-shock-rhythm') {
          if (this.torsadesPostShockAtTick !== null) { this.log('warning', 'assessment', `torsades-post-shock-refused-${this.currentTick}`, 'The authored post-team rhythm report was already reviewed.'); break; }
          if (this.currentTick <= this.torsadesShockIntentAtTick) { this.log('warning', 'assessment', `torsades-post-shock-time-refused-${this.currentTick}`, 'Allow a later simulated tick before reviewing the authored post-team report. The learner did not deliver the shock.'); break; }
          this.torsadesPostShockAtTick = this.currentTick;
          this.rhythm = 'sinus-bradycardia';
          this.log('warning', 'assessment', `torsades-post-shock-rhythm-reviewed-${this.currentTick}`, 'Fixed later treating-team report: sinus bradycardia 52/min, BP 112/68 mmHg, alert mentation, warm perfusion, and SpO2 97% on room air. QTc remains 558 ms. Termination does not prevent recurrence, prove cause, or establish cure or outcome.', { converted: true, learnerShockDelivered: false, prolongedQtPersists: true, recurrenceRiskResolved: false }); break;
        }
        if (this.torsadesPostShockAtTick === null) { this.log('warning', 'assessment', `torsades-post-shock-order-refused-${this.currentTick}`, 'Review the elapsed authored post-team rhythm before recurrence prevention.'); break; }
        if (response === 'review-torsades-long-qt-context') {
          if (this.torsadesContextAtTick !== null) { this.log('warning', 'assessment', `torsades-context-refused-${this.currentTick}`, 'The long-QT and contributor context was already reviewed.'); break; }
          this.torsadesContextAtTick = this.currentTick;
          this.log('warning', 'assessment', `torsades-long-qt-context-reviewed-${this.currentTick}`, 'QT-active medications and interactions, reduced kidney function, bradycardia and pauses, potassium, magnesium, calcium, poor intake, ischemic and structural findings, and inherited and family context were reviewed. The fixed K 3.0 mmol/L, Mg 1.5 mg/dL, and QTc are patient facts, not universal thresholds or proof of one cause.', { causeProven: false, normalQtPolymorphicVt: false }); break;
        }
        if (response === 'record-torsades-recurrence-suppression-intent') {
          if (this.torsadesRecurrenceIntentAtTick !== null) { this.log('warning', 'assessment', `torsades-recurrence-intent-refused-${this.currentTick}`, 'The long-QT recurrence-suppression intent was already recorded.'); break; }
          this.torsadesRecurrenceIntentAtTick = this.currentTick;
          this.log('warning', 'assessment', `torsades-recurrence-suppression-intent-recorded-${this.currentTick}`, 'Protocol-bounded IV magnesium intent for recurrent long-QT polymorphic VT, correction of authored electrolyte abnormalities, QT-active culprit withdrawal and replacement review, continuous monitoring, and expert consultation for individualized bradycardia or pause prevention were recorded. No dose, target, delivery, pacing, isoproterenol, capture, or routine normal-QT magnesium claim was supplied.', { intentOnly: true, longQtSpecific: true, doseSelected: false, treatmentDeliveredByLearner: false }); break;
        }
        if (this.torsadesContextAtTick === null || this.torsadesRecurrenceIntentAtTick === null) { this.log('warning', 'assessment', `torsades-handoff-order-refused-${this.currentTick}`, 'Complete both long-QT context and recurrence-suppression lanes before final reassessment.'); break; }
        if (this.currentTick <= Math.max(this.torsadesContextAtTick, this.torsadesRecurrenceIntentAtTick)) { this.log('warning', 'assessment', `torsades-handoff-time-refused-${this.currentTick}`, 'Allow a later simulated tick before the recurrence-risk handoff. One interval cannot prove durable freedom from recurrence.'); break; }
        if (this.torsadesHandoffAtTick !== null) { this.log('warning', 'assessment', `torsades-handoff-refused-${this.currentTick}`, 'The recurrence-risk handoff was already recorded.'); break; }
        this.torsadesHandoffAtTick = this.currentTick;
        this.log('warning', 'assessment', `torsades-handoff-recorded-${this.currentTick}`, 'Fixed later check remains sinus bradycardia 52/min with preserved perfusion and no authored recurrence in this brief interval; QT risk remains open. Rhythm, QT, electrolytes, medication work, recurrence and pulse-loss triggers, arrest transition, expert rate-support contingency, and named owners were handed off without predicting disposition or outcome.', { recurrenceObservedInBriefInterval: false, recurrenceRiskResolved: false, ownerNamed: true, outcomePredicted: false }); break;
      }
      case 'hyperkalemic-conduction-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'hyperkalemic-conduction-disturbance');
        const valid = ['reconcile-hyperkalemic-conduction-trajectory',
          'review-hyperkalemic-conduction-calcium-response',
          'review-hyperkalemic-conduction-shift-surveillance',
          'review-hyperkalemic-conduction-removal-and-device-restraint',
          'review-hyperkalemic-conduction-later-panel',
          'handoff-hyperkalemic-conduction-reassessment'].includes(response);
        if (!supported || !valid) { this.log('warning', 'assessment', `hyperkalemic-conduction-response-refused-${this.currentTick}`, supported ? 'The hyperkalemic-conduction action was not one of the listed choices. Nothing changed.' : 'These hyperkalemic-conduction choices are available only in the declared Cardiology lesson.'); break; }
        if (response === 'reconcile-hyperkalemic-conduction-trajectory') {
          if (this.hyperkalemicConductionReconciledAtTick !== null) { this.log('warning', 'assessment', `hyperkalemic-conduction-reconcile-refused-${this.currentTick}`, 'The fixed metabolic and conduction trajectory was already reconciled.'); break; }
          this.hyperkalemicConductionReconciledAtTick = this.currentTick;
          this.log('warning', 'assessment', `hyperkalemic-conduction-trajectory-reconciled-${this.currentTick}`, 'The pre-treatment record links confirmed nonhemolyzed potassium 6.9 mmol/L with HR 38/min, attenuated P waves, conduction slowing, and QRS 154 ms. The current reported post-calcium state has a mechanical pulse, HR 52/min, QRS 112 ms, BP 118/70 mmHg, alert mentation, warm perfusion, and no authored shock, ischemic discomfort, acute heart failure, or syncope. Hyperkalemia is a reversible contributor; intrinsic conduction disease, ischemia, drug effects, and measurement error remain open.', { pulsePresent: true, hemodynamicallyStable: true, causeProvenExclusive: false }); break;
        }
        if (this.hyperkalemicConductionReconciledAtTick === null) { this.log('warning', 'assessment', `hyperkalemic-conduction-order-refused-${this.currentTick}`, 'Reconcile the pulse, whole-patient stability, potassium, ECG reports, and treatment timeline before interpreting the response.'); break; }
        if (response === 'review-hyperkalemic-conduction-calcium-response') {
          if (this.hyperkalemicConductionCalciumResponseAtTick !== null) { this.log('warning', 'assessment', `hyperkalemic-conduction-calcium-refused-${this.currentTick}`, 'The reported calcium and conduction response was already reviewed.'); break; }
          this.hyperkalemicConductionCalciumResponseAtTick = this.currentTick;
          this.log('warning', 'assessment', `hyperkalemic-conduction-calcium-response-reviewed-${this.currentTick}`, 'The treating team reports local-protocol IV calcium was delivered before Cardiology review. QRS narrowed from 154 to 112 ms and P waves became clearer while potassium remained 6.9 mmol/L. Membrane stabilization can improve the ECG without shifting or removing potassium; the authored association does not prove exclusive cause, learner delivery, durable response, or resolution.', { priorCareReported: true, potassiumLoweredByCalcium: false, treatmentDeliveredByLearner: false }); break;
        }
        if (response === 'review-hyperkalemic-conduction-shift-surveillance') {
          if (this.hyperkalemicConductionShiftSurveillanceAtTick !== null) { this.log('warning', 'assessment', `hyperkalemic-conduction-shift-refused-${this.currentTick}`, 'The reported shifting and glucose-surveillance lane was already reviewed.'); break; }
          this.hyperkalemicConductionShiftSurveillanceAtTick = this.currentTick;
          this.log('warning', 'assessment', `hyperkalemic-conduction-shift-surveillance-reviewed-${this.currentTick}`, 'Reported insulin-glucose and a locally selected adjunct shifting path were reconciled with baseline and serial glucose checks, repeat potassium timing, hypoglycemia contingency, and rebound surveillance. No dose, formulation, agent, delivery, potassium kinetics, or glucose outcome was selected or simulated.', { priorCareReported: true, glucoseSurveillanceRequired: true, treatmentDeliveredByLearner: false }); break;
        }
        if (response === 'review-hyperkalemic-conduction-removal-and-device-restraint') {
          if (this.hyperkalemicConductionRemovalDeviceAtTick !== null) { this.log('warning', 'assessment', `hyperkalemic-conduction-removal-device-refused-${this.currentTick}`, 'The removal, contributor, and device-restraint lane was already reviewed.'); break; }
          this.hyperkalemicConductionRemovalDeviceAtTick = this.currentTick;
          this.log('warning', 'assessment', `hyperkalemic-conduction-removal-device-reviewed-${this.currentTick}`, 'Kidney trajectory, illness and medication contributors, renal ownership, potassium removal, dialysis contingency, and rebound risk were reviewed. Pacing readiness remains available for new compromise, but pacing does not treat hyperkalemia and no permanent-device conclusion is made while reversible metabolic toxicity is being corrected. Persistent conduction disease after correction remains an expert reevaluation trigger.', { pacingDelivered: false, captureAssessed: false, permanentDeviceSelected: false }); break;
        }
        if (this.hyperkalemicConductionCalciumResponseAtTick === null
          || this.hyperkalemicConductionShiftSurveillanceAtTick === null
          || this.hyperkalemicConductionRemovalDeviceAtTick === null) { this.log('warning', 'assessment', `hyperkalemic-conduction-panel-order-refused-${this.currentTick}`, 'Review the calcium-response, shifting-surveillance, and removal/device-restraint lanes before the later panel.'); break; }
        if (response === 'review-hyperkalemic-conduction-later-panel') {
          if (this.hyperkalemicConductionLaterPanelAtTick !== null) { this.log('warning', 'assessment', `hyperkalemic-conduction-panel-refused-${this.currentTick}`, 'The authored later conduction panel was already reviewed.'); break; }
          if (this.currentTick <= Math.max(this.hyperkalemicConductionCalciumResponseAtTick,
            this.hyperkalemicConductionShiftSurveillanceAtTick,
            this.hyperkalemicConductionRemovalDeviceAtTick)) { this.log('warning', 'assessment', `hyperkalemic-conduction-panel-time-refused-${this.currentTick}`, 'Allow a later simulated tick before reviewing the authored follow-up potassium, glucose, and ECG report.'); break; }
          this.hyperkalemicConductionLaterPanelAtTick = this.currentTick;
          this.rhythm = 'sinus';
          this.log('advisory', 'assessment', `hyperkalemic-conduction-later-panel-reviewed-${this.currentTick}`, 'Fixed later treating-team report: potassium 5.8 mmol/L, glucose 92 mg/dL, sinus rhythm 62/min with visible P waves and QRS 98 ms, BP 122/72 mmHg, alert mentation, and warm perfusion. Improvement supports a reversible metabolic contribution but does not prove exclusive causality, durable resolution, learner-delivered effect, or absence of intrinsic conduction disease.', { potassiumMmolPerL: 5.8, glucoseMgPerDl: 92, qrsMs: 98, treatmentDeliveredByLearner: false, causeProvenExclusive: false }); break;
        }
        if (this.hyperkalemicConductionLaterPanelAtTick === null) { this.log('warning', 'assessment', `hyperkalemic-conduction-handoff-order-refused-${this.currentTick}`, 'Review the elapsed later potassium, glucose, and conduction report before handoff.'); break; }
        if (this.currentTick <= this.hyperkalemicConductionLaterPanelAtTick) { this.log('warning', 'assessment', `hyperkalemic-conduction-handoff-time-refused-${this.currentTick}`, 'Allow a later simulated tick before handing off surveillance and the unresolved conduction question.'); break; }
        if (this.hyperkalemicConductionHandoffAtTick !== null) { this.log('warning', 'assessment', `hyperkalemic-conduction-handoff-refused-${this.currentTick}`, 'The surveillance and conduction handoff was already recorded.'); break; }
        this.hyperkalemicConductionHandoffAtTick = this.currentTick;
        this.log('advisory', 'assessment', `hyperkalemic-conduction-handoff-recorded-${this.currentTick}`, 'Serial potassium, glucose, ECG, kidney function, removal progress, rebound risk, medication and illness contributors, compromise and pulse-loss triggers, renal and Cardiology owners, and persistent-conduction reevaluation were handed off. No pacing eligibility, device, capture, disposition, prognosis, recurrence, or outcome was supplied.', { permanentDeviceSelected: false, pacingDelivered: false, captureAssessed: false, outcomePredicted: false }); break;
      }
      case 'pericardial-tamponade-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'pericardial-tamponade-reassessment');
        const valid = ['reconcile-pericardial-tamponade-trajectory',
          'review-pericardial-tamponade-drainage-response',
          'review-pericardial-tamponade-etiology',
          'review-pericardial-tamponade-surveillance',
          'handoff-pericardial-tamponade-reassessment'].includes(response);
        if (!supported || !valid) { this.log('warning', 'assessment', `pericardial-tamponade-response-refused-${this.currentTick}`, supported ? 'The pericardial-tamponade action was not one of the listed choices. Nothing changed.' : 'These pericardial-tamponade choices are available only in the declared Cardiology lesson.'); break; }
        if (response === 'reconcile-pericardial-tamponade-trajectory') {
          if (this.pericardialTamponadeTrajectoryAtTick !== null) { this.log('warning', 'assessment', `pericardial-tamponade-trajectory-refused-${this.currentTick}`, 'The pretreatment tamponade and current circulation trajectory was already reconciled.'); break; }
          this.pericardialTamponadeTrajectoryAtTick = this.currentTick;
          this.log('warning', 'assessment', `pericardial-tamponade-trajectory-reconciled-${this.currentTick}`, 'The authored pretreatment record combines progressive dyspnea and orthopnea, HR 116/min, BP 88/64 mmHg, cool perfusion, elevated JVP, pulsus paradoxus 16 mmHg, and echo evidence of hemodynamic pericardial constraint. The current warm, alert state follows reported drainage by an experienced team. No single sign, effusion dimension, or response establishes tamponade universally.', { initialPulsePresent: true, diagnosisFromEffusionSizeAlone: false, imageAcquiredByLearner: false }); break;
        }
        if (this.pericardialTamponadeTrajectoryAtTick === null) { this.log('warning', 'assessment', `pericardial-tamponade-order-refused-${this.currentTick}`, 'Reconcile the clinical, hemodynamic, and fixed echo trajectory before reviewing drainage, cause, or surveillance.'); break; }
        if (response === 'review-pericardial-tamponade-drainage-response') {
          if (this.pericardialTamponadeDrainageResponseAtTick !== null) { this.log('warning', 'assessment', `pericardial-tamponade-drainage-refused-${this.currentTick}`, 'The reported drainage and current response was already reviewed.'); break; }
          this.pericardialTamponadeDrainageResponseAtTick = this.currentTick;
          this.log('warning', 'assessment', `pericardial-tamponade-drainage-response-reviewed-${this.currentTick}`, 'The treating team reports urgent image-guided drainage of 420 mL serosanguineous fluid and a retained pericardial catheter. Current HR 88/min, BP 116/72 mmHg, improved dyspnea, warm perfusion, and a fixed repeat echo with 8 mm residual circumferential effusion and no right-sided chamber collapse are authored reports. They do not grant procedure or image-acquisition skill, prove cause, or establish durable resolution.', { priorDrainageReported: true, treatmentDeliveredByLearner: false, imageAcquiredByLearner: false, procedurePerformedByLearner: false, catheterManipulatedByLearner: false }); break;
        }
        if (this.pericardialTamponadeDrainageResponseAtTick === null) { this.log('warning', 'assessment', `pericardial-tamponade-review-order-refused-${this.currentTick}`, 'Review the reported drainage and current response before opening cause and recurrence-surveillance work.'); break; }
        if (response === 'review-pericardial-tamponade-etiology') {
          if (this.pericardialTamponadeEtiologyAtTick !== null) { this.log('warning', 'assessment', `pericardial-tamponade-etiology-refused-${this.currentTick}`, 'The open etiology and pending-study lane was already reviewed.'); break; }
          this.pericardialTamponadeEtiologyAtTick = this.currentTick;
          this.log('warning', 'assessment', `pericardial-tamponade-etiology-reviewed-${this.currentTick}`, 'Active lung adenocarcinoma makes neoplastic pericardial disease important, but serosanguineous appearance and short-term response do not prove it. Cytology and microbiology remain pending; bacterial and tuberculosis risk by epidemiology, inflammatory or systemic disease, kidney disease, iatrogenic causes, and other etiologies remain open with named result ownership.', { malignantCauseProven: false, pendingStudiesOwned: true, diagnosisMadeByLearner: false }); break;
        }
        if (response === 'review-pericardial-tamponade-surveillance') {
          if (this.pericardialTamponadeSurveillanceAtTick !== null) { this.log('warning', 'assessment', `pericardial-tamponade-surveillance-refused-${this.currentTick}`, 'The post-drain circulation and recurrence-surveillance lane was already reviewed.'); break; }
          this.pericardialTamponadeSurveillanceAtTick = this.currentTick;
          this.log('warning', 'assessment', `pericardial-tamponade-surveillance-reviewed-${this.currentTick}`, 'Serial pulse, pressure, perfusion, mentation, respiratory state, rhythm, catheter output and site, repeat echo, reaccumulation, decompression-syndrome concern, and effusive-constrictive concern were reviewed. No catheter manipulation, removal threshold, imaging acquisition, treatment, or complication management was supplied.', { catheterManipulatedByLearner: false, removalThresholdSelected: false, imageAcquiredByLearner: false }); break;
        }
        if (this.pericardialTamponadeEtiologyAtTick === null
          || this.pericardialTamponadeSurveillanceAtTick === null) { this.log('warning', 'assessment', `pericardial-tamponade-handoff-order-refused-${this.currentTick}`, 'Complete both the etiology and recurrence-surveillance lanes before the later reassessment handoff.'); break; }
        if (this.currentTick <= Math.max(this.pericardialTamponadeEtiologyAtTick,
          this.pericardialTamponadeSurveillanceAtTick)) { this.log('warning', 'assessment', `pericardial-tamponade-handoff-time-refused-${this.currentTick}`, 'Allow a later simulated tick before reviewing the authored follow-up and handing off open work.'); break; }
        if (this.pericardialTamponadeHandoffAtTick !== null) { this.log('warning', 'assessment', `pericardial-tamponade-handoff-refused-${this.currentTick}`, 'The later reassessment and open-risk handoff was already recorded.'); break; }
        this.pericardialTamponadeHandoffAtTick = this.currentTick;
        this.log('advisory', 'assessment', `pericardial-tamponade-handoff-recorded-${this.currentTick}`, 'Fixed later report: HR 90/min, BP 114/70 mmHg, RR 18/min, SpO₂ 97% on room air, alert warm perfusion, 55 mL additional reported catheter output, and 9 mm residual effusion without chamber collapse. Studies remain pending. Cause, reaccumulation, bleeding, catheter, rhythm, respiratory, decompression, effusive-constrictive, deterioration, result, Cardiology, and oncology ownership were handed off without determining catheter removal, disposition, prognosis, recurrence, or outcome.', { treatmentDeliveredByLearner: false, catheterManipulatedByLearner: false, durableResolutionProven: false, outcomePredicted: false }); break;
      }
      case 'right-ventricular-infarction-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'right-ventricular-infarction');
        const valid = ['reconcile-right-ventricular-infarction',
          'review-right-ventricular-infarction-phenotype',
          'preserve-right-ventricular-infarction-reperfusion',
          'record-right-ventricular-infarction-support',
          'handoff-right-ventricular-infarction'].includes(response);
        if (!supported || !valid) { this.log('warning', 'assessment', `right-ventricular-infarction-response-refused-${this.currentTick}`, supported ? 'The right-ventricular-infarction action was not one of the listed choices. Nothing changed.' : 'These right-ventricular-infarction choices are available only in the declared Cardiology lesson.'); break; }
        if (response === 'reconcile-right-ventricular-infarction') {
          if (this.rightVentricularInfarctionReconciledAtTick !== null) { this.log('warning', 'assessment', `right-ventricular-infarction-reconciliation-refused-${this.currentTick}`, 'The acute ischemic, pressure, perfusion, rhythm, oxygenation, and congestion trajectory was already reconciled.'); break; }
          this.rightVentricularInfarctionReconciledAtTick = this.currentTick;
          this.log('critical', 'assessment', `right-ventricular-infarction-reconciled-${this.currentTick}`, 'Ongoing inferior-STEMI symptoms, HR 54/min, BP 86/60 mmHg, normal room-air oxygenation, alert warm perfusion, elevated JVP, clear lungs, and the absence of an authored multi-organ shock trajectory were reconciled. Pressure, JVP, or clear lungs alone did not establish the phenotype.', { pressureAloneUsed: false, shockDeclared: false, routineOxygenSelected: false, liveEcgInterpreted: false, treatmentDelivered: false }); break;
        }
        if (this.rightVentricularInfarctionReconciledAtTick === null) { this.log('warning', 'assessment', `right-ventricular-infarction-order-refused-${this.currentTick}`, 'Reconcile the whole ischemic and hemodynamic trajectory before reviewing the fixed RV phenotype or support.'); break; }
        if (response === 'review-right-ventricular-infarction-phenotype') {
          if (this.rightVentricularInfarctionPhenotypeAtTick !== null) { this.log('warning', 'assessment', `right-ventricular-infarction-phenotype-refused-${this.currentTick}`, 'The fixed right-sided ECG and echo phenotype was already reviewed.'); break; }
          this.rightVentricularInfarctionPhenotypeAtTick = this.currentTick;
          this.log('critical', 'assessment', `right-ventricular-infarction-phenotype-reviewed-${this.currentTick}`, 'Fixed reports of inferior ST elevation, 1.5 mm ST elevation in V4R, moderate RV dilation and dysfunction, and a small underfilled LV support acute RV involvement in this authored case. They were not acquired or interpreted here, do not create a universal cutoff, and do not permanently exclude pulmonary embolism, mechanical disease, rhythm or conduction disease, bleeding, medication effects, or another contributor.', { authoredRvInfarction: true, liveEcgInterpreted: false, imageAcquired: false, universalCutoffUsed: false, alternativesClosed: false }); break;
        }
        if (response === 'preserve-right-ventricular-infarction-reperfusion') {
          if (this.rightVentricularInfarctionReperfusionAtTick !== null) { this.log('warning', 'assessment', `right-ventricular-infarction-reperfusion-refused-${this.currentTick}`, 'The active reperfusion and rhythm-conduction readiness lane was already preserved.'); break; }
          this.rightVentricularInfarctionReperfusionAtTick = this.currentTick;
          this.log('critical', 'assessment', `right-ventricular-infarction-reperfusion-preserved-${this.currentTick}`, 'The already activated primary-PCI pathway remained time-sensitive while continuous rhythm, bradyarrhythmia, atrioventricular-block, and defibrillation readiness were preserved. RV-focused review did not delay reperfusion, perform PCI, or establish reperfusion completion.', { reperfusionDelayedForRvReview: false, pciPerformed: false, reperfusionCompleted: false, treatmentDelivered: false }); break;
        }
        if (this.rightVentricularInfarctionPhenotypeAtTick === null) { this.log('warning', 'assessment', `right-ventricular-infarction-phenotype-order-refused-${this.currentTick}`, 'Review the fixed right-sided ECG and echo phenotype before opening individualized support. The active reperfusion pathway remains available now.'); break; }
        if (response === 'record-right-ventricular-infarction-support') {
          if (this.rightVentricularInfarctionSupportAtTick !== null) { this.log('warning', 'assessment', `right-ventricular-infarction-support-refused-${this.currentTick}`, 'The individualized RV-support guardrails were already recorded.'); break; }
          this.rightVentricularInfarctionSupportAtTick = this.currentTick;
          this.log('critical', 'assessment', `right-ventricular-infarction-support-recorded-${this.currentTick}`, 'Support guardrails linked preload, systemic perfusion, congestion, rhythm, conduction, oxygenation, and serial response. In this hypotensive authored presentation no nitrate or reflex diuretic was selected. No fixed fluid volume, blind fluid load, universal pressure target, agent, dose, access, pump, or treatment delivery was supplied.', { nitrateSelected: false, diureticSelected: false, blindFluidLoading: false, fixedFluidVolumeSelected: false, universalTargetSelected: false, treatmentDelivered: false }); break;
        }
        if (this.rightVentricularInfarctionReperfusionAtTick === null
          || this.rightVentricularInfarctionSupportAtTick === null) { this.log('warning', 'assessment', `right-ventricular-infarction-handoff-order-refused-${this.currentTick}`, 'Complete both the reperfusion-readiness and individualized-support lanes before the later reassessment handoff.'); break; }
        if (this.currentTick <= Math.max(this.rightVentricularInfarctionReperfusionAtTick,
          this.rightVentricularInfarctionSupportAtTick)) { this.log('warning', 'assessment', `right-ventricular-infarction-handoff-time-refused-${this.currentTick}`, 'Allow a later simulated tick before handing off the unresolved RV-infarction trajectory.'); break; }
        if (this.rightVentricularInfarctionHandoffAtTick !== null) { this.log('warning', 'assessment', `right-ventricular-infarction-handoff-refused-${this.currentTick}`, 'The elapsed reassessment and open-work handoff was already recorded.'); break; }
        this.rightVentricularInfarctionHandoffAtTick = this.currentTick;
        this.log('critical', 'assessment', `right-ventricular-infarction-handoff-recorded-${this.currentTick}`, 'Fixed later report: chest pressure persists, HR 52/min in sinus rhythm, BP 88/62 mmHg, RR 18/min, SpO₂ 96% on room air, alert warm perfusion, elevated JVP, and clear lungs. Ischemia, reperfusion, perfusion, preload, congestion, rhythm, conduction, mechanical alternatives, treatment selection, owners, and change triggers were handed off without claiming treatment response, completed PCI, resolution, disposition, prognosis, or outcome.', { treatmentDelivered: false, pciPerformed: false, reperfusionCompleted: false, outcomePredicted: false }); break;
      }
      case 'hypertensive-emergency-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'hypertensive-emergency-reassessment');
        const valid = ['reconcile-hypertensive-emergency-measurement-and-trajectory',
          'review-hypertensive-emergency-organ-injury',
          'review-hypertensive-emergency-phenotype-and-causes',
          'record-hypertensive-emergency-controlled-reduction-intent',
          'review-hypertensive-emergency-later-panel',
          'handoff-hypertensive-emergency-reassessment'].includes(response);
        if (!supported || !valid) { this.log('warning', 'assessment', `hypertensive-emergency-response-refused-${this.currentTick}`, supported ? 'The hypertensive-emergency action was not one of the listed choices. Nothing changed.' : 'These hypertensive-emergency choices are available only in the declared Cardiology lesson.'); break; }
        if (response === 'reconcile-hypertensive-emergency-measurement-and-trajectory') {
          if (this.hypertensiveEmergencyMeasurementAtTick !== null) { this.log('warning', 'assessment', `hypertensive-emergency-measurement-refused-${this.currentTick}`, 'The authored measurement conditions and pressure trajectory were already reconciled.'); break; }
          this.hypertensiveEmergencyMeasurementAtTick = this.currentTick;
          this.log('critical', 'assessment', `hypertensive-emergency-measurement-reconciled-${this.currentTick}`, 'Documented rest, correct positioning, and a correctly sized cuff preceded repeated right-arm 236/132 and left-arm 232/130 mmHg readings after an initial 238/134 mmHg. Three days of headache and bilateral blurred vision followed a 3-week refill interruption. HR 86/min in sinus rhythm, RR 16/min, SpO₂ 98% on room air, temperature 36.8°C, alert coherent nonfocal mentation, and warm perfusion were reconciled without using marked pressure alone to establish emergency.', { measurementConditionsAuthored: true, pressureAloneUsed: false, testAcquiredByLearner: false, treatmentDeliveredByLearner: false }); break;
        }
        if (this.hypertensiveEmergencyMeasurementAtTick === null) { this.log('warning', 'assessment', `hypertensive-emergency-order-refused-${this.currentTick}`, 'Reconcile the authored measurement conditions and whole-patient pressure trajectory before reviewing organ injury.'); break; }
        if (response === 'review-hypertensive-emergency-organ-injury') {
          if (this.hypertensiveEmergencyOrganInjuryAtTick !== null) { this.log('warning', 'assessment', `hypertensive-emergency-organ-injury-refused-${this.currentTick}`, 'The authored acute target-organ injury was already reviewed.'); break; }
          this.hypertensiveEmergencyOrganInjuryAtTick = this.currentTick;
          this.log('critical', 'assessment', `hypertensive-emergency-organ-injury-reviewed-${this.currentTick}`, 'Fixed bilateral flame hemorrhages, cotton-wool spots, optic-disc edema, creatinine 2.1 mg/dL from 0.9 mg/dL 6 months earlier, 2+ protein, and microscopic hematuria establish acute renal-retinal target-organ injury in this authored case. Platelets are 214,000/µL and hemoglobin 12.6 g/dL. The learner did not perform fundoscopy, collect a specimen, acquire a test, or diagnose a real patient.', { acuteTargetOrganDamage: true, testAcquiredByLearner: false, procedurePerformed: false }); break;
        }
        if (this.hypertensiveEmergencyOrganInjuryAtTick === null) { this.log('warning', 'assessment', `hypertensive-emergency-organ-injury-order-refused-${this.currentTick}`, 'Review the authored acute target-organ injury before opening phenotype, causes, or controlled-reduction intent.'); break; }
        if (response === 'review-hypertensive-emergency-phenotype-and-causes') {
          if (this.hypertensiveEmergencyPhenotypeAtTick !== null) { this.log('warning', 'assessment', `hypertensive-emergency-phenotype-refused-${this.currentTick}`, 'The renal-retinal phenotype, current exclusions, change triggers, and open causes were already reviewed.'); break; }
          this.hypertensiveEmergencyPhenotypeAtTick = this.currentTick;
          this.log('critical', 'assessment', `hypertensive-emergency-phenotype-causes-reviewed-${this.currentTick}`, 'The fixed ECG shows sinus rhythm, LVH, and no acute ischemia; lungs are clear and fixed echo shows LVEF 60%, concentric LVH, no acute failure, and no effusion. No chest or back pain, dyspnea, pregnancy, pulmonary edema, ACS trajectory, asymmetry, focal deficit, seizure, altered mentation, or aortic pattern is authored now. These remain change triggers, while medication access, kidney disease, substances, interactions, and primary or secondary contributors remain open rather than assigning the refill gap as the sole cause.', { alternativesPermanentlyExcluded: false, causeAssigned: false, testAcquiredByLearner: false }); break;
        }
        if (response === 'record-hypertensive-emergency-controlled-reduction-intent') {
          if (this.hypertensiveEmergencyReductionIntentAtTick !== null) { this.log('warning', 'assessment', `hypertensive-emergency-reduction-intent-refused-${this.currentTick}`, 'The prompt monitored, syndrome-specific controlled-reduction intent was already recorded.'); break; }
          this.hypertensiveEmergencyReductionIntentAtTick = this.currentTick;
          this.log('critical', 'assessment', `hypertensive-emergency-reduction-intent-recorded-${this.currentTick}`, 'Prompt monitored, syndrome-specific controlled pressure reduction was recorded while preserving perfusion and organ-specific pathways. No drug, dose, infusion rate, fixed percentage, universal target, rapid normalization, disposition, treatment delivery, or outcome was selected.', { treatmentDeliveredByLearner: false, drugSelected: false, doseSelected: false, infusionRateSelected: false, universalTargetSelected: false, rapidNormalizationSelected: false, dispositionDetermined: false, outcomePredicted: false }); break;
        }
        if (response === 'review-hypertensive-emergency-later-panel') {
          if (this.hypertensiveEmergencyPhenotypeAtTick === null || this.hypertensiveEmergencyReductionIntentAtTick === null) { this.log('warning', 'assessment', `hypertensive-emergency-later-panel-order-refused-${this.currentTick}`, 'Complete both the phenotype-and-causes and controlled-reduction-intent lanes before reviewing the later panel.'); break; }
          if (this.currentTick <= Math.max(this.hypertensiveEmergencyPhenotypeAtTick, this.hypertensiveEmergencyReductionIntentAtTick)) { this.log('warning', 'assessment', `hypertensive-emergency-later-panel-time-refused-${this.currentTick}`, 'Allow a later simulated tick before reviewing the authored 45-minute panel.'); break; }
          if (this.hypertensiveEmergencyLaterPanelAtTick !== null) { this.log('warning', 'assessment', `hypertensive-emergency-later-panel-refused-${this.currentTick}`, 'The authored 45-minute panel was already reviewed.'); break; }
          this.hypertensiveEmergencyLaterPanelAtTick = this.currentTick;
          this.log('warning', 'assessment', `hypertensive-emergency-later-panel-reviewed-${this.currentTick}`, 'Fixed 45-minute report: BP 212/122 mmHg, HR 82/min, alert nonfocal mentation, easing headache, persistent visual symptoms, warm perfusion, and no chest or back pain or dyspnea. This directional change does not establish learner treatment, a drug effect, resolution, disposition, prognosis, or outcome.', { treatmentDeliveredByLearner: false, drugSelected: false, resolutionEstablished: false, outcomePredicted: false }); break;
        }
        if (this.hypertensiveEmergencyLaterPanelAtTick === null) { this.log('warning', 'assessment', `hypertensive-emergency-handoff-order-refused-${this.currentTick}`, 'Review the authored 45-minute panel before the later reassessment handoff.'); break; }
        if (this.currentTick <= this.hypertensiveEmergencyLaterPanelAtTick) { this.log('warning', 'assessment', `hypertensive-emergency-handoff-time-refused-${this.currentTick}`, 'Allow another later simulated tick before the 3-hour reassessment handoff.'); break; }
        if (this.hypertensiveEmergencyHandoffAtTick !== null) { this.log('warning', 'assessment', `hypertensive-emergency-handoff-refused-${this.currentTick}`, 'The authored 3-hour reassessment and open-work handoff was already recorded.'); break; }
        this.hypertensiveEmergencyHandoffAtTick = this.currentTick;
        this.log('warning', 'assessment', `hypertensive-emergency-handoff-recorded-${this.currentTick}`, 'Fixed 3-hour report: BP 188/106 mmHg, HR 80/min, headache improved, vision not worse, alert nonfocal mentation, clear lungs, urine output 38 mL/h, and creatinine 2.1 mg/dL. Renal-retinal injury, visual symptoms, causes, treatment selection and delivery, owners, and change triggers remain open without determining disposition, prognosis, resolution, or outcome.', { treatmentDeliveredByLearner: false, testAcquiredByLearner: false, procedurePerformed: false, dispositionDetermined: false, outcomePredicted: false }); break;
      }
      case 'acute-severe-asthma-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'acute-severe-asthma-reassessment');
        const valid = ['reconcile-acute-severe-asthma-treatment-and-trajectory',
          'recognize-acute-severe-asthma-respiratory-failure',
          'activate-acute-severe-asthma-critical-care-escalation',
          'review-acute-severe-asthma-alternatives-and-ventilation-risks',
          'handoff-acute-severe-asthma-reassessment'].includes(response);
        if (!supported || !valid) { this.log('warning', 'assessment', `acute-severe-asthma-response-refused-${this.currentTick}`, supported ? 'The acute severe-asthma action was not one of the listed choices. Nothing changed.' : 'These acute severe-asthma choices are available only in the declared Respiratory Medicine lesson.'); break; }
        if (response === 'reconcile-acute-severe-asthma-treatment-and-trajectory') {
          if (this.acuteSevereAsthmaTreatmentAtTick !== null) { this.log('warning', 'assessment', `acute-severe-asthma-treatment-refused-${this.currentTick}`, 'The authored treatment-delivery record and trajectory were already reconciled.'); break; }
          this.acuteSevereAsthmaTreatmentAtTick = this.currentTick;
          this.log('critical', 'assessment', `acute-severe-asthma-treatment-reconciled-${this.currentTick}`, 'The record verifies controlled oxygen; 3 delivered salbutamol-and-ipratropium cycles at 0, 20, and 40 minutes; systemic corticosteroid at 5 minutes; and IV magnesium at 45 minutes for poor response. At 75 minutes the patient is drowsy and confused, cannot speak, has a quieter chest and weakening effort, and now breathes 18/min after 36/min initially. SpO₂ is 93% on fixed 35% oxygen and peak flow is no longer safely performable. Less wheeze, a slower respiratory rate, and acceptable saturation on oxygen do not establish improvement.', { treatmentRecordAuthored: true, medicationDeliveredByLearner: false, oxygenDeliveredByLearner: false, peakFlowForced: false, improvementEstablished: false }); break;
        }
        if (this.acuteSevereAsthmaTreatmentAtTick === null) { this.log('warning', 'assessment', `acute-severe-asthma-treatment-order-refused-${this.currentTick}`, 'Reconcile what was delivered and the whole trajectory before naming respiratory failure.'); break; }
        if (response === 'recognize-acute-severe-asthma-respiratory-failure') {
          if (this.acuteSevereAsthmaFailureAtTick !== null) { this.log('warning', 'assessment', `acute-severe-asthma-failure-refused-${this.currentTick}`, 'The authored life-threatening deterioration and ventilatory failure were already recognized.'); break; }
          this.acuteSevereAsthmaFailureAtTick = this.currentTick;
          this.log('critical', 'assessment', `acute-severe-asthma-failure-recognized-${this.currentTick}`, 'Drowsiness, confusion, inability to speak, a quiet chest, weakening effort, and a fall in respiratory rate with exhaustion establish life-threatening deterioration. Fixed blood gas changed from pH 7.45, PaCO₂ 31 mm Hg, and PaO₂ 61 mm Hg at 10 minutes to pH 7.24, PaCO₂ 58 mm Hg, and PaO₂ 68 mm Hg at 75 minutes. In this authored trajectory, rising carbon dioxide and acidemia support hypercapnic ventilatory failure despite SpO₂ 93% on oxygen; no single gas value is treated as a universal airway threshold.', { respiratoryFailureAuthored: true, universalAirwayThresholdUsed: false, bloodGasAcquiredByLearner: false, peakFlowForced: false }); break;
        }
        if (this.acuteSevereAsthmaFailureAtTick === null) { this.log('warning', 'assessment', `acute-severe-asthma-failure-order-refused-${this.currentTick}`, 'Recognize the authored life-threatening respiratory failure before escalation or broader review.'); break; }
        if (response === 'activate-acute-severe-asthma-critical-care-escalation') {
          if (this.acuteSevereAsthmaEscalationAtTick !== null) { this.log('warning', 'assessment', `acute-severe-asthma-escalation-refused-${this.currentTick}`, 'Critical-care and experienced-airway escalation were already activated.'); break; }
          this.acuteSevereAsthmaEscalationAtTick = this.currentTick;
          this.log('critical', 'assessment', `acute-severe-asthma-escalation-activated-${this.currentTick}`, 'Immediate critical-care and experienced-airway help, continuous monitoring, urgent respiratory-support preparation, and deterioration contingencies were activated without waiting for complete cause review. No medication, oxygen change, device, noninvasive-support mode, airway procedure, sedation, neuromuscular blocker, ventilator setting, disposition, or outcome was selected or delivered.', { escalationActivated: true, treatmentDeliveredByLearner: false, airwayProcedurePerformedByLearner: false, ventilatorSettingSelected: false, dispositionDetermined: false, outcomePredicted: false }); break;
        }
        if (this.acuteSevereAsthmaEscalationAtTick === null) { this.log('warning', 'assessment', `acute-severe-asthma-escalation-order-refused-${this.currentTick}`, 'Activate critical-care and experienced-airway help before broadening the cause and ventilation-risk review.'); break; }
        if (response === 'review-acute-severe-asthma-alternatives-and-ventilation-risks') {
          if (this.acuteSevereAsthmaRisksAtTick !== null) { this.log('warning', 'assessment', `acute-severe-asthma-risks-refused-${this.currentTick}`, 'The fixed alternative-cause screen and ventilation-risk review were already completed.'); break; }
          this.acuteSevereAsthmaRisksAtTick = this.currentTick;
          this.log('warning', 'assessment', `acute-severe-asthma-risks-reviewed-${this.currentTick}`, 'A chest radiograph obtained because treatment response was poor reports hyperinflation without pneumothorax or focal opacity. No current stridor, urticaria, facial swelling, unilateral absent breath sounds, fever, or acute pulmonary-edema pattern is authored. These snapshots narrow but do not permanently exclude anaphylaxis, upper-airway disease, pneumothorax, infection, cardiac disease, pulmonary embolism, mucus plugging, treatment toxicity, or another contributor. Expert planning must account for airflow obstruction, air trapping, dynamic hyperinflation, hemodynamic compromise, and barotrauma without exposing a support device or ventilator recipe.', { imagingRoutine: false, alternativesPermanentlyExcluded: false, causeAssigned: false, imageAcquiredByLearner: false, supportDeviceSelected: false, ventilatorSettingSelected: false }); break;
        }
        if (this.acuteSevereAsthmaRisksAtTick === null) { this.log('warning', 'assessment', `acute-severe-asthma-handoff-order-refused-${this.currentTick}`, 'Review the open alternatives and ventilation risks before handing off active respiratory failure.'); break; }
        if (this.currentTick <= this.acuteSevereAsthmaRisksAtTick) { this.log('warning', 'assessment', `acute-severe-asthma-handoff-time-refused-${this.currentTick}`, 'Allow a later simulated tick before handing off the active respiratory-failure trajectory.'); break; }
        if (this.acuteSevereAsthmaHandoffAtTick !== null) { this.log('warning', 'assessment', `acute-severe-asthma-handoff-refused-${this.currentTick}`, 'The active respiratory-failure handoff was already recorded.'); break; }
        this.acuteSevereAsthmaHandoffAtTick = this.currentTick;
        this.log('warning', 'assessment', `acute-severe-asthma-handoff-recorded-${this.currentTick}`, 'Active hypercapnic respiratory failure was handed off with named respiratory, critical-care, and experienced-airway ownership; continuous surveillance; unresolved cause and treatment-toxicity questions; air-trapping and ventilation hazards; and explicit deterioration triggers. No subsequent treatment, airway procedure, support settings, physiologic response, disposition, prognosis, or outcome is reported.', { treatmentDeliveredByLearner: false, airwayProcedurePerformedByLearner: false, ventilatorSettingSelected: false, dispositionDetermined: false, outcomePredicted: false }); break;
      }
      case 'copd-exacerbation-transition-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'copd-exacerbation-transition-reassessment');
        const valid = ['reconcile-copd-exacerbation-recovery-and-readiness',
          'review-copd-exacerbation-residual-respiratory-and-oxygen-needs',
          'review-copd-exacerbation-maintenance-and-acute-medication-plan',
          'coordinate-copd-exacerbation-rehabilitation-self-management-and-follow-up',
          'handoff-copd-exacerbation-transition-reassessment'].includes(response);
        if (!supported || !valid) { this.log('warning', 'assessment', `copd-transition-response-refused-${this.currentTick}`, supported ? 'The COPD transition action was not one of the listed choices. Nothing changed.' : 'These COPD transition choices are available only in the declared Respiratory Medicine lesson.'); break; }
        if (response === 'reconcile-copd-exacerbation-recovery-and-readiness') {
          if (this.copdTransitionReadinessAtTick !== null) { this.log('warning', 'assessment', `copd-transition-readiness-refused-${this.currentTick}`, 'Recovery versus readiness was already reconciled.'); break; }
          this.copdTransitionReadinessAtTick = this.currentTick;
          this.log('warning', 'assessment', `copd-transition-readiness-reconciled-${this.currentTick}`, 'Verified hospital treatment and physiologic improvement were reconciled with persistent functional and oxygen uncertainty. Prior care was not learner-delivered, and improvement did not establish discharge readiness, recovery, or outcome.', { treatmentDeliveredByLearner: false, readinessDetermined: false }); break;
        }
        if (this.copdTransitionReadinessAtTick === null) { this.log('warning', 'assessment', `copd-transition-readiness-order-refused-${this.currentTick}`, 'Reconcile recovery versus readiness before reviewing residual needs.'); break; }
        if (response === 'review-copd-exacerbation-residual-respiratory-and-oxygen-needs') {
          if (this.copdTransitionRespiratoryNeedsAtTick !== null) { this.log('warning', 'assessment', `copd-transition-respiratory-refused-${this.currentTick}`, 'Residual respiratory and oxygen uncertainty was already reviewed.'); break; }
          this.copdTransitionRespiratoryNeedsAtTick = this.currentTick;
          this.log('warning', 'assessment', `copd-transition-respiratory-reviewed-${this.currentTick}`, 'Resting and corridor reports, recovery time, function, and serial arterial gases were reviewed together. The acute exertional desaturation report did not establish long-term oxygen eligibility or a prescription.', { testAcquiredByLearner: false, oxygenDeliveredByLearner: false, longTermOxygenEligibilityDetermined: false }); break;
        }
        if (this.copdTransitionRespiratoryNeedsAtTick === null) { this.log('warning', 'assessment', `copd-transition-respiratory-order-refused-${this.currentTick}`, 'Review residual respiratory and oxygen needs before the medication transition.'); break; }
        if (response === 'review-copd-exacerbation-maintenance-and-acute-medication-plan') {
          if (this.copdTransitionMedicationAtTick !== null) { this.log('warning', 'assessment', `copd-transition-medication-refused-${this.currentTick}`, 'The medication and technique-ownership review was already recorded.'); break; }
          this.copdTransitionMedicationAtTick = this.currentTick;
          this.log('warning', 'assessment', `copd-transition-medication-reviewed-${this.currentTick}`, 'Maintenance treatment, experienced respiratory-therapist technique correction, and acute-course end points received named review ownership. No inhaler class, device, drug, dose, duration, or technique grade was selected.', { medicationDeliveredByLearner: false, regimenSelected: false, techniquePerformedByLearner: false }); break;
        }
        if (this.copdTransitionMedicationAtTick === null) { this.log('warning', 'assessment', `copd-transition-medication-order-refused-${this.currentTick}`, 'Review medication and technique ownership before coordinating follow-up work.'); break; }
        if (response === 'coordinate-copd-exacerbation-rehabilitation-self-management-and-follow-up') {
          if (this.copdTransitionCoordinationAtTick !== null) { this.log('warning', 'assessment', `copd-transition-coordination-refused-${this.currentTick}`, 'Rehabilitation, teaching, comorbidity, and follow-up coordination was already recorded.'); break; }
          this.copdTransitionCoordinationAtTick = this.currentTick;
          this.log('warning', 'assessment', `copd-transition-coordination-recorded-${this.currentTick}`, 'Pulmonary-rehabilitation consideration, self-management teaching, comorbidity review, and early and later respiratory follow-up received named owners without guaranteeing access, enrollment, attendance, timing, or outcome.', { rehabilitationEnrolled: false, appointmentGuaranteed: false, outcomePredicted: false }); break;
        }
        if (this.copdTransitionCoordinationAtTick === null) { this.log('warning', 'assessment', `copd-transition-handoff-order-refused-${this.currentTick}`, 'Coordinate rehabilitation, teaching, comorbidity, and follow-up work before handoff.'); break; }
        if (this.currentTick <= this.copdTransitionCoordinationAtTick) { this.log('warning', 'assessment', `copd-transition-handoff-time-refused-${this.currentTick}`, 'Allow a later simulated tick before handing off unresolved transition work.'); break; }
        if (this.copdTransitionHandoffAtTick !== null) { this.log('warning', 'assessment', `copd-transition-handoff-refused-${this.currentTick}`, 'The COPD transition handoff was already recorded.'); break; }
        this.copdTransitionHandoffAtTick = this.currentTick;
        this.log('warning', 'assessment', `copd-transition-handoff-recorded-${this.currentTick}`, 'Residual respiratory and oxygen reassessment, functional recovery, maintenance and acute medication review, technique correction, rehabilitation, self-management, comorbidity review, and follow-up were handed off with named owners. No discharge readiness, disposition, prognosis, readmission risk, recovery, or outcome was determined.', { dispositionDetermined: false, readinessDetermined: false, outcomePredicted: false }); break;
      }
      case 'community-acquired-pneumonia-hypoxemia-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'community-acquired-pneumonia-hypoxemia-reassessment');
        const valid = ['corroborate-and-support-cap-hypoxemia',
          'reconcile-cap-evidence-and-dangerous-alternatives',
          'classify-cap-severity-and-escalation-needs',
          'record-cap-testing-and-empiric-treatment-intent',
          'handoff-cap-hypoxemia-reassessment'].includes(response);
        if (!supported || !valid) { this.log('warning', 'assessment', `cap-hypoxemia-response-refused-${this.currentTick}`, supported ? 'The pneumonia-hypoxemia action was not one of the listed choices. Nothing changed.' : 'These pneumonia-hypoxemia choices are available only in the declared Respiratory Medicine lesson.'); break; }
        if (response === 'corroborate-and-support-cap-hypoxemia') {
          if (this.capHypoxemiaSupportAtTick !== null) { this.log('warning', 'assessment', `cap-hypoxemia-support-refused-${this.currentTick}`, 'Hypoxemia and immediate support intent were already reconciled.'); break; }
          this.capHypoxemiaSupportAtTick = this.currentTick;
          this.log('critical', 'assessment', `cap-hypoxemia-support-recorded-${this.currentTick}`, 'Room-air SpO₂ 85% with a pulse-coherent pleth, PaO₂ 51 mmHg, RR 32/min, accessory-muscle use, short sentences, preserved mentation, and warm perfusion were reconciled. Immediate oxygen-support and experienced-help intent were recorded without waiting for pathogen certainty. No oxygen, device, flow, FiO₂, airway intervention, or treatment was selected or learner-delivered.', { hypoxemiaAuthored: true, oxygenDeliveredByLearner: false, supportDeviceSelected: false, treatmentDeliveredByLearner: false }); break;
        }
        if (this.capHypoxemiaSupportAtTick === null) { this.log('warning', 'assessment', `cap-hypoxemia-support-order-refused-${this.currentTick}`, 'Corroborate hypoxemia and record immediate support intent before the broader evidence review.'); break; }
        if (response === 'reconcile-cap-evidence-and-dangerous-alternatives') {
          if (this.capHypoxemiaEvidenceAtTick !== null) { this.log('warning', 'assessment', `cap-hypoxemia-evidence-refused-${this.currentTick}`, 'The pneumonia pattern and open alternatives were already reconciled.'); break; }
          this.capHypoxemiaEvidenceAtTick = this.currentTick;
          this.log('warning', 'assessment', `cap-hypoxemia-evidence-reconciled-${this.currentTick}`, 'Fever, productive cough, pleuritic discomfort, leukocytosis, and fixed right middle- and lower-lobe consolidation support the authored community-acquired pneumonia pattern. Viral and bacterial causes remain unresolved; pulmonary embolism, edema, aspiration, viral disease, an obstructing lesion, effusion, pneumothorax, and other infection remain open where the record does not exclude them. No test was acquired or diagnosis made by the learner.', { pneumoniaPatternAuthored: true, pathogenDetermined: false, testAcquiredByLearner: false, diagnosisMadeByLearner: false }); break;
        }
        if (this.capHypoxemiaEvidenceAtTick === null) { this.log('warning', 'assessment', `cap-hypoxemia-evidence-order-refused-${this.currentTick}`, 'Reconcile the pneumonia evidence and dangerous alternatives before classifying severity.'); break; }
        if (response === 'classify-cap-severity-and-escalation-needs') {
          if (this.capHypoxemiaSeverityAtTick !== null) { this.log('warning', 'assessment', `cap-hypoxemia-severity-refused-${this.currentTick}`, 'The whole-patient severity and escalation review was already recorded.'); break; }
          this.capHypoxemiaSeverityAtTick = this.currentTick;
          this.log('critical', 'assessment', `cap-hypoxemia-severity-reviewed-${this.currentTick}`, 'RR at least 30/min, PaO₂/FiO₂ no greater than 250, and multilobar infiltrates provide 3 authored ATS/IDSA minor severe-CAP features. No major criterion, shock, or invasive ventilation is present. Respiratory and critical-care evaluation was activated, while the criteria count remained one input to judgment rather than an automatic disposition rule.', { criteriaCountAuthored: 3, scoreCalculatedByLearner: false, higherAcuityReviewActivated: true, dispositionDetermined: false }); break;
        }
        if (this.capHypoxemiaSeverityAtTick === null) { this.log('warning', 'assessment', `cap-hypoxemia-severity-order-refused-${this.currentTick}`, 'Complete the whole-patient severity and escalation review before treatment and testing ownership.'); break; }
        if (response === 'record-cap-testing-and-empiric-treatment-intent') {
          if (this.capHypoxemiaTreatmentIntentAtTick !== null) { this.log('warning', 'assessment', `cap-hypoxemia-treatment-refused-${this.currentTick}`, 'Testing and empiric-treatment ownership were already recorded.'); break; }
          this.capHypoxemiaTreatmentIntentAtTick = this.currentTick;
          this.log('warning', 'assessment', `cap-hypoxemia-treatment-recorded-${this.currentTick}`, 'Guideline-bounded microbiology and prompt empiric-antimicrobial intent received named ownership. Local resistance data, allergy history, organ function, recent exposures, viral results, and patient-specific contraindications remain part of the treating team’s decision. No specimen, antimicrobial agent, combination, dose, route, duration, or resistant-pathogen regimen was selected or learner-delivered.', { testAcquiredByLearner: false, antimicrobialSelected: false, doseSelected: false, treatmentDeliveredByLearner: false }); break;
        }
        if (this.capHypoxemiaTreatmentIntentAtTick === null) { this.log('warning', 'assessment', `cap-hypoxemia-handoff-order-refused-${this.currentTick}`, 'Record testing and empiric-treatment ownership before handoff.'); break; }
        if (this.currentTick <= this.capHypoxemiaTreatmentIntentAtTick) { this.log('warning', 'assessment', `cap-hypoxemia-handoff-time-refused-${this.currentTick}`, 'Allow a later simulated tick before handing off active pneumonia care.'); break; }
        if (this.capHypoxemiaHandoffAtTick !== null) { this.log('warning', 'assessment', `cap-hypoxemia-handoff-refused-${this.currentTick}`, 'The pneumonia-hypoxemia handoff was already recorded.'); break; }
        this.capHypoxemiaHandoffAtTick = this.currentTick;
        this.log('warning', 'assessment', `cap-hypoxemia-handoff-recorded-${this.currentTick}`, 'The ongoing oxygen requirement, respiratory effort, authored severe-CAP features, open alternatives and complications, microbiology, empiric-treatment ownership, deterioration triggers, and higher-acuity review were handed off. No treatment response, ICU disposition, ARDS progression, pathogen, prognosis, or outcome was reported.', { oxygenDeliveredByLearner: false, antimicrobialSelected: false, dispositionDetermined: false, outcomePredicted: false }); break;
      }
      case 'post-pulmonary-embolism-persistent-dyspnea-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'post-pulmonary-embolism-persistent-dyspnea-reassessment');
        const valid = ['reconcile-post-pe-symptoms-and-anticoagulation-course',
          'review-post-pe-functional-limitation-and-current-safety',
          'review-post-pe-ctepd-evidence-and-alternatives',
          'activate-post-pe-pulmonary-vascular-referral',
          'handoff-post-pe-persistent-dyspnea-reassessment'].includes(response);
        if (!supported || !valid) { this.log('warning', 'assessment', `post-pe-dyspnea-response-refused-${this.currentTick}`, supported ? 'The post-PE dyspnea action was not one of the listed choices. Nothing changed.' : 'These post-PE dyspnea choices are available only in the declared Respiratory Medicine lesson.'); break; }
        if (response === 'reconcile-post-pe-symptoms-and-anticoagulation-course') {
          if (this.postPeDyspneaTrajectoryAtTick !== null) { this.log('warning', 'assessment', `post-pe-dyspnea-trajectory-refused-${this.currentTick}`, 'The post-acute course and symptom trajectory were already reconciled.'); break; }
          this.postPeDyspneaTrajectoryAtTick = this.currentTick;
          this.log('warning', 'assessment', `post-pe-dyspnea-trajectory-reconciled-${this.currentTick}`, 'The confirmed acute PE, 4 months of experienced-team therapeutic anticoagulation, prior 2-mile and 2-flight function, and current limitation at about 150 m or 1 flight were reconciled. The record does not grant prescribing or adherence-verification skill and does not prove PE resolution.', { acutePeConfirmedAuthored: true, anticoagulationDeliveredByLearner: false, adherenceVerifiedByLearner: false, resolutionEstablished: false }); break;
        }
        if (this.postPeDyspneaTrajectoryAtTick === null) { this.log('warning', 'assessment', `post-pe-dyspnea-trajectory-order-refused-${this.currentTick}`, 'Reconcile the post-acute course and symptom trajectory before reviewing current safety.'); break; }
        if (response === 'review-post-pe-functional-limitation-and-current-safety') {
          if (this.postPeDyspneaSafetyAtTick !== null) { this.log('warning', 'assessment', `post-pe-dyspnea-safety-refused-${this.currentTick}`, 'The functional limitation and current safety review was already recorded.'); break; }
          this.postPeDyspneaSafetyAtTick = this.currentTick;
          this.log('warning', 'assessment', `post-pe-dyspnea-safety-reviewed-${this.currentTick}`, 'Resting stability was reviewed beside the fixed 280 m walk, exertional SpO₂ change from 96% to 91%, HR change from 88 to 116/min, and limiting dyspnea. Current snapshots report no syncope, chest pain, hypotension, rest hypoxemia, hemoptysis, new unilateral swelling, or major bleeding, but do not permanently exclude recurrence or another cause.', { testAcquiredByLearner: false, recurrenceExcluded: false, bleedingRiskAdjudicated: false, oxygenDeliveredByLearner: false }); break;
        }
        if (this.postPeDyspneaSafetyAtTick === null) { this.log('warning', 'assessment', `post-pe-dyspnea-safety-order-refused-${this.currentTick}`, 'Review current safety and functional limitation before opening the CTEPD evidence lane.'); break; }
        if (response === 'review-post-pe-ctepd-evidence-and-alternatives') {
          if (this.postPeDyspneaEvidenceAtTick !== null) { this.log('warning', 'assessment', `post-pe-dyspnea-evidence-refused-${this.currentTick}`, 'The fixed CTEPD evidence and alternative-cause review was already completed.'); break; }
          this.postPeDyspneaEvidenceAtTick = this.currentTick;
          this.log('warning', 'assessment', `post-pe-dyspnea-evidence-reviewed-${this.currentTick}`, 'Fixed echo findings and multiple bilateral segmental mismatched perfusion defects raise CTEPD concern in this persistently symptomatic patient. They do not diagnose CTEPD or CTEPH; recurrent PE, left-heart disease, parenchymal lung disease, anemia, deconditioning, and other causes remain open pending qualified evaluation.', { testAcquiredByLearner: false, imagingInterpretedByLearner: false, ctepdDiagnosed: false, ctephDiagnosed: false, alternativesClosed: false }); break;
        }
        if (this.postPeDyspneaEvidenceAtTick === null) { this.log('warning', 'assessment', `post-pe-dyspnea-evidence-order-refused-${this.currentTick}`, 'Review the fixed evidence and alternative causes before activating the expert pathway.'); break; }
        if (response === 'activate-post-pe-pulmonary-vascular-referral') {
          if (this.postPeDyspneaReferralAtTick !== null) { this.log('warning', 'assessment', `post-pe-dyspnea-referral-refused-${this.currentTick}`, 'Pulmonary-vascular referral and anticoagulation ownership were already coordinated.'); break; }
          this.postPeDyspneaReferralAtTick = this.currentTick;
          this.log('warning', 'assessment', `post-pe-dyspnea-referral-activated-${this.currentTick}`, 'Pulmonary-vascular and CTEPD expert evaluation, result ownership, and continued anticoagulation ownership pending evaluation were coordinated. No anticoagulant, dose, duration, test, oxygen, rehabilitation, pulmonary-hypertension therapy, procedure, operability decision, or treatment was selected.', { referralActivated: true, anticoagulationDeliveredByLearner: false, agentSelected: false, doseSelected: false, durationSelected: false, treatmentSelected: false, procedurePerformedByLearner: false }); break;
        }
        if (this.postPeDyspneaReferralAtTick === null) { this.log('warning', 'assessment', `post-pe-dyspnea-handoff-order-refused-${this.currentTick}`, 'Coordinate expert evaluation and anticoagulation ownership before handoff.'); break; }
        if (this.currentTick <= this.postPeDyspneaReferralAtTick) { this.log('warning', 'assessment', `post-pe-dyspnea-handoff-time-refused-${this.currentTick}`, 'Allow a later simulated tick before handing off the unresolved post-PE evaluation.'); break; }
        if (this.postPeDyspneaHandoffAtTick !== null) { this.log('warning', 'assessment', `post-pe-dyspnea-handoff-refused-${this.currentTick}`, 'The post-PE persistent-dyspnea handoff was already recorded.'); break; }
        this.postPeDyspneaHandoffAtTick = this.currentTick;
        this.log('warning', 'assessment', `post-pe-dyspnea-handoff-recorded-${this.currentTick}`, 'Persistent symptom burden, functional limitation, fixed cardiac and perfusion evidence, anticoagulation and bleeding review, unresolved CTEPD question, alternative causes, urgent deterioration triggers, and pulmonary-vascular and longitudinal owners were handed off. No diagnosis, therapy, operability, disposition, prognosis, recovery, recurrence, or outcome was determined.', { ctepdDiagnosed: false, treatmentSelected: false, dispositionDetermined: false, recurrencePredicted: false, outcomePredicted: false }); break;
      }
      case 'acute-pulmonary-edema-respiratory-support-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'acute-pulmonary-edema-respiratory-support-reassessment');
        const valid = ['reconcile-ape-initial-care-and-trajectory',
          'review-ape-progressive-respiratory-failure',
          'review-ape-pressure-perfusion-congestion-and-causes',
          'activate-ape-airway-capable-escalation',
          'handoff-ape-respiratory-support-reassessment'].includes(response);
        if (!supported || !valid) { this.log('warning', 'assessment', `ape-support-response-refused-${this.currentTick}`, supported ? 'The pulmonary edema support action was not one of the listed choices. Nothing changed.' : 'These pulmonary edema support choices are available only in the declared Respiratory Medicine lesson.'); break; }
        if (response === 'reconcile-ape-initial-care-and-trajectory') {
          if (this.apeSupportTrajectoryAtTick !== null) { this.log('warning', 'assessment', `ape-support-trajectory-refused-${this.currentTick}`, 'The initial care and respiratory trajectory were already reconciled.'); break; }
          this.apeSupportTrajectoryAtTick = this.currentTick;
          this.log('critical', 'assessment', `ape-support-trajectory-reconciled-${this.currentTick}`, 'Arrival distress, reported experienced-team NIV with titrated oxygen and syndrome treatment, and the current worsening respiratory trajectory were reconciled. No examination, support, oxygen, medication, or treatment was learner-delivered.', { pulmonaryEdemaAuthored: true, supportAlreadyActiveAuthored: true, oxygenDeliveredByLearner: false, nivStartedByLearner: false, medicationDeliveredByLearner: false }); break;
        }
        if (this.apeSupportTrajectoryAtTick === null) { this.log('warning', 'assessment', `ape-support-trajectory-order-refused-${this.currentTick}`, 'Reconcile initial care and the serial trajectory before reviewing respiratory failure.'); break; }
        if (response === 'review-ape-progressive-respiratory-failure') {
          if (this.apeSupportFailureAtTick !== null) { this.log('warning', 'assessment', `ape-support-failure-refused-${this.currentTick}`, 'Progressive respiratory failure was already reviewed.'); break; }
          this.apeSupportFailureAtTick = this.currentTick;
          this.log('critical', 'assessment', `ape-support-failure-reviewed-${this.currentTick}`, 'Drowsiness, shallow effort, RR 12/min, SpO₂ 86% on reported support, pH 7.18, PaCO₂ 68 mmHg, and PaO₂ 58 mmHg show progressive respiratory failure despite NIV. The falling rate is fatigue, not improvement; no one value creates an automatic airway decision.', { testAcquiredByLearner: false, supportSettingSelected: false, airwayProcedurePerformedByLearner: false }); break;
        }
        if (this.apeSupportFailureAtTick === null) { this.log('warning', 'assessment', `ape-support-failure-order-refused-${this.currentTick}`, 'Review the progressive respiratory-failure evidence before the whole-patient lane.'); break; }
        if (response === 'review-ape-pressure-perfusion-congestion-and-causes') {
          if (this.apeSupportWholePatientAtTick !== null) { this.log('warning', 'assessment', `ape-support-whole-patient-refused-${this.currentTick}`, 'Pressure, perfusion, congestion, alternatives, and precipitants were already reviewed.'); break; }
          this.apeSupportWholePatientAtTick = this.currentTick;
          this.log('critical', 'assessment', `ape-support-whole-patient-reviewed-${this.currentTick}`, 'BP 108/68 mmHg, MAP 81 mmHg, a present pulse, central warmth, 2-second refill, and persistent congestion were reviewed beside open ischemic, rhythm, mechanical, infectious, embolic, treatment, renal, medication, and other causes. Shock, arrest, and dangerous alternatives remain change triggers rather than permanently excluded diagnoses.', { testAcquiredByLearner: false, causeAssigned: false, alternativesClosed: false, dispositionDetermined: false }); break;
        }
        if (this.apeSupportWholePatientAtTick === null) { this.log('warning', 'assessment', `ape-support-whole-patient-order-refused-${this.currentTick}`, 'Review pressure, perfusion, congestion, and open causes before activating escalation.'); break; }
        if (response === 'activate-ape-airway-capable-escalation') {
          if (this.apeSupportEscalationAtTick !== null) { this.log('warning', 'assessment', `ape-support-escalation-refused-${this.currentTick}`, 'Airway-capable escalation was already activated.'); break; }
          this.apeSupportEscalationAtTick = this.currentTick;
          this.log('critical', 'assessment', `ape-support-escalation-activated-${this.currentTick}`, 'Respiratory, critical-care, nursing, pharmacy, and airway-capable experienced help were activated for progressive failure despite noninvasive support. Rescue readiness and continued cause work received owners; no device, setting, drug, dose, airway procedure, or treatment was selected or delivered.', { escalationActivated: true, supportSettingSelected: false, drugSelected: false, doseSelected: false, airwayProcedurePerformedByLearner: false, treatmentDeliveredByLearner: false }); break;
        }
        if (this.apeSupportEscalationAtTick === null) { this.log('warning', 'assessment', `ape-support-handoff-order-refused-${this.currentTick}`, 'Activate airway-capable escalation before handoff.'); break; }
        if (this.currentTick <= this.apeSupportEscalationAtTick) { this.log('warning', 'assessment', `ape-support-handoff-time-refused-${this.currentTick}`, 'Allow a later simulated tick before handing off active respiratory failure.'); break; }
        if (this.apeSupportHandoffAtTick !== null) { this.log('warning', 'assessment', `ape-support-handoff-refused-${this.currentTick}`, 'The pulmonary edema support handoff was already recorded.'); break; }
        this.apeSupportHandoffAtTick = this.currentTick;
        this.log('critical', 'assessment', `ape-support-handoff-recorded-${this.currentTick}`, 'Active respiratory failure, reported NIV and oxygen context, current hemodynamics and perfusion, persistent congestion, open causes, deterioration triggers, rescue readiness, and named experienced owners were handed off. No later response, intubation, disposition, prognosis, resolution, or outcome was invented.', { airwayProcedurePerformedByLearner: false, treatmentDeliveredByLearner: false, dispositionDetermined: false, outcomePredicted: false }); break;
      }
      case 'spontaneous-tension-pneumothorax-post-drainage-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'spontaneous-tension-pneumothorax-post-drainage-reassessment');
        const valid = ['reconcile-spontaneous-tension-pneumothorax-trajectory-and-prior-care',
          'review-spontaneous-tension-pneumothorax-drainage-response',
          'review-spontaneous-tension-pneumothorax-drain-system-and-complications',
          'review-spontaneous-tension-pneumothorax-etiology-recurrence-and-definitive-planning',
          'handoff-spontaneous-tension-pneumothorax-post-drainage-reassessment'].includes(response);
        if (!supported || !valid) { this.log('warning', 'assessment', `post-tension-pneumothorax-response-refused-${this.currentTick}`, supported ? 'The post-drainage pneumothorax action was not one of the listed choices. Nothing changed.' : 'These post-drainage pneumothorax choices are available only in the declared Respiratory Medicine lesson.'); break; }
        if (response === 'reconcile-spontaneous-tension-pneumothorax-trajectory-and-prior-care') {
          if (this.postTensionPneumothoraxTrajectoryAtTick !== null) { this.log('warning', 'assessment', `post-tension-pneumothorax-trajectory-refused-${this.currentTick}`, 'The tension event, experienced-team drainage, and current trajectory were already reconciled.'); break; }
          this.postTensionPneumothoraxTrajectoryAtTick = this.currentTick;
          this.log('critical', 'assessment', `post-tension-pneumothorax-trajectory-reconciled-${this.currentTick}`, 'The spontaneous tension-pneumothorax presentation, experienced-team emergency treatment and right pleural-drain placement, and current improvement were reconciled. No diagnosis, examination, oxygen, drainage, procedure, or treatment was learner-performed.', { initialPulsePresent: true, priorTensionPhysiologyAuthored: true, experiencedTeamDrainageAuthored: true, decompressionPerformedByLearner: false, chestDrainPlacedByLearner: false, oxygenDeliveredByLearner: false, treatmentDeliveredByLearner: false }); break;
        }
        if (this.postTensionPneumothoraxTrajectoryAtTick === null) { this.log('warning', 'assessment', `post-tension-pneumothorax-trajectory-order-refused-${this.currentTick}`, 'Reconcile the tension event, prior drainage, and trajectory before reviewing the current response.'); break; }
        if (response === 'review-spontaneous-tension-pneumothorax-drainage-response') {
          if (this.postTensionPneumothoraxDrainageResponseAtTick !== null) { this.log('warning', 'assessment', `post-tension-pneumothorax-response-review-refused-${this.currentTick}`, 'The current safety and fixed drainage response were already reviewed.'); break; }
          this.postTensionPneumothoraxDrainageResponseAtTick = this.currentTick;
          this.log('critical', 'assessment', `post-tension-pneumothorax-drainage-response-reviewed-${this.currentTick}`, 'Improved symptoms, alert full-sentence speech, HR 96/min, RR 22/min, BP 108/64 mmHg, SpO₂ 93% on room air, warm perfusion, improved but reduced right air entry, and partial re-expansion on the fixed report were reviewed. These findings do not prove durable drain function, full re-expansion, or resolution.', { examinationPerformedByLearner: false, testAcquiredByLearner: false, imagingInterpretedByLearner: false, resolutionEstablished: false }); break;
        }
        if (this.postTensionPneumothoraxDrainageResponseAtTick === null) { this.log('warning', 'assessment', `post-tension-pneumothorax-drainage-response-order-refused-${this.currentTick}`, 'Review the current safety and fixed drainage response before opening the drain-system or planning lanes.'); break; }
        if (response === 'review-spontaneous-tension-pneumothorax-drain-system-and-complications') {
          if (this.postTensionPneumothoraxSystemAtTick !== null) { this.log('warning', 'assessment', `post-tension-pneumothorax-system-refused-${this.currentTick}`, 'The authored drain system, persistent air leak, complications, and change triggers were already reviewed.'); break; }
          this.postTensionPneumothoraxSystemAtTick = this.currentTick;
          this.log('warning', 'assessment', `post-tension-pneumothorax-system-reviewed-${this.currentTick}`, 'The fixed observation record reports bottle position, connection, respiratory swing, intermittent bubbling, and an intact site dressing. Persistent air leak, loss of patency, failure of re-expansion, enlarging subcutaneous emphysema, bleeding, infection, recurrent tension physiology, and other complications remain active review and escalation triggers.', { drainInspectedByLearner: false, drainManipulatedByLearner: false, suctionOrClampSelected: false, deviceOrSiteSelected: false, procedurePerformedByLearner: false }); break;
        }
        if (response === 'review-spontaneous-tension-pneumothorax-etiology-recurrence-and-definitive-planning') {
          if (this.postTensionPneumothoraxEtiologyAtTick !== null) { this.log('warning', 'assessment', `post-tension-pneumothorax-etiology-refused-${this.currentTick}`, 'Cause, recurrence-prevention priorities, preferences, and definitive planning were already reviewed.'); break; }
          this.postTensionPneumothoraxEtiologyAtTick = this.currentTick;
          this.log('warning', 'assessment', `post-tension-pneumothorax-etiology-reviewed-${this.currentTick}`, 'Emphysema is relevant authored context, while other secondary causes and the full individualized evaluation remain open. Recurrence prevention matters after a tension presentation, so patient priorities and pleural and thoracic ownership were recorded without selecting aspiration, pleurodesis, thoracoscopy, surgery, another intervention, or an outcome.', { causeAssigned: false, recurrencePredicted: false, treatmentSelected: false, procedurePerformedByLearner: false }); break;
        }
        if (this.postTensionPneumothoraxSystemAtTick === null
          || this.postTensionPneumothoraxEtiologyAtTick === null) { this.log('warning', 'assessment', `post-tension-pneumothorax-handoff-order-refused-${this.currentTick}`, 'Complete both the drain-system and definitive-planning lanes before handoff.'); break; }
        if (this.currentTick <= Math.max(this.postTensionPneumothoraxSystemAtTick,
          this.postTensionPneumothoraxEtiologyAtTick)) { this.log('warning', 'assessment', `post-tension-pneumothorax-handoff-time-refused-${this.currentTick}`, 'Allow a later simulated tick before handing off the unresolved pleural work.'); break; }
        if (this.postTensionPneumothoraxHandoffAtTick !== null) { this.log('warning', 'assessment', `post-tension-pneumothorax-handoff-refused-${this.currentTick}`, 'The post-drainage pneumothorax handoff was already recorded.'); break; }
        this.postTensionPneumothoraxHandoffAtTick = this.currentTick;
        this.log('warning', 'assessment', `post-tension-pneumothorax-handoff-recorded-${this.currentTick}`, 'The prior spontaneous tension event, experienced-team drainage, current safety, fixed drain and imaging reports, persistent-air-leak and complication questions, recurrence-prevention priorities, deterioration triggers, patient preferences, and pleural and thoracic owners were handed off. No drain action, procedure, treatment, disposition, prognosis, recurrence, resolution, or outcome was determined.', { drainManipulatedByLearner: false, procedurePerformedByLearner: false, treatmentDeliveredByLearner: false, dispositionDetermined: false, recurrencePredicted: false, outcomePredicted: false }); break;
      }
      case 'large-unilateral-pleural-effusion-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'large-unilateral-pleural-effusion-reassessment');
        const valid = ['reconcile-large-unilateral-pleural-effusion-trajectory',
          'record-large-unilateral-pleural-effusion-pleural-team-and-drainage-intent',
          'review-large-unilateral-pleural-effusion-drainage-response',
          'review-large-unilateral-pleural-effusion-fluid-pattern-and-causes',
          'coordinate-large-unilateral-pleural-effusion-definitive-evaluation',
          'handoff-large-unilateral-pleural-effusion-reassessment'].includes(response);
        if (!supported || !valid) { this.log('warning', 'assessment', `large-pleural-effusion-response-refused-${this.currentTick}`, supported ? 'The large-effusion action was not one of the listed choices. Nothing changed.' : 'These large-effusion choices are available only in the declared Respiratory Medicine lesson.'); break; }
        if (response === 'reconcile-large-unilateral-pleural-effusion-trajectory') {
          if (this.largePleuralEffusionTrajectoryAtTick !== null) { this.log('warning', 'assessment', `large-pleural-effusion-trajectory-refused-${this.currentTick}`, 'The symptom, safety, unilateral, and imaging trajectory was already reconciled.'); break; }
          this.largePleuralEffusionTrajectoryAtTick = this.currentTick;
          this.log('warning', 'assessment', `large-pleural-effusion-trajectory-reconciled-${this.currentTick}`, 'Six weeks of progressive limitation, current mild hypoxemia with stable perfusion, unilateral examination claims, and fixed radiograph and ultrasound reports were reconciled. Size supports a substantial effusion but does not alone determine urgency, safety, cause, or procedure.', { initialPulsePresent: true, largeUnilateralEffusionAuthored: true, tensionPhysiologyAuthored: false, hemodynamicCompromiseAuthored: false, examinationPerformedByLearner: false, imagingAcquiredByLearner: false }); break;
        }
        if (this.largePleuralEffusionTrajectoryAtTick === null) { this.log('warning', 'assessment', `large-pleural-effusion-trajectory-order-refused-${this.currentTick}`, 'Reconcile the whole-patient and fixed imaging trajectory before recording pleural-team intent.'); break; }
        if (response === 'record-large-unilateral-pleural-effusion-pleural-team-and-drainage-intent') {
          if (this.largePleuralEffusionIntentAtTick !== null) { this.log('warning', 'assessment', `large-pleural-effusion-intent-refused-${this.currentTick}`, 'Pleural-team, diagnostic-sampling, and symptom-relief aspiration intent was already recorded.'); break; }
          this.largePleuralEffusionIntentAtTick = this.currentTick;
          this.log('warning', 'assessment', `large-pleural-effusion-intent-recorded-${this.currentTick}`, 'Experienced pleural-team review, image guidance in the procedure position, diagnostic sampling, and slow symptom-limited aspiration intent were recorded. Chest tightness, pain, persistent cough, worsening breathlessness, or concerning oxygenation change are stop and reassessment triggers; no site, device, technique, suction, rate, or target volume was selected.', { ultrasoundPerformedByLearner: false, thoracentesisPerformedByLearner: false, deviceOrSiteSelected: false, drainageVolumeSelected: false, treatmentDeliveredByLearner: false }); break;
        }
        if (this.largePleuralEffusionIntentAtTick === null) { this.log('warning', 'assessment', `large-pleural-effusion-intent-order-refused-${this.currentTick}`, 'Record qualified image-guided and symptom-limited aspiration intent before reviewing the authored checkpoint.'); break; }
        if (response === 'review-large-unilateral-pleural-effusion-drainage-response') {
          if (this.currentTick <= this.largePleuralEffusionIntentAtTick) { this.log('warning', 'assessment', `large-pleural-effusion-response-time-refused-${this.currentTick}`, 'Allow a later simulated tick before reviewing the authored aspiration checkpoint.'); break; }
          if (this.largePleuralEffusionResponseAtTick !== null) { this.log('warning', 'assessment', `large-pleural-effusion-response-review-refused-${this.currentTick}`, 'The authored symptom-limited aspiration response was already reviewed.'); break; }
          this.largePleuralEffusionResponseAtTick = this.currentTick;
          this.log('warning', 'assessment', `large-pleural-effusion-drainage-response-reviewed-${this.currentTick}`, 'The experienced team reports 850 mL removed slowly before persistent cough and mild chest tightness prompted stopping. The volume is a case fact, not a target or maximum. Symptoms, respiratory rate, oxygenation, and expansion improved, while residual effusion and cause remain unresolved.', { thoracentesisPerformedByLearner: false, drainageVolumeSelected: false, treatmentDeliveredByLearner: false, completeDrainageEstablished: false, durableResponseEstablished: false }); break;
        }
        if (this.largePleuralEffusionResponseAtTick === null) { this.log('warning', 'assessment', `large-pleural-effusion-response-order-refused-${this.currentTick}`, 'Review the authored symptom-limited response before the fluid and definitive-evaluation work.'); break; }
        if (response === 'review-large-unilateral-pleural-effusion-fluid-pattern-and-causes') {
          if (this.largePleuralEffusionFluidAtTick !== null) { this.log('warning', 'assessment', `large-pleural-effusion-fluid-refused-${this.currentTick}`, 'The fixed paired-fluid classification and open causes were already reviewed.'); break; }
          this.largePleuralEffusionFluidAtTick = this.currentTick;
          this.log('warning', 'assessment', `large-pleural-effusion-fluid-reviewed-${this.currentTick}`, 'The experienced laboratory and pleural team classify the fixed paired sample as exudative; the learner does not acquire, calculate, or interpret it. Cytology, microbiology, and selected studies remain pending, and malignancy, infection, tuberculosis, embolic, autoimmune, and other causes remain open.', { pleuralFluidAcquiredByLearner: false, fluidInterpretedByLearner: false, criteriaCalculatedByLearner: false, etiologyDetermined: false, malignancyDetermined: false }); break;
        }
        if (this.largePleuralEffusionFluidAtTick === null) { this.log('warning', 'assessment', `large-pleural-effusion-fluid-order-refused-${this.currentTick}`, 'Review the fixed paired-fluid pattern and open causes before coordinating definitive evaluation.'); break; }
        if (response === 'coordinate-large-unilateral-pleural-effusion-definitive-evaluation') {
          if (this.largePleuralEffusionEvaluationAtTick !== null) { this.log('warning', 'assessment', `large-pleural-effusion-evaluation-refused-${this.currentTick}`, 'Pending-result and definitive pleural-evaluation ownership was already coordinated.'); break; }
          this.largePleuralEffusionEvaluationAtTick = this.currentTick;
          this.log('warning', 'assessment', `large-pleural-effusion-evaluation-coordinated-${this.currentTick}`, 'Cytology, microbiology, cause-directed results, residual-effusion and symptom review, and individualized pleural evaluation received named owners. No biopsy, bronchoscopy, indwelling catheter, pleurodesis, thoracoscopy, surgery, systemic therapy, or cause-specific treatment was selected.', { procedureSelected: false, treatmentSelected: false, diagnosisDetermined: false, dispositionDetermined: false }); break;
        }
        if (this.largePleuralEffusionEvaluationAtTick === null) { this.log('warning', 'assessment', `large-pleural-effusion-handoff-order-refused-${this.currentTick}`, 'Coordinate definitive evaluation and pending-result ownership before handoff.'); break; }
        if (this.currentTick <= this.largePleuralEffusionEvaluationAtTick) { this.log('warning', 'assessment', `large-pleural-effusion-handoff-time-refused-${this.currentTick}`, 'Allow a later simulated tick before handing off the unresolved pleural work.'); break; }
        if (this.largePleuralEffusionHandoffAtTick !== null) { this.log('warning', 'assessment', `large-pleural-effusion-handoff-refused-${this.currentTick}`, 'The large-effusion handoff was already recorded.'); break; }
        this.largePleuralEffusionHandoffAtTick = this.currentTick;
        this.log('warning', 'assessment', `large-pleural-effusion-handoff-recorded-${this.currentTick}`, 'The original breathing and imaging pattern, symptom-limited aspiration report, residual effusion, fixed fluid classification, open causes, pending results, complications, recurrence questions, deterioration triggers, and named pleural and longitudinal owners were handed off. No diagnosis, procedure, treatment, disposition, prognosis, recurrence, or outcome was determined.', { diagnosisDetermined: false, procedurePerformedByLearner: false, treatmentDeliveredByLearner: false, dispositionDetermined: false, recurrencePredicted: false, outcomePredicted: false }); break;
      }
      case 'bronchiectasis-mucus-plugging-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'bronchiectasis-mucus-plugging-reassessment');
        const valid = ['reconcile-bronchiectasis-mucus-plugging-trajectory',
          'review-bronchiectasis-mucus-plugging-evidence-and-alternatives',
          'record-bronchiectasis-mucus-plugging-supported-airway-clearance-intent',
          'review-bronchiectasis-mucus-plugging-later-response',
          'escalate-bronchiectasis-mucus-plugging-persistent-collapse',
          'handoff-bronchiectasis-mucus-plugging-reassessment'].includes(response);
        if (!supported || !valid) { this.log('warning', 'assessment', `bronchiectasis-mucus-response-refused-${this.currentTick}`, supported ? 'The bronchiectasis mucus action was not one of the listed choices. Nothing changed.' : 'These bronchiectasis mucus choices are available only in the declared Respiratory Medicine lesson.'); break; }
        if (response === 'reconcile-bronchiectasis-mucus-plugging-trajectory') {
          if (this.bronchiectasisMucusTrajectoryAtTick !== null) { this.log('warning', 'assessment', `bronchiectasis-mucus-trajectory-refused-${this.currentTick}`, 'The baseline, breathing, perfusion, cough, secretion, and focal trajectory was already reconciled.'); break; }
          this.bronchiectasisMucusTrajectoryAtTick = this.currentTick;
          this.log('warning', 'assessment', `bronchiectasis-mucus-trajectory-reconciled-${this.currentTick}`, 'The documented baseline was reconciled with 2 days of worsening secretion clearance, current hypoxemia and work, stable perfusion, ineffective cough, and focal examination claims. No examination, cough test, sputum assessment, diagnosis, or treatment occurred.', { initialPulsePresent: true, spontaneouslyBreathingAuthored: true, artificialAirwayPresent: false, examinationPerformedByLearner: false, sputumAssessedByLearner: false }); break;
        }
        if (this.bronchiectasisMucusTrajectoryAtTick === null) { this.log('warning', 'assessment', `bronchiectasis-mucus-trajectory-order-refused-${this.currentTick}`, 'Reconcile the whole-patient secretion-clearance trajectory before reviewing the fixed imaging pattern.'); break; }
        if (response === 'review-bronchiectasis-mucus-plugging-evidence-and-alternatives') {
          if (this.bronchiectasisMucusEvidenceAtTick !== null) { this.log('warning', 'assessment', `bronchiectasis-mucus-evidence-refused-${this.currentTick}`, 'The fixed imaging pattern and alternatives were already reviewed.'); break; }
          this.bronchiectasisMucusEvidenceAtTick = this.currentTick;
          this.log('warning', 'assessment', `bronchiectasis-mucus-evidence-reviewed-${this.currentTick}`, 'The fixed radiograph and CT reports support focal left-lower-lobe collapse with a mucus-impaction working pattern. Infection, blood, aspiration, foreign body, occult obstruction, compression, and other causes remain open; no image was acquired or interpreted and no cause was diagnosed.', { focalCollapseAuthored: true, mucusImpactionWorkingPatternAuthored: true, mucusPlugEtiologyProven: false, imagingAcquiredByLearner: false, diagnosisDetermined: false }); break;
        }
        if (this.bronchiectasisMucusEvidenceAtTick === null) { this.log('warning', 'assessment', `bronchiectasis-mucus-evidence-order-refused-${this.currentTick}`, 'Review the fixed focal imaging pattern and alternatives before recording airway-clearance intent.'); break; }
        if (response === 'record-bronchiectasis-mucus-plugging-supported-airway-clearance-intent') {
          if (this.bronchiectasisMucusClearanceIntentAtTick !== null) { this.log('warning', 'assessment', `bronchiectasis-mucus-clearance-refused-${this.currentTick}`, 'The supported individualized airway-clearance intent was already recorded.'); break; }
          this.bronchiectasisMucusClearanceIntentAtTick = this.currentTick;
          this.log('warning', 'assessment', `bronchiectasis-mucus-clearance-intent-recorded-${this.currentTick}`, 'Experienced respiratory-physiotherapy review and a supported individualized airway-clearance trial were recorded with patient preference, tolerance, monitoring, and an expected response. No technique, device, position, pressure, duration, frequency, oxygen setting, drug, suction, or treatment was selected or delivered.', { airwayClearancePerformedByLearner: false, deviceOrTechniqueSelected: false, oxygenDeliveredByLearner: false, treatmentDeliveredByLearner: false }); break;
        }
        if (this.bronchiectasisMucusClearanceIntentAtTick === null) { this.log('warning', 'assessment', `bronchiectasis-mucus-clearance-order-refused-${this.currentTick}`, 'Record qualified individualized airway-clearance intent before reviewing the authored response.'); break; }
        if (response === 'review-bronchiectasis-mucus-plugging-later-response') {
          if (this.currentTick <= this.bronchiectasisMucusClearanceIntentAtTick) { this.log('warning', 'assessment', `bronchiectasis-mucus-response-time-refused-${this.currentTick}`, 'Allow a later simulated tick before reviewing the authored airway-clearance response.'); break; }
          if (this.bronchiectasisMucusResponseAtTick !== null) { this.log('warning', 'assessment', `bronchiectasis-mucus-response-review-refused-${this.currentTick}`, 'The authored airway-clearance response was already reviewed.'); break; }
          this.bronchiectasisMucusResponseAtTick = this.currentTick;
          this.log('warning', 'assessment', `bronchiectasis-mucus-later-response-reviewed-${this.currentTick}`, 'Team-delivered care produced expectorated secretions, stronger cough, easier speech, lower work, and improved oxygenation, while focal air entry and radiographic volume loss remain abnormal. Improvement does not prove complete clearance, re-expansion, cause, durable response, recurrence risk, or outcome.', { airwayClearancePerformedByLearner: false, secretionRemovedByLearner: false, completeClearanceEstablished: false, completeReexpansionEstablished: false, outcomePredicted: false }); break;
        }
        if (this.bronchiectasisMucusResponseAtTick === null) { this.log('warning', 'assessment', `bronchiectasis-mucus-response-order-refused-${this.currentTick}`, 'Review the authored later response before escalating the residual focal disease.'); break; }
        if (response === 'escalate-bronchiectasis-mucus-plugging-persistent-collapse') {
          if (this.bronchiectasisMucusEscalationAtTick !== null) { this.log('warning', 'assessment', `bronchiectasis-mucus-escalation-refused-${this.currentTick}`, 'Persistent focal-collapse and cause evaluation was already escalated.'); break; }
          this.bronchiectasisMucusEscalationAtTick = this.currentTick;
          this.log('warning', 'assessment', `bronchiectasis-mucus-escalation-recorded-${this.currentTick}`, 'Residual focal collapse, incomplete clearance, and unresolved cause received experienced respiratory and airway-capable owners. Bronchoscopy was not made routine or selected; no suction, procedure, biopsy, surgery, treatment, disposition, or diagnosis was chosen.', { suctionPerformedByLearner: false, bronchoscopyPerformedByLearner: false, procedureSelected: false, treatmentDeliveredByLearner: false, diagnosisDetermined: false, dispositionDetermined: false }); break;
        }
        if (this.bronchiectasisMucusEscalationAtTick === null) { this.log('warning', 'assessment', `bronchiectasis-mucus-handoff-order-refused-${this.currentTick}`, 'Escalate residual focal collapse and unresolved cause before handoff.'); break; }
        if (this.currentTick <= this.bronchiectasisMucusEscalationAtTick) { this.log('warning', 'assessment', `bronchiectasis-mucus-handoff-time-refused-${this.currentTick}`, 'Allow a later simulated tick before handing off the unresolved respiratory work.'); break; }
        if (this.bronchiectasisMucusHandoffAtTick !== null) { this.log('warning', 'assessment', `bronchiectasis-mucus-handoff-refused-${this.currentTick}`, 'The bronchiectasis mucus handoff was already recorded.'); break; }
        this.bronchiectasisMucusHandoffAtTick = this.currentTick;
        this.log('warning', 'assessment', `bronchiectasis-mucus-handoff-recorded-${this.currentTick}`, 'The baseline and acute trajectory, fixed imaging, partial response, residual collapse, open causes, deterioration triggers, pending work, and named respiratory and airway-capable owners were handed off. No diagnosis, procedure, treatment, disposition, prognosis, resolution, recurrence, or outcome was determined.', { diagnosisDetermined: false, procedurePerformedByLearner: false, treatmentDeliveredByLearner: false, dispositionDetermined: false, outcomePredicted: false }); break;
      }
      case 'chronic-opioid-related-hypoventilation-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'chronic-opioid-related-hypoventilation-reassessment');
        const valid = ['reconcile-chronic-opioid-related-hypoventilation-exposure-and-trajectory',
          'review-chronic-opioid-related-hypoventilation-awake-and-sleep-evidence',
          'review-chronic-opioid-related-hypoventilation-contributors-and-alternatives',
          'coordinate-chronic-opioid-related-hypoventilation-prescriber-sleep-and-respiratory-plan',
          'handoff-chronic-opioid-related-hypoventilation-reassessment'].includes(response);
        if (!supported || !valid) { this.log('warning', 'assessment', `chronic-opioid-hypoventilation-response-refused-${this.currentTick}`, supported ? 'The chronic opioid hypoventilation action was not one of the listed choices. Nothing changed.' : 'These chronic opioid hypoventilation choices are available only in the declared Respiratory Medicine lesson.'); break; }
        if (response === 'reconcile-chronic-opioid-related-hypoventilation-exposure-and-trajectory') {
          if (this.chronicOpioidHypoventilationTrajectoryAtTick !== null) { this.log('warning', 'assessment', `chronic-opioid-hypoventilation-trajectory-refused-${this.currentTick}`, 'The exposure, sleep, daytime-function, breathing, oxygenation, and perfusion trajectory was already reconciled.'); break; }
          this.chronicOpioidHypoventilationTrajectoryAtTick = this.currentTick;
          this.log('warning', 'assessment', `chronic-opioid-hypoventilation-trajectory-reconciled-${this.currentTick}`, 'The chronic prescribed-opioid exposure, 6-month sleep and daytime-function change, quiet awake breathing, oxygenation, and stable perfusion were reconciled without creating an acute overdose or proving opioid-only causality.', { initialPulsePresent: true, chronicOpioidExposureAuthored: true, spontaneouslyBreathingAuthored: true, acuteOpioidOverdoseAuthored: false, postoperativeRecoveryAuthored: false, opioidCausalityProven: false, examinationPerformedByLearner: false }); break;
        }
        if (this.chronicOpioidHypoventilationTrajectoryAtTick === null) { this.log('warning', 'assessment', `chronic-opioid-hypoventilation-trajectory-order-refused-${this.currentTick}`, 'Reconcile the longitudinal exposure and whole-patient trajectory before reviewing the fixed evidence or open contributors.'); break; }
        if (response === 'review-chronic-opioid-related-hypoventilation-awake-and-sleep-evidence') {
          if (this.chronicOpioidHypoventilationEvidenceAtTick !== null) { this.log('warning', 'assessment', `chronic-opioid-hypoventilation-evidence-refused-${this.currentTick}`, 'The fixed awake and attended sleep evidence was already reviewed.'); break; }
          this.chronicOpioidHypoventilationEvidenceAtTick = this.currentTick;
          this.log('warning', 'assessment', `chronic-opioid-hypoventilation-evidence-reviewed-${this.currentTick}`, 'The authored awake gas and specialist-reported attended polysomnogram with carbon-dioxide monitoring were reviewed. Sustained sleep-related hypoventilation was not excluded by one awake SpO₂; no test was acquired, scored, or interpreted and no diagnosis was made.', { sleepRelatedHypoventilationPatternAuthored: true, bloodGasAcquiredByLearner: false, sleepStudyAcquiredByLearner: false, sleepStudyInterpretedByLearner: false, diagnosisDetermined: false }); break;
        }
        if (response === 'review-chronic-opioid-related-hypoventilation-contributors-and-alternatives') {
          if (this.chronicOpioidHypoventilationAlternativesAtTick !== null) { this.log('warning', 'assessment', `chronic-opioid-hypoventilation-alternatives-refused-${this.currentTick}`, 'The medication, sleep, pulmonary, neurologic, chest-wall, cardiac, endocrine, and other contributors were already reviewed.'); break; }
          this.chronicOpioidHypoventilationAlternativesAtTick = this.currentTick;
          this.log('warning', 'assessment', `chronic-opioid-hypoventilation-alternatives-reviewed-${this.currentTick}`, 'Medication and substance co-exposures, obstructive and central events, pulmonary, neurologic, chest-wall, cardiac, endocrine, and other contributors stayed open. Chronic opioid exposure remained important without proving a single cause.', { opioidCausalityProven: false, medicationChangedByLearner: false, diagnosisDetermined: false }); break;
        }
        if (response === 'coordinate-chronic-opioid-related-hypoventilation-prescriber-sleep-and-respiratory-plan') {
          if (this.chronicOpioidHypoventilationEvidenceAtTick === null || this.chronicOpioidHypoventilationAlternativesAtTick === null) { this.log('warning', 'assessment', `chronic-opioid-hypoventilation-plan-order-refused-${this.currentTick}`, 'Review both the fixed awake-and-sleep evidence and the open contributors before coordinating shared ownership.'); break; }
          if (this.chronicOpioidHypoventilationPlanAtTick !== null) { this.log('warning', 'assessment', `chronic-opioid-hypoventilation-plan-refused-${this.currentTick}`, 'The prescriber, sleep, respiratory, pharmacy, and primary-care plan was already coordinated.'); break; }
          this.chronicOpioidHypoventilationPlanAtTick = this.currentTick;
          this.log('warning', 'assessment', `chronic-opioid-hypoventilation-plan-coordinated-${this.currentTick}`, 'Prescriber, sleep, respiratory, pharmacy, and primary-care ownership was connected around pain goals, medication safety, education, diagnostic work, and reassessment. No drug, dose, morphine-equivalent threshold, taper, naloxone intervention, oxygen, positive-pressure mode or setting, or treatment was selected or delivered.', { drugOrDoseSelected: false, taperSelected: false, opioidChangedByLearner: false, naloxoneSelectedByLearner: false, naloxoneDeliveredByLearner: false, supportDeviceSelectedByLearner: false, treatmentDeliveredByLearner: false }); break;
        }
        if (this.chronicOpioidHypoventilationPlanAtTick === null) { this.log('warning', 'assessment', `chronic-opioid-hypoventilation-handoff-order-refused-${this.currentTick}`, 'Coordinate shared prescriber, sleep, respiratory, pharmacy, and primary-care ownership before handoff.'); break; }
        if (this.currentTick <= this.chronicOpioidHypoventilationPlanAtTick) { this.log('warning', 'assessment', `chronic-opioid-hypoventilation-handoff-time-refused-${this.currentTick}`, 'Allow a later simulated tick before handing off the unresolved longitudinal work.'); break; }
        if (this.chronicOpioidHypoventilationHandoffAtTick !== null) { this.log('warning', 'assessment', `chronic-opioid-hypoventilation-handoff-refused-${this.currentTick}`, 'The chronic opioid hypoventilation handoff was already recorded.'); break; }
        this.chronicOpioidHypoventilationHandoffAtTick = this.currentTick;
        this.log('warning', 'assessment', `chronic-opioid-hypoventilation-handoff-recorded-${this.currentTick}`, 'The fixed awake and sleep evidence, open contributors, safety concerns, pain goals, diagnostic and reassessment work, and named prescriber, sleep, respiratory, pharmacy, and primary-care owners were handed off. No diagnosis, medication change, support selection, treatment, disposition, prognosis, response, or outcome was determined.', { diagnosisDetermined: false, opioidChangedByLearner: false, treatmentDeliveredByLearner: false, dispositionDetermined: false, outcomePredicted: false }); break;
      }
      case 'neuromuscular-respiratory-failure-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'neuromuscular-respiratory-failure-reassessment');
        const valid = ['reconcile-neuromuscular-respiratory-failure-trajectory',
          'recognize-neuromuscular-respiratory-failure',
          'activate-neuromuscular-respiratory-failure-escalation',
          'review-neuromuscular-respiratory-failure-bulbar-cough-and-alternatives',
          'coordinate-neuromuscular-respiratory-failure-goals-and-ownership',
          'handoff-neuromuscular-respiratory-failure-reassessment'].includes(response);
        if (!supported || !valid) { this.log('warning', 'assessment', `neuromuscular-respiratory-failure-response-refused-${this.currentTick}`, supported ? 'The neuromuscular respiratory-failure action was not one of the listed choices. Nothing changed.' : 'These neuromuscular respiratory-failure choices are available only in the declared Respiratory Medicine lesson.'); break; }
        if (response === 'reconcile-neuromuscular-respiratory-failure-trajectory') {
          if (this.neuromuscularRespiratoryFailureTrajectoryAtTick !== null) { this.log('warning', 'assessment', `neuromuscular-respiratory-failure-trajectory-refused-${this.currentTick}`, 'The functional, symptom, breathing, cough, bulbar, gas-exchange, and perfusion trajectory was already reconciled.'); break; }
          this.neuromuscularRespiratoryFailureTrajectoryAtTick = this.currentTick;
          this.log('warning', 'assessment', `neuromuscular-respiratory-failure-trajectory-reconciled-${this.currentTick}`, 'The 3-month functional and cough decline, 2-week respiratory symptom progression, current shallow breathing, mild bulbar claims, preserved awake saturation, and stable perfusion were reconciled. No examination, respiratory test, cough test, diagnosis, or treatment occurred.', { initialPulsePresent: true, spontaneousBreathingAuthored: true, establishedMotorNeuronDiseaseAuthored: true, examinationPerformedByLearner: false, respiratoryStrengthMeasuredByLearner: false }); break;
        }
        if (this.neuromuscularRespiratoryFailureTrajectoryAtTick === null) { this.log('warning', 'assessment', `neuromuscular-respiratory-failure-trajectory-order-refused-${this.currentTick}`, 'Reconcile the serial whole-patient trajectory before recognizing the authored ventilatory-failure pattern.'); break; }
        if (response === 'recognize-neuromuscular-respiratory-failure') {
          if (this.neuromuscularRespiratoryFailureRecognitionAtTick !== null) { this.log('warning', 'assessment', `neuromuscular-respiratory-failure-recognition-refused-${this.currentTick}`, 'The progressive neuromuscular ventilatory-failure pattern was already recognized.'); break; }
          this.neuromuscularRespiratoryFailureRecognitionAtTick = this.currentTick;
          this.log('warning', 'assessment', `neuromuscular-respiratory-failure-recognized-${this.currentTick}`, 'Orthopnea, sleep and daytime symptoms, shallow breathing, supine paradox, hypercapnia, weak cough, and convergent serial FVC, SNIP, and peak-cough-flow decline established the authored progressive neuromuscular ventilatory-failure pattern. No isolated oxygen or mechanics threshold, learner interpretation, or new diagnosis was used.', { neuromuscularRespiratoryFailureAuthored: true, respiratoryMeasurementsAuthored: true, daytimeHypercapniaAuthored: true, bloodGasAcquiredByLearner: false, testInterpretedByLearner: false, diagnosisDetermined: false }); break;
        }
        if (this.neuromuscularRespiratoryFailureRecognitionAtTick === null) { this.log('warning', 'assessment', `neuromuscular-respiratory-failure-recognition-order-refused-${this.currentTick}`, 'Recognize the convergent ventilatory-failure pattern before escalation or the parallel safety review.'); break; }
        if (response === 'activate-neuromuscular-respiratory-failure-escalation') {
          if (this.neuromuscularRespiratoryFailureEscalationAtTick !== null) { this.log('warning', 'assessment', `neuromuscular-respiratory-failure-escalation-refused-${this.currentTick}`, 'Experienced respiratory-ventilation, critical-care, and airway-capable evaluation was already activated.'); break; }
          this.neuromuscularRespiratoryFailureEscalationAtTick = this.currentTick;
          this.log('critical', 'assessment', `neuromuscular-respiratory-failure-escalation-activated-${this.currentTick}`, 'Experienced respiratory-ventilation, critical-care, and airway-capable evaluation was activated for persistent ventilation, cough, secretion, and bulbar risk without waiting for complete cause review. No oxygen, support device, interface, mode, setting, cough assistance, airway procedure, drug, or treatment was selected or delivered.', { ventilationDeliveredByLearner: false, oxygenDeliveredByLearner: false, supportDeviceSelectedByLearner: false, coughAssistDeliveredByLearner: false, airwayProcedurePerformedByLearner: false, treatmentDeliveredByLearner: false }); break;
        }
        if (response === 'review-neuromuscular-respiratory-failure-bulbar-cough-and-alternatives') {
          if (this.neuromuscularRespiratoryFailureReviewAtTick !== null) { this.log('warning', 'assessment', `neuromuscular-respiratory-failure-review-refused-${this.currentTick}`, 'The cough, secretion, bulbar, test-quality, trigger, and alternate-cause review was already recorded.'); break; }
          this.neuromuscularRespiratoryFailureReviewAtTick = this.currentTick;
          this.log('warning', 'assessment', `neuromuscular-respiratory-failure-review-recorded-${this.currentTick}`, 'Cough, secretion, bulbar and swallowing safety, communication, test quality, rapid-deterioration triggers, aspiration, infection, pulmonary, cardiac, metabolic, medication, central, and other neuromuscular contributors were reviewed without excluding change or proving a single cause. No examination, test, suction, airway clearance, diagnosis, or treatment occurred.', { airwayAssessedByLearner: false, coughAssessedByLearner: false, secretionProcedurePerformedByLearner: false, imagingAcquiredByLearner: false, diagnosisDetermined: false }); break;
        }
        if (response === 'coordinate-neuromuscular-respiratory-failure-goals-and-ownership') {
          if (this.neuromuscularRespiratoryFailureEscalationAtTick === null || this.neuromuscularRespiratoryFailureReviewAtTick === null) { this.log('warning', 'assessment', `neuromuscular-respiratory-failure-ownership-order-refused-${this.currentTick}`, 'Connect urgent experienced evaluation and complete the parallel safety review before coordinating shared ownership.'); break; }
          if (this.neuromuscularRespiratoryFailureOwnershipAtTick !== null) { this.log('warning', 'assessment', `neuromuscular-respiratory-failure-ownership-refused-${this.currentTick}`, 'Patient-centered multidisciplinary ownership was already coordinated.'); break; }
          this.neuromuscularRespiratoryFailureOwnershipAtTick = this.currentTick;
          this.log('warning', 'assessment', `neuromuscular-respiratory-failure-ownership-coordinated-${this.currentTick}`, 'Respiratory, neurology, speech and swallowing, nutrition, physiotherapy, nursing, primary-care, and caregiver ownership was coordinated around communication, documented preferences, symptom goals, respiratory-support and secretion-management evaluation, and follow-up. No preference was inferred and no device, technique, procedure, nutrition plan, treatment, disposition, prognosis, or outcome was chosen.', { patientPreferenceInferred: false, supportDeviceSelectedByLearner: false, coughAssistDeliveredByLearner: false, nutritionSelectedByLearner: false, treatmentDeliveredByLearner: false, dispositionDetermined: false, outcomePredicted: false }); break;
        }
        if (this.neuromuscularRespiratoryFailureOwnershipAtTick === null) { this.log('warning', 'assessment', `neuromuscular-respiratory-failure-handoff-order-refused-${this.currentTick}`, 'Coordinate patient-centered multidisciplinary ownership before handoff.'); break; }
        if (this.currentTick <= this.neuromuscularRespiratoryFailureOwnershipAtTick) { this.log('warning', 'assessment', `neuromuscular-respiratory-failure-handoff-time-refused-${this.currentTick}`, 'Allow a later simulated tick before handing off the active respiratory-failure work.'); break; }
        if (this.neuromuscularRespiratoryFailureHandoffAtTick !== null) { this.log('warning', 'assessment', `neuromuscular-respiratory-failure-handoff-refused-${this.currentTick}`, 'The neuromuscular respiratory-failure handoff was already recorded.'); break; }
        this.neuromuscularRespiratoryFailureHandoffAtTick = this.currentTick;
        this.log('warning', 'assessment', `neuromuscular-respiratory-failure-handoff-recorded-${this.currentTick}`, 'The serial trajectory, current mechanics and gas evidence, active ventilation, cough, secretion and bulbar risks, open causes, documented patient priorities, pending work, deterioration triggers, and named owners were handed off. No diagnosis, support selection, procedure, treatment, response, disposition, prognosis, or outcome was determined.', { diagnosisDetermined: false, supportDeviceSelectedByLearner: false, airwayProcedurePerformedByLearner: false, treatmentDeliveredByLearner: false, dispositionDetermined: false, outcomePredicted: false }); break;
      }
      case 'obesity-hypoventilation-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'obesity-hypoventilation-reassessment');
        const valid = ['reconcile-obesity-hypoventilation-phenotype-and-trajectory',
          'review-obesity-hypoventilation-awake-evidence',
          'review-obesity-hypoventilation-sleep-evidence-and-open-causes',
          'recognize-obesity-hypoventilation-working-pattern',
          'coordinate-obesity-hypoventilation-shared-plan',
          'handoff-obesity-hypoventilation-reassessment'].includes(response);
        if (!supported || !valid) { this.log('warning', 'assessment', `obesity-hypoventilation-response-refused-${this.currentTick}`, supported ? 'The obesity-hypoventilation action was not one of the listed choices. Nothing changed.' : 'These obesity-hypoventilation choices are available only in the declared Respiratory Medicine lesson.'); break; }
        if (response === 'reconcile-obesity-hypoventilation-phenotype-and-trajectory') {
          if (this.obesityHypoventilationPhenotypeAtTick !== null) { this.log('warning', 'assessment', `obesity-hypoventilation-phenotype-refused-${this.currentTick}`, 'The symptom, function, breathing, oxygenation, perfusion, and current-safety pattern was already reconciled.'); break; }
          this.obesityHypoventilationPhenotypeAtTick = this.currentTick;
          this.log('warning', 'assessment', `obesity-hypoventilation-phenotype-reconciled-${this.currentTick}`, 'The longitudinal sleep, daytime-function, breathing, oxygenation, perfusion, and current-safety pattern was reconciled without reducing the person to body size or inventing acute failure. No examination, BMI calculation, diagnosis, or treatment occurred.', { initialPulsePresent: true, spontaneousBreathingAuthored: true, obesityAuthored: true, acuteRespiratoryFailureAuthored: false, examinationPerformedByLearner: false, bmiCalculatedByLearner: false }); break;
        }
        if (this.obesityHypoventilationPhenotypeAtTick === null) { this.log('warning', 'assessment', `obesity-hypoventilation-phenotype-order-refused-${this.currentTick}`, 'Review the person’s symptoms, daytime function, physiology, and current safety before the evidence lanes.'); break; }
        if (response === 'review-obesity-hypoventilation-awake-evidence') {
          if (this.obesityHypoventilationAwakeEvidenceAtTick !== null) { this.log('warning', 'assessment', `obesity-hypoventilation-awake-evidence-refused-${this.currentTick}`, 'The fixed bicarbonate and awake blood-gas evidence was already reviewed.'); break; }
          this.obesityHypoventilationAwakeEvidenceAtTick = this.currentTick;
          this.log('warning', 'assessment', `obesity-hypoventilation-awake-evidence-reviewed-${this.currentTick}`, 'The fixed bicarbonate screening clue was separated from the authored awake blood-gas confirmation of compensated hypercapnia. Neither bicarbonate nor awake saturation was treated as a diagnosis or universal cutoff, and the learner acquired or interpreted no test.', { daytimeHypercapniaAuthored: true, serumBicarbonateAcquiredByLearner: false, bloodGasAcquiredByLearner: false, testInterpretedByLearner: false, diagnosisDetermined: false }); break;
        }
        if (response === 'review-obesity-hypoventilation-sleep-evidence-and-open-causes') {
          if (this.obesityHypoventilationSleepEvidenceAtTick !== null) { this.log('warning', 'assessment', `obesity-hypoventilation-sleep-evidence-refused-${this.currentTick}`, 'The fixed sleep evidence and open-cause review was already recorded.'); break; }
          this.obesityHypoventilationSleepEvidenceAtTick = this.currentTick;
          this.log('warning', 'assessment', `obesity-hypoventilation-sleep-evidence-reviewed-${this.currentTick}`, 'Fixed attended sleep evidence was connected with open lung, cardiac, pulmonary-vascular, neurologic, neuromuscular, chest-wall, endocrine, metabolic, medication, substance, central, and technical contributors. No study was acquired, scored, calculated, or interpreted, and no cause was permanently excluded.', { sleepDisorderedBreathingAuthored: true, sleepStudyAcquiredByLearner: false, sleepStudyScoredByLearner: false, sleepStudyInterpretedByLearner: false, otherCausesExcludedByLearner: false }); break;
        }
        if (response === 'recognize-obesity-hypoventilation-working-pattern') {
          if (this.obesityHypoventilationAwakeEvidenceAtTick === null || this.obesityHypoventilationSleepEvidenceAtTick === null) { this.log('warning', 'assessment', `obesity-hypoventilation-recognition-order-refused-${this.currentTick}`, 'Review both the fixed awake evidence and the sleep-plus-open-cause evidence before recording the bounded working pattern.'); break; }
          if (this.obesityHypoventilationRecognitionAtTick !== null) { this.log('warning', 'assessment', `obesity-hypoventilation-recognition-refused-${this.currentTick}`, 'The convergent authored obesity-hypoventilation working pattern was already recorded.'); break; }
          this.obesityHypoventilationRecognitionAtTick = this.currentTick;
          this.log('warning', 'assessment', `obesity-hypoventilation-pattern-recognized-${this.currentTick}`, 'Obesity, awake hypercapnia, sleep-disordered breathing, and explicit exclusion work were connected as one authored working pattern. BMI, bicarbonate, saturation, PaCO₂, and AHI were not used alone, and the learner did not determine a diagnosis.', { obesityHypoventilationWorkingPatternAuthored: true, diagnosisDeterminedByLearner: false, obesityCausalityProven: false }); break;
        }
        if (response === 'coordinate-obesity-hypoventilation-shared-plan') {
          if (this.obesityHypoventilationRecognitionAtTick === null) { this.log('warning', 'assessment', `obesity-hypoventilation-plan-order-refused-${this.currentTick}`, 'Record the bounded working pattern before coordinating shared ownership.'); break; }
          if (this.obesityHypoventilationPlanAtTick !== null) { this.log('warning', 'assessment', `obesity-hypoventilation-plan-refused-${this.currentTick}`, 'Respiratory, sleep, primary-care, cardiometabolic, and weight-health ownership was already coordinated.'); break; }
          this.obesityHypoventilationPlanAtTick = this.currentTick;
          this.log('warning', 'assessment', `obesity-hypoventilation-plan-coordinated-${this.currentTick}`, 'Respectful respiratory, sleep, primary-care, cardiometabolic, and weight-health ownership was connected around preferences, access, diagnostic completion, safety, comorbidity review, and follow-up. No PAP, interface, mode, pressure, oxygen, drug, weight target, nutrition plan, bariatric procedure, or treatment was selected.', { patientPreferenceInferred: false, supportDeviceSelectedByLearner: false, oxygenSelectedByLearner: false, drugSelectedByLearner: false, weightInterventionSelectedByLearner: false, treatmentDeliveredByLearner: false }); break;
        }
        if (this.obesityHypoventilationPlanAtTick === null) { this.log('warning', 'assessment', `obesity-hypoventilation-handoff-order-refused-${this.currentTick}`, 'Coordinate respectful multidisciplinary ownership before handoff.'); break; }
        if (this.currentTick <= this.obesityHypoventilationPlanAtTick) { this.log('warning', 'assessment', `obesity-hypoventilation-handoff-time-refused-${this.currentTick}`, 'Allow a later simulated tick before handing off the unresolved outpatient work.'); break; }
        if (this.obesityHypoventilationHandoffAtTick !== null) { this.log('warning', 'assessment', `obesity-hypoventilation-handoff-refused-${this.currentTick}`, 'The obesity-hypoventilation handoff was already recorded.'); break; }
        this.obesityHypoventilationHandoffAtTick = this.currentTick;
        this.log('warning', 'assessment', `obesity-hypoventilation-handoff-recorded-${this.currentTick}`, 'The symptom and function trajectory, awake and sleep evidence, working pattern, open causes, documented priorities, diagnostic and follow-up work, change triggers, and named owners were handed off. No diagnosis, support selection, weight intervention, treatment, response, disposition, prognosis, or outcome was determined.', { diagnosisDeterminedByLearner: false, supportDeviceSelectedByLearner: false, weightInterventionSelectedByLearner: false, treatmentDeliveredByLearner: false, dispositionDetermined: false, outcomePredicted: false }); break;
      }
      case 'noninvasive-ventilation-selection-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'noninvasive-ventilation-selection');
        const valid = ['reconcile-noninvasive-ventilation-selection-treatment-and-trajectory',
          'review-noninvasive-ventilation-selection-suitability-and-rescue-readiness',
          'select-bilevel-noninvasive-ventilation', 'select-cpap-alone',
          'select-high-flow-nasal-oxygen-alone',
          'review-noninvasive-ventilation-selection-early-response',
          'review-noninvasive-ventilation-selection-failure-guards',
          'handoff-noninvasive-ventilation-selection-reassessment'].includes(response);
        if (!supported || !valid) { this.log('warning', 'assessment', `noninvasive-ventilation-selection-response-refused-${this.currentTick}`, supported ? 'That support-selection action is not available. Nothing changed.' : 'These support-selection choices are available only in the declared Respiratory Medicine lesson.'); break; }
        if (response === 'reconcile-noninvasive-ventilation-selection-treatment-and-trajectory') {
          if (this.nivSelectionTrajectoryAtTick !== null) { this.log('warning', 'assessment', `noninvasive-ventilation-selection-trajectory-refused-${this.currentTick}`, 'The baseline, initial care, and persistent whole-patient respiratory-acidosis trajectory was already reconciled.'); break; }
          this.nivSelectionTrajectoryAtTick = this.currentTick;
          this.log('warning', 'assessment', `noninvasive-ventilation-selection-trajectory-reconciled-${this.currentTick}`, 'Baseline function and gas, arrival severity, verified controlled oxygen and COPD therapy, and persistent short-phrase breathing with acidotic hypercapnia were reconciled. No examination, test interpretation, medication, oxygen, or treatment was performed.', { standardInitialTherapyAuthored: true, acuteHypercapnicAcidosisAuthored: true, examinationPerformedByLearner: false, bloodGasInterpretedByLearner: false, treatmentDeliveredByLearner: false }); break;
        }
        if (this.nivSelectionTrajectoryAtTick === null) { this.log('warning', 'assessment', `noninvasive-ventilation-selection-trajectory-order-refused-${this.currentTick}`, 'Reconcile the response to verified initial care before reviewing trial suitability or selecting support.'); break; }
        if (response === 'review-noninvasive-ventilation-selection-suitability-and-rescue-readiness') {
          if (this.nivSelectionSuitabilityAtTick !== null) { this.log('warning', 'assessment', `noninvasive-ventilation-selection-suitability-refused-${this.currentTick}`, 'Current suitability, preferences, monitoring, and rescue readiness were already reviewed.'); break; }
          this.nivSelectionSuitabilityAtTick = this.currentTick;
          this.log('warning', 'assessment', `noninvasive-ventilation-selection-suitability-reviewed-${this.currentTick}`, 'The fixed airway, cooperation, secretion, emesis, face, hemodynamic, mentation, deterioration, preference, observation, and rescue-access facts supported a closely monitored trial in this case. They were not treated as learner examination or an absolute checklist.', { immediateDeteriorationAuthored: false, airwayProtectionFailureAuthored: false, hemodynamicInstabilityAuthored: false, patientExaminedByLearner: false, rescuePlanAuthored: true }); break;
        }
        if (this.nivSelectionSuitabilityAtTick === null) { this.log('warning', 'assessment', `noninvasive-ventilation-selection-suitability-order-refused-${this.currentTick}`, 'Review current suitability and rapid rescue readiness before choosing a support goal.'); break; }
        if (response === 'select-cpap-alone' || response === 'select-high-flow-nasal-oxygen-alone') {
          this.nivSelectionLastUnsupportedChoice = response === 'select-cpap-alone' ? 'cpap' : 'high-flow';
          this.log('warning', 'assessment', `noninvasive-ventilation-selection-modality-not-selected-${this.currentTick}`,
            response === 'select-cpap-alone'
              ? 'CPAP provides continuous distending pressure; this authored acidotic hypercapnic COPD pattern needs ventilatory assistance. The patient did not change.'
              : 'High-flow nasal oxygen may support oxygenation, but current guidance favors an NIV trial first for this authored acute hypercapnic acidotic COPD pattern. The patient did not change.',
            { unsupportedChoice: this.nivSelectionLastUnsupportedChoice, patientStateChanged: false }); break;
        }
        if (response === 'select-bilevel-noninvasive-ventilation') {
          if (this.nivSelectionAtTick !== null) { this.log('warning', 'assessment', `noninvasive-ventilation-selection-choice-refused-${this.currentTick}`, 'A closely monitored bilevel NIV trial was already selected.'); break; }
          this.nivSelectionAtTick = this.currentTick;
          this.nivSelectionLastUnsupportedChoice = null;
          this.log('warning', 'assessment', `noninvasive-ventilation-selection-bilevel-selected-${this.currentTick}`, 'A closely monitored bilevel NIV trial was selected for the authored persistent acute-on-chronic acidotic hypercapnic COPD pattern. Qualified staff own the device, interface, pressures, backup rate, oxygen, fitting, operation, treatment, and rapid rescue.', { bilevelNivSelectedByLearner: true, interfaceSelectedByLearner: false, pressureSelectedByLearner: false, deviceOperatedByLearner: false, ventilationDeliveredByLearner: false, treatmentDeliveredByLearner: false }); break;
        }
        if (this.nivSelectionAtTick === null) { this.log('warning', 'assessment', `noninvasive-ventilation-selection-choice-order-refused-${this.currentTick}`, 'Select the closely monitored bilevel NIV trial before reviewing an authored response.'); break; }
        if (response === 'review-noninvasive-ventilation-selection-early-response') {
          if (this.currentTick <= this.nivSelectionAtTick) { this.log('warning', 'assessment', `noninvasive-ventilation-selection-response-time-refused-${this.currentTick}`, 'Allow elapsed simulated time before reviewing the fixed first-hour response.'); break; }
          if (this.nivSelectionResponseAtTick !== null) { this.log('warning', 'assessment', `noninvasive-ventilation-selection-early-response-refused-${this.currentTick}`, 'The fixed first-hour response was already reviewed.'); break; }
          this.nivSelectionResponseAtTick = this.currentTick;
          this.log('warning', 'assessment', `noninvasive-ventilation-selection-early-response-reviewed-${this.currentTick}`, 'Fixed experienced-team first-hour report: alert and more comfortable, longer phrases, less accessory use, RR 24/min, HR 94/min, stable pressure, SpO₂ 90% on reported controlled support, pH 7.33, PaCO₂ 60 mmHg, and bicarbonate 31 mmol/L. Interface tolerance and secretion handling are currently acceptable. This is partial early improvement, not durable success, disposition, or outcome.', { responseAuthored: true, nivDeliveredByLearner: false, durableNivSuccessProven: false, outcomePredicted: false }); break;
        }
        if (this.nivSelectionResponseAtTick === null) { this.log('warning', 'assessment', `noninvasive-ventilation-selection-response-order-refused-${this.currentTick}`, 'Review the fixed first-hour response before recording continuation and failure guards.'); break; }
        if (response === 'review-noninvasive-ventilation-selection-failure-guards') {
          if (this.nivSelectionFailureGuardsAtTick !== null) { this.log('warning', 'assessment', `noninvasive-ventilation-selection-failure-guards-refused-${this.currentTick}`, 'Continuation, failure triggers, and rapid rescue readiness were already recorded.'); break; }
          this.nivSelectionFailureGuardsAtTick = this.currentTick;
          this.log('warning', 'assessment', `noninvasive-ventilation-selection-failure-guards-reviewed-${this.currentTick}`, 'Monitored continuation preserved mentation, airway protection, work, pH and PaCO₂, oxygenation, hemodynamics, interface tolerance, secretions, open causes, preferences, and rapid airway-capable reassessment as active failure guards. No setting, sedation, intubation, procedure, treatment, or outcome was chosen.', { durableNivSuccessProven: false, intubationPerformedByLearner: false, treatmentDeliveredByLearner: false, outcomePredicted: false }); break;
        }
        if (this.nivSelectionFailureGuardsAtTick === null) { this.log('warning', 'assessment', `noninvasive-ventilation-selection-handoff-order-refused-${this.currentTick}`, 'Record continuation, failure triggers, and rescue readiness before handoff.'); break; }
        if (this.currentTick <= this.nivSelectionFailureGuardsAtTick) { this.log('warning', 'assessment', `noninvasive-ventilation-selection-handoff-time-refused-${this.currentTick}`, 'Allow another simulated tick before handing off active support and rescue work.'); break; }
        if (this.nivSelectionHandoffAtTick !== null) { this.log('warning', 'assessment', `noninvasive-ventilation-selection-handoff-refused-${this.currentTick}`, 'The active-support handoff was already recorded.'); break; }
        this.nivSelectionHandoffAtTick = this.currentTick;
        this.log('warning', 'assessment', `noninvasive-ventilation-selection-handoff-recorded-${this.currentTick}`, 'Active reported bilevel support, the partial first-hour response, COPD and alternative-cause work, controlled oxygen, serial reassessment, tolerance and secretion review, failure triggers, rescue readiness, preferences, and named owners were handed off. No weaning, intubation, disposition, prognosis, durable success, or outcome was determined.', { durableNivSuccessProven: false, intubationPerformedByLearner: false, dispositionDetermined: false, outcomePredicted: false }); break;
      }
      case 'pacemaker-capture-failure-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'pacemaker-capture-failure-reassessment');
        const valid = ['reconcile-pacemaker-capture-failure-pulse-and-pattern',
          'activate-pacemaker-capture-failure-rescue-pathway',
          'review-pacemaker-capture-failure-device-system',
          'review-pacemaker-capture-failure-causes',
          'review-pacemaker-capture-failure-later-panel',
          'handoff-pacemaker-capture-failure-reassessment'].includes(response);
        if (!supported || !valid) { this.log('warning', 'assessment', `pacemaker-capture-failure-response-refused-${this.currentTick}`, supported ? 'The pacemaker-capture-failure action was not one of the listed choices. Nothing changed.' : 'These pacemaker-capture-failure choices are available only in the declared Cardiology lesson.'); break; }
        if (response === 'reconcile-pacemaker-capture-failure-pulse-and-pattern') {
          if (this.pacemakerCaptureFailureRecognitionAtTick !== null) { this.log('warning', 'assessment', `pacemaker-capture-failure-recognition-refused-${this.currentTick}`, 'The authored pulse, perfusion, and electrical-noncapture pattern was already reconciled.'); break; }
          this.pacemakerCaptureFailureRecognitionAtTick = this.currentTick;
          this.log('critical', 'assessment', `pacemaker-capture-failure-recognized-${this.currentTick}`, 'Fixed telemetry and 12-lead reports show ventricular pacing artifacts at the programmed lower rate with 6 of 10 ventricular stimuli not followed by a paced QRS. Captured and intrinsic escape complexes produce the effective ventricular rate and palpable pulse of 32/min; isolated pacing artifacts do not. BP is 84/52 mmHg with abrupt presyncope, weakness, and cool skin, while the patient remains awake, oriented, and without chest pain, acute heart failure, or pulse loss. This authored electrical failure to capture is not a learner-performed ECG interpretation or capture assessment.', { initialPulsePresent: true, electricalCaptureFailureAuthored: true, captureAssessedByLearner: false, treatmentDeliveredByLearner: false }); break;
        }
        if (this.pacemakerCaptureFailureRecognitionAtTick === null) { this.log('warning', 'assessment', `pacemaker-capture-failure-order-refused-${this.currentTick}`, 'Reconcile the authored pulse, perfusion, and electrical-noncapture pattern before rescue or device review.'); break; }
        if (response === 'activate-pacemaker-capture-failure-rescue-pathway') {
          if (this.pacemakerCaptureFailureRescueAtTick !== null) { this.log('warning', 'assessment', `pacemaker-capture-failure-rescue-refused-${this.currentTick}`, 'The acute bradycardia, device-expertise, and backup-pacing pathway was already activated.'); break; }
          this.pacemakerCaptureFailureRescueAtTick = this.currentTick;
          this.log('critical', 'assessment', `pacemaker-capture-failure-rescue-activated-${this.currentTick}`, 'Symptomatic hypotension with a pulse activated continuous rhythm, pulse, pressure, perfusion, and oxygenation surveillance; urgent resuscitation and electrophysiology/device expertise; backup pacing readiness; and a pulse-loss arrest contingency. No oxygen, drug, infusion, pad placement, pacing mode, rate, output, pulse width, sedation, access, pacing delivery, capture test, or procedure was selected or performed.', { pacingDeliveredByLearner: false, outputSelectedByLearner: false, captureAssessedByLearner: false, treatmentDeliveredByLearner: false }); break;
        }
        if (response === 'review-pacemaker-capture-failure-device-system') {
          if (this.pacemakerCaptureFailureDeviceSystemAtTick !== null) { this.log('warning', 'assessment', `pacemaker-capture-failure-device-system-refused-${this.currentTick}`, 'The fixed device-system report and trends were already reviewed.'); break; }
          this.pacemakerCaptureFailureDeviceSystemAtTick = this.currentTick;
          this.log('critical', 'assessment', `pacemaker-capture-failure-device-system-reviewed-${this.currentTick}`, 'Fixed experienced-team interrogation report: a dual-chamber pacemaker was implanted 3 years earlier for complete AV block, prior ventricular pacing was 99.8%, prior RV threshold 0.75 V at 0.4 ms, and prior impedance 520 ohms. The battery is not at elective replacement and estimated longevity is 6.1 years. Current reported RV threshold is 3.5 V at 0.4 ms, impedance rose abruptly to 1,860 ohms, and stored ventricular electrograms show intermittent nonphysiologic noise; atrial-lead values remain stable. These combined authored trends raise a lead/system-integrity concern without proving fracture, connection failure, one cutoff, or a repair.', { deviceInterrogatedByLearner: false, deviceProgrammedByLearner: false, leadManipulatedByLearner: false, universalCutoffUsed: false }); break;
        }
        if (response === 'review-pacemaker-capture-failure-causes') {
          if (this.pacemakerCaptureFailureCausesAtTick !== null) { this.log('warning', 'assessment', `pacemaker-capture-failure-causes-refused-${this.currentTick}`, 'The fixed contributor screen and open cause set were already reviewed.'); break; }
          this.pacemakerCaptureFailureCausesAtTick = this.currentTick;
          this.log('critical', 'assessment', `pacemaker-capture-failure-causes-reviewed-${this.currentTick}`, 'Fixed reports give potassium 4.2 mmol/L, magnesium 2.0 mg/dL, pH 7.39, normal oxygenation, no acute STEMI pattern, and no gross lead displacement, pneumothorax, obvious fracture, pocket inflammation, or recent procedure. Microdislodgment, fracture or connection problems, lead-myocardial interface change, ischemia or inflammation, metabolic or medication effects, generator behavior, sensing or output behavior, and measurement or interrogation error remain open. A magnet is not treated as a generic remedy.', { causeAssigned: false, alternativesPermanentlyExcluded: false, testAcquiredByLearner: false, magnetSelected: false }); break;
        }
        if (response === 'review-pacemaker-capture-failure-later-panel') {
          if (this.pacemakerCaptureFailureRescueAtTick === null
            || this.pacemakerCaptureFailureDeviceSystemAtTick === null
            || this.pacemakerCaptureFailureCausesAtTick === null) { this.log('warning', 'assessment', `pacemaker-capture-failure-later-panel-order-refused-${this.currentTick}`, 'Activate rescue and complete both device-system and cause-review lanes before reviewing the later panel.'); break; }
          if (this.currentTick <= Math.max(this.pacemakerCaptureFailureRescueAtTick,
            this.pacemakerCaptureFailureDeviceSystemAtTick,
            this.pacemakerCaptureFailureCausesAtTick)) { this.log('warning', 'assessment', `pacemaker-capture-failure-later-panel-time-refused-${this.currentTick}`, 'Allow a later simulated tick before reviewing the authored experienced-team response.'); break; }
          if (this.pacemakerCaptureFailureLaterPanelAtTick !== null) { this.log('warning', 'assessment', `pacemaker-capture-failure-later-panel-refused-${this.currentTick}`, 'The authored experienced-team response was already reviewed.'); break; }
          this.pacemakerCaptureFailureLaterPanelAtTick = this.currentTick;
          this.rhythm = 'paced';
          this.log('warning', 'assessment', `pacemaker-capture-failure-later-panel-reviewed-${this.currentTick}`, 'Fixed experienced-team report: a manufacturer- and lead-specific temporary programming change restored consistent reported electrical and mechanical capture while backup pacing readiness remained. The paced rate is 70/min, each reported ventricular artifact is followed by a paced QRS and mechanical pulse or arterial waveform, BP is 114/68 mmHg, presyncope has resolved, and perfusion is warm. This is prior experienced-team care, not learner interrogation, programming, pacing, or a durable repair or outcome.', { treatmentDeliveredByLearner: false, pacingDeliveredByLearner: false, deviceInterrogatedByLearner: false, deviceProgrammedByLearner: false, captureAssessedByLearner: false, durableResolutionEstablished: false, outcomePredicted: false }); break;
        }
        if (this.pacemakerCaptureFailureLaterPanelAtTick === null) { this.log('warning', 'assessment', `pacemaker-capture-failure-handoff-order-refused-${this.currentTick}`, 'Review the authored experienced-team response before the later reassessment handoff.'); break; }
        if (this.currentTick <= this.pacemakerCaptureFailureLaterPanelAtTick) { this.log('warning', 'assessment', `pacemaker-capture-failure-handoff-time-refused-${this.currentTick}`, 'Allow another later simulated tick before handing off the unresolved device-system trajectory.'); break; }
        if (this.pacemakerCaptureFailureHandoffAtTick !== null) { this.log('warning', 'assessment', `pacemaker-capture-failure-handoff-refused-${this.currentTick}`, 'The later reassessment and unresolved-work handoff was already recorded.'); break; }
        this.pacemakerCaptureFailureHandoffAtTick = this.currentTick;
        this.log('warning', 'assessment', `pacemaker-capture-failure-handoff-recorded-${this.currentTick}`, 'Fixed later report: paced rate 70/min, BP 114/68 mmHg, alert warm perfusion, no recurrent presyncope, and consistent reported electrical and mechanical capture during this interval. Lead and generator integrity, the cause of threshold and impedance change, recurrence surveillance, durable device strategy, owners, and deterioration or pulse-loss triggers remain open without learner programming, lead manipulation, definitive repair, disposition, prognosis, or outcome.', { treatmentDeliveredByLearner: false, deviceProgrammedByLearner: false, leadManipulatedByLearner: false, dispositionDetermined: false, outcomePredicted: false }); break;
      }
      case 'transcutaneous-pacing-capture-response': {
        const response = String(action.payload.action ?? '');
        const supported = this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'transcutaneous-pacing-mechanical-capture-reassessment');
        const valid = ['reconcile-transcutaneous-pacing-electrical-and-mechanical-capture',
          'activate-transcutaneous-pacing-pulseless-response',
          'review-transcutaneous-pacing-open-causes-and-bridge',
          'handoff-transcutaneous-pacing-reassessment'].includes(response);
        if (!supported || !valid) { this.log('warning', 'assessment', `transcutaneous-pacing-response-refused-${this.currentTick}`, supported ? 'The transcutaneous-pacing action was not one of the listed choices. Nothing changed.' : 'These transcutaneous-pacing choices are available only in the declared Cardiology lesson.'); break; }
        if (response === 'reconcile-transcutaneous-pacing-electrical-and-mechanical-capture') {
          if (this.transcutaneousPacingRecognitionAtTick !== null) { this.log('warning', 'assessment', `transcutaneous-pacing-recognition-refused-${this.currentTick}`, 'The authored electrical-capture and absent-mechanical-capture pattern was already reconciled.'); break; }
          this.transcutaneousPacingRecognitionAtTick = this.currentTick;
          this.log('critical', 'assessment', `transcutaneous-pacing-capture-reconciled-${this.currentTick}`, 'Fixed monitor and 12-lead reports show a transcutaneous pacing artifact before every broad QRS and a distinct ST-T complex at 70/min, establishing authored electrical capture rather than afterpotential alone. Fixed carotid and femoral assessments find no pulse, the arterial and pleth waveforms are nonpulsatile, noninvasive pressure is unobtainable, and the patient is unresponsive with agonal breathing. Electrical capture without mechanical output is pulse loss and PEA; the learner did not examine, palpate, interpret the ECG, operate the pacer, or assess capture.', { electricalCaptureAuthored: true, mechanicalCaptureAbsent: true, initialPulsePresent: false, captureAssessedByLearner: false, pacingDeliveredByLearner: false }); break;
        }
        if (this.transcutaneousPacingRecognitionAtTick === null) { this.log('warning', 'assessment', `transcutaneous-pacing-order-refused-${this.currentTick}`, 'Reconcile the authored electrical and mechanical capture evidence before opening the pulse-loss pathway.'); break; }
        if (response === 'activate-transcutaneous-pacing-pulseless-response') {
          if (this.transcutaneousPacingPulselessResponseAtTick !== null) { this.log('warning', 'assessment', `transcutaneous-pacing-pulseless-response-refused-${this.currentTick}`, 'The nonshockable pulse-loss response and resuscitation-team ownership were already activated.'); break; }
          this.transcutaneousPacingPulselessResponseAtTick = this.currentTick;
          this.log('critical', 'assessment', `transcutaneous-pacing-pulseless-response-activated-${this.currentTick}`, 'The fixed pulse-loss finding activated the nonshockable cardiac-arrest pathway, uninterrupted resuscitation-team ownership, oxygenation and ventilation support, and reversible-cause work without treating displayed electrical capture as circulation or continuing pacing as an arrest treatment. No CPR mechanics, oxygen, airway, drug, infusion, shock, pacing setting, pacing delivery, access, or procedure was selected or performed by the learner.', { nonshockableArrestPathwayActivated: true, treatmentDeliveredByLearner: false, cprDeliveredByLearner: false, pacingDeliveredByLearner: false, shockSelected: false }); break;
        }
        if (this.transcutaneousPacingPulselessResponseAtTick === null) { this.log('warning', 'assessment', `transcutaneous-pacing-pulseless-order-refused-${this.currentTick}`, 'Activate the pulse-loss pathway before reviewing causes or any later pacing bridge.'); break; }
        if (response === 'review-transcutaneous-pacing-open-causes-and-bridge') {
          if (this.transcutaneousPacingCausesBridgeAtTick !== null) { this.log('warning', 'assessment', `transcutaneous-pacing-causes-refused-${this.currentTick}`, 'The open PEA causes and expert pacing-bridge boundary were already reviewed.'); break; }
          this.transcutaneousPacingCausesBridgeAtTick = this.currentTick;
          this.log('critical', 'assessment', `transcutaneous-pacing-causes-bridge-reviewed-${this.currentTick}`, 'Hypoxia, hypovolemia, acidosis, potassium disturbance, hypothermia, tension physiology, tamponade, thrombosis, toxins, myocardial failure, ischemia, and measurement error remain open until the resuscitation team evaluates them. Transcutaneous pacing is not credited as treatment for established arrest; any later temporary pacing strategy remains an experienced-team bridge only after circulation and indication are reassessed. No cause was assigned and no test, drug, fluid, pacing mode, rate, output, pulse width, pad placement, transvenous access, or procedure was selected.', { causeAssigned: false, testAcquiredByLearner: false, pacingDeliveredByLearner: false, treatmentDeliveredByLearner: false, procedurePerformedByLearner: false }); break;
        }
        if (this.transcutaneousPacingCausesBridgeAtTick === null) { this.log('warning', 'assessment', `transcutaneous-pacing-handoff-order-refused-${this.currentTick}`, 'Review the open causes and pacing-bridge boundary before handing off the active arrest trajectory.'); break; }
        if (this.currentTick <= this.transcutaneousPacingCausesBridgeAtTick) { this.log('warning', 'assessment', `transcutaneous-pacing-handoff-time-refused-${this.currentTick}`, 'Allow a later simulated tick before handing off the active resuscitation trajectory.'); break; }
        if (this.transcutaneousPacingHandoffAtTick !== null) { this.log('warning', 'assessment', `transcutaneous-pacing-handoff-refused-${this.currentTick}`, 'The active resuscitation and unresolved-work handoff was already recorded.'); break; }
        this.transcutaneousPacingHandoffAtTick = this.currentTick;
        this.log('critical', 'assessment', `transcutaneous-pacing-handoff-recorded-${this.currentTick}`, 'Fixed later report: paced electrical activity remains present without a reported mechanical pulse while the experienced resuscitation team owns continuous nonshockable-arrest care and cause-directed evaluation. Mechanical capture, circulation, cause, response, any later temporary pacing bridge, post-arrest care, disposition, prognosis, ROSC, and outcome remain unreported or unresolved. The learner did not deliver resuscitation, pacing, treatment, or a procedure.', { mechanicalCaptureRestored: false, roscReported: false, treatmentDeliveredByLearner: false, pacingDeliveredByLearner: false, dispositionDetermined: false, outcomePredicted: false }); break;
      }
      case 'emergence-residual-block-assessment': {
        const supported = this.scenario.timeline.some(
          (event) => event.type === 'narrative'
            && event.target === 'emergence-residual-blockade',
        );
        const response = String(action.payload.action ?? '');
        const valid = [
          'review-quantitative-monitor', 'classify-residual', 'classify-recovered',
          'defer-extubation-and-support', 'proceed-to-extubation',
        ].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `emergence-block-refused-${this.currentTick}`,
            supported
              ? 'The emergence action was not one of the listed choices. No decision was recorded.'
              : 'The bounded emergence choices are available only in the declared residual-blockade lesson.');
          break;
        }
        const ratio = Number(this.lastState.trainOfFourRatio
          ?? this.scenario.equipment.startingTrainOfFourRatio ?? 1);
        const count = Number(this.lastState.trainOfFourCount ?? 4);
        if (response === 'review-quantitative-monitor') {
          if (this.emergenceMonitorReviewedAtTick !== null) {
            this.log('warning', 'assessment', `emergence-monitor-review-refused-${this.currentTick}`,
              'The quantitative neuromuscular monitor has already been reviewed.');
            break;
          }
          this.emergenceMonitorReviewedAtTick = this.currentTick;
          this.log('advisory', 'assessment', `emergence-monitor-reviewed-${this.currentTick}`,
            `Quantitative review: four twitches, ratio ${ratio.toFixed(2)}, and ${qualitativeTwitchAssessment(count, ratio)}. Clinical signs and an apparently normal qualitative count do not exclude residual blockade.`, {
              trainOfFourCount: count, trainOfFourRatio: ratio,
              qualitativeFadeDetected: false,
            });
          break;
        }
        if (this.emergenceMonitorReviewedAtTick === null) {
          this.log('warning', 'assessment', `emergence-block-order-refused-${this.currentTick}`,
            'Review the quantitative neuromuscular monitor before classifying recovery or choosing a plan.');
          break;
        }
        if (response.startsWith('classify-')) {
          if (this.emergenceBlockClassification !== null) {
            this.log('warning', 'assessment', `emergence-block-classification-refused-${this.currentTick}`,
              'A neuromuscular recovery classification has already been recorded for this attempt.');
            break;
          }
          this.emergenceBlockClassification = response === 'classify-residual'
            ? 'residual' : 'recovered';
          this.emergenceBlockClassifiedAtTick = this.currentTick;
          this.log('advisory', 'assessment', `emergence-block-classified-${this.emergenceBlockClassification}-${this.currentTick}`,
            this.emergenceBlockClassification === 'residual'
              ? `Residual blockade recorded because the quantitative ratio is ${ratio.toFixed(2)}, below 0.90.`
              : `Recovery recorded despite a quantitative ratio of ${ratio.toFixed(2)}, below 0.90.`, {
              classification: this.emergenceBlockClassification,
              trainOfFourRatio: ratio,
            });
          break;
        }
        if (this.emergenceBlockClassification === null) {
          this.log('warning', 'assessment', `emergence-plan-order-refused-${this.currentTick}`,
            'Classify the quantitative neuromuscular result before choosing an emergence plan.');
          break;
        }
        if (this.emergencePlan !== null) {
          this.log('warning', 'assessment', `emergence-plan-refused-${this.currentTick}`,
            'An emergence plan has already been recorded for this attempt.');
          break;
        }
        this.emergencePlan = response === 'defer-extubation-and-support'
          ? 'defer-extubation-and-support' : 'proceed-to-extubation';
        this.emergencePlanAtTick = this.currentTick;
        this.log('advisory', 'assessment', `emergence-plan-${this.emergencePlan}-${this.currentTick}`,
          this.emergencePlan === 'defer-extubation-and-support'
            ? 'Extubation deferred; the tracheal tube and delivered ventilation remain in place while quantitative recovery is addressed and reassessed.'
            : 'Progression toward extubation recorded despite quantitative residual blockade.', {
            plan: this.emergencePlan,
            classification: this.emergenceBlockClassification,
            airwayRemainedIntubated: this.patient.airway.intubated,
            ventilationRemainedDelivered: this.ventilator.delivering,
          });
        break;
      }
      case 'delayed-emergence-assessment': {
        const supported = this.scenario.timeline.some(
          (event) => event.type === 'narrative' && event.target === 'delayed-emergence-differential',
        );
        const response = String(action.payload.action ?? '');
        const valid = [
          'review-support', 'review-exposure-and-block', 'check-metabolic-causes',
          'perform-focused-neurologic-exam', 'urgent-neurologic-evaluation',
          'continue-routine-recovery',
        ].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `delayed-emergence-refused-${this.currentTick}`,
            supported
              ? 'The delayed-emergence action was not one of the listed choices. No finding was recorded.'
              : 'The bounded delayed-emergence assessment is available only in its declared lesson.');
          break;
        }
        if (response === 'review-support') {
          if (this.delayedEmergenceSupportReviewedAtTick !== null) {
            this.log('warning', 'assessment', `delayed-emergence-support-refused-${this.currentTick}`,
              'Airway, ventilation, oxygenation, circulation, and temperature have already been reviewed.');
            break;
          }
          this.delayedEmergenceSupportReviewedAtTick = this.currentTick;
          this.log('advisory', 'assessment', `delayed-emergence-support-reviewed-${this.currentTick}`,
            'Immediate review: the tracheal tube and delivered ventilation remain established; oxygenation, end-tidal carbon dioxide, circulation, and temperature are stable.', {
              airwaySupported: this.patient.airway.intubated,
              ventilationSupported: this.ventilator.delivering,
            });
          break;
        }
        if (this.delayedEmergenceSupportReviewedAtTick === null) {
          this.log('warning', 'assessment', `delayed-emergence-order-refused-${this.currentTick}`,
            'Review immediate airway and physiologic support before investigating causes.');
          break;
        }
        if (response === 'review-exposure-and-block') {
          if (this.delayedEmergenceExposureReviewedAtTick !== null) {
            this.log('warning', 'assessment', `delayed-emergence-exposure-refused-${this.currentTick}`,
              'The anesthetic record and quantitative neuromuscular recovery have already been reviewed.');
            break;
          }
          this.delayedEmergenceExposureReviewedAtTick = this.currentTick;
          this.log('advisory', 'assessment', `delayed-emergence-exposure-reviewed-${this.currentTick}`,
            'Record review: volatile delivery and infusions are off, no benzodiazepine was given, the last small opioid dose was more than one hour ago, and the quantitative train-of-four ratio is 0.95. Residual drug effect remains a category, but no single recorded exposure explains the new pattern.', {
              trainOfFourRatio: 0.95, volatileDeliveryPercent: 0,
              infusionRunning: false, benzodiazepineGiven: false,
            });
          break;
        }
        if (response === 'check-metabolic-causes') {
          if (this.delayedEmergenceExposureReviewedAtTick === null) {
            this.log('warning', 'assessment', `delayed-emergence-metabolic-order-refused-${this.currentTick}`,
              'Reconcile anesthetic exposure and quantitative block before the next differential step.');
            break;
          }
          if (this.delayedEmergenceMetabolicReviewedAtTick !== null) {
            this.log('warning', 'assessment', `delayed-emergence-metabolic-refused-${this.currentTick}`,
              'The bounded bedside glucose and blood-gas findings have already been reviewed.');
            break;
          }
          this.delayedEmergenceMetabolicReviewedAtTick = this.currentTick;
          this.log('advisory', 'assessment', `delayed-emergence-metabolic-reviewed-${this.currentTick}`,
            'Bounded bedside results: glucose 102 mg/dL, arterial carbon dioxide 41 mmHg, sodium 139 mEq/L, and temperature 36.7°C. These fixed findings do not identify a metabolic explanation.', {
              glucoseMgPerDl: 102, arterialCarbonDioxideMmHg: 41,
              sodiumMEqPerL: 139, temperatureC: 36.7,
            });
          break;
        }
        if (response === 'perform-focused-neurologic-exam') {
          if (this.delayedEmergenceMetabolicReviewedAtTick === null) {
            this.log('warning', 'assessment', `delayed-emergence-neurologic-order-refused-${this.currentTick}`,
              'Complete the immediate, exposure, and metabolic reviews before the focused neurologic examination.');
            break;
          }
          if (this.delayedEmergenceNeurologicExamAtTick !== null) {
            this.log('warning', 'assessment', `delayed-emergence-neurologic-refused-${this.currentTick}`,
              'The focused neurologic examination has already been recorded.');
            break;
          }
          this.delayedEmergenceNeurologicExamAtTick = this.currentTick;
          this.log('critical', 'assessment', `delayed-emergence-neurologic-exam-${this.currentTick}`,
            'Focused examination: the patient localizes with the left arm but not the right and has a new leftward gaze preference. This lateralizing pattern requires urgent evaluation; the vignette does not diagnose its cause.', {
              rightArmResponse: 'absent', leftArmResponse: 'localizes',
              gazePreference: 'left', diagnosisEstablished: false,
            });
          break;
        }
        if (this.delayedEmergenceNeurologicExamAtTick === null) {
          this.log('warning', 'assessment', `delayed-emergence-escalation-order-refused-${this.currentTick}`,
            'Complete the focused neurologic examination before choosing the escalation path.');
          break;
        }
        if (this.delayedEmergenceEscalation !== null) {
          this.log('warning', 'assessment', `delayed-emergence-escalation-refused-${this.currentTick}`,
            'A delayed-emergence escalation path has already been recorded.');
          break;
        }
        this.delayedEmergenceEscalation = response === 'urgent-neurologic-evaluation'
          ? 'urgent-neurologic-evaluation' : 'continue-routine-recovery';
        this.delayedEmergenceEscalatedAtTick = this.currentTick;
        this.log(this.delayedEmergenceEscalation === 'urgent-neurologic-evaluation' ? 'critical' : 'warning',
          'assessment', `delayed-emergence-escalation-${this.delayedEmergenceEscalation}-${this.currentTick}`,
          this.delayedEmergenceEscalation === 'urgent-neurologic-evaluation'
            ? 'Urgent neurologic evaluation and continued airway support recorded. Imaging, diagnosis, treatment, team workflow, and outcome are outside this vignette.'
            : 'Routine recovery observation recorded despite the new lateralizing examination finding.', {
            escalation: this.delayedEmergenceEscalation,
            airwayRemainedIntubated: this.patient.airway.intubated,
            ventilationRemainedDelivered: this.ventilator.delivering,
          });
        break;
      }
      case 'extubation-readiness-assessment': {
        const supported = this.scenario.timeline.some(
          (event) => event.type === 'narrative' && event.target === 'extubation-readiness',
        );
        const response = String(action.payload.action ?? '');
        const valid = [
          'review-quantitative-recovery', 'review-awake-airway-protection',
          'review-spontaneous-gas-exchange', 'review-airway-risk-and-rescue',
          'ready-for-planned-awake-extubation', 'continue-support-and-reassess',
        ].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `extubation-readiness-refused-${this.currentTick}`,
            supported
              ? 'The extubation-readiness action was not one of the listed choices. Nothing changed.'
              : 'The bounded extubation-readiness assessment is available only in its declared lesson.');
          break;
        }
        if (response === 'review-quantitative-recovery') {
          if (this.extubationQuantitativeRecoveryReviewedAtTick !== null) {
            this.log('warning', 'assessment', `extubation-recovery-refused-${this.currentTick}`,
              'Quantitative neuromuscular recovery has already been reviewed.');
            break;
          }
          this.extubationQuantitativeRecoveryReviewedAtTick = this.currentTick;
          this.log('advisory', 'assessment', `extubation-recovery-reviewed-${this.currentTick}`,
            'Quantitative review: train-of-four ratio 0.93 with four twitches. This clears the neuromuscular checkpoint but does not establish complete extubation readiness.', {
              trainOfFourRatio: 0.93, trainOfFourCount: 4,
            });
          break;
        }
        if (this.extubationQuantitativeRecoveryReviewedAtTick === null) {
          this.log('warning', 'assessment', `extubation-readiness-order-refused-${this.currentTick}`,
            'Review quantitative neuromuscular recovery before the broader readiness assessment.');
          break;
        }
        if (response === 'review-awake-airway-protection') {
          if (this.extubationAwakeAirwayReviewedAtTick !== null) {
            this.log('warning', 'assessment', `extubation-awake-airway-refused-${this.currentTick}`,
              'Awake response and airway-protection findings have already been reviewed.');
            break;
          }
          this.extubationAwakeAirwayReviewedAtTick = this.currentTick;
          this.log('advisory', 'assessment', `extubation-awake-airway-reviewed-${this.currentTick}`,
            'Awake-airway review: sustained eye opening and command following are present, cough is strong, and oropharyngeal secretions have been cleared.', {
              sustainedEyeOpening: true, followsCommands: true,
              strongCough: true, secretionsCleared: true,
            });
          break;
        }
        if (response === 'review-spontaneous-gas-exchange') {
          if (this.extubationAwakeAirwayReviewedAtTick === null) {
            this.log('warning', 'assessment', `extubation-gas-exchange-order-refused-${this.currentTick}`,
              'Review awake response and airway protection before gas-exchange readiness.');
            break;
          }
          if (this.extubationGasExchangeReviewedAtTick !== null) {
            this.log('warning', 'assessment', `extubation-gas-exchange-refused-${this.currentTick}`,
              'The bounded spontaneous-breathing and gas-exchange findings have already been reviewed.');
            break;
          }
          this.extubationGasExchangeReviewedAtTick = this.currentTick;
          this.log('advisory', 'assessment', `extubation-gas-exchange-reviewed-${this.currentTick}`,
            'Bounded readiness findings: regular spontaneous breathing at 14/min, average tidal volume 420 mL, end-tidal carbon dioxide 39 mmHg, and oxygen saturation 98% on inspired oxygen 0.40.', {
              spontaneousRespiratoryRateBpm: 14, averageTidalVolumeMl: 420,
              endTidalCarbonDioxideMmHg: 39, spo2Percent: 98, fio2: 0.4,
            });
          break;
        }
        if (response === 'review-airway-risk-and-rescue') {
          if (this.extubationGasExchangeReviewedAtTick === null) {
            this.log('warning', 'assessment', `extubation-airway-plan-order-refused-${this.currentTick}`,
              'Review awake-airway and gas-exchange readiness before final airway risk and rescue planning.');
            break;
          }
          if (this.extubationAirwayPlanReviewedAtTick !== null) {
            this.log('warning', 'assessment', `extubation-airway-plan-refused-${this.currentTick}`,
              'Airway risk and the rescue plan have already been reviewed.');
            break;
          }
          this.extubationAirwayPlanReviewedAtTick = this.currentTick;
          this.log('advisory', 'assessment', `extubation-airway-plan-reviewed-${this.currentTick}`,
            'Low-risk plan review: mask ventilation and intubation were uncomplicated; no airway surgery, edema, bleeding, or distortion is declared; oxygen, monitoring, skilled help, and a reintubation plan are available.', {
              lowRisk: true, airwayChangeDeclared: false,
              skilledHelpAvailable: true, reintubationPlanReviewed: true,
            });
          break;
        }
        if (this.extubationAirwayPlanReviewedAtTick === null) {
          this.log('warning', 'assessment', `extubation-decision-order-refused-${this.currentTick}`,
            'Complete the quantitative, awake-airway, gas-exchange, and airway-plan reviews before deciding.');
          break;
        }
        if (this.extubationReadinessDecision !== null) {
          this.log('warning', 'assessment', `extubation-decision-refused-${this.currentTick}`,
            'An extubation-readiness decision has already been recorded for this attempt.');
          break;
        }
        this.extubationReadinessDecision = response === 'ready-for-planned-awake-extubation'
          ? 'ready-for-planned-awake-extubation' : 'continue-support-and-reassess';
        this.extubationReadinessDecidedAtTick = this.currentTick;
        this.log('advisory', 'assessment', `extubation-decision-${this.extubationReadinessDecision}-${this.currentTick}`,
          this.extubationReadinessDecision === 'ready-for-planned-awake-extubation'
            ? 'Readiness for a planned awake extubation recorded after all declared checkpoints. The tube remains in place because removal and post-extubation outcome are not simulated.'
            : 'Continued support and reassessment recorded despite all declared low-risk awake-extubation checkpoints being present.', {
            decision: this.extubationReadinessDecision,
            airwayRemainedIntubated: this.patient.airway.intubated,
            ventilationRemainedDelivered: this.ventilator.delivering,
            tubeRemovalSimulated: false,
          });
        break;
      }
      case 'inhaled-bronchodilator': {
        const doseMg = AnesthesiaEngine.finiteAmount(action.payload.doseMg);
        const active = this.bronchospasmSeverity > 0.05;
        if (action.payload.agentId !== 'salbutamol' || action.payload.route !== 'nebulized'
          || doseMg !== 5 || !active || this.salbutamolTotalMg + doseMg > 10) {
          this.log('warning', 'drug', `bronchodilator-refused-${this.currentTick}`,
            !active
              ? 'The bounded bronchodilator action is available only during modeled lower-airway obstruction.'
              : 'The adult teaching action requires 5 mg nebulized salbutamol and no more than 10 mg cumulatively. Nothing was given.');
          break;
        }
        this.salbutamolTotalMg += doseMg;
        this.lastSalbutamolTick = this.currentTick;
        this.bronchodilatorEffectFraction = clamp(
          this.bronchodilatorEffectFraction + 0.65, 0, 1,
        );
        this.log('warning', 'drug', `salbutamol-nebulized-${this.currentTick}`,
          `Salbutamol ${doseMg} mg nebulized. Delivery and bronchodilation are bounded teaching effects, not an individual prediction.`, {
            drugId: 'salbutamol', route: 'nebulized', doseMg,
            cumulativeDoseMg: this.salbutamolTotalMg, teachingModel: true,
          });
        break;
      }
      case 'epinephrine': {
        const dose = AnesthesiaEngine.finiteAmount(action.payload.doseMicrograms);
        const duringLast = this.localAnestheticToxicitySeverity > 0;
        const minimum = duringLast ? 0 : EPINEPHRINE_IV_BOUNDS.minMicrograms;
        const maximum = duringLast ? this.covariates.weightKg : EPINEPHRINE_IV_BOUNDS.maxMicrograms;
        if (action.payload.route !== 'iv' || dose === null || dose <= minimum || dose > maximum) {
          this.log('warning', 'drug', `bad-epinephrine-${this.currentTick}`,
            `IV epinephrine must be a finite ${duringLast ? 'dose greater than 0 and no more than' : `${EPINEPHRINE_IV_BOUNDS.minMicrograms} to`} `
            + `${maximum.toFixed(0)} micrograms in this scenario. `
            + 'Nothing was given.');
          break;
        }
        this.epinephrineEffect = clamp(this.epinephrineEffect + dose / 100, 0, 1);
        this.epinephrineTotalMicrograms += dose;
        this.lastEpinephrineTick = this.currentTick;
        this.log('warning', 'drug', `epinephrine-iv-${this.currentTick}`,
          `Epinephrine ${dose} micrograms IV given for perioperative resuscitation. `
          + 'The response is an Open Sim Lab teaching effect, not an individual prediction.',
          { drugId: 'epinephrine', route: 'iv', doseMicrograms: dose, teachingModel: true });
        break;
      }
      case 'inject-crisis': {
        const crisisId = String(action.payload.crisisId ?? '');
        const supported = [
          'massive-hemorrhage', 'anaphylaxis', 'laryngospasm', 'bronchospasm',
          'malignant-hyperthermia', 'local-anesthetic-systemic-toxicity',
          'cardiac-arrest-shockable', 'cardiac-arrest-non-shockable',
          'tiva-line-disconnection-under-paralysis', 'high-spinal', 'air-embolism',
        ];
        if (!supported.includes(crisisId) || this.injectedCrises.has(crisisId)) {
          this.log('warning', 'crisis-injector', `bad-crisis-injection-${this.currentTick}`,
            !supported.includes(crisisId)
              ? `The manual crisis injector does not implement "${crisisId}" in this slice. Nothing changed.`
              : `The manual crisis "${crisisId}" has already been injected in this session. Nothing changed.`,
            { crisisId });
          break;
        }
        if (crisisId === 'laryngospasm' && this.patient.airway.intubated) {
          this.log('warning', 'crisis-injector', `bad-crisis-injection-${this.currentTick}`,
            'Manual laryngospasm cannot close an airway already secured by a tracheal tube. Nothing changed.',
            { crisisId });
          break;
        }
        this.injectedCrises.add(crisisId);
        this.lastInjectedCrisis = { crisisId, tick: this.currentTick };
        this.log('critical', 'crisis-injector', `crisis-injected-${crisisId}-${this.currentTick}`,
          `Manual crisis injected: ${crisisId.replaceAll('-', ' ')}. This author tool is recorded in the transcript.`,
          { crisisId, manualInjection: true });
        switch (crisisId) {
          case 'massive-hemorrhage':
            this.injectedBloodLossMlPerMin = 100;
            break;
          case 'anaphylaxis':
            this.triggerAnaphylaxis('manual-trigger', 1, `manual-anaphylaxis-${this.currentTick}`);
            break;
          case 'laryngospasm':
            this.upperAirwayClosureFraction = 1;
            break;
          case 'bronchospasm':
            this.injectedBronchospasmSeverity = 0.85;
            break;
          case 'malignant-hyperthermia':
            this.malignantHyperthermiaSusceptibility = 1;
            this.lastExposure = { agentId: 'manual-mh-susceptibility', tick: this.currentTick };
            break;
          case 'local-anesthetic-systemic-toxicity':
            this.localAnestheticToxicitySeverity = 0.9;
            this.lastExposure = { agentId: 'manual-local-anesthetic-exposure', tick: this.currentTick };
            break;
          case 'cardiac-arrest-shockable':
            this.rhythm = 'ventricular-fibrillation';
            this.startScriptedCardiacArrest();
            break;
          case 'cardiac-arrest-non-shockable':
            this.rhythm = 'asystole';
            this.startScriptedCardiacArrest();
            break;
          case 'tiva-line-disconnection-under-paralysis':
            this.hypnoticLineConnected = false;
            this.hypnoticLineInspected = false;
            break;
          case 'high-spinal':
            this.highSpinalSeverity = 1;
            this.lastExposure = { agentId: 'manual-high-neuraxial-block', tick: this.currentTick };
            break;
          case 'air-embolism':
            this.venousAirEmbolismSeverity = 1;
            this.venousAirEntryControlled = false;
            this.venousAirEntryControlledAtTick = null;
            this.lastExposure = { agentId: 'manual-venous-air-entry', tick: this.currentTick };
            break;
        }
        break;
      }
      case 'neuromuscular-reversal': {
        const agent = action.payload.agent;
        const route = action.payload.route;
        const dose = Number(action.payload.doseMgPerKg);
        const count = Number(this.lastState.trainOfFourCount ?? 4);
        const ratio = Number(this.lastState.trainOfFourRatio ?? 1);
        const hasRocuronium = this.drugs.has('rocuronium');
        const rawEffectSite = this.drugs.get('rocuronium')?.solver.effectSite ?? 0;
        const peakEffectSite = this.lastEffectSitePeak.get('rocuronium') ?? 0;
        // The same count or ratio can occur briefly while block is developing and later while it
        // recovers. Depth-matched antagonism in this bounded model applies only on the descending
        // limb; otherwise an onset value could be mistaken for recovery and credited incorrectly.
        const recoveryPhase = peakEffectSite > 0 && rawEffectSite < peakEffectSite * 0.999999;
        if (!hasRocuronium || route !== 'iv'
          || (agent !== 'sugammadex' && agent !== 'neostigmine')) {
          this.log('warning', 'drug', `bad-neuromuscular-reversal-${this.currentTick}`,
            'Neuromuscular reversal requires modeled rocuronium, an IV route, and a supported agent. Nothing was given.');
          break;
        }
        if (agent === 'sugammadex') {
          const validDose = Number.isFinite(dose)
            && recoveryPhase
            && ((count >= 1 && dose === 2)
              || (count === 0 && this.postTetanicCount >= 1 && dose === 4));
          if (!validDose || ratio >= 0.9) {
            this.log('warning', 'drug', `bad-sugammadex-${this.currentTick}`,
              'Sugammadex requires recovering block: 2 mg/kg with at least one train-of-four twitch, or 4 mg/kg with no twitches and a post-tetanic count of at least one. Nothing was given.');
            break;
          }
          this.neuromuscularReversalFraction = Math.max(this.neuromuscularReversalFraction, 0.995);
          this.lastNeuromuscularReversal = { agent, doseMgPerKg: dose, tick: this.currentTick };
          this.log('info', 'drug', `sugammadex-${this.currentTick}`,
            `Sugammadex ${dose} mg/kg IV accepted for the observed block depth. Recovery is a bounded teaching effect; confirm a quantitative train-of-four ratio of at least 0.9.`,
            {
              agent, route, doseMgPerKg: dose, trainOfFourCount: count,
              trainOfFourRatio: ratio, postTetanicCount: this.postTetanicCount,
              recoveryPhase: true,
            });
          break;
        }
        const antimuscarinic = action.payload.antimuscarinic === true;
        const minimalBlock = recoveryPhase && count === 4 && ratio >= 0.4 && ratio < 0.9;
        if (!antimuscarinic || !minimalBlock) {
          this.log('warning', 'drug', `bad-neostigmine-${this.currentTick}`,
            'Neostigmine requires coadministration with an antimuscarinic and recovering minimal block: four train-of-four twitches with a quantitative ratio from 0.4 to below 0.9. Nothing was given.');
          break;
        }
        this.neuromuscularReversalFraction = Math.max(
          this.neuromuscularReversalFraction, 0.9,
        );
        this.lastNeuromuscularReversal = { agent, doseMgPerKg: null, tick: this.currentTick };
        this.log('info', 'drug', `neostigmine-${this.currentTick}`,
          'Neostigmine with an antimuscarinic IV was accepted during minimal block as an agent-class teaching action. Dose pharmacology is not modeled; quantitative recovery must still reach at least 0.9.',
          {
            agent, route, antimuscarinic, trainOfFourCount: count,
            trainOfFourRatio: ratio, recoveryPhase: true, teachingModel: true,
          });
        break;
      }
      case 'chest-compressions': {
        const active = action.payload.active;
        if (!this.cardiacArrestActive || typeof active !== 'boolean') {
          this.log('warning', 'resuscitation', `bad-compressions-${this.currentTick}`,
            'Chest compressions require an active scripted cardiac arrest and an explicit start or stop request. Nothing changed.');
          break;
        }
        this.chestCompressionsActive = active;
        if (active) this.lastChestCompressionTick = this.currentTick;
        this.log('critical', 'resuscitation', `chest-compressions-${active ? 'start' : 'stop'}-${this.currentTick}`,
          `${active ? 'Started' : 'Stopped'} modeled chest compressions at a fixed 110/min. Depth, recoil, pauses, fatigue, and physical skill are not modeled.`,
          { active, ratePerMin: 110, teachingModel: true });
        break;
      }
      case 'cardiac-arrest-epinephrine': {
        const doseMg = AnesthesiaEngine.finiteAmount(action.payload.doseMg);
        if (!this.cardiacArrestActive || (action.payload.route !== 'iv' && action.payload.route !== 'io')
          || doseMg !== 1 || this.arrestEpinephrineTotalMg > 0) {
          this.log('warning', 'drug', `bad-arrest-epinephrine-${this.currentTick}`,
            'This bounded cardiac-arrest action requires an active scripted arrest, exactly 1 mg by the IV or IO route, and no prior accepted arrest dose. Nothing was given.');
          break;
        }
        this.arrestEpinephrineTotalMg += doseMg;
        this.lastArrestEpinephrineTick = this.currentTick;
        this.log('critical', 'drug', `cardiac-arrest-epinephrine-${this.currentTick}`,
          `Epinephrine ${doseMg} mg ${String(action.payload.route).toUpperCase()} given during modeled cardiac arrest. Drug kinetics and individual outcome are not predicted.`,
          { drugId: 'epinephrine', route: String(action.payload.route), doseMg, teachingModel: true });
        break;
      }
      case 'defibrillation': {
        const energyJ = AnesthesiaEngine.finiteAmount(action.payload.energyJ);
        if (!this.cardiacArrestActive || action.payload.waveform !== 'biphasic'
          || energyJ === null || energyJ <= 0) {
          this.log('warning', 'resuscitation', `bad-defibrillation-${this.currentTick}`,
            'Defibrillation requires an active scripted cardiac arrest, the declared biphasic waveform, and a finite positive energy selection. No shock was delivered.');
          break;
        }
        this.defibrillationShockCount += 1;
        this.lastDefibrillationEnergyJ = energyJ;
        const shockable = this.rhythm === 'ventricular-fibrillation';
        const recentCompressions = this.lastChestCompressionTick !== null
          && this.currentTick - this.lastChestCompressionTick <= 10 * TICKS_PER_SECOND;
        const converts = shockable && energyJ === 200 && recentCompressions
          && this.arrestEpinephrineTotalMg >= 1;
        this.log(converts ? 'critical' : 'warning', 'resuscitation', `defibrillation-${this.currentTick}`,
          `Biphasic defibrillation delivered at ${energyJ} J with a modeled brief clearance pause. ${!shockable
            ? 'The non-shockable rhythm did not convert.'
            : converts ? 'The bounded teaching case converted to an organized rhythm.'
              : 'VF persisted; the case requires recent preceding compressions, accepted 1 mg IV/IO epinephrine, and the declared 200 J device setting.'}`,
          { energyJ, rhythmBefore: this.rhythm, converted: converts, teachingModel: true });
        if (converts) {
          this.rhythm = 'sinus';
          this.cardiacArrestActive = false;
          this.chestCompressionsActive = false;
          this.roscAtTick = this.currentTick;
          this.log('critical', 'rhythm', `rosc-${this.currentTick}`,
            'An organized rhythm with modeled return of spontaneous circulation is present. Post-arrest care and individual outcome are outside this case.',
            { rhythm: 'sinus', teachingModel: true });
        }
        break;
      }
      case 'seizure-suppression': {
        if (action.payload.route !== 'iv' || action.payload.medicationClass !== 'benzodiazepine'
          || this.localAnestheticToxicitySeverity <= 0 || this.seizureActivityFraction <= 0) {
          this.log('warning', 'drug', `bad-seizure-suppression-${this.currentTick}`,
            'This bounded LAST action requires active modeled local-anesthetic seizure activity and an IV benzodiazepine. No treatment was given.');
          break;
        }
        this.seizureSuppressed = true;
        this.log('warning', 'drug', `seizure-suppression-${this.currentTick}`,
          'IV benzodiazepine seizure suppression given. Drug selection, dose, kinetics, and physical administration are not modeled.',
          { medicationClass: 'benzodiazepine', route: 'iv', teachingModel: true });
        break;
      }
      case 'lipid-emulsion': {
        const concentration = AnesthesiaEngine.finiteAmount(action.payload.concentrationPercent);
        if (action.payload.route !== 'iv' || action.payload.protocol !== 'initial'
          || concentration !== LAST_LIPID_CONCENTRATION_PERCENT
          || this.localAnestheticToxicitySeverity <= 0 || this.lipidEmulsionInfusionMlPerMin > 0) {
          this.log('warning', 'drug', `bad-lipid-emulsion-${this.currentTick}`,
            'Initial lipid rescue requires an active modeled toxicity event, 20% lipid emulsion, the IV route, and no infusion already running. Nothing was started.');
          break;
        }
        const protocol = lastLipidProtocolForWeight(this.covariates.weightKg);
        this.lipidEmulsionBolusRemainingMl = protocol.initialBolusMl;
        this.lipidEmulsionInfusionMlPerMin = protocol.infusionMlPerMin;
        this.lipidEmulsionInfusionStartedAtTick = this.currentTick;
        this.lipidEmulsionEffectFraction = 0;
        this.lastLipidEmulsionTick = this.currentTick;
        this.log('warning', 'drug', `lipid-emulsion-${this.currentTick}`,
          `20% lipid emulsion started: ${protocol.initialBolusMl.toFixed(0)} mL initial bolus over `
          + `${LAST_LIPID_BOLUS_SECONDS / 60} modeled minutes and `
          + `${protocol.infusionMlPerMin.toFixed(1)} mL/min infusion (${protocol.band}). `
          + `The ${protocol.maxTotalMl.toFixed(0)} mL cumulative cap and response are teaching-model bounds.`, {
            concentrationPercent: LAST_LIPID_CONCENTRATION_PERCENT,
            initialBolusMl: protocol.initialBolusMl,
            infusionMlPerMin: protocol.infusionMlPerMin,
            maxTotalMl: protocol.maxTotalMl,
            weightBand: protocol.band,
            teachingModel: true,
          });
        break;
      }
      case 'dantrolene': {
        const dose = AnesthesiaEngine.finiteAmount(action.payload.doseMgPerKg);
        if (action.payload.route !== 'iv' || dose !== DANTROLENE_DOSE_MG_PER_KG) {
          this.log('warning', 'drug', `bad-dantrolene-${this.currentTick}`,
            `Dantrolene must be a finite ${DANTROLENE_DOSE_MG_PER_KG} mg/kg IV bolus in this `
            + 'initial-response model. Nothing was given.');
          break;
        }
        const actualMg = dose * this.covariates.weightKg;
        this.dantroleneTotalMg += actualMg;
        const hasActiveCrisis = this.malignantHyperthermiaActivation >= 0.05;
        if (hasActiveCrisis) {
          this.dantroleneEffectFraction = clamp(this.dantroleneEffectFraction + 0.6, 0, 1);
          this.malignantHyperthermiaActivation *= 0.4;
        }
        this.lastDantroleneTick = this.currentTick;
        this.log('warning', 'drug', `dantrolene-iv-${this.currentTick}`,
          `Dantrolene ${dose} mg/kg IV (${actualMg.toFixed(0)} mg) given. The crisis response is `
          + (hasActiveCrisis
            ? 'an Open Sim Lab teaching effect, not an individual prediction.'
            : 'No active hypermetabolic response was present, so prophylactic effect is not modeled.'), {
            drugId: 'dantrolene', route: 'iv', doseMgPerKg: dose, actualMg,
            effectApplied: hasActiveCrisis, teachingModel: true,
          });
        break;
      }
      case 'active-cooling': {
        if (typeof action.payload.active !== 'boolean') {
          this.log('warning', 'equipment', `bad-active-cooling-${this.currentTick}`,
            'Active cooling requires an on or off setting. It was left unchanged.');
          break;
        }
        if (action.payload.active && (this.lastState.coreTemperatureC ?? 0) <= 39) {
          this.log('warning', 'equipment', `early-active-cooling-${this.currentTick}`,
            'Active cooling was not started at or below 39 °C in this bounded model. Treat the '
            + 'hypermetabolic crisis first and reassess core temperature.');
          break;
        }
        this.activeCooling = action.payload.active;
        this.log('info', 'equipment', `active-cooling-${this.currentTick}`,
          `Active cooling ${this.activeCooling ? 'started' : 'stopped'}.`,
          { active: this.activeCooling, teachingModel: true });
        break;
      }
      case 'fluid': {
        if (this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'right-ventricular-infarction')) {
          this.log('warning', 'fluid', `right-ventricular-infarction-fluid-refused-${this.currentTick}`,
            'This focused lesson does not offer a blind or fixed fluid bolus. No fluid was given.');
          break;
        }
        const fluidId = String(action.payload.fluidId ?? '');
        const fluid = getFluid(fluidId);
        const volumeMl = AnesthesiaEngine.finiteAmount(action.payload.volumeMl);
        if (!fluid || volumeMl === null || volumeMl < 1 || volumeMl > MAX_FLUID_BOLUS_ML) {
          this.log('warning', 'fluid', `bad-fluid-${this.currentTick}`,
            !fluid
              ? `This build does not stock a fluid called "${fluidId}". Nothing was given.`
              : `A fluid volume of "${String(action.payload.volumeMl)}" is not usable. Enter 1 to `
                + `${MAX_FLUID_BOLUS_ML} mL. Nothing was given.`);
          break;
        }
        this.pendingCrystalloidMl += volumeMl;
        this.crystalloidTotalMl += volumeMl;
        this.log('info', 'fluid', `fluid-${fluid.id}-${this.currentTick}`,
          `${fluid.name} ${volumeMl} mL given. The model retains ${fluid.retainedFraction * 100}% intravascularly.`,
          { fluidId: fluid.id, volumeMl, retainedFraction: fluid.retainedFraction, teachingModel: true });
        break;
      }
      case 'blood-bank-request': {
        const hemorrhageActive = this.running.some((event) => event.type === 'blood-loss')
          || this.injectedBloodLossMlPerMin > 0;
        if (!hemorrhageActive || this.scenario.patient.ageYears < 18 || this.bloodProductsReleased) {
          this.log('warning', 'blood-product', `bad-blood-bank-request-${this.currentTick}`,
            !hemorrhageActive
              ? 'The bounded blood-bank request is available only while modeled hemorrhage is active.'
              : this.scenario.patient.ageYears < 18
                ? 'A blood-bank workflow is not included in this bounded pediatric induction case.'
                : 'The bounded blood-bank request has already been accepted.');
          break;
        }
        this.bloodProductsReleased = true;
        this.log('info', 'blood-product', `blood-bank-release-${this.currentTick}`,
          'Blood products released. This teaching handoff assumes appropriately selected products arrive immediately; specimen collection, compatibility testing, inventory, and local emergency-release policy are not modeled.', {
            teachingModel: true,
            immediateRelease: true,
            compatibilityModeled: false,
          });
        break;
      }
      case 'blood-product': {
        const productId = String(action.payload.productId ?? '');
        const product = getBloodProduct(productId);
        const units = AnesthesiaEngine.finiteAmount(action.payload.units);
        const totalForProduct = product?.kind === 'plasma'
          ? this.freshFrozenPlasmaUnits : this.packedRedBloodCellUnits;
        const permittedUnits = product?.kind === 'plasma'
          ? product.presetsUnits.includes(units ?? -1)
          : units !== null && units <= MAX_PRBC_UNITS_PER_ACTION;
        const hemorrhageActive = this.running.some((event) => event.type === 'blood-loss')
          || this.injectedBloodLossMlPerMin > 0;
        const invalid = !product || units === null || !Number.isInteger(units)
          || units < 1 || !permittedUnits
          || totalForProduct + units > product.maxUnitsTotal
          || this.scenario.patient.ageYears < 18
          || !hemorrhageActive
          || !this.bloodProductsReleased
          || (product.kind === 'plasma' && !this.coagulationPanelReported);
        if (invalid) {
          this.log('warning', 'blood-product', `bad-blood-product-${this.currentTick}`,
            !product
              ? `This build does not stock a blood product called "${productId}". Nothing was given.`
              : this.scenario.patient.ageYears < 18
                ? 'Blood products are not stocked in this bounded pediatric induction case.'
                : !hemorrhageActive
                  ? 'Blood products are stocked only while modeled hemorrhage is active.'
                  : !this.bloodProductsReleased
                    ? 'Request the bounded blood-bank release before selecting a blood product.'
                  : product.kind === 'plasma' && !this.coagulationPanelReported
                    ? 'Request the bounded coagulation panel before selecting fresh frozen plasma.'
                  : `${product.name} requires one listed whole-unit preset and no more than ${product.maxUnitsTotal} units cumulatively. Nothing was given.`);
          break;
        }
        if (product.kind === 'red-cells') {
          this.pendingPackedRedCellUnits += units;
          this.pendingPackedRedCellVolumeMl += units * product.volumeMlPerUnit;
          this.pendingPackedRedCellHemoglobinG += units * product.hemoglobinGPerUnit;
          this.packedRedBloodCellUnits += units;
        } else {
          this.pendingFreshFrozenPlasmaVolumeMl += units * product.volumeMlPerUnit;
          this.freshFrozenPlasmaUnits += units;
        }
        this.bloodProductTotalMl += units * product.volumeMlPerUnit;
        break;
      }
      case 'coagulation-labs': {
        const hemorrhageActive = this.running.some((event) => event.type === 'blood-loss')
          || this.injectedBloodLossMlPerMin > 0;
        if (!hemorrhageActive) {
          this.log('warning', 'laboratory', `bad-coagulation-labs-${this.currentTick}`,
            'The bounded coagulation panel is available only while modeled hemorrhage is active.');
          break;
        }
        this.coagulationPanelReported = true;
        this.log('info', 'laboratory', `coagulation-labs-${this.currentTick}`,
          `Coagulation panel: prothrombin time ratio ${(this.lastState.prothrombinTimeRatio ?? 1).toFixed(2)} × normal; fibrinogen ${(this.lastState.fibrinogenGPerL ?? 3).toFixed(1)} g/L. Results are immediate bounded teaching values.`, {
            prothrombinTimeRatio: this.lastState.prothrombinTimeRatio ?? 1,
            fibrinogenGPerL: this.lastState.fibrinogenGPerL ?? 3,
            teachingModel: true,
          });
        break;
      }
      case 'hypnotic-line': {
        const lineAction = action.payload.action;
        if (lineAction === 'inspect') {
          this.hypnoticLineInspected = true;
          this.log(
            this.hypnoticLineConnected ? 'info' : 'warning', 'equipment',
            `hypnotic-line-inspect-${this.currentTick}`,
            this.hypnoticLineConnected
              ? 'The propofol infusion line was inspected and is connected.'
              : 'The propofol infusion line was inspected and is disconnected. The pump setting '
                + 'has not been reaching the patient.',
            { connected: this.hypnoticLineConnected },
          );
          break;
        }
        if (lineAction === 'reconnect') {
          const wasConnected = this.hypnoticLineConnected;
          this.hypnoticLineConnected = true;
          this.hypnoticLineInspected = true;
          const propofol = this.drugs.get('propofol');
          this.log('info', 'equipment', `hypnotic-line-reconnect-${this.currentTick}`,
            wasConnected
              ? 'The propofol infusion line was already connected. Its delivery is unchanged.'
              : 'The propofol infusion line was reconnected. The pump is again delivering its '
                + 'unchanged commanded rate.', {
              connected: true, commandedRate: propofol?.infusionRate ?? 0,
            });
          break;
        }
        this.log('warning', 'equipment', `bad-hypnotic-line-action-${this.currentTick}`,
          `Unknown propofol infusion line action "${String(lineAction)}". Inspect or reconnect the line.`);
        break;
      }
      case 'airway-maneuver': {
        if (action.payload.maneuver !== 'jaw-thrust-cpap') {
          this.log('warning', 'airway', `bad-airway-maneuver-${this.currentTick}`,
            `Unknown airway maneuver "${String(action.payload.maneuver)}". Nothing was applied.`);
          break;
        }
        this.jawThrustCpapUntilTick = this.currentTick
          + JAW_THRUST_CPAP_SECONDS * TICKS_PER_SECOND;
        this.log('info', 'airway', `jaw-thrust-cpap-${this.currentTick}`,
          `Jaw thrust with continuous positive airway pressure started for ${JAW_THRUST_CPAP_SECONDS} seconds.`,
          { maneuver: 'jaw-thrust-cpap', durationSeconds: JAW_THRUST_CPAP_SECONDS });
        break;
      }
      case 'opioid-ventilatory-response': {
        const active = this.opioidVentilatoryImpairmentSeverity > 0.05
          || this.opioidVentilatoryImpairmentTarget > 0.05;
        const response = action.payload.response;
        if (!active || !['hold-further-opioid', 'record-naloxone-titration'].includes(String(response))) {
          this.log('warning', 'drug', `opioid-response-refused-${this.currentTick}`,
            !active
              ? 'No active modeled opioid ventilatory impairment is available for this response.'
              : 'The opioid ventilatory response was not one of the listed choices. Nothing changed.');
          break;
        }
        if (response === 'hold-further-opioid') {
          if (this.furtherOpioidHeldAtTick !== null) {
            this.log('warning', 'drug', `opioid-hold-refused-${this.currentTick}`,
              'Further opioid has already been held in this teaching response.');
            break;
          }
          this.furtherOpioidHeldAtTick = this.currentTick;
          this.log('warning', 'drug', `further-opioid-held-${this.currentTick}`,
            'Further opioid administration held. The prior exposure is a fixed scenario fact; no morphine pharmacokinetics or pain response is modeled.');
          break;
        }
        if (this.furtherOpioidHeldAtTick === null) {
          this.log('warning', 'drug', `naloxone-order-refused-${this.currentTick}`,
            'Hold further opioid before recording naloxone titration intent.');
          break;
        }
        if (this.naloxoneIntentAtTick !== null) {
          this.log('warning', 'drug', `naloxone-intent-refused-${this.currentTick}`,
            'Naloxone titration intent has already been recorded.');
          break;
        }
        this.naloxoneIntentAtTick = this.currentTick;
        this.opioidVentilatoryImpairmentTarget = 0;
        this.log('warning', 'drug', `naloxone-titration-intent-${this.currentTick}`,
          'Naloxone titration intent recorded. Dose, route, administration, analgesia, withdrawal, recurrence, and individual response are not modeled.', {
            doseModeled: false, teachingTrajectory: true,
          });
        break;
      }
      case 'thermal-response': {
        const response = action.payload.response;
        if (this.perioperativeTemperatureTargetC === null
          || !['confirm-core-temperature', 'start-forced-air-warming', 'record-warmed-bulk-fluids']
            .includes(String(response))) {
          this.log('warning', 'equipment', `thermal-response-refused-${this.currentTick}`,
            this.perioperativeTemperatureTargetC === null
              ? 'No active modeled perioperative thermal course is available for this response.'
              : 'The thermal response was not one of the listed choices. Nothing changed.');
          break;
        }
        if (response === 'confirm-core-temperature') {
          if (this.coreTemperatureConfirmedAtTick !== null) {
            this.log('warning', 'equipment', `temperature-confirmation-refused-${this.currentTick}`,
              'Core temperature has already been confirmed in this teaching response.');
            break;
          }
          this.coreTemperatureConfirmedAtTick = this.currentTick;
          this.log('warning', 'equipment', `core-temperature-confirmed-${this.currentTick}`,
            `Core temperature confirmed at ${(this.lastState.coreTemperatureC ?? 0).toFixed(1)}°C. Measurement site and technique are not simulated.`);
          break;
        }
        if (this.coreTemperatureConfirmedAtTick === null) {
          this.log('warning', 'equipment', `thermal-order-refused-${this.currentTick}`,
            'Confirm core temperature before recording a warming response.');
          break;
        }
        if (response === 'start-forced-air-warming') {
          if (this.forcedAirWarmingAtTick !== null) {
            this.log('warning', 'equipment', `forced-air-warming-refused-${this.currentTick}`,
              'Active surface warming has already been recorded.');
            break;
          }
          this.forcedAirWarmingAtTick = this.currentTick;
          this.perioperativeTemperatureTargetC = 36.6;
          this.log('warning', 'equipment', `forced-air-warming-started-${this.currentTick}`,
            'Active surface warming started. Device settings, skin contact, heat transfer, and individual rewarming time are not modeled.');
          break;
        }
        if (this.warmedBulkFluidsAtTick !== null) {
          this.log('warning', 'equipment', `warmed-bulk-fluids-refused-${this.currentTick}`,
            'Bulk-fluid warming intent has already been recorded.');
          break;
        }
        this.warmedBulkFluidsAtTick = this.currentTick;
        this.log('warning', 'equipment', `warmed-bulk-fluids-recorded-${this.currentTick}`,
          'The fixed 700 mL remaining crystalloid exposure will use a fluid warmer. Delivery mechanics and heat transfer are not modeled.');
        break;
      }
      case 'glycemic-response': {
        const response = action.payload.response;
        if (this.hyperglycemicGlucoseMgPerDl === null
          || !['confirm-point-of-care-glucose', 'record-insulin-protocol-intent',
            'repeat-point-of-care-glucose'].includes(String(response))) {
          this.log('warning', 'equipment', `glycemic-response-refused-${this.currentTick}`,
            this.hyperglycemicGlucoseMgPerDl === null
              ? 'No active modeled perioperative hyperglycemic course is available for this response.'
              : 'The glycemic response was not one of the listed choices. Nothing changed.');
          break;
        }
        if (response === 'confirm-point-of-care-glucose') {
          if (this.pointOfCareGlucoseConfirmedAtTick !== null) {
            this.log('warning', 'equipment', `glucose-confirmation-refused-${this.currentTick}`,
              'The point-of-care glucose has already been confirmed.');
            break;
          }
          this.pointOfCareGlucoseConfirmedAtTick = this.currentTick;
          this.log('warning', 'equipment', `point-of-care-glucose-confirmed-${this.currentTick}`,
            `Point-of-care glucose confirmed at ${this.hyperglycemicGlucoseMgPerDl.toFixed(0)} mg/dL. Sampling and device performance are not simulated.`,
            { glucoseMgPerDl: this.hyperglycemicGlucoseMgPerDl });
          break;
        }
        if (this.pointOfCareGlucoseConfirmedAtTick === null) {
          this.log('warning', 'equipment', `glycemic-order-refused-${this.currentTick}`,
            'Confirm the point-of-care glucose before recording the institutional insulin response.');
          break;
        }
        if (response === 'record-insulin-protocol-intent') {
          if (this.insulinProtocolIntentAtTick !== null) {
            this.log('warning', 'equipment', `insulin-protocol-refused-${this.currentTick}`,
              'Institutional insulin-protocol intent has already been recorded.');
            break;
          }
          this.insulinProtocolIntentAtTick = this.currentTick;
          this.log('warning', 'equipment', `insulin-protocol-intent-recorded-${this.currentTick}`,
            'Institutional insulin-protocol intent recorded with a 100–180 mg/dL perioperative target. Dose selection, delivery, electrolytes, and hypoglycemia rescue are not modeled.');
          break;
        }
        if (this.insulinProtocolIntentAtTick === null) {
          this.log('warning', 'equipment', `glycemic-reassessment-refused-${this.currentTick}`,
            'Record the institutional insulin response before the repeat point-of-care check.');
          break;
        }
        if (this.repeatPointOfCareAtTick !== null) {
          this.log('warning', 'equipment', `repeat-glucose-refused-${this.currentTick}`,
            'The bounded repeat point-of-care glucose has already been recorded.');
          break;
        }
        if (this.currentTick - this.insulinProtocolIntentAtTick < 18_000) {
          this.log('warning', 'equipment', `repeat-glucose-too-early-${this.currentTick}`,
            'The bounded repeat point-of-care check is not available until 30 simulated minutes after insulin-protocol intent.');
          break;
        }
        this.repeatPointOfCareAtTick = this.currentTick;
        this.repeatPointOfCareGlucoseMgPerDl = 174;
        this.log('warning', 'equipment', `repeat-point-of-care-glucose-${this.currentTick}`,
          'Repeat point-of-care glucose recorded at 174 mg/dL. This fixed response does not predict an individual insulin effect.',
          { glucoseMgPerDl: 174 });
        break;
      }
      case 'cied-planning-assessment': {
        const supported = this.scenario.timeline.some(
          (event) => event.type === 'narrative' && event.target === 'cied-cautery-planning',
        );
        const response = String(action.payload.action ?? '');
        const valid = [
          'review-device-record', 'review-procedure-emi', 'coordinate-asynchronous-pacing',
          'apply-unverified-magnet', 'proceed-no-change', 'document-backup-and-restoration',
        ].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `cied-planning-refused-${this.currentTick}`,
            supported
              ? 'The CIED-planning action was not one of the listed choices. No decision was recorded.'
              : 'The bounded CIED-planning choices are available only in the declared lesson.');
          break;
        }
        if (response === 'review-device-record') {
          if (this.ciedDeviceRecordReviewedAtTick !== null) {
            this.log('warning', 'assessment', `cied-device-review-refused-${this.currentTick}`,
              'The fixed device record has already been reviewed.');
            break;
          }
          this.ciedDeviceRecordReviewedAtTick = this.currentTick;
          this.log('advisory', 'assessment', `cied-device-record-reviewed-${this.currentTick}`,
            'Fixed record: left-pectoral transvenous dual-chamber pacemaker for complete atrioventricular block; pacing dependent; recent interrogation documents normal function and a manufacturer-specific asynchronous magnet response. No live interrogation is simulated.');
          break;
        }
        if (response === 'review-procedure-emi') {
          if (this.ciedProcedureRiskReviewedAtTick !== null) {
            this.log('warning', 'assessment', `cied-procedure-review-refused-${this.currentTick}`,
              'The fixed procedure and electromagnetic-interference pattern has already been reviewed.');
            break;
          }
          this.ciedProcedureRiskReviewedAtTick = this.currentTick;
          this.log('advisory', 'assessment', `cied-procedure-risk-reviewed-${this.currentTick}`,
            'Fixed procedure: right shoulder surgery above the umbilicus with anticipated monopolar electrosurgery. The current path and generator access require a patient-specific plan; technique and dispersive-electrode placement are not simulated.');
          break;
        }
        if (response === 'document-backup-and-restoration') {
          if (this.ciedPlan === null) {
            this.log('warning', 'assessment', `cied-restoration-order-refused-${this.currentTick}`,
              'Choose the coordinated device plan before documenting backup and restoration.');
            break;
          }
          if (this.ciedBackupAndRestorationDocumentedAtTick !== null) {
            this.log('warning', 'assessment', `cied-restoration-refused-${this.currentTick}`,
              'Backup and post-procedure restoration have already been documented.');
            break;
          }
          this.ciedBackupAndRestorationDocumentedAtTick = this.currentTick;
          this.log('advisory', 'assessment', `cied-backup-restoration-documented-${this.currentTick}`,
            'External pacing/defibrillation availability, continuous monitoring, and explicit restoration of preprocedure device settings before leaving monitored care were documented. Pad placement and device programming are not simulated.');
          break;
        }
        if (this.ciedDeviceRecordReviewedAtTick === null
          || this.ciedProcedureRiskReviewedAtTick === null) {
          this.log('warning', 'assessment', `cied-plan-order-refused-${this.currentTick}`,
            'Review both the device record and procedure electromagnetic-interference pattern before choosing a plan.');
          break;
        }
        if (this.ciedPlan !== null) {
          this.log('warning', 'assessment', `cied-plan-refused-${this.currentTick}`,
            'A CIED plan has already been recorded for this attempt.');
          break;
        }
        this.ciedPlan = response === 'coordinate-asynchronous-pacing'
          ? 'coordinate-asynchronous-pacing'
          : response === 'apply-unverified-magnet'
            ? 'apply-unverified-magnet' : 'proceed-no-change';
        this.ciedPlanAtTick = this.currentTick;
        this.log('advisory', 'assessment', `cied-plan-${response}-${this.currentTick}`,
          response === 'coordinate-asynchronous-pacing'
            ? 'Coordinated asynchronous pacing plan recorded with the CIED team before above-umbilicus electromagnetic interference. This does not perform programming or prescribe universal magnet use.'
            : response === 'apply-unverified-magnet'
              ? 'Unverified magnet use recorded. Magnet response is device specific and cannot replace record review and coordinated planning.'
              : 'No-change plan recorded despite pacing dependence and anticipated above-umbilicus electromagnetic interference.');
        break;
      }
      case 'postoperative-handoff-assessment': {
        const supported = this.scenario.timeline.some(
          (event) => event.type === 'narrative' && event.target === 'postoperative-handoff',
        );
        const response = String(action.payload.action ?? '');
        const valid = [
          'confirm-receiver-readiness', 'share-patient-and-course', 'share-current-state',
          'share-risks-actions-ownership', 'receiver-readback', 'accept-transfer',
        ].includes(response);
        if (!supported || !valid) {
          this.log('warning', 'assessment', `postoperative-handoff-refused-${this.currentTick}`,
            supported
              ? 'The postoperative-handoff action was not one of the listed choices. Nothing changed.'
              : 'The bounded postoperative-handoff choices are available only in the declared lesson.');
          break;
        }
        if (response === 'confirm-receiver-readiness') {
          if (this.postoperativeReceiverReadyAtTick !== null) {
            this.log('warning', 'assessment', `handoff-readiness-refused-${this.currentTick}`,
              'Receiver readiness has already been confirmed.');
            break;
          }
          this.postoperativeReceiverReadyAtTick = this.currentTick;
          this.log('advisory', 'assessment', `handoff-receiver-ready-${this.currentTick}`,
            'The receiving clinician is identified, monitoring is connected, immediate tasks are paused, and questions are invited. Staffing, workload, interruptions, and bedside setup are not simulated.');
          break;
        }
        if (this.postoperativeReceiverReadyAtTick === null) {
          this.log('warning', 'assessment', `handoff-order-refused-${this.currentTick}`,
            'Confirm receiver readiness before delivering or accepting the handoff.');
          break;
        }
        if (response === 'share-patient-and-course') {
          if (this.postoperativePatientAndCourseAtTick !== null) {
            this.log('warning', 'assessment', `handoff-course-refused-${this.currentTick}`,
              'The fixed patient and perioperative course have already been shared.');
            break;
          }
          this.postoperativePatientAndCourseAtTick = this.currentTick;
          this.log('advisory', 'assessment', `handoff-patient-course-shared-${this.currentTick}`,
            'Patient and course: 64-year-old after open right hemicolectomy; video laryngoscopy after one unsuccessful direct attempt; estimated blood loss 750 mL; 1,800 mL crystalloid; no blood products; cefazolin given; no recorded allergy.');
          break;
        }
        if (response === 'share-current-state') {
          if (this.postoperativeCurrentStateAtTick !== null) {
            this.log('warning', 'assessment', `handoff-current-state-refused-${this.currentTick}`,
              'The fixed current state has already been shared.');
            break;
          }
          this.postoperativeCurrentStateAtTick = this.currentTick;
          this.log('advisory', 'assessment', `handoff-current-state-shared-${this.currentTick}`,
            'Current state: awake to voice, airway patent, spontaneous breathing on 3 L/min nasal oxygen, stable circulation, temperature 36.6°C, pain 4/10, mild nausea, abdominal dressing dry, and two peripheral IVs patent. These are fixed findings.');
          break;
        }
        if (response === 'share-risks-actions-ownership') {
          if (this.postoperativePatientAndCourseAtTick === null
            || this.postoperativeCurrentStateAtTick === null) {
            this.log('warning', 'assessment', `handoff-risk-order-refused-${this.currentTick}`,
              'Share both the patient/course and current state before unresolved risks, actions, timing, and ownership.');
            break;
          }
          if (this.postoperativeRisksActionsOwnershipAtTick !== null) {
            this.log('warning', 'assessment', `handoff-risk-refused-${this.currentTick}`,
              'Risks, actions, timing, and ownership have already been shared.');
            break;
          }
          this.postoperativeRisksActionsOwnershipAtTick = this.currentTick;
          this.log('advisory', 'assessment', `handoff-risks-actions-ownership-shared-${this.currentTick}`,
            'Risks and ownership: obstructive sleep apnea plus recent opioid exposure require continued respiratory observation; repeat hemoglobin is due in 30 minutes; nausea and pain need reassessment; the PACU clinician owns those tasks after accepted transfer, with anesthesia immediately available for escalation.');
          break;
        }
        if (response === 'receiver-readback') {
          if (this.postoperativeRisksActionsOwnershipAtTick === null) {
            this.log('warning', 'assessment', `handoff-readback-order-refused-${this.currentTick}`,
              'Complete the critical content and ownership before receiver synthesis.');
            break;
          }
          if (this.postoperativeReceiverReadbackAtTick !== null) {
            this.log('warning', 'assessment', `handoff-readback-refused-${this.currentTick}`,
              'Receiver synthesis has already been recorded.');
            break;
          }
          this.postoperativeReceiverReadbackAtTick = this.currentTick;
          this.log('advisory', 'assessment', `handoff-receiver-readback-${this.currentTick}`,
            'Receiver synthesis recorded: airway difficulty, respiratory risk, 30-minute hemoglobin, symptom reassessment, task ownership, and escalation route were repeated back; questions were invited. Communication quality is not inferred.');
          break;
        }
        if (this.postoperativeReceiverReadbackAtTick === null) {
          this.log('warning', 'assessment', `handoff-acceptance-order-refused-${this.currentTick}`,
            'Receiver read-back is required before responsibility can be accepted.');
          break;
        }
        if (this.postoperativeTransferAcceptedAtTick !== null) {
          this.log('warning', 'assessment', `handoff-acceptance-refused-${this.currentTick}`,
            'Transfer of responsibility has already been accepted.');
          break;
        }
        this.postoperativeTransferAcceptedAtTick = this.currentTick;
        this.log('advisory', 'assessment', `handoff-transfer-accepted-${this.currentTick}`,
          'The receiver acknowledged and accepted responsibility. This records a teaching-state transition, not real staffing, documentation, or clinical transfer.');
        break;
      }
      case 'undifferentiated-shock-assessment': {
        const response = String(action.payload.action ?? '');
        const valid = [
          'review-perfusion', 'review-lactate', 'review-focused-echo',
          'perform-passive-leg-raise', 'give-targeted-fluid-challenge',
          'reassess-perfusion', 'escalate-after-reassessment',
        ].includes(response);
        if (!this.undifferentiatedShockActive || !valid) {
          this.log('warning', 'assessment', `undifferentiated-shock-refused-${this.currentTick}`,
            this.undifferentiatedShockActive
              ? 'The shock-assessment action was not one of the listed choices. Nothing changed.'
              : 'The bounded shock-assessment choices are available only in the declared lesson.');
          break;
        }
        if (response === 'review-perfusion') {
          if (this.shockPerfusionReviewedAtTick !== null) {
            this.log('warning', 'assessment', `shock-perfusion-refused-${this.currentTick}`,
              'The fixed perfusion examination has already been reviewed.');
            break;
          }
          this.shockPerfusionReviewedAtTick = this.currentTick;
          this.log('critical', 'assessment', `shock-perfusion-reviewed-${this.currentTick}`,
            'Fixed perfusion findings: capillary refill 5 seconds, cool mottled knees, new inattention, and 15 mL urine in the prior hour. Technique and measurement error are not simulated.');
          break;
        }
        if (response === 'review-lactate') {
          if (this.shockLactateReviewedAtTick !== null) {
            this.log('warning', 'laboratory', `shock-lactate-refused-${this.currentTick}`,
              'The fixed lactate result has already been reviewed.');
            break;
          }
          this.shockLactateReviewedAtTick = this.currentTick;
          this.log('critical', 'laboratory', `shock-lactate-reviewed-${this.currentTick}`,
            'Fixed venous lactate: 4.6 mmol/L. Sampling, assay performance, acid-base state, and alternative causes are not simulated.');
          break;
        }
        if (response === 'review-focused-echo') {
          if (this.shockPerfusionReviewedAtTick === null || this.shockLactateReviewedAtTick === null) {
            this.log('warning', 'assessment', `shock-echo-order-refused-${this.currentTick}`,
              'Review the fixed whole-patient perfusion findings and lactate before focused cardiac imaging.');
            break;
          }
          if (this.shockFocusedEchoReviewedAtTick !== null) {
            this.log('warning', 'assessment', `shock-echo-refused-${this.currentTick}`,
              'The fixed focused cardiac-ultrasound findings have already been reviewed.');
            break;
          }
          this.shockFocusedEchoReviewedAtTick = this.currentTick;
          this.log('advisory', 'assessment', `shock-echo-reviewed-${this.currentTick}`,
            'Fixed focused cardiac-ultrasound findings: small ventricular filling, preserved left- and right-ventricular systolic appearance, and no pericardial effusion. Image acquisition and interpretation are not simulated.');
          break;
        }
        if (response === 'perform-passive-leg-raise') {
          if (this.shockFocusedEchoReviewedAtTick === null) {
            this.log('warning', 'assessment', `shock-plr-order-refused-${this.currentTick}`,
              'Review the fixed focused cardiac-ultrasound findings before the passive-leg-raise response.');
            break;
          }
          if (this.shockPassiveLegRaiseAtTick !== null) {
            this.log('warning', 'assessment', `shock-plr-refused-${this.currentTick}`,
              'The fixed passive-leg-raise response has already been reviewed.');
            break;
          }
          this.shockPassiveLegRaiseAtTick = this.currentTick;
          this.log('advisory', 'assessment', `shock-plr-positive-${this.currentTick}`,
            'Fixed passive-leg-raise response: the authored measured stroke-volume estimate rises by 14%. This is not the canonical monitor state and does not predict an individual patient response.');
          break;
        }
        if (response === 'give-targeted-fluid-challenge') {
          if (this.shockPassiveLegRaiseAtTick === null) {
            this.log('warning', 'fluid', `shock-fluid-order-refused-${this.currentTick}`,
              'Review the fixed dynamic fluid-responsiveness response before the bounded challenge.');
            break;
          }
          if (this.shockFluidChallengeAtTick !== null) {
            this.log('warning', 'fluid', `shock-fluid-refused-${this.currentTick}`,
              'The bounded 500 mL fluid challenge has already been delivered.');
            break;
          }
          this.shockFluidChallengeAtTick = this.currentTick;
          this.pendingCrystalloidMl += 500;
          this.crystalloidTotalMl += 500;
          this.log('advisory', 'fluid', `shock-fluid-challenge-${this.currentTick}`,
            'A fixed 500 mL balanced-crystalloid challenge was accepted. The shared teaching model retains 25% intravascularly; reassess rather than infer success from delivery.',
            { volumeMl: 500, teachingModel: true });
          break;
        }
        if (response === 'reassess-perfusion') {
          if (this.shockFluidChallengeAtTick === null || this.currentTick <= this.shockFluidChallengeAtTick) {
            this.log('warning', 'assessment', `shock-reassessment-order-refused-${this.currentTick}`,
              'Deliver the bounded challenge and allow the next engine tick before serial reassessment.');
            break;
          }
          if (this.shockPerfusionReassessedAtTick !== null) {
            this.log('warning', 'assessment', `shock-reassessment-refused-${this.currentTick}`,
              'The fixed post-challenge perfusion reassessment has already been recorded.');
            break;
          }
          this.shockPerfusionReassessedAtTick = this.currentTick;
          this.log('advisory', 'assessment', `shock-perfusion-reassessed-${this.currentTick}`,
            'Fixed serial reassessment: capillary refill shortens to 3 seconds and attention improves; urine output and repeat lactate are not available in this brief window. Ongoing shock still requires escalation and etiologic workup.');
          break;
        }
        if (this.shockPerfusionReassessedAtTick === null) {
          this.log('warning', 'assessment', `shock-escalation-order-refused-${this.currentTick}`,
            'Reassess the same perfusion markers before recording escalation.');
          break;
        }
        if (this.shockEscalationAtTick !== null) {
          this.log('warning', 'assessment', `shock-escalation-refused-${this.currentTick}`,
            'Ongoing shock escalation has already been recorded.');
          break;
        }
        this.shockEscalationAtTick = this.currentTick;
        this.log('advisory', 'assessment', `shock-escalation-recorded-${this.currentTick}`,
          'Continued monitored resuscitation, senior help, serial perfusion assessment, and urgent etiologic evaluation were recorded. No real diagnosis, vasopressor, procedure, or disposition is selected here.');
        break;
      }
      case 'septic-shock-assessment': {
        const response = String(action.payload.action ?? '');
        const valid = [
          'review-infection-and-organ-dysfunction', 'obtain-cultures-and-lactate',
          'record-immediate-antimicrobial-intent', 'begin-initial-crystalloid',
          'reassess-after-initial-fluid', 'start-norepinephrine-intent',
          'escalate-source-control',
        ].includes(response);
        if (!this.septicShockActive || !valid) {
          this.log('warning', 'assessment', `septic-shock-refused-${this.currentTick}`,
            this.septicShockActive
              ? 'The septic-shock action was not one of the listed choices. Nothing changed.'
              : 'The bounded septic-shock choices are available only in the declared lesson.');
          break;
        }
        if (response === 'review-infection-and-organ-dysfunction') {
          if (this.sepsisInfectionAndOrganDysfunctionReviewedAtTick !== null) {
            this.log('warning', 'assessment', `sepsis-recognition-refused-${this.currentTick}`,
              'The fixed infection and organ-dysfunction evidence has already been reviewed.');
            break;
          }
          this.sepsisInfectionAndOrganDysfunctionReviewedAtTick = this.currentTick;
          this.log('critical', 'assessment', `sepsis-recognition-reviewed-${this.currentTick}`,
            'Fixed evidence: fever, rigors, dysuria and right-flank tenderness accompany new inattention, capillary refill 5 seconds, oliguria, and hypotension. This supports immediate evaluation and treatment for probable sepsis with shock; it is not a diagnostic test.');
          break;
        }
        if (response === 'obtain-cultures-and-lactate') {
          if (this.sepsisInfectionAndOrganDysfunctionReviewedAtTick === null) {
            this.log('warning', 'laboratory', `sepsis-diagnostics-order-refused-${this.currentTick}`,
              'Review the infection and organ-dysfunction evidence before recording diagnostic intent.');
            break;
          }
          if (this.sepsisCulturesAndLactateAtTick !== null) {
            this.log('warning', 'laboratory', `sepsis-diagnostics-refused-${this.currentTick}`,
              'Blood-culture and lactate intent has already been recorded.');
            break;
          }
          this.sepsisCulturesAndLactateAtTick = this.currentTick;
          this.log('critical', 'laboratory', `sepsis-diagnostics-recorded-${this.currentTick}`,
            'Blood cultures before antimicrobials and venous lactate were recorded without waiting for results. Fixed initial lactate: 5.2 mmol/L. Sampling, contamination, assay behavior, and culture results are not simulated.');
          break;
        }
        if (response === 'record-immediate-antimicrobial-intent') {
          if (this.sepsisCulturesAndLactateAtTick === null) {
            this.log('warning', 'drug', `sepsis-antimicrobial-order-refused-${this.currentTick}`,
              'Record cultures and lactate first, without delaying immediate antimicrobial intent.');
            break;
          }
          if (this.sepsisAntimicrobialIntentAtTick !== null) {
            this.log('warning', 'drug', `sepsis-antimicrobial-refused-${this.currentTick}`,
              'Immediate empiric antimicrobial intent has already been recorded.');
            break;
          }
          this.sepsisAntimicrobialIntentAtTick = this.currentTick;
          this.log('critical', 'drug', `sepsis-antimicrobial-recorded-${this.currentTick}`,
            'Immediate empiric antimicrobial intent was recorded inside the authored one-hour window. No agent, dose, allergy reconciliation, local resistance pattern, delivery, or effect is simulated.');
          break;
        }
        if (response === 'begin-initial-crystalloid') {
          if (this.sepsisInfectionAndOrganDysfunctionReviewedAtTick === null) {
            this.log('warning', 'fluid', `sepsis-fluid-order-refused-${this.currentTick}`,
              'Review the infection and organ-dysfunction evidence before starting the initial-resuscitation sequence.');
            break;
          }
          if (this.sepsisInitialCrystalloidAtTick !== null) {
            this.log('warning', 'fluid', `sepsis-fluid-refused-${this.currentTick}`,
              'The fixed 30 mL/kg initial balanced-crystalloid course has already been started.');
            break;
          }
          this.sepsisInitialCrystalloidAtTick = this.currentTick;
          this.pendingCrystalloidMl += 2100;
          this.crystalloidTotalMl += 2100;
          this.log('advisory', 'fluid', `sepsis-fluid-started-${this.currentTick}`,
            'A fixed 2,100 mL balanced-crystalloid course (30 mL/kg for this 70 kg vignette) was accepted. The shared teaching model retains 25% intravascularly; frequent reassessment remains required.',
            { volumeMl: 2100, teachingModel: true });
          break;
        }
        if (response === 'reassess-after-initial-fluid') {
          if (this.sepsisInitialCrystalloidAtTick === null
            || this.currentTick <= this.sepsisInitialCrystalloidAtTick) {
            this.log('warning', 'assessment', `sepsis-reassessment-order-refused-${this.currentTick}`,
              'Start the fixed initial fluid course and allow the next engine tick before reassessment.');
            break;
          }
          if (this.sepsisPostFluidReassessmentAtTick !== null) {
            this.log('warning', 'assessment', `sepsis-reassessment-refused-${this.currentTick}`,
              'The fixed post-fluid reassessment has already been recorded.');
            break;
          }
          this.sepsisPostFluidReassessmentAtTick = this.currentTick;
          this.log('critical', 'assessment', `sepsis-post-fluid-reviewed-${this.currentTick}`,
            'Fixed reassessment: hypotension, delayed capillary refill, inattention, and oliguria persist after the declared initial fluid course. Repeat lactate is not yet available. Ongoing fluid is not an automatic next step.');
          break;
        }
        if (response === 'start-norepinephrine-intent') {
          if (this.sepsisPostFluidReassessmentAtTick === null) {
            this.log('warning', 'drug', `sepsis-norepinephrine-order-refused-${this.currentTick}`,
              'Reassess perfusion after the initial fluid course before recording vasopressor intent.');
            break;
          }
          if (this.sepsisNorepinephrineIntentAtTick !== null) {
            this.log('warning', 'drug', `sepsis-norepinephrine-refused-${this.currentTick}`,
              'First-line norepinephrine intent has already been recorded.');
            break;
          }
          this.sepsisNorepinephrineIntentAtTick = this.currentTick;
          this.vasopressorEffect = Math.max(this.vasopressorEffect, 0.55);
          this.log('critical', 'drug', `sepsis-norepinephrine-recorded-${this.currentTick}`,
            'First-line norepinephrine intent toward an initial MAP of 65 mmHg was recorded. The directional pressure response is a teaching effect; no concentration, route, pump setup, titration, or patient-specific dose is provided.');
          break;
        }
        if (this.sepsisInfectionAndOrganDysfunctionReviewedAtTick === null) {
          this.log('warning', 'assessment', `sepsis-source-control-order-refused-${this.currentTick}`,
            'Review the probable infection and organ-dysfunction evidence before source-control escalation.');
          break;
        }
        if (this.sepsisSourceControlEscalationAtTick !== null) {
          this.log('warning', 'assessment', `sepsis-source-control-refused-${this.currentTick}`,
            'Source-control and critical-care escalation has already been recorded.');
          break;
        }
        this.sepsisSourceControlEscalationAtTick = this.currentTick;
        this.log('advisory', 'assessment', `sepsis-source-control-recorded-${this.currentTick}`,
          'Urgent evaluation of the suspected obstructed urinary source, senior help, and critical-care escalation were recorded. Imaging, drainage, consultation, disposition, and outcome are not simulated.');
        break;
      }
      case 'hemorrhagic-shock-assessment': {
        const response = String(action.payload.action ?? '');
        const valid = [
          'review-mechanism-and-perfusion', 'record-pelvic-stabilization',
          'activate-major-hemorrhage', 'give-two-red-cell-units',
          'review-coagulation-and-temperature', 'reassess-perfusion',
          'escalate-definitive-bleeding-control',
        ].includes(response);
        if (!this.hemorrhagicShockActive || !valid) {
          this.log('warning', 'assessment', `hemorrhagic-shock-refused-${this.currentTick}`,
            this.hemorrhagicShockActive
              ? 'The traumatic-hemorrhage action was not one of the listed choices. Nothing changed.'
              : 'The bounded traumatic-hemorrhage choices are available only in the declared lesson.');
          break;
        }
        if (response === 'review-mechanism-and-perfusion') {
          if (this.traumaMechanismAndPerfusionReviewedAtTick !== null) {
            this.log('warning', 'assessment', `trauma-recognition-refused-${this.currentTick}`,
              'The fixed mechanism, anatomy, and perfusion evidence has already been reviewed.');
            break;
          }
          this.traumaMechanismAndPerfusionReviewedAtTick = this.currentTick;
          this.log('critical', 'assessment', `trauma-recognition-reviewed-${this.currentTick}`,
            'Fixed evidence: high-energy blunt mechanism, pelvic instability, tachycardia, narrow pulse pressure, cool mottled skin, inattention, and lactate 5.8 mmol/L indicate traumatic hemorrhagic shock despite no visible external bleeding. Examination and measurement error are not simulated.');
          break;
        }
        if (this.traumaMechanismAndPerfusionReviewedAtTick === null) {
          this.log('warning', 'assessment', `trauma-action-order-refused-${this.currentTick}`,
            'Review the mechanism, injury pattern, and tissue-perfusion evidence before recording a response.');
          break;
        }
        if (response === 'record-pelvic-stabilization') {
          if (this.traumaPelvicStabilizationAtTick !== null) {
            this.log('warning', 'assessment', `trauma-pelvic-stabilization-refused-${this.currentTick}`,
              'Pelvic-stabilization intent has already been recorded.');
            break;
          }
          this.traumaPelvicStabilizationAtTick = this.currentTick;
          this.log('critical', 'assessment', `trauma-pelvic-stabilization-recorded-${this.currentTick}`,
            'Purpose-made pelvic-stabilization intent was recorded for suspected unstable pelvic injury. Placement, fit, pressure injury, fracture classification, and physical bleeding control are not simulated.');
          break;
        }
        if (response === 'activate-major-hemorrhage') {
          if (this.traumaMajorHemorrhageActivatedAtTick !== null) {
            this.log('warning', 'blood-product', `trauma-major-hemorrhage-refused-${this.currentTick}`,
              'The major-hemorrhage response has already been activated.');
            break;
          }
          this.traumaMajorHemorrhageActivatedAtTick = this.currentTick;
          this.bloodProductsReleased = true;
          this.log('critical', 'blood-product', `trauma-major-hemorrhage-activated-${this.currentTick}`,
            'Major-hemorrhage response and immediate bounded blood-product release were recorded. Local activation, specimen, compatibility, inventory, plasma, platelets, fibrinogen, calcium, TXA, warming, and team workflow are not simulated.');
          break;
        }
        if (response === 'give-two-red-cell-units') {
          if (this.traumaMajorHemorrhageActivatedAtTick === null) {
            this.log('warning', 'blood-product', `trauma-red-cells-order-refused-${this.currentTick}`,
              'Activate the major-hemorrhage response before the bounded red-cell bridge.');
            break;
          }
          if (this.traumaRedCellsAtTick !== null) {
            this.log('warning', 'blood-product', `trauma-red-cells-refused-${this.currentTick}`,
              'The bounded 2-unit red-cell bridge has already been delivered.');
            break;
          }
          const redCells = getBloodProduct('packed-red-blood-cells')!;
          this.traumaRedCellsAtTick = this.currentTick;
          this.pendingPackedRedCellUnits += 2;
          this.pendingPackedRedCellVolumeMl += 2 * redCells.volumeMlPerUnit;
          this.pendingPackedRedCellHemoglobinG += 2 * redCells.hemoglobinGPerUnit;
          this.packedRedBloodCellUnits += 2;
          this.bloodProductTotalMl += 2 * redCells.volumeMlPerUnit;
          this.log('critical', 'blood-product', `trauma-red-cells-delivered-${this.currentTick}`,
            'Two fixed adult packed-red-cell units were accepted as a bridge to bleeding control. Each unit is a 300 mL, 60 g hemoglobin teaching product; no universal trauma transfusion ratio or individual response is claimed.',
            { units: 2, teachingModel: true });
          break;
        }
        if (response === 'review-coagulation-and-temperature') {
          if (this.traumaMajorHemorrhageActivatedAtTick === null) {
            this.log('warning', 'laboratory', `trauma-monitoring-order-refused-${this.currentTick}`,
              'Activate the major-hemorrhage response before reviewing the bounded monitoring panel.');
            break;
          }
          if (this.traumaCoagulationAndTemperatureAtTick !== null) {
            this.log('warning', 'laboratory', `trauma-monitoring-refused-${this.currentTick}`,
              'Coagulation and temperature monitoring has already been reviewed.');
            break;
          }
          this.traumaCoagulationAndTemperatureAtTick = this.currentTick;
          this.coagulationPanelReported = true;
          this.log('warning', 'laboratory', `trauma-monitoring-reviewed-${this.currentTick}`,
            `Fixed monitoring: core temperature ${(this.lastState.coreTemperatureC ?? this.scenario.patient.baseline.coreTemperatureC).toFixed(1)}°C, prothrombin time ratio ${(this.lastState.prothrombinTimeRatio ?? 1).toFixed(2)} × normal, and fibrinogen ${(this.lastState.fibrinogenGPerL ?? 3).toFixed(1)} g/L. Active warming and repeated goal-directed coagulation management require local systems not simulated here.`);
          break;
        }
        if (response === 'reassess-perfusion') {
          if (this.traumaRedCellsAtTick === null || this.traumaCoagulationAndTemperatureAtTick === null
            || this.currentTick <= this.traumaRedCellsAtTick) {
            this.log('warning', 'assessment', `trauma-reassessment-order-refused-${this.currentTick}`,
              'Deliver the bounded red-cell bridge, review coagulation and temperature, and allow the next engine tick before reassessment.');
            break;
          }
          if (this.traumaReassessedAtTick !== null) {
            this.log('warning', 'assessment', `trauma-reassessment-refused-${this.currentTick}`,
              'The fixed serial perfusion reassessment has already been recorded.');
            break;
          }
          this.traumaReassessedAtTick = this.currentTick;
          this.log('advisory', 'assessment', `trauma-perfusion-reassessed-${this.currentTick}`,
            'Fixed serial reassessment records the canonical monitor response while ongoing concealed bleeding remains active. Blood replacement is a bridge, not source control; repeat lactate and outcome are not available in this short vignette.');
          break;
        }
        if (this.traumaPelvicStabilizationAtTick === null) {
          this.log('warning', 'assessment', `trauma-definitive-control-order-refused-${this.currentTick}`,
            'Record pelvic-stabilization intent before definitive bleeding-control escalation.');
          break;
        }
        if (this.traumaDefinitiveControlEscalatedAtTick !== null) {
          this.log('warning', 'assessment', `trauma-definitive-control-refused-${this.currentTick}`,
            'Definitive bleeding-control escalation has already been recorded.');
          break;
        }
        this.traumaDefinitiveControlEscalatedAtTick = this.currentTick;
        this.log('critical', 'assessment', `trauma-definitive-control-recorded-${this.currentTick}`,
          'Immediate transfer for definitive pelvic bleeding control with trauma, surgery, and interventional capability was recorded. Imaging, packing, embolization, operation, REBOA, transport, and outcome are not simulated.');
        break;
      }
      case 'silence-alarm': {
        this.alarmEngine.silence(String(action.payload.alarmId), this.currentTick, TICKS_PER_SECOND);
        break;
      }
      case 'artifact': {
        const id = String(action.payload.artifactId) as ArtifactId;
        const active = action.payload.active !== false;
        if (id === 'sampling-line-obstruction' && active && !this.artifacts.has(id)) {
          this.capnographyVentilationCrossChecked = false;
        }
        if ((id === 'arterial-damping' || id === 'arterial-transducer-misleveled')
          && active && !this.artifacts.has(id)) {
          this.arterialWaveformAssessed = false;
          this.arterialLeveledAndZeroed = false;
          this.pendingNibpCompletesAtTick = null;
          this.nibpMeanArterialMmHg = null;
          this.nibpMeasuredAtTick = null;
        }
        this.artifacts[active ? 'add' : 'delete'](id);
        this.waveforms.setArtifact(id, active);
        this.log('artifact', 'artifact', `artifact-${id}-${this.currentTick}`,
          `${active ? 'Injected' : 'Cleared'} sensor artifact: ${id}`);
        break;
      }
      case 'arterial-line': {
        const lineAction = action.payload.action;
        const hasFault = this.artifacts.has('arterial-damping')
          || this.artifacts.has('arterial-transducer-misleveled');
        if (lineAction === 'assess-waveform') {
          if (!hasFault || this.arterialWaveformAssessed) {
            this.log('warning', 'equipment', `arterial-waveform-assessment-refused-${this.currentTick}`,
              hasFault ? 'The arterial waveform has already been assessed.' : 'No modeled arterial-line fault is active.');
            break;
          }
          this.arterialWaveformAssessed = true;
          this.log('artifact', 'equipment', `arterial-waveform-assessed-${this.currentTick}`,
            this.artifacts.has('arterial-damping')
              ? 'Waveform assessment recorded: the trace is over-damped, with a blunted upstroke and absent dicrotic notch.'
              : 'Waveform assessment recorded: morphology is preserved despite the pressure offset.',
            { intentOnly: true, overdamped: this.artifacts.has('arterial-damping') });
          break;
        }
        if (lineAction === 'level-zero') {
          if (!this.artifacts.has('arterial-transducer-misleveled')) {
            this.log('warning', 'equipment', `arterial-level-zero-refused-${this.currentTick}`,
              'The modeled transducer is already level and zeroed.');
            break;
          }
          this.artifacts.delete('arterial-transducer-misleveled');
          this.arterialLeveledAndZeroed = true;
          this.log('artifact', 'equipment', `arterial-level-zero-${this.currentTick}`,
            'Level-and-zero intent accepted. The hydrostatic display offset is removed; physical technique is not assessed.',
            { intentOnly: true, priorMislevelingCm: ARTERIAL_MISLEVELING_CM });
          break;
        }
        if (lineAction === 'cycle-cuff') {
          const configured = this.scenario.timeline.some((event) => event.type === 'artifact'
            && (event.target === 'arterial-damping'
              || event.target === 'arterial-transducer-misleveled'));
          if (!configured || this.pendingNibpCompletesAtTick !== null) {
            this.log('warning', 'equipment', `nibp-cycle-refused-${this.currentTick}`,
              this.pendingNibpCompletesAtTick !== null
                ? 'A non-invasive pressure cycle is already in progress.'
                : 'This scenario does not configure the bounded independent cuff action.');
            break;
          }
          this.pendingNibpCompletesAtTick = this.currentTick + NIBP_CYCLE_SECONDS * TICKS_PER_SECOND;
          this.nibpMeanArterialMmHg = null;
          this.nibpMeasuredAtTick = null;
          this.log('info', 'equipment', `nibp-cycle-started-${this.currentTick}`,
            `Non-invasive pressure cycle started. A result will be available in ${NIBP_CYCLE_SECONDS} simulated seconds.`,
            { durationSeconds: NIBP_CYCLE_SECONDS });
          break;
        }
        if (lineAction === 'restore-dynamic-response') {
          if (!this.artifacts.has('arterial-damping') || !this.arterialWaveformAssessed) {
            this.log('warning', 'equipment', `arterial-response-restoration-refused-${this.currentTick}`,
              !this.artifacts.has('arterial-damping')
                ? 'The modeled arterial pressure system already has a normal dynamic response.'
                : 'Assess the waveform before replacing the modeled pressure tubing.');
            break;
          }
          this.artifacts.delete('arterial-damping');
          this.waveforms.setArtifact('arterial-damping', false);
          this.log('artifact', 'equipment', `arterial-response-restored-${this.currentTick}`,
            'Pressure-tubing replacement intent accepted. Normal waveform response is restored; flushing and setup technique are not assessed.',
            { intentOnly: true });
          break;
        }
        this.log('warning', 'equipment', `bad-arterial-line-action-${this.currentTick}`,
          `Unknown arterial-line action "${String(lineAction)}". Nothing changed.`);
        break;
      }
      case 'capnography-line': {
        const lineAction = action.payload.action;
        const obstructed = this.artifacts.has('sampling-line-obstruction');
        if (lineAction === 'cross-check-ventilation') {
          if (!obstructed || this.capnographyVentilationCrossChecked) {
            this.log('warning', 'equipment', `capnography-cross-check-refused-${this.currentTick}`,
              !obstructed
                ? 'The carbon-dioxide sample path is not obstructed, so no fault cross-check was recorded.'
                : 'Ventilation has already been cross-checked for this sampling-line fault.');
            break;
          }
          this.capnographyVentilationCrossChecked = true;
          this.log('info', 'equipment', `capnography-cross-check-${this.currentTick}`,
            'Ventilation cross-check recorded: spontaneous respiratory movement, saturation, and the plethysmogram remain available. This is screen intent, not a physical examination.');
          break;
        }
        if (lineAction === 'reconnect') {
          if (!obstructed) {
            this.log('warning', 'equipment', `capnography-line-reconnect-refused-${this.currentTick}`,
              'The carbon-dioxide sample path is not obstructed. No reconnection was recorded.');
            break;
          }
          this.artifacts.delete('sampling-line-obstruction');
          this.waveforms.setArtifact('sampling-line-obstruction', false);
          this.log('info', 'equipment', `capnography-line-restored-${this.currentTick}`,
            'Carbon-dioxide sampling line reconnected. Confirm the sampled number and waveform return.');
          break;
        }
        this.log('warning', 'equipment', `bad-capnography-line-action-${this.currentTick}`,
          `Unknown capnography-line action "${String(lineAction)}". Nothing changed.`);
        break;
      }
      case 'breathing-circuit': {
        const circuitAction = action.payload.action;
        if (circuitAction === 'assess-capnogram') {
          if (!this.co2AbsorbentExhausted || this.circuitCapnogramAssessed) {
            this.log('warning', 'equipment', `circuit-assessment-refused-${this.currentTick}`,
              !this.co2AbsorbentExhausted
                ? 'No modeled carbon-dioxide absorber failure is active.'
                : 'The raised inspiratory carbon-dioxide baseline has already been assessed.');
            break;
          }
          this.circuitCapnogramAssessed = true;
          this.log('warning', 'equipment', `circuit-capnogram-assessed-${this.currentTick}`,
            'Capnogram assessment recorded: inspired carbon dioxide remains above zero while breath delivery continues, consistent with rebreathing in this bounded circuit model.', {
              inspiredCo2MmHg: this.inspiredCo2MmHg, intentOnly: true,
            });
          break;
        }
        if (circuitAction === 'replace-absorbent') {
          if (!this.co2AbsorbentExhausted || !this.circuitCapnogramAssessed) {
            this.log('warning', 'equipment', `circuit-absorbent-replacement-refused-${this.currentTick}`,
              !this.co2AbsorbentExhausted
                ? 'The modeled carbon-dioxide absorbent is not exhausted.'
                : 'Assess the capnogram before replacing the modeled absorbent.');
            break;
          }
          this.co2AbsorbentExhausted = false;
          this.circuitAbsorbentReplaced = true;
          this.log('warning', 'equipment', `circuit-absorbent-replaced-${this.currentTick}`,
            'Carbon-dioxide absorbent replacement intent accepted. Inspired carbon dioxide will wash out on a bounded teaching trajectory; physical exchange and workstation-specific safety are not assessed.', {
              intentOnly: true, inspiredCo2MmHgBefore: this.inspiredCo2MmHg,
            });
          break;
        }
        this.log('warning', 'equipment', `bad-breathing-circuit-action-${this.currentTick}`,
          `Unknown breathing-circuit action "${String(circuitAction)}". Nothing changed.`);
        break;
      }
      case 'rhythm': {
        this.rhythm = String(action.payload.rhythmId) as RhythmId;
        this.log('critical', 'rhythm', `rhythm-${this.currentTick}`, `Rhythm changed to ${this.rhythm}`);
        break;
      }
      default:
        this.log('warning', 'engine', `unknown-action-${this.currentTick}`,
          `Unknown action type "${action.type}" was ignored.`);
    }
  }

  private giveBolus(drugId: string, amount: number, unit: string): void {
    const drug = this.drugs.get(drugId);
    if (!drug) return;
    if (drugId === 'rocuronium' && this.lastNeuromuscularReversal !== null) {
      this.log('warning', 'drug', `rocuronium-after-reversal-refused-${this.currentTick}`,
        'Additional rocuronium after modeled reversal is outside this bounded teaching model. Nothing was given; prior opposed drug was not reactivated.');
      return;
    }
    const absoluteUnit = drug.model.doseUnit;
    const weightBasedUnit = `${absoluteUnit}/kg`;
    if (unit !== absoluteUnit && unit !== weightBasedUnit) {
      this.log('warning', 'drug', `bad-dose-unit-${drugId}-${this.currentTick}`,
        `A ${drugId} bolus cannot be entered in "${unit || 'no unit'}". `
        + `Use ${absoluteUnit} or ${weightBasedUnit}. Nothing was given.`);
      return;
    }
    if (amount <= 0) {
      this.log('warning', 'drug', `non-positive-dose-${drugId}-${this.currentTick}`,
        `A ${drugId} bolus must be greater than zero ${unit}. Nothing was given.`);
      return;
    }
    const weightBased = unit === weightBasedUnit;
    const mass = weightBased ? amount * this.covariates.weightKg : amount;
    const volumeMl = mass / drug.concentration;

    // An implausible dose is flagged on what was ENTERED, before anything else,
    // so the learner is told the dose is extreme even if the syringe then refuses
    // it. The two are separate facts and the learner needs both.
    const implausible = mass > drug.typicalDose * 10;
    if (implausible) {
      this.log('warning', 'drug', `implausible-dose-${drugId}-${this.currentTick}`,
        `${drugId} ${mass.toFixed(0)} ${drug.model.doseUnit} is `
        + `${(mass / drug.typicalDose).toFixed(0)} times the typical dose for this patient. `
        + 'Confirm deliberately; the simulator will give it, and the transcript records it.',
        { drugId, mass, unit: drug.model.doseUnit, implausible: true, multiple: mass / drug.typicalDose });
    }

    if (volumeMl > drug.syringeRemainingMl + 1e-9) {
      this.log('warning', 'drug', `empty-syringe-${drugId}-${this.currentTick}`,
        `The ${drugId} syringe holds only ${drug.syringeRemainingMl.toFixed(1)} mL. `
        + 'Draw up a new syringe before giving more.');
      return;
    }
    drug.syringeRemainingMl -= volumeMl;
    drug.solver.bolus(mass);

    // Stacking: a second bolus while the effect site is still climbing toward its
    // peak from the previous one is recorded for the debrief.
    const peak = this.lastEffectSitePeak.get(drugId);
    const stacking = peak !== undefined && drug.solver.hasEffectSiteCurve
      && drug.solver.effectSite < peak * 0.98 === false;
    this.log(implausible ? 'warning' : 'info', 'drug', `bolus-${drugId}-${this.currentTick}`,
      `${drugId} ${mass.toFixed(mass < 10 ? 1 : 0)} ${drug.model.doseUnit}`
      + (weightBased ? ` (${amount} ${unit} at ${this.covariates.weightKg} kg)` : '')
      + (implausible ? ` — ${(mass / drug.typicalDose).toFixed(0)} times the typical dose` : ''),
      {
        drugId, mass, unit: drug.model.doseUnit, route: 'intravenous',
        modelId: drug.model.id, implausible, stacking,
        ...(drugId === 'rocuronium' ? {
          preDoseTrainOfFourCount: Number(this.lastState.trainOfFourCount ?? 4),
          preDoseTrainOfFourRatio: Number(this.lastState.trainOfFourRatio ?? 1),
        } : {}),
      });

    // A documented allergy is enforced only after drug actually leaves a
    // non-empty syringe. A zero, malformed, unknown, or refused dose must not
    // create a reaction the learner did not cause.
    const normalizedDrug = AnesthesiaEngine.normalizedAgent(drugId);
    const matchingAllergy = mass > 0
      ? (this.scenario.patient.allergies ?? []).find((allergy) => {
        const normalizedAllergy = AnesthesiaEngine.normalizedAgent(allergy);
        return normalizedAllergy.includes(normalizedDrug)
          && ['anaphylaxis', 'anaphylactic', 'allergy', 'allergic'].some(
            (marker) => normalizedAllergy.includes(marker),
          );
      })
      : undefined;
    if (matchingAllergy) {
      this.triggerAnaphylaxis(drugId, 1, `documented-allergy-${drugId}-${this.currentTick}`, matchingAllergy);
    }
  }

  private static normalizedAgent(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private triggerAnaphylaxis(
    agentId: string,
    severity: number,
    eventId: string,
    documentedAllergy?: string,
  ): void {
    this.lastExposure = { agentId, tick: this.currentTick };
    this.anaphylaxisSeverity = Math.max(this.anaphylaxisSeverity, clamp(severity, 0, 1));
    this.log('critical', 'exposure', eventId,
      documentedAllergy
        ? `${agentId} was administered despite the documented allergy "${documentedAllergy}". `
          + 'A systemic reaction has begun.'
        : `${agentId} exposure recorded. Abrupt cardiovascular and respiratory changes follow.`,
      {
        agentId, exposureTick: this.currentTick,
        ...(documentedAllergy ? { documentedAllergy } : {}),
      });
  }

  private setInfusion(drugId: string, rate: number, unit: string): void {
    const drug = this.drugs.get(drugId);
    if (!drug) return;
    if (drugId === 'rocuronium' && rate > 0 && this.lastNeuromuscularReversal !== null) {
      this.log('warning', 'drug', `rocuronium-after-reversal-refused-${this.currentTick}`,
        'Additional rocuronium after modeled reversal is outside this bounded teaching model. The infusion was not started; prior opposed drug was not reactivated.');
      return;
    }
    if (!drug.deliveryModes.includes('infusion')) {
      this.log('warning', 'drug', `unsupported-infusion-${drugId}-${this.currentTick}`,
        `${drugId} is stocked for bolus use only in this scenario. The infusion was not started.`,
        { drugId, requestedRate: rate, unit });
      return;
    }
    const previous = drug.infusionRate;
    // Rates are entered per minute or per kilogram per minute.
    drug.infusionRate = unit.includes('/kg') ? rate * this.covariates.weightKg : rate;
    // The tray shows how long an infusion has been running, so the start tick is
    // recorded here and cleared when the rate returns to zero.
    if (drug.infusionRate <= 0) drug.infusionSinceTick = null;
    else if (previous <= 0) drug.infusionSinceTick = this.currentTick;
    this.log('info', 'drug', `infusion-${drugId}-${this.currentTick}`,
      `${drugId} infusion ${previous.toFixed(1)} → ${drug.infusionRate.toFixed(1)} ${drug.model.doseUnit}/min`,
      { drugId, previousRate: previous, newRate: drug.infusionRate });
  }

  private setVentilator(settings: Partial<VentilatorSettings>): void {
    // The hypoxic guard on a real anaesthesia machine: the inspired oxygen
    // fraction cannot be set below that of room air.
    if (settings.fio2 !== undefined && settings.fio2 < 0.21) {
      this.log('warning', 'ventilator', `hypoxic-guard-${this.currentTick}`,
        'Refused: inspired oxygen fraction cannot be set below 0.21. Real anaesthesia machines '
        + 'carry the same guard, so a hypoxic mixture cannot be delivered.');
      const { fio2: _ignored, ...rest } = settings;
      this.ventilator = { ...this.ventilator, ...rest };
      return;
    }
    this.ventilator = { ...this.ventilator, ...settings };
    this.log('info', 'ventilator', `ventilator-${this.currentTick}`,
      `Ventilator: ${this.ventilator.mode}, FiO₂ ${this.ventilator.fio2.toFixed(2)}, `
      + `${this.ventilator.delivering ? `${this.ventilator.tidalVolumeMl} mL × ${this.ventilator.respiratoryRateBpm}` : 'not delivering'}, `
      + `fresh gas ${this.ventilator.freshGasFlowLPerMin.toFixed(1)} L/min, `
      + `sevoflurane ${this.ventilator.sevofluranePercent.toFixed(1)}%`);
    this.reportUnmodelledSettings(settings);
  }

  /**
   * Settings this engine records but does not act on, named once each.
   *
   * Found by setting every ventilator control in turn and checking whether the
   * patient noticed. PEEP and pressure-control both changed nothing at all: the
   * number moved on screen, the log said the machine had been set, and the
   * physiology was identical. That is the same defect the vaporizer had, and
   * silently accepting a setting is worse than refusing it — a learner who sets
   * PEEP and sees no change reasonably concludes PEEP does not do much.
   *
   * They are not removed, because they are real controls a learner should meet
   * and their absence is recorded in the limitations register. They say so
   * instead, once each, where they are used.
   */
  private reportUnmodelledSettings(settings: Partial<VentilatorSettings>): void {
    if (settings.peep !== undefined && settings.peep > 0 && !this.reportedUnmodelled.has('peep')) {
      this.reportedUnmodelled.add('peep');
      this.log('advisory', 'ventilator', `unmodelled-peep-${this.currentTick}`,
        'PEEP is recorded but this module does not model it. Neither oxygenation nor venous '
        + 'return will change, and the limitations register says so. Do not read this session as '
        + 'evidence about what PEEP does.');
    }
    if (settings.mode === 'pressure-control' && !this.reportedUnmodelled.has('pressure-control')) {
      this.reportedUnmodelled.add('pressure-control');
      this.log('advisory', 'ventilator', `unmodelled-mode-${this.currentTick}`,
        'Pressure control is recorded but this module ventilates identically in either mode: it '
        + 'has no airway-pressure or compliance model, so the delivered tidal volume is the one '
        + 'you set. The difference between the modes is not simulated here.');
    }
  }

  private log(
    severity: EngineEvent['severity'], category: string, eventId: string, message: string,
    data?: EngineEvent['data'],
  ): void {
    this.pendingEvents.push({
      tick: this.currentTick, severity, category, eventId, message,
      ...(data ? { data } : {}),
    });
  }


  /**
   * Whether a timeline event's condition is met right now.
   *
   * Exactly one of `atTick` and `when` is present — the scenario validator
   * enforces that — so an event with neither, or with an unreadable predicate,
   * simply never fires. The unreadable case is logged at construction.
   */
  private conditionMet(event: TimelineEvent): boolean {
    if (event.atTick !== undefined) return this.currentTick >= event.atTick;
    const predicate = this.predicates.get(event.id);
    if (!predicate) return false;
    return evaluatePredicate(predicate, this.lastState);
  }

  /**
   * Perform a timeline event.
   *
   * The switch is exhaustive over `EventType` and the default calls
   * `assertNever`, so adding a type to `EVENT_TYPES` without handling it here is
   * a compile error. It used to be nothing at all: four of the nine declared
   * types did nothing, an author's event validated cleanly and never fired, and
   * the only way to find out was to read this method.
   */
  private fireTimelineEvent(event: TimelineEvent): void {
    if (event.message) {
      // The event's own id, unchanged, because the debrief timeline and the
      // scenario tests both identify an event by it. Only a repeatable event
      // needs the tick appended, and only so its second firing is a distinct
      // log entry rather than a duplicate of its first.
      const eventId = event.repeatable ? `${event.id}-${this.currentTick}` : event.id;
      this.log(event.severity ?? 'info', 'scenario', eventId, event.message);
    }

    switch (event.type) {
      // Sustained: these apply over a window and are summed or maxed each tick.
      case 'surgical-stimulus':
      case 'blood-loss':
      case 'crystalloid':
      case 'obstruction': {
        if (event.durationTicks === undefined || event.value === undefined) {
          this.log('warning', 'scenario', `incomplete-event-${event.id}-${this.currentTick}`,
            `Timeline event "${event.id}" is a ${event.type}, which applies over a window, but it `
            + 'declares no value or no durationTicks, so it has no effect.');
          return;
        }
        this.running.push({
          id: event.id, type: event.type, value: event.value,
          untilTick: this.currentTick + event.durationTicks,
        });
        return;
      }

      // Instantaneous: these change something once, at the moment they fire.
      case 'narrative':
        // The message is the whole event, and it has already been logged.
        return;

      case 'laryngospasm': {
        if (this.patient.airway.intubated) {
          this.log('warning', 'scenario', `inapplicable-event-${event.id}-${this.currentTick}`,
            `Timeline event "${event.id}" cannot close an upper airway already secured by a `
            + 'tracheal tube, so the event had no effect.');
          return;
        }
        const severity = event.value;
        if (typeof severity !== 'number' || !Number.isFinite(severity)
          || severity < 0 || severity > 1) {
          this.log('warning', 'scenario', `incomplete-event-${event.id}-${this.currentTick}`,
            `Timeline event "${event.id}" has an invalid upper-airway closure severity. `
            + 'It must be a finite number from 0 to 1, so the event had no effect.');
          return;
        }
        this.upperAirwayClosureFraction = severity;
        return;
      }

      case 'upper-airway-obstruction': {
        if (this.patient.airway.intubated) {
          this.log('warning', 'scenario', `inapplicable-event-${event.id}-${this.currentTick}`,
            `Timeline event "${event.id}" cannot obstruct an upper airway still secured by a tracheal tube, so the event had no effect.`);
          return;
        }
        const severity = event.value;
        if (typeof severity !== 'number' || !Number.isFinite(severity)
          || severity < 0 || severity > 1) {
          this.log('warning', 'scenario', `incomplete-event-${event.id}-${this.currentTick}`,
            `Timeline event "${event.id}" has an invalid upper-airway obstruction severity. It must be a finite number from 0 to 1, so the event had no effect.`);
          return;
        }
        this.postExtubationObstructionSeverity = severity;
        return;
      }

      case 'opioid-ventilatory-impairment': {
        const severity = event.value;
        if (typeof severity !== 'number' || !Number.isFinite(severity)
          || severity < 0 || severity > 1) {
          this.log('warning', 'scenario', `incomplete-event-${event.id}-${this.currentTick}`,
            `Timeline event "${event.id}" has an invalid opioid ventilatory impairment severity. It must be a finite number from 0 to 1, so the event had no effect.`);
          return;
        }
        this.opioidVentilatoryImpairmentSeverity = severity;
        this.opioidVentilatoryImpairmentTarget = severity;
        return;
      }

      case 'perioperative-hypothermia': {
        const target = event.value;
        if (typeof target !== 'number' || !Number.isFinite(target)
          || target < 34 || target >= 36) {
          this.log('warning', 'scenario', `incomplete-event-${event.id}-${this.currentTick}`,
            `Timeline event "${event.id}" has an invalid perioperative temperature target. It must be finite from 34°C up to but not including 36°C, so the event had no effect.`);
          return;
        }
        this.perioperativeTemperatureTargetC = target;
        return;
      }

      case 'perioperative-hyperglycemia': {
        const glucose = event.value;
        if (typeof glucose !== 'number' || !Number.isFinite(glucose)
          || glucose <= 180 || glucose > 400) {
          this.log('warning', 'scenario', `incomplete-event-${event.id}-${this.currentTick}`,
            `Timeline event "${event.id}" has an invalid hyperglycemic point-of-care result. It must be above 180 and at most 400 mg/dL, so the event had no effect.`);
          return;
        }
        this.hyperglycemicGlucoseMgPerDl = glucose;
        return;
      }

      case 'shock-pattern': {
        if (event.target !== 'fluid-responsive-low-preload' || event.value !== 1) {
          this.log('warning', 'scenario', `incomplete-event-${event.id}-${this.currentTick}`,
            `Timeline event "${event.id}" must declare the bounded fluid-responsive-low-preload pattern with value 1, so the event had no effect.`);
          return;
        }
        this.undifferentiatedShockActive = true;
        this.log('critical', 'scenario', `undifferentiated-shock-active-${this.currentTick}`,
          'The patient has persistent hypotension and signs of impaired tissue perfusion. The etiology is not named; assess more than one variable and reassess after acting.');
        return;
      }

      case 'sepsis-pattern': {
        if (event.target !== 'probable-urinary-source-with-shock' || event.value !== 1) {
          this.log('warning', 'scenario', `incomplete-event-${event.id}-${this.currentTick}`,
            `Timeline event "${event.id}" must declare the bounded probable-urinary-source-with-shock pattern with value 1, so the event had no effect.`);
          return;
        }
        this.septicShockActive = true;
        this.log('critical', 'scenario', `septic-shock-active-${this.currentTick}`,
          'Probable infection, new organ dysfunction, hypotension, and impaired tissue perfusion require immediate parallel evaluation and resuscitation. The source and pathogen remain unconfirmed.');
        return;
      }

      case 'hemorrhagic-shock-pattern': {
        if (event.target !== 'blunt-pelvic-trauma' || event.value !== 1) {
          this.log('warning', 'scenario', `incomplete-event-${event.id}-${this.currentTick}`,
            `Timeline event "${event.id}" must declare the bounded blunt-pelvic-trauma pattern with value 1, so the event had no effect.`);
          return;
        }
        this.hemorrhagicShockActive = true;
        this.log('critical', 'scenario', `hemorrhagic-shock-active-${this.currentTick}`,
          'Blunt pelvic trauma, impaired tissue perfusion, and ongoing concealed blood loss require parallel resuscitation and immediate bleeding-control escalation. Severe traumatic brain injury is not present in this vignette.');
        return;
      }

      case 'anaphylaxis': {
        const severity = event.value;
        if (!['cefazolin', 'community-food-exposure'].includes(event.target ?? '')
          || typeof severity !== 'number'
          || !Number.isFinite(severity) || severity < 0 || severity > 1) {
          this.log('warning', 'scenario', `incomplete-event-${event.id}-${this.currentTick}`,
            `Timeline event "${event.id}" must identify a supported exposure and a finite severity `
            + 'from 0 to 1, so the event had no effect.');
          return;
        }
        this.triggerAnaphylaxis(event.target!, severity, `exposure-${event.id}-${this.currentTick}`);
        return;
      }

      case 'malignant-hyperthermia': {
        const severity = event.value;
        if (event.target !== 'volatile-trigger' || typeof severity !== 'number'
          || !Number.isFinite(severity) || severity < 0 || severity > 1) {
          this.log('warning', 'scenario', `incomplete-event-${event.id}-${this.currentTick}`,
            `Timeline event "${event.id}" must identify a volatile trigger and a finite `
            + 'susceptibility from 0 to 1, so the event had no effect.');
          return;
        }
        this.malignantHyperthermiaSusceptibility = Math.max(
          this.malignantHyperthermiaSusceptibility, severity,
        );
        return;
      }

      case 'local-anesthetic-toxicity': {
        const severity = event.value;
        if (event.target !== 'bupivacaine' || typeof severity !== 'number'
          || !Number.isFinite(severity) || severity < 0 || severity > 1) {
          this.log('warning', 'scenario', `incomplete-event-${event.id}-${this.currentTick}`,
            `Timeline event "${event.id}" must identify bupivacaine exposure and a finite severity from 0 to 1, so the event had no effect.`);
          return;
        }
        this.localAnestheticToxicitySeverity = Math.max(
          this.localAnestheticToxicitySeverity, severity,
        );
        this.lastExposure = { agentId: 'bupivacaine', tick: this.currentTick };
        return;
      }

      case 'status-epilepticus': {
        const severity = event.value;
        if (event.target !== 'generalized-convulsive' || typeof severity !== 'number'
          || !Number.isFinite(severity) || severity < 0 || severity > 1) {
          this.log('warning', 'scenario', `incomplete-event-${event.id}-${this.currentTick}`,
            `Timeline event "${event.id}" must identify generalized-convulsive status and a finite severity from 0 to 1, so the event had no effect.`);
          return;
        }
        this.statusEpilepticusSeverity = Math.max(this.statusEpilepticusSeverity, severity);
        this.log('critical', 'scenario', `status-epilepticus-active-${this.currentTick}`,
          'Generalized bilateral convulsive activity is ongoing beyond 5 minutes without recovery. The bounded seizure signal does not diagnose an etiology or measure physical movement, EEG activity, consciousness, or neurologic injury.');
        return;
      }

      case 'high-spinal': {
        const severity = event.value;
        if (event.target !== 'neuraxial-local-anesthetic' || typeof severity !== 'number'
          || !Number.isFinite(severity) || severity < 0 || severity > 1) {
          this.log('warning', 'scenario', `incomplete-event-${event.id}-${this.currentTick}`,
            `Timeline event "${event.id}" must identify neuraxial-local-anesthetic exposure and a finite severity from 0 to 1, so the event had no effect.`);
          return;
        }
        this.highSpinalSeverity = Math.max(this.highSpinalSeverity, severity);
        this.lastExposure = { agentId: 'neuraxial-local-anesthetic', tick: this.currentTick };
        return;
      }

      case 'venous-air-embolism': {
        const severity = event.value;
        if (event.target !== 'central-venous-catheter-track' || typeof severity !== 'number'
          || !Number.isFinite(severity) || severity < 0 || severity > 1) {
          this.log('warning', 'scenario', `incomplete-event-${event.id}-${this.currentTick}`,
            `Timeline event "${event.id}" must identify a central-venous-catheter-track and a finite severity from 0 to 1, so the event had no effect.`);
          return;
        }
        this.venousAirEmbolismSeverity = Math.max(this.venousAirEmbolismSeverity, severity);
        this.venousAirEntryControlled = false;
        this.venousAirEntryControlledAtTick = null;
        this.lastExposure = { agentId: 'central-venous-catheter-track', tick: this.currentTick };
        return;
      }

      case 'tension-pneumothorax': {
        const severity = event.value;
        if (event.target !== 'left-pleural-space' || typeof severity !== 'number'
          || !Number.isFinite(severity) || severity < 0 || severity > 1) {
          this.log('warning', 'scenario', `incomplete-event-${event.id}-${this.currentTick}`,
            `Timeline event "${event.id}" must identify the left pleural space and a finite severity from 0 to 1, so the event had no effect.`);
          return;
        }
        this.tensionPneumothoraxSeverity = Math.max(this.tensionPneumothoraxSeverity, severity);
        this.pneumothoraxAssessedAtTick = null;
        this.pneumothoraxDecompressedAtTick = null;
        this.lastExposure = { agentId: 'left-pleural-space', tick: this.currentTick };
        return;
      }

      case 'cardiac-tamponade': {
        const severity = event.value;
        if (event.target !== 'traumatic-pericardial-pressure' || typeof severity !== 'number'
          || !Number.isFinite(severity) || severity < 0 || severity > 1) {
          this.log('warning', 'scenario', `incomplete-event-${event.id}-${this.currentTick}`,
            `Timeline event "${event.id}" must identify traumatic pericardial pressure and a finite severity from 0 to 1, so the event had no effect.`);
          return;
        }
        this.cardiacTamponadeSeverity = Math.max(this.cardiacTamponadeSeverity, severity);
        this.tamponadeContextReviewedAtTick = null;
        this.tamponadePocusReviewedAtTick = null;
        this.tamponadeDefinitiveControlAtTick = null;
        this.tamponadeReassessedAtTick = null;
        return;
      }

      case 'difficult-airway': {
        const deliveryFraction = event.value;
        if (event.target !== 'failed-intubation-with-marginal-mask'
          || typeof deliveryFraction !== 'number' || !Number.isFinite(deliveryFraction)
          || deliveryFraction <= 0 || deliveryFraction > 1) {
          this.log('warning', 'scenario', `incomplete-event-${event.id}-${this.currentTick}`,
            `Timeline event "${event.id}" must identify failed-intubation-with-marginal-mask `
            + 'and a finite assisted-delivery fraction greater than 0 and at most 1.');
          return;
        }
        if (this.patient.airway.intubated || this.patient.airway.supraglotticAirwayPlaced
          || this.difficultAirwayMaskFraction !== null) {
          this.log('warning', 'scenario', `inapplicable-event-${event.id}-${this.currentTick}`,
            `Timeline event "${event.id}" cannot configure a difficult-airway course after an `
            + 'airway device or course is already in place, so it had no effect.');
          return;
        }
        this.difficultAirwayMaskFraction = deliveryFraction;
        return;
      }

      case 'rhythm-change': {
        const rhythm = event.target;
        if (!rhythm) {
          this.log('warning', 'scenario', `incomplete-event-${event.id}-${this.currentTick}`,
            `Timeline event "${event.id}" changes the rhythm but names no target rhythm.`);
          return;
        }
        this.rhythm = rhythm as RhythmId;
        if (this.rhythm === 'ventricular-fibrillation' || this.rhythm === 'asystole'
          || this.rhythm === 'pea') {
          this.startScriptedCardiacArrest();
        }
        this.log('critical', 'rhythm', `rhythm-${event.id}-${this.currentTick}`,
          `Rhythm changed to ${this.rhythm}`);
        return;
      }

      case 'artifact': {
        const id = event.target;
        if (!id) {
          this.log('warning', 'scenario', `incomplete-event-${event.id}-${this.currentTick}`,
            `Timeline event "${event.id}" injects an artifact but names no target artifact.`);
          return;
        }
        // `value: 0` clears it; anything else, including absent, sets it.
        const active = event.value !== 0;
        if (id === 'sampling-line-obstruction' && active && !this.artifacts.has(id)) {
          this.capnographyVentilationCrossChecked = false;
        }
        if ((id === 'arterial-damping' || id === 'arterial-transducer-misleveled')
          && active && !this.artifacts.has(id)) {
          this.arterialWaveformAssessed = false;
          this.arterialLeveledAndZeroed = false;
          this.pendingNibpCompletesAtTick = null;
          this.nibpMeanArterialMmHg = null;
          this.nibpMeasuredAtTick = null;
        }
        this.artifacts[active ? 'add' : 'delete'](id as ArtifactId);
        this.waveforms.setArtifact(id as ArtifactId, active);
        this.log('artifact', 'artifact', `artifact-${id}-${this.currentTick}`,
          `${active ? 'Injected' : 'Cleared'} sensor artifact: ${id}`);
        return;
      }

      case 'equipment-failure': {
        const failure = event.target;
        // Only failures that map onto equipment this engine actually models. An
        // invented failure that changed nothing would be the very thing this
        // method exists to stop.
        switch (failure) {
          case 'ventilator-disconnection':
            this.setVentilator({ delivering: false });
            this.log('critical', 'equipment', `equipment-${event.id}-${this.currentTick}`,
              'The breathing circuit has disconnected. The ventilator is no longer delivering.');
            return;
          case 'oxygen-supply':
            this.setVentilator({ fio2: 0.21 });
            this.log('critical', 'equipment', `equipment-${event.id}-${this.currentTick}`,
              'Oxygen supply failure. The delivered fraction has fallen to air.');
            return;
          case 'vaporizer':
            this.setVentilator({ sevofluranePercent: 0 });
            this.log('critical', 'equipment', `equipment-${event.id}-${this.currentTick}`,
              'The vaporizer has stopped delivering agent.');
            return;
          case 'hypnotic-line-disconnection':
            this.hypnoticLineConnected = false;
            this.hypnoticLineInspected = false;
            // Deliberately no diagnostic log entry. The scenario event may carry
            // a generic observation for replay/debrief, but naming the line fault
            // here would reveal the answer before the learner inspects it.
            return;
          case 'co2-absorbent-exhaustion':
            this.co2AbsorbentExhausted = true;
            this.circuitCapnogramAssessed = false;
            this.circuitAbsorbentReplaced = false;
            // Do not diagnose the cause in the event log. The raised inspiratory
            // baseline is the evidence the learner is meant to interpret.
            return;
          default:
            this.log('warning', 'scenario', `incomplete-event-${event.id}-${this.currentTick}`,
              `Timeline event "${event.id}" declares an equipment failure this engine does not `
              + `model: "${String(failure)}". Modelled failures are ventilator-disconnection, `
              + 'oxygen-supply, vaporizer, hypnotic-line-disconnection and co2-absorbent-exhaustion.');
            return;
        }
      }
    }

    // Exhaustiveness. If a name is added to EVENT_TYPES and not handled above,
    // this assignment fails to compile — which is the entire point of the switch
    // being written this way.
    const unhandled: never = event.type;
    this.log('warning', 'scenario', `unhandled-event-${event.id}-${this.currentTick}`,
      `Timeline event type "${String(unhandled)}" is declared but this engine does not handle it.`);
  }

  /** Advance exactly one tick. */
  step(): EngineTick {
    if (this.pendingSupraglotticInsertion
      && this.currentTick >= this.pendingSupraglotticInsertion.completesAtTick) {
      this.patient.airway.placeSupraglotticAirway();
      this.pendingSupraglotticInsertion = null;
      this.log('warning', 'airway', `sga-insertion-complete-${this.currentTick}`,
        'Supraglottic airway placed. Confirm gas exchange after explicitly starting assisted ventilation.',
        { device: 'supraglottic-airway', teachingModel: true });
    }
    if (this.pendingLaryngoscopy && this.currentTick >= this.pendingLaryngoscopy.completesAtTick) {
      const { result, configuredFailure } = this.pendingLaryngoscopy;
      this.patient.airway.completeAttempt(result);
      this.lastGrade = result.grade;
      this.log('warning', 'airway', `laryngoscopy-${this.patient.airway.attempts}`, result.narrative, {
        grade: result.grade, attempt: this.patient.airway.attempts,
        intubated: result.intubated, teachingModel: configuredFailure,
      });
      this.pendingLaryngoscopy = null;
      if (result.intubated) this.setVentilator({ mode: 'volume-control', delivering: true });
    }
    // --- Timeline -------------------------------------------------------------
    let stimulus = 0;
    let bloodLossMl = 0;
    let crystalloidMl = 0;
    let obstruction = 0;

    for (const event of this.scenario.timeline) {
      const declared: TimelineEvent = event;
      const holds = this.conditionMet(declared);
      const heldLastTick = this.conditionHeld.has(declared.id);
      if (holds) this.conditionHeld.add(declared.id);
      else this.conditionHeld.delete(declared.id);

      // Rising edge only, and once unless the event says otherwise.
      if (!holds || heldLastTick) continue;
      if (!declared.repeatable && this.firedEvents.has(declared.id)) continue;
      this.firedEvents.add(declared.id);
      this.fireTimelineEvent(declared);
    }
    this.running = this.running.filter((event) => event.untilTick > this.currentTick);
    if (this.cardiacArrestActive && this.chestCompressionsActive) {
      this.chestCompressionTicks += 1;
      this.lastChestCompressionTick = this.currentTick;
    }
    for (const event of this.running) {
      if (event.type === 'surgical-stimulus') stimulus = Math.max(stimulus, event.value);
      if (event.type === 'blood-loss') bloodLossMl += event.value / 600;
      if (event.type === 'crystalloid') crystalloidMl += event.value / 600;
      if (event.type === 'obstruction') obstruction = Math.max(obstruction, event.value);
    }
    bloodLossMl += this.injectedBloodLossMlPerMin / 600;
    obstruction = Math.max(obstruction, this.injectedBronchospasmSeverity);
    crystalloidMl += this.pendingCrystalloidMl;
    this.pendingCrystalloidMl = 0;
    const packedRedCellUnits = this.pendingPackedRedCellUnits;
    const packedRedCellVolumeMl = this.pendingPackedRedCellVolumeMl;
    const packedRedCellHemoglobinG = this.pendingPackedRedCellHemoglobinG;
    const freshFrozenPlasmaVolumeMl = this.pendingFreshFrozenPlasmaVolumeMl;
    this.pendingPackedRedCellUnits = 0;
    this.pendingPackedRedCellVolumeMl = 0;
    this.pendingPackedRedCellHemoglobinG = 0;
    this.pendingFreshFrozenPlasmaVolumeMl = 0;
    const stateBeforeStep = Object.keys(this.lastState).length > 0
      ? this.lastState as PatientState
      : this.patient.snapshot();

    // --- Pharmacokinetics ------------------------------------------------------
    for (const drug of this.drugs.values()) {
      const deliveredRate = drug.drugId === 'propofol' && !this.hypnoticLineConnected
        ? 0 : drug.infusionRate;
      drug.solver.step(deliveredRate);
      if (drug.solver.hasEffectSiteCurve) {
        const current = drug.solver.effectSite;
        const peak = this.lastEffectSitePeak.get(drug.drugId) ?? 0;
        if (current > peak) this.lastEffectSitePeak.set(drug.drugId, current);
      }
    }
    const propofol = this.drugs.get('propofol');
    const remifentanil = this.drugs.get('remifentanil');
    const rocuronium = this.drugs.get('rocuronium');
    const propofolCe = propofol?.solver.hasEffectSiteCurve ? propofol.solver.effectSite : 0;
    // Remifentanil is dosed in micrograms into litres, so the plasma value is
    // µg/L, which is the same number as ng/mL.
    const remifentanilCe = remifentanil?.solver.hasEffectSiteCurve ? remifentanil.solver.effectSite : 0;
    const rawRocuroniumCe = Math.max(
      rocuronium?.solver.hasEffectSiteCurve ? rocuronium.solver.effectSite : 0,
      this.configuredResidualRocuroniumCe,
    );
    const rocuroniumCe = rawRocuroniumCe * (1 - this.neuromuscularReversalFraction);
    this.postTetanicCount = neuromuscularState(rocuroniumCe).postTetanicCount;

    // The event declares latent susceptibility; real volatile exposure starts
    // the physiology. Once active, trigger removal prevents further escalation
    // but does not itself reverse the self-sustaining crisis.
    const endTidalSevo = Number(this.lastState.endTidalSevofluranePercent ?? 0);
    const volatileTriggerPresent = Number.isFinite(endTidalSevo) && endTidalSevo >= 0.2;
    if (volatileTriggerPresent && this.malignantHyperthermiaSusceptibility > 0) {
      const triggerTarget = this.malignantHyperthermiaSusceptibility
        * (1 - 0.5 * this.dantroleneEffectFraction);
      this.malignantHyperthermiaActivation += (
        triggerTarget - this.malignantHyperthermiaActivation
      ) * (1 - Math.exp(-1 / (600 * 0.25)));
    }
    this.malignantHyperthermiaActivation = clamp(this.malignantHyperthermiaActivation, 0, 1);
    this.dantroleneEffectFraction *= Math.exp(-1 / (600 * 30));
    const unopposedHypermetabolism = this.malignantHyperthermiaActivation;

    const unopposedAnaphylaxis = this.anaphylaxisSeverity
      * (1 - 0.75 * this.epinephrineEffect);
    if (this.lipidEmulsionInfusionMlPerMin > 0) {
      const protocol = lastLipidProtocolForWeight(this.covariates.weightKg);
      if (this.lipidEmulsionInfusionStartedAtTick !== null
        && this.currentTick - this.lipidEmulsionInfusionStartedAtTick
          >= LAST_LIPID_INITIAL_INFUSION_SECONDS * TICKS_PER_SECOND) {
        this.lipidEmulsionInfusionMlPerMin = 0;
        this.log('info', 'drug', `lipid-emulsion-initial-course-complete-${this.currentTick}`,
          'The bounded 20-minute initial lipid infusion course is complete. The 12 mL/kg value remains a safety ceiling, not a target dose.');
      } else {
        const bolusPerTick = protocol.initialBolusMl
          / (LAST_LIPID_BOLUS_SECONDS * TICKS_PER_SECOND);
        const deliveredBolusMl = Math.min(this.lipidEmulsionBolusRemainingMl, bolusPerTick);
        this.lipidEmulsionBolusRemainingMl -= deliveredBolusMl;
        const deliveredMl = deliveredBolusMl + this.lipidEmulsionInfusionMlPerMin / 600;
        this.lipidEmulsionTotalMl = Math.min(
          protocol.maxTotalMl, this.lipidEmulsionTotalMl + deliveredMl,
        );
        const bolusFraction = 1 - this.lipidEmulsionBolusRemainingMl / protocol.initialBolusMl;
        this.lipidEmulsionEffectFraction = clamp(
          0.35 * bolusFraction + 0.65 * Math.max(0, this.lipidEmulsionTotalMl - protocol.initialBolusMl)
            / Math.max(protocol.maxTotalMl - protocol.initialBolusMl, 1),
          0, 1,
        );
        if (this.lipidEmulsionTotalMl >= protocol.maxTotalMl) {
          this.lipidEmulsionInfusionMlPerMin = 0;
          this.log('info', 'drug', `lipid-emulsion-cap-${this.currentTick}`,
            `20% lipid emulsion stopped at the modeled ${protocol.maxTotalMl.toFixed(0)} mL cumulative cap.`);
        }
      }
    }
    const unopposedLocalAnestheticToxicity = this.localAnestheticToxicitySeverity
      * (1 - 0.8 * this.lipidEmulsionEffectFraction);
    this.seizureActivityFraction = this.seizureSuppressed
      ? 0 : Math.max(
        clamp((unopposedLocalAnestheticToxicity - 0.2) / 0.6, 0, 1),
        this.statusEpilepticusSeverity,
      );
    obstruction = Math.max(obstruction, 0.85 * unopposedAnaphylaxis);
    obstruction *= 1 - 0.8 * this.bronchodilatorEffectFraction;
    this.bronchospasmSeverity = obstruction;
    const capillaryLeakMl = unopposedAnaphylaxis * 5 / TICKS_PER_SECOND;
    // Exact slopes and magnitudes are bounded teaching calibrations. The clinical
    // direction is sourced; neither drive estimates block height or gas volume.
    this.highSpinalFraction += (this.highSpinalSeverity - this.highSpinalFraction)
      * (1 - Math.exp(-0.1 / 20));
    const venousAirTimeConstantSeconds = this.venousAirEmbolismSeverity
      >= this.venousAirEmbolismFraction ? 2 : 60;
    this.venousAirEmbolismFraction += (
      this.venousAirEmbolismSeverity - this.venousAirEmbolismFraction
    ) * (1 - Math.exp(-0.1 / venousAirTimeConstantSeconds));
    const pneumothoraxTimeConstantSeconds = this.tensionPneumothoraxSeverity
      >= this.tensionPneumothoraxFraction ? 4 : 12;
    this.tensionPneumothoraxFraction += (
      this.tensionPneumothoraxSeverity - this.tensionPneumothoraxFraction
    ) * (1 - Math.exp(-0.1 / pneumothoraxTimeConstantSeconds));
    const tamponadeTimeConstantSeconds = this.cardiacTamponadeSeverity
      >= this.cardiacTamponadeFraction ? 8 : 20;
    this.cardiacTamponadeFraction += (
      this.cardiacTamponadeSeverity - this.cardiacTamponadeFraction
    ) * (1 - Math.exp(-0.1 / tamponadeTimeConstantSeconds));

    // --- Physiology ------------------------------------------------------------
    const effectiveVentilator = this.pendingLaryngoscopy || this.pendingSupraglotticInsertion
      ? { ...this.ventilator, delivering: false }
      : this.ventilator;
    const airwayDeliveryFraction = this.patient.airway.intubated
      || this.patient.airway.supraglotticAirwayPlaced
      ? 1
      // The difficulty is unanticipated: preoxygenation before the first
      // attempt uses the ordinary facemask path. Marginal assisted ventilation
      // becomes apparent only after the first failed tracheal attempt.
      : this.patient.airway.attempts > 0 ? this.difficultAirwayMaskFraction ?? 1 : 1;
    const depthBeforePhysiology = this.patient.depthIndex({
      propofolCe, remifentanilCe, rocuroniumCe, vasopressorEffect: this.vasopressorEffect,
      epinephrineEffect: this.epinephrineEffect,
    });
    this.upperAirwayClosureFraction = stepLaryngospasm(
      this.upperAirwayClosureFraction,
      {
        jawThrustCpap: this.currentTick < this.jawThrustCpapUntilTick,
        positivePressure: effectiveVentilator.delivering
          && effectiveVentilator.tidalVolumeMl > 0
          && effectiveVentilator.respiratoryRateBpm > 0,
        fio2: effectiveVentilator.fio2,
        depthIndex: depthBeforePhysiology,
      },
      1 / TICKS_PER_SECOND,
    );
    this.postExtubationObstructionSeverity = stepUpperAirwayObstruction(
      this.postExtubationObstructionSeverity,
      {
        jawThrustCpap: this.currentTick < this.jawThrustCpapUntilTick,
        positivePressure: effectiveVentilator.delivering
          && effectiveVentilator.tidalVolumeMl > 0
          && effectiveVentilator.respiratoryRateBpm > 0,
        fio2: effectiveVentilator.fio2,
      },
      1 / TICKS_PER_SECOND,
    );
    this.opioidVentilatoryImpairmentSeverity = stepOpioidVentilatoryImpairment(
      this.opioidVentilatoryImpairmentSeverity,
      this.opioidVentilatoryImpairmentTarget,
      1 / TICKS_PER_SECOND,
    );
    const result = this.patient.tick(
      {
        propofolCe, remifentanilCe, rocuroniumCe,
        vasopressorEffect: this.vasopressorEffect, epinephrineEffect: this.epinephrineEffect,
      },
      effectiveVentilator,
      {
        surgicalStimulus: stimulus, obstructionFraction: obstruction, airwayDeliveryFraction,
        upperAirwayClosureFraction: this.upperAirwayClosureFraction,
        upperAirwayObstructionFraction: this.postExtubationObstructionSeverity,
        spontaneousRespiratoryRateFraction:
          1 - 0.9 * this.opioidVentilatoryImpairmentSeverity,
        spontaneousTidalVolumeFraction:
          1 - 0.2 * this.opioidVentilatoryImpairmentSeverity,
        bloodLossMl, crystalloidMl,
        packedRedCellVolumeMl, packedRedCellHemoglobinG, freshFrozenPlasmaVolumeMl,
        anaphylaxisFraction: unopposedAnaphylaxis, capillaryLeakMl,
        hypermetabolicFraction: unopposedHypermetabolism,
        activeCooling: this.activeCooling,
        ...(this.perioperativeTemperatureTargetC === null
          ? {} : { perioperativeTemperatureTargetC: this.perioperativeTemperatureTargetC }),
        localAnestheticToxicityFraction: unopposedLocalAnestheticToxicity,
        // An airway procedure occupies the airway. Disabling only commanded
        // breaths left residual spontaneous breaths passing through active
        // laryngoscopy, contradicting the attempt log and spending no oxygen
        // reserve in a lightly anesthetized patient.
        spontaneousVentilationFraction: this.pendingLaryngoscopy
          || this.pendingSupraglotticInsertion
          ? 0
          : 1 - 0.7 * this.highSpinalFraction,
      },
    );
    if (this.activeCooling && result.state.coreTemperatureC < 38) {
      this.activeCooling = false;
      this.log('info', 'equipment', `active-cooling-auto-stop-${this.currentTick}`,
        'Active cooling stopped automatically below 38 °C.',
        { active: false, teachingModel: true });
    }
    // A vasopressor's effect wanes; the teaching model decays it over about five minutes.
    this.vasopressorEffect *= Math.exp(-0.1 / 5);
    // Titrated boluses are short acting; this teaching effect decays over roughly 90 seconds.
    this.epinephrineEffect *= Math.exp(-0.1 / 90);
    this.bronchodilatorEffectFraction *= Math.exp(-0.1 / 600);
    if (this.labetalolTotalMg > 0) {
      this.labetalolEffectFraction += (1 - this.labetalolEffectFraction)
        * (1 - Math.exp(-0.1 / 45));
    }

    if (!this.cardiacArrestActive) this.reconcileArrest(result.state.cardiacOutputLPerMin ?? 0);

    let crisisState: PatientState = result.state;
    if (this.highSpinalFraction > 0) {
      const fraction = this.highSpinalFraction;
      const heartRateFactor = 1 - 0.55 * fraction;
      const pressureFactor = 1 - 0.6 * fraction;
      crisisState = {
        ...crisisState,
        heartRateBpm: crisisState.heartRateBpm * heartRateFactor,
        strokeVolumeMl: crisisState.strokeVolumeMl * (1 - 0.35 * fraction),
        cardiacOutputLPerMin: crisisState.cardiacOutputLPerMin
          * heartRateFactor * (1 - 0.35 * fraction),
        svrDynSCm5: crisisState.svrDynSCm5 * (1 - 0.45 * fraction),
        systolicMmHg: crisisState.systolicMmHg * pressureFactor,
        diastolicMmHg: crisisState.diastolicMmHg * pressureFactor,
        meanArterialMmHg: crisisState.meanArterialMmHg * pressureFactor,
      };
    }
    if (this.venousAirEmbolismFraction > 0) {
      const fraction = this.venousAirEmbolismFraction;
      crisisState = {
        ...crisisState,
        heartRateBpm: crisisState.heartRateBpm * (1 + 0.15 * fraction),
        strokeVolumeMl: crisisState.strokeVolumeMl * (1 - 0.55 * fraction),
        cardiacOutputLPerMin: crisisState.cardiacOutputLPerMin * (1 - 0.5 * fraction),
        systolicMmHg: crisisState.systolicMmHg * (1 - 0.45 * fraction),
        diastolicMmHg: crisisState.diastolicMmHg * (1 - 0.45 * fraction),
        meanArterialMmHg: crisisState.meanArterialMmHg * (1 - 0.45 * fraction),
        etco2MmHg: crisisState.etco2MmHg * (1 - 0.6 * fraction),
        spo2Percent: clamp(crisisState.spo2Percent - 8 * fraction, 0, 100),
      };
    }
    if (this.tensionPneumothoraxFraction > 0) {
      const fraction = this.tensionPneumothoraxFraction;
      crisisState = {
        ...crisisState,
        heartRateBpm: crisisState.heartRateBpm * (1 + 0.2 * fraction),
        strokeVolumeMl: crisisState.strokeVolumeMl * (1 - 0.6 * fraction),
        cardiacOutputLPerMin: crisisState.cardiacOutputLPerMin * (1 - 0.55 * fraction),
        systolicMmHg: crisisState.systolicMmHg * (1 - 0.55 * fraction),
        diastolicMmHg: crisisState.diastolicMmHg * (1 - 0.55 * fraction),
        meanArterialMmHg: crisisState.meanArterialMmHg * (1 - 0.55 * fraction),
        etco2MmHg: crisisState.etco2MmHg * (1 - 0.35 * fraction),
        spo2Percent: clamp(crisisState.spo2Percent - 18 * fraction, 0, 100),
      };
    }
    if (this.cardiacTamponadeFraction > 0) {
      const fraction = this.cardiacTamponadeFraction;
      const outputFactor = 1 - 0.65 * fraction;
      const pressureFactor = 1 - 0.6 * fraction;
      crisisState = {
        ...crisisState,
        heartRateBpm: crisisState.heartRateBpm * (1 + 0.12 * fraction),
        strokeVolumeMl: crisisState.strokeVolumeMl * outputFactor,
        cardiacOutputLPerMin: crisisState.cardiacOutputLPerMin * outputFactor,
        systolicMmHg: crisisState.systolicMmHg * pressureFactor,
        diastolicMmHg: crisisState.diastolicMmHg * pressureFactor,
        meanArterialMmHg: crisisState.meanArterialMmHg * pressureFactor,
        etco2MmHg: crisisState.etco2MmHg * (1 - 0.4 * fraction),
      };
    }
    if (this.labetalolEffectFraction > 0) {
      const pressureFactor = 1 - 0.18 * this.labetalolEffectFraction;
      crisisState = {
        ...crisisState,
        heartRateBpm: crisisState.heartRateBpm * (1 - 0.08 * this.labetalolEffectFraction),
        systolicMmHg: crisisState.systolicMmHg * pressureFactor,
        diastolicMmHg: crisisState.diastolicMmHg * pressureFactor,
        meanArterialMmHg: crisisState.meanArterialMmHg * pressureFactor,
      };
    }

    // Exhausted absorbent permits carbon dioxide breakthrough into inspiration.
    // Higher fresh-gas flow reduces rebreathing but does not repair the absorber;
    // the exact curve and time constants are declared teaching calibrations.
    const freshGasBridgeFraction = clamp(
      1 - (this.ventilator.freshGasFlowLPerMin - 1) / 14, 0.05, 1,
    );
    const inspiredCo2Target = this.co2AbsorbentExhausted
      ? EXHAUSTED_ABSORBENT_INSPIRED_CO2_MMHG * freshGasBridgeFraction : 0;
    const circuitTimeConstantSeconds = this.co2AbsorbentExhausted ? 45 : 10;
    this.inspiredCo2MmHg += (inspiredCo2Target - this.inspiredCo2MmHg)
      * (1 - Math.exp(-0.1 / circuitTimeConstantSeconds));
    if (this.inspiredCo2MmHg > 0.001) {
      crisisState = {
        ...crisisState,
        etco2MmHg: crisisState.etco2MmHg + this.inspiredCo2MmHg,
      };
    }

    // This ED vignette declares fixed observed severity anchors that the
    // perioperative gas-exchange model cannot infer from a respiratory profile.
    // Keep the live monitor consistent with those authored findings, then show
    // a bounded response to the two accepted initial treatment intents.
    if (this.scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'adult-asthma',
    )) {
      crisisState = {
        ...crisisState,
        respiratoryRateBpm: this.adultAsthmaBronchodilatorBundleAtTick === null ? 34 : 24,
        spo2Percent: this.adultAsthmaControlledOxygenAtTick === null ? 91 : 94,
      };
    }
    if (this.scenario.timeline.some(
      (event) => event.type === 'narrative'
        && event.target === 'acute-severe-asthma-reassessment',
    )) {
      crisisState = {
        ...crisisState,
        heartRateBpm: 132,
        respiratoryRateBpm: 18,
        spo2Percent: 93,
        systolicMmHg: 102,
        diastolicMmHg: 64,
        meanArterialMmHg: 77,
        coreTemperatureC: 36.8,
      };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'copd-exacerbation-transition-reassessment')) {
      crisisState = { ...crisisState, heartRateBpm: 88, respiratoryRateBpm: 20,
        spo2Percent: 91, systolicMmHg: 126, diastolicMmHg: 74,
        meanArterialMmHg: 91, coreTemperatureC: 36.8 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'community-acquired-pneumonia-hypoxemia-reassessment')) {
      crisisState = { ...crisisState, heartRateBpm: 112, respiratoryRateBpm: 32,
        spo2Percent: 85, systolicMmHg: 116, diastolicMmHg: 70,
        meanArterialMmHg: 85, coreTemperatureC: 38.6 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'post-pulmonary-embolism-persistent-dyspnea-reassessment')) {
      crisisState = { ...crisisState, heartRateBpm: 88, respiratoryRateBpm: 18,
        spo2Percent: 96, systolicMmHg: 122, diastolicMmHg: 76,
        meanArterialMmHg: 91, coreTemperatureC: 36.8 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'acute-pulmonary-edema-respiratory-support-reassessment')) {
      crisisState = { ...crisisState, heartRateBpm: 104, respiratoryRateBpm: 12,
        spo2Percent: 86, etco2MmHg: 60, systolicMmHg: 108, diastolicMmHg: 68,
        meanArterialMmHg: 81, coreTemperatureC: 36.8 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'spontaneous-tension-pneumothorax-post-drainage-reassessment')) {
      crisisState = { ...crisisState, heartRateBpm: 96, respiratoryRateBpm: 22,
        spo2Percent: 93, systolicMmHg: 108, diastolicMmHg: 64,
        meanArterialMmHg: 79, coreTemperatureC: 36.7 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'large-unilateral-pleural-effusion-reassessment')) {
      const reviewed = this.largePleuralEffusionResponseAtTick !== null;
      crisisState = { ...crisisState, heartRateBpm: reviewed ? 92 : 104,
        respiratoryRateBpm: reviewed ? 20 : 26, spo2Percent: reviewed ? 95 : 91,
        systolicMmHg: reviewed ? 124 : 128, diastolicMmHg: reviewed ? 74 : 76,
        meanArterialMmHg: reviewed ? 91 : 93, coreTemperatureC: 36.8 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'bronchiectasis-mucus-plugging-reassessment')) {
      const reviewed = this.bronchiectasisMucusResponseAtTick !== null;
      crisisState = { ...crisisState, heartRateBpm: reviewed ? 98 : 108,
        respiratoryRateBpm: reviewed ? 22 : 28, spo2Percent: reviewed ? 93 : 88,
        systolicMmHg: reviewed ? 116 : 118, diastolicMmHg: reviewed ? 70 : 72,
        meanArterialMmHg: reviewed ? 85 : 87, coreTemperatureC: 37.4 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'chronic-opioid-related-hypoventilation-reassessment')) {
      crisisState = { ...crisisState, heartRateBpm: 76, respiratoryRateBpm: 10,
        spo2Percent: 94, systolicMmHg: 124, diastolicMmHg: 74,
        meanArterialMmHg: 91, coreTemperatureC: 36.7 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'neuromuscular-respiratory-failure-reassessment')) {
      crisisState = { ...crisisState, heartRateBpm: 96, respiratoryRateBpm: 24,
        spo2Percent: 94, etco2MmHg: 44, systolicMmHg: 122, diastolicMmHg: 76,
        meanArterialMmHg: 91, coreTemperatureC: 36.8 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'obesity-hypoventilation-reassessment')) {
      crisisState = { ...crisisState, heartRateBpm: 82, respiratoryRateBpm: 18,
        spo2Percent: 91, etco2MmHg: 46, systolicMmHg: 132, diastolicMmHg: 78,
        meanArterialMmHg: 96, coreTemperatureC: 36.8 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'noninvasive-ventilation-selection')) {
      const reviewed = this.nivSelectionResponseAtTick !== null;
      crisisState = { ...crisisState, heartRateBpm: reviewed ? 94 : 102,
        respiratoryRateBpm: reviewed ? 24 : 30, spo2Percent: 90,
        etco2MmHg: reviewed ? 55 : 62, systolicMmHg: reviewed ? 126 : 128,
        diastolicMmHg: reviewed ? 74 : 76, meanArterialMmHg: reviewed ? 91 : 93,
        coreTemperatureC: 37.2 };
    }
    if (this.scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'copd-exacerbation',
    )) {
      crisisState = {
        ...crisisState,
        respiratoryRateBpm: this.copdBronchodilatorBundleAtTick === null ? 28 : 22,
        spo2Percent: this.copdControlledOxygenAtTick === null ? 90 : 91,
      };
    }
    if (this.scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'acute-pulmonary-edema',
    )) {
      const treated = this.pulmonaryEdemaVasodilatorIntentAtTick !== null;
      crisisState = {
        ...crisisState,
        respiratoryRateBpm: this.pulmonaryEdemaNivAtTick === null ? 32 : 22,
        spo2Percent: this.pulmonaryEdemaNivAtTick === null ? 90 : 96,
        systolicMmHg: treated ? 146 : 188,
        diastolicMmHg: treated ? 86 : 112,
        meanArterialMmHg: treated ? 106 : 137,
      };
    }
    if (this.scenario.timeline.some((event) =>
      event.type === 'narrative' && event.target === 'pulmonary-embolism-deterioration')) {
      const deteriorated = this.pulmonaryEmbolismDeteriorationAtTick !== null;
      crisisState = { ...crisisState,
        heartRateBpm: deteriorated ? 138 : 124,
        respiratoryRateBpm: deteriorated ? 34 : 30,
        spo2Percent: this.pulmonaryEmbolismOxygenAtTick === null ? 90 : 92,
        systolicMmHg: deteriorated ? 78 : 112,
        diastolicMmHg: deteriorated ? 50 : 70,
        meanArterialMmHg: deteriorated ? 59 : 84 };
    }
    if (this.scenario.timeline.some((event) =>
      event.type === 'narrative' && event.target === 'stemi')) {
      crisisState = { ...crisisState, heartRateBpm: 104, respiratoryRateBpm: 20,
        spo2Percent: 95, systolicMmHg: 146, diastolicMmHg: 92, meanArterialMmHg: 110 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'stemi-recognition-and-first-actions')) {
      crisisState = { ...crisisState, heartRateBpm: 62, respiratoryRateBpm: 16,
        spo2Percent: 96, systolicMmHg: 128, diastolicMmHg: 76,
        meanArterialMmHg: 93, coreTemperatureC: 36.7 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'right-ventricular-infarction')) {
      crisisState = { ...crisisState, heartRateBpm: 54, respiratoryRateBpm: 18,
        spo2Percent: 96, etco2MmHg: 36, systolicMmHg: 86, diastolicMmHg: 60,
        meanArterialMmHg: 69, coreTemperatureC: 36.6 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'hypertensive-emergency-reassessment')) {
      const later = this.hypertensiveEmergencyLaterPanelAtTick !== null;
      const handoff = this.hypertensiveEmergencyHandoffAtTick !== null;
      crisisState = { ...crisisState, heartRateBpm: handoff ? 80 : later ? 82 : 86,
        respiratoryRateBpm: 16, spo2Percent: 98,
        systolicMmHg: handoff ? 188 : later ? 212 : 236,
        diastolicMmHg: handoff ? 106 : later ? 122 : 132,
        meanArterialMmHg: handoff ? 133 : later ? 152 : 167,
        coreTemperatureC: 36.8 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'pacemaker-capture-failure-reassessment')) {
      const restored = this.pacemakerCaptureFailureLaterPanelAtTick !== null;
      crisisState = { ...crisisState, heartRateBpm: restored ? 70 : 32,
        respiratoryRateBpm: 18, spo2Percent: 97, etco2MmHg: restored ? 37 : 34,
        systolicMmHg: restored ? 114 : 84, diastolicMmHg: restored ? 68 : 52,
        meanArterialMmHg: restored ? 83 : 63, coreTemperatureC: 36.7 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'transcutaneous-pacing-mechanical-capture-reassessment')) {
      crisisState = { ...crisisState, heartRateBpm: 70, respiratoryRateBpm: 0,
        spo2Percent: 0, etco2MmHg: 0, strokeVolumeMl: 0, cardiacOutputLPerMin: 0,
        systolicMmHg: 0, diastolicMmHg: 0, meanArterialMmHg: 0,
        perfusionIndex: 0, coreTemperatureC: 36.6 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'post-infarction-cardiogenic-shock-escalation')) {
      const reassessed = this.postInfarctionShockHandoffAtTick !== null;
      crisisState = { ...crisisState, heartRateBpm: reassessed ? 104 : 108,
        respiratoryRateBpm: reassessed ? 24 : 26, spo2Percent: reassessed ? 94 : 93,
        etco2MmHg: reassessed ? 32 : 31, systolicMmHg: reassessed ? 88 : 84,
        diastolicMmHg: reassessed ? 57 : 54, meanArterialMmHg: reassessed ? 67 : 64,
        coreTemperatureC: 36.3 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'nstemi-risk-reassessment')) {
      crisisState = { ...crisisState, heartRateBpm: 88, respiratoryRateBpm: 16,
        spo2Percent: 97, systolicMmHg: 132, diastolicMmHg: 78,
        meanArterialMmHg: 96, coreTemperatureC: 36.7 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'regular-narrow-complex-tachycardia')) {
      const reassessed = this.stableNarrowReassessmentAtTick !== null;
      crisisState = { ...crisisState, heartRateBpm: reassessed ? 88 : 176,
        respiratoryRateBpm: 18, spo2Percent: 98, etco2MmHg: 36,
        systolicMmHg: reassessed ? 122 : 124, diastolicMmHg: reassessed ? 76 : 78,
        meanArterialMmHg: reassessed ? 91 : 93, coreTemperatureC: 36.8 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'wide-complex-tachycardia')) {
      const converted = this.stableWideReassessmentAtTick !== null;
      const nonresponse = this.stableWideNonresponseAtTick !== null;
      crisisState = { ...crisisState, heartRateBpm: converted ? 84 : nonresponse ? 158 : 164,
        respiratoryRateBpm: 18, spo2Percent: 97, etco2MmHg: 36,
        systolicMmHg: converted ? 120 : nonresponse ? 114 : 118,
        diastolicMmHg: converted ? 74 : nonresponse ? 70 : 72,
        meanArterialMmHg: converted ? 89 : nonresponse ? 85 : 87, coreTemperatureC: 36.8 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'symptomatic-sinus-bradycardia-reassessment')) {
      crisisState = { ...crisisState, heartRateBpm: 44, respiratoryRateBpm: 16,
        spo2Percent: 98, etco2MmHg: 36, systolicMmHg: 134, diastolicMmHg: 72,
        meanArterialMmHg: 93, coreTemperatureC: 36.7 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'complete-heart-block')) {
      crisisState = { ...crisisState, heartRateBpm: 34, respiratoryRateBpm: 16,
        spo2Percent: 98, etco2MmHg: 36, systolicMmHg: 116, diastolicMmHg: 70,
        meanArterialMmHg: 85, coreTemperatureC: 36.7 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'torsades-de-pointes')) {
      const converted = this.torsadesPostShockAtTick !== null;
      crisisState = { ...crisisState, heartRateBpm: converted ? 52 : 220,
        respiratoryRateBpm: converted ? 16 : 22, spo2Percent: converted ? 97 : 96,
        etco2MmHg: converted ? 36 : 28, systolicMmHg: converted ? 112 : 74,
        diastolicMmHg: converted ? 68 : 42, meanArterialMmHg: converted ? 83 : 53,
        coreTemperatureC: 36.7 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'hyperkalemic-conduction-disturbance')) {
      const improved = this.hyperkalemicConductionLaterPanelAtTick !== null;
      crisisState = { ...crisisState, heartRateBpm: improved ? 62 : 52,
        respiratoryRateBpm: 16, spo2Percent: 97, etco2MmHg: 36,
        systolicMmHg: improved ? 122 : 118, diastolicMmHg: improved ? 72 : 70,
        meanArterialMmHg: improved ? 89 : 86, coreTemperatureC: 36.7 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'pericardial-tamponade-reassessment')) {
      const later = this.pericardialTamponadeHandoffAtTick !== null;
      crisisState = { ...crisisState, heartRateBpm: later ? 90 : 88,
        respiratoryRateBpm: 18, spo2Percent: 97, etco2MmHg: 36,
        systolicMmHg: later ? 114 : 116, diastolicMmHg: later ? 70 : 72,
        meanArterialMmHg: later ? 85 : 87, coreTemperatureC: 36.7 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'unstable-narrow-complex-tachycardia')) {
      const cardioverted = this.unstableNarrowTachycardiaCardiovertedAtTick !== null;
      crisisState = { ...crisisState, heartRateBpm: cardioverted ? 92 : 188,
        respiratoryRateBpm: cardioverted ? 18 : 24, spo2Percent: cardioverted ? 95 : 94,
        systolicMmHg: cardioverted ? 118 : 76, diastolicMmHg: cardioverted ? 72 : 48,
        meanArterialMmHg: cardioverted ? 87 : 57 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'unstable-bradycardia')) {
      const treated = this.unstableBradycardiaAtropineAtTick !== null;
      crisisState = { ...crisisState, heartRateBpm: treated ? 68 : 38,
        respiratoryRateBpm: treated ? 18 : 20, spo2Percent: treated ? 96 : 91,
        systolicMmHg: treated ? 112 : 78, diastolicMmHg: treated ? 70 : 46,
        meanArterialMmHg: treated ? 84 : 57 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'status-epilepticus')) {
      const supported = this.statusEpilepticusSupportedAtTick !== null;
      const treated = this.statusEpilepticusLorazepamAtTick !== null;
      crisisState = { ...crisisState, heartRateBpm: treated ? 98 : 118,
        respiratoryRateBpm: treated ? 18 : 24, spo2Percent: supported ? 96 : 92 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'right-ventricular-failure')) {
      const reassessed = this.rvFailureReassessmentAtTick !== null;
      crisisState = { ...crisisState,
        heartRateBpm: reassessed ? 108 : 116,
        respiratoryRateBpm: 24,
        spo2Percent: reassessed ? 94 : 91,
        systolicMmHg: reassessed ? 94 : 82,
        diastolicMmHg: reassessed ? 52 : 46,
        meanArterialMmHg: reassessed ? 66 : 58 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'massive-pulmonary-embolism')) {
      const reassessed = this.massivePeReassessmentAtTick !== null;
      crisisState = { ...crisisState,
        heartRateBpm: reassessed ? 112 : 132,
        respiratoryRateBpm: 26,
        spo2Percent: reassessed ? 94 : 82,
        systolicMmHg: reassessed ? 96 : 72,
        diastolicMmHg: reassessed ? 54 : 38,
        meanArterialMmHg: reassessed ? 68 : 50 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'upper-gi-hemorrhage')) {
      const reassessed = this.upperGiHemorrhageReassessmentAtTick !== null;
      crisisState = { ...crisisState,
        heartRateBpm: reassessed ? 104 : 122,
        respiratoryRateBpm: 24,
        spo2Percent: 96,
        systolicMmHg: reassessed ? 94 : 78,
        diastolicMmHg: reassessed ? 55 : 43,
        meanArterialMmHg: reassessed ? 68 : 55 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'critical-care-status-epilepticus')) {
      const reassessed = this.criticalCareStatusReassessmentAtTick !== null;
      crisisState = { ...crisisState,
        heartRateBpm: reassessed ? 102 : 118,
        respiratoryRateBpm: 18,
        spo2Percent: reassessed ? 96 : 94,
        systolicMmHg: reassessed ? 96 : 86,
        diastolicMmHg: reassessed ? 54 : 50,
        meanArterialMmHg: reassessed ? 68 : 62,
        coreTemperatureC: reassessed ? 37.9 : 38.1 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'targeted-temperature-management')) {
      const reassessed = this.postArrestTemperatureReassessmentAtTick !== null;
      crisisState = { ...crisisState,
        heartRateBpm: reassessed ? 92 : 98,
        respiratoryRateBpm: 18,
        spo2Percent: reassessed ? 97 : 96,
        systolicMmHg: reassessed ? 100 : 96,
        diastolicMmHg: reassessed ? 55 : 54,
        meanArterialMmHg: reassessed ? 70 : 68,
        coreTemperatureC: reassessed ? 37.4 : 38.3 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'intracranial-hypertension')) {
      const reassessed = this.intracranialHypertensionReassessmentAtTick !== null;
      crisisState = { ...crisisState,
        heartRateBpm: reassessed ? 84 : 88,
        respiratoryRateBpm: 16,
        spo2Percent: 97,
        etco2MmHg: reassessed ? 38 : 40,
        systolicMmHg: reassessed ? 112 : 108,
        diastolicMmHg: reassessed ? 70 : 68,
        meanArterialMmHg: reassessed ? 84 : 82,
        coreTemperatureC: reassessed ? 37.5 : 37.7 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'acute-kidney-injury-with-fluid-overload')) {
      const reassessed = this.akiFluidOverloadReassessmentAtTick !== null;
      crisisState = { ...crisisState,
        heartRateBpm: reassessed ? 96 : 104,
        respiratoryRateBpm: 20,
        spo2Percent: reassessed ? 95 : 91,
        systolicMmHg: reassessed ? 100 : 96,
        diastolicMmHg: reassessed ? 60 : 58,
        meanArterialMmHg: reassessed ? 74 : 72,
        coreTemperatureC: reassessed ? 37.3 : 37.4 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'severe-acidemia')) {
      const reassessed = this.severeAcidemiaReassessmentAtTick !== null;
      crisisState = { ...crisisState,
        heartRateBpm: reassessed ? 112 : 122,
        respiratoryRateBpm: 18,
        spo2Percent: 95,
        etco2MmHg: reassessed ? 32 : 48,
        systolicMmHg: reassessed ? 94 : 84,
        diastolicMmHg: reassessed ? 55 : 48,
        meanArterialMmHg: reassessed ? 68 : 61,
        coreTemperatureC: reassessed ? 38.2 : 38.4 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'icu-handoff-with-hidden-deterioration')) {
      const reassessed = this.icuHandoffAcceptanceAtTick !== null;
      crisisState = { ...crisisState,
        heartRateBpm: reassessed ? 108 : 118,
        respiratoryRateBpm: 18,
        spo2Percent: 96,
        etco2MmHg: reassessed ? 33 : 30,
        systolicMmHg: reassessed ? 96 : 88,
        diastolicMmHg: reassessed ? 57 : 52,
        meanArterialMmHg: reassessed ? 70 : 64,
        coreTemperatureC: reassessed ? 38.9 : 39.1 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'ventilator-circuit-disconnection')) {
      const reassessed = this.ventilatorDisconnectionReassessedAtTick !== null;
      crisisState = { ...crisisState,
        heartRateBpm: reassessed ? 98 : 108,
        respiratoryRateBpm: 20,
        spo2Percent: reassessed ? 94 : 88,
        etco2MmHg: reassessed ? 36 : 0,
        systolicMmHg: reassessed ? 105 : 103,
        diastolicMmHg: reassessed ? 63 : 62,
        meanArterialMmHg: reassessed ? 77 : 76,
        coreTemperatureC: 38 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'delayed-vasopressor-delivery')) {
      const reassessed = this.delayedVasopressorReassessedAtTick !== null;
      crisisState = { ...crisisState, heartRateBpm: reassessed ? 108 : 124,
        respiratoryRateBpm: 20, spo2Percent: 95, etco2MmHg: reassessed ? 32 : 29,
        systolicMmHg: reassessed ? 90 : 75, diastolicMmHg: reassessed ? 55 : 44,
        meanArterialMmHg: reassessed ? 67 : 54, coreTemperatureC: reassessed ? 38.9 : 39 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'pulse-oximeter-motion-artifact')) {
      crisisState = { ...crisisState, heartRateBpm: 86, respiratoryRateBpm: 16,
        spo2Percent: 97, etco2MmHg: 37, systolicMmHg: 108, diastolicMmHg: 60,
        meanArterialMmHg: 76, coreTemperatureC: 36.4 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'endotracheal-tube-migration-after-repositioning')) {
      const reassessed = this.tubeMigrationReassessedAtTick !== null;
      crisisState = { ...crisisState, heartRateBpm: reassessed ? 94 : 104,
        respiratoryRateBpm: 18, spo2Percent: reassessed ? 96 : 89,
        etco2MmHg: reassessed ? 39 : 45, systolicMmHg: reassessed ? 105 : 102,
        diastolicMmHg: reassessed ? 63 : 62, meanArterialMmHg: reassessed ? 77 : 75,
        coreTemperatureC: 37.6 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'septic-shock-resuscitation')) {
      const reassessed = this.septicResuscitationReassessedAtTick !== null;
      crisisState = { ...crisisState, heartRateBpm: reassessed ? 110 : 118,
        respiratoryRateBpm: reassessed ? 23 : 24, spo2Percent: 94,
        etco2MmHg: reassessed ? 33 : 31, systolicMmHg: reassessed ? 91 : 86,
        diastolicMmHg: reassessed ? 56 : 53, meanArterialMmHg: reassessed ? 68 : 64,
        coreTemperatureC: reassessed ? 39 : 39.1 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'stable-chest-pain-evaluation')) {
      crisisState = { ...crisisState, heartRateBpm: 72, respiratoryRateBpm: 14,
        spo2Percent: 99, etco2MmHg: 37, systolicMmHg: 126, diastolicMmHg: 75,
        meanArterialMmHg: 92, coreTemperatureC: 36.8 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'acute-decompensated-heart-failure')) {
      crisisState = { ...crisisState, heartRateBpm: 84, respiratoryRateBpm: 18,
        spo2Percent: 94, etco2MmHg: 36, systolicMmHg: 118, diastolicMmHg: 73,
        meanArterialMmHg: 88, coreTemperatureC: 36.8 };
    }
    if (this.scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'atrial-fibrillation-with-rapid-response')) {
      const reassessed = this.afRvrReassessmentAtTick !== null;
      crisisState = { ...crisisState, heartRateBpm: reassessed ? 96 : 142,
        respiratoryRateBpm: reassessed ? 16 : 18, spo2Percent: 97, etco2MmHg: 36,
        systolicMmHg: reassessed ? 120 : 119, diastolicMmHg: reassessed ? 72 : 71,
        meanArterialMmHg: reassessed ? 88 : 87, coreTemperatureC: 36.7 };
    }

    const state: PatientState = this.cardiacArrestActive ? {
      ...crisisState,
      heartRateBpm: 0,
      cardiacOutputLPerMin: this.chestCompressionsActive ? 1.2 : 0,
      strokeVolumeMl: 0,
      systolicMmHg: this.chestCompressionsActive ? 45 : 0,
      diastolicMmHg: this.chestCompressionsActive ? 18 : 0,
      meanArterialMmHg: this.chestCompressionsActive ? 27 : 0,
      perfusionIndex: 0,
      etco2MmHg: this.chestCompressionsActive ? 18 : 0,
    } : crisisState;

    if (result.transfusion && packedRedCellUnits > 0) {
      const beforeOxygenDelivery = oxygenDeliveryMlPerMin(stateBeforeStep);
      const afterOxygenDelivery = oxygenDeliveryMlPerMin(state);
      const hemoglobinDelta = result.transfusion.hemoglobinAfterGPerDl
        - result.transfusion.hemoglobinBeforeGPerDl;
      this.log('info', 'blood-product', `blood-product-packed-red-blood-cells-${this.currentTick}`,
        `${packedRedCellUnits} unit${packedRedCellUnits === 1 ? '' : 's'} packed red blood cells given `
        + `(${result.transfusion.volumeMl.toFixed(0)} mL). Hemoglobin changed by `
        + `${hemoglobinDelta.toFixed(2)} g/dL and calculated oxygen delivery changed from `
        + `${beforeOxygenDelivery.toFixed(0)} to ${afterOxygenDelivery.toFixed(0)} mL/min.`, {
          productId: 'packed-red-blood-cells', units: packedRedCellUnits,
          volumeMl: result.transfusion.volumeMl,
          hemoglobinG: result.transfusion.hemoglobinG,
          hemoglobinBeforeGPerDl: result.transfusion.hemoglobinBeforeGPerDl,
          hemoglobinAfterGPerDl: result.transfusion.hemoglobinAfterGPerDl,
          hemoglobinDeltaGPerDl: hemoglobinDelta,
          oxygenDeliveryBeforeMlPerMin: beforeOxygenDelivery,
          oxygenDeliveryAfterMlPerMin: afterOxygenDelivery,
          cumulativeUnits: this.packedRedBloodCellUnits,
          cumulativeVolumeMl: this.bloodProductTotalMl,
          teachingModel: true,
        });
    }
    if (result.plasmaTransfusion && freshFrozenPlasmaVolumeMl > 0) {
      const units = freshFrozenPlasmaVolumeMl / 275;
      this.log('info', 'blood-product', `blood-product-fresh-frozen-plasma-${this.currentTick}`,
        `${units} units fresh frozen plasma given (${freshFrozenPlasmaVolumeMl.toFixed(0)} mL). `
        + `Prothrombin time ratio changed from ${result.plasmaTransfusion.prothrombinTimeRatioBefore.toFixed(2)} to ${result.plasmaTransfusion.prothrombinTimeRatioAfter.toFixed(2)} × normal; fibrinogen changed from ${result.plasmaTransfusion.fibrinogenBeforeGPerL.toFixed(1)} to ${result.plasmaTransfusion.fibrinogenAfterGPerL.toFixed(1)} g/L.`, {
          productId: 'fresh-frozen-plasma', units, volumeMl: freshFrozenPlasmaVolumeMl,
          prothrombinTimeRatioBefore: result.plasmaTransfusion.prothrombinTimeRatioBefore,
          prothrombinTimeRatioAfter: result.plasmaTransfusion.prothrombinTimeRatioAfter,
          fibrinogenBeforeGPerL: result.plasmaTransfusion.fibrinogenBeforeGPerL,
          fibrinogenAfterGPerL: result.plasmaTransfusion.fibrinogenAfterGPerL,
          cumulativeUnits: this.freshFrozenPlasmaUnits,
          cumulativeVolumeMl: this.bloodProductTotalMl, teachingModel: true,
        });
    }

    // Preoxygenation is judged on the END-TIDAL fraction, because that is what
    // says the functional residual capacity has actually been denitrogenated. The
    // inspired fraction says only what the machine is delivering to the circuit:
    // a leaking mask reads 1.0 inspired and 0.4 end-tidal, and the safe apnoea
    // time that follows is the one the reservoir bought, not the one the flowmeter
    // promised. 0.9 is the conventional endpoint.
    if (state.endTidalO2Fraction >= PREOXYGENATION_END_TIDAL_TARGET
      && !this.patient.airway.intubated) {
      this.preoxygenationTicks += 1;
    }

    // --- Waveforms -------------------------------------------------------------
    const waveforms = this.waveforms.tick(restingDrive({
      heartRateBpm: state.heartRateBpm,
      rhythmId: this.rhythm,
      systolicMmHg: state.systolicMmHg,
      diastolicMmHg: state.diastolicMmHg,
      svrDynSCm5: state.svrDynSCm5,
      strokeVolumeMl: state.strokeVolumeMl,
      perfusionIndex: state.perfusionIndex,
      spo2Percent: state.spo2Percent,
      etco2MmHg: state.etco2MmHg,
      inspiredCo2MmHg: this.inspiredCo2MmHg,
      respiratoryRateBpm: Math.max(state.respiratoryRateBpm, 1),
      bronchospasmSeverity: obstruction,
      ventilating: state.respiratoryRateBpm > 0 && state.tidalVolumeMl > 0,
      anesthesiaDepthFraction: result.anesthesiaDepthFraction,
      hypovolemiaFraction: result.hypovolemiaFraction,
      positivePressure: effectiveVentilator.delivering && effectiveVentilator.mode !== 'manual',
      curareCleftDepth: 0,
    }));

    // --- Alarms ----------------------------------------------------------------
    const invalid = this.invalidParameters();
    const alarmResult = this.alarmEngine.evaluate(state, this.currentTick, {
      artifactParameters: this.artifactParameters(),
      invalidParameters: invalid,
    });
    for (const alarm of alarmResult.raised) {
      this.log(alarm.priority === 'high' ? 'critical' : alarm.priority === 'medium' ? 'warning' : 'advisory',
        'alarm', `alarm-${alarm.id}-${this.currentTick}`, alarm.message,
        { alarmId: alarm.id, parameter: alarm.parameter, value: alarm.value });
    }
    for (const id of alarmResult.cleared) {
      this.log('info', 'alarm', `alarm-clear-${id}-${this.currentTick}`, `Alarm cleared: ${id}`);
    }

    const concentrations: DrugConcentration[] = [];
    for (const drug of this.drugs.values()) {
      const envelope = evaluateEnvelope(drug.model, this.covariates);
      concentrations.push({
        drugId: drug.drugId,
        modelId: drug.model.id,
        confidence: envelope.label,
        plasma: drug.solver.plasma,
        effectSite: drug.solver.hasEffectSiteCurve
          ? drug.solver.effectSite * (drug.drugId === 'rocuronium'
            ? 1 - this.neuromuscularReversalFraction
            : 1)
          : Number.NaN,
        unit: drug.model.concentrationUnit,
      });
    }

    if (this.pendingNibpCompletesAtTick !== null
      && this.currentTick >= this.pendingNibpCompletesAtTick) {
      this.nibpMeanArterialMmHg = state.meanArterialMmHg;
      this.nibpMeasuredAtTick = this.currentTick;
      this.pendingNibpCompletesAtTick = null;
      this.log('info', 'equipment', `nibp-result-${this.currentTick}`,
        `Non-invasive cuff result: mean arterial pressure ${state.meanArterialMmHg.toFixed(0)} mmHg.`, {
          meanArterialMmHg: state.meanArterialMmHg,
        });
    }

    this.lastState = state;

    const events = this.pendingEvents;
    this.pendingEvents = [];
    this.currentTick += 1;

    return {
      tick: this.currentTick - 1,
      state,
      concentrations,
      attribution: result.attribution,
      alarms: alarmResult.active,
      events,
      warnings: result.warnings.map((w) => w.message),
      waveforms,
      alarmBurden: alarmResult.burden,
      equipment: this.equipment(),
    };
  }

  /**
   * What the equipment is actually doing right now. The action region renders
   * this rather than remembering what the learner asked for, so a refused
   * setting, an empty syringe and a failed intubation are all visible.
   */
  equipment(): EquipmentSnapshot {
    return {
      ventilator: { ...this.ventilator },
      airway: {
        intubated: this.patient.airway.intubated,
        device: this.patient.airway.intubated
          ? 'tracheal-tube'
          : this.patient.airway.supraglotticAirwayPlaced
            ? 'supraglottic-airway'
            : 'facemask',
        attempts: this.patient.airway.attempts,
        lastGrade: this.lastGrade,
        attemptInProgress: this.pendingLaryngoscopy !== null,
        attemptSecondsRemaining: this.pendingLaryngoscopy
          ? Math.max(0, Math.ceil((this.pendingLaryngoscopy.completesAtTick - this.currentTick) / TICKS_PER_SECOND))
          : 0,
        supraglotticInsertionSecondsRemaining: this.pendingSupraglotticInsertion
          ? Math.max(1, Math.ceil(
            (this.pendingSupraglotticInsertion.completesAtTick - this.currentTick) / TICKS_PER_SECOND,
          ))
          : 0,
        helpRequestedAtTick: this.helpRequestedAtTick,
        patencyFraction: 1 - Math.max(
          this.upperAirwayClosureFraction, this.postExtubationObstructionSeverity,
        ),
        postExtubationObstructionSeverity: this.postExtubationObstructionSeverity,
        bronchospasmSeverity: this.bronchospasmSeverity,
        jawThrustCpapSecondsRemaining: Math.max(
          0, Math.ceil((this.jawThrustCpapUntilTick - this.currentTick) / TICKS_PER_SECOND),
        ),
      },
      ...(this.scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'endotracheal-tube-migration-after-repositioning') ? {
          trachealTubePosition: {
            depthCm: this.tubeMigrationReassessedAtTick === null ? 25 : 22,
            position: this.tubeMigrationReassessedAtTick === null
              ? 'right-mainstem' as const : 'tracheal' as const,
            leftVentilation: this.tubeMigrationReassessedAtTick === null
              ? 'markedly-reduced' as const : 'present' as const,
            rightVentilation: 'present' as const,
            securement: 'intact' as const,
            cuffState: 'unchanged' as const,
            exhaledTidalVolumeMl: this.tubeMigrationReassessedAtTick === null ? 310 : 410,
            peakPressureCmH2O: this.tubeMigrationReassessedAtTick === null ? 36 : 27,
            plateauPressureCmH2O: this.tubeMigrationReassessedAtTick === null ? 22 : 21,
            peepCmH2O: 8,
            continuousCapnography: true,
          },
        } : {}),
      hypnoticLine: {
        connected: this.hypnoticLineConnected,
        inspected: this.hypnoticLineInspected,
      },
      capnographyLine: {
        obstructed: this.artifacts.has('sampling-line-obstruction'),
        ventilationCrossChecked: this.capnographyVentilationCrossChecked,
      },
      breathingCircuit: {
        co2Absorbent: this.co2AbsorbentExhausted ? 'exhausted' : 'normal',
        inspiredCo2MmHg: this.inspiredCo2MmHg,
        capnogramAssessed: this.circuitCapnogramAssessed,
        absorbentReplaced: this.circuitAbsorbentReplaced,
      },
      arterialLine: {
        displayedMeanArterialMmHg: this.scenario.equipment.monitoring.includes('arterial-line')
          && typeof this.lastState.meanArterialMmHg === 'number'
          && Number.isFinite(this.lastState.meanArterialMmHg)
          ? Math.max(0, this.lastState.meanArterialMmHg
            - (this.artifacts.has('arterial-transducer-misleveled')
              ? ARTERIAL_MISLEVELING_CM * ARTERIAL_HYDROSTATIC_MMHG_PER_CM : 0))
          : null,
        mislevelingCm: this.artifacts.has('arterial-transducer-misleveled')
          ? ARTERIAL_MISLEVELING_CM : 0,
        dynamicResponse: this.artifacts.has('arterial-damping') ? 'overdamped' : 'normal',
        waveformAssessed: this.arterialWaveformAssessed,
        leveledAndZeroed: this.arterialLeveledAndZeroed,
        cuff: {
          status: this.pendingNibpCompletesAtTick !== null ? 'cycling'
            : this.nibpMeanArterialMmHg !== null ? 'complete' : 'idle',
          secondsRemaining: this.pendingNibpCompletesAtTick === null ? 0 : Math.max(0, Math.ceil(
            (this.pendingNibpCompletesAtTick - this.currentTick) / TICKS_PER_SECOND,
          )),
          meanArterialMmHg: this.nibpMeanArterialMmHg,
          measuredAtTick: this.nibpMeasuredAtTick,
        },
      },
      resuscitation: {
        epinephrineEffectFraction: this.epinephrineEffect,
        epinephrineTotalMicrograms: this.epinephrineTotalMicrograms,
        lastEpinephrineTick: this.lastEpinephrineTick,
        crystalloidTotalMl: this.crystalloidTotalMl,
        hemorrhageActive: this.running.some((event) => event.type === 'blood-loss')
          || this.injectedBloodLossMlPerMin > 0,
        packedRedBloodCellUnits: this.packedRedBloodCellUnits,
        freshFrozenPlasmaUnits: this.freshFrozenPlasmaUnits,
        coagulationPanelReported: this.coagulationPanelReported,
        bloodProductsReleased: this.bloodProductsReleased,
        bloodProductTotalMl: this.bloodProductTotalMl,
        dantroleneTotalMg: this.dantroleneTotalMg,
        dantroleneEffectFraction: this.dantroleneEffectFraction,
        lastDantroleneTick: this.lastDantroleneTick,
        activeCooling: this.activeCooling,
        salbutamolTotalMg: this.salbutamolTotalMg,
        lastSalbutamolTick: this.lastSalbutamolTick,
        bronchodilatorEffectFraction: this.bronchodilatorEffectFraction,
        localAnestheticToxicityFraction: this.localAnestheticToxicitySeverity
          * (1 - 0.8 * this.lipidEmulsionEffectFraction),
        seizureActivityFraction: this.seizureActivityFraction,
        seizureSuppressed: this.seizureSuppressed,
        lipidEmulsionTotalMl: this.lipidEmulsionTotalMl,
        lipidEmulsionBolusRemainingMl: this.lipidEmulsionBolusRemainingMl,
        lipidEmulsionInfusionMlPerMin: this.lipidEmulsionInfusionMlPerMin,
        lipidEmulsionEffectFraction: this.lipidEmulsionEffectFraction,
        lastLipidEmulsionTick: this.lastLipidEmulsionTick,
        cardiacArrestActive: this.cardiacArrestActive,
        chestCompressionsActive: this.chestCompressionsActive,
        chestCompressionSeconds: this.chestCompressionTicks / TICKS_PER_SECOND,
        compressionPerfusionFraction: this.cardiacArrestActive && this.chestCompressionsActive ? 0.25 : 0,
        arrestEpinephrineTotalMg: this.arrestEpinephrineTotalMg,
        lastArrestEpinephrineTick: this.lastArrestEpinephrineTick,
        defibrillationShockCount: this.defibrillationShockCount,
        lastDefibrillationEnergyJ: this.lastDefibrillationEnergyJ,
        roscAtTick: this.roscAtTick,
        highSpinalFraction: this.highSpinalFraction,
        ephedrineTotalMg: this.ephedrineTotalMg,
        lastEphedrineTick: this.lastEphedrineTick,
        preeclampsiaBloodPressureChecks: this.preeclampsiaBloodPressureChecks,
        lastPreeclampsiaBloodPressure: this.lastPreeclampsiaBloodPressure
          ? { ...this.lastPreeclampsiaBloodPressure } : null,
        labetalolTotalMg: this.labetalolTotalMg,
        lastLabetalolTick: this.lastLabetalolTick,
        labetalolEffectFraction: this.labetalolEffectFraction,
        magnesiumSulfateTotalG: this.magnesiumSulfateTotalG,
        lastMagnesiumSulfateTick: this.lastMagnesiumSulfateTick,
        venousAirEmbolismFraction: this.venousAirEmbolismFraction,
        venousAirEntryControlled: this.venousAirEntryControlled,
        venousAirEntryControlledAtTick: this.venousAirEntryControlledAtTick,
        tensionPneumothoraxFraction: this.tensionPneumothoraxFraction,
        pneumothoraxAssessedAtTick: this.pneumothoraxAssessedAtTick,
        pneumothoraxDecompressedAtTick: this.pneumothoraxDecompressedAtTick,
        cardiacTamponadeFraction: this.cardiacTamponadeFraction,
        cardiacTamponadeAssessment: {
          contextReviewedAtTick: this.tamponadeContextReviewedAtTick,
          pocusReviewedAtTick: this.tamponadePocusReviewedAtTick,
          definitiveControlAtTick: this.tamponadeDefinitiveControlAtTick,
          reassessedAtTick: this.tamponadeReassessedAtTick,
        },
        emergencyAnaphylaxisAssessment: {
          patternReviewedAtTick: this.emergencyAnaphylaxisPatternReviewedAtTick,
          positionedAndHelpedAtTick: this.emergencyAnaphylaxisPositionedAndHelpedAtTick,
          imEpinephrineAtTick: this.emergencyAnaphylaxisImEpinephrineAtTick,
          oxygenAtTick: this.emergencyAnaphylaxisOxygenAtTick,
          crystalloidAtTick: this.emergencyAnaphylaxisCrystalloidAtTick,
          reassessedAtTick: this.emergencyAnaphylaxisReassessedAtTick,
        },
        adultAsthmaAssessment: {
          severityReviewedAtTick: this.adultAsthmaSeverityReviewedAtTick,
          controlledOxygenAtTick: this.adultAsthmaControlledOxygenAtTick,
          bronchodilatorBundleAtTick: this.adultAsthmaBronchodilatorBundleAtTick,
          corticosteroidIntentAtTick: this.adultAsthmaCorticosteroidIntentAtTick,
          reassessedAtTick: this.adultAsthmaReassessedAtTick,
        },
        copdExacerbationAssessment: {
          severityReviewedAtTick: this.copdSeverityReviewedAtTick,
          controlledOxygenAtTick: this.copdControlledOxygenAtTick,
          bronchodilatorBundleAtTick: this.copdBronchodilatorBundleAtTick,
          corticosteroidIntentAtTick: this.copdCorticosteroidIntentAtTick,
          antibioticIntentAtTick: this.copdAntibioticIntentAtTick,
          reassessedAtTick: this.copdReassessedAtTick,
        },
        acutePulmonaryEdemaAssessment: {
          patternReviewedAtTick: this.pulmonaryEdemaPatternReviewedAtTick,
          nivAtTick: this.pulmonaryEdemaNivAtTick,
          diureticIntentAtTick: this.pulmonaryEdemaDiureticIntentAtTick,
          vasodilatorIntentAtTick: this.pulmonaryEdemaVasodilatorIntentAtTick,
          reassessedAtTick: this.pulmonaryEdemaReassessedAtTick,
        },
        pulmonaryEmbolismAssessment: {
          severityReviewedAtTick: this.pulmonaryEmbolismSeverityReviewedAtTick,
          oxygenAtTick: this.pulmonaryEmbolismOxygenAtTick,
          anticoagulationAtTick: this.pulmonaryEmbolismAnticoagulationAtTick,
          deteriorationAtTick: this.pulmonaryEmbolismDeteriorationAtTick,
          escalationAtTick: this.pulmonaryEmbolismEscalationAtTick,
        },
        stemiAssessment: {
          patternReviewedAtTick: this.stemiPatternReviewedAtTick,
          pathwayActivatedAtTick: this.stemiPathwayActivatedAtTick,
          aspirinAtTick: this.stemiAspirinAtTick,
          additionalAntithromboticsAtTick: this.stemiAdditionalAntithromboticsAtTick,
          reassessedAtTick: this.stemiReassessedAtTick,
        },
        unstableNarrowTachycardiaAssessment: {
          reviewedAtTick: this.unstableNarrowTachycardiaReviewedAtTick,
          preparedAtTick: this.unstableNarrowTachycardiaPreparedAtTick,
          cardiovertedAtTick: this.unstableNarrowTachycardiaCardiovertedAtTick,
          reassessedAtTick: this.unstableNarrowTachycardiaReassessedAtTick,
        },
        unstableBradycardiaAssessment: {
          reviewedAtTick: this.unstableBradycardiaReviewedAtTick,
          supportedAtTick: this.unstableBradycardiaSupportedAtTick,
          atropineAtTick: this.unstableBradycardiaAtropineAtTick,
          reassessedAtTick: this.unstableBradycardiaReassessedAtTick,
        },
        statusEpilepticusAssessment: {
          reviewedAtTick: this.statusEpilepticusReviewedAtTick,
          supportedAtTick: this.statusEpilepticusSupportedAtTick,
          lorazepamAtTick: this.statusEpilepticusLorazepamAtTick,
          reassessedAtTick: this.statusEpilepticusReassessedAtTick,
        },
        acuteIschemicStrokeAssessment: {
          presentationReviewedAtTick: this.acuteStrokePresentationReviewedAtTick,
          systemActivatedAtTick: this.acuteStrokeSystemActivatedAtTick,
          imagingReviewedAtTick: this.acuteStrokeImagingReviewedAtTick,
          tenecteplaseAtTick: this.acuteStrokeTenecteplaseAtTick,
          thrombectomyActivatedAtTick: this.acuteStrokeThrombectomyActivatedAtTick,
          reassessedAtTick: this.acuteStrokeReassessedAtTick,
        },
        intracranialHemorrhageAssessment: {
          deteriorationReviewedAtTick: this.ichDeteriorationReviewedAtTick,
          pathwayActivatedAtTick: this.ichPathwayActivatedAtTick,
          findingsReviewedAtTick: this.ichFindingsReviewedAtTick,
          reversalAtTick: this.ichReversalAtTick,
          pressureControlAtTick: this.ichPressureControlAtTick,
          escalatedAtTick: this.ichEscalatedAtTick,
        },
        diabeticKetoacidosisAssessment: {
          presentationReviewedAtTick: this.dkaPresentationReviewedAtTick,
          fluidsAtTick: this.dkaFluidsAtTick,
          potassiumAtTick: this.dkaPotassiumAtTick,
          insulinAtTick: this.dkaInsulinAtTick,
          dextroseAtTick: this.dkaDextroseAtTick,
          transitionAtTick: this.dkaTransitionAtTick,
        },
        hyperkalemiaAssessment: {
          patternReviewedAtTick: this.hyperkalemiaPatternReviewedAtTick,
          calciumAtTick: this.hyperkalemiaCalciumAtTick,
          postCalciumEcgAtTick: this.hyperkalemiaPostCalciumEcgAtTick,
          insulinGlucoseAtTick: this.hyperkalemiaInsulinGlucoseAtTick,
          betaAgonistAtTick: this.hyperkalemiaBetaAgonistAtTick,
          removalAtTick: this.hyperkalemiaRemovalAtTick,
          reassessedAtTick: this.hyperkalemiaReassessedAtTick,
        },
        hyponatremiaAssessment: {
          patternReviewedAtTick: this.hyponatremiaPatternReviewedAtTick,
          stabilizedAtTick: this.hyponatremiaStabilizedAtTick,
          hypertonicAtTick: this.hyponatremiaHypertonicAtTick,
          reassessedAtTick: this.hyponatremiaReassessedAtTick,
          guardrailsAtTick: this.hyponatremiaGuardrailsAtTick,
        },
        opioidToxicityAssessment: {
          patternReviewedAtTick: this.opioidPatternReviewedAtTick,
          ventilationAtTick: this.opioidVentilationAtTick,
          antagonistAtTick: this.opioidAntagonistAtTick,
          initialReassessmentAtTick: this.opioidInitialReassessmentAtTick,
          recurrenceReviewedAtTick: this.opioidRecurrenceReviewedAtTick,
          recurrencePlanAtTick: this.opioidRecurrencePlanAtTick,
        },
        heatStrokeAssessment: {
          patternReviewedAtTick: this.heatStrokePatternReviewedAtTick,
          supportAtTick: this.heatStrokeSupportAtTick,
          coolingAtTick: this.heatStrokeCoolingAtTick,
          targetAtTick: this.heatStrokeTargetAtTick,
          surveillanceAtTick: this.heatStrokeSurveillanceAtTick,
        },
        traumaPrimarySurveyAssessment: {
          activatedAtTick: this.traumaActivatedAtTick,
          catastrophicHemorrhageAtTick: this.traumaCatastrophicHemorrhageAtTick,
          airwayBreathingAtTick: this.traumaAirwayBreathingAtTick,
          circulationAtTick: this.traumaCirculationAtTick,
          disabilityExposureAtTick: this.traumaDisabilityExposureAtTick,
          repeatedAtTick: this.traumaRepeatedAtTick,
        },
        acuteAorticSyndromeAssessment: {
          initialReviewedAtTick: this.aorticInitialReviewedAtTick,
          evolutionReviewedAtTick: this.aorticEvolutionReviewedAtTick,
          escalatedAtTick: this.aorticEscalatedAtTick,
          antiImpulseAtTick: this.aorticAntiImpulseAtTick,
          imagingAtTick: this.aorticImagingAtTick,
          handedOffAtTick: this.aorticHandedOffAtTick,
        },
        ardsLungProtectiveAssessment: {
          baselineAtTick: this.ardsBaselineAtTick,
          pbwAtTick: this.ardsPbwAtTick,
          protectionAtTick: this.ardsProtectionAtTick,
          reassessmentAtTick: this.ardsReassessmentAtTick,
          escalationAtTick: this.ardsEscalationAtTick,
        },
        escalatingHypoxemiaAssessment: {
          signalAtTick: this.hypoxemiaSignalAtTick,
          supportAtTick: this.hypoxemiaSupportAtTick,
          deliveryPathAtTick: this.hypoxemiaDeliveryPathAtTick,
          bedsidePatternAtTick: this.hypoxemiaBedsidePatternAtTick,
          escalationAtTick: this.hypoxemiaEscalationAtTick,
        },
        ventilatorDyssynchronyAssessment: {
          graphicsAtTick: this.dyssynchronyGraphicsAtTick,
          driversAtTick: this.dyssynchronyDriversAtTick,
          classificationAtTick: this.dyssynchronyClassificationAtTick,
          correctionAtTick: this.dyssynchronyCorrectionAtTick,
          reassessmentAtTick: this.dyssynchronyReassessmentAtTick,
        },
        autoPeepAssessment: {
          flowAtTick: this.autoPeepFlowAtTick,
          measurementAtTick: this.autoPeepMeasurementAtTick,
          classificationAtTick: this.autoPeepClassificationAtTick,
          correctionAtTick: this.autoPeepCorrectionAtTick,
          reassessmentAtTick: this.autoPeepReassessmentAtTick,
        },
        mucusPluggingAssessment: {
          supportAtTick: this.mucusSupportAtTick,
          indicatorsAtTick: this.mucusIndicatorsAtTick,
          suctionAtTick: this.mucusSuctionAtTick,
          reassessmentAtTick: this.mucusReassessmentAtTick,
          escalationAtTick: this.mucusEscalationAtTick,
        },
        unplannedExtubationAssessment: {
          supportAtTick: this.unplannedExtubationSupportAtTick,
          assessmentAtTick: this.unplannedExtubationAssessmentAtTick,
          failureAtTick: this.unplannedExtubationFailureAtTick,
          airwayPlanAtTick: this.unplannedExtubationAirwayPlanAtTick,
          reassessmentAtTick: this.unplannedExtubationReassessmentAtTick,
        },
        spontaneousBreathingTrialAssessment: {
          readinessAtTick: this.sbtReadinessAtTick,
          startedAtTick: this.sbtStartedAtTick,
          failureAtTick: this.sbtFailureAtTick,
          recoveryAtTick: this.sbtRecoveryAtTick,
          planAtTick: this.sbtPlanAtTick,
        },
        postIntubationHypotensionAssessment: {
          pressureAtTick: this.postIntubationPressureAtTick,
          dangerAtTick: this.postIntubationDangerAtTick,
          mechanismAtTick: this.postIntubationMechanismAtTick,
          supportAtTick: this.postIntubationSupportAtTick,
          reassessmentAtTick: this.postIntubationReassessmentAtTick,
        },
        cardiogenicShockAssessment: {
          recognitionAtTick: this.cardiogenicShockRecognitionAtTick,
          phenotypeAtTick: this.cardiogenicShockPhenotypeAtTick,
          bridgeAtTick: this.cardiogenicShockBridgeAtTick,
          causeControlAtTick: this.cardiogenicShockCauseControlAtTick,
          reassessmentAtTick: this.cardiogenicShockReassessmentAtTick,
        },
        mixedShockAssessment: {
          recognitionAtTick: this.mixedShockRecognitionAtTick,
          hemodynamicsAtTick: this.mixedShockHemodynamicsAtTick,
          supportAtTick: this.mixedShockSupportAtTick,
          causesAtTick: this.mixedShockCausesAtTick,
          reassessmentAtTick: this.mixedShockReassessmentAtTick,
        },
        rightVentricularFailureAssessment: {
          recognitionAtTick: this.rvFailureRecognitionAtTick,
          phenotypeAtTick: this.rvFailurePhenotypeAtTick,
          supportAtTick: this.rvFailureSupportAtTick,
          triggersAtTick: this.rvFailureTriggersAtTick,
          reassessmentAtTick: this.rvFailureReassessmentAtTick,
        },
        massivePulmonaryEmbolismAssessment: {
          recognitionAtTick: this.massivePeRecognitionAtTick,
          patternAtTick: this.massivePePatternAtTick,
          supportAtTick: this.massivePeSupportAtTick,
          ecmoAtTick: this.massivePeEcmoAtTick,
          reassessmentAtTick: this.massivePeReassessmentAtTick,
        },
        upperGiHemorrhageAssessment: {
          recognitionAtTick: this.upperGiHemorrhageRecognitionAtTick,
          patternAtTick: this.upperGiHemorrhagePatternAtTick,
          resuscitationAtTick: this.upperGiHemorrhageResuscitationAtTick,
          hemostasisAtTick: this.upperGiHemorrhageHemostasisAtTick,
          reassessmentAtTick: this.upperGiHemorrhageReassessmentAtTick,
        },
        criticalCareStatusEpilepticusAssessment: {
          recognitionAtTick: this.criticalCareStatusRecognitionAtTick,
          patternAtTick: this.criticalCareStatusPatternAtTick,
          pathwayAtTick: this.criticalCareStatusPathwayAtTick,
          causesAtTick: this.criticalCareStatusCausesAtTick,
          reassessmentAtTick: this.criticalCareStatusReassessmentAtTick,
        },
        postArrestTemperatureAssessment: {
          recognitionAtTick: this.postArrestTemperatureRecognitionAtTick,
          contextAtTick: this.postArrestTemperatureContextAtTick,
          protocolAtTick: this.postArrestTemperatureProtocolAtTick,
          guardrailsAtTick: this.postArrestTemperatureGuardrailsAtTick,
          reassessmentAtTick: this.postArrestTemperatureReassessmentAtTick,
        },
        intracranialHypertensionAssessment: {
          recognitionAtTick: this.intracranialHypertensionRecognitionAtTick,
          contextAtTick: this.intracranialHypertensionContextAtTick,
          protectionAtTick: this.intracranialHypertensionProtectionAtTick,
          rescueAtTick: this.intracranialHypertensionRescueAtTick,
          reassessmentAtTick: this.intracranialHypertensionReassessmentAtTick,
        },
        akiFluidOverloadAssessment: {
          recognitionAtTick: this.akiFluidOverloadRecognitionAtTick,
          contextAtTick: this.akiFluidOverloadContextAtTick,
          fluidPlanAtTick: this.akiFluidOverloadFluidPlanAtTick,
          supportAtTick: this.akiFluidOverloadSupportAtTick,
          reassessmentAtTick: this.akiFluidOverloadReassessmentAtTick,
        },
        severeAcidemiaAssessment: {
          recognitionAtTick: this.severeAcidemiaRecognitionAtTick,
          analysisAtTick: this.severeAcidemiaAnalysisAtTick,
          ventilationAtTick: this.severeAcidemiaVentilationAtTick,
          causePlanAtTick: this.severeAcidemiaCausePlanAtTick,
          reassessmentAtTick: this.severeAcidemiaReassessmentAtTick,
        },
        icuHiddenDeteriorationHandoffAssessment: {
          readinessAtTick: this.icuHandoffReadinessAtTick,
          contentAtTick: this.icuHandoffContentAtTick,
          crossCheckAtTick: this.icuHandoffCrossCheckAtTick,
          escalationAtTick: this.icuHandoffEscalationAtTick,
          acceptanceAtTick: this.icuHandoffAcceptanceAtTick,
        },
        ventilatorCircuitDisconnectionAssessment: {
          recognizedAtTick: this.ventilatorDisconnectionRecognizedAtTick,
          bridgedAtTick: this.ventilatorDisconnectionBridgedAtTick,
          inspectedAtTick: this.ventilatorDisconnectionInspectedAtTick,
          restoredAtTick: this.ventilatorDisconnectionRestoredAtTick,
          reassessedAtTick: this.ventilatorDisconnectionReassessedAtTick,
        },
        delayedVasopressorDeliveryAssessment: {
          discordanceAtTick: this.delayedVasopressorDiscordanceAtTick,
          pathAtTick: this.delayedVasopressorPathAtTick,
          classifiedAtTick: this.delayedVasopressorClassifiedAtTick,
          protocolAtTick: this.delayedVasopressorProtocolAtTick,
          reassessedAtTick: this.delayedVasopressorReassessedAtTick,
        },
        ...(this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'pulse-oximeter-motion-artifact') ? {
            pulseOximeterArtifactAssessment: {
              discordanceAtTick: this.pulseOximeterDiscordanceAtTick,
              plethAtTick: this.pulseOximeterPlethAtTick,
              probePerfusionAtTick: this.pulseOximeterProbePerfusionAtTick,
              corroboratedAtTick: this.pulseOximeterCorroboratedAtTick,
              reassessedAtTick: this.pulseOximeterReassessedAtTick,
              displayedSpo2Percent: this.pulseOximeterReassessedAtTick === null ? 82 : 97,
              displayedPulseRateBpm: this.pulseOximeterReassessedAtTick === null ? 132 : 86,
              signalQuality: this.pulseOximeterReassessedAtTick === null ? 'poor' as const : 'good' as const,
            },
          } : {}),
        ...(this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'endotracheal-tube-migration-after-repositioning') ? {
            endotrachealTubeMigrationAssessment: {
              recognizedAtTick: this.tubeMigrationRecognizedAtTick,
              supportedAtTick: this.tubeMigrationSupportedAtTick,
              positionReviewedAtTick: this.tubeMigrationPositionReviewedAtTick,
              correctionAtTick: this.tubeMigrationCorrectionAtTick,
              reassessedAtTick: this.tubeMigrationReassessedAtTick,
            },
          } : {}),
        ...(this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'septic-shock-resuscitation') ? {
            septicShockResuscitationAssessment: {
              contextAtTick: this.septicResuscitationContextAtTick,
              perfusionAtTick: this.septicResuscitationPerfusionAtTick,
              fluidResponseAtTick: this.septicResuscitationFluidResponseAtTick,
              planAtTick: this.septicResuscitationPlanAtTick,
              reassessedAtTick: this.septicResuscitationReassessedAtTick,
              passiveLegRaiseStrokeVolumeChangePercent: 2,
              blindRepeatFluidOffered: false,
            },
          } : {}),
        ...(this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'stable-chest-pain-evaluation') ? {
            stableChestPainAssessment: {
              stabilityAtTick: this.stableChestPainStabilityAtTick,
              patternAtTick: this.stableChestPainPatternAtTick,
              likelihoodAtTick: this.stableChestPainLikelihoodAtTick,
              testingAtTick: this.stableChestPainTestingAtTick,
              safetyNetAtTick: this.stableChestPainSafetyNetAtTick,
              clinicalLikelihood: 'not-very-low' as const,
              exactScoreCalculated: false,
              testPerformed: false,
            },
          } : {}),
        ...(this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'nstemi-risk-reassessment') ? {
            nstemiRiskAssessment: {
              trajectoryAtTick: this.nstemiTrajectoryAtTick,
              verificationAtTick: this.nstemiVerificationAtTick,
              veryHighRiskAtTick: this.nstemiVeryHighRiskAtTick,
              strategyAtTick: this.nstemiStrategyAtTick,
              handoffAtTick: this.nstemiHandoffAtTick,
              ischemicRisk: 'high' as const,
              currentVeryHighRisk: false,
              exactScoreCalculated: false,
              procedurePerformed: false,
            },
          } : {}),
        ...(this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'acute-decompensated-heart-failure') ? {
            heartFailureAssessment: {
              statusAtTick: this.heartFailureStatusAtTick,
              responseAtTick: this.heartFailureResponseAtTick,
              toleranceAtTick: this.heartFailureToleranceAtTick,
              transitionAtTick: this.heartFailureTransitionAtTick,
              readinessAtTick: this.heartFailureReadinessAtTick,
              residualCongestion: true,
              dischargeReady: false,
              doseCalculated: false,
              treatmentDelivered: false,
            },
          } : {}),
        ...(this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'atrial-fibrillation-with-rapid-response') ? {
            afRvrAssessment: {
              stabilityAtTick: this.afRvrStabilityAtTick,
              contextAtTick: this.afRvrContextAtTick,
              rateIntentAtTick: this.afRvrRateIntentAtTick,
              strokePreventionAtTick: this.afRvrStrokePreventionAtTick,
              reassessmentAtTick: this.afRvrReassessmentAtTick,
              hemodynamicallyStable: true,
              durationCertain: false,
              exactScoreCalculated: false,
              treatmentDelivered: false,
            },
          } : {}),
        ...(this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'stemi-recognition-and-first-actions') ? {
            clinicStemiAssessment: {
              patternAtTick: this.clinicStemiPatternAtTick,
              dangerAtTick: this.clinicStemiDangerAtTick,
              transferAtTick: this.clinicStemiTransferAtTick,
              bridgeAtTick: this.clinicStemiBridgeAtTick,
              handoffAtTick: this.clinicStemiHandoffAtTick,
              pciCapableSetting: false as const,
              biomarkerDelayUsed: false,
              downstreamTherapySelected: false,
              treatmentDelivered: false,
            },
          } : {}),
        ...(this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'post-infarction-cardiogenic-shock-escalation') ? {
            postInfarctionShockAssessment: {
              trajectoryAtTick: this.postInfarctionShockTrajectoryAtTick,
              causesAtTick: this.postInfarctionShockCausesAtTick,
              transferAtTick: this.postInfarctionShockTransferAtTick,
              bridgeAtTick: this.postInfarctionShockBridgeAtTick,
              handoffAtTick: this.postInfarctionShockHandoffAtTick,
              pressureAloneUsed: false as const,
              routineDeviceSelected: false as const,
              treatmentDelivered: false as const,
            },
          } : {}),
        ...(this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'regular-narrow-complex-tachycardia') ? {
            stableNarrowTachycardiaAssessment: {
              stabilityAtTick: this.stableNarrowStabilityAtTick,
              contextAtTick: this.stableNarrowContextAtTick,
              vagalAtTick: this.stableNarrowVagalAtTick,
              vagalResponseAtTick: this.stableNarrowVagalResponseAtTick,
              adenosineAtTick: this.stableNarrowAdenosineAtTick,
              reassessmentAtTick: this.stableNarrowReassessmentAtTick,
              hemodynamicallyStable: true as const,
              mechanismProven: false as const,
              treatmentDelivered: false as const,
            },
          } : {}),
        ...(this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'wide-complex-tachycardia') ? {
            stableWideTachycardiaAssessment: {
              stabilityAtTick: this.stableWideStabilityAtTick,
              contextAtTick: this.stableWideContextAtTick,
              readinessAtTick: this.stableWideReadinessAtTick,
              medicationAtTick: this.stableWideMedicationAtTick,
              nonresponseAtTick: this.stableWideNonresponseAtTick,
              cardioversionAtTick: this.stableWideCardioversionAtTick,
              reassessmentAtTick: this.stableWideReassessmentAtTick,
              hemodynamicallyStable: true as const, mechanismProven: false as const,
              learnerTreatmentDelivered: false as const,
            },
          } : {}),
        ...(this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'symptomatic-sinus-bradycardia-reassessment') ? {
            symptomaticBradycardiaAssessment: {
              stabilityAtTick: this.symptomaticBradycardiaStabilityAtTick,
              contextAtTick: this.symptomaticBradycardiaContextAtTick,
              correlationAtTick: this.symptomaticBradycardiaCorrelationAtTick,
              pacingEvaluationAtTick: this.symptomaticBradycardiaPacingEvaluationAtTick,
              handoffAtTick: this.symptomaticBradycardiaHandoffAtTick,
              hemodynamicallyStable: true as const, mechanismProven: false as const,
              treatmentDelivered: false as const,
            },
          } : {}),
        ...(this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'complete-heart-block') ? {
            completeHeartBlockAssessment: {
              stabilityAtTick: this.completeHeartBlockStabilityAtTick,
              contextAtTick: this.completeHeartBlockContextAtTick,
              pathwayAtTick: this.completeHeartBlockPathwayAtTick,
              reassessmentAtTick: this.completeHeartBlockReassessmentAtTick,
              handoffAtTick: this.completeHeartBlockHandoffAtTick,
              hemodynamicallyStable: true as const, pacingDelivered: false as const,
              captureAssessed: false as const,
            },
          } : {}),
        ...(this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'torsades-de-pointes') ? {
            torsadesAssessment: {
              recognitionAtTick: this.torsadesRecognitionAtTick,
              shockIntentAtTick: this.torsadesShockIntentAtTick,
              postShockAtTick: this.torsadesPostShockAtTick,
              contextAtTick: this.torsadesContextAtTick,
              recurrenceIntentAtTick: this.torsadesRecurrenceIntentAtTick,
              handoffAtTick: this.torsadesHandoffAtTick,
              initialPulsePresent: true as const, shockDeliveredByLearner: false as const,
              treatmentDeliveredByLearner: false as const,
            },
          } : {}),
        ...(this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'hyperkalemic-conduction-disturbance') ? {
            hyperkalemicConductionAssessment: {
              reconciledAtTick: this.hyperkalemicConductionReconciledAtTick,
              calciumResponseAtTick: this.hyperkalemicConductionCalciumResponseAtTick,
              shiftSurveillanceAtTick: this.hyperkalemicConductionShiftSurveillanceAtTick,
              removalDeviceAtTick: this.hyperkalemicConductionRemovalDeviceAtTick,
              laterPanelAtTick: this.hyperkalemicConductionLaterPanelAtTick,
              handoffAtTick: this.hyperkalemicConductionHandoffAtTick,
              initialPulsePresent: true as const, treatmentDeliveredByLearner: false as const,
              pacingDelivered: false as const, captureAssessed: false as const,
              permanentDeviceSelected: false as const,
            },
          } : {}),
        ...(this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'pericardial-tamponade-reassessment') ? {
            pericardialTamponadeAssessment: {
              trajectoryAtTick: this.pericardialTamponadeTrajectoryAtTick,
              drainageResponseAtTick: this.pericardialTamponadeDrainageResponseAtTick,
              etiologyAtTick: this.pericardialTamponadeEtiologyAtTick,
              surveillanceAtTick: this.pericardialTamponadeSurveillanceAtTick,
              handoffAtTick: this.pericardialTamponadeHandoffAtTick,
              initialPulsePresent: true as const,
              treatmentDeliveredByLearner: false as const,
              imageAcquiredByLearner: false as const,
              procedurePerformedByLearner: false as const,
              catheterManipulatedByLearner: false as const,
            },
          } : {}),
        ...(this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'right-ventricular-infarction') ? {
            rightVentricularInfarctionAssessment: {
              reconciledAtTick: this.rightVentricularInfarctionReconciledAtTick,
              phenotypeAtTick: this.rightVentricularInfarctionPhenotypeAtTick,
              reperfusionAtTick: this.rightVentricularInfarctionReperfusionAtTick,
              supportAtTick: this.rightVentricularInfarctionSupportAtTick,
              handoffAtTick: this.rightVentricularInfarctionHandoffAtTick,
              initialPulsePresent: true as const,
              treatmentDeliveredByLearner: false as const,
              medicationDeliveredByLearner: false as const,
              reperfusionPerformedByLearner: false as const,
              deviceSelected: false as const,
              liveEcgInterpreted: false as const, imageAcquired: false as const,
              nitrateSelected: false as const, diureticSelected: false as const,
              blindFluidLoading: false as const, fixedFluidVolumeSelected: false as const,
              treatmentDelivered: false as const, pciPerformed: false as const,
              reperfusionCompleted: false as const,
            },
          } : {}),
        ...(this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'hypertensive-emergency-reassessment') ? {
            hypertensiveEmergencyAssessment: {
              measurementAtTick: this.hypertensiveEmergencyMeasurementAtTick,
              organInjuryAtTick: this.hypertensiveEmergencyOrganInjuryAtTick,
              phenotypeAtTick: this.hypertensiveEmergencyPhenotypeAtTick,
              reductionIntentAtTick: this.hypertensiveEmergencyReductionIntentAtTick,
              laterPanelAtTick: this.hypertensiveEmergencyLaterPanelAtTick,
              handoffAtTick: this.hypertensiveEmergencyHandoffAtTick,
              initialPulsePresent: true as const, acuteTargetOrganDamage: true as const,
              treatmentDeliveredByLearner: false as const, drugSelected: false as const,
              doseSelected: false as const, infusionRateSelected: false as const,
              universalTargetSelected: false as const, rapidNormalizationSelected: false as const,
              testAcquiredByLearner: false as const, procedurePerformed: false as const,
              dispositionDetermined: false as const, outcomePredicted: false as const,
            },
          } : {}),
        ...(this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'pacemaker-capture-failure-reassessment') ? {
            pacemakerCaptureFailureAssessment: {
              recognitionAtTick: this.pacemakerCaptureFailureRecognitionAtTick,
              rescueAtTick: this.pacemakerCaptureFailureRescueAtTick,
              deviceSystemAtTick: this.pacemakerCaptureFailureDeviceSystemAtTick,
              causesAtTick: this.pacemakerCaptureFailureCausesAtTick,
              laterPanelAtTick: this.pacemakerCaptureFailureLaterPanelAtTick,
              handoffAtTick: this.pacemakerCaptureFailureHandoffAtTick,
              initialPulsePresent: true as const,
              electricalCaptureFailureAuthored: true as const,
              pacingDeliveredByLearner: false as const,
              captureAssessedByLearner: false as const,
              deviceInterrogatedByLearner: false as const,
              deviceProgrammedByLearner: false as const,
              outputSelectedByLearner: false as const,
              leadManipulatedByLearner: false as const,
              treatmentDeliveredByLearner: false as const,
              outcomePredicted: false as const,
            },
          } : {}),
        ...(this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'transcutaneous-pacing-mechanical-capture-reassessment') ? {
            transcutaneousPacingCaptureAssessment: {
              recognitionAtTick: this.transcutaneousPacingRecognitionAtTick,
              pulselessResponseAtTick: this.transcutaneousPacingPulselessResponseAtTick,
              causesBridgeAtTick: this.transcutaneousPacingCausesBridgeAtTick,
              handoffAtTick: this.transcutaneousPacingHandoffAtTick,
              initialPulsePresent: false as const,
              electricalCaptureAuthored: true as const,
              mechanicalCaptureAbsent: true as const,
              nonshockableArrestPathwayActivated:
                this.transcutaneousPacingPulselessResponseAtTick !== null,
              pacingDeliveredByLearner: false as const,
              captureAssessedByLearner: false as const,
              cprDeliveredByLearner: false as const,
              treatmentDeliveredByLearner: false as const,
              procedurePerformedByLearner: false as const,
              roscReported: false as const,
              outcomePredicted: false as const,
            },
          } : {}),
        ...(this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'acute-severe-asthma-reassessment') ? {
            acuteSevereAsthmaAssessment: {
              treatmentAtTick: this.acuteSevereAsthmaTreatmentAtTick,
              failureAtTick: this.acuteSevereAsthmaFailureAtTick,
              escalationAtTick: this.acuteSevereAsthmaEscalationAtTick,
              risksAtTick: this.acuteSevereAsthmaRisksAtTick,
              handoffAtTick: this.acuteSevereAsthmaHandoffAtTick,
              respiratoryFailureAuthored: true as const,
              medicationDeliveredByLearner: false as const,
              oxygenDeliveredByLearner: false as const,
              airwayProcedurePerformedByLearner: false as const,
              ventilatorSettingSelected: false as const,
              dispositionDetermined: false as const,
              outcomePredicted: false as const,
            },
          } : {}),
        ...(this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'copd-exacerbation-transition-reassessment') ? {
            copdTransitionAssessment: {
              readinessAtTick: this.copdTransitionReadinessAtTick,
              respiratoryNeedsAtTick: this.copdTransitionRespiratoryNeedsAtTick,
              medicationAtTick: this.copdTransitionMedicationAtTick,
              coordinationAtTick: this.copdTransitionCoordinationAtTick,
              handoffAtTick: this.copdTransitionHandoffAtTick,
              treatmentDeliveredByLearner: false as const,
              oxygenDeliveredByLearner: false as const,
              longTermOxygenEligibilityDetermined: false as const,
              regimenSelected: false as const,
              techniquePerformedByLearner: false as const,
              rehabilitationEnrolled: false as const,
              appointmentGuaranteed: false as const,
              dispositionDetermined: false as const,
              outcomePredicted: false as const,
            },
          } : {}),
        ...(this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'community-acquired-pneumonia-hypoxemia-reassessment') ? {
            capHypoxemiaAssessment: {
              supportAtTick: this.capHypoxemiaSupportAtTick,
              evidenceAtTick: this.capHypoxemiaEvidenceAtTick,
              severityAtTick: this.capHypoxemiaSeverityAtTick,
              treatmentIntentAtTick: this.capHypoxemiaTreatmentIntentAtTick,
              handoffAtTick: this.capHypoxemiaHandoffAtTick,
              hypoxemiaAuthored: true as const,
              pneumoniaPatternAuthored: true as const,
              oxygenDeliveredByLearner: false as const,
              supportDeviceSelected: false as const,
              antimicrobialSelected: false as const,
              testAcquiredByLearner: false as const,
              dispositionDetermined: false as const,
              outcomePredicted: false as const,
            },
          } : {}),
        ...(this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'post-pulmonary-embolism-persistent-dyspnea-reassessment') ? {
            postPeDyspneaAssessment: {
              trajectoryAtTick: this.postPeDyspneaTrajectoryAtTick,
              safetyAtTick: this.postPeDyspneaSafetyAtTick,
              evidenceAtTick: this.postPeDyspneaEvidenceAtTick,
              referralAtTick: this.postPeDyspneaReferralAtTick,
              handoffAtTick: this.postPeDyspneaHandoffAtTick,
              acutePeConfirmedAuthored: true as const,
              anticoagulationDeliveredByLearner: false as const,
              testAcquiredByLearner: false as const,
              ctepdDiagnosed: false as const,
              treatmentSelected: false as const,
              procedurePerformedByLearner: false as const,
              dispositionDetermined: false as const,
              outcomePredicted: false as const,
            },
          } : {}),
        ...(this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'acute-pulmonary-edema-respiratory-support-reassessment') ? {
            apeSupportAssessment: {
              trajectoryAtTick: this.apeSupportTrajectoryAtTick,
              failureAtTick: this.apeSupportFailureAtTick,
              wholePatientAtTick: this.apeSupportWholePatientAtTick,
              escalationAtTick: this.apeSupportEscalationAtTick,
              handoffAtTick: this.apeSupportHandoffAtTick,
              pulmonaryEdemaAuthored: true as const,
              supportAlreadyActiveAuthored: true as const,
              oxygenDeliveredByLearner: false as const,
              nivStartedByLearner: false as const,
              supportSettingSelected: false as const,
              medicationDeliveredByLearner: false as const,
              testAcquiredByLearner: false as const,
              airwayProcedurePerformedByLearner: false as const,
              treatmentDeliveredByLearner: false as const,
              dispositionDetermined: false as const,
              outcomePredicted: false as const,
            },
          } : {}),
        ...(this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'spontaneous-tension-pneumothorax-post-drainage-reassessment') ? {
            postTensionPneumothoraxAssessment: {
              trajectoryAtTick: this.postTensionPneumothoraxTrajectoryAtTick,
              drainageResponseAtTick: this.postTensionPneumothoraxDrainageResponseAtTick,
              systemAtTick: this.postTensionPneumothoraxSystemAtTick,
              etiologyAtTick: this.postTensionPneumothoraxEtiologyAtTick,
              handoffAtTick: this.postTensionPneumothoraxHandoffAtTick,
              initialPulsePresent: true as const,
              priorTensionPhysiologyAuthored: true as const,
              experiencedTeamDrainageAuthored: true as const,
              decompressionPerformedByLearner: false as const,
              chestDrainPlacedByLearner: false as const,
              drainManipulatedByLearner: false as const,
              suctionOrClampSelected: false as const,
              deviceOrSiteSelected: false as const,
              oxygenDeliveredByLearner: false as const,
              medicationDeliveredByLearner: false as const,
              testAcquiredByLearner: false as const,
              procedurePerformedByLearner: false as const,
              treatmentDeliveredByLearner: false as const,
              dispositionDetermined: false as const,
              recurrencePredicted: false as const,
              outcomePredicted: false as const,
            },
          } : {}),
        ...(this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'large-unilateral-pleural-effusion-reassessment') ? {
            largePleuralEffusionAssessment: {
              trajectoryAtTick: this.largePleuralEffusionTrajectoryAtTick,
              intentAtTick: this.largePleuralEffusionIntentAtTick,
              responseAtTick: this.largePleuralEffusionResponseAtTick,
              fluidAtTick: this.largePleuralEffusionFluidAtTick,
              evaluationAtTick: this.largePleuralEffusionEvaluationAtTick,
              handoffAtTick: this.largePleuralEffusionHandoffAtTick,
              initialPulsePresent: true as const, largeUnilateralEffusionAuthored: true as const,
              tensionPhysiologyAuthored: false as const, hemodynamicCompromiseAuthored: false as const,
              examinationPerformedByLearner: false as const, imagingAcquiredByLearner: false as const,
              ultrasoundPerformedByLearner: false as const, pleuralFluidAcquiredByLearner: false as const,
              fluidInterpretedByLearner: false as const, thoracentesisPerformedByLearner: false as const,
              deviceOrSiteSelected: false as const, drainageVolumeSelected: false as const,
              treatmentDeliveredByLearner: false as const, diagnosisDetermined: false as const,
              dispositionDetermined: false as const, outcomePredicted: false as const,
            },
          } : {}),
        ...(this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'bronchiectasis-mucus-plugging-reassessment') ? {
            bronchiectasisMucusPluggingAssessment: {
              trajectoryAtTick: this.bronchiectasisMucusTrajectoryAtTick,
              evidenceAtTick: this.bronchiectasisMucusEvidenceAtTick,
              clearanceIntentAtTick: this.bronchiectasisMucusClearanceIntentAtTick,
              responseAtTick: this.bronchiectasisMucusResponseAtTick,
              escalationAtTick: this.bronchiectasisMucusEscalationAtTick,
              handoffAtTick: this.bronchiectasisMucusHandoffAtTick,
              initialPulsePresent: true as const, spontaneouslyBreathingAuthored: true as const,
              artificialAirwayPresent: false as const, focalCollapseAuthored: true as const,
              mucusImpactionWorkingPatternAuthored: true as const, mucusPlugEtiologyProven: false as const,
              examinationPerformedByLearner: false as const, imagingAcquiredByLearner: false as const,
              sputumAssessedByLearner: false as const, airwayClearancePerformedByLearner: false as const,
              suctionPerformedByLearner: false as const, bronchoscopyPerformedByLearner: false as const,
              deviceOrTechniqueSelected: false as const, oxygenDeliveredByLearner: false as const,
              treatmentDeliveredByLearner: false as const, diagnosisDetermined: false as const,
              dispositionDetermined: false as const, outcomePredicted: false as const,
            },
          } : {}),
        ...(this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'chronic-opioid-related-hypoventilation-reassessment') ? {
            chronicOpioidHypoventilationAssessment: {
              trajectoryAtTick: this.chronicOpioidHypoventilationTrajectoryAtTick,
              evidenceAtTick: this.chronicOpioidHypoventilationEvidenceAtTick,
              alternativesAtTick: this.chronicOpioidHypoventilationAlternativesAtTick,
              coordinatedPlanAtTick: this.chronicOpioidHypoventilationPlanAtTick,
              handoffAtTick: this.chronicOpioidHypoventilationHandoffAtTick,
              initialPulsePresent: true as const, chronicOpioidExposureAuthored: true as const,
              spontaneouslyBreathingAuthored: true as const,
              acuteOpioidOverdoseAuthored: false as const, postoperativeRecoveryAuthored: false as const,
              sleepRelatedHypoventilationPatternAuthored: true as const,
              opioidCausalityProven: false as const, examinationPerformedByLearner: false as const,
              bloodGasAcquiredByLearner: false as const, sleepStudyAcquiredByLearner: false as const,
              sleepStudyInterpretedByLearner: false as const,
              drugOrDoseSelected: false as const, taperSelected: false as const,
              opioidChangedByLearner: false as const, naloxoneSelectedByLearner: false as const,
              naloxoneDeliveredByLearner: false as const, oxygenDeliveredByLearner: false as const,
              supportDeviceSelectedByLearner: false as const,
              treatmentDeliveredByLearner: false as const, diagnosisDetermined: false as const,
              dispositionDetermined: false as const, outcomePredicted: false as const,
            },
          } : {}),
        ...(this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'neuromuscular-respiratory-failure-reassessment') ? {
            neuromuscularRespiratoryFailureAssessment: {
              trajectoryAtTick: this.neuromuscularRespiratoryFailureTrajectoryAtTick,
              failureAtTick: this.neuromuscularRespiratoryFailureRecognitionAtTick,
              escalationAtTick: this.neuromuscularRespiratoryFailureEscalationAtTick,
              reviewAtTick: this.neuromuscularRespiratoryFailureReviewAtTick,
              ownershipAtTick: this.neuromuscularRespiratoryFailureOwnershipAtTick,
              handoffAtTick: this.neuromuscularRespiratoryFailureHandoffAtTick,
              initialPulsePresent: true as const, spontaneousBreathingAuthored: true as const,
              establishedMotorNeuronDiseaseAuthored: true as const,
              neuromuscularRespiratoryFailureAuthored: true as const,
              respiratoryMeasurementsAuthored: true as const,
              daytimeHypercapniaAuthored: true as const,
              examinationPerformedByLearner: false as const,
              respiratoryStrengthMeasuredByLearner: false as const,
              bloodGasAcquiredByLearner: false as const, testInterpretedByLearner: false as const,
              imagingAcquiredByLearner: false as const, airwayAssessedByLearner: false as const,
              coughAssessedByLearner: false as const,
              ventilationDeliveredByLearner: false as const,
              oxygenDeliveredByLearner: false as const,
              supportDeviceSelectedByLearner: false as const,
              coughAssistDeliveredByLearner: false as const,
              secretionProcedurePerformedByLearner: false as const,
              airwayProcedurePerformedByLearner: false as const,
              patientPreferenceInferred: false as const,
              nutritionSelectedByLearner: false as const,
              treatmentDeliveredByLearner: false as const, diagnosisDetermined: false as const,
              dispositionDetermined: false as const, outcomePredicted: false as const,
            },
          } : {}),
        ...(this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'obesity-hypoventilation-reassessment') ? {
            obesityHypoventilationAssessment: {
              phenotypeAtTick: this.obesityHypoventilationPhenotypeAtTick,
              awakeEvidenceAtTick: this.obesityHypoventilationAwakeEvidenceAtTick,
              sleepEvidenceAtTick: this.obesityHypoventilationSleepEvidenceAtTick,
              recognitionAtTick: this.obesityHypoventilationRecognitionAtTick,
              coordinatedPlanAtTick: this.obesityHypoventilationPlanAtTick,
              handoffAtTick: this.obesityHypoventilationHandoffAtTick,
              initialPulsePresent: true as const, spontaneousBreathingAuthored: true as const,
              obesityAuthored: true as const, daytimeHypercapniaAuthored: true as const,
              sleepDisorderedBreathingAuthored: true as const,
              acuteRespiratoryFailureAuthored: false as const,
              examinationPerformedByLearner: false as const, bmiCalculatedByLearner: false as const,
              serumBicarbonateAcquiredByLearner: false as const,
              bloodGasAcquiredByLearner: false as const, sleepStudyAcquiredByLearner: false as const,
              sleepStudyScoredByLearner: false as const, sleepStudyInterpretedByLearner: false as const,
              testInterpretedByLearner: false as const, otherCausesExcludedByLearner: false as const,
              diagnosisDeterminedByLearner: false as const, obesityCausalityProven: false as const,
              oxygenSelectedByLearner: false as const, supportDeviceSelectedByLearner: false as const,
              deviceOperatedByLearner: false as const, drugSelectedByLearner: false as const,
              weightInterventionSelectedByLearner: false as const,
              treatmentDeliveredByLearner: false as const, patientPreferenceInferred: false as const,
              dispositionDetermined: false as const, outcomePredicted: false as const,
            },
          } : {}),
        ...(this.scenario.timeline.some((event) => event.type === 'narrative'
          && event.target === 'noninvasive-ventilation-selection') ? {
            noninvasiveVentilationSelectionAssessment: {
              trajectoryAtTick: this.nivSelectionTrajectoryAtTick,
              suitabilityAtTick: this.nivSelectionSuitabilityAtTick,
              selectionAtTick: this.nivSelectionAtTick,
              responseAtTick: this.nivSelectionResponseAtTick,
              failureGuardsAtTick: this.nivSelectionFailureGuardsAtTick,
              handoffAtTick: this.nivSelectionHandoffAtTick,
              lastUnsupportedChoice: this.nivSelectionLastUnsupportedChoice,
              initialPulsePresent: true as const, spontaneousBreathingAuthored: true as const,
              copdExacerbationAuthored: true as const,
              acuteHypercapnicAcidosisAuthored: true as const,
              standardInitialTherapyAuthored: true as const,
              immediateDeteriorationAuthored: false as const,
              airwayProtectionFailureAuthored: false as const,
              hemodynamicInstabilityAuthored: false as const,
              bilevelNivSelectedByLearner: this.nivSelectionAtTick !== null,
              patientExaminedByLearner: false as const, bloodGasAcquiredByLearner: false as const,
              bloodGasInterpretedByLearner: false as const, imagingAcquiredByLearner: false as const,
              oxygenSelectedByLearner: false as const, interfaceSelectedByLearner: false as const,
              pressureSelectedByLearner: false as const, backupRateSelectedByLearner: false as const,
              deviceOperatedByLearner: false as const, ventilationDeliveredByLearner: false as const,
              drugSelectedByLearner: false as const, treatmentDeliveredByLearner: false as const,
              intubationPerformedByLearner: false as const, durableNivSuccessProven: false as const,
              dispositionDetermined: false as const, outcomePredicted: false as const,
            },
          } : {}),
        aspirationRiskAssessment: {
          cuesReviewedAtTick: this.aspirationRiskCuesReviewedAtTick,
          classification: this.aspirationRiskClassification,
          classifiedAtTick: this.aspirationRiskClassifiedAtTick,
          plan: this.aspirationRiskPlan,
          planAtTick: this.aspirationRiskPlanAtTick,
        },
        emergenceResidualBlockAssessment: {
          monitorReviewedAtTick: this.emergenceMonitorReviewedAtTick,
          classification: this.emergenceBlockClassification,
          classifiedAtTick: this.emergenceBlockClassifiedAtTick,
          plan: this.emergencePlan,
          planAtTick: this.emergencePlanAtTick,
        },
        delayedEmergenceAssessment: {
          supportReviewedAtTick: this.delayedEmergenceSupportReviewedAtTick,
          exposureReviewedAtTick: this.delayedEmergenceExposureReviewedAtTick,
          metabolicReviewedAtTick: this.delayedEmergenceMetabolicReviewedAtTick,
          neurologicExamAtTick: this.delayedEmergenceNeurologicExamAtTick,
          escalation: this.delayedEmergenceEscalation,
          escalatedAtTick: this.delayedEmergenceEscalatedAtTick,
        },
        extubationReadinessAssessment: {
          quantitativeRecoveryReviewedAtTick:
            this.extubationQuantitativeRecoveryReviewedAtTick,
          awakeAirwayReviewedAtTick: this.extubationAwakeAirwayReviewedAtTick,
          gasExchangeReviewedAtTick: this.extubationGasExchangeReviewedAtTick,
          airwayPlanReviewedAtTick: this.extubationAirwayPlanReviewedAtTick,
          decision: this.extubationReadinessDecision,
          decidedAtTick: this.extubationReadinessDecidedAtTick,
        },
        opioidVentilatoryResponse: {
          severity: this.opioidVentilatoryImpairmentSeverity,
          furtherOpioidHeldAtTick: this.furtherOpioidHeldAtTick,
          naloxoneIntentAtTick: this.naloxoneIntentAtTick,
        },
        thermalResponse: {
          targetTemperatureC: this.perioperativeTemperatureTargetC,
          coreTemperatureConfirmedAtTick: this.coreTemperatureConfirmedAtTick,
          forcedAirWarmingAtTick: this.forcedAirWarmingAtTick,
          warmedBulkFluidsAtTick: this.warmedBulkFluidsAtTick,
        },
        glycemicResponse: {
          pointOfCareGlucoseMgPerDl: this.hyperglycemicGlucoseMgPerDl,
          pointOfCareConfirmedAtTick: this.pointOfCareGlucoseConfirmedAtTick,
          insulinProtocolIntentAtTick: this.insulinProtocolIntentAtTick,
          repeatEligible: this.insulinProtocolIntentAtTick !== null
            && this.currentTick - this.insulinProtocolIntentAtTick >= 18_000,
          repeatPointOfCareAtTick: this.repeatPointOfCareAtTick,
          repeatPointOfCareGlucoseMgPerDl: this.repeatPointOfCareGlucoseMgPerDl,
        },
        ciedPlanningAssessment: {
          deviceRecordReviewedAtTick: this.ciedDeviceRecordReviewedAtTick,
          procedureRiskReviewedAtTick: this.ciedProcedureRiskReviewedAtTick,
          plan: this.ciedPlan,
          planAtTick: this.ciedPlanAtTick,
          backupAndRestorationDocumentedAtTick: this.ciedBackupAndRestorationDocumentedAtTick,
        },
        postoperativeHandoffAssessment: {
          receiverReadyAtTick: this.postoperativeReceiverReadyAtTick,
          patientAndCourseAtTick: this.postoperativePatientAndCourseAtTick,
          currentStateAtTick: this.postoperativeCurrentStateAtTick,
          risksActionsOwnershipAtTick: this.postoperativeRisksActionsOwnershipAtTick,
          receiverReadbackAtTick: this.postoperativeReceiverReadbackAtTick,
          transferAcceptedAtTick: this.postoperativeTransferAcceptedAtTick,
        },
        undifferentiatedShockAssessment: {
          perfusionReviewedAtTick: this.shockPerfusionReviewedAtTick,
          lactateReviewedAtTick: this.shockLactateReviewedAtTick,
          focusedEchoReviewedAtTick: this.shockFocusedEchoReviewedAtTick,
          passiveLegRaiseAtTick: this.shockPassiveLegRaiseAtTick,
          fluidChallengeAtTick: this.shockFluidChallengeAtTick,
          perfusionReassessedAtTick: this.shockPerfusionReassessedAtTick,
          escalationAtTick: this.shockEscalationAtTick,
        },
        septicShockAssessment: {
          infectionAndOrganDysfunctionReviewedAtTick:
            this.sepsisInfectionAndOrganDysfunctionReviewedAtTick,
          culturesAndLactateAtTick: this.sepsisCulturesAndLactateAtTick,
          antimicrobialIntentAtTick: this.sepsisAntimicrobialIntentAtTick,
          initialCrystalloidAtTick: this.sepsisInitialCrystalloidAtTick,
          postFluidReassessmentAtTick: this.sepsisPostFluidReassessmentAtTick,
          norepinephrineIntentAtTick: this.sepsisNorepinephrineIntentAtTick,
          sourceControlEscalationAtTick: this.sepsisSourceControlEscalationAtTick,
        },
        hemorrhagicShockAssessment: {
          mechanismAndPerfusionReviewedAtTick: this.traumaMechanismAndPerfusionReviewedAtTick,
          pelvicStabilizationAtTick: this.traumaPelvicStabilizationAtTick,
          majorHemorrhageActivatedAtTick: this.traumaMajorHemorrhageActivatedAtTick,
          redCellsAtTick: this.traumaRedCellsAtTick,
          coagulationAndTemperatureAtTick: this.traumaCoagulationAndTemperatureAtTick,
          reassessedAtTick: this.traumaReassessedAtTick,
          definitiveControlEscalatedAtTick: this.traumaDefinitiveControlEscalatedAtTick,
        },
        neuromuscularReversalFraction: this.neuromuscularReversalFraction,
        postTetanicCount: this.postTetanicCount,
        lastNeuromuscularReversal: this.lastNeuromuscularReversal
          ? { ...this.lastNeuromuscularReversal } : null,
      },
      lastExposure: this.lastExposure ? { ...this.lastExposure } : null,
      lastInjectedCrisis: this.lastInjectedCrisis ? { ...this.lastInjectedCrisis } : null,
      injectedCrisisIds: [...this.injectedCrises],
      drugs: [...this.drugs.values()].map((drug) => ({
        drugId: drug.drugId,
        infusionRate: drug.infusionRate,
        infusionUnit: `${drug.model.doseUnit}/min`,
        infusionSinceTick: drug.infusionSinceTick,
        syringeRemainingMl: drug.syringeRemainingMl,
      })),
      preoxygenationSeconds: this.preoxygenationSeconds,
      rhythmId: this.rhythm,
      invalidParameters: [...this.invalidParameters()],
      artifactParameters: [...this.artifactParameters()],
      waveformArtifacts: [...this.waveformArtifactSignals()],
    };
  }

  /**
   * Which traces a sensor artifact is corrupting. The monitor hatches these
   * rather than colouring them, because an artifact is a monitoring problem and
   * not an alarm.
   */
  waveformArtifactSignals(): Set<string> {
    const signals = new Set<string>();
    // Do not hatch an over-damped arterial trace: its altered morphology is the
    // evidence the learner must inspect. The MAP tile still carries the explicit
    // artifact treatment, and the waveform samples themselves remain damped.
    if (this.artifacts.has('electrocautery')) signals.add('ecg');
    if (this.artifacts.has('probe-displacement')) signals.add('pleth');
    if (this.artifacts.has('pulse-oximeter-motion')) signals.add('pleth');
    if (this.artifacts.has('circuit-disconnection')) signals.add('capno');
    if (this.artifacts.has('esophageal-intubation')) signals.add('capno');
    if (this.artifacts.has('sampling-line-obstruction')) signals.add('capno');
    return signals;
  }

  /**
   * Cardiac output below which there is no pulse to display or to measure.
   *
   * A pulse oximeter reads the PULSATILE component of absorbance. With no
   * output there is nothing pulsatile to read, and the honest display is no
   * reading — not the 0% an earlier build showed, which is a number the
   * instrument cannot produce and which read as a measurement rather than as
   * the absence of one.
   */
  private static readonly PULSELESS_OUTPUT_L_PER_MIN = 0.4;

  /**
   * Keep the displayed rhythm honest about what the circulation is doing.
   *
   * The physiology can now arrest a patient — a hypoxic myocardium fails, the
   * rate falls, output goes to nothing — but the rhythm shown was whatever the
   * scenario last set, so a patient with no cardiac output was displayed in
   * sinus rhythm with a saturation of 0%. Both are things a monitor never shows.
   */
  private reconcileArrest(cardiacOutputLPerMin: number): void {
    if (this.arrestedByHypoxia) return;
    if (cardiacOutputLPerMin >= AnesthesiaEngine.PULSELESS_OUTPUT_L_PER_MIN) return;
    if (this.rhythm === 'asystole') return;

    this.arrestedByHypoxia = true;
    this.rhythm = 'asystole';
    this.log('critical', 'rhythm', `hypoxic-arrest-${this.currentTick}`,
      'Cardiac output has fallen to nothing and the rhythm is asystole, following unrelieved '
      + 'hypoxaemia. Open Sim Lab teaching model.');
    // Said once, plainly, at the moment it becomes true.
    //
    // An earlier version let the circulation come back on its own as soon as
    // oxygen was restored — asystole to a heart rate of 84 in twenty seconds,
    // with no compressions and no adrenaline. That is a worse thing to teach
    // than the bug it replaced: it says an arrest you caused will undo itself
    // if you fix the airway. This module models no resuscitation at all, so the
    // arrest is where its physiology stops and it says so instead of inventing
    // a recovery.
    this.log('critical', 'engine', `arrest-beyond-model-${this.currentTick}`,
      'This module does not model resuscitation — no compressions, no adrenaline, no defibrillation '
      + '— so the patient does not recover from here and nothing after this point is simulated '
      + 'physiology. End the session and debrief what led to it.');
  }

  private startScriptedCardiacArrest(): void {
    this.cardiacArrestActive = true;
    this.chestCompressionsActive = false;
    this.chestCompressionTicks = 0;
    this.lastChestCompressionTick = null;
  }

  /**
   * Parameters that cannot be measured right now, so the tile shows `--` with a
   * reason instead of a stale or interpolated number.
   */
  invalidParameters(): Set<string> {
    const invalid = new Set<string>();
    if (this.rhythm === 'ventricular-fibrillation' || this.rhythm === 'asystole') {
      invalid.add('heartRateBpm');
    }
    if (this.rhythm === 'pea' || this.rhythm === 'paced-electrical-no-mechanical-capture'
      || this.rhythm === 'ventricular-fibrillation' || this.rhythm === 'asystole') {
      invalid.add('spo2Percent');
      invalid.add('systolicMmHg');
      invalid.add('diastolicMmHg');
      invalid.add('meanArterialMmHg');
    }
    if (this.artifacts.has('probe-displacement')) invalid.add('spo2Percent');
    if (this.artifacts.has('sampling-line-obstruction')) invalid.add('etco2MmHg');
    return invalid;
  }

  /** Parameters currently under a sensor artifact, for the hatch overlay. */
  artifactParameters(): Set<string> {
    const parameters = new Set<string>();
    if (this.artifacts.has('arterial-damping')
      || this.artifacts.has('arterial-transducer-misleveled')) {
      parameters.add('systolicMmHg'); parameters.add('diastolicMmHg'); parameters.add('meanArterialMmHg');
    }
    if (this.artifacts.has('electrocautery')) parameters.add('heartRateBpm');
    if (this.artifacts.has('probe-displacement')) parameters.add('spo2Percent');
    if (this.artifacts.has('pulse-oximeter-motion')) parameters.add('spo2Percent');
    if (this.artifacts.has('sampling-line-obstruction')) parameters.add('etco2MmHg');
    return parameters;
  }

  /** Simulated seconds spent preoxygenated before the airway was secured. */
  get preoxygenationSeconds(): number {
    return this.preoxygenationTicks / TICKS_PER_SECOND;
  }

  /** Baseline systemic vascular resistance, for the debrief's comparisons. */
  get baselineSvr(): number {
    const p = this.scenario.patient.baseline;
    return baselineSvr({
      baselineHeartRateBpm: p.heartRateBpm, baselineMapMmHg: p.meanArterialMmHg,
      baselineStrokeVolumeMl: p.strokeVolumeMl, arterialStiffness: p.arterialStiffness,
      fixedStrokeVolume: p.fixedStrokeVolume, baroreflexGain: p.baroreflexGain,
      bloodVolumeMl: p.bloodVolumeMl, hemoglobinGPerDl: p.hemoglobinGPerDl,
    });
  }

  /** Normalized opioid effect, exposed for the debrief's analysis. */
  opioidEffect(): number {
    const remifentanil = this.drugs.get('remifentanil');
    if (!remifentanil?.solver.hasEffectSiteCurve) return 0;
    return normalizedEffect(remifentanil.solver.effectSite, 4.5, 1.6);
  }
}
