import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { DelayedImmuneEventSnapshot } from '@platform/kernel/protocol';

/**
 * These prompts carry no external link, deliberately.
 *
 * The renal and endocrine tutors each link a specific guideline document whose
 * exact URL somebody checked. For this lesson the scenario declares its sources as
 * full citations without URLs, and a link constructed from a citation is a guess:
 * a journal's DOI pattern is not a substitute for having looked the article up.
 * Shipping an unverified identifier in a project whose whole claim is that every
 * number traces to a checkable source would be the kind of error its corrections
 * log exists to record, so the prompts point at nothing rather than at something
 * plausible. The tray already sends a reader to the source view, which shows the
 * declared citations in full.
 */
/**
 * Observed-state guidance for a drug that stopped months ago.
 *
 * The tray states the exposure plainly from the first screen, because this lesson
 * is not a hunt for a hidden fact. What is hard is what to DO with a fact that is
 * fully visible: treat a finished course as current history, refuse the elapsed
 * interval as an exclusion, run infection evaluation alongside rather than ahead,
 * and return the problem to the service holding the treatment record.
 *
 * So the prompts read the learner's own recorded steps and push on that sequence.
 * What they must never supply is the far end — the diagnosis, the grade, or the
 * treatment — because those belong to the qualified team, and a tutor that named
 * them would be answering the question the scenario deliberately leaves open.
 */
export function delayedImmuneEventInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly delayedImmuneEvent?: DelayedImmuneEventSnapshot;
}) {
  const patient = input.delayedImmuneEvent;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.exposureRecordedAtTick === null) return prompt('delayed-immune-event-exposure', true,
    'Take the treatment history back past what the current medication list holds.',
    'A medication list records what is being given now. A course that finished leaves it, and leaves the referral letter with it, while remaining the most important exposure in the history. Ask what has been given, not what is being given.');
  if (patient.courseRecordedAtTick === null) return prompt('delayed-immune-event-course', true,
    'Record the symptom course against this patient’s own baseline.',
    'A stool count without a baseline and a course without a start date support nothing. What is decidable is frequency above this patient’s normal and how long it has been climbing.');
  if (patient.infectionEvaluationAtTick === null) return prompt('delayed-immune-event-infection', true,
    'Record infection evaluation as running alongside, not ahead.',
    'Guidance is to seek other causes while treatment for an immune-related event is initiated as clinically appropriate. Sequencing the two turns a concurrent evaluation into a delay.');
  if (!patient.courseProgressed) return prompt('delayed-immune-event-observe-course', false,
    'Keep counting against the baseline while the picture is still ordinary.',
    'The observations barely move in this presentation, which is the difficulty rather than a reassurance. An authored contrast follows; it is not a required clinical wait.');
  if (patient.escalationAtTick === null) return prompt('delayed-immune-event-escalate', true,
    'Contact the service that gave the drug.',
    'They hold the treatment record, the grading, and every treatment decision. This is not asking permission; it is returning the problem to the people who own it, which is the step that has not happened yet.');
  if (patient.treatmentIntentAtTick === null) return prompt('delayed-immune-event-intent', true,
    'Record bounded intent and administer nothing.',
    'Whether corticosteroid treatment begins, at what grade, and whether endoscopy follows belong to the qualified team. Recording that they may decide is not the same as deciding.');
  if (patient.boundariesReviewedAtTick === null) return prompt('delayed-immune-event-boundaries', true,
    'Review what the supplied series can and cannot tell you.',
    'Twenty-three collected cases give a median interval, not an incidence. They cannot say how often this happens or how likely it is here, and the fatality figures quoted for this class were collected on a different drug.');
  if (patient.observation === null) return prompt('delayed-immune-event-assess', true,
    'Take a current full assessment rather than a partial check.',
    'Observations alone supply no history, and a history check supplies no observations. The handoff needs both together and current.');
  if (!patient.serviceResponded) return prompt('delayed-immune-event-observe-service', false,
    'Wait for the service you contacted rather than working around them.',
    'Nobody arrives uncontacted in this lesson. The authored interval is a contrast, and nothing about it establishes a diagnosis, a grade, or a response.');
  if (!patient.serviceObserved) return prompt('delayed-immune-event-reassess', true,
    'Take a fresh assessment now that the service has answered.',
    'The earlier assessment predates their answer. A handoff carrying a stale picture asks the receiving team to act on findings nobody has just looked at.');
  return prompt('delayed-immune-event-handoff', false,
    'Hand off with the diagnosis and the grade still open.',
    'What travels is the exposure with its interval, the course against baseline, that infection evaluation runs alongside, and the bounded intent. A confirmed grade, a negative stool result, and an endoscopy are not handoff gates.');
}
