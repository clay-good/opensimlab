import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsRightVentricularInfarction, type RightVentricularInfarctionAction,
  type RightVentricularInfarctionProgress,
} from '../right-ventricular-infarction';

export const RIGHT_VENTRICULAR_INFARCTION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsRightVentricularInfarctionDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsRightVentricularInfarction(scenario);
}

export interface RightVentricularInfarctionDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: RightVentricularInfarctionAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a low pressure that must not be treated the usual way.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. Where the pair is unordered the example takes the reperfusion
 * lane first and reviews the phenotype second — a choice, and a pointed one,
 * because the interesting half is the half that quietly consumes the time the
 * other half does not have. It examines nobody, acquires or interprets no ECG,
 * echo, monitoring, laboratory or catheter data, diagnoses no real patient,
 * prescribes or delivers no fluid, nitrate, diuretic, vasopressor, inotrope,
 * antithrombotic, oxygen or other treatment, performs no PCI or other
 * procedure, determines no disposition, and predicts no outcome.
 */
export function rightVentricularInfarctionDemonstrationStep(
  patient?: RightVentricularInfarctionProgress,
): RightVentricularInfarctionDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He is unchanged, and unchanged is the honest word: no nitrate, no diuretic, no fluid volume, no target, no reperfusion completed and nothing delivered. What this review produced was a reason not to give him the two drugs a hypotensive man with chest pain usually gets, and a record showing the right-sided thinking never stood in front of the clock. This ends the example, not the evaluation.' };
  }
  if (patient.reconciledAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.12, action: 'reconcile-right-ventricular-infarction',
      narration: 'Low pressure with clear lungs and a high JVP. Say what kind of low pressure that is. A sixty-six-year-old man, fifty-five minutes of ongoing chest pressure, a primary-PCI pathway already activated, and fixed reports of inferior ST elevation with reciprocal lateral depression and 1.5 mm of ST elevation in V4R. He is 54/min in sinus, 86/60, 96% on air, alert, warm, capillary refill two seconds, with an elevated JVP and clear lungs; the urine output and lactate do not establish multi-organ shock. That combination — hypotensive, congested on the right, dry lungs, still perfusing — is preload-sensitive hypotension rather than declared shock, and the two are managed almost oppositely. Say which one this is, and keep pulmonary embolism, evolving mechanical disease, bradyarrhythmia and block, bleeding and medication effects open while you do; none of them has been excluded, and no single lead, pressure or lung finding is a rule.' };
  }
  if (patient.reperfusionAtTick === null) {
    return { id: 'parallel', focus: 'actions', progress: 0.3, action: 'preserve-right-ventricular-infarction-reperfusion',
      narration: 'Two lanes, either order — and one of them is a clock somebody else is already running. The first is the right-sided phenotype: what the V4R elevation and the echo report actually support. The second is keeping the activated primary-PCI pathway moving, alongside rhythm, conduction and defibrillation readiness — which is not generic caution, because inferior infarction and heart block travel together and he is already at 54. They are unordered because they are genuinely simultaneous, and the reason that matters here more than in any other lesson in this module is that the interesting half is the one that can quietly consume the time the other half does not have. RV thinking runs alongside reperfusion. It is never a reason to pause it.' };
  }
  if (patient.phenotypeAtTick === null) {
    return { id: 'phenotype', focus: 'monitor', progress: 0.5, action: 'review-right-ventricular-infarction-phenotype',
      narration: 'Read the right-sided reports as a phenotype, not a diagnosis you have made. The fixed reports describe inferior ST elevation, 1.5 mm in V4R, moderate RV dilation with reduced RV systolic function, and a small underfilled left ventricle with preserved LV function, no effusion, no reported severe valve lesion and no septal defect. Together those support acute right-ventricular involvement in this authored case, and that phrasing is deliberate — no one of those signs is diagnostic on its own, you acquired and interpreted none of them, and the alternatives that would change everything are still open. The small underfilled LV is the finding worth carrying forward: it is small because the right ventricle is not delivering, which is why his pressure is what it is and why the next step is about preload.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.72, action: 'record-right-ventricular-infarction-support',
      narration: 'Now the support — and the two drugs you would ordinarily reach for are the two to leave alone. A nitrate and a reflex diuretic are the reflexes this presentation invites and both take away the preload that the failing right ventricle needs to fill the left, which is how a hypotensive patient becomes a shocked one in the space of a few minutes. Neither is selected here. What replaces them is not an opposite recipe: no fixed fluid volume, no blind fluid loading, no universal pressure target and no universal prohibition either, because a real preload decision needs verified congestion, verified filling, the perfusion in front of you and the response to what you already did. The guardrails link preload, systemic perfusion, congestion, rhythm, conduction, oxygenation and serial response, and every one of them is his rather than everybody\'s.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-right-ventricular-infarction',
    narration: 'Hand off a patient who has not been treated yet, and be precise that the quiet interval means nothing. The later report is persisting chest pressure, 52/min in sinus, 88/62, a respiratory rate of 18, 96% on air, alert and warm, JVP still elevated and lungs still clear. He is unchanged, which is not a response to anything — nothing was delivered, and reperfusion has not happened. What goes across is the exact symptoms and ECG reports, the pressure, perfusion, rhythm, conduction and congestion, the alternatives still open, the reperfusion status, the treatment choices nobody has made, and the triggers that would change the plan. Nothing here examines him, acquires or interprets ECG, echo, monitoring, laboratory or catheter data, diagnoses a real patient, prescribes or delivers fluid, a nitrate, a diuretic, a vasopressor, an inotrope, an antithrombotic, oxygen or another treatment, performs PCI or another procedure, determines disposition or prognosis, or predicts outcome.' };
}
