import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { PediatricFbaoProgress } from '../pediatric-foreign-body-airway-obstruction';

export const PEDIATRIC_FBAO_TUTOR_VERSION = '0.1.0';

export interface PediatricFbaoPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * There is no wrong turn to answer, because this engine case authors none.
 * This lesson walks down a ladder — effective cough, then severe and
 * responsive, then unresponsive — and each rung has a different correct
 * answer, which is the point. The first answer is to do nothing to him, and
 * that is the hardest one to hold. It is silent on the unassisted setting,
 * silent once the handoff is recorded, and silent for any scenario version it
 * was not written against.
 */
export function pediatricFbaoInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: PediatricFbaoProgress },
): PediatricFbaoPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.reconciledAtTick === null) return prompt('pfb-reconcile', true,
    'Listen before you touch him. The sound is the triage.',
    'A previously well six-year-old, eating a whole grape, sudden cough, signalling that something is stuck. No object was seen to leave and neither the object nor its location is confirmed. Now read what he is actually doing: he is awake, frightened, following directions, coughing forcefully and loudly with audible airflow, and saying "Something is stuck" in a normal voice between coughs. His saturation is 98% on air and his refill is two seconds. Loud coughing and a normal voice mean air is moving past the obstruction. The absences narrow without closing — no fever or prodrome, no bark, no hoarseness or stridor before this, no drooling, no urticaria or swelling — and retained material, aspiration and an evolving obstruction all stay open.');
  if (patient.effectiveCoughAtTick === null) return prompt('pfb-effective-cough', true,
    'His cough is better than anything you could do. Do not interrupt it.',
    'This is the hardest instruction in the lesson because it asks for restraint while a frightened child chokes in front of you. An effective cough generates airway pressures no back blow or thrust reliably improves on, and intervening on a child who is still moving air can convert a partial obstruction into a complete one or drive the object further down. So: no back blows, no chest or abdominal thrusts, and above all no blind finger sweep — that is a way to push a grape past the point where a cough can reach it. What you do instead is stay with him, keep him calm and upright, and watch continuously, because the thing you are watching for is the cough stopping.');
  if (patient.severeResponsiveAtTick === null) return prompt('pfb-severe', true,
    'The sound has gone. That is the transition, and it is the whole reason you were watching.',
    'The fixed minute-two report: he still tracks his caregiver, so he is responsive — and he cannot speak, cannot make an audible cough, and his cough attempts are silent. Minimal air movement, perioral cyanosis, a saturation of 91% and falling on a coherent signal, a respiratory rate you cannot count, and a central pulse present. No object has been expelled and none is visible. Silence in a choking child is not improvement; it is the loss of the airflow that was doing the work. Recognizing this is a different situation from the one a minute ago is what changes the answer from restraint to intervention.');
  if (patient.responsivePathwayAtTick === null) return prompt('pfb-responsive', true,
    'Now it is hands on, and the hands are not yours.',
    'A responsive child with severe obstruction needs the qualified team\'s choking pathway started immediately — and the maneuvers, their order, their number, the technique and any attempt at visualization all belong to them. You perform no back blow, no chest or abdominal thrust, no sweep, no suction and no laryngoscopy, and you do not assess his cough or his airway yourself. What you record is that the pathway is owned and running, in a child whose saturation was 91% and falling when you last had a number for it.');
  if (patient.unresponsivePathwayAtTick === null) return prompt('pfb-unresponsive', true,
    'He has stopped responding. The pathway changes again.',
    'The fixed minute-three report: obstruction is not relieved, and he is unresponsive with no purposeful movement, no normal breathing, no effective cough, no speech and no audible airflow. The ECG display reports electrical activity at 132 — and note carefully what you were not given, because it is deliberate: pulse status is not supplied, and there is no blood pressure or saturation. That trace is not a pulse and it does not make this a declared cardiac arrest. What it is, is an unresponsive child who is not breathing normally, which is the trigger for the qualified team\'s CPR and airway-check pathway. Their compressions, their ventilation, their look in the mouth for a visible object — and still no blind sweep from anyone.');
  return prompt('pfb-handoff', true,
    'Hand off a child still choking on something nobody has seen.',
    'What travels is the witnessed event and the whole grape, that no object was ever seen to leave and none was visible at any point, the ladder itself with the times — effective cough, then silent and severe while responsive, then unresponsive — what was deliberately not done at the top of it and why, when each qualified pathway was activated and by whom, that pulse status was never supplied and no arrest was declared, and that clearance, aspiration and airway injury are all still open questions. Nothing here reports the object cleared, proves clearance or a treatment effect, excludes aspiration or airway injury, declares an arrest or a pulse loss, reports a return of circulation, or determines disposition, prognosis or outcome.');
}
