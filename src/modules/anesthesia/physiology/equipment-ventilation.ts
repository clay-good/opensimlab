/**
 * Equipment state that changes the gas a patient actually receives.
 *
 * A displaced tube, an obstructed tracheostomy, or a tensioned pleural space
 * is not a label on the monitor: it reduces the ventilation that reaches gas
 * exchange, and every downstream reading follows from that. This module holds
 * the one rule those lessons share, so a lesson cannot move its monitor without
 * moving its equipment state, and cannot let the two disagree.
 *
 * `deliveredFraction` is the share of the lesson's restored ventilation that
 * the current equipment state lets through: 0 is the authored compromised
 * state, 1 the authored restored one. Both anchors are scenario facts with
 * their own sources; the straight line between them is a declared teaching
 * calibration, not a measured dose-response.
 */

/** Clamp to [0, 1]; a non-finite value fails toward the compromised state. */
export function boundedDeliveredFraction(deliveredFraction: number): number {
  if (!Number.isFinite(deliveredFraction)) return 0;
  return Math.min(1, Math.max(0, deliveredFraction));
}

/** Every reading in `compromised` moves toward `restored` as delivery returns. */
export function followDeliveredVentilation<K extends string>(
  compromised: Readonly<Record<K, number>>,
  restored: Readonly<Record<K, number>>,
  deliveredFraction: number,
): Record<K, number> {
  const delivered = boundedDeliveredFraction(deliveredFraction);
  const result = {} as Record<K, number>;
  for (const key of Object.keys(compromised) as K[]) {
    result[key] = compromised[key] + (restored[key] - compromised[key]) * delivered;
  }
  return result;
}

/**
 * Where a tracheal tube sits, read from its depth at the teeth against the
 * case's authored mainstem threshold.
 *
 * The threshold is a fact about one fictional patient, never a universal
 * target: real tube depth depends on the person, and placement is confirmed
 * by examination and imaging that this model does not simulate.
 */
export function trachealTubeDeliveredFraction(depthCm: number, mainstemDepthCm: number): number {
  if (!Number.isFinite(depthCm) || !Number.isFinite(mainstemDepthCm)) return 0;
  return depthCm >= mainstemDepthCm ? 0 : 1;
}
