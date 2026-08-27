import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { HYPOCALCEMIC_TETANY_RESCUE_AND_RECURRENCE } from './scenarios/hypocalcemic-tetany-rescue-and-recurrence';
import { HYPOCALCEMIA_FIXTURES } from './hypocalcemia-fixtures';
import { HYPOCALCEMIA_DEMONSTRATION_VERSION } from './demo/hypocalcemia-demonstration';

export function hypocalcemiaCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'endocrine-metabolic' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== HYPOCALCEMIA_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || HYPOCALCEMIA_FIXTURES.contentVersion !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(HYPOCALCEMIC_TETANY_RESCUE_AND_RECURRENCE)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['Fixed authored hypocalcemia transitions and reference seed 4906 bind the model and real-engine regression fixtures to this exact content version.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['Initial calcium relief, recurrence without magnesium or continuing care, and a later incomplete-stabilization checkpoint advance independently of explicit observations. Calcium, magnesium, and QT normalization are not inferred.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Twelve dose-free choices cover immediate monitored rescue, qualified risk and cause review, magnesium, continuing care, support, reassessment, and handoff, with retained oral-only, diagnostic-delay, magnesium-delay, and stop-after-relief mistakes.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['Ongoing-care handoff or instructor takeover ends the branch. Thirty-minute no-rescue and 180-minute unfinished stops are authored lesson bounds, not treatment deadlines or predicted catastrophe.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Five objective bindings cover rescue, airway/cardiac risk, underlying cause, fresh observations, and continuing-care handoff. Observation credit requires early and later phases; complete care with a fresh later assessment permits handoff even if the early observation was missed. Earlier mistakes survive correction; recurrence contrasts are explicitly authored.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['hypocalcemia-fixtures.ts binds expert, commonError, recovery, and noAction to content 0.1.0 and seed 4906. The recovery path observes recurrence before correcting magnesium and continuing care.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Exact-version observed-state tutoring supports Guided, Coached, and Unassisted. Worked example ${HYPOCALCEMIA_DEMONSTRATION_VERSION} pauses before nine decisions and distinguishes early relief from a later incomplete-stabilization observation.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Local model, replay, guidance, and tray checks do not establish complete inclusive runtime evidence. Exact-version screen-reader, keyboard, reduced-motion, color-vision, 320 px, 400% zoom, offline, and performance verification remains pending.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['Shared reporting requires exact-version coverage and bounded opt-in context on briefing, live, debrief, replay, and source entry. Complete inclusive reporting coverage and production Turnstile/D1 verification remain pending.'] },
  ];
}
