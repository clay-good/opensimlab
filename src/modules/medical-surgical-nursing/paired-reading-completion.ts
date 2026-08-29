import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { PAIRED_READING_A_NUMBER_WRONG_IN_ONE_DIRECTION } from './scenarios/paired-reading-a-number-wrong-in-one-direction';
import { PAIRED_READING_FIXTURES } from './paired-reading-fixtures';

export function pairedReadingCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'medical-surgical-nursing' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== PAIRED_READING_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || PAIRED_READING_FIXTURES.contentVersion !== '0.1.0' || PAIRED_READING_FIXTURES.seed !== 4726
    || JSON.stringify(scenario) !== JSON.stringify(PAIRED_READING_A_NUMBER_WRONG_IN_ONE_DIRECTION)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['paired-reading-fixtures.ts binds seed 4726 and content 0.1.0 to expert, incomplete-care, recovery, and no-action contrasts. No respiratory, oximetry, or gas-exchange model is claimed; both values are authored.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['paired-reading.ts runs two authored transitions. The arterial sample sent by the qualified team before the rehearsal returns at 30 minutes reading 86 percent, taken while the oximeter read 94. The requested medical review arrives 45 minutes after it is requested and records that the arterial value is the measurement being acted on while the oximeter continues to read in the nineties by its own correct calibration. The displayed saturation never changes: the patient was hypoxaemic before the sample returned and after it, and only what is known changes.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['The learner records the oximeter reading as a device reading rather than as the saturation, records both values together once the arterial result returns, states what the gap is and is not, escalates on the arterial value with the reading labelled alongside it, reviews the boundaries, and arranges observation independent of the oximeter. Repositioning the probe, warming the hand, reading the steady numbers as a stable saturation, and assuming a regulatory change resolved it are each refused. Pairing, characterising the gap, or escalating before the arterial result returns is refused as premature.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['A recorded reading, recorded paired values, a characterised gap, escalation on the arterial value, the boundary review, oximeter-independent observation, and a current full assessment permit handoff with the cause open. Instructor takeover bounds a run with no escalation at 150 minutes, or an unfinished session at eight hours.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Six event-bound objectives distinguish recording a reading as a reading, recognising an error with a direction, characterising the gap honestly, escalating on the arterial value, the boundaries and their certainty, and accountable handoff of a chart that continues to read reassuringly. Refused shortcuts remain visible, and no cause or outcome is certified.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['paired-reading-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways for deterministic replay through the shared engine.'] },
    { id: 'guidance-and-demonstration', status: 'missing', evidence: ['This slice ships no observed-state tutor prompt or worked example for this scenario version.'] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Local checks do not complete exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['Shared report controls and local privacy tests do not establish full inclusive coverage or production Turnstile/D1 verification for this version.'] },
  ];
}
