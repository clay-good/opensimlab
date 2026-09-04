import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsShoulderDystocia, type ShoulderDystociaAction, type ShoulderDystociaProgress,
} from '../shoulder-dystocia-cognitive-sequence';
import { shoulderDystociaInlinePrompt } from '../tutor/shoulder-dystocia-cognitive-sequence-guidance';


/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: ShoulderDystociaProgress): string {
  const prompt = shoulderDystociaInlinePrompt('guided', { scenarioVersion: '0.1.0', shoulderDystocia: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const SHOULDER_DYSTOCIA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsShoulderDystociaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsShoulderDystocia(scenario);
}

export interface ShoulderDystociaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: ShoulderDystociaAction; readonly finished?: boolean;
}

/**
 * The worked example for an emergency whose hardest instruction is to stop
 * doing two things.
 *
 * Almost everything that makes this worse is something a person does under
 * pressure. This example examines nobody, applies no traction or pressure,
 * changes no position, directs no pushing, and performs no maneuver,
 * episiotomy or delivery.
 */
export function shoulderDystociaDemonstrationStep(
  patient?: ShoulderDystociaProgress,
): ShoulderDystociaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'The baby is born and nobody has examined either of them yet. Nothing was proven and nothing was excluded — not an injury, not a safe recovery, not what this birth will mean to her. This ends the example, not the care.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.08, action: 'activate-obstetrics-shoulder-dystocia-emergency-response-head-delivery-clock-leader-timekeeper-newborn-and-support-roles',
      narration: narrate(patient) };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'monitor', progress: 0.28, action: 'reconcile-obstetrics-shoulder-dystocia-head-delivery-gentle-traction-failure-position-pushing-and-whole-person',
      narration: narrate(patient) };
  }
  if (patient.safetyAtTick === null) {
    return { id: 'safety', focus: 'actions', progress: 0.46, action: 'review-obstetrics-shoulder-dystocia-stop-pushing-no-fundal-pressure-no-forceful-traction-and-first-line-position-boundary',
      narration: narrate(patient) };
  }
  if (patient.escalationAtTick === null) {
    return { id: 'escalation', focus: 'actions', progress: 0.64, action: 'review-obstetrics-shoulder-dystocia-qualified-escalation-maneuvers-episiotomy-access-rescue-and-documentation-boundary',
      narration: narrate(patient) };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'reassess', focus: 'monitor', progress: 0.82, action: 'review-obstetrics-shoulder-dystocia-fixed-qualified-delivery-and-immediate-risk-report',
      narration: 'Read the fixed report as this case rather than as the method. It describes what a qualified team did here and what happened. No maneuver, episiotomy, drug or procedure is chosen here, it is not a universal sequence, and it says nothing about how any other shoulder dystocia resolves.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-obstetrics-shoulder-dystocia-maternal-newborn-injury-hemorrhage-support-documentation-and-outcome-risk',
    narration: 'The baby is out; that establishes no injury status for either of them. Hand off maternal perineal and other trauma, the postpartum hemorrhage risk this raises specifically, the newborn’s neurologic and musculoskeletal examination, the debrief she is owed and will remember, the contemporaneous record, and the review that follows.' };
}
