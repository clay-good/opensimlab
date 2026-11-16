/**
 * The emergency medicine lessons mapped to the ACGME's EM Milestones
 * (framework-mapping-expansion → scenario mappings).
 *
 * This is the second module to carry a mapping and the first outside
 * anaesthesia, so the convention it follows is written down rather than left
 * to taste. Each objective is placed by what the objective MEASURES, not by
 * what the lesson is about:
 *
 * - Reaching or holding a working diagnosis under uncertainty → Patient Care 4.
 * - Evidence that comes from the bedside examination, including repeating it
 *   when the picture changes → Patient Care 2.
 * - Reading an authored test, laboratory value, ECG or image → Patient Care 3.
 * - Acting on the immediate threat to airway, breathing or circulation →
 *   Patient Care 1.
 * - Recording a drug, a dose, a route or a timing → Patient Care 5.
 * - Looking again after acting, or deciding where the patient goes next →
 *   Patient Care 6.
 * - Carrying parallel threads of care without dropping one → Patient Care 7.
 * - A procedure: decompression, cardioversion, defibrillation, a tourniquet,
 *   cold-water immersion → Patient Care 8.
 * - The physiology a decision rests on → Medical Knowledge 1; the reasoning
 *   from evidence to treatment → Medical Knowledge 2.
 * - A bound, a gate or a ceiling whose point is that acting faster would harm →
 *   Systems-Based Practice 1.
 * - Activating a pathway, a team or a service → Systems-Based Practice 3, and
 *   Interpersonal and Communication Skills 2 where the activation is a call for
 *   help somebody has to answer.
 * - Handing the patient over → Interpersonal and Communication Skills 3.
 *
 * Eight of the twenty-two subcompetencies are mapped by nothing, and that is
 * the honest result rather than a gap: no lesson here runs a quality-improvement
 * project, works a health system's cost or access constraints, appraises
 * published evidence, reflects on the learner's own growth, tests professional
 * behaviour, accountability or well-being, or holds a conversation with a
 * patient or a family. The coverage table lists all eight by name, and
 * `tests/unit/emergency-medicine-curriculum.test.ts` pins them so a later
 * mapping cannot quietly claim one.
 */

import { ACGME_EMERGENCY_MEDICINE_MILESTONES } from '@platform/curriculum/acgme-emergency-medicine';
import type { FrameworkRecord } from '@platform/curriculum/framework-records';
import type { ScenarioMapping } from '@platform/curriculum/mapping';

const FRAMEWORK_ID = ACGME_EMERGENCY_MEDICINE_MILESTONES.id;

/** The readings this module's lessons are mapped against. */
export const EMERGENCY_MEDICINE_FRAMEWORKS: readonly FrameworkRecord[] = [
  ACGME_EMERGENCY_MEDICINE_MILESTONES,
];

/** Subcompetencies no lesson in this module exercises, and why. */
export const EMERGENCY_MEDICINE_UNCOVERED: Readonly<Record<string, string>> = {
  'sbp-2-quality-improvement': 'Quality improvement is measured over cases rather than within one; every lesson here is a single encounter.',
  'sbp-4-physician-role-in-health-care-systems': 'No lesson models cost, access, or the constraints a health system imposes on a decision.',
  'pbli-1-evidence-based-practice': 'Lessons cite the evidence behind their own steps, but none asks the learner to locate or appraise it.',
  'pbli-2-reflective-practice': 'Reflection happens in the debrief, which is not part of any lesson\'s objectives.',
  'prof-1-professional-behavior-and-ethics': 'No lesson puts a duty to the patient in conflict with anything.',
  'prof-2-accountability': 'Recording what was done is how every lesson works, which makes it the medium rather than a thing measured.',
  'prof-3-self-awareness-and-well-being': 'Nothing here models the learner\'s own state.',
  'ics-1-patient-and-family-communication': 'No lesson has a speaking patient or a family member.',
};

export const EMERGENCY_MEDICINE_SCENARIO_MAPPINGS: readonly ScenarioMapping[] = [
  // --- undifferentiated-shock ---
  { scenarioId: 'undifferentiated-shock', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-diagnosis', objectiveIds: ['recognize-shock-from-perfusion', 'assess-shock-phenotype'] },
  { scenarioId: 'undifferentiated-shock', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-focused-history-and-physical', objectiveIds: ['recognize-shock-from-perfusion'] },
  { scenarioId: 'undifferentiated-shock', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-diagnostic-studies', objectiveIds: ['assess-shock-phenotype'] },
  { scenarioId: 'undifferentiated-shock', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-emergency-stabilization', objectiveIds: ['test-fluid-responsiveness'] },
  { scenarioId: 'undifferentiated-shock', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-treatment-and-clinical-reasoning', objectiveIds: ['test-fluid-responsiveness'] },
  { scenarioId: 'undifferentiated-shock', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-reassessment-and-disposition', objectiveIds: ['reassess-and-escalate-shock'] },
  { scenarioId: 'undifferentiated-shock', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-system-navigation', objectiveIds: ['reassess-and-escalate-shock'] },
  // --- septic-shock ---
  { scenarioId: 'septic-shock', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-diagnosis', objectiveIds: ['recognize-probable-sepsis-with-shock'] },
  { scenarioId: 'septic-shock', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-treatment-and-clinical-reasoning', objectiveIds: ['recognize-probable-sepsis-with-shock'] },
  { scenarioId: 'septic-shock', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-diagnostic-studies', objectiveIds: ['pair-diagnostics-with-immediate-antimicrobial-intent'] },
  { scenarioId: 'septic-shock', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-pharmacotherapy', objectiveIds: ['pair-diagnostics-with-immediate-antimicrobial-intent'] },
  { scenarioId: 'septic-shock', frameworkId: FRAMEWORK_ID, domainId: 'pc-7-multitasking', objectiveIds: ['pair-diagnostics-with-immediate-antimicrobial-intent'] },
  { scenarioId: 'septic-shock', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-emergency-stabilization', objectiveIds: ['give-initial-sepsis-fluid-and-reassess', 'support-persistent-shock-and-escalate-source-control'] },
  { scenarioId: 'septic-shock', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-reassessment-and-disposition', objectiveIds: ['give-initial-sepsis-fluid-and-reassess'] },
  { scenarioId: 'septic-shock', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-system-navigation', objectiveIds: ['support-persistent-shock-and-escalate-source-control'] },
  // --- hemorrhagic-shock ---
  { scenarioId: 'hemorrhagic-shock', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-diagnosis', objectiveIds: ['recognize-traumatic-hemorrhagic-shock'] },
  { scenarioId: 'hemorrhagic-shock', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-focused-history-and-physical', objectiveIds: ['recognize-traumatic-hemorrhagic-shock'] },
  { scenarioId: 'hemorrhagic-shock', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-emergency-stabilization', objectiveIds: ['stabilize-and-expedite-bleeding-control'] },
  { scenarioId: 'hemorrhagic-shock', frameworkId: FRAMEWORK_ID, domainId: 'pc-7-multitasking', objectiveIds: ['stabilize-and-expedite-bleeding-control'] },
  { scenarioId: 'hemorrhagic-shock', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-system-navigation', objectiveIds: ['stabilize-and-expedite-bleeding-control', 'activate-and-bridge-with-blood'] },
  { scenarioId: 'hemorrhagic-shock', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-pharmacotherapy', objectiveIds: ['activate-and-bridge-with-blood'] },
  { scenarioId: 'hemorrhagic-shock', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-diagnostic-studies', objectiveIds: ['monitor-and-reassess-traumatic-bleeding'] },
  { scenarioId: 'hemorrhagic-shock', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-reassessment-and-disposition', objectiveIds: ['monitor-and-reassess-traumatic-bleeding'] },
  // --- obstructive-shock-tension-pneumothorax ---
  { scenarioId: 'obstructive-shock-tension-pneumothorax', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-focused-history-and-physical', objectiveIds: ['assess-obstructive-pleural-shock'] },
  { scenarioId: 'obstructive-shock-tension-pneumothorax', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-diagnosis', objectiveIds: ['assess-obstructive-pleural-shock'] },
  { scenarioId: 'obstructive-shock-tension-pneumothorax', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['escalate-obstructive-pleural-shock'] },
  { scenarioId: 'obstructive-shock-tension-pneumothorax', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-system-navigation', objectiveIds: ['escalate-obstructive-pleural-shock'] },
  { scenarioId: 'obstructive-shock-tension-pneumothorax', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-emergency-stabilization', objectiveIds: ['support-obstructive-pleural-oxygenation'] },
  { scenarioId: 'obstructive-shock-tension-pneumothorax', frameworkId: FRAMEWORK_ID, domainId: 'pc-8-general-approach-to-procedures', objectiveIds: ['decompress-obstructive-pleural-shock'] },
  { scenarioId: 'obstructive-shock-tension-pneumothorax', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-reassessment-and-disposition', objectiveIds: ['reassess-obstructive-pleural-recovery'] },
  // --- cardiac-tamponade ---
  { scenarioId: 'cardiac-tamponade', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-diagnosis', objectiveIds: ['recognize-traumatic-tamponade-pattern'] },
  { scenarioId: 'cardiac-tamponade', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-focused-history-and-physical', objectiveIds: ['recognize-traumatic-tamponade-pattern'] },
  { scenarioId: 'cardiac-tamponade', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-diagnostic-studies', objectiveIds: ['review-tamponade-focused-pocus'] },
  { scenarioId: 'cardiac-tamponade', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-system-navigation', objectiveIds: ['escalate-traumatic-tamponade-control'] },
  { scenarioId: 'cardiac-tamponade', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['escalate-traumatic-tamponade-control'] },
  { scenarioId: 'cardiac-tamponade', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-reassessment-and-disposition', objectiveIds: ['reassess-traumatic-tamponade'] },
  // --- anaphylaxis ---
  { scenarioId: 'anaphylaxis', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-diagnosis', objectiveIds: ['recognize-ed-anaphylaxis-pattern'] },
  { scenarioId: 'anaphylaxis', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-treatment-and-clinical-reasoning', objectiveIds: ['recognize-ed-anaphylaxis-pattern'] },
  { scenarioId: 'anaphylaxis', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-pharmacotherapy', objectiveIds: ['give-first-line-im-epinephrine'] },
  { scenarioId: 'anaphylaxis', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['give-first-line-im-epinephrine'] },
  { scenarioId: 'anaphylaxis', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-emergency-stabilization', objectiveIds: ['support-anaphylaxis-airway-and-circulation'] },
  { scenarioId: 'anaphylaxis', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-reassessment-and-disposition', objectiveIds: ['reassess-initial-anaphylaxis-response'] },
  // --- adult-asthma ---
  { scenarioId: 'adult-asthma', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-focused-history-and-physical', objectiveIds: ['recognize-severe-adult-asthma'] },
  { scenarioId: 'adult-asthma', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-diagnosis', objectiveIds: ['recognize-severe-adult-asthma'] },
  { scenarioId: 'adult-asthma', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['use-controlled-oxygen-in-adult-asthma'] },
  { scenarioId: 'adult-asthma', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-emergency-stabilization', objectiveIds: ['use-controlled-oxygen-in-adult-asthma'] },
  { scenarioId: 'adult-asthma', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-pharmacotherapy', objectiveIds: ['give-initial-adult-asthma-treatment'] },
  { scenarioId: 'adult-asthma', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-reassessment-and-disposition', objectiveIds: ['reassess-adult-asthma-response'] },
  { scenarioId: 'adult-asthma', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-diagnostic-studies', objectiveIds: ['reassess-adult-asthma-response'] },
  // --- copd-exacerbation ---
  { scenarioId: 'copd-exacerbation', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-focused-history-and-physical', objectiveIds: ['assess-copd-exacerbation-severity'] },
  { scenarioId: 'copd-exacerbation', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-diagnostic-studies', objectiveIds: ['assess-copd-exacerbation-severity', 'recognize-copd-antibiotic-indication'] },
  { scenarioId: 'copd-exacerbation', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-diagnosis', objectiveIds: ['assess-copd-exacerbation-severity'] },
  { scenarioId: 'copd-exacerbation', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['use-controlled-oxygen-in-copd'] },
  { scenarioId: 'copd-exacerbation', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-scientific-knowledge', objectiveIds: ['use-controlled-oxygen-in-copd'] },
  { scenarioId: 'copd-exacerbation', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-pharmacotherapy', objectiveIds: ['give-initial-copd-exacerbation-treatment'] },
  { scenarioId: 'copd-exacerbation', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-treatment-and-clinical-reasoning', objectiveIds: ['recognize-copd-antibiotic-indication'] },
  { scenarioId: 'copd-exacerbation', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-reassessment-and-disposition', objectiveIds: ['reassess-copd-respiratory-failure'] },
  // --- acute-pulmonary-edema ---
  { scenarioId: 'acute-pulmonary-edema', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-diagnosis', objectiveIds: ['recognize-acute-pulmonary-edema-pattern'] },
  { scenarioId: 'acute-pulmonary-edema', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-diagnostic-studies', objectiveIds: ['recognize-acute-pulmonary-edema-pattern'] },
  { scenarioId: 'acute-pulmonary-edema', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-emergency-stabilization', objectiveIds: ['support-pulmonary-edema-gas-exchange'] },
  { scenarioId: 'acute-pulmonary-edema', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-pharmacotherapy', objectiveIds: ['treat-hypertensive-pulmonary-edema'] },
  { scenarioId: 'acute-pulmonary-edema', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-treatment-and-clinical-reasoning', objectiveIds: ['treat-hypertensive-pulmonary-edema'] },
  { scenarioId: 'acute-pulmonary-edema', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-reassessment-and-disposition', objectiveIds: ['reassess-pulmonary-edema-response'] },
  // --- pulmonary-embolism-deterioration ---
  { scenarioId: 'pulmonary-embolism-deterioration', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-diagnosis', objectiveIds: ['classify-acute-pe-severity'] },
  { scenarioId: 'pulmonary-embolism-deterioration', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-diagnostic-studies', objectiveIds: ['classify-acute-pe-severity'] },
  { scenarioId: 'pulmonary-embolism-deterioration', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-pharmacotherapy', objectiveIds: ['support-and-anticoagulate-acute-pe'] },
  { scenarioId: 'pulmonary-embolism-deterioration', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['support-and-anticoagulate-acute-pe'] },
  { scenarioId: 'pulmonary-embolism-deterioration', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-reassessment-and-disposition', objectiveIds: ['recognize-pe-deterioration'] },
  { scenarioId: 'pulmonary-embolism-deterioration', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-focused-history-and-physical', objectiveIds: ['recognize-pe-deterioration'] },
  { scenarioId: 'pulmonary-embolism-deterioration', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-system-navigation', objectiveIds: ['escalate-deteriorating-pe'] },
  { scenarioId: 'pulmonary-embolism-deterioration', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['escalate-deteriorating-pe'] },
  // --- stemi ---
  { scenarioId: 'stemi', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-diagnosis', objectiveIds: ['recognize-stemi-pattern'] },
  { scenarioId: 'stemi', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-diagnostic-studies', objectiveIds: ['recognize-stemi-pattern'] },
  { scenarioId: 'stemi', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-system-navigation', objectiveIds: ['activate-stemi-reperfusion'] },
  { scenarioId: 'stemi', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-treatment-and-clinical-reasoning', objectiveIds: ['activate-stemi-reperfusion'] },
  { scenarioId: 'stemi', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-pharmacotherapy', objectiveIds: ['record-stemi-antithrombotic-intent'] },
  { scenarioId: 'stemi', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-reassessment-and-disposition', objectiveIds: ['reassess-and-handoff-stemi'] },
  { scenarioId: 'stemi', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['reassess-and-handoff-stemi'] },
  // --- unstable-narrow-complex-tachycardia ---
  { scenarioId: 'unstable-narrow-complex-tachycardia', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-diagnosis', objectiveIds: ['recognize-unstable-narrow-tachycardia'] },
  { scenarioId: 'unstable-narrow-complex-tachycardia', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-diagnostic-studies', objectiveIds: ['recognize-unstable-narrow-tachycardia'] },
  { scenarioId: 'unstable-narrow-complex-tachycardia', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-emergency-stabilization', objectiveIds: ['prepare-unstable-tachycardia-response'] },
  { scenarioId: 'unstable-narrow-complex-tachycardia', frameworkId: FRAMEWORK_ID, domainId: 'pc-8-general-approach-to-procedures', objectiveIds: ['prepare-unstable-tachycardia-response', 'cardiovert-unstable-narrow-tachycardia'] },
  { scenarioId: 'unstable-narrow-complex-tachycardia', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['prepare-unstable-tachycardia-response'] },
  { scenarioId: 'unstable-narrow-complex-tachycardia', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-pharmacotherapy', objectiveIds: ['cardiovert-unstable-narrow-tachycardia'] },
  { scenarioId: 'unstable-narrow-complex-tachycardia', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-reassessment-and-disposition', objectiveIds: ['reassess-after-tachycardia-cardioversion'] },
  // --- unstable-bradycardia ---
  { scenarioId: 'unstable-bradycardia', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-diagnosis', objectiveIds: ['recognize-unstable-bradycardia'] },
  { scenarioId: 'unstable-bradycardia', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-diagnostic-studies', objectiveIds: ['recognize-unstable-bradycardia'] },
  { scenarioId: 'unstable-bradycardia', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-emergency-stabilization', objectiveIds: ['support-unstable-bradycardia'] },
  { scenarioId: 'unstable-bradycardia', frameworkId: FRAMEWORK_ID, domainId: 'pc-7-multitasking', objectiveIds: ['support-unstable-bradycardia'] },
  { scenarioId: 'unstable-bradycardia', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-pharmacotherapy', objectiveIds: ['give-atropine-for-unstable-bradycardia'] },
  { scenarioId: 'unstable-bradycardia', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-reassessment-and-disposition', objectiveIds: ['reassess-unstable-bradycardia'] },
  { scenarioId: 'unstable-bradycardia', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-system-navigation', objectiveIds: ['reassess-unstable-bradycardia'] },
  // --- persistent-vf-arrest ---
  { scenarioId: 'persistent-vf-arrest', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-emergency-stabilization', objectiveIds: ['resume-arrest-compressions'] },
  { scenarioId: 'persistent-vf-arrest', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-pharmacotherapy', objectiveIds: ['give-arrest-epinephrine'] },
  { scenarioId: 'persistent-vf-arrest', frameworkId: FRAMEWORK_ID, domainId: 'pc-8-general-approach-to-procedures', objectiveIds: ['defibrillate-persistent-vf'] },
  { scenarioId: 'persistent-vf-arrest', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['avoid-shocking-nonshockable-rhythm'] },
  { scenarioId: 'persistent-vf-arrest', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-treatment-and-clinical-reasoning', objectiveIds: ['avoid-shocking-nonshockable-rhythm'] },
  // --- pea-arrest ---
  { scenarioId: 'pea-arrest', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-emergency-stabilization', objectiveIds: ['resume-arrest-compressions'] },
  { scenarioId: 'pea-arrest', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-pharmacotherapy', objectiveIds: ['give-arrest-epinephrine'] },
  { scenarioId: 'pea-arrest', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['avoid-shocking-nonshockable-rhythm'] },
  { scenarioId: 'pea-arrest', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-treatment-and-clinical-reasoning', objectiveIds: ['avoid-shocking-nonshockable-rhythm'] },
  // --- status-epilepticus ---
  { scenarioId: 'status-epilepticus', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-diagnosis', objectiveIds: ['recognize-convulsive-status-epilepticus'] },
  { scenarioId: 'status-epilepticus', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-emergency-stabilization', objectiveIds: ['stabilize-convulsive-status-epilepticus'] },
  { scenarioId: 'status-epilepticus', frameworkId: FRAMEWORK_ID, domainId: 'pc-7-multitasking', objectiveIds: ['stabilize-convulsive-status-epilepticus'] },
  { scenarioId: 'status-epilepticus', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-pharmacotherapy', objectiveIds: ['give-first-line-status-benzodiazepine'] },
  { scenarioId: 'status-epilepticus', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-reassessment-and-disposition', objectiveIds: ['reassess-status-after-benzodiazepine'] },
  { scenarioId: 'status-epilepticus', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-system-navigation', objectiveIds: ['reassess-status-after-benzodiazepine'] },
  // --- acute-ischemic-stroke ---
  { scenarioId: 'acute-ischemic-stroke', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-diagnosis', objectiveIds: ['recognize-and-activate-acute-stroke'] },
  { scenarioId: 'acute-ischemic-stroke', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-system-navigation', objectiveIds: ['recognize-and-activate-acute-stroke', 'activate-stroke-thrombectomy-pathway'] },
  { scenarioId: 'acute-ischemic-stroke', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-diagnostic-studies', objectiveIds: ['review-stroke-imaging-and-eligibility'] },
  { scenarioId: 'acute-ischemic-stroke', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-treatment-and-clinical-reasoning', objectiveIds: ['review-stroke-imaging-and-eligibility'] },
  { scenarioId: 'acute-ischemic-stroke', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-pharmacotherapy', objectiveIds: ['record-stroke-thrombolysis-intent'] },
  { scenarioId: 'acute-ischemic-stroke', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-stroke-thrombectomy-pathway'] },
  { scenarioId: 'acute-ischemic-stroke', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-reassessment-and-disposition', objectiveIds: ['reassess-and-handoff-acute-stroke'] },
  { scenarioId: 'acute-ischemic-stroke', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['reassess-and-handoff-acute-stroke'] },
  // --- intracranial-hemorrhage-deterioration ---
  { scenarioId: 'intracranial-hemorrhage-deterioration', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-emergency-stabilization', objectiveIds: ['recognize-and-stabilize-deteriorating-ich'] },
  { scenarioId: 'intracranial-hemorrhage-deterioration', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-diagnosis', objectiveIds: ['recognize-and-stabilize-deteriorating-ich'] },
  { scenarioId: 'intracranial-hemorrhage-deterioration', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-diagnostic-studies', objectiveIds: ['review-ich-imaging-and-coagulopathy'] },
  { scenarioId: 'intracranial-hemorrhage-deterioration', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-pharmacotherapy', objectiveIds: ['record-urgent-warfarin-reversal-intent', 'record-smooth-ich-pressure-control'] },
  { scenarioId: 'intracranial-hemorrhage-deterioration', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-treatment-and-clinical-reasoning', objectiveIds: ['record-urgent-warfarin-reversal-intent'] },
  { scenarioId: 'intracranial-hemorrhage-deterioration', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['record-smooth-ich-pressure-control'] },
  { scenarioId: 'intracranial-hemorrhage-deterioration', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-system-navigation', objectiveIds: ['escalate-and-handoff-deteriorating-ich'] },
  { scenarioId: 'intracranial-hemorrhage-deterioration', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['escalate-and-handoff-deteriorating-ich'] },
  // --- diabetic-ketoacidosis ---
  { scenarioId: 'diabetic-ketoacidosis', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-diagnosis', objectiveIds: ['recognize-moderate-dka'] },
  { scenarioId: 'diabetic-ketoacidosis', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-diagnostic-studies', objectiveIds: ['recognize-moderate-dka', 'confirm-dka-resolution-and-transition'] },
  { scenarioId: 'diabetic-ketoacidosis', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-emergency-stabilization', objectiveIds: ['begin-dka-fluid-and-monitoring-path'] },
  { scenarioId: 'diabetic-ketoacidosis', frameworkId: FRAMEWORK_ID, domainId: 'pc-7-multitasking', objectiveIds: ['begin-dka-fluid-and-monitoring-path'] },
  { scenarioId: 'diabetic-ketoacidosis', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['correct-dka-potassium-before-insulin'] },
  { scenarioId: 'diabetic-ketoacidosis', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-scientific-knowledge', objectiveIds: ['correct-dka-potassium-before-insulin'] },
  { scenarioId: 'diabetic-ketoacidosis', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-pharmacotherapy', objectiveIds: ['continue-insulin-with-dextrose-until-dka-resolves'] },
  { scenarioId: 'diabetic-ketoacidosis', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-treatment-and-clinical-reasoning', objectiveIds: ['continue-insulin-with-dextrose-until-dka-resolves'] },
  { scenarioId: 'diabetic-ketoacidosis', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-reassessment-and-disposition', objectiveIds: ['confirm-dka-resolution-and-transition'] },
  // --- hyperkalemia-with-ecg-change ---
  { scenarioId: 'hyperkalemia-with-ecg-change', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-diagnosis', objectiveIds: ['recognize-severe-hyperkalemia-toxicity'] },
  { scenarioId: 'hyperkalemia-with-ecg-change', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-diagnostic-studies', objectiveIds: ['recognize-severe-hyperkalemia-toxicity', 'reassess-hyperkalemia-and-rebound'] },
  { scenarioId: 'hyperkalemia-with-ecg-change', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-pharmacotherapy', objectiveIds: ['protect-heart-in-hyperkalemia', 'shift-potassium-and-protect-glucose'] },
  { scenarioId: 'hyperkalemia-with-ecg-change', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-emergency-stabilization', objectiveIds: ['protect-heart-in-hyperkalemia'] },
  { scenarioId: 'hyperkalemia-with-ecg-change', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['shift-potassium-and-protect-glucose'] },
  { scenarioId: 'hyperkalemia-with-ecg-change', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-system-navigation', objectiveIds: ['remove-potassium-and-control-cause'] },
  { scenarioId: 'hyperkalemia-with-ecg-change', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-treatment-and-clinical-reasoning', objectiveIds: ['remove-potassium-and-control-cause'] },
  { scenarioId: 'hyperkalemia-with-ecg-change', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-reassessment-and-disposition', objectiveIds: ['reassess-hyperkalemia-and-rebound'] },
  // --- severe-hyponatremia-with-seizure ---
  { scenarioId: 'severe-hyponatremia-with-seizure', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-diagnosis', objectiveIds: ['recognize-severe-symptomatic-hyponatremia'] },
  { scenarioId: 'severe-hyponatremia-with-seizure', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-diagnostic-studies', objectiveIds: ['recognize-severe-symptomatic-hyponatremia', 'reassess-early-sodium-and-neurologic-response'] },
  { scenarioId: 'severe-hyponatremia-with-seizure', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-emergency-stabilization', objectiveIds: ['stabilize-severe-hyponatremia'] },
  { scenarioId: 'severe-hyponatremia-with-seizure', frameworkId: FRAMEWORK_ID, domainId: 'pc-7-multitasking', objectiveIds: ['stabilize-severe-hyponatremia'] },
  { scenarioId: 'severe-hyponatremia-with-seizure', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-pharmacotherapy', objectiveIds: ['record-hypertonic-saline-intent'] },
  { scenarioId: 'severe-hyponatremia-with-seizure', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-reassessment-and-disposition', objectiveIds: ['reassess-early-sodium-and-neurologic-response'] },
  { scenarioId: 'severe-hyponatremia-with-seizure', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['prevent-hyponatremia-overcorrection'] },
  { scenarioId: 'severe-hyponatremia-with-seizure', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-scientific-knowledge', objectiveIds: ['prevent-hyponatremia-overcorrection'] },
  // --- opioid-toxicity ---
  { scenarioId: 'opioid-toxicity', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-diagnosis', objectiveIds: ['recognize-opioid-respiratory-emergency'] },
  { scenarioId: 'opioid-toxicity', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-focused-history-and-physical', objectiveIds: ['recognize-opioid-respiratory-emergency'] },
  { scenarioId: 'opioid-toxicity', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-emergency-stabilization', objectiveIds: ['ventilate-opioid-toxicity-first'] },
  { scenarioId: 'opioid-toxicity', frameworkId: FRAMEWORK_ID, domainId: 'pc-7-multitasking', objectiveIds: ['ventilate-opioid-toxicity-first'] },
  { scenarioId: 'opioid-toxicity', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-pharmacotherapy', objectiveIds: ['record-opioid-antagonist-intent'] },
  { scenarioId: 'opioid-toxicity', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-treatment-and-clinical-reasoning', objectiveIds: ['record-opioid-antagonist-intent'] },
  { scenarioId: 'opioid-toxicity', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-reassessment-and-disposition', objectiveIds: ['reassess-opioid-breathing-response', 'manage-recurrent-opioid-depression'] },
  { scenarioId: 'opioid-toxicity', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-diagnostic-studies', objectiveIds: ['reassess-opioid-breathing-response'] },
  { scenarioId: 'opioid-toxicity', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-system-navigation', objectiveIds: ['manage-recurrent-opioid-depression'] },
  // --- exertional-heat-stroke ---
  { scenarioId: 'exertional-heat-stroke', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-diagnosis', objectiveIds: ['recognize-exertional-heat-stroke'] },
  { scenarioId: 'exertional-heat-stroke', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-focused-history-and-physical', objectiveIds: ['recognize-exertional-heat-stroke'] },
  { scenarioId: 'exertional-heat-stroke', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-emergency-stabilization', objectiveIds: ['stabilize-and-prepare-heat-stroke-cooling'] },
  { scenarioId: 'exertional-heat-stroke', frameworkId: FRAMEWORK_ID, domainId: 'pc-7-multitasking', objectiveIds: ['stabilize-and-prepare-heat-stroke-cooling'] },
  { scenarioId: 'exertional-heat-stroke', frameworkId: FRAMEWORK_ID, domainId: 'pc-8-general-approach-to-procedures', objectiveIds: ['cool-exertional-heat-stroke-rapidly'] },
  { scenarioId: 'exertional-heat-stroke', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-system-navigation', objectiveIds: ['cool-exertional-heat-stroke-rapidly'] },
  { scenarioId: 'exertional-heat-stroke', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['stop-heat-stroke-cooling-at-target'] },
  { scenarioId: 'exertional-heat-stroke', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-diagnostic-studies', objectiveIds: ['stop-heat-stroke-cooling-at-target', 'monitor-heat-stroke-organ-injury'] },
  { scenarioId: 'exertional-heat-stroke', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-reassessment-and-disposition', objectiveIds: ['monitor-heat-stroke-organ-injury'] },
  // --- trauma-primary-survey ---
  { scenarioId: 'trauma-primary-survey', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-system-navigation', objectiveIds: ['activate-structured-trauma-response', 'manage-trauma-circulation'] },
  { scenarioId: 'trauma-primary-survey', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-structured-trauma-response'] },
  { scenarioId: 'trauma-primary-survey', frameworkId: FRAMEWORK_ID, domainId: 'pc-8-general-approach-to-procedures', objectiveIds: ['control-catastrophic-trauma-hemorrhage'] },
  { scenarioId: 'trauma-primary-survey', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-emergency-stabilization', objectiveIds: ['control-catastrophic-trauma-hemorrhage', 'assess-trauma-airway-and-breathing', 'manage-trauma-circulation'] },
  { scenarioId: 'trauma-primary-survey', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-focused-history-and-physical', objectiveIds: ['assess-trauma-airway-and-breathing'] },
  { scenarioId: 'trauma-primary-survey', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-pharmacotherapy', objectiveIds: ['manage-trauma-circulation'] },
  { scenarioId: 'trauma-primary-survey', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-reassessment-and-disposition', objectiveIds: ['complete-and-repeat-trauma-survey'] },
  { scenarioId: 'trauma-primary-survey', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['complete-and-repeat-trauma-survey'] },
  // --- acute-aortic-syndrome ---
  { scenarioId: 'acute-aortic-syndrome', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-diagnosis', objectiveIds: ['assess-aortic-presentation-without-closure'] },
  { scenarioId: 'acute-aortic-syndrome', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-focused-history-and-physical', objectiveIds: ['assess-aortic-presentation-without-closure', 'detect-evolving-aortic-asymmetry'] },
  { scenarioId: 'acute-aortic-syndrome', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-reassessment-and-disposition', objectiveIds: ['detect-evolving-aortic-asymmetry'] },
  { scenarioId: 'acute-aortic-syndrome', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-system-navigation', objectiveIds: ['escalate-suspected-aortic-syndrome'] },
  { scenarioId: 'acute-aortic-syndrome', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['escalate-suspected-aortic-syndrome'] },
  { scenarioId: 'acute-aortic-syndrome', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-pharmacotherapy', objectiveIds: ['record-aortic-anti-impulse-intent'] },
  { scenarioId: 'acute-aortic-syndrome', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-treatment-and-clinical-reasoning', objectiveIds: ['record-aortic-anti-impulse-intent'] },
  { scenarioId: 'acute-aortic-syndrome', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-diagnostic-studies', objectiveIds: ['image-and-hand-off-aortic-uncertainty'] },
  { scenarioId: 'acute-aortic-syndrome', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['image-and-hand-off-aortic-uncertainty'] },
];
