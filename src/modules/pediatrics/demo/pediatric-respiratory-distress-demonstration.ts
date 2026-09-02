import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPediatricRespiratoryDistress, type PediatricRespiratoryDistressAction,
  type PediatricRespiratoryDistressProgress,
} from '../pediatric-respiratory-distress';

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
      narration: 'Look at the whole child, and let no single number speak for her. She is six, twenty kilos, previously well, and eighteen hours into a cough. She is awake and anxious, sitting upright, speaking in short phrases, with nasal flaring, grunting and marked intercostal and subcostal recession, and equally reduced air entry on both sides. Heart rate 138, respiratory rate 46, saturation 87% on air with a clean pleth, warm extremities, strong pulses, refill of two seconds. The grunting and the flaring are doing as much work in that picture as the 87% is. All of it is supplied — you are not examining her and not measuring anything.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.28, action: 'activate-pediatric-respiratory-distress-support',
      narration: 'Get experienced pediatric help and qualified oxygenation started now. Experienced help, oxygenation delivered by people qualified to choose it, continuous monitoring, and rescue readiness standing by — as one step, because in a child this is one step. None of the specifics are yours: no device, flow, fraction or target is selected here, nothing is delivered by you, and no airway maneuver, drug, fluid or procedure is performed. What you are recording is that the right people and the right monitoring are around her before anything else is decided.' };
  }
  if (patient.earlyResponseAtTick === null) {
    return { id: 'early', focus: 'monitor', progress: 0.46, action: 'review-pediatric-respiratory-distress-early-response',
      narration: 'Let time pass, then look at her again rather than at the monitor. The early report is fixed and cannot be read before simulated time has passed. When you read it, read the child: her mentation, her effort, her speech, her air entry, and the saturation as one of several things rather than the headline. This lesson will offer you a comfortable reading of that report, and the whole point is to notice what the comfortable reading leaves out.' };
  }
  if (patient.laterPanelAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.64, action: 'review-pediatric-respiratory-distress-later-panel',
      narration: 'Allow more time, then open the later panel and read it carefully. It is fixed and strictly later, and it is where this lesson turns. Look at mentation, effort, air movement, rate and oxygenation together, and ask which direction they are moving as a group rather than one at a time. A child who is getting better and a child who is running out of strength can produce some of the same numbers, and the difference is visible only in the whole picture.' };
  }
  if (patient.rescueAtTick === null) {
    return { id: 'rescue', focus: 'actions', progress: 0.8, action: 'activate-pediatric-respiratory-failure-rescue',
      narration: 'She has a pulse and she is not breathing adequately. Escalate now. Airway-capable pediatric rescue ownership, activated on the pattern rather than on an arrest that has not happened. Spontaneous breathing and a pulse are exactly the conditions in which this is still preventable, and the window for that is the one she is in now. Activating the pathway is not performing it: nothing here intubates, ventilates, gives a drug or a fluid, or performs a procedure — the people who own those are the people you are calling.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-pediatric-respiratory-distress-reassessment',
    narration: 'Hand off a child who is still deteriorating. What travels is her baseline and the eighteen hours before this, the whole-child pattern rather than any single number, what support was activated and when, both reviews and the direction between them, the fatigue that the falling rate actually represents, the causes that stay open — infection, airway disease, aspiration, anaphylaxis, metabolic drive and others the absent findings do not exclude — and who owns the airway if she stops managing. Nothing here diagnoses a cause, proves recovery, decides disposition or prognosis, or predicts an outcome.' };
}
