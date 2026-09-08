import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the obstetric-general-anaesthesia lesson.
 *
 * The counterfactual is the reserve, and this patient is the one the module has
 * been building towards: the saturation floor the objective names is 95% rather
 * than 92%, so the margin that the earlier lessons could spend, this one cannot.
 *
 * The error path gives no oxygen at all, gives the relaxant before the hypnotic,
 * and does not resume ventilation until tick 2,600. Measured, the saturation
 * reaches 50.2%. The recovery path keeps the identical missing reserve and
 * changes two decisions — the order, and the promptness of the airway — and it
 * recovers exactly one objective. It reaches 81.5%, and the margin objective
 * fails on both, because 81.5% is nowhere near 95% and the reserve that would
 * have made the difference was never built.
 *
 * A third variant is measured in the tests rather than shipped as a fixture, and
 * it is the sharpest thing here: the error path with ONLY the timing fixed — the
 * relaxant still given first — reaches 78.7% instead of 50.2% and moves no
 * objective at all. Twenty-eight points of saturation, and the rubric records
 * nothing, because this objective is a floor rather than a scale.
 */

const OXYGEN: LearnerAction =
  { tick: 60, type: 'ventilator', payload: { fio2: 1, freshGasFlowLPerMin: 10 } };
const PROPOFOL = (tick: number): LearnerAction =>
  ({ tick, type: 'bolus', payload: { drugId: 'propofol', amount: 2, unit: 'mg/kg' } });
const ROCURONIUM = (tick: number): LearnerAction =>
  ({ tick, type: 'bolus', payload: { drugId: 'rocuronium', amount: 1.2, unit: 'mg/kg' } });
const LARYNGOSCOPY = (tick: number, technique: 'video' | 'direct'): LearnerAction =>
  ({ tick, type: 'laryngoscopy', payload: { technique } });
const VENTILATE = (tick: number): LearnerAction =>
  ({ tick, type: 'ventilator', payload: { delivering: true, mode: 'volume-control' } });

export const OBSTETRIC_GENERAL_ANESTHESIA_FIXTURES = {
  scenarioId: 'obstetric-general-anesthesia', contentVersion: '0.1.0', seed: 7203, ticks: 3600,

  /** Nothing is done at all, and nothing is exercised: she keeps breathing. */
  noAction: [] as readonly LearnerAction[],

  /**
   * Both halves of the preparation, a wait on the end-tidal clock, the hypnotic
   * before the relaxant, and the airway once the count is zero.
   */
  expert: [
    OXYGEN,
    PROPOFOL(1200),
    ROCURONIUM(1250),
    LARYNGOSCOPY(1700, 'video'),
    VENTILATE(1800),
  ] as readonly LearnerAction[],

  /** No reserve, the order backwards, and ventilation resumed three minutes late. */
  commonError: [
    ROCURONIUM(600),
    PROPOFOL(660),
    LARYNGOSCOPY(1500, 'direct'),
    VENTILATE(2600),
  ] as readonly LearnerAction[],

  /** The same missing reserve, the right order, and a prompt airway. */
  recovery: [
    PROPOFOL(600),
    ROCURONIUM(660),
    LARYNGOSCOPY(900, 'video'),
    VENTILATE(1000),
  ] as readonly LearnerAction[],
} as const;
