import { clamp } from '@platform/kernel/numeric';

export interface UpperAirwayObstructionSupport {
  readonly jawThrustCpap: boolean;
  readonly positivePressure: boolean;
  readonly fio2: number;
}

/**
 * Advance a bounded, post-extubation soft-tissue obstruction teaching state.
 *
 * This is intentionally separate from laryngospasm and lower-airway
 * obstruction. It resolves only while the learner holds the airway open and
 * delivers continuous positive pressure with nearly pure oxygen.
 */
export function stepUpperAirwayObstruction(
  severity: number,
  support: UpperAirwayObstructionSupport,
  elapsedSeconds: number,
): number {
  const current = clamp(Number.isFinite(severity) ? severity : 0, 0, 1);
  if (!(support.jawThrustCpap && support.positivePressure && support.fio2 >= 0.95)) {
    return current;
  }
  return clamp(current - 0.04 * Math.max(0, elapsedSeconds), 0, 1);
}
