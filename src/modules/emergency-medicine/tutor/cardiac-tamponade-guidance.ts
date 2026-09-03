import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { CardiacTamponadeProgress } from '../cardiac-tamponade';

export const CARDIAC_TAMPONADE_TUTOR_VERSION = '0.1.0';

export interface CardiacTamponadePrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is the one every other lesson quietly rewards:
 * that recording the right action is what makes the patient better. Here it is
 * not. The engine keeps the obstructive physiology running after the accepted
 * intent and says so at the reassessment, because what this diagnosis needs is
 * a surgeon in a room somewhere else, and the only thing a screen can do about
 * it is start the clock on getting there.
 *
 * It is silent on the unassisted setting, silent once the reassessment is
 * recorded, and silent for any scenario version it was not written against.
 */
export function cardiacTamponadeInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: CardiacTamponadeProgress },
): CardiacTamponadePrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.reassessedAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.contextReviewedAtTick === null) return prompt('tam-context', true,
    'Put the mechanism next to the perfusion before you reach for anything.',
    'Penetrating central-chest trauma, tachycardia, a pulse pressure that is narrowing rather than a number that is simply low, cool skin, inattention, and a falling end-tidal carbon dioxide — with air entry present on both sides. That last detail is doing real work: it is what makes this obstruction inside the pericardium rather than a tension pneumothorax, and those two are the pair this pattern most often gets sorted into. The narrowing pulse pressure and the falling end-tidal are both telling you about stroke volume, which is the thing an obstructed ventricle cannot produce. This review records what has been observed; the pattern demands immediate cause-directed action and is not diagnostic proof.');

  if (patient.pocusReviewedAtTick === null) return prompt('tam-pocus', true,
    'Now the one focused finding — and notice it comes second, not first.',
    'Pericardial fluid with right-sided chamber collapse, in a patient who is already unstable. The order matters more than it looks: the same picture in a stable patient after blunt trauma means something different, and an effusion is only tamponade when the circulation says it is. Reading the screen before reading the patient is how a finding gets promoted into a diagnosis it has not earned. This is a fixed statement — the vignette does not acquire the images, teach the views, model a bad window, or offer you the alternatives that a real scan would have to exclude.');

  if (patient.definitiveControlAtTick === null) return prompt('tam-control', true,
    'Record the escalation. What you are starting is a journey, not a treatment.',
    'Immediate trauma, surgical, and resuscitation-team mobilisation for definitive control. There is no procedure on this screen and that absence is deliberate: in penetrating traumatic tamponade the clot in the pericardium is generally not something a needle empties, so pericardiocentesis is at best a bridge and at worst the reason nobody moved for four minutes. The definitive answer is an operation, which means the useful thing a clinician standing here can do is compress the interval before it starts. Fluid and pressors get argued about and neither relieves an obstruction. Procedure selection, technique, equipment, transport, technical success, and complications are all outside this vignette.');

  return prompt('tam-reassess', true,
    'Look again, and expect it to be no better. That is the point of looking.',
    'The monitor after an accepted intent is still compatible with unresolved obstructive shock, because nothing has been relieved — a team was mobilised, and this vignette simulates no procedure, no response, and no technical success. That is worth sitting with, because every habit built on a simulator pushes the other way: you do the right thing, the numbers move, you feel finished. Here the right thing was recorded and the physiology is unchanged, which is exactly what the first minutes of this diagnosis look like in a real department. The reassessment is gated behind a further engine tick so there is something to compare against. Continued deterioration needs live definitive care; arrest, outcome, and the operation itself remain outside this vignette.');
}
