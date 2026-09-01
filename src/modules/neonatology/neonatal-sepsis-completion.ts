import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { NEONATAL_SEPSIS } from './scenarios/neonatal-sepsis';
import { NEONATAL_SEPSIS_FIXTURES } from './neonatal-sepsis-fixtures';
import { NEONATAL_SEPSIS_TUTOR_VERSION } from './tutor/neonatal-sepsis-guidance';
import { NEONATAL_SEPSIS_DEMONSTRATION_VERSION } from './demo/neonatal-sepsis-demonstration';

/**
 * Exact-version evidence for one lesson, and no claim about any other.
 *
 * `observable-objectives` is deliberately not answered here. This scenario
 * declares six objectives against a cap of five, which is a content-design
 * decision affecting scenarios across four modules rather than something this
 * file may settle on its own. The shared audit keeps naming it.
 */
export function neonatalSepsisCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'neonatology' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== NEONATAL_SEPSIS_FIXTURES.scenarioId
    || scenario.metadata.version !== '0.1.0' || NEONATAL_SEPSIS_FIXTURES.contentVersion !== '0.1.0'
    || NEONATAL_SEPSIS_FIXTURES.seed !== 7351
    || NEONATAL_SEPSIS_TUTOR_VERSION !== '0.1.0' || NEONATAL_SEPSIS_DEMONSTRATION_VERSION !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(NEONATAL_SEPSIS)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['neonatal-sepsis-fixtures.ts binds seed 7351 and content 0.1.0 to expert, maternal-record-first-error, recovery, and no-action paths. The presentation and the fixed 1-hour qualified-team report are authored constants; no infection, antimicrobial-response, or perfusion model is claimed, and no outcome follows from any choice. tests/integration/neonatal-sepsis-runs.test.ts replays every path frame-for-frame across all three guidance levels and both practice regions.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['The lesson advances through six recorded steps on the shared simulation clock, two of them time-gated: the fixed report refuses until simulated time has passed since the boundary review, and the handoff refuses until time has passed since the report. What moves is not the diagnosis, which is never made, but what the record can support about a newborn who improved while every question stayed open.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Six declared decisions bring the laboratory and pharmacy in with the clinicians, put the maternal record and the newborn’s own change side by side, let the clinically ill infant end the calculation without claiming a diagnosis, review the culture-before-antibiotics clause with the clause pointing at the treatment, read the fixed report, and hand off active risk. Order is enforced rather than suggested, and refusal names the missing step. The lesson takes no history, calculates no risk, obtains or interprets no culture, count, CRP, glucose, gas, imaging or lumbar puncture, selects no antimicrobial, and names no dose.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The branch ends at active-risk handoff. Later actions cannot restart an ended branch, and the ending certifies no proven treatment effect, no diagnosed sepsis, no excluded bacteremia, meningitis, infection or other cause, no durable stability, no determined antimicrobial duration, no disposition, and no outcome for the newborn or the parents.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['src/modules/anesthesia/ui/Debrief.tsx maps all six objectives to accepted engine events; the no-action path meets none and the expert path meets all six. Refused out-of-order attempts stay visible in the transcript after a correct recovery, which is the authored counterfactual: the same run that concluded from the maternal record can still reach a correct handoff.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['neonatal-sepsis-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways to seed 7351 for deterministic replay through the shared engine, including the two time-gated checkpoints. The common-error path recognizes the risk from the maternal record — the fever, the rupture, the unknown GBS status a calculator wants — before the newborn’s own deterioration has been connected, which is the inversion this lesson exists to refuse.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Six observed-state prompts at version ${NEONATAL_SEPSIS_TUTOR_VERSION} read the learner's own recorded steps; unassisted is silent and coached withholds the single non-urgent beat. Worked example ${NEONATAL_SEPSIS_DEMONSTRATION_VERSION} drives the ordinary controls through the real engine to handoff. Both refuse two instruments in the same breath as they escalate: a risk calculator intended to support structured assessment cannot overrule a clinically ill infant, and no isolated blood count, CRP or other result can diagnose or exclude early-onset sepsis. Both name the maternal antibiotics as the detail most likely to make a room relax, keep the culture-before-antibiotics clause pointing at the treatment rather than the specimen, and select no agent and no dose. A test asserts nothing anywhere diagnoses him, excludes an alternative, or reads the one-hour improvement as a treatment effect. tests/unit/neonatal-sepsis-demonstration.test.ts and tests/ui/neonatology-neonatal-sepsis.test.tsx verify observed response, silence when unassisted, stable controls while watching, and version binding.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Automated UI, observed-state and replay checks exist. Exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation remains pending.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['The scenario inherits the shared report control and has an exact-version Worker catalog record. Complete four-surface runtime evidence is not yet bound.'] },
  ];
}
