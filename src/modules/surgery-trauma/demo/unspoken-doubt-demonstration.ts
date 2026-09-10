import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { UnspokenDoubtSnapshot } from '@platform/kernel/protocol';
import { supportsUnspokenDoubt, type UnspokenDoubtAction } from '../unspoken-doubt';

export const UNSPOKEN_DOUBT_DEMONSTRATION_VERSION = '0.1.0';

export function supportsUnspokenDoubtDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsUnspokenDoubt(scenario);
}

export interface UnspokenDoubtDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: UnspokenDoubtAction; readonly finished?: boolean;
}

/**
 * The worked example for the interval nobody else can see.
 *
 * It never says the team is about to operate on the wrong side and never says anybody has made
 * an error — the discrepancy is not resolved anywhere in this lesson. It also speaks before the
 * knife is asked for, because an example that waited would teach that the moment to say it is
 * the last one rather than the first.
 */
export function unspokenDoubtDemonstrationStep(
  patient?: UnspokenDoubtSnapshot,
): UnspokenDoubtDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'The sentence was said, the team owns everything that follows, and nothing about who was right is settled here. This ends the example, and it ends the module: every other delay in these ten lessons belonged to somebody else, and this one was yours.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.noticedStatedAtTick === null) {
    return { id: 'noticed', focus: 'actions', progress: 0.08, action: 'state-what-you-have-noticed',
      narration: `Say what you saw, with no theory attached. Consent ${patient.consentSide}. Mark ${patient.markedSide}. The label on the image ${patient.imageLabelSide}. That is an observation about a discrepancy — it is not a claim that anybody has done anything wrong, and keeping those two apart is what makes it sayable.` };
  }
  if (patient.fallibilityStatedAtTick === null) {
    return { id: 'wrong', focus: 'actions', progress: 0.22, action: 'state-what-would-make-you-wrong',
      narration: 'Now list the ways you are probably wrong, and do it first. Different patient on the screen. Display artefact. Mirrored view. You misread it. All likely — and saying them out loud before the request is precisely what turns an interruption into something a team can answer in ten seconds.' };
  }
  if (patient.asymmetryStatedAtTick === null) {
    return { id: 'asymmetry', focus: 'actions', progress: 0.36, action: 'state-the-cost-of-each-mistake',
      narration: 'Then compare the two mistakes, out loud. Wrong in public: ninety seconds, a quick re-check, a bit of embarrassment that is yours. Right and silent: the other side of a person. Notice what that comparison does — it stops this being a question about how brave you are.' };
  }
  if (patient.spokenAtTick === null) {
    return { id: 'say', focus: 'actions', progress: 0.52, action: 'say-it-before-the-incision',
      narration: 'Say it now, while nobody has asked for anything and there is nothing to undo. To the room, not to the person beside you. The observation, the ways you might be wrong, and a request to check the side against the consent, the mark and the image before going on.' };
  }
  if (patient.teamIntentAtTick === null) {
    return { id: 'intent', focus: 'actions', progress: 0.64, action: 'record-bounded-team-intent',
      narration: 'Record bounded intent and decide nothing. The re-check and how it is done, the imaging, and whether this operation goes ahead are theirs. You did not stop the list. You said a sentence.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.74, action: 'review-boundaries',
      narration: 'Review the evidence, including the part aimed at this exercise. Three intrapersonal factors explain 73 percent of the variance in whether people speak up, and training level moves two of them. And fourteen interventions built to change that produced mixed results, with specific doubt that education alone shifts deeply rooted behaviour. This rehearsal is one of those interventions. It is in the list on purpose.' };
  }
  if (!patient.knifeRequested) {
    return { id: 'hold', focus: 'monitor', progress: 0.84,
      narration: 'Look at the monitor for a moment. Seventy-eight, one-ten over sixty-four, ninety-nine percent, and it will read like that all case. Nothing there was ever going to catch a label. The only clock running in this room is the one between noticing and saying, and it is the only one nobody else can see.' };
  }
  if (!patient.teamResponded) {
    return { id: 'knife', focus: 'monitor', progress: 0.90,
      narration: 'The hand goes out for the knife. Nothing changed: no new information, nobody at fault, the patient identical. This is what the interval looks like from the inside when it is being spent — a room moving one ordinary step at a time while the thing you know stays where it is.' };
  }
  if (!patient.teamObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.95, action: 'reassess',
      narration: 'Take a current assessment now they have answered. They stopped, somebody said thank you, and the notes came out. Notice the size of what just happened against the size of the pause you were considering.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.97, action: 'handoff',
    narration: 'Hand it off and leave the decision with them. Nothing here settles whether you were right. What travels is what you saw, how you might be wrong, and that you said it before anything was cut.' };
}
