import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPostPeDyspnea, type PostPeDyspneaAction, type PostPeDyspneaProgress,
} from '../post-pulmonary-embolism-persistent-dyspnea';

export const POST_PE_DYSPNEA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPostPeDyspneaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPostPeDyspnea(scenario);
}

export interface PostPeDyspneaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PostPeDyspneaAction; readonly finished?: boolean;
}

/**
 * The worked example for the clinic visit that gets dismissed.
 *
 * The comfortable resting observations are what make this easy to write off as
 * deconditioning. This example examines nobody, acquires and interprets no
 * test, diagnoses no CTEPD, selects and stops no anticoagulant, and determines
 * no disposition.
 */
export function postPeDyspneaDemonstrationStep(
  patient?: PostPeDyspneaProgress,
): PostPeDyspneaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She leaves with a referral, an unchanged anticoagulant, and no explanation yet for why she stops at 150 metres. Nothing was proven and nothing was excluded. This ends the example, not the investigation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.1, action: 'reconcile-post-pe-symptoms-and-anticoagulation-course',
      narration: 'Put her old exercise tolerance next to her current one, and take the anticoagulation as given. Two miles and two flights without stopping before the embolism; 150 metres or one flight now, four months later. The record documents continuous therapeutic anticoagulation for those four months with no missed doses, no major bleeding and no early discontinuation — that is verified history rather than something to prescribe or re-check. So this is not a treatment failure question. It is a question about why someone properly treated is still this limited.' };
  }
  if (patient.safetyAtTick === null) {
    return { id: 'safety', focus: 'monitor', progress: 0.32, action: 'review-post-pe-functional-limitation-and-current-safety',
      narration: 'Establish that she is safe today before you interpret anything. Comfortable at rest, a pulse of 88, a room-air saturation of 96%, warm and well perfused, and a supervised six-minute walk of 280 metres with the saturation falling only to 91% and no syncope or chest pain. No hypotension, no rest hypoxemia, no hemoptysis, no new leg swelling, no bleeding. That is a chronic limitation rather than an emergency — and none of it permanently excludes a recurrence, which is why it is established rather than assumed.' };
  }
  if (patient.evidenceAtTick === null) {
    return { id: 'evidence', focus: 'monitor', progress: 0.55, action: 'review-post-pe-ctepd-evidence-and-alternatives',
      narration: 'Read the two reports as a reason to refer, not as a diagnosis. Mild right ventricular enlargement with reduced RV systolic function and a tricuspid-regurgitation velocity of 3.2 m/s, alongside multiple bilateral segmental mismatched perfusion defects on V/Q SPECT. That combination raises chronic thromboembolic disease, and a mismatched-defect pattern is what makes the perfusion scan the right test for this question. It does not diagnose CTEPD or CTEPH: there is no right-heart catheterization, no anatomic adjudication and no expert conclusion here. Left-heart disease, parenchymal lung disease, anemia, deconditioning and a recurrence all stay open.' };
  }
  if (patient.referralAtTick === null) {
    return { id: 'referral', focus: 'actions', progress: 0.78, action: 'activate-post-pe-pulmonary-vascular-referral',
      narration: 'Refer to pulmonary vascular expertise and say who holds the anticoagulation until then. This is the step the lesson exists for. Chronic thromboembolic pulmonary hypertension is the potentially curable cause of persistent post-PE dyspnea, it is diagnosed by a multidisciplinary assessment rather than by a clinic, and the way it gets missed is that nobody makes the referral. Anticoagulation continues under named ownership while that evaluation is arranged, because the interval before an appointment is exactly when ownership goes missing.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-post-pe-persistent-dyspnea-reassessment',
    narration: 'Nothing here establishes CTEPD, a treatment, a procedure or an outcome. Hand off the gap between what she could do and what she can, the current safety and what it does not exclude, the two reports and what they raise rather than settle, the referral and who is chasing it, and the anticoagulation ownership until somebody with the right expertise has seen her.' };
}
