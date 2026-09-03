import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsChronicOpioidHypoventilation, type ChronicOpioidHypoventilationAction, type ChronicOpioidHypoventilationProgress,
} from '../chronic-opioid-related-hypoventilation-reassessment';
import { chronicOpioidHypoventilationInlinePrompt } from '../tutor/chronic-opioid-related-hypoventilation-reassessment-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: ChronicOpioidHypoventilationProgress): string {
  const prompt = chronicOpioidHypoventilationInlinePrompt('guided', { scenarioVersion: '0.1.0', chronicOpioidHypoventilation: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const CHRONIC_OPIOID_HYPOVENTILATION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsChronicOpioidHypoventilationDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsChronicOpioidHypoventilation(scenario);
}

export interface ChronicOpioidHypoventilationDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: ChronicOpioidHypoventilationAction; readonly finished?: boolean;
}

/**
 * The worked example for a diagnosis that would be easy and unfair to make.
 *
 * Chronic opioid exposure is a contributor here rather than a proven cause.
 * This example examines nobody, acquires, scores and interprets no gas or
 * sleep study, selects no dose, taper or naloxone, and chooses no support
 * device.
 */
export function chronicOpioidHypoventilationDemonstrationStep(
  patient?: ChronicOpioidHypoventilationProgress,
): ChronicOpioidHypoventilationDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She leaves with her analgesia unchanged, a pattern that has been described rather than attributed, and a named owner for every part of the work that is left. Nothing was proven and nothing was prescribed. This ends the example, not the evaluation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.1, action: 'reconcile-chronic-opioid-related-hypoventilation-exposure-and-trajectory',
      narration: narrate(patient) };
  }
  if (patient.evidenceAtTick === null) {
    return { id: 'evidence', focus: 'monitor', progress: 0.32, action: 'review-chronic-opioid-related-hypoventilation-awake-and-sleep-evidence',
      narration: narrate(patient) };
  }
  if (patient.alternativesAtTick === null) {
    return { id: 'alternatives', focus: 'monitor', progress: 0.55, action: 'review-chronic-opioid-related-hypoventilation-contributors-and-alternatives',
      narration: narrate(patient) };
  }
  if (patient.coordinatedPlanAtTick === null) {
    return { id: 'plan', focus: 'actions', progress: 0.78, action: 'coordinate-chronic-opioid-related-hypoventilation-prescriber-sleep-and-respiratory-plan',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-chronic-opioid-related-hypoventilation-reassessment',
    narration: narrate(patient) };
}
