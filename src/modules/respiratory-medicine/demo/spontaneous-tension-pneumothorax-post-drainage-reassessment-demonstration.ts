import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPostTensionPneumothorax, type PostTensionPneumothoraxAction, type PostTensionPneumothoraxProgress,
} from '../spontaneous-tension-pneumothorax-post-drainage-reassessment';

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
      narration: 'Start from how close this was six hours ago. Abrupt right-sided pain and severe dyspnea in a man with emphysema, then 132, 76/44, 82%, confused and cold, with markedly reduced right chest movement and air entry. No trauma, no positive-pressure ventilation, no preceding procedure — a spontaneous tension pattern, treated immediately by the experienced team with a right pleural drain. That was the correct order: they treated the pattern rather than waiting to confirm it, and that decision is why there is a patient to reassess.' };
  }
  if (patient.drainageResponseAtTick === null) {
    return { id: 'drainage-response', focus: 'monitor', progress: 0.32, action: 'review-spontaneous-tension-pneumothorax-drainage-response',
      narration: 'Credit the response without upgrading it into a resolution. Less pain, less work of breathing, alert and speaking full sentences, 96 and 108/64, 93% on room air, warm and refilling in two seconds, and right air entry reduced but better. The radiograph shows partial re-expansion with the drain in the pleural space and no contralateral pneumothorax or large collection. Partial is the word that matters: this establishes neither durable drain function nor complete re-expansion, and both of those are things that are true at a point in time rather than settled.' };
  }
  if (patient.systemAtTick === null) {
    return { id: 'system', focus: 'monitor', progress: 0.55, action: 'review-spontaneous-tension-pneumothorax-drain-system-and-complications',
      narration: 'Read the drain as a system before you plan anything long-term. An upright bottle below the insertion site, an intact visible connection, respiratory swing, and intermittent bubbling at six hours. The swing says the drain is communicating with the pleural space; the bubbling says the air leak has not sealed. Every one of those observations is a thing that can stop being true — a bottle lifted above the patient, a connection pulled, swing lost because the tube blocked or kinked — and a drain that has quietly stopped working looks like a patient who is fine right up until he is not. The site is intact, without enlarging subcutaneous emphysema or bleeding.' };
  }
  if (patient.etiologyAtTick === null) {
    return { id: 'etiology', focus: 'actions', progress: 0.78, action: 'review-spontaneous-tension-pneumothorax-etiology-recurrence-and-definitive-planning',
      narration: 'Now the longer questions, and none of them are yours to settle. He has emphysema, so this is a secondary spontaneous pneumothorax rather than a primary one, which changes both the recurrence risk and the threshold for a definitive pleural procedure. Recurrence prevention, surgical fitness in a man with his lung disease, what he himself wants, and the definitive pleural strategy all need named pleural and thoracic ownership — and the persistent leak is what makes that conversation urgent rather than elective.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-spontaneous-tension-pneumothorax-post-drainage-reassessment',
    narration: 'Nothing here establishes durable drain function, complete re-expansion, a sealed leak, a definitive plan, a disposition or a recurrence risk. Hand off how he presented and what was done, the partial response, every observation in the drain system and what each would look like if it failed, the deterioration triggers, and the pleural and thoracic ownership for the decisions nobody has made yet.' };
}
