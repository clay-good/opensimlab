import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EasyLabelSnapshot } from '@platform/kernel/protocol';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link
 * built from a citation is a guess rather than a lookup. The tray already sends a
 * reader to the source view, which shows the declared citations in full.
 */

/**
 * Observed-state guidance for a label that fits too easily.
 *
 * The danger is not that the label is wrong. It may well be right, and it fits so
 * neatly that nobody excludes anything — which is the one thing a diagnosis of
 * exclusion requires. Two of the refused shortcuts reason from a single feature to
 * the label and away from it, and a third acts on it before anything is ruled out.
 * So the prompts never argue about how likely it is. They ask what has not been
 * excluded, and they hold that evaluation and treatment start together rather than
 * in a queue.
 */
export function easyLabelInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly easyLabel?: EasyLabelSnapshot;
}) {
  const patient = input.easyLabel;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.exclusionRecordedAtTick === null) return prompt('easy-label-exclusion', true,
    'Record that this label is a diagnosis of exclusion.',
    'Writing that down is what makes the next question obligatory. A label that fits this well is one nobody checks, and the checking is the definition rather than an extra.');
  if (patient.escalationAtTick === null) return prompt('easy-label-escalate', true,
    'Escalate so evaluation and treatment can start together.',
    'They are not a queue. Sequencing them turns a concurrent workup into a delay in one direction or an untested treatment in the other, and both are avoidable by making one call now.');
  if (patient.outstandingRecordedAtTick === null) return prompt('easy-label-outstanding', true,
    'Record what has not been excluded, by name.',
    'Not "infection screen pending" — which organisms, which samples, and what in his own record raises them. A list of names is checkable and a category is not.');
  if (patient.treatmentIntentAtTick === null) return prompt('easy-label-intent', true,
    'Record bounded treatment intent and start nothing.',
    'Whether immunosuppression begins, when, and against what result is the decision of the teams you have called. Starting it here is acting on the label you have just written down as unconfirmed.');
  if (patient.boundariesReviewedAtTick === null) return prompt('easy-label-boundaries', true,
    'Review what this lesson does not settle.',
    'No result is available here and no grade is assigned. The absence of fever is not a result, and neither is the number of cycles he has had.');
  if (!patient.historySurfaced) return prompt('easy-label-observe', false,
    'Look in his own record while the samples are arranged.',
    'This authored interval is a contrast rather than a required clinical wait. The record you already hold is the cheapest place left to look.');
  if (!patient.teamResponded) return prompt('easy-label-hold', true,
    'Add the recent admission to what has not been excluded.',
    'A course of antibiotics three weeks ago is in his own notes and was never opened in this clinic. It does not make the label wrong; it makes it one of at least two things, which is exactly what a diagnosis of exclusion is for.');
  if (!patient.teamObserved) return prompt('easy-label-reassess', true,
    'Take a current assessment now that both teams are on it.',
    'The earlier assessment predates their answer and the history you found. What they own is the samples and the treatment decision, and both need the current picture.');
  return prompt('easy-label-handoff', false,
    'Hand off with the label unconfirmed and the alternatives named.',
    'A confirmed diagnosis, a negative screen, and a started treatment are not handoff gates. What travels is that the label is one of exclusion, what remains unexcluded, and who owns the samples.');
}
