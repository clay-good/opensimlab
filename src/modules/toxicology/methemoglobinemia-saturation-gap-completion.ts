import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { METHEMOGLOBINEMIA_SATURATION_GAP } from './scenarios/methemoglobinemia-saturation-gap';
import { METHEMOGLOBINEMIA_FIXTURES } from './methemoglobinemia-saturation-gap-fixtures';
import { METHEMOGLOBINEMIA_TUTOR_VERSION } from './tutor/methemoglobinemia-saturation-gap-guidance';
import { METHEMOGLOBINEMIA_DEMONSTRATION_VERSION } from './demo/methemoglobinemia-saturation-gap-demonstration';

/**
 * Exact-version evidence for one lesson, and no claim about any other.
 *
 * `observable-objectives` is deliberately not answered here. This scenario
 * declares six objectives against a cap of five, which is a content-design
 * decision affecting scenarios across several modules rather than something
 * this file may settle on its own. The shared audit keeps naming it.
 */
export function methemoglobinemiaCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'toxicology' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== METHEMOGLOBINEMIA_FIXTURES.scenarioId
    || scenario.metadata.version !== '0.1.0' || METHEMOGLOBINEMIA_FIXTURES.contentVersion !== '0.1.0'
    || METHEMOGLOBINEMIA_FIXTURES.seed !== 5271
    || METHEMOGLOBINEMIA_TUTOR_VERSION !== '0.1.0' || METHEMOGLOBINEMIA_DEMONSTRATION_VERSION !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(METHEMOGLOBINEMIA_SATURATION_GAP)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['methemoglobinemia-saturation-gap-fixtures.ts binds seed 5271 and content 0.1.0 to expert, antidote-before-support error, recovery, and no-action paths. The presentation, the arterial and co-oximetry values, and the fixed later report are authored constants; no oxidation, antidote-response, or rebound model is claimed, and no outcome follows from any choice. tests/integration/methemoglobinemia-saturation-gap-runs.test.ts replays every path frame-for-frame across all three guidance levels and both practice regions.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['The lesson advances through six recorded steps on the shared simulation clock, two of them time-gated: the bounded antidote intent refuses until simulated time has passed since the hazard review, and the handoff refuses until time has passed since that. What moves is not the diagnosis, which never closes, but what the record can support about a level that fell for reasons nobody here established.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Six declared decisions reconcile the two oxygen numbers with the patient, name the suspected dyshemoglobin pattern without closing the differential, keep support and monitoring running while the oxidant is stopped and qualified owners are called, read the co-oximetry beside the G6PD and serotonergic hazards, record bounded antidote intent, and hand off active risk. Order is enforced rather than suggested, and refusal names the missing step. The lesson takes no history, acquires no sample, calculates no gap, and selects no product, dose, route, access, or rescue.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The branch ends at active-risk handoff. Later actions cannot restart an ended branch, and the ending certifies no confirmed diagnosis, no proven treatment effect, no excluded rebound, hemolysis, serotonin syndrome or ongoing exposure, no rescue eligibility, no disposition, and no outcome.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['src/modules/anesthesia/ui/Debrief.tsx maps all six objectives to accepted engine events; the no-action path meets none and the expert path meets all six. Refused out-of-order attempts stay visible in the transcript after a correct recovery, which is the authored counterfactual: the same run that reached for the antidote before stopping the oxidant can still reach a correct handoff.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['methemoglobinemia-saturation-gap-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways to seed 5271 for deterministic replay through the shared engine, including the two time-gated checkpoints.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Six observed-state prompts at version ${METHEMOGLOBINEMIA_TUTOR_VERSION} read the learner's own recorded steps; unassisted is silent and coached withholds the single non-urgent beat. Worked example ${METHEMOGLOBINEMIA_DEMONSTRATION_VERSION} drives the ordinary controls through the real engine to handoff. Both refuse to settle the saturation gap by picking a winner: the oximeter, the blood gas and the calculated saturation are each right about what they measure and none of them measures what her hemoglobin is carrying, so the gap is kept as the finding rather than the answer. Both put the co-oximetry and the antidote's two named hazards — severe hemolysis in G6PD deficiency, serotonin toxicity with serotonergic medicines — in the same look, because reaching for methylene blue the moment the blood looks brown is the shortcut this bedside invites. Neither selects a product, dose, route, or eligibility result, and neither reads the later pulse oximetry or the fallen level as proof of a treatment effect. A test asserts nothing anywhere confirms the diagnosis, claims the antidote worked, or excludes rebound. tests/unit/methemoglobinemia-saturation-gap-demonstration.test.ts and tests/ui/toxicology-methemoglobinemia-saturation-gap.test.tsx verify observed response, silence when unassisted, stable controls while watching, and version binding.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Automated UI, observed-state and replay checks exist. Exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation remains pending.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['The scenario inherits the shared report control and has an exact-version Worker catalog record. Complete four-surface runtime evidence is not yet bound.'] },
  ];
}
