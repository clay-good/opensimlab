import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { TrialRuleSnapshot } from '@platform/kernel/protocol';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link
 * built from a citation is a guess rather than a lookup. The tray already sends a
 * reader to the source view, which shows the declared citations in full.
 */

/**
 * Observed-state guidance for a rule written for a database.
 *
 * Response criteria exist to make trial arms comparable. They were quoted here as
 * though they licensed a decision about this woman, and both failures follow from
 * accepting that framing: continue because a category permits it, or stop because
 * a category says progression. So no prompt below argues about which category she
 * is in. They point at the trajectory, which is the thing the criteria were never
 * measuring, and at the team who actually owns the decision.
 */
export function trialRuleInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly trialRule?: TrialRuleSnapshot;
}) {
  const patient = input.trialRule;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryRecordedAtTick === null) return prompt('trial-rule-trajectory', true,
    'Record the clinical trajectory rather than the scan alone.',
    'Weight, function and how she has been over weeks are what the criteria were never measuring. They are also the part she and her team can actually recognise.');
  if (patient.escalationAtTick === null) return prompt('trial-rule-escalate', true,
    'Tell her treating team now, before the rest is written up.',
    'Whether the immunotherapy continues is theirs, and it is being decided in a corridor on a quoted rule. Nothing else you record changes who should be holding this.');
  if (patient.governanceRecordedAtTick === null) return prompt('trial-rule-governance', true,
    'Record what the criteria do and do not govern.',
    'They were built to make trial arms comparable, not to license a treatment decision for one person. Saying what they are for is what stops them being read as permission.');
  if (patient.treatmentIntentAtTick === null) return prompt('trial-rule-intent', true,
    'Record bounded treatment intent and decide nothing.',
    'Continuing, stopping, and what is said to her about either are decisions for the team that owns her care.');
  if (patient.boundariesReviewedAtTick === null) return prompt('trial-rule-boundaries', true,
    'Review what this lesson does not settle.',
    'No category is confirmed here and no outcome is predicted. A rule that fits her scan is not evidence about her.');
  if (!patient.documentRead) return prompt('trial-rule-observe-document', false,
    'Read the criteria that were quoted at you.',
    'A rule cited from memory in a corridor is worth checking against the document. This authored interval is a contrast rather than a required clinical wait.');
  if (!patient.teamResponded) return prompt('trial-rule-hold', true,
    'Note that the document says something narrower than it was quoted as saying.',
    'That gap is the finding. It does not make your colleague careless; it makes the quoted rule the wrong thing to have been deciding on, which is the point worth carrying to the team.');
  if (!patient.teamObserved) return prompt('trial-rule-reassess', true,
    'Take a current assessment now that her team has answered.',
    'The earlier assessment predates their answer. What they need is the trajectory beside the scan, which is the pairing the corridor conversation never had.');
  return prompt('trial-rule-handoff', false,
    'Hand off with the decision theirs and the category unclaimed.',
    'A confirmed category, a continued or stopped treatment, and a resolved prognosis are not handoff gates. What travels is the trajectory, the scan, and what the criteria actually govern.');
}
