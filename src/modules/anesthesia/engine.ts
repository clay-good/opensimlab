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
import type { Covariates } from './pharmacology/body-composition';
import {
  RESPIRATORY_PROFILES, VirtualPatient, baselineSvr,
  type LaryngoscopyResult, type PatientProfile, type PatientState, type VentilatorSettings,
} from './physiology';
import { WaveformEngine, restingDrive, type ArtifactId, type RhythmId, type WaveformFrame } from './waveforms';
import type { Scenario as ScenarioDocument, TimelineEvent } from './scenarios/types';
import { evaluatePredicate, parsePredicate, type StatePredicate } from './scenarios/predicate';

/** The engine's own version, recorded in every transcript. */
export const ENGINE_VERSION = '0.1.0-alpha.3';

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
  private pendingLaryngoscopy: { readonly result: LaryngoscopyResult; readonly completesAtTick: number } | null = null;
  private readonly artifacts = new Set<ArtifactId>();
  private pendingEvents: EngineEvent[] = [];
  private vasopressorEffect = 0;
  /** A learner fluid bolus waiting to reach the circulation on the next tick. */
  private pendingCrystalloidMl = 0;
  /** Physical delivery state, intentionally separate from the pump's commanded rate. */
  private hypnoticLineConnected = true;
  /** Whether the learner has deliberately inspected the line since its last failure. */
  private hypnoticLineInspected = false;
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
      respiratory: RESPIRATORY_PROFILES[p.respiratory.profile],
      airway: { difficulty: p.airway.difficulty, difficultMaskVentilation: p.airway.difficultMaskVentilation },
      coreTemperatureC: p.baseline.coreTemperatureC,
      ageYears: p.ageYears,
    };
    this.patient = new VirtualPatient(profile, this.rng.fork('patient'), options.scenario.equipment.ventilator.fio2);
    this.waveforms = new WaveformEngine({ seed: options.seed, tickSeconds: 0.1 });

    const v = options.scenario.equipment.ventilator;
    this.ventilator = {
      mode: v.mode, tidalVolumeMl: v.tidalVolumeMl, respiratoryRateBpm: v.respiratoryRateBpm,
      fio2: v.fio2, peep: 0, delivering: v.delivering, sevofluranePercent: 0,
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
      case 'laryngoscopy': {
        if (this.patient.airway.intubated || this.pendingLaryngoscopy) {
          this.log('warning', 'airway', `laryngoscopy-refused-${this.currentTick}`,
            this.patient.airway.intubated
              ? 'The tracheal tube is already in place. No new attempt was started.'
              : 'A laryngoscopy attempt is already in progress. No overlapping attempt was started.');
          break;
        }
        const technique = action.payload.technique === 'video' ? 'video' : 'direct';
        const result = this.patient.beginLaryngoscopy(technique);
        this.pendingLaryngoscopy = {
          result,
          completesAtTick: this.currentTick + result.durationSeconds * TICKS_PER_SECOND,
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
        this.log('info', 'fluid', `fluid-${fluid.id}-${this.currentTick}`,
          `${fluid.name} ${volumeMl} mL given. The model retains ${fluid.retainedFraction * 100}% intravascularly.`,
          { fluidId: fluid.id, volumeMl, retainedFraction: fluid.retainedFraction, teachingModel: true });
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
    const mass = unit.includes('/kg') ? amount * this.covariates.weightKg : amount;
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
      + (unit.includes('/kg') ? ` (${amount} ${unit} at ${this.covariates.weightKg} kg)` : '')
      + (implausible ? ` — ${(mass / drug.typicalDose).toFixed(0)} times the typical dose` : ''),
      {
        drugId, mass, unit: drug.model.doseUnit, route: 'intravenous',
        modelId: drug.model.id, implausible, stacking,
      });
  }

  private setInfusion(drugId: string, rate: number, unit: string): void {
    const drug = this.drugs.get(drugId);
    if (!drug) return;
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
      + `${this.ventilator.delivering ? `${this.ventilator.tidalVolumeMl} mL × ${this.ventilator.respiratoryRateBpm}` : 'not delivering'}`);
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

      case 'rhythm-change': {
        const rhythm = event.target;
        if (!rhythm) {
          this.log('warning', 'scenario', `incomplete-event-${event.id}-${this.currentTick}`,
            `Timeline event "${event.id}" changes the rhythm but names no target rhythm.`);
          return;
        }
        this.rhythm = rhythm as RhythmId;
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
    if (this.pendingLaryngoscopy && this.currentTick >= this.pendingLaryngoscopy.completesAtTick) {
      const { result } = this.pendingLaryngoscopy;
      this.patient.airway.completeAttempt(result);
      this.lastGrade = result.grade;
      this.log('warning', 'airway', `laryngoscopy-${this.patient.airway.attempts}`, result.narrative, {
        grade: result.grade, attempt: this.patient.airway.attempts,
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
    for (const event of this.running) {
      if (event.type === 'surgical-stimulus') stimulus = Math.max(stimulus, event.value);
      if (event.type === 'blood-loss') bloodLossMl += event.value / 600;
      if (event.type === 'crystalloid') crystalloidMl += event.value / 600;
      if (event.type === 'obstruction') obstruction = Math.max(obstruction, event.value);
    }
    crystalloidMl += this.pendingCrystalloidMl;
    this.pendingCrystalloidMl = 0;

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
    const rocuroniumCe = rocuronium?.solver.hasEffectSiteCurve ? rocuronium.solver.effectSite : 0;

    // --- Physiology ------------------------------------------------------------
    const effectiveVentilator = this.pendingLaryngoscopy
      ? { ...this.ventilator, delivering: false }
      : this.ventilator;
    const result = this.patient.tick(
      { propofolCe, remifentanilCe, rocuroniumCe, vasopressorEffect: this.vasopressorEffect },
      effectiveVentilator,
      { surgicalStimulus: stimulus, obstructionFraction: obstruction, bloodLossMl, crystalloidMl },
    );
    // A vasopressor's effect wanes; the teaching model decays it over about five minutes.
    this.vasopressorEffect *= Math.exp(-0.1 / 5);

    this.reconcileArrest(result.state.cardiacOutputLPerMin ?? 0);

    // Preoxygenation is judged on the END-TIDAL fraction, because that is what
    // says the functional residual capacity has actually been denitrogenated. The
    // inspired fraction says only what the machine is delivering to the circuit:
    // a leaking mask reads 1.0 inspired and 0.4 end-tidal, and the safe apnoea
    // time that follows is the one the reservoir bought, not the one the flowmeter
    // promised. 0.9 is the conventional endpoint.
    if (result.state.endTidalO2Fraction >= PREOXYGENATION_END_TIDAL_TARGET
      && !this.patient.airway.intubated) {
      this.preoxygenationTicks += 1;
    }

    // --- Waveforms -------------------------------------------------------------
    const waveforms = this.waveforms.tick(restingDrive({
      heartRateBpm: result.state.heartRateBpm,
      rhythmId: this.rhythm,
      systolicMmHg: result.state.systolicMmHg,
      diastolicMmHg: result.state.diastolicMmHg,
      svrDynSCm5: result.state.svrDynSCm5,
      strokeVolumeMl: result.state.strokeVolumeMl,
      perfusionIndex: result.state.perfusionIndex,
      spo2Percent: result.state.spo2Percent,
      etco2MmHg: result.state.etco2MmHg,
      respiratoryRateBpm: Math.max(result.state.respiratoryRateBpm, 1),
      bronchospasmSeverity: obstruction,
      ventilating: result.state.respiratoryRateBpm > 0 && result.state.tidalVolumeMl > 0,
      anesthesiaDepthFraction: result.anesthesiaDepthFraction,
      hypovolemiaFraction: result.hypovolemiaFraction,
      positivePressure: effectiveVentilator.delivering && effectiveVentilator.mode !== 'manual',
      curareCleftDepth: 0,
    }));

    // --- Alarms ----------------------------------------------------------------
    const invalid = this.invalidParameters();
    const alarmResult = this.alarmEngine.evaluate(result.state, this.currentTick, {
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
        effectSite: drug.solver.hasEffectSiteCurve ? drug.solver.effectSite : Number.NaN,
        unit: drug.model.concentrationUnit,
      });
    }

    this.lastState = result.state;

    const events = this.pendingEvents;
    this.pendingEvents = [];
    this.currentTick += 1;

    return {
      tick: this.currentTick - 1,
      state: result.state,
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
        attempts: this.patient.airway.attempts,
        lastGrade: this.lastGrade,
        attemptInProgress: this.pendingLaryngoscopy !== null,
        attemptSecondsRemaining: this.pendingLaryngoscopy
          ? Math.max(0, Math.ceil((this.pendingLaryngoscopy.completesAtTick - this.currentTick) / TICKS_PER_SECOND))
          : 0,
      },
      hypnoticLine: {
        connected: this.hypnoticLineConnected,
        inspected: this.hypnoticLineInspected,
      },
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
