import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the unexpected-hemorrhage lesson.
 *
 * The counterfactual here isolates one variable, which none of the earlier
 * anaesthesia labs managed. The expert and recovery paths run the SAME volume
 * resuscitation — the same litre before induction, the same two litres the
 * second the tamponade releases, the same blood-bank request, the same two units
 * of red cells, the same vasopressor at the same tick — and differ in exactly
 * one action: the induction dose. 0.5 mg/kg against 2 mg/kg.
 *
 * Measured, that single difference is worth 14.5 mmHg of pressure nadir and the
 * whole of the manage-hypotension objective: 72.6 mmHg and zero seconds below
 * 65 against 58.1 mmHg and 235 seconds below it. Everything else about the two
 * runs is identical, so nothing else can be credited with it.
 *
 * The error path is the same full dose with the vasopressor treated as the
 * answer and no fluid at all, which is what the temporizing objective exists to
 * argue against: it reaches 33.5 mmHg and spends 236 seconds below 55.
 */

const OXYGEN: LearnerAction = { tick: 120, type: 'ventilator', payload: { fio2: 1 } };
const REMIFENTANIL: LearnerAction =
  { tick: 1400, type: 'bolus', payload: { drugId: 'remifentanil', amount: 10, unit: 'µg' } };
const PROPOFOL = (amount: number): LearnerAction =>
  ({ tick: 1450, type: 'bolus', payload: { drugId: 'propofol', amount, unit: 'mg/kg' } });
const LARYNGOSCOPY: LearnerAction =
  { tick: 1800, type: 'laryngoscopy', payload: { technique: 'video' } };
const VENTILATE: LearnerAction =
  { tick: 1900, type: 'ventilator', payload: { delivering: true, mode: 'volume-control' } };
const FLUID = (tick: number, volumeMl: number): LearnerAction =>
  ({ tick, type: 'fluid', payload: { fluidId: 'balanced-crystalloid', volumeMl } });
const VASOPRESSOR = (tick: number, effect: number): LearnerAction =>
  ({ tick, type: 'vasopressor', payload: { effect } });

/**
 * Both paths, built from one template so they cannot drift apart anywhere except
 * the induction dose. The array is in tick order, which the replay loop requires:
 * it advances a single index, so an action out of order is silently never applied
 * and reads afterwards as a physiology result rather than as a dropped click.
 *
 * The litre before induction is part of the template. She is pale, cold, and
 * holding her pressure on a narrow pulse pressure, which is the compensated
 * picture rather than a reassuring one, and blood has been collecting in that
 * abdomen since before anyone met her.
 */
const path = (propofolMgPerKg: number): readonly LearnerAction[] => [
  OXYGEN,
  FLUID(300, 1000),
  REMIFENTANIL,
  PROPOFOL(propofolMgPerKg),
  LARYNGOSCOPY,
  VENTILATE,
  // One second after the tamponade releases. The suction bottle is the monitor.
  FLUID(2410, 2000),
  { tick: 2450, type: 'blood-bank-request', payload: {} },
  VASOPRESSOR(2500, 0.5),
  // Crystalloid temporizes; this is the replacement the objective says it is not.
  { tick: 2600, type: 'blood-product', payload: { productId: 'packed-red-blood-cells', units: 2 } },
  FLUID(3000, 2000),
];

export const UNEXPECTED_HEMORRHAGE_FIXTURES = {
  scenarioId: 'unexpected-intraoperative-hemorrhage', contentVersion: '0.1.0',
  seed: 9314, ticks: 5400,

  /** Nothing is done at all. The tamponade still releases at tick 2,400. */
  noAction: [] as readonly LearnerAction[],

  /** A dose for the patient in front of you, and the volume that follows. */
  expert: path(0.5),

  /** The textbook dose, and a vasopressor treated as the answer to volume. */
  commonError: [
    OXYGEN,
    REMIFENTANIL,
    PROPOFOL(2),
    LARYNGOSCOPY,
    VENTILATE,
    VASOPRESSOR(2600, 0.4),
    VASOPRESSOR(3200, 0.4),
  ] as readonly LearnerAction[],

  /** The identical resuscitation, and the one action that differs. */
  recovery: path(2),
} as const;
