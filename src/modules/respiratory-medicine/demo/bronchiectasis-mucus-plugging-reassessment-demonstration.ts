import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsBronchiectasisMucusPlugging, type BronchiectasisMucusPluggingAction, type BronchiectasisMucusPluggingProgress,
} from '../bronchiectasis-mucus-plugging-reassessment';
import { bronchiectasisMucusPluggingInlinePrompt } from '../tutor/bronchiectasis-mucus-plugging-reassessment-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: BronchiectasisMucusPluggingProgress): string {
  const prompt = bronchiectasisMucusPluggingInlinePrompt('guided', { scenarioVersion: '0.1.0', bronchiectasisMucusPlugging: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const BRONCHIECTASIS_MUCUS_PLUGGING_DEMONSTRATION_VERSION = '0.1.0';

export function supportsBronchiectasisMucusPluggingDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsBronchiectasisMucusPlugging(scenario);
}

export interface BronchiectasisMucusPluggingDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: BronchiectasisMucusPluggingAction; readonly finished?: boolean;
}

/**
 * The worked example for a woman whose own clearance routine has stopped
 * working.
 *
 * The treatment is a physiotherapist supporting her routine rather than anyone
 * inventing a new one. This example examines nobody, tests no cough, assesses
 * no sputum, performs no clearance or suction, and selects no device or
 * technique.
 */
export function bronchiectasisMucusPluggingDemonstrationStep(
  patient?: BronchiectasisMucusPluggingProgress,
): BronchiectasisMucusPluggingDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on breathing more easily, clearing better, and with a lobe that is still partly down for a reason nobody has established. Nothing was proven and nothing was performed. This ends the example, not the investigation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-bronchiectasis-mucus-plugging-trajectory',
      narration: narrate(patient) };
  }
  if (patient.evidenceAtTick === null) {
    return { id: 'evidence', focus: 'monitor', progress: 0.26, action: 'review-bronchiectasis-mucus-plugging-evidence-and-alternatives',
      narration: narrate(patient) };
  }
  if (patient.clearanceIntentAtTick === null) {
    return { id: 'intent', focus: 'actions', progress: 0.46, action: 'record-bronchiectasis-mucus-plugging-supported-airway-clearance-intent',
      narration: narrate(patient) };
  }
  if (patient.responseAtTick === null) {
    return { id: 'response', focus: 'monitor', progress: 0.64, action: 'review-bronchiectasis-mucus-plugging-later-response',
      narration: narrate(patient) };
  }
  if (patient.escalationAtTick === null) {
    return { id: 'escalation', focus: 'actions', progress: 0.82, action: 'escalate-bronchiectasis-mucus-plugging-persistent-collapse',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-bronchiectasis-mucus-plugging-reassessment',
    narration: narrate(patient) };
}
