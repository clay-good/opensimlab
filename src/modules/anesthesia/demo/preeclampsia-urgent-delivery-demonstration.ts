import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsPreeclampsiaUrgentDelivery } from '../preeclampsia-urgent-delivery';

/**
 * What this worked example reads.
 *
 * The twenty-first observed-state demonstration in the anaesthesia module. Every
 * quantity it gates on only rises -- a count of accepted pressure checks and two
 * cumulative doses -- so no beat here can walk backwards, which matters because
 * the pressure itself is not monotone once labetalol is given.
 */
export interface PreeclampsiaUrgentDeliveryProgress {
  readonly bloodPressureChecks: number;
  readonly labetalolTotalMg: number;
  readonly magnesiumSulfateTotalG: number;
  readonly systolicMmHg: number;
}

export const PREECLAMPSIA_URGENT_DELIVERY_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPreeclampsiaUrgentDeliveryDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPreeclampsiaUrgentDelivery(scenario);
}

export interface PreeclampsiaUrgentDeliveryDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

const step = (action: string): Omit<LearnerAction, 'tick'> =>
  ({ type: 'preeclampsia-response', payload: { action } });

/**
 * The worked example for the two drugs that are not alternatives.
 *
 * Read from the latest stage backwards, as the twenty before it are.
 *
 * It gives no real drug to anyone, delivers no baby, and predicts no outcome for
 * any person.
 */
export function preeclampsiaUrgentDeliveryDemonstrationStep(
  patient?: PreeclampsiaUrgentDeliveryProgress,
): PreeclampsiaUrgentDeliveryDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.bloodPressureChecks >= 2) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'Both drugs are in and the pressure has been read again. The comparison worth carrying away is with the run that gives only the magnesium. That run confirms the pressure correctly, gives the magnesium correctly, waits, and reads a pressure of 165/120 mmHg — the same numbers it started with, unchanged to the digit. Its prophylaxis objective is met in full. Magnesium is not an antihypertensive, and this model states that by moving nothing rather than by warning about it, so a learner can do a right thing and treat none of the emergency. Two honest limits. The reassessment objective in that run is not marked failed but NOT EXERCISED, because there was no antihypertensive response to reassess — the rubric declines to grade what was never attempted. And the pressure response you have just watched is a bounded teaching trajectory rather than individual pharmacokinetics: it is not a prediction of what 20 mg would do to a person. This ends the example, not the evaluation.' };
  }
  if (patient.magnesiumSulfateTotalG > 0) {
    return { id: 'reassess', focus: 'monitor', progress: 0.85,
      dispatch: step('repeat-blood-pressure'),
      narration: 'Now read the pressure again, and read it as a question rather than a formality. The number that comes back is the only evidence available that the antihypertensive did anything, and it is also the check on the other direction — the target here is out of the severe range, not as low as possible, because the placenta is downstream of every millimetre you take off.' };
  }
  if (patient.labetalolTotalMg > 0) {
    return { id: 'magnesium', focus: 'actions', progress: 0.65,
      dispatch: step('magnesium-sulfate-4g-iv'),
      narration: 'Now magnesium sulfate, 4 g as a loading dose, and it is worth being exact about what it is for. This is seizure prophylaxis. It is not a second antihypertensive and it is not a substitute for the first one: in this model it will not move the pressure at all. The two drugs answer two different questions and neither one covers for the other.' };
  }
  if (patient.bloodPressureChecks > 0) {
    return { id: 'labetalol', focus: 'actions', progress: 0.45,
      dispatch: step('labetalol-20mg-iv'),
      narration: 'The repeat confirms it, so treat the pressure now. Labetalol 20 mg IV is the listed first-line branch here, and the reason to give it promptly rather than tidily is that severe-range pressure in pregnancy is the stroke risk itself rather than a marker of one. Waiting for the rest of the plan to be arranged is the commonest way this gets delayed.' };
  }
  return { id: 'confirm', focus: 'monitor', progress: 0.2,
    dispatch: step('repeat-blood-pressure'),
    narration: 'Repeat the pressure first, before either drug. This is not caution for its own sake and the engine enforces it: reach for a drug before a confirming reading and nothing is given. One number can be an artefact of a cuff, a position, or a moment, and what turns a reading into an emergency is that it persists.' };
}
