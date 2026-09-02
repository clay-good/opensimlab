import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsCapHypoxemia, type CapHypoxemiaAction, type CapHypoxemiaProgress,
} from '../community-acquired-pneumonia-hypoxemia-reassessment';

export const CAP_HYPOXEMIA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsCapHypoxemiaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsCapHypoxemia(scenario);
}

export interface CapHypoxemiaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: CapHypoxemiaAction; readonly finished?: boolean;
}

/**
 * The worked example for a patient who is sicker than her blood pressure
 * suggests.
 *
 * Hypoxemia is the finding, and it gets answered before the reasoning starts.
 * This example delivers no oxygen, selects no support device or antimicrobial,
 * acquires no test, and determines no disposition.
 */
export function capHypoxemiaDemonstrationStep(
  patient?: CapHypoxemiaProgress,
): CapHypoxemiaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on supported, still hypoxemic, with an organism nobody has identified and a location of care nobody in this lesson decided. Nothing was proven and nothing was chosen. This ends the example, not the pneumonia.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'monitor', progress: 0.1, action: 'corroborate-and-support-cap-hypoxemia',
      narration: 'Confirm the hypoxemia is real and get it answered before anything else. A room-air saturation of 85% on a regular, pulse-coherent trace with a PaO₂ of 51 on the blood gas is the same finding twice, so it is not an artifact. She is alert, warm and normotensive, which is the part that gets people caught: nothing about a pressure of 116/70 makes 85% acceptable. Oxygen and the device belong to the qualified team, and the reasoning that follows happens while she is being supported rather than before.' };
  }
  if (patient.evidenceAtTick === null) {
    return { id: 'evidence', focus: 'monitor', progress: 0.32, action: 'reconcile-cap-evidence-and-dangerous-alternatives',
      narration: 'Read the film and the bloods as consistent, not as conclusive. Right middle- and lower-lobe consolidation with no pneumothorax, no edema pattern and no effusion big enough to explain this, a white count of 14.8, a normal creatinine and a lactate of 1.8. That fits pneumonia and does not settle it: viral and bacterial causes are both unresolved, and the things that present this way and are not pneumonia have to stay on the list while the treatment is planned as though it is.' };
  }
  if (patient.severityAtTick === null) {
    return { id: 'severity', focus: 'actions', progress: 0.55, action: 'classify-cap-severity-and-escalation-needs',
      narration: 'Count the criteria, and do not let them decide where she goes. Three minor severe-CAP features are present — a respiratory rate of at least 30, a PaO₂/FiO₂ no greater than 250, and multilobar infiltrates — with no major criterion, no confusion, no vasopressor requirement, no ventilation, and none of the hematologic or renal features. That supports an urgent higher-acuity judgment. It does not independently determine a location of care, and a score has never been able to.' };
  }
  if (patient.treatmentIntentAtTick === null) {
    return { id: 'treatment', focus: 'actions', progress: 0.78, action: 'record-cap-testing-and-empiric-treatment-intent',
      narration: 'Record what should be sent and started, and choose neither. Cultures and the rest of the testing intent, and empiric coverage appropriate to a severe community-acquired pneumonia, are recorded here as intent rather than selected. What narrows the empiric question is what is absent: no previous respiratory isolation of MRSA or Pseudomonas, and no hospitalization with parenteral antibiotics in the last ninety days. Absent risk factors are a reason not to broaden, which is a decision the qualified team makes with this recorded in front of them.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-cap-hypoxemia-reassessment',
    narration: 'Nothing here establishes an organism, a proven diagnosis, a support device, an antimicrobial, a location of care or an outcome. Hand off the oxygen requirement and how it is being met, the evidence that fits without concluding, the severity features and the judgment they support rather than make, the testing and empiric intent, and the alternatives still open.' };
}
