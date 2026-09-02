import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { ACUTE_SEVERE_ASTHMA } from './scenarios/acute-severe-asthma';
import { ACUTE_SEVERE_ASTHMA_FIXTURES } from './acute-severe-asthma-fixtures';
import { ACUTE_SEVERE_ASTHMA_TUTOR_VERSION } from './tutor/acute-severe-asthma-guidance';
import { ACUTE_SEVERE_ASTHMA_DEMONSTRATION_VERSION } from './demo/acute-severe-asthma-demonstration';

/**
 * Exact-version evidence for one lesson, and no claim about any other.
 *
 * This is the first Respiratory Medicine lesson to carry its own evidence. The
 * module's lessons declare five objectives rather than six, so unlike the
 * finished Obstetrics, Toxicology and Neurology labs this one does not leave
 * `observable-objectives` outstanding — only the two runtime requirements that
 * need people and hardware remain.
 */
export function acuteSevereAsthmaCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'respiratory-medicine' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== ACUTE_SEVERE_ASTHMA_FIXTURES.scenarioId
    || scenario.metadata.version !== '0.1.0' || ACUTE_SEVERE_ASTHMA_FIXTURES.contentVersion !== '0.1.0'
    || ACUTE_SEVERE_ASTHMA_FIXTURES.seed !== 7314
    || ACUTE_SEVERE_ASTHMA_TUTOR_VERSION !== '0.1.0' || ACUTE_SEVERE_ASTHMA_DEMONSTRATION_VERSION !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(ACUTE_SEVERE_ASTHMA)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['acute-severe-asthma-fixtures.ts binds seed 7314 and content 0.1.0 to expert, review-before-escalating error, recovery, and no-action paths. The delivered-care record, the 75-minute reassessment, the two fixed blood gases and the radiograph report are authored constants; no bronchodilator, corticosteroid, magnesium, oxygen or ventilation model is claimed, and no outcome follows from any choice. tests/integration/acute-severe-asthma-runs.test.ts replays every path frame-for-frame across all three guidance levels and both practice regions.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Five declared decisions separate the verified prior treatment from the response to it, recognize evolving respiratory failure from the combination rather than any single threshold, activate critical-care and airway-capable support before the alternative review is finished, review the narrowed-but-open alternatives and the ventilation hazards as planning concerns, and hand off active failure. Order is enforced rather than suggested, and refusal names the missing step. The lesson examines nobody, measures no peak flow, samples or interprets no blood gas, acquires or interprets no imaging, diagnoses nothing, and delivers or selects no bronchodilator, antimuscarinic, corticosteroid, magnesium, antibiotic, epinephrine, fluid, oxygen, noninvasive or high-flow trial, intubation, sedation, neuromuscular blockade, ventilator mode, rate, tidal volume, flow, I:E ratio, PEEP or hypercapnia target.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The branch ends at active-failure handoff, with no treatment-response or resolution panel following. Later actions cannot restart an ended branch, and the ending certifies no delivered medication or oxygen, no airway procedure, no ventilator setting, no determined disposition, and no outcome.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['src/modules/anesthesia/ui/Debrief.tsx maps all five objectives to accepted engine events; the no-action path meets none and the expert path meets all five. Refused out-of-order attempts stay visible in the transcript after a correct recovery, which is the authored counterfactual: the same run that reviewed the alternatives before calling critical care can still reach a correct handoff.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['acute-severe-asthma-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways to seed 7314 for deterministic replay through the shared engine, including the time-gated handoff.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Five observed-state prompts at version ${ACUTE_SEVERE_ASTHMA_TUTOR_VERSION} read the learner's own recorded steps; unassisted is silent and coached withholds nothing here, because every beat in this lesson is urgent. Worked example ${ACUTE_SEVERE_ASTHMA_DEMONSTRATION_VERSION} drives the ordinary controls through the real engine to handoff. Both open by separating a complete, correctly given initial treatment from the response to it, and both then refuse two numbers that moved the right way: a respiratory rate that fell from 36 to 18 because she is running out of the strength to breathe, and a saturation that rose from 89% to 93% because she is now on 35% oxygen rather than room air. The quiet chest is named as the same finding a third time — air movement below what makes a wheeze — and the pH falling from 7.45 to 7.24 with a PaCO₂ rising from 31 to 58 completes it, with no single value offered as a threshold. The escalation is called before the differential is finished, because a patient treated properly and failing anyway is the whole indication and the people who might secure her airway should be present before that is urgent. The ventilation hazards are held as planning concerns rather than controls: an asthmatic chest that cannot empty stacks breaths, and dynamic hyperinflation is how ventilating this patient causes hypotension and barotrauma. The ending refuses a response panel, because nothing in this lesson treated her. A test asserts nothing anywhere examines her, measures a flow, reads a gas, or selects a drug, device or ventilator setting. tests/unit/acute-severe-asthma-demonstration.test.ts and tests/ui/respiratory-acute-severe-asthma.test.tsx verify observed response, silence when unassisted, stable controls while watching, and version binding.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Automated UI, observed-state and replay checks exist. Exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation remains pending.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['The scenario inherits the shared report control and has an exact-version Worker catalog record. Complete four-surface runtime evidence is not yet bound.'] },
  ];
}
