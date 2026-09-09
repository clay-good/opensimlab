import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { QuietChestSnapshot } from '@platform/kernel/protocol';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link built from a
 * citation is a guess rather than a lookup. The tray already sends a reader to the source view.
 */

/**
 * Observed-state guidance for an injury whose severity is not visible yet.
 *
 * The prompts never say she will develop a complication, because nothing in the lesson can
 * establish that and saying it would remove the difficulty: the learner has to defend keeping
 * a comfortable patient who wants to go home, on the strength of a count and an age.
 */
export function quietChestInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly quietChest?: QuietChestSnapshot;
}) {
  const patient = input.quietChest;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.injuryRecordedAtTick === null) return prompt('quiet-chest-injury', true,
    'Write the count down with her age next to it.',
    `${patient.fracturedRibs} ribs, ${patient.hoursSinceFall} hours ago, 81 years old, mild chronic lung disease, nobody at home. Those facts only mean something together, and separated across a record they mean almost nothing.`);
  if (patient.comfortLimitsRecordedAtTick === null) return prompt('quiet-chest-comfort', true,
    'Record what "comfortable" is currently measuring.',
    'She is comfortable lying still. Nobody has asked her to take a full breath, to cough, or to walk to a bathroom at three in the morning. The chart reports on the work she is doing, and she is doing none.');
  if (patient.countRecordedAtTick === null) return prompt('quiet-chest-count', true,
    'Record what the count and the age predict.',
    'Same mean fracture count, same mean injury severity, and pneumonia 31 percent against 17, mortality 22 against 10. The number of ribs is most of what anybody knows about her next three days.');
  if (patient.escalationAtTick === null) return prompt('quiet-chest-escalate', true,
    'Ask for a bed and a plan, sized to the right interval.',
    'Not for tonight. For the second and third day, which is where the risk actually lives and where nobody will be looking if she goes home this evening.');
  if (patient.admissionIntentAtTick === null) return prompt('quiet-chest-intent', true,
    'Record bounded intent and choose nothing.',
    'The analgesia plan and its route, the observation interval, any respiratory input, and when she goes home are theirs. Writing down that those decisions exist is not making them.');
  if (patient.boundariesReviewedAtTick === null) return prompt('quiet-chest-boundaries', true,
    'Review a real risk with no proven remedy attached.',
    'Two retrospective cohorts agree that this kills older people. Six randomised trials of the intervention everyone reaches for, 223 patients, all at high risk of bias, show nothing. You are arguing for observation, not for a treatment.');
  if (!patient.familyCalled) return prompt('quiet-chest-hold', false,
    'Notice that nothing is going to happen to help you here.',
    'No number will move. No finding will arrive. The whole case for keeping her is a count, an age, and three days that have not happened yet.');
  if (!patient.teamResponded) return prompt('quiet-chest-family', true,
    'The daughter cannot stay. Say what that changed.',
    'Nothing about the chest, and everything about the plan. Whatever was going to make going home safe tonight has just been withdrawn, and it was never the observations.');
  if (!patient.teamObserved) return prompt('quiet-chest-reassess', true,
    'Take a current assessment now they have answered.',
    'Yours predates their reply. They own the analgesia plan, the interval and the discharge decision, and all three are made against the current picture.');
  return prompt('quiet-chest-handoff', false,
    'Hand off a plan sized to the interval the risk lives in.',
    'A complication, an analgesia plan and a discharge date are not handoff gates. What travels is the count beside the age, what the resting chart measures, and that she will be alone.');
}
