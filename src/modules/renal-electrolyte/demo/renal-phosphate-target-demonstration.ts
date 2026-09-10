import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { RenalPhosphateTargetSnapshot } from '@platform/kernel/protocol';
import { supportsRenalPhosphateTarget, RENAL_PHOSPHATE_RECORDS_TICKS,
  type RenalPhosphateAction } from '../phosphate-target';

export const RENAL_PHOSPHATE_DEMONSTRATION_VERSION = '0.1.0';
export const RENAL_PHOSPHATE_DEMONSTRATION_EARLY_TICKS = 5 * 60 * TICKS_PER_SECOND;
export function supportsRenalPhosphateTargetDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsRenalPhosphateTarget(scenario);
}
export interface RenalPhosphateDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: RenalPhosphateAction; readonly finished?: boolean;
}
export function renalPhosphateTargetDemonstrationStep(patient?: RenalPhosphateTargetSnapshot): RenalPhosphateDemonstrationStep {
  if (!patient) return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  if (patient.ended) return { id: 'finished', narration: patient.ended === 'handoff'
    ? 'The surrogate framing, the trial including the part nobody quotes, the intake review, and the owned decision are handed on. This ends the example, not the care, and the phosphate never moved.'
    : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.', focus: 'actions', progress: 1, finished: true };
  if (patient.surrogateReviewedAtTick === null) return { id: 'surrogate', narration: 'Say out loud what the target is. A serum phosphate stands in for vascular and bone outcomes nobody in this room can see, and that this rehearsal never supplies. That does not make his phosphate harmless — it makes the number not the thing.', focus: 'actions', progress: 0.05, action: 'review-surrogate' };
  if (patient.trialReviewedAtTick === null) return { id: 'trial', narration: 'Read the randomised comparison in his own population, including the half that rarely gets quoted: phosphorus fell on all three binders, and coronary and aortic calcification rose against placebo. The authors concluded that safety and efficacy remain uncertain — which is uncertainty in both directions.', focus: 'actions', progress: 0.15, action: 'review-trial' };
  if (patient.intakeReviewedAtTick === null) return { id: 'intake', narration: 'Ask what he is actually eating. The diet has been restricted twice, his appetite has been poor for four months, and nobody has talked to him about additive phosphate in processed food and drinks. None of that is in any number on the screen.', focus: 'actions', progress: 0.25, action: 'review-intake' };
  if (patient.decisionOwnedAtTick === null) return { id: 'ownership', narration: 'Place the binder decision with the team that knows his context, the costs, and what he can tolerate. That is where the comparative evidence leaves it, because the comparison between binder classes for patient-level outcomes has not been settled.', focus: 'actions', progress: 0.35, action: 'own-decision' };
  if (!patient.supportActive) return { id: 'support', narration: 'Share the decision and the intake review with renal, dietetic, pharmacy, and nursing teams.', focus: 'actions', progress: 0.44, action: 'call-support' };
  if (patient.monitoringAtTick === null) return { id: 'monitor', narration: 'Arrange continuing biochemical and nutritional review, and keep the weight and albumin trend as an open question rather than a closed one.', focus: 'actions', progress: 0.52, action: 'monitor' };
  if (patient.recordsDueInSeconds !== null) {
    const earlyRemaining = (RENAL_PHOSPHATE_RECORDS_TICKS - RENAL_PHOSPHATE_DEMONSTRATION_EARLY_TICKS) / TICKS_PER_SECOND;
    if (patient.recordsDueInSeconds > earlyRemaining) return { id: `early-observation-${patient.intakeReviewedAtTick}`, narration: 'Continue through this authored five-minute observation contrast while the previous letters are retrieved. It is not a clinical wait, and the clock reveals no new result.', focus: 'monitor', progress: 0.58 };
    if (!patient.observation) return { id: `early-reassessment-${patient.intakeReviewedAtTick}`, narration: 'Take a full assessment before the letters arrive, and notice how much of the picture is one phosphate value.', focus: 'actions', progress: 0.66, action: 'reassess' };
    return { id: `records-observation-${patient.intakeReviewedAtTick}`, narration: 'Continue review while the letters are retrieved. The authored interval is not a clinical wait, and the phosphate has not changed in the meantime.', focus: 'monitor', progress: 0.76 };
  }
  const requiredTick = Math.max(patient.intakeReviewedAtTick! + RENAL_PHOSPHATE_RECORDS_TICKS, patient.surrogateReviewedAtTick);
  if (!patient.observation || patient.observation.atTick < requiredTick) return {
    id: `records-reassessment-${requiredTick}`, narration: 'Request everything together and read which column moved. The phosphate is exactly where it was. The weight and the albumin are not, and nothing here establishes why.',
    focus: 'actions', progress: 0.88, action: 'reassess' };
  return { id: 'handoff', narration: 'Hand over the context the number does not carry: a surrogate, a trial that lowered it while calcification rose, two restrictions already applied, and 6 kg gone. The decision is theirs; what they need is what the phosphate column left out.', focus: 'actions', progress: 0.96, action: 'handoff' };
}
