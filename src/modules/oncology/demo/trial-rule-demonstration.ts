import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { TrialRuleSnapshot } from '@platform/kernel/protocol';
import { supportsTrialRule, type TrialRuleAction } from '../trial-rule';
import { trialRuleInlinePrompt } from '../trial-rule-tutor';


/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: TrialRuleSnapshot): string {
  const prompt = trialRuleInlinePrompt('guided', { scenarioVersion: '0.1.0', trialRule: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const TRIAL_RULE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsTrialRuleDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsTrialRule(scenario);
}

export interface TrialRuleDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: TrialRuleAction; readonly finished?: boolean;
}

/**
 * The worked example for a rule written for a database.
 *
 * Both refused shortcuts accept the same framing — that a response category
 * licenses a decision — and then differ only in which way they go. The example
 * therefore never claims a category, and it reads the quoted document rather than
 * arguing with the colleague who quoted it, because the gap between what the rule
 * says and what it was said to say is the finding rather than a fault.
 */
export function trialRuleDemonstrationStep(
  patient?: TrialRuleSnapshot,
): TrialRuleDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'The trajectory, the scan, and what the criteria actually govern are handed to her team with the decision theirs and no category claimed. This ends the example, not the decision.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.trajectoryRecordedAtTick === null) {
    return { id: 'trajectory', focus: 'actions', progress: 0.07, action: 'record-the-clinical-trajectory-not-just-the-scan',
      narration: 'Record the clinical trajectory rather than the scan alone. Weight, function and how she has been over weeks are exactly what the criteria were never measuring, and they are the part she and her team can recognise.' };
  }
  if (patient.escalationAtTick === null) {
    return { id: 'escalate', focus: 'actions', progress: 0.20, action: 'escalate-to-the-treating-team-now',
      narration: 'Tell her treating team now, second, before the rest is written up. Whether the immunotherapy continues is theirs, and at this moment it is being decided in a corridor on a rule quoted from memory.' };
  }
  if (patient.governanceRecordedAtTick === null) {
    return { id: 'governance', focus: 'actions', progress: 0.34, action: 'record-what-the-criteria-do-and-do-not-govern',
      narration: 'Record what the criteria do and do not govern. They were built to make trial arms comparable, not to license a treatment decision about one person. Saying what they are for is what stops them being read as permission.' };
  }
  if (patient.treatmentIntentAtTick === null) {
    return { id: 'intent', focus: 'actions', progress: 0.46, action: 'record-bounded-treatment-intent',
      narration: 'Record bounded treatment intent and decide nothing. Continuing, stopping, and what is said to her about either belong to the team that owns her care.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.57, action: 'review-boundaries',
      narration: 'Review what is not settled. No category is confirmed here and no outcome is predicted, and a rule that fits her scan is not evidence about her.' };
  }
  if (!patient.documentRead) {
    return { id: 'observe-document', focus: 'monitor', progress: 0.68,
      narration: 'Read the criteria that were quoted at you rather than the memory of them. This authored interval is a contrast rather than a required clinical wait.' };
  }
  if (!patient.teamResponded) {
    return { id: 'hold', focus: 'monitor', progress: 0.80,
      narration: 'The document says something narrower than it was quoted as saying. That gap is the finding, and it is not a fault in the colleague who cited it — it is the reason the quoted rule was the wrong thing to be deciding on. Carry the difference to the team rather than the argument.' };
  }
  if (!patient.teamObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.90, action: 'reassess',
      narration: 'Take a current assessment now her team has answered and taken ownership. What they need is the trajectory beside the scan, which is the pairing the corridor conversation never had.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: narrate(patient) };
}
