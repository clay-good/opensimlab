import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsCopdExacerbation, type CopdExacerbationAction, type CopdExacerbationProgress,
} from '../copd-exacerbation';
import { copdExacerbationInlinePrompt } from '../tutor/copd-exacerbation-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: CopdExacerbationProgress): string {
  const prompt = copdExacerbationInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const COPD_EXACERBATION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsCopdExacerbationDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsCopdExacerbation(scenario);
}

export interface CopdExacerbationDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: CopdExacerbationAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a patient in whom oxygen has a ceiling, and in whom
 * the ceiling reaches into the nebuliser.
 *
 * Six beats. Only the first and the last are ordered by the engine; the middle
 * four could be taken in any order. It examines nobody, samples nothing,
 * acquires no image or culture, prepares and delivers no drug, sets up no
 * device, writes no prescription, determines no disposition, and predicts no
 * outcome.
 */
export function copdExacerbationDemonstrationStep(
  patient?: CopdExacerbationProgress,
): CopdExacerbationDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.reassessedAtTick !== null) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'Two of the four treatments in this example were the same decision: a PaCO₂ of 52 puts a ceiling on the oxygen, and the same ceiling is why the bronchodilator is driven by air rather than by the wall. The engine would have accepted the four in any order — none waits on another — and what it will not accept is the reassessment before all four are recorded, because the comparison the repeat gas exists to make needs the whole initial response behind it. Nothing here was prepared, delivered or set up, and the numbers that came back are authored rather than modelled. This ends the example, not the evaluation.' };
  }
  if (patient.severityReviewedAtTick === null) {
    return { id: 'severity', focus: 'monitor', progress: 0.1,
      action: 'review-severity-and-mimics', narration: narrate(patient) };
  }
  if (patient.controlledOxygenAtTick === null) {
    return { id: 'oxygen', focus: 'actions', progress: 0.28,
      action: 'record-controlled-oxygen', narration: narrate(patient) };
  }
  if (patient.bronchodilatorBundleAtTick === null) {
    return { id: 'bronchodilator', focus: 'actions', progress: 0.46,
      action: 'give-air-driven-bronchodilators', narration: narrate(patient) };
  }
  if (patient.corticosteroidIntentAtTick === null) {
    return { id: 'corticosteroid', focus: 'actions', progress: 0.64,
      action: 'record-five-day-corticosteroid-intent', narration: narrate(patient) };
  }
  if (patient.antibioticIntentAtTick === null) {
    return { id: 'antibiotic', focus: 'actions', progress: 0.8,
      action: 'record-antibiotic-indication', narration: narrate(patient) };
  }
  return { id: 'reassess', focus: 'monitor', progress: 0.92,
    action: 'reassess-and-review-ventilatory-support', narration: narrate(patient) };
}
