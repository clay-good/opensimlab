import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPericardialTamponade, type PericardialTamponadeAction,
  type PericardialTamponadeProgress,
} from '../pericardial-tamponade';
import { pericardialTamponadeInlinePrompt } from '../tutor/pericardial-tamponade-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied. Every lesson's prose used to ship twice inside the
 * cockpit bundle — once in the tutor and once as a duplicated string literal
 * here — and gzip cannot reach across that distance to dedupe it. Deriving it
 * also makes "the two cannot drift apart" structural rather than a property
 * maintained by regenerating this file.
 */
function narrate(patient: PericardialTamponadeProgress): string {
  const prompt = pericardialTamponadeInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const PERICARDIAL_TAMPONADE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPericardialTamponadeDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPericardialTamponade(scenario);
}

export interface PericardialTamponadeDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PericardialTamponadeAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a diagnosis everybody has already made.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. Where the closing pair is unordered the example reviews the
 * etiology before the surveillance — a choice, not a rule. It examines nobody,
 * acquires or interprets no ECG, monitor, image, catheter, output or specimen,
 * diagnoses no etiology, selects or delivers no fluid, medication, drainage,
 * surgery or other treatment, manipulates or removes no catheter, manages no
 * complication, determines no disposition, and predicts no outcome.
 */
export function pericardialTamponadeDemonstrationStep(
  patient?: PericardialTamponadeProgress,
): PericardialTamponadeDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is comfortable, her effusion is 9 mm rather than 30, and none of the questions has been answered. The drainage was somebody else\'s, the cause is still pending, and the catheter is still in her chest. What this review added was a written reason to keep looking at a patient who now looks fine. This ends the example, not the evaluation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.12, action: 'reconcile-pericardial-tamponade-trajectory',
      narration: narrate(patient) };
  }
  if (patient.drainageResponseAtTick === null) {
    return { id: 'drainage', focus: 'monitor', progress: 0.3, action: 'review-pericardial-tamponade-drainage-response',
      narration: narrate(patient) };
  }
  if (patient.etiologyAtTick === null) {
    return { id: 'parallel', focus: 'monitor', progress: 0.5, action: 'review-pericardial-tamponade-etiology',
      narration: narrate(patient) };
  }
  if (patient.surveillanceAtTick === null) {
    return { id: 'surveillance', focus: 'actions', progress: 0.72, action: 'review-pericardial-tamponade-surveillance',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-pericardial-tamponade-reassessment',
    narration: narrate(patient) };
}
