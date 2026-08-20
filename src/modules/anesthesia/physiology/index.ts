/**
 * The virtual patient: one object that owns the state vector and advances it by
 * one 100 ms tick, driving the haemodynamics, gas exchange, depth, and airway
 * from the drug concentrations the pharmacokinetic core produced.
 *
 * It reads no clock and draws no unseeded random number, so the same actions on
 * the same seed reproduce the same trace on any device.
 */

import { clamp } from '@platform/kernel/numeric';
import type { Rng } from '@platform/kernel/rng';
import type { Attribution } from '@platform/kernel/protocol';
import { AttributionRecorder } from './attribution';
import { AirwayState, type AirwayAnatomy } from './airway';
import {
  baselineSvr, cardiacOutput, effectiveStimulus, meanArterialPressure, pulsePressures,
  stepHemodynamics, type HemodynamicProfile, type HemodynamicState,
} from './hemodynamics';
import {
  initialGasState, stepGas, type GasState, type RespiratoryProfile,
} from './respiratory';
import { clampState, type ClampWarning, type MutableState, type PatientState } from './state';
import { macFraction, normalizedEffect, responseSurfaceEffect } from '../pharmacology/pd';

export * from './state';
export * from './respiratory';
export * from './hemodynamics';
export * from './airway';
export { AttributionRecorder } from './attribution';

/** One tick, in minutes. */
export const TICK_MINUTES = 1 / 600;

/** Everything a scenario declares about its patient's physiology. */
export interface PatientProfile {
  readonly hemodynamics: HemodynamicProfile;
  readonly respiratory: RespiratoryProfile;
  readonly airway: AirwayAnatomy;
  readonly coreTemperatureC: number;
  readonly ageYears: number;
}

/** What the pharmacology layer hands the physiology each tick. */
export interface DrugDrive {
  /** Propofol effect-site concentration, µg/mL. */
  readonly propofolCe: number;
  /** Remifentanil effect-site concentration, ng/mL. */
  readonly remifentanilCe: number;
  /** Vasopressor effect, 0 to 1, from a teaching model. */
  readonly vasopressorEffect: number;
}

/** Ventilation and airway settings the learner controls. */
export interface VentilatorSettings {
  readonly mode: 'volume-control' | 'pressure-control' | 'manual';
  readonly tidalVolumeMl: number;
  readonly respiratoryRateBpm: number;
  readonly fio2: number;
  /**
   * Positive end-expiratory pressure, in cmH₂O. Carried so the tray shows the
   * setting the machine actually holds. Its effect on functional residual
   * capacity and shunt is NOT modelled in this slice; the limitations register
   * says so under `peep-not-modelled` rather than letting the control imply it.
   */
  readonly peep: number;
  /** True when the learner or the ventilator is actually delivering breaths. */
  readonly delivering: boolean;
  readonly sevofluranePercent: number;
}

/** Everything the scenario timeline can push on this tick. */
export interface ScenarioDrive {
  /** Raw surgical stimulus, 0 to 1, before the anaesthetic opposes it. */
  readonly surgicalStimulus: number;
  /** 0 to 1 airway obstruction. */
  readonly obstructionFraction: number;
  /** Millilitres of blood lost this tick. */
  readonly bloodLossMl: number;
  /** Millilitres of crystalloid given this tick. */
  readonly crystalloidMl: number;
}

export interface TickResult {
  readonly state: PatientState;
  readonly attribution: readonly Attribution[];
  readonly warnings: readonly ClampWarning[];
  /** 0 to 1, for the waveform layer. */
  readonly hypovolemiaFraction: number;
  readonly anesthesiaDepthFraction: number;
}

/**
 * Propofol's normalized effect on the vasculature and on the myocardium. Both
 * ride the same effect-site concentration but reach their maxima at different
 * concentrations, which is why the pressure falls before the depth index does.
 */
export const PROPOFOL_HEMODYNAMIC = {
  vasodilationCe50: 2.4,
  vasodilationGamma: 1.8,
  depressionCe50: 3.6,
  depressionGamma: 2.2,
} as const;

/** Remifentanil's normalized effect for haemodynamic purposes. */
export const REMIFENTANIL_HEMODYNAMIC = { ce50: 4.5, gamma: 1.6 } as const;

export class VirtualPatient {
  private readonly profile: PatientProfile;
  private readonly hemodynamics: HemodynamicState;
  private readonly gas: GasState;
  readonly airway: AirwayState;
  private readonly rng: Rng;
  private temperatureC: number;
  private sevofluranePercent = 0;
  private lastMap: number;

  constructor(profile: PatientProfile, rng: Rng, initialFio2 = 0.21) {
    this.profile = profile;
    this.rng = rng;
    this.airway = new AirwayState();
    this.temperatureC = profile.coreTemperatureC;
    this.hemodynamics = {
      heartRateBpm: profile.hemodynamics.baselineHeartRateBpm,
      strokeVolumeMl: profile.hemodynamics.baselineStrokeVolumeMl,
      svrDynSCm5: baselineSvr(profile.hemodynamics),
      bloodVolumeMl: profile.hemodynamics.bloodVolumeMl,
    };
    this.gas = initialGasState(profile.respiratory, initialFio2);
    this.lastMap = profile.hemodynamics.baselineMapMmHg;
  }

  /** The state as it stands, without advancing. */
  snapshot(): PatientState {
    return this.assemble().state;
  }

  private assemble(): { state: PatientState; warnings: ClampWarning[] } {
    const co = cardiacOutput(this.hemodynamics.heartRateBpm, this.hemodynamics.strokeVolumeMl);
    const map = meanArterialPressure(co, this.hemodynamics.svrDynSCm5);
    const { systolic, diastolic } = pulsePressures(
      map, this.hemodynamics.strokeVolumeMl, this.hemodynamics.svrDynSCm5,
      this.profile.hemodynamics.arterialStiffness,
    );
    const state: MutableState = {
      heartRateBpm: this.hemodynamics.heartRateBpm,
      systolicMmHg: systolic,
      diastolicMmHg: diastolic,
      meanArterialMmHg: map,
      cardiacOutputLPerMin: co,
      strokeVolumeMl: this.hemodynamics.strokeVolumeMl,
      svrDynSCm5: this.hemodynamics.svrDynSCm5,
      bloodVolumeMl: this.hemodynamics.bloodVolumeMl,
      hemoglobinGPerDl: this.profile.hemodynamics.hemoglobinGPerDl,
      spo2Percent: 100,
      pao2MmHg: 0,
      paco2MmHg: this.gas.paco2MmHg,
      etco2MmHg: 0,
      respiratoryRateBpm: 0,
      tidalVolumeMl: 0,
      coreTemperatureC: this.temperatureC,
      depthIndex: 93,
      trainOfFourRatio: 1,
      endTidalSevofluranePercent: this.sevofluranePercent,
      macFraction: 0,
      fio2: 0.21,
      perfusionIndex: 0.8,
    };
    const warnings = clampState(state);
    return { state, warnings };
  }

  /** The predicted depth index, from the response surface. Never a monitor reading. */
  depthIndex(drugs: DrugDrive): number {
    return responseSurfaceEffect(drugs.propofolCe, drugs.remifentanilCe);
  }

  /** Advance one tick. */
  tick(drugs: DrugDrive, ventilator: VentilatorSettings, scenario: ScenarioDrive): TickResult {
    const recorder = new AttributionRecorder();

    // --- Volume ---------------------------------------------------------------
    if (scenario.bloodLossMl > 0 || scenario.crystalloidMl > 0) {
      // Crystalloid expands the intravascular space by roughly a quarter of the
      // volume infused; the rest redistributes.
      this.hemodynamics.bloodVolumeMl +=
        scenario.crystalloidMl * 0.25 - scenario.bloodLossMl;
    }

    // --- Drug effects ---------------------------------------------------------
    const vasodilation = normalizedEffect(
      drugs.propofolCe, PROPOFOL_HEMODYNAMIC.vasodilationCe50, PROPOFOL_HEMODYNAMIC.vasodilationGamma,
    );
    const depression = normalizedEffect(
      drugs.propofolCe, PROPOFOL_HEMODYNAMIC.depressionCe50, PROPOFOL_HEMODYNAMIC.depressionGamma,
    );
    const opioid = normalizedEffect(
      drugs.remifentanilCe, REMIFENTANIL_HEMODYNAMIC.ce50, REMIFENTANIL_HEMODYNAMIC.gamma,
    );

    const depth = this.depthIndex(drugs);
    // Depth runs 0 to 100 with 100 awake, so the anaesthetized fraction is its complement.
    const depthFraction = clamp(1 - depth / 93, 0, 1);
    const stimulus = effectiveStimulus(scenario.surgicalStimulus, depthFraction, opioid);

    // --- Haemodynamics --------------------------------------------------------
    const hemo = stepHemodynamics(this.hemodynamics, this.profile.hemodynamics, {
      propofolVasodilation: vasodilation,
      propofolDepression: depression,
      opioidEffect: opioid,
      surgicalStimulus: stimulus,
      anesthesiaDepthFraction: depthFraction,
      vasopressorEffect: drugs.vasopressorEffect,
      positivePressure: ventilator.delivering && ventilator.mode !== 'manual',
    }, TICK_MINUTES);

    for (const influence of hemo.influences) {
      recorder.add(influence.variable, influence.termId, influence.label, influence.contribution, {
        teachingModel: influence.teachingModel,
      });
    }
    // Mean arterial pressure is derived, so its attribution is inherited from the
    // terms that moved its two factors.
    const mapChange = hemo.meanArterialMmHg - this.lastMap;
    if (Math.abs(mapChange) > 1e-12) {
      const byVariable = new Map<string, number>();
      for (const influence of hemo.influences) {
        const key = `${influence.termId}|${influence.label}|${influence.teachingModel}`;
        // A change in resistance or in stroke volume moves the mean pressure in
        // proportion to its share of the product CO * SVR.
        const weight = influence.variable === 'svrDynSCm5'
          ? influence.contribution / Math.max(this.hemodynamics.svrDynSCm5, 1)
          : influence.contribution / Math.max(this.hemodynamics.strokeVolumeMl, 1);
        byVariable.set(key, (byVariable.get(key) ?? 0) + weight);
      }
      const total = [...byVariable.values()].reduce((sum, v) => sum + Math.abs(v), 0);
      for (const [key, weight] of byVariable) {
        const [termId = '', label = '', teaching = 'false'] = key.split('|');
        if (total === 0) continue;
        recorder.add('meanArterialMmHg', termId, label, mapChange * (weight / total), {
          teachingModel: teaching === 'true',
        });
      }
    }
    this.lastMap = hemo.meanArterialMmHg;

    // --- Ventilation and gas exchange ------------------------------------------
    // Propofol and opioid both depress ventilation. In this slice a spontaneously
    // breathing patient stops breathing as they go to sleep, which is the apnoea
    // the learner has to manage.
    const spontaneousDrive = clamp(1 - 0.6 * depthFraction - 1.1 * opioid, 0, 1);
    const delivering = ventilator.delivering;
    const tidal = delivering
      ? ventilator.tidalVolumeMl
      : Math.round(this.profile.respiratory.frcLitres > 0 ? 500 * spontaneousDrive : 0);
    const rate = delivering
      ? ventilator.respiratoryRateBpm
      : Math.round(14 * spontaneousDrive);

    const baselineCo = cardiacOutput(
      this.profile.hemodynamics.baselineHeartRateBpm, this.profile.hemodynamics.baselineStrokeVolumeMl,
    );
    const gasResult = stepGas(this.gas, {
      tidalVolumeMl: tidal,
      respiratoryRateBpm: rate,
      fio2: ventilator.fio2,
      cardiacOutputRatio: hemo.cardiacOutputLPerMin / Math.max(baselineCo, 0.1),
      obstructionFraction: scenario.obstructionFraction,
      hemoglobinGPerDl: this.profile.hemodynamics.hemoglobinGPerDl,
      bloodVolumeMl: this.hemodynamics.bloodVolumeMl,
    }, this.profile.respiratory, TICK_MINUTES);

    if (tidal === 0 || rate === 0) {
      recorder.add('spo2Percent', 'apnea', 'Apnoea: no ventilation', -0.0001);
      recorder.add('paco2MmHg', 'apnea', 'Apnoea: carbon dioxide accumulating', 0.0001);
    }

    // --- Volatile agent ---------------------------------------------------------
    // A first-order wash-in toward the dial setting. Fresh gas flow is not yet
    // modelled in this slice; the limitations register records that.
    this.sevofluranePercent += (ventilator.sevofluranePercent - this.sevofluranePercent)
      * (1 - Math.exp(-TICK_MINUTES / 2.5));

    // --- Assemble ---------------------------------------------------------------
    const co = hemo.cardiacOutputLPerMin;
    const map = hemo.meanArterialMmHg;
    const { systolic, diastolic } = pulsePressures(
      map, this.hemodynamics.strokeVolumeMl, this.hemodynamics.svrDynSCm5,
      this.profile.hemodynamics.arterialStiffness,
    );
    // Peripheral perfusion falls with cardiac output and with vasoconstriction.
    const perfusion = clamp(
      (co / Math.max(baselineCo, 0.1)) * Math.pow(baselineSvr(this.profile.hemodynamics) / Math.max(this.hemodynamics.svrDynSCm5, 1), 0.6) * 0.8,
      0.02, 1,
    );

    const state: MutableState = {
      heartRateBpm: this.hemodynamics.heartRateBpm,
      systolicMmHg: systolic,
      diastolicMmHg: diastolic,
      meanArterialMmHg: map,
      cardiacOutputLPerMin: co,
      strokeVolumeMl: this.hemodynamics.strokeVolumeMl,
      svrDynSCm5: this.hemodynamics.svrDynSCm5,
      bloodVolumeMl: this.hemodynamics.bloodVolumeMl,
      hemoglobinGPerDl: this.profile.hemodynamics.hemoglobinGPerDl,
      spo2Percent: gasResult.spo2Percent,
      pao2MmHg: gasResult.pao2MmHg,
      paco2MmHg: gasResult.paco2MmHg,
      etco2MmHg: gasResult.etco2MmHg,
      respiratoryRateBpm: rate,
      tidalVolumeMl: tidal,
      coreTemperatureC: this.temperatureC,
      depthIndex: depth,
      trainOfFourRatio: 1,
      endTidalSevofluranePercent: this.sevofluranePercent,
      macFraction: this.sevofluranePercent > 0
        ? macFraction('sevoflurane', this.sevofluranePercent, this.profile.ageYears)
        : 0,
      fio2: ventilator.fio2,
      perfusionIndex: perfusion,
    };
    const warnings = clampState(state);

    return {
      state,
      attribution: recorder.build(),
      warnings,
      hypovolemiaFraction: hemo.hypovolemiaFraction,
      anesthesiaDepthFraction: depthFraction,
    };
  }

  /** Perform a laryngoscopy attempt with the session's seeded generator. */
  laryngoscopy(technique: 'direct' | 'video') {
    return this.airway.attempt(this.profile.airway, technique, this.rng);
  }
}
