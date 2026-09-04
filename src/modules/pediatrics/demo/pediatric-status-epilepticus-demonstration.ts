import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPediatricStatusEpilepticus, type PediatricStatusEpilepticusAction,
  type PediatricStatusEpilepticusProgress,
} from '../pediatric-status-epilepticus';
import { pediatricStatusEpilepticusInlinePrompt } from '../tutor/pediatric-status-epilepticus-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: PediatricStatusEpilepticusProgress): string {
  const prompt = pediatricStatusEpilepticusInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const PEDIATRIC_STATUS_EPILEPTICUS_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPediatricStatusEpilepticusDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPediatricStatusEpilepticus(scenario);
}

export interface PediatricStatusEpilepticusDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PediatricStatusEpilepticusAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a seizure that stops being visible.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. Of the unordered pair it takes second-line ownership first and
 * the safety review second, which is one valid order rather than the required
 * one. The example times and examines nothing, acquires and interprets no
 * monitoring, glucose, laboratory, EEG, imaging or lumbar-puncture finding,
 * verifies or selects no first-line or second-line product, dose,
 * concentration, route, access, infusion, oxygen, suction, airway device or
 * procedure, diagnoses and treats no cause, and determines no disposition or
 * outcome.
 */
export function pediatricStatusEpilepticusDemonstrationStep(
  patient?: PediatricStatusEpilepticusProgress,
): PediatricStatusEpilepticusDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is still, and still is not the same as well. The team taking over has the clock, the two doses that failed, who owns the agent that followed them, and the sentence that matters most: no visible convulsion is not the same as no seizure. This ends the example, not the evaluation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.1, action: 'reconcile-pediatric-status-epilepticus-clock-care-and-whole-child',
      narration: narrate(patient) };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'monitor', progress: 0.28, action: 'recognize-pediatric-convulsive-status-after-first-line-care',
      narration: narrate(patient) };
  }
  if (patient.secondLineAtTick === null) {
    return { id: 'secondLine', focus: 'actions', progress: 0.46, action: 'activate-pediatric-status-epilepticus-qualified-second-line-ownership',
      narration: narrate(patient) };
  }
  if (patient.safetyAtTick === null) {
    return { id: 'safety', focus: 'actions', progress: 0.64, action: 'review-pediatric-status-epilepticus-airway-causes-and-refractory-boundary',
      narration: narrate(patient) };
  }
  if (patient.laterResponseAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.8, action: 'review-pediatric-status-epilepticus-later-response',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-pediatric-status-epilepticus-active-risk',
    narration: narrate(patient) };
}
