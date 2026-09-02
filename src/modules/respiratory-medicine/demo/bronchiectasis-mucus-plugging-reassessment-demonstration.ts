import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsBronchiectasisMucusPlugging, type BronchiectasisMucusPluggingAction, type BronchiectasisMucusPluggingProgress,
} from '../bronchiectasis-mucus-plugging-reassessment';

export const BRONCHIECTASIS_MUCUS_PLUGGING_DEMONSTRATION_VERSION = '0.1.0';

export function supportsBronchiectasisMucusPluggingDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsBronchiectasisMucusPlugging(scenario);
}

export interface BronchiectasisMucusPluggingDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: BronchiectasisMucusPluggingAction; readonly finished?: boolean;
}

/**
 * The worked example for a woman whose own clearance routine has stopped
 * working.
 *
 * The treatment is a physiotherapist supporting her routine rather than anyone
 * inventing a new one. This example examines nobody, tests no cough, assesses
 * no sputum, performs no clearance or suction, and selects no device or
 * technique.
 */
export function bronchiectasisMucusPluggingDemonstrationStep(
  patient?: BronchiectasisMucusPluggingProgress,
): BronchiectasisMucusPluggingDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on breathing more easily, clearing better, and with a lobe that is still partly down for a reason nobody has established. Nothing was proven and nothing was performed. This ends the example, not the investigation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-bronchiectasis-mucus-plugging-trajectory',
      narration: 'Start from the routine that normally works, and note that it has stopped. She is independent with an individualized airway-clearance routine and normally sits at 95% on room air. Over two days the sputum has thickened, the fatigue has built, and she can no longer clear it. Now: short sentences, 108, breathing at 28, 88% on room air, a weak ineffective cough, coarse central sounds and markedly reduced left-base air entry. The weak cough is the mechanism — the secretions have not changed location, her ability to move them has.' };
  }
  if (patient.evidenceAtTick === null) {
    return { id: 'evidence', focus: 'monitor', progress: 0.26, action: 'review-bronchiectasis-mucus-plugging-evidence-and-alternatives',
      narration: 'Let the imaging support the working pattern without closing it. New left-lower-lobe volume loss with retrocardiac opacity and a raised left hemidiaphragm, and a CT showing dense endobronchial material in the left-lower-lobe bronchus with downstream atelectasis and no definite central mass. In a woman with bronchiectasis and two days of failing clearance, mucus impaction is the working pattern. It is not a diagnosis: infection, blood, aspiration, a foreign body, an occult obstructing lesion and compression all stay open, and "no definite central mass" on one study is not the same as no lesion.' };
  }
  if (patient.clearanceIntentAtTick === null) {
    return { id: 'intent', focus: 'actions', progress: 0.46, action: 'record-bronchiectasis-mucus-plugging-supported-airway-clearance-intent',
      narration: 'Ask for a physiotherapist and support her own routine rather than replacing it. Experienced respiratory-physiotherapy review and a supported, individualized airway-clearance trial. Individualized is the operative word: she already has a routine that works for her, and what she needs is help executing it while she is exhausted, not somebody else’s protocol. This is the step the lesson exists to record, and it is recorded as intent — the technique, the device and the delivery belong to the physiotherapist.' };
  }
  if (patient.responseAtTick === null) {
    return { id: 'response', focus: 'monitor', progress: 0.64, action: 'review-bronchiectasis-mucus-plugging-later-response',
      narration: 'Read the response as real and incomplete. Thick secretions expectorated during team-delivered care, a stronger cough, full sentences, 98, breathing at 22, and 93% on room air, with coarse sounds and left-base air entry both improved. The radiograph shows partial re-expansion with residual left-lower-lobe volume loss. That is a genuine response to the right treatment, and it proves neither complete clearance nor complete re-expansion — the residual collapse is the part that still needs explaining.' };
  }
  if (patient.escalationAtTick === null) {
    return { id: 'escalation', focus: 'actions', progress: 0.82, action: 'escalate-bronchiectasis-mucus-plugging-persistent-collapse',
      narration: 'Escalate what is left rather than accepting it as her new normal. Residual focal collapse after effective clearance is the finding that should not be filed under bronchiectasis. It needs experienced respiratory and airway-capable evaluation, because the alternatives that were open at the start — a lesion, a foreign body, something obstructing that is not mucus — are exactly the ones that a partial response fails to exclude. A patient who improved is the easiest patient in the department to stop thinking about.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-bronchiectasis-mucus-plugging-reassessment',
    narration: 'Hand off an improvement with an unexplained remainder. Nothing here establishes complete clearance, complete re-expansion, a cause, a disposition or an outcome. What travels is her normal routine and why it failed, the imaging and what it leaves open, the physiotherapy support and what it achieved, the residual collapse, and the named respiratory and airway-capable ownership for the evaluation of what is still there.' };
}
