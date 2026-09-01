import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { BETA_BLOCKER_CARDIOGENIC_SHOCK } from './scenarios/beta-blocker-cardiogenic-shock';
import { BETA_BLOCKER_FIXTURES } from './beta-blocker-cardiogenic-shock-fixtures';
import { BETA_BLOCKER_TUTOR_VERSION } from './tutor/beta-blocker-cardiogenic-shock-guidance';
import { BETA_BLOCKER_DEMONSTRATION_VERSION } from './demo/beta-blocker-cardiogenic-shock-demonstration';

/**
 * Exact-version evidence for one lesson, and no claim about any other.
 *
 * `observable-objectives` is deliberately not answered here. This scenario
 * declares six objectives against a cap of five, which is a content-design
 * decision affecting scenarios across several modules rather than something
 * this file may settle on its own. The shared audit keeps naming it.
 */
export function betaBlockerCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'toxicology' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== BETA_BLOCKER_FIXTURES.scenarioId
    || scenario.metadata.version !== '0.1.0' || BETA_BLOCKER_FIXTURES.contentVersion !== '0.1.0'
    || BETA_BLOCKER_FIXTURES.seed !== 5504
    || BETA_BLOCKER_TUTOR_VERSION !== '0.1.0' || BETA_BLOCKER_DEMONSTRATION_VERSION !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(BETA_BLOCKER_CARDIOGENIC_SHOCK)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['beta-blocker-cardiogenic-shock-fixtures.ts binds seed 5504 and content 0.1.0 to expert, pulse-only-closure error, recovery, and no-action paths. The presentation, the supplied ECG and focused cardiac assessment, the metabolic set, the treating team’s failed prior care, and the fixed 45-minute report are authored constants; no receptor, contractility, vasopressor, glucagon, insulin-euglycemia, or rescue model is claimed, and no outcome follows from any choice. tests/integration/beta-blocker-cardiogenic-shock-runs.test.ts replays every path frame-for-frame across all three guidance levels and both practice regions.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['The lesson advances through six recorded steps on the shared simulation clock, two of them time-gated: the bounded vasopressor, glucagon, insulin-euglycemia and rescue intent refuses until simulated time has passed since the evidence review, and the handoff refuses until time has passed since that. What moves is not the diagnosis, which never closes, but what the record can support about a perfusion that is better and a treatment whose own effects are now the thing to watch.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Six declared decisions say the pressure, mentation and glucose rather than only the rate, name the presentation as shock rather than bradycardia, assemble a room for a shock expected to be difficult, read the contractility, glucose and failed prior care together while naming what the treatment will do to the metabolic numbers, record bounded qualified intents, and hand off active risk. Order is enforced rather than suggested, and refusal names the missing step. The lesson takes no history, acquires or interprets no ECG or imaging, and selects no decontamination, glucose, electrolyte, fluid, product, dose, rate, target, route, access, airway, ventilation, pacing, dialysis, lipid, or extracorporeal support.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The branch ends at active-risk handoff. Later actions cannot restart an ended branch, and the ending certifies no confirmed diagnosis, no proven treatment effect, no durable perfusion, glucose or electrolyte stability, no excluded coingestion, no determined rescue eligibility, safety or disposition, and no outcome.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['src/modules/anesthesia/ui/Debrief.tsx maps all six objectives to accepted engine events; the no-action path meets none and the expert path meets all six. Refused out-of-order attempts stay visible in the transcript after a correct recovery, which is the authored counterfactual: the same run that committed on the pulse can still reach a correct handoff.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['beta-blocker-cardiogenic-shock-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways to seed 5504 for deterministic replay through the shared engine, including the two time-gated checkpoints.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Six observed-state prompts at version ${BETA_BLOCKER_TUTOR_VERSION} read the learner's own recorded steps; unassisted is silent and coached withholds the single non-urgent beat. Worked example ${BETA_BLOCKER_DEMONSTRATION_VERSION} drives the ordinary controls through the real engine to handoff. A rate of 42 invites a rate answer, and both spend their weight on why that is the wrong end of the problem: globally reduced left ventricular contraction with a lactate of 3.8 is a pump that is not moving blood rather than a clock running slow, so closing on the pulse — or on pacing — answers the visible half and leaves the other one. Both keep the glucose of 62 inside the poisoning rather than beside it, and both read the treating team's failed atropine and first vasopressor as information rather than as a gap. Both then name the awkward property of the treatment: a high-dose-insulin approach makes glucose and potassium surveillance part of the therapy rather than a check on it, which is why the 45-minute glucose of 104 and potassium of 3.5 are described as the therapy showing up in the chart rather than as the patient improving. A test asserts nothing anywhere calls her stable, attributes the response, or selects a pacing, dialysis, lipid, or extracorporeal option. tests/unit/beta-blocker-cardiogenic-shock-demonstration.test.ts and tests/ui/toxicology-beta-blocker-cardiogenic-shock.test.tsx verify observed response, silence when unassisted, stable controls while watching, and version binding.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Automated UI, observed-state and replay checks exist. Exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation remains pending.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['The scenario inherits the shared report control and has an exact-version Worker catalog record. Complete four-surface runtime evidence is not yet bound.'] },
  ];
}
