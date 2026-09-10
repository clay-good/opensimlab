import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { RENAL_RHABDOMYOLYSIS_NUMBER } from './scenarios/rhabdomyolysis-a-number-that-does-not-carry-the-risk';
import { RENAL_RHABDOMYOLYSIS_FIXTURES } from './rhabdomyolysis-fixtures';
import { RENAL_RHABDOMYOLYSIS_DEMONSTRATION_VERSION } from './demo/renal-rhabdomyolysis-demonstration';

export function renalRhabdomyolysisCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'renal-electrolyte' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== RENAL_RHABDOMYOLYSIS_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || RENAL_RHABDOMYOLYSIS_FIXTURES.contentVersion !== '0.1.0' || RENAL_RHABDOMYOLYSIS_FIXTURES.seed !== 5037
    || RENAL_RHABDOMYOLYSIS_DEMONSTRATION_VERSION !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(RENAL_RHABDOMYOLYSIS_NUMBER)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['rhabdomyolysis-fixtures.ts binds seed 5037 and content 0.1.0 to expert, number-led-error, recovery, and no-action contrasts. No stochastic muscle or kidney model is claimed.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['rhabdomyolysis.ts raises the creatine kinase from 48,000 to 61,000 U/L across the serial checkpoint while the creatinine holds at 88 µmol/L and urine output at 1.4 mL/kg/h. The frightening number and the kidney move apart on purpose, and nothing the learner does bends either.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['The compartment examination, the cause review, qualified fluid ownership, the review of what the number decides, and the review of bicarbonate and mannitol are five distinct recorded steps. Requesting replacement therapy on the strength of the value and adding the two familiar agents as a pair are refused with explanations that state the limits of the evidence in both directions.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The cause, the examination, the number review, the additions review, fluid ownership, support, monitoring, and a current full assessment once the serial results are back permit handoff. A falling or normal creatine kinase is not a gate. Instructor takeover bounds a run with no examination and no fluid ownership at 30 minutes, or an unfinished session at 180 minutes.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Five event-bound objectives distinguish establishing the cause, examining for the time-critical bedside finding, separating what the number shows from what it decides, supported care from unestablished additions, and accountable handoff. Refused shortcuts and the authored unexamined contrast remain available after later care.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['rhabdomyolysis-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways for deterministic replay through the shared engine.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Observed-state guidance and learner-paused example ${RENAL_RHABDOMYOLYSIS_DEMONSTRATION_VERSION} use ordinary recorded actions. Unassisted mode remains silent; prompts do not reveal the serial result before it is requested.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Local checks do not complete exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['Shared report controls and local privacy tests do not establish full inclusive coverage or production Turnstile/D1 verification for this version.'] },
  ];
}
