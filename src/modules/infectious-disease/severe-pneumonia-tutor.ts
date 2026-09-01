import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { SeverePneumoniaSnapshot } from '@platform/kernel/protocol';

export const SEVERE_PNEUMONIA_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link
 * built from a citation is a guess rather than a lookup. The tray already sends
 * a reader to the source view, which shows the declared citations in full.
 */

/**
 * Observed-state guidance for two instruments that both read correctly.
 *
 * The mortality score is not wrong. It is answering thirty-day mortality, which
 * is a different question from level of care, and the prompts say that rather
 * than treating the lower number as an error. They also refuse two readings that
 * look like measurement: a marker that appears in no criteria set here, and a
 * saturation quoted without its inspired fraction. None of them selects an
 * oxygen device, a ventilator setting, or a bed.
 */
export function severePneumoniaInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly severePneumonia?: SeverePneumoniaSnapshot;
}) {
  const patient = input.severePneumonia;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.reconciliationAtTick === null) return prompt('severe-pneumonia-reconcile', true,
    'Put both supplied scores side by side, as they stand.',
    'They disagree and both are calculated correctly. Recording that is what turns a contradiction into something you can reason about instead of picking between.');
  if (patient.mismatchAtTick === null) return prompt('severe-pneumonia-mismatch', true,
    'Name what each instrument was validated to answer.',
    'One is prognostic, for thirty-day mortality and the decision to admit. The other counts severity criteria that speak to level of care. The lower number is not an error; it is an answer to a question you did not ask.');
  if (patient.criticalCareAtTick === null) return prompt('severe-pneumonia-critical-care', true,
    'Request critical-care review now, while he is still talking to you.',
    'It is a review rather than an admission, and the criteria are already met. Asking now is what makes it a decision somebody else can make in time.');
  if (patient.escalationIntentAtTick === null) return prompt('severe-pneumonia-intent', true,
    'Record bounded intent for anticipated escalation.',
    'No oxygen device, ventilator setting, or bed is selected here. What is recorded is what critical care is being asked to review.');
  if (patient.boundariesReviewedAtTick === null) return prompt('severe-pneumonia-boundaries', true,
    'Review what each number can carry.',
    'The mortality score supports place-of-care decisions only alongside clinical judgement in the guideline that uses it that way. The C-reactive protein appears in no criteria set here, and neither does the sodium.');
  if (patient.monitoringAtTick === null) return prompt('severe-pneumonia-monitor', true,
    'Watch the oxygen requirement rather than the saturation alone.',
    'Ninety-two percent on room air and ninety-two percent on a third inspired oxygen describe very different lungs. The number without its fraction is not a measurement of anything.');
  if (patient.deteriorationDueInSeconds !== null) return prompt('severe-pneumonia-observe', false,
    'Keep watching while the authored interval runs.',
    'It is a contrast rather than a real rate of deterioration, and the request does not need restating while it passes.');
  if (!patient.deteriorationObserved) return prompt('severe-pneumonia-reassess', true,
    'Take a current full assessment.',
    'A request is not a review, and elapsed time is not an observation. The oxygen requirement and the conscious level now are what the reviewing team will work from.');
  return prompt('severe-pneumonia-handoff', false,
    'Hand off the criteria rather than the score.',
    'A reassuring prognostic number is not a handoff gate, and it was never answering this question. What travels is which severity criteria are met, the request already made, and the oxygen requirement with its fraction.');
}
