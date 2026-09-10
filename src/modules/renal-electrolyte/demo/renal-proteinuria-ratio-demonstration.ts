import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { RenalProteinuriaRatioSnapshot } from '@platform/kernel/protocol';
import { supportsRenalProteinuriaRatio, RENAL_PROTEINURIA_REPEAT_TICKS,
  type RenalProteinuriaAction } from '../proteinuria-ratio';

export const RENAL_PROTEINURIA_DEMONSTRATION_VERSION = '0.1.0';
export const RENAL_PROTEINURIA_DEMONSTRATION_EARLY_TICKS = 5 * 60 * TICKS_PER_SECOND;
export function supportsRenalProteinuriaRatioDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsRenalProteinuriaRatio(scenario);
}
export interface RenalProteinuriaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: RenalProteinuriaAction; readonly finished?: boolean;
}
export function renalProteinuriaRatioDemonstrationStep(patient?: RenalProteinuriaRatioSnapshot): RenalProteinuriaDemonstrationStep {
  if (!patient) return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  if (patient.ended) return { id: 'finished', narration: patient.ended === 'handoff'
    ? 'The comparison, the sampling conditions, the unchanged picture, and the matched repeat are handed on. This ends the example, not the follow-up, and the question is narrower rather than closed.'
    : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.', focus: 'actions', progress: 1, finished: true };
  if (patient.variationComparedAtTick === null) return { id: 'variation', narration: 'Do the comparison before anything else. The rise from 168 to 312 is +86%. The reference change for a random spot ratio is +124%, from a within-person coefficient of variation of about 30%. This rise sits inside the band — which settles neither way, and is exactly why it cannot be acted on yet.', focus: 'actions', progress: 0.05, action: 'compare-variation' };
  if (patient.samplingReviewedAtTick === null) return { id: 'sampling', narration: 'Look at how each sample was taken. Both are random afternoon spots, and protein excretion moves through the day — peaking at 6 to 12 hours and lowest at 18 to 24 in the series behind this lesson. That does not make either value wrong; it makes them hard to compare.', focus: 'actions', progress: 0.15, action: 'review-sampling' };
  if (patient.patientReviewedAtTick === null) return { id: 'patient', narration: 'Check her against the number. Blood pressure, weight, creatinine, sediment, and how she feels are all where they were. That is agreement between an unchanged patient and an uncertain measurement — not proof that nothing is happening.', focus: 'actions', progress: 0.25, action: 'review-patient' };
  if (patient.repeatRequestedAtTick === null) return { id: 'repeat', narration: 'Ask for the measurement that would actually separate them: a first morning sample under matched conditions, not a third random afternoon value. It was available at the last visit too, and nobody requested it.', focus: 'actions', progress: 0.35, action: 'request-repeat' };
  if (patient.decisionOwnedAtTick === null) return { id: 'ownership', narration: 'Place the treatment decision with the team, with what it rests on stated, while the repeat is pending. The example selects no drug and no dose, and does not decide whether her treatment should change.', focus: 'actions', progress: 0.44, action: 'own-decision' };
  if (!patient.supportActive) return { id: 'support', narration: 'Share the interpretation and the repeat sampling with the renal and nursing teams.', focus: 'actions', progress: 0.52, action: 'call-support' };
  if (patient.monitoringAtTick === null) return { id: 'monitor', narration: 'Arrange continuing review with the sampling conditions recorded each time, so that the next comparison is between things that can be compared.', focus: 'actions', progress: 0.60, action: 'monitor' };
  if (patient.repeatDueInSeconds !== null) {
    const earlyRemaining = (RENAL_PROTEINURIA_REPEAT_TICKS - RENAL_PROTEINURIA_DEMONSTRATION_EARLY_TICKS) / TICKS_PER_SECOND;
    if (patient.repeatDueInSeconds > earlyRemaining) return { id: `early-observation-${patient.repeatRequestedAtTick}`, narration: 'Continue through this authored five-minute observation contrast while the matched sample is processed. It is not a clinical wait, and the clock reveals no new result.', focus: 'monitor', progress: 0.66 };
    if (!patient.observation) return { id: `early-reassessment-${patient.repeatRequestedAtTick}`, narration: 'Take a full assessment before the matched sample returns, and notice that the whole case currently rests on two afternoon values.', focus: 'actions', progress: 0.73, action: 'reassess' };
    return { id: `repeat-observation-${patient.repeatRequestedAtTick}`, narration: 'Continue review while the matched sample is processed. The authored interval is not a clinical wait, and the supplied pair has not changed in the meantime.', focus: 'monitor', progress: 0.81 };
  }
  const requiredTick = Math.max(patient.repeatRequestedAtTick! + RENAL_PROTEINURIA_REPEAT_TICKS, patient.variationComparedAtTick);
  if (!patient.observation || patient.observation.atTick < requiredTick) return {
    id: `repeat-reassessment-${requiredTick}`, narration: 'Request everything together. The matched first morning value is 189 mg/g. That narrows the question considerably — and it is still one value, not a timed collection, and it establishes no cause.',
    focus: 'actions', progress: 0.90, action: 'reassess' };
  return { id: 'handoff', narration: 'Hand on the comparison, the sampling conditions, and the matched value together. The point worth carrying is that the measurement which settled most of this took one request, at a visit where nobody made it.', focus: 'actions', progress: 0.96, action: 'handoff' };
}
