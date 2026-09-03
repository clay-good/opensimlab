import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsLargePleuralEffusion, type LargePleuralEffusionAction, type LargePleuralEffusionProgress,
} from '../large-unilateral-pleural-effusion-reassessment';
import { largePleuralEffusionInlinePrompt } from '../tutor/large-unilateral-pleural-effusion-reassessment-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: LargePleuralEffusionProgress): string {
  const prompt = largePleuralEffusionInlinePrompt('guided', { scenarioVersion: '0.1.0', largePleuralEffusion: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const LARGE_PLEURAL_EFFUSION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsLargePleuralEffusionDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsLargePleuralEffusion(scenario);
}

export interface LargePleuralEffusionDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: LargePleuralEffusionAction; readonly finished?: boolean;
}

/**
 * The worked example for a number that is a case fact rather than a rule.
 *
 * 850 mL is what happened to this patient; the stop was symptom-led. This
 * example examines nobody, acquires and reads no imaging, ultrasound or fluid,
 * performs no thoracentesis, and selects no device, site or drainage volume.
 */
export function largePleuralEffusionDemonstrationStep(
  patient?: LargePleuralEffusionProgress,
): LargePleuralEffusionDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on breathing more easily, with a litre less fluid, an exudate that narrows nothing to a diagnosis, and results somebody else will read. Nothing was proven and nothing was performed. This ends the example, not the investigation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-large-unilateral-pleural-effusion-trajectory',
      narration: narrate(patient) };
  }
  if (patient.intentAtTick === null) {
    return { id: 'intent', focus: 'actions', progress: 0.26, action: 'record-large-unilateral-pleural-effusion-pleural-team-and-drainage-intent',
      narration: narrate(patient) };
  }
  if (patient.responseAtTick === null) {
    return { id: 'response', focus: 'monitor', progress: 0.46, action: 'review-large-unilateral-pleural-effusion-drainage-response',
      narration: narrate(patient) };
  }
  if (patient.fluidAtTick === null) {
    return { id: 'fluid', focus: 'monitor', progress: 0.64, action: 'review-large-unilateral-pleural-effusion-fluid-pattern-and-causes',
      narration: narrate(patient) };
  }
  if (patient.evaluationAtTick === null) {
    return { id: 'evaluation', focus: 'actions', progress: 0.82, action: 'coordinate-large-unilateral-pleural-effusion-definitive-evaluation',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-large-unilateral-pleural-effusion-reassessment',
    narration: narrate(patient) };
}
