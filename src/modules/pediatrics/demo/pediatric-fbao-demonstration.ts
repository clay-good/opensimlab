import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPediatricFbao, type PediatricFbaoAction, type PediatricFbaoProgress,
} from '../pediatric-foreign-body-airway-obstruction';

export const PEDIATRIC_FBAO_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPediatricFbaoDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPediatricFbao(scenario);
}

export interface PediatricFbaoDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PediatricFbaoAction; readonly finished?: boolean;
}

/**
 * The worked example for a child going down a ladder.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. It examines nobody, assesses no responsiveness, pulse, airway or
 * cough, acquires and interprets no ECG or test, visualizes, sweeps, suctions
 * or removes no object, performs no back blow, chest or abdominal thrust,
 * ventilation, compression, laryngoscopy or procedure, and determines no
 * disposition or outcome. The restraint at the top of the ladder is as
 * deliberate as the escalation at the bottom.
 */
export function pediatricFbaoDemonstrationStep(
  patient?: PediatricFbaoProgress,
): PediatricFbaoDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'Three minutes, three different right answers, and the grape is still somewhere nobody can see. Nothing was cleared, nothing was declared, and the restraint at the start was as much a decision as the compressions at the end. This ends the example, not the evaluation.' };
  }
  if (patient.reconciledAtTick === null) {
    return { id: 'reconcile', focus: 'monitor', progress: 0.1, action: 'reconcile-pediatric-foreign-body-airway-obstruction-event-cough-and-whole-child',
      narration: 'Listen before you touch him. The sound is the triage. A previously well six-year-old, eating a whole grape, sudden cough, signalling that something is stuck. No object was seen to leave and neither the object nor its location is confirmed. Now read what he is actually doing: he is awake, frightened, following directions, coughing forcefully and loudly with audible airflow, and saying "Something is stuck" in a normal voice between coughs. His saturation is 98% on air and his refill is two seconds. Loud coughing and a normal voice mean air is moving past the obstruction. The absences narrow without closing — no fever or prodrome, no bark, no hoarseness or stridor before this, no drooling, no urticaria or swelling — and retained material, aspiration and an evolving obstruction all stay open.' };
  }
  if (patient.effectiveCoughAtTick === null) {
    return { id: 'effectiveCough', focus: 'actions', progress: 0.28, action: 'preserve-pediatric-foreign-body-airway-obstruction-effective-cough-and-surveillance',
      narration: 'His cough is better than anything you could do. Do not interrupt it. This is the hardest instruction in the lesson because it asks for restraint while a frightened child chokes in front of you. An effective cough generates airway pressures no back blow or thrust reliably improves on, and intervening on a child who is still moving air can convert a partial obstruction into a complete one or drive the object further down. So: no back blows, no chest or abdominal thrusts, and above all no blind finger sweep — that is a way to push a grape past the point where a cough can reach it. What you do instead is stay with him, keep him calm and upright, and watch continuously, because the thing you are watching for is the cough stopping.' };
  }
  if (patient.severeResponsiveAtTick === null) {
    return { id: 'severe', focus: 'monitor', progress: 0.46, action: 'recognize-pediatric-foreign-body-airway-obstruction-severe-responsive-transition',
      narration: 'The sound has gone. That is the transition, and it is the whole reason you were watching. The fixed minute-two report: he still tracks his caregiver, so he is responsive — and he cannot speak, cannot make an audible cough, and his cough attempts are silent. Minimal air movement, perioral cyanosis, a saturation of 91% and falling on a coherent signal, a respiratory rate you cannot count, and a central pulse present. No object has been expelled and none is visible. Silence in a choking child is not improvement; it is the loss of the airflow that was doing the work. Recognizing this is a different situation from the one a minute ago is what changes the answer from restraint to intervention.' };
  }
  if (patient.responsivePathwayAtTick === null) {
    return { id: 'responsive', focus: 'actions', progress: 0.64, action: 'activate-pediatric-foreign-body-airway-obstruction-qualified-responsive-pathway',
      narration: 'Now it is hands on, and the hands are not yours. A responsive child with severe obstruction needs the qualified team\'s choking pathway started immediately — and the maneuvers, their order, their number, the technique and any attempt at visualization all belong to them. You perform no back blow, no chest or abdominal thrust, no sweep, no suction and no laryngoscopy, and you do not assess his cough or his airway yourself. What you record is that the pathway is owned and running, in a child whose saturation was 91% and falling when you last had a number for it.' };
  }
  if (patient.unresponsivePathwayAtTick === null) {
    return { id: 'unresponsive', focus: 'actions', progress: 0.82, action: 'activate-pediatric-foreign-body-airway-obstruction-unresponsive-cpr-pathway',
      narration: 'He has stopped responding. The pathway changes again. The fixed minute-three report: obstruction is not relieved, and he is unresponsive with no purposeful movement, no normal breathing, no effective cough, no speech and no audible airflow. The ECG display reports electrical activity at 132 — and note carefully what you were not given, because it is deliberate: pulse status is not supplied, and there is no blood pressure or saturation. That trace is not a pulse and it does not make this a declared cardiac arrest. What it is, is an unresponsive child who is not breathing normally, which is the trigger for the qualified team\'s CPR and airway-check pathway. Their compressions, their ventilation, their look in the mouth for a visible object — and still no blind sweep from anyone.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.94, action: 'handoff-pediatric-foreign-body-airway-obstruction-active-risk',
    narration: 'Hand off a child still choking on something nobody has seen. What travels is the witnessed event and the whole grape, that no object was ever seen to leave and none was visible at any point, the ladder itself with the times — effective cough, then silent and severe while responsive, then unresponsive — what was deliberately not done at the top of it and why, when each qualified pathway was activated and by whom, that pulse status was never supplied and no arrest was declared, and that clearance, aspiration and airway injury are all still open questions. Nothing here reports the object cleared, proves clearance or a treatment effect, excludes aspiration or airway injury, declares an arrest or a pulse loss, reports a return of circulation, or determines disposition, prognosis or outcome.' };
}
