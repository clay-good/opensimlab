import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPediatricHypoglycemicSeizure, type PediatricHypoglycemicSeizureAction,
  type PediatricHypoglycemicSeizureProgress,
} from '../pediatric-hypoglycemic-seizure';
import { pediatricHypoglycemicSeizureInlinePrompt } from '../tutor/pediatric-hypoglycemic-seizure-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: PediatricHypoglycemicSeizureProgress): string {
  const prompt = pediatricHypoglycemicSeizureInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const PEDIATRIC_HYPOGLYCEMIC_SEIZURE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPediatricHypoglycemicSeizureDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPediatricHypoglycemicSeizure(scenario);
}

export interface PediatricHypoglycemicSeizureDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PediatricHypoglycemicSeizureAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a child whose number came back up.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. Of the unordered pair it takes rescue first and the cause
 * review second, which is one valid order rather than the required one. The
 * example examines nobody, acquires and interprets no glucose or other test,
 * diagnoses nothing, chooses no glucose formulation, dextrose, glucagon,
 * carbohydrate, fluid, anticonvulsant, drug, concentration, route, dose,
 * volume, rate, access, infusion, feeding plan, oxygen or device, performs no
 * airway maneuver or procedure, and determines no disposition or outcome.
 */
export function pediatricHypoglycemicSeizureDemonstrationStep(
  patient?: PediatricHypoglycemicSeizureProgress,
): PediatricHypoglycemicSeizureDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He is awake and talking and his glucose is 86, and not one person in this room knows yet why a previously well five-year-old had a seizure. The team taking over knows that too, and knows what they are still looking for. This ends the example, not the evaluation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.1, action: 'reconcile-pediatric-hypoglycemic-seizure-whole-child-and-glucose',
      narration: narrate(patient) };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'monitor', progress: 0.28, action: 'recognize-pediatric-hypoglycemic-seizure',
      narration: narrate(patient) };
  }
  if (patient.rescueAtTick === null) {
    return { id: 'rescue', focus: 'actions', progress: 0.46, action: 'activate-pediatric-hypoglycemic-seizure-qualified-rescue-ownership',
      narration: narrate(patient) };
  }
  if (patient.safetyAtTick === null) {
    return { id: 'safety', focus: 'actions', progress: 0.64, action: 'review-pediatric-hypoglycemic-seizure-causes-and-recurrence-risk',
      narration: narrate(patient) };
  }
  if (patient.laterResponseAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.8, action: 'review-pediatric-hypoglycemic-seizure-later-response',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-pediatric-hypoglycemic-seizure-active-risk',
    narration: narrate(patient) };
}
