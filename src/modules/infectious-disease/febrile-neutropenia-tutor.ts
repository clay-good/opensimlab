import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { FebrileNeutropeniaSnapshot } from '@platform/kernel/protocol';

export const FEBRILE_NEUTROPENIA_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link
 * built from a citation is a guess rather than a lookup. The tray already sends
 * a reader to the source view, which shows the declared citations in full.
 */

/**
 * Observed-state guidance for an examination that has been blinded.
 *
 * Every refused shortcut here is a missing signal read as a reassuring one: a
 * modest marker, a risk score, an absent localizing sign, an unraised white
 * count. The unifying answer is not urgency but mechanism — this patient has no
 * neutrophils with which to produce any of those signals — so the prompts say
 * what the neutropenia has removed rather than insisting the learner hurry. They
 * also treat the one-hour figure as what the sources call it, a system-design
 * safety margin, rather than as a physiological deadline.
 */
export function febrileNeutropeniaInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly febrileNeutropenia?: FebrileNeutropeniaSnapshot;
}) {
  const patient = input.febrileNeutropenia;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.recognitionAtTick === null) return prompt('febrile-neutropenia-recognize', true,
    'Record this as an emergency on the count and the fever alone.',
    'One fever with neutrophils of 0.2 ten days after chemotherapy is the whole finding. How well he looks is not additional evidence, because looking well is what this illness does early.');
  if (patient.pathwayAtTick === null) return prompt('febrile-neutropenia-pathway', true,
    'Activate the pathway and record the clock from arrival.',
    'Activation is the emergency response rather than a referral. Recording the arrival time is what makes the interval measurable afterwards instead of remembered.');
  if (patient.culturesAtTick === null) return prompt('febrile-neutropenia-cultures', true,
    'Take cultures peripherally and from each line lumen, arranged not to delay therapy.',
    'The lumens are asked separately because they can answer a different question from the peripheral set. No result from any of them is a prerequisite for what follows.');
  if (patient.antimicrobialIntentAtTick === null) return prompt('febrile-neutropenia-intent', true,
    'Record bounded intent for immediate empiric therapy on the local protocol.',
    'The protocol names the agent, not this bedside and not this lesson. What is recorded here is that it should be immediate.');
  if (patient.boundariesReviewedAtTick === null) return prompt('febrile-neutropenia-boundaries', true,
    'Review what the examination cannot show you.',
    'The neutropenia is what removes the localizing signs and the white-cell rise, and most episodes never localize. The one-hour figure is a system-design safety margin rather than a physiological threshold.');
  if (patient.monitoringAtTick === null) return prompt('febrile-neutropenia-monitor', true,
    'Set continuous observation with a track-and-trigger score.',
    'A well-appearing neutropenic patient can decline quickly, and the examination will not warn you first. The score is the substitute for the signs that are not available.');
  if (patient.responseDueInSeconds !== null) return prompt('febrile-neutropenia-observe', false,
    'Keep watching while the authored interval runs.',
    'It is a contrast rather than a real response time, and nothing about the recorded intent needs restating while it passes.');
  if (!patient.untreatedResponseObserved && !patient.treatedResponseObserved) {
    return prompt('febrile-neutropenia-reassess', true,
      'Take a current full assessment.',
      'A recorded intent is not an observed response. What the temperature, the perfusion, and the lactate say now is the only description of where this has got to.');
  }
  return prompt('febrile-neutropenia-handoff', false,
    'Hand off the emergency without a source.',
    'A localized infection and a positive culture are not handoff gates, and most episodes never produce either. What travels is the count, the fever, the recorded intent, and that the examination is blinded.');
}
