import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the opioid-xylazine lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type OpioidXylazineSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['toxicologyOpioidXylazineAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no street
 * product identified, no adulterant confirmed, no naloxone resistance proven,
 * and in particular no veterinary antagonist selected — which are constants
 * rather than observations.
 */
export type OpioidXylazineProgress = Pick<OpioidXylazineSnapshot,
  'trajectoryAtTick' | 'recognitionAtTick' | 'supportAtTick'
  | 'evidenceAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const OPIOID_XYLAZINE_ACTIONS = [
  'reconcile-toxicology-opioid-xylazine-exposure-rescue-breathing-sedation-perfusion-and-whole-patient',
  'recognize-toxicology-opioid-xylazine-opioid-emergency-and-possible-adulterant-without-pupil-naloxone-response-or-screen-only-closure',
  'activate-toxicology-opioid-xylazine-ventilation-oxygen-monitoring-toxicology-addiction-wound-and-dignity-ownership',
  'review-toxicology-opioid-xylazine-supplied-respiratory-response-circulation-temperature-glucose-ecg-screen-wound-and-differential-boundary',
  'record-toxicology-opioid-xylazine-bounded-qualified-continued-support-opioid-antagonist-symptomatic-care-no-veterinary-antagonist-and-strict-later-review',
  'handoff-toxicology-opioid-xylazine-recurrent-depression-persistent-sedation-shock-hypothermia-wound-withdrawal-addiction-and-outcome-risk',
] as const;

export type OpioidXylazineAction = (typeof OPIOID_XYLAZINE_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * It declares a `rhythm-change` event as well as its narratives, because the
 * bradycardia is a bedside trace rather than a sentence. That is required by
 * name rather than tolerated.
 */
export function supportsOpioidXylazine(scenario: Scenario): boolean {
  return scenario.metadata.id === 'opioid-xylazine-persistent-sedation'
    && scenario.timeline.every((event) => event.type === 'narrative' || event.type === 'rhythm-change')
    && scenario.timeline.filter((event) => event.type === 'rhythm-change'
      && event.target === 'sinus-bradycardia').length === 1
    && scenario.timeline.filter((event) => event.target === 'opioid-xylazine-persistent-sedation-transition').length === 2
    && scenario.timeline.filter((event) => event.target === 'opioid-xylazine-persistent-sedation-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === OPIOID_XYLAZINE_ACTIONS.join('|');
}
