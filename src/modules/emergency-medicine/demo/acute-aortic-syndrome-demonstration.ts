import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsAcuteAorticSyndrome, type AcuteAorticSyndromeAction,
  type AcuteAorticSyndromeProgress,
} from '../acute-aortic-syndrome';
import { acuteAorticSyndromeInlinePrompt } from '../tutor/acute-aortic-syndrome-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: AcuteAorticSyndromeProgress): string {
  const prompt = acuteAorticSyndromeInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const ACUTE_AORTIC_SYNDROME_DEMONSTRATION_VERSION = '0.1.0';

export function supportsAcuteAorticSyndromeDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsAcuteAorticSyndrome(scenario);
}

export interface AcuteAorticSyndromeDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: AcuteAorticSyndromeAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a diagnosis that has not arrived yet.
 *
 * Six beats in the only order the engine accepts. It examines nobody, gives no
 * drug and selects no dose, places no line, acquires and interprets no image,
 * consults, transfers and operates on nobody, makes no diagnosis, determines no
 * disposition, and predicts no outcome.
 */
export function acuteAorticSyndromeDemonstrationStep(
  patient?: AcuteAorticSyndromeProgress,
): AcuteAorticSyndromeDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handedOffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'The example ends without a diagnosis, and that is what it was for. A man with crushing chest pain and a hypertensive history is an acute coronary syndrome by default, and the default is antithrombotic — the drug you would least like to have given a dissecting aorta. What actually moved this was repeating an examination that had been normal: four millimetres of inter-arm difference became thirty-six, and an arm, a leg and a brain started disagreeing at once. The scan has not resulted. This ends the example, not the evaluation.' };
  }
  if (patient.initialReviewedAtTick === null) {
    return { id: 'initial', focus: 'monitor', progress: 0.1,
      action: 'review-aortic-initial-pattern', narration: narrate(patient) };
  }
  if (patient.evolutionReviewedAtTick === null) {
    return { id: 'evolution', focus: 'monitor', progress: 0.27,
      action: 'repeat-aortic-asymmetry-exam', narration: narrate(patient) };
  }
  if (patient.escalatedAtTick === null) {
    return { id: 'escalate', focus: 'actions', progress: 0.45,
      action: 'activate-aortic-pathway', narration: narrate(patient) };
  }
  if (patient.antiImpulseAtTick === null) {
    return { id: 'impulse', focus: 'actions', progress: 0.62,
      action: 'record-aortic-anti-impulse-intent', narration: narrate(patient) };
  }
  if (patient.imagingAtTick === null) {
    return { id: 'imaging', focus: 'actions', progress: 0.79,
      action: 'prioritize-aortic-imaging', narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'monitor', progress: 0.92,
    action: 'repeat-and-handoff-aortic-evolution', narration: narrate(patient) };
}
