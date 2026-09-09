import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the persistent-VF lesson.
 *
 * Ventricular fibrillation begins at tick 300. Compressions are wanted within 20
 * seconds, exactly 1 mg of intravenous or intraosseous epinephrine while they
 * run, and a 200 J biphasic shock that converts only when all of its declared
 * conditions hold at once.
 *
 * The error path is the reflex to shock a shockable rhythm. It starts
 * compressions promptly and defibrillates at the correct energy -- and gives no
 * epinephrine, so the shock is delivered, counted, and does not convert. The
 * fourth objective is still met, because there is nothing in this scenario that
 * a shock could wrongly be delivered TO.
 *
 * The recovery path is that transcript with the epinephrine given afterwards and
 * a second shock, which converts at tick 1,300 rather than 900. Both shocks are
 * accepted; only the second one works.
 */

const COMPRESSIONS = (tick: number): LearnerAction =>
  ({ tick, type: 'chest-compressions', payload: { active: true } });
const EPINEPHRINE = (tick: number): LearnerAction =>
  ({ tick, type: 'cardiac-arrest-epinephrine', payload: { doseMg: 1, route: 'iv' } });
const SHOCK = (tick: number): LearnerAction =>
  ({ tick, type: 'defibrillation', payload: { waveform: 'biphasic', energyJ: 200 } });

/** Compressions and a correct-energy shock, with nothing given. */
const shockedWithoutEpinephrine: readonly LearnerAction[] = [
  COMPRESSIONS(400), SHOCK(900),
];

export const PERSISTENT_VF_CARDIAC_ARREST_FIXTURES = {
  scenarioId: 'persistent-vf-cardiac-arrest', contentVersion: '0.1.0',
  seed: 5217, ticks: 3000,

  /** The arrest is never answered. */
  noAction: [] as readonly LearnerAction[],

  /** Compressions at 10 seconds, epinephrine, then the shock that converts. */
  expert: [
    COMPRESSIONS(400), EPINEPHRINE(600), SHOCK(900),
  ] as readonly LearnerAction[],

  /** The right energy into a rhythm that has had no epinephrine. */
  commonError: shockedWithoutEpinephrine,

  /** The same opening, the drug given, and a second shock that works. */
  recovery: [
    ...shockedWithoutEpinephrine, EPINEPHRINE(1000), SHOCK(1300),
  ] as readonly LearnerAction[],
} as const;
