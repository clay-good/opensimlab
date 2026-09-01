import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { DKA_RESOLUTION_TRANSITION } from './scenarios/dka-resolution-transition';
import { DKA_RESOLUTION_FIXTURES } from './dka-resolution-fixtures';
import { DKA_RESOLUTION_TUTOR_VERSION } from './tutor/dka-resolution-guidance';
import { DKA_RESOLUTION_DEMONSTRATION_VERSION } from './demo/dka-resolution-demonstration';

/**
 * Exact-version evidence for one lesson, and no claim about any other.
 *
 * `observable-objectives` is deliberately not answered here. This scenario
 * declares six objectives against a cap of five, which is a content-design
 * decision affecting 118 scenarios across four modules rather than something
 * this file may settle on its own. The shared audit keeps naming it.
 */
export function dkaResolutionCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'endocrine-metabolic' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== DKA_RESOLUTION_FIXTURES.scenarioId
    || scenario.metadata.version !== '0.1.0' || DKA_RESOLUTION_FIXTURES.contentVersion !== '0.1.0'
    || DKA_RESOLUTION_FIXTURES.seed !== 4911
    || DKA_RESOLUTION_TUTOR_VERSION !== '0.1.0' || DKA_RESOLUTION_DEMONSTRATION_VERSION !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(DKA_RESOLUTION_TRANSITION)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['dka-resolution-fixtures.ts binds seed 4911 and content 0.1.0 to expert, ordering-error, recovery, and no-action paths. Both supplied panels and the 4-hour report are authored constants; no ketone, acid-base, or insulin-response model is claimed and no outcome follows from any choice. tests/integration/dka-resolution-runs.test.ts replays every path frame-for-frame across all three guidance levels and both practice regions.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['The lesson advances through six recorded steps on the shared simulation clock, and two of them are time-gated: the fixed report refuses until simulated time has passed since the continuity review, and the handoff refuses until time has passed since the report. What moves here is not the patient but which claim the record can support — the observations settle while the biochemical case does not.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Six declared decisions confirm qualified ownership, connect the first panel to the current one across the treatment clock, recognize what the resolution criteria are written in, review continuity and bridged-transition boundaries, read the fixed report, and hand off active risk. Order is enforced rather than suggested: recognizing before reconciling, or handing off before the report, is refused with the reason named. The lesson selects no drug, dose, rate, fluid, or nutrition.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The branch ends at active-risk handoff. Later actions cannot restart an ended branch, and the ending certifies no treatment effect, no independent insulin safety, no durable glucose or potassium stability, no resolved precipitant, no discharge readiness, and no outcome.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['src/modules/anesthesia/ui/Debrief.tsx maps all six objectives to accepted engine events; the no-action path meets none of them and the expert path meets all six. Refused out-of-order attempts remain visible in the transcript after a correct recovery, which is the authored counterfactual: the same run that closed on the glucose can still reach a correct handoff.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['dka-resolution-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways to seed 4911 for deterministic replay through the shared engine, including the two time-gated checkpoints.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Six observed-state prompts at version ${DKA_RESOLUTION_TUTOR_VERSION} read the learner's own recorded steps; unassisted is silent and coached withholds the single non-urgent beat. Worked example ${DKA_RESOLUTION_DEMONSTRATION_VERSION} drives the ordinary controls through the real engine to handoff. Both are held to the lesson's own restraint: neither states whether this patient has resolved before the learner's recognition step records it, and the example ends with the criteria met and the case open — a test asserts the closing narration withholds discharge readiness, durable stability, and outcome. tests/unit/endocrine-dka-resolution-demonstration.test.ts and tests/ui/endocrine-dka-resolution.test.tsx verify observed response, silence when unassisted, stable controls while watching, and version binding.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Automated UI, observed-state and replay checks exist. Exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation remains pending.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['The scenario inherits the shared report control and has an exact-version Worker catalog record. Complete four-surface runtime evidence is not yet bound.'] },
  ];
}
