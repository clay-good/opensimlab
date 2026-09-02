import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { MaternalNeonatalHandoffProgress } from '../maternal-to-neonatal-resuscitation-handoff';

export const MATERNAL_NEONATAL_HANDOFF_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for two patients in one room.
 *
 * A mother is still on the table and a newborn is being ventilated a few feet
 * away, and the failure this lesson refuses is the quiet one: nobody says out
 * loud who owns which patient, and one of them stops being watched while
 * everyone looks at the other. The rising heart rate is the second refusal —
 * it is evidence that the ventilation is working, which is not the same as a
 * newborn who is stable, and the thing that made it rise is also the thing
 * that will stop if the handoff is sloppy. None of these prompts examines
 * anyone, resuscitates the newborn, delivers ventilation, or counsels the
 * family.
 */
export function maternalNeonatalHandoffInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly maternalNeonatalHandoff?: MaternalNeonatalHandoffProgress;
}) {
  const patient = input.maternalNeonatalHandoff;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.supportAtTick === null) return prompt('neonatal-handoff-support', true,
    'Say out loud who owns the mother and who owns the newborn.',
    'Two patients in one room with overlapping teams is exactly where someone stops being watched, and the way that happens is never a decision — it is an assumption that the other team has it. Separate named ownership for her and for the newborn, someone owning the communication, and someone whose job is the family. She is awake and asking whether her baby is breathing, and answering her belongs to a named person rather than to whoever is nearest.');
  if (patient.contextAtTick === null) return prompt('neonatal-handoff-context', true,
    'Put both clocks and the whole family in one view.',
    'Thirty-nine weeks, an urgent caesarean for persistent fetal bradycardia, birth at 14:07, a newborn apneic with a heart rate of 70 after initial steps, assisted ventilation begun inside the first minute, and now chest movement and a rate of 118. Her surgery is still going on. No fever, no meconium, no known anomaly is supplied — and the placental findings and cord gases that might explain any of this do not exist yet.');
  if (patient.safetyAtTick === null) return prompt('neonatal-handoff-safety', true,
    'Read the rising heart rate as ventilation working, not as a newborn who is well.',
    'A heart rate that climbs from 70 to 118 with visible chest movement is the supplied evidence that effective ventilation is being delivered — which is the single most important thing in newborn resuscitation and also the narrowest claim available. It does not establish a completed transition, a safe respiratory trajectory, a normal neurologic state, a glucose, or a temperature. Whatever is producing that number is being produced continuously, by someone, right now.');
  if (patient.transferAtTick === null) return prompt('neonatal-handoff-transfer', true,
    'Hand over in a structure, and make the receiver say it back.',
    'Identity, the clocks, the trajectory that got here, what was actually done, how the newborn responded, what remains unresolved, and who owns what next — in that order, once, without interruption. The readback is not a formality: it is the only point at which a mistaken assumption becomes visible while it can still be corrected. Contingency readiness and the family conversation belong to the same moment rather than afterwards.');
  if (patient.reassessmentAtTick === null) return prompt('neonatal-handoff-reassess', false,
    'Read the fixed 5-minute report as this course rather than a trajectory.',
    'It is a contrast rather than a prediction, and it says nothing about how any other newborn behaves after a resuscitation like this one.');
  return prompt('neonatal-handoff-handoff', true,
    'Hand off two patients, neither of whom is finished.',
    'Nothing here establishes newborn stability, maternal recovery, a placental cause, or any outcome. The newborn’s respiratory trajectory, glucose, temperature and neurologic state, her own recovery from surgery and anesthesia, the placental findings and cord gases still to come, what the family have been told and by whom, the record, and the follow-up all travel with them.');
}
