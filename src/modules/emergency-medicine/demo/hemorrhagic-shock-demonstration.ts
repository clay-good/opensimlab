import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsHemorrhagicShock, type HemorrhagicShockAction, type HemorrhagicShockProgress,
} from '../hemorrhagic-shock';
import { hemorrhagicShockInlinePrompt } from '../tutor/hemorrhagic-shock-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: HemorrhagicShockProgress): string {
  const prompt = hemorrhagicShockInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const HEMORRHAGIC_SHOCK_DEMONSTRATION_VERSION = '0.1.0';

export function supportsHemorrhagicShockDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsHemorrhagicShock(scenario);
}

export interface HemorrhagicShockDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: HemorrhagicShockAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a resuscitation that never stops the bleeding.
 *
 * Seven beats. The example takes the control lane first, but the claim it is
 * making is about neither lane winning: it lives in the recognition beat, which
 * every possible path passes through. It places no device, stops no bleeding,
 * performs no procedure, chooses no component ratio, warms nobody, and predicts
 * no outcome.
 */
export function hemorrhagicShockDemonstrationStep(
  patient?: HemorrhagicShockProgress,
): HemorrhagicShockDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.reassessedAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'Six recorded steps and a reassessment, and she is still bleeding. That is the example. The two lanes ran alongside each other because neither one is a precondition for the other — the binder and the phone call act on the space the blood is going into, and the activation and the two units act on what has already left. What makes this lesson hard is that the blood lane is the one that changes the monitor, so a run that does only the blood lane feels like it is working right up until it is not. Nothing here was placed, transfused into a real person, or controlled. This ends the example, not the evaluation.' };
  }
  if (patient.mechanismAndPerfusionReviewedAtTick === null) {
    return { id: 'recognize', focus: 'monitor', progress: 0.1,
      action: 'review-mechanism-and-perfusion', narration: narrate(patient) };
  }
  if (patient.pelvicStabilizationAtTick === null) {
    return { id: 'stabilize', focus: 'actions', progress: 0.24,
      action: 'record-pelvic-stabilization', narration: narrate(patient) };
  }
  if (patient.definitiveControlEscalatedAtTick === null) {
    return { id: 'escalate', focus: 'actions', progress: 0.38,
      action: 'escalate-definitive-bleeding-control', narration: narrate(patient) };
  }
  if (patient.majorHemorrhageActivatedAtTick === null) {
    return { id: 'activate', focus: 'actions', progress: 0.52,
      action: 'activate-major-hemorrhage', narration: narrate(patient) };
  }
  if (patient.redCellsAtTick === null) {
    return { id: 'red-cells', focus: 'actions', progress: 0.66,
      action: 'give-two-red-cell-units', narration: narrate(patient) };
  }
  if (patient.coagulationAndTemperatureAtTick === null) {
    return { id: 'monitor', focus: 'monitor', progress: 0.8,
      action: 'review-coagulation-and-temperature', narration: narrate(patient) };
  }
  return { id: 'reassess', focus: 'monitor', progress: 0.92,
    action: 'reassess-perfusion', narration: narrate(patient) };
}
