import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { StableNarrowTachycardiaProgress } from '../stable-narrow-tachycardia';

export const STABLE_NARROW_TACHYCARDIA_TUTOR_VERSION = '0.1.0';

export interface StableNarrowTachycardiaPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * There is no wrong turn to answer, because this engine case authors none.
 * The lesson is a ladder taken slowly and in order: stability, context, the
 * maneuver, the honest look at whether it worked, then the drug. The engine
 * makes the look a step of its own, and the tutor treats it as the beat that
 * matters most, because skipping straight from a maneuver to a drug is how
 * the maneuver stops being a real attempt. It is silent on the unassisted
 * setting, silent once the reassessment is recorded, and silent for any
 * scenario version it was not written against.
 */
export function stableNarrowTachycardiaInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: StableNarrowTachycardiaProgress },
): StableNarrowTachycardiaPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.reassessmentAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.stabilityAtTick === null) return prompt('snt-stability', true,
    'Fast rhythm, steady patient. Establish the second half before you act on the first.',
    'A forty-two-year-old woman, abrupt palpitations forty minutes ago, and a fixed twelve-lead report describing a regular narrow-complex tachycardia at 176 with a QRS of 82 ms and no clearly visible P waves — which explicitly does not establish one mechanism. Her pressure is 124/78, her saturation is 98% on air, she is alert and warm, and no hypotension, altered mentation, shock, ischemic discomfort, acute heart failure or syncope is authored. That is what makes the graded pathway available. Say the other half out loud too: if any of those appear at any point, this stops being a ladder and becomes immediate synchronized-cardioversion capability.');
  if (patient.contextAtTick === null) return prompt('snt-context', true,
    'Ask what this is and what it is not, and get the room ready before you touch her.',
    'The abrupt onset and the prior brief self-terminating episodes fit the pattern, and the prior sinus-rhythm ECG has no authored pre-excitation — which matters because it is one of the things that would change what is safe. Keep the alternate regular narrow mechanisms open: this report names none. Then the part that is easy to leave implicit: monitored readiness. A vagal maneuver in a patient with a rhythm this fast is done with monitoring on, access considered, and the ability to escalate present — not because it is dangerous, but because what follows it might be.');
  if (patient.vagalAtTick === null) return prompt('snt-vagal', true,
    'Start with the maneuver, and coach it properly rather than mentioning it.',
    'The modified Valsalva is the first rung and it is genuinely effective when it is done well — which means coaching a real strain and the supine leg raise afterwards, not asking a patient to bear down and calling it attempted. Recording the intent here is not performing it: you coach nothing, and the maneuver, its technique and its supervision belong to the team. This is the cheapest thing on the ladder and it is the one most often skipped or done badly on the way to a drug that requires access, monitoring and readiness.');
  if (patient.vagalResponseAtTick === null) return prompt('snt-vagal-response', true,
    'Let a moment pass, then look. Do not assume either answer.',
    'The engine makes this its own step and that is the point: an attempted maneuver and an observed response are different things, and the second one is what licenses the next rung. The authored rhythm does not convert. Recording that honestly matters more than it looks — a maneuver written down as tried and never checked is how a patient ends up with a drug nobody established they needed, and how a maneuver that would have worked gets abandoned after a token attempt. Look, then say what you saw.');
  if (patient.adenosineAtTick === null) return prompt('snt-adenosine', true,
    'Now the next rung, and only with the room genuinely ready.',
    'Protocol-bounded adenosine intent is recorded with access, monitoring and resuscitation readiness present — not as a formality, because the drug produces a transient asystolic pause that is expected and alarming, and because the rhythm strip through that pause is diagnostic information you only get once. You select no agent, no dose and no route, and you deliver nothing. What you record is that the conditions are met and the intent is bounded by the local protocol.');
  return prompt('snt-reassessment', true,
    'It converted. Be careful about what that does and does not tell you.',
    'The authored rhythm converts to sinus at 88 with a pressure of 122/76 and improved palpitations. That is the outcome everybody wanted, and it establishes less than it feels like: the mechanism is still not proven, and a rhythm that responded to the pathway is not a rhythm that has been explained. What the record needs now is the recurrence plan — she has had brief self-terminating episodes before, so this is a pattern rather than an event — who owns the follow-up, what she should do if it happens again, and the conversation about longer-term options that belongs to a cardiologist. Nothing here diagnoses a mechanism, selects or delivers a medication, performs a maneuver or cardioversion, determines disposition, or predicts recurrence or outcome.');
}
