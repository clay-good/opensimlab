import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EndocarditisHeartFailureSnapshot } from '@platform/kernel/protocol';

export const ENDOCARDITIS_HEART_FAILURE_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link
 * built from a citation is a guess rather than a lookup. The tray already sends
 * a reader to the source view, which shows the declared citations in full.
 */

/**
 * Observed-state guidance for two problems on different clocks.
 *
 * The infection is responding and the valve is failing, and every refused
 * shortcut here reads a fact about the first as reassurance about the second.
 * So the prompts keep saying which of the two a number belongs to rather than
 * arguing about severity. One of them corrects a physical sign in the direction
 * people do not expect — acute severe regurgitation gives a normal or narrow
 * pulse pressure, because the ventricle has had no time to dilate — and none
 * selects an operation, a prosthesis, or a time, because those belong to the
 * team being referred to.
 */
export function endocarditisHeartFailureInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly endocarditisHeartFailure?: EndocarditisHeartFailureSnapshot;
}) {
  const patient = input.endocarditisHeartFailure;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.recognitionAtTick === null) return prompt('endocarditis-recognize', true,
    'Record this as the valve failing, not the treatment failing.',
    'Breathlessness on day three of appropriate therapy, with new severe regurgitation, is mechanical. The antimicrobials are working; that is a separate fact about a separate problem.');
  if (patient.teamAtTick === null) return prompt('endocarditis-team', true,
    'Convene the endocarditis team and involve a surgical centre.',
    'It is the named structure in the guidance rather than an informal courtesy, and the discussion is what makes the timing a decision instead of a delay.');
  if (patient.surgicalReferralAtTick === null) return prompt('endocarditis-referral', true,
    'Record bounded intent for urgent surgical assessment and transfer.',
    'Nothing here selects an operation, a prosthesis, a theatre slot, or an anaesthetic plan. What is recorded is that the assessment is urgent.');
  if (patient.boundariesReviewedAtTick === null) return prompt('endocarditis-boundaries', true,
    'Review which number belongs to which problem.',
    `Falling markers and clearing cultures describe the infection. A pulse pressure of ${patient.pulsePressureMmHg} mmHg does not exclude acute severe regurgitation, because the ventricle has had no time to dilate. And vegetation size is a trigger alongside another indication, not on its own.`);
  if (patient.monitoringAtTick === null) return prompt('endocarditis-monitor', true,
    'Watch the breathing and the perfusion rather than the temperature chart.',
    'The chart is answering the question that is already going well. What changes here is mechanical, and it shows up in work of breathing before it shows up anywhere else.');
  if (patient.decompensationDueInSeconds !== null) return prompt('endocarditis-observe', false,
    'Keep watching while the authored interval runs.',
    'It is a contrast rather than a real rate of decompensation, and the referral does not need restating while it passes.');
  if (!patient.decompensationObserved) return prompt('endocarditis-reassess', true,
    'Take a current full assessment.',
    'The referral is a request rather than an arrival. What the breathing and the perfusion say now is the thing the surgical team will want, and it is the only description of where this has got to.');
  return prompt('endocarditis-handoff', false,
    'Hand off two problems on two clocks.',
    'A responding infection is not a handoff gate and is not the question. What travels is the mechanical failure, the referral already made, and that the markers describe something else.');
}
