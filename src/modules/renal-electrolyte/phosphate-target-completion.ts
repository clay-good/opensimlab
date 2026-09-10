import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { RENAL_PHOSPHATE_TARGET } from './scenarios/phosphate-target-a-surrogate-that-moved-the-wrong-way';
import { RENAL_PHOSPHATE_FIXTURES } from './phosphate-target-fixtures';
import { RENAL_PHOSPHATE_DEMONSTRATION_VERSION } from './demo/renal-phosphate-target-demonstration';

export function renalPhosphateTargetCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'renal-electrolyte' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== RENAL_PHOSPHATE_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || RENAL_PHOSPHATE_FIXTURES.contentVersion !== '0.1.0' || RENAL_PHOSPHATE_FIXTURES.seed !== 5059
    || RENAL_PHOSPHATE_DEMONSTRATION_VERSION !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(RENAL_PHOSPHATE_TARGET)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['phosphate-target-fixtures.ts binds seed 5059 and content 0.1.0 to expert, treat-the-number error, recovery, and no-action contrasts. No mineral-metabolism model is implemented.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['phosphate-target.ts holds the phosphate at 1.62 mmol/L throughout, because the lesson contains no treatment for it to respond to. What the review changes is the record: the previous clinic letters arrive and carry the two documented restrictions the phosphate column never showed, beside a weight and albumin trend with no cause established.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Naming the target as a surrogate, reading the randomised comparison including the calcification finding, reviewing what he is actually eating, and placing the binder decision with the qualified team are four distinct recorded steps. Treating toward the range as the goal and tightening the diet a third time are refused with explanations that decide nothing about the binder and prescribe no diet.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The surrogate framing, the trial review, the intake review, the owned decision, support, monitoring, and a current full assessment once the previous letters are open permit handoff. A phosphate inside the printed range is not a gate and is never produced. Instructor takeover bounds a run in which the target is never questioned at 30 minutes, or an unfinished session at 180 minutes.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Five event-bound objectives distinguish naming a surrogate, reading the half of a trial that is rarely quoted, asking what the patient is eating, separating a repeated value from an answer, and handing on the context the number does not carry. Refused shortcuts and the authored unexamined contrast remain available after later care.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['phosphate-target-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways for deterministic replay through the shared engine.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Observed-state guidance and learner-paused example ${RENAL_PHOSPHATE_DEMONSTRATION_VERSION} use ordinary recorded actions. Unassisted mode remains silent; prompts do not reveal the retrieved letters before they arrive.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Local checks do not complete exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['Shared report controls and local privacy tests do not establish full inclusive coverage or production Turnstile/D1 verification for this version.'] },
  ];
}
