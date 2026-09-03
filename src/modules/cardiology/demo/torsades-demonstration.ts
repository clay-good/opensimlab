import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsTorsades, type TorsadesAction, type TorsadesProgress,
} from '../torsades';

export const TORSADES_DEMONSTRATION_VERSION = '0.1.0';

export function supportsTorsadesDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsTorsades(scenario);
}

export interface TorsadesDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: TorsadesAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a rhythm whose name is the thing that slows people
 * down.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. Where the last pair is unordered the example reviews the cause
 * before recording the suppression intent — a choice, not a rule. It examines
 * nobody, acquires or interprets no pulse, ECG, monitor, laboratory or imaging
 * data, diagnoses no cause, selects no energy or sedation, operates no
 * defibrillator, delivers no shock, CPR, oxygen, magnesium, electrolyte,
 * medication, infusion, pacing or isoproterenol, assesses no capture, chooses
 * no device, determines no disposition, and predicts no outcome.
 */
export function torsadesDemonstrationStep(
  patient?: TorsadesProgress,
): TorsadesDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is in sinus rhythm at 52 with a QT nobody has shortened, a potassium and a magnesium nobody has yet corrected, and a medication nobody has yet stopped. The shock was the easy part and somebody else delivered it. The order was the lesson: electricity first because she was failing, and the cause afterwards because that is when there was time. This ends the example, not the evaluation.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'monitor', progress: 0.1, action: 'reconcile-torsades-pulse-and-pattern',
      narration: 'Name the pattern and check the pulse in the same breath. Both halves change what happens next. A sixty-seven-year-old woman in a monitored unit after presyncope, and a fixed report of sustained polymorphic VT near 220 — wide complexes waxing, waning and rotating around the baseline, not the uniform beats of monomorphic VT and not the disorganised chaos of fibrillation. She has a weak palpable pulse, a pressure of 74/42, acute confusion and cool pale skin, and a saturation of 96% on air. A pre-event report describes sinus bradycardia at 52 with a QTc of 560 ms. She has a pulse, which is what keeps this out of the arrest algorithm, and she is failing, which is what makes it an emergency anyway. If the pulse goes, the pathway changes immediately.' };
  }
  if (patient.shockIntentAtTick === null) {
    return { id: 'shock', focus: 'actions', progress: 0.26, action: 'record-torsades-unsynchronized-shock-intent',
      narration: 'Shock intent now — unsynchronized, and before anything else you are tempted to do. Knowing the word torsades pulls hard towards magnesium and the QT, and both are the wrong first move. A sustained polymorphic rhythm with a failing pulse is an electrical problem, and the engine refuses the cause work until this is recorded, because the delay is the harm. Unsynchronized rather than synchronized is the specific point: the complexes vary beat to beat, so the machine has nothing consistent to synchronize to and will sit there refusing to fire while she gets worse. You do not calculate an energy, choose a sedative, operate a defibrillator or deliver anything — you record the intent, the experienced help, the pad and defibrillator readiness, and the plan to repeat.' };
  }
  if (patient.postShockAtTick === null) {
    return { id: 'postshock', focus: 'monitor', progress: 0.44, action: 'review-torsades-post-shock-rhythm',
      narration: 'Let time pass, then read what the team\'s shock actually did. The fixed later report is sinus bradycardia at 52, a pressure of 112/68, alert mentation and warm perfusion. Two things about that are worth saying out loud. The first is that the treating team delivered the shock, not you — nothing in this lesson operates a defibrillator. The second is what the report does not say: her QTc was 560 ms before this started, the rate she has converted to is 52, and a slow rate with a long QT is the exact substrate that produced the arrhythmia. She has been rescued, not fixed, and the recurrence risk is the thing the rest of this lesson exists for.' };
  }
  if (patient.contextAtTick === null) {
    return { id: 'parallel', focus: 'monitor', progress: 0.6, action: 'review-torsades-long-qt-context',
      narration: 'The emergency is over. Two lanes are open now, and either can go first. One is the cause: what made her QT long enough to do this — five contributors, every one of which contributes and none of which is the cause. The other is what stops it happening again in the next hour. The engine accepts them in either order and refuses the handoff until both have landed, which is a fair model of a real unit — somebody is on the phone about the dofetilide while somebody else is drawing up magnesium. What has changed since the opening is that there is now time to think, and that is the only reason these come second.' };
  }
  if (patient.recurrenceIntentAtTick === null) {
    return { id: 'recurrence', focus: 'actions', progress: 0.78, action: 'record-torsades-recurrence-suppression-intent',
      narration: 'Record magnesium intent — and be precise about why it is appropriate here and not everywhere. Magnesium here is bounded to recurrent polymorphic VT with a long QT, which is what she has, and it is not a general antiarrhythmic for a normal QT. That boundary is worth holding because magnesium is easy to reach for and this is one of the few places it is specifically indicated. Alongside it: correcting the authored electrolytes, reviewing the culprit medication with the people who prescribed it, continuous monitoring, and expert involvement. You supply no dose, no target, no infusion, no pacing setting and no capture claim — those belong to the team, and the electrolyte and medication work stays separate from the magnesium rather than folded into it.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-torsades-recurrence-plan',
    narration: 'Hand off a risk that has not gone away, and resist the urge to call this settled. The later check is still sinus bradycardia at 52 with preserved perfusion and no recurrence so far, and one quiet interval proves nothing about the next one. What gets handed off is the persistent QT risk, the triggers for recurrence and for pulse loss, the electrolyte and medication work still open, the expert contingency, and named owners. What does not get handed off is a promise: no durable freedom from recurrence, no disposition, no prognosis and no outcome. Nothing in this lesson examines her, acquires or interprets a pulse, ECG, monitor, laboratory or imaging result, diagnoses a cause, selects an energy or sedation, operates a defibrillator, delivers a shock, CPR, oxygen, magnesium, an electrolyte, a medication, an infusion, pacing or isoproterenol, assesses capture, chooses a device, determines disposition or prognosis, or predicts recurrence or outcome.' };
}
