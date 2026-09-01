import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { MECONIUM_STAINED_TRANSITION } from './scenarios/meconium-stained-transition';
import { MECONIUM_TRANSITION_FIXTURES } from './meconium-stained-transition-fixtures';
import { MECONIUM_TRANSITION_TUTOR_VERSION } from './tutor/meconium-stained-transition-guidance';
import { MECONIUM_TRANSITION_DEMONSTRATION_VERSION } from './demo/meconium-stained-transition-demonstration';

/**
 * Exact-version evidence for one lesson, and no claim about any other.
 *
 * `observable-objectives` is deliberately not answered here. This scenario
 * declares six objectives against a cap of five, which is a content-design
 * decision affecting scenarios across four modules rather than something this
 * file may settle on its own. The shared audit keeps naming it.
 */
export function meconiumTransitionCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'neonatology' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== MECONIUM_TRANSITION_FIXTURES.scenarioId
    || scenario.metadata.version !== '0.1.0' || MECONIUM_TRANSITION_FIXTURES.contentVersion !== '0.1.0'
    || MECONIUM_TRANSITION_FIXTURES.seed !== 8409
    || MECONIUM_TRANSITION_TUTOR_VERSION !== '0.1.0' || MECONIUM_TRANSITION_DEMONSTRATION_VERSION !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(MECONIUM_STAINED_TRANSITION)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['meconium-stained-transition-fixtures.ts binds seed 8409 and content 0.1.0 to expert, guessed-answer-error, recovery, and no-action paths. The presentation and the fixed 30-minute qualified-team report are authored constants; no aspiration, airway, or oxygenation model is claimed, and no outcome follows from any choice. tests/integration/meconium-stained-transition-runs.test.ts replays every path frame-for-frame across all three guidance levels and both practice regions.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['The lesson advances through six recorded steps on the shared simulation clock, two of them time-gated: the fixed report refuses until simulated time has passed since the boundary review, and the handoff refuses until time has passed since the report. What moves is not the newborn, who breathes well throughout, but what the record can support about an intervention declined and a disease left open.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Six declared decisions confirm the airway-ready attendance that meconium actually calls for, describe the newborn rather than the fluid, say what is not indicated without saying what is excluded, review the obstruction triggers that would change the answer, read the fixed report, and hand off active risk. Order is enforced rather than suggested, and refusal names the missing step. The lesson suctions nothing, positions nothing, handles no device, places or manages no airway, and diagnoses no meconium aspiration.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The branch ends at active-risk handoff. Later actions cannot restart an ended branch, and the ending certifies no excluded meconium aspiration, no excluded other respiratory disease, no durable safety, no feeding success, no disposition, and no outcome for the newborn or the parents.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['src/modules/anesthesia/ui/Debrief.tsx maps all six objectives to accepted engine events; the no-action path meets none and the expert path meets all six. Refused out-of-order attempts stay visible in the transcript after a correct recovery, which is the authored counterfactual: the same run that declined the suction before establishing anything can still reach a correct handoff.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['meconium-stained-transition-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways to seed 8409 for deterministic replay through the shared engine, including the two time-gated checkpoints. The common-error path declines the suction without having earned the right to: the answer is guessable from the title, and guessing it is not the lesson.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Six observed-state prompts at version ${MECONIUM_TRANSITION_TUTOR_VERSION} read the learner's own recorded steps; unassisted is silent and coached withholds the single non-urgent beat. Worked example ${MECONIUM_TRANSITION_DEMONSTRATION_VERSION} drives the ordinary controls through the real engine to handoff. Both keep two negatives apart that are commonly collapsed into one: routine suctioning is not indicated solely because the fluid is meconium stained, and declining it excludes neither evolving meconium aspiration nor other respiratory disease. Both also name the obstruction triggers that would change the answer, so that declining stays a decision rather than a habit, and a test asserts nothing anywhere calls her well or her airway clear. tests/unit/meconium-stained-transition-demonstration.test.ts and tests/ui/neonatology-meconium-stained-transition.test.tsx verify observed response, silence when unassisted, stable controls while watching, and version binding.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Automated UI, observed-state and replay checks exist. Exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation remains pending.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['The scenario inherits the shared report control and has an exact-version Worker catalog record. Complete four-surface runtime evidence is not yet bound.'] },
  ];
}
