import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { UnspokenDoubtSnapshot } from '@platform/kernel/protocol';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link built from a
 * citation is a guess rather than a lookup. The tray already sends a reader to the source view.
 */

/**
 * Observed-state guidance for the interval nobody else can see.
 *
 * The prompts never say the team is about to operate on the wrong side, and never say anybody
 * has made an error. The discrepancy is never resolved in either direction, because a learner
 * who acts only when they know they are right has not learned the thing this lesson teaches.
 */
export function unspokenDoubtInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly unspokenDoubt?: UnspokenDoubtSnapshot;
}) {
  const patient = input.unspokenDoubt;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.noticedStatedAtTick === null) return prompt('unspoken-doubt-noticed', true,
    'Put the observation into words before you do anything with it.',
    `Consent ${patient.consentSide}, mark ${patient.markedSide}, the label on the displayed image ${patient.imageLabelSide}. That is all you have and all you need — a discrepancy, not an accusation.`);
  if (patient.fallibilityStatedAtTick === null) return prompt('unspoken-doubt-wrong', true,
    'Say how you might be wrong. Say it first.',
    'Wrong patient on the screen, a display artefact, a mirrored view, or you misread it. All likely. Saying them first is exactly what makes the interruption easy for the room to take.');
  if (patient.asymmetryStatedAtTick === null) return prompt('unspoken-doubt-asymmetry', true,
    'Compare the two mistakes out loud.',
    'Wrong out loud: ninety seconds and some embarrassment. Right and silent: the other side of a person. They are not comparable, and that is what makes this a small decision rather than a brave one.');
  if (patient.spokenAtTick === null) return prompt('unspoken-doubt-say', true,
    'Say it. Now, to everybody, before anything is cut.',
    `${patient.knifeRequested ? 'The knife has been asked for. That is later than it needed to be and still in time.' : 'Nothing has been asked for yet and nothing has to be undone.'} Not a hint and not a question aimed at nobody.`);
  if (patient.teamIntentAtTick === null) return prompt('unspoken-doubt-intent', true,
    'Record bounded intent and decide nothing.',
    'The re-check, the imaging, and whether this operation goes ahead are theirs. You have not stopped anything; you have contributed a sentence.');
  if (patient.boundariesReviewedAtTick === null) return prompt('unspoken-doubt-boundaries', true,
    'Review evidence that doubts exercises like this one.',
    'Three intrapersonal factors explain 73 percent of the variance in whether people speak up, and fourteen interventions aimed at fixing that produced mixed results. This rehearsal is one of those interventions.');
  if (!patient.knifeRequested) return prompt('unspoken-doubt-hold', false,
    'Watch what is and is not moving.',
    'Her pressure, her saturation, the ventilator — none of them will move all case, and none of them was ever going to catch this. The only thing running is the interval between your noticing and your saying.');
  if (!patient.teamResponded) return prompt('unspoken-doubt-knife', true,
    'The knife has been asked for. Nothing else changed.',
    'No new information arrived and nobody did anything wrong. The room is one step further along and the thing you saw is still only in your head.');
  if (!patient.teamObserved) return prompt('unspoken-doubt-reassess', true,
    'Take a current assessment now they have answered.',
    'They stopped, nobody was annoyed, and they own the re-check and whether this goes ahead. Notice how little it cost.');
  return prompt('unspoken-doubt-handoff', false,
    'Hand off the sentence and leave the decision with them.',
    'A confirmed error, a completed re-check and a decision about the operation are not handoff gates. What travels is what you saw, how you might be wrong, and that you said it before anything was cut.');
}
