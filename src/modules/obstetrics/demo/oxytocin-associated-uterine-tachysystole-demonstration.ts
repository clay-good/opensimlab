import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsOxytocinTachysystole, type OxytocinTachysystoleAction, type OxytocinTachysystoleProgress,
} from '../oxytocin-associated-uterine-tachysystole';

export const OXYTOCIN_TACHYSYSTOLE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsOxytocinTachysystoleDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsOxytocinTachysystole(scenario);
}

export interface OxytocinTachysystoleDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: OxytocinTachysystoleAction; readonly finished?: boolean;
}

/**
 * The worked example for a complication somebody caused.
 *
 * The drug that produced this is still running, so the interval spent
 * interpreting is an interval the fetus spends under the same contractions.
 * This example examines and palpates nobody, operates no infusion, changes no
 * position, delivers no oxygen or fluid, and plans no birth.
 */
export function oxytocinTachysystoleDemonstrationStep(
  patient?: OxytocinTachysystoleProgress,
): OxytocinTachysystoleDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on with a fetus that is better and a cause that could be repeated. Nothing was proven and nothing was excluded — not durable fetal safety, not the other explanations, not whether this labour ends the way she hoped. This ends the example, not the labour.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.08, action: 'activate-obstetrics-oxytocin-tachysystole-qualified-obstetric-fetal-and-support-response',
      narration: 'Bring senior obstetric and midwifery help in before you study anything. The drug that produced this is still running, so the interval spent interpreting is an interval the fetus spends under the same contractions. Senior obstetric, midwifery, anesthesia, newborn and support ownership start now. She is awake and frightened and watching everyone’s faces, so someone explaining what is happening is part of the response rather than a courtesy added to it.' };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'monitor', progress: 0.28, action: 'reconcile-obstetrics-oxytocin-tachysystole-infusion-contraction-fetal-maternal-and-whole-person-context',
      narration: 'Read the infusion increase and the fetal change as cause and effect. Six contractions in every ten-minute window averaged across thirty minutes, each lasting seventy to ninety seconds, twenty minutes after the last increase. And in the same window a fetal heart that went from a baseline of 140 with moderate variability and no decelerations to 155 with minimal variability and recurrent late decelerations to 95. Contractions that long, that often, leave too little time in between — and the time in between is when the placenta refills.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'actions', progress: 0.46, action: 'recognize-obstetrics-oxytocin-tachysystole-with-fetal-heart-deterioration-without-single-trace-closure',
      narration: 'Call it tachysystole with fetal deterioration, on the trajectory rather than one trace. The finding is the change over time, not any single feature of the current trace: a baseline that rose, variability that fell, and decelerations that appeared, together, after an increase. Reading one snapshot would let you argue about any of them separately. Naming it also closes nothing — artifact, a maternal cause, an evolving fetal problem, and a deterioration that has nothing to do with the oxytocin all stay open while you act.' };
  }
  if (patient.readinessAtTick === null) {
    return { id: 'readiness', focus: 'actions', progress: 0.64, action: 'review-obstetrics-oxytocin-tachysystole-qualified-source-stop-position-cause-and-birth-readiness',
      narration: 'The first correction is to stop causing it, and the rest is what qualified staff do. Stopping or reducing the oxytocin, a non-supine position, correcting a contributing cause, continued surveillance and readiness for a birth that may be needed all belong to the qualified team here. Two things that get added reflexively are not: routine oxygen for a fetal heart-rate pattern is not supported, and a fluid bolus without hypotension is treating the monitor rather than the mother. Restarting later is a decision that depends on what happens next, and nothing about it is settled now.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'reassess', focus: 'monitor', progress: 0.82, action: 'review-obstetrics-oxytocin-tachysystole-fixed-six-minute-qualified-recovery-report',
      narration: 'Read the fixed 6-minute report as an early recovery rather than a resolved one. No infusion, position, oxygen, fluid, drug, dose or birth plan is chosen here. It is a contrast rather than a predicted trajectory, and nothing here says how any individual fetus recovers after contractions like these.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-obstetrics-oxytocin-tachysystole-recurrence-fetal-birth-medication-maternal-and-outcome-risk',
    narration: 'A partial recovery establishes no durable fetal safety, no eligibility to restart the oxytocin, no birth plan and no outcome. Hand off the recurrence risk, the fetal surveillance, the oxytocin decision and who makes it, the alternative causes still open, the birth question, the newborn team, what she has just watched happen, and the disposition.' };
}
