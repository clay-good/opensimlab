import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the perioperative-anaphylaxis lesson.
 *
 * The counterfactual isolates one substitution. The error and the recovery share
 * an identical opening — the ventilator prepared before anything happens, a
 * vasopressor at tick 1,900 and a litre of crystalloid at 2,000 — and differ in
 * exactly one action at tick 2,600: another vasopressor, or 50 micrograms of
 * epinephrine.
 *
 * That single substitution is worth 7.3 mmHg of pressure nadir, 47.5 against
 * 54.8, and it moves two of the four objectives. Both drugs are on the tray from
 * the first tick and nothing in the cockpit labels either one correct.
 *
 * The opening is the trap rather than the setup. Treating an abrupt
 * intraoperative collapse with a pressor and a bag is entirely reasonable
 * behaviour for every other cause of it, and this is the one where it treats the
 * number and leaves the mechanism running.
 */

/** Prepared before anything happens, which is where one objective is decided. */
const VENTILATE: LearnerAction = {
  tick: 120, type: 'ventilator',
  payload: { fio2: 1, delivering: true, mode: 'volume-control', tidalVolumeMl: 500, respiratoryRateBpm: 12 },
};
const EPINEPHRINE = (tick: number): LearnerAction =>
  ({ tick, type: 'epinephrine', payload: { route: 'iv', doseMicrograms: 50 } });
const VASOPRESSOR = (tick: number): LearnerAction =>
  ({ tick, type: 'vasopressor', payload: { effect: 0.5 } });
const FLUID = (tick: number, volumeMl: number): LearnerAction =>
  ({ tick, type: 'fluid', payload: { fluidId: 'balanced-crystalloid', volumeMl } });

/** The reasonable reflex, shared so the two paths cannot differ anywhere else. */
const treatedAsOrdinaryCollapse: readonly LearnerAction[] = [
  VENTILATE,
  VASOPRESSOR(1900),
  FLUID(2000, 1000),
];

export const PERIOPERATIVE_ANAPHYLAXIS_FIXTURES = {
  scenarioId: 'perioperative-anaphylaxis-after-antibiotic', contentVersion: '0.1.0',
  seed: 8842, ticks: 4200,

  /** Nothing is done at all. The cefazolin still goes in at tick 1,800. */
  noAction: [] as readonly LearnerAction[],

  /** Epinephrine ten seconds after exposure, and volume behind it. */
  expert: [
    VENTILATE,
    EPINEPHRINE(1900),
    FLUID(2000, 1000),
    FLUID(2600, 1000),
  ] as readonly LearnerAction[],

  /** The reflex, and then more of the same drug. */
  commonError: [...treatedAsOrdinaryCollapse, VASOPRESSOR(2600)] as readonly LearnerAction[],

  /** The identical reflex, and then the substitution that is the lesson. */
  recovery: [...treatedAsOrdinaryCollapse, EPINEPHRINE(2600)] as readonly LearnerAction[],
} as const;
