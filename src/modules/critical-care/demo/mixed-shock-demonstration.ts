import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsMixedShock, type MixedShockAction, type MixedShockProgress,
} from '../mixed-shock';
import { mixedShockInlinePrompt } from '../tutor/mixed-shock-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied. Every lesson's prose used to ship twice inside the
 * cockpit bundle — once in the tutor and once as a duplicated string literal
 * here — and gzip cannot reach across that distance to dedupe it. Deriving it
 * also makes "the two cannot drift apart" structural rather than a property
 * maintained by regenerating this file.
 */
function narrate(patient: MixedShockProgress): string {
  const prompt = mixedShockInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const MIXED_SHOCK_DEMONSTRATION_VERSION = '0.1.0';

export function supportsMixedShockDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsMixedShock(scenario);
}

export interface MixedShockDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: MixedShockAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a patient who is both of the previous two lessons.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. Five beats in the only order the engine accepts. It examines
 * nobody, acquires no monitoring, catheter or test, calculates and diagnoses
 * nothing, delivers no oxygen, fluid or drug, obtains no access, doses nothing,
 * images nothing, performs no procedure, revascularizes nobody, treats no
 * source, provides no mechanical support, transfers and dispositions nobody,
 * and predicts no outcome.
 */
export function mixedShockDemonstrationStep(
  patient?: MixedShockProgress,
): MixedShockDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.reassessmentAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is better and she is still both things: a pump at twenty-five per cent and a consolidated lobe at 39.1, with two cause pathways open and neither one closed by having named her. Nothing was given and no label was chosen. The mottled knees and the warm hands were never a contradiction to resolve — they were the finding. This ends the example, not the evaluation.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'monitor', progress: 0.12, action: 'recognize-mixed-shock-discordance',
      narration: narrate(patient) };
  }
  if (patient.hemodynamicsAtTick === null) {
    return { id: 'hemodynamics', focus: 'monitor', progress: 0.32, action: 'classify-mixed-shock-hemodynamics',
      narration: narrate(patient) };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.54, action: 'record-mixed-shock-support',
      narration: narrate(patient) };
  }
  if (patient.causesAtTick === null) {
    return { id: 'causes', focus: 'actions', progress: 0.74, action: 'address-mixed-shock-causes',
      narration: narrate(patient) };
  }
  return { id: 'reassessment', focus: 'monitor', progress: 0.9, action: 'reassess-mixed-shock-trajectory',
    narration: narrate(patient) };
}
