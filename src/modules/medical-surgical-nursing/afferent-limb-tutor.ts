import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { AfferentLimbSnapshot } from '@platform/kernel/protocol';

export const AFFERENT_LIMB_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link
 * built from a citation is a guess rather than a lookup. The tray already sends
 * a reader to the source view, which shows the declared citations in full.
 */

/**
 * Observed-state guidance for a threshold met and a call not made.
 *
 * The reasons not to call are good ones. The team attended yesterday and found
 * nothing, they are busy, and the last conversation was uncomfortable. A tutor
 * that dismissed them would be arguing with the thing that actually stops
 * people, so these prompts ask for the obstacles to be written down instead —
 * naming them is how they stop operating silently. They also never soften the
 * call into asking permission, because the criteria are the authorisation, and
 * they never offer closer observation as a substitute for it.
 */
export function afferentLimbInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly afferentLimb?: AfferentLimbSnapshot;
}) {
  const patient = input.afferentLimb;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.criteriaRecordedAtTick === null) return prompt('afferent-limb-criteria', true,
    'Write down which criteria are met, as they stand.',
    `${patient.metCriteriaCount} of ${patient.totalCriteriaCount} are met against a policy threshold of ${patient.policyThreshold}. Recorded, that is a fact somebody else can check; unrecorded, it is a judgement you are making alone.`);
  if (patient.obstaclesRecordedAtTick === null) return prompt('afferent-limb-obstacles', true,
    'Write down the reasons not to call, plainly.',
    'They are real: the team came yesterday and found nothing, they are busy, and the last conversation was uncomfortable. Naming them is how they stop working on you silently, and it is not the same as agreeing with them.');
  if (patient.calledAtTick === null) return prompt('afferent-limb-call', true,
    'Call the response team on the criteria.',
    'Not the covering doctor first, and not after permission. The criteria are the authorisation, and a threshold that needs someone senior to agree before it can be used is not a threshold.');
  if (patient.concernStatedAtTick === null) return prompt('afferent-limb-state', true,
    'Say the concern out loud, to the person who answered.',
    'Which criteria are met, what has changed since yesterday, and what you are asking for. A concern written in the notes has not been stated to anybody.');
  if (patient.boundariesReviewedAtTick === null) return prompt('afferent-limb-boundaries', true,
    'Review what the afferent limb is and how it fails.',
    'The call never made or made late appears in roughly a fifth to a third of reviewed adverse events, and calling the doctor instead of the team is the documented substitution rather than a safer route.');
  if (patient.monitoringAtTick === null) return prompt('afferent-limb-monitor', true,
    'Increase the observation, and record why it was increased.',
    'It is not an alternative to the call. A patient watched more closely while nobody comes is still a patient nobody has come to.');
  if (!patient.teamArrived) return prompt('afferent-limb-await', false,
    'Keep the increased observation going while the team is awaited.',
    'This authored interval predicts no real response time. The call has been made and the criteria are unchanged; nothing here needs to be re-justified while you wait.');
  if (!patient.arrivalObserved) return prompt('afferent-limb-reassess', true,
    'Take a current full assessment now the team is here.',
    'They need the picture as it is now, alongside the criteria as recorded and the reasons the call nearly did not happen.');
  return prompt('afferent-limb-handoff', false,
    'Hand off the criteria, the call, and the obstacles together.',
    'A resolved patient and a vindicated call are not handoff gates. What travels is which criteria were met, that the call was made on them, and what nearly stopped it.');
}
