import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { CompleteHeartBlockProgress } from '../complete-heart-block';

export const COMPLETE_HEART_BLOCK_TUTOR_VERSION = '0.1.0';

export interface CompleteHeartBlockPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is stability. She looks well, and the previous
 * lesson in this module rewarded exactly that observation with an outpatient
 * plan — here the same observation is a reason to move faster rather than
 * slower, because the escape rhythm keeping her well is the part that can
 * stop. The middle pair is unordered because the two things genuinely run in
 * parallel, and the tutor says so rather than naming an order. It is silent on
 * the unassisted setting, silent once the handoff is recorded, and silent for
 * any scenario version it was not written against.
 */
export function completeHeartBlockInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: CompleteHeartBlockProgress },
): CompleteHeartBlockPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.stabilityAtTick === null) return prompt('chb-stability', true,
    'Two rhythms, one patient. Say what the report actually shows before anything else.',
    'A seventy-six-year-old woman referred after two brief presyncopal episodes, and a fixed diagnostic report of complete atrioventricular block: atria at 82, a regular wide ventricular escape at 34, P waves marching independently through the QRS complexes, and a QRS of 146 ms. That is not a slow sinus rhythm, and the difference matters more than the rate does — her atria and her ventricles have stopped talking to each other, and what is keeping her perfused is an escape rhythm. She has a palpable pulse, 116/70, 98% on air, and she is alert and warm, with no current hypotension, altered mentation, shock, ischemic discomfort, acute heart failure or syncope. She is stable now. Recording that is not the same as calling the block low risk.');
  if (patient.contextAtTick === null && patient.pathwayAtTick === null) return prompt('chb-parallel', true,
    'Two things need doing and they do not queue. Start with either.',
    'One is the cause: whether anything reversible is driving this. The other is getting her somewhere pacing-capable with the people who do this. The engine refuses the reassessment until both have landed and does not care which came first, because in a real unit they happen at the same time — the escalation is not a reward for finishing the workup, and the workup is not a reason to delay the phone call. If you find yourself wanting to complete one before starting the other, that instinct is the one this lesson is built to interrupt.');
  if (patient.contextAtTick === null) return prompt('chb-context', true,
    'Escalation is running. Now go looking for a cause — and be careful what you conclude from not finding one.',
    'The fixed initial record reports no AV-nodal-blocking medication, no drug toxicity, no hypothermia, no electrolyte or thyroid explanation and no acute STEMI pattern. That is a panel that came back unremarkable, and the mistake available here is to read it as an answer. Ischemic, infectious — including Lyme disease, where the epidemiology matters and the block can be reversible — inflammatory, toxic, structural and post-procedural contributors are all still open. A reversible cause changes what happens next completely, so the review continues rather than closing. The panel did not prove absence; it just did not find anything yet.');
  if (patient.pathwayAtTick === null) return prompt('chb-pathway', true,
    'The cause is under review. Do not let that hold up the escalation.',
    'What gets recorded is continuous rhythm, pulse, pressure and oximetry monitoring; access readiness; pads and external backup availability; cardiology and electrophysiology consultation; pacing-capable care; and the triggers that would change everything — hypotension, altered mentation, shock, ischemic discomfort, acute heart failure, syncope, escape failure or a lost pulse. You give no oxygen she does not need, no atropine, no drug, and you pace nothing. The reason this cannot wait for instability is the escape rhythm itself: it is what is keeping her alert and warm at 34, it is not reliable, and if it fails you want to already be in the room that can do something about it.');
  if (patient.reassessmentAtTick === null) return prompt('chb-reassessment', true,
    'Let time pass, then look again — and expect nothing to have changed.',
    'At the later check the fixed report is the same: complete block, escape at 34, a palpable pulse, 116/70, alert, warm, 98% on air. Recording an uneventful reassessment feels like bookkeeping and is the opposite. An hour of stability is the thing most likely to talk a team out of the urgency it correctly felt at the start, and nothing in that hour has restored conduction. Nothing here is paced, no rhythm is captured, and no treatment is delivered — what elapsed time establishes is persistence, not resolution.');
  return prompt('chb-handoff', true,
    'Hand off a pacing evaluation, an owner, and the causes still open.',
    'Acquired complete AV block with no identified reversible or physiologic cause is what guideline-supported permanent-pacing evaluation exists for, and that is what gets recorded — the evaluation, the shared goals and tradeoffs, her current perfusion, the causes that are still open, the monitored contingency, named owners and the acute-change triggers. What does not get recorded is a conclusion: no eligibility adjudication, no device, no mode, no lead, no implant, no programming, no capture claim, no disposition, no promised benefit and no outcome. Nothing in this lesson examines her, acquires or interprets an ECG, monitor, laboratory or imaging result, diagnoses a cause, delivers oxygen, atropine, medication or an infusion, paces, selects a rate, current, energy, sedation or device, assesses capture, implants or programs anything, determines disposition or prognosis, or predicts outcome.');
}
