import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the paediatric inhalational-induction lesson.
 *
 * A healthy six-year-old of 20 kg and an empty formulary: everything here is the
 * vaporizer and the fresh gas. Prepare the circuit with the vaporizer OFF, wash
 * in through 0.8 age-adjusted MAC, then reduce and hold.
 *
 * The three paths differ in one action. The expert reduces to 2% at tick 500,
 * shortly after the wash-in target is reached at 48.7 seconds, and the sixty
 * seconds that follow hold a depth of 49 and a pressure of 60 mmHg. The error
 * path never reduces at all: 6% stays on, and the child sits at a depth of 16
 * with a mean arterial pressure of 34 for the rest of the case. The recovery
 * path reduces at tick 1,800 instead, which is late.
 *
 * The recovery is worth reading closely. It ends at a depth of 49 and a pressure
 * of 60 -- the expert path's settled numbers exactly -- and still scores partly
 * met, because the sixty seconds the objective reads are the sixty immediately
 * after the reduction, and at that moment the child was still far too deep.
 */

const VENTILATOR = (tick: number, payload: Readonly<Record<string, string | number | boolean>>): LearnerAction =>
  ({ tick, type: 'ventilator', payload });

/** Oxygen and flow up, vaporizer deliberately still off. */
const PREPARE_CIRCUIT = VENTILATOR(100, {
  delivering: true, fio2: 1, freshGasFlowLPerMin: 6, sevofluranePercent: 0,
});
/** The wash-in, at a concentration inside the labelled 0-8% range. */
const WASH_IN = VENTILATOR(400, { sevofluranePercent: 6 });

/** Prepared and washed in, and then simply left there. */
const neverReduced: readonly LearnerAction[] = [PREPARE_CIRCUIT, WASH_IN];

export const ROUTINE_PEDIATRIC_INHALATIONAL_INDUCTION_FIXTURES = {
  scenarioId: 'routine-pediatric-inhalational-induction', contentVersion: '0.1.0',
  seed: 4126, ticks: 4200,

  /** The circuit is never prepared and no volatile is delivered. */
  noAction: [] as readonly LearnerAction[],

  /** Prepare, wash in, and turn it down promptly. */
  expert: [
    PREPARE_CIRCUIT, WASH_IN, VENTILATOR(500, { sevofluranePercent: 2 }),
  ] as readonly LearnerAction[],

  /** Six percent, and nobody comes back to it. */
  commonError: neverReduced,

  /** The same transcript, turned down late rather than never. */
  recovery: [
    ...neverReduced, VENTILATOR(1800, { sevofluranePercent: 2 }),
  ] as readonly LearnerAction[],
} as const;
