import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { CARBON_MONOXIDE_REASSURING_MONITOR } from './scenarios/carbon-monoxide-reassuring-monitor';
import { CARBON_MONOXIDE_FIXTURES } from './carbon-monoxide-reassuring-monitor-fixtures';
import { CARBON_MONOXIDE_TUTOR_VERSION } from './tutor/carbon-monoxide-reassuring-monitor-guidance';
import { CARBON_MONOXIDE_DEMONSTRATION_VERSION } from './demo/carbon-monoxide-reassuring-monitor-demonstration';

/**
 * Exact-version evidence for one lesson, and no claim about any other.
 *
 * `observable-objectives` is deliberately not answered here. This scenario
 * declares six objectives against a cap of five, which is a content-design
 * decision affecting scenarios across several modules rather than something
 * this file may settle on its own. The shared audit keeps naming it.
 */
export function carbonMonoxideCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'toxicology' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== CARBON_MONOXIDE_FIXTURES.scenarioId
    || scenario.metadata.version !== '0.1.0' || CARBON_MONOXIDE_FIXTURES.contentVersion !== '0.1.0'
    || CARBON_MONOXIDE_FIXTURES.seed !== 5312
    || CARBON_MONOXIDE_TUTOR_VERSION !== '0.1.0' || CARBON_MONOXIDE_DEMONSTRATION_VERSION !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(CARBON_MONOXIDE_REASSURING_MONITOR)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['carbon-monoxide-reassuring-monitor-fixtures.ts binds seed 5312 and content 0.1.0 to expert, scene-skipped error, recovery, and no-action paths. The presentation, the co-oximetry value with its timing, and the fixed later report are authored constants; no uptake, elimination, or hyperbaric-response model is claimed, and no outcome follows from any choice. tests/integration/carbon-monoxide-reassuring-monitor-runs.test.ts replays every path frame-for-frame across all three guidance levels and both practice regions.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['The lesson advances through six recorded steps on the shared simulation clock, two of them time-gated: the hyperbaric consultation and strict reassessment refuse until simulated time has passed since the severity review, and the handoff refuses until time has passed since that. What moves is not the diagnosis, which never closes, but what the record can support about a poisoning whose delayed half has not happened yet.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Six declared decisions put the exposure, clock and syncope beside the reassuring oximetry, name the suspected pattern while recording why a normal SpO2 cannot argue with it, act on the source, the scene and the co-exposed partner as well as the patient, read the carboxyhemoglobin with its timing rather than as a grade, record hyperbaric review as an individualized consultation, and hand off active risk. Order is enforced rather than suggested, and refusal names the missing step. The lesson takes no history, acquires no sample, and selects no oxygen, chamber, pressure, duration, transport, or eligibility result.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The branch ends at active-risk handoff. Later actions cannot restart an ended branch, and the ending certifies no confirmed diagnosis, no proven treatment effect, no complete clearance, no durable neurologic recovery, no excluded delayed neurologic or cardiac complication, no excluded co-exposure, no disposition, and no outcome.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['src/modules/anesthesia/ui/Debrief.tsx maps all six objectives to accepted engine events; the no-action path meets none and the expert path meets all six. Refused out-of-order attempts stay visible in the transcript after a correct recovery, which is the authored counterfactual: the same run that moved to the severity argument before the scene can still reach a correct handoff.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['carbon-monoxide-reassuring-monitor-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways to seed 5312 for deterministic replay through the shared engine, including the two time-gated checkpoints.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Six observed-state prompts at version ${CARBON_MONOXIDE_TUTOR_VERSION} read the learner's own recorded steps; unassisted is silent and coached withholds the single non-urgent beat. Worked example ${CARBON_MONOXIDE_DEMONSTRATION_VERSION} drives the ordinary controls through the real engine to handoff. Both carry two refusals the whole way: a conventional two-wavelength pulse oximeter cannot rule out carbon-monoxide poisoning, so the reassuring 99% is a finding to explain rather than evidence against it, and carboxyhemoglobin does not reliably grade severity or predict outcome, so the 28% is read with its post-removal post-oxygen timing beside it instead of as a score. Both keep the partner who breathed the same air in view as a second patient rather than a line in this one's history, and both treat hyperbaric review as an individualized consultation with no universal threshold, chamber, pressure, duration, transport, or eligibility result named. Neither reads the later report as a treatment effect or as delayed neurologic sequelae excluded. A test asserts nothing anywhere grades him by the number, clears him, or excludes the delayed half. tests/unit/carbon-monoxide-reassuring-monitor-demonstration.test.ts and tests/ui/toxicology-carbon-monoxide-reassuring-monitor.test.tsx verify observed response, silence when unassisted, stable controls while watching, and version binding.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Automated UI, observed-state and replay checks exist. Exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation remains pending.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['The scenario inherits the shared report control and has an exact-version Worker catalog record. Complete four-surface runtime evidence is not yet bound.'] },
  ];
}
