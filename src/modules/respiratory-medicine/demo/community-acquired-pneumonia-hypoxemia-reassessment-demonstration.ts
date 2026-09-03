import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsCapHypoxemia, type CapHypoxemiaAction, type CapHypoxemiaProgress,
} from '../community-acquired-pneumonia-hypoxemia-reassessment';
import { capHypoxemiaInlinePrompt } from '../tutor/community-acquired-pneumonia-hypoxemia-reassessment-guidance';


/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: CapHypoxemiaProgress): string {
  const prompt = capHypoxemiaInlinePrompt('guided', { scenarioVersion: '0.1.0', capHypoxemia: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const CAP_HYPOXEMIA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsCapHypoxemiaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsCapHypoxemia(scenario);
}

export interface CapHypoxemiaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: CapHypoxemiaAction; readonly finished?: boolean;
}

/**
 * The worked example for a patient who is sicker than her blood pressure
 * suggests.
 *
 * Hypoxemia is the finding, and it gets answered before the reasoning starts.
 * This example delivers no oxygen, selects no support device or antimicrobial,
 * acquires no test, and determines no disposition.
 */
export function capHypoxemiaDemonstrationStep(
  patient?: CapHypoxemiaProgress,
): CapHypoxemiaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on supported, still hypoxemic, with an organism nobody has identified and a location of care nobody in this lesson decided. Nothing was proven and nothing was chosen. This ends the example, not the pneumonia.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'monitor', progress: 0.1, action: 'corroborate-and-support-cap-hypoxemia',
      narration: narrate(patient) };
  }
  if (patient.evidenceAtTick === null) {
    return { id: 'evidence', focus: 'monitor', progress: 0.32, action: 'reconcile-cap-evidence-and-dangerous-alternatives',
      narration: narrate(patient) };
  }
  if (patient.severityAtTick === null) {
    return { id: 'severity', focus: 'actions', progress: 0.55, action: 'classify-cap-severity-and-escalation-needs',
      narration: narrate(patient) };
  }
  if (patient.treatmentIntentAtTick === null) {
    return { id: 'treatment', focus: 'actions', progress: 0.78, action: 'record-cap-testing-and-empiric-treatment-intent',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-cap-hypoxemia-reassessment',
    narration: 'Nothing here establishes an organism, a proven diagnosis, a support device, an antimicrobial, a location of care or an outcome. Hand off the oxygen requirement and how it is being met, the evidence that fits without concluding, the severity features and the judgment they support rather than make, the testing and empiric intent, and the alternatives still open.' };
}
