import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { LoweringTheCountSnapshot } from '@platform/kernel/protocol';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link
 * built from a citation is a guess rather than a lookup. The tray already sends a
 * reader to the source view, which shows the declared citations in full.
 */

/**
 * Observed-state guidance for a number that can be moved.
 *
 * Leukostasis is a clinical diagnosis, and the count is the part of it that is
 * easiest to change and least worth watching. Both refused shortcuts here are
 * ways of substituting the number for the patient: making the diagnosis from the
 * count, and sending him for apheresis as though lowering it were the endpoint. So
 * no prompt below treats the count as the thing to act on or to wait for, and the
 * escalation prompt comes second rather than last, because he is getting worse
 * while the paperwork order would still be tidy.
 */
export function loweringTheCountInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly loweringTheCount?: LoweringTheCountSnapshot;
}) {
  const patient = input.loweringTheCount;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.pictureRecordedAtTick === null) return prompt('lowering-the-count-picture', true,
    'Record the clinical picture rather than the count.',
    'Leukostasis is a clinical diagnosis. The count is one input to it and the only part that a treatment can move quickly, which makes it the least reliable thing to follow.');
  if (patient.escalationAtTick === null) return prompt('lowering-the-count-escalate', true,
    'Call haematology now, before the rest is written up.',
    'He is deteriorating on the clinical picture you have already got. Nothing further you record changes who needs to be here, and the marrow will not arrive before he does worse.');
  if (patient.licenceRecordedAtTick === null) return prompt('lowering-the-count-licence', true,
    'Record what the count does and does not license.',
    'It supports urgency and it does not by itself make the diagnosis or authorise a procedure. Stating both halves is what stops the number being read as either a threshold or a treatment plan.');
  if (patient.treatmentIntentAtTick === null) return prompt('lowering-the-count-intent', true,
    'Record bounded cytoreduction intent and start nothing.',
    'The strategy, the transfusion decisions and any procedure belong to the team that is coming. Recording that they may choose is not choosing.');
  if (patient.boundariesReviewedAtTick === null) return prompt('lowering-the-count-boundaries', true,
    'Review what this lesson does not settle.',
    'No marrow result, no confirmed subtype, and no procedure decision is available here, and none of them is needed to recognise that he is worse than he was.');
  if (!patient.teamResponded) return prompt('lowering-the-count-observe', false,
    'Keep watching him rather than the count.',
    'He is more breathless and harder to rouse than twenty minutes ago while the number on the film has not moved. The patient is the part that changed.');
  if (!patient.teamObserved) return prompt('lowering-the-count-reassess', true,
    'Take a current assessment now that haematology has answered.',
    'The earlier assessment predates both their answer and his deterioration. What they need is the clinical trajectory, which is the half a count cannot carry.');
  return prompt('lowering-the-count-handoff', false,
    'Hand off with the diagnosis clinical and the strategy theirs.',
    'A marrow result, a lowered count, and a chosen procedure are not handoff gates. What travels is the picture, how it moved, and what the count does and does not license.');
}
