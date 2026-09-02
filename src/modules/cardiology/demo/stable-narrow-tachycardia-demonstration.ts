import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsStableNarrowTachycardia, type StableNarrowTachycardiaAction,
  type StableNarrowTachycardiaProgress,
} from '../stable-narrow-tachycardia';

export const STABLE_NARROW_TACHYCARDIA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsStableNarrowTachycardiaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsStableNarrowTachycardia(scenario);
}

export interface StableNarrowTachycardiaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: StableNarrowTachycardiaAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a ladder taken one rung at a time.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. It examines nobody, acquires and interprets no live ECG or
 * test, diagnoses no mechanism, performs no maneuver, selects no medication,
 * dose or route, prescribes and delivers nothing, performs no cardioversion or
 * ablation, determines no disposition, and predicts no recurrence or outcome.
 */
export function stableNarrowTachycardiaDemonstrationStep(
  patient?: StableNarrowTachycardiaProgress,
): StableNarrowTachycardiaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.reassessmentAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is in sinus rhythm and nobody knows the mechanism. The maneuver was tried properly and looked at honestly, the drug came after that rather than instead of it, and the plan for the next episode is written down. This ends the example, not the evaluation.' };
  }
  if (patient.stabilityAtTick === null) {
    return { id: 'stability', focus: 'monitor', progress: 0.1, action: 'reconcile-stable-regular-narrow-tachycardia',
      narration: 'Fast rhythm, steady patient. Establish the second half before you act on the first. A forty-two-year-old woman, abrupt palpitations forty minutes ago, and a fixed twelve-lead report describing a regular narrow-complex tachycardia at 176 with a QRS of 82 ms and no clearly visible P waves — which explicitly does not establish one mechanism. Her pressure is 124/78, her saturation is 98% on air, she is alert and warm, and no hypotension, altered mentation, shock, ischemic discomfort, acute heart failure or syncope is authored. That is what makes the graded pathway available. Say the other half out loud too: if any of those appear at any point, this stops being a ladder and becomes immediate synchronized-cardioversion capability.' };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'monitor', progress: 0.28, action: 'review-stable-regular-narrow-context',
      narration: 'Ask what this is and what it is not, and get the room ready before you touch her. The abrupt onset and the prior brief self-terminating episodes fit the pattern, and the prior sinus-rhythm ECG has no authored pre-excitation — which matters because it is one of the things that would change what is safe. Keep the alternate regular narrow mechanisms open: this report names none. Then the part that is easy to leave implicit: monitored readiness. A vagal maneuver in a patient with a rhythm this fast is done with monitoring on, access considered, and the ability to escalate present — not because it is dangerous, but because what follows it might be.' };
  }
  if (patient.vagalAtTick === null) {
    return { id: 'vagal', focus: 'actions', progress: 0.46, action: 'record-stable-regular-narrow-vagal-intent',
      narration: 'Start with the maneuver, and coach it properly rather than mentioning it. The modified Valsalva is the first rung and it is genuinely effective when it is done well — which means coaching a real strain and the supine leg raise afterwards, not asking a patient to bear down and calling it attempted. Recording the intent here is not performing it: you coach nothing, and the maneuver, its technique and its supervision belong to the team. This is the cheapest thing on the ladder and it is the one most often skipped or done badly on the way to a drug that requires access, monitoring and readiness.' };
  }
  if (patient.vagalResponseAtTick === null) {
    return { id: 'vagalResponse', focus: 'monitor', progress: 0.64, action: 'review-stable-regular-narrow-vagal-response',
      narration: 'Let a moment pass, then look. Do not assume either answer. The engine makes this its own step and that is the point: an attempted maneuver and an observed response are different things, and the second one is what licenses the next rung. The authored rhythm does not convert. Recording that honestly matters more than it looks — a maneuver written down as tried and never checked is how a patient ends up with a drug nobody established they needed, and how a maneuver that would have worked gets abandoned after a token attempt. Look, then say what you saw.' };
  }
  if (patient.adenosineAtTick === null) {
    return { id: 'adenosine', focus: 'actions', progress: 0.82, action: 'record-stable-regular-narrow-adenosine-intent',
      narration: 'Now the next rung, and only with the room genuinely ready. Protocol-bounded adenosine intent is recorded with access, monitoring and resuscitation readiness present — not as a formality, because the drug produces a transient asystolic pause that is expected and alarming, and because the rhythm strip through that pause is diagnostic information you only get once. You select no agent, no dose and no route, and you deliver nothing. What you record is that the conditions are met and the intent is bounded by the local protocol.' };
  }
  return { id: 'reassessment', focus: 'monitor', progress: 0.94, action: 'reassess-stable-regular-narrow-trajectory',
    narration: 'It converted. Be careful about what that does and does not tell you. The authored rhythm converts to sinus at 88 with a pressure of 122/76 and improved palpitations. That is the outcome everybody wanted, and it establishes less than it feels like: the mechanism is still not proven, and a rhythm that responded to the pathway is not a rhythm that has been explained. What the record needs now is the recurrence plan — she has had brief self-terminating episodes before, so this is a pattern rather than an event — who owns the follow-up, what she should do if it happens again, and the conversation about longer-term options that belongs to a cardiologist. Nothing here diagnoses a mechanism, selects or delivers a medication, performs a maneuver or cardioversion, determines disposition, or predicts recurrence or outcome.' };
}
