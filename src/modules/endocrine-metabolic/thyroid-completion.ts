import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { THYROID_STORM_HEMODYNAMIC_RISK } from './scenarios/thyroid-storm-hemodynamic-risk';
import { THYROID_FIXTURES } from './thyroid-storm-fixtures';

export function thyroidCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'endocrine-metabolic' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== THYROID_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || THYROID_FIXTURES.contentVersion !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(THYROID_STORM_HEMODYNAMIC_RISK)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['Fixed authored thyroid transitions and reference seed 4903; tests/integration/thyroid-storm-runs.test.ts verifies real-engine replay hashes, including presentation, actions, observations, and event evidence.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['thyroid-storm.ts advances incomplete-care deterioration, a later partial-support state, and bounded instructor takeover independently of observation. The one-hour iodine sequence is distinct from authored response clocks.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Ten dose-free decisions include parallel urgent care, circulation assessment, individualized rate review, sequenced iodine, fresh reassessment, handoff, and retained diagnostic-delay and blanket-beta-blockade mistakes.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['Ongoing-care handoff or instructor takeover ends the model; 30-minute incomplete urgent care and four-hour unfinished-lesson stops are authored, not safe treatment delays or predicted outcomes.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Debrief.tsx maps five objectives to accepted/refused events, preserves early errors after correction, and explicitly labels incomplete-coverage deterioration as an authored counterfactual.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['thyroid-storm-fixtures.ts binds expert, commonError, recovery, and noAction paths to content 0.1.0; model and real-engine tests verify distinct states and outcomes.'] },
    { id: 'guidance-and-demonstration', status: 'missing', evidence: ['Exact-version observed-state inline tutoring supports Guided, Coached, and Unassisted. A learner-paced worked example is not yet implemented.'] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Automated tray, replay, and browser checks do not establish complete screen-reader, 400% zoom, color-vision, offline, and performance evidence for this exact version.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['The shared report control, exact-version Worker catalog, and bounded opt-in thyroid context are integrated. Complete four-surface reporting and production Turnstile/D1 verification remain pending.'] },
  ];
}
