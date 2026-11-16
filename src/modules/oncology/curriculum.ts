/**
 * The oncology lessons mapped to the ACGME's Internal Medicine Milestones
 * (framework-mapping-expansion → scenario mappings).
 *
 * All eleven lessons are declared `clinic`, so management here is outpatient
 * throughout - the only internal-medicine module besides cardiology where that
 * is true, and the only one where it is true of every lesson.
 *
 * Two absences are worth reading as findings rather than gaps. No objective in
 * this module examines the patient, and none carries a safety bound: these are
 * reasoning lessons about what a number, a scan or a label does and does not
 * settle, and the work happens between the clinician and the evidence. Both are
 * recorded with their reasons below.
 */

import { ACGME_INTERNAL_MEDICINE_MILESTONES } from '@platform/curriculum/acgme-internal-medicine';
import type { FrameworkRecord } from '@platform/curriculum/framework-records';
import type { ScenarioMapping } from '@platform/curriculum/mapping';

const FRAMEWORK_ID = ACGME_INTERNAL_MEDICINE_MILESTONES.id;

/** The readings this module's lessons are mapped against. */
export const ONCOLOGY_FRAMEWORKS: readonly FrameworkRecord[] = [
  ACGME_INTERNAL_MEDICINE_MILESTONES,
];

/** Subcompetencies no lesson in this module exercises, and why. */
export const ONCOLOGY_UNCOVERED: Readonly<Record<string, string>> = {
  'pc-2-physical-examination': 'No objective in this module examines the patient: these are reasoning lessons about what a number, a scan or a label does and does not settle.',
  'pc-4-inpatient-management': 'All eleven lessons are declared clinic lessons.',
  'pc-6-digital-health': 'No lesson is a telehealth encounter or uses a patient-facing digital tool.',
  'sbp-1-patient-safety-and-quality-improvement': 'No objective here carries a bound, a gate or a ceiling; the harm these lessons teach is a conclusion drawn too early, which is reasoning rather than safety.',
  'sbp-3-physician-role-in-health-care-systems': 'No lesson models cost, access, or what a health system makes available.',
  'pbli-1-evidence-based-practice': 'Lessons cite the evidence behind their own steps, but none asks the learner to locate or appraise it.',
  'pbli-2-reflective-practice': 'Reflection happens in the debrief, which is not part of any lesson\'s objectives.',
  'prof-1-professional-behavior': 'Conduct toward the patient and the team is modelled as communication rather than tested as behaviour.',
  'prof-2-ethical-principles': 'No lesson puts a duty to the patient in conflict with anything.',
  'prof-3-accountability': 'Recording what was done is how every lesson works, which makes it the medium rather than a thing measured.',
  'prof-4-knowledge-of-well-being-factors': 'Nothing here models well-being, the learner\'s or anybody else\'s.',
  'mk-1-applied-foundational-sciences': 'These lessons reason from evidence to a decision rather than from a mechanism.',
  'ics-1-patient-and-family-communication': 'No lesson has a conversation with the patient or a family as something an objective measures.',
};

export const ONCOLOGY_SCENARIO_MAPPINGS: readonly ScenarioMapping[] = [
  // --- delayed-immune-event-a-drug-that-stopped-months-ago (clinic) ---
  { scenarioId: 'delayed-immune-event-a-drug-that-stopped-months-ago', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-outpatient-management', objectiveIds: ['record-oncology-delayed-immune-event-an-exposure-that-ended', 'record-oncology-delayed-immune-event-infection-alongside-not-ahead', 'record-oncology-delayed-immune-event-bounded-qualified-intent'] },
  { scenarioId: 'delayed-immune-event-a-drug-that-stopped-months-ago', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-oncology-delayed-immune-event-an-exposure-that-ended', 'record-oncology-delayed-immune-event-infection-alongside-not-ahead', 'record-oncology-delayed-immune-event-bounded-qualified-intent'] },
  { scenarioId: 'delayed-immune-event-a-drug-that-stopped-months-ago', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['recognize-oncology-delayed-immune-event-an-interval-is-not-a-defence', 'review-oncology-delayed-immune-event-boundaries-and-their-certainty'] },
  { scenarioId: 'delayed-immune-event-a-drug-that-stopped-months-ago', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-oncology-delayed-immune-event-the-service-that-gave-the-drug', 'handoff-oncology-delayed-immune-event-an-exposure-that-travels'] },
  { scenarioId: 'delayed-immune-event-a-drug-that-stopped-months-ago', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-oncology-delayed-immune-event-the-service-that-gave-the-drug'] },
  { scenarioId: 'delayed-immune-event-a-drug-that-stopped-months-ago', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-oncology-delayed-immune-event-an-exposure-that-travels'] },
  // --- incidental-clot-a-decision-the-evidence-cannot-make (clinic) ---
  { scenarioId: 'incidental-clot-a-decision-the-evidence-cannot-make', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-outpatient-management', objectiveIds: ['record-oncology-incidental-clot-how-the-finding-was-found', 'record-oncology-incidental-clot-the-benefit-and-the-harm-together', 'record-oncology-incidental-clot-this-patients-bleeding-risk', 'record-oncology-incidental-clot-a-decision-made-with-him'] },
  { scenarioId: 'incidental-clot-a-decision-the-evidence-cannot-make', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-oncology-incidental-clot-how-the-finding-was-found', 'record-oncology-incidental-clot-the-benefit-and-the-harm-together', 'record-oncology-incidental-clot-this-patients-bleeding-risk', 'record-oncology-incidental-clot-a-decision-made-with-him'] },
  { scenarioId: 'incidental-clot-a-decision-the-evidence-cannot-make', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['recognize-oncology-incidental-clot-a-conditional-recommendation', 'review-oncology-incidental-clot-boundaries-and-their-certainty'] },
  { scenarioId: 'incidental-clot-a-decision-the-evidence-cannot-make', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-oncology-incidental-clot-a-decision-returned-to-its-owner', 'handoff-oncology-incidental-clot-an-unresolved-decision'] },
  { scenarioId: 'incidental-clot-a-decision-the-evidence-cannot-make', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-oncology-incidental-clot-a-decision-returned-to-its-owner'] },
  { scenarioId: 'incidental-clot-a-decision-the-evidence-cannot-make', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-oncology-incidental-clot-an-unresolved-decision'] },
  // --- normal-test-toxicity-the-dose-in-his-bag (clinic) ---
  { scenarioId: 'normal-test-toxicity-the-dose-in-his-bag', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-oncology-normal-test-toxicity-the-action-that-is-yours', 'activate-oncology-normal-test-toxicity-the-service-that-prescribed-it', 'handoff-oncology-normal-test-toxicity-a-drug-that-stays-stopped'] },
  { scenarioId: 'normal-test-toxicity-the-dose-in-his-bag', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-oncology-normal-test-toxicity-the-action-that-is-yours', 'activate-oncology-normal-test-toxicity-the-service-that-prescribed-it'] },
  { scenarioId: 'normal-test-toxicity-the-dose-in-his-bag', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['recognize-oncology-normal-test-toxicity-a-panel-is-not-a-clearance', 'review-oncology-normal-test-toxicity-boundaries-and-their-certainty'] },
  { scenarioId: 'normal-test-toxicity-the-dose-in-his-bag', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['recognize-oncology-normal-test-toxicity-a-panel-is-not-a-clearance'] },
  { scenarioId: 'normal-test-toxicity-the-dose-in-his-bag', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-outpatient-management', objectiveIds: ['record-oncology-normal-test-toxicity-severity-and-the-day', 'record-oncology-normal-test-toxicity-bounded-qualified-intent'] },
  { scenarioId: 'normal-test-toxicity-the-dose-in-his-bag', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-oncology-normal-test-toxicity-severity-and-the-day', 'record-oncology-normal-test-toxicity-bounded-qualified-intent'] },
  { scenarioId: 'normal-test-toxicity-the-dose-in-his-bag', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-oncology-normal-test-toxicity-a-drug-that-stays-stopped'] },
  // --- prognosis-question-a-number-he-asked-for (clinic) ---
  { scenarioId: 'prognosis-question-a-number-he-asked-for', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-oncology-prognosis-question-the-question-behind-it'] },
  { scenarioId: 'prognosis-question-a-number-he-asked-for', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-oncology-prognosis-question-the-question-behind-it', 'recognize-oncology-prognosis-question-what-he-believes-treatment-is-for', 'review-oncology-prognosis-question-the-direction-of-the-error', 'review-oncology-prognosis-question-boundaries-and-their-certainty'] },
  { scenarioId: 'prognosis-question-a-number-he-asked-for', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-outpatient-management', objectiveIds: ['record-oncology-prognosis-question-in-his-own-words', 'record-oncology-prognosis-question-scenarios-not-a-number'] },
  { scenarioId: 'prognosis-question-a-number-he-asked-for', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-oncology-prognosis-question-in-his-own-words', 'record-oncology-prognosis-question-scenarios-not-a-number'] },
  { scenarioId: 'prognosis-question-a-number-he-asked-for', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-oncology-prognosis-question-what-he-took-from-it'] },
  { scenarioId: 'prognosis-question-a-number-he-asked-for', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['handoff-oncology-prognosis-question-what-he-took-from-it'] },
  // --- laboratory-tls-a-syndrome-he-does-not-have-yet (clinic) ---
  { scenarioId: 'laboratory-tls-a-syndrome-he-does-not-have-yet', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['recognize-oncology-laboratory-tls-which-definition-is-met'] },
  { scenarioId: 'laboratory-tls-a-syndrome-he-does-not-have-yet', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['recognize-oncology-laboratory-tls-which-definition-is-met', 'review-oncology-laboratory-tls-boundaries-and-their-certainty'] },
  { scenarioId: 'laboratory-tls-a-syndrome-he-does-not-have-yet', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-outpatient-management', objectiveIds: ['record-oncology-laboratory-tls-what-crossed-and-when', 'record-oncology-laboratory-tls-the-crossing-risk', 'record-oncology-laboratory-tls-bounded-qualified-intent'] },
  { scenarioId: 'laboratory-tls-a-syndrome-he-does-not-have-yet', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-oncology-laboratory-tls-what-crossed-and-when', 'record-oncology-laboratory-tls-the-crossing-risk', 'record-oncology-laboratory-tls-bounded-qualified-intent'] },
  { scenarioId: 'laboratory-tls-a-syndrome-he-does-not-have-yet', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-oncology-laboratory-tls-a-trajectory-not-an-alarm', 'handoff-oncology-laboratory-tls-a-window-not-an-event'] },
  { scenarioId: 'laboratory-tls-a-syndrome-he-does-not-have-yet', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-oncology-laboratory-tls-a-trajectory-not-an-alarm'] },
  { scenarioId: 'laboratory-tls-a-syndrome-he-does-not-have-yet', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-oncology-laboratory-tls-a-window-not-an-event'] },
  // --- rare-early-myocarditis-a-base-rate-is-not-a-threshold (clinic) ---
  { scenarioId: 'rare-early-myocarditis-a-base-rate-is-not-a-threshold', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-outpatient-management', objectiveIds: ['record-oncology-rare-early-myocarditis-the-exposure-interval'] },
  { scenarioId: 'rare-early-myocarditis-a-base-rate-is-not-a-threshold', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-oncology-rare-early-myocarditis-the-exposure-interval'] },
  { scenarioId: 'rare-early-myocarditis-a-base-rate-is-not-a-threshold', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['recognize-oncology-rare-early-myocarditis-what-does-not-sound-cardiac', 'recognize-oncology-rare-early-myocarditis-rarity-is-not-a-reason', 'review-oncology-rare-early-myocarditis-boundaries-and-their-certainty'] },
  { scenarioId: 'rare-early-myocarditis-a-base-rate-is-not-a-threshold', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-oncology-rare-early-myocarditis-watch-the-conduction', 'activate-oncology-rare-early-myocarditis-both-teams-not-one', 'handoff-oncology-rare-early-myocarditis-a-window-held-jointly'] },
  { scenarioId: 'rare-early-myocarditis-a-base-rate-is-not-a-threshold', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-oncology-rare-early-myocarditis-watch-the-conduction', 'activate-oncology-rare-early-myocarditis-both-teams-not-one'] },
  { scenarioId: 'rare-early-myocarditis-a-base-rate-is-not-a-threshold', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-oncology-rare-early-myocarditis-a-window-held-jointly'] },
  // --- lowering-the-count-a-number-that-can-be-moved (clinic) ---
  { scenarioId: 'lowering-the-count-a-number-that-can-be-moved', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['recognize-oncology-lowering-the-count-a-clinical-designation', 'recognize-oncology-lowering-the-count-moving-a-number-is-not-helping', 'review-oncology-lowering-the-count-boundaries-and-their-certainty'] },
  { scenarioId: 'lowering-the-count-a-number-that-can-be-moved', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-outpatient-management', objectiveIds: ['record-oncology-lowering-the-count-urgency-without-a-manoeuvre', 'record-oncology-lowering-the-count-bounded-qualified-intent'] },
  { scenarioId: 'lowering-the-count-a-number-that-can-be-moved', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-oncology-lowering-the-count-urgency-without-a-manoeuvre', 'record-oncology-lowering-the-count-bounded-qualified-intent'] },
  { scenarioId: 'lowering-the-count-a-number-that-can-be-moved', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-oncology-lowering-the-count-the-shortest-path', 'handoff-oncology-lowering-the-count-what-makes-it-an-emergency'] },
  { scenarioId: 'lowering-the-count-a-number-that-can-be-moved', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-oncology-lowering-the-count-the-shortest-path'] },
  { scenarioId: 'lowering-the-count-a-number-that-can-be-moved', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-oncology-lowering-the-count-what-makes-it-an-emergency'] },
  // --- inherited-urgency-an-emergency-that-mostly-is-not-one (clinic) ---
  { scenarioId: 'inherited-urgency-an-emergency-that-mostly-is-not-one', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['recognize-oncology-inherited-urgency-the-findings-that-grade-it', 'recognize-oncology-inherited-urgency-the-cost-of-hurrying', 'review-oncology-inherited-urgency-boundaries-and-their-certainty'] },
  { scenarioId: 'inherited-urgency-an-emergency-that-mostly-is-not-one', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-outpatient-management', objectiveIds: ['record-oncology-inherited-urgency-the-tissue-decides', 'record-oncology-inherited-urgency-bounded-qualified-intent'] },
  { scenarioId: 'inherited-urgency-an-emergency-that-mostly-is-not-one', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-oncology-inherited-urgency-the-tissue-decides', 'record-oncology-inherited-urgency-bounded-qualified-intent'] },
  { scenarioId: 'inherited-urgency-an-emergency-that-mostly-is-not-one', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-oncology-inherited-urgency-securing-the-pathway', 'handoff-oncology-inherited-urgency-what-would-change-it'] },
  { scenarioId: 'inherited-urgency-an-emergency-that-mostly-is-not-one', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-oncology-inherited-urgency-securing-the-pathway'] },
  { scenarioId: 'inherited-urgency-an-emergency-that-mostly-is-not-one', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-oncology-inherited-urgency-what-would-change-it'] },
  // --- trial-rule-a-rule-written-for-a-database (clinic) ---
  { scenarioId: 'trial-rule-a-rule-written-for-a-database', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['recognize-oncology-trial-rule-the-slope-not-the-moment', 'recognize-oncology-trial-rule-both-errors-are-real', 'review-oncology-trial-rule-boundaries-and-their-certainty'] },
  { scenarioId: 'trial-rule-a-rule-written-for-a-database', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-outpatient-management', objectiveIds: ['record-oncology-trial-rule-what-the-criteria-govern', 'record-oncology-trial-rule-bounded-qualified-intent'] },
  { scenarioId: 'trial-rule-a-rule-written-for-a-database', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-oncology-trial-rule-what-the-criteria-govern', 'record-oncology-trial-rule-bounded-qualified-intent'] },
  { scenarioId: 'trial-rule-a-rule-written-for-a-database', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-oncology-trial-rule-the-team-that-decides', 'handoff-oncology-trial-rule-the-direction-and-its-rate'] },
  { scenarioId: 'trial-rule-a-rule-written-for-a-database', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-oncology-trial-rule-the-team-that-decides'] },
  { scenarioId: 'trial-rule-a-rule-written-for-a-database', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-oncology-trial-rule-the-direction-and-its-rate'] },
  // --- silent-interaction-a-harm-with-nothing-to-find (clinic) ---
  { scenarioId: 'silent-interaction-a-harm-with-nothing-to-find', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['recognize-oncology-silent-interaction-what-she-swallows', 'recognize-oncology-silent-interaction-neither-theory-nor-proof', 'review-oncology-silent-interaction-boundaries-and-their-certainty'] },
  { scenarioId: 'silent-interaction-a-harm-with-nothing-to-find', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-outpatient-management', objectiveIds: ['record-oncology-silent-interaction-the-direction-of-harm', 'record-oncology-silent-interaction-bounded-qualified-intent'] },
  { scenarioId: 'silent-interaction-a-harm-with-nothing-to-find', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-oncology-silent-interaction-the-direction-of-harm', 'record-oncology-silent-interaction-bounded-qualified-intent'] },
  { scenarioId: 'silent-interaction-a-harm-with-nothing-to-find', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-oncology-silent-interaction-a-route-that-ends-with-a-person', 'handoff-oncology-silent-interaction-an-absence-that-travels'] },
  { scenarioId: 'silent-interaction-a-harm-with-nothing-to-find', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-oncology-silent-interaction-a-route-that-ends-with-a-person'] },
  { scenarioId: 'silent-interaction-a-harm-with-nothing-to-find', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-oncology-silent-interaction-an-absence-that-travels'] },
  // --- easy-label-a-label-that-fits-too-easily (clinic) ---
  { scenarioId: 'easy-label-a-label-that-fits-too-easily', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['recognize-oncology-easy-label-a-diagnosis-of-exclusion', 'recognize-oncology-easy-label-a-treatment-that-worsens-the-alternative', 'review-oncology-easy-label-boundaries-that-pull-apart'] },
  { scenarioId: 'easy-label-a-label-that-fits-too-easily', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-outpatient-management', objectiveIds: ['record-oncology-easy-label-what-remains-open', 'record-oncology-easy-label-bounded-qualified-intent'] },
  { scenarioId: 'easy-label-a-label-that-fits-too-easily', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-oncology-easy-label-what-remains-open', 'record-oncology-easy-label-bounded-qualified-intent'] },
  { scenarioId: 'easy-label-a-label-that-fits-too-easily', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-oncology-easy-label-both-at-once', 'handoff-oncology-easy-label-an-answer-nobody-reached'] },
  { scenarioId: 'easy-label-a-label-that-fits-too-easily', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-oncology-easy-label-both-at-once'] },
  { scenarioId: 'easy-label-a-label-that-fits-too-easily', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-oncology-easy-label-an-answer-nobody-reached'] },
];
