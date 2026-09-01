import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsNeonatalBradycardia, type NeonatalBradycardiaAction, type NeonatalBradycardiaProgress,
} from '../neonatal-bradycardia';

export const NEONATAL_BRADYCARDIA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsNeonatalBradycardiaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsNeonatalBradycardia(scenario);
}

export interface NeonatalBradycardiaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: NeonatalBradycardiaAction; readonly finished?: boolean;
}

/**
 * The worked example for the one lesson here where the threshold is met.
 *
 * The neighbouring lessons demonstrate restraint, and this one would be wrong
 * to. Both halves of the compression threshold are satisfied, so the example
 * opens the branch — and then declines the inference at the end of it. At three
 * minutes the heart rate is 74 after a minute of coordinated compressions, and
 * one authored newborn getting better after a treatment is not evidence the
 * treatment is why. It compresses nothing, ventilates nothing, places no
 * airway and gives no drug, and it finishes on an improvement with no
 * explanation attached.
 */
export function neonatalBradycardiaDemonstrationStep(
  patient?: NeonatalBradycardiaProgress,
): NeonatalBradycardiaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'The newborn is handed on with a better heart rate and no account of why it improved, the abruption unexplored, his circulation and breathing unproven, and nobody claiming his brain is safe. The threshold was met and acted on. That is the whole of what has been shown. This ends the example, not the resuscitation.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.08, action: 'activate-neonatal-bradycardia-qualified-compression-ventilation-clock-and-dyad-response',
      narration: 'Staff the compressions and the ventilation as two jobs rather than one: a leader, a ventilation and airway owner, a compression owner, a heart-rate assessor, monitoring, a timekeeper, a recorder, access and medication ready, and a parent who cannot see his newborn and has asked a direct question. Coordinated support needs enough hands that neither half is done between other tasks.' };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'actions', progress: 0.24, action: 'reconcile-neonatal-bradycardia-adequate-ventilation-heart-rate-airway-oxygenation-and-whole-dyad',
      narration: 'Connect the evidence that the ventilation was already adequate. Two minutes old after an emergency cesarean at thirty-nine weeks and one day for placental-abruption concern, ventilation corrected, an alternative airway placed, thirty seconds of ventilation that visibly inflated the chest, heart rate still 48, preductal saturation 62%, 36.4°C. That history is what makes this the compression branch rather than another correction.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'actions', progress: 0.4, action: 'recognize-neonatal-bradycardia-compression-threshold-after-adequate-ventilation',
      narration: 'Name both halves of the threshold in the order they were met. Compressions are indicated when the heart rate stays below 60 despite thirty seconds of ventilation that inflates the lungs, and ventilation is optimized first. Here it already was. Being right about the number still requires having established the ventilation, and skipping that verification is how this branch gets opened on newborns who only needed a better seal.' };
  }
  if (patient.readinessAtTick === null) {
    return { id: 'readiness', focus: 'actions', progress: 0.56, action: 'review-qualified-neonatal-compression-ventilation-coordination-and-epinephrine-boundary',
      narration: 'Review the coordination now and keep epinephrine on the far side of it: coordinated compressions and ventilation, heart-rate reassessment, warmth, oxygenation monitoring, access and medication prepared. Epinephrine belongs to a later branch that opens only if the heart rate does not reach 60 after optimized ventilation and compressions, and preparing it is not the same as reaching it.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'report', focus: 'monitor', progress: 0.76, action: 'review-neonatal-bradycardia-fixed-three-minute-qualified-response-report',
      narration: 'Let the authored three minutes pass and read the qualified team’s report. The interval is a contrast rather than a required wait, and nothing here predicts how quickly a real newborn answers coordinated support.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-neonatal-bradycardia-respiratory-circulatory-neurologic-parent-and-outcome-risk',
    narration: 'Heart rate risen to 74 after sixty seconds of coordinated compressions and ventilation, preductal saturation 71%, compressions stopped, assisted ventilation continuing. He got better after a treatment, and that is not evidence the treatment is why — one authored newborn cannot supply that evidence. Hand off the improvement without handing off a reason for it.' };
}
