import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsMyasthenia, type MyastheniaAction, type MyastheniaProgress,
} from '../myasthenic-crisis-escalation';

export const MYASTHENIA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsMyastheniaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsMyasthenia(scenario);
}

export interface MyastheniaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: MyastheniaAction; readonly finished?: boolean;
}

/**
 * The worked example for respiratory failure that keeps its saturation.
 *
 * Neuromuscular ventilatory failure does not announce itself the way the
 * monitor teaches people to expect: the saturation is 97% on room air and the
 * blood gas is unremarkable while the vital capacity falls from 2.4 to 1.4
 * litres in six hours. Hypercapnia here is a late finding, and no single number
 * is a universal threshold, so this example reads the direction rather than the
 * value, keeps the pooled secretions as an emergency separate from the
 * breathing, and treats the pneumonia as the trigger rather than the problem.
 * It measures no mechanics, takes no gas, and selects no drug, dose, oxygen,
 * ventilation, or airway.
 */
export function myastheniaDemonstrationStep(
  patient?: MyastheniaProgress,
): MyastheniaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on ventilated, with the escalation having happened before the emergency did. Nothing was proven and nothing was excluded — not the trigger, not a treatment response, not the weaning course ahead of her. This ends the example, not the crisis.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-neurology-myasthenic-crisis-clock-fatigability-bulbar-respiratory-and-whole-patient',
      narration: 'Read the direction of travel, not the numbers as they stand. Thirty-six hours of worsening fatigable weakness after three days of fever and productive cough: diplopia, ptosis, nasal speech, head drop, breathlessness while speaking, a weak cough and saliva she cannot clear. The supplied vital capacity has gone from 2.4 to 1.4 litres and the maximal inspiratory pressure from -38 to -22 in six hours. Two of those are bulbar and two are ventilatory, and both sets are moving the same way.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'actions', progress: 0.26, action: 'recognize-neurology-impending-myasthenic-crisis-without-spo2-or-single-cutoff-reassurance',
      narration: 'Call this an impending crisis while the saturation is still normal. A room-air saturation of 97% and a PaCO2 of 41 are exactly what this looks like shortly before it stops looking like anything. Neuromuscular failure holds its oxygenation until it does not, and hypercapnia here is a late sign rather than a warning — so waiting for either is waiting too long. There is no single cutoff to lean on either: no one vital capacity, pressure, count or gas value is a universal threshold, and what decides this is the trajectory plus a bulbar picture that cannot protect an airway.' };
  }
  if (patient.ownershipAtTick === null) {
    return { id: 'ownership', focus: 'actions', progress: 0.46, action: 'activate-neurology-myasthenic-crisis-qualified-neurocritical-and-airway-capable-ownership',
      narration: 'Get neurology, neurocritical care, respiratory and an airway-capable owner in now. This is escalation ahead of the event rather than in response to it, and the people who will manage the airway need to be present before the airway is the problem. Pooled secretions with a barely effective cough is its own emergency running alongside the falling vital capacity — one is about ventilating and the other is about protecting, and neither waits for the other.' };
  }
  if (patient.causesAtTick === null) {
    return { id: 'causes', focus: 'monitor', progress: 0.64, action: 'review-neurology-myasthenic-crisis-secretion-aspiration-infection-medication-and-alternative-causes',
      narration: 'Treat the chest as the trigger, and keep every alternative open. Three days of fever and productive cough with a new right basilar opacity is a precipitant worth chasing, and the radiograph cannot say whether that shadow is infection or aspiration — which matters, because a weak cough and pooled saliva make the second entirely plausible. Medication exposures, test reliability, and metabolic, pulmonary, cardiac, central and other neuromuscular causes all stay open, and this review runs alongside the escalation rather than in front of it.' };
  }
  if (patient.laterAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.82, action: 'review-neurology-myasthenic-crisis-strict-later-bulbar-ventilatory-and-supplied-airway-trajectory',
      narration: 'Let the authored interval pass and read the qualified team’s 30-minute report. The interval is a contrast rather than a required wait, and nothing here says what any individual patient does next.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-neurology-myasthenic-crisis-trigger-treatment-weaning-recurrence-and-active-risk',
    narration: 'One-word speech, no head lift, a barely audible cough, continuous secretion management, a vital capacity of 0.9 litres and a PaCO2 that has only reached 49 — and a pulse-coherent saturation of 95% the whole way down. The qualified airway team has documented that invasive ventilation is required and has provided it. Hand off the trigger, the individualized treatment, the ventilator and weaning course, the extubation risk and the recurrence, and prove none of it.' };
}
