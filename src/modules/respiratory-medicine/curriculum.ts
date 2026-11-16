/**
 * The respiratory medicine lessons mapped to the ACGME's Internal Medicine
 * Milestones (framework-mapping-expansion → scenario mappings).
 *
 * The second module on the internal medicine reading, and the first where the
 * setting question answers the other way: all fifteen lessons are declared
 * `icu`, so every one of them maps to inpatient management and none to
 * outpatient. Cardiology's sixteen clinic lessons mapped the opposite way from
 * the same reading. That is the point of reading each lesson's declared
 * environment rather than the module's subject.
 *
 * The convention is cardiology's, with four additions this module's objectives
 * required - which is why it is authored per module rather than copied:
 *
 * - `coordinate-` an onward plan, a referral, rehabilitation, self-management
 *   or goals → Systems-Based Practice 2 and Communication Skills 1. These
 *   objectives are about the patient's life after this admission, and the
 *   person it belongs to is in the conversation.
 * - `corroborate-` a signal while supporting the patient → Patient Care 2 and
 *   inpatient management: it is an examination finding acted on at once.
 * - `select-` a support mode, bilevel or high-flow → inpatient management with
 *   Medical Knowledge 2, because what is being chosen is a therapy.
 * - `escalate-` joins `activate-`: Systems-Based Practice 2 with Communication
 *   Skills 2.
 *
 * Eight of the fifteen lessons direct no care at all: they reconcile, review,
 * coordinate and hand over, which is what a module of reassessment lessons
 * does. None of those eight carries a management subcompetency, because giving
 * one to a lesson that changes nothing would claim the learner changed it. The
 * eight are named in the test file.
 *
 * Nine of the twenty-one are mapped by nothing, each with its reason below and
 * pinned in both directions by
 * `tests/unit/respiratory-medicine-curriculum.test.ts`.
 */

import { ACGME_INTERNAL_MEDICINE_MILESTONES } from '@platform/curriculum/acgme-internal-medicine';
import type { FrameworkRecord } from '@platform/curriculum/framework-records';
import type { ScenarioMapping } from '@platform/curriculum/mapping';

const FRAMEWORK_ID = ACGME_INTERNAL_MEDICINE_MILESTONES.id;

/** The readings this module's lessons are mapped against. */
export const RESPIRATORY_MEDICINE_FRAMEWORKS: readonly FrameworkRecord[] = [
  ACGME_INTERNAL_MEDICINE_MILESTONES,
];

/** Subcompetencies no lesson in this module exercises, and why. */
export const RESPIRATORY_MEDICINE_UNCOVERED: Readonly<Record<string, string>> = {
  'pc-5-outpatient-management': 'All fifteen lessons are declared ICU lessons; the follow-up some of them arrange is coordinated, not delivered.',
  'pc-6-digital-health': 'No lesson is a telehealth encounter or uses a patient-facing digital tool.',
  'sbp-3-physician-role-in-health-care-systems': 'No lesson models cost, access, or what a health system makes available.',
  'pbli-1-evidence-based-practice': 'Lessons cite the evidence behind their own steps, but none asks the learner to locate or appraise it.',
  'pbli-2-reflective-practice': 'Reflection happens in the debrief, which is not part of any lesson\'s objectives.',
  'prof-1-professional-behavior': 'Conduct toward the patient and the team is modelled as communication rather than tested as behaviour.',
  'prof-2-ethical-principles': 'The neuromuscular lesson coordinates goals of care, but no objective measures the ethical reasoning behind them.',
  'prof-3-accountability': 'Recording what was done is how every lesson works, which makes it the medium rather than a thing measured.',
  'prof-4-knowledge-of-well-being-factors': 'Nothing here models well-being, the learner\'s or anybody else\'s.',
};

export const RESPIRATORY_MEDICINE_SCENARIO_MAPPINGS: readonly ScenarioMapping[] = [
  // --- acute-severe-asthma (icu) ---
  { scenarioId: 'acute-severe-asthma', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-acute-severe-asthma-treatment-and-trajectory'] },
  { scenarioId: 'acute-severe-asthma', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-acute-severe-asthma-treatment-and-trajectory', 'recognize-acute-severe-asthma-respiratory-failure', 'review-acute-severe-asthma-alternatives-and-ventilation-risks'] },
  { scenarioId: 'acute-severe-asthma', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-acute-severe-asthma-critical-care-escalation', 'handoff-acute-severe-asthma-reassessment'] },
  { scenarioId: 'acute-severe-asthma', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-acute-severe-asthma-critical-care-escalation'] },
  { scenarioId: 'acute-severe-asthma', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-applied-foundational-sciences', objectiveIds: ['review-acute-severe-asthma-alternatives-and-ventilation-risks'] },
  { scenarioId: 'acute-severe-asthma', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-acute-severe-asthma-reassessment'] },
  // --- copd-exacerbation-transition-reassessment (icu) ---
  { scenarioId: 'copd-exacerbation-transition-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-copd-exacerbation-recovery-and-readiness'] },
  { scenarioId: 'copd-exacerbation-transition-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-copd-exacerbation-recovery-and-readiness', 'review-copd-exacerbation-residual-respiratory-and-oxygen-needs', 'review-copd-exacerbation-maintenance-and-acute-medication-plan'] },
  { scenarioId: 'copd-exacerbation-transition-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['coordinate-copd-exacerbation-rehabilitation-self-management-and-follow-up', 'handoff-copd-exacerbation-transition-reassessment'] },
  { scenarioId: 'copd-exacerbation-transition-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'ics-1-patient-and-family-communication', objectiveIds: ['coordinate-copd-exacerbation-rehabilitation-self-management-and-follow-up'] },
  { scenarioId: 'copd-exacerbation-transition-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-copd-exacerbation-transition-reassessment'] },
  // --- community-acquired-pneumonia-hypoxemia-reassessment (icu) ---
  { scenarioId: 'community-acquired-pneumonia-hypoxemia-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['corroborate-and-support-cap-hypoxemia'] },
  { scenarioId: 'community-acquired-pneumonia-hypoxemia-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['corroborate-and-support-cap-hypoxemia', 'record-cap-testing-and-empiric-treatment-intent'] },
  { scenarioId: 'community-acquired-pneumonia-hypoxemia-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-cap-evidence-and-dangerous-alternatives'] },
  { scenarioId: 'community-acquired-pneumonia-hypoxemia-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-cap-evidence-and-dangerous-alternatives', 'classify-cap-severity-and-escalation-needs'] },
  { scenarioId: 'community-acquired-pneumonia-hypoxemia-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['record-cap-testing-and-empiric-treatment-intent'] },
  { scenarioId: 'community-acquired-pneumonia-hypoxemia-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-cap-hypoxemia-reassessment'] },
  { scenarioId: 'community-acquired-pneumonia-hypoxemia-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['handoff-cap-hypoxemia-reassessment'] },
  // --- post-pulmonary-embolism-persistent-dyspnea (icu) ---
  { scenarioId: 'post-pulmonary-embolism-persistent-dyspnea', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-post-pe-symptoms-and-anticoagulation-course'] },
  { scenarioId: 'post-pulmonary-embolism-persistent-dyspnea', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-post-pe-symptoms-and-anticoagulation-course', 'review-post-pe-functional-limitation-and-current-safety', 'review-post-pe-ctepd-evidence-and-alternatives'] },
  { scenarioId: 'post-pulmonary-embolism-persistent-dyspnea', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-applied-foundational-sciences', objectiveIds: ['review-post-pe-ctepd-evidence-and-alternatives'] },
  { scenarioId: 'post-pulmonary-embolism-persistent-dyspnea', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-post-pe-pulmonary-vascular-referral', 'handoff-post-pe-persistent-dyspnea-reassessment'] },
  { scenarioId: 'post-pulmonary-embolism-persistent-dyspnea', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-post-pe-pulmonary-vascular-referral'] },
  { scenarioId: 'post-pulmonary-embolism-persistent-dyspnea', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-post-pe-persistent-dyspnea-reassessment'] },
  // --- acute-pulmonary-edema-respiratory-support-reassessment (icu) ---
  { scenarioId: 'acute-pulmonary-edema-respiratory-support-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-ape-initial-care-and-trajectory'] },
  { scenarioId: 'acute-pulmonary-edema-respiratory-support-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-ape-initial-care-and-trajectory', 'review-ape-progressive-respiratory-failure', 'review-ape-pressure-perfusion-congestion-and-causes'] },
  { scenarioId: 'acute-pulmonary-edema-respiratory-support-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-applied-foundational-sciences', objectiveIds: ['review-ape-pressure-perfusion-congestion-and-causes'] },
  { scenarioId: 'acute-pulmonary-edema-respiratory-support-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-ape-airway-capable-escalation', 'handoff-ape-respiratory-support-reassessment'] },
  { scenarioId: 'acute-pulmonary-edema-respiratory-support-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-ape-airway-capable-escalation'] },
  { scenarioId: 'acute-pulmonary-edema-respiratory-support-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-ape-respiratory-support-reassessment'] },
  // --- spontaneous-tension-pneumothorax-post-drainage-reassessment (icu) ---
  { scenarioId: 'spontaneous-tension-pneumothorax-post-drainage-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-spontaneous-tension-pneumothorax-trajectory-and-prior-care'] },
  { scenarioId: 'spontaneous-tension-pneumothorax-post-drainage-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-spontaneous-tension-pneumothorax-trajectory-and-prior-care', 'review-spontaneous-tension-pneumothorax-drain-system-and-complications', 'review-spontaneous-tension-pneumothorax-etiology-recurrence-and-definitive-planning'] },
  { scenarioId: 'spontaneous-tension-pneumothorax-post-drainage-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['review-spontaneous-tension-pneumothorax-drainage-response'] },
  { scenarioId: 'spontaneous-tension-pneumothorax-post-drainage-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-applied-foundational-sciences', objectiveIds: ['review-spontaneous-tension-pneumothorax-etiology-recurrence-and-definitive-planning'] },
  { scenarioId: 'spontaneous-tension-pneumothorax-post-drainage-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-spontaneous-tension-pneumothorax-post-drainage-reassessment'] },
  { scenarioId: 'spontaneous-tension-pneumothorax-post-drainage-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['handoff-spontaneous-tension-pneumothorax-post-drainage-reassessment'] },
  // --- large-unilateral-pleural-effusion-reassessment (icu) ---
  { scenarioId: 'large-unilateral-pleural-effusion-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-large-unilateral-pleural-effusion-trajectory'] },
  { scenarioId: 'large-unilateral-pleural-effusion-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-large-unilateral-pleural-effusion-trajectory'] },
  { scenarioId: 'large-unilateral-pleural-effusion-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['record-large-unilateral-pleural-effusion-pleural-team-and-drainage-intent'] },
  { scenarioId: 'large-unilateral-pleural-effusion-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-large-unilateral-pleural-effusion-pleural-team-and-drainage-intent'] },
  { scenarioId: 'large-unilateral-pleural-effusion-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['review-large-unilateral-pleural-effusion-drainage-response', 'review-large-unilateral-pleural-effusion-fluid-pattern-and-causes'] },
  { scenarioId: 'large-unilateral-pleural-effusion-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['review-large-unilateral-pleural-effusion-drainage-response', 'review-large-unilateral-pleural-effusion-fluid-pattern-and-causes'] },
  { scenarioId: 'large-unilateral-pleural-effusion-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['coordinate-large-unilateral-pleural-effusion-definitive-evaluation', 'handoff-large-unilateral-pleural-effusion-reassessment'] },
  { scenarioId: 'large-unilateral-pleural-effusion-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'ics-1-patient-and-family-communication', objectiveIds: ['coordinate-large-unilateral-pleural-effusion-definitive-evaluation'] },
  { scenarioId: 'large-unilateral-pleural-effusion-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-large-unilateral-pleural-effusion-reassessment'] },
  // --- bronchiectasis-mucus-plugging-reassessment (icu) ---
  { scenarioId: 'bronchiectasis-mucus-plugging-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-bronchiectasis-mucus-plugging-trajectory'] },
  { scenarioId: 'bronchiectasis-mucus-plugging-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-bronchiectasis-mucus-plugging-trajectory', 'review-bronchiectasis-mucus-plugging-evidence-and-alternatives'] },
  { scenarioId: 'bronchiectasis-mucus-plugging-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-applied-foundational-sciences', objectiveIds: ['review-bronchiectasis-mucus-plugging-evidence-and-alternatives'] },
  { scenarioId: 'bronchiectasis-mucus-plugging-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['record-bronchiectasis-mucus-plugging-supported-airway-clearance-intent'] },
  { scenarioId: 'bronchiectasis-mucus-plugging-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-bronchiectasis-mucus-plugging-supported-airway-clearance-intent'] },
  { scenarioId: 'bronchiectasis-mucus-plugging-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['review-bronchiectasis-mucus-plugging-later-response'] },
  { scenarioId: 'bronchiectasis-mucus-plugging-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['review-bronchiectasis-mucus-plugging-later-response'] },
  { scenarioId: 'bronchiectasis-mucus-plugging-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['escalate-bronchiectasis-mucus-plugging-persistent-collapse', 'handoff-bronchiectasis-mucus-plugging-reassessment'] },
  { scenarioId: 'bronchiectasis-mucus-plugging-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['escalate-bronchiectasis-mucus-plugging-persistent-collapse'] },
  { scenarioId: 'bronchiectasis-mucus-plugging-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-bronchiectasis-mucus-plugging-reassessment'] },
  // --- chronic-opioid-related-hypoventilation-reassessment (icu) ---
  { scenarioId: 'chronic-opioid-related-hypoventilation-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-chronic-opioid-related-hypoventilation-exposure-and-trajectory'] },
  { scenarioId: 'chronic-opioid-related-hypoventilation-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-chronic-opioid-related-hypoventilation-exposure-and-trajectory', 'review-chronic-opioid-related-hypoventilation-awake-and-sleep-evidence', 'review-chronic-opioid-related-hypoventilation-contributors-and-alternatives'] },
  { scenarioId: 'chronic-opioid-related-hypoventilation-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-applied-foundational-sciences', objectiveIds: ['review-chronic-opioid-related-hypoventilation-contributors-and-alternatives'] },
  { scenarioId: 'chronic-opioid-related-hypoventilation-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['coordinate-chronic-opioid-related-hypoventilation-prescriber-sleep-and-respiratory-plan', 'handoff-chronic-opioid-related-hypoventilation-reassessment'] },
  { scenarioId: 'chronic-opioid-related-hypoventilation-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'ics-1-patient-and-family-communication', objectiveIds: ['coordinate-chronic-opioid-related-hypoventilation-prescriber-sleep-and-respiratory-plan'] },
  { scenarioId: 'chronic-opioid-related-hypoventilation-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-chronic-opioid-related-hypoventilation-reassessment'] },
  // --- neuromuscular-respiratory-failure-reassessment (icu) ---
  { scenarioId: 'neuromuscular-respiratory-failure-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-neuromuscular-respiratory-failure-trajectory'] },
  { scenarioId: 'neuromuscular-respiratory-failure-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-neuromuscular-respiratory-failure-trajectory', 'recognize-neuromuscular-respiratory-failure', 'review-neuromuscular-respiratory-failure-bulbar-cough-and-alternatives'] },
  { scenarioId: 'neuromuscular-respiratory-failure-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-neuromuscular-respiratory-failure-escalation', 'coordinate-neuromuscular-respiratory-failure-goals-and-ownership', 'handoff-neuromuscular-respiratory-failure-reassessment'] },
  { scenarioId: 'neuromuscular-respiratory-failure-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-neuromuscular-respiratory-failure-escalation'] },
  { scenarioId: 'neuromuscular-respiratory-failure-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-applied-foundational-sciences', objectiveIds: ['review-neuromuscular-respiratory-failure-bulbar-cough-and-alternatives'] },
  { scenarioId: 'neuromuscular-respiratory-failure-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'ics-1-patient-and-family-communication', objectiveIds: ['coordinate-neuromuscular-respiratory-failure-goals-and-ownership'] },
  { scenarioId: 'neuromuscular-respiratory-failure-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-neuromuscular-respiratory-failure-reassessment'] },
  // --- obesity-hypoventilation-reassessment (icu) ---
  { scenarioId: 'obesity-hypoventilation-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-obesity-hypoventilation-phenotype-and-trajectory'] },
  { scenarioId: 'obesity-hypoventilation-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-obesity-hypoventilation-phenotype-and-trajectory', 'review-obesity-hypoventilation-awake-evidence', 'review-obesity-hypoventilation-sleep-evidence-and-open-causes', 'recognize-obesity-hypoventilation-working-pattern'] },
  { scenarioId: 'obesity-hypoventilation-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-applied-foundational-sciences', objectiveIds: ['review-obesity-hypoventilation-sleep-evidence-and-open-causes'] },
  { scenarioId: 'obesity-hypoventilation-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['coordinate-obesity-hypoventilation-shared-plan', 'handoff-obesity-hypoventilation-reassessment'] },
  { scenarioId: 'obesity-hypoventilation-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'ics-1-patient-and-family-communication', objectiveIds: ['coordinate-obesity-hypoventilation-shared-plan'] },
  { scenarioId: 'obesity-hypoventilation-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-obesity-hypoventilation-reassessment'] },
  // --- noninvasive-ventilation-selection (icu) ---
  { scenarioId: 'noninvasive-ventilation-selection', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-noninvasive-ventilation-selection-treatment-and-trajectory'] },
  { scenarioId: 'noninvasive-ventilation-selection', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-noninvasive-ventilation-selection-treatment-and-trajectory', 'review-noninvasive-ventilation-selection-suitability-and-rescue-readiness', 'review-noninvasive-ventilation-selection-failure-guards'] },
  { scenarioId: 'noninvasive-ventilation-selection', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['select-bilevel-noninvasive-ventilation'] },
  { scenarioId: 'noninvasive-ventilation-selection', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['select-bilevel-noninvasive-ventilation', 'review-noninvasive-ventilation-selection-early-response'] },
  { scenarioId: 'noninvasive-ventilation-selection', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-noninvasive-ventilation-selection-reassessment'] },
  { scenarioId: 'noninvasive-ventilation-selection', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['handoff-noninvasive-ventilation-selection-reassessment'] },
  // --- high-flow-nasal-oxygen-escalation (icu) ---
  { scenarioId: 'high-flow-nasal-oxygen-escalation', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-high-flow-oxygen-conventional-support-trajectory'] },
  { scenarioId: 'high-flow-nasal-oxygen-escalation', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-high-flow-oxygen-conventional-support-trajectory', 'review-high-flow-oxygen-suitability-and-rescue-readiness'] },
  { scenarioId: 'high-flow-nasal-oxygen-escalation', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['select-high-flow-nasal-oxygen-escalation'] },
  { scenarioId: 'high-flow-nasal-oxygen-escalation', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['select-high-flow-nasal-oxygen-escalation', 'review-high-flow-oxygen-early-response'] },
  { scenarioId: 'high-flow-nasal-oxygen-escalation', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['preserve-high-flow-oxygen-monitoring-and-failure-guards'] },
  { scenarioId: 'high-flow-nasal-oxygen-escalation', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-high-flow-oxygen-escalation'] },
  { scenarioId: 'high-flow-nasal-oxygen-escalation', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['handoff-high-flow-oxygen-escalation'] },
  // --- oxygen-device-failure (icu) ---
  { scenarioId: 'oxygen-device-failure', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-oxygen-device-failure-patient-signal-and-delivery'] },
  { scenarioId: 'oxygen-device-failure', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-oxygen-device-failure-patient-signal-and-delivery'] },
  { scenarioId: 'oxygen-device-failure', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-oxygen-device-failure-immediate-bridge-and-help', 'handoff-oxygen-device-failure-reassessment'] },
  { scenarioId: 'oxygen-device-failure', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-oxygen-device-failure-immediate-bridge-and-help'] },
  { scenarioId: 'oxygen-device-failure', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['review-oxygen-device-failure-source-to-patient-path'] },
  { scenarioId: 'oxygen-device-failure', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['record-oxygen-device-failure-restoration-and-backup-intent'] },
  { scenarioId: 'oxygen-device-failure', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-oxygen-device-failure-restoration-and-backup-intent', 'review-oxygen-device-failure-delivery-and-patient-response'] },
  { scenarioId: 'oxygen-device-failure', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-oxygen-device-failure-reassessment'] },
  // --- acute-tracheostomy-obstruction (icu) ---
  { scenarioId: 'acute-tracheostomy-obstruction', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-acute-tracheostomy-obstruction-anatomy-and-patency'] },
  { scenarioId: 'acute-tracheostomy-obstruction', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-acute-tracheostomy-obstruction-anatomy-and-patency'] },
  { scenarioId: 'acute-tracheostomy-obstruction', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-acute-tracheostomy-obstruction-help-and-oxygenation', 'handoff-acute-tracheostomy-obstruction-reassessment'] },
  { scenarioId: 'acute-tracheostomy-obstruction', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-acute-tracheostomy-obstruction-help-and-oxygenation'] },
  { scenarioId: 'acute-tracheostomy-obstruction', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['review-acute-tracheostomy-obstruction-device-pathway'] },
  { scenarioId: 'acute-tracheostomy-obstruction', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['record-acute-tracheostomy-obstruction-inner-cannula-removal', 'reassess-acute-tracheostomy-obstruction-restoration'] },
  { scenarioId: 'acute-tracheostomy-obstruction', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-acute-tracheostomy-obstruction-inner-cannula-removal'] },
  { scenarioId: 'acute-tracheostomy-obstruction', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['reassess-acute-tracheostomy-obstruction-restoration'] },
  { scenarioId: 'acute-tracheostomy-obstruction', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-acute-tracheostomy-obstruction-reassessment'] },
];
