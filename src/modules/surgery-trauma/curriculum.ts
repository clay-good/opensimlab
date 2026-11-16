/**
 * The surgery and trauma lessons mapped to the ACGME's Surgery Milestones
 * (framework-mapping-expansion → scenario mappings).
 *
 * The last module in the catalogue to be mapped, and the one where the
 * document and the module disagree most about what surgery is. Three of the
 * eighteen subcompetencies are about operating; this module is about surgical
 * decisions, and all ten of its lessons are declared ward lessons. Two of the
 * three stay uncovered and cannot be otherwise.
 *
 * - Reading a patient, a clock and a record into a decision - which is most of
 *   this module - → patient evaluation and decision making, with patient safety
 *   where the objective is a bounded intent, and post-operative care in the
 *   lesson whose patient is recovering from an operation.
 * - Naming what the finding means → evaluation with pathophysiology and
 *   treatment, plus anatomy where the objective turns on where something is:
 *   an artery is not a compartment.
 * - Reaching the team that owns the question → system navigation with team
 *   communication. The unspoken-doubt lesson's "say it in the room" also
 *   carries self-awareness and help-seeking, which is the subcompetency that
 *   objective is actually about.
 * - Handing on → communication within health care systems with navigation.
 * - And every lesson's literature objective → evidence-based and informed
 *   practice. This module and the renal one are the only two in the catalogue
 *   that reach that subcompetency, and this one reaches it from all ten
 *   lessons: two small literatures, evidence that contradicts itself, a real
 *   risk without a proven remedy, a return visit that is not a verdict.
 *
 * Eight of the eighteen are mapped by nothing, each with its reason below and
 * pinned in both directions by `tests/unit/surgery-trauma-curriculum.test.ts`.
 */

import { ACGME_SURGERY_MILESTONES } from '@platform/curriculum/acgme-surgery';
import type { FrameworkRecord } from '@platform/curriculum/framework-records';
import type { ScenarioMapping } from '@platform/curriculum/mapping';

const FRAMEWORK_ID = ACGME_SURGERY_MILESTONES.id;

/** The readings this module's lessons are mapped against. */
export const SURGERY_TRAUMA_FRAMEWORKS: readonly FrameworkRecord[] = [ACGME_SURGERY_MILESTONES];

/** Subcompetencies no lesson in this module exercises, and why. */
export const SURGERY_TRAUMA_UNCOVERED: Readonly<Record<string, string>> = {
  'pc-2-performance-of-procedures': 'No screen-based lesson performs an operation, and this module teaches the decisions around one rather than the operation itself.',
  'pc-3-technical-skills': 'Tissue handling and instruments cannot be taught or assessed here at all.',
  'sbp-3-physician-role-in-health-care-systems': 'The unowned-delay lesson comes closest, but what it measures is giving a wait an owner rather than the system that produced it.',
  'pbli-2-reflective-practice': 'Reflection happens in the debrief, which is not part of any lesson\'s objectives.',
  'prof-1-ethical-principles': 'No lesson puts a duty to the patient in conflict with anything.',
  'prof-2-professional-behavior-and-accountability': 'Conduct toward the patient and the team is modelled as communication rather than tested as behaviour.',
  'prof-3-administrative-tasks': 'Nothing here is paperwork.',
  'ics-1-patient-and-family-communication': 'Two lessons ask for an examination the patient can take part in, but the conversation itself is never what an objective measures.',
};

export const SURGERY_TRAUMA_SCENARIO_MAPPINGS: readonly ScenarioMapping[] = [
  // --- negative-scan-a-scan-that-cannot-say-no ---
  { scenarioId: 'negative-scan-a-scan-that-cannot-say-no', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-evaluation-and-decision-making', objectiveIds: ['record-surgery-trauma-negative-scan-the-course-the-operation-predicts', 'record-surgery-trauma-negative-scan-a-trajectory-not-a-reading', 'recognize-surgery-trauma-negative-scan-a-report-is-not-an-exclusion', 'record-surgery-trauma-negative-scan-bounded-surgical-intent'] },
  { scenarioId: 'negative-scan-a-scan-that-cannot-say-no', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-post-operative-care', objectiveIds: ['record-surgery-trauma-negative-scan-the-course-the-operation-predicts', 'record-surgery-trauma-negative-scan-a-trajectory-not-a-reading', 'record-surgery-trauma-negative-scan-bounded-surgical-intent'] },
  { scenarioId: 'negative-scan-a-scan-that-cannot-say-no', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-pathophysiology-and-treatment', objectiveIds: ['recognize-surgery-trauma-negative-scan-a-report-is-not-an-exclusion'] },
  { scenarioId: 'negative-scan-a-scan-that-cannot-say-no', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-surgery-trauma-negative-scan-the-team-that-made-the-anastomosis', 'handoff-surgery-trauma-negative-scan-a-course-that-travels'] },
  { scenarioId: 'negative-scan-a-scan-that-cannot-say-no', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-surgery-trauma-negative-scan-the-team-that-made-the-anastomosis'] },
  { scenarioId: 'negative-scan-a-scan-that-cannot-say-no', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['record-surgery-trauma-negative-scan-bounded-surgical-intent'] },
  { scenarioId: 'negative-scan-a-scan-that-cannot-say-no', frameworkId: FRAMEWORK_ID, domainId: 'pbli-1-evidence-based-practice', objectiveIds: ['review-surgery-trauma-negative-scan-two-small-literatures'] },
  { scenarioId: 'negative-scan-a-scan-that-cannot-say-no', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-surgery-trauma-negative-scan-a-course-that-travels'] },
  // --- rising-requirement-a-number-that-under-calls ---
  { scenarioId: 'rising-requirement-a-number-that-under-calls', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-evaluation-and-decision-making', objectiveIds: ['record-surgery-trauma-rising-requirement-the-clock-on-the-limb', 'record-surgery-trauma-rising-requirement-a-requirement-is-a-finding', 'recognize-surgery-trauma-rising-requirement-an-artery-is-not-a-compartment', 'record-surgery-trauma-rising-requirement-one-reading-is-not-the-quantity', 'record-surgery-trauma-rising-requirement-bounded-decompression-intent'] },
  { scenarioId: 'rising-requirement-a-number-that-under-calls', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-pathophysiology-and-treatment', objectiveIds: ['recognize-surgery-trauma-rising-requirement-an-artery-is-not-a-compartment'] },
  { scenarioId: 'rising-requirement-a-number-that-under-calls', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-anatomy', objectiveIds: ['recognize-surgery-trauma-rising-requirement-an-artery-is-not-a-compartment'] },
  { scenarioId: 'rising-requirement-a-number-that-under-calls', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-surgery-trauma-rising-requirement-call-before-the-number', 'handoff-surgery-trauma-rising-requirement-a-course-that-travels'] },
  { scenarioId: 'rising-requirement-a-number-that-under-calls', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-surgery-trauma-rising-requirement-call-before-the-number'] },
  { scenarioId: 'rising-requirement-a-number-that-under-calls', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['record-surgery-trauma-rising-requirement-bounded-decompression-intent'] },
  { scenarioId: 'rising-requirement-a-number-that-under-calls', frameworkId: FRAMEWORK_ID, domainId: 'pbli-1-evidence-based-practice', objectiveIds: ['review-surgery-trauma-rising-requirement-two-numbers-that-fail-differently'] },
  { scenarioId: 'rising-requirement-a-number-that-under-calls', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-surgery-trauma-rising-requirement-a-course-that-travels'] },
  // --- unfinished-survey-a-patient-who-cannot-be-asked ---
  { scenarioId: 'unfinished-survey-a-patient-who-cannot-be-asked', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-evaluation-and-decision-making', objectiveIds: ['record-surgery-trauma-unfinished-survey-what-he-could-not-contribute', 'record-surgery-trauma-unfinished-survey-what-the-list-rests-on', 'recognize-surgery-trauma-unfinished-survey-a-complete-record-is-not-a-complete-examination', 'record-surgery-trauma-unfinished-survey-the-third-survey-is-not-done', 'record-surgery-trauma-unfinished-survey-bounded-survey-intent'] },
  { scenarioId: 'unfinished-survey-a-patient-who-cannot-be-asked', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-pathophysiology-and-treatment', objectiveIds: ['recognize-surgery-trauma-unfinished-survey-a-complete-record-is-not-a-complete-examination'] },
  { scenarioId: 'unfinished-survey-a-patient-who-cannot-be-asked', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-surgery-trauma-unfinished-survey-ask-the-team-that-owns-it', 'handoff-surgery-trauma-unfinished-survey-an-assessment-that-travels-unfinished'] },
  { scenarioId: 'unfinished-survey-a-patient-who-cannot-be-asked', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-surgery-trauma-unfinished-survey-ask-the-team-that-owns-it'] },
  { scenarioId: 'unfinished-survey-a-patient-who-cannot-be-asked', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['record-surgery-trauma-unfinished-survey-bounded-survey-intent'] },
  { scenarioId: 'unfinished-survey-a-patient-who-cannot-be-asked', frameworkId: FRAMEWORK_ID, domainId: 'pbli-1-evidence-based-practice', objectiveIds: ['review-surgery-trauma-unfinished-survey-a-step-worth-doing-and-weak-evidence'] },
  { scenarioId: 'unfinished-survey-a-patient-who-cannot-be-asked', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-surgery-trauma-unfinished-survey-an-assessment-that-travels-unfinished'] },
  // --- transient-response-a-patient-who-will-not-stay-up ---
  { scenarioId: 'transient-response-a-patient-who-will-not-stay-up', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-evaluation-and-decision-making', objectiveIds: ['record-surgery-trauma-transient-response-the-mechanism-and-the-clock', 'record-surgery-trauma-transient-response-the-shape-of-the-response', 'recognize-surgery-trauma-transient-response-a-pressure-that-returns-is-not-a-pressure-that-holds', 'record-surgery-trauma-transient-response-what-a-picture-cannot-do', 'record-surgery-trauma-transient-response-bounded-operative-intent'] },
  { scenarioId: 'transient-response-a-patient-who-will-not-stay-up', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-pathophysiology-and-treatment', objectiveIds: ['recognize-surgery-trauma-transient-response-a-pressure-that-returns-is-not-a-pressure-that-holds'] },
  { scenarioId: 'transient-response-a-patient-who-will-not-stay-up', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-surgery-trauma-transient-response-call-the-team-that-can-stop-it', 'handoff-surgery-trauma-transient-response-a-decision-that-travels-with-its-clock'] },
  { scenarioId: 'transient-response-a-patient-who-will-not-stay-up', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-surgery-trauma-transient-response-call-the-team-that-can-stop-it'] },
  { scenarioId: 'transient-response-a-patient-who-will-not-stay-up', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['record-surgery-trauma-transient-response-bounded-operative-intent'] },
  { scenarioId: 'transient-response-a-patient-who-will-not-stay-up', frameworkId: FRAMEWORK_ID, domainId: 'pbli-1-evidence-based-practice', objectiveIds: ['review-surgery-trauma-transient-response-minutes-measured-in-retrospect'] },
  { scenarioId: 'transient-response-a-patient-who-will-not-stay-up', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-surgery-trauma-transient-response-a-decision-that-travels-with-its-clock'] },
  // --- quiet-chest-an-injury-whose-severity-is-not-yet-visible ---
  { scenarioId: 'quiet-chest-an-injury-whose-severity-is-not-yet-visible', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-evaluation-and-decision-making', objectiveIds: ['record-surgery-trauma-quiet-chest-the-fall-and-what-it-broke', 'record-surgery-trauma-quiet-chest-what-comfortable-at-rest-measures', 'recognize-surgery-trauma-quiet-chest-a-normal-chart-is-not-a-small-injury', 'record-surgery-trauma-quiet-chest-what-the-count-predicts', 'record-surgery-trauma-quiet-chest-bounded-admission-intent'] },
  { scenarioId: 'quiet-chest-an-injury-whose-severity-is-not-yet-visible', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-pathophysiology-and-treatment', objectiveIds: ['recognize-surgery-trauma-quiet-chest-a-normal-chart-is-not-a-small-injury'] },
  { scenarioId: 'quiet-chest-an-injury-whose-severity-is-not-yet-visible', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-surgery-trauma-quiet-chest-ask-the-team-that-owns-the-plan', 'handoff-surgery-trauma-quiet-chest-a-plan-that-covers-the-third-day'] },
  { scenarioId: 'quiet-chest-an-injury-whose-severity-is-not-yet-visible', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-surgery-trauma-quiet-chest-ask-the-team-that-owns-the-plan'] },
  { scenarioId: 'quiet-chest-an-injury-whose-severity-is-not-yet-visible', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['record-surgery-trauma-quiet-chest-bounded-admission-intent'] },
  { scenarioId: 'quiet-chest-an-injury-whose-severity-is-not-yet-visible', frameworkId: FRAMEWORK_ID, domainId: 'pbli-1-evidence-based-practice', objectiveIds: ['review-surgery-trauma-quiet-chest-a-real-risk-without-a-proven-remedy'] },
  { scenarioId: 'quiet-chest-an-injury-whose-severity-is-not-yet-visible', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-surgery-trauma-quiet-chest-a-plan-that-covers-the-third-day'] },
  // --- unowned-delay-a-wait-that-nobody-decided ---
  { scenarioId: 'unowned-delay-a-wait-that-nobody-decided', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-evaluation-and-decision-making', objectiveIds: ['record-surgery-trauma-unowned-delay-the-fracture-and-the-clock', 'record-surgery-trauma-unowned-delay-what-each-delay-was-for', 'recognize-surgery-trauma-unowned-delay-a-clinical-label-is-not-a-clinical-reason', 'record-surgery-trauma-unowned-delay-what-is-still-being-waited-for', 'record-surgery-trauma-unowned-delay-bounded-scheduling-intent'] },
  { scenarioId: 'unowned-delay-a-wait-that-nobody-decided', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-pathophysiology-and-treatment', objectiveIds: ['recognize-surgery-trauma-unowned-delay-a-clinical-label-is-not-a-clinical-reason'] },
  { scenarioId: 'unowned-delay-a-wait-that-nobody-decided', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-surgery-trauma-unowned-delay-give-the-wait-an-owner', 'handoff-surgery-trauma-unowned-delay-a-wait-that-now-has-an-author'] },
  { scenarioId: 'unowned-delay-a-wait-that-nobody-decided', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-surgery-trauma-unowned-delay-give-the-wait-an-owner'] },
  { scenarioId: 'unowned-delay-a-wait-that-nobody-decided', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['record-surgery-trauma-unowned-delay-bounded-scheduling-intent'] },
  { scenarioId: 'unowned-delay-a-wait-that-nobody-decided', frameworkId: FRAMEWORK_ID, domainId: 'pbli-1-evidence-based-practice', objectiveIds: ['review-surgery-trauma-unowned-delay-evidence-that-contradicts-itself'] },
  { scenarioId: 'unowned-delay-a-wait-that-nobody-decided', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-surgery-trauma-unowned-delay-a-wait-that-now-has-an-author'] },
  // --- third-attendance-a-question-two-people-have-already-answered ---
  { scenarioId: 'third-attendance-a-question-two-people-have-already-answered', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-evaluation-and-decision-making', objectiveIds: ['record-surgery-trauma-third-attendance-what-each-visit-found', 'record-surgery-trauma-third-attendance-what-a-previous-assessment-can-say', 'recognize-surgery-trauma-third-attendance-two-answers-are-not-an-answer', 'record-surgery-trauma-third-attendance-what-has-changed', 'record-surgery-trauma-third-attendance-bounded-assessment-intent'] },
  { scenarioId: 'third-attendance-a-question-two-people-have-already-answered', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-pathophysiology-and-treatment', objectiveIds: ['recognize-surgery-trauma-third-attendance-two-answers-are-not-an-answer'] },
  { scenarioId: 'third-attendance-a-question-two-people-have-already-answered', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-surgery-trauma-third-attendance-ask-for-the-third-examination', 'handoff-surgery-trauma-third-attendance-a-third-examination-that-is-owed'] },
  { scenarioId: 'third-attendance-a-question-two-people-have-already-answered', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-surgery-trauma-third-attendance-ask-for-the-third-examination'] },
  { scenarioId: 'third-attendance-a-question-two-people-have-already-answered', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['record-surgery-trauma-third-attendance-bounded-assessment-intent'] },
  { scenarioId: 'third-attendance-a-question-two-people-have-already-answered', frameworkId: FRAMEWORK_ID, domainId: 'pbli-1-evidence-based-practice', objectiveIds: ['review-surgery-trauma-third-attendance-a-return-visit-is-not-a-verdict'] },
  { scenarioId: 'third-attendance-a-question-two-people-have-already-answered', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-surgery-trauma-third-attendance-a-third-examination-that-is-owed'] },
  // --- deferred-step-a-decision-attached-to-a-person ---
  { scenarioId: 'deferred-step-a-decision-attached-to-a-person', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-evaluation-and-decision-making', objectiveIds: ['record-surgery-trauma-deferred-step-the-injury-and-the-clock', 'record-surgery-trauma-deferred-step-the-step-that-is-waiting', 'recognize-surgery-trauma-deferred-step-a-window-tied-to-an-arrival', 'record-surgery-trauma-deferred-step-what-the-interval-is-attached-to', 'record-surgery-trauma-deferred-step-bounded-prescribing-intent'] },
  { scenarioId: 'deferred-step-a-decision-attached-to-a-person', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-pathophysiology-and-treatment', objectiveIds: ['recognize-surgery-trauma-deferred-step-a-window-tied-to-an-arrival'] },
  { scenarioId: 'deferred-step-a-decision-attached-to-a-person', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-surgery-trauma-deferred-step-ask-for-a-decision-not-a-visit', 'handoff-surgery-trauma-deferred-step-a-step-that-is-no-longer-waiting-on-a-person'] },
  { scenarioId: 'deferred-step-a-decision-attached-to-a-person', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-surgery-trauma-deferred-step-ask-for-a-decision-not-a-visit'] },
  { scenarioId: 'deferred-step-a-decision-attached-to-a-person', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['record-surgery-trauma-deferred-step-bounded-prescribing-intent'] },
  { scenarioId: 'deferred-step-a-decision-attached-to-a-person', frameworkId: FRAMEWORK_ID, domainId: 'pbli-1-evidence-based-practice', objectiveIds: ['review-surgery-trauma-deferred-step-two-thresholds-and-two-clocks'] },
  { scenarioId: 'deferred-step-a-decision-attached-to-a-person', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-surgery-trauma-deferred-step-a-step-that-is-no-longer-waiting-on-a-person'] },
  // --- known-label-an-explanation-that-excludes-nothing ---
  { scenarioId: 'known-label-an-explanation-that-excludes-nothing', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-evaluation-and-decision-making', objectiveIds: ['record-surgery-trauma-known-label-what-the-label-explains', 'record-surgery-trauma-known-label-what-changed-and-who-says-so', 'recognize-surgery-trauma-known-label-explaining-is-not-excluding', 'record-surgery-trauma-known-label-what-the-label-cannot-exclude', 'record-surgery-trauma-known-label-bounded-adjustment-intent'] },
  { scenarioId: 'known-label-an-explanation-that-excludes-nothing', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-pathophysiology-and-treatment', objectiveIds: ['recognize-surgery-trauma-known-label-explaining-is-not-excluding'] },
  { scenarioId: 'known-label-an-explanation-that-excludes-nothing', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-surgery-trauma-known-label-ask-for-an-examination-he-can-take-part-in', 'handoff-surgery-trauma-known-label-an-examination-that-has-not-happened'] },
  { scenarioId: 'known-label-an-explanation-that-excludes-nothing', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-surgery-trauma-known-label-ask-for-an-examination-he-can-take-part-in'] },
  { scenarioId: 'known-label-an-explanation-that-excludes-nothing', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['record-surgery-trauma-known-label-bounded-adjustment-intent'] },
  { scenarioId: 'known-label-an-explanation-that-excludes-nothing', frameworkId: FRAMEWORK_ID, domainId: 'pbli-1-evidence-based-practice', objectiveIds: ['review-surgery-trauma-known-label-the-label-is-probably-right'] },
  { scenarioId: 'known-label-an-explanation-that-excludes-nothing', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-surgery-trauma-known-label-an-examination-that-has-not-happened'] },
  // --- unspoken-doubt-an-interval-nobody-else-can-see ---
  { scenarioId: 'unspoken-doubt-an-interval-nobody-else-can-see', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-evaluation-and-decision-making', objectiveIds: ['record-surgery-trauma-unspoken-doubt-what-you-have-noticed', 'record-surgery-trauma-unspoken-doubt-what-would-make-you-wrong', 'recognize-surgery-trauma-unspoken-doubt-the-two-mistakes-are-not-comparable', 'record-surgery-trauma-unspoken-doubt-the-cost-of-each-mistake', 'record-surgery-trauma-unspoken-doubt-bounded-team-intent'] },
  { scenarioId: 'unspoken-doubt-an-interval-nobody-else-can-see', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-pathophysiology-and-treatment', objectiveIds: ['recognize-surgery-trauma-unspoken-doubt-the-two-mistakes-are-not-comparable'] },
  { scenarioId: 'unspoken-doubt-an-interval-nobody-else-can-see', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-surgery-trauma-unspoken-doubt-say-it-in-the-room', 'handoff-surgery-trauma-unspoken-doubt-a-sentence-that-travelled'] },
  { scenarioId: 'unspoken-doubt-an-interval-nobody-else-can-see', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-surgery-trauma-unspoken-doubt-say-it-in-the-room'] },
  { scenarioId: 'unspoken-doubt-an-interval-nobody-else-can-see', frameworkId: FRAMEWORK_ID, domainId: 'prof-4-self-awareness-and-help-seeking', objectiveIds: ['activate-surgery-trauma-unspoken-doubt-say-it-in-the-room'] },
  { scenarioId: 'unspoken-doubt-an-interval-nobody-else-can-see', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['record-surgery-trauma-unspoken-doubt-bounded-team-intent'] },
  { scenarioId: 'unspoken-doubt-an-interval-nobody-else-can-see', frameworkId: FRAMEWORK_ID, domainId: 'pbli-1-evidence-based-practice', objectiveIds: ['review-surgery-trauma-unspoken-doubt-evidence-that-includes-this-exercise'] },
  { scenarioId: 'unspoken-doubt-an-interval-nobody-else-can-see', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-surgery-trauma-unspoken-doubt-a-sentence-that-travelled'] },
];
