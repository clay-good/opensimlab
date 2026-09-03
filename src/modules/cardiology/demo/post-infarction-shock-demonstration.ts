import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPostInfarctionShock, type PostInfarctionShockAction,
  type PostInfarctionShockProgress,
} from '../post-infarction-shock';
import { postInfarctionShockInlinePrompt } from '../tutor/post-infarction-shock-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: PostInfarctionShockProgress): string {
  const prompt = postInfarctionShockInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const POST_INFARCTION_SHOCK_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPostInfarctionShockDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPostInfarctionShock(scenario);
}

export interface PostInfarctionShockDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PostInfarctionShockAction; readonly finished?: boolean;
}

/**
 * The worked example for a pressure that improved and a patient who did not.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. Of the unordered pair it reopens the causes first and calls
 * second, which is one valid order rather than the required one. It acquires
 * and interprets no examination, monitoring, laboratory, ECG, echo,
 * angiographic or hemodynamic finding, diagnoses nothing, prescribes and
 * delivers no drug or fluid, selects or places no device, performs no PCI,
 * surgery or transport, determines no disposition, and predicts no prognosis
 * or outcome.
 */
export function postInfarctionShockDemonstrationStep(
  patient?: PostInfarctionShockProgress,
): PostInfarctionShockDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'A phone call was made early, the diagnosis was reopened rather than assumed, and no device was chosen by anyone in this building. Whether she travels, and where, is still somebody else\'s decision — which is the accurate ending rather than a tidy one. This ends the example, not the evaluation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.12, action: 'reconcile-post-infarction-shock-trajectory',
      narration: narrate(patient) };
  }
  if (patient.causesAtTick === null) {
    return { id: 'causes', focus: 'monitor', progress: 0.34, action: 'reopen-post-infarction-shock-causes',
      narration: narrate(patient) };
  }
  if (patient.transferAtTick === null) {
    return { id: 'transfer', focus: 'actions', progress: 0.56, action: 'contact-post-infarction-shock-center',
      narration: narrate(patient) };
  }
  if (patient.bridgeAtTick === null) {
    return { id: 'bridge', focus: 'actions', progress: 0.78, action: 'record-post-infarction-shock-bridge',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-post-infarction-shock-trajectory',
    narration: narrate(patient) };
}
