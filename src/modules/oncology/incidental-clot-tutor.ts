import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { IncidentalClotSnapshot } from '@platform/kernel/protocol';

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
 * Observed-state guidance for a decision the evidence cannot make.
 *
 * The trap in this lesson is that both wrong answers feel decisive: treat because
 * a pulmonary embolism is a pulmonary embolism, or do nothing because it is
 * incidental and he feels well. The recommendation is conditional on very low
 * certainty, which is not a weak instruction but an instruction to decide with
 * the patient — so every prompt here pushes toward assembling what the decision
 * needs and toward the people who own it, and none of them says which way to go.
 * A tutor that resolved the uncertainty would be inventing evidence the panel
 * said does not exist.
 */
export function incidentalClotInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly incidentalClot?: IncidentalClotSnapshot;
}) {
  const patient = input.incidentalClot;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.findingRecordedAtTick === null) return prompt('incidental-clot-finding', true,
    'Record the finding and how it came to be found.',
    'A result nobody asked for still has to be owned by someone. How it was found is part of the finding, because it explains why it has reached nobody who can act on it.');
  if (patient.certaintyRecordedAtTick === null) return prompt('incidental-clot-certainty', true,
    'Record the strength and the certainty of the recommendation together.',
    'A conditional recommendation on very low certainty is not a weak instruction. It is an instruction to decide with the patient, and recording it underneath the recommendation instead of alongside it loses exactly that.');
  if (patient.tradeoffRecordedAtTick === null) return prompt('incidental-clot-tradeoff', true,
    'Record the benefit and the harm in the same place.',
    'Either figure alone is a different lesson. Fewer deaths and fewer symptomatic emboli sit beside more major bleeds, all on very uncertain evidence, and the person deciding is entitled to both.');
  if (patient.bleedingRiskRecordedAtTick === null) return prompt('incidental-clot-bleeding-risk', true,
    'Record this patient’s own bleeding risk rather than the population’s.',
    'Recording it is not deciding against treatment. It is putting the number that should decide in front of the people deciding.');
  if (!patient.patientAsked) return prompt('incidental-clot-listen', false,
    'Let him say what he thinks before the referral is written.',
    'The guidance makes his view an input rather than background. An authored moment follows; it is a contrast, not a required clinical wait.');
  if (patient.escalationAtTick === null) return prompt('incidental-clot-escalate', true,
    'Contact the treating service and ask for a decision rather than reporting one.',
    'Whether to anticoagulate, with what, and for how long is theirs. The finding reached this clinic before it reached them, which is the gap that has to close.');
  if (patient.sharedDecisionAtTick === null) return prompt('incidental-clot-shared', true,
    'Record this as a decision to be made with him, not for him.',
    'No agreement has been reached and none should be recorded. What travels is that the recommendation is conditional, that both directions were put to him together, and that his bleeding history and his own account of it are inputs.');
  if (patient.boundariesReviewedAtTick === null) return prompt('incidental-clot-boundaries', true,
    'Review what the supplied evidence cannot settle.',
    'The panel found no randomised trial addressing this question and named it a research priority. Nothing available here will resolve the uncertainty, and acting as though it has is the error.');
  if (patient.observation === null) return prompt('incidental-clot-assess', true,
    'Take a current full assessment rather than a partial check.',
    'The report alone supplies no observations and the observations supply no report. A handoff needs both, together and current.');
  if (!patient.serviceResponded) return prompt('incidental-clot-observe-service', false,
    'Wait for the service you contacted rather than deciding around them.',
    'Nobody rings back unbidden in this lesson, because the failure it can produce is a decision taken alone. The authored interval settles nothing.');
  if (!patient.serviceObserved) return prompt('incidental-clot-reassess', true,
    'Take a fresh assessment now that the service has answered.',
    'The earlier assessment predates their answer. A handoff carrying a stale picture asks the receiving team to act on findings nobody has just looked at.');
  return prompt('incidental-clot-handoff', false,
    'Hand off with the decision still open.',
    'An agreed plan, a chosen drug, and a resolved uncertainty are not handoff gates. What travels is the finding, the certainty, both directions of the trade, his bleeding risk, and what he said.');
}
