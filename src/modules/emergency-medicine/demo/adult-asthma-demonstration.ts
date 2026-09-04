import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsAdultAsthma, type AdultAsthmaAction, type AdultAsthmaProgress,
} from '../adult-asthma';
import { adultAsthmaInlinePrompt } from '../tutor/adult-asthma-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: AdultAsthmaProgress): string {
  const prompt = adultAsthmaInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const ADULT_ASTHMA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsAdultAsthmaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsAdultAsthma(scenario);
}

export interface AdultAsthmaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: AdultAsthmaAction;
  readonly finished?: boolean;
}

/**
 * The worked example for three treatments on three different clocks.
 *
 * Five beats. Only the first and the last are ordered by the engine; the middle
 * three could be taken in any order, and this example deliberately records the
 * hours-away drug before the minutes-away one. It examines nobody, acquires no
 * test, prepares and delivers no drug, sets no device, diagnoses nothing,
 * determines no disposition, and predicts no outcome.
 */
export function adultAsthmaDemonstrationStep(
  patient?: AdultAsthmaProgress,
): AdultAsthmaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.reassessedAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'The order this example took is the whole point: the corticosteroid was recorded before the bronchodilators, which looks backwards and is not. The engine would have accepted any order — none of the three waits on another — and the reason to put the slow one early is that early is the only thing it has. What the engine will not accept is the reassessment before all three are recorded, because the common way this goes wrong is that the steroid is saved for after the verdict and the verdict arrives too late to matter. Nothing here was prepared, delivered, or set up, and the numbers that came back are authored rather than modelled. This ends the example, not the evaluation.' };
  }
  if (patient.severityReviewedAtTick === null) {
    return { id: 'severity', focus: 'monitor', progress: 0.1,
      action: 'review-severity-and-mimics', narration: narrate(patient) };
  }
  if (patient.controlledOxygenAtTick === null) {
    return { id: 'oxygen', focus: 'actions', progress: 0.32,
      action: 'record-controlled-oxygen', narration: narrate(patient) };
  }
  if (patient.corticosteroidIntentAtTick === null) {
    return { id: 'corticosteroid', focus: 'actions', progress: 0.54,
      action: 'record-early-corticosteroid-intent', narration: narrate(patient) };
  }
  if (patient.bronchodilatorBundleAtTick === null) {
    return { id: 'bronchodilator', focus: 'actions', progress: 0.76,
      action: 'give-fixed-inhaled-bronchodilators', narration: narrate(patient) };
  }
  return { id: 'reassess', focus: 'monitor', progress: 0.92,
    action: 'reassess-after-initial-treatment', narration: narrate(patient) };
}
