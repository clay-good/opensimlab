import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { INEFFECTIVE_VENTILATION_CORRECTION } from './scenarios/ineffective-ventilation-correction';
import { INEFFECTIVE_VENTILATION_FIXTURES } from './ineffective-ventilation-correction-fixtures';
import { INEFFECTIVE_VENTILATION_TUTOR_VERSION } from './tutor/ineffective-ventilation-correction-guidance';
import { INEFFECTIVE_VENTILATION_DEMONSTRATION_VERSION } from './demo/ineffective-ventilation-correction-demonstration';

/**
 * Exact-version evidence for one lesson, and no claim about any other.
 *
 * `observable-objectives` is deliberately not answered here. This scenario
 * declares six objectives against a cap of five, which is a content-design
 * decision affecting scenarios across four modules rather than something this
 * file may settle on its own. The shared audit keeps naming it.
 */
export function ineffectiveVentilationCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'neonatology' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== INEFFECTIVE_VENTILATION_FIXTURES.scenarioId
    || scenario.metadata.version !== '0.1.0' || INEFFECTIVE_VENTILATION_FIXTURES.contentVersion !== '0.1.0'
    || INEFFECTIVE_VENTILATION_FIXTURES.seed !== 3742
    || INEFFECTIVE_VENTILATION_TUTOR_VERSION !== '0.1.0' || INEFFECTIVE_VENTILATION_DEMONSTRATION_VERSION !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(INEFFECTIVE_VENTILATION_CORRECTION)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['ineffective-ventilation-correction-fixtures.ts binds seed 3742 and content 0.1.0 to expert, escalation-first-error, recovery, and no-action paths. The presentation and the fixed 2-minute qualified-team report are authored constants; no leak, correction-response, or oxygenation model is claimed, and no outcome follows from any choice. tests/integration/ineffective-ventilation-correction-runs.test.ts replays every path frame-for-frame across all three guidance levels and both practice regions.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['The lesson advances through six recorded steps on the shared simulation clock, two of them time-gated: the fixed report refuses until simulated time has passed since the boundary review, and the handoff refuses until time has passed since the report. What moves is not the cause of the failed ventilation, which never closes, but what the record can support about a correction that worked and explained nothing.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Six declared decisions bring the airway help before the ventilation gets harder, put the birth clock, the ventilation interval and the interface in one picture, read the absent heart-rate rise as the primary sign while the cause stays open, review correction and the alternative airway with the compression threshold kept attached to its second half, read the fixed report, and hand off active risk. Order is enforced rather than suggested, and refusal names the missing step. The lesson handles no mask or device, selects no pressure, rate, PEEP or oxygen, places no airway, and performs no corrective step or compression.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The branch ends at active-risk handoff. Later actions cannot restart an ended branch, and the ending certifies no durable breathing, no stable transition, no excluded airway or lung disease, no neurologic safety, no determined cause, no disposition, and no outcome for the newborn or the parents.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['src/modules/anesthesia/ui/Debrief.tsx maps all six objectives to accepted engine events; the no-action path meets none and the expert path meets all six. Refused out-of-order attempts stay visible in the transcript after a correct recovery, which is the authored counterfactual: the same run that reached past correction can still reach a correct handoff.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['ineffective-ventilation-correction-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways to seed 3742 for deterministic replay through the shared engine, including the two time-gated checkpoints. The common-error path is the escalation this lesson exists to delay: reaching for what comes after correction before the team, the clock and the interface have been established.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Six observed-state prompts at version ${INEFFECTIVE_VENTILATION_TUTOR_VERSION} read the learner's own recorded steps; unassisted is silent and coached withholds the single non-urgent beat. Worked example ${INEFFECTIVE_VENTILATION_DEMONSTRATION_VERSION} drives the ordinary controls through the real engine to handoff. Both keep the compression threshold attached to its second half — under 60 and despite adequate ventilation after corrective steps — and name that at a heart rate of 78 with ventilation that has not yet worked, neither half is met. Both read the heart rate as the primary sign, chest movement as secondary and the saturation as neither, and a test asserts nothing anywhere starts compressions, places an airway, or calls the airway and lungs clear. tests/unit/ineffective-ventilation-correction-demonstration.test.ts and tests/ui/neonatology-ineffective-ventilation-correction.test.tsx verify observed response, silence when unassisted, stable controls while watching, and version binding.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Automated UI, observed-state and replay checks exist. Exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation remains pending.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['The scenario inherits the shared report control and has an exact-version Worker catalog record. Complete four-surface runtime evidence is not yet bound.'] },
  ];
}
