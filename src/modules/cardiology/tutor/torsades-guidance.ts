import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { TorsadesProgress } from '../torsades';

export const TORSADES_TUTOR_VERSION = '0.1.0';

export interface TorsadesPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is the word torsades itself. Knowing the name
 * pulls a learner straight towards magnesium and the QT, and both of those are
 * the second half of this lesson rather than the first — a sustained
 * polymorphic rhythm with a failing pulse is an electrical emergency, and the
 * engine refuses the cause work until the shock intent is recorded. It is
 * silent on the unassisted setting, silent once the handoff is recorded, and
 * silent for any scenario version it was not written against.
 */
export function torsadesInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: TorsadesProgress },
): TorsadesPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.recognitionAtTick === null) return prompt('tdp-recognition', true,
    'Name the pattern and check the pulse in the same breath. Both halves change what happens next.',
    'A sixty-seven-year-old woman in a monitored unit after presyncope, and a fixed report of sustained polymorphic VT near 220 — wide complexes waxing, waning and rotating around the baseline, not the uniform beats of monomorphic VT and not the disorganised chaos of fibrillation. She has a weak palpable pulse, a pressure of 74/42, acute confusion and cool pale skin, and a saturation of 96% on air. A pre-event report describes sinus bradycardia at 52 with a QTc of 560 ms. She has a pulse, which is what keeps this out of the arrest algorithm, and she is failing, which is what makes it an emergency anyway. If the pulse goes, the pathway changes immediately.');
  if (patient.shockIntentAtTick === null) return prompt('tdp-shock', true,
    'Shock intent now — unsynchronized, and before anything else you are tempted to do.',
    'Knowing the word torsades pulls hard towards magnesium and the QT, and both are the wrong first move. A sustained polymorphic rhythm with a failing pulse is an electrical problem, and the engine refuses the cause work until this is recorded, because the delay is the harm. Unsynchronized rather than synchronized is the specific point: the complexes vary beat to beat, so the machine has nothing consistent to synchronize to and will sit there refusing to fire while she gets worse. You do not calculate an energy, choose a sedative, operate a defibrillator or deliver anything — you record the intent, the experienced help, the pad and defibrillator readiness, and the plan to repeat.');
  if (patient.postShockAtTick === null) return prompt('tdp-postshock', true,
    'Let time pass, then read what the team\'s shock actually did.',
    'The fixed later report is sinus bradycardia at 52, a pressure of 112/68, alert mentation and warm perfusion. Two things about that are worth saying out loud. The first is that the treating team delivered the shock, not you — nothing in this lesson operates a defibrillator. The second is what the report does not say: her QTc was 560 ms before this started, the rate she has converted to is 52, and a slow rate with a long QT is the exact substrate that produced the arrhythmia. She has been rescued, not fixed, and the recurrence risk is the thing the rest of this lesson exists for.');
  if (patient.contextAtTick === null && patient.recurrenceIntentAtTick === null) return prompt('tdp-parallel', true,
    'The emergency is over. Two lanes are open now, and either can go first.',
    'One is the cause: what made her QT long enough to do this — five contributors, every one of which contributes and none of which is the cause. The other is what stops it happening again in the next hour. The engine accepts them in either order and refuses the handoff until both have landed, which is a fair model of a real unit — somebody is on the phone about the dofetilide while somebody else is drawing up magnesium. What has changed since the opening is that there is now time to think, and that is the only reason these come second.');
  if (patient.contextAtTick === null) return prompt('tdp-context', true,
    'Go looking for what lengthened the QT, and do not settle on one answer.',
    'The fixed pre-event context is a potassium of 3.0, a magnesium of 1.5, reduced kidney function, recent poor intake, and dofetilide — a QT-active drug being cleared by kidneys that are not clearing it well, in a woman who has been eating badly, with a potassium and a magnesium that are both low. Every one of those contributes and none of them is the cause; they are her facts rather than universal thresholds, and the honest record names all of them and picks none. Bradycardia and pauses belong on the list too, which is uncomfortable given the rhythm she has converted to.');
  if (patient.recurrenceIntentAtTick === null) return prompt('tdp-recurrence', true,
    'Record magnesium intent — and be precise about why it is appropriate here and not everywhere.',
    'Magnesium here is bounded to recurrent polymorphic VT with a long QT, which is what she has, and it is not a general antiarrhythmic for a normal QT. That boundary is worth holding because magnesium is easy to reach for and this is one of the few places it is specifically indicated. Alongside it: correcting the authored electrolytes, reviewing the culprit medication with the people who prescribed it, continuous monitoring, and expert involvement. You supply no dose, no target, no infusion, no pacing setting and no capture claim — those belong to the team, and the electrolyte and medication work stays separate from the magnesium rather than folded into it.');
  return prompt('tdp-handoff', true,
    'Hand off a risk that has not gone away, and resist the urge to call this settled.',
    'The later check is still sinus bradycardia at 52 with preserved perfusion and no recurrence so far, and one quiet interval proves nothing about the next one. What gets handed off is the persistent QT risk, the triggers for recurrence and for pulse loss, the electrolyte and medication work still open, the expert contingency, and named owners. What does not get handed off is a promise: no durable freedom from recurrence, no disposition, no prognosis and no outcome. Nothing in this lesson examines her, acquires or interprets a pulse, ECG, monitor, laboratory or imaging result, diagnoses a cause, selects an energy or sedation, operates a defibrillator, delivers a shock, CPR, oxygen, magnesium, an electrolyte, a medication, an infusion, pacing or isoproterenol, assesses capture, chooses a device, determines disposition or prognosis, or predicts recurrence or outcome.');
}
