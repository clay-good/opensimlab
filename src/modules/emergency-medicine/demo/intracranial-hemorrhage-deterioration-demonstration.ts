import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsIntracranialHemorrhage, type IntracranialHemorrhageAction,
  type IntracranialHemorrhageProgress,
} from '../intracranial-hemorrhage-deterioration';
import { intracranialHemorrhageInlinePrompt } from '../tutor/intracranial-hemorrhage-deterioration-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: IntracranialHemorrhageProgress): string {
  const prompt = intracranialHemorrhageInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const INTRACRANIAL_HEMORRHAGE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsIntracranialHemorrhageDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsIntracranialHemorrhage(scenario);
}

export interface IntracranialHemorrhageDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: IntracranialHemorrhageAction;
  readonly finished?: boolean;
}

/**
 * The worked example for the number you cannot see.
 *
 * Six beats in the only order the engine accepts. It examines nobody, scores no
 * consciousness, interprets no image, selects no product or dose, delivers
 * nothing, manages no airway, drains no ventricle, operates on nobody, and
 * predicts no outcome.
 */
export function intracranialHemorrhageDemonstrationStep(
  patient?: IntracranialHemorrhageProgress,
): IntracranialHemorrhageDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.escalatedAtTick !== null) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'The reversal went in before the pressure strategy, and that ordering is the whole example. A systolic of 202 is on the monitor and has a target, so titrating it feels like treatment — while the thing actually enlarging the haematoma is an INR of 3.2 that nobody can see. The engine refuses the pressure step until the reversal is recorded. Both reversal agents were named, because concentrate and vitamin K cover different halves of the same clock. Nothing here was prepared, delivered, drained or operated on, and no expansion, response or outcome is simulated. This ends the example, not the evaluation.' };
  }
  if (patient.deteriorationReviewedAtTick === null) {
    return { id: 'deterioration', focus: 'monitor', progress: 0.1,
      action: 'review-ich-deterioration', narration: narrate(patient) };
  }
  if (patient.pathwayActivatedAtTick === null) {
    return { id: 'pathway', focus: 'actions', progress: 0.27,
      action: 'activate-ich-pathway', narration: narrate(patient) };
  }
  if (patient.findingsReviewedAtTick === null) {
    return { id: 'findings', focus: 'monitor', progress: 0.45,
      action: 'review-ich-findings-and-coagulopathy', narration: narrate(patient) };
  }
  if (patient.reversalAtTick === null) {
    return { id: 'reversal', focus: 'actions', progress: 0.62,
      action: 'record-warfarin-reversal-intent', narration: narrate(patient) };
  }
  if (patient.pressureControlAtTick === null) {
    return { id: 'pressure', focus: 'actions', progress: 0.79,
      action: 'record-smooth-ich-pressure-control', narration: narrate(patient) };
  }
  return { id: 'escalation', focus: 'actions', progress: 0.92,
    action: 'escalate-ich-neurocritical-care', narration: narrate(patient) };
}
