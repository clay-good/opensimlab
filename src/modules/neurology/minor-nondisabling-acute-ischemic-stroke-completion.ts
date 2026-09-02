import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { MINOR_NONDISABLING_ACUTE_ISCHEMIC_STROKE } from './scenarios/minor-nondisabling-acute-ischemic-stroke';
import { MINOR_STROKE_FIXTURES } from './minor-nondisabling-acute-ischemic-stroke-fixtures';
import { MINOR_STROKE_TUTOR_VERSION } from './tutor/minor-nondisabling-acute-ischemic-stroke-guidance';
import { MINOR_STROKE_DEMONSTRATION_VERSION } from './demo/minor-nondisabling-acute-ischemic-stroke-demonstration';

/**
 * Exact-version evidence for one lesson, and no claim about any other.
 *
 * This is the first Neurology lesson to carry its own evidence, so it settles
 * the same seven requirements the finished Toxicology lessons do and leaves the
 * same three. `observable-objectives` is deliberately not answered here: this
 * scenario declares six objectives against a cap of five, which is a
 * content-design decision affecting scenarios across several modules rather
 * than something this file may settle on its own. The shared audit keeps naming
 * it.
 */
export function minorStrokeCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'neurology' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== MINOR_STROKE_FIXTURES.scenarioId
    || scenario.metadata.version !== '0.1.0' || MINOR_STROKE_FIXTURES.contentVersion !== '0.1.0'
    || MINOR_STROKE_FIXTURES.seed !== 6104
    || MINOR_STROKE_TUTOR_VERSION !== '0.1.0' || MINOR_STROKE_DEMONSTRATION_VERSION !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(MINOR_NONDISABLING_ACUTE_ISCHEMIC_STROKE)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['minor-nondisabling-acute-ischemic-stroke-fixtures.ts binds seed 6104 and content 0.1.0 to expert, score-as-the-answer error, recovery, and no-action paths. The presentation, the supplied examination and NIHSS, the fixed CT and CTA, the glucose and observations, and the fixed later report are authored constants; no infarct, antiplatelet, or recovery model is claimed, and no outcome follows from any choice. tests/integration/minor-nondisabling-acute-ischemic-stroke-runs.test.ts replays every path frame-for-frame across all three guidance levels and both practice regions.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['The lesson advances through six recorded steps on the shared simulation clock, two of them time-gated: the later neurological review refuses until simulated time has passed since the qualified intent, and the handoff refuses until time has passed since that. What moves is the record rather than the deficit, which persists without spreading — and a boundary that stays revisable is what the progression is for.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Six declared decisions say what she can still do alongside what she has lost, read the fixed imaging and the authored negatives as snapshots rather than exclusions, name the deficit nondisabling for this particular person while keeping "to date" and "revisable" attached, record qualified antiplatelet-strategy and named surveillance ownership, compare a fixed later report, and hand off active risk. Order is enforced rather than suggested, and refusal names the missing step. The lesson takes no history, examines nobody, calculates no score, adjudicates no disability, excludes no mimic, and selects no product, combination, dose, duration, route, access, blood-pressure target, reperfusion, device, diet, or disposition.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The branch ends at active-risk handoff. Later actions cannot restart an ended branch, and the ending certifies no proven mechanism or etiology, no excluded mimic, no determined thrombolysis or antiplatelet eligibility, no proven treatment effect, no infarct resolution, no excluded hemorrhagic transformation or deterioration, no durable neurologic stability, no complete recovery, no proven low recurrence risk, no discharge readiness or disposition, and no outcome.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['src/modules/anesthesia/ui/Debrief.tsx maps all six objectives to accepted engine events; the no-action path meets none and the expert path meets all six. Refused out-of-order attempts stay visible in the transcript after a correct recovery, which is the authored counterfactual: the same run that treated a score of 1 as the answer can still reach a correct handoff.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['minor-nondisabling-acute-ischemic-stroke-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways to seed 6104 for deterministic replay through the shared engine, including the two time-gated checkpoints.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Six observed-state prompts at version ${MINOR_STROKE_TUTOR_VERSION} read the learner's own recorded steps; unassisted is silent and coached withholds the single non-urgent beat. Worked example ${MINOR_STROKE_DEMONSTRATION_VERSION} drives the ordinary controls through the real engine to handoff. Both are built on the observation that "minor" is doing all the work in this case and none of it is arithmetic: an NIHSS of 1 describes what was found, while whether the deficit disables her is a question about the life of a right-handed retired teacher who writes and uses her phone, and it is hers to answer as much as anyone's. So both say what she can still do in the same breath as what she has lost, and both keep "to date" and "revisable" attached to the boundary, which makes it a status with an expiry rather than a verdict. Both read the fixed CT and CTA as what the imaging says rather than a mechanism, and treat the authored negatives — no seizure, trauma, fever, hypoglycemia or anticoagulant exposure — as snapshots taken once that close neither mimics nor etiology. The ending separates a short window of stability from resolution, treatment effect and low recurrence risk. A test asserts nothing anywhere scores her, adjudicates disability, excludes a mimic, determines eligibility, or calls the deficit resolved. tests/unit/minor-nondisabling-acute-ischemic-stroke-demonstration.test.ts and tests/ui/neurology-minor-nondisabling-acute-ischemic-stroke.test.tsx verify observed response, silence when unassisted, stable controls while watching, and version binding.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Automated UI, observed-state and replay checks exist. Exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation remains pending.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['The scenario inherits the shared report control and has an exact-version Worker catalog record. Complete four-surface runtime evidence is not yet bound.'] },
  ];
}
