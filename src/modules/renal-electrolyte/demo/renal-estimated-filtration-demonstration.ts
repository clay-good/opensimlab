import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { RenalEstimatedFiltrationSnapshot } from '@platform/kernel/protocol';
import { supportsRenalEstimatedFiltration, RENAL_ESTIMATE_SECOND_MARKER_TICKS,
  type RenalEstimateAction } from '../estimated-filtration';

export const RENAL_ESTIMATE_DEMONSTRATION_VERSION = '0.1.0';
export const RENAL_ESTIMATE_DEMONSTRATION_EARLY_TICKS = 5 * 60 * TICKS_PER_SECOND;
export function supportsRenalEstimatedFiltrationDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsRenalEstimatedFiltration(scenario);
}
export interface RenalEstimateDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: RenalEstimateAction; readonly finished?: boolean;
}
export function renalEstimatedFiltrationDemonstrationStep(patient?: RenalEstimatedFiltrationSnapshot): RenalEstimateDemonstrationStep {
  if (!patient) return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  if (patient.ended) return { id: 'finished', narration: patient.ended === 'handoff'
    ? 'The disagreement, its width, and the owned medicine decision are handed on as they are. This ends the example, not the care, and no measurement ever arrived.'
    : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.', focus: 'actions', progress: 1, finished: true };
  if (patient.precisionReviewedAtTick === null) return { id: 'precision', narration: 'Read what the reported 68 claims before anyone doses on it. In the validation work behind these equations, 85% or more of estimates landed within 30% of measured filtration — which is also up to one in seven outside even that. That is the width the number carries everywhere it goes.', focus: 'actions', progress: 0.05, action: 'review-precision' };
  if (patient.generationReviewedAtTick === null) return { id: 'generation', narration: 'Ask what the estimate was built from. Creatinine comes from muscle, and she is 44 kg, frail, and fourteen months past a below-knee amputation — all of which lower production without touching the kidney, and push a creatinine-based estimate up. It also does not establish that her filtration is low.', focus: 'actions', progress: 0.15, action: 'review-generation' };
  if (patient.secondMarkerRequestedAtTick === null) return { id: 'second-marker', narration: 'Request a marker that is not produced by muscle. It does not share this weakness, it has weaknesses of its own, and it will still be an estimate rather than a measurement.', focus: 'actions', progress: 0.25, action: 'request-second-marker' };
  if (patient.medicineOwnedAtTick === null) return { id: 'ownership', narration: 'Place the medicine decision explicitly with the team that has the whole picture, while the marker is pending. The example selects no drug, no dose, and no adjustment, and does not decide whether to start it.', focus: 'actions', progress: 0.35, action: 'own-medicine-decision' };
  if (!patient.supportActive) return { id: 'support', narration: 'Share the interpretation and the decision with renal, pharmacy, and nursing teams.', focus: 'actions', progress: 0.44, action: 'call-support' };
  if (patient.monitoringAtTick === null) return { id: 'monitor', narration: 'Arrange continuing review, and record the three weeks of confusion as an open question with no cause established.', focus: 'actions', progress: 0.52, action: 'monitor' };
  if (patient.secondMarkerDueInSeconds !== null) {
    const earlyRemaining = (RENAL_ESTIMATE_SECOND_MARKER_TICKS - RENAL_ESTIMATE_DEMONSTRATION_EARLY_TICKS) / TICKS_PER_SECOND;
    if (patient.secondMarkerDueInSeconds > earlyRemaining) return { id: `early-observation-${patient.secondMarkerRequestedAtTick}`, narration: 'Continue through this authored five-minute observation contrast while the marker is processed. It is not a clinical wait, and the clock reveals no new result.', focus: 'monitor', progress: 0.58 };
    if (!patient.observation) return { id: `early-reassessment-${patient.secondMarkerRequestedAtTick}`, narration: 'Take a full assessment while only the first estimate exists, and notice that the measured filtration line is already empty.', focus: 'actions', progress: 0.65, action: 'reassess' };
    return { id: `marker-observation-${patient.secondMarkerRequestedAtTick}`, narration: 'Continue review while the marker is processed. The authored interval is not a clinical wait, and the first estimate has not changed in the meantime.', focus: 'monitor', progress: 0.74 };
  }
  if (patient.discordanceReviewedAtTick === null) return { id: 'discordance', narration: 'The second estimate is 38 against the first 68 — a disagreement of more than 30%. Record the disagreement itself. Neither is a measurement, and nothing here is going to settle which is closer.', focus: 'actions', progress: 0.84, action: 'review-discordance' };
  const requiredTick = Math.max(patient.secondMarkerRequestedAtTick! + RENAL_ESTIMATE_SECOND_MARKER_TICKS, patient.precisionReviewedAtTick);
  if (!patient.observation || patient.observation.atTick < requiredTick) return {
    id: `discordant-reassessment-${requiredTick}`, narration: 'Request everything together and read the measured-filtration line: it is still empty, and it stays empty. Two estimates, one patient, no measurement.',
    focus: 'actions', progress: 0.90, action: 'reassess' };
  return { id: 'handoff', narration: 'Hand on the disagreement as a disagreement. The temptation is to pick one so the note reads cleanly; what the next clinician needs is the width, what each estimate was generated from, and who owns the decision.', focus: 'actions', progress: 0.96, action: 'handoff' };
}
