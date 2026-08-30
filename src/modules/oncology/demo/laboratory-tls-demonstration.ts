import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { LaboratoryTlsSnapshot } from '@platform/kernel/protocol';
import { supportsLaboratoryTls, type LaboratoryTlsAction } from '../laboratory-tls';

export const LABORATORY_TLS_DEMONSTRATION_VERSION = '0.1.0';

export function supportsLaboratoryTlsDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsLaboratoryTls(scenario);
}

export interface LaboratoryTlsDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: LaboratoryTlsAction; readonly finished?: boolean;
}

/**
 * The worked example for a syndrome he does not have yet.
 *
 * It records the qualifier first and never drops it, because both failures this
 * lesson teaches come from the same move: settling a two-part answer into one
 * part. Filing it as numbers in a well patient and calling it tumour lysis
 * syndrome are the same error pointing opposite ways, and an example that reached
 * a tidy label would model it.
 */
export function laboratoryTlsDemonstrationStep(
  patient?: LaboratoryTlsSnapshot,
): LaboratoryTlsDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'Which definition is met, what crossed and when, and what would make him cross over are handed to the team that owns the treatment, with the label still qualified. This ends the example, not the monitoring.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.definitionRecordedAtTick === null) {
    return { id: 'definition', focus: 'actions', progress: 0.07, action: 'record-which-definition-is-met',
      narration: 'Record which definition is met and which is not. He meets the laboratory one and not the clinical one, and that pair is the finding. The qualifier is not a hedge attached to a diagnosis; dropping it in either direction is the error this lesson is built from.' };
  }
  if (patient.crossingRecordedAtTick === null) {
    return { id: 'crossing', focus: 'actions', progress: 0.18, action: 'record-what-crossed-and-when',
      narration: 'Record what crossed and how long after treatment. The laboratory changes are described in the first day and the clinical ones a day or two later, so the interval is what makes these values readable rather than a baseline nobody checked.' };
  }
  if (patient.riskRecordedAtTick === null) {
    return { id: 'risk', focus: 'actions', progress: 0.29, action: 'record-the-crossing-risk',
      narration: 'Record what would raise the risk of crossing into the clinical definition. The useful question is not what he has now; it is what would change that, because that is what the monitoring is watching for.' };
  }
  if (patient.escalationAtTick === null) {
    return { id: 'escalate', focus: 'actions', progress: 0.42, action: 'escalate-to-the-treating-team',
      narration: 'Tell the treating team, carrying both readings rather than the one that sounds more decisive. Nobody arrives unbidden here, and the failure worth avoiding is a ward settling the label among itself while the people who own the treatment hear neither half.' };
  }
  if (patient.treatmentIntentAtTick === null) {
    return { id: 'intent', focus: 'actions', progress: 0.54, action: 'record-bounded-monitoring-and-treatment-intent',
      narration: 'Record bounded monitoring and treatment intent, and start nothing. Hydration, hypouricaemic treatment, monitoring frequency and any renal referral belong to them.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.64, action: 'review-boundaries',
      narration: 'Review what is not settled here. No grade, no level of care, and no treatment is chosen, and a patient asking about breakfast is not evidence that the laboratory picture does not matter.' };
  }
  if (patient.observation === null) {
    return { id: 'assess', focus: 'actions', progress: 0.74, action: 'reassess',
      narration: 'Take a current full assessment rather than a partial check. The bloods supply no observations and the observations supply no bloods; a handoff carrying one asks the next person to guess the other.' };
  }
  if (!patient.teamResponded) {
    return { id: 'observe', focus: 'monitor', progress: 0.85,
      narration: patient.repeatReturned
        ? 'The repeat set has moved and he has not: phosphate up again, corrected calcium down further, creatinine unchanged, passing urine, sinus rhythm, asking about breakfast. That gap is the presentation, not a contradiction to be resolved in favour of one of them.'
        : 'Keep both readings under review while the team answers. This authored interval is a contrast rather than a required clinical wait; pause freely.' };
  }
  if (!patient.teamObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.92, action: 'reassess',
      narration: 'Take a fresh assessment now the team has answered, accepted the laboratory definition as met and the clinical one as not, and asked to be told if the creatinine moves or the rhythm changes — a different trigger from the next number crossing a line.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: 'Hand off with the label qualified and the treatment theirs. A resolved label, a chosen level of care, and a started treatment are not handoff gates. What travels is which definition is met, what crossed and when, and what would make him cross over.' };
}
