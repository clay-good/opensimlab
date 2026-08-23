/**
 * The virtual patient: one object that owns the state vector and advances it by
 * one 100 ms tick, driving the haemodynamics, gas exchange, depth, and airway
 * from the drug concentrations the pharmacokinetic core produced.
 *
 * It reads no clock and draws no unseeded random number, so the same actions on
 * the same seed reproduce the same trace on any device.
 */

import { approach, clamp } from '@platform/kernel/numeric';
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
import { neuromuscularState } from './neuromuscular';

export * from './state';
export * from './respiratory';
export * from './hemodynamics';
export * from './airway';
export * from './neuromuscular';
export * from './laryngospasm';
export { AttributionRecorder } from './attribution';

/** One tick, in minutes. */
export const TICK_MINUTES = 1 / 600;

/**
 * Cardiac output, litres per minute, below which the circulation has stopped.
 *
 * Not a threshold anyone published — it is the point at which this model's
 * output is indistinguishable from none, and past which continuing to integrate
 * a heart rate would be describing a patient who does not have one.
 */
export const ARREST_OUTPUT_L_PER_MIN = 0.4;

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
  /** Rocuronium effect-site concentration, mg/L. */
  readonly rocuroniumCe?: number;
  /** Vasopressor effect, 0 to 1, from a teaching model. */
  readonly vasopressorEffect: number;
  /** Source-banded perioperative IV epinephrine teaching effect, 0 to 1. */
  readonly epinephrineEffect?: number;
}

/** Ventilation and airway settings the learner controls. */
export interface VentilatorSettings {
  readonly mode: 'volume-control' | 'pressure-control' | 'manual';
  readonly tidalVolumeMl: number;
  readonly respiratoryRateBpm: number;
  readonly fio2: number;
  /** Fresh gas flow, litres per minute, which sets volatile wash-in and washout speed. */
  readonly freshGasFlowLPerMin: number;
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
  /** 0 to 1 functional closure at the larynx, separate from lower-airway obstruction. */
  readonly upperAirwayClosureFraction?: number;
  /** Millilitres of blood lost this tick. */
  readonly bloodLossMl: number;
  /** Millilitres of crystalloid given this tick. */
  readonly crystalloidMl: number;
  /** Unopposed systemic anaphylaxis effect, 0 to 1. */
  readonly anaphylaxisFraction?: number;
  /** Plasma volume leaving the circulation this tick through capillary leak. */
  readonly capillaryLeakMl?: number;
  /** 0 to 1 active hypermetabolic crisis after treatment opposition. */
  readonly hypermetabolicFraction?: number;
  /** Whether active cooling is being applied at a modeled treatment temperature. */
  readonly activeCooling?: boolean;
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

/**
 * Propofol's respiratory dose-response, which is SEPARATE from its hypnotic one
 * and more sensitive than it. An induction dose reliably stops a patient
 * breathing; a sedative dose leaves them breathing. Scaling respiratory
 * depression off the depth index cannot produce both behaviours, and an earlier
 * version that tried left a 2 mg/kg induction breathing calmly at 13 a minute
 * with nobody ever desaturating.
 *
 * These are an Open Sim Lab calibration, not transcribed values: the steepness is
 * chosen so apnoea arrives at induction concentrations and returns as the drug
 * redistributes. The limitations register records it under
 * `respiratory-depression-is-calibrated`.
 */
export const PROPOFOL_RESPIRATORY = { apnoeaCe50: 2.0, apnoeaGamma: 3.0 } as const;

export class VirtualPatient {
  private readonly profile: PatientProfile;
  private readonly hemodynamics: HemodynamicState;
  private readonly gas: GasState;
  readonly airway: AirwayState;
  private readonly rng: Rng;
  private temperatureC: number;
  private thermalLoadFraction = 0;
  private hypermetabolicCardiovascularFraction = 0;
  private muscleRigidityFraction = 0;
  /** Circulating hemoglobin mass, so blood loss and crystalloid dilution remain coherent. */
  private hemoglobinMassG: number;
  private sevofluranePercent = 0;
  private lastMap: number;
  /**
   * Saturation as of the previous tick, which is what the circulation responds
   * to. Gas exchange is solved after the haemodynamics within a tick, so this is
   * one tick — 100 ms — behind. That is stated rather than hidden; at this
   * timescale it is invisible, and solving them simultaneously would mean an
   * implicit step for no teaching gain.
   */
  private lastSaturationPercent = 97;
  /**
   * True once the circulation has stopped. It does not clear.
   *
   * Masking an arrest at the monitor is not enough: with only the display
   * invalidated, the underlying heart rate and pressure recovered as soon as
   * oxygen was restored, so the waveform engine was driving a rhythm the
   * monitor called asystole and the transcript recorded a patient who got
   * better. This module models no resuscitation, so an arrest is where its
   * physiology stops — in the state itself, not just in what is shown.
   */
  private arrested = false;

  constructor(profile: PatientProfile, rng: Rng, initialFio2 = 0.21) {
    this.profile = profile;
    this.rng = rng;
    this.airway = new AirwayState();
    this.temperatureC = profile.coreTemperatureC;
    this.hemoglobinMassG = profile.hemodynamics.hemoglobinGPerDl
      * (profile.hemodynamics.bloodVolumeMl / 100);
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
      hemoglobinGPerDl: this.hemoglobinGPerDl(),
      spo2Percent: 100,
      pao2MmHg: 0,
      endTidalO2Fraction: 0.21,
      paco2MmHg: this.gas.paco2MmHg,
      etco2MmHg: 0,
      respiratoryRateBpm: 0,
      tidalVolumeMl: 0,
      coreTemperatureC: this.temperatureC,
      muscleRigidityFraction: this.muscleRigidityFraction,
      depthIndex: 93,
      trainOfFourRatio: 1,
      trainOfFourCount: 4,
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
    return responseSurfaceEffect(
      drugs.propofolCe, drugs.remifentanilCe, undefined, this.volatileMacFraction(),
    );
  }

  /**
   * The age-adjusted MAC fraction the patient currently has on board.
   *
   * Read from the END-TIDAL concentration, not the vaporizer dial, for the same
   * reason preoxygenation is judged end-tidal: the dial says what the machine is
   * delivering and the end-tidal says what reached the patient.
   */
  volatileMacFraction(): number {
    return macFraction('sevoflurane', this.sevofluranePercent, this.profile.ageYears);
  }

  /** Advance one tick. */
  tick(drugs: DrugDrive, ventilator: VentilatorSettings, scenario: ScenarioDrive): TickResult {
    const recorder = new AttributionRecorder();
    const hypermetabolic = clamp(scenario.hypermetabolicFraction ?? 0, 0, 1);
    this.hypermetabolicCardiovascularFraction = approach(
      this.hypermetabolicCardiovascularFraction, hypermetabolic, 0.9, TICK_MINUTES,
    );
    this.thermalLoadFraction = approach(
      this.thermalLoadFraction, hypermetabolic, 2.5, TICK_MINUTES,
    );
    const previousRigidity = this.muscleRigidityFraction;
    this.muscleRigidityFraction = approach(
      this.muscleRigidityFraction, hypermetabolic, 3.2, TICK_MINUTES,
    );
    const rigidityChange = this.muscleRigidityFraction - previousRigidity;
    if (Math.abs(rigidityChange) > 1e-12) {
      recorder.add(
        'muscleRigidityFraction', rigidityChange > 0 ? 'hypermetabolic-rigidity' : 'dantrolene-relief',
        rigidityChange > 0 ? 'Hypermetabolic muscle rigidity' : 'Dantrolene relief of rigidity',
        rigidityChange, { teachingModel: true },
      );
    }

    const heatDelta = 0.42 * this.thermalLoadFraction * TICK_MINUTES;
    const coolingDelta = scenario.activeCooling && this.temperatureC >= 38
      ? -1.2 * TICK_MINUTES : 0;
    const rawTemperatureDelta = heatDelta + coolingDelta;
    const nextTemperature = clamp(this.temperatureC + rawTemperatureDelta, 25, 43);
    const actualTemperatureDelta = nextTemperature - this.temperatureC;
    const temperatureScale = Math.abs(rawTemperatureDelta) > 1e-12
      ? actualTemperatureDelta / rawTemperatureDelta : 0;
    this.temperatureC = nextTemperature;
    if (heatDelta > 0 && temperatureScale !== 0) {
      recorder.add(
        'coreTemperatureC', 'hypermetabolic-heat', 'Hypermetabolic heat production',
        heatDelta * temperatureScale, { teachingModel: true },
      );
    }
    if (coolingDelta < 0 && temperatureScale !== 0) {
      recorder.add(
        'coreTemperatureC', 'active-cooling', 'Active cooling',
        coolingDelta * temperatureScale, { teachingModel: true },
      );
    }

    // --- Volume ---------------------------------------------------------------
    if (scenario.bloodLossMl > 0 || scenario.crystalloidMl > 0 || (scenario.capillaryLeakMl ?? 0) > 0) {
      const beforeMl = Math.max(this.hemodynamics.bloodVolumeMl, 1);
      const lostMl = Math.min(scenario.bloodLossMl, beforeMl);
      // Whole-blood loss removes red cells at the current concentration.
      this.hemoglobinMassG *= 1 - lostMl / beforeMl;
      // Crystalloid expands the intravascular space by roughly a quarter of the
      // volume infused; the rest redistributes.
      this.hemodynamics.bloodVolumeMl = Math.max(
        0,
        this.hemodynamics.bloodVolumeMl
          + scenario.crystalloidMl * 0.25
          - lostMl
          - Math.min(scenario.capillaryLeakMl ?? 0, beforeMl - lostMl),
      );
      if ((scenario.capillaryLeakMl ?? 0) > 0) {
        recorder.add(
          'bloodVolumeMl', 'anaphylaxis-capillary-leak', 'Plasma lost through capillary leak',
          -Math.min(scenario.capillaryLeakMl ?? 0, beforeMl - lostMl), { teachingModel: true },
        );
      }
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
    // A volatile is not just a hypnotic. Sevoflurane vasodilates and depresses
    // the myocardium in proportion to dose, which is why a patient maintained
    // deep on agent alone is hypotensive, and why turning the vaporizer down is
    // the first thing done about it.
    const volatile = this.volatileMacFraction();

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
      anaphylaxisFraction: scenario.anaphylaxisFraction,
      epinephrineEffect: drugs.epinephrineEffect,
      hypermetabolicFraction: this.hypermetabolicCardiovascularFraction,
      positivePressure: ventilator.delivering && ventilator.mode !== 'manual',
      saturationPercent: this.lastSaturationPercent,
      volatileMacFraction: volatile,
    }, TICK_MINUTES);

    // No circulation, and none returns. Applied before attribution so the Why
    // panel is describing the state the monitor is showing.
    if (this.arrested || hemo.cardiacOutputLPerMin < ARREST_OUTPUT_L_PER_MIN) {
      this.arrested = true;
      this.hemodynamics.heartRateBpm = 0;
      this.hemodynamics.strokeVolumeMl = 0;
    }

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
    // Propofol and opioid both depress ventilation, and they do it DIFFERENTLY.
    //
    // A hypnotic dose large enough to induce anaesthesia stops the patient
    // breathing — that apnoea is the thing the learner has to manage, and it is
    // why an earlier coefficient of 0.6 was wrong: it could not reach zero even
    // at full depth, so a 2 mg/kg induction left the patient breathing calmly at
    // 13 a minute and nobody ever desaturated.
    //
    // An opioid slows the RATE and largely spares the breath. That is the
    // classic pattern — a patient taking deep, infrequent breaths — and it looks
    // nothing like the shallow panting that scaling both by one number produces.
    // Respiratory depression gets its own dose-response rather than being scaled
    // off the hypnotic one. It has to: the respiratory endpoint is MORE sensitive
    // than the hypnotic endpoint, which is why an induction dose reliably stops a
    // patient breathing while a sedative dose leaves them breathing, and why a
    // single coefficient on depth cannot produce both.
    const hypnoticDepression = normalizedEffect(
      drugs.propofolCe, PROPOFOL_RESPIRATORY.apnoeaCe50, PROPOFOL_RESPIRATORY.apnoeaGamma,
    );
    const opioidDepression = clamp(1.25 * opioid, 0, 1);
    const neuromuscular = neuromuscularState(drugs.rocuroniumCe ?? 0);
    const rateDrive = clamp(1 - hypnoticDepression - opioidDepression, 0, 1)
      * neuromuscular.respiratoryMuscleFraction;
    const tidalDrive = clamp(1 - hypnoticDepression - 0.2 * opioidDepression, 0, 1)
      * neuromuscular.respiratoryMuscleFraction;
    const delivering = ventilator.delivering;
    const commandedTidal = delivering
      ? ventilator.tidalVolumeMl
      : Math.round(this.profile.respiratory.spontaneousTidalVolumeMl * tidalDrive);
    const commandedRate = delivering
      ? ventilator.respiratoryRateBpm
      : Math.round(this.profile.respiratory.spontaneousRespiratoryRateBpm * rateDrive);
    const airwayPatency = 1 - clamp(scenario.upperAirwayClosureFraction ?? 0, 0, 1);
    // At five percent patency or less, the calculated few millilitres are below
    // effective dead-space ventilation. Calling a set respiratory rate a breath
    // here would draw a normal capnogram for a functionally closed airway.
    const flowPatency = airwayPatency <= 0.0500001 ? 0 : airwayPatency;
    const tidal = Math.round(commandedTidal * flowPatency);
    const rate = flowPatency > 0 ? commandedRate : 0;

    const baselineCo = cardiacOutput(
      this.profile.hemodynamics.baselineHeartRateBpm, this.profile.hemodynamics.baselineStrokeVolumeMl,
    );
    const gasResult = stepGas(this.gas, {
      tidalVolumeMl: tidal,
      respiratoryRateBpm: rate,
      fio2: ventilator.fio2,
      cardiacOutputRatio: hemo.cardiacOutputLPerMin / Math.max(baselineCo, 0.1),
      obstructionFraction: scenario.obstructionFraction,
      hemoglobinGPerDl: this.hemoglobinGPerDl(),
      bloodVolumeMl: this.hemodynamics.bloodVolumeMl,
      metabolicRateMultiplier: 1 + 4 * hypermetabolic,
    }, this.profile.respiratory, TICK_MINUTES);

    if (tidal === 0 || rate === 0) {
      recorder.add('spo2Percent', 'apnea', 'Apnoea: no ventilation', -0.0001);
      recorder.add('paco2MmHg', 'apnea', 'Apnoea: carbon dioxide accumulating', 0.0001);
    }
    if (airwayPatency < 0.999) {
      recorder.add(
        'tidalVolumeMl', 'upper-airway-closure', 'Functional upper-airway closure',
        tidal - commandedTidal, { teachingModel: true },
      );
      recorder.add(
        'etco2MmHg', 'upper-airway-closure', 'No gas passing the upper airway',
        -0.0001, { teachingModel: true },
      );
    }
    if (neuromuscular.blockadeFraction > 0.001) {
      recorder.add(
        'trainOfFourRatio', 'rocuronium-blockade', 'Rocuronium neuromuscular blockade',
        neuromuscular.trainOfFourRatio - 1, { teachingModel: true },
      );
    }

    // --- Volatile agent ---------------------------------------------------------
    // A first-order wash-in toward the dial setting, accelerated by fresh gas
    // flow. This is a declared teaching calibration, not a breathing-system,
    // uptake, distribution or rebreathing model.
    const volatileTauMinutes = 2.5 / clamp(ventilator.freshGasFlowLPerMin, 0.5, 15);
    this.sevofluranePercent += (ventilator.sevofluranePercent - this.sevofluranePercent)
      * (1 - Math.exp(-TICK_MINUTES / volatileTauMinutes));

    // --- Assemble ---------------------------------------------------------------
    // Recomputed from the state rather than taken from the haemodynamic step,
    // because an arrest zeroes the rate and the stroke volume AFTER that step
    // ran — so the step's own output described a heart rate the patient no
    // longer has, and the monitor showed a cardiac output beside a heart rate
    // of zero.
    const co = cardiacOutput(this.hemodynamics.heartRateBpm, this.hemodynamics.strokeVolumeMl);
    const map = this.arrested
      ? meanArterialPressure(co, this.hemodynamics.svrDynSCm5)
      : hemo.meanArterialMmHg;
    const { systolic, diastolic } = pulsePressures(
      map, this.hemodynamics.strokeVolumeMl, this.hemodynamics.svrDynSCm5,
      this.profile.hemodynamics.arterialStiffness,
    );
    // Peripheral perfusion falls with cardiac output and with vasoconstriction.
    const perfusion = clamp(
      (co / Math.max(baselineCo, 0.1)) * Math.pow(baselineSvr(this.profile.hemodynamics) / Math.max(this.hemodynamics.svrDynSCm5, 1), 0.6) * 0.8,
      0.02, 1,
    );

    // Carried to the next tick, where it drives the circulation.
    this.lastSaturationPercent = gasResult.spo2Percent;

    const state: MutableState = {
      heartRateBpm: this.hemodynamics.heartRateBpm,
      systolicMmHg: systolic,
      diastolicMmHg: diastolic,
      meanArterialMmHg: map,
      cardiacOutputLPerMin: co,
      strokeVolumeMl: this.hemodynamics.strokeVolumeMl,
      svrDynSCm5: this.hemodynamics.svrDynSCm5,
      bloodVolumeMl: this.hemodynamics.bloodVolumeMl,
      hemoglobinGPerDl: this.hemoglobinGPerDl(),
      spo2Percent: gasResult.spo2Percent,
      pao2MmHg: gasResult.pao2MmHg,
      endTidalO2Fraction: gasResult.endTidalO2Fraction,
      paco2MmHg: gasResult.paco2MmHg,
      etco2MmHg: gasResult.etco2MmHg,
      respiratoryRateBpm: rate,
      tidalVolumeMl: tidal,
      coreTemperatureC: this.temperatureC,
      muscleRigidityFraction: this.muscleRigidityFraction,
      depthIndex: depth,
      trainOfFourRatio: neuromuscular.trainOfFourRatio,
      trainOfFourCount: neuromuscular.trainOfFourCount,
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

  private hemoglobinGPerDl(): number {
    return this.hemoglobinMassG / Math.max(this.hemodynamics.bloodVolumeMl / 100, 0.01);
  }

  /** Perform a laryngoscopy attempt with the session's seeded generator. */
  laryngoscopy(technique: 'direct' | 'video') {
    return this.airway.attempt(this.profile.airway, technique, this.rng);
  }

  beginLaryngoscopy(technique: 'direct' | 'video') {
    return this.airway.beginAttempt(this.profile.airway, technique, this.rng);
  }
}
