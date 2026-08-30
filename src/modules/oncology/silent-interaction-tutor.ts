import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { SilentInteractionSnapshot } from '@platform/kernel/protocol';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link
 * built from a citation is a guess rather than a lookup. The tray already sends a
 * reader to the source view, which shows the declared citations in full.
 */

/**
 * Observed-state guidance for a harm with nothing to find.
 *
 * Everything about her is normal, and it will stay normal, because the harm here
 * is a drug not being absorbed rather than a drug causing something. Three of the
 * four refused shortcuts are ways of letting that absence settle the question, and
 * the fourth is the opposite overreach — telling her to stop a tablet somebody
 * else prescribed. So the prompts point at what is knowable without a finding:
 * what she is actually taking, which way the interaction runs, and who owns the
 * decision that follows.
 */
export function silentInteractionInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly silentInteraction?: SilentInteractionSnapshot;
}) {
  const patient = input.silentInteraction;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.reconciledAtTick === null) return prompt('silent-interaction-reconcile', true,
    'Reconcile what she is actually taking, not what a list says.',
    'The lists disagree with each other, and the one thing none of them is doing is describing her. What she takes is answerable by asking her.');
  if (patient.directionRecordedAtTick === null) return prompt('silent-interaction-direction', true,
    'Record the interaction and which way it runs.',
    'The direction is the whole finding. A drug whose absorption is reduced produces nothing to see, which is why nothing being wrong is not evidence that nothing is happening.');
  if (patient.escalationAtTick === null) return prompt('silent-interaction-escalate', true,
    'Tell her treating team now rather than writing it down.',
    'A note is not a handover. Whether the acid suppression is still needed, and whether something without this interaction would do instead, is a decision somebody has to actually make.');
  if (patient.treatmentIntentAtTick === null) return prompt('silent-interaction-intent', true,
    'Record bounded intent and instruct her to change nothing.',
    'Telling her to stop a tablet is prescribing, and it is not yours to do. She is also entitled to keep taking what she was told to take until somebody who owns it says otherwise.');
  if (patient.boundariesReviewedAtTick === null) return prompt('silent-interaction-boundaries', true,
    'Review what this lesson does not settle.',
    'No level is measurable here, no effect on her treatment is demonstrable, and the absence of both is the situation rather than a reassurance.');
  if (!patient.pharmacyRecordArrived) return prompt('silent-interaction-observe', false,
    'Wait for the dispensing record before deciding the lists agree.',
    'This authored interval is a contrast rather than a required clinical wait. What arrives is a third version, which is the ordinary state of a medication list.');
  if (!patient.teamResponded) return prompt('silent-interaction-hold', false,
    'Keep the reconciliation rather than any single list.',
    'Three records, no two the same, and she is the only source describing what she swallows. Nothing has become abnormal while you waited, and nothing was going to.');
  if (!patient.teamObserved) return prompt('silent-interaction-reassess', true,
    'Take a current assessment now that her team has taken it.',
    'It will be normal, and that is worth recording rather than skipping: the handover is that a normal patient has a real problem, which is harder to pass on than an abnormal one.');
  return prompt('silent-interaction-handoff', false,
    'Hand off with nothing abnormal and something to do.',
    'A measurable level, a demonstrated effect and a changed prescription are not handoff gates. What travels is what she takes, which way the interaction runs, and who now owns it.');
}
