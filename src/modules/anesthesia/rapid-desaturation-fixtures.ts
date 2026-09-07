import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the rapid-desaturation lesson.
 *
 * The counterfactual is the previous lesson. Routine induction teaches that
 * preoxygenation buys time; this patient is here to say what that time is worth
 * by taking most of it away, and the way a learner finds that out is by treating
 * him like the healthy forty-two-year-old and watching the number.
 *
 * The error path is exactly that: no oxygen at all, induce, take the airway.
 * Measured through the solver, the saturation reaches 54.5%. Nothing about that
 * number is authored — it comes out of the obese respiratory profile's smaller
 * functional residual capacity and higher oxygen consumption.
 *
 * The recovery path carries the same impatience — it induces at tick 1,550 with
 * only 94 seconds of end-tidal reserve, so the preoxygenation objective is
 * partly met and stays that way — but the oxygen was running and the airway is
 * taken promptly, and the saturation never leaves its room-air baseline. Same
 * haste, different margin, and the difference is the whole lesson.
 */

const OXYGEN: LearnerAction = { tick: 120, type: 'ventilator', payload: { fio2: 1 } };
const REMIFENTANIL = (tick: number): LearnerAction =>
  ({ tick, type: 'bolus', payload: { drugId: 'remifentanil', amount: 50, unit: 'µg' } });
// 160 mg, which is roughly 2 mg/kg of LEAN body mass rather than of the 138 kg
// this patient weighs. The formulary offers a `2 mg/kg` preset that would give
// 276 mg; choosing the fixed dose instead is the decision the scenario's own
// comment says it exists to leave open.
const PROPOFOL = (tick: number): LearnerAction =>
  ({ tick, type: 'bolus', payload: { drugId: 'propofol', amount: 160, unit: 'mg' } });
const VENTILATE = (tick: number): LearnerAction =>
  ({ tick, type: 'ventilator', payload: { delivering: true, mode: 'volume-control' } });

export const RAPID_DESATURATION_FIXTURES = {
  scenarioId: 'rapid-desaturation', contentVersion: '0.1.0', seed: 5310, ticks: 5400,

  noAction: [] as readonly LearnerAction[],

  /**
   * Oxygen, a wait measured on the end-tidal clock, and video laryngoscopy first
   * in a patient the assessment already calls difficult.
   */
  expert: [
    OXYGEN,
    REMIFENTANIL(2450),
    PROPOFOL(2500),
    { tick: 3000, type: 'laryngoscopy', payload: { technique: 'video' } },
    VENTILATE(3600),
  ] as readonly LearnerAction[],

  /** The healthy patient's induction, performed on this one. */
  commonError: [
    REMIFENTANIL(600),
    PROPOFOL(650),
    { tick: 1400, type: 'laryngoscopy', payload: { technique: 'direct' } },
    VENTILATE(2200),
  ] as readonly LearnerAction[],

  /** The same haste, with the oxygen running and the airway taken promptly. */
  recovery: [
    OXYGEN,
    REMIFENTANIL(1500),
    PROPOFOL(1550),
    { tick: 2050, type: 'laryngoscopy', payload: { technique: 'video' } },
    VENTILATE(2650),
  ] as readonly LearnerAction[],
} as const;
