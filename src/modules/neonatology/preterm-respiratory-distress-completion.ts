import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { PRETERM_RESPIRATORY_DISTRESS } from './scenarios/preterm-respiratory-distress';
import { PRETERM_RESPIRATORY_DISTRESS_FIXTURES } from './preterm-respiratory-distress-fixtures';
import { PRETERM_RESPIRATORY_DISTRESS_TUTOR_VERSION } from './tutor/preterm-respiratory-distress-guidance';
import { PRETERM_RESPIRATORY_DISTRESS_DEMONSTRATION_VERSION } from './demo/preterm-respiratory-distress-demonstration';

/**
 * Exact-version evidence for one lesson, and no claim about any other.
 *
 * `observable-objectives` is deliberately not answered here. This scenario
 * declares six objectives against a cap of five, which is a content-design
 * decision affecting scenarios across four modules rather than something this
 * file may settle on its own. The shared audit keeps naming it.
 */
export function pretermRespiratoryDistressCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'neonatology' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== PRETERM_RESPIRATORY_DISTRESS_FIXTURES.scenarioId
    || scenario.metadata.version !== '0.1.1' || PRETERM_RESPIRATORY_DISTRESS_FIXTURES.contentVersion !== '0.1.1'
    || PRETERM_RESPIRATORY_DISTRESS_FIXTURES.seed !== 2946
    || PRETERM_RESPIRATORY_DISTRESS_TUTOR_VERSION !== '0.1.1' || PRETERM_RESPIRATORY_DISTRESS_DEMONSTRATION_VERSION !== '0.1.1'
    || JSON.stringify(scenario) !== JSON.stringify(PRETERM_RESPIRATORY_DISTRESS)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['preterm-respiratory-distress-fixtures.ts binds seed 2946 and content 0.1.1 to expert, branch-from-gestation-error, recovery, and no-action paths. The presentation and the fixed 10-minute qualified-team report are authored constants; no CPAP-response, oxygenation, or thermal model is claimed, and no outcome follows from any choice. tests/integration/preterm-respiratory-distress-runs.test.ts replays every path frame-for-frame across all three guidance levels and both practice regions.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['The lesson advances through six recorded steps on the shared simulation clock, two of them time-gated: the fixed report refuses until simulated time has passed since the boundary review, and the handoff refuses until time has passed since the report. What moves is not the diagnosis, which is never made, but what the record can support about a support that is working over a newborn who is still undiagnosed.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Six declared decisions confirm the CPAP-capable team and the thermal plan as one requirement, separate what the newborn is doing from what he is, choose the support branch on the spontaneous breathing rather than the gestation, review the oxygen range and the findings that would leave this branch, read the fixed report, and hand off active risk. Order is enforced rather than suggested, and refusal names the missing step. The lesson operates no CPAP, oxygen, oximetry or other device, selects no setting, suctions nothing, places no airway, and gives no fluid, glucose, surfactant, or drug.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The branch ends at active-risk handoff. Later actions cannot restart an ended branch, and the ending certifies no proven adequate ventilation, no excluded respiratory disease, infection, air leak or congenital disease, no durable stability, no neurologic safety, no disposition, and no outcome for the newborn or the parents.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['src/modules/anesthesia/ui/Debrief.tsx maps all six objectives to accepted engine events; the no-action path meets none and the expert path meets all six. Refused out-of-order attempts stay visible in the transcript after a correct recovery, which is the authored counterfactual: the same run that chose the branch from the gestation can still reach a correct handoff.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['preterm-respiratory-distress-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways to seed 2946 for deterministic replay through the shared engine, including the two time-gated checkpoints. The common-error path names the support branch from the gestation before the CPAP-capable team, the thermal plan and the breathing have been established, because it is the spontaneous breathing rather than the gestation that decides this branch.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Six observed-state prompts at version ${PRETERM_RESPIRATORY_DISTRESS_TUTOR_VERSION} read the learner's own recorded steps; unassisted is silent and coached withholds the single non-urgent beat. Worked example ${PRETERM_RESPIRATORY_DISTRESS_DEMONSTRATION_VERSION} drives the ordinary controls through the real engine to handoff. Both name which finding decides — the spontaneous breathing, not the gestation — so the CPAP branch is a decision rather than a reflex, and both are careful about which number travels: 30% to 100% is a reasonable initial range under 32 weeks and the authored 30% start is one qualified team's choice inside it rather than a prescription. Both also name what would leave this branch for the positive-pressure lesson, and a test asserts nothing anywhere calls him stable or names his disease. tests/unit/preterm-respiratory-distress-demonstration.test.ts and tests/ui/neonatology-preterm-respiratory-distress.test.tsx verify observed response, silence when unassisted, stable controls while watching, and version binding.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Automated UI, observed-state and replay checks exist. Exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation remains pending.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['The scenario inherits the shared report control and has an exact-version Worker catalog record. Complete four-surface runtime evidence is not yet bound.'] },
  ];
}
