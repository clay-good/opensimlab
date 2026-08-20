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
import type { Attribution, DrugConcentration, EngineEvent, EquipmentSnapshot, LearnerAction } from '@platform/kernel/protocol';
import { createRng, type Rng } from '@platform/kernel/rng';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import { evaluateEnvelope } from './pharmacology/envelope';
import { getModel, parametersFor, selectDefaultModel, MODEL_SET_REVISION } from './pharmacology/registry';
import { normalizedEffect } from './pharmacology/pd';
import type { PharmacologyModel } from './pharmacology/types';
import type { Covariates } from './pharmacology/body-composition';
import {
  RESPIRATORY_PROFILES, VirtualPatient, baselineSvr,
  type PatientProfile, type PatientState, type VentilatorSettings,
} from './physiology';
import { WaveformEngine, restingDrive, type ArtifactId, type RhythmId, type WaveformFrame } from './waveforms';
import type { Scenario as ScenarioDocument, TimelineEvent } from './scenarios/types';

/** The engine's own version, recorded in every transcript. */
export const ENGINE_VERSION = '0.1.0-alpha.1';

export type Scenario = ScenarioDocument;

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
  private running: RunningEvent[] = [];
  private currentTick = 0;
  private ventilator: VentilatorSettings;
  private rhythm: RhythmId = 'sinus';
  /** The Cormack-Lehane grade of the last laryngoscopy, or null before the first. */
  private lastGrade: number | null = null;
  private readonly artifacts = new Set<ArtifactId>();
  private pendingEvents: EngineEvent[] = [];
  private vasopressorEffect = 0;
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
      });
      // The choice and its reason are recorded in the transcript.
      this.pendingEvents.push({
        tick: 0, severity: 'info', category: 'model',
        eventId: `model-${entry.drugId}`,
        message: `${entry.drugId}: ${selection.model.id}. ${selection.reason}`,
        data: { drugId: entry.drugId, modelId: selection.model.id },
      });
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
  apply(action: LearnerAction): void {
    switch (action.type) {
      case 'bolus': {
        this.giveBolus(String(action.payload.drugId), Number(action.payload.amount), String(action.payload.unit ?? ''));
        break;
      }
      case 'infusion': {
        this.setInfusion(String(action.payload.drugId), Number(action.payload.rate), String(action.payload.unit ?? ''));
        break;
      }
      case 'ventilator': {
        this.setVentilator(action.payload as unknown as Partial<VentilatorSettings>);
        break;
      }
      case 'laryngoscopy': {
        const result = this.patient.laryngoscopy(action.payload.technique === 'video' ? 'video' : 'direct');
        this.lastGrade = result.grade;
        this.log('warning', 'airway', `laryngoscopy-${this.patient.airway.attempts}`, result.narrative, {
          grade: result.grade, attempt: this.patient.airway.attempts, technique: String(action.payload.technique),
        });
        if (result.intubated) {
          this.setVentilator({ mode: 'volume-control', delivering: true });
        }
        break;
      }
      case 'vasopressor': {
        this.vasopressorEffect = Math.min(this.vasopressorEffect + Number(action.payload.effect ?? 0.4), 1);
        this.log('info', 'drug', `vasopressor-${this.currentTick}`,
          'Vasopressor given. Response from an Open Sim Lab teaching model, not a published population model.');
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

  /** Advance exactly one tick. */
  step(): EngineTick {
    // --- Timeline -------------------------------------------------------------
    let stimulus = 0;
    let bloodLossMl = 0;
    let crystalloidMl = 0;
    let obstruction = 0;

    for (const event of this.scenario.timeline) {
      const declared: TimelineEvent = event;
      if (declared.atTick === undefined || this.firedEvents.has(declared.id)) continue;
      if (this.currentTick < declared.atTick) continue;
      this.firedEvents.add(declared.id);
      if (declared.message) {
        this.log(declared.severity ?? 'info', 'scenario', declared.id, declared.message);
      }
      if (declared.durationTicks !== undefined && declared.value !== undefined) {
        this.running.push({
          id: declared.id, type: declared.type, value: declared.value,
          untilTick: this.currentTick + declared.durationTicks,
        });
      }
    }
    this.running = this.running.filter((event) => event.untilTick > this.currentTick);
    for (const event of this.running) {
      if (event.type === 'surgical-stimulus') stimulus = Math.max(stimulus, event.value);
      if (event.type === 'blood-loss') bloodLossMl += event.value / 600;
      if (event.type === 'crystalloid') crystalloidMl += event.value / 600;
      if (event.type === 'obstruction') obstruction = Math.max(obstruction, event.value);
    }

    // --- Pharmacokinetics ------------------------------------------------------
    for (const drug of this.drugs.values()) {
      drug.solver.step(drug.infusionRate);
      if (drug.solver.hasEffectSiteCurve) {
        const current = drug.solver.effectSite;
        const peak = this.lastEffectSitePeak.get(drug.drugId) ?? 0;
        if (current > peak) this.lastEffectSitePeak.set(drug.drugId, current);
      }
    }
    const propofol = this.drugs.get('propofol');
    const remifentanil = this.drugs.get('remifentanil');
    const propofolCe = propofol?.solver.hasEffectSiteCurve ? propofol.solver.effectSite : 0;
    // Remifentanil is dosed in micrograms into litres, so the plasma value is
    // µg/L, which is the same number as ng/mL.
    const remifentanilCe = remifentanil?.solver.hasEffectSiteCurve ? remifentanil.solver.effectSite : 0;

    // --- Physiology ------------------------------------------------------------
    const result = this.patient.tick(
      { propofolCe, remifentanilCe, vasopressorEffect: this.vasopressorEffect },
      this.ventilator,
      { surgicalStimulus: stimulus, obstructionFraction: obstruction, bloodLossMl, crystalloidMl },
    );
    // A vasopressor's effect wanes; the teaching model decays it over about five minutes.
    this.vasopressorEffect *= Math.exp(-0.1 / 5);

    if (this.ventilator.fio2 >= 0.8 && !this.patient.airway.intubated) this.preoxygenationTicks += 1;

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
      positivePressure: this.ventilator.delivering && this.ventilator.mode !== 'manual',
      curareCleftDepth: 0,
    }));

    // --- Alarms ----------------------------------------------------------------
    const invalid = this.invalidParameters();
    const alarmResult = this.alarmEngine.evaluate(result.state, this.currentTick, {
      artifactParameters: this.artifactParameters(),
      invalidParameters: invalid,
    });
    for (const alarm of alarmResult.raised) {
      this.log(alarm.priority === 'critical' ? 'critical' : alarm.priority === 'warning' ? 'warning' : 'advisory',
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
