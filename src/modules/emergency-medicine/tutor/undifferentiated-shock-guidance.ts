import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { UndifferentiatedShockProgress } from '../undifferentiated-shock';

export const UNDIFFERENTIATED_SHOCK_TUTOR_VERSION = '0.1.0';

export interface UndifferentiatedShockPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is the fluid challenge as an opening move. Giving
 * volume and watching the pressure is a test that takes minutes to answer,
 * cannot be taken back, and answers a question a leg raise answers reversibly in
 * seconds. Every gate here exists to put the reversible test first.
 *
 * It is silent on the unassisted setting, silent once escalation is recorded,
 * and silent for any scenario version it was not written against.
 */
export function undifferentiatedShockInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: UndifferentiatedShockProgress },
): UndifferentiatedShockPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.escalationAtTick !== null) return null;

  const prompt = (id: string, suggestion: string, because: string) => ({ id, suggestion, because });

  if (patient.perfusionReviewedAtTick === null) return prompt('us-perfusion',
    'Look at the three organs you can assess without a machine.',
    'Skin, brain, kidney: cool mottled peripheries, a patient who is slow to attend, and urine that has stopped. A mean pressure of 58 is a number that could belong to several different states, and the reason shock is not defined by it is that a normal pressure buys no reassurance in someone whose tissues are already short. These are authored findings; nothing here is examined or measured.');
  if (patient.lactateReviewedAtTick === null) return prompt('us-lactate',
    'Read the lactate as a second opinion, not a verdict.',
    'It is the one marker here that does not depend on the bedside and it agrees with what the skin already said. It is also the marker people wait for before acting, which is the wrong way round — it is confirmation of a decision you can already make, and its value is that you will have a second one later to compare against.');
  if (patient.focusedEchoReviewedAtTick === null) return prompt('us-echo',
    'Narrow the pattern. Do not name a cause.',
    'The authored focused study shows a small, vigorous, underfilled ventricle with no effusion and no strain — which narrows towards low preload and away from the two that would change everything, tamponade and right-heart obstruction. It has excluded, not diagnosed. Nothing in this lesson acquires or interprets an image, and no aetiology is claimed by it.');
  if (patient.passiveLegRaiseAtTick === null) return prompt('us-plr',
    'Test the fluid before you commit to it.',
    'A passive leg raise borrows about 300 mL from the legs and gives it back the moment they come down. That is the whole argument: the reversible version of the test comes first, because volume you have given cannot be taken back and a lung that is wet stays wet. The authored response is a rise, which is what makes the challenge that follows reasonable rather than routine.');
  if (patient.fluidChallengeAtTick === null) return prompt('us-fluid',
    'A bounded 500 mL, and a reason to stop.',
    'Bounded because a challenge is an experiment with an endpoint, and an infusion that never ends is not a challenge at all. This records the intent to give a fixed volume to a patient the leg raise says is likely to respond; fluid type, rate, route, and any repeat are outside the vignette.');
  if (patient.perfusionReassessedAtTick === null) return prompt('us-reassess',
    'Reassess the same markers, not the convenient ones.',
    'Skin, attention, urine, pressure and lactate again — the same list, because a challenge that is only judged on the pressure will look like it worked in a patient whose tissues have not changed. This is the step that makes the experiment an experiment, and it is deliberately gated behind an engine tick so that a reassessment cannot be recorded in the same instant as the fluid it is reading.');
  return prompt('us-escalate',
    'Say out loud that the cause is still open.',
    'The perfusion has improved and nothing has been diagnosed. Escalation records that the aetiologic workup is unresolved and continuing, which is the honest end of an assessment that narrowed a pattern and tested a response. No cause, definitive treatment, disposition, or outcome exists in this vignette, and a run that stops feeling satisfied here has mistaken a better number for an answer.');
}
