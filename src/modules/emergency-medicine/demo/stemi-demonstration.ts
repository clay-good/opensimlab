import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import { supportsStemi, type StemiAction, type StemiProgress } from '../stemi';
import { stemiInlinePrompt } from '../tutor/stemi-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: StemiProgress): string {
  const prompt = stemiInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const STEMI_DEMONSTRATION_VERSION = '0.1.0';

export function supportsStemiDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsStemi(scenario);
}

export interface StemiDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: StemiAction; readonly finished?: boolean;
}

/**
 * The worked example for three lanes of which only one opens the artery.
 *
 * Five beats. The three middle lanes are unordered against each other, and the
 * example takes the phone call first. It acquires no tracing, selects no agent
 * or dose, gives nothing, transports nobody, performs no angiography or
 * intervention, and predicts no outcome.
 */
export function stemiDemonstrationStep(patient?: StemiProgress): StemiDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.reassessedAtTick !== null) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'The call went first, and that is the whole example. The engine would have accepted the three in any order — but aspirin and a P2Y12 inhibitor stop a clot getting bigger and neither reopens an occluded artery, while the only thing on this screen that brings a wire closer is the phone call. The drugs are the ones that feel like doing something. Nothing was waited for either: a twelve-lead with this pattern and forty-five minutes of pain is the whole indication, and the troponin would have arrived after the decision it was meant to inform. The oxygen mask stayed off because the saturation was 95%. Nothing here was acquired, dosed, given, transported or reperfused. This ends the example, not the evaluation.' };
  }
  if (patient.patternReviewedAtTick === null) {
    return { id: 'pattern', focus: 'monitor', progress: 0.12,
      action: 'review-stemi-pattern', narration: narrate(patient) };
  }
  if (patient.pathwayActivatedAtTick === null) {
    return { id: 'pathway', focus: 'actions', progress: 0.33,
      action: 'activate-stemi-pathway', narration: narrate(patient) };
  }
  if (patient.aspirinAtTick === null) {
    return { id: 'aspirin', focus: 'actions', progress: 0.55,
      action: 'record-aspirin-load', narration: narrate(patient) };
  }
  if (patient.additionalAntithromboticsAtTick === null) {
    return { id: 'antithrombotics', focus: 'actions', progress: 0.76,
      action: 'record-p2y12-anticoagulation-intent', narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'monitor', progress: 0.92,
    action: 'reassess-and-handoff', narration: narrate(patient) };
}
