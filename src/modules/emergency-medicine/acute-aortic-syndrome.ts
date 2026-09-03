import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the acute-aortic-syndrome lesson.
 *
 * This is the first emergency-medicine lab to get a tutor and a worked example.
 * The model lives in the shared engine, as it does across the other modules;
 * what was missing was a name for the state it already publishes.
 */
export type AcuteAorticSyndromeSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['acuteAorticSyndromeAssessment']>;

/**
 * Six recorded steps against five declared objectives.
 *
 * Emergency medicine does not share critical care's five-and-five shape: here
 * the imaging priority and the closing handoff are separate recorded steps
 * inside one declared objective. The chain is still strict.
 *
 * The second step is the one that carries the lesson. The first examination is
 * symmetric, and the engine makes repeating it a recorded action rather than an
 * assumption, because a normal pulse does not stay normal by promise.
 */
export type AcuteAorticSyndromeProgress = Pick<AcuteAorticSyndromeSnapshot,
  'initialReviewedAtTick' | 'evolutionReviewedAtTick' | 'escalatedAtTick'
  | 'antiImpulseAtTick' | 'imagingAtTick' | 'handedOffAtTick'>;

/**
 * The six control ids the engine accepts.
 *
 * They are NOT the declared objective strings — only one of the five overlaps —
 * so the identity guard compares ACUTE_AORTIC_SYNDROME_OBJECTIVES instead.
 */
export const ACUTE_AORTIC_SYNDROME_ACTIONS = [
  'review-aortic-initial-pattern',
  'repeat-aortic-asymmetry-exam',
  'activate-aortic-pathway',
  'record-aortic-anti-impulse-intent',
  'prioritize-aortic-imaging',
  'repeat-and-handoff-aortic-evolution',
] as const;

/** The five declared objectives, in order, as the scenario states them. */
export const ACUTE_AORTIC_SYNDROME_OBJECTIVES = [
  'assess-aortic-presentation-without-closure',
  'detect-evolving-aortic-asymmetry',
  'escalate-suspected-aortic-syndrome',
  'record-aortic-anti-impulse-intent',
  'image-and-hand-off-aortic-uncertainty',
] as const;

export type AcuteAorticSyndromeAction = (typeof ACUTE_AORTIC_SYNDROME_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsAcuteAorticSyndrome(scenario: Scenario): boolean {
  return scenario.metadata.id === 'acute-aortic-syndrome'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'acute-aortic-syndrome').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'acute-aortic-syndrome-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === ACUTE_AORTIC_SYNDROME_OBJECTIVES.join('|');
}
