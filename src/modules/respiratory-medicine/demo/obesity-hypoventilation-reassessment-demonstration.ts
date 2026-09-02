import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsObesityHypoventilation, type ObesityHypoventilationAction, type ObesityHypoventilationProgress,
} from '../obesity-hypoventilation-reassessment';

export const OBESITY_HYPOVENTILATION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsObesityHypoventilationDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsObesityHypoventilation(scenario);
}

export interface ObesityHypoventilationDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: ObesityHypoventilationAction; readonly finished?: boolean;
}

/**
 * The worked example for a patient whose body size is the least useful fact
 * about her.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. It examines nobody, calculates no BMI or AHI, acquires, scores
 * and interprets no bicarbonate, gas, spirometry or sleep study, diagnoses
 * nothing, and selects no oxygen, device, pressure, drug, weight target or
 * procedure.
 */
export function obesityHypoventilationDemonstrationStep(
  patient?: ObesityHypoventilationProgress,
): ObesityHypoventilationDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She leaves with a pattern that two independent lanes of evidence agree on, a list of what is still open, and a plan built around what she actually wants and can actually reach. Nothing was diagnosed, nothing was prescribed, and no device was chosen. This ends the example, not the evaluation.' };
  }
  if (patient.phenotypeAtTick === null) {
    return { id: 'phenotype', focus: 'monitor', progress: 0.1, action: 'reconcile-obesity-hypoventilation-phenotype-and-trajectory',
      narration: 'Start with her symptoms and her day, not her body size. Twelve months of loud snoring, witnessed pauses, unrefreshing sleep, morning headaches, daytime sleepiness, poor concentration and a walking distance that keeps shrinking. In front of you she is alert, comfortable at rest, speaking full sentences, at 91% on room air with no distress, no fever, no confusion and no rescue context. A BMI of 43.3 is one authored fact among those, and it is the one most likely to be mistaken for the whole assessment. What has changed over a year, and what her day now looks like, is where this starts.' };
  }
  if (patient.awakeEvidenceAtTick === null) {
    return { id: 'awake', focus: 'monitor', progress: 0.28, action: 'review-obesity-hypoventilation-awake-evidence',
      narration: 'Read the awake gas, and be careful what you let the bicarbonate mean. Serum total CO₂ is 31 mmol/L, and the awake room-air gas shows pH 7.38, PaCO₂ 52, PaO₂ 64 and bicarbonate 30 — compensated awake hypercapnia, established by the gas rather than inferred from anything else. A raised bicarbonate is a reasonable prompt to measure PaCO₂ in the right screening context, and it is not a diagnosis of obesity hypoventilation. Neither is an awake saturation on its own. These are fixed reports from an experienced team; you are not ordering, acquiring, calculating or interpreting any of them.' };
  }
  if (patient.sleepEvidenceAtTick === null) {
    return { id: 'sleep', focus: 'monitor', progress: 0.46, action: 'review-obesity-hypoventilation-sleep-evidence-and-open-causes',
      narration: 'Read the sleep study, and notice how much the clean results do not exclude. The attended study records predominantly obstructive events with an AHI of 48, transcutaneous CO₂ rising from the low 50s awake to 64 during sleep, and associated desaturation — severe obstructive sleep apnea plus sustained sleep hypoventilation, reported by qualified staff rather than scored by you. The spirometry shows no obstruction, imaging shows low volumes without focal disease, TSH is 2.1, the neurologic report is clean, and there is no opioid, sedative or alcohol-excess exposure. Those narrow the field. They do not permanently exclude lung, cardiac, pulmonary-vascular, neurologic, neuromuscular, chest-wall, endocrine, metabolic, medication, substance, central-control or technical contributors.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'monitor', progress: 0.64, action: 'recognize-obesity-hypoventilation-working-pattern',
      narration: 'Let the two lanes converge, and do not diagnose from any single number. Awake hypercapnia and sleep hypoventilation in this clinical picture are what establish the authored working pattern — together. BMI alone does not do it, bicarbonate alone does not do it, saturation alone does not do it, PaCO₂ alone does not do it, and neither does an AHI of 48, however striking. What you are recording is a convergent pattern that names the work still to be done, not a diagnosis of obesity hypoventilation syndrome and not a proven cause.' };
  }
  if (patient.coordinatedPlanAtTick === null) {
    return { id: 'plan', focus: 'actions', progress: 0.8, action: 'coordinate-obesity-hypoventilation-shared-plan',
      narration: 'Share the ownership, and keep the respect in it. Respiratory, sleep, primary care, cardiometabolic and weight health, around her preferences, what she can actually access, the diagnostic work still outstanding, the comorbidities still unreviewed, her safety and her follow-up. Nothing here infers what she would want and nothing here selects oxygen, CPAP, NIV, an interface, a mode, a pressure, a backup rate, a drug, a weight target, a nutrition plan, a bariatric procedure or a treatment. The way this conversation is held is part of the clinical work: a plan she does not recognize herself in is not a plan.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-obesity-hypoventilation-reassessment',
    narration: 'Hand off a convergent pattern with its work still open. What travels is the twelve-month symptom and function history, the awake gas and the sleep study and what each one does and does not establish, the contributors that stay open, her documented preferences and access, the diagnostic and comorbidity work still to be done, her safety concerns, the follow-up interval and a name against each part of it. Nothing here determines a diagnosis, a device, a treatment, a disposition, a prognosis or an outcome.' };
}
