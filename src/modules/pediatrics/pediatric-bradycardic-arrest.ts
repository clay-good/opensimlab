import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the bradycardic-arrest lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type PediatricBradycardicArrestSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['pediatricBradycardicArrestAssessment']>;

/**
 * The six recorded steps.
 *
 * This engine case authors no refusable choice and its steps are a strict line:
 * the causes-and-arrest-boundary review refuses until qualified resuscitation
 * ownership is recorded. Two time gates follow.
 *
 * This is the one lesson in the module whose later checkpoint is a
 * deterioration rather than an improvement. `laterPulseLossAuthored` and
 * `laterPeaAuthored` both become true: organized electrical activity persists
 * at 46/min with no pulse. Nothing after it improves, and `roscReported`,
 * `deathDeclared` and `resuscitationTerminated` are all fixed `false` — the
 * lesson ends inside an ongoing resuscitation with no outcome of any kind.
 */
export type PediatricBradycardicArrestProgress = Pick<PediatricBradycardicArrestSnapshot,
  'trajectoryAtTick' | 'recognitionAtTick' | 'resuscitationAtTick'
  | 'safetyAtTick' | 'laterResponseAtTick' | 'handoffAtTick'>;

export const PEDIATRIC_BRADYCARDIC_ARREST_ACTIONS = [
  'reconcile-pediatric-bradycardic-arrest-support-and-trajectory',
  'recognize-pediatric-bradycardia-with-persistent-compromise',
  'activate-pediatric-bradycardic-arrest-qualified-resuscitation-ownership',
  'review-pediatric-bradycardic-arrest-causes-pulse-and-arrest-boundary',
  'review-pediatric-bradycardic-arrest-pulse-loss-response',
  'handoff-pediatric-bradycardic-arrest-active-risk',
] as const;

export type PediatricBradycardicArrestAction =
  (typeof PEDIATRIC_BRADYCARDIC_ARREST_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * As in the SVT lesson this timeline is not all narrative: it opens with a
 * `rhythm-change` event putting fixed sinus bradycardia on the teaching
 * monitor, and it carries only one narrative on its main target.
 */
export function supportsPediatricBradycardicArrest(scenario: Scenario): boolean {
  return scenario.metadata.id === 'pediatric-bradycardic-arrest'
    && scenario.timeline.filter((event) => event.type === 'rhythm-change'
      && event.target === 'sinus-bradycardia').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'pediatric-bradycardic-arrest-reassessment').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'pediatric-bradycardic-arrest-reassessment-boundary').length === 1
    && scenario.timeline.length === 3
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === PEDIATRIC_BRADYCARDIC_ARREST_ACTIONS.join('|');
}
