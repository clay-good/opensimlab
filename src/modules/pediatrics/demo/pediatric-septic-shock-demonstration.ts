import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPediatricSepticShock, type PediatricSepticShockAction,
  type PediatricSepticShockProgress,
} from '../pediatric-septic-shock';
import { pediatricSepticShockInlinePrompt } from '../tutor/pediatric-septic-shock-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: PediatricSepticShockProgress): string {
  const prompt = pediatricSepticShockInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const PEDIATRIC_SEPTIC_SHOCK_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPediatricSepticShockDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPediatricSepticShock(scenario);
}

export interface PediatricSepticShockDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PediatricSepticShockAction; readonly finished?: boolean;
}

/**
 * The worked example for a child two aliquots did not fix.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. Of the unordered pair it takes rescue first and source second,
 * which is one valid order rather than the required one. The example examines
 * nobody, calculates no score, acquires and interprets no culture, specimen,
 * lactate, laboratory test, ultrasound or image, identifies no source or
 * pathogen, chooses no antimicrobial, drug, dose, concentration, route,
 * access, fluid, bolus, volume, rate, vasoactive, oxygen, device or flow,
 * performs no source-control procedure, and determines no disposition or
 * outcome.
 */
export function pediatricSepticShockDemonstrationStep(
  patient?: PediatricSepticShockProgress,
): PediatricSepticShockDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is holding on one infusion, with the reason she is in shock still in her abdomen and a team already planning what to do about it. Nothing here was fixed. Everything here has an owner. This ends the example, not the evaluation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.1, action: 'reconcile-pediatric-septic-shock-care-and-trajectory',
      narration: narrate(patient) };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'monitor', progress: 0.28, action: 'recognize-pediatric-septic-shock-after-fluid-reassessment',
      narration: narrate(patient) };
  }
  if (patient.rescueAtTick === null) {
    return { id: 'rescue', focus: 'actions', progress: 0.46, action: 'activate-pediatric-septic-shock-critical-care-and-vasoactive-ownership',
      narration: narrate(patient) };
  }
  if (patient.sourceAtTick === null) {
    return { id: 'source', focus: 'actions', progress: 0.64, action: 'escalate-pediatric-septic-shock-source-control',
      narration: narrate(patient) };
  }
  if (patient.laterResponseAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.8, action: 'review-pediatric-septic-shock-later-response',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-pediatric-septic-shock-active-risk',
    narration: narrate(patient) };
}
