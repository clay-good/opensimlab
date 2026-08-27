import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { REFEEDING_ELECTROLYTE_SHIFT } from './scenarios/refeeding-electrolyte-shift';
import { REFEEDING_FIXTURES } from './refeeding-fixtures';
import { REFEEDING_DEMONSTRATION_VERSION } from './demo/refeeding-demonstration';

export function refeedingCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'endocrine-metabolic' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== REFEEDING_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || REFEEDING_FIXTURES.contentVersion !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(REFEEDING_ELECTROLYTE_SHIFT)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['Fixed authored electrolyte and vital-sign contrasts bind expert, common-error, recovery, and no-action paths to seed 4921. There is no stochastic nutritional physiology or dosing model.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['Partial phosphate care, comprehensive replacement, incomplete-care recurrence, and combined nutrition care produce distinct elapsed states. Only requested assessments disclose new laboratory findings.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Eleven dose-free choices make comprehensive electrolyte care, vitamin support, nutrition review, surveillance, observations, and ownership independent. Phosphate-only care is a valid partial step. Automatic feeding advancement and monitoring closure are refused, not silently delivered.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['Continuing-care handoff or instructor takeover bounds practice without predicting injury or certifying clinical safety. Earlier mistakes do not prevent a later appropriate handoff.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Five event-bound findings distinguish partial care, complete care, historical observations, nutrition/vitamin review, and ongoing handoff. Actual elapsed delay and observed recurrence remain visible without an arbitrary timing score.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['refeeding-fixtures.ts binds expert, commonError, recovery, and noAction to content 0.1.0. Replay checks compare full engine emissions, not only final electrolyte values.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Observed-state Guided and Coached prompts respect Unassisted silence. Example ${REFEEDING_DEMONSTRATION_VERSION} pauses for each decision, requests early and later findings, and uses ordinary actions without mutating private state.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Local model, UI, and replay checks do not complete exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['Shared reporting and local context tests do not establish full inclusive coverage or production Turnstile/D1 verification for this content version.'] },
  ];
}
