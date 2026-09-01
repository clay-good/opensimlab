import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { NEONATAL_TENSION_PNEUMOTHORAX } from './scenarios/neonatal-tension-pneumothorax';
import { TENSION_PNEUMOTHORAX_FIXTURES } from './neonatal-tension-pneumothorax-fixtures';
import { TENSION_PNEUMOTHORAX_TUTOR_VERSION } from './tutor/neonatal-tension-pneumothorax-guidance';
import { TENSION_PNEUMOTHORAX_DEMONSTRATION_VERSION } from './demo/neonatal-tension-pneumothorax-demonstration';

/**
 * Exact-version evidence for one lesson, and no claim about any other.
 *
 * `observable-objectives` is deliberately not answered here. This scenario
 * declares six objectives against a cap of five, which is a content-design
 * decision affecting scenarios across four modules rather than something this
 * file may settle on its own. The shared audit keeps naming it.
 */
export function tensionPneumothoraxCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'neonatology' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== TENSION_PNEUMOTHORAX_FIXTURES.scenarioId
    || scenario.metadata.version !== '0.1.0' || TENSION_PNEUMOTHORAX_FIXTURES.contentVersion !== '0.1.0'
    || TENSION_PNEUMOTHORAX_FIXTURES.seed !== 4931
    || TENSION_PNEUMOTHORAX_TUTOR_VERSION !== '0.1.0' || TENSION_PNEUMOTHORAX_DEMONSTRATION_VERSION !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(NEONATAL_TENSION_PNEUMOTHORAX)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['neonatal-tension-pneumothorax-fixtures.ts binds seed 4931 and content 0.1.0 to expert, ordering-error, recovery, and no-action paths. The presentation and the fixed 2-minute postdecompression report are authored constants; no air-leak, decompression-response, or oxygenation model is claimed, and no outcome follows from any choice. tests/integration/neonatal-tension-pneumothorax-runs.test.ts replays every path frame-for-frame across all three guidance levels and both practice regions.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['The lesson advances through six recorded steps on the shared simulation clock, two of them time-gated: the fixed report refuses until simulated time has passed since the boundary review, and the handoff refuses until time has passed since the report. What moves is not the diagnosis, which never closes, but what the record can support about a response that is real and incomplete.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Six declared decisions confirm a decompression-capable team, connect the running support to the clocked deterioration, recognize the suspected pattern without waiting for imaging, review what the guidance settles and what stays local-protocol work, read the fixed report, and hand off active risk. Order is enforced rather than suggested, and refusal names the missing step. The lesson selects no device, size, site, analgesia, ventilation change, drain, or imaging.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The branch ends at active-risk handoff. Later actions cannot restart an ended branch, and the ending certifies no confirmed diagnosis, no excluded alternative, no resolved air leak, no durable oxygenation or circulation, no disposition, and no outcome for the newborn or the parents.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['src/modules/anesthesia/ui/Debrief.tsx maps all six objectives to accepted engine events; the no-action path meets none and the expert path meets all six. Refused out-of-order attempts stay visible in the transcript after a correct recovery, which is the authored counterfactual: the same run that recognized before reconciling can still reach a correct handoff.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['neonatal-tension-pneumothorax-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways to seed 4931 for deterministic replay through the shared engine, including the two time-gated checkpoints.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Six observed-state prompts at version ${TENSION_PNEUMOTHORAX_TUTOR_VERSION} read the learner's own recorded steps; unassisted is silent and coached withholds the single non-urgent beat. Worked example ${TENSION_PNEUMOTHORAX_DEMONSTRATION_VERSION} drives the ordinary controls through the real engine to handoff. Both hold two statements together that sound contradictory and are not: emergency decompression should not wait for radiography, and this remains a suspicion with obstruction, displacement, equipment failure, atelectasis, hemorrhage and infection open. Neither is softened to make the other easier, and a test asserts no prompt or narration confirms the diagnosis or excludes an alternative. Neither selects a device, size, site, or analgesia, and the example finishes on a response described as improvement without resolution rather than on a rescue. tests/unit/neonatal-tension-pneumothorax-demonstration.test.ts and tests/ui/neonatology-tension-pneumothorax.test.tsx verify observed response, silence when unassisted, stable controls while watching, and version binding.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Automated UI, observed-state and replay checks exist. Exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation remains pending.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['The scenario inherits the shared report control and has an exact-version Worker catalog record. Complete four-surface runtime evidence is not yet bound.'] },
  ];
}
