import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsHyperkalemicConduction, type HyperkalemicConductionAction,
  type HyperkalemicConductionProgress,
} from '../hyperkalemic-conduction';
import { hyperkalemicConductionInlinePrompt } from '../tutor/hyperkalemic-conduction-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: HyperkalemicConductionProgress): string {
  const prompt = hyperkalemicConductionInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const HYPERKALEMIC_CONDUCTION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsHyperkalemicConductionDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsHyperkalemicConduction(scenario);
}

export interface HyperkalemicConductionDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: HyperkalemicConductionAction;
  readonly finished?: boolean;
}

/**
 * The worked example for an ECG that got better without the problem going
 * away.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. The three middle lanes are unordered and the example takes them
 * calcium, shifting, removal — a choice, not a rule. It examines nobody,
 * acquires or interprets no specimen, ECG, monitor or image, diagnoses no
 * cause, delivers no calcium, insulin, glucose, beta-agonist, binder,
 * dialysis, medication or rescue, selects no dose or target, models no
 * kinetics, decides no pacing eligibility, chooses, implants or programs no
 * device, assesses no capture, determines no disposition, and predicts no
 * outcome.
 */
export function hyperkalemicConductionDemonstrationStep(
  patient?: HyperkalemicConductionProgress,
): HyperkalemicConductionDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'Her potassium is 5.8 rather than 6.9, her QRS is 98 ms rather than 154, and nothing has been removed from her yet — it has been moved, and it will come back. Nobody decided her conduction disease was hers, because nobody has seen this heart at a normal potassium. The ECG improving was the part that could have ended the review early. This ends the example, not the evaluation.' };
  }
  if (patient.reconciledAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.1, action: 'reconcile-hyperkalemic-conduction-trajectory',
      narration: narrate(patient) };
  }
  if (patient.calciumResponseAtTick === null) {
    return { id: 'lanes', focus: 'monitor', progress: 0.26, action: 'review-hyperkalemic-conduction-calcium-response',
      narration: narrate(patient) };
  }
  if (patient.shiftSurveillanceAtTick === null) {
    return { id: 'shift', focus: 'monitor', progress: 0.44, action: 'review-hyperkalemic-conduction-shift-surveillance',
      narration: narrate(patient) };
  }
  if (patient.removalDeviceAtTick === null) {
    return { id: 'removal', focus: 'actions', progress: 0.6, action: 'review-hyperkalemic-conduction-removal-and-device-restraint',
      narration: narrate(patient) };
  }
  if (patient.laterPanelAtTick === null) {
    return { id: 'panel', focus: 'monitor', progress: 0.78, action: 'review-hyperkalemic-conduction-later-panel',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-hyperkalemic-conduction-reassessment',
    narration: narrate(patient) };
}
