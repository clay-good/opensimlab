import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { QUIET_PATIENT_A_SCREEN_THAT_WAS_NEVER_DONE } from './scenarios/quiet-patient-a-screen-that-was-never-done';
import { QUIET_PATIENT_FIXTURES } from './quiet-patient-fixtures';

export function quietPatientCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'medical-surgical-nursing' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== QUIET_PATIENT_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || QUIET_PATIENT_FIXTURES.contentVersion !== '0.1.0' || QUIET_PATIENT_FIXTURES.seed !== 5291
    || JSON.stringify(scenario) !== JSON.stringify(QUIET_PATIENT_A_SCREEN_THAT_WAS_NEVER_DONE)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['quiet-patient-fixtures.ts binds seed 5291 and content 0.1.0 to expert, incomplete-care, recovery, and no-action contrasts. No delirium, cognitive, or physiological model is claimed; the screen result is authored.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['quiet-patient.ts runs two authored transitions. The outgoing nurse repeats the same impression at handover at 25 minutes, so a fourth entry is about to read like the first three. The requested review arrives 60 minutes after it is requested, performs its own assessment, and records that the preceding shifts contain no screening result of any kind. Nothing arrives unrequested. The observations stay unremarkable throughout, which is why three shifts of charts look complete.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['The learner reviews the charted impressions and names what kind of evidence they are, performs the screen rather than deferring it, records the result as a screening result with the tool and its positive components alongside the unchanged earlier impressions, escalates on the result, reviews the boundaries, and schedules repeat screening. Deferring because the patient is asleep, reading quiet as settled, relying on an earlier negative screen that does not exist, and attributing the presentation to low mood are each refused. Recording a result or escalating before any screen has been performed is refused as premature.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['Reviewed impressions, a performed screen, a recorded result, escalation on it, the boundary review, a repeat schedule, and a current full assessment permit handoff with the cause open. Instructor takeover bounds a run with no escalation at 150 minutes, or an unfinished session at eight hours.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Six event-bound objectives distinguish an impression from a screening result, recognising that performing the screen is what changed, recording a result as a result, escalating on a result rather than a worry, the boundaries and their certainty, and accountable handoff of a record with a specific gap. Refused shortcuts remain visible, and a positive screen is stated to be a screening result rather than a diagnosis.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['quiet-patient-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways for deterministic replay through the shared engine.'] },
    { id: 'guidance-and-demonstration', status: 'missing', evidence: ['This slice ships no observed-state tutor prompt or worked example for this scenario version.'] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Local checks do not complete exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['Shared report controls and local privacy tests do not establish full inclusive coverage or production Turnstile/D1 verification for this version.'] },
  ];
}
