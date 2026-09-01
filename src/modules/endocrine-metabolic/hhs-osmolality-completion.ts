import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { HHS_OSMOLALITY_TRAJECTORY } from './scenarios/hhs-osmolality-trajectory';
import { HHS_OSMOLALITY_FIXTURES } from './hhs-osmolality-fixtures';
import { HHS_OSMOLALITY_TUTOR_VERSION } from './tutor/hhs-osmolality-guidance';
import { HHS_OSMOLALITY_DEMONSTRATION_VERSION } from './demo/hhs-osmolality-demonstration';

/**
 * Exact-version evidence for one lesson, and no claim about any other.
 *
 * `observable-objectives` is deliberately not answered here. This scenario
 * declares six objectives against a cap of five, which is a content-design
 * decision affecting 118 scenarios across four modules rather than something
 * this file may settle on its own. The shared audit keeps naming it.
 */
export function hhsOsmolalityCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'endocrine-metabolic' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== HHS_OSMOLALITY_FIXTURES.scenarioId
    || scenario.metadata.version !== '0.1.0' || HHS_OSMOLALITY_FIXTURES.contentVersion !== '0.1.0'
    || HHS_OSMOLALITY_FIXTURES.seed !== 4912
    || HHS_OSMOLALITY_TUTOR_VERSION !== '0.1.0' || HHS_OSMOLALITY_DEMONSTRATION_VERSION !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(HHS_OSMOLALITY_TRAJECTORY)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['hhs-osmolality-fixtures.ts binds seed 4912 and content 0.1.0 to expert, ordering-error, recovery, and no-action paths. The presenting panel, the osmolality values and the 4-hour report are authored constants; no fluid, insulin or osmolality-response model is claimed, and the quoted average rates describe this authored contrast rather than a target. tests/integration/hhs-osmolality-runs.test.ts replays every path frame-for-frame across all three guidance levels and both practice regions.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['The lesson advances through six recorded steps on the shared simulation clock, two of them time-gated: the fixed report refuses until simulated time has passed since the correction review, and the handoff refuses until time has passed since the report. What moves between them is which claim the record can support — three values improve while hyperosmolality, urine output and cognition do not.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Six declared decisions confirm qualified ownership, connect four days of symptoms to the panel, recognize hyperosmolar illness without closing on glucose, sodium or ketones alone, review what cautious correction must be followed by, read the fixed report, and hand off active risk. Order is enforced rather than suggested: recognizing before reconciling, or handing off before the report, is refused with the reason named. The lesson selects no fluid, insulin, dose, rate, or route.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The branch ends at active-risk handoff. Later actions cannot restart an ended branch, and the ending certifies no HHS resolution, no correction-safety claim between the two reports, no durable stability, no safe disposition, and no outcome.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['src/modules/anesthesia/ui/Debrief.tsx maps all six objectives to accepted engine events; the no-action path meets none and the expert path meets all six. Refused out-of-order attempts stay visible in the transcript after a correct recovery, which is the authored counterfactual: the same run that read the low ketones as reassurance can still reach a correct handoff.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['hhs-osmolality-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways to seed 4912 for deterministic replay through the shared engine, including the two time-gated checkpoints.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Six observed-state prompts at version ${HHS_OSMOLALITY_TUTOR_VERSION} read the learner's own recorded steps; unassisted is silent and coached withholds the single non-urgent beat. Worked example ${HHS_OSMOLALITY_DEMONSTRATION_VERSION} drives the ordinary controls through the real engine to handoff. Both are held to the lesson's own restraint: neither says whether she is improving, because this lesson can be failed twice with the same error — low ketones read as a mild illness, and three improved values read as recovery. A test asserts the closing narration names what is still moving and withholds resolution, durable stability, and outcome. tests/unit/endocrine-hhs-demonstration.test.ts and tests/ui/endocrine-hhs.test.tsx verify observed response, silence when unassisted, stable controls while watching, and version binding.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Automated UI, observed-state and replay checks exist. Exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation remains pending.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['The scenario inherits the shared report control and has an exact-version Worker catalog record. Complete four-surface runtime evidence is not yet bound.'] },
  ];
}
