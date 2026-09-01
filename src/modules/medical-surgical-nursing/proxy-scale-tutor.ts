import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { ProxyScaleSnapshot } from '@platform/kernel/protocol';

export const PROXY_SCALE_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link
 * built from a citation is a guess rather than a lookup. The tray already sends
 * a reader to the source view, which shows the declared citations in full.
 */

/**
 * Observed-state guidance for a number that has no standard behind it.
 *
 * The behavioural total is a real measurement of something, and the error is
 * reading it as an intensity. So the prompts never convert it, never compare it
 * with a self-reported number, and never say how much pain he is in — that
 * quantity does not exist here and inventing it is the whole failure. They ask
 * for the hierarchy in order instead, and they treat the daughter as a source
 * rather than a formality.
 */
export function proxyScaleInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly proxyScale?: ProxyScaleSnapshot;
}) {
  const patient = input.proxyScale;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.selfReportAttemptedAtTick === null) return prompt('proxy-scale-self-report', true,
    'Ask him first, even though you expect no answer.',
    'Self-report is the reference standard, and skipping it assumes an answer nobody asked for. The attempt is also what makes everything after it defensible.');
  if (patient.behavioursRecordedAtTick === null) return prompt('proxy-scale-behaviours', true,
    'Record the behaviours as behaviours, item by item.',
    'Which ones scored and which did not is the information. A total on its own loses the part a colleague can check against the patient in front of them.');
  if (patient.limitsRecordedAtTick === null) return prompt('proxy-scale-limits', true,
    'Write down what the total is not.',
    `It is not ${patient.behaviouralTotal} out of 10 and it does not compare with a self-reported number. These instruments measure observable behaviour, and their own developers say so; the scale has no intensity standard behind it.`);
  if (patient.boundariesReviewedAtTick === null) return prompt('proxy-scale-boundaries', true,
    'Review the assessment hierarchy in the order it is written.',
    'Attempt self-report; consider whether a cause of pain is present; observe behaviours; ask someone who knows him; and treat on that basis. Skipping a step changes what the next one can support.');
  if (patient.monitoringAtTick === null) return prompt('proxy-scale-monitor', true,
    'Schedule reassessment against the same behaviours.',
    'The comparison that means anything is this list against itself later, not this total against somebody else’s number.');
  if (!patient.familyArrived) return prompt('proxy-scale-await', false,
    'Keep observing while his daughter is on her way.',
    'A proxy history is a person who knows him rather than a field on a form, and this authored interval predicts no real arrival time.');
  if (patient.proxyHistoryAtTick === null) return prompt('proxy-scale-proxy', true,
    'Ask her what he looks like when he is in pain.',
    'And what is different today. She is describing a baseline nobody else has, which is the one thing that turns a behaviour list into a comparison.');
  if (patient.analgesicIntentAtTick === null) return prompt('proxy-scale-intent', true,
    'Record bounded qualified-team analgesic intent, with the reasoning.',
    'An attempted self-report, the observed behaviours, a recent operation that would be expected to hurt, and what his daughter described. The reasoning is what the team is being asked to act on, not the number.');
  if (!patient.reviewObserved) return prompt('proxy-scale-reassess', true,
    'Reassess against the behaviours you recorded.',
    'Whether those specific behaviours have changed is answerable. Whether his pain score has fallen is not, because there was never a score of that kind.');
  return prompt('proxy-scale-handoff', false,
    'Hand off the behaviours, the attempt, and what the total is not.',
    'A number the next nurse can compare with their own is not a handoff gate, and here it would be a fiction. What travels is the list, the daughter’s description, and the bounded intent.');
}
