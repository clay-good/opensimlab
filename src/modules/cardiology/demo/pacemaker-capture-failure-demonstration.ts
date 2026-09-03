import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPacemakerCaptureFailure, type PacemakerCaptureFailureAction,
  type PacemakerCaptureFailureProgress,
} from '../pacemaker-capture-failure';
import { pacemakerCaptureFailureInlinePrompt } from '../tutor/pacemaker-capture-failure-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: PacemakerCaptureFailureProgress): string {
  const prompt = pacemakerCaptureFailureInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const PACEMAKER_CAPTURE_FAILURE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPacemakerCaptureFailureDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPacemakerCaptureFailure(scenario);
}

export interface PacemakerCaptureFailureDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PacemakerCaptureFailureAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a monitor counting the wrong thing.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. The three middle lanes are unordered and the example takes the
 * rescue first — a choice the lesson argues for rather than merely permits. It
 * examines nobody, acquires or interprets no ECG, telemetry, interrogation,
 * laboratory or imaging report, diagnoses no mechanism, paces nothing, assesses
 * no capture, interrogates or programs no device, selects no output,
 * manipulates no lead, delivers no treatment, determines no disposition, and
 * predicts no outcome.
 */
export function pacemakerCaptureFailureDemonstrationStep(
  patient?: PacemakerCaptureFailureProgress,
): PacemakerCaptureFailureDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He is capturing at 70 and nobody knows why he stopped. A threshold that tripled and an impedance that tripled point at a lead, and pointing is not proving; the programming change that bought him a rhythm is a bridge with somebody else\'s name on it. The rescue never waited for the explanation, which is the only reason there was time to look for one. This ends the example, not the evaluation.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'monitor', progress: 0.1, action: 'reconcile-pacemaker-capture-failure-pulse-and-pattern',
      narration: narrate(patient) };
  }
  if (patient.rescueAtTick === null) {
    return { id: 'lanes', focus: 'actions', progress: 0.26, action: 'activate-pacemaker-capture-failure-rescue-pathway',
      narration: narrate(patient) };
  }
  if (patient.deviceSystemAtTick === null) {
    return { id: 'device', focus: 'monitor', progress: 0.44, action: 'review-pacemaker-capture-failure-device-system',
      narration: narrate(patient) };
  }
  if (patient.causesAtTick === null) {
    return { id: 'causes', focus: 'monitor', progress: 0.6, action: 'review-pacemaker-capture-failure-causes',
      narration: narrate(patient) };
  }
  if (patient.laterPanelAtTick === null) {
    return { id: 'panel', focus: 'monitor', progress: 0.78, action: 'review-pacemaker-capture-failure-later-panel',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-pacemaker-capture-failure-reassessment',
    narration: narrate(patient) };
}
