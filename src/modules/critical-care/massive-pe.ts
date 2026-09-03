import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the massive pulmonary-embolism
 * lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type MassivePeSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['massivePulmonaryEmbolismAssessment']>;

/**
 * Five recorded steps against five declared objectives, in one strict chain —
 * the shape this module shares.
 *
 * It is the sickest patient in the module and the chain is correspondingly
 * short-tempered: the rescue teams are activated in step one, before the
 * imaging is reviewed, because the diagnosis is already made and repeating it
 * costs him time he does not have. What the later steps protect is the
 * distinction the lesson turns on — a bridge that supports his circulation is
 * not treatment of his clot, and the engine keeps those two decisions in
 * separate steps so neither can stand in for the other.
 */
export type MassivePeProgress = Pick<MassivePeSnapshot,
  'recognitionAtTick' | 'patternAtTick' | 'supportAtTick'
  | 'ecmoAtTick' | 'reassessmentAtTick'>;

export const MASSIVE_PE_ACTIONS = [
  'recognize-refractory-pe-shock',
  'review-refractory-pe-pattern',
  'record-refractory-pe-support',
  'activate-pe-ecmo-bridge',
  'reassess-pe-ecmo-trajectory',
] as const;

export type MassivePeAction = (typeof MASSIVE_PE_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsMassivePe(scenario: Scenario): boolean {
  return scenario.metadata.id === 'massive-pulmonary-embolism'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'massive-pulmonary-embolism').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'massive-pulmonary-embolism-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === MASSIVE_PE_ACTIONS.join('|');
}
