import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPediatricBradycardicArrest, type PediatricBradycardicArrestAction,
  type PediatricBradycardicArrestProgress,
} from '../pediatric-bradycardic-arrest';

export const PEDIATRIC_BRADYCARDIC_ARREST_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPediatricBradycardicArrestDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPediatricBradycardicArrest(scenario);
}

export interface PediatricBradycardicArrestDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PediatricBradycardicArrestAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a child whose heart did not follow her oxygen.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. The steps are a strict line, so this example has only one order
 * available to it, and it ends inside an ongoing resuscitation because that is
 * where the lesson ends. It examines and palpates nobody, assesses no pulse,
 * airway, ventilation, monitor, capnogram or CPR quality, acquires and
 * interprets no rhythm or test, diagnoses and assigns no cause, delivers no
 * oxygen, ventilation, compression, access, drug, dose, pacing or shock, and
 * determines no termination, disposition, prognosis or outcome.
 */
export function pediatricBradycardicArrestDemonstrationStep(
  patient?: PediatricBradycardicArrestProgress,
): PediatricBradycardicArrestDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'Compressions are running, the rhythm on the screen is not a pulse, and nobody knows yet why any of this started. This example stops here because the resuscitation does not. Nothing was concluded, and that is the accurate ending rather than a comfortable one. This ends the example, not the evaluation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.1, action: 'reconcile-pediatric-bradycardic-arrest-support-and-trajectory',
      narration: 'The breathing has already been fixed. Read what that did not fix. A previously well six-year-old, hours of worsening breathing and fatigue from a cause nobody has established, now unresponsive with no effective spontaneous breathing. The supplied support report is unusually complete and that is the point of it: a patent airway, assisted positive-pressure ventilation with oxygen, equal bilateral chest rise, a continuous capnogram reading 36, and a saturation that has come up from 79% to 95%. The ventilation is working. And her rhythm is still sinus bradycardia at 52 with a MAP of 45, pale cool mottled skin, a refill of five seconds, a weak central pulse and no peripheral pulse. In a child, that sequence is the important one: you fixed the oxygen and the heart did not follow.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'monitor', progress: 0.28, action: 'recognize-pediatric-bradycardia-with-persistent-compromise',
      narration: 'Under 60 with compromise, despite effective ventilation. That is the threshold. This is the number that has to be said out loud, because the whole decision hangs on it: a heart rate below 60 with persistent cardiopulmonary compromise in a child who is already being ventilated effectively with oxygen. The qualifier matters — bradycardia that responds to oxygen and ventilation is a different situation, and this one has not. She still has a pulse, and that is not a reason to wait. Nothing here is excluded: hypoxia, airway or lung disease, toxins, metabolic or neurological disease and heart block all stay open, and no trauma, choking, wheeze, stridor, urticaria, known cardiac disease or known exposure is authored. You have diagnosed nothing and assigned no cause.' };
  }
  if (patient.resuscitationAtTick === null) {
    return { id: 'resuscitation', focus: 'actions', progress: 0.46, action: 'activate-pediatric-bradycardic-arrest-qualified-resuscitation-ownership',
      narration: 'Do not wait for the pulse to go. That is the single sentence this lesson exists for. Waiting until a pulse disappears before beginning compressions in a bradycardic child with this perfusion is a delay with no upside, and the deterioration ahead of you is the reason. Activating ownership means qualified pediatric resuscitation teams take compressions, the airway and ventilation already running, the access, the drugs and everything about them, and the cause-directed work. You deliver no compression, no drug, no dose, no access, no pacing and no shock — but you record, now, that the people who do are running a resuscitation rather than watching a rate.' };
  }
  if (patient.safetyAtTick === null) {
    return { id: 'safety', focus: 'actions', progress: 0.64, action: 'review-pediatric-bradycardic-arrest-causes-pulse-and-arrest-boundary',
      narration: 'Resuscitation is owned. Now watch the pulse and name the arrest boundary. What continues in parallel: the evidence that the ventilation is still effective rather than assumed, the pulse and perfusion under continuous surveillance, the open causes — hypoxia first, but also lung disease, toxins, metabolic and neurological disease and heart block — and the boundary at which this stops being bradycardia with a pulse and becomes an arrest. Defining that boundary before you cross it is the only reason anyone notices the crossing at the moment it happens rather than several minutes afterwards.' };
  }
  if (patient.laterResponseAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.8, action: 'review-pediatric-bradycardic-arrest-pulse-loss-response',
      narration: 'Let time pass. This is the one checkpoint in this module that gets worse. The fixed later report: organized electrical activity persists at 46 a minute, and there is no pulse, no obtainable blood pressure and a nonpulsatile pleth. She is still unresponsive and still being ventilated by the qualified team. That is pulseless electrical activity — an arrest — and not persistent bradycardia with a pulse. Two things follow. A rhythm on a monitor is not circulation, and reading that trace as a heartbeat is how PEA gets missed. And this is a nonshockable rhythm: the pathway does not change to defibrillation because a complex is visible. Nobody has reported a return of circulation, a cause, or an outcome, because none has happened.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-pediatric-bradycardic-arrest-active-risk',
    narration: 'Hand off a resuscitation that is still running. What travels is the hours of preceding illness with the cause unestablished, the ventilation support and the evidence it was effective, the bradycardia below 60 with compromise that persisted through it, when resuscitation ownership began and that it began before pulse loss, the transition to PEA with the time it was recognized, the nonshockable pathway and why it stays nonshockable, the reversible causes still being worked through, and who owns each part. There is no return of circulation to report, no cause proven, no prognosis, no outcome, and nothing here declares death or terminates anything. The next team is continuing this, not concluding it.' };
}
