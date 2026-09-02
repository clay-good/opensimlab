import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { MaternalArrestProgress } from '../maternal-cardiac-arrest-coordinated-response';

export const MATERNAL_ARREST_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for an arrest where the resuscitation is already
 * someone else's job.
 *
 * Compressions have started, the pulse check is done, and the monitor is
 * showing organized electrical activity without circulation. What is left for
 * this learner is everything a pregnancy adds to a standard resuscitation: the
 * clock, the displacement, the airway priority, the reversible causes that
 * belong to pregnancy specifically, and a delivery decision that is made in
 * the room rather than by moving her. None of these prompts checks a pulse,
 * performs compressions or uterine displacement, reads the rhythm, or selects
 * an airway, drug, shock, delivery or procedure.
 */
export function maternalArrestInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly maternalArrest?: MaternalArrestProgress;
}) {
  const patient = input.maternalArrest;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.supportAtTick === null) return prompt('arrest-support', true,
    'Start the prepared response and the clock before you look at anything.',
    'The resuscitation is already running — someone is compressing on a firm surface and calling for help — so what this activation adds is everything a pregnancy adds: obstetric and anesthesia ownership, in-place delivery readiness, newborn care, hemorrhage readiness, communication, dignity, and support for the family and the staff. The clock matters because the delivery decision in a maternal arrest is timed from the arrest rather than from anyone arriving.');
  if (patient.contextAtTick === null) return prompt('arrest-context', true,
    'Take the arrest facts as given and add the one that changes the response.',
    'Thirty seconds ago she became unresponsive at 32 weeks and 4 days. Qualified staff report no normal breathing and no central pulse on a simultaneous ten-second check, with organized narrow-complex activity at 48 on the monitor and no mechanical circulation. None of that needs rechecking. The fact that changes what happens next is the fundal height above the umbilicus, because a uterus that size compresses the vena cava and limits what compressions can return.');
  if (patient.modificationsAtTick === null) return prompt('arrest-modifications', true,
    'Review what pregnancy adds without letting it interrupt the resuscitation.',
    'Continuous manual displacement of the uterus to the patient’s left, hands in the standard position rather than higher, the same defibrillation energy as anyone else, and an airway managed early because pregnancy makes both hypoxemia and difficult intubation more likely. These are additions to a standard resuscitation rather than a different one, and none of them is a reason to pause compressions.');
  if (patient.readinessAtTick === null) return prompt('arrest-readiness', true,
    'Get the delivery and the newborn ready here, in this room.',
    'If resuscitation has not restored circulation, delivery is part of the maternal resuscitation rather than a separate obstetric decision, and it happens where she is — moving an arrested patient to an operating room costs the minutes that make it worth doing. The causes stay open in parallel: hemorrhage, embolism, anesthetic complication, cardiac disease, sepsis, magnesium, hypoxia and everything on the general list. The newborn team and the hemorrhage response both need to be standing there before anyone needs them.');
  if (patient.reassessmentAtTick === null) return prompt('arrest-reassess', false,
    'Read the fixed minute-4 report as a checkpoint rather than a verdict.',
    'It is a contrast rather than a required wait or a predicted response time. Nothing here says how any individual arrest behaves next.');
  return prompt('arrest-handoff', true,
    'Hand off an arrest that is still happening.',
    'Resuscitation is still active, circulation has not returned, and nothing here establishes a completed delivery, a restored circulation, a newborn condition, a cause, a treatment effect or a decision to stop. The active arrest, the open causes, the procedures, the hemorrhage risk, the newborn, her family, the staff who have been in this room, and the disposition all travel with her.');
}
