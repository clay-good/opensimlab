/**
 * Haemodynamics (engine/physiology → Hemodynamic Response Model,
 * Baroreflex And Autonomic Regulation, Surgical Stimulus).
 *
 * Mean arterial pressure is DERIVED, never set:
 *
 *   CO  = HR * SV
 *   MAP = CO * SVR / 80 + CVP
 *
 * Anaesthetic agents act on the physiologic terms — vasodilation reduces
 * systemic vascular resistance, myocardial depression reduces stroke volume — so
 * the same mean pressure arrived at by different mechanisms responds differently
 * to treatment. That is the whole teaching point.
 */

import { approach, clamp } from '@platform/kernel/numeric';

/** Central venous pressure, mmHg. Held constant in this slice. */
export const CENTRAL_VENOUS_MMHG = 5;

/** Mean arterial pressure from cardiac output and vascular resistance. */
export function meanArterialPressure(cardiacOutputLPerMin: number, svrDynSCm5: number): number {
  return (cardiacOutputLPerMin * svrDynSCm5) / 80 + CENTRAL_VENOUS_MMHG;
}

/** Cardiac output in litres per minute from rate and stroke volume. */
export function cardiacOutput(heartRateBpm: number, strokeVolumeMl: number): number {
  return (heartRateBpm * strokeVolumeMl) / 1000;
}

/**
 * Systolic and diastolic pressures reconstructed from the mean and the pulse
 * pressure. Pulse pressure rises with stroke volume and with arterial stiffness,
 * which is why an elderly patient has a wide pulse pressure at the same mean.
 */
export function pulsePressures(
  meanMmHg: number,
  strokeVolumeMl: number,
  svrDynSCm5: number,
  arterialStiffness: number,
): { systolic: number; diastolic: number } {
  const pulse = clamp(
    (strokeVolumeMl / 70) * 40 * arterialStiffness * Math.pow(svrDynSCm5 / 1200, 0.25),
    12, 110,
  );
  // MAP = DBP + pulse/3 is the standard relationship, inverted here.
  const diastolic = meanMmHg - pulse / 3;
  return { systolic: diastolic + pulse, diastolic };
}

/** The patient's own haemodynamic baseline, from the scenario profile. */
export interface HemodynamicProfile {
  readonly baselineHeartRateBpm: number;
  readonly baselineMapMmHg: number;
  readonly baselineStrokeVolumeMl: number;
  /** 1.0 is a normal compliant artery; higher is stiffer, as in the elderly. */
  readonly arterialStiffness: number;
  /**
   * True where stroke volume cannot rise to compensate — severe aortic stenosis
   * being the case the scenario engine names.
   */
  readonly fixedStrokeVolume: boolean;
  /** Baroreflex gain, 1.0 in a healthy adult, lower with autonomic disease. */
  readonly baroreflexGain: number;
  readonly bloodVolumeMl: number;
  readonly hemoglobinGPerDl: number;
}

/** The mutable haemodynamic state carried between steps. */
export interface HemodynamicState {
  heartRateBpm: number;
  strokeVolumeMl: number;
  svrDynSCm5: number;
  bloodVolumeMl: number;
}

/** Drug and stimulus influences applied this step. */
export interface HemodynamicDrive {
  /** 0 to 1: fraction of maximal propofol vasodilation. */
  readonly propofolVasodilation: number;
  /** 0 to 1: fraction of maximal propofol myocardial depression. */
  readonly propofolDepression: number;
  /** 0 to 1: normalized opioid effect. Slows the heart and blunts the reflex. */
  readonly opioidEffect: number;
  /** 0 to 1: surgical stimulus intensity. */
  readonly surgicalStimulus: number;
  /** 0 to 1: how deeply anaesthetized, used to attenuate the reflex. */
  readonly anesthesiaDepthFraction: number;
  /** Vasoconstrictor effect from a vasopressor, 0 to 1. */
  readonly vasopressorEffect: number;
  /** True while positive-pressure ventilation reduces venous return. */
  readonly positivePressure: boolean;
}

/** The maximum effects each influence can have, at full effect. */
export const HEMODYNAMIC_GAINS = {
  /** Propofol at full effect drops systemic vascular resistance by this fraction. */
  propofolSvrDrop: 0.42,
  /** Propofol at full effect drops stroke volume by this fraction. */
  propofolStrokeVolumeDrop: 0.22,
  /** Opioid at full effect drops heart rate by this fraction. */
  opioidHeartRateDrop: 0.30,
  /** Opioid at full effect drops systemic vascular resistance by this fraction. */
  opioidSvrDrop: 0.10,
  /** Full surgical stimulus raises heart rate by this fraction of baseline. */
  stimulusHeartRateRise: 0.45,
  /** Full surgical stimulus raises systemic vascular resistance by this fraction. */
  stimulusSvrRise: 0.35,
  /** A vasopressor at full effect raises systemic vascular resistance by this fraction. */
  vasopressorSvrRise: 0.60,
  /** Positive-pressure ventilation reduces stroke volume by this fraction. */
  positivePressureStrokeVolumeDrop: 0.08,
} as const;

/** Time constants, in minutes. */
export const HEMODYNAMIC_TAU = {
  vascular: 0.4,
  stroke: 0.3,
  baroreflexHeartRate: 0.12,
  baroreflexVascular: 0.35,
} as const;

/** Baseline systemic vascular resistance implied by the profile. */
export function baselineSvr(profile: HemodynamicProfile): number {
  const co = cardiacOutput(profile.baselineHeartRateBpm, profile.baselineStrokeVolumeMl);
  return ((profile.baselineMapMmHg - CENTRAL_VENOUS_MMHG) * 80) / co;
}

export interface HemodynamicInfluence {
  readonly termId: string;
  readonly label: string;
  /** Signed contribution in the target variable's own units. */
  readonly contribution: number;
  readonly variable: 'svrDynSCm5' | 'strokeVolumeMl' | 'heartRateBpm';
  readonly teachingModel: boolean;
}

export interface HemodynamicResult {
  readonly influences: readonly HemodynamicInfluence[];
  readonly meanArterialMmHg: number;
  readonly cardiacOutputLPerMin: number;
  /** 0 to 1: how far circulating volume has fallen below the profile's baseline. */
  readonly hypovolemiaFraction: number;
}

/**
 * Advance the haemodynamics by `minutes`.
 *
 * Each influence is computed as an explicit named term and the resulting change
 * is recorded, so the Why panel can rank the actual contributors rather than
 * describe generic ones.
 */
export function stepHemodynamics(
  state: HemodynamicState,
  profile: HemodynamicProfile,
  drive: HemodynamicDrive,
  minutes: number,
): HemodynamicResult {
  const influences: HemodynamicInfluence[] = [];
  const baseSvr = baselineSvr(profile);
  const hypovolemia = clamp(1 - state.bloodVolumeMl / profile.bloodVolumeMl, 0, 1);

  // --- Systemic vascular resistance -----------------------------------------
  const vasodilationFactor = 1
    - HEMODYNAMIC_GAINS.propofolSvrDrop * drive.propofolVasodilation
    - HEMODYNAMIC_GAINS.opioidSvrDrop * drive.opioidEffect
    + HEMODYNAMIC_GAINS.stimulusSvrRise * drive.surgicalStimulus
    + HEMODYNAMIC_GAINS.vasopressorSvrRise * drive.vasopressorEffect;
  const targetSvr = baseSvr * clamp(vasodilationFactor, 0.25, 2.5);

  // --- Stroke volume ---------------------------------------------------------
  // Volume loss reduces preload; a fixed-stroke-volume patient cannot compensate.
  const preloadFactor = 1 - 1.2 * hypovolemia;
  const depressionFactor = 1 - HEMODYNAMIC_GAINS.propofolStrokeVolumeDrop * drive.propofolDepression;
  const ppvFactor = drive.positivePressure
    ? 1 - HEMODYNAMIC_GAINS.positivePressureStrokeVolumeDrop
    : 1;
  const targetStroke = profile.baselineStrokeVolumeMl
    * clamp(preloadFactor, 0.2, 1.4) * depressionFactor * ppvFactor;

  // --- Heart rate: intrinsic drive before the reflex --------------------------
  const intrinsicRate = profile.baselineHeartRateBpm
    * (1 - HEMODYNAMIC_GAINS.opioidHeartRateDrop * drive.opioidEffect)
    * (1 + HEMODYNAMIC_GAINS.stimulusHeartRateRise * drive.surgicalStimulus);

  // --- Baroreflex -------------------------------------------------------------
  // The reflex compares the current mean pressure with the set point and adjusts
  // rate and resistance toward it. Its gain falls with anaesthetic depth and with
  // opioid effect, which is why an anaesthetized patient does not compensate.
  const currentCo = cardiacOutput(state.heartRateBpm, state.strokeVolumeMl);
  const currentMap = meanArterialPressure(currentCo, state.svrDynSCm5);
  const error = profile.baselineMapMmHg - currentMap;
  const reflexGain = profile.baroreflexGain
    * (1 - 0.75 * drive.anesthesiaDepthFraction)
    * (1 - 0.45 * drive.opioidEffect);
  const reflexRateTarget = intrinsicRate + reflexGain * error * 0.55;
  const reflexSvrTarget = targetSvr * (1 + reflexGain * clamp(error / profile.baselineMapMmHg, -0.6, 0.6) * 0.5);

  // --- Integrate --------------------------------------------------------------
  const previousSvr = state.svrDynSCm5;
  const previousStroke = state.strokeVolumeMl;
  const previousRate = state.heartRateBpm;

  state.svrDynSCm5 = approach(state.svrDynSCm5, reflexSvrTarget, HEMODYNAMIC_TAU.baroreflexVascular, minutes);
  state.strokeVolumeMl = profile.fixedStrokeVolume
    // A fixed stroke volume falls with preload and with depression but cannot RISE
    // above baseline to compensate for vasodilation.
    ? approach(state.strokeVolumeMl, Math.min(targetStroke, profile.baselineStrokeVolumeMl), HEMODYNAMIC_TAU.stroke, minutes)
    : approach(state.strokeVolumeMl, targetStroke, HEMODYNAMIC_TAU.stroke, minutes);
  state.heartRateBpm = approach(state.heartRateBpm, reflexRateTarget, HEMODYNAMIC_TAU.baroreflexHeartRate, minutes);

  // --- Attribution ------------------------------------------------------------
  const svrChange = state.svrDynSCm5 - previousSvr;
  const strokeChange = state.strokeVolumeMl - previousStroke;
  const rateChange = state.heartRateBpm - previousRate;

  // Apportion each variable's change across the influences that pushed on it,
  // in proportion to how far each moved that variable's target.
  const svrDrivers: [string, string, number, boolean][] = [
    ['propofol-vasodilation', 'Propofol vasodilation', -HEMODYNAMIC_GAINS.propofolSvrDrop * drive.propofolVasodilation, false],
    ['opioid-vasodilation', 'Opioid vasodilation', -HEMODYNAMIC_GAINS.opioidSvrDrop * drive.opioidEffect, false],
    ['surgical-stimulus', 'Surgical stimulus', HEMODYNAMIC_GAINS.stimulusSvrRise * drive.surgicalStimulus, false],
    ['vasopressor', 'Vasopressor', HEMODYNAMIC_GAINS.vasopressorSvrRise * drive.vasopressorEffect, true],
    ['baroreflex', 'Baroreflex', reflexGain * clamp(error / profile.baselineMapMmHg, -0.6, 0.6) * 0.5, false],
  ];
  const svrWeight = svrDrivers.reduce((sum, [, , value]) => sum + Math.abs(value), 0);
  for (const [termId, label, value, teaching] of svrDrivers) {
    if (value === 0 || svrWeight === 0) continue;
    influences.push({
      termId, label, variable: 'svrDynSCm5', teachingModel: teaching,
      contribution: svrChange * (value / svrWeight) * Math.sign(value) * Math.sign(svrChange || 1),
    });
  }

  const strokeDrivers: [string, string, number, boolean][] = [
    ['propofol-myocardial-depression', 'Propofol myocardial depression', -HEMODYNAMIC_GAINS.propofolStrokeVolumeDrop * drive.propofolDepression, false],
    ['hypovolemia', 'Reduced circulating volume', -1.2 * hypovolemia, false],
    ['positive-pressure-ventilation', 'Positive-pressure ventilation reducing venous return', drive.positivePressure ? -HEMODYNAMIC_GAINS.positivePressureStrokeVolumeDrop : 0, false],
  ];
  const strokeWeight = strokeDrivers.reduce((sum, [, , value]) => sum + Math.abs(value), 0);
  for (const [termId, label, value, teaching] of strokeDrivers) {
    if (value === 0 || strokeWeight === 0) continue;
    influences.push({
      termId, label, variable: 'strokeVolumeMl', teachingModel: teaching,
      contribution: strokeChange * (Math.abs(value) / strokeWeight) * Math.sign(value),
    });
  }

  const rateDrivers: [string, string, number, boolean][] = [
    ['opioid-bradycardia', 'Opioid slowing the heart', -HEMODYNAMIC_GAINS.opioidHeartRateDrop * drive.opioidEffect, false],
    ['surgical-stimulus', 'Surgical stimulus', HEMODYNAMIC_GAINS.stimulusHeartRateRise * drive.surgicalStimulus, false],
    ['baroreflex', 'Baroreflex', reflexGain * error * 0.55 / Math.max(profile.baselineHeartRateBpm, 1), false],
  ];
  const rateWeight = rateDrivers.reduce((sum, [, , value]) => sum + Math.abs(value), 0);
  for (const [termId, label, value, teaching] of rateDrivers) {
    if (value === 0 || rateWeight === 0) continue;
    influences.push({
      termId, label, variable: 'heartRateBpm', teachingModel: teaching,
      contribution: rateChange * (Math.abs(value) / rateWeight) * Math.sign(value),
    });
  }

  const co = cardiacOutput(state.heartRateBpm, state.strokeVolumeMl);
  return {
    influences,
    meanArterialMmHg: meanArterialPressure(co, state.svrDynSCm5),
    cardiacOutputLPerMin: co,
    hypovolemiaFraction: hypovolemia,
  };
}

/**
 * Surgical stimulus (engine/physiology → Surgical Stimulus).
 *
 * A time-varying scalar raised by the scenario's timeline and opposed by hypnotic
 * and opioid effect. What reaches the patient is the stimulus that gets past the
 * anaesthetic, which is the hypnotic-opioid balance a learner has to feel.
 */
export function effectiveStimulus(
  rawStimulus: number,
  anesthesiaDepthFraction: number,
  opioidEffect: number,
): number {
  // Opioid blunts the response far more than hypnotic does, which is the whole
  // reason an opioid is given before incision.
  const blunting = clamp(0.35 * anesthesiaDepthFraction + 0.85 * opioidEffect, 0, 0.97);
  return clamp(rawStimulus, 0, 1) * (1 - blunting);
}
