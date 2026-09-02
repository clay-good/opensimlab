import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the concealed-abruption lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type ConcealedAbruptionSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['obstetricsConcealedAbruptionAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no loss
 * measured or totalled, no fetal trace interpreted, no ultrasound acquired, no
 * anesthesia or delivery selected — which are constants rather than
 * observations.
 */
export type ConcealedAbruptionProgress = Pick<ConcealedAbruptionSnapshot,
  'trajectoryAtTick' | 'recognitionAtTick' | 'supportAtTick'
  | 'evidenceAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const CONCEALED_ABRUPTION_ACTIONS = [
  'reconcile-obstetrics-abruption-pain-visible-blood-maternal-physiology-fetal-context-and-whole-person',
  'recognize-obstetrics-abruption-concealed-hemorrhage-pattern-without-visible-volume-ultrasound-or-single-cause-closure',
  'activate-obstetrics-abruption-hemorrhage-anesthesia-blood-bank-operating-room-neonatal-and-dignity-ownership',
  'review-obstetrics-abruption-supplied-perfusion-uterine-fetal-coagulation-placental-and-competing-cause-boundary',
  'record-obstetrics-abruption-bounded-qualified-resuscitation-coagulation-and-urgent-delivery-intent-with-strict-later-review',
  'handoff-obstetrics-abruption-concealed-loss-shock-coagulopathy-fetal-delivery-neonatal-bereavement-and-outcome-risk',
] as const;

export type ConcealedAbruptionAction = (typeof CONCEALED_ABRUPTION_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsConcealedAbruption(scenario: Scenario): boolean {
  return scenario.metadata.id === 'concealed-placental-abruption-hemorrhage'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'concealed-placental-abruption-hemorrhage-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'concealed-placental-abruption-hemorrhage-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === CONCEALED_ABRUPTION_ACTIONS.join('|');
}
