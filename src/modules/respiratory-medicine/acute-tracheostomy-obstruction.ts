import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the tracheostomy-patency lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps — including the wrong turn they most recently
 * took.
 */
export type AcuteTracheostomyObstructionSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['acuteTracheostomyObstructionAssessment']>;

/**
 * The six recorded steps, plus the last unsupported choice.
 *
 * `lastUnsupportedChoice` is not a step — it is how the engine reports that
 * one of the four dangerous shortcuts was just tried and refused, with the
 * patient unchanged.
 */
export type AcuteTracheostomyObstructionProgress = Pick<AcuteTracheostomyObstructionSnapshot,
  'recognitionAtTick' | 'supportAtTick' | 'devicePathwayAtTick'
  | 'innerCannulaAtTick' | 'restorationAtTick' | 'handoffAtTick' | 'lastUnsupportedChoice'>;

export const ACUTE_TRACHEOSTOMY_OBSTRUCTION_ACTIONS = [
  'reconcile-acute-tracheostomy-obstruction-anatomy-and-patency',
  'activate-acute-tracheostomy-obstruction-help-and-oxygenation',
  'review-acute-tracheostomy-obstruction-device-pathway',
  'record-acute-tracheostomy-obstruction-inner-cannula-removal',
  'reassess-acute-tracheostomy-obstruction-restoration',
  'handoff-acute-tracheostomy-obstruction-reassessment',
] as const;

/**
 * The four choices this lesson offers and refuses, at two separate moments.
 *
 * These are not reflexes like the portable-oxygen lesson's. Each one is a way
 * this patient gets hurt: waiting for a picture while he is at 82%, pushing
 * positive pressure down a path with no waveform CO₂ behind it, forcing a
 * catheter past the resistance that is telling you where the obstruction is,
 * and giving up a correctly sited outer tube before trying the reversible
 * step.
 */
export const ACUTE_TRACHEOSTOMY_OBSTRUCTION_UNSUPPORTED_ACTIONS = [
  'wait-for-acute-tracheostomy-obstruction-imaging',
  'ventilate-through-unverified-tracheostomy',
  'force-acute-tracheostomy-obstruction-catheter',
  'replace-whole-tracheostomy-first',
] as const;

export type AcuteTracheostomyObstructionAction =
  (typeof ACUTE_TRACHEOSTOMY_OBSTRUCTION_ACTIONS)[number]
  | (typeof ACUTE_TRACHEOSTOMY_OBSTRUCTION_UNSUPPORTED_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * Note the timeline targets carry a `-reassessment` suffix that the scenario
 * id itself does not, so the two are checked separately rather than derived
 * from one another.
 */
export function supportsAcuteTracheostomyObstruction(scenario: Scenario): boolean {
  return scenario.metadata.id === 'acute-tracheostomy-obstruction'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'acute-tracheostomy-obstruction-reassessment').length === 3
    && scenario.timeline.filter((event) => event.target === 'acute-tracheostomy-obstruction-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === ACUTE_TRACHEOSTOMY_OBSTRUCTION_ACTIONS.join('|');
}
