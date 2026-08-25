import { approach, clamp } from '@platform/kernel/numeric';

/** Deterministic transition for the bounded postoperative OIVI teaching state. */
export function stepOpioidVentilatoryImpairment(
  severity: number,
  target: number,
  elapsedSeconds: number,
): number {
  const current = clamp(Number.isFinite(severity) ? severity : 0, 0, 1);
  const boundedTarget = clamp(Number.isFinite(target) ? target : 0, 0, 1);
  return clamp(approach(current, boundedTarget, boundedTarget < current ? 18 : 5, elapsedSeconds), 0, 1);
}
