import type { GuidanceInput, TutorRule } from '@anesthesia/tutor/guidance';
import type { SevereHypoglycemiaSnapshot } from '@platform/kernel/protocol';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';

export const HYPOGLYCEMIA_TUTOR_VERSION = '0.1.0';
export const HYPOGLYCEMIA_TUTOR_SOURCE = 'ada-hypoglycemia-2026';
export const HYPOGLYCEMIA_TUTOR_SOURCE_URL = 'https://doi.org/10.2337/dc26-s006';

type Rule = Pick<TutorRule, 'objectiveId' | 'assistanceLevel' | 'urgent' | 'afterSeconds' | 'prompt' | 'prerequisiteObservations'> & {
  readonly observed: (patient: SevereHypoglycemiaSnapshot) => boolean;
};

const observedRepeatLow = (patient: SevereHypoglycemiaSnapshot) => patient.firstRescueAtTick !== null
  && patient.measuredAtTick !== null && patient.measuredAtTick >= patient.firstRescueAtTick + 10 * 60 * TICKS_PER_SECOND
  && patient.glucoseMgPerDl !== null && patient.glucoseMgPerDl < 54;

/** Reads the learner-visible snapshot only: never the hidden glucose or future trajectory. */
const rules: readonly Rule[] = [
  {
    objectiveId: 'hypoglycemia-recognize', assistanceLevel: 'orient', urgent: false, afterSeconds: 15,
    prerequisiteObservations: ['impaired alertness', 'no glucose result yet'],
    observed: (patient) => patient.glucoseMgPerDl === null,
    prompt: { id: 'hypoglycemia-observe', suggestion: 'Start with what you can observe: connect alertness with a bedside glucose check.', because: 'Drowsiness has several possible causes. Checking the fictional glucose gives you evidence without assuming the diagnosis from appearance.' },
  },
  {
    objectiveId: 'hypoglycemia-safe-rescue', assistanceLevel: 'prioritize', urgent: true, afterSeconds: 0,
    prerequisiteObservations: ['checked glucose below 54 mg/dL', 'impaired alertness', 'no first rescue'],
    observed: (patient) => patient.glucoseMgPerDl !== null && patient.glucoseMgPerDl < 54
      && patient.consciousness !== 'more-alert' && patient.firstRescueAtTick === null,
    prompt: { id: 'hypoglycemia-rescue', suggestion: 'The low result and impaired alertness call for qualified rescue. Keep swallowing safety in view.', because: 'This scene supplies an unsafe-swallow assessment. Activate qualified support and use the dose-free parenteral pathway; the number alone does not describe the whole emergency.' },
  },
  {
    objectiveId: 'hypoglycemia-reassess', assistanceLevel: 'notice', urgent: true, afterSeconds: 0,
    prerequisiteObservations: ['improved alertness', 'post-rescue timer completed', 'no fresh post-rescue check'],
    observed: (patient) => patient.consciousness === 'more-alert' && patient.recheckDueInSeconds === null
      && patient.secondRescueAtTick === null && patient.firstRescueAtTick !== null && !patient.firstRecheckComplete,
    prompt: { id: 'hypoglycemia-recheck', suggestion: 'The scheduled check is due. More alert is encouraging, but it is not a new glucose result.', because: 'Compare a fresh measurement with the response you see. The previous result remains a past observation until you check again.' },
  },
  {
    objectiveId: 'hypoglycemia-recurrence', assistanceLevel: 'connect', urgent: true, afterSeconds: 0,
    prerequisiteObservations: ['drowsiness after a completed rescue observation period', 'no repeat rescue'],
    observed: (patient) => patient.firstRescueAtTick !== null && patient.secondRescueAtTick === null
      && patient.recheckDueInSeconds === null && patient.consciousness !== 'more-alert' && !observedRepeatLow(patient),
    prompt: { id: 'hypoglycemia-reassess-change', suggestion: 'Alertness has worsened after rescue. Check again before trusting the earlier result.', because: 'An earlier response does not establish the cause of this new change or exclude another low. Reassess the person and glucose, then revise qualified rescue and monitoring.' },
  },
  {
    objectiveId: 'hypoglycemia-safe-rescue', assistanceLevel: 'prioritize', urgent: true, afterSeconds: 0,
    prerequisiteObservations: ['checked low glucose after the first rescue observation period', 'impaired alertness', 'no repeat rescue'],
    observed: (patient) => observedRepeatLow(patient) && patient.consciousness !== 'more-alert'
      && patient.secondRescueAtTick === null && patient.recheckDueInSeconds === null,
    prompt: { id: 'hypoglycemia-repeat-rescue', suggestion: 'The repeat check is low and alertness is impaired. Revisit qualified rescue and continued monitoring.', because: 'This is new evidence after the earlier rescue. Keep the unsafe-swallow boundary and the underlying recurrence risks in the plan.' },
  },
  {
    objectiveId: 'hypoglycemia-recurrence', assistanceLevel: 'notice', urgent: true, afterSeconds: 0,
    prerequisiteObservations: ['repeat rescue completed', 'post-rescue timer completed', 'repeat-rescue glucose not yet checked'],
    observed: (patient) => patient.secondRescueAtTick !== null && !patient.secondRecheckComplete
      && patient.recheckDueInSeconds === null && patient.consciousness === 'more-alert',
    prompt: { id: 'hypoglycemia-repeat-recheck', suggestion: 'After repeat rescue, obtain another glucose result before the handoff.', because: 'Improved alertness is not a substitute for this second post-rescue observation. Preserve both the measured response and ongoing monitoring needs.' },
  },
  {
    objectiveId: 'hypoglycemia-recurrence', assistanceLevel: 'connect', urgent: false, afterSeconds: 0,
    prerequisiteObservations: ['a completed post-rescue glucose check', 'medication record not reviewed'],
    observed: (patient) => (patient.firstRecheckComplete || patient.secondRecheckComplete) && !patient.medicationReviewed,
    prompt: { id: 'hypoglycemia-review-risk', suggestion: 'What might keep this risk active? The medication and intake record is still available.', because: 'A response answers what happened after rescue, not why the episode occurred. Review the supplied record and keep supervised monitoring in the plan.' },
  },
  {
    objectiveId: 'hypoglycemia-handoff', assistanceLevel: 'prioritize', urgent: false, afterSeconds: 0,
    prerequisiteObservations: ['repeat-rescue glucose check completed', 'handoff not completed'],
    observed: (patient) => patient.secondRecheckComplete,
    prompt: { id: 'hypoglycemia-continuity', suggestion: 'Before handing off, make ongoing monitoring and medication-risk ownership explicit.', because: 'The repeat result supports reassessment, not discharge permission. The receiving team still needs the medication, kidney, intake, and recurrence work.' },
  },
];

export const HYPOGLYCEMIA_TUTOR_RULES: readonly TutorRule[] = rules.map(({ observed, ...rule }) => ({
  ...rule, schemaVersion: 1, version: HYPOGLYCEMIA_TUTOR_VERSION,
  triggerId: 'hypoglycemia-observation', sourceId: HYPOGLYCEMIA_TUTOR_SOURCE, maturity: 'preview',
  applicability: 'The exact adult severe-hypoglycemia lesson, using only its observed snapshot.',
  suppressionConditions: ['unassisted mode', 'active alarm', 'ended branch', 'wrong scenario', '90-second same-objective cooldown'],
  cooldownSeconds: 90,
  prompt: { ...rule.prompt, sourceHref: HYPOGLYCEMIA_TUTOR_SOURCE_URL },
  applies: (input: GuidanceInput) => input.scenarioId === 'severe-hypoglycemia-recurrence'
    && input.scenarioVersion === '0.1.1'
    && !!input.hypoglycemia && !input.hypoglycemia.ended && observed(input.hypoglycemia),
}));
