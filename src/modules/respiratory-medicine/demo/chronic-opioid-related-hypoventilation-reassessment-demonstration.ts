import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsChronicOpioidHypoventilation, type ChronicOpioidHypoventilationAction, type ChronicOpioidHypoventilationProgress,
} from '../chronic-opioid-related-hypoventilation-reassessment';

export const CHRONIC_OPIOID_HYPOVENTILATION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsChronicOpioidHypoventilationDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsChronicOpioidHypoventilation(scenario);
}

export interface ChronicOpioidHypoventilationDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: ChronicOpioidHypoventilationAction; readonly finished?: boolean;
}

/**
 * The worked example for a diagnosis that would be easy and unfair to make.
 *
 * Chronic opioid exposure is a contributor here rather than a proven cause.
 * This example examines nobody, acquires, scores and interprets no gas or
 * sleep study, selects no dose, taper or naloxone, and chooses no support
 * device.
 */
export function chronicOpioidHypoventilationDemonstrationStep(
  patient?: ChronicOpioidHypoventilationProgress,
): ChronicOpioidHypoventilationDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She leaves with her analgesia unchanged, a pattern that has been described rather than attributed, and a named owner for every part of the work that is left. Nothing was proven and nothing was prescribed. This ends the example, not the evaluation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.1, action: 'reconcile-chronic-opioid-related-hypoventilation-exposure-and-trajectory',
      narration: 'Read eight years of stable therapy against six months of new symptoms. Prescribed opioids for chronic noncancer pain for eight years, with no recent dose escalation, no illicit exposure, no postoperative recovery and no acute intoxication. What is new is six months old: her partner has noticed shallow irregular breathing in sleep, and she has morning headaches, unrefreshing sleep and increasing daytime sleepiness. She is comfortable in clinic at 94% on room air, breathing ten times a minute. This is not an overdose and it is not an emergency — it is a chronic pattern that has been developing while everyone watched the dose stay the same.' };
  }
  if (patient.evidenceAtTick === null) {
    return { id: 'evidence', focus: 'monitor', progress: 0.32, action: 'review-chronic-opioid-related-hypoventilation-awake-and-sleep-evidence',
      narration: 'Let the sleep study say what the daytime numbers cannot. Her awake gas is essentially normal — pH 7.39, PaCO₂ 44, bicarbonate 26 — and one awake saturation of 94% says nothing about the eight hours nobody was watching. The attended study with transcutaneous CO₂ is where the finding lives: a rise from 46 awake to 58 during sleep, sustained for twenty-four minutes, with desaturation and separately reported central and obstructive events. The sleep specialist calls it a sleep-related hypoventilation pattern requiring integrated review, which is a description rather than a diagnosis.' };
  }
  if (patient.alternativesAtTick === null) {
    return { id: 'alternatives', focus: 'monitor', progress: 0.55, action: 'review-chronic-opioid-related-hypoventilation-contributors-and-alternatives',
      narration: 'Refuse the obvious cause, and notice what the negatives do not cover. Chronic opioid exposure is a contributor, not a proven cause. Her BMI is 23.7 and the spirometry shows no obstruction and the examination no focal weakness — but those findings do not exclude upper-airway obstruction, central sleep apnea, chest-wall or neuromuscular disease, cardiac or endocrine causes, or medication interactions. The nighttime gabapentin is in that last category and is easy to overlook because it is not the opioid, and alcohol, nonprescribed substances and other sedatives still need a patient-centered conversation rather than an assumption.' };
  }
  if (patient.coordinatedPlanAtTick === null) {
    return { id: 'plan', focus: 'actions', progress: 0.78, action: 'coordinate-chronic-opioid-related-hypoventilation-prescriber-sleep-and-respiratory-plan',
      narration: 'Name every owner, and do not let this clinic change her analgesia. Prescriber, sleep, respiratory, pharmacy and primary care, around her pain goals as well as her breathing. Both failure modes here are real: leaving a hypoventilating patient on unchanged therapy because nobody owns the question, and stopping or tapering eight years of analgesia in a single visit on the strength of a pattern that has not been attributed yet. The education, the diagnostic work still outstanding and the reassessment interval are part of the plan rather than things that follow it.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-chronic-opioid-related-hypoventilation-reassessment',
    narration: 'Hand off a pattern that has been described and not attributed. Nothing here establishes causality, a diagnosis, a medication change, a device or an outcome. What travels is the eight-year exposure and the six-month change, the awake and sleep evidence and the gap between them, the contributors that stay open including the ones that are not the opioid, the safety concerns, the work still to be done, and the name against each part of it.' };
}
