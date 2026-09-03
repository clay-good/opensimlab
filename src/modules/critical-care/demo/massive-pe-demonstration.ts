import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsMassivePe, type MassivePeAction, type MassivePeProgress,
} from '../massive-pe';
import { massivePeInlinePrompt } from '../tutor/massive-pe-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: MassivePeProgress): string {
  const prompt = massivePeInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const MASSIVE_PE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsMassivePeDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsMassivePe(scenario);
}

export interface MassivePeDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: MassivePeAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a bridge that is not a treatment.
 *
 * Five beats in the only order the engine accepts. It examines nobody,
 * acquires or interprets no monitoring, CT, echo, laboratory or haemodynamic
 * data, diagnoses nothing, delivers no oxygen, ventilation, anticoagulation,
 * fluid or drug, obtains no access, doses nothing, performs no CPR,
 * cannulation, ECMO, thrombectomy, thrombolysis or embolectomy, transfers and
 * dispositions nobody, and predicts no outcome.
 */
export function massivePeDemonstrationStep(
  patient?: MassivePeProgress,
): MassivePeDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.reassessmentAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'His pressure and his saturation are better and the saddle embolus is exactly where it was. A machine is doing the work his right ventricle could not, which is the reason the numbers moved and the reason nobody has treated anything yet. Whether he gets more than a bridge is still open, and it was never going to be settled by watching a monitor improve. This ends the example, not the evaluation.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'monitor', progress: 0.12,
      action: 'recognize-refractory-pe-shock', narration: narrate(patient) };
  }
  if (patient.patternAtTick === null) {
    return { id: 'pattern', focus: 'monitor', progress: 0.32,
      action: 'review-refractory-pe-pattern', narration: narrate(patient) };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.54,
      action: 'record-refractory-pe-support', narration: narrate(patient) };
  }
  if (patient.ecmoAtTick === null) {
    return { id: 'bridge', focus: 'actions', progress: 0.76,
      action: 'activate-pe-ecmo-bridge', narration: narrate(patient) };
  }
  return { id: 'reassessment', focus: 'monitor', progress: 0.9,
    action: 'reassess-pe-ecmo-trajectory', narration: narrate(patient) };
}
