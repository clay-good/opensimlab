import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { METASTATIC_SPINAL_CORD_COMPRESSION } from './scenarios/metastatic-spinal-cord-compression';
import { MSCC_FIXTURES } from './metastatic-spinal-cord-compression-fixtures';
import { MSCC_TUTOR_VERSION } from './tutor/metastatic-spinal-cord-compression-guidance';
import { MSCC_DEMONSTRATION_VERSION } from './demo/metastatic-spinal-cord-compression-demonstration';

/**
 * Exact-version evidence for one lesson, and no claim about any other.
 *
 * `observable-objectives` is deliberately not answered here. This scenario
 * declares six objectives against a cap of five, which is a content-design
 * decision affecting scenarios across several modules rather than something
 * this file may settle on its own. The shared audit keeps naming it.
 */
export function msccCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'neurology' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== MSCC_FIXTURES.scenarioId
    || scenario.metadata.version !== '0.1.0' || MSCC_FIXTURES.contentVersion !== '0.1.0'
    || MSCC_FIXTURES.seed !== 6597
    || MSCC_TUTOR_VERSION !== '0.1.0' || MSCC_DEMONSTRATION_VERSION !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(METASTATIC_SPINAL_CORD_COMPRESSION)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['metastatic-spinal-cord-compression-fixtures.ts binds seed 6597 and content 0.1.0 to expert, decided-without-arranging error, recovery, and no-action paths. The presentation, the examination, the emergency boundary, and the fixed 4-hour whole-spine MRI and bladder report are authored constants; no compression, corticosteroid or recovery model is claimed, and no outcome follows from any choice. tests/integration/metastatic-spinal-cord-compression-runs.test.ts replays every path frame-for-frame across all three guidance levels and both practice regions.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['The lesson advances through six recorded steps on the shared simulation clock, two of them time-gated: the later MRI and function review refuses until simulated time has passed since the care-boundary review, and the handoff refuses until time has passed since that. What arrives is the confirmation; what does not move is the examination — hip flexion is 3/5 and the T8 level persists at both ends.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Six declared decisions separate three weeks of pain from forty-eight hours of function and localize the examination to a cord level, name the oncologic emergency before any image confirms it, start a referral chain covering spinal surgery, oncology, radiology, radiotherapy, nursing, pharmacy, rehabilitation, pain, bladder, skin and thrombosis prevention, review whole-spine imaging with individualized stability, corticosteroid and definitive-care boundaries, compare a fixed later report, and hand off active risk. Order is enforced rather than suggested, and refusal names the missing step. The lesson takes no history, examines nobody, moves nobody, orders or interprets no imaging, and selects no drug, dose, or procedure.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The branch ends at active-risk handoff. Later actions cannot restart an ended branch, and the ending certifies no proven treatment effect, no neurologic recovery, no definitive treatment, no disposition, no prognosis and no outcome.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['src/modules/anesthesia/ui/Debrief.tsx maps all six objectives to accepted engine events; the no-action path meets none and the expert path meets all six. Refused out-of-order attempts stay visible in the transcript after a correct recovery, which is the authored counterfactual: the same run that decided what should happen without arranging for it can still reach a correct handoff.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['metastatic-spinal-cord-compression-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways to seed 6597 for deterministic replay through the shared engine, including the two time-gated checkpoints.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Six observed-state prompts at version ${MSCC_TUTOR_VERSION} read the learner's own recorded steps; unassisted is silent and coached withholds the single non-urgent beat. Worked example ${MSCC_DEMONSTRATION_VERSION} drives the ordinary controls through the real engine to handoff. Both separate the three weeks of pain, which is the warning, from the forty-eight hours of function, which is the emergency: independent walking became two-person support, both legs weakened and voiding became difficult, and the examination localizes to a cord level rather than a root. Both then name the emergency before imaging confirms it, because he has not walked since the assessment and what he can do when treatment starts is what is most closely tied to what he will do afterwards — and because no isolated pain feature, bladder symptom, cancer history or examination sign is sufficient alone, it is the constellation being named. Both treat the referral chain as the slow part rather than the decision, listing the teams whose work starts today, and both require whole-spine imaging because disease at other levels changes what the definitive plan must cover. The later report earns that: a T6 lesion with epidural extension and severe compression, plus separate lumbar metastases compressing nothing. The ending gives back an unchanged examination and a bladder holding 780 mL. A test asserts nothing anywhere moves him, orders or interprets imaging, or claims recovery. tests/unit/metastatic-spinal-cord-compression-demonstration.test.ts and tests/ui/neurology-metastatic-spinal-cord-compression.test.tsx verify observed response, silence when unassisted, stable controls while watching, and version binding.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Automated UI, observed-state and replay checks exist. Exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation remains pending.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['The scenario inherits the shared report control and has an exact-version Worker catalog record. Complete four-surface runtime evidence is not yet bound.'] },
  ];
}
