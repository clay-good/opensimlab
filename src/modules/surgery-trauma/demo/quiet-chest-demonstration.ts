import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { QuietChestSnapshot } from '@platform/kernel/protocol';
import { supportsQuietChest, type QuietChestAction } from '../quiet-chest';

export const QUIET_CHEST_DEMONSTRATION_VERSION = '0.1.0';

export function supportsQuietChestDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsQuietChest(scenario);
}

export interface QuietChestDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: QuietChestAction; readonly finished?: boolean;
}

/**
 * The worked example for an injury whose severity is not visible yet.
 *
 * It never says she will develop a complication, and it asks for admission before the daughter
 * telephones. An example that acted only once the social problem appeared would teach that the
 * fracture count and the age were not enough on their own, which is the reverse of the lesson.
 */
export function quietChestDemonstrationStep(
  patient?: QuietChestSnapshot,
): QuietChestDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'The plan travels sized to the days the risk lives in, owned by the team that can run it, and nothing about a complication or a discharge date is settled here. This ends the example, not her week.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.injuryRecordedAtTick === null) {
    return { id: 'injury', focus: 'actions', progress: 0.08, action: 'record-the-fall-and-what-was-broken',
      narration: `Start by putting the two facts in the same sentence. ${patient.fracturedRibs} left-sided rib fractures, ${patient.hoursSinceFall} hours ago, and she is 81 with mild chronic lung disease and nobody at home. Written in separate fields those are administrative details. Written together they are the finding.` };
  }
  if (patient.comfortLimitsRecordedAtTick === null) {
    return { id: 'comfort', focus: 'actions', progress: 0.20, action: 'record-what-comfortable-at-rest-measures',
      narration: 'Now say what "comfortable" is measuring. She is comfortable lying still, and nobody has asked her to take a full breath, to cough, or to get up. The chart is a report on the work she is currently doing, and she is doing none of it.' };
  }
  if (patient.countRecordedAtTick === null) {
    return { id: 'count', focus: 'actions', progress: 0.32, action: 'record-what-the-count-predicts',
      narration: 'Record what the count buys you, with the numbers attached. Same mean fracture count, same mean injury severity, and pneumonia 31 percent against 17, mortality 22 against 10. In a separate registry, five times the adjusted odds of dying despite lower injury scores. The ribs and the birthday are most of what anybody knows.' };
  }
  if (patient.escalationAtTick === null) {
    return { id: 'escalate', focus: 'actions', progress: 0.46, action: 'escalate-to-the-admitting-team',
      narration: 'Ask now, while she is comfortable and the only argument you have is a count. Ask for the right interval too: a bed, a plan and observation covering the second and third day, not a place to spend tonight.' };
  }
  if (patient.admissionIntentAtTick === null) {
    return { id: 'intent', focus: 'actions', progress: 0.58, action: 'record-bounded-admission-intent',
      narration: 'Record bounded intent and choose nothing. The analgesia plan and its route, the observation interval, any respiratory input, and when she goes home belong to them.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.68, action: 'review-boundaries',
      narration: 'Review both halves honestly. Two retrospective single-centre cohorts agree this is dangerous in the old. Six randomised trials of the intervention everyone reaches for, 223 patients between them and all at high risk of bias, show no difference in mortality, pneumonia or ventilation days. You are arguing for somebody to be watching, not for a treatment that fixes it.' };
  }
  if (!patient.familyCalled) {
    return { id: 'hold', focus: 'monitor', progress: 0.78,
      narration: 'Now watch nothing happen at all. No number will move, no finding will arrive, and she will keep being comfortable and keep wanting to go home. This is the hardest position in the module to hold, because there is never going to be anything to point at.' };
  }
  if (!patient.teamResponded) {
    return { id: 'family', focus: 'actions', progress: 0.87,
      narration: 'Her daughter rings: she cannot stay. Notice what that did and did not change. The chest is identical — same rate, same saturation, same comfort. What went was the part of the going-home plan that was doing the work, and it was never the observations.' };
  }
  if (!patient.teamObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.93, action: 'reassess',
      narration: 'Take a current assessment now they have answered and confirmed the count and the age from their own record. They are admitting her for the next two to three days rather than for tonight, and they plan against the picture your record is holding.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: 'Hand it off with the interval attached. A complication, an analgesia plan and a discharge date are not handoff gates. What travels is the count beside the age, what the resting chart was measuring, and that she will be on her own.' };
}
