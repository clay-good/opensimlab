import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsMyasthenia, type MyastheniaAction, type MyastheniaProgress,
} from '../myasthenic-crisis-escalation';
import { myastheniaInlinePrompt } from '../tutor/myasthenic-crisis-escalation-guidance';


/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: MyastheniaProgress): string {
  const prompt = myastheniaInlinePrompt('guided', { scenarioVersion: '0.1.0', myasthenia: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

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
      narration: narrate(patient) };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'actions', progress: 0.26, action: 'recognize-neurology-impending-myasthenic-crisis-without-spo2-or-single-cutoff-reassurance',
      narration: narrate(patient) };
  }
  if (patient.ownershipAtTick === null) {
    return { id: 'ownership', focus: 'actions', progress: 0.46, action: 'activate-neurology-myasthenic-crisis-qualified-neurocritical-and-airway-capable-ownership',
      narration: narrate(patient) };
  }
  if (patient.causesAtTick === null) {
    return { id: 'causes', focus: 'monitor', progress: 0.64, action: 'review-neurology-myasthenic-crisis-secretion-aspiration-infection-medication-and-alternative-causes',
      narration: narrate(patient) };
  }
  if (patient.laterAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.82, action: 'review-neurology-myasthenic-crisis-strict-later-bulbar-ventilatory-and-supplied-airway-trajectory',
      narration: 'Let the authored interval pass and read the qualified team’s 30-minute report. The interval is a contrast rather than a required wait, and nothing here says what any individual patient does next.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-neurology-myasthenic-crisis-trigger-treatment-weaning-recurrence-and-active-risk',
    narration: 'One-word speech, no head lift, a barely audible cough, continuous secretion management, a vital capacity of 0.9 litres and a PaCO2 that has only reached 49 — and a pulse-coherent saturation of 95% the whole way down. The qualified airway team has documented that invasive ventilation is required and has provided it. Hand off the trigger, the individualized treatment, the ventilator and weaning course, the extubation risk and the recurrence, and prove none of it.' };
}
