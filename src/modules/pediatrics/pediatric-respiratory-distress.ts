import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the pediatric respiratory-distress
 * lesson — the first of the pediatrics module to get a tutor and a worked
 * example.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps — including the wrong turn they most recently
 * took.
 */
export type PediatricRespiratoryDistressSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['pediatricRespiratoryDistressAssessment']>;

/**
 * The six recorded steps, plus the last unsupported choice.
 *
 * `lastUnsupportedChoice` is not a step — it is how the engine reports that
 * one of the four refusable readings was just taken and refused, with the
 * child unchanged.
 */
export type PediatricRespiratoryDistressProgress = Pick<PediatricRespiratoryDistressSnapshot,
  'recognitionAtTick' | 'supportAtTick' | 'earlyResponseAtTick'
  | 'laterPanelAtTick' | 'rescueAtTick' | 'handoffAtTick' | 'lastUnsupportedChoice'>;

export const PEDIATRIC_RESPIRATORY_DISTRESS_ACTIONS = [
  'reconcile-pediatric-respiratory-distress-whole-child',
  'activate-pediatric-respiratory-distress-support',
  'review-pediatric-respiratory-distress-early-response',
  'review-pediatric-respiratory-distress-later-panel',
  'activate-pediatric-respiratory-failure-rescue',
  'handoff-pediatric-respiratory-distress-reassessment',
] as const;

/**
 * The four choices this lesson offers and refuses, at three separate moments.
 *
 * The first two delay support for something that genuinely matters later. The
 * third reads an improved saturation as an improved child. The fourth is the
 * one this lesson exists for: reading a falling respiratory rate in a tiring
 * child as recovery.
 */
export const PEDIATRIC_RESPIRATORY_DISTRESS_UNSUPPORTED_ACTIONS = [
  'complete-pediatric-respiratory-distress-history-first',
  'wait-for-pediatric-respiratory-distress-imaging',
  'reassure-pediatric-respiratory-distress-saturation-alone',
  'treat-pediatric-respiratory-distress-falling-rate-as-recovery',
] as const;

export type PediatricRespiratoryDistressAction =
  (typeof PEDIATRIC_RESPIRATORY_DISTRESS_ACTIONS)[number]
  | (typeof PEDIATRIC_RESPIRATORY_DISTRESS_UNSUPPORTED_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * As throughout this module, the timeline targets carry a `-reassessment`
 * suffix that the scenario id does not, so the two are checked separately
 * rather than derived from one another.
 */
export function supportsPediatricRespiratoryDistress(scenario: Scenario): boolean {
  return scenario.metadata.id === 'pediatric-respiratory-distress'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'pediatric-respiratory-distress-reassessment').length === 2
    && scenario.timeline.filter((event) => event.target === 'pediatric-respiratory-distress-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === PEDIATRIC_RESPIRATORY_DISTRESS_ACTIONS.join('|');
}
