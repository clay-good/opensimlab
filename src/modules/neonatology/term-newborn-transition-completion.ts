import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { TERM_NEWBORN_TRANSITION } from './scenarios/term-newborn-transition';
import { TERM_TRANSITION_FIXTURES } from './term-newborn-transition-fixtures';
import { TERM_TRANSITION_TUTOR_VERSION } from './tutor/term-newborn-transition-guidance';
import { TERM_TRANSITION_DEMONSTRATION_VERSION } from './demo/term-newborn-transition-demonstration';

/**
 * Exact-version evidence for one lesson, and no claim about any other.
 *
 * `observable-objectives` is deliberately not answered here. This scenario
 * declares six objectives against a cap of five, which is a content-design
 * decision affecting scenarios across four modules rather than something this
 * file may settle on its own. The shared audit keeps naming it.
 */
export function termTransitionCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'neonatology' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== TERM_TRANSITION_FIXTURES.scenarioId
    || scenario.metadata.version !== '0.1.0' || TERM_TRANSITION_FIXTURES.contentVersion !== '0.1.0'
    || TERM_TRANSITION_FIXTURES.seed !== 2187
    || TERM_TRANSITION_TUTOR_VERSION !== '0.1.0' || TERM_TRANSITION_DEMONSTRATION_VERSION !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(TERM_NEWBORN_TRANSITION)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['term-newborn-transition-fixtures.ts binds seed 2187 and content 0.1.0 to expert, closure-error, recovery, and no-action paths. The presentation and the fixed 1-hour qualified-team report are authored constants; no transition, thermal, glucose, or feeding model is claimed, and no outcome follows from any choice. tests/integration/term-newborn-transition-runs.test.ts replays every path frame-for-frame across all three guidance levels and both practice regions.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['The lesson advances through six recorded steps on the shared simulation clock, two of them time-gated: the fixed report refuses until simulated time has passed since the protective-care review, and the handoff refuses until time has passed since the report. What moves is not the newborn, who stays well throughout, but what the record can support about a transition that is normal and unfinished.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Six declared decisions confirm a prepared newborn-capable team before anything looks needed, assemble the birth, breathing, thermal, and parent facts rather than sensing them, recognize normal transition without closing the newborn, review protective care including the routine acts deliberately left off it, read the fixed report, and hand off active risk. Order is enforced rather than suggested, and refusal names the missing step. The lesson examines, scores, clamps, dries, warms, suctions, stimulates, separates, oxygenates, ventilates, feeds, transports, and dispositions nothing.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The branch ends at active-risk handoff. Later actions cannot restart an ended branch, and the ending certifies no durable respiratory or thermal safety, no glucose stability, no feeding success, no discharge readiness, and no outcome for the newborn or the parents.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['src/modules/anesthesia/ui/Debrief.tsx maps all six objectives to accepted engine events; the no-action path meets none and the expert path meets all six. Refused out-of-order attempts stay visible in the transcript after a correct recovery, which is the authored counterfactual: the same run that called the newborn normal on sight can still reach a correct handoff.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['term-newborn-transition-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways to seed 2187 for deterministic replay through the shared engine, including the two time-gated checkpoints. The common-error path is the closure error this lesson exists for: a newborn declared normal before anyone established who was prepared or connected the birth, the warmth, and the parents.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Six observed-state prompts at version ${TERM_TRANSITION_TUTOR_VERSION} read the learner's own recorded steps; unassisted is silent and coached withholds the single non-urgent beat. Worked example ${TERM_TRANSITION_DEMONSTRATION_VERSION} drives the ordinary controls through the real engine to handoff. Both hold two statements together: nothing needs to be done to this newborn, and she is not finished being watched. Neither turns an absent resuscitation into a discharge, and a test asserts nothing anywhere calls her well, stable, or fine. Neither performs cord care, drying, positioning, suction, oxygen, or feeding, and the example finishes on the quiet hour described as a checkpoint rather than a result. tests/unit/term-newborn-transition-demonstration.test.ts and tests/ui/neonatology-term-newborn-transition.test.tsx verify observed response, silence when unassisted, stable controls while watching, and version binding.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Automated UI, observed-state and replay checks exist. Exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation remains pending.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['The scenario inherits the shared report control and has an exact-version Worker catalog record. Complete four-surface runtime evidence is not yet bound.'] },
  ];
}
