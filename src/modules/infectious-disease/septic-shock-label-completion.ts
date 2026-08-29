import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { SEPTIC_SHOCK_A_LABEL_THE_TREATMENT_CREATES } from './scenarios/septic-shock-a-label-the-treatment-creates';
import { SEPTIC_SHOCK_LABEL_FIXTURES } from './septic-shock-label-fixtures';

export function septicShockLabelCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'infectious-disease' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== SEPTIC_SHOCK_LABEL_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.1'
    || SEPTIC_SHOCK_LABEL_FIXTURES.contentVersion !== '0.1.1' || SEPTIC_SHOCK_LABEL_FIXTURES.seed !== 6127
    || JSON.stringify(scenario) !== JSON.stringify(SEPTIC_SHOCK_A_LABEL_THE_TREATMENT_CREATES)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['septic-shock-label-fixtures.ts binds seed 6127 and content 0.1.1 to expert, incomplete-care, recovery, and no-action contrasts. No infection, host-response, fluid, or vasoactive model is claimed.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['septic-shock-label.ts runs two authored transitions. The one-hour ceiling is reported as passed rather than hidden if no bounded resuscitation intent has been recorded. The authored resuscitation completes 90 minutes after intent is recorded, holding the mean pressure at 68 mmHg on vasopressor support with a lactate of 3.1 mmol/L, which is the first moment all three parts of the definition can be read together. Nothing completes a resuscitation that was never intended, because the trial is what makes the label readable.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['The learner records measured hypoperfusion, activates critical care on the perfusion pattern rather than on a label, records the classification as open with its reason, records bounded resuscitation intent, reviews the targets with their grades, and arranges continuous monitoring. Declaring septic shock before the trial, reading the lactate as tissue hypoxia, resuscitating until the lactate normalizes, and raising the mean pressure target above 65 mmHg are each refused.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['Recorded hypoperfusion, critical care activation, an open classification, bounded resuscitation intent, the boundary review, monitoring, and a current full assessment permit handoff with the label reported as a product of the trial. Instructor takeover bounds a run with no recorded intent at 150 minutes, or an unfinished session at eight hours.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Six event-bound objectives distinguish recording measurable hypoperfusion, recognizing that two criteria have no truth value before the trial, activating on the pattern rather than the name, the targets and their grades, bounded intent that is simultaneously the measurement, and accountable handoff of a label that reflects a treatment. Refused shortcuts remain visible, and no organism, treatment effect, or outcome is certified.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['septic-shock-label-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways for deterministic replay through the shared engine.'] },
    { id: 'guidance-and-demonstration', status: 'missing', evidence: ['This slice ships no observed-state tutor prompt or worked example for this scenario version.'] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Local checks do not complete exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['Shared report controls and local privacy tests do not establish full inclusive coverage or production Turnstile/D1 verification for this version.'] },
  ];
}
