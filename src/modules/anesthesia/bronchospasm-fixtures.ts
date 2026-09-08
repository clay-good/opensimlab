import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the bronchospasm lesson.
 *
 * The counterfactual is the induction dose, and it is the one thing neither the
 * error path nor the recovery path can take back. Both induce with 2 mg/kg in a
 * twenty-nine-year-old whose chest has felt tight since a recent infection; the
 * pressure that follows is what fails manage-hypotension, and no amount of
 * responding well to the wheeze afterwards recovers it. The expert path induces
 * with 1.5 mg/kg instead and meets all six.
 *
 * What the recovery path does recover is everything else. It answers the shape
 * inside the two-minute window, escalates inside the sixty-second one, and gets
 * the nebulizer in — four objectives back, on an identical opening.
 *
 * Two things the transcripts deliberately do not contain. There is no
 * vasopressor on the expert path: measured, one changes the pressure nadir here
 * by nothing at all, and a reference transcript should not carry an action that
 * does nothing. And nothing on any path treats the wheeze before deepening,
 * because the lesson's own argument is that a light plane is the first thing to
 * exclude when the airway pressure rises.
 */

const OXYGEN = (tick: number): LearnerAction =>
  ({ tick, type: 'ventilator', payload: { fio2: 1 } });
const REMIFENTANIL = (tick: number): LearnerAction =>
  ({ tick, type: 'bolus', payload: { drugId: 'remifentanil', amount: 30, unit: 'µg' } });
const PROPOFOL = (tick: number, amount: number, unit: string): LearnerAction =>
  ({ tick, type: 'bolus', payload: { drugId: 'propofol', amount, unit } });
const LARYNGOSCOPY = (tick: number): LearnerAction =>
  ({ tick, type: 'laryngoscopy', payload: { technique: 'video' } });
const VENTILATE = (tick: number): LearnerAction =>
  ({ tick, type: 'ventilator', payload: { delivering: true, mode: 'volume-control' } });
const HELP = (tick: number): LearnerAction =>
  ({ tick, type: 'call-for-help', payload: { context: 'bronchospasm' } });
const SALBUTAMOL = (tick: number): LearnerAction => ({
  tick, type: 'inhaled-bronchodilator',
  payload: { agentId: 'salbutamol', route: 'nebulized', doseMg: 5 },
});

/** The induction, which is where this lesson is actually decided. */
const induction = (propofolMgPerKg: number): readonly LearnerAction[] => [
  OXYGEN(120),
  REMIFENTANIL(1400),
  PROPOFOL(1450, propofolMgPerKg, 'mg/kg'),
  LARYNGOSCOPY(1900),
  VENTILATE(2000),
];

/** Oxygen, help, deepen, nebulize — inside the windows the objectives measure. */
const response: readonly LearnerAction[] = [
  OXYGEN(2450),
  HELP(2500),
  PROPOFOL(2600, 30, 'mg'),
  SALBUTAMOL(2800),
];

export const BRONCHOSPASM_FIXTURES = {
  scenarioId: 'bronchospasm', contentVersion: '0.1.0', seed: 5127, ticks: 7200,

  /** Nothing is done at all. The obstruction still begins at tick 2,400. */
  noAction: [] as readonly LearnerAction[],

  /** A dose this patient can afford, and then the shape answered promptly. */
  expert: [...induction(1.5), ...response] as readonly LearnerAction[],

  /**
   * The textbook dose, and then the shape missed until the number moves.
   *
   * Everything here happens after tick 3,700 — past the sixty-second escalation
   * window and past the two-minute recognition window — which is what waiting
   * for the end-tidal figure to alarm actually costs on this clock.
   */
  commonError: [
    ...induction(2),
    OXYGEN(3700),
    HELP(3800),
    PROPOFOL(3900, 30, 'mg'),
    SALBUTAMOL(4000),
  ] as readonly LearnerAction[],

  /** The same dose, and then every window met. */
  recovery: [...induction(2), ...response] as readonly LearnerAction[],
} as const;
