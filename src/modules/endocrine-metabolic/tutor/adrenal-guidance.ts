import type { GuidanceInput, GuidanceLevel, TutorRule } from '@anesthesia/tutor/guidance';
import type { AdrenalCrisisSnapshot } from '@platform/kernel/protocol';

export const ADRENAL_TUTOR_VERSION = '0.1.0';
export const ADRENAL_SOURCE_HREF = 'https://www.endocrine.org/clinical-practice-guidelines/primary-adrenal-insufficiency';
const rules: readonly {
  id: string; objectiveId: string; urgent: boolean; suggestion: string; because: string;
  observed: (patient: AdrenalCrisisSnapshot) => boolean;
}[] = [
  { id: 'adrenal-treat-now', objectiveId: 'adrenal-urgent-steroid', urgent: true,
    suggestion: 'Known adrenal insufficiency, vomiting, and shock need qualified parenteral rescue now.',
    because: 'Cortisol results and the full record can follow. Neither is a prerequisite for the emergency steroid pathway in this scene.',
    observed: (patient) => patient.hydrocortisoneAtTick === null },
  { id: 'adrenal-parallel-rescue', objectiveId: 'adrenal-combined-rescue', urgent: true,
    suggestion: 'Steroid coverage is underway. Keep fluid resuscitation and qualified help alongside it.',
    because: 'Circulatory support and hormone replacement address different parts of the emergency. Check what is still missing, rather than assuming one action completed rescue.',
    observed: (patient) => patient.hydrocortisoneAtTick !== null && (patient.salineAtTick === null || !patient.supportActive) },
  { id: 'adrenal-check-response', objectiveId: 'adrenal-reassessment', urgent: true,
    suggestion: 'The combined-response checkpoint has passed. What does a new bedside reassessment show?',
    because: 'A treatment request is not an observed response. Initial laboratory values remain old results and need qualified serial follow-up.',
    observed: (patient) => patient.hydrocortisoneAtTick !== null && patient.salineAtTick !== null
      && patient.responseDueInSeconds === null && !patient.responseObserved },
  { id: 'adrenal-find-interruption', objectiveId: 'adrenal-continuity', urgent: false,
    suggestion: 'Review the replacement record while the team continues treatment.',
    because: 'Understanding the interruption and the illness helps the receiving team protect ongoing coverage. The cause should be investigated without holding up rescue.',
    observed: (patient) => patient.hydrocortisoneAtTick !== null && patient.salineAtTick !== null && !patient.recordReviewed },
  { id: 'adrenal-prevent-recurrence', objectiveId: 'adrenal-continuity', urgent: false,
    suggestion: 'Carry steroid continuity, monitoring, and recurrence prevention into the handoff.',
    because: 'An improved bedside assessment does not establish durable recovery. Education, emergency identification and supplies, access, and endocrine follow-up still need ownership.',
    observed: (patient) => patient.responseObserved && patient.recordReviewed },
];

export const ADRENAL_TUTOR_RULES: readonly TutorRule[] = rules.map((rule) => ({
  schemaVersion: 1, version: ADRENAL_TUTOR_VERSION, objectiveId: rule.objectiveId,
  triggerId: 'adrenal-observation', assistanceLevel: rule.urgent ? 'prioritize' : 'connect',
  sourceId: 'endocrine-society-primary-adrenal-insufficiency-2016', maturity: 'preview',
  applicability: 'The exact adrenal-crisis lesson and learner-visible accepted actions and observations.',
  prerequisiteObservations: ['supplied adrenal-risk and shock presentation', 'current accepted rescue and reassessment state'],
  suppressionConditions: ['unassisted mode', 'active alarm for floating cards only', 'ended branch', 'wrong version', '90-second same-objective cooldown for floating interventions'],
  urgent: rule.urgent, cooldownSeconds: 90, afterSeconds: 0,
  prompt: { id: rule.id, suggestion: rule.suggestion, because: rule.because,
    sourceHref: ADRENAL_SOURCE_HREF },
  applies: (input) => input.scenarioId === 'adrenal-crisis-treatment-before-tests' && input.scenarioVersion === '0.1.1'
    && !!input.adrenalCrisis && !input.adrenalCrisis.ended && rule.observed(input.adrenalCrisis),
}));

/** Persistent in-tray text, not an interrupting floating card or live announcement.
 * Active alarms remain visible; an alarm does not remove this quiet reading aid.
 */
export function adrenalInlinePrompt(level: GuidanceLevel, input: GuidanceInput) {
  if (level === 'unassisted') return null;
  return ADRENAL_TUTOR_RULES.find((rule) => (level === 'guided' || rule.urgent) && rule.applies(input))?.prompt ?? null;
}
