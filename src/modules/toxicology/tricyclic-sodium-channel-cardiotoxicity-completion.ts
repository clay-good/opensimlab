import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { TRICYCLIC_SODIUM_CHANNEL_CARDIOTOXICITY } from './scenarios/tricyclic-sodium-channel-cardiotoxicity';
import { TRICYCLIC_FIXTURES } from './tricyclic-sodium-channel-cardiotoxicity-fixtures';
import { TRICYCLIC_TUTOR_VERSION } from './tutor/tricyclic-sodium-channel-cardiotoxicity-guidance';
import { TRICYCLIC_DEMONSTRATION_VERSION } from './demo/tricyclic-sodium-channel-cardiotoxicity-demonstration';

/**
 * Exact-version evidence for one lesson, and no claim about any other.
 *
 * `observable-objectives` is deliberately not answered here. This scenario
 * declares six objectives against a cap of five, which is a content-design
 * decision affecting scenarios across several modules rather than something
 * this file may settle on its own. The shared audit keeps naming it.
 */
export function tricyclicCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'toxicology' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== TRICYCLIC_FIXTURES.scenarioId
    || scenario.metadata.version !== '0.1.0' || TRICYCLIC_FIXTURES.contentVersion !== '0.1.0'
    || TRICYCLIC_FIXTURES.seed !== 5463
    || TRICYCLIC_TUTOR_VERSION !== '0.1.0' || TRICYCLIC_DEMONSTRATION_VERSION !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(TRICYCLIC_SODIUM_CHANNEL_CARDIOTOXICITY)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['tricyclic-sodium-channel-cardiotoxicity-fixtures.ts binds seed 5463 and content 0.1.0 to expert, treat-before-assembling error, recovery, and no-action paths. The presentation, the supplied ECG report, the gas and chemistry set, and the fixed 3-hour report are authored constants; no conduction, absorption, alkalinization, or rescue model is claimed, and no outcome follows from any choice. tests/integration/tricyclic-sodium-channel-cardiotoxicity-runs.test.ts replays every path frame-for-frame across all three guidance levels and both practice regions.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['The lesson advances through six recorded steps on the shared simulation clock, two of them time-gated: the bounded bicarbonate and refractory-rescue intent refuses until simulated time has passed since the evidence review, and the handoff refuses until time has passed since that. What moves is not the diagnosis, which never closes, but what the record can support about a response that is real and reversible.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Six declared decisions put the product, the seizure and the pressure beside the wide complex, name the sodium-channel pattern without closing on the QRS, assemble airway, seizure, rhythm, perfusion and safety ownership before the second event, read the electrical picture with the pressure, pH and potassium while keeping the rescue question open, record bounded bicarbonate and rescue-preparedness intent, and hand off active risk. Order is enforced rather than suggested, and refusal names the missing step. The lesson takes no history, acquires or interprets no ECG, and selects no charcoal, solution, concentration, dose, route, access, fluid, vasopressor, seizure drug, antiarrhythmic, airway technique, ventilation setting, pacing, lipid, or extracorporeal support.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The branch ends at active-risk handoff. Later actions cannot restart an ended branch, and the ending certifies no confirmed diagnosis, no proven treatment effect, no durable electrical or perfusion stability, no excluded seizure recurrence or coingestion, no determined rescue eligibility, safety or disposition, and no outcome.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['src/modules/anesthesia/ui/Debrief.tsx maps all six objectives to accepted engine events; the no-action path meets none and the expert path meets all six. Refused out-of-order attempts stay visible in the transcript after a correct recovery, which is the authored counterfactual: the same run that went at the poisoning before anyone was assembled for it can still reach a correct handoff.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['tricyclic-sodium-channel-cardiotoxicity-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways to seed 5463 for deterministic replay through the shared engine, including the two time-gated checkpoints.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Six observed-state prompts at version ${TRICYCLIC_TUTOR_VERSION} read the learner's own recorded steps; unassisted is silent and coached withholds the single non-urgent beat. Worked example ${TRICYCLIC_DEMONSTRATION_VERSION} drives the ordinary controls through the real engine to handoff. A regular wide-complex tachycardia with a low pressure comes with an obvious script, and both say why following it here is the harm: the sodium-channel blockade that widened the QRS is what a sodium-channel-blocking antiarrhythmic would add to. Both refuse QRS-only closure — one interval, one aVR finding, one anticholinergic clue or one concentration cannot diagnose or grade this — and both assemble airway, seizure, rhythm and perfusion ownership on the argument that she has already had one seizure and one episode of hypotension, so the second of each will not wait for the room. Both read the narrower QRS at three hours as a response that is real and reversible rather than as a resolution, with redistribution continuing, recurrence open, no coingestant excluded and the potassium still moving. A test asserts nothing anywhere calls her stable, attributes the response, or selects an antiarrhythmic, airway, or rescue. tests/unit/tricyclic-sodium-channel-cardiotoxicity-demonstration.test.ts and tests/ui/toxicology-tricyclic-sodium-channel-cardiotoxicity.test.tsx verify observed response, silence when unassisted, stable controls while watching, and version binding.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Automated UI, observed-state and replay checks exist. Exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation remains pending.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['The scenario inherits the shared report control and has an exact-version Worker catalog record. Complete four-surface runtime evidence is not yet bound.'] },
  ];
}
