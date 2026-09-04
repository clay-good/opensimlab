import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { LoweringTheCountSnapshot } from '@platform/kernel/protocol';
import { supportsLoweringTheCount, type LoweringTheCountAction } from '../lowering-the-count';
import { loweringTheCountInlinePrompt } from '../lowering-the-count-tutor';


/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: LoweringTheCountSnapshot): string {
  const prompt = loweringTheCountInlinePrompt('guided', { scenarioVersion: '0.1.0', loweringTheCount: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const LOWERING_THE_COUNT_DEMONSTRATION_VERSION = '0.1.0';

export function supportsLoweringTheCountDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsLoweringTheCount(scenario);
}

export interface LoweringTheCountDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: LoweringTheCountAction; readonly finished?: boolean;
}

/**
 * The worked example for a number that can be moved.
 *
 * Escalation is the second beat, not the last, which is the part worth watching.
 * A tidy write-up records the picture, states what the count licenses, sets out
 * the intent, reviews the boundaries and then calls somebody — and he deteriorates
 * on the clock while that happens. Nothing recorded after the picture changes who
 * needs to be in the room.
 */
export function loweringTheCountDemonstrationStep(
  patient?: LoweringTheCountSnapshot,
): LoweringTheCountDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'The clinical picture, how it moved, and what the count does and does not license are handed to haematology with the strategy theirs. This ends the example, not the care.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.pictureRecordedAtTick === null) {
    return { id: 'picture', focus: 'actions', progress: 0.08, action: 'record-the-clinical-picture-not-the-count',
      narration: 'Record the clinical picture rather than the count. Leukostasis is a clinical diagnosis; the count is one input and the only part a treatment moves quickly, which makes it the least reliable thing to follow.' };
  }
  if (patient.escalationAtTick === null) {
    return { id: 'escalate', focus: 'actions', progress: 0.22, action: 'escalate-to-haematology-now',
      narration: 'Call haematology now, second — not after the write-up is neat. He is deteriorating on the picture already recorded, and nothing written from here changes who needs to be in the room. This is the beat a tidy sequence gets wrong.' };
  }
  if (patient.licenceRecordedAtTick === null) {
    return { id: 'licence', focus: 'actions', progress: 0.36, action: 'record-what-the-count-does-and-does-not-license',
      narration: 'Record what the count does and does not license. It supports urgency; it does not make the diagnosis or authorise a procedure. Both halves together are what stop the number being read as a threshold or as a plan.' };
  }
  if (patient.treatmentIntentAtTick === null) {
    return { id: 'intent', focus: 'actions', progress: 0.50, action: 'record-bounded-cytoreduction-intent',
      narration: 'Record bounded cytoreduction intent and start nothing. The strategy, the transfusion decisions and any procedure belong to the team now on its way.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.62, action: 'review-boundaries',
      narration: 'Review what is not settled here. No marrow result, no confirmed subtype and no procedure decision is available, and none of them is needed to see that he is worse than he was.' };
  }
  if (!patient.teamResponded) {
    return { id: 'observe', focus: 'monitor', progress: 0.78,
      narration: patient.clinicallyWorse
        ? 'He is more breathless and harder to rouse than twenty minutes ago, and the count on the supplied film has not changed. The patient is the part that moved. Watching the number here would have shown nothing.'
        : 'Keep watching him rather than the count while haematology answers. This authored interval is a contrast rather than a required clinical wait.' };
  }
  if (!patient.teamObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.90, action: 'reassess',
      narration: 'Take a current assessment now haematology has answered and accepted clinical leukostasis as the working problem. What they need is the trajectory, which is the half a count cannot carry.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: narrate(patient) };
}
