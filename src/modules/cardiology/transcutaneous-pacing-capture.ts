import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the transcutaneous-pacing capture
 * lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type TranscutaneousPacingCaptureSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['transcutaneousPacingCaptureAssessment']>;

/**
 * Four recorded steps against four declared objectives, no unordered pair, and
 * one time gate — the shortest and strictest lesson in the cardiology module.
 *
 * The absence of a fork is the design. Every other lesson here has somewhere a
 * learner may legitimately go first; this one has a patient with no pulse, so
 * the engine enforces a single chain: recognise that the paced complexes are
 * not circulation, activate the pulseless response, and only then review causes
 * and the future bridge.
 *
 * It is also the only lesson in the module whose `initialPulsePresent` is
 * `false`. `electricalCaptureAuthored` and `mechanicalCaptureAbsent` are both a
 * fixed `true`, `nonshockableArrestPathwayActivated` is the one boolean that
 * moves, and `roscReported` stays `false` — the lesson ends inside an ongoing
 * resuscitation and deliberately never says how it went.
 */
export type TranscutaneousPacingCaptureProgress = Pick<TranscutaneousPacingCaptureSnapshot,
  'recognitionAtTick' | 'pulselessResponseAtTick' | 'causesBridgeAtTick' | 'handoffAtTick'>;

export const TRANSCUTANEOUS_PACING_CAPTURE_ACTIONS = [
  'reconcile-transcutaneous-pacing-electrical-and-mechanical-capture',
  'activate-transcutaneous-pacing-pulseless-response',
  'review-transcutaneous-pacing-open-causes-and-bridge',
  'handoff-transcutaneous-pacing-reassessment',
] as const;

export type TranscutaneousPacingCaptureAction = (typeof TRANSCUTANEOUS_PACING_CAPTURE_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsTranscutaneousPacingCapture(scenario: Scenario): boolean {
  return scenario.metadata.id === 'transcutaneous-pacing-mechanical-capture-reassessment'
    && scenario.timeline.filter((event) => event.type === 'rhythm-change'
      && event.target === 'paced-electrical-no-mechanical-capture').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'transcutaneous-pacing-mechanical-capture-reassessment').length === 2
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'transcutaneous-pacing-mechanical-capture-reassessment-boundary').length === 1
    && scenario.timeline.length === 4
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === TRANSCUTANEOUS_PACING_CAPTURE_ACTIONS.join('|');
}
