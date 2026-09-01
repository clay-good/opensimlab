import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { NEONATAL_HYPOGLYCEMIA } from './scenarios/neonatal-hypoglycemia';
import { NEONATAL_HYPOGLYCEMIA_FIXTURES } from './neonatal-hypoglycemia-fixtures';
import { NEONATAL_HYPOGLYCEMIA_TUTOR_VERSION } from './tutor/neonatal-hypoglycemia-guidance';
import { NEONATAL_HYPOGLYCEMIA_DEMONSTRATION_VERSION } from './demo/neonatal-hypoglycemia-demonstration';

/**
 * Exact-version evidence for one lesson, and no claim about any other.
 *
 * `observable-objectives` is deliberately not answered here. This scenario
 * declares six objectives against a cap of five, which is a content-design
 * decision affecting scenarios across four modules rather than something this
 * file may settle on its own. The shared audit keeps naming it.
 */
export function neonatalHypoglycemiaCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'neonatology' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== NEONATAL_HYPOGLYCEMIA_FIXTURES.scenarioId
    || scenario.metadata.version !== '0.1.0' || NEONATAL_HYPOGLYCEMIA_FIXTURES.contentVersion !== '0.1.0'
    || NEONATAL_HYPOGLYCEMIA_FIXTURES.seed !== 6132
    || NEONATAL_HYPOGLYCEMIA_TUTOR_VERSION !== '0.1.0' || NEONATAL_HYPOGLYCEMIA_DEMONSTRATION_VERSION !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(NEONATAL_HYPOGLYCEMIA)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['neonatal-hypoglycemia-fixtures.ts binds seed 6132 and content 0.1.0 to expert, number-first-error, recovery, and no-action paths. The presentation and the fixed 30-minute qualified-team report are authored constants; no glucose, treatment-response, or feeding model is claimed, and no outcome follows from any choice. tests/integration/neonatal-hypoglycemia-runs.test.ts replays every path frame-for-frame across all three guidance levels and both practice regions.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['The lesson advances through six recorded steps on the shared simulation clock, two of them time-gated: the fixed report refuses until simulated time has passed since the boundary review, and the handoff refuses until time has passed since the report. What moves is not the cause of the signs, which never closes, but what the record can support about a number corrected and a newborn unexplained.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Six declared decisions confirm the glucose and feeding pathways as one team, connect the maternal risk and the signs to the value in that order, escalate immediately while refusing the universal threshold, review the local pathway rather than choosing a treatment, read the fixed report, and hand off active risk. Order is enforced rather than suggested, and refusal names the missing step. The lesson takes no history, obtains or interprets no glucose or other test, feeds nobody, gives no gel, dextrose, fluid or drug, obtains no access, and names no dose.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The branch ends at active-risk handoff. Later actions cannot restart an ended branch, and the ending certifies no universal injury threshold, no determined cause, no excluded infection or endocrine or metabolic disease, no proven treatment effect, no durable glucose stability, no neurologic safety, no feeding success, no disposition, and no outcome for the newborn or the parents.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['src/modules/anesthesia/ui/Debrief.tsx maps all six objectives to accepted engine events; the no-action path meets none and the expert path meets all six. Refused out-of-order attempts stay visible in the transcript after a correct recovery, which is the authored counterfactual: the same run that escalated from the number alone can still reach a correct handoff.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['neonatal-hypoglycemia-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways to seed 6132 for deterministic replay through the shared engine, including the two time-gated checkpoints. The common-error path escalates from the number alone, which this lesson refuses precisely because the value does not define the condition and the signs are what make it urgent.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Six observed-state prompts at version ${NEONATAL_HYPOGLYCEMIA_TUTOR_VERSION} read the learner's own recorded steps; unassisted is silent and coached withholds the single non-urgent beat. Worked example ${NEONATAL_HYPOGLYCEMIA_DEMONSTRATION_VERSION} drives the ordinary controls through the real engine to handoff. Both hold two statements together without letting either cancel the other: no single glucose concentration universally defines clinically important neonatal hypoglycemia or predicts brain injury, and abnormal signs with a confirmed 32 mg/dL still support immediate qualified escalation across the cited frameworks. Both also keep the signs nonspecific, so treating the glucose explains nothing, and neither names a gel, a bolus, or a dose, because the treatment is whatever the current local pathway says. A test asserts nothing anywhere states a universal threshold or claims a treatment effect. tests/unit/neonatal-hypoglycemia-demonstration.test.ts and tests/ui/neonatology-neonatal-hypoglycemia.test.tsx verify observed response, silence when unassisted, stable controls while watching, and version binding.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Automated UI, observed-state and replay checks exist. Exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation remains pending.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['The scenario inherits the shared report control and has an exact-version Worker catalog record. Complete four-surface runtime evidence is not yet bound.'] },
  ];
}
