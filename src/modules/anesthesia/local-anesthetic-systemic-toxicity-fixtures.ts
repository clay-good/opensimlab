import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the LAST lesson.
 *
 * The counterfactual here has a shape none of the earlier labs produced: the
 * recovery path scores IDENTICALLY to the expert path, and that is the finding
 * rather than an accident.
 *
 * Both the error and the recovery reach for a 500 microgram epinephrine bolus at
 * tick 700 — the reflex a full-dose pressor trains, and the single most
 * dangerous thing a learner can do in this patient. The engine refuses it in
 * both: during modelled toxicity the ceiling is 1 microgram per kilogram, which
 * is 60 for this sixty-kilogram patient.
 *
 * What separates the two is the next ten seconds. The recovery reads the refusal
 * and does the checklist — oxygen and ventilation, the benzodiazepine, the
 * weight-banded lipid, and then epinephrine at 50 micrograms — and meets all
 * four objectives, exactly as the expert path does. The error path treats the
 * refusal as a pause and starts the checklist eighty seconds after exposure.
 *
 * So the refused action is not scored against anyone. The time it costs is.
 */

const VENTILATE = (tick: number): LearnerAction => ({
  tick, type: 'ventilator',
  payload: { fio2: 1, delivering: true, mode: 'volume-control', tidalVolumeMl: 450, respiratoryRateBpm: 12 },
});
const BENZODIAZEPINE = (tick: number): LearnerAction =>
  ({ tick, type: 'seizure-suppression', payload: { route: 'iv', medicationClass: 'benzodiazepine' } });
const LIPID = (tick: number): LearnerAction => ({
  tick, type: 'lipid-emulsion',
  payload: { route: 'iv', protocol: 'initial', concentrationPercent: 20 },
});
const EPINEPHRINE = (tick: number, doseMicrograms: number): LearnerAction =>
  ({ tick, type: 'epinephrine', payload: { route: 'iv', doseMicrograms } });

/** 500 micrograms: the ordinary arrest dose, and eight times this lesson's ceiling. */
const FULL_DOSE_PRESSOR = EPINEPHRINE(700, 500);

export const LAST_FIXTURES = {
  scenarioId: 'local-anesthetic-systemic-toxicity', contentVersion: '0.1.0',
  seed: 6015, ticks: 3600,

  /** Nothing is done at all. The exposure still happens at tick 600. */
  noAction: [] as readonly LearnerAction[],

  /** The checklist, in order, inside every window it declares. */
  expert: [
    VENTILATE(620),
    BENZODIAZEPINE(700),
    LIPID(800),
    EPINEPHRINE(1000, 50),
  ] as readonly LearnerAction[],

  /** The full-dose reflex, refused — and then treated as a pause. */
  commonError: [
    FULL_DOSE_PRESSOR,
    VENTILATE(1300),
    BENZODIAZEPINE(1400),
    LIPID(1600),
  ] as readonly LearnerAction[],

  /** The identical reflex, refused — and then heeded immediately. */
  recovery: [
    FULL_DOSE_PRESSOR,
    VENTILATE(740),
    BENZODIAZEPINE(800),
    LIPID(860),
    EPINEPHRINE(1000, 50),
  ] as readonly LearnerAction[],
} as const;
