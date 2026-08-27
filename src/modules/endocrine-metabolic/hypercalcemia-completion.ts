import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { HYPERCALCEMIC_CRISIS_VOLUME_AND_BRIDGE } from './scenarios/hypercalcemic-crisis-volume-and-bridge';
import { HYPERCALCEMIA_FIXTURES } from './hypercalcemia-fixtures';
import { HYPERCALCEMIA_DEMONSTRATION_VERSION } from './demo/hypercalcemia-demonstration';

export function hypercalcemiaCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'endocrine-metabolic' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== HYPERCALCEMIA_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || HYPERCALCEMIA_FIXTURES.contentVersion !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(HYPERCALCEMIC_CRISIS_VOLUME_AND_BRIDGE)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['Fixed authored hypercalcemia transitions and reference seed 4905; model and real-engine replay checks are bound to the exact fixture content version.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['Independent hydration and calcitonin-bridge checkpoints separate circulation from persistent severe hypercalcemia. Missing urgent treatment is retained and unfinished paths have bounded instructor takeover. No antiresorptive effect is modeled.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Ten dose-free choices include immediate tailored hydration, calcitonin, supplied cardiorenal review, renal-informed antiresorptive care, support, fresh reassessment, and handoff, with refused fluid/diuretic shortcuts and retained cause-delay decisions.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['Continuing-care handoff or instructor takeover ends the branch. Thirty-minute missing-urgent-care and six-hour unfinished-lesson stops are authored bounds, not safe delays or outcome predictions.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Five objective bindings cover tailored volume support, short bridge, renal review, distinct fresh observations, and ongoing-care handoff; earlier shortcuts remain evidence after correction. Counterfactuals are authored, not clinical predictions.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['hypercalcemia-fixtures.ts binds expert, commonError, recovery, and noAction paths to content 0.1.0 and seed 4905. Reference checks: endocrine-hypercalcemia.test.ts and hypercalcemia-runs.test.ts.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Exact-version observed-state tutoring supports Guided, Coached, and Unassisted. Worked example ${HYPERCALCEMIA_DEMONSTRATION_VERSION} pauses before eight accepted decisions, separates fluid and bridge observation periods, and hands off persistent severe hypercalcemia without claiming recovery.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Local model, guidance, and tray checks do not establish complete inclusive runtime evidence. Exact-version screen-reader, keyboard, reduced-motion, color-vision, 320 px, 400% zoom, offline, replay, and performance verification remains pending.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['The shared report pattern requires exact-version coverage and bounded opt-in context on briefing, live, debrief, replay, and source entry. Complete inclusive four-surface reporting and production Turnstile/D1 verification remain pending.'] },
  ];
}
