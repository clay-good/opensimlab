import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { DELIVERY_ROOM_TO_NICU_HANDOFF } from './scenarios/delivery-room-to-nicu-handoff';
import { NICU_HANDOFF_FIXTURES } from './delivery-room-to-nicu-handoff-fixtures';
import { NICU_HANDOFF_TUTOR_VERSION } from './tutor/delivery-room-to-nicu-handoff-guidance';
import { NICU_HANDOFF_DEMONSTRATION_VERSION } from './demo/delivery-room-to-nicu-handoff-demonstration';

/**
 * Exact-version evidence for one lesson, and no claim about any other.
 *
 * `observable-objectives` is deliberately not answered here. This scenario
 * declares six objectives against a cap of five, which is a content-design
 * decision affecting scenarios across four modules rather than something this
 * file may settle on its own. The shared audit keeps naming it.
 */
export function nicuHandoffCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'neonatology' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== NICU_HANDOFF_FIXTURES.scenarioId
    || scenario.metadata.version !== '0.1.0' || NICU_HANDOFF_FIXTURES.contentVersion !== '0.1.0'
    || NICU_HANDOFF_FIXTURES.seed !== 9028
    || NICU_HANDOFF_TUTOR_VERSION !== '0.1.0' || NICU_HANDOFF_DEMONSTRATION_VERSION !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(DELIVERY_ROOM_TO_NICU_HANDOFF)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['delivery-room-to-nicu-handoff-fixtures.ts binds seed 9028 and content 0.1.0 to expert, story-first-error, recovery, and no-action paths. The presentation, the fixed receiver check-back and the 10-minute arrival report are authored constants; no transport, respiratory, or thermal model is claimed, and no outcome follows from any choice. tests/integration/delivery-room-to-nicu-handoff-runs.test.ts replays every path frame-for-frame across all three guidance levels and both practice regions.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['The lesson advances through six recorded steps on the shared simulation clock, two of them time-gated: the fixed check-back and arrival report refuse until simulated time has passed since the boundary review, and the handoff refuses until time has passed since the report. What moves is not the newborn, whose arrival looks like her departure, but what the record can support about responsibility that has changed hands.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Six declared decisions name both ends of the transfer and the parent who is not in the room, assemble the timeline including the two results nobody has, carry the absent interventions with the same weight as the events, keep continuity with the sender until an explicit transfer, read the check-back and arrival report, and hand off active risk. Order is enforced rather than suggested, and refusal names the missing step. The lesson takes no history, operates no device, manages no respiratory support or airway, transports nobody, and performs no communication, documentation, counseling, or check-back.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The branch ends at active-risk handoff. Later actions cannot restart an ended branch, and the ending certifies no proven shared understanding, no treatment effect, no determined diagnosis or cause, no durable stability, no feeding safety, no disposition, and no outcome for the newborn or the parents.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['src/modules/anesthesia/ui/Debrief.tsx maps all six objectives to accepted engine events; the no-action path meets none and the expert path meets all six. Refused out-of-order attempts stay visible in the transcript after a correct recovery, which is the authored counterfactual: the same run that began telling the story before naming who owned it can still reach a correct handoff.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['delivery-room-to-nicu-handoff-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways to seed 9028 for deterministic replay through the shared engine, including the two time-gated checkpoints. The common-error path starts telling the story, which is the part of a handoff that feels like the handoff, before the sending, receiving, transport and family ownership are named — a story told to nobody in particular being how continuity gets dropped between two teams who each thought the other had it.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Six observed-state prompts at version ${NICU_HANDOFF_TUTOR_VERSION} read the learner's own recorded steps; unassisted is silent and coached withholds the single non-urgent beat. Worked example ${NICU_HANDOFF_DEMONSTRATION_VERSION} drives the ordinary controls through the real engine to handoff. Both spend their weight on the half of a handoff that gets dropped: the interventions that did not happen — no compressions, epinephrine, access, fluid, blood or alternative airway — the glucose and cord gas nobody has yet, and the boundary that leaves the delivery-room team owning her until an explicit transfer rather than until the NICU accepted her. Both also refuse to read the receiver's correct read-back as proof of shared understanding, and a test asserts nothing anywhere calls the handoff complete or the newborn stable. tests/unit/delivery-room-to-nicu-handoff-demonstration.test.ts and tests/ui/neonatology-delivery-room-to-nicu-handoff.test.tsx verify observed response, silence when unassisted, stable controls while watching, and version binding.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Automated UI, observed-state and replay checks exist. Exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation remains pending.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['The scenario inherits the shared report control and has an exact-version Worker catalog record. Complete four-surface runtime evidence is not yet bound.'] },
  ];
}
