import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { PediatricBradycardicArrestProgress } from '../pediatric-bradycardic-arrest';

export const PEDIATRIC_BRADYCARDIC_ARREST_TUTOR_VERSION = '0.1.0';

export interface PediatricBradycardicArrestPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * There is no wrong turn to answer, because this engine case authors none.
 * This is the gravest lesson in the module and the only one whose later
 * checkpoint is worse than the earlier one. Two things it will not let a
 * learner do: wait for the pulse to go before starting compressions, and treat
 * organized electrical activity as circulation. It is silent on the
 * unassisted setting, silent once the handoff is recorded, and silent for any
 * scenario version it was not written against.
 */
export function pediatricBradycardicArrestInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: PediatricBradycardicArrestProgress },
): PediatricBradycardicArrestPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('pba-trajectory', true,
    'The breathing has already been fixed. Read what that did not fix.',
    'A previously well six-year-old, hours of worsening breathing and fatigue from a cause nobody has established, now unresponsive with no effective spontaneous breathing. The supplied support report is unusually complete and that is the point of it: a patent airway, assisted positive-pressure ventilation with oxygen, equal bilateral chest rise, a continuous capnogram reading 36, and a saturation that has come up from 79% to 95%. The ventilation is working. And her rhythm is still sinus bradycardia at 52 with a MAP of 45, pale cool mottled skin, a refill of five seconds, a weak central pulse and no peripheral pulse. In a child, that sequence is the important one: you fixed the oxygen and the heart did not follow.');
  if (patient.recognitionAtTick === null) return prompt('pba-recognition', true,
    'Under 60 with compromise, despite effective ventilation. That is the threshold.',
    'This is the number that has to be said out loud, because the whole decision hangs on it: a heart rate below 60 with persistent cardiopulmonary compromise in a child who is already being ventilated effectively with oxygen. The qualifier matters — bradycardia that responds to oxygen and ventilation is a different situation, and this one has not. She still has a pulse, and that is not a reason to wait. Nothing here is excluded: hypoxia, airway or lung disease, toxins, metabolic or neurological disease and heart block all stay open, and no trauma, choking, wheeze, stridor, urticaria, known cardiac disease or known exposure is authored. You have diagnosed nothing and assigned no cause.');
  if (patient.resuscitationAtTick === null) return prompt('pba-resuscitation', true,
    'Do not wait for the pulse to go.',
    'That is the single sentence this lesson exists for. Waiting until a pulse disappears before beginning compressions in a bradycardic child with this perfusion is a delay with no upside, and the deterioration ahead of you is the reason. Activating ownership means qualified pediatric resuscitation teams take compressions, the airway and ventilation already running, the access, the drugs and everything about them, and the cause-directed work. You deliver no compression, no drug, no dose, no access, no pacing and no shock — but you record, now, that the people who do are running a resuscitation rather than watching a rate.');
  if (patient.safetyAtTick === null) return prompt('pba-safety', true,
    'Resuscitation is owned. Now watch the pulse and name the arrest boundary.',
    'What continues in parallel: the evidence that the ventilation is still effective rather than assumed, the pulse and perfusion under continuous surveillance, the open causes — hypoxia first, but also lung disease, toxins, metabolic and neurological disease and heart block — and the boundary at which this stops being bradycardia with a pulse and becomes an arrest. Defining that boundary before you cross it is the only reason anyone notices the crossing at the moment it happens rather than several minutes afterwards.');
  if (patient.laterResponseAtTick === null) return prompt('pba-later', true,
    'Let time pass. This is the one checkpoint in this module that gets worse.',
    'The fixed later report: organized electrical activity persists at 46 a minute, and there is no pulse, no obtainable blood pressure and a nonpulsatile pleth. She is still unresponsive and still being ventilated by the qualified team. That is pulseless electrical activity — an arrest — and not persistent bradycardia with a pulse. Two things follow. A rhythm on a monitor is not circulation, and reading that trace as a heartbeat is how PEA gets missed. And this is a nonshockable rhythm: the pathway does not change to defibrillation because a complex is visible. Nobody has reported a return of circulation, a cause, or an outcome, because none has happened.');
  return prompt('pba-handoff', true,
    'Hand off a resuscitation that is still running.',
    'What travels is the hours of preceding illness with the cause unestablished, the ventilation support and the evidence it was effective, the bradycardia below 60 with compromise that persisted through it, when resuscitation ownership began and that it began before pulse loss, the transition to PEA with the time it was recognized, the nonshockable pathway and why it stays nonshockable, the reversible causes still being worked through, and who owns each part. There is no return of circulation to report, no cause proven, no prognosis, no outcome, and nothing here declares death or terminates anything. The next team is continuing this, not concluding it.');
}
