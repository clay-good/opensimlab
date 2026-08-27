import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { SEVERE_HYPOGLYCEMIA_RECURRENCE } from './scenarios/severe-hypoglycemia-recurrence';
import { HYPOGLYCEMIA_FIXTURES } from './severe-hypoglycemia-fixtures';
import { HYPOGLYCEMIA_TUTOR_VERSION } from './tutor/hypoglycemia-guidance';
import { HYPOGLYCEMIA_DEMONSTRATION_VERSION } from './demo/hypoglycemia-demonstration';
import { ADRENAL_CRISIS_TREATMENT_BEFORE_TESTS } from './scenarios/adrenal-crisis-treatment-before-tests';
import { ADRENAL_FIXTURES } from './adrenal-crisis-fixtures';
import { ADRENAL_TUTOR_VERSION } from './tutor/adrenal-guidance';
import { ADRENAL_DEMONSTRATION_VERSION } from './demo/adrenal-demonstration';

export function adrenalCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'endocrine-metabolic' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== ADRENAL_FIXTURES.scenarioId
    || scenario.metadata.version !== '0.1.2' || ADRENAL_FIXTURES.contentVersion !== '0.1.2'
    || JSON.stringify(scenario) !== JSON.stringify(ADRENAL_CRISIS_TREATMENT_BEFORE_TESTS)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['Fixed fictional patient, no randomized adrenal transitions; reference seed 4902. tests/unit/endocrine-adrenal-crisis.test.ts verifies real-engine whole-state replay across all three guidance levels.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['src/modules/endocrine-metabolic/adrenal-crisis.ts advances incomplete rescue, combined-treatment response, and instructor takeover from the shared clock. Bedside observation does not control the underlying state. Exact-boundary tests distinguish untreated and partial care.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Nine declared decisions include independent steroid and saline pathways, support, record review, reassessment, delay, oral-only refusal, prevention, and handoff. No diagnostic result or support acknowledgment gates urgent steroid treatment.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The branch ends at ongoing-treatment handoff or instructor takeover when combined rescue remains incomplete. Later actions cannot restart an ended branch. No real outcome or safe waiting interval is predicted.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['src/modules/anesthesia/ui/Debrief.tsx maps four objectives to accepted events, retains early errors after recovery, and names the incomplete-treatment trajectory as an authored counterfactual.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['src/modules/endocrine-metabolic/adrenal-crisis-fixtures.ts binds expert, commonError, and recovery decisions to content 0.1.2 and seed 4902. Real-engine tests assert distinct end states and debriefs with identical replay hashes.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Five observed-state tutor rules at version ${ADRENAL_TUTOR_VERSION} support guidance levels. Worked example ${ADRENAL_DEMONSTRATION_VERSION} follows accepted rescue, record, reassessment, prevention, and handoff actions through the real engine. tests/unit/endocrine-adrenal-demonstration.test.ts, tests/ui/endocrine-adrenal-demonstration.test.tsx, and tests/integration/demonstration-runs.test.tsx verify observed response, paused reading checkpoints, single-dispatch Continue, stable controls, takeover cancellation, and replay.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Automated UI, observed-state and replay checks exist. Complete per-scenario screen-reader, reduced-motion, color-vision, 320 px, offline, and performance evidence remains pending.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['The scenario inherits the shared report control and has an exact-version Worker catalog record. Complete four-surface runtime evidence is not yet bound.'] },
  ];
}

/** Exact-version evidence, not a general claim about other narrative scenarios. */
export function hypoglycemiaCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'endocrine-metabolic' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== HYPOGLYCEMIA_FIXTURES.scenarioId
    || scenario.metadata.version !== '0.1.3' || HYPOGLYCEMIA_FIXTURES.contentVersion !== '0.1.3'
    || JSON.stringify(scenario) !== JSON.stringify(SEVERE_HYPOGLYCEMIA_RECURRENCE)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['Fixed authored initial state; no randomized hypoglycemia transitions. Reference seed 4901. tests/unit/endocrine-hypoglycemia-guidance.test.ts replays expert, error, and recovery across guidance levels.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['src/modules/endocrine-metabolic/severe-hypoglycemia.ts advances deterioration, post-rescue response, recurrence, and repeat response from the shared simulation clock. tests/unit/endocrine-severe-hypoglycemia.test.ts verifies exact boundaries and stale measurements.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Eight declared actions include glucose observation, support, rescue, medication review, monitoring, premature closure, and handoff. Oral rescue is refused; delayed rescue and early closure lead to distinct error and recovery transcripts.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The model ends at qualified monitored handoff or instructor takeover after untreated hypoglycemia. Ended branches refuse later actions without inventing death, neurologic outcome, or discharge safety.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['src/modules/anesthesia/ui/Debrief.tsx maps five objectives to accepted engine events, preserves unsafe choices after correction, and labels the no-rescue comparison as an authored counterfactual. PEARLS reflection remains in the shared debrief.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['src/modules/endocrine-metabolic/severe-hypoglycemia-fixtures.ts binds expert, commonError, and recovery fixtures to content 0.1.3 and seed 4901. Real-engine replay tests verify distinct outcomes and guidance independence.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Eight observed-state tutor rules at version ${HYPOGLYCEMIA_TUTOR_VERSION} provide Guided, Coached, and Unassisted behavior. Worked example ${HYPOGLYCEMIA_DEMONSTRATION_VERSION} follows accepted actions and observed responses through the real engine; tests/unit/endocrine-hypoglycemia-demonstration.test.ts, tests/ui/endocrine-hypoglycemia-demonstration.test.tsx, and tests/integration/demonstration-runs.test.tsx verify paused reading checkpoints, distinct repeated-rescue steps, single-dispatch Continue, takeover cancellation, and objective evidence.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Automated UI, offline architecture, deterministic replay, and desktop browser checks exist. Per-scenario moderated screen-reader, reduced-motion, color-vision, 320 px, and performance evidence remains incomplete.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['The shared reporting control and exact-version report records exist; the centered modal, length limit, and keyboard dismissal were checked on the briefing. Complete per-scenario evidence across briefing, live, debrief, and provenance is still pending.'] },
  ];
}
