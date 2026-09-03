import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsObesityHypoventilation, type ObesityHypoventilationAction, type ObesityHypoventilationProgress,
} from '../obesity-hypoventilation-reassessment';
import { obesityHypoventilationInlinePrompt } from '../tutor/obesity-hypoventilation-reassessment-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: ObesityHypoventilationProgress): string {
  const prompt = obesityHypoventilationInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const OBESITY_HYPOVENTILATION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsObesityHypoventilationDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsObesityHypoventilation(scenario);
}

export interface ObesityHypoventilationDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: ObesityHypoventilationAction; readonly finished?: boolean;
}

/**
 * The worked example for a patient whose body size is the least useful fact
 * about her.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. It examines nobody, calculates no BMI or AHI, acquires, scores
 * and interprets no bicarbonate, gas, spirometry or sleep study, diagnoses
 * nothing, and selects no oxygen, device, pressure, drug, weight target or
 * procedure.
 */
export function obesityHypoventilationDemonstrationStep(
  patient?: ObesityHypoventilationProgress,
): ObesityHypoventilationDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She leaves with a pattern that two independent lanes of evidence agree on, a list of what is still open, and a plan built around what she actually wants and can actually reach. Nothing was diagnosed, nothing was prescribed, and no device was chosen. This ends the example, not the evaluation.' };
  }
  if (patient.phenotypeAtTick === null) {
    return { id: 'phenotype', focus: 'monitor', progress: 0.1, action: 'reconcile-obesity-hypoventilation-phenotype-and-trajectory',
      narration: narrate(patient) };
  }
  if (patient.awakeEvidenceAtTick === null) {
    return { id: 'awake', focus: 'monitor', progress: 0.28, action: 'review-obesity-hypoventilation-awake-evidence',
      narration: narrate(patient) };
  }
  if (patient.sleepEvidenceAtTick === null) {
    return { id: 'sleep', focus: 'monitor', progress: 0.46, action: 'review-obesity-hypoventilation-sleep-evidence-and-open-causes',
      narration: narrate(patient) };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'monitor', progress: 0.64, action: 'recognize-obesity-hypoventilation-working-pattern',
      narration: narrate(patient) };
  }
  if (patient.coordinatedPlanAtTick === null) {
    return { id: 'plan', focus: 'actions', progress: 0.8, action: 'coordinate-obesity-hypoventilation-shared-plan',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-obesity-hypoventilation-reassessment',
    narration: narrate(patient) };
}
