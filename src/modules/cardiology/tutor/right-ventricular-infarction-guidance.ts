import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { RightVentricularInfarctionProgress } from '../right-ventricular-infarction';

export const RIGHT_VENTRICULAR_INFARCTION_TUTOR_VERSION = '0.1.0';

export interface RightVentricularInfarctionPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is the treatment a hypotensive chest-pain patient
 * usually gets. Nitrates and diuretics are the two drugs most likely to be
 * reached for here and the two most likely to do harm, because a dilated
 * dysfunctional right ventricle is filling a small underfilled left one and
 * both of those drugs take preload away. The second reflex is subtler: the
 * right-sided thinking is interesting enough to become a reason to slow down,
 * and the reperfusion pathway is already running. It is silent on the
 * unassisted setting, silent once the handoff is recorded, and silent for any
 * scenario version it was not written against.
 */
export function rightVentricularInfarctionInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: RightVentricularInfarctionProgress },
): RightVentricularInfarctionPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.reconciledAtTick === null) return prompt('rvi-trajectory', true,
    'Low pressure with clear lungs and a high JVP. Say what kind of low pressure that is.',
    'A sixty-six-year-old man, fifty-five minutes of ongoing chest pressure, a primary-PCI pathway already activated, and fixed reports of inferior ST elevation with reciprocal lateral depression and 1.5 mm of ST elevation in V4R. He is 54/min in sinus, 86/60, 96% on air, alert, warm, capillary refill two seconds, with an elevated JVP and clear lungs; the urine output and lactate do not establish multi-organ shock. That combination — hypotensive, congested on the right, dry lungs, still perfusing — is preload-sensitive hypotension rather than declared shock, and the two are managed almost oppositely. Say which one this is, and keep pulmonary embolism, evolving mechanical disease, bradyarrhythmia and block, bleeding and medication effects open while you do; none of them has been excluded, and no single lead, pressure or lung finding is a rule.');
  if (patient.phenotypeAtTick === null && patient.reperfusionAtTick === null) return prompt('rvi-parallel', true,
    'Two lanes, either order — and one of them is a clock somebody else is already running.',
    'The first is the right-sided phenotype: what the V4R elevation and the echo report actually support. The second is keeping the activated primary-PCI pathway moving, alongside rhythm, conduction and defibrillation readiness — which is not generic caution, because inferior infarction and heart block travel together and he is already at 54. They are unordered because they are genuinely simultaneous, and the reason that matters here more than in any other lesson in this module is that the interesting half is the one that can quietly consume the time the other half does not have. RV thinking runs alongside reperfusion. It is never a reason to pause it.');
  if (patient.phenotypeAtTick === null) return prompt('rvi-phenotype', true,
    'Read the right-sided reports as a phenotype, not a diagnosis you have made.',
    'The fixed reports describe inferior ST elevation, 1.5 mm in V4R, moderate RV dilation with reduced RV systolic function, and a small underfilled left ventricle with preserved LV function, no effusion, no reported severe valve lesion and no septal defect. Together those support acute right-ventricular involvement in this authored case, and that phrasing is deliberate — no one of those signs is diagnostic on its own, you acquired and interpreted none of them, and the alternatives that would change everything are still open. The small underfilled LV is the finding worth carrying forward: it is small because the right ventricle is not delivering, which is why his pressure is what it is and why the next step is about preload.');
  if (patient.reperfusionAtTick === null) return prompt('rvi-reperfusion', true,
    'Before you plan any support, say out loud that the reperfusion pathway is still moving.',
    'The primary-PCI pathway was activated before you arrived and it is time-sensitive; what gets recorded is that it stays active, alongside continuous rhythm monitoring and bradyarrhythmia, atrioventricular-block and defibrillation readiness — which is not generic caution, because inferior infarction and heart block travel together and he is already at 54. You perform no PCI and complete no reperfusion; this lesson claims neither. Recording this lane is how the record shows that the RV review happened next to reperfusion rather than in front of it.');
  if (patient.supportAtTick === null) return prompt('rvi-support', true,
    'Now the support — and the two drugs you would ordinarily reach for are the two to leave alone.',
    'A nitrate and a reflex diuretic are the reflexes this presentation invites and both take away the preload that the failing right ventricle needs to fill the left, which is how a hypotensive patient becomes a shocked one in the space of a few minutes. Neither is selected here. What replaces them is not an opposite recipe: no fixed fluid volume, no blind fluid loading, no universal pressure target and no universal prohibition either, because a real preload decision needs verified congestion, verified filling, the perfusion in front of you and the response to what you already did. The guardrails link preload, systemic perfusion, congestion, rhythm, conduction, oxygenation and serial response, and every one of them is his rather than everybody\'s.');
  return prompt('rvi-handoff', true,
    'Hand off a patient who has not been treated yet, and be precise that the quiet interval means nothing.',
    'The later report is persisting chest pressure, 52/min in sinus, 88/62, a respiratory rate of 18, 96% on air, alert and warm, JVP still elevated and lungs still clear. He is unchanged, which is not a response to anything — nothing was delivered, and reperfusion has not happened. What goes across is the exact symptoms and ECG reports, the pressure, perfusion, rhythm, conduction and congestion, the alternatives still open, the reperfusion status, the treatment choices nobody has made, and the triggers that would change the plan. Nothing here examines him, acquires or interprets ECG, echo, monitoring, laboratory or catheter data, diagnoses a real patient, prescribes or delivers fluid, a nitrate, a diuretic, a vasopressor, an inotrope, an antithrombotic, oxygen or another treatment, performs PCI or another procedure, determines disposition or prognosis, or predicts outcome.');
}
