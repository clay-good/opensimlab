import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { NEONATAL_BRADYCARDIA } from './scenarios/neonatal-bradycardia';
import { NEONATAL_BRADYCARDIA_FIXTURES } from './neonatal-bradycardia-fixtures';
import { NEONATAL_BRADYCARDIA_TUTOR_VERSION } from './tutor/neonatal-bradycardia-guidance';
import { NEONATAL_BRADYCARDIA_DEMONSTRATION_VERSION } from './demo/neonatal-bradycardia-demonstration';

/**
 * Exact-version evidence for one lesson, and no claim about any other.
 *
 * `observable-objectives` is deliberately not answered here. This scenario
 * declares six objectives against a cap of five, which is a content-design
 * decision affecting scenarios across four modules rather than something this
 * file may settle on its own. The shared audit keeps naming it.
 */
export function neonatalBradycardiaCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'neonatology' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== NEONATAL_BRADYCARDIA_FIXTURES.scenarioId
    || scenario.metadata.version !== '0.1.0' || NEONATAL_BRADYCARDIA_FIXTURES.contentVersion !== '0.1.0'
    || NEONATAL_BRADYCARDIA_FIXTURES.seed !== 5264
    || NEONATAL_BRADYCARDIA_TUTOR_VERSION !== '0.1.0' || NEONATAL_BRADYCARDIA_DEMONSTRATION_VERSION !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(NEONATAL_BRADYCARDIA)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['neonatal-bradycardia-fixtures.ts binds seed 5264 and content 0.1.0 to expert, threshold-first-error, recovery, and no-action paths. The presentation and the fixed 3-minute qualified-team report are authored constants; no compression, circulation, or oxygenation model is claimed, and no outcome follows from any choice. tests/integration/neonatal-bradycardia-runs.test.ts replays every path frame-for-frame across all three guidance levels and both practice regions.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['The lesson advances through six recorded steps on the shared simulation clock, two of them time-gated: the fixed report refuses until simulated time has passed since the boundary review, and the handoff refuses until time has passed since the report. What moves is not the cause, which never closes, but what the record can support about a response that improved and explained nothing.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Six declared decisions staff compressions and ventilation as two jobs, connect the evidence that the ventilation was already adequate, name both halves of the compression threshold in the order they were met, review coordination with epinephrine kept on the far side of a later branch, read the fixed report, and hand off active risk. Order is enforced rather than suggested, and refusal names the missing step. The lesson compresses nothing, ventilates nothing, places or verifies no airway, obtains no access, and gives no fluid, blood, glucose, epinephrine, or other drug.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The branch ends at active-risk handoff. Later actions cannot restart an ended branch, and the ending certifies no durable circulation, no durable breathing, no stable transition, no neurologic safety, no determined cause, no proven treatment effect, no disposition, and no outcome for the newborn or the parents.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['src/modules/anesthesia/ui/Debrief.tsx maps all six objectives to accepted engine events; the no-action path meets none and the expert path meets all six. Refused out-of-order attempts stay visible in the transcript after a correct recovery, which is the authored counterfactual: the same run that named the threshold before establishing the ventilation can still reach a correct handoff.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['neonatal-bradycardia-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways to seed 5264 for deterministic replay through the shared engine, including the two time-gated checkpoints. This is the module lesson where the compression threshold is genuinely met, and the common-error path still refuses reaching for it before the team and the ventilation evidence are established: being right about the number is not the same as having established it.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Six observed-state prompts at version ${NEONATAL_BRADYCARDIA_TUTOR_VERSION} read the learner's own recorded steps; unassisted is silent and coached withholds the single non-urgent beat. Worked example ${NEONATAL_BRADYCARDIA_DEMONSTRATION_VERSION} drives the ordinary controls through the real engine to handoff. Unlike its neighbours neither argues against the branch, because both halves of the threshold are satisfied here; both insist instead on the evidence that opens it and then decline the inference that would close it. At three minutes the heart rate is 74 after a minute of coordinated compressions, and both state that one authored newborn getting better after a treatment is not evidence the treatment is why. A test asserts nothing anywhere says the compressions worked or that the newborn is stable. tests/unit/neonatal-bradycardia-demonstration.test.ts and tests/ui/neonatology-neonatal-bradycardia.test.tsx verify observed response, silence when unassisted, stable controls while watching, and version binding.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Automated UI, observed-state and replay checks exist. Exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation remains pending.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['The scenario inherits the shared report control and has an exact-version Worker catalog record. Complete four-surface runtime evidence is not yet bound.'] },
  ];
}
