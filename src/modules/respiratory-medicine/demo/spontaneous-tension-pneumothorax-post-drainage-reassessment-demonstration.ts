import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPostTensionPneumothorax, type PostTensionPneumothoraxAction, type PostTensionPneumothoraxProgress,
} from '../spontaneous-tension-pneumothorax-post-drainage-reassessment';
import { postTensionPneumothoraxInlinePrompt } from '../tutor/spontaneous-tension-pneumothorax-post-drainage-reassessment-guidance';


/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: PostTensionPneumothoraxProgress): string {
  const prompt = postTensionPneumothoraxInlinePrompt('guided', { scenarioVersion: '0.1.0', postTensionPneumothorax: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const POST_TENSION_PNEUMOTHORAX_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPostTensionPneumothoraxDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPostTensionPneumothorax(scenario);
}

export interface PostTensionPneumothoraxDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PostTensionPneumothoraxAction; readonly finished?: boolean;
}

/**
 * The worked example for a man who is well because of a tube.
 *
 * Everything good about his current state is being produced by a drain, and a
 * drain can stop working while the patient still looks fine. This example
 * examines nobody, touches no drain, selects no suction or clamp, delivers no
 * oxygen or drug, and predicts no recurrence.
 */
export function postTensionPneumothoraxDemonstrationStep(
  patient?: PostTensionPneumothoraxProgress,
): PostTensionPneumothoraxDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He is handed on comfortable, still bubbling, and dependent on a piece of equipment nobody has promised will keep working. Nothing was proven and nothing was planned. This ends the example, not the admission.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.1, action: 'reconcile-spontaneous-tension-pneumothorax-trajectory-and-prior-care',
      narration: narrate(patient) };
  }
  if (patient.drainageResponseAtTick === null) {
    return { id: 'drainage-response', focus: 'monitor', progress: 0.32, action: 'review-spontaneous-tension-pneumothorax-drainage-response',
      narration: narrate(patient) };
  }
  if (patient.systemAtTick === null) {
    return { id: 'system', focus: 'monitor', progress: 0.55, action: 'review-spontaneous-tension-pneumothorax-drain-system-and-complications',
      narration: narrate(patient) };
  }
  if (patient.etiologyAtTick === null) {
    return { id: 'etiology', focus: 'actions', progress: 0.78, action: 'review-spontaneous-tension-pneumothorax-etiology-recurrence-and-definitive-planning',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-spontaneous-tension-pneumothorax-post-drainage-reassessment',
    narration: 'Nothing here establishes durable drain function, complete re-expansion, a sealed leak, a definitive plan, a disposition or a recurrence risk. Hand off how he presented and what was done, the partial response, every observation in the drain system and what each would look like if it failed, the deterioration triggers, and the pleural and thoracic ownership for the decisions nobody has made yet.' };
}
