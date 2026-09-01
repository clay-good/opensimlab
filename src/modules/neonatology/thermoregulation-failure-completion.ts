import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { THERMOREGULATION_FAILURE } from './scenarios/thermoregulation-failure';
import { THERMOREGULATION_FIXTURES } from './thermoregulation-failure-fixtures';
import { THERMOREGULATION_TUTOR_VERSION } from './tutor/thermoregulation-failure-guidance';
import { THERMOREGULATION_DEMONSTRATION_VERSION } from './demo/thermoregulation-failure-demonstration';

/**
 * Exact-version evidence for one lesson, and no claim about any other.
 *
 * `observable-objectives` is deliberately not answered here. This scenario
 * declares six objectives against a cap of five, which is a content-design
 * decision affecting scenarios across four modules rather than something this
 * file may settle on its own. The shared audit keeps naming it.
 */
export function thermoregulationCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'neonatology' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== THERMOREGULATION_FIXTURES.scenarioId
    || scenario.metadata.version !== '0.1.0' || THERMOREGULATION_FIXTURES.contentVersion !== '0.1.0'
    || THERMOREGULATION_FIXTURES.seed !== 4517
    || THERMOREGULATION_TUTOR_VERSION !== '0.1.0' || THERMOREGULATION_DEMONSTRATION_VERSION !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(THERMOREGULATION_FAILURE)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['thermoregulation-failure-fixtures.ts binds seed 4517 and content 0.1.0 to expert, warm-it-first-error, recovery, and no-action paths. The presentation and the fixed 45-minute qualified-team report are authored constants; no rewarming, thermal, or glucose model is claimed, and no outcome follows from any choice. tests/integration/thermoregulation-failure-runs.test.ts replays every path frame-for-frame across all three guidance levels and both practice regions.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['The lesson advances through six recorded steps on the shared simulation clock, two of them time-gated: the fixed report refuses until simulated time has passed since the boundary review, and the handoff refuses until time has passed since the report. What moves is not the cause, which never closes, but what the record can support about a temperature that is rising and has not arrived.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Six declared decisions confirm the thermal, glucose and feeding pathways together, read the trajectory including how good the available explanation is, rewarm immediately while refusing to prescribe a rate, review the warm chain alongside the hyperthermia harm on the other side of it, read the fixed report, and hand off active risk. Order is enforced rather than suggested, and refusal names the missing step. The lesson takes no history, obtains or interprets no temperature, glucose or other test, warms or cools nobody, uses no skin-to-skin care, operates no incubator or warmer, and selects no set point or rewarming rate.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The branch ends at active-risk handoff. Later actions cannot restart an ended branch, and the ending certifies no prescribed rewarming rate, no proven treatment effect, no determined cause, no excluded infection or other illness, no durable thermal or glucose stability, no feeding success, no disposition, and no outcome for the newborn or the parents.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['src/modules/anesthesia/ui/Debrief.tsx maps all six objectives to accepted engine events; the no-action path meets none and the expert path meets all six. Refused out-of-order attempts stay visible in the transcript after a correct recovery, which is the authored counterfactual: the same run that reached for the warming first can still reach a correct handoff.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['thermoregulation-failure-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways to seed 4517 for deterministic replay through the shared engine, including the two time-gated checkpoints. The common-error path moves straight to warming her, which this lesson refuses precisely because the warming-continuity gap explains the cold so neatly that an illness underneath stops being looked for.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Six observed-state prompts at version ${THERMOREGULATION_TUTOR_VERSION} read the learner's own recorded steps; unassisted is silent and coached withholds the single non-urgent beat. Worked example ${THERMOREGULATION_DEMONSTRATION_VERSION} drives the ordinary controls through the real engine to handoff. Both decline the question the lesson is really asked — the evidence does not support prescribing one optimal rapid or slow rewarming rate, and saying so is more useful than picking — and both treat the neat environmental explanation as a reason to keep looking rather than to stop. Both name hyperthermia as a harm in the direction of the treatment, and both state that the separately protocolized therapeutic-hypothermia pathway is not this lesson. A test asserts nothing anywhere prescribes a rate, names a cause, or calls her warm. tests/unit/thermoregulation-failure-demonstration.test.ts and tests/ui/neonatology-thermoregulation-failure.test.tsx verify observed response, silence when unassisted, stable controls while watching, and version binding.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Automated UI, observed-state and replay checks exist. Exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation remains pending.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['The scenario inherits the shared report control and has an exact-version Worker catalog record. Complete four-surface runtime evidence is not yet bound.'] },
  ];
}
