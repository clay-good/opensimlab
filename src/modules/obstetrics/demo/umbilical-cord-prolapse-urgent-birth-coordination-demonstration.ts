import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsCordProlapse, type CordProlapseAction, type CordProlapseProgress,
} from '../umbilical-cord-prolapse-urgent-birth-coordination';
import { cordProlapseInlinePrompt } from '../tutor/umbilical-cord-prolapse-urgent-birth-coordination-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied. Every lesson's prose used to ship twice inside the
 * cockpit bundle — once in the tutor and once as a duplicated string literal
 * here — and gzip cannot reach across that distance to dedupe it. Deriving it
 * also makes "the two cannot drift apart" structural rather than a property
 * maintained by regenerating this file.
 */
function narrate(patient: CordProlapseProgress): string {
  const prompt = cordProlapseInlinePrompt('guided', { scenarioVersion: '0.1.0', cordProlapse: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const CORD_PROLAPSE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsCordProlapseDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsCordProlapse(scenario);
}

export interface CordProlapseDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: CordProlapseAction; readonly finished?: boolean;
}

/**
 * The worked example for an emergency where everything at the bedside is only a
 * bridge.
 *
 * The only treatment is the birth, and the slowest thing to arrange is the room
 * it happens in. This example examines nobody, handles and replaces no cord,
 * elevates no presenting part, fills no bladder, changes no position, and
 * selects no anesthetic or mode of birth.
 */
export function cordProlapseDemonstrationStep(
  patient?: CordProlapseProgress,
): CordProlapseDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is in theatre with a hand still relieving the cord and a birth that has not happened. Nothing was proven and nothing was excluded — not fetal recovery, not a safe birth, not what this will have cost either of them. This ends the example, not the emergency.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.08, action: 'activate-obstetrics-cord-prolapse-response-diagnosis-clock-theatre-anesthesia-newborn-and-support-roles',
      narration: narrate(patient) };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'monitor', progress: 0.28, action: 'reconcile-obstetrics-cord-prolapse-membrane-rupture-fetal-heart-exam-birth-imminence-and-whole-person',
      narration: narrate(patient) };
  }
  if (patient.bridgeAtTick === null) {
    return { id: 'bridge', focus: 'actions', progress: 0.46, action: 'review-obstetrics-cord-prolapse-pressure-relief-minimal-handling-position-and-no-delay-boundaries',
      narration: narrate(patient) };
  }
  if (patient.birthPlanAtTick === null) {
    return { id: 'birth-plan', focus: 'actions', progress: 0.64, action: 'review-obstetrics-cord-prolapse-birth-urgency-mode-anesthesia-newborn-documentation-and-safety-boundaries',
      narration: narrate(patient) };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'reassess', focus: 'monitor', progress: 0.82, action: 'review-obstetrics-cord-prolapse-fixed-persistent-fetal-compromise-and-theatre-transfer-report',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-obstetrics-cord-prolapse-fetal-maternal-theatre-newborn-support-documentation-and-outcome-risk',
    narration: narrate(patient) };
}
