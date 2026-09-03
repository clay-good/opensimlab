import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPediatricRespiratoryDistress, type PediatricRespiratoryDistressAction,
  type PediatricRespiratoryDistressProgress,
} from '../pediatric-respiratory-distress';
import { pediatricRespiratoryDistressInlinePrompt } from '../tutor/pediatric-respiratory-distress-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: PediatricRespiratoryDistressProgress): string {
  const prompt = pediatricRespiratoryDistressInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const PEDIATRIC_RESPIRATORY_DISTRESS_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPediatricRespiratoryDistressDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPediatricRespiratoryDistress(scenario);
}

export interface PediatricRespiratoryDistressDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PediatricRespiratoryDistressAction; readonly finished?: boolean;
}

/**
 * The worked example for a child whose respiratory rate is about to fall for
 * the wrong reason.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. The example takes none of the four refusals. It examines
 * nobody, diagnoses nothing, orders and interprets no test, selects no
 * device, flow, fraction, target, drug, dose or fluid, performs no airway
 * maneuver, intubation or procedure, and decides no disposition: it
 * recognizes, escalates, reads both reviews, and escalates again.
 */
export function pediatricRespiratoryDistressDemonstrationStep(
  patient?: PediatricRespiratoryDistressProgress,
): PediatricRespiratoryDistressDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'An airway-capable team is with her, the falling rate has been named as fatigue rather than filed as improvement, and the causes are all still open for somebody to work through. Nothing here diagnoses her, proves she recovers, or predicts how this ends. This ends the example, not the evaluation.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'monitor', progress: 0.1, action: 'reconcile-pediatric-respiratory-distress-whole-child',
      narration: narrate(patient) };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.28, action: 'activate-pediatric-respiratory-distress-support',
      narration: narrate(patient) };
  }
  if (patient.earlyResponseAtTick === null) {
    return { id: 'early', focus: 'monitor', progress: 0.46, action: 'review-pediatric-respiratory-distress-early-response',
      narration: narrate(patient) };
  }
  if (patient.laterPanelAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.64, action: 'review-pediatric-respiratory-distress-later-panel',
      narration: narrate(patient) };
  }
  if (patient.rescueAtTick === null) {
    return { id: 'rescue', focus: 'actions', progress: 0.8, action: 'activate-pediatric-respiratory-failure-rescue',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-pediatric-respiratory-distress-reassessment',
    narration: narrate(patient) };
}
