import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsExertionalHeatStroke, type ExertionalHeatStrokeAction,
  type ExertionalHeatStrokeProgress,
} from '../exertional-heat-stroke';
import { exertionalHeatStrokeInlinePrompt } from '../tutor/exertional-heat-stroke-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: ExertionalHeatStrokeProgress): string {
  const prompt = exertionalHeatStrokeInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const EXERTIONAL_HEAT_STROKE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsExertionalHeatStrokeDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsExertionalHeatStroke(scenario);
}

export interface ExertionalHeatStrokeDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: ExertionalHeatStrokeAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a diagnosis in which cooling is the resuscitation.
 *
 * Five beats in the only order the engine accepts. It examines nobody,
 * measures no temperature, tests no blood, fills no tub, manages no airway,
 * transports nobody, determines no disposition, and predicts no outcome.
 */
export function exertionalHeatStrokeDemonstrationStep(
  patient?: ExertionalHeatStrokeProgress,
): ExertionalHeatStrokeDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.surveillanceAtTick !== null) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'The support bundle in this example ran alongside the cooling rather than in front of it, and that ordering is the whole point: the routine a collapsed confused patient triggers is a good routine, and in this one diagnosis every minute it owns is a minute at 41 degrees. Cooling stopped below 39 because stopping is a decision, and the surveillance did not stop at all, because the heat injury declares itself over days while the temperature is fixed in minutes. Nothing here was measured, filled, delivered or transported, every panel is authored rather than modelled, and neither an antipyretic nor dantrolene has any part in it. This ends the example, not the evaluation.' };
  }
  if (patient.patternReviewedAtTick === null) {
    return { id: 'pattern', focus: 'monitor', progress: 0.12,
      action: 'review-heat-stroke-pattern', narration: narrate(patient) };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.33,
      action: 'record-heat-stroke-support', narration: narrate(patient) };
  }
  if (patient.coolingAtTick === null) {
    return { id: 'cooling', focus: 'actions', progress: 0.55,
      action: 'record-cold-water-immersion', narration: narrate(patient) };
  }
  if (patient.targetAtTick === null) {
    return { id: 'target', focus: 'monitor', progress: 0.76,
      action: 'reassess-heat-stroke-cooling-target', narration: narrate(patient) };
  }
  return { id: 'surveillance', focus: 'actions', progress: 0.92,
    action: 'record-heat-stroke-organ-surveillance', narration: narrate(patient) };
}
