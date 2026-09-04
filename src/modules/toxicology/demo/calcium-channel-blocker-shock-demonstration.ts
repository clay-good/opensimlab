import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsCalciumChannelBlocker, type CalciumChannelBlockerAction, type CalciumChannelBlockerProgress,
} from '../calcium-channel-blocker-shock';
import { calciumChannelBlockerInlinePrompt } from '../tutor/calcium-channel-blocker-shock-guidance';


/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: CalciumChannelBlockerProgress): string {
  const prompt = calciumChannelBlockerInlinePrompt('guided', { scenarioVersion: '0.1.0', calciumChannelBlocker: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const CALCIUM_CHANNEL_BLOCKER_DEMONSTRATION_VERSION = '0.1.0';

export function supportsCalciumChannelBlockerDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsCalciumChannelBlocker(scenario);
}

export interface CalciumChannelBlockerDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: CalciumChannelBlockerAction; readonly finished?: boolean;
}

/**
 * The worked example for a shock with two mechanisms and a clock that has not
 * finished running.
 *
 * Three numbers here are dramatic enough to be answered on their own — a
 * complete block at 34, a glucose of 238, a MAP of 47 — and this example
 * refuses all three closures in one beat, because the poor contraction and the
 * low vascular tone are separate problems and pacing would leave both. It keeps
 * saying "extended release" with the clock beside it, and it finishes on a good
 * forty-five minutes described as a checkpoint inside an ingestion that is
 * still arriving. It selects no product, dose, rate, target, access, airway,
 * pacing, decontamination, lipid, methylene blue, or extracorporeal support.
 */
export function calciumChannelBlockerDemonstrationStep(
  patient?: CalciumChannelBlockerProgress,
): CalciumChannelBlockerDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He is handed on better than he was, in the middle of an ingestion that is still arriving, on a treatment whose own effects are the next thing to watch. Nothing was proven and nothing was excluded. This ends the example, not the poisoning.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-toxicology-calcium-channel-blocker-product-formulation-clock-perfusion-rhythm-glucose-and-whole-patient',
      narration: 'Say the words “extended release” out loud, with the clock beside them. Five hours after an extended-release diltiazem ingestion, drowsy but answering, MAP 47, an escape rhythm at 34, warm extremities, glucose 238. The formulation is not a detail of the history — it is the reason nothing here can be assumed to have peaked.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'actions', progress: 0.24, action: 'recognize-toxicology-calcium-channel-blocker-mixed-shock-pattern-without-glucose-or-pulse-only-closure',
      narration: 'Name this as two problems at once, before reading another number. Poor global contraction and low systemic vascular tone are both present, so answering either half alone leaves the other — and pacing the complete block would capture the rhythm while leaving both. The glucose of 238 supports the pattern rather than grading him. Closing on the glucose, on the pulse, or on the block is the same mistake three ways.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.4, action: 'activate-toxicology-calcium-channel-blocker-poison-center-resuscitation-cardiac-metabolic-airway-and-safety-ownership',
      narration: narrate(patient) };
  }
  if (patient.evidenceAtTick === null) {
    return { id: 'evidence', focus: 'monitor', progress: 0.56, action: 'review-toxicology-calcium-channel-blocker-supplied-ecg-perfusion-contractility-glucose-electrolyte-prior-care-and-rescue-boundary',
      narration: 'Read the contractility and the tone as separate findings, and put the absorption clock next to both. Complete AV block with an atrial rate of 78, QRS 104 ms, poor global contraction, low vascular tone, glucose 238, lactate 4.6, pH 7.29. That atropine and a first vasopressor failed is information rather than a gap, and an extended-release preparation five hours in means the dose is still arriving — so what refractory rescue would mean, and who decides it, belongs here rather than at the arrest.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'report', focus: 'monitor', progress: 0.76, action: 'record-toxicology-calcium-channel-blocker-bounded-qualified-vasopressor-calcium-insulin-euglycemia-and-rescue-intent-with-strict-later-review',
      narration: 'Record the vasopressor, calcium, insulin-euglycemia and refractory-rescue intents as intents, let the authored interval pass, and read the qualified team’s 45-minute report. The interval is a contrast rather than a required wait, and nothing here says how any individual poisoning answers.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-toxicology-calcium-channel-blocker-recurrent-shock-av-block-hyperglycemia-electrolyte-volume-rescue-and-active-risk',
    narration: 'Sinus at 64, MAP 71, lactate 3.0, clearer mentation — none of which proves the treatment did it or that the perfusion will hold. Glucose 176 and potassium 3.4 are the therapy showing up in the chart. And the absorption is not complete, so hand off recurrent shock, returning AV block, the electrolytes, volume overload, the rescue question and his safety as live.' };
}
