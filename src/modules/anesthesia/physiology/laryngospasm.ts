import { clamp } from '@platform/kernel/numeric';

/** Duration of the held jaw-thrust/continuous-pressure action. */
export const JAW_THRUST_CPAP_SECONDS = 90;

/** Inputs that can relieve functional upper-airway closure in this teaching model. */
export interface LaryngospasmTreatment {
  readonly jawThrustCpap: boolean;
  readonly positivePressure: boolean;
  readonly fio2: number;
  /** Predicted depth index: lower is deeper. */
  readonly depthIndex: number;
}

/**
 * Advance persistent upper-airway closure by one deterministic interval.
 *
 * No single dial is treatment. Closure improves only while the learner is
 * holding the airway open, applying continuous positive pressure with nearly
 * pure oxygen, and has restored adequate anaesthetic depth. This is deliberately
 * a teaching trajectory rather than a claim about an individual response.
 */
export function stepLaryngospasm(
  severity: number,
  treatment: LaryngospasmTreatment,
  elapsedSeconds: number,
): number {
  const current = clamp(Number.isFinite(severity) ? severity : 0, 0, 1);
  if (!(treatment.jawThrustCpap
    && treatment.positivePressure
    && treatment.fio2 >= 0.95
    && treatment.depthIndex <= 60)) return current;

  return clamp(current - 0.2 * Math.max(0, elapsedSeconds), 0, 1);
}
