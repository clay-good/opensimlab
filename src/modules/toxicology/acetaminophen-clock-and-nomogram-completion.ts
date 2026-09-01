import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { ACETAMINOPHEN_CLOCK_AND_NOMOGRAM } from './scenarios/acetaminophen-clock-and-nomogram';
import { ACETAMINOPHEN_FIXTURES } from './acetaminophen-clock-and-nomogram-fixtures';
import { ACETAMINOPHEN_TUTOR_VERSION } from './tutor/acetaminophen-clock-and-nomogram-guidance';
import { ACETAMINOPHEN_DEMONSTRATION_VERSION } from './demo/acetaminophen-clock-and-nomogram-demonstration';

/**
 * Exact-version evidence for one lesson, and no claim about any other.
 *
 * `observable-objectives` is deliberately not answered here. This scenario
 * declares six objectives against a cap of five, which is a content-design
 * decision affecting scenarios across several modules rather than something
 * this file may settle on its own. The shared audit keeps naming it.
 */
export function acetaminophenCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'toxicology' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== ACETAMINOPHEN_FIXTURES.scenarioId
    || scenario.metadata.version !== '0.1.0' || ACETAMINOPHEN_FIXTURES.contentVersion !== '0.1.0'
    || ACETAMINOPHEN_FIXTURES.seed !== 5388
    || ACETAMINOPHEN_TUTOR_VERSION !== '0.1.0' || ACETAMINOPHEN_DEMONSTRATION_VERSION !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(ACETAMINOPHEN_CLOCK_AND_NOMOGRAM)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['acetaminophen-clock-and-nomogram-fixtures.ts binds seed 5388 and content 0.1.0 to expert, plot-before-applicability error, recovery, and no-action paths. The presentation, the 6-hour level with its qualified plot position, the baseline laboratory set, and the fixed 22-hour report are authored constants; no absorption, elimination, hepatotoxicity, or antidote-response model is claimed, and no outcome follows from any choice. tests/integration/acetaminophen-clock-and-nomogram-runs.test.ts replays every path frame-for-frame across all three guidance levels and both practice regions.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['The lesson advances through six recorded steps on the shared simulation clock, two of them time-gated: the bounded acetylcysteine intent and strict later review refuse until simulated time has passed since the evidence review, and the handoff refuses until time has passed since that. What moves is not the diagnosis, which never closes, but what the record can support about an injury that has had time to start and not time to show.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Six declared decisions fix the product and the clock without using the reported tablet count, test whether this ingestion is the kind the nomogram was built for before reading where the point lands, place the qualified owners including nonjudgmental safety ownership, read the timed level with the baseline laboratory set in context, record bounded antidote intent, and hand off active risk. Order is enforced rather than suggested, and refusal names the missing step. The lesson takes no history, acquires no sample, plots or calculates nothing, and selects no charcoal, product, dose, route, access, or stopping point.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The branch ends at active-risk handoff. Later actions cannot restart an ended branch, and the ending certifies no confirmed diagnosis, no proven treatment effect, no authorized stop, no excluded delayed absorption, liver injury, or coingestion, no determined safety or disposition, and no outcome.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['src/modules/anesthesia/ui/Debrief.tsx maps all six objectives to accepted engine events; the no-action path meets none and the expert path meets all six. Refused out-of-order attempts stay visible in the transcript after a correct recovery, which is the authored counterfactual: the same run that read the level before asking whether the nomogram applied can still reach a correct handoff.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['acetaminophen-clock-and-nomogram-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways to seed 5388 for deterministic replay through the shared engine, including the two time-gated checkpoints.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Six observed-state prompts at version ${ACETAMINOPHEN_TUTOR_VERSION} read the learner's own recorded steps; unassisted is silent and coached withholds the single non-urgent beat. Worked example ${ACETAMINOPHEN_DEMONSTRATION_VERSION} drives the ordinary controls through the real engine to handoff. A tool that answers cleanly teaches nothing about when it applies, so both spend their weight on the four conditions that make this plot mean anything — a single acute ingestion, a witnessed completion time, an immediate-release product, and a sample at least four hours after — and name what each one being false would turn this into instead. Both keep two things that look like reassurance out of the reasoning: the reported tablet count, which is a story rather than a measurement, and the normal baseline liver panel, which is six hours old in an injury that takes longer than that to appear. Both treat her safety as part of the care rather than as something after it, and both refuse the stop the 22-hour numbers appear to offer: no automatic 20- or 21-hour stop, no proven treatment effect, no excluded delayed absorption or evolving liver injury. A test asserts nothing anywhere plots, doses, stops, or clears her. tests/unit/acetaminophen-clock-and-nomogram-demonstration.test.ts and tests/ui/toxicology-acetaminophen-clock-and-nomogram.test.tsx verify observed response, silence when unassisted, stable controls while watching, and version binding.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Automated UI, observed-state and replay checks exist. Exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation remains pending.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['The scenario inherits the shared report control and has an exact-version Worker catalog record. Complete four-surface runtime evidence is not yet bound.'] },
  ];
}
