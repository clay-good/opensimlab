/**
 * Gas exchange (engine/physiology → Respiratory And Gas Exchange Model).
 *
 * Alveolar ventilation, carbon dioxide stores, oxygen uptake, and the
 * oxyhaemoglobin dissociation curve, so that end-tidal carbon dioxide and
 * arterial oxygen saturation FOLLOW from ventilator settings, apnoea, airway
 * obstruction and metabolic rate rather than being set.
 */

import { clamp } from '@platform/kernel/numeric';

/** Barometric pressure minus saturated water vapour pressure, mmHg. */
export const DRY_BAROMETRIC_MMHG = 713;
/** Respiratory quotient used in the alveolar gas equation. */
export const RESPIRATORY_QUOTIENT = 0.8;

/**
 * Effective adult body carbon dioxide store, in mL of carbon dioxide per mmHg
 * of arterial tension. Calibrated so that apnoea at a normal adult metabolic
 * rate raises arterial carbon dioxide by about 3 mmHg per minute. Pediatric
 * profiles retain this teaching calibration per kilogram rather than pretending
 * a pediatric storage coefficient was published.
 */
export const CO2_STORE_ML_PER_MMHG = 66;

/**
 * The oxyhaemoglobin dissociation curve, by the Severinghaus 1979 inversion
 * (J Appl Physiol 1979;46:599-602, PMID 35496).
 *
 *   SO2 = 1 / (23400 / (PO2^3 + 150 * PO2) + 1)
 *
 * Its shape is the reason a saturation falling below 90% then falls markedly
 * faster: on the steep part of the curve a small further fall in tension costs a
 * large fall in saturation.
 */
export function saturationFromPo2(po2MmHg: number): number {
  const po2 = Math.max(po2MmHg, 0);
  if (po2 === 0) return 0;
  return 100 / (23400 / (po2 * po2 * po2 + 150 * po2) + 1);
}

/** The inverse, by bisection: the tension that produces a given saturation. */
export function po2FromSaturation(saturationPercent: number): number {
  let low = 0;
  let high = 700;
  for (let i = 0; i < 60; i += 1) {
    const mid = (low + high) / 2;
    if (saturationFromPo2(mid) < saturationPercent) low = mid; else high = mid;
  }
  return (low + high) / 2;
}

/** The alveolar gas equation. */
export function alveolarPo2(fio2: number, paco2MmHg: number): number {
  return fio2 * DRY_BAROMETRIC_MMHG - paco2MmHg / RESPIRATORY_QUOTIENT;
}

/** Per-patient respiratory constants, which the scenario's profile supplies. */
export interface RespiratoryProfile {
  /** Functional residual capacity, litres. The oxygen reservoir during apnoea. */
  readonly frcLitres: number;
  /** Oxygen consumption, litres per minute. */
  readonly vo2LitresPerMin: number;
  /** Carbon dioxide production, litres per minute. */
  readonly vco2LitresPerMin: number;
  /** Anatomical dead space, millilitres. */
  readonly deadSpaceMl: number;
  /** Effective body carbon dioxide store, mL CO2 per mmHg arterial tension. */
  readonly co2StoreMlPerMmHg: number;
  /** Undepressed spontaneous tidal volume used when the machine is not delivering. */
  readonly spontaneousTidalVolumeMl: number;
  /** Undepressed spontaneous respiratory rate used when the machine is not delivering. */
  readonly spontaneousRespiratoryRateBpm: number;
  /** Alveolar-to-arterial oxygen gradient, mmHg. Widened by disease and by obesity. */
  readonly aaGradientMmHg: number;
}

/** The three profiles the Benumof benchmark is stated for. */
export const RESPIRATORY_PROFILES: Record<'healthy' | 'moderately-ill' | 'obese' | 'term-pregnancy', RespiratoryProfile> = {
  // A healthy 70 kg adult.
  healthy: {
    frcLitres: 2.5, vo2LitresPerMin: 0.25, vco2LitresPerMin: 0.2, deadSpaceMl: 150,
    co2StoreMlPerMmHg: CO2_STORE_ML_PER_MMHG,
    spontaneousTidalVolumeMl: 500, spontaneousRespiratoryRateBpm: 14, aaGradientMmHg: 10,
  },
  // A moderately ill 70 kg adult: reduced reserve and a raised metabolic rate.
  'moderately-ill': {
    frcLitres: 2.0, vo2LitresPerMin: 0.30, vco2LitresPerMin: 0.24, deadSpaceMl: 170,
    co2StoreMlPerMmHg: CO2_STORE_ML_PER_MMHG,
    spontaneousTidalVolumeMl: 500, spontaneousRespiratoryRateBpm: 14, aaGradientMmHg: 20,
  },
  // An obese adult: functional residual capacity is much reduced and consumption raised.
  obese: {
    frcLitres: 1.3, vo2LitresPerMin: 0.39, vco2LitresPerMin: 0.3, deadSpaceMl: 180,
    co2StoreMlPerMmHg: CO2_STORE_ML_PER_MMHG,
    spontaneousTidalVolumeMl: 500, spontaneousRespiratoryRateBpm: 14, aaGradientMmHg: 30,
  },
  // One term-pregnancy teaching profile. Reduced reserve and increased oxygen
  // consumption are calibrated against the pregnancy apnoea course reported by
  // McClelland, Bogod and Hardman (2008; PMID 18289232), not a patient forecast.
  'term-pregnancy': {
    frcLitres: 2.0, vo2LitresPerMin: 0.30, vco2LitresPerMin: 0.24, deadSpaceMl: 150,
    co2StoreMlPerMmHg: CO2_STORE_ML_PER_MMHG,
    spontaneousTidalVolumeMl: 500, spontaneousRespiratoryRateBpm: 14, aaGradientMmHg: 12,
  },
};

/**
 * Healthy pediatric gas-exchange constants for the bounded 1–12 year profile.
 *
 * Metabolic production follows Lindahl et al. 1989 (PMID 2492815). Anatomic
 * dead space follows Numa and Newth 1996 (PMID 8727530). The spontaneous tidal
 * volume is the conservative 6 mL/kg approximation recommended from the
 * anesthetized-child measurements of Lindahl, Hulse and Hatch 1984
 * (PMID 6419754).
 * FRC uses Thorsteinsson's nonlinear weight regression in healthy anesthetized
 * children aged 0.1–11.2 years (PMID 2240677). CO2 storage has no corresponding
 * pediatric parameter in this model; it retains the adult teaching calibration
 * and scales it linearly by weight.
 */
export function healthyChildRespiratoryProfile(ageYears: number, weightKg: number): RespiratoryProfile {
  const age = clamp(Number.isFinite(ageYears) ? ageYears : 6, 1, 12);
  const weight = clamp(Number.isFinite(weightKg) ? weightKg : 20, 5, 61);
  const vco2MlPerMin = 4.8 * weight + 6.4;
  const deadSpaceMl = weight * (3.28 - 0.56 * Math.log(1 + age));
  const spontaneousTidalVolumeMl = 6 * weight;
  // At baseline this makes clearance equal production at PaCO2 40 mmHg.
  const spontaneousRespiratoryRateBpm = Math.round(
    (vco2MlPerMin / 1000) * 863 / 40
      / Math.max((spontaneousTidalVolumeMl - deadSpaceMl) / 1000, 0.001),
  );
  return {
    frcLitres: (9.51 * weight ** 1.31) / 1000,
    vo2LitresPerMin: (5 * weight + 19.8) / 1000,
    vco2LitresPerMin: vco2MlPerMin / 1000,
    deadSpaceMl,
    co2StoreMlPerMmHg: CO2_STORE_ML_PER_MMHG * weight / 70,
    spontaneousTidalVolumeMl,
    spontaneousRespiratoryRateBpm,
    aaGradientMmHg: 10,
  };
}

/** The gas state carried between steps. */
export interface GasState {
  /** Oxygen currently held in the functional residual capacity, litres. */
  alveolarOxygenLitres: number;
  /** Arterial carbon dioxide tension, mmHg. */
  paco2MmHg: number;
}

export function initialGasState(profile: RespiratoryProfile, fio2: number, paco2MmHg = 40): GasState {
  return {
    // Before preoxygenation the alveolar oxygen fraction is the inspired fraction
    // minus what carbon dioxide and water vapour already occupy.
    alveolarOxygenLitres: profile.frcLitres * (alveolarPo2(fio2, paco2MmHg) / DRY_BAROMETRIC_MMHG),
    paco2MmHg,
  };
}

export interface VentilationInput {
  /** Delivered tidal volume, millilitres. Zero during apnoea. */
  readonly tidalVolumeMl: number;
  readonly respiratoryRateBpm: number;
  readonly fio2: number;
  /** Cardiac output relative to the patient's own baseline; scales end-tidal delivery. */
  readonly cardiacOutputRatio: number;
  /** 0 to 1; obstruction reduces effective alveolar ventilation. */
  readonly obstructionFraction: number;
  /** Haemoglobin, g/dL. With blood volume it sets the blood's oxygen store. */
  readonly hemoglobinGPerDl: number;
  /** Circulating blood volume, millilitres. */
  readonly bloodVolumeMl: number;
  /** Bounded hypermetabolic oxygen consumption and carbon dioxide production multiplier. */
  readonly metabolicRateMultiplier?: number;
}

export interface GasResult {
  readonly paco2MmHg: number;
  readonly etco2MmHg: number;
  readonly pao2MmHg: number;
  readonly spo2Percent: number;
  /** Alveolar oxygen fraction, which is what the end-tidal analyser reads. */
  readonly endTidalO2Fraction: number;
  readonly alveolarVentilationLPerMin: number;
}

/** Alveolar ventilation in litres per minute. */
export function alveolarVentilation(input: VentilationInput, profile: RespiratoryProfile): number {
  const effectiveTidal = Math.max(input.tidalVolumeMl - profile.deadSpaceMl, 0);
  const raw = (effectiveTidal * input.respiratoryRateBpm) / 1000;
  return raw * (1 - clamp(input.obstructionFraction, 0, 0.95));
}

/**
 * Advance the gas state by `minutes` and report the resulting tensions.
 *
 * Carbon dioxide follows the body's stores, so hypoventilation raises it toward a
 * new steady state with a long time constant rather than instantaneously.
 * Oxygen is drawn from the functional residual capacity at the patient's own
 * consumption rate, refilled by whatever ventilation delivers.
 */
export function stepGas(
  gas: GasState,
  input: VentilationInput,
  profile: RespiratoryProfile,
  minutes: number,
): GasResult {
  const va = alveolarVentilation(input, profile);

  // Carbon dioxide. Net accumulation is production minus clearance, and the
  // arterial tension moves by that net divided by the body's store.
  const clearance = (va * gas.paco2MmHg) / 863;
  const metabolicRate = clamp(input.metabolicRateMultiplier ?? 1, 1, 5);
  const netLitresPerMin = profile.vco2LitresPerMin * metabolicRate - clearance;
  gas.paco2MmHg = Math.max(
    gas.paco2MmHg + (netLitresPerMin * 1000 * minutes) / profile.co2StoreMlPerMmHg,
    5,
  );

  // Oxygen. Consumption empties the reservoir; ventilation refills it toward the
  // fraction the alveolar gas equation allows at the current carbon dioxide.
  //
  // Consumption is drawn against the COMBINED store, not the lung alone. The
  // blood holds far more oxygen than the functional residual capacity does, but
  // almost all of it is released only where the dissociation curve is steep. The
  // marginal blood capacitance is therefore near zero on the plateau, where the
  // lung reserve alone sets the pace, and large just as saturation reaches 90%,
  // which is why the fall pauses briefly there before accelerating.
  const tensionNow = (gas.alveolarOxygenLitres / profile.frcLitres) * DRY_BAROMETRIC_MMHG;
  const arterialNow = Math.max(tensionNow - profile.aaGradientMmHg, 0);
  const alveolarCapacitance = profile.frcLitres / DRY_BAROMETRIC_MMHG;
  // Oxygen bound to haemoglobin, litres per percentage point of saturation.
  const litresPerSaturationPoint =
    (1.34 * input.hemoglobinGPerDl * (input.bloodVolumeMl / 100)) / 100 / 1000;
  const saturationSlope =
    (saturationFromPo2(arterialNow + 0.5) - saturationFromPo2(arterialNow - 0.5)) / 1;
  const bloodCapacitance = Math.max(litresPerSaturationPoint * saturationSlope, 0);
  const combinedCapacitance = alveolarCapacitance + bloodCapacitance;

  const consumedLitres = profile.vo2LitresPerMin * metabolicRate * minutes;
  const tensionFall = consumedLitres / combinedCapacitance;
  gas.alveolarOxygenLitres = Math.max(
    gas.alveolarOxygenLitres - alveolarCapacitance * tensionFall, 0,
  );

  // Ventilation refills the reservoir toward the INSPIRED tension, not toward the
  // alveolar gas equation's answer. The alveolar gas equation already accounts for
  // oxygen uptake through its carbon dioxide term, so using it as the target while
  // ALSO draining consumption above counts the uptake twice and parks a healthy
  // ventilated patient near 93% on room air. Refilling toward inspired and letting
  // consumption dig the gradient DERIVES the alveolar gas equation instead of
  // asserting it: the steady state is PIO2 − PB·V̇O2/V̇A, within a few mmHg of the
  // textbook value at every inspired fraction.
  const targetOxygenLitres = profile.frcLitres * input.fio2;
  if (va > 0) {
    // Each litre of alveolar ventilation exchanges roughly its own volume against
    // the reservoir, so the refill rate constant is ventilation over capacity.
    const k = 1 - Math.exp(-(va / profile.frcLitres) * minutes);
    gas.alveolarOxygenLitres += (targetOxygenLitres - gas.alveolarOxygenLitres) * k;
  }
  gas.alveolarOxygenLitres = Math.max(gas.alveolarOxygenLitres, 0);

  const alveolarTension = (gas.alveolarOxygenLitres / profile.frcLitres) * DRY_BAROMETRIC_MMHG;
  const pao2 = Math.max(alveolarTension - profile.aaGradientMmHg, 0);
  const spo2 = saturationFromPo2(pao2);

  // End-tidal carbon dioxide sits a few mmHg below arterial, and falls with
  // cardiac output because delivery to the lung falls with it.
  // The gradient is the whole mechanism: falling output means less carbon dioxide
  // delivered to ventilated alveoli, so more of the exhaled breath is dead-space
  // gas and the end-tidal value drops further below arterial. It is NOT then
  // scaled by output again — doing that produced an end-tidal value ABOVE arterial
  // in any hyperdynamic moment, which cannot happen. End-tidal is bounded by
  // arterial by construction here.
  const gradient = 3 + 25 * clamp(1 - input.cardiacOutputRatio, 0, 1) ** 1.5;
  const etco2 = va > 0 ? clamp(gas.paco2MmHg - gradient, 0, gas.paco2MmHg) : 0;

  return {
    paco2MmHg: gas.paco2MmHg,
    etco2MmHg: etco2,
    pao2MmHg: pao2,
    endTidalO2Fraction: clamp(alveolarTension / DRY_BAROMETRIC_MMHG, 0, 1),
    spo2Percent: clamp(spo2, 0, 100),
    alveolarVentilationLPerMin: va,
  };
}

/**
 * Simulate apnoea and report the time in minutes until saturation reaches 90%.
 * This is the function the Benumof benchmark test calls.
 */
export function timeToDesaturationMinutes(
  profile: RespiratoryProfile,
  options: { preoxygenated: boolean; targetSaturation?: number } ,
): number {
  const fio2 = options.preoxygenated ? 1.0 : 0.21;
  const gas = initialGasState(profile, fio2);
  // Preoxygenation is denitrogenation: three minutes of tidal breathing on the
  // higher inspired fraction before the airway is lost.
  const stepMinutes = 1 / 600;
  if (options.preoxygenated) {
    for (let i = 0; i < 3 * 600; i += 1) {
      stepGas(gas, {
        tidalVolumeMl: 500, respiratoryRateBpm: 12, fio2,
        cardiacOutputRatio: 1, obstructionFraction: 0,
        hemoglobinGPerDl: 15, bloodVolumeMl: 5000,
      }, profile, stepMinutes);
    }
  }
  const target = options.targetSaturation ?? 90;
  for (let i = 1; i <= 40 * 600; i += 1) {
    const result = stepGas(gas, {
      tidalVolumeMl: 0, respiratoryRateBpm: 0, fio2,
      cardiacOutputRatio: 1, obstructionFraction: 0,
      hemoglobinGPerDl: 15, bloodVolumeMl: 5000,
    }, profile, stepMinutes);
    if (result.spo2Percent <= target) return i * stepMinutes;
  }
  return Number.POSITIVE_INFINITY;
}
