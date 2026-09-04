import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsTubeMigration, type TubeMigrationAction, type TubeMigrationProgress,
} from '../tube-migration';
import { tubeMigrationInlinePrompt } from '../tutor/tube-migration-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: TubeMigrationProgress): string {
  const prompt = tubeMigrationInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const TUBE_MIGRATION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsTubeMigrationDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsTubeMigration(scenario);
}

export interface TubeMigrationDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: TubeMigrationAction;
  readonly finished?: boolean;
}

/**
 * The worked example for an answer that is obvious and still has to wait.
 *
 * Five beats in the only order the engine accepts. It examines and inspects
 * nothing, touches or moves no tube, changes no ventilator setting, orders no
 * image, delivers nothing, diagnoses nothing, determines no disposition, and
 * predicts no outcome.
 */
export function tubeMigrationDemonstrationStep(
  patient?: TubeMigrationProgress,
): TubeMigrationDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.reassessedAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'The answer was obvious from the first screen and the example still put help and oxygen in front of it. That is the whole argument: at 89% the first minute of a migrated tube, a mucus plug and a pneumothorax looks the same and is treated the same, so the support does not depend on getting the name right. The peak pressure falling back toward the plateau and the volume returning are what say the resistance is gone, and 22 cm was this woman’s number rather than a rule. This ends the example, not the evaluation.' };
  }
  if (patient.recognizedAtTick === null) {
    return { id: 'recognize', focus: 'monitor', progress: 0.12,
      action: 'recognize-post-repositioning-ventilation-change', narration: narrate(patient) };
  }
  if (patient.supportedAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.32,
      action: 'bridge-post-repositioning-oxygenation', narration: narrate(patient) };
  }
  if (patient.positionReviewedAtTick === null) {
    return { id: 'position', focus: 'monitor', progress: 0.54,
      action: 'integrate-tube-depth-and-bilateral-ventilation', narration: narrate(patient) };
  }
  if (patient.correctionAtTick === null) {
    return { id: 'correct', focus: 'actions', progress: 0.76,
      action: 'record-experienced-tube-correction-intent', narration: narrate(patient) };
  }
  return { id: 'reassess', focus: 'monitor', progress: 0.9,
    action: 'reassess-tube-position-and-gas-exchange', narration: narrate(patient) };
}
