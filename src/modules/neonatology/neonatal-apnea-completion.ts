import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { NEONATAL_APNEA } from './scenarios/neonatal-apnea';
import { NEONATAL_APNEA_FIXTURES } from './neonatal-apnea-fixtures';
import { NEONATAL_APNEA_TUTOR_VERSION } from './tutor/neonatal-apnea-guidance';
import { NEONATAL_APNEA_DEMONSTRATION_VERSION } from './demo/neonatal-apnea-demonstration';

/**
 * Exact-version evidence for one lesson, and no claim about any other.
 *
 * `observable-objectives` is deliberately not answered here. This scenario
 * declares six objectives against a cap of five, which is a content-design
 * decision affecting scenarios across four modules rather than something this
 * file may settle on its own. The shared audit keeps naming it.
 */
export function neonatalApneaCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'neonatology' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== NEONATAL_APNEA_FIXTURES.scenarioId
    || scenario.metadata.version !== '0.1.0' || NEONATAL_APNEA_FIXTURES.contentVersion !== '0.1.0'
    || NEONATAL_APNEA_FIXTURES.seed !== 1608
    || NEONATAL_APNEA_TUTOR_VERSION !== '0.1.0' || NEONATAL_APNEA_DEMONSTRATION_VERSION !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(NEONATAL_APNEA)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['neonatal-apnea-fixtures.ts binds seed 1608 and content 0.1.0 to expert, threshold-first-error, recovery, and no-action paths. The presentation and the fixed 90-second qualified-team report are authored constants; no ventilation, heart-rate-response, or oxygenation model is claimed, and no outcome follows from any choice. tests/integration/neonatal-apnea-runs.test.ts replays every path frame-for-frame across all three guidance levels and both practice regions.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['The lesson advances through six recorded steps on the shared simulation clock, two of them time-gated: the fixed report refuses until simulated time has passed since the readiness review, and the handoff refuses until time has passed since the report. What moves is not the cause, which never closes, but what the record can support about a response that is working and unfinished.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Six declared decisions name the ventilation owner before naming the problem, connect the birth clock to the initial steps already completed, let the threshold rather than the search for a cause decide, review what effective ventilation means and what stays prepared rather than used, read the fixed report, and hand off active risk. Order is enforced rather than suggested, and refusal names the missing step. The lesson delivers no ventilation, oxygen, airway, corrective step, compression, access, drug, or transport.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The branch ends at active-risk handoff. Later actions cannot restart an ended branch, and the ending certifies no durable spontaneous breathing, no stable transition, no neurologic safety, no determined cause, no disposition, and no outcome for the newborn or the parents.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['src/modules/anesthesia/ui/Debrief.tsx maps all six objectives to accepted engine events; the no-action path meets none and the expert path meets all six. Refused out-of-order attempts stay visible in the transcript after a correct recovery, which is the authored counterfactual: the same run that named the threshold from the number alone can still reach a correct handoff.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['neonatal-apnea-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways to seed 1608 for deterministic replay through the shared engine, including the two time-gated checkpoints. The common-error path starts from the number this lesson is about: a heart rate of 92 named as the threshold before the team was activated or the birth clock connected.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Six observed-state prompts at version ${NEONATAL_APNEA_TUTOR_VERSION} read the learner's own recorded steps; unassisted is silent and coached withholds the single non-urgent beat. Worked example ${NEONATAL_APNEA_DEMONSTRATION_VERSION} drives the ordinary controls through the real engine to handoff. Both narrow rather than widen: everything a newborn resuscitation can offer is in the room, and neither reaches for oxygen, compressions, access, or a cause before the lungs are inflated, because a rising heart rate is what says they are. Neither lets the 90-second number stand in for durable breathing, a stable transition, neurologic safety, or a diagnosis, and a test asserts nothing anywhere calls him recovered, breathing on his own, or explained. tests/unit/neonatal-apnea-demonstration.test.ts and tests/ui/neonatology-neonatal-apnea.test.tsx verify observed response, silence when unassisted, stable controls while watching, and version binding.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Automated UI, observed-state and replay checks exist. Exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation remains pending.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['The scenario inherits the shared report control and has an exact-version Worker catalog record. Complete four-surface runtime evidence is not yet bound.'] },
  ];
}
