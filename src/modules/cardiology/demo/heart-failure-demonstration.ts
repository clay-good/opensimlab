import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import { supportsHeartFailure, type HeartFailureAction, type HeartFailureProgress } from '../heart-failure';

export const HEART_FAILURE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsHeartFailureDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsHeartFailure(scenario);
}

export interface HeartFailureDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: HeartFailureAction; readonly finished?: boolean;
}

/**
 * The worked example for a man who feels better and is not ready to go.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. It examines nobody, acquires and interprets no test, calculates
 * no dry weight, fluid target, dose or score, diagnoses nothing, prescribes and
 * delivers no treatment, selects no regimen, determines no disposition, and
 * predicts no outcome.
 */
export function heartFailureDemonstrationStep(
  patient?: HeartFailureProgress,
): HeartFailureDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.readinessAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He is more comfortable, three and a half kilos above his own baseline, and staying. What the record now says is why he is staying, what would change that, and who is watching the numbers that decide it. This ends the example, not the evaluation.' };
  }
  if (patient.statusAtTick === null) {
    return { id: 'status', focus: 'monitor', progress: 0.12, action: 'reconcile-heart-failure-congestion-and-perfusion',
      narration: 'Two questions, and they have different answers. Is he wet, and is he cold? A seventy-four-year-old man with a fixed ejection fraction of 30%, twenty-four hours in after missed medications and a high-sodium week. Wet: he is still orthopneic, with a raised JVP, bibasal crackles and 2+ leg edema. Cold: he is not — his blood pressure is 118/73, his extremities are warm, and there is no authored shock. That combination is the common one and it is the one people misread, because a warm, comfortable-looking patient with a normal pressure invites the conclusion that the congestion has been dealt with. It has not. And no shock, ischemia, dangerous rhythm, infection or respiratory failure is authored, which narrows the field without emptying it.' };
  }
  if (patient.responseAtTick === null) {
    return { id: 'response', focus: 'monitor', progress: 0.34, action: 'review-heart-failure-diuretic-response',
      narration: 'Judge the response on five things, and notice which one is lying to you. The symptom improved — dyspnea is better — and that is the finding people stop at. Put it next to the rest. Weight has gone 77.2 to 75.8, so 1.4 kg off, against a documented clinic weight of 72.0: he is still 3.8 kg above his own baseline. Net balance is −1.6 L on 2.4 L of urine. The examination has not resolved: JVP still up, crackles still there, edema still 2+. So four of five say partially decongested and one says better, and the one that says better is the one he can tell you about. That is why the physical findings and the weight against a real baseline are what this judgement rests on.' };
  }
  if (patient.toleranceAtTick === null) {
    return { id: 'tolerance', focus: 'monitor', progress: 0.56, action: 'review-heart-failure-tolerance-and-precipitant',
      narration: 'Now ask what the decongestion is costing, and why he decompensated at all. Creatinine has moved from 1.1 to 1.3. That is worth reading carefully rather than reacting to: a modest rise during effective decongestion in a congested patient is not automatically kidney injury, and stopping diuresis at the first creatinine bump in someone who is still visibly wet is a well-worn way to send a patient home to bounce back. Potassium at 3.7 and magnesium at 1.9 are the numbers that keep the diuresis safe rather than incidental. Then the question that decides whether he is back next month: he missed his medications and had a high-sodium week, and both of those have causes — cost, understanding, side effects, a change at home. This lesson calculates no dry weight, no fluid target, and no dose.' };
  }
  if (patient.transitionAtTick === null) {
    return { id: 'transition', focus: 'actions', progress: 0.78, action: 'record-heart-failure-transition-intent',
      narration: 'Record the intent, and keep the two jobs separate. There are two different pieces of work here and they get conflated. One is finishing the decongestion and moving from intravenous to oral in a way that holds. The other is the guideline-directed therapy for his ejection fraction of 30%, which is what changes what happens to him over years rather than over this admission — and an admission is one of the few moments it reliably gets reviewed. Recording the intent is not writing the regimen: no dose, no agent, no schedule is selected here, and the individualization belongs to the team who will follow the response.' };
  }
  return { id: 'readiness', focus: 'actions', progress: 0.92, action: 'reassess-heart-failure-discharge-readiness',
    narration: 'Say plainly that he is not ready to go, and then make the discharge safe when it comes. The authored snapshot is not discharge-ready, and the reason is on the examination rather than on his face: persistent congestion is the single best predictor of coming straight back. What the record needs before he does leave is the part that keeps working at home — the education, including what his weights mean and what sodium did here, who owns the medication changes and the monitoring, the triggers that should bring him back sooner, and early follow-up rather than a routine appointment in six weeks. Nothing here calculates a dry weight, a target or a dose, diagnoses, prescribes or delivers treatment, selects a regimen, determines disposition, or predicts an outcome.' };
}
