/**
 * The endocrine and metabolic lessons mapped to the ACGME's Internal Medicine
 * Milestones (framework-mapping-expansion → scenario mappings).
 *
 * This module is the one that names its objectives both ways. Two lessons -
 * the DKA transition and the hyperosmolar one - lead every objective with a
 * verb, the way emergency medicine does. The other ten name each objective
 * after its role in the lesson, the way renal and electrolyte does:
 * `thyroid-sequence`, `avp-water-control`, `refeeding-electrolytes`. Both
 * shapes are placed here, and an id matching neither fails the build rather
 * than being guessed at.
 *
 * - Joining a supplied account with the current state → history with clinical
 *   reasoning; naming the pattern without closing on one value → reasoning with
 *   knowledge of diagnostic testing.
 * - Bringing the endocrine, nursing, pharmacy and monitoring owners together →
 *   system navigation and team communication, with inpatient management.
 * - Treatment given now - a steroid before the test, a calcitonin bridge, an
 *   iodine sequence, verified insulin during fasting, ventilation support →
 *   inpatient management with therapeutic knowledge.
 * - Coordinating what happens next - a nutrition plan, continuity of
 *   replacement, a revised surgical plan → system navigation with inpatient
 *   management.
 * - Looking again, and refusing to read improved alertness or elapsed time as
 *   recovery → examination and testing with patient safety. Every lesson in
 *   this module has such an objective, which is the module's whole argument.
 * - Handing on → communication within health care systems with navigation.
 *
 * Eleven of the twenty-one are mapped by nothing, each with its reason below
 * and pinned in both directions by
 * `tests/unit/endocrine-metabolic-curriculum.test.ts`.
 */

import { ACGME_INTERNAL_MEDICINE_MILESTONES } from '@platform/curriculum/acgme-internal-medicine';
import type { FrameworkRecord } from '@platform/curriculum/framework-records';
import type { ScenarioMapping } from '@platform/curriculum/mapping';

const FRAMEWORK_ID = ACGME_INTERNAL_MEDICINE_MILESTONES.id;

/** The readings this module's lessons are mapped against. */
export const ENDOCRINE_METABOLIC_FRAMEWORKS: readonly FrameworkRecord[] = [
  ACGME_INTERNAL_MEDICINE_MILESTONES,
];

/** Subcompetencies no lesson in this module exercises, and why. */
export const ENDOCRINE_METABOLIC_UNCOVERED: Readonly<Record<string, string>> = {
  'pc-5-outpatient-management': 'All twelve lessons are declared ward lessons.',
  'pc-6-digital-health': 'No lesson is a telehealth encounter or uses a patient-facing digital tool.',
  'mk-1-applied-foundational-sciences': 'The endocrine physiology is in every lesson and in no objective: what the objectives measure is what a result shows and what the treatment did.',
  'sbp-3-physician-role-in-health-care-systems': 'No lesson models cost, access, or what a health system makes available.',
  'pbli-1-evidence-based-practice': 'Lessons cite the evidence behind their own steps, but none asks the learner to locate or appraise it.',
  'pbli-2-reflective-practice': 'Reflection happens in the debrief, which is not part of any lesson\'s objectives.',
  'prof-1-professional-behavior': 'Conduct toward the patient and the team is modelled as communication rather than tested as behaviour.',
  'prof-2-ethical-principles': 'No lesson puts a duty to the patient in conflict with anything.',
  'prof-3-accountability': 'Recording what was done is how every lesson works, which makes it the medium rather than a thing measured.',
  'prof-4-knowledge-of-well-being-factors': 'Nothing here models well-being, the learner\'s or anybody else\'s.',
  'ics-1-patient-and-family-communication': 'The DKA lesson hands off education and follow-up, but no objective measures a conversation with the patient.',
};

export const ENDOCRINE_METABOLIC_SCENARIO_MAPPINGS: readonly ScenarioMapping[] = [
  // --- dka-resolution-transition ---
  { scenarioId: 'dka-resolution-transition', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-dka-resolution-endocrine-nursing-pharmacy-electrolyte-nutrition-and-transition-support', 'handoff-dka-recurrence-insulin-potassium-nutrition-precipitant-education-follow-up-and-outcome-risk'] },
  { scenarioId: 'dka-resolution-transition', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-dka-resolution-endocrine-nursing-pharmacy-electrolyte-nutrition-and-transition-support'] },
  { scenarioId: 'dka-resolution-transition', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['activate-dka-resolution-endocrine-nursing-pharmacy-electrolyte-nutrition-and-transition-support'] },
  { scenarioId: 'dka-resolution-transition', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-dka-resolution-initial-triad-treatment-clock-current-ketone-acid-base-potassium-glucose-and-whole-person'] },
  { scenarioId: 'dka-resolution-transition', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-dka-resolution-initial-triad-treatment-clock-current-ketone-acid-base-potassium-glucose-and-whole-person', 'recognize-persistent-dka-despite-lower-glucose-and-closed-anion-gap', 'review-qualified-dka-insulin-dextrose-potassium-monitoring-resolution-and-bridged-transition-boundaries'] },
  { scenarioId: 'dka-resolution-transition', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['recognize-persistent-dka-despite-lower-glucose-and-closed-anion-gap', 'review-dka-resolution-fixed-four-hour-qualified-report'] },
  { scenarioId: 'dka-resolution-transition', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['review-qualified-dka-insulin-dextrose-potassium-monitoring-resolution-and-bridged-transition-boundaries'] },
  { scenarioId: 'dka-resolution-transition', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['review-dka-resolution-fixed-four-hour-qualified-report'] },
  { scenarioId: 'dka-resolution-transition', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-dka-recurrence-insulin-potassium-nutrition-precipitant-education-follow-up-and-outcome-risk'] },
  // --- hhs-osmolality-trajectory ---
  { scenarioId: 'hhs-osmolality-trajectory', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-hhs-endocrine-resuscitation-nursing-renal-cardiac-and-monitoring-support', 'handoff-hhs-osmolality-cognition-fluid-electrolyte-precipitant-and-outcome-risk'] },
  { scenarioId: 'hhs-osmolality-trajectory', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-hhs-endocrine-resuscitation-nursing-renal-cardiac-and-monitoring-support'] },
  { scenarioId: 'hhs-osmolality-trajectory', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['activate-hhs-endocrine-resuscitation-nursing-renal-cardiac-and-monitoring-support'] },
  { scenarioId: 'hhs-osmolality-trajectory', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-hhs-glucose-sodium-osmolality-ketone-perfusion-cognition-and-whole-person'] },
  { scenarioId: 'hhs-osmolality-trajectory', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-hhs-glucose-sodium-osmolality-ketone-perfusion-cognition-and-whole-person', 'recognize-hhs-hyperosmolality-without-glucose-sodium-or-ketone-only-closure', 'review-qualified-hhs-cautious-correction-osmolality-potassium-monitoring-and-harm-prevention'] },
  { scenarioId: 'hhs-osmolality-trajectory', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['recognize-hhs-hyperosmolality-without-glucose-sodium-or-ketone-only-closure', 'review-hhs-fixed-four-hour-qualified-report'] },
  { scenarioId: 'hhs-osmolality-trajectory', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['review-qualified-hhs-cautious-correction-osmolality-potassium-monitoring-and-harm-prevention'] },
  { scenarioId: 'hhs-osmolality-trajectory', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['review-hhs-fixed-four-hour-qualified-report'] },
  { scenarioId: 'hhs-osmolality-trajectory', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-hhs-osmolality-cognition-fluid-electrolyte-precipitant-and-outcome-risk'] },
  // --- severe-hypoglycemia-recurrence ---
  { scenarioId: 'severe-hypoglycemia-recurrence', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['hypoglycemia-recognize', 'hypoglycemia-recurrence'] },
  { scenarioId: 'severe-hypoglycemia-recurrence', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['hypoglycemia-recognize', 'hypoglycemia-reassess', 'hypoglycemia-recurrence'] },
  { scenarioId: 'severe-hypoglycemia-recurrence', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['hypoglycemia-safe-rescue'] },
  { scenarioId: 'severe-hypoglycemia-recurrence', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['hypoglycemia-safe-rescue'] },
  { scenarioId: 'severe-hypoglycemia-recurrence', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['hypoglycemia-reassess'] },
  { scenarioId: 'severe-hypoglycemia-recurrence', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['hypoglycemia-reassess'] },
  { scenarioId: 'severe-hypoglycemia-recurrence', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['hypoglycemia-handoff'] },
  { scenarioId: 'severe-hypoglycemia-recurrence', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['hypoglycemia-handoff'] },
  // --- adrenal-crisis-treatment-before-tests ---
  { scenarioId: 'adrenal-crisis-treatment-before-tests', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['adrenal-urgent-steroid', 'adrenal-combined-rescue', 'adrenal-continuity'] },
  { scenarioId: 'adrenal-crisis-treatment-before-tests', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['adrenal-urgent-steroid', 'adrenal-combined-rescue'] },
  { scenarioId: 'adrenal-crisis-treatment-before-tests', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['adrenal-reassessment'] },
  { scenarioId: 'adrenal-crisis-treatment-before-tests', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['adrenal-reassessment'] },
  { scenarioId: 'adrenal-crisis-treatment-before-tests', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['adrenal-reassessment'] },
  { scenarioId: 'adrenal-crisis-treatment-before-tests', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['adrenal-continuity'] },
  // --- thyroid-storm-hemodynamic-risk ---
  { scenarioId: 'thyroid-storm-hemodynamic-risk', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['thyroid-urgent-treatment', 'thyroid-circulation', 'thyroid-sequence'] },
  { scenarioId: 'thyroid-storm-hemodynamic-risk', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['thyroid-urgent-treatment', 'thyroid-sequence'] },
  { scenarioId: 'thyroid-storm-hemodynamic-risk', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['thyroid-circulation', 'thyroid-reassessment'] },
  { scenarioId: 'thyroid-storm-hemodynamic-risk', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['thyroid-reassessment'] },
  { scenarioId: 'thyroid-storm-hemodynamic-risk', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['thyroid-reassessment'] },
  { scenarioId: 'thyroid-storm-hemodynamic-risk', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['thyroid-handoff'] },
  { scenarioId: 'thyroid-storm-hemodynamic-risk', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['thyroid-handoff'] },
  // --- myxedema-coma-ventilation-and-steroid-sequence ---
  { scenarioId: 'myxedema-coma-ventilation-and-steroid-sequence', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['myxedema-ventilation', 'myxedema-steroid-sequence', 'myxedema-parallel-care'] },
  { scenarioId: 'myxedema-coma-ventilation-and-steroid-sequence', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['myxedema-ventilation', 'myxedema-steroid-sequence'] },
  { scenarioId: 'myxedema-coma-ventilation-and-steroid-sequence', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['myxedema-parallel-care', 'myxedema-handoff'] },
  { scenarioId: 'myxedema-coma-ventilation-and-steroid-sequence', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['myxedema-reassessment'] },
  { scenarioId: 'myxedema-coma-ventilation-and-steroid-sequence', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['myxedema-reassessment'] },
  { scenarioId: 'myxedema-coma-ventilation-and-steroid-sequence', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['myxedema-reassessment'] },
  { scenarioId: 'myxedema-coma-ventilation-and-steroid-sequence', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['myxedema-handoff'] },
  // --- hypercalcemic-crisis-volume-and-bridge ---
  { scenarioId: 'hypercalcemic-crisis-volume-and-bridge', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['hypercalcemia-volume', 'hypercalcemia-bridge'] },
  { scenarioId: 'hypercalcemic-crisis-volume-and-bridge', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['hypercalcemia-volume', 'hypercalcemia-bridge'] },
  { scenarioId: 'hypercalcemic-crisis-volume-and-bridge', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['hypercalcemia-renal'] },
  { scenarioId: 'hypercalcemic-crisis-volume-and-bridge', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['hypercalcemia-renal', 'hypercalcemia-reassessment'] },
  { scenarioId: 'hypercalcemic-crisis-volume-and-bridge', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['hypercalcemia-reassessment'] },
  { scenarioId: 'hypercalcemic-crisis-volume-and-bridge', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['hypercalcemia-reassessment'] },
  { scenarioId: 'hypercalcemic-crisis-volume-and-bridge', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['hypercalcemia-handoff'] },
  { scenarioId: 'hypercalcemic-crisis-volume-and-bridge', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['hypercalcemia-handoff'] },
  // --- hypocalcemic-tetany-rescue-and-recurrence ---
  { scenarioId: 'hypocalcemic-tetany-rescue-and-recurrence', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['hypocalcemia-rescue'] },
  { scenarioId: 'hypocalcemic-tetany-rescue-and-recurrence', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['hypocalcemia-rescue'] },
  { scenarioId: 'hypocalcemic-tetany-rescue-and-recurrence', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['hypocalcemia-risk', 'hypocalcemia-cause'] },
  { scenarioId: 'hypocalcemic-tetany-rescue-and-recurrence', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['hypocalcemia-risk', 'hypocalcemia-cause', 'hypocalcemia-reassessment'] },
  { scenarioId: 'hypocalcemic-tetany-rescue-and-recurrence', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['hypocalcemia-reassessment'] },
  { scenarioId: 'hypocalcemic-tetany-rescue-and-recurrence', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['hypocalcemia-reassessment'] },
  { scenarioId: 'hypocalcemic-tetany-rescue-and-recurrence', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['hypocalcemia-handoff'] },
  { scenarioId: 'hypocalcemic-tetany-rescue-and-recurrence', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['hypocalcemia-handoff'] },
  // --- hyponatremia-aquaresis-and-overcorrection ---
  { scenarioId: 'hyponatremia-aquaresis-and-overcorrection', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['sodium-correction-risk'] },
  { scenarioId: 'hyponatremia-aquaresis-and-overcorrection', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['sodium-correction-risk', 'sodium-correction-surveillance', 'sodium-correction-reassessment'] },
  { scenarioId: 'hyponatremia-aquaresis-and-overcorrection', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['sodium-correction-surveillance', 'sodium-correction-reassessment'] },
  { scenarioId: 'hyponatremia-aquaresis-and-overcorrection', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['sodium-correction-response'] },
  { scenarioId: 'hyponatremia-aquaresis-and-overcorrection', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['sodium-correction-response'] },
  { scenarioId: 'hyponatremia-aquaresis-and-overcorrection', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['sodium-correction-reassessment'] },
  { scenarioId: 'hyponatremia-aquaresis-and-overcorrection', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['sodium-correction-handoff'] },
  { scenarioId: 'hyponatremia-aquaresis-and-overcorrection', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['sodium-correction-handoff'] },
  // --- hypernatremic-dehydration-avp-deficiency ---
  { scenarioId: 'hypernatremic-dehydration-avp-deficiency', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['avp-context'] },
  { scenarioId: 'hypernatremic-dehydration-avp-deficiency', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['avp-context', 'avp-reassessment'] },
  { scenarioId: 'hypernatremic-dehydration-avp-deficiency', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['avp-circulation', 'avp-reassessment'] },
  { scenarioId: 'hypernatremic-dehydration-avp-deficiency', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['avp-circulation', 'avp-water-control'] },
  { scenarioId: 'hypernatremic-dehydration-avp-deficiency', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['avp-water-control'] },
  { scenarioId: 'hypernatremic-dehydration-avp-deficiency', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['avp-reassessment'] },
  { scenarioId: 'hypernatremic-dehydration-avp-deficiency', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['avp-handoff'] },
  { scenarioId: 'hypernatremic-dehydration-avp-deficiency', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['avp-handoff'] },
  // --- refeeding-electrolyte-shift ---
  { scenarioId: 'refeeding-electrolyte-shift', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['refeeding-context'] },
  { scenarioId: 'refeeding-electrolyte-shift', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['refeeding-context', 'refeeding-reassessment'] },
  { scenarioId: 'refeeding-electrolyte-shift', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['refeeding-electrolytes', 'refeeding-nutrition'] },
  { scenarioId: 'refeeding-electrolyte-shift', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['refeeding-electrolytes'] },
  { scenarioId: 'refeeding-electrolyte-shift', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['refeeding-nutrition', 'refeeding-handoff'] },
  { scenarioId: 'refeeding-electrolyte-shift', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['refeeding-reassessment'] },
  { scenarioId: 'refeeding-electrolyte-shift', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['refeeding-reassessment'] },
  { scenarioId: 'refeeding-electrolyte-shift', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['refeeding-handoff'] },
  // --- perioperative-diabetes-insulin-continuity ---
  { scenarioId: 'perioperative-diabetes-insulin-continuity', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['perioperative-diabetes-context'] },
  { scenarioId: 'perioperative-diabetes-insulin-continuity', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['perioperative-diabetes-context', 'perioperative-diabetes-reassessment'] },
  { scenarioId: 'perioperative-diabetes-insulin-continuity', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['perioperative-diabetes-insulin', 'perioperative-diabetes-plan'] },
  { scenarioId: 'perioperative-diabetes-insulin-continuity', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['perioperative-diabetes-insulin'] },
  { scenarioId: 'perioperative-diabetes-insulin-continuity', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['perioperative-diabetes-plan', 'perioperative-diabetes-handoff'] },
  { scenarioId: 'perioperative-diabetes-insulin-continuity', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['perioperative-diabetes-reassessment'] },
  { scenarioId: 'perioperative-diabetes-insulin-continuity', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['perioperative-diabetes-reassessment'] },
  { scenarioId: 'perioperative-diabetes-insulin-continuity', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['perioperative-diabetes-handoff'] },
];
