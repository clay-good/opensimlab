import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsUnplannedExtubation, type UnplannedExtubationAction, type UnplannedExtubationProgress,
} from '../unplanned-extubation';
import { unplannedExtubationInlinePrompt } from '../tutor/unplanned-extubation-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: UnplannedExtubationProgress): string {
  const prompt = unplannedExtubationInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const UNPLANNED_EXTUBATION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsUnplannedExtubationDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsUnplannedExtubation(scenario);
}

export interface UnplannedExtubationDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: UnplannedExtubationAction;
  readonly finished?: boolean;
}

/**
 * The worked example for the right answer reached the long way round.
 *
 * Five beats in the only order the engine accepts. It examines nobody, acquires
 * no monitoring, delivers no oxygen, ventilates nobody by mask, gives no drug,
 * handles no airway equipment, intubates nobody, images nothing, diagnoses
 * nothing, determines no disposition, and predicts no outcome.
 */
export function unplannedExtubationDemonstrationStep(
  patient?: UnplannedExtubationProgress,
): UnplannedExtubationDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.reassessmentAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He needed the tube back, and the point of the example is that this was established rather than assumed — most unplanned extubations do not end here. Nobody intubated him, chose a drug or touched the equipment. The securement review at the end is the part that stops the next one, and it is the part a finished emergency makes easy to skip. This ends the example, not the evaluation.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.12,
      action: 'support-unplanned-extubation-and-call-help', narration: narrate(patient) };
  }
  if (patient.assessmentAtTick === null) {
    return { id: 'assess', focus: 'monitor', progress: 0.32,
      action: 'assess-unplanned-extubation-tolerance', narration: narrate(patient) };
  }
  if (patient.failureAtTick === null) {
    return { id: 'classify', focus: 'monitor', progress: 0.54,
      action: 'classify-unplanned-extubation-failure', narration: narrate(patient) };
  }
  if (patient.airwayPlanAtTick === null) {
    return { id: 'plan', focus: 'actions', progress: 0.76,
      action: 'record-unplanned-extubation-airway-plan', narration: narrate(patient) };
  }
  return { id: 'reassess', focus: 'monitor', progress: 0.9,
    action: 'reassess-unplanned-extubation-response', narration: narrate(patient) };
}
