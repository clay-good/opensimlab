import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { RENAL_HYPOCALCEMIA_IONIZED_CALCIUM_AND_CKD } from './scenarios/hypocalcemia-ionized-calcium-and-ckd';
import { RENAL_HYPOCALCEMIA_FIXTURES } from './hypocalcemia-fixtures';
import { RENAL_HYPOCALCEMIA_DEMONSTRATION_VERSION } from './demo/renal-hypocalcemia-demonstration';

export function renalHypocalcemiaCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'renal-electrolyte' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== RENAL_HYPOCALCEMIA_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || RENAL_HYPOCALCEMIA_FIXTURES.contentVersion !== '0.1.0' || RENAL_HYPOCALCEMIA_FIXTURES.seed !== 4987
    || RENAL_HYPOCALCEMIA_DEMONSTRATION_VERSION !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(RENAL_HYPOCALCEMIA_IONIZED_CALCIUM_AND_CKD)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['hypocalcemia-fixtures.ts binds seed 4987 and content 0.1.0 to expert, incomplete-care, recovery, and no-action contrasts. No stochastic calcium kinetics is claimed.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['hypocalcemia.ts separates monitored rescue response, uncovered recurrence, and continuing-calcium response. Spasm can improve while tingling persists. Unrequested ionized calcium and bedside findings remain private; the supplied total, adjusted total, sample pH, phosphate, magnesium, and prior QTc remain historical.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Dose-free choices distinguish monitored rescue, immediate continuing calcium, measurement context, qualified mineral and activated-vitamin-D care, follow-up, monitoring, support, and partial or full reassessment. No administrative or repeat-test gate delays rescue; continuing calcium is available immediately after rescue, and mineral care and follow-up do not gate biochemical response.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['Delivered care, current full findings after rescue response, and continuing-care ownership permit handoff, including observed recurrence while the continuing-calcium response is pending. Instructor takeover bounds a run without rescue at 30 minutes or an unfinished session at 180 minutes. Normal calcium, resolved tingling, flawless history, and completion of every older panel are not handoff requirements.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Five event-bound objectives distinguish rescue, ionized-calcium interpretation, separate continuity decisions, current reassessment, and accountable unresolved-risk handoff. Refused shortcuts and observed recurrence remain available after later care; delivery of continuing care is not automatically evidence of its response.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['hypocalcemia-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways for deterministic replay through the shared engine.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Observed-state guidance and learner-paused example ${RENAL_HYPOCALCEMIA_DEMONSTRATION_VERSION} use ordinary recorded actions. Unassisted mode remains silent; prompts do not reveal unrequested ionized calcium, bedside findings, or latent recurrence.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Local checks do not complete exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['Shared report controls and local privacy tests do not establish full inclusive coverage or production Turnstile/D1 verification for this version.'] },
  ];
}
