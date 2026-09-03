import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the pericardial-tamponade lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type PericardialTamponadeSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['pericardialTamponadeAssessment']>;

/**
 * Five recorded steps against five declared objectives, an unordered pair, and
 * one time gate.
 *
 * The chain is trajectory then drainage response; only afterwards do etiology
 * and surveillance become a pair the engine accepts in either order, with the
 * handoff refusing until both have landed and a tick has passed. The ordering
 * is not arbitrary — everything in this lesson is read against a before and an
 * after that the learner has to establish first, because the emergency was
 * over before they arrived.
 *
 * Unusually for this module the scenario declares no rhythm-change event: two
 * narratives share the reassessment target and a third carries the boundary,
 * so the identity guard counts those rather than a rhythm.
 *
 * `initialPulsePresent` is a fixed `true`, and `treatmentDeliveredByLearner`,
 * `imageAcquiredByLearner`, `procedurePerformedByLearner` and
 * `catheterManipulatedByLearner` all stay `false` — the drainage is somebody
 * else's prior care and the catheter is never touched.
 */
export type PericardialTamponadeProgress = Pick<PericardialTamponadeSnapshot,
  'trajectoryAtTick' | 'drainageResponseAtTick' | 'etiologyAtTick'
  | 'surveillanceAtTick' | 'handoffAtTick'>;

export const PERICARDIAL_TAMPONADE_ACTIONS = [
  'reconcile-pericardial-tamponade-trajectory',
  'review-pericardial-tamponade-drainage-response',
  'review-pericardial-tamponade-etiology',
  'review-pericardial-tamponade-surveillance',
  'handoff-pericardial-tamponade-reassessment',
] as const;

export type PericardialTamponadeAction = (typeof PERICARDIAL_TAMPONADE_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsPericardialTamponade(scenario: Scenario): boolean {
  return scenario.metadata.id === 'pericardial-tamponade'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'pericardial-tamponade-reassessment').length === 2
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'pericardial-tamponade-reassessment-boundary').length === 1
    && scenario.timeline.length === 3
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === PERICARDIAL_TAMPONADE_ACTIONS.join('|');
}
