import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { AFFERENT_LIMB_A_THRESHOLD_MET_AND_A_CALL_NOT_MADE } from './scenarios/afferent-limb-a-threshold-met-and-a-call-not-made';
import { AFFERENT_LIMB_FIXTURES } from './afferent-limb-fixtures';

export function afferentLimbCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'medical-surgical-nursing' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== AFFERENT_LIMB_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || AFFERENT_LIMB_FIXTURES.contentVersion !== '0.1.0' || AFFERENT_LIMB_FIXTURES.seed !== 3608
    || JSON.stringify(scenario) !== JSON.stringify(AFFERENT_LIMB_A_THRESHOLD_MET_AND_A_CALL_NOT_MADE)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['afferent-limb-fixtures.ts binds seed 3608 and content 0.1.0 to expert, incomplete-care, recovery, and no-action contrasts. No physiological model is claimed; the patient is fixed and the criteria are met before the rehearsal begins.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['afferent-limb.ts runs two authored transitions. With no call made, the charge nurse repeats the discouragement at 15 minutes while nothing about the patient changes, so the only thing that grows is the cost of calling. If the team is called it arrives 10 minutes later, records that the criteria were met on arrival, and takes over. Nothing rescues an uncalled patient. The patient deliberately does not deteriorate, because a deterioration would make this a lesson about recognition rather than about what happens to recognition that is already correct.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['The learner records the met criteria, records the obstacles plainly as non-clinical, calls the response team directly on the threshold without seeking permission, states the concern to a person in words, reviews the boundaries, and increases observation with its reason. Calling the covering doctor instead, waiting for the ward round, documenting without calling, and asking permission are each refused. Stating a concern before the call is placed is refused as premature, because a note is not a call.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['Recorded criteria, recorded obstacles, a call on the threshold, a concern stated to a person, the boundary review, increased observation, and a current full assessment permit handoff with the outcome open. Instructor takeover bounds a run with no call at 120 minutes, or an unfinished session at eight hours, and is explicitly not evidence that the delay caused harm.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Six event-bound objectives distinguish recording criteria already met, naming obstacles as non-clinical, calling on a threshold rather than on permission, stating a concern to a person, the system findings and their observational limits, and accountable handoff. Refused shortcuts remain visible, and whether the call proves necessary is stated to be beside the point.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['afferent-limb-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways for deterministic replay through the shared engine.'] },
    { id: 'guidance-and-demonstration', status: 'missing', evidence: ['This slice ships no observed-state tutor prompt or worked example for this scenario version.'] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Local checks do not complete exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['Shared report controls and local privacy tests do not establish full inclusive coverage or production Turnstile/D1 verification for this version.'] },
  ];
}
