import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { LAST_KNOWN_WELL_A_TIME_NOBODY_CAN_SUPPLY } from './scenarios/last-known-well-a-time-nobody-can-supply';
import { LAST_KNOWN_WELL_FIXTURES } from './last-known-well-fixtures';

export function lastKnownWellCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'medical-surgical-nursing' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== LAST_KNOWN_WELL_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.1'
    || LAST_KNOWN_WELL_FIXTURES.contentVersion !== '0.1.1' || LAST_KNOWN_WELL_FIXTURES.seed !== 7845
    || JSON.stringify(scenario) !== JSON.stringify(LAST_KNOWN_WELL_A_TIME_NOBODY_CAN_SUPPLY)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['last-known-well-fixtures.ts binds seed 7845 and content 0.1.0 to expert, incomplete-care, recovery, and no-action contrasts. No stroke, perfusion, or treatment model is claimed; the timeline and the deficit are authored.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['last-known-well.ts runs two authored transitions. Somebody presses the care assistant for a firmer time at 12 minutes; she moves it by an hour and becomes less willing to say it is uncertain, so the record has not improved. If the pathway is activated, the stroke team assesses 20 minutes later, records the bound as a bound, keeps the recollection separate, and proceeds on imaging-based assessment. The deficit never changes, because no amount of looking at her supplies the missing hours and an evolving deficit would let a learner treat the evolution as the answer.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['The learner records last known well as a bound, records the recollection in its own field marked uncertain, activates the pathway on the deficit, states what the unknown changes, reviews the boundaries, and arranges timed neurological observation. Entering either the recollection or the bound in the onset field, treating an unknown onset as a reason to offer nothing, and waiting for the family to supply a time are each refused. Stating consequences before the bound is recorded is refused as premature.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['A recorded bound, a preserved uncertain recollection, activation on the deficit, the stated consequences, the boundary review, timed observation, and a current full assessment permit handoff with the onset field empty. Instructor takeover bounds a run with no activation at 90 minutes, or an unfinished session at eight hours.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Six event-bound objectives distinguish recording a bound rather than an onset, keeping an uncertain account uncertain, activating on the deficit rather than the clock, stating what the unknown changes, the trial evidence and its population-level scope, and handing over an empty field as empty. Refused shortcuts remain visible, and no onset, eligibility, or outcome is certified.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['last-known-well-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways for deterministic replay through the shared engine.'] },
    { id: 'guidance-and-demonstration', status: 'missing', evidence: ['This slice ships no observed-state tutor prompt or worked example for this scenario version.'] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Local checks do not complete exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['Shared report controls and local privacy tests do not establish full inclusive coverage or production Turnstile/D1 verification for this version.'] },
  ];
}
