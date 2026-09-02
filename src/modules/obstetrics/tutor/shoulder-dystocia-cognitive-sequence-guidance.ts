import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { ShoulderDystociaProgress } from '../shoulder-dystocia-cognitive-sequence';

export const SHOULDER_DYSTOCIA_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for an emergency whose hardest instruction is to
 * stop doing two things.
 *
 * The head is out and the shoulder will not come. Almost everything that makes
 * this worse is something a person does under pressure: pulling harder,
 * pushing on the fundus, and letting her keep pushing. The traction that
 * failed already was the right amount, and repeating it with more force is how
 * a brachial plexus is injured. The clock starts at the head, not at the
 * recognition, because every later decision is timed from it. None of these
 * prompts examines her, applies traction or pressure, changes a position,
 * directs pushing, or performs a maneuver, episiotomy or delivery.
 */
export function shoulderDystociaInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly shoulderDystocia?: ShoulderDystociaProgress;
}) {
  const patient = input.shoulderDystocia;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.supportAtTick === null) return prompt('dystocia-support', true,
    'Say the word out loud, start the clock at the head, and name who does what.',
    'Calling it a shoulder dystocia is what brings the extra hands, and naming a leader, a timekeeper, the newborn team and someone to stay with her is what keeps the next two minutes organized rather than frantic. The clock runs from the delivery of the head rather than from the moment anyone realized, because every later decision is timed against that. She is awake and frightened and asking what is happening, so someone talking to her is part of the response.');
  if (patient.contextAtTick === null) return prompt('dystocia-context', true,
    'Take the birth facts as given rather than re-testing them.',
    'The head delivered twenty seconds ago, it has retracted against the perineum, and the anterior shoulder did not come with routine gentle axial traction. That failed attempt is the diagnosis and does not need repeating. Her own numbers are unremarkable, which is what makes the risk here almost entirely about what happens in the next few minutes rather than about how she is now. The prenatal size estimates are deliberately not in play: they neither predicted this nor rule it out.');
  if (patient.safetyAtTick === null) return prompt('dystocia-safety', true,
    'The first two instructions are things to stop, not things to do.',
    'Stop the pushing and keep any pressure off the fundus. Fundal pressure drives the shoulder harder into the pubic bone and is associated with both maternal and newborn injury, and continued pushing does the same. The traction that already failed was the right amount — repeating it harder is the specific mechanism by which a brachial plexus is stretched. What is left as a first move is the position change, which costs nothing and works often.');
  if (patient.escalationAtTick === null) return prompt('dystocia-escalation', true,
    'Hold the sequence as a menu rather than a script.',
    'The qualified maneuvers are ordered by convenience and reversibility rather than by evidence that one must precede another, and moving on quickly matters more than completing anyone’s preferred list. An episiotomy makes room for hands rather than for the shoulder — the obstruction is bone, and cutting soft tissue does not move bone. The rare rescue options exist and belong to the people qualified to do them. Somebody is writing down times while this happens, because that record is the only version of these two minutes that will survive.');
  if (patient.reassessmentAtTick === null) return prompt('dystocia-reassess', false,
    'Read the fixed report as this case rather than as the method.',
    'It describes what a qualified team did here and what happened. It is not a universal sequence, and it says nothing about how any other shoulder dystocia resolves.');
  return prompt('dystocia-handoff', true,
    'Hand off a birth that happened and two people nobody has examined.',
    'The baby is out; that establishes no injury status for either of them. Maternal perineal and other trauma, postpartum hemorrhage risk that this raises specifically, the newborn’s neurologic and musculoskeletal examination, the debrief she is owed and will remember, the contemporaneous record, and the review that follows all travel with them.');
}
