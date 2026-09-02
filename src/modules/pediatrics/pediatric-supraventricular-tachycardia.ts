import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the pediatric SVT lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type PediatricSvtSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['pediatricSupraventricularTachycardiaAssessment']>;

/**
 * The six recorded steps.
 *
 * This engine case authors no refusable choice, and like the anaphylaxis
 * lesson its steps are a strict line rather than an unordered pair: the
 * support-and-deterioration review refuses until rhythm-care ownership is
 * recorded. Two time gates follow, on the later report and on the handoff.
 *
 * The flag worth naming is `laterSinusRhythmAuthored`. Sinus rhythm is
 * reported at the later checkpoint and `treatmentEffectProven`,
 * `durableConversionProven`, `mechanismProven`, `causeProven`,
 * `svtFinallyProven`, `sinusTachycardiaExcluded`, `heartFailureExcluded` and
 * `recurrenceExcluded` all stay `false` after it. A converted rhythm is a
 * checkpoint, not a conclusion, and nothing here says the learner caused it.
 */
export type PediatricSvtProgress = Pick<PediatricSvtSnapshot,
  'trajectoryAtTick' | 'recognitionAtTick' | 'careAtTick'
  | 'safetyAtTick' | 'laterResponseAtTick' | 'handoffAtTick'>;

export const PEDIATRIC_SVT_ACTIONS = [
  'reconcile-pediatric-svt-clock-rhythm-and-whole-child',
  'recognize-pediatric-svt-with-perfusion-compromise',
  'activate-pediatric-svt-qualified-rhythm-care-and-resuscitation-ownership',
  'review-pediatric-svt-support-causes-heart-failure-and-deterioration-boundary',
  'review-pediatric-svt-later-response',
  'handoff-pediatric-svt-recurrence-cardiology-and-caregiver-risk',
] as const;

export type PediatricSvtAction = (typeof PEDIATRIC_SVT_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * Unlike every other pediatrics lesson given evidence so far, this timeline is
 * not all narrative: it opens with a `rhythm-change` event that puts the fixed
 * 210/min narrow-complex rhythm on the teaching monitor. The guard asserts
 * that event rather than assuming its absence.
 */
export function supportsPediatricSvt(scenario: Scenario): boolean {
  return scenario.metadata.id === 'pediatric-supraventricular-tachycardia'
    && scenario.timeline.filter((event) => event.type === 'rhythm-change'
      && event.target === 'svt').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'pediatric-supraventricular-tachycardia-reassessment').length === 2
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'pediatric-supraventricular-tachycardia-reassessment-boundary').length === 1
    && scenario.timeline.length === 4
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === PEDIATRIC_SVT_ACTIONS.join('|');
}
