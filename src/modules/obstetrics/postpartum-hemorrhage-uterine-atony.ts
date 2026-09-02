import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the postpartum-hemorrhage lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps. This is the
 * first Obstetrics lesson to carry that evidence.
 */
export type AtonySnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['obstetricsAtonyAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no blood loss
 * measured, no uterus or genital tract examined, no uterotonic or tamponade
 * selected, and in particular no concealed bleeding excluded — which are
 * constants rather than observations.
 */
export type AtonyProgress = Pick<AtonySnapshot,
  'trajectoryAtTick' | 'recognitionAtTick' | 'supportAtTick'
  | 'evidenceAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const ATONY_ACTIONS = [
  'reconcile-obstetrics-atony-hemorrhage-birth-clock-measured-loss-physiology-tone-and-whole-person',
  'recognize-obstetrics-atony-postpartum-hemorrhage-and-atony-pattern-without-threshold-tone-or-single-cause-closure',
  'activate-obstetrics-atony-hemorrhage-obstetric-anesthesia-nursing-blood-bank-operating-room-and-dignity-ownership',
  'review-obstetrics-atony-supplied-tone-placenta-tract-coagulation-perfusion-and-competing-cause-boundary',
  'record-obstetrics-atony-bounded-qualified-motive-bundle-escalation-intent-and-strict-later-review',
  'handoff-obstetrics-atony-recurrent-bleeding-shock-coagulopathy-blood-procedure-newborn-and-outcome-risk',
] as const;

export type AtonyAction = (typeof ATONY_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * Two narratives carry the whole lesson and no rhythm event belongs to it. That
 * shape is required by name rather than tolerated.
 */
export function supportsAtony(scenario: Scenario): boolean {
  return scenario.metadata.id === 'postpartum-hemorrhage-uterine-atony'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'postpartum-hemorrhage-uterine-atony-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'postpartum-hemorrhage-uterine-atony-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === ATONY_ACTIONS.join('|');
}
