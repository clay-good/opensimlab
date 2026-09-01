import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the preterm respiratory distress
 * lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type PretermRespiratoryDistressSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['neonatologyPretermRespiratoryDistressAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no device
 * operated, no setting selected, no disease excluded — which are constants
 * rather than observations.
 */
export type PretermRespiratoryDistressProgress = Pick<PretermRespiratoryDistressSnapshot,
  'supportAtTick' | 'contextAtTick' | 'recognitionAtTick'
  | 'readinessAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const PRETERM_RESPIRATORY_DISTRESS_ACTIONS = [
  'activate-preterm-respiratory-distress-newborn-respiratory-thermal-and-family-support',
  'reconcile-preterm-respiratory-distress-gestation-breathing-work-heart-rate-oxygenation-temperature-and-whole-dyad',
  'recognize-spontaneously-breathing-preterm-respiratory-distress-suitable-for-qualified-initial-cpap',
  'review-qualified-cpap-oxygen-thermal-monitoring-and-escalation-boundaries',
  'review-preterm-respiratory-distress-fixed-ten-minute-qualified-report',
  'handoff-preterm-respiratory-distress-breathing-oxygen-thermal-glucose-infection-family-and-outcome-risk',
] as const;

export type PretermRespiratoryDistressAction = (typeof PRETERM_RESPIRATORY_DISTRESS_ACTIONS)[number];

/** The same identity guard the engine applies, so nothing reads a look-alike scenario. */
export function supportsPretermRespiratoryDistress(scenario: Scenario): boolean {
  return scenario.metadata.id === 'preterm-respiratory-distress'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'preterm-respiratory-distress').length === 1
    && scenario.timeline.filter((event) => event.target === 'preterm-respiratory-distress-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === PRETERM_RESPIRATORY_DISTRESS_ACTIONS.join('|');
}
