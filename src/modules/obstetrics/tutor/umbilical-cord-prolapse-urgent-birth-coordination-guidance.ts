import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { CordProlapseProgress } from '../umbilical-cord-prolapse-urgent-birth-coordination';

export const CORD_PROLAPSE_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for an emergency where everything at the bedside is
 * only a bridge.
 *
 * The elevation, the position and the minimal handling are all holding actions
 * — they buy time and none of them fixes anything, so the only treatment is
 * the birth and the thing that has to be arranged first is a theatre. The
 * error this lesson refuses is treating the bedside measures as the response,
 * because they are comfortable, visible, and they can absorb the minutes that
 * were meant for getting her to an operating room. None of these prompts
 * examines her, handles or replaces the cord, elevates the presenting part,
 * fills a bladder, changes a position, or selects an anesthetic or a mode of
 * birth.
 */
export function cordProlapseInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly cordProlapse?: CordProlapseProgress;
}) {
  const patient = input.cordProlapse;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.supportAtTick === null) return prompt('cord-support', true,
    'Call it, start the clock at the diagnosis, and get a theatre opened now.',
    'The only treatment for a cord prolapse with a compromised fetus is the birth, and the slowest thing to arrange is the room it happens in. So the call goes out before anything else: obstetrics, theatre, anesthesia, the newborn team, a leader, a timekeeper, and someone whose job is to stay with her. She is awake and asking whether her baby is safe, and answering her is part of the response rather than a courtesy added to it.');
  if (patient.contextAtTick === null) return prompt('cord-context', true,
    'Take the supplied examination as the diagnosis and read what it implies.',
    'Membranes ruptured four minutes ago, a prolonged deceleration followed immediately, and a qualified examination found a pulsating cord past the cervix with a high presenting part at 5 cm. The fetal heart is 72. Two of those facts decide everything: the cord is being compressed, and at 5 cm with a high head this baby is not going to be born vaginally in the next few minutes.');
  if (patient.bridgeAtTick === null) return prompt('cord-bridge', true,
    'Treat the bedside measures as a bridge rather than as the treatment.',
    'The elevation of the presenting part, the left lateral head-down position and the minimal handling of the cord are all holding actions that buy time. None of them relieves the compression permanently, no attempt is made to replace the cord above the presenting part, and — this is the part that goes wrong — none of them is a reason to spend another minute at the bedside. They exist to protect the fetus on the way to theatre, not instead of going.');
  if (patient.birthPlanAtTick === null) return prompt('cord-birth-plan', true,
    'Let the urgency be this case rather than a number someone remembers.',
    'The mode, the anesthetic and the timing belong to the qualified team, and the decision-to-birth intervals that get quoted are audit standards rather than a deadline that makes a slower birth safe or a faster one unnecessary. What is true here is that the fetus is compromised now and the cervix is 5 cm. Her safety is not traded for speed, the newborn team is there before the birth rather than after, and someone is recording times as this happens.');
  if (patient.reassessmentAtTick === null) return prompt('cord-reassess', false,
    'Read the fixed report as this case rather than as what cord prolapse does.',
    'It describes persistent compromise and a transfer that has happened. It is a contrast rather than a predicted trajectory, and it says nothing about how any other prolapse behaves.');
  return prompt('cord-handoff', true,
    'Hand off a fetus still compromised and a birth that has not happened.',
    'The compression is still being relieved by hand, the transfer is done and the birth is not, and nothing here establishes fetal recovery, a completed delivery, a treatment effect or an outcome. The fetal status, her own safety and anesthesia, the theatre, the newborn team, what she has just been through and will remember, the contemporaneous record, and the review that follows all travel with them.');
}
