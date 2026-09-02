import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { COMMUNITY_ACQUIRED_PNEUMONIA_HYPOXEMIA_REASSESSMENT } from './scenarios/community-acquired-pneumonia-hypoxemia-reassessment';
import { CAP_HYPOXEMIA_FIXTURES } from './community-acquired-pneumonia-hypoxemia-reassessment-fixtures';
import { CAP_HYPOXEMIA_TUTOR_VERSION } from './tutor/community-acquired-pneumonia-hypoxemia-reassessment-guidance';
import { CAP_HYPOXEMIA_DEMONSTRATION_VERSION } from './demo/community-acquired-pneumonia-hypoxemia-reassessment-demonstration';

/**
 * Exact-version evidence for one lesson, and no claim about any other.
 *
 * Like the other Respiratory Medicine lessons this one declares five
 * objectives rather than six, so `observable-objectives` is already satisfied
 * and only the two runtime requirements remain.
 */
export function capHypoxemiaCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'respiratory-medicine' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== CAP_HYPOXEMIA_FIXTURES.scenarioId
    || scenario.metadata.version !== '0.1.0' || CAP_HYPOXEMIA_FIXTURES.contentVersion !== '0.1.0'
    || CAP_HYPOXEMIA_FIXTURES.seed !== 7342
    || CAP_HYPOXEMIA_TUTOR_VERSION !== '0.1.0' || CAP_HYPOXEMIA_DEMONSTRATION_VERSION !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(COMMUNITY_ACQUIRED_PNEUMONIA_HYPOXEMIA_REASSESSMENT)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['community-acquired-pneumonia-hypoxemia-reassessment-fixtures.ts binds seed 7342 and content 0.1.0 to expert, reason-before-support error, recovery, and no-action paths. The presentation, the room-air blood gas, the radiograph and laboratory reports, and the declared severity features are authored constants; no oxygenation, antimicrobial, organism or response model is claimed, and no outcome follows from any choice. tests/integration/community-acquired-pneumonia-hypoxemia-runs.test.ts replays every path frame-for-frame across all three guidance levels and both practice regions.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['The lesson advances through five recorded steps on the shared simulation clock, and the handoff is time-gated: it refuses until simulated time has passed since the treatment-intent record. What moves is what has been corroborated, recorded and owned; what does not move is the hypoxemia, the unresolved organism, or the location of care.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Five declared decisions corroborate the hypoxemia and get it supported before the reasoning starts, read the radiograph and laboratory evidence as consistent rather than conclusive with viral and bacterial causes unresolved, count the three minor severe-CAP features without letting them determine a location of care, record the testing and empiric treatment intent without selecting either, and hand off supported but unresolved hypoxemia. Order is enforced rather than suggested, and refusal names the missing step. The lesson delivers no oxygen, selects no support device or antimicrobial, acquires no test, and determines no disposition.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The branch ends at active-care handoff. Later actions cannot restart an ended branch, and the ending certifies no delivered oxygen, no selected support device or antimicrobial, no acquired test, no determined disposition, and no outcome.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['src/modules/anesthesia/ui/Debrief.tsx maps all five objectives to accepted engine events; the no-action path meets none and the expert path meets all five. Refused out-of-order attempts stay visible in the transcript after a correct recovery, which is the authored counterfactual: the same run that reasoned before supporting her can still reach a correct handoff.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['community-acquired-pneumonia-hypoxemia-reassessment-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways to seed 7342 for deterministic replay through the shared engine, including the time-gated handoff.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Five observed-state prompts at version ${CAP_HYPOXEMIA_TUTOR_VERSION} read the learner's own recorded steps; unassisted is silent. Worked example ${CAP_HYPOXEMIA_DEMONSTRATION_VERSION} drives the ordinary controls through the real engine to handoff. Both confirm the hypoxemia before anything else and give the reason: a room-air saturation of 85% on a regular pulse-coherent trace and a PaO₂ of 51 on the gas are the same finding twice, so it is not an artifact — and being alert, warm and normotensive is the part that gets people caught, because nothing about a pressure of 116/70 makes 85% acceptable. The evidence is then read as consistent rather than conclusive, with viral and bacterial causes both unresolved and the non-pneumonia possibilities staying on the list while treatment is planned as though it is pneumonia. The three minor severe-CAP features are counted and then explicitly refused as a location-of-care decision, which a score has never been able to make. The empiric question is narrowed by what is absent — no prior MRSA or Pseudomonas isolation, no recent hospitalization with parenteral antibiotics — and absent risk factors are named as a reason not to broaden. A test asserts nothing anywhere delivers oxygen, selects a device or antimicrobial, acquires a test, or determines a disposition. tests/unit/cap-hypoxemia-demonstration.test.ts and tests/ui/respiratory-cap-hypoxemia.test.tsx verify observed response, silence when unassisted, stable controls while watching, and version binding.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Automated UI, observed-state and replay checks exist. Exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation remains pending.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['The scenario inherits the shared report control and has an exact-version Worker catalog record. Complete four-surface runtime evidence is not yet bound.'] },
  ];
}
