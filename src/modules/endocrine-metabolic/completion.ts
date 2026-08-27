import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { SEVERE_HYPOGLYCEMIA_RECURRENCE } from './scenarios/severe-hypoglycemia-recurrence';
import { HYPOGLYCEMIA_FIXTURES } from './severe-hypoglycemia-fixtures';
import { HYPOGLYCEMIA_TUTOR_VERSION } from './tutor/hypoglycemia-guidance';
import { HYPOGLYCEMIA_DEMONSTRATION_VERSION } from './demo/hypoglycemia-demonstration';

/** Exact-version evidence, not a general claim about other narrative scenarios. */
export function hypoglycemiaCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'endocrine-metabolic' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== HYPOGLYCEMIA_FIXTURES.scenarioId
    || scenario.metadata.version !== '0.1.2' || HYPOGLYCEMIA_FIXTURES.contentVersion !== '0.1.2'
    || JSON.stringify(scenario) !== JSON.stringify(SEVERE_HYPOGLYCEMIA_RECURRENCE)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['Fixed authored initial state; no randomized hypoglycemia transitions. Reference seed 4901. tests/unit/endocrine-hypoglycemia-guidance.test.ts replays expert, error, and recovery across guidance levels.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['src/modules/endocrine-metabolic/severe-hypoglycemia.ts advances deterioration, post-rescue response, recurrence, and repeat response from the shared simulation clock. tests/unit/endocrine-severe-hypoglycemia.test.ts verifies exact boundaries and stale measurements.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Eight declared actions include glucose observation, support, rescue, medication review, monitoring, premature closure, and handoff. Oral rescue is refused; delayed rescue and early closure lead to distinct error and recovery transcripts.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The model ends at qualified monitored handoff or instructor takeover after untreated hypoglycemia. Ended branches refuse later actions without inventing death, neurologic outcome, or discharge safety.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['src/modules/anesthesia/ui/Debrief.tsx maps five objectives to accepted engine events, preserves unsafe choices after correction, and labels the no-rescue comparison as an authored counterfactual. PEARLS reflection remains in the shared debrief.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['src/modules/endocrine-metabolic/severe-hypoglycemia-fixtures.ts binds expert, commonError, and recovery fixtures to content 0.1.2 and seed 4901. Real-engine replay tests verify distinct outcomes and guidance independence.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Eight observed-state tutor rules at version ${HYPOGLYCEMIA_TUTOR_VERSION} provide Guided, Coached, and Unassisted behavior. Worked example ${HYPOGLYCEMIA_DEMONSTRATION_VERSION} follows accepted actions and observed responses through the real engine; tests/unit/endocrine-hypoglycemia-demonstration.test.ts and tests/ui/endocrine-hypoglycemia-demonstration.test.tsx verify timing, pause, takeover, and objective evidence.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Automated UI, offline architecture, deterministic replay, and desktop browser checks exist. Per-scenario moderated screen-reader, reduced-motion, color-vision, 320 px, and performance evidence remains incomplete.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['The shared reporting control and exact-version report records exist; the centered modal, length limit, and keyboard dismissal were checked on the briefing. Complete per-scenario evidence across briefing, live, debrief, and provenance is still pending.'] },
  ];
}
