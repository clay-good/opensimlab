import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { LaboratoryTlsSnapshot } from '@platform/kernel/protocol';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link
 * built from a citation is a guess rather than a lookup. The tray already sends a
 * reader to the source view, which shows the declared citations in full.
 */

/**
 * Observed-state guidance for a syndrome he does not have yet.
 *
 * The two failures here are symmetric and both feel like decisiveness: file it as
 * numbers in a well patient, or call it tumour lysis syndrome and move him. The
 * laboratory definition is met and the clinical one is not, and the whole lesson
 * is that the qualifier is the finding rather than a hedge attached to one. So the
 * prompts push toward saying which definition is met, and never toward resolving
 * the gap between the bloods and the patient in favour of either.
 */
export function laboratoryTlsInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly laboratoryTls?: LaboratoryTlsSnapshot;
}) {
  const patient = input.laboratoryTls;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.definitionRecordedAtTick === null) return prompt('laboratory-tls-definition', true,
    'Record which definition is met and which is not.',
    'One is met and the other is not, and the qualifier is the finding rather than a hedge on it. A name recorded without it is the error this presentation produces in both directions.');
  if (patient.crossingRecordedAtTick === null) return prompt('laboratory-tls-crossing', true,
    'Record what crossed and how long after treatment.',
    'The timing is what makes the reading interpretable. Values without the interval since treatment cannot be told apart from a baseline nobody looked at.');
  if (patient.riskRecordedAtTick === null) return prompt('laboratory-tls-risk', true,
    'Record what raises the risk of crossing into the clinical definition.',
    'The question worth answering is not what he has now but what would make him meet the other definition, because that is what the monitoring is for.');
  if (patient.escalationAtTick === null) return prompt('laboratory-tls-escalate', true,
    'Tell the team that owns the treatment, with both readings.',
    'Nobody arrives unbidden here. The failure this lesson can produce is a ward settling the label between itself while the people who own hydration, hypouricaemic treatment, and monitoring are told neither reading.');
  if (patient.treatmentIntentAtTick === null) return prompt('laboratory-tls-intent', true,
    'Record bounded monitoring and treatment intent, and start nothing.',
    'Hydration, hypouricaemic treatment, monitoring frequency, and any renal referral are theirs. Recording that they may decide is not deciding.');
  if (patient.boundariesReviewedAtTick === null) return prompt('laboratory-tls-boundaries', true,
    'Review what this lesson does not settle.',
    'No grade, no level of care, and no treatment is chosen here, and a well-looking patient is not evidence that the laboratory picture is unimportant.');
  if (patient.observation === null) return prompt('laboratory-tls-assess', true,
    'Take a current full assessment rather than a partial check.',
    'The bloods supply no observations and the observations supply no bloods. A handoff carrying one of them asks the next person to guess the other.');
  if (!patient.teamResponded) return prompt('laboratory-tls-observe', false,
    'Keep both readings under review while the team answers.',
    'The repeat set moves and he does not. That gap is the presentation rather than a contradiction to be resolved, and the authored interval settles nothing.');
  if (!patient.teamObserved) return prompt('laboratory-tls-reassess', true,
    'Take a fresh assessment now that the team has answered.',
    'The earlier assessment predates both their answer and the repeat set. They asked to be told if the creatinine moves or the rhythm changes, which is a different trigger from the next number crossing a line.');
  return prompt('laboratory-tls-handoff', false,
    'Hand off with the label qualified and the treatment theirs.',
    'A resolved label, a chosen level of care, and a started treatment are not handoff gates. What travels is which definition is met, what crossed and when, and what would make him cross over.');
}
