import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the laryngospasm lesson.
 *
 * The counterfactual is the reserve, and the measured result is blunt: what
 * protects this patient is almost entirely what happened before the closure.
 * With the flowmeter at 100% and the ventilator delivering from the start, the
 * saturation does not fall below 99.97% for the whole modelled window even if
 * nothing whatever is done about the spasm. Without that reserve, the immediate
 * and complete response bottoms at 86.3% and the ninety-seconds-late one at
 * 64.0%.
 *
 * So the error path is the same young man met with the same measures, ninety
 * seconds later and with no reserve behind them, and the recovery path is the
 * identical missing reserve met immediately and completely. The recovery gains
 * thirty-five points of saturation and still fails the oxygenation objective,
 * because the margin it is working inside was spent before the spasm began.
 *
 * The dose is not a formality here. The engine relieves the closure only while
 * the held maneuver, positive pressure, 95% oxygen and a depth index at or below
 * 60 are all true, so the propofol is what makes the maneuver work rather than
 * an adjunct to it. A separate variant is measured in the tests: the identical
 * immediate maneuver with a 0.5 mg/kg dose instead of 2 scores exactly the same
 * on both response objectives — the rubric reads the timing of the dose and
 * cannot see whether it was enough — and reaches 51.8%, which is the no-action
 * nadir to the last decimal place. Measured that way the dose is worth more
 * than the timing: 34.5 points against the 22.4 that responding immediately
 * rather than ninety seconds late is worth, and the rubric can only see the
 * second of those.
 */

const OXYGEN = (tick: number): LearnerAction =>
  ({ tick, type: 'ventilator', payload: { fio2: 1, delivering: true, mode: 'volume-control' } });
const JAW_THRUST = (tick: number): LearnerAction =>
  ({ tick, type: 'airway-maneuver', payload: { maneuver: 'jaw-thrust-cpap' } });
const PROPOFOL = (tick: number, amount: number): LearnerAction =>
  ({ tick, type: 'bolus', payload: { drugId: 'propofol', amount, unit: 'mg/kg' } });

export const LARYNGOSPASM_FIXTURES = {
  scenarioId: 'laryngospasm-after-airway-stimulation', contentVersion: '0.1.0',
  seed: 6412,
  // The scenario's own reassessment prompt, and the end of the slice it models.
  // Past roughly 4,600 ticks the unreserved paths reach a modelled hypoxic
  // arrest, and the engine says plainly that nothing after that point is
  // simulated physiology — so no transcript here is allowed to run into it.
  ticks: 4200,

  /** Nothing is done at all. The closure still comes at tick 2,400. */
  noAction: [] as readonly LearnerAction[],

  /** Reserve built first, then the maneuver and a dose that actually deepens. */
  expert: [
    OXYGEN(120),
    JAW_THRUST(2500),
    PROPOFOL(2600, 2),
  ] as readonly LearnerAction[],

  /** The same measures, ninety seconds late, with nothing behind them. */
  commonError: [
    OXYGEN(2900),
    JAW_THRUST(3000),
    PROPOFOL(3200, 2),
  ] as readonly LearnerAction[],

  /** The same missing reserve, met immediately and completely. */
  recovery: [
    OXYGEN(2420),
    JAW_THRUST(2450),
    PROPOFOL(2500, 2),
  ] as readonly LearnerAction[],
} as const;
