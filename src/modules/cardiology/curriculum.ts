/**
 * The cardiology lessons mapped to the ACGME's Internal Medicine Milestones
 * (framework-mapping-expansion → scenario mappings).
 *
 * Cardiology is internal medicine by subject, and a programme assesses against
 * the internal medicine document rather than one this project invented, so this
 * module maps to that reading. Seven more modules will do the same.
 *
 * The convention is the one the internal medicine divisions ask for, stated
 * here so it is falsifiable:
 *
 * - Joining the account with what is observed → Patient Care 1 and 3, with
 *   Patient Care 2 where the objective names what the examination shows:
 *   perfusion, congestion, a pulse, a measurement.
 * - Weighing likelihood, screening danger, reopening a cause → Patient Care 3,
 *   with Medical Knowledge 3 where the weighing is of a test's result.
 * - Recording an intent → the setting's management subcompetency, with Medical
 *   Knowledge 2 for a treatment and Medical Knowledge 3 where the intent is a
 *   test. The setting is not inferred: sixteen of these lessons are declared
 *   `clinic` and map to outpatient management, and the post-infarction
 *   cardiogenic shock lesson is declared `icu` and maps to inpatient.
 * - Activating a service, a centre or a pathway → Systems-Based Practice 2 and
 *   Communication Skills 2.
 * - A safety net, a restraint, a preserved reperfusion window, a surveillance
 *   duty → Systems-Based Practice 1; and where the safety net is what the
 *   patient is told to watch for, Communication Skills 1.
 * - Reviewing a treatment's response → Medical Knowledge 2. Reviewing a
 *   context, cause or phenotype → Patient Care 3 with Medical Knowledge 1.
 *   Reviewing a later panel or a device report → Medical Knowledge 3 with
 *   Systems-Based Practice 1, because these lessons' later panels exist to stop
 *   a learner claiming an improvement they did not deliver.
 * - Handing over → Communication Skills 3 and Systems-Based Practice 2.
 *
 * Eight of the twenty-one are mapped by nothing, each with its reason below and
 * pinned in both directions by `tests/unit/cardiology-curriculum.test.ts`.
 */

import { ACGME_INTERNAL_MEDICINE_MILESTONES } from '@platform/curriculum/acgme-internal-medicine';
import type { FrameworkRecord } from '@platform/curriculum/framework-records';
import type { ScenarioMapping } from '@platform/curriculum/mapping';

const FRAMEWORK_ID = ACGME_INTERNAL_MEDICINE_MILESTONES.id;

/** The readings this module's lessons are mapped against. */
export const CARDIOLOGY_FRAMEWORKS: readonly FrameworkRecord[] = [
  ACGME_INTERNAL_MEDICINE_MILESTONES,
];

/** Subcompetencies no lesson in this module exercises, and why. */
export const CARDIOLOGY_UNCOVERED: Readonly<Record<string, string>> = {
  'pc-6-digital-health': 'No lesson is a telehealth encounter or uses a patient-facing digital tool; the device reports two lessons read are reports a team supplies, not digital care.',
  'sbp-3-physician-role-in-health-care-systems': 'No lesson models cost, access, or what a health system makes available.',
  'pbli-1-evidence-based-practice': 'Lessons cite the evidence behind their own steps, but none asks the learner to locate or appraise it.',
  'pbli-2-reflective-practice': 'Reflection happens in the debrief, which is not part of any lesson\'s objectives.',
  'prof-1-professional-behavior': 'Conduct toward the patient and the team is modelled as communication rather than tested as behaviour.',
  'prof-2-ethical-principles': 'No lesson puts a duty to the patient in conflict with anything.',
  'prof-3-accountability': 'Recording what was done is how every lesson works, which makes it the medium rather than a thing measured.',
  'prof-4-knowledge-of-well-being-factors': 'Nothing here models well-being, the learner\'s or anybody else\'s.',
};

export const CARDIOLOGY_SCENARIO_MAPPINGS: readonly ScenarioMapping[] = [
  // --- stable-chest-pain-evaluation (clinic) ---
  { scenarioId: 'stable-chest-pain-evaluation', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['verify-stable-chest-pain-trajectory', 'characterize-stable-chest-pain-pattern'] },
  { scenarioId: 'stable-chest-pain-evaluation', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['verify-stable-chest-pain-trajectory', 'characterize-stable-chest-pain-pattern', 'estimate-stable-chest-pain-clinical-likelihood'] },
  { scenarioId: 'stable-chest-pain-evaluation', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-outpatient-management', objectiveIds: ['record-stable-chest-pain-testing-intent'] },
  { scenarioId: 'stable-chest-pain-evaluation', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['record-stable-chest-pain-testing-intent'] },
  { scenarioId: 'stable-chest-pain-evaluation', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['safety-net-stable-chest-pain-follow-up'] },
  { scenarioId: 'stable-chest-pain-evaluation', frameworkId: FRAMEWORK_ID, domainId: 'ics-1-patient-and-family-communication', objectiveIds: ['safety-net-stable-chest-pain-follow-up'] },
  // --- stemi-recognition-and-first-actions (clinic) ---
  { scenarioId: 'stemi-recognition-and-first-actions', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-clinic-stemi-pattern'] },
  { scenarioId: 'stemi-recognition-and-first-actions', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-clinic-stemi-pattern', 'screen-clinic-stemi-danger'] },
  { scenarioId: 'stemi-recognition-and-first-actions', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-clinic-stemi-transfer'] },
  { scenarioId: 'stemi-recognition-and-first-actions', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-clinic-stemi-transfer'] },
  { scenarioId: 'stemi-recognition-and-first-actions', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-outpatient-management', objectiveIds: ['record-clinic-stemi-bridge', 'reassess-clinic-stemi-handoff'] },
  { scenarioId: 'stemi-recognition-and-first-actions', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-clinic-stemi-bridge'] },
  { scenarioId: 'stemi-recognition-and-first-actions', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['reassess-clinic-stemi-handoff'] },
  // --- nstemi-risk-reassessment (clinic) ---
  { scenarioId: 'nstemi-risk-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-nstemi-serial-trajectory', 'verify-nstemi-and-alternatives'] },
  { scenarioId: 'nstemi-risk-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-nstemi-serial-trajectory', 'verify-nstemi-and-alternatives', 'screen-nstemi-very-high-risk-features', 'classify-nstemi-invasive-strategy'] },
  { scenarioId: 'nstemi-risk-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-outpatient-management', objectiveIds: ['record-nstemi-monitoring-and-handoff'] },
  { scenarioId: 'nstemi-risk-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-nstemi-monitoring-and-handoff'] },
  // --- acute-decompensated-heart-failure (clinic) ---
  { scenarioId: 'acute-decompensated-heart-failure', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-heart-failure-congestion-and-perfusion'] },
  { scenarioId: 'acute-decompensated-heart-failure', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-heart-failure-congestion-and-perfusion', 'review-heart-failure-tolerance-and-precipitant'] },
  { scenarioId: 'acute-decompensated-heart-failure', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['reconcile-heart-failure-congestion-and-perfusion'] },
  { scenarioId: 'acute-decompensated-heart-failure', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['review-heart-failure-diuretic-response', 'record-heart-failure-transition-intent'] },
  { scenarioId: 'acute-decompensated-heart-failure', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-outpatient-management', objectiveIds: ['record-heart-failure-transition-intent', 'reassess-heart-failure-discharge-readiness'] },
  { scenarioId: 'acute-decompensated-heart-failure', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['reassess-heart-failure-discharge-readiness'] },
  // --- post-infarction-cardiogenic-shock-escalation (icu) ---
  { scenarioId: 'post-infarction-cardiogenic-shock-escalation', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-post-infarction-shock-trajectory'] },
  { scenarioId: 'post-infarction-cardiogenic-shock-escalation', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-post-infarction-shock-trajectory', 'reopen-post-infarction-shock-causes'] },
  { scenarioId: 'post-infarction-cardiogenic-shock-escalation', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['contact-post-infarction-shock-center', 'handoff-post-infarction-shock-trajectory'] },
  { scenarioId: 'post-infarction-cardiogenic-shock-escalation', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['contact-post-infarction-shock-center'] },
  { scenarioId: 'post-infarction-cardiogenic-shock-escalation', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['record-post-infarction-shock-bridge'] },
  { scenarioId: 'post-infarction-cardiogenic-shock-escalation', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-post-infarction-shock-bridge'] },
  { scenarioId: 'post-infarction-cardiogenic-shock-escalation', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-post-infarction-shock-trajectory'] },
  // --- atrial-fibrillation-with-rapid-response (clinic) ---
  { scenarioId: 'atrial-fibrillation-with-rapid-response', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-af-rvr-rhythm-and-stability'] },
  { scenarioId: 'atrial-fibrillation-with-rapid-response', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-af-rvr-rhythm-and-stability', 'review-af-rvr-context-and-triggers'] },
  { scenarioId: 'atrial-fibrillation-with-rapid-response', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['reconcile-af-rvr-rhythm-and-stability'] },
  { scenarioId: 'atrial-fibrillation-with-rapid-response', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-applied-foundational-sciences', objectiveIds: ['review-af-rvr-context-and-triggers'] },
  { scenarioId: 'atrial-fibrillation-with-rapid-response', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-outpatient-management', objectiveIds: ['record-af-rvr-rate-control-intent', 'record-af-rvr-stroke-prevention-intent', 'reassess-af-rvr-trajectory-and-follow-up'] },
  { scenarioId: 'atrial-fibrillation-with-rapid-response', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-af-rvr-rate-control-intent', 'record-af-rvr-stroke-prevention-intent'] },
  { scenarioId: 'atrial-fibrillation-with-rapid-response', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['reassess-af-rvr-trajectory-and-follow-up'] },
  { scenarioId: 'atrial-fibrillation-with-rapid-response', frameworkId: FRAMEWORK_ID, domainId: 'ics-1-patient-and-family-communication', objectiveIds: ['reassess-af-rvr-trajectory-and-follow-up'] },
  // --- regular-narrow-complex-tachycardia (clinic) ---
  { scenarioId: 'regular-narrow-complex-tachycardia', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-stable-regular-narrow-tachycardia'] },
  { scenarioId: 'regular-narrow-complex-tachycardia', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-stable-regular-narrow-tachycardia', 'review-stable-regular-narrow-context'] },
  { scenarioId: 'regular-narrow-complex-tachycardia', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-applied-foundational-sciences', objectiveIds: ['review-stable-regular-narrow-context'] },
  { scenarioId: 'regular-narrow-complex-tachycardia', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-outpatient-management', objectiveIds: ['record-stable-regular-narrow-vagal-intent', 'record-stable-regular-narrow-adenosine-intent', 'reassess-stable-regular-narrow-trajectory'] },
  { scenarioId: 'regular-narrow-complex-tachycardia', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-stable-regular-narrow-vagal-intent', 'record-stable-regular-narrow-adenosine-intent'] },
  { scenarioId: 'regular-narrow-complex-tachycardia', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['reassess-stable-regular-narrow-trajectory'] },
  // --- wide-complex-tachycardia (clinic) ---
  { scenarioId: 'wide-complex-tachycardia', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-stable-wide-complex-tachycardia'] },
  { scenarioId: 'wide-complex-tachycardia', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-stable-wide-complex-tachycardia', 'review-wide-complex-context'] },
  { scenarioId: 'wide-complex-tachycardia', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-applied-foundational-sciences', objectiveIds: ['review-wide-complex-context'] },
  { scenarioId: 'wide-complex-tachycardia', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['prepare-wide-complex-pathway'] },
  { scenarioId: 'wide-complex-tachycardia', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['prepare-wide-complex-pathway'] },
  { scenarioId: 'wide-complex-tachycardia', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['review-wide-complex-medication-response', 'record-wide-complex-cardioversion-intent'] },
  { scenarioId: 'wide-complex-tachycardia', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-outpatient-management', objectiveIds: ['record-wide-complex-cardioversion-intent', 'reassess-wide-complex-trajectory'] },
  { scenarioId: 'wide-complex-tachycardia', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['reassess-wide-complex-trajectory'] },
  // --- symptomatic-sinus-bradycardia-reassessment (clinic) ---
  { scenarioId: 'symptomatic-sinus-bradycardia-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-symptomatic-bradycardia-stability'] },
  { scenarioId: 'symptomatic-sinus-bradycardia-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-symptomatic-bradycardia-stability', 'review-symptomatic-bradycardia-context', 'correlate-symptomatic-bradycardia-record'] },
  { scenarioId: 'symptomatic-sinus-bradycardia-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['reconcile-symptomatic-bradycardia-stability'] },
  { scenarioId: 'symptomatic-sinus-bradycardia-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-applied-foundational-sciences', objectiveIds: ['review-symptomatic-bradycardia-context'] },
  { scenarioId: 'symptomatic-sinus-bradycardia-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['correlate-symptomatic-bradycardia-record'] },
  { scenarioId: 'symptomatic-sinus-bradycardia-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-outpatient-management', objectiveIds: ['record-symptomatic-bradycardia-pacing-evaluation'] },
  { scenarioId: 'symptomatic-sinus-bradycardia-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-symptomatic-bradycardia-pacing-evaluation'] },
  { scenarioId: 'symptomatic-sinus-bradycardia-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-symptomatic-bradycardia-plan'] },
  { scenarioId: 'symptomatic-sinus-bradycardia-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['handoff-symptomatic-bradycardia-plan'] },
  // --- complete-heart-block (clinic) ---
  { scenarioId: 'complete-heart-block', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-complete-heart-block-stability'] },
  { scenarioId: 'complete-heart-block', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-complete-heart-block-stability', 'review-complete-heart-block-context'] },
  { scenarioId: 'complete-heart-block', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['reconcile-complete-heart-block-stability'] },
  { scenarioId: 'complete-heart-block', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-applied-foundational-sciences', objectiveIds: ['review-complete-heart-block-context'] },
  { scenarioId: 'complete-heart-block', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-complete-heart-block-pathway', 'handoff-complete-heart-block-pacing-plan'] },
  { scenarioId: 'complete-heart-block', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-complete-heart-block-pathway'] },
  { scenarioId: 'complete-heart-block', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-outpatient-management', objectiveIds: ['reassess-complete-heart-block-trajectory'] },
  { scenarioId: 'complete-heart-block', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['reassess-complete-heart-block-trajectory'] },
  { scenarioId: 'complete-heart-block', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-complete-heart-block-pacing-plan'] },
  // --- torsades-de-pointes (clinic) ---
  { scenarioId: 'torsades-de-pointes', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-torsades-pulse-and-pattern'] },
  { scenarioId: 'torsades-de-pointes', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-torsades-pulse-and-pattern', 'review-torsades-post-shock-rhythm', 'review-torsades-long-qt-context'] },
  { scenarioId: 'torsades-de-pointes', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['reconcile-torsades-pulse-and-pattern'] },
  { scenarioId: 'torsades-de-pointes', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-outpatient-management', objectiveIds: ['record-torsades-unsynchronized-shock-intent', 'record-torsades-recurrence-suppression-intent'] },
  { scenarioId: 'torsades-de-pointes', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-torsades-unsynchronized-shock-intent', 'record-torsades-recurrence-suppression-intent'] },
  { scenarioId: 'torsades-de-pointes', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-applied-foundational-sciences', objectiveIds: ['review-torsades-long-qt-context'] },
  { scenarioId: 'torsades-de-pointes', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-torsades-recurrence-plan'] },
  { scenarioId: 'torsades-de-pointes', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['handoff-torsades-recurrence-plan'] },
  // --- hyperkalemic-conduction-disturbance (clinic) ---
  { scenarioId: 'hyperkalemic-conduction-disturbance', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-hyperkalemic-conduction-trajectory'] },
  { scenarioId: 'hyperkalemic-conduction-disturbance', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-hyperkalemic-conduction-trajectory', 'review-hyperkalemic-conduction-shift-surveillance'] },
  { scenarioId: 'hyperkalemic-conduction-disturbance', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['review-hyperkalemic-conduction-calcium-response'] },
  { scenarioId: 'hyperkalemic-conduction-disturbance', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['review-hyperkalemic-conduction-shift-surveillance', 'review-hyperkalemic-conduction-removal-and-device-restraint', 'review-hyperkalemic-conduction-later-panel'] },
  { scenarioId: 'hyperkalemic-conduction-disturbance', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['review-hyperkalemic-conduction-removal-and-device-restraint', 'review-hyperkalemic-conduction-later-panel'] },
  { scenarioId: 'hyperkalemic-conduction-disturbance', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-hyperkalemic-conduction-reassessment'] },
  { scenarioId: 'hyperkalemic-conduction-disturbance', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['handoff-hyperkalemic-conduction-reassessment'] },
  // --- pericardial-tamponade (clinic) ---
  { scenarioId: 'pericardial-tamponade', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-pericardial-tamponade-trajectory'] },
  { scenarioId: 'pericardial-tamponade', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-pericardial-tamponade-trajectory', 'review-pericardial-tamponade-etiology', 'review-pericardial-tamponade-surveillance'] },
  { scenarioId: 'pericardial-tamponade', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['review-pericardial-tamponade-drainage-response'] },
  { scenarioId: 'pericardial-tamponade', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-applied-foundational-sciences', objectiveIds: ['review-pericardial-tamponade-etiology'] },
  { scenarioId: 'pericardial-tamponade', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['review-pericardial-tamponade-surveillance'] },
  { scenarioId: 'pericardial-tamponade', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-pericardial-tamponade-reassessment'] },
  { scenarioId: 'pericardial-tamponade', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['handoff-pericardial-tamponade-reassessment'] },
  // --- right-ventricular-infarction (clinic) ---
  { scenarioId: 'right-ventricular-infarction', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-right-ventricular-infarction'] },
  { scenarioId: 'right-ventricular-infarction', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-right-ventricular-infarction', 'review-right-ventricular-infarction-phenotype'] },
  { scenarioId: 'right-ventricular-infarction', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-applied-foundational-sciences', objectiveIds: ['review-right-ventricular-infarction-phenotype'] },
  { scenarioId: 'right-ventricular-infarction', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['preserve-right-ventricular-infarction-reperfusion'] },
  { scenarioId: 'right-ventricular-infarction', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-outpatient-management', objectiveIds: ['record-right-ventricular-infarction-support'] },
  { scenarioId: 'right-ventricular-infarction', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-right-ventricular-infarction-support'] },
  { scenarioId: 'right-ventricular-infarction', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-right-ventricular-infarction'] },
  { scenarioId: 'right-ventricular-infarction', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['handoff-right-ventricular-infarction'] },
  // --- hypertensive-emergency (clinic) ---
  { scenarioId: 'hypertensive-emergency', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-hypertensive-emergency-measurement-and-trajectory'] },
  { scenarioId: 'hypertensive-emergency', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-hypertensive-emergency-measurement-and-trajectory', 'review-hypertensive-emergency-organ-injury', 'review-hypertensive-emergency-phenotype-and-causes'] },
  { scenarioId: 'hypertensive-emergency', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['reconcile-hypertensive-emergency-measurement-and-trajectory'] },
  { scenarioId: 'hypertensive-emergency', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-applied-foundational-sciences', objectiveIds: ['review-hypertensive-emergency-phenotype-and-causes'] },
  { scenarioId: 'hypertensive-emergency', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-outpatient-management', objectiveIds: ['record-hypertensive-emergency-controlled-reduction-intent'] },
  { scenarioId: 'hypertensive-emergency', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-hypertensive-emergency-controlled-reduction-intent'] },
  { scenarioId: 'hypertensive-emergency', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['review-hypertensive-emergency-later-panel'] },
  { scenarioId: 'hypertensive-emergency', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['review-hypertensive-emergency-later-panel'] },
  { scenarioId: 'hypertensive-emergency', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-hypertensive-emergency-reassessment'] },
  { scenarioId: 'hypertensive-emergency', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['handoff-hypertensive-emergency-reassessment'] },
  // --- pacemaker-capture-failure (clinic) ---
  { scenarioId: 'pacemaker-capture-failure', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-pacemaker-capture-failure-pulse-and-pattern'] },
  { scenarioId: 'pacemaker-capture-failure', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-pacemaker-capture-failure-pulse-and-pattern', 'review-pacemaker-capture-failure-causes'] },
  { scenarioId: 'pacemaker-capture-failure', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['reconcile-pacemaker-capture-failure-pulse-and-pattern'] },
  { scenarioId: 'pacemaker-capture-failure', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-pacemaker-capture-failure-rescue-pathway', 'handoff-pacemaker-capture-failure-reassessment'] },
  { scenarioId: 'pacemaker-capture-failure', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-pacemaker-capture-failure-rescue-pathway'] },
  { scenarioId: 'pacemaker-capture-failure', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['review-pacemaker-capture-failure-device-system', 'review-pacemaker-capture-failure-later-panel'] },
  { scenarioId: 'pacemaker-capture-failure', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-applied-foundational-sciences', objectiveIds: ['review-pacemaker-capture-failure-causes'] },
  { scenarioId: 'pacemaker-capture-failure', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['review-pacemaker-capture-failure-later-panel'] },
  { scenarioId: 'pacemaker-capture-failure', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-pacemaker-capture-failure-reassessment'] },
  // --- transcutaneous-pacing-mechanical-capture-reassessment (clinic) ---
  { scenarioId: 'transcutaneous-pacing-mechanical-capture-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-transcutaneous-pacing-electrical-and-mechanical-capture'] },
  { scenarioId: 'transcutaneous-pacing-mechanical-capture-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-transcutaneous-pacing-electrical-and-mechanical-capture', 'review-transcutaneous-pacing-open-causes-and-bridge'] },
  { scenarioId: 'transcutaneous-pacing-mechanical-capture-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-transcutaneous-pacing-pulseless-response', 'handoff-transcutaneous-pacing-reassessment'] },
  { scenarioId: 'transcutaneous-pacing-mechanical-capture-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-transcutaneous-pacing-pulseless-response'] },
  { scenarioId: 'transcutaneous-pacing-mechanical-capture-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-applied-foundational-sciences', objectiveIds: ['review-transcutaneous-pacing-open-causes-and-bridge'] },
  { scenarioId: 'transcutaneous-pacing-mechanical-capture-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-transcutaneous-pacing-reassessment'] },
];
