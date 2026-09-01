import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { MeningitisImagingSnapshot } from '@platform/kernel/protocol';
import { supportsMeningitisImaging, type MeningitisImagingAction } from '../meningitis-imaging';

export const MENINGITIS_IMAGING_DEMONSTRATION_VERSION = '0.1.0';

export function supportsMeningitisImagingDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsMeningitisImaging(scenario);
}

export interface MeningitisImagingDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: MeningitisImagingAction; readonly finished?: boolean;
}

/**
 * The worked example for five criteria sets that do not agree.
 *
 * The example does not pick a winner. Two sets say image before puncture and
 * three do not, on the same three features, and choosing between them would
 * invent a consensus the literature does not have. What it does instead is
 * record the antimicrobial intent before the imaging question is even compared,
 * because every set that recommends imaging also says treatment must not wait —
 * which makes the disagreement survivable rather than paralysing.
 */
export function meningitisImagingDemonstrationStep(
  patient?: MeningitisImagingSnapshot,
): MeningitisImagingDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'The disagreement travels as a disagreement: which features are present, which sets fire on them, that the treatment did not wait for any of it, and what the scan did and did not change. No rule was declared correct here. This ends the example, not the illness.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.featuresRecordedAtTick === null) {
    return { id: 'features', focus: 'actions', progress: 0.08, action: 'record-triggering-features',
      narration: 'Record the three features as measured, and what is absent: age 68, maintenance immunosuppression after kidney transplantation, and a Glasgow Coma Scale score of 14. Which criteria set fires depends entirely on these.' };
  }
  if (patient.ownersActivatedAtTick === null) {
    return { id: 'owners', focus: 'actions', progress: 0.2, action: 'activate-time-critical-owners',
      narration: 'Activate time-critical infection, neurology, and nursing ownership on the pattern, with cultures drawn before antimicrobials by the qualified team. None of that depends on how the imaging question resolves.' };
  }
  if (patient.antimicrobialIntentAtTick === null) {
    return { id: 'intent', focus: 'actions', progress: 0.34, action: 'record-antimicrobial-intent',
      narration: 'Record antimicrobial intent now, before the imaging question is even opened. Every set that recommends imaging also says treatment must not wait for it, and deciding the imaging first is what turns a disagreement between guidelines into a delay in treatment.' };
  }
  if (patient.criteriaComparedAtTick === null) {
    return { id: 'criteria', focus: 'actions', progress: 0.48, action: 'compare-criteria-sets',
      narration: 'Compare the five published sets against this one patient, and leave them disagreeing: two say image before puncture and three do not, on these same three features. That is a real disagreement in the literature rather than a question with a hidden right answer.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.6, action: 'review-boundaries',
      narration: 'Review what each exclusion is worth. A normal C-reactive protein does not rule this out, and the guidance says so in as many words; a Gram stain is specific enough that a positive result informs, roughly half sensitive, and lower still after antimicrobials.' };
  }
  if (patient.monitoringAtTick === null) {
    return { id: 'monitor', focus: 'actions', progress: 0.7, action: 'monitor',
      narration: 'Keep neurological observation running while this is decided. The features that would change the imaging answer are exactly the ones that can change during the wait.' };
  }
  if (!patient.imagingResulted) {
    return { id: 'away', focus: 'monitor', progress: 0.82,
      narration: patient.localPathwayApplied
        ? 'The receiving unit applies its own local criteria, which include immunosuppression, and the patient goes for imaging. The clock keeps running, and that is worth recording rather than resenting — the treatment intent is already in.'
        : 'Keep watching while the authored interval runs. It is a contrast rather than a real turnaround time, and the recorded intent does not need restating.' };
  }
  if (!patient.imagingObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.9, action: 'reassess',
      narration: 'Take a current full assessment now the scan is reported: no space-occupying lesion, nothing that contraindicates a puncture, and no management changed. That is the common result rather than a surprise.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: 'Hand off the disagreement rather than a resolution of it, with the treatment already given and the scan reported as changing nothing. A settled rule was never available to hand on.' };
}
