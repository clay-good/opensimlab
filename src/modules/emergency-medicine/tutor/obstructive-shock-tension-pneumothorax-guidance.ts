import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import {
  OBSTRUCTIVE_PLEURAL_SHOCK_WINDOWS as WINDOWS,
  type ObstructivePleuralShockProgress,
} from '../obstructive-shock-tension-pneumothorax';

export const OBSTRUCTIVE_PLEURAL_SHOCK_TUTOR_VERSION = '0.1.0';

export interface ObstructivePleuralShockPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * Every other lesson in this module is scored on order: do this before that.
 * This one is scored on a clock. The debrief credits the assessment and the
 * help request at thirty seconds from the modelled event, the oxygen inside a
 * minute, and the decompression at a minute — so the reflex it works against is
 * not doing the wrong thing but doing the right thing at a comfortable pace.
 *
 * It is silent on the unassisted setting, silent once the chest is
 * decompressed, and silent for any scenario version it was not written against.
 */
export function obstructivePleuralShockInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: ObstructivePleuralShockProgress },
): ObstructivePleuralShockPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.decompressedAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.assessedAtTick === null) return prompt('pleural-assess', true,
    'Listen to both sides. You are about to be timed from the moment this started.',
    `Penetrating left-chest trauma with distress, hypoxia and severe hypotension worsening together. The one examination finding that matters here is a comparison: left air entry and chest movement markedly reduced while the right side is present. That asymmetry, in this context, is the whole diagnosis — nothing on this screen images anything, and nothing needs to. Be aware of what this lesson measures, because it is unusual: the debrief credits this assessment at ${WINDOWS.assessmentSeconds} seconds from the modelled event and only partly at ${WINDOWS.assessmentSeconds * 2}. Every other lab in this module asks whether you did things in the right order; this one asks how long you took.`);

  if (patient.helpRequestedAtTick === null) return prompt('pleural-help', true,
    'Call for help now, in parallel — not after you have finished deciding.',
    `A pleural-crisis help request, credited at ${WINDOWS.helpSeconds} seconds like the assessment, which tells you it is meant to be happening at the same time rather than next. This is a person who needs a procedure, and the interval that matters is between the event and the needle rather than between your thoughts. Nothing about calling commits you to a diagnosis, and a request you can stand down costs nothing. Team arrival and performance are not simulated.`);

  if (!patient.highConcentrationOxygen) return prompt('pleural-oxygen', true,
    'High-concentration oxygen while the rest proceeds. Do not wait to be sure.',
    `Inspired oxygen of 1.0 by mask, credited inside ${WINDOWS.oxygenSeconds} seconds. This is one of the places where the reflex ceiling does not apply: there is no chronic carbon-dioxide question in a young trauma patient, the shunt is mechanical, and the cost of being generous for the next few minutes is nothing against the cost of being careful. It also will not fix this — oxygen does not re-expand a lung or unkink a vena cava, so treat it as the thing you do on the way past rather than an intervention that buys you time to think. Device, flow and the concentration actually delivered are not simulated.`);

  return prompt('pleural-decompress', true,
    'Decompress the left chest now, without imaging and without waiting.',
    `The decompression intent is credited at ${WINDOWS.decompressionSeconds} seconds and only partly at ${WINDOWS.decompressionSeconds * 2}, and the reason those numbers are so short is mechanical: the obstruction is a pressure that keeps rising, so this is one of very few diagnoses where the treatment reliably precedes the confirmation. A chest radiograph in a patient this unstable is a request to spend the minute that mattered, and a scan that comes back convincing does not undo it. If you are wrong about the side or about the diagnosis, the cost is a chest drain in someone who needed one less than you thought; if you are right and slow, the cost is the arrest. Technique, site, equipment, later drainage and complications are not simulated — this records the decision, not the procedure.`);
}
