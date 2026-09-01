import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { ToxicShockSnapshot } from '@platform/kernel/protocol';

export const TOXIC_SHOCK_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link
 * built from a citation is a guess rather than a lookup. The tray already sends
 * a reader to the source view, which shows the declared citations in full.
 */

/**
 * Observed-state guidance for a definition that cannot close.
 *
 * Neither surveillance definition can be met during this rehearsal, and that is
 * the construction rather than a gap in it: one waits on desquamation a week or
 * two away, the other on an organism from a sterile site. So the prompts never
 * declare the case, and never let its unmet state be read as evidence against
 * it. They keep saying what these definitions are for — counting cases
 * consistently across populations — which is a different job from deciding what
 * to do at this bedside.
 */
export function toxicShockInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly toxicShock?: ToxicShockSnapshot;
}) {
  const patient = input.toxicShock;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.recognitionAtTick === null) return prompt('toxic-shock-recognize', true,
    'Record the pattern in front of you, as a pattern.',
    'Erythroderma, mucosal hyperaemia, gastrointestinal upset from onset, and hypotension out of proportion to the apparent focus hang together. Recognizing that is not the same as naming a case.');
  if (patient.criticalCareAtTick === null) return prompt('toxic-shock-critical-care', true,
    'Activate critical care on the pattern, not on a definition.',
    'The definitions are days or weeks from answering. Waiting for one to close is waiting for information that is not coming today.');
  if (patient.culturesAtTick === null) return prompt('toxic-shock-cultures', true,
    'Request blood cultures and sterile-site sampling.',
    'Notice what that one request is doing: one definition needs these negative, and the other needs an organism. The same samples serve two contradictory clauses, which is why neither closes quickly.');
  if (patient.treatmentIntentAtTick === null) return prompt('toxic-shock-intent', true,
    'Record bounded treatment intent per local protocol.',
    'No agent, dose, route, combination, adjunct, fluid volume, or vasoactive choice is made here. The protocol and the team hold those.');
  if (patient.definitionStatusAtTick === null) return prompt('toxic-shock-definition', true,
    'Write down that the definition is unmet, and why.',
    'One is unmet for a temporal reason and the other for a microbiological one. Recording the reason is what stops the next reader treating an open definition as a closed answer.');
  if (patient.boundariesReviewedAtTick === null) return prompt('toxic-shock-boundaries', true,
    'Review what a surveillance definition is for.',
    'It exists to count cases consistently across populations, not to decide treatment at a bedside. A criteria count is not a probability, and a clause about negative cultures excludes other diagnoses rather than infection.');
  if (patient.monitoringAtTick === null) return prompt('toxic-shock-monitor', true,
    'Watch perfusion and organ function rather than the criteria tally.',
    'The tally will not move in a useful direction today. The organ function will, in either direction, and that is the thing worth checking on an interval.');
  if (patient.deteriorationDueInSeconds !== null) return prompt('toxic-shock-observe', false,
    'Keep watching while the authored interval runs.',
    'It is a contrast rather than a real rate of change, and the recorded intents do not need restating while it passes.');
  if (!patient.deteriorationObserved) return prompt('toxic-shock-reassess', true,
    'Take a current full assessment.',
    'A recorded intent is not an observed response. Perfusion and organ function now are the only description of where this has got to.');
  return prompt('toxic-shock-handoff', false,
    'Hand off an open definition and a treated patient.',
    'A confirmed case is not a handoff gate and will not exist for a week or more. What travels is the pattern, why each definition is unmet, and that treatment did not wait for either.');
}
