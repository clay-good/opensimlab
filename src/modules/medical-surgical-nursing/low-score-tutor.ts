import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { LowScoreSnapshot } from '@platform/kernel/protocol';

export const LOW_SCORE_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link
 * built from a citation is a guess rather than a lookup. The tray already sends
 * a reader to the source view, which shows the declared citations in full.
 */

/**
 * Observed-state guidance for a score that is right and a conclusion that is not.
 *
 * Nothing in this lesson is done incorrectly. The observations are real, the
 * arithmetic is right, and the score is 2. What goes wrong is the sentence after
 * it, where "below the threshold" becomes "excluded". So the prompts never argue
 * about how likely infection is, and never hint at what the cultures will grow —
 * the learner has not seen them and neither has the nurse. They ask what the
 * instrument collects, what it does not, and which of those the family report is.
 */
export function lowScoreInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly lowScore?: LowScoreSnapshot;
}) {
  const patient = input.lowScore;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.observationsRecordedAtTick === null) return prompt('low-score-observations', true,
    'Record the observations and the score exactly as they are.',
    'The score is 2 and it is 2 correctly. Starting from the true number is what makes the disagreement that follows a clinical one rather than an argument about the chart.');
  if (patient.exclusionsRecordedAtTick === null) return prompt('low-score-exclusions', true,
    'Record what this score does not exclude.',
    'A screening instrument tuned to catch most people is not a test that clears this one. Its own validation reports that a score below the threshold cannot definitively rule sepsis out, and writing that down is what stops the number being read as an answer.');
  if (!patient.familyConcernRaised) return prompt('low-score-listen', false,
    'Keep listening. Nothing in the chart is going to change.',
    'The observations are stable by construction and the score will not move. What is available here is the account of someone who knows this patient, and this authored interval is a contrast rather than a required clinical wait.');
  if (patient.familyReportRecordedAtTick === null) return prompt('low-score-family', true,
    'Record what the daughter said, in the words she used.',
    'She cannot name a sign, which is exactly why the instrument has no field for it. Converting "she is not herself" into a number would invent the observation the score is missing rather than record the one you have.');
  if (patient.escalationAtTick === null) return prompt('low-score-escalate', true,
    'Ask for review on the concern, not on the threshold.',
    'The reason can be the true one: the score is below the trigger, the observations are unremarkable, and there is a change nobody can account for. The protocol’s own guidance is that clinical concern overrides a low score, so this is not a breach of it.');
  if (patient.boundariesReviewedAtTick === null) return prompt('low-score-boundaries', true,
    'Review what the instrument was built to do.',
    'It is a screen rather than a diagnostic test; about a third of older adults with serious infection are not febrile; and a rate-controlling medication blunts the tachycardia the score partly relies on. None of that makes the score useless, and all of it bounds what a low one means.');
  if (patient.monitoringAtTick === null) return prompt('low-score-monitor', true,
    'Shorten the observation interval while the review is awaited.',
    'Because concern has been recorded, not because the score changed — and the record should say which. An interval chosen by the number is a decision the number made.');
  if (!patient.reviewArrived) return prompt('low-score-await', false,
    'Continue the increased observation and keep the concern current.',
    'The review arrives when it arrives; this authored delay predicts no real response time. Nothing arrives on its own in this lesson, which is the point — it only happens because somebody called.');
  if (!patient.reviewObserved) return prompt('low-score-reassess', true,
    'Take a current full assessment now the review has happened.',
    'The earlier assessment predates it. What has changed is not the observations, which are the same, but what the record can now say about them.');
  return prompt('low-score-handoff', false,
    'Hand off the concern with the score as calculated.',
    'A rising score, a fever, and a confirmed organism are not handoff gates. What travels is the true number, what it does not exclude, the family’s words, and that the call was made on concern.');
}
