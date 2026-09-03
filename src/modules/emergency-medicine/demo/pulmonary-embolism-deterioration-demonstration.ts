import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPulmonaryEmbolism, type PulmonaryEmbolismAction, type PulmonaryEmbolismProgress,
} from '../pulmonary-embolism-deterioration';
import { pulmonaryEmbolismInlinePrompt } from '../tutor/pulmonary-embolism-deterioration-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: PulmonaryEmbolismProgress): string {
  const prompt = pulmonaryEmbolismInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const PULMONARY_EMBOLISM_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPulmonaryEmbolismDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPulmonaryEmbolism(scenario);
}

export interface PulmonaryEmbolismDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PulmonaryEmbolismAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a category that turned out to be a snapshot.
 *
 * Five beats. The two initial intents are unordered against each other; the
 * rest is a chain. It acquires no test, chooses no agent or dose, manages no
 * airway, performs and prefers no reperfusion procedure, transfers nobody, and
 * predicts no outcome.
 */
export function pulmonaryEmbolismDemonstrationStep(
  patient?: PulmonaryEmbolismProgress,
): PulmonaryEmbolismDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.escalationAtTick !== null) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'He was normotensive when the example started and in cardiogenic shock when it ended, while everything recorded in between was correct. That is the whole point: a normal blood pressure in a failing right ventricle is evidence of compensation rather than of health, so the category was a snapshot and the observation was part of the treatment. The oxygenation improving to 92% as the pressure fell is the trap in miniature — the number being watched got better and the patient got worse. Nothing here was intubated, dosed, delivered, transferred or reperfused, and no reperfusion method was preferred over another. This ends the example, not the evaluation.' };
  }
  if (patient.severityReviewedAtTick === null) {
    return { id: 'severity', focus: 'monitor', progress: 0.12,
      action: 'review-confirmed-pe-severity', narration: narrate(patient) };
  }
  if (patient.oxygenAtTick === null) {
    return { id: 'oxygen', focus: 'actions', progress: 0.33,
      action: 'record-titrated-oxygen', narration: narrate(patient) };
  }
  if (patient.anticoagulationAtTick === null) {
    return { id: 'anticoagulation', focus: 'actions', progress: 0.55,
      action: 'record-therapeutic-anticoagulation-intent', narration: narrate(patient) };
  }
  if (patient.deteriorationAtTick === null) {
    return { id: 'reassess', focus: 'monitor', progress: 0.76,
      action: 'reassess-for-deterioration', narration: narrate(patient) };
  }
  return { id: 'escalation', focus: 'actions', progress: 0.92,
    action: 'activate-pert-and-record-reperfusion-intent', narration: narrate(patient) };
}
