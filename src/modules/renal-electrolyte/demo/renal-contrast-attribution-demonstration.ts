import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { RenalContrastAttributionSnapshot } from '@platform/kernel/protocol';
import { supportsRenalContrastAttribution, RENAL_CONTRAST_RECORD_TICKS,
  type RenalContrastAction } from '../contrast-attribution';

export const RENAL_CONTRAST_DEMONSTRATION_VERSION = '0.1.0';
export const RENAL_CONTRAST_DEMONSTRATION_EARLY_TICKS = 5 * 60 * TICKS_PER_SECOND;
export function supportsRenalContrastAttributionDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsRenalContrastAttribution(scenario);
}
export interface RenalContrastDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: RenalContrastAction; readonly finished?: boolean;
}
export function renalContrastAttributionDemonstrationStep(patient?: RenalContrastAttributionSnapshot): RenalContrastDemonstrationStep {
  if (!patient) return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  if (patient.ended) return { id: 'finished', narration: patient.ended === 'handoff'
    ? 'The unresolved cause, the withdrawn exposures, and the continuing search are handed off. This ends the example, not the search, and it names no cause.'
    : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.', focus: 'actions', progress: 1, finished: true };
  if (patient.labelReviewedAtTick === null) return { id: 'label', narration: 'Read the note again before doing anything with it. "Contrast-induced nephropathy" is written in the ward record, and no result, report, or opinion says it. Someone attributed it three days ago and the search stopped there.', focus: 'actions', progress: 0.05, action: 'review-label' };
  if (patient.alternativesReviewedAtTick === null) return { id: 'alternatives', narration: 'List what the label did not exclude: two nights with a systolic pressure below 90 mmHg, a renin-angiotensin blocker that never stopped, three days of an anti-inflammatory, and a fever with a C-reactive protein that went from 22 to 141. Naming them makes none of them the cause.', focus: 'actions', progress: 0.14, action: 'review-alternatives' };
  if (patient.exposuresWithdrawnAtTick === null) return { id: 'withdraw', narration: 'Stop the two nephrotoxic exposures that are still running, with the responsible team. This is the one thing here that is still happening and can be changed; it is not an attribution and it does not treat the injury.', focus: 'actions', progress: 0.24, action: 'withdraw-exposures' };
  if (patient.evidenceReviewedAtTick === null) return { id: 'evidence', narration: 'Review why a rise after an exposure attributes nothing on its own. Work that compared enhanced, unenhanced and unscanned patients with propensity matching did not find the association the label assumes — and being single-centre and retrospective, it argues against a strong causal claim rather than proving none.', focus: 'actions', progress: 0.34, action: 'review-evidence' };
  if (!patient.supportActive) return { id: 'support', narration: 'Share the open question with renal, ward, pharmacy, and nursing teams. A nephrology opinion is not a prerequisite for reading the chart that was there all along.', focus: 'actions', progress: 0.43, action: 'call-support' };
  if (patient.monitoringAtTick === null) return { id: 'monitor', narration: 'Arrange serial creatinine, urine output, perfusion, and inflammatory review, and keep the source question open rather than closed.', focus: 'actions', progress: 0.52, action: 'monitor' };
  if (patient.recordDueInSeconds !== null) {
    const earlyRemaining = (RENAL_CONTRAST_RECORD_TICKS - RENAL_CONTRAST_DEMONSTRATION_EARLY_TICKS) / TICKS_PER_SECOND;
    if (patient.recordDueInSeconds > earlyRemaining) return { id: `early-observation-${patient.alternativesReviewedAtTick}`, narration: 'Continue through this authored five-minute observation contrast while the charts are retrieved. It is not a clinical wait, and the clock reveals no new result.', focus: 'monitor', progress: 0.58 };
    if (!patient.observation) return { id: `early-reassessment-${patient.alternativesReviewedAtTick}`, narration: 'Take a full assessment now, before the charts arrive, so there is something to compare against. Note how much of the picture rests on a two-line summary.', focus: 'actions', progress: 0.66, action: 'reassess' };
    return { id: `record-observation-${patient.alternativesReviewedAtTick}`, narration: 'Continue surveillance while the full observation and drug charts are retrieved. The authored interval is not a clinical wait, and the earlier summary stays historical.', focus: 'monitor', progress: 0.76 };
  }
  const requiredTick = Math.max(patient.alternativesReviewedAtTick! + RENAL_CONTRAST_RECORD_TICKS, patient.labelReviewedAtTick);
  if (!patient.observation || patient.observation.atTick < requiredTick) return {
    id: `record-reassessment-${requiredTick}`, narration: 'The full charts are open. Request everything together and read what was in them: four episodes below a systolic 90 mmHg rather than two, and a lowest pressure of 78. The creatinine is still rising, which confirms nothing either way.',
    focus: 'actions', progress: 0.88, action: 'reassess' };
  return { id: 'handoff', narration: 'Hand over an open question, in those words. The exposures are withdrawn, the hypotension and the fever are still being worked up, and the note now reads as an attribution rather than a finding.', focus: 'actions', progress: 0.96, action: 'handoff' };
}
