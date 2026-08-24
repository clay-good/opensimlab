import type { PatientState } from './state';

/** Calculated arterial oxygen content; this is not a simulated monitor value. */
export function arterialOxygenContentMlPerDl(
  hemoglobinGPerDl: number,
  saturationPercent: number,
  arterialOxygenMmHg: number,
): number {
  return 1.34 * hemoglobinGPerDl * saturationPercent / 100 + 0.003 * arterialOxygenMmHg;
}

/** Calculated systemic oxygen delivery; this is exposed as debrief evidence, not a monitor tile. */
export function oxygenDeliveryMlPerMin(
  state: Pick<PatientState, 'cardiacOutputLPerMin' | 'hemoglobinGPerDl' | 'spo2Percent' | 'pao2MmHg'>,
): number {
  return state.cardiacOutputLPerMin * 10 * arterialOxygenContentMlPerDl(
    state.hemoglobinGPerDl, state.spo2Percent, state.pao2MmHg,
  );
}
