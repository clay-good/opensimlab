import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { NormalTestToxicitySnapshot } from '@platform/kernel/protocol';

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
 * Observed-state guidance for a normal test and a dose still in his bag.
 *
 * The urgency here is unusual and the prompts have to carry it. The supply is
 * with the patient, the next dose falls due during this lesson, and he will take
 * it — because he has been told to for nine days and nobody has told him
 * otherwise. Every prompt before the drug is withheld says so, because a tutor
 * that opened with "record the toxicity" would be ordering the steps the way a
 * write-up reads rather than the way the clock runs.
 */
export function normalTestToxicityInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly normalTestToxicity?: NormalTestToxicitySnapshot;
}) {
  const patient = input.normalTestToxicity;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.drugWithheldAtTick === null) return prompt('normal-test-toxicity-withhold', true,
    'Tell him to stop taking it, before anything else is recorded.',
    'The supply is in his bag and the next dose is due during this consultation. He has been told to take it for nine days and nobody has told him not to, so he will. Withholding is not a treatment decision that needs permission; it is stopping something that is still happening.');
  if (patient.toxicityRecordedAtTick === null) return prompt('normal-test-toxicity-record', true,
    'Record the toxicity with its severity and the day of the cycle.',
    'Severity and timing are what the treating service will grade against. A description without either supports nothing.');
  if (patient.exclusionsRecordedAtTick === null) return prompt('normal-test-toxicity-exclusions', true,
    'Record what the normal pre-treatment test does and does not exclude.',
    'A wild-type result lowers a prior. It does not exclude toxicity, and treating a screening test as a rule-out is the error this presentation is built from.');
  if (patient.escalationAtTick === null) return prompt('normal-test-toxicity-escalate', true,
    'Contact acute oncology now that the drug is stopped.',
    'Grading, any further treatment, and whether the drug is ever restarted are theirs. Calling them is not the same as waiting for them, and the drug does not stay in his hand while they answer.');
  if (patient.supportiveIntentAtTick === null) return prompt('normal-test-toxicity-intent', true,
    'Record bounded supportive intent and administer nothing.',
    'Supportive treatment is not wrong and belongs to the qualified team. Recording that they may provide it is not choosing a drug, a dose, or a route.');
  if (patient.boundariesReviewedAtTick === null) return prompt('normal-test-toxicity-boundaries', true,
    'Review what this lesson does not settle.',
    'No enzyme assay, no confirmed grade, and no restart plan is available here, and none is needed to stop a drug that is causing harm.');
  if (patient.observation === null) return prompt('normal-test-toxicity-assess', true,
    'Take a current full assessment rather than a partial check.',
    'The treatment record supplies no observations and the observations supply no treatment record. A handoff needs both, together and current.');
  if (!patient.serviceResponded) return prompt('normal-test-toxicity-observe-service', false,
    'Keep him under review while acute oncology answers.',
    'The authored interval is a contrast rather than a required clinical wait. Nothing about it grades the toxicity or proves it has stopped worsening.');
  if (!patient.serviceObserved) return prompt('normal-test-toxicity-reassess', true,
    'Take a fresh assessment now that the service has answered.',
    'The earlier assessment predates their answer and the dose that fell due in between. A handoff carrying a stale picture asks the receiving team to act on findings nobody has just looked at.');
  return prompt('normal-test-toxicity-handoff', false,
    'Hand off with the grade and the restart decision open.',
    'A confirmed grade, an enzyme assay, and a restart plan are not handoff gates. What travels is that the drug is stopped, what was seen, and what the normal test did not exclude.');
}
