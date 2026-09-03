import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsCompleteHeartBlock, type CompleteHeartBlockAction,
  type CompleteHeartBlockProgress,
} from '../complete-heart-block';

export const COMPLETE_HEART_BLOCK_DEMONSTRATION_VERSION = '0.1.0';

export function supportsCompleteHeartBlockDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsCompleteHeartBlock(scenario);
}

export interface CompleteHeartBlockDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: CompleteHeartBlockAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a patient who looks well because of the rhythm that
 * might stop.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. Where the middle pair is unordered the example escalates first
 * and reviews the cause second — a choice, and a deliberate one, because the
 * phone call is the half a learner is more likely to defer. It examines
 * nobody, acquires or interprets no ECG, monitor, laboratory or imaging data,
 * diagnoses no cause, delivers no oxygen, atropine, medication or infusion,
 * paces nothing, selects no rate, current, energy, sedation or device,
 * assesses no capture, implants or programs nothing, determines no
 * disposition, and predicts no outcome.
 */
export function completeHeartBlockDemonstrationStep(
  patient?: CompleteHeartBlockProgress,
): CompleteHeartBlockDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is exactly as well as she was at the start, still in complete block, still perfused by an escape rhythm at 34, with no cause found and nothing paced. What changed is that she is now in a room that can act if the escape stops, and somebody owns the evaluation. Stability was never the reassuring part. This ends the example, not the evaluation.' };
  }
  if (patient.stabilityAtTick === null) {
    return { id: 'stability', focus: 'monitor', progress: 0.12, action: 'reconcile-complete-heart-block-stability',
      narration: 'Two rhythms, one patient. Say what the report actually shows before anything else. A seventy-six-year-old woman referred after two brief presyncopal episodes, and a fixed diagnostic report of complete atrioventricular block: atria at 82, a regular wide ventricular escape at 34, P waves marching independently through the QRS complexes, and a QRS of 146 ms. That is not a slow sinus rhythm, and the difference matters more than the rate does — her atria and her ventricles have stopped talking to each other, and what is keeping her perfused is an escape rhythm. She has a palpable pulse, 116/70, 98% on air, and she is alert and warm, with no current hypotension, altered mentation, shock, ischemic discomfort, acute heart failure or syncope. She is stable now. Recording that is not the same as calling the block low risk.' };
  }
  if (patient.pathwayAtTick === null) {
    return { id: 'parallel', focus: 'actions', progress: 0.3, action: 'activate-complete-heart-block-pathway',
      narration: 'Two things need doing and they do not queue. Start with either. One is the cause: whether anything reversible is driving this. The other is getting her somewhere pacing-capable with the people who do this. The engine refuses the reassessment until both have landed and does not care which came first, because in a real unit they happen at the same time — the escalation is not a reward for finishing the workup, and the workup is not a reason to delay the phone call. If you find yourself wanting to complete one before starting the other, that instinct is the one this lesson is built to interrupt.' };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'monitor', progress: 0.5, action: 'review-complete-heart-block-context',
      narration: 'Escalation is running. Now go looking for a cause — and be careful what you conclude from not finding one. The fixed initial record reports no AV-nodal-blocking medication, no drug toxicity, no hypothermia, no electrolyte or thyroid explanation and no acute STEMI pattern. That is a panel that came back unremarkable, and the mistake available here is to read it as an answer. Ischemic, infectious — including Lyme disease, where the epidemiology matters and the block can be reversible — inflammatory, toxic, structural and post-procedural contributors are all still open. A reversible cause changes what happens next completely, so the review continues rather than closing. The panel did not prove absence; it just did not find anything yet.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'reassessment', focus: 'monitor', progress: 0.72, action: 'reassess-complete-heart-block-trajectory',
      narration: 'Let time pass, then look again — and expect nothing to have changed. At the later check the fixed report is the same: complete block, escape at 34, a palpable pulse, 116/70, alert, warm, 98% on air. Recording an uneventful reassessment feels like bookkeeping and is the opposite. An hour of stability is the thing most likely to talk a team out of the urgency it correctly felt at the start, and nothing in that hour has restored conduction. Nothing here is paced, no rhythm is captured, and no treatment is delivered — what elapsed time establishes is persistence, not resolution.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-complete-heart-block-pacing-plan',
    narration: 'Hand off a pacing evaluation, an owner, and the causes still open. Acquired complete AV block with no identified reversible or physiologic cause is what guideline-supported permanent-pacing evaluation exists for, and that is what gets recorded — the evaluation, the shared goals and tradeoffs, her current perfusion, the causes that are still open, the monitored contingency, named owners and the acute-change triggers. What does not get recorded is a conclusion: no eligibility adjudication, no device, no mode, no lead, no implant, no programming, no capture claim, no disposition, no promised benefit and no outcome. Nothing in this lesson examines her, acquires or interprets an ECG, monitor, laboratory or imaging result, diagnoses a cause, delivers oxygen, atropine, medication or an infusion, paces, selects a rate, current, energy, sedation or device, assesses capture, implants or programs anything, determines disposition or prognosis, or predicts outcome.' };
}
