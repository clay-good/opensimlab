import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPediatricFebrileSeizure, type PediatricFebrileSeizureAction,
  type PediatricFebrileSeizureProgress,
} from '../pediatric-febrile-seizure';
import { pediatricFebrileSeizureInlinePrompt } from '../tutor/pediatric-febrile-seizure-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: PediatricFebrileSeizureProgress): string {
  const prompt = pediatricFebrileSeizureInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const PEDIATRIC_FEBRILE_SEIZURE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPediatricFebrileSeizureDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPediatricFebrileSeizure(scenario);
}

export interface PediatricFebrileSeizureDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PediatricFebrileSeizureAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a well-looking toddler after a frightening event.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. Of the unordered pair it takes care first and the safety review
 * second, which is one valid order rather than the required one. The example
 * examines nobody, measures no temperature, times no seizure, acquires and
 * interprets no glucose, urine, blood, culture, lumbar-puncture, EEG, ECG or
 * imaging finding, diagnoses neither the seizure nor the fever source, chooses
 * no antipyretic, antimicrobial, antiseizure or rescue medicine, fluid,
 * oxygen, dose, route, access or device, and determines no disposition or
 * outcome.
 */
export function pediatricFebrileSeizureDemonstrationStep(
  patient?: PediatricFebrileSeizureProgress,
): PediatricFebrileSeizureDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He is playing, his caregiver has been told what to watch for and what to do if it happens again, and nobody in this room has called it simple, benign or over. That is the honest version, and it is more useful to this family than the comfortable one. This ends the example, not the evaluation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.1, action: 'reconcile-pediatric-febrile-seizure-event-recovery-and-fever',
      narration: narrate(patient) };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'monitor', progress: 0.28, action: 'recognize-pediatric-febrile-seizure-pattern-and-danger-boundary',
      narration: narrate(patient) };
  }
  if (patient.careAtTick === null) {
    return { id: 'care', focus: 'actions', progress: 0.46, action: 'activate-pediatric-febrile-seizure-qualified-care-ownership',
      narration: narrate(patient) };
  }
  if (patient.safetyAtTick === null) {
    return { id: 'safety', focus: 'actions', progress: 0.64, action: 'review-pediatric-febrile-seizure-infection-recurrence-and-alternatives',
      narration: narrate(patient) };
  }
  if (patient.laterResponseAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.8, action: 'review-pediatric-febrile-seizure-later-response',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-pediatric-febrile-seizure-active-risk',
    narration: narrate(patient) };
}
