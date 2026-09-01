import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsNeonatalHypoglycemia,
  type NeonatalHypoglycemiaAction, type NeonatalHypoglycemiaProgress,
} from '../neonatal-hypoglycemia';

export const NEONATAL_HYPOGLYCEMIA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsNeonatalHypoglycemiaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsNeonatalHypoglycemia(scenario);
}

export interface NeonatalHypoglycemiaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: NeonatalHypoglycemiaAction; readonly finished?: boolean;
}

/**
 * The worked example for acting decisively on a disputed threshold.
 *
 * The tempting demonstration here quotes a cut-off and treats. This one
 * escalates immediately and says in the same breath that no single glucose
 * concentration universally defines the condition or predicts brain injury —
 * because the signs, not the value, are what make this urgent, and those signs
 * belong equally to infection, hypoxic injury, drug exposure and endocrine or
 * metabolic disease. It obtains no glucose, feeds nobody, gives no gel or
 * dextrose and names no dose, and it finishes on a corrected number over a
 * newborn nobody has explained.
 */
export function neonatalHypoglycemiaDemonstrationStep(
  patient?: NeonatalHypoglycemiaProgress,
): NeonatalHypoglycemiaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'The newborn is handed on with a better number and an unexplained set of signs, her cause open, her recurrence risk live, and nobody claiming her brain is safe. The escalation was right and the glucose was never the whole question. This ends the example, not the watching.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.08, action: 'activate-neonatal-hypoglycemia-newborn-glucose-feeding-neurologic-and-family-support',
      narration: 'Confirm the glucose pathway and the feeding pathway as one team: a trained newborn team, the local glucose and feeding pathway, escalation support, the shared clock, communication, dignity, follow-up ownership, and a worried parent who is present. Feeding is treatment here rather than care running alongside it, so the person who owns it is not optional.' };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'actions', progress: 0.24, action: 'reconcile-neonatal-hypoglycemia-risk-clock-signs-glucose-temperature-feeding-and-whole-dyad',
      narration: 'Connect the risk and the signs to the number, in that order. Two hours old at thirty-nine weeks and three days, born to a mother with insulin-treated diabetes, new jitteriness that gentle containment does not settle, difficulty sustaining a feed, rousable with regular breathing, heart rate 146, saturation 97% in air, 36.6°C — and a laboratory plasma glucose of 32 mg/dL. Read that way the value confirms a concern the room already had. Read first, it becomes the whole assessment.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'actions', progress: 0.4, action: 'recognize-symptomatic-low-neonatal-glucose-requiring-qualified-immediate-escalation-without-universal-threshold-closure',
      narration: 'Escalate now, and refuse the threshold that would make it easy. No single glucose concentration universally defines clinically important neonatal hypoglycemia or predicts brain injury; abnormal clinical signs with a confirmed 32 mg/dL still support immediate qualified escalation across the cited frameworks. Both of those are true at once. The signs are nonspecific too, so infection, hypoxic injury, drug exposure and endocrine or metabolic disease all stay open.' };
  }
  if (patient.readinessAtTick === null) {
    return { id: 'readiness', focus: 'actions', progress: 0.56, action: 'review-qualified-neonatal-hypoglycemia-local-protocol-treatment-confirmation-and-cause-boundaries',
      narration: 'Review the pathway rather than choosing the treatment: immediate support on the current local pathway, laboratory confirmation where needed, feeding or dextrose treatment, serial glucose and clinical reassessment, thermoregulation, feeding protection, and investigation if this persists or recurs. This example names no gel, no bolus and no dose, because those are local-protocol work and they differ between the units she could be in.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'report', focus: 'monitor', progress: 0.76, action: 'review-neonatal-hypoglycemia-fixed-thirty-minute-qualified-report',
      narration: 'Let the authored thirty minutes pass and read the qualified team’s report. The interval is a contrast rather than a required wait, and nothing here predicts how quickly a real newborn answers whichever treatment her unit uses.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-neonatal-hypoglycemia-recurrence-neurologic-feeding-thermal-cause-family-and-outcome-risk',
    narration: 'Plasma glucose 54 mg/dL, no jitteriness currently observed, 36.7°C, regular breathing, heart rate 140, feeding assessment continuing. She improved after a treatment, which is not evidence of a universal treatment effect, and the glucose was never the whole question. Hand off recurrence, the neurologic question, feeding, and the cause of those first signs as open.' };
}
