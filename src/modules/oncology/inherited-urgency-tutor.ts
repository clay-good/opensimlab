import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { InheritedUrgencySnapshot } from '@platform/kernel/protocol';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link
 * built from a citation is a guess rather than a lookup. The tray already sends a
 * reader to the source view, which shows the declared citations in full.
 */

/**
 * Observed-state guidance for an emergency that mostly is not one.
 *
 * The urgency here was inherited rather than found: it arrived with the referral
 * and nobody has checked it against the patient. The prompts therefore never argue
 * that this is or is not serious. They ask which findings would make it an
 * emergency and whether they are present — a question with an answer — and they
 * hold the line that tissue decides the treatment, because the pull in this
 * scenario is a real slot offered tonight by someone willing to help.
 */
export function inheritedUrgencyInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly inheritedUrgency?: InheritedUrgencySnapshot;
}) {
  const patient = input.inheritedUrgency;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.findingsRecordedAtTick === null) return prompt('inherited-urgency-findings', true,
    'Record which findings would make this an emergency, and whether they are here.',
    'That is a question with an answer, unlike whether the referral sounded urgent. The urgency arrived with the paperwork; it has not yet been checked against him.');
  if (patient.tissueRecordedAtTick === null) return prompt('inherited-urgency-tissue', true,
    'Record that the tissue decides the treatment.',
    'What is done depends on what this is, and nobody knows that yet. Treating first makes the diagnosis harder to obtain and does not make it less necessary.');
  if (patient.pathwaySecuredAtTick === null) return prompt('inherited-urgency-pathway', true,
    'Secure the diagnostic pathway rather than a treatment slot.',
    'The thing that is genuinely time-critical here is getting the biopsy booked, flagged and owned by a named team. That is the appointment worth chasing tonight.');
  if (patient.treatmentIntentAtTick === null) return prompt('inherited-urgency-intent', true,
    'Record bounded treatment intent and start nothing.',
    'Which treatment, when, and whether anything happens before the tissue are decisions for the teams who will hold the result.');
  if (patient.boundariesReviewedAtTick === null) return prompt('inherited-urgency-boundaries', true,
    'Review what this lesson does not settle.',
    'No histology, no staging and no treatment decision is available here, and a patient who is comfortable now is not a guarantee that he will stay so.');
  if (!patient.treatmentOffered) return prompt('inherited-urgency-observe-offer', false,
    'Keep the pathway rather than the slot in view.',
    'This authored interval is a contrast rather than a required clinical wait. Something is about to be offered that is easier to accept than to decline.');
  if (!patient.teamResponded) return prompt('inherited-urgency-hold', true,
    'Decline the slot without declining the help.',
    'A colleague willing to treat tonight is offering something real, and the reason to say no is not caution but that the tissue has not been obtained. Say what is needed instead, which is the biopsy she is trying to help you get around.');
  if (!patient.teamObserved) return prompt('inherited-urgency-reassess', true,
    'Take a current assessment now that acute oncology has accepted him.',
    'The earlier assessment predates their answer and the offer. Whether the emergency findings have appeared is the thing that would change this, and only a current look answers it.');
  return prompt('inherited-urgency-handoff', false,
    'Hand off with the diagnosis unmade and the pathway owned.',
    'Histology, staging and a treatment decision are not handoff gates. What travels is which findings would make this an emergency, that they are absent, and who now owns the biopsy.');
}
