import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPediatricSvt, type PediatricSvtAction, type PediatricSvtProgress,
} from '../pediatric-supraventricular-tachycardia';
import { pediatricSvtInlinePrompt } from '../tutor/pediatric-svt-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied. Every lesson's prose used to ship twice inside the
 * cockpit bundle — once in the tutor and once as a duplicated string literal
 * here — and gzip cannot reach across that distance to dedupe it. Deriving it
 * also makes "the two cannot drift apart" structural rather than a property
 * maintained by regenerating this file.
 */
function narrate(patient: PediatricSvtProgress): string {
  const prompt = pediatricSvtInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const PEDIATRIC_SVT_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPediatricSvtDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPediatricSvt(scenario);
}

export interface PediatricSvtDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PediatricSvtAction; readonly finished?: boolean;
}

/**
 * The worked example for a rhythm that converts and settles nothing.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. The steps are a strict line, so this example has only one order
 * available to it. It examines and monitors nobody, acquires and interprets no
 * ECG or other test, diagnoses nothing and assigns no mechanism, performs no
 * vagal maneuver, places no access, selects no modality, drug, product,
 * concentration, dose, route, volume, rate, device, energy or sedation,
 * performs no cardioversion, and determines no disposition or outcome.
 */
export function pediatricSvtDemonstrationStep(
  patient?: PediatricSvtProgress,
): PediatricSvtDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'His rhythm is sinus and his hands are warm, and nobody here knows the mechanism, the cause, or whether it comes back tonight. That is the honest state of it, and it is why he is going to a cardiologist rather than home. This ends the example, not the evaluation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.1, action: 'reconcile-pediatric-svt-clock-rhythm-and-whole-child',
      narration: narrate(patient) };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'monitor', progress: 0.28, action: 'recognize-pediatric-svt-with-perfusion-compromise',
      narration: narrate(patient) };
  }
  if (patient.careAtTick === null) {
    return { id: 'care', focus: 'actions', progress: 0.46, action: 'activate-pediatric-svt-qualified-rhythm-care-and-resuscitation-ownership',
      narration: narrate(patient) };
  }
  if (patient.safetyAtTick === null) {
    return { id: 'safety', focus: 'actions', progress: 0.64, action: 'review-pediatric-svt-support-causes-heart-failure-and-deterioration-boundary',
      narration: narrate(patient) };
  }
  if (patient.laterResponseAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.8, action: 'review-pediatric-svt-later-response',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-pediatric-svt-recurrence-cardiology-and-caregiver-risk',
    narration: narrate(patient) };
}
