/**
 * The infectious disease lessons mapped to the ACGME's Internal Medicine
 * Milestones (framework-mapping-expansion → scenario mappings).
 *
 * All ten lessons are declared `emergency-department`, and that needs saying
 * rather than quietly resolving: the internal medicine reading divides
 * management into inpatient and outpatient and has no third setting. An
 * emergency-department encounter is not clinic care, and the inpatient
 * subcompetency's own descriptors speak of acuity and of patients requiring
 * critical care, so inpatient is the honest of the two. The outpatient
 * subcompetency is recorded as uncovered with that reason, so nobody reads the
 * choice as an accident.
 */

import { ACGME_INTERNAL_MEDICINE_MILESTONES } from '@platform/curriculum/acgme-internal-medicine';
import type { FrameworkRecord } from '@platform/curriculum/framework-records';
import type { ScenarioMapping } from '@platform/curriculum/mapping';

const FRAMEWORK_ID = ACGME_INTERNAL_MEDICINE_MILESTONES.id;

/** The readings this module's lessons are mapped against. */
export const INFECTIOUS_DISEASE_FRAMEWORKS: readonly FrameworkRecord[] = [
  ACGME_INTERNAL_MEDICINE_MILESTONES,
];

/** Subcompetencies no lesson in this module exercises, and why. */
export const INFECTIOUS_DISEASE_UNCOVERED: Readonly<Record<string, string>> = {
  'pc-5-outpatient-management': 'All ten lessons are declared emergency-department lessons. The reading has no third setting, and an emergency encounter is not clinic care.',
  'pc-6-digital-health': 'No lesson is a telehealth encounter or uses a patient-facing digital tool.',
  'sbp-3-physician-role-in-health-care-systems': 'No lesson models cost, access, or what a health system makes available.',
  'pbli-1-evidence-based-practice': 'Lessons cite the evidence behind their own steps, but none asks the learner to locate or appraise it.',
  'pbli-2-reflective-practice': 'Reflection happens in the debrief, which is not part of any lesson\'s objectives.',
  'prof-1-professional-behavior': 'Conduct toward the patient and the team is modelled as communication rather than tested as behaviour.',
  'prof-2-ethical-principles': 'No lesson puts a duty to the patient in conflict with anything.',
  'prof-3-accountability': 'Recording what was done is how every lesson works, which makes it the medium rather than a thing measured.',
  'prof-4-knowledge-of-well-being-factors': 'Nothing here models well-being, the learner\'s or anybody else\'s.',
  'mk-1-applied-foundational-sciences': 'These lessons reason from a pattern of evidence to a decision rather than from a mechanism; the physiology is in the lesson, never in an objective.',
  'ics-1-patient-and-family-communication': 'No lesson has a conversation with the patient or a family as something an objective measures.',
};

export const INFECTIOUS_DISEASE_SCENARIO_MAPPINGS: readonly ScenarioMapping[] = [
  // --- meningococcal-sepsis-recognition-and-escalation (emergency-department) ---
  { scenarioId: 'meningococcal-sepsis-recognition-and-escalation', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-infectious-disease-meningococcal-rash-perfusion-conscious-level-and-whole-patient'] },
  { scenarioId: 'meningococcal-sepsis-recognition-and-escalation', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-infectious-disease-meningococcal-rash-perfusion-conscious-level-and-whole-patient', 'recognize-infectious-disease-meningococcal-pattern-without-single-marker-or-vaccination-closure', 'review-infectious-disease-meningococcal-timing-and-fluid-ceiling-boundary'] },
  { scenarioId: 'meningococcal-sepsis-recognition-and-escalation', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['reconcile-infectious-disease-meningococcal-rash-perfusion-conscious-level-and-whole-patient'] },
  { scenarioId: 'meningococcal-sepsis-recognition-and-escalation', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-infectious-disease-meningococcal-senior-decision-maker-and-critical-care-ownership', 'handoff-infectious-disease-meningococcal-unresolved-shock-source-and-active-risk'] },
  { scenarioId: 'meningococcal-sepsis-recognition-and-escalation', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-infectious-disease-meningococcal-senior-decision-maker-and-critical-care-ownership'] },
  { scenarioId: 'meningococcal-sepsis-recognition-and-escalation', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['record-infectious-disease-meningococcal-bounded-intent-and-consultant-attendance'] },
  { scenarioId: 'meningococcal-sepsis-recognition-and-escalation', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-infectious-disease-meningococcal-bounded-intent-and-consultant-attendance'] },
  { scenarioId: 'meningococcal-sepsis-recognition-and-escalation', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-infectious-disease-meningococcal-unresolved-shock-source-and-active-risk'] },
  // --- obstructed-infected-kidney-decompression (emergency-department) ---
  { scenarioId: 'obstructed-infected-kidney-decompression', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-infectious-disease-obstruction-fever-perfusion-kidney-function-and-supplied-imaging'] },
  { scenarioId: 'obstructed-infected-kidney-decompression', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-infectious-disease-obstruction-fever-perfusion-kidney-function-and-supplied-imaging', 'recognize-infectious-disease-obstruction-undrained-source-rather-than-severe-infection', 'review-infectious-disease-obstruction-timing-modality-and-evidence-boundary'] },
  { scenarioId: 'obstructed-infected-kidney-decompression', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['reconcile-infectious-disease-obstruction-fever-perfusion-kidney-function-and-supplied-imaging'] },
  { scenarioId: 'obstructed-infected-kidney-decompression', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-infectious-disease-obstruction-urology-interventional-radiology-and-culture-ownership', 'handoff-infectious-disease-obstruction-unresolved-infection-kidney-function-and-active-risk'] },
  { scenarioId: 'obstructed-infected-kidney-decompression', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-infectious-disease-obstruction-urology-interventional-radiology-and-culture-ownership'] },
  { scenarioId: 'obstructed-infected-kidney-decompression', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['record-infectious-disease-obstruction-bounded-decompression-intent-and-deferred-stone-treatment'] },
  { scenarioId: 'obstructed-infected-kidney-decompression', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-infectious-disease-obstruction-bounded-decompression-intent-and-deferred-stone-treatment'] },
  { scenarioId: 'obstructed-infected-kidney-decompression', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-infectious-disease-obstruction-unresolved-infection-kidney-function-and-active-risk'] },
  // --- febrile-neutropenia-blind-examination (emergency-department) ---
  { scenarioId: 'febrile-neutropenia-blind-examination', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-infectious-disease-neutropenia-fever-count-chemotherapy-day-and-absent-local-signs'] },
  { scenarioId: 'febrile-neutropenia-blind-examination', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-infectious-disease-neutropenia-fever-count-chemotherapy-day-and-absent-local-signs', 'recognize-infectious-disease-neutropenia-emergency-despite-a-blind-examination', 'review-infectious-disease-neutropenia-timing-and-risk-score-boundary'] },
  { scenarioId: 'febrile-neutropenia-blind-examination', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-infectious-disease-neutropenia-pathway-and-culture-ownership', 'handoff-infectious-disease-neutropenia-continuing-neutropenia-absent-source-and-active-risk'] },
  { scenarioId: 'febrile-neutropenia-blind-examination', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-infectious-disease-neutropenia-pathway-and-culture-ownership'] },
  { scenarioId: 'febrile-neutropenia-blind-examination', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['record-infectious-disease-neutropenia-bounded-empiric-intent-and-strict-reassessment'] },
  { scenarioId: 'febrile-neutropenia-blind-examination', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-infectious-disease-neutropenia-bounded-empiric-intent-and-strict-reassessment'] },
  { scenarioId: 'febrile-neutropenia-blind-examination', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-infectious-disease-neutropenia-continuing-neutropenia-absent-source-and-active-risk'] },
  // --- necrotizing-infection-score-cannot-exclude (emergency-department) ---
  { scenarioId: 'necrotizing-infection-score-cannot-exclude', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-infectious-disease-necrotizing-pain-margin-and-failed-oral-treatment'] },
  { scenarioId: 'necrotizing-infection-score-cannot-exclude', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-infectious-disease-necrotizing-pain-margin-and-failed-oral-treatment', 'recognize-infectious-disease-necrotizing-that-a-low-score-excludes-nothing', 'review-infectious-disease-necrotizing-score-sensitivity-and-timing-evidence-boundary'] },
  { scenarioId: 'necrotizing-infection-score-cannot-exclude', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-infectious-disease-necrotizing-surgical-review-and-marked-border-ownership', 'handoff-infectious-disease-necrotizing-unconfirmed-diagnosis-and-active-risk'] },
  { scenarioId: 'necrotizing-infection-score-cannot-exclude', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-infectious-disease-necrotizing-surgical-review-and-marked-border-ownership'] },
  { scenarioId: 'necrotizing-infection-score-cannot-exclude', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['record-infectious-disease-necrotizing-bounded-antimicrobial-intent-and-strict-reassessment'] },
  { scenarioId: 'necrotizing-infection-score-cannot-exclude', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-infectious-disease-necrotizing-bounded-antimicrobial-intent-and-strict-reassessment'] },
  { scenarioId: 'necrotizing-infection-score-cannot-exclude', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-infectious-disease-necrotizing-unconfirmed-diagnosis-and-active-risk'] },
  // --- endocarditis-mechanical-failure-on-a-surgical-clock (emergency-department) ---
  { scenarioId: 'endocarditis-mechanical-failure-on-a-surgical-clock', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-infectious-disease-endocarditis-breathlessness-with-a-responding-infection'] },
  { scenarioId: 'endocarditis-mechanical-failure-on-a-surgical-clock', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-infectious-disease-endocarditis-breathlessness-with-a-responding-infection', 'recognize-infectious-disease-endocarditis-mechanical-failure-not-antimicrobial-failure', 'review-infectious-disease-endocarditis-acute-regurgitation-and-timing-evidence-boundary'] },
  { scenarioId: 'endocarditis-mechanical-failure-on-a-surgical-clock', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-infectious-disease-endocarditis-team-and-surgical-centre-ownership', 'handoff-infectious-disease-endocarditis-pending-surgical-decision-and-active-risk'] },
  { scenarioId: 'endocarditis-mechanical-failure-on-a-surgical-clock', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-infectious-disease-endocarditis-team-and-surgical-centre-ownership'] },
  { scenarioId: 'endocarditis-mechanical-failure-on-a-surgical-clock', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['record-infectious-disease-endocarditis-bounded-surgical-referral-and-strict-reassessment'] },
  { scenarioId: 'endocarditis-mechanical-failure-on-a-surgical-clock', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-infectious-disease-endocarditis-bounded-surgical-referral-and-strict-reassessment'] },
  { scenarioId: 'endocarditis-mechanical-failure-on-a-surgical-clock', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-infectious-disease-endocarditis-pending-surgical-decision-and-active-risk'] },
  // --- severe-pneumonia-the-score-answered-another-question (emergency-department) ---
  { scenarioId: 'severe-pneumonia-the-score-answered-another-question', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-infectious-disease-pneumonia-two-correct-instruments-that-disagree'] },
  { scenarioId: 'severe-pneumonia-the-score-answered-another-question', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-infectious-disease-pneumonia-two-correct-instruments-that-disagree', 'recognize-infectious-disease-pneumonia-instrument-question-mismatch', 'review-infectious-disease-pneumonia-triage-evidence-boundary'] },
  { scenarioId: 'severe-pneumonia-the-score-answered-another-question', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-infectious-disease-pneumonia-critical-care-review-ownership', 'handoff-infectious-disease-pneumonia-pending-level-of-care-and-active-risk'] },
  { scenarioId: 'severe-pneumonia-the-score-answered-another-question', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-infectious-disease-pneumonia-critical-care-review-ownership'] },
  { scenarioId: 'severe-pneumonia-the-score-answered-another-question', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['record-infectious-disease-pneumonia-bounded-escalation-intent-and-strict-reassessment'] },
  { scenarioId: 'severe-pneumonia-the-score-answered-another-question', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-infectious-disease-pneumonia-bounded-escalation-intent-and-strict-reassessment'] },
  { scenarioId: 'severe-pneumonia-the-score-answered-another-question', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-infectious-disease-pneumonia-pending-level-of-care-and-active-risk'] },
  // --- toxic-shock-a-definition-that-cannot-close (emergency-department) ---
  { scenarioId: 'toxic-shock-a-definition-that-cannot-close', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-infectious-disease-toxic-shock-erythroderma-hypotension-and-organ-involvement'] },
  { scenarioId: 'toxic-shock-a-definition-that-cannot-close', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-infectious-disease-toxic-shock-erythroderma-hypotension-and-organ-involvement', 'recognize-infectious-disease-toxic-shock-pattern-without-a-closable-definition', 'review-infectious-disease-toxic-shock-surveillance-definition-boundary'] },
  { scenarioId: 'toxic-shock-a-definition-that-cannot-close', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-infectious-disease-toxic-shock-critical-care-and-culture-ownership', 'handoff-infectious-disease-toxic-shock-an-explicitly-open-diagnosis'] },
  { scenarioId: 'toxic-shock-a-definition-that-cannot-close', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-infectious-disease-toxic-shock-critical-care-and-culture-ownership'] },
  { scenarioId: 'toxic-shock-a-definition-that-cannot-close', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['review-infectious-disease-toxic-shock-surveillance-definition-boundary'] },
  { scenarioId: 'toxic-shock-a-definition-that-cannot-close', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['record-infectious-disease-toxic-shock-open-definition-status-and-recheck-horizon'] },
  { scenarioId: 'toxic-shock-a-definition-that-cannot-close', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-infectious-disease-toxic-shock-open-definition-status-and-recheck-horizon'] },
  { scenarioId: 'toxic-shock-a-definition-that-cannot-close', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-infectious-disease-toxic-shock-an-explicitly-open-diagnosis'] },
  // --- possible-sepsis-a-clock-that-runs-either-way (emergency-department) ---
  { scenarioId: 'possible-sepsis-a-clock-that-runs-either-way', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-infectious-disease-possible-sepsis-fever-without-a-source-or-shock'] },
  { scenarioId: 'possible-sepsis-a-clock-that-runs-either-way', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-infectious-disease-possible-sepsis-fever-without-a-source-or-shock', 'recognize-infectious-disease-possible-sepsis-that-the-ceiling-runs-from-suspicion', 'review-infectious-disease-possible-sepsis-tiered-guidance-and-certainty-boundary'] },
  { scenarioId: 'possible-sepsis-a-clock-that-runs-either-way', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-infectious-disease-possible-sepsis-time-limited-assessment-not-observation', 'handoff-infectious-disease-possible-sepsis-a-travelling-clock-and-open-classification'] },
  { scenarioId: 'possible-sepsis-a-clock-that-runs-either-way', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-infectious-disease-possible-sepsis-time-limited-assessment-not-observation'] },
  { scenarioId: 'possible-sepsis-a-clock-that-runs-either-way', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['record-infectious-disease-possible-sepsis-bounded-intent-inside-the-ceiling'] },
  { scenarioId: 'possible-sepsis-a-clock-that-runs-either-way', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-infectious-disease-possible-sepsis-bounded-intent-inside-the-ceiling'] },
  { scenarioId: 'possible-sepsis-a-clock-that-runs-either-way', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-infectious-disease-possible-sepsis-a-travelling-clock-and-open-classification'] },
  // --- septic-shock-a-label-the-treatment-creates (emergency-department) ---
  { scenarioId: 'septic-shock-a-label-the-treatment-creates', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-infectious-disease-septic-shock-hypoperfusion-before-any-label'] },
  { scenarioId: 'septic-shock-a-label-the-treatment-creates', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-infectious-disease-septic-shock-hypoperfusion-before-any-label', 'recognize-infectious-disease-septic-shock-two-criteria-have-no-truth-value-yet', 'review-infectious-disease-septic-shock-targets-and-their-grades'] },
  { scenarioId: 'septic-shock-a-label-the-treatment-creates', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['reconcile-infectious-disease-septic-shock-hypoperfusion-before-any-label'] },
  { scenarioId: 'septic-shock-a-label-the-treatment-creates', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-infectious-disease-septic-shock-critical-care-on-the-pattern-not-the-name', 'handoff-infectious-disease-septic-shock-a-label-that-reflects-a-treatment'] },
  { scenarioId: 'septic-shock-a-label-the-treatment-creates', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-infectious-disease-septic-shock-critical-care-on-the-pattern-not-the-name'] },
  { scenarioId: 'septic-shock-a-label-the-treatment-creates', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['record-infectious-disease-septic-shock-bounded-intent-that-is-also-the-measurement'] },
  { scenarioId: 'septic-shock-a-label-the-treatment-creates', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-infectious-disease-septic-shock-bounded-intent-that-is-also-the-measurement'] },
  { scenarioId: 'septic-shock-a-label-the-treatment-creates', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-infectious-disease-septic-shock-a-label-that-reflects-a-treatment'] },
  // --- meningitis-imaging-a-rule-that-does-not-agree (emergency-department) ---
  { scenarioId: 'meningitis-imaging-a-rule-that-does-not-agree', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-infectious-disease-meningitis-imaging-the-features-and-their-absences'] },
  { scenarioId: 'meningitis-imaging-a-rule-that-does-not-agree', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-infectious-disease-meningitis-imaging-the-features-and-their-absences', 'recognize-infectious-disease-meningitis-imaging-that-the-rule-sets-disagree'] },
  { scenarioId: 'meningitis-imaging-a-rule-that-does-not-agree', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['recognize-infectious-disease-meningitis-imaging-that-the-rule-sets-disagree', 'review-infectious-disease-meningitis-imaging-boundaries-and-their-certainty'] },
  { scenarioId: 'meningitis-imaging-a-rule-that-does-not-agree', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-infectious-disease-meningitis-imaging-ownership-without-waiting-on-the-question', 'handoff-infectious-disease-meningitis-imaging-what-the-pathway-cost'] },
  { scenarioId: 'meningitis-imaging-a-rule-that-does-not-agree', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-infectious-disease-meningitis-imaging-ownership-without-waiting-on-the-question'] },
  { scenarioId: 'meningitis-imaging-a-rule-that-does-not-agree', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['record-infectious-disease-meningitis-imaging-intent-that-does-not-wait'] },
  { scenarioId: 'meningitis-imaging-a-rule-that-does-not-agree', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-infectious-disease-meningitis-imaging-intent-that-does-not-wait'] },
  { scenarioId: 'meningitis-imaging-a-rule-that-does-not-agree', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-infectious-disease-meningitis-imaging-what-the-pathway-cost'] },
];
