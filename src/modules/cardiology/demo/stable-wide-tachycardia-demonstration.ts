import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsStableWideTachycardia, type StableWideTachycardiaAction,
  type StableWideTachycardiaProgress,
} from '../stable-wide-tachycardia';

export const STABLE_WIDE_TACHYCARDIA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsStableWideTachycardiaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsStableWideTachycardia(scenario);
}

export interface StableWideTachycardiaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: StableWideTachycardiaAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a rhythm treated as ventricular without being proven
 * so.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. It examines nobody, acquires and interprets no live ECG or
 * test, makes no exact diagnosis, selects no medication beyond the authored
 * path, supplies no dose, prepares and delivers nothing, performs no
 * cardioversion, selects no energy or sedation, makes no ablation or ICD
 * decision, determines no disposition, and predicts no recurrence or outcome.
 */
export function stableWideTachycardiaDemonstrationStep(
  patient?: StableWideTachycardiaProgress,
): StableWideTachycardiaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.reassessmentAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He is in sinus rhythm, he was awake for all of it, and the mechanism is still not proven. Treating it as ventricular without arguing about whether it was is what made the pathway safe, and it is also why the cardiology questions are still open. This ends the example, not the evaluation.' };
  }
  if (patient.stabilityAtTick === null) {
    return { id: 'stability', focus: 'monitor', progress: 0.1, action: 'reconcile-stable-wide-complex-tachycardia',
      narration: 'Confirm the pulse first. Everything else in this lesson depends on it. A sixty-eight-year-old man, abrupt palpitations and lightheadedness for twenty-two minutes, and a fixed report describing a regular monomorphic wide-complex tachycardia at 164 with a QRS of 158 ms. He has a palpable pulse, a pressure of 118/72, a saturation of 97% on air, and he is alert and warm — no hypotension, altered mentation, shock, ischemic discomfort, acute heart failure or syncope. The pulse is what separates this lesson from a cardiac arrest algorithm, and the stability is what makes a graded pathway available instead of an immediate shock. Both are current facts rather than settled ones: any instability at any point changes the pathway immediately.' };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'monitor', progress: 0.24, action: 'review-wide-complex-context',
      narration: 'Preserve the differential, and let the prior ECG do more work than the QRS width. The useful context is not an argument about morphology criteria. He has a prior sinus ECG with a narrow QRS and remote-infarct changes — a structurally abnormal heart with a previous infarct, in a man of sixty-eight with a regular monomorphic wide rhythm, which is the combination that makes ventricular tachycardia the working assumption rather than a possibility to debate. His reported LVEF is 55%, his potassium is 4.2 and his magnesium 2.0, and there is no prolonged-QT or acute-STEMI report. Keep the alternatives open — this lab does not establish an exact diagnosis — while acting as though it is ventricular, because that is the assumption that is safe when wrong in either direction.' };
  }
  if (patient.readinessAtTick === null) {
    return { id: 'readiness', focus: 'actions', progress: 0.38, action: 'prepare-wide-complex-pathway',
      narration: 'Get the room ready before anything is given. Pads on, help present. Monitoring, access, expert help, pads and immediate synchronized-cardioversion capability are prepared before the medication path rather than alongside it — and that ordering is the point rather than housekeeping. A drug given to a stable wide-complex tachycardia can be followed by a patient who is no longer stable, and the difference between a graded pathway and a crisis is whether the rescue was already in the room when that happened. You prepare none of this yourself; what you record is that it is ready.' };
  }
  if (patient.medicationAtTick === null) {
    return { id: 'medication', focus: 'actions', progress: 0.52, action: 'record-wide-complex-procainamide-pathway',
      narration: 'Record the treating team\'s pathway, and note what they checked before choosing it. The authored treating team selects a monitored procainamide pathway after checking the heart-failure and QT context — and that check is the part worth noticing, because it is what makes this a considered choice rather than a default. No dose is supplied here and none is selected by you: the agent belongs to the authored pathway, and the preparation and delivery belong to the team. What you are recording is that a specific expert-guided path is running and that its preconditions were examined first.' };
  }
  if (patient.nonresponseAtTick === null) {
    return { id: 'nonresponse', focus: 'monitor', progress: 0.66, action: 'review-wide-complex-medication-nonresponse',
      narration: 'Let time pass, then look at what the drug did. This is its own step for a reason. The fixed rhythm persists at 158 with a pressure of 114/70. Recording that is not bookkeeping — it is the finding that licenses escalation, and the engine will not accept a cardioversion intent until it lands. A medication path written down and never assessed is how an escalation happens without a reason and, just as often, how one that is needed gets delayed while everyone assumes the drug is still working. Note that he is still stable at 114/70: this is nonresponse rather than deterioration, and the distinction is what keeps this a synchronized-cardioversion decision rather than an emergency.' };
  }
  if (patient.cardioversionAtTick === null) {
    return { id: 'cardioversion', focus: 'actions', progress: 0.82, action: 'record-wide-complex-cardioversion-intent',
      narration: 'Record the intent to cardiovert a patient who is awake and comfortable. The drug did not work and he remains stable, which makes synchronized cardioversion the next rung — and the word doing the work is synchronized. You select no energy, no sedation and no device settings, and you perform nothing; all of that belongs to the team, along with the conversation with a man who is awake and about to be shocked. That conversation is easy to omit in a lesson about rhythms and it is part of the procedure rather than a courtesy attached to it.' };
  }
  return { id: 'reassessment', focus: 'monitor', progress: 0.94, action: 'reassess-wide-complex-trajectory',
    narration: 'Sinus at 84. Notice how little that proves. The authored report is sinus rhythm at 84 with a pressure of 120/74. What it does not establish: the mechanism, which is still unproven, and therefore the diagnosis nobody made. A wide-complex tachycardia that terminated after a procainamide pathway and a synchronized shock is a rhythm that responded to treatment, not a rhythm that has been identified. What the record needs is ownership and what follows — the cardiology questions about his remote infarct, his ventricular function and what this episode means for them are exactly the ones this lab does not answer. Nothing here diagnoses, selects a medication beyond the authored path, supplies a dose, performs a cardioversion, chooses energy or sedation, decides about ablation or an ICD, determines disposition, or predicts recurrence or outcome.' };
}
