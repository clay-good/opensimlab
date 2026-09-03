import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsHighNeuraxial, type HighNeuraxialAction, type HighNeuraxialProgress,
} from '../high-neuraxial-block-obstetric-coordination';
import { highNeuraxialInlinePrompt } from '../tutor/high-neuraxial-block-obstetric-coordination-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied. Every lesson's prose used to ship twice inside the
 * cockpit bundle — once in the tutor and once as a duplicated string literal
 * here — and gzip cannot reach across that distance to dedupe it. Deriving it
 * also makes "the two cannot drift apart" structural rather than a property
 * maintained by regenerating this file.
 */
function narrate(patient: HighNeuraxialProgress): string {
  const prompt = highNeuraxialInlinePrompt('guided', { scenarioVersion: '0.1.0', highNeuraxial: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const HIGH_NEURAXIAL_DEMONSTRATION_VERSION = '0.1.0';

export function supportsHighNeuraxialDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsHighNeuraxial(scenario);
}

export interface HighNeuraxialDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: HighNeuraxialAction; readonly finished?: boolean;
}

/**
 * The worked example for a block that is still climbing.
 *
 * Any level you establish is the one it has already passed, and she is awake
 * through all of it. This example examines nobody, assesses no block, manages
 * no airway, delivers no oxygen or ventilation, and selects no anesthetic or
 * birth plan.
 */
export function highNeuraxialDemonstrationStep(
  patient?: HighNeuraxialProgress,
): HighNeuraxialDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on supported, still blocked, still frightened, with a fetus that has not recovered and a birth that has not happened. Nothing was proven and nothing was excluded — not the cause, not the recession, not what she will remember of this. This ends the example, not the emergency.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.08, action: 'activate-obstetrics-high-neuraxial-block-airway-anesthesia-obstetric-theatre-newborn-and-support-response',
      narration: narrate(patient) };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'monitor', progress: 0.28, action: 'reconcile-obstetrics-high-neuraxial-block-injection-clock-level-breathing-arms-circulation-fetus-and-whole-person',
      narration: narrate(patient) };
  }
  if (patient.uncertaintyAtTick === null) {
    return { id: 'uncertainty', focus: 'actions', progress: 0.46, action: 'review-obstetrics-high-neuraxial-block-rapid-progression-awareness-and-alternative-cause-boundaries',
      narration: narrate(patient) };
  }
  if (patient.readinessAtTick === null) {
    return { id: 'readiness', focus: 'actions', progress: 0.64, action: 'review-obstetrics-high-neuraxial-block-parallel-airway-ventilation-circulation-uterine-displacement-fetal-birth-and-support-readiness',
      narration: narrate(patient) };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'reassess', focus: 'monitor', progress: 0.82, action: 'review-obstetrics-high-neuraxial-block-fixed-four-minute-qualified-support-report',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-obstetrics-high-neuraxial-block-airway-circulation-block-fetal-birth-awareness-support-and-outcome-risk',
    narration: narrate(patient) };
}
