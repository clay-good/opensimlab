import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsMinorStroke, type MinorStrokeAction, type MinorStrokeProgress,
} from '../minor-nondisabling-acute-ischemic-stroke';

export const MINOR_STROKE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsMinorStrokeDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsMinorStroke(scenario);
}

export interface MinorStrokeDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: MinorStrokeAction; readonly finished?: boolean;
}

/**
 * The worked example for a word that sounds like a measurement.
 *
 * "Minor" is doing all the work in this case and none of it is arithmetic. The
 * NIHSS of 1 describes what was found; whether the deficit disables her is a
 * question about the life of a right-handed retired teacher who writes and uses
 * her phone, and it is hers to answer as much as anyone's. So this example says
 * what she can still do in the same breath as what she has lost, reads the
 * imaging and the authored negatives as snapshots before naming the boundary,
 * and keeps "to date" and "revisable" attached to it. It scores nothing,
 * adjudicates no disability, excludes no mimic, and selects no product,
 * combination, dose, duration, or route.
 */
export function minorStrokeDemonstrationStep(
  patient?: MinorStrokeProgress,
): MinorStrokeDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on with the same deficit she arrived with and a boundary that is written down rather than settled. Nothing was proven and nothing was excluded — not the mechanism, not the recurrence risk, not whether the sensation comes back. This ends the example, not the stroke.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-neurology-minor-stroke-clock-deficit-function-and-whole-patient',
      narration: 'Say what she can still do, not just what she has lost. Ninety-five minutes ago, mid-conversation and witnessed: persistent numbness of the left cheek and arm, with no weakness, no language or visual loss, no ataxia and no swallowing complaint. She walks, dresses, eats, writes, uses her phone and talks normally. The supplied NIHSS is 1. Both halves belong in the same sentence, because the second half is the one the decision turns on.' };
  }
  if (patient.threatsAtTick === null) {
    return { id: 'threats', focus: 'monitor', progress: 0.24, action: 'review-neurology-minor-stroke-imaging-mimics-and-immediate-threats',
      narration: 'Read the imaging and the negatives before naming the boundary. The fixed CT reports no hemorrhage and no established large infarct, and the CTA reports no large-vessel occlusion or flow-limiting stenosis — which is what the imaging says, not a mechanism. The authored absences are snapshots taken once: no seizure, no trauma, no fever, no hypoglycemia, no anticoagulant exposure today does not close mimics, etiology, bleeding context or deterioration. A score cannot stand in for any of this.' };
  }
  if (patient.boundaryAtTick === null) {
    return { id: 'boundary', focus: 'actions', progress: 0.44, action: 'recognize-neurology-minor-nondisabling-stroke-boundary-without-score-alone',
      narration: 'Call it nondisabling for her, and say the two words that make that honest. The judgment is not that a sensory deficit is minor in general — it is that this deficit does not disable this woman in the life she actually leads, which is a conversation with her rather than a number from anyone else. “To date” and “revisable” are the words doing the work: a deficit that is nondisabling this hour can stop being so, and the boundary is written down so it can be revisited rather than settled.' };
  }
  if (patient.intentAtTick === null) {
    return { id: 'intent', focus: 'actions', progress: 0.62, action: 'record-neurology-minor-stroke-qualified-antiplatelet-and-surveillance-intent',
      narration: 'Record the antiplatelet strategy as an intent and the surveillance as a person. The strategy follows the functional boundary rather than the other way round, and it stays a qualified conversation: no product, combination, dose, duration or route is chosen here, and neither thrombolysis nor antiplatelet eligibility is determined by this example. Surveillance is the part that has to have a name attached, because the whole boundary depends on somebody noticing if it changes.' };
  }
  if (patient.laterAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.8, action: 'review-neurology-minor-stroke-later-neurologic-trajectory',
      narration: 'Let the authored interval pass and read the qualified team’s later report. The interval is a contrast rather than a required wait, and nothing here says what any individual deficit does next.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-neurology-minor-stroke-etiology-recurrence-and-secondary-prevention-risk',
    narration: 'The sensory change persists without spread, nothing new has appeared, and the observations are steady. That is a short window of stability — not resolution, not a proven mechanism, not a treatment effect and not a low recurrence risk. Hand off the open etiology, the rhythm surveillance, the vascular-risk review, the individualized antithrombotic planning, any rehabilitation need and the recurrence question, and hand off the fact that the nondisabling boundary can still be revised.' };
}
