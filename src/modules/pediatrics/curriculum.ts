/**
 * The paediatric lessons mapped to the ACGME's Pediatrics Milestones
 * (framework-mapping-expansion → scenario mappings).
 *
 * This module's sixteen lessons share one authored shape - reconcile what was
 * supplied with what is observed, name the pattern and its boundary, hand the
 * work to a qualified team, hold the unresolved threads open, look again after
 * time, hand over - so the convention is stated against that shape and the
 * mapping follows from each objective's own role in it:
 *
 * - Joining a supplied account with the observed child → Patient Care 1 and
 *   Patient Care 4.
 * - Naming the pattern, or the boundary of what it claims → Patient Care 4 and
 *   Medical Knowledge 1.
 * - Handing the work to, or confirming, an experienced team's ownership →
 *   Systems-Based Practice 3 and Interpersonal and Communication Skills 2, with
 *   Patient Care 5 where the objective also directs the care itself.
 * - Holding causes, alternatives and escalation triggers open in parallel →
 *   Patient Care 3 and Medical Knowledge 2.
 * - Looking at the child again after time, without calling an improvement a
 *   cure → Patient Care 2 and Systems-Based Practice 1.
 * - Handing over → Systems-Based Practice 4 and Interpersonal and
 *   Communication Skills 3.
 * - Where an objective's own statement names the caregiver as part of the work
 *   → Interpersonal and Communication Skills 1. Nine do, and they are listed by
 *   name rather than guessed at from the module's subject.
 * - The safeguarding lesson's two objectives that turn on what may be concluded
 *   and what may be shared → Professionalism 2.
 *
 * Pediatrics divides its subcompetencies differently from emergency medicine,
 * and the mapping follows those divisions: history and examination are separate
 * here, so the lesson that reconciles an account and the lesson that re-reads a
 * child land in different places.
 *
 * Eight of the twenty-two are mapped by nothing, each with its reason recorded
 * below and pinned in both directions by
 * `tests/unit/pediatrics-curriculum.test.ts`.
 */

import { ACGME_PEDIATRICS_MILESTONES } from '@platform/curriculum/acgme-pediatrics';
import type { FrameworkRecord } from '@platform/curriculum/framework-records';
import type { ScenarioMapping } from '@platform/curriculum/mapping';

const FRAMEWORK_ID = ACGME_PEDIATRICS_MILESTONES.id;

/** The readings this module's lessons are mapped against. */
export const PEDIATRICS_FRAMEWORKS: readonly FrameworkRecord[] = [ACGME_PEDIATRICS_MILESTONES];

/** Subcompetencies no lesson in this module exercises, and why. */
export const PEDIATRICS_UNCOVERED: Readonly<Record<string, string>> = {
  'sbp-2-quality-improvement': 'Quality improvement is measured over cases; every lesson here is one child on one day.',
  'sbp-5-population-and-community-health': 'Nothing here models a population: the unit of every lesson is a single child.',
  'sbp-6-physician-role-in-health-care-systems': 'No lesson models cost, access, or what a health system makes available.',
  'pbli-1-evidence-based-practice': 'Lessons cite the evidence behind their own steps, but none asks the learner to locate or appraise it.',
  'pbli-2-reflective-practice': 'Reflection happens in the debrief, which is not part of any lesson\'s objectives.',
  'prof-1-professional-behavior': 'Conduct toward the family and the team is modelled as communication rather than tested as behaviour.',
  'prof-3-accountability': 'Recording what was done is how every lesson works, which makes it the medium rather than a thing measured.',
  'prof-4-well-being': 'Nothing here models the learner\'s own state.',
};

export const PEDIATRICS_SCENARIO_MAPPINGS: readonly ScenarioMapping[] = [
  // --- pediatric-respiratory-distress ---
  { scenarioId: 'pediatric-respiratory-distress', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-pediatric-respiratory-distress-whole-child'] },
  { scenarioId: 'pediatric-respiratory-distress', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-clinical-reasoning', objectiveIds: ['reconcile-pediatric-respiratory-distress-whole-child'] },
  { scenarioId: 'pediatric-respiratory-distress', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-coordination-of-care', objectiveIds: ['activate-pediatric-respiratory-distress-support', 'activate-pediatric-respiratory-failure-rescue'] },
  { scenarioId: 'pediatric-respiratory-distress', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-pediatric-respiratory-distress-support', 'activate-pediatric-respiratory-failure-rescue'] },
  { scenarioId: 'pediatric-respiratory-distress', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-patient-management', objectiveIds: ['activate-pediatric-respiratory-distress-support', 'activate-pediatric-respiratory-failure-rescue'] },
  { scenarioId: 'pediatric-respiratory-distress', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-exam', objectiveIds: ['review-pediatric-respiratory-distress-early-response', 'review-pediatric-respiratory-distress-later-panel'] },
  { scenarioId: 'pediatric-respiratory-distress', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-pediatric-respiratory-distress-early-response', 'review-pediatric-respiratory-distress-later-panel'] },
  { scenarioId: 'pediatric-respiratory-distress', frameworkId: FRAMEWORK_ID, domainId: 'sbp-4-transitions-in-care', objectiveIds: ['handoff-pediatric-respiratory-distress-reassessment'] },
  { scenarioId: 'pediatric-respiratory-distress', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-pediatric-respiratory-distress-reassessment'] },
  // --- bronchiolitis ---
  { scenarioId: 'bronchiolitis', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-bronchiolitis-risk-and-trajectory'] },
  { scenarioId: 'bronchiolitis', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-clinical-reasoning', objectiveIds: ['reconcile-bronchiolitis-risk-and-trajectory', 'recognize-bronchiolitis-supportive-care-pattern'] },
  { scenarioId: 'bronchiolitis', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-clinical-knowledge', objectiveIds: ['recognize-bronchiolitis-supportive-care-pattern'] },
  { scenarioId: 'bronchiolitis', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-coordination-of-care', objectiveIds: ['activate-bronchiolitis-oxygenation-and-monitoring'] },
  { scenarioId: 'bronchiolitis', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-bronchiolitis-oxygenation-and-monitoring'] },
  { scenarioId: 'bronchiolitis', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-patient-management', objectiveIds: ['activate-bronchiolitis-oxygenation-and-monitoring'] },
  { scenarioId: 'bronchiolitis', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-organize-and-prioritize', objectiveIds: ['review-bronchiolitis-feeding-and-hydration'] },
  { scenarioId: 'bronchiolitis', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-diagnostic-evaluation', objectiveIds: ['review-bronchiolitis-feeding-and-hydration'] },
  { scenarioId: 'bronchiolitis', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-exam', objectiveIds: ['review-bronchiolitis-later-response'] },
  { scenarioId: 'bronchiolitis', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-bronchiolitis-later-response'] },
  { scenarioId: 'bronchiolitis', frameworkId: FRAMEWORK_ID, domainId: 'sbp-4-transitions-in-care', objectiveIds: ['handoff-bronchiolitis-active-risk'] },
  { scenarioId: 'bronchiolitis', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-bronchiolitis-active-risk'] },
  // --- croup ---
  { scenarioId: 'croup', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-croup-whole-child-upper-airway-pattern'] },
  { scenarioId: 'croup', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-clinical-reasoning', objectiveIds: ['reconcile-croup-whole-child-upper-airway-pattern'] },
  { scenarioId: 'croup', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-organize-and-prioritize', objectiveIds: ['review-croup-severity-and-alternative-red-flags', 'review-croup-recurrence-and-preserve-airway-readiness'] },
  { scenarioId: 'croup', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-diagnostic-evaluation', objectiveIds: ['review-croup-severity-and-alternative-red-flags', 'review-croup-recurrence-and-preserve-airway-readiness'] },
  { scenarioId: 'croup', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-patient-management', objectiveIds: ['record-croup-minimal-distress-support-and-qualified-treatment-intent'] },
  { scenarioId: 'croup', frameworkId: FRAMEWORK_ID, domainId: 'ics-1-patient-and-family-centered-communication', objectiveIds: ['record-croup-minimal-distress-support-and-qualified-treatment-intent', 'handoff-croup-active-upper-airway-risk'] },
  { scenarioId: 'croup', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-exam', objectiveIds: ['review-croup-early-response'] },
  { scenarioId: 'croup', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-croup-early-response'] },
  { scenarioId: 'croup', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-coordination-of-care', objectiveIds: ['review-croup-recurrence-and-preserve-airway-readiness'] },
  { scenarioId: 'croup', frameworkId: FRAMEWORK_ID, domainId: 'sbp-4-transitions-in-care', objectiveIds: ['handoff-croup-active-upper-airway-risk'] },
  { scenarioId: 'croup', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-croup-active-upper-airway-risk'] },
  // --- pediatric-status-asthmaticus ---
  { scenarioId: 'pediatric-status-asthmaticus', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-pediatric-status-asthmaticus-treatment-and-trajectory'] },
  { scenarioId: 'pediatric-status-asthmaticus', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-clinical-reasoning', objectiveIds: ['reconcile-pediatric-status-asthmaticus-treatment-and-trajectory', 'recognize-pediatric-status-asthmaticus-severe-nonresponse'] },
  { scenarioId: 'pediatric-status-asthmaticus', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-clinical-knowledge', objectiveIds: ['recognize-pediatric-status-asthmaticus-severe-nonresponse'] },
  { scenarioId: 'pediatric-status-asthmaticus', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-coordination-of-care', objectiveIds: ['activate-pediatric-status-asthmaticus-critical-care-escalation'] },
  { scenarioId: 'pediatric-status-asthmaticus', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-pediatric-status-asthmaticus-critical-care-escalation'] },
  { scenarioId: 'pediatric-status-asthmaticus', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-patient-management', objectiveIds: ['activate-pediatric-status-asthmaticus-critical-care-escalation', 'record-pediatric-status-asthmaticus-qualified-second-line-care-intent'] },
  { scenarioId: 'pediatric-status-asthmaticus', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-exam', objectiveIds: ['review-pediatric-status-asthmaticus-later-response'] },
  { scenarioId: 'pediatric-status-asthmaticus', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-pediatric-status-asthmaticus-later-response'] },
  { scenarioId: 'pediatric-status-asthmaticus', frameworkId: FRAMEWORK_ID, domainId: 'sbp-4-transitions-in-care', objectiveIds: ['handoff-pediatric-status-asthmaticus-reassessment'] },
  { scenarioId: 'pediatric-status-asthmaticus', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-pediatric-status-asthmaticus-reassessment'] },
  // --- pediatric-sepsis ---
  { scenarioId: 'pediatric-sepsis', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-pediatric-sepsis-infection-and-organ-dysfunction'] },
  { scenarioId: 'pediatric-sepsis', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-clinical-reasoning', objectiveIds: ['reconcile-pediatric-sepsis-infection-and-organ-dysfunction', 'distinguish-pediatric-sepsis-without-shock'] },
  { scenarioId: 'pediatric-sepsis', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-clinical-knowledge', objectiveIds: ['distinguish-pediatric-sepsis-without-shock'] },
  { scenarioId: 'pediatric-sepsis', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-coordination-of-care', objectiveIds: ['confirm-pediatric-sepsis-qualified-care-ownership'] },
  { scenarioId: 'pediatric-sepsis', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['confirm-pediatric-sepsis-qualified-care-ownership'] },
  { scenarioId: 'pediatric-sepsis', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-organize-and-prioritize', objectiveIds: ['review-pediatric-sepsis-source-organs-and-alternatives'] },
  { scenarioId: 'pediatric-sepsis', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-diagnostic-evaluation', objectiveIds: ['review-pediatric-sepsis-source-organs-and-alternatives'] },
  { scenarioId: 'pediatric-sepsis', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-exam', objectiveIds: ['review-pediatric-sepsis-later-response'] },
  { scenarioId: 'pediatric-sepsis', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-pediatric-sepsis-later-response'] },
  { scenarioId: 'pediatric-sepsis', frameworkId: FRAMEWORK_ID, domainId: 'sbp-4-transitions-in-care', objectiveIds: ['handoff-pediatric-sepsis-active-risk'] },
  { scenarioId: 'pediatric-sepsis', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-pediatric-sepsis-active-risk'] },
  { scenarioId: 'pediatric-sepsis', frameworkId: FRAMEWORK_ID, domainId: 'ics-1-patient-and-family-centered-communication', objectiveIds: ['handoff-pediatric-sepsis-active-risk'] },
  // --- pediatric-septic-shock ---
  { scenarioId: 'pediatric-septic-shock', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-pediatric-septic-shock-care-and-trajectory'] },
  { scenarioId: 'pediatric-septic-shock', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-clinical-reasoning', objectiveIds: ['reconcile-pediatric-septic-shock-care-and-trajectory', 'recognize-pediatric-septic-shock-after-fluid-reassessment'] },
  { scenarioId: 'pediatric-septic-shock', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-clinical-knowledge', objectiveIds: ['recognize-pediatric-septic-shock-after-fluid-reassessment'] },
  { scenarioId: 'pediatric-septic-shock', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-coordination-of-care', objectiveIds: ['activate-pediatric-septic-shock-critical-care-and-vasoactive-ownership', 'escalate-pediatric-septic-shock-source-control'] },
  { scenarioId: 'pediatric-septic-shock', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-pediatric-septic-shock-critical-care-and-vasoactive-ownership'] },
  { scenarioId: 'pediatric-septic-shock', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-patient-management', objectiveIds: ['activate-pediatric-septic-shock-critical-care-and-vasoactive-ownership'] },
  { scenarioId: 'pediatric-septic-shock', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-organize-and-prioritize', objectiveIds: ['escalate-pediatric-septic-shock-source-control'] },
  { scenarioId: 'pediatric-septic-shock', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-exam', objectiveIds: ['review-pediatric-septic-shock-later-response'] },
  { scenarioId: 'pediatric-septic-shock', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-pediatric-septic-shock-later-response'] },
  { scenarioId: 'pediatric-septic-shock', frameworkId: FRAMEWORK_ID, domainId: 'sbp-4-transitions-in-care', objectiveIds: ['handoff-pediatric-septic-shock-active-risk'] },
  { scenarioId: 'pediatric-septic-shock', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-pediatric-septic-shock-active-risk'] },
  { scenarioId: 'pediatric-septic-shock', frameworkId: FRAMEWORK_ID, domainId: 'ics-1-patient-and-family-centered-communication', objectiveIds: ['handoff-pediatric-septic-shock-active-risk'] },
  // --- pediatric-dehydration-with-hypovolemia ---
  { scenarioId: 'pediatric-dehydration-with-hypovolemia', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-pediatric-dehydration-losses-and-perfusion'] },
  { scenarioId: 'pediatric-dehydration-with-hypovolemia', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-clinical-reasoning', objectiveIds: ['reconcile-pediatric-dehydration-losses-and-perfusion', 'recognize-pediatric-dehydration-with-hypovolemia'] },
  { scenarioId: 'pediatric-dehydration-with-hypovolemia', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-clinical-knowledge', objectiveIds: ['recognize-pediatric-dehydration-with-hypovolemia'] },
  { scenarioId: 'pediatric-dehydration-with-hypovolemia', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-coordination-of-care', objectiveIds: ['activate-pediatric-dehydration-qualified-rehydration-ownership'] },
  { scenarioId: 'pediatric-dehydration-with-hypovolemia', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-pediatric-dehydration-qualified-rehydration-ownership'] },
  { scenarioId: 'pediatric-dehydration-with-hypovolemia', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-patient-management', objectiveIds: ['activate-pediatric-dehydration-qualified-rehydration-ownership'] },
  { scenarioId: 'pediatric-dehydration-with-hypovolemia', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-organize-and-prioritize', objectiveIds: ['review-pediatric-dehydration-ongoing-losses-and-safety'] },
  { scenarioId: 'pediatric-dehydration-with-hypovolemia', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-diagnostic-evaluation', objectiveIds: ['review-pediatric-dehydration-ongoing-losses-and-safety'] },
  { scenarioId: 'pediatric-dehydration-with-hypovolemia', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-exam', objectiveIds: ['review-pediatric-dehydration-later-response'] },
  { scenarioId: 'pediatric-dehydration-with-hypovolemia', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-pediatric-dehydration-later-response'] },
  { scenarioId: 'pediatric-dehydration-with-hypovolemia', frameworkId: FRAMEWORK_ID, domainId: 'sbp-4-transitions-in-care', objectiveIds: ['handoff-pediatric-dehydration-active-risk'] },
  { scenarioId: 'pediatric-dehydration-with-hypovolemia', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-pediatric-dehydration-active-risk'] },
  { scenarioId: 'pediatric-dehydration-with-hypovolemia', frameworkId: FRAMEWORK_ID, domainId: 'ics-1-patient-and-family-centered-communication', objectiveIds: ['handoff-pediatric-dehydration-active-risk'] },
  // --- pediatric-diabetic-ketoacidosis ---
  { scenarioId: 'pediatric-diabetic-ketoacidosis', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-pediatric-dka-illness-and-fixed-pattern'] },
  { scenarioId: 'pediatric-diabetic-ketoacidosis', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-clinical-reasoning', objectiveIds: ['reconcile-pediatric-dka-illness-and-fixed-pattern', 'recognize-pediatric-dka-and-current-risk'] },
  { scenarioId: 'pediatric-diabetic-ketoacidosis', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-clinical-knowledge', objectiveIds: ['recognize-pediatric-dka-and-current-risk'] },
  { scenarioId: 'pediatric-diabetic-ketoacidosis', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-coordination-of-care', objectiveIds: ['activate-pediatric-dka-qualified-care-ownership'] },
  { scenarioId: 'pediatric-diabetic-ketoacidosis', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-pediatric-dka-qualified-care-ownership'] },
  { scenarioId: 'pediatric-diabetic-ketoacidosis', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-patient-management', objectiveIds: ['activate-pediatric-dka-qualified-care-ownership'] },
  { scenarioId: 'pediatric-diabetic-ketoacidosis', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-organize-and-prioritize', objectiveIds: ['review-pediatric-dka-neurologic-and-metabolic-safety'] },
  { scenarioId: 'pediatric-diabetic-ketoacidosis', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-diagnostic-evaluation', objectiveIds: ['review-pediatric-dka-neurologic-and-metabolic-safety'] },
  { scenarioId: 'pediatric-diabetic-ketoacidosis', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-exam', objectiveIds: ['review-pediatric-dka-later-response'] },
  { scenarioId: 'pediatric-diabetic-ketoacidosis', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-pediatric-dka-later-response'] },
  { scenarioId: 'pediatric-diabetic-ketoacidosis', frameworkId: FRAMEWORK_ID, domainId: 'sbp-4-transitions-in-care', objectiveIds: ['handoff-pediatric-dka-active-risk'] },
  { scenarioId: 'pediatric-diabetic-ketoacidosis', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-pediatric-dka-active-risk'] },
  // --- pediatric-hypoglycemic-seizure ---
  { scenarioId: 'pediatric-hypoglycemic-seizure', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-pediatric-hypoglycemic-seizure-whole-child-and-glucose'] },
  { scenarioId: 'pediatric-hypoglycemic-seizure', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-clinical-reasoning', objectiveIds: ['reconcile-pediatric-hypoglycemic-seizure-whole-child-and-glucose', 'recognize-pediatric-hypoglycemic-seizure'] },
  { scenarioId: 'pediatric-hypoglycemic-seizure', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-clinical-knowledge', objectiveIds: ['recognize-pediatric-hypoglycemic-seizure'] },
  { scenarioId: 'pediatric-hypoglycemic-seizure', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-coordination-of-care', objectiveIds: ['activate-pediatric-hypoglycemic-seizure-qualified-rescue-ownership'] },
  { scenarioId: 'pediatric-hypoglycemic-seizure', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-pediatric-hypoglycemic-seizure-qualified-rescue-ownership'] },
  { scenarioId: 'pediatric-hypoglycemic-seizure', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-patient-management', objectiveIds: ['activate-pediatric-hypoglycemic-seizure-qualified-rescue-ownership'] },
  { scenarioId: 'pediatric-hypoglycemic-seizure', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-organize-and-prioritize', objectiveIds: ['review-pediatric-hypoglycemic-seizure-causes-and-recurrence-risk'] },
  { scenarioId: 'pediatric-hypoglycemic-seizure', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-diagnostic-evaluation', objectiveIds: ['review-pediatric-hypoglycemic-seizure-causes-and-recurrence-risk'] },
  { scenarioId: 'pediatric-hypoglycemic-seizure', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-exam', objectiveIds: ['review-pediatric-hypoglycemic-seizure-later-response'] },
  { scenarioId: 'pediatric-hypoglycemic-seizure', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-pediatric-hypoglycemic-seizure-later-response'] },
  { scenarioId: 'pediatric-hypoglycemic-seizure', frameworkId: FRAMEWORK_ID, domainId: 'sbp-4-transitions-in-care', objectiveIds: ['handoff-pediatric-hypoglycemic-seizure-active-risk'] },
  { scenarioId: 'pediatric-hypoglycemic-seizure', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-pediatric-hypoglycemic-seizure-active-risk'] },
  // --- pediatric-febrile-seizure ---
  { scenarioId: 'pediatric-febrile-seizure', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-pediatric-febrile-seizure-event-recovery-and-fever'] },
  { scenarioId: 'pediatric-febrile-seizure', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-clinical-reasoning', objectiveIds: ['reconcile-pediatric-febrile-seizure-event-recovery-and-fever', 'recognize-pediatric-febrile-seizure-pattern-and-danger-boundary'] },
  { scenarioId: 'pediatric-febrile-seizure', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-clinical-knowledge', objectiveIds: ['recognize-pediatric-febrile-seizure-pattern-and-danger-boundary'] },
  { scenarioId: 'pediatric-febrile-seizure', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-coordination-of-care', objectiveIds: ['activate-pediatric-febrile-seizure-qualified-care-ownership'] },
  { scenarioId: 'pediatric-febrile-seizure', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-pediatric-febrile-seizure-qualified-care-ownership'] },
  { scenarioId: 'pediatric-febrile-seizure', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-patient-management', objectiveIds: ['activate-pediatric-febrile-seizure-qualified-care-ownership'] },
  { scenarioId: 'pediatric-febrile-seizure', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-organize-and-prioritize', objectiveIds: ['review-pediatric-febrile-seizure-infection-recurrence-and-alternatives'] },
  { scenarioId: 'pediatric-febrile-seizure', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-diagnostic-evaluation', objectiveIds: ['review-pediatric-febrile-seizure-infection-recurrence-and-alternatives'] },
  { scenarioId: 'pediatric-febrile-seizure', frameworkId: FRAMEWORK_ID, domainId: 'ics-1-patient-and-family-centered-communication', objectiveIds: ['review-pediatric-febrile-seizure-infection-recurrence-and-alternatives', 'handoff-pediatric-febrile-seizure-active-risk'] },
  { scenarioId: 'pediatric-febrile-seizure', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-exam', objectiveIds: ['review-pediatric-febrile-seizure-later-response'] },
  { scenarioId: 'pediatric-febrile-seizure', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-pediatric-febrile-seizure-later-response'] },
  { scenarioId: 'pediatric-febrile-seizure', frameworkId: FRAMEWORK_ID, domainId: 'sbp-4-transitions-in-care', objectiveIds: ['handoff-pediatric-febrile-seizure-active-risk'] },
  { scenarioId: 'pediatric-febrile-seizure', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-pediatric-febrile-seizure-active-risk'] },
  // --- pediatric-status-epilepticus ---
  { scenarioId: 'pediatric-status-epilepticus', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-pediatric-status-epilepticus-clock-care-and-whole-child'] },
  { scenarioId: 'pediatric-status-epilepticus', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-clinical-reasoning', objectiveIds: ['reconcile-pediatric-status-epilepticus-clock-care-and-whole-child', 'recognize-pediatric-convulsive-status-after-first-line-care'] },
  { scenarioId: 'pediatric-status-epilepticus', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-clinical-knowledge', objectiveIds: ['recognize-pediatric-convulsive-status-after-first-line-care'] },
  { scenarioId: 'pediatric-status-epilepticus', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-coordination-of-care', objectiveIds: ['activate-pediatric-status-epilepticus-qualified-second-line-ownership'] },
  { scenarioId: 'pediatric-status-epilepticus', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-pediatric-status-epilepticus-qualified-second-line-ownership'] },
  { scenarioId: 'pediatric-status-epilepticus', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-patient-management', objectiveIds: ['activate-pediatric-status-epilepticus-qualified-second-line-ownership'] },
  { scenarioId: 'pediatric-status-epilepticus', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-organize-and-prioritize', objectiveIds: ['review-pediatric-status-epilepticus-airway-causes-and-refractory-boundary'] },
  { scenarioId: 'pediatric-status-epilepticus', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-diagnostic-evaluation', objectiveIds: ['review-pediatric-status-epilepticus-airway-causes-and-refractory-boundary'] },
  { scenarioId: 'pediatric-status-epilepticus', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-exam', objectiveIds: ['review-pediatric-status-epilepticus-later-response'] },
  { scenarioId: 'pediatric-status-epilepticus', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-pediatric-status-epilepticus-later-response'] },
  { scenarioId: 'pediatric-status-epilepticus', frameworkId: FRAMEWORK_ID, domainId: 'sbp-4-transitions-in-care', objectiveIds: ['handoff-pediatric-status-epilepticus-active-risk'] },
  { scenarioId: 'pediatric-status-epilepticus', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-pediatric-status-epilepticus-active-risk'] },
  // --- pediatric-anaphylaxis ---
  { scenarioId: 'pediatric-anaphylaxis', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-pediatric-anaphylaxis-exposure-care-and-whole-child'] },
  { scenarioId: 'pediatric-anaphylaxis', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-clinical-reasoning', objectiveIds: ['reconcile-pediatric-anaphylaxis-exposure-care-and-whole-child', 'recognize-pediatric-anaphylaxis-persistent-abc-compromise'] },
  { scenarioId: 'pediatric-anaphylaxis', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-clinical-knowledge', objectiveIds: ['recognize-pediatric-anaphylaxis-persistent-abc-compromise'] },
  { scenarioId: 'pediatric-anaphylaxis', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-coordination-of-care', objectiveIds: ['activate-pediatric-anaphylaxis-qualified-repeat-first-line-and-resuscitation-ownership'] },
  { scenarioId: 'pediatric-anaphylaxis', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-pediatric-anaphylaxis-qualified-repeat-first-line-and-resuscitation-ownership'] },
  { scenarioId: 'pediatric-anaphylaxis', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-patient-management', objectiveIds: ['activate-pediatric-anaphylaxis-qualified-repeat-first-line-and-resuscitation-ownership'] },
  { scenarioId: 'pediatric-anaphylaxis', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-organize-and-prioritize', objectiveIds: ['review-pediatric-anaphylaxis-airway-asthma-causes-and-refractory-boundary'] },
  { scenarioId: 'pediatric-anaphylaxis', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-diagnostic-evaluation', objectiveIds: ['review-pediatric-anaphylaxis-airway-asthma-causes-and-refractory-boundary'] },
  { scenarioId: 'pediatric-anaphylaxis', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-exam', objectiveIds: ['review-pediatric-anaphylaxis-later-response'] },
  { scenarioId: 'pediatric-anaphylaxis', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-pediatric-anaphylaxis-later-response'] },
  { scenarioId: 'pediatric-anaphylaxis', frameworkId: FRAMEWORK_ID, domainId: 'sbp-4-transitions-in-care', objectiveIds: ['handoff-pediatric-anaphylaxis-observation-allergy-and-caregiver-risk'] },
  { scenarioId: 'pediatric-anaphylaxis', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-pediatric-anaphylaxis-observation-allergy-and-caregiver-risk'] },
  { scenarioId: 'pediatric-anaphylaxis', frameworkId: FRAMEWORK_ID, domainId: 'ics-1-patient-and-family-centered-communication', objectiveIds: ['handoff-pediatric-anaphylaxis-observation-allergy-and-caregiver-risk'] },
  // --- pediatric-supraventricular-tachycardia ---
  { scenarioId: 'pediatric-supraventricular-tachycardia', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-pediatric-svt-clock-rhythm-and-whole-child'] },
  { scenarioId: 'pediatric-supraventricular-tachycardia', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-clinical-reasoning', objectiveIds: ['reconcile-pediatric-svt-clock-rhythm-and-whole-child', 'recognize-pediatric-svt-with-perfusion-compromise'] },
  { scenarioId: 'pediatric-supraventricular-tachycardia', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-clinical-knowledge', objectiveIds: ['recognize-pediatric-svt-with-perfusion-compromise'] },
  { scenarioId: 'pediatric-supraventricular-tachycardia', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-coordination-of-care', objectiveIds: ['activate-pediatric-svt-qualified-rhythm-care-and-resuscitation-ownership'] },
  { scenarioId: 'pediatric-supraventricular-tachycardia', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-pediatric-svt-qualified-rhythm-care-and-resuscitation-ownership'] },
  { scenarioId: 'pediatric-supraventricular-tachycardia', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-patient-management', objectiveIds: ['activate-pediatric-svt-qualified-rhythm-care-and-resuscitation-ownership'] },
  { scenarioId: 'pediatric-supraventricular-tachycardia', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-organize-and-prioritize', objectiveIds: ['review-pediatric-svt-support-causes-heart-failure-and-deterioration-boundary'] },
  { scenarioId: 'pediatric-supraventricular-tachycardia', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-diagnostic-evaluation', objectiveIds: ['review-pediatric-svt-support-causes-heart-failure-and-deterioration-boundary'] },
  { scenarioId: 'pediatric-supraventricular-tachycardia', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-exam', objectiveIds: ['review-pediatric-svt-later-response'] },
  { scenarioId: 'pediatric-supraventricular-tachycardia', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-pediatric-svt-later-response'] },
  { scenarioId: 'pediatric-supraventricular-tachycardia', frameworkId: FRAMEWORK_ID, domainId: 'sbp-4-transitions-in-care', objectiveIds: ['handoff-pediatric-svt-recurrence-cardiology-and-caregiver-risk'] },
  { scenarioId: 'pediatric-supraventricular-tachycardia', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-pediatric-svt-recurrence-cardiology-and-caregiver-risk'] },
  { scenarioId: 'pediatric-supraventricular-tachycardia', frameworkId: FRAMEWORK_ID, domainId: 'ics-1-patient-and-family-centered-communication', objectiveIds: ['handoff-pediatric-svt-recurrence-cardiology-and-caregiver-risk'] },
  // --- pediatric-bradycardic-arrest ---
  { scenarioId: 'pediatric-bradycardic-arrest', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-pediatric-bradycardic-arrest-support-and-trajectory'] },
  { scenarioId: 'pediatric-bradycardic-arrest', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-clinical-reasoning', objectiveIds: ['reconcile-pediatric-bradycardic-arrest-support-and-trajectory', 'recognize-pediatric-bradycardia-with-persistent-compromise'] },
  { scenarioId: 'pediatric-bradycardic-arrest', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-clinical-knowledge', objectiveIds: ['recognize-pediatric-bradycardia-with-persistent-compromise'] },
  { scenarioId: 'pediatric-bradycardic-arrest', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-coordination-of-care', objectiveIds: ['activate-pediatric-bradycardic-arrest-qualified-resuscitation-ownership'] },
  { scenarioId: 'pediatric-bradycardic-arrest', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-pediatric-bradycardic-arrest-qualified-resuscitation-ownership'] },
  { scenarioId: 'pediatric-bradycardic-arrest', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-patient-management', objectiveIds: ['activate-pediatric-bradycardic-arrest-qualified-resuscitation-ownership'] },
  { scenarioId: 'pediatric-bradycardic-arrest', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-organize-and-prioritize', objectiveIds: ['review-pediatric-bradycardic-arrest-causes-pulse-and-arrest-boundary'] },
  { scenarioId: 'pediatric-bradycardic-arrest', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-diagnostic-evaluation', objectiveIds: ['review-pediatric-bradycardic-arrest-causes-pulse-and-arrest-boundary'] },
  { scenarioId: 'pediatric-bradycardic-arrest', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-exam', objectiveIds: ['review-pediatric-bradycardic-arrest-pulse-loss-response'] },
  { scenarioId: 'pediatric-bradycardic-arrest', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-pediatric-bradycardic-arrest-pulse-loss-response'] },
  { scenarioId: 'pediatric-bradycardic-arrest', frameworkId: FRAMEWORK_ID, domainId: 'sbp-4-transitions-in-care', objectiveIds: ['handoff-pediatric-bradycardic-arrest-active-risk'] },
  { scenarioId: 'pediatric-bradycardic-arrest', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-pediatric-bradycardic-arrest-active-risk'] },
  // --- pediatric-foreign-body-airway-obstruction ---
  { scenarioId: 'pediatric-foreign-body-airway-obstruction', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-pediatric-foreign-body-airway-obstruction-event-cough-and-whole-child'] },
  { scenarioId: 'pediatric-foreign-body-airway-obstruction', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-clinical-reasoning', objectiveIds: ['reconcile-pediatric-foreign-body-airway-obstruction-event-cough-and-whole-child', 'recognize-pediatric-foreign-body-airway-obstruction-severe-responsive-transition'] },
  { scenarioId: 'pediatric-foreign-body-airway-obstruction', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-patient-management', objectiveIds: ['preserve-pediatric-foreign-body-airway-obstruction-effective-cough-and-surveillance', 'activate-pediatric-foreign-body-airway-obstruction-qualified-responsive-pathway', 'activate-pediatric-foreign-body-airway-obstruction-unresponsive-cpr-pathway'] },
  { scenarioId: 'pediatric-foreign-body-airway-obstruction', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['preserve-pediatric-foreign-body-airway-obstruction-effective-cough-and-surveillance'] },
  { scenarioId: 'pediatric-foreign-body-airway-obstruction', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-clinical-knowledge', objectiveIds: ['recognize-pediatric-foreign-body-airway-obstruction-severe-responsive-transition'] },
  { scenarioId: 'pediatric-foreign-body-airway-obstruction', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-coordination-of-care', objectiveIds: ['activate-pediatric-foreign-body-airway-obstruction-qualified-responsive-pathway', 'activate-pediatric-foreign-body-airway-obstruction-unresponsive-cpr-pathway'] },
  { scenarioId: 'pediatric-foreign-body-airway-obstruction', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-pediatric-foreign-body-airway-obstruction-qualified-responsive-pathway', 'activate-pediatric-foreign-body-airway-obstruction-unresponsive-cpr-pathway'] },
  { scenarioId: 'pediatric-foreign-body-airway-obstruction', frameworkId: FRAMEWORK_ID, domainId: 'sbp-4-transitions-in-care', objectiveIds: ['handoff-pediatric-foreign-body-airway-obstruction-active-risk'] },
  { scenarioId: 'pediatric-foreign-body-airway-obstruction', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-pediatric-foreign-body-airway-obstruction-active-risk'] },
  // --- pediatric-injury-safeguarding-escalation ---
  { scenarioId: 'pediatric-injury-safeguarding-escalation', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-pediatric-injury-development-history-and-whole-child'] },
  { scenarioId: 'pediatric-injury-safeguarding-escalation', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-clinical-reasoning', objectiveIds: ['reconcile-pediatric-injury-development-history-and-whole-child', 'recognize-pediatric-injury-safeguarding-concern-without-diagnosis'] },
  { scenarioId: 'pediatric-injury-safeguarding-escalation', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-clinical-knowledge', objectiveIds: ['recognize-pediatric-injury-safeguarding-concern-without-diagnosis'] },
  { scenarioId: 'pediatric-injury-safeguarding-escalation', frameworkId: FRAMEWORK_ID, domainId: 'prof-2-ethical-principles', objectiveIds: ['recognize-pediatric-injury-safeguarding-concern-without-diagnosis', 'review-pediatric-injury-medical-alternatives-and-information-boundary'] },
  { scenarioId: 'pediatric-injury-safeguarding-escalation', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-coordination-of-care', objectiveIds: ['activate-pediatric-injury-qualified-safeguarding-and-immediate-safety-ownership'] },
  { scenarioId: 'pediatric-injury-safeguarding-escalation', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-pediatric-injury-qualified-safeguarding-and-immediate-safety-ownership'] },
  { scenarioId: 'pediatric-injury-safeguarding-escalation', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-patient-management', objectiveIds: ['activate-pediatric-injury-qualified-safeguarding-and-immediate-safety-ownership'] },
  { scenarioId: 'pediatric-injury-safeguarding-escalation', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['activate-pediatric-injury-qualified-safeguarding-and-immediate-safety-ownership', 'review-pediatric-injury-later-safety-state'] },
  { scenarioId: 'pediatric-injury-safeguarding-escalation', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-organize-and-prioritize', objectiveIds: ['review-pediatric-injury-medical-alternatives-and-information-boundary'] },
  { scenarioId: 'pediatric-injury-safeguarding-escalation', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-diagnostic-evaluation', objectiveIds: ['review-pediatric-injury-medical-alternatives-and-information-boundary'] },
  { scenarioId: 'pediatric-injury-safeguarding-escalation', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-exam', objectiveIds: ['review-pediatric-injury-later-safety-state'] },
  { scenarioId: 'pediatric-injury-safeguarding-escalation', frameworkId: FRAMEWORK_ID, domainId: 'sbp-4-transitions-in-care', objectiveIds: ['handoff-pediatric-injury-unresolved-safeguarding-risk'] },
  { scenarioId: 'pediatric-injury-safeguarding-escalation', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-pediatric-injury-unresolved-safeguarding-risk'] },
];
