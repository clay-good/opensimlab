import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { PERIOPERATIVE_DIABETES_INSULIN_CONTINUITY } from './scenarios/perioperative-diabetes-insulin-continuity';
import { PERIOPERATIVE_DIABETES_FIXTURES } from './perioperative-diabetes-fixtures';
import { PERIOPERATIVE_DIABETES_DEMONSTRATION_VERSION } from './demo/perioperative-diabetes-demonstration';

export function perioperativeDiabetesCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'endocrine-metabolic' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== PERIOPERATIVE_DIABETES_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || PERIOPERATIVE_DIABETES_FIXTURES.contentVersion !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(PERIOPERATIVE_DIABETES_INSULIN_CONTINUITY)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['Seed 4931 binds fixed expert, partial-observation/error, recovery, and no-action contrasts. No stochastic insulin kinetics or dosing model is claimed.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['Unresolved interruption, early verified-delivery response, and later response differ. Glucose-only and full observations retain separate timestamps; clocks do not disclose unrequested laboratory values.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Eleven dose-free decisions separate reliable insulin, fasting planning, surveillance, partial/full observation, and handoff. Insulin omission, CGM-only surveillance, and automatic surgical clearance are refused and retained.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['Continuing-care handoff or instructor takeover bounds practice without predicting DKA, surgery, injury, or discharge. Earlier mistakes do not bar later handoff.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Five event-bound findings distinguish verified coverage, planning, partial observations, full response, and ongoing ownership. Actual elapsed delay is descriptive, not an arbitrary grade.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['perioperative-diabetes-fixtures.ts binds four exact-content pathways; real-engine replay tests compare complete frames, not merely final glucose.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Observed-state guidance and learner-paused example ${PERIOPERATIVE_DIABETES_DEMONSTRATION_VERSION} use ordinary actions. Unassisted mode remains silent; no private patient-state mutation is used.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Local UI and replay checks do not complete exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['Shared reporting and local context tests do not establish full inclusive coverage or production Turnstile/D1 verification for this version.'] },
  ];
}
