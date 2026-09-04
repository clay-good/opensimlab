import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsSepticShockResuscitation, type SepticShockResuscitationAction,
  type SepticShockResuscitationProgress,
} from '../septic-shock-resuscitation';
import { septicShockResuscitationInlinePrompt } from '../tutor/septic-shock-resuscitation-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied. Every lesson's prose used to ship twice inside the
 * cockpit bundle — once in the tutor and once as a duplicated string literal
 * here — and gzip cannot reach across that distance to dedupe it. Deriving it
 * also makes "the two cannot drift apart" structural rather than a property
 * maintained by regenerating this file.
 */
function narrate(patient: SepticShockResuscitationProgress): string {
  const prompt = septicShockResuscitationInlinePrompt('guided',
    { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const SEPTIC_SHOCK_RESUSCITATION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsSepticShockResuscitationDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsSepticShockResuscitation(scenario);
}

export interface SepticShockResuscitationDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: SepticShockResuscitationAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a patient every instinct says to give fluid to.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. There is no unordered lane here: five beats in the only order
 * the engine accepts. It examines nobody, measures, samples, scans, calculates
 * or diagnoses nothing, prescribes and delivers no fluid or drug, adjusts no
 * device, performs no drainage, determines no disposition, and predicts no
 * outcome.
 */
export function septicShockResuscitationDemonstrationStep(
  patient?: SepticShockResuscitationProgress,
): SepticShockResuscitationDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.reassessedAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'Her pressure is four millimetres better, her kidney has not moved, her lactate has not been rechecked, and her biliary tree is still obstructed. Nothing was given and nothing was drained, because neither is what this lesson does. What it did was stop a fourth bolus going into a patient whose stroke volume rose two per cent and whose lungs have started to fill. This ends the example, not the evaluation.' };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'monitor', progress: 0.12, action: 'reconcile-septic-shock-resuscitation-so-far',
      narration: narrate(patient) };
  }
  if (patient.perfusionAtTick === null) {
    return { id: 'perfusion', focus: 'monitor', progress: 0.3, action: 'reassess-septic-shock-perfusion',
      narration: narrate(patient) };
  }
  if (patient.fluidResponseAtTick === null) {
    return { id: 'fluid', focus: 'monitor', progress: 0.52, action: 'test-septic-shock-fluid-responsiveness',
      narration: narrate(patient) };
  }
  if (patient.planAtTick === null) {
    return { id: 'plan', focus: 'actions', progress: 0.74, action: 'individualize-septic-shock-support-and-source-control',
      narration: narrate(patient) };
  }
  return { id: 'trajectory', focus: 'monitor', progress: 0.9, action: 'reassess-septic-shock-trajectory',
    narration: narrate(patient) };
}
