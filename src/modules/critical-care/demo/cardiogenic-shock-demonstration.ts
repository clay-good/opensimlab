import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsCardiogenicShock, type CardiogenicShockAction, type CardiogenicShockProgress,
} from '../cardiogenic-shock';
import { cardiogenicShockInlinePrompt } from '../tutor/cardiogenic-shock-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied. Every lesson's prose used to ship twice inside the
 * cockpit bundle — once in the tutor and once as a duplicated string literal
 * here — and gzip cannot reach across that distance to dedupe it. Deriving it
 * also makes "the two cannot drift apart" structural rather than a property
 * maintained by regenerating this file.
 */
function narrate(patient: CardiogenicShockProgress): string {
  const prompt = cardiogenicShockInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const CARDIOGENIC_SHOCK_DEMONSTRATION_VERSION = '0.1.0';

export function supportsCardiogenicShockDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsCardiogenicShock(scenario);
}

export interface CardiogenicShockDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: CardiogenicShockAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a shock the previous lesson's instincts would treat
 * wrongly.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. There is no unordered lane here: five beats in the only order
 * the engine accepts. It examines nobody, acquires no monitoring or test,
 * diagnoses nothing, delivers no oxygen or drug, obtains no access, doses
 * nothing, images nothing, catheterizes, revascularizes, supports, transfers
 * and dispositions nobody, and predicts no outcome.
 */
export function cardiogenicShockDemonstrationStep(
  patient?: CardiogenicShockProgress,
): CardiogenicShockDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.reassessmentAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'His numbers are better and his artery is shut. Nothing was given, nothing was opened, and no device was chosen — what the review produced was a bridge with a reason and a queue in the right order. The fluid a MAP of 58 asks for would have gone into his lungs, and the device a shocked anterior infarct asks for would have been layered onto the problem rather than fixing it. This ends the example, not the evaluation.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'monitor', progress: 0.12, action: 'recognize-cardiogenic-shock-trajectory',
      narration: narrate(patient) };
  }
  if (patient.phenotypeAtTick === null) {
    return { id: 'phenotype', focus: 'monitor', progress: 0.3, action: 'review-cardiogenic-shock-cause-and-phenotype',
      narration: narrate(patient) };
  }
  if (patient.bridgeAtTick === null) {
    return { id: 'bridge', focus: 'actions', progress: 0.52, action: 'record-cardiogenic-shock-bridge',
      narration: narrate(patient) };
  }
  if (patient.causeControlAtTick === null) {
    return { id: 'cause', focus: 'actions', progress: 0.74, action: 'escalate-cardiogenic-shock-cause-control',
      narration: narrate(patient) };
  }
  return { id: 'reassessment', focus: 'monitor', progress: 0.9, action: 'reassess-cardiogenic-shock-trajectory',
    narration: narrate(patient) };
}
