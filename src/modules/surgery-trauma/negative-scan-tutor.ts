import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { NegativeScanSnapshot } from '@platform/kernel/protocol';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link
 * built from a citation is a guess rather than a lookup. The tray already sends a
 * reader to the source view, which shows the declared citations in full.
 */

/**
 * Observed-state guidance for a scan that cannot say no.
 *
 * The hard part of this lesson is that the learner is being pulled in two directions by
 * two correct facts, and the prompts must not resolve it by naming the diagnosis. So they
 * never say "this is a leak" and never say "this is not". They keep asking the only
 * question the learner can actually answer from what is in front of them: is he following
 * the course his own operation predicts? Everything else — what the scan meant, whether to
 * re-image, whether to reoperate — is returned to the people who made the anastomosis.
 */
export function negativeScanInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly negativeScan?: NegativeScanSnapshot;
}) {
  const patient = input.negativeScan;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.operativeCourseRecordedAtTick === null) return prompt('negative-scan-course', true,
    'Record the operation and what it predicts by day five.',
    'Every observation on this chart is abnormal against something, and the something is his own operation. Without that written down, a heart rate of 110 is a number with nothing to be abnormal against.');
  if (patient.progressRecordedAtTick === null) return prompt('negative-scan-progress', true,
    'Record the divergence, and record how long it has run.',
    'No flatus, not eating, more analgesia than yesterday, and 36 hours above 100 is one finding, not four. Any one of them alone carries a positive predictive value of 4 to 11 percent; together, with a duration, they are a different statement.');
  if (patient.scanLimitsRecordedAtTick === null) return prompt('negative-scan-limits', true,
    'Write down what the report does and does not exclude.',
    'It says no evidence of a leak, which is not the same sentence as no leak. The published negative predictive values are 0.70 and 88 percent, and the free fluid and free gas it describes are compatible with day five and with a leak.');
  if (patient.escalationAtTick === null) return prompt('negative-scan-escalate', true,
    'Ring the team that made the anastomosis.',
    'Not to ask radiology to look again, and not for permission. They hold the operative findings, they know what they left behind, and the decision that follows this is theirs rather than yours.');
  if (patient.surgicalIntentAtTick === null) return prompt('negative-scan-intent', true,
    'Record bounded intent and select nothing.',
    'Re-imaging, looking directly, and going back to theatre are all theirs. Writing down that those decisions exist and belong to somebody else is not making them.');
  if (patient.boundariesReviewedAtTick === null) return prompt('negative-scan-boundaries', true,
    'Review what these numbers do not settle.',
    'Three single-centre studies pointing two ways, with small numerators, and the two imaging series disagreeing with each other by fourteen points. They tell you the shape of the problem. None of them is about this abdomen.');
  if (!patient.roundCompleted) return prompt('negative-scan-observe', false,
    'Watch the interval rather than the monitor.',
    'This authored gap is a contrast, not a clinical wait — the call is already made. What is worth noticing is that nothing changes, because a patient like this does not announce himself.');
  if (!patient.teamResponded) return prompt('negative-scan-hold', true,
    'Hold the position while nothing happens.',
    'The observations are the same, he has vomited once, and he still has not passed flatus. That is not reassurance and it is not deterioration. It is the same divergence, one round longer, which is the only thing this patient was ever going to give you.');
  if (!patient.teamObserved) return prompt('negative-scan-reassess', true,
    'Take a current assessment now they have answered.',
    'Your last one predates their reply and the repeat round. They own the re-imaging and the theatre decision, and both are made on the current picture rather than the one from before you called.');
  return prompt('negative-scan-handoff', false,
    'Hand off the trajectory, not the numbers.',
    'A confirmed leak, a repeat scan and a decision about theatre are not handoff gates. What travels is the operation, the course he has stopped following, and what the report could not rule out.');
}
