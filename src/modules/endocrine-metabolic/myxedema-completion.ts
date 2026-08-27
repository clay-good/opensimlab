import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { MYXEDEMA_COMA_VENTILATION_AND_STEROID_SEQUENCE } from './scenarios/myxedema-coma-ventilation-and-steroid-sequence';
import { MYXEDEMA_FIXTURES } from './myxedema-fixtures';
import { MYXEDEMA_DEMONSTRATION_VERSION } from './demo/myxedema-demonstration';

export function myxedemaCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'endocrine-metabolic' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== MYXEDEMA_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || MYXEDEMA_FIXTURES.contentVersion !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(MYXEDEMA_COMA_VENTILATION_AND_STEROID_SEQUENCE)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['Fixed authored myxedema transitions and reference seed 4904; myxedema-runs.test.ts verifies real-engine replay hashes including observations and event evidence.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['Independent ventilatory and endocrine support states expose oxygen-saturation masking, delayed urgent care, partial support, and bounded takeover. All response values and clocks are authored.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Ten dose-free qualified-team decisions include ventilation, steroid-before-thyroxine without an invented interval, parallel support, fresh reassessment, handoff, and retained delay, early-thyroxine, and rapid-warming attempts.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['Continuing-care handoff or instructor takeover ends the branch. Thirty-minute missing urgent care and 180-minute unfinished-lesson stops are teaching bounds, not safe treatment delays or predicted clinical outcomes.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Debrief.tsx maps five objectives to accepted and refused actions, preserves mistakes after correction, and labels incomplete-care deterioration as an authored counterfactual.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['myxedema-fixtures.ts binds expert, commonError, recovery, and noAction paths to content 0.1.0; model and real-engine tests verify distinct outcomes and deterministic replay.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Exact-version observed-state tutoring supports Guided, Coached, and Unassisted. Worked example ${MYXEDEMA_DEMONSTRATION_VERSION} pauses before eight real decisions, observes the separate ventilatory and full-package checkpoints, and ends with support-dependent handoff. Tray and real-session demonstration tests verify accepted actions and transcript replay.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Tray, replay, keyboard-summary, unavailable-reading, and authored-explanation regressions plus desktop and 320 px browser checks are recorded. Complete screen-reader, 400% zoom, color-vision, offline, and performance evidence remains pending for this exact version.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['The shared report control, exact-version Worker catalog, and bounded opt-in myxedema context are integrated. myxedema-report-surfaces.test.tsx verifies real route/form projection on briefing, live, example, debrief, replay, and source entry with local transport/network stubs. Complete inclusive four-surface reporting and production Turnstile/D1 verification remain pending.'] },
  ];
}
