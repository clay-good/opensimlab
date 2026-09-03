import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsEclampsia, type EclampsiaAction, type EclampsiaProgress,
} from '../eclampsia-first-seizure-response';
import { eclampsiaInlinePrompt } from '../tutor/eclampsia-first-seizure-response-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied. Every lesson's prose used to ship twice inside the
 * cockpit bundle — once in the tutor and once as a duplicated string literal
 * here — and gzip cannot reach across that distance to dedupe it. Deriving it
 * also makes "the two cannot drift apart" structural rather than a property
 * maintained by regenerating this file.
 */
function narrate(patient: EclampsiaProgress): string {
  const prompt = eclampsiaInlinePrompt('guided', { scenarioVersion: '0.1.0', eclampsia: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const ECLAMPSIA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsEclampsiaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsEclampsia(scenario);
}

export interface EclampsiaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: EclampsiaAction; readonly finished?: boolean;
}

/**
 * The worked example for a seizure that has already stopped.
 *
 * Most eclamptic convulsions stop on their own, so the ending of this one is
 * not reassurance — the readiness for the next one is the work. This example
 * times and protects no seizure, positions and examines nobody, reads no fetal
 * trace, and selects no magnesium, antihypertensive, airway maneuver or birth.
 */
export function eclampsiaDemonstrationStep(
  patient?: EclampsiaProgress,
): EclampsiaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on quieter, still hypertensive, still symptomatic, and still able to convulse again. Nothing was proven and nothing was excluded — not the cause, not the control, not the stroke that this may also be. This ends the example, not the emergency.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-obstetrics-eclampsia-seizure-clock-recovery-pressure-organs-fetal-context-and-whole-person',
      narration: narrate(patient) };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'actions', progress: 0.26, action: 'recognize-obstetrics-supplied-eclampsia-pattern-after-first-seizure-with-dangerous-alternatives-open',
      narration: narrate(patient) };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.46, action: 'activate-obstetrics-eclampsia-maternal-stabilization-seizure-severe-pressure-airway-obstetric-fetal-and-dignity-response-now',
      narration: narrate(patient) };
  }
  if (patient.evidenceAtTick === null) {
    return { id: 'evidence', focus: 'monitor', progress: 0.64, action: 'review-obstetrics-eclampsia-supplied-neurologic-airway-aspiration-organ-fetal-metabolic-toxic-infectious-and-trauma-boundary',
      narration: narrate(patient) };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'reassess', focus: 'monitor', progress: 0.82, action: 'review-obstetrics-eclampsia-fixed-later-recovery-pressure-breathing-fetal-and-organ-report',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-obstetrics-eclampsia-recurrence-airway-aspiration-stroke-pressure-organ-fetal-delivery-and-outcome-risk',
    narration: narrate(patient) };
}
