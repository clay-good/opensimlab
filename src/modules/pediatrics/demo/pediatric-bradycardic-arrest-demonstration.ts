import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPediatricBradycardicArrest, type PediatricBradycardicArrestAction,
  type PediatricBradycardicArrestProgress,
} from '../pediatric-bradycardic-arrest';
import { pediatricBradycardicArrestInlinePrompt } from '../tutor/pediatric-bradycardic-arrest-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: PediatricBradycardicArrestProgress): string {
  const prompt = pediatricBradycardicArrestInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const PEDIATRIC_BRADYCARDIC_ARREST_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPediatricBradycardicArrestDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPediatricBradycardicArrest(scenario);
}

export interface PediatricBradycardicArrestDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PediatricBradycardicArrestAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a child whose heart did not follow her oxygen.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. The steps are a strict line, so this example has only one order
 * available to it, and it ends inside an ongoing resuscitation because that is
 * where the lesson ends. It examines and palpates nobody, assesses no pulse,
 * airway, ventilation, monitor, capnogram or CPR quality, acquires and
 * interprets no rhythm or test, diagnoses and assigns no cause, delivers no
 * oxygen, ventilation, compression, access, drug, dose, pacing or shock, and
 * determines no termination, disposition, prognosis or outcome.
 */
export function pediatricBradycardicArrestDemonstrationStep(
  patient?: PediatricBradycardicArrestProgress,
): PediatricBradycardicArrestDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'Compressions are running, the rhythm on the screen is not a pulse, and nobody knows yet why any of this started. This example stops here because the resuscitation does not. Nothing was concluded, and that is the accurate ending rather than a comfortable one. This ends the example, not the evaluation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.1, action: 'reconcile-pediatric-bradycardic-arrest-support-and-trajectory',
      narration: narrate(patient) };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'monitor', progress: 0.28, action: 'recognize-pediatric-bradycardia-with-persistent-compromise',
      narration: narrate(patient) };
  }
  if (patient.resuscitationAtTick === null) {
    return { id: 'resuscitation', focus: 'actions', progress: 0.46, action: 'activate-pediatric-bradycardic-arrest-qualified-resuscitation-ownership',
      narration: narrate(patient) };
  }
  if (patient.safetyAtTick === null) {
    return { id: 'safety', focus: 'actions', progress: 0.64, action: 'review-pediatric-bradycardic-arrest-causes-pulse-and-arrest-boundary',
      narration: narrate(patient) };
  }
  if (patient.laterResponseAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.8, action: 'review-pediatric-bradycardic-arrest-pulse-loss-response',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-pediatric-bradycardic-arrest-active-risk',
    narration: narrate(patient) };
}
