import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { ACUTE_DELIRIUM_REVERSIBLE_CAUSES } from './scenarios/acute-delirium-reversible-causes';
import { DELIRIUM_FIXTURES } from './acute-delirium-reversible-causes-fixtures';
import { DELIRIUM_TUTOR_VERSION } from './tutor/acute-delirium-reversible-causes-guidance';
import { DELIRIUM_DEMONSTRATION_VERSION } from './demo/acute-delirium-reversible-causes-demonstration';

/**
 * Exact-version evidence for one lesson, and no claim about any other.
 *
 * `observable-objectives` is deliberately not answered here. This scenario
 * declares six objectives against a cap of five, which is a content-design
 * decision affecting scenarios across several modules rather than something
 * this file may settle on its own. The shared audit keeps naming it.
 */
export function deliriumCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'neurology' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== DELIRIUM_FIXTURES.scenarioId
    || scenario.metadata.version !== '0.1.0' || DELIRIUM_FIXTURES.contentVersion !== '0.1.0'
    || DELIRIUM_FIXTURES.seed !== 6638
    || DELIRIUM_TUTOR_VERSION !== '0.1.0' || DELIRIUM_DEMONSTRATION_VERSION !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(ACUTE_DELIRIUM_REVERSIBLE_CAUSES)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['acute-delirium-reversible-causes-fixtures.ts binds seed 6638 and content 0.1.0 to expert, workup-before-baseline error, recovery, and no-action paths. The baseline history, the ten-hour fluctuation, the qualified 4AT and examination, and the fixed 6-hour contributor report are authored constants; no delirium, contributor or recovery model is claimed, and no outcome follows from any choice. tests/integration/acute-delirium-reversible-causes-runs.test.ts replays every path frame-for-frame across all three guidance levels and both practice regions.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['The lesson advances through six recorded steps on the shared simulation clock, two of them time-gated: the later contributor and cognitive review refuses until simulated time has passed since the contributor boundary, and the handoff refuses until time has passed since that. What arrives is a list of contributors rather than a cause, and the attention still fails after three months backward.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Six declared decisions anchor on a baseline her daughter can describe, name delirium against it while refusing both dementia and single-cause closure, bring nursing, pharmacy, family, falls, capacity, mobility, pain, nutrition, bladder, bowel, sensory, sleep and safeguarding ownership in as the intervention, review the ordinary reversible contributors with least-restrictive safety, compare a fixed later report, and hand off active risk. Order is enforced rather than suggested, and refusal names the missing step. The lesson takes no history, examines nobody, calculates no score, assesses no capacity, and selects no restraint, observation level, or drug.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The branch ends at active-risk handoff. Later actions cannot restart an ended branch, and the ending certifies no single proven cause, no treatment effect, no cognitive recovery, no capacity conclusion, no disposition, no prognosis and no outcome.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['src/modules/anesthesia/ui/Debrief.tsx maps all six objectives to accepted engine events; the no-action path meets none and the expert path meets all six. Refused out-of-order attempts stay visible in the transcript after a correct recovery, which is the authored counterfactual: the same run that went to the contributors before establishing the baseline can still reach a correct handoff.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['acute-delirium-reversible-causes-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways to seed 6638 for deterministic replay through the shared engine, including the two time-gated checkpoints.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Six observed-state prompts at version ${DELIRIUM_TUTOR_VERSION} read the learner's own recorded steps; unassisted is silent and coached withholds the single non-urgent beat. Worked example ${DELIRIUM_DEMONSTRATION_VERSION} drives the ordinary controls through the real engine to handoff. Both anchor everything on who she was at eight o'clock this morning, because an eighty-two-year-old with fluctuating confusion is read as dementia unless somebody establishes the baseline — and the person who can supply it is her daughter, who is treated as part of the care rather than a visitor. Both keep the withdrawn stretches inside the diagnosis rather than outside it, since that is the half recorded as settled. The 4AT of 8 is described as supporting an assessment a qualified clinician has already made rather than a diagnosis the learner calculates, and explicitly not a severity scale, cause finder, capacity test or dementia label. The second refusal is a single cause: the six-hour review returns a bladder holding 690 mL, diphenhydramine given eight hours before the first recorded change, poor intake, movement pain, fragmented sleep and hearing aids in a drawer — none of them the cause and all of them contributors. Safety stays least-restrictive throughout, and the ending is improvement without resolution. A test asserts nothing anywhere scores her, assesses capacity, selects a restraint, or proves a cause. tests/unit/acute-delirium-reversible-causes-demonstration.test.ts and tests/ui/neurology-acute-delirium.test.tsx verify observed response, silence when unassisted, stable controls while watching, and version binding.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Automated UI, observed-state and replay checks exist. Exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation remains pending.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['The scenario inherits the shared report control and has an exact-version Worker catalog record. Complete four-surface runtime evidence is not yet bound.'] },
  ];
}
