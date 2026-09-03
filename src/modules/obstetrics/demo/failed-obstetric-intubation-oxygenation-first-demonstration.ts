import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsFailedIntubation, type FailedIntubationAction, type FailedIntubationProgress,
} from '../failed-obstetric-intubation-oxygenation-first';
import { failedIntubationInlinePrompt } from '../tutor/failed-obstetric-intubation-oxygenation-first-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied. Every lesson's prose used to ship twice inside the
 * cockpit bundle — once in the tutor and once as a duplicated string literal
 * here — and gzip cannot reach across that distance to dedupe it. Deriving it
 * also makes "the two cannot drift apart" structural rather than a property
 * maintained by regenerating this file.
 */
function narrate(patient: FailedIntubationProgress): string {
  const prompt = failedIntubationInlinePrompt('guided', { scenarioVersion: '0.1.0', failedIntubation: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const FAILED_INTUBATION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsFailedIntubationDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsFailedIntubation(scenario);
}

export interface FailedIntubationDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: FailedIntubationAction; readonly finished?: boolean;
}

/**
 * The worked example for an airway that is working and not secured.
 *
 * The tube was never the goal; oxygen is. This example examines nobody, manages
 * no airway, selects and manipulates no device, and makes no wake-or-proceed
 * decision.
 */
export function failedIntubationDemonstrationStep(
  patient?: FailedIntubationProgress,
): FailedIntubationDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on oxygenated through a device nobody is calling secure, with a birth still to happen and a question about awareness she is not yet able to answer. Nothing was proven and nothing was excluded. This ends the example, not the airway.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.08, action: 'activate-obstetrics-failed-intubation-oxygenation-anesthesia-obstetric-theatre-newborn-and-support-response',
      narration: narrate(patient) };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'monitor', progress: 0.28, action: 'reconcile-obstetrics-failed-intubation-attempts-device-ventilation-aspiration-fetus-and-whole-person',
      narration: narrate(patient) };
  }
  if (patient.safetyAtTick === null) {
    return { id: 'safety', focus: 'actions', progress: 0.46, action: 'review-obstetrics-failed-intubation-attempt-limit-oxygenation-cico-awareness-and-aspiration-boundaries',
      narration: narrate(patient) };
  }
  if (patient.decisionAtTick === null) {
    return { id: 'decision', focus: 'actions', progress: 0.64, action: 'review-obstetrics-failed-intubation-individualized-wake-or-proceed-and-parallel-readiness',
      narration: narrate(patient) };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'reassess', focus: 'monitor', progress: 0.82, action: 'review-obstetrics-failed-intubation-fixed-three-minute-qualified-course-report',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-obstetrics-failed-intubation-airway-aspiration-awareness-birth-newborn-support-and-outcome-risk',
    narration: narrate(patient) };
}
