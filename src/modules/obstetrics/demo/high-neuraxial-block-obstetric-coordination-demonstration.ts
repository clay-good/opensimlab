import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsHighNeuraxial, type HighNeuraxialAction, type HighNeuraxialProgress,
} from '../high-neuraxial-block-obstetric-coordination';

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
      narration: 'Call for airway-capable help now, and have someone stay at her head. A block that reached C6 in ninety seconds has not stopped there, so any level you establish is the one it has already passed. Anesthesia, obstetrics, theatre, the newborn team and support ownership start now. Someone staying with her and talking to her is not a courtesy here: she is fully awake, her voice is failing, and she can feel herself losing the ability to breathe.' };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'monitor', progress: 0.28, action: 'reconcile-obstetrics-high-neuraxial-block-injection-clock-level-breathing-arms-circulation-fetus-and-whole-person',
      narration: 'Read the clock, the level and the arms as one ascending line. An epidural top-up four minutes ago, then ninety seconds of ascending numbness, weakening arms, a weak voice and difficulty breathing, with a supplied sensory level at C6 and worsening grip. The arms are the useful sign — hand weakness means the block is at the level that runs the diaphragm. Alongside that: a heart rate of 52, a pressure of 78/42, and a fetal baseline of 90. Every one of those is the same event.' };
  }
  if (patient.uncertaintyAtTick === null) {
    return { id: 'uncertainty', focus: 'actions', progress: 0.46, action: 'review-obstetrics-high-neuraxial-block-rapid-progression-awareness-and-alternative-cause-boundaries',
      narration: 'Hold the high block as the leading explanation without letting it close the rest. Rapid ascent after a top-up makes a high block the obvious reading, but a vasovagal event, aortocaval compression, local-anesthetic systemic toxicity, an embolic event, hemorrhage and a cardiopulmonary cause all present into this same picture and stay open. The product, concentration, dose, catheter position and true block extent are unresolved, and being awake and frightened is part of the presentation rather than a detail beside it.' };
  }
  if (patient.readinessAtTick === null) {
    return { id: 'readiness', focus: 'actions', progress: 0.64, action: 'review-obstetrics-high-neuraxial-block-parallel-airway-ventilation-circulation-uterine-displacement-fetal-birth-and-support-readiness',
      narration: 'Let the airway, the circulation and the birth readiness run at once. Airway and ventilation support, circulatory support, the manual uterine displacement that qualified staff have already begun, fetal surveillance at a baseline of 90, the birth that may have to happen anyway, and continuous reassurance all belong to the same moment rather than a sequence. If she needs her airway secured she may also need an anesthetic she can no longer tell you about, which is why the awareness question is raised now rather than afterwards.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'reassess', focus: 'monitor', progress: 0.82, action: 'review-obstetrics-high-neuraxial-block-fixed-four-minute-qualified-support-report',
      narration: 'Read the fixed 4-minute report as partial support rather than resolution. No airway, oxygen, ventilation, position, fluid, drug, dose, anesthetic or birth plan is chosen here. It is a contrast rather than a predicted trajectory, and nothing here says how any individual block recedes.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-obstetrics-high-neuraxial-block-airway-circulation-block-fetal-birth-awareness-support-and-outcome-risk',
    narration: 'Nothing here establishes block recession, fetal recovery, a treatment effect, a safe newborn, or that she was unaware of any of it. Hand off the airway and respiratory risk, the circulation, the block level, the fetal status, the birth decision, the awareness question, what she has just experienced while fully conscious, and the disposition.' };
}
