import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsHypertensiveEmergency, type HypertensiveEmergencyAction,
  type HypertensiveEmergencyProgress,
} from '../hypertensive-emergency';
import { hypertensiveEmergencyInlinePrompt } from '../tutor/hypertensive-emergency-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: HypertensiveEmergencyProgress): string {
  const prompt = hypertensiveEmergencyInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const HYPERTENSIVE_EMERGENCY_DEMONSTRATION_VERSION = '0.1.0';

export function supportsHypertensiveEmergencyDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsHypertensiveEmergency(scenario);
}

export interface HypertensiveEmergencyDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: HypertensiveEmergencyAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a number that has to be earned twice.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. Where the pair is unordered the example records the
 * controlled-reduction intent first and reviews the phenotype second — a
 * choice, and a pointed one, because the injury is happening while the review
 * is being written. It examines nobody, performs no fundoscopy, collects no
 * specimen, acquires or interprets no test, diagnoses no cause, selects or
 * delivers no drug, dose, infusion rate, percentage or target, performs no
 * procedure, determines no disposition, and predicts no outcome.
 */
export function hypertensiveEmergencyDemonstrationStep(
  patient?: HypertensiveEmergencyProgress,
): HypertensiveEmergencyDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'Her pressure went 236 to 212 to 188 over three hours, her creatinine did not move, and her vision is not worse rather than better. Nobody named a drug, a rate or a target. The number was never the emergency — the eyes and the kidneys were, and they are still the reason somebody has to keep looking. This ends the example, not the evaluation.' };
  }
  if (patient.measurementAtTick === null) {
    return { id: 'measurement', focus: 'monitor', progress: 0.1, action: 'reconcile-hypertensive-emergency-measurement-and-trajectory',
      narration: narrate(patient) };
  }
  if (patient.organInjuryAtTick === null) {
    return { id: 'organ', focus: 'monitor', progress: 0.26, action: 'review-hypertensive-emergency-organ-injury',
      narration: narrate(patient) };
  }
  if (patient.reductionIntentAtTick === null) {
    return { id: 'parallel', focus: 'actions', progress: 0.44, action: 'record-hypertensive-emergency-controlled-reduction-intent',
      narration: narrate(patient) };
  }
  if (patient.phenotypeAtTick === null) {
    return { id: 'phenotype', focus: 'monitor', progress: 0.6, action: 'review-hypertensive-emergency-phenotype-and-causes',
      narration: narrate(patient) };
  }
  if (patient.laterPanelAtTick === null) {
    return { id: 'panel', focus: 'monitor', progress: 0.78, action: 'review-hypertensive-emergency-later-panel',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-hypertensive-emergency-reassessment',
    narration: narrate(patient) };
}
