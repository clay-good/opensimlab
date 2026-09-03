import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsHyperkalemiaWithEcgChange, type HyperkalemiaWithEcgChangeAction,
  type HyperkalemiaWithEcgChangeProgress,
} from '../hyperkalemia-with-ecg-change';
import { hyperkalemiaWithEcgChangeInlinePrompt } from '../tutor/hyperkalemia-with-ecg-change-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: HyperkalemiaWithEcgChangeProgress): string {
  const prompt = hyperkalemiaWithEcgChangeInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const HYPERKALEMIA_WITH_ECG_CHANGE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsHyperkalemiaWithEcgChangeDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsHyperkalemiaWithEcgChange(scenario);
}

export interface HyperkalemiaWithEcgChangeDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: HyperkalemiaWithEcgChangeAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a tracing that improves while the chemistry does not.
 *
 * Seven beats. The first two are a strict chain; the four that follow are
 * unordered against each other, and two time gates sit inside them. It acquires
 * no specimen, interprets no real ECG, selects no salt or dose, delivers
 * nothing, dialyses nobody, and predicts no outcome.
 */
export function hyperkalemiaWithEcgChangeDemonstrationStep(
  patient?: HyperkalemiaWithEcgChangeProgress,
): HyperkalemiaWithEcgChangeDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.reassessedAtTick !== null) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'The line to carry out of this example is the pairing in the middle: the QRS came back from 140 ms to 104 ms while the potassium stayed at exactly 7.1. Calcium changed the tracing and moved no potassium at all, the shifting agents lent the serum a few hours by putting potassium into cells, and only the removal lane addresses the total — in a man whose kidney is at stage 4 and cannot settle the account. The two prescriptions that got him here were stopped in the department, which is the part of this that prevents the next visit. Nothing here was sampled, selected, delivered or dialysed, and every panel is authored rather than modelled. This ends the example, not the evaluation.' };
  }
  if (patient.patternReviewedAtTick === null) {
    return { id: 'pattern', focus: 'monitor', progress: 0.1,
      action: 'review-hyperkalemia-pattern', narration: narrate(patient) };
  }
  if (patient.calciumAtTick === null) {
    return { id: 'calcium', focus: 'actions', progress: 0.25,
      action: 'record-hyperkalemia-calcium-intent', narration: narrate(patient) };
  }
  if (patient.postCalciumEcgAtTick === null) {
    return { id: 'ecg', focus: 'monitor', progress: 0.42,
      action: 'review-hyperkalemia-post-calcium-ecg', narration: narrate(patient) };
  }
  if (patient.insulinGlucoseAtTick === null) {
    return { id: 'insulin', focus: 'actions', progress: 0.58,
      action: 'record-hyperkalemia-insulin-glucose', narration: narrate(patient) };
  }
  if (patient.betaAgonistAtTick === null) {
    return { id: 'beta', focus: 'actions', progress: 0.72,
      action: 'record-hyperkalemia-beta-agonist', narration: narrate(patient) };
  }
  if (patient.removalAtTick === null) {
    return { id: 'removal', focus: 'actions', progress: 0.86,
      action: 'record-hyperkalemia-removal-and-cause-control', narration: narrate(patient) };
  }
  return { id: 'reassess', focus: 'monitor', progress: 0.94,
    action: 'reassess-hyperkalemia', narration: narrate(patient) };
}
