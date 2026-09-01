import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { NicuHandoffProgress } from '../delivery-room-to-nicu-handoff';

export const NICU_HANDOFF_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for the part of a handoff that gets dropped.
 *
 * What happened is the easy half and it is the half people rehearse. The half
 * that goes missing is everything that did not happen — no compressions, no
 * epinephrine, no access, no fluid, no blood, no alternative airway — and the
 * two results nobody has yet, and the boundary that says the delivery-room team
 * still owns her until an explicit transfer rather than until the NICU accepted
 * her. So these prompts keep asking for the negatives, the pending, and the
 * ownership, and they refuse to read the receiver's check-back as proof of
 * shared understanding: it is evidence that words were repeated. None of them
 * transports, positions, speaks the check-back, or updates the parent, because
 * this lesson reviews a handoff rather than performing one.
 */
export function nicuHandoffInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly nicuHandoff?: NicuHandoffProgress;
}) {
  const patient = input.nicuHandoff;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.supportAtTick === null) return prompt('nicu-handoff-support', true,
    'Name both ends of the transfer, and the person who is not in the room.',
    'Sending, receiving, transport, respiratory, monitoring, documentation, escalation, dignity, reunification — and a recovering parent who has heard that her newborn is breathing and has had no complete update. A handoff with only one named end is a story told to nobody in particular.');
  if (patient.contextAtTick === null) return prompt('nicu-handoff-context', true,
    'Assemble the timeline, including the two results nobody has.',
    'Thirty-four weeks and two days, 2.1 kg, emergency cesarean for a prolonged deceleration, initial apnea at a heart rate of 76, effective ventilation from 50 seconds, heart rate 118 by 2 minutes, spontaneous breathing by 4 — and now CPAP 5 with 30% oxygen, saturation 93%, 36.5°C, with glucose and cord gas still pending. Pending is a fact to hand over, not a gap to apologise for.');
  if (patient.contentAtTick === null) return prompt('nicu-handoff-content', true,
    'Carry the negatives with the same weight as the events.',
    'No compressions, no epinephrine, no access, no fluid, no blood, no alternative airway. Those are the sentences that get dropped and the ones the receiving team needs most, because they set what a deterioration would mean. Patient, assessment, situation, safety concerns, background, actions, timing, ownership, next steps — and response and nonresponse both.');
  if (patient.readinessAtTick === null) return prompt('nicu-handoff-readiness', true,
    'Keep continuity with the sender until someone says the words.',
    'Respiratory, thermal and monitoring continuity, equipment and route readiness, receiver questions, check-back, documentation, deterioration triggers, the parent explanation and the reunification plan. The NICU accepting her is not the transfer; the delivery-room team owns her until an explicit one, and that gap is where continuity is usually lost.');
  if (patient.reassessmentAtTick === null) return prompt('nicu-handoff-observe', false,
    'Let the authored interval pass, then read the check-back and the arrival report.',
    'Ten minutes is a contrast rather than a required wait or a promised trajectory. Nothing here says how a real newborn travels or what the first ten minutes in a real unit look like.');
  return prompt('nicu-handoff-handoff', true,
    'Hand off the risks, and do not count the check-back as agreement.',
    'The receiver repeated it back correctly and arrival looks like departure: heart rate 140, retractions persisting, 94% on the same support, 36.4°C, glucose 52, cord gas still pending. A correct check-back is evidence that words were repeated, not that understanding is shared, and respiratory, thermal, glucose, neurologic, infection, feeding and family risk are all still open.');
}
