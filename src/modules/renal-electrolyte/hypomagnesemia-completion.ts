import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { RENAL_HYPOMAGNESEMIA_REFRACTORY_POTASSIUM } from './scenarios/hypomagnesemia-refractory-potassium-and-the-normal-number';
import { RENAL_HYPOMAGNESEMIA_FIXTURES } from './hypomagnesemia-fixtures';
import { RENAL_HYPOMAGNESEMIA_DEMONSTRATION_VERSION } from './demo/renal-hypomagnesemia-demonstration';

export function renalHypomagnesemiaCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'renal-electrolyte' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== RENAL_HYPOMAGNESEMIA_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || RENAL_HYPOMAGNESEMIA_FIXTURES.contentVersion !== '0.1.0' || RENAL_HYPOMAGNESEMIA_FIXTURES.seed !== 5011
    || RENAL_HYPOMAGNESEMIA_DEMONSTRATION_VERSION !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(RENAL_HYPOMAGNESEMIA_REFRACTORY_POTASSIUM)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['hypomagnesemia-fixtures.ts binds seed 5011 and content 0.1.0 to expert, incomplete-care, recovery, and no-action contrasts. No stochastic magnesium kinetics is claimed.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['hypomagnesemia.ts places the authored response in the potassium, the ionized calcium, the QT interval and the bedside findings, while the magnesium value moves 0.78 to 0.81 mmol/L. A learner watching only the magnesium sees almost nothing change, which is the lesson. Unrequested potassium and magnesium results remain private until asked for.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Dose-free choices independently provide monitoring, exposure cessation, and qualified repletion without administrative or repeat-test prerequisites. Reviewing what the in-range number excludes is its own recorded step. A third potassium replacement alone and the claim that an in-range magnesium excludes depletion are both refused with an explanation rather than hidden.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['Monitoring, exposure cessation, support ownership, context, the number review, delivered repletion, and a current full assessment after an observed repletion response permit unresolved-risk handoff. A normal magnesium and every earlier panel are not gates. Instructor takeover bounds a run with no monitoring or repletion at 30 minutes, or an unfinished session at 180 minutes.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Five event-bound objectives distinguish protecting the patient, reading the exposure and the losses, separating what the magnesium value shows from what it excludes, current reassessment, and accountable handoff. Refused shortcuts and the observed untreated contrast remain available after later care.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['hypomagnesemia-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways for deterministic replay through the shared engine.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Observed-state guidance and learner-paused example ${RENAL_HYPOMAGNESEMIA_DEMONSTRATION_VERSION} use ordinary recorded actions. Unassisted mode remains silent; prompts do not reveal unrequested results or the latent repletion response.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Local checks do not complete exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['Shared report controls and local privacy tests do not establish full inclusive coverage or production Turnstile/D1 verification for this version.'] },
  ];
}
