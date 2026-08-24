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
  getBloodProduct, MAX_PRBC_UNITS_PER_ACTION, MAX_PRBC_UNITS_TOTAL,
} from './content/blood-products';
import { oxygenDeliveryMlPerMin } from './physiology/oxygen-delivery';
import type { Covariates } from './pharmacology/body-composition';
import {
  RESPIRATORY_PROFILES, VirtualPatient, baselineSvr, healthyChildRespiratoryProfile,
  JAW_THRUST_CPAP_SECONDS, neuromuscularState, stepLaryngospasm,
  type LaryngoscopyResult, type PatientProfile, type PatientState, type VentilatorSettings,
} from './physiology';
import { WaveformEngine, restingDrive, type ArtifactId, type RhythmId, type WaveformFrame } from './waveforms';
import type { Scenario as ScenarioDocument, TimelineEvent } from './scenarios/types';
import { evaluatePredicate, parsePredicate, type StatePredicate } from './scenarios/predicate';

/** The engine's own version, recorded in every transcript. */
export const ENGINE_VERSION = '0.1.0-alpha.15';

/** Source-banded adult perioperative IV epinephrine boluses modeled by this slice. */
export const EPINEPHRINE_IV_BOUNDS = { minMicrograms: 10, maxMicrograms: 50 } as const;
export const DANTROLENE_DOSE_MG_PER_KG = 2.5;
/** Fixed interaction bound for placing the configured rescue supraglottic airway. */
export const SGA_INSERTION_SECONDS = 15;

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
  private pendingEvents: EngineEvent[] = [];
  private vasopressorEffect = 0;
  /** Distinct alpha/beta/bronchodilator teaching effect; never substituted by generic vasopressor. */
  private epinephrineEffect = 0;
  private epinephrineTotalMicrograms = 0;
  private lastEpinephrineTick: number | null = null;
  private crystalloidTotalMl = 0;
  private packedRedBloodCellUnits = 0;
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
  private venousAirEmbolismSeverity = 0;
  private venousAirEmbolismFraction = 0;
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
  /** Physical delivery state, intentionally separate from the pump's commanded rate. */
  private hypnoticLineConnected = true;
  /** Whether the learner has deliberately inspected the line since its last failure. */
  private hypnoticLineInspected = false;
  /** Persistent functional closure set by the scenario, 0 fully patent to 1 fully closed. */
  private upperAirwayClosureFraction = 0;
  /** Exclusive tick at which the bounded held airway maneuver ends. */
  private jawThrustCpapUntilTick = 0;
  /** Current lower-airway obstruction, retained for truthful equipment/accessibility output. */
  private bronchospasmSeverity = 0;
  private preoxygenationTicks = 0;
  private lastEffectSitePeak = new Map<string, number>();

  constructor(options: EngineOptions) {
    this.scenario = options.scenario;
    this.practiceRegion = options.practiceRegion;
    this.seed = options.seed;
    this.rng = createRng(options.seed, 'session');

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
    };
    this.patient = new VirtualPatient(profile, this.rng.fork('patient'), options.scenario.equipment.ventilator.fio2);
    this.waveforms = new WaveformEngine({ seed: options.seed, tickSeconds: 0.1 });

    const v = options.scenario.equipment.ventilator;
    this.ventilator = {
      mode: v.mode, tidalVolumeMl: v.tidalVolumeMl, respiratoryRateBpm: v.respiratoryRateBpm,
      fio2: v.fio2, freshGasFlowLPerMin: v.freshGasFlowLPerMin ?? 1,
      peep: 0, delivering: v.delivering, sevofluranePercent: 0,
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
        if (action.payload.context !== 'airway' || this.helpRequestedAtTick !== null) {
          this.log('warning', 'airway', `airway-help-refused-${this.currentTick}`,
            action.payload.context !== 'airway'
              ? 'Airway help requires the bounded airway context. No request was recorded.'
              : 'Airway help has already been requested. No duplicate request was recorded.');
          break;
        }
        this.helpRequestedAtTick = this.currentTick;
        this.log('warning', 'airway', `airway-help-requested-${this.currentTick}`,
          'Additional airway help requested. Team arrival and provider skill are not modeled.',
          { context: 'airway' });
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
        if (!hasRocuronium || route !== 'iv'
          || (agent !== 'sugammadex' && agent !== 'neostigmine')) {
          this.log('warning', 'drug', `bad-neuromuscular-reversal-${this.currentTick}`,
            'Neuromuscular reversal requires modeled rocuronium, an IV route, and a supported agent. Nothing was given.');
          break;
        }
        if (agent === 'sugammadex') {
          const validDose = Number.isFinite(dose)
            && ((count >= 1 && dose === 2) || (count === 0 && this.postTetanicCount >= 1 && dose === 4));
          if (!validDose || ratio >= 0.9) {
            this.log('warning', 'drug', `bad-sugammadex-${this.currentTick}`,
              'Sugammadex requires 2 mg/kg with at least one train-of-four twitch, or 4 mg/kg with no twitches and a post-tetanic count of at least one. Nothing was given.');
            break;
          }
          this.neuromuscularReversalFraction = Math.max(this.neuromuscularReversalFraction, 0.995);
          this.lastNeuromuscularReversal = { agent, doseMgPerKg: dose, tick: this.currentTick };
          this.log('info', 'drug', `sugammadex-${this.currentTick}`,
            `Sugammadex ${dose} mg/kg IV accepted for the observed block depth. Recovery is a bounded teaching effect; confirm a quantitative train-of-four ratio of at least 0.9.`,
            { agent, route, doseMgPerKg: dose, trainOfFourCount: count, postTetanicCount: this.postTetanicCount });
          break;
        }
        const antimuscarinic = action.payload.antimuscarinic === true;
        const minimalBlock = count === 4 && ratio >= 0.4 && ratio < 0.9;
        if (!antimuscarinic || !minimalBlock) {
          this.log('warning', 'drug', `bad-neostigmine-${this.currentTick}`,
            'Neostigmine requires coadministration with an antimuscarinic and minimal block: four train-of-four twitches with a quantitative ratio from 0.4 to below 0.9. Nothing was given.');
          break;
        }
        this.neuromuscularReversalFraction = Math.max(
          this.neuromuscularReversalFraction, 0.9,
        );
        this.lastNeuromuscularReversal = { agent, doseMgPerKg: null, tick: this.currentTick };
        this.log('info', 'drug', `neostigmine-${this.currentTick}`,
          'Neostigmine with an antimuscarinic IV was accepted during minimal block as an agent-class teaching action. Dose pharmacology is not modeled; quantitative recovery must still reach at least 0.9.',
          { agent, route, antimuscarinic, trainOfFourCount: count, teachingModel: true });
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
          || this.seizureActivityFraction <= 0) {
          this.log('warning', 'drug', `bad-seizure-suppression-${this.currentTick}`,
            'This bounded action requires active modeled seizure activity and an IV benzodiazepine. No treatment was given.');
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
      case 'blood-product': {
        const productId = String(action.payload.productId ?? '');
        const product = getBloodProduct(productId);
        const units = AnesthesiaEngine.finiteAmount(action.payload.units);
        const invalid = !product || units === null || !Number.isInteger(units)
          || units < 1 || units > MAX_PRBC_UNITS_PER_ACTION
          || this.packedRedBloodCellUnits + units > MAX_PRBC_UNITS_TOTAL
          || this.scenario.patient.ageYears < 18;
        if (invalid) {
          this.log('warning', 'blood-product', `bad-blood-product-${this.currentTick}`,
            !product
              ? `This build does not stock a blood product called "${productId}". Nothing was given.`
              : this.scenario.patient.ageYears < 18
                ? 'Packed red cells are not stocked in this bounded pediatric induction case.'
                : `Packed red cells require 1 or 2 whole units and no more than ${MAX_PRBC_UNITS_TOTAL} units cumulatively. Nothing was given.`);
          break;
        }
        this.pendingPackedRedCellUnits += units;
        this.pendingPackedRedCellVolumeMl += units * product.volumeMlPerUnit;
        this.pendingPackedRedCellHemoglobinG += units * product.hemoglobinGPerUnit;
        this.packedRedBloodCellUnits += units;
        this.bloodProductTotalMl += units * product.volumeMlPerUnit;
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
      case 'silence-alarm': {
        this.alarmEngine.silence(String(action.payload.alarmId), this.currentTick, TICKS_PER_SECOND);
        break;
      }
      case 'artifact': {
        const id = String(action.payload.artifactId) as ArtifactId;
        const active = action.payload.active !== false;
        this.artifacts[active ? 'add' : 'delete'](id);
        this.waveforms.setArtifact(id, active);
        this.log('artifact', 'artifact', `artifact-${id}-${this.currentTick}`,
          `${active ? 'Injected' : 'Cleared'} sensor artifact: ${id}`);
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
      + `fresh gas ${this.ventilator.freshGasFlowLPerMin.toFixed(1)} L/min`);
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

      case 'anaphylaxis': {
        const severity = event.value;
        if (event.target !== 'cefazolin' || typeof severity !== 'number'
          || !Number.isFinite(severity) || severity < 0 || severity > 1) {
          this.log('warning', 'scenario', `incomplete-event-${event.id}-${this.currentTick}`,
            `Timeline event "${event.id}" must identify cefazolin exposure and a finite severity `
            + 'from 0 to 1, so the event had no effect.');
          return;
        }
        this.triggerAnaphylaxis('cefazolin', severity, `exposure-${event.id}-${this.currentTick}`);
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
          default:
            this.log('warning', 'scenario', `incomplete-event-${event.id}-${this.currentTick}`,
              `Timeline event "${event.id}" declares an equipment failure this engine does not `
              + `model: "${String(failure)}". Modelled failures are ventilator-disconnection, `
              + 'oxygen-supply, vaporizer and hypnotic-line-disconnection.');
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
    this.pendingPackedRedCellUnits = 0;
    this.pendingPackedRedCellVolumeMl = 0;
    this.pendingPackedRedCellHemoglobinG = 0;
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
    const rawRocuroniumCe = rocuronium?.solver.hasEffectSiteCurve ? rocuronium.solver.effectSite : 0;
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
      ? 0 : clamp((unopposedLocalAnestheticToxicity - 0.2) / 0.6, 0, 1);
    obstruction = Math.max(obstruction, 0.85 * unopposedAnaphylaxis);
    this.bronchospasmSeverity = obstruction;
    const capillaryLeakMl = unopposedAnaphylaxis * 5 / TICKS_PER_SECOND;
    // Exact slopes and magnitudes are bounded teaching calibrations. The clinical
    // direction is sourced; neither drive estimates block height or gas volume.
    this.highSpinalFraction += (this.highSpinalSeverity - this.highSpinalFraction)
      * (1 - Math.exp(-0.1 / 20));
    this.venousAirEmbolismFraction += (
      this.venousAirEmbolismSeverity - this.venousAirEmbolismFraction
    ) * (1 - Math.exp(-0.1 / 2));

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
    const result = this.patient.tick(
      {
        propofolCe, remifentanilCe, rocuroniumCe,
        vasopressorEffect: this.vasopressorEffect, epinephrineEffect: this.epinephrineEffect,
      },
      effectiveVentilator,
      {
        surgicalStimulus: stimulus, obstructionFraction: obstruction, airwayDeliveryFraction,
        upperAirwayClosureFraction: this.upperAirwayClosureFraction,
        bloodLossMl, crystalloidMl,
        packedRedCellVolumeMl, packedRedCellHemoglobinG,
        anaphylaxisFraction: unopposedAnaphylaxis, capillaryLeakMl,
        hypermetabolicFraction: unopposedHypermetabolism,
        activeCooling: this.activeCooling,
        localAnestheticToxicityFraction: unopposedLocalAnestheticToxicity,
        spontaneousVentilationFraction: 1 - 0.7 * this.highSpinalFraction,
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
        patencyFraction: 1 - this.upperAirwayClosureFraction,
        bronchospasmSeverity: this.bronchospasmSeverity,
        jawThrustCpapSecondsRemaining: Math.max(
          0, Math.ceil((this.jawThrustCpapUntilTick - this.currentTick) / TICKS_PER_SECOND),
        ),
      },
      hypnoticLine: {
        connected: this.hypnoticLineConnected,
        inspected: this.hypnoticLineInspected,
      },
      resuscitation: {
        epinephrineEffectFraction: this.epinephrineEffect,
        epinephrineTotalMicrograms: this.epinephrineTotalMicrograms,
        lastEpinephrineTick: this.lastEpinephrineTick,
        crystalloidTotalMl: this.crystalloidTotalMl,
        packedRedBloodCellUnits: this.packedRedBloodCellUnits,
        bloodProductTotalMl: this.bloodProductTotalMl,
        dantroleneTotalMg: this.dantroleneTotalMg,
        dantroleneEffectFraction: this.dantroleneEffectFraction,
        lastDantroleneTick: this.lastDantroleneTick,
        activeCooling: this.activeCooling,
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
        venousAirEmbolismFraction: this.venousAirEmbolismFraction,
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
    if (this.artifacts.has('arterial-damping')) signals.add('arterial');
    if (this.artifacts.has('electrocautery')) signals.add('ecg');
    if (this.artifacts.has('probe-displacement')) signals.add('pleth');
    if (this.artifacts.has('circuit-disconnection')) signals.add('capno');
    if (this.artifacts.has('esophageal-intubation')) signals.add('capno');
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
    if (this.rhythm === 'pea' || this.rhythm === 'ventricular-fibrillation' || this.rhythm === 'asystole') {
      invalid.add('spo2Percent');
      invalid.add('systolicMmHg');
      invalid.add('diastolicMmHg');
      invalid.add('meanArterialMmHg');
    }
    if (this.artifacts.has('probe-displacement')) invalid.add('spo2Percent');
    return invalid;
  }

  /** Parameters currently under a sensor artifact, for the hatch overlay. */
  artifactParameters(): Set<string> {
    const parameters = new Set<string>();
    if (this.artifacts.has('arterial-damping')) {
      parameters.add('systolicMmHg'); parameters.add('diastolicMmHg'); parameters.add('meanArterialMmHg');
    }
    if (this.artifacts.has('electrocautery')) parameters.add('heartRateBpm');
    if (this.artifacts.has('probe-displacement')) parameters.add('spo2Percent');
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
