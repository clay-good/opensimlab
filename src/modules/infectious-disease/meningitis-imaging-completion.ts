import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { MENINGITIS_IMAGING_A_RULE_THAT_DOES_NOT_AGREE } from './scenarios/meningitis-imaging-a-rule-that-does-not-agree';
import { MENINGITIS_IMAGING_FIXTURES } from './meningitis-imaging-fixtures';

export function meningitisImagingCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'infectious-disease' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== MENINGITIS_IMAGING_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || MENINGITIS_IMAGING_FIXTURES.contentVersion !== '0.1.0' || MENINGITIS_IMAGING_FIXTURES.seed !== 7314
    || JSON.stringify(scenario) !== JSON.stringify(MENINGITIS_IMAGING_A_RULE_THAT_DOES_NOT_AGREE)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['meningitis-imaging-fixtures.ts binds seed 7314 and content 0.1.0 to expert, incomplete-care, recovery, and no-action contrasts. No infection, host-response, imaging, or antimicrobial model is claimed.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['meningitis-imaging.ts runs three authored transitions. The receiving unit applies its own local criteria at 40 minutes and sends the patient for imaging, which is the unit’s rule set acting rather than the learner. The one-hour ceiling is reported as passed rather than hidden if no antimicrobial intent has been recorded. The scan is reported at 75 minutes showing nothing that contraindicates a puncture, having changed no management. The neurology deliberately never moves, because a deterioration would end the disagreement between the criteria sets and make this a different lesson.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['The learner records the three triggering features and the absences alongside them, activates time-critical ownership, records bounded antimicrobial intent that does not wait for imaging or puncture, compares five published criteria sets against this one patient, reviews the boundaries, and arranges monitoring. Treating a scan first as the safe default, holding antimicrobials for the puncture, excluding meningitis on a normal C-reactive protein, and excluding it on a negative Gram stain are each refused.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['Recorded features, activated ownership, bounded antimicrobial intent, the criteria comparison, the boundary review, monitoring, and a current full assessment permit handoff with the imaging question reported as a property of the local rule set. Instructor takeover bounds a run with no recorded intent at 150 minutes, or an unfinished session at eight hours.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Six event-bound objectives distinguish recording the features and their absences, comparing the criteria sets rather than applying one, activating without waiting on the imaging question, the boundaries and their certainty, bounded intent inside the hour, and accountable handoff of what the pathway cost. Refused shortcuts remain visible, and no organism, treatment effect, or outcome is certified.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['meningitis-imaging-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways for deterministic replay through the shared engine.'] },
    { id: 'guidance-and-demonstration', status: 'missing', evidence: ['This slice ships no observed-state tutor prompt or worked example for this scenario version.'] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Local checks do not complete exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['Shared report controls and local privacy tests do not establish full inclusive coverage or production Turnstile/D1 verification for this version.'] },
  ];
}
