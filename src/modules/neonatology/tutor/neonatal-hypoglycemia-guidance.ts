import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { NeonatalHypoglycemiaProgress } from '../neonatal-hypoglycemia';

export const NEONATAL_HYPOGLYCEMIA_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for acting decisively on a disputed threshold.
 *
 * No single glucose concentration universally defines clinically important
 * neonatal hypoglycemia or predicts brain injury, and 32 mg/dL with abnormal
 * signs still supports immediate qualified escalation across the cited
 * frameworks. Both of those are true, and the skill is holding them at once
 * rather than letting either cancel the other: the number is not the disease,
 * and the signs are what make this urgent. Those signs are also nonspecific,
 * so treating the glucose does not explain them — infection, hypoxic injury,
 * drug exposure and endocrine or metabolic disease all stay open. None of
 * these prompts obtains a glucose, feeds, gives gel or dextrose, or names a
 * dose, because the treatment here is whatever the current local pathway says.
 */
export function neonatalHypoglycemiaInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly neonatalHypoglycemia?: NeonatalHypoglycemiaProgress;
}) {
  const patient = input.neonatalHypoglycemia;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.supportAtTick === null) return prompt('neonatal-hypoglycemia-support', true,
    'Confirm the glucose pathway and the feeding pathway as one team.',
    'A trained newborn team, the local glucose and feeding pathway, escalation support, the shared clock, communication, dignity, follow-up ownership, and a worried parent who is present. Feeding is treatment here rather than care running alongside it, so the person who owns it is not optional.');
  if (patient.contextAtTick === null) return prompt('neonatal-hypoglycemia-context', true,
    'Connect the risk and the signs to the number, in that order.',
    'Two hours old, born to a mother with insulin-treated diabetes, new jitteriness that gentle containment does not settle, difficulty sustaining a feed — and a laboratory plasma glucose of 32 mg/dL. Read that way the value confirms a concern the room already had; read first it becomes the whole assessment.');
  if (patient.recognitionAtTick === null) return prompt('neonatal-hypoglycemia-recognize', true,
    'Escalate now, and refuse the threshold that would make it easy.',
    'No single glucose concentration universally defines clinically important neonatal hypoglycemia or predicts brain injury. Abnormal signs with a confirmed 32 mg/dL still support immediate qualified escalation across the cited frameworks. Both are true. The signs are also nonspecific, so infection, hypoxic injury, drug exposure and endocrine or metabolic disease stay open.');
  if (patient.readinessAtTick === null) return prompt('neonatal-hypoglycemia-readiness', true,
    'Review the pathway rather than choosing the treatment.',
    'Immediate support on the current local pathway, laboratory confirmation where needed, feeding or dextrose treatment, serial glucose and clinical reassessment, thermoregulation, feeding protection, and investigation if this persists or recurs. This lesson names no gel, no bolus and no dose, because those are local-protocol work and they differ between the units this newborn could be in.');
  if (patient.reassessmentAtTick === null) return prompt('neonatal-hypoglycemia-observe', false,
    'Let the authored interval pass, then read the qualified team’s report.',
    'Thirty minutes is a contrast rather than a required wait or a promised response time. Nothing here says how quickly a real newborn answers whichever treatment her unit uses.');
  return prompt('neonatal-hypoglycemia-handoff', true,
    'Hand off a corrected number and an unexplained newborn.',
    'Plasma glucose 54 mg/dL, no jitteriness now, 36.7°C, regular breathing, feeding assessment continuing. She improved after a treatment, which is not evidence of a universal treatment effect, and the glucose was never the whole question. Recurrence, the neurologic question, feeding, and the cause of those first signs are all still open.');
}
