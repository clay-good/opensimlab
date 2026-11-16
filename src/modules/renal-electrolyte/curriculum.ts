/**
 * The renal and electrolyte lessons mapped to the ACGME's Internal Medicine
 * Milestones (framework-mapping-expansion → scenario mappings).
 *
 * This module names its objectives after the role each plays in its lesson
 * rather than after a verb - `renal-hyperkalemia-protection`,
 * `renal-estimate-precision`, `renal-phosphate-trial` - so the convention is
 * written against those roles, and the role is the last segment of every id.
 * A role the map does not know fails the build rather than being guessed at.
 *
 * - Care directed now, through a qualified team: protection, support, rescue,
 *   volume, replacement, magnesium, removal, continuity → inpatient management
 *   with therapeutic knowledge, and system navigation where the objective is
 *   about arranging the ownership.
 * - Reading the patient rather than the number: compartment, patient →
 *   physical examination with clinical reasoning. The rhabdomyolysis lesson's
 *   compartment objective is the clearest case in the catalogue: the one
 *   time-critical thing in that lesson is not a number.
 * - What a measurement does and does not say: number, measurement, precision,
 *   variation, sampling, generation, discordance, surrogate → knowledge of
 *   diagnostic testing with clinical reasoning.
 * - Published evidence read as evidence: trial, and the contrast lesson's
 *   evidence objective, which separates what a controlled comparison shows from
 *   what a before-and-after rise shows → evidence-based and informed practice.
 *   This is the only module in the catalogue that covers that subcompetency,
 *   and it covers it because two of its lessons are about reading a study
 *   rather than reading a patient.
 * - Looking again, and refusing to call a partial recheck a current picture:
 *   reassessment, repeat, persistent → testing and examination with patient
 *   safety.
 * - Handing on → communication within health care systems, with navigation and
 *   the team.
 *
 * Eleven of the twenty-one are mapped by nothing, each with its reason below
 * and pinned in both directions by
 * `tests/unit/renal-electrolyte-curriculum.test.ts`.
 */

import { ACGME_INTERNAL_MEDICINE_MILESTONES } from '@platform/curriculum/acgme-internal-medicine';
import type { FrameworkRecord } from '@platform/curriculum/framework-records';
import type { ScenarioMapping } from '@platform/curriculum/mapping';

const FRAMEWORK_ID = ACGME_INTERNAL_MEDICINE_MILESTONES.id;

/** The readings this module's lessons are mapped against. */
export const RENAL_ELECTROLYTE_FRAMEWORKS: readonly FrameworkRecord[] = [
  ACGME_INTERNAL_MEDICINE_MILESTONES,
];

/** Subcompetencies no lesson in this module exercises, and why. */
export const RENAL_ELECTROLYTE_UNCOVERED: Readonly<Record<string, string>> = {
  'pc-1-history': 'These lessons open on a supplied record and a supplied result; none of them takes an account from the patient.',
  'pc-5-outpatient-management': 'All twelve lessons are declared ward lessons.',
  'pc-6-digital-health': 'No lesson is a telehealth encounter or uses a patient-facing digital tool.',
  'mk-1-applied-foundational-sciences': 'The physiology is in every lesson and in no objective: what the objectives measure is what a result shows and what it does not.',
  'sbp-3-physician-role-in-health-care-systems': 'No lesson models cost, access, or what a health system makes available.',
  'pbli-2-reflective-practice': 'Reflection happens in the debrief, which is not part of any lesson\'s objectives.',
  'prof-1-professional-behavior': 'Conduct toward the patient and the team is modelled as communication rather than tested as behaviour.',
  'prof-2-ethical-principles': 'No lesson puts a duty to the patient in conflict with anything.',
  'prof-3-accountability': 'Recording what was done is how every lesson works, which makes it the medium rather than a thing measured.',
  'prof-4-knowledge-of-well-being-factors': 'Nothing here models well-being, the learner\'s or anybody else\'s.',
  'ics-1-patient-and-family-communication': 'No lesson has a conversation with the patient or a family as something an objective measures.',
};

export const RENAL_ELECTROLYTE_SCENARIO_MAPPINGS: readonly ScenarioMapping[] = [
  // --- hyperkalemia-cardioprotection-and-rebound ---
  { scenarioId: 'hyperkalemia-cardioprotection-and-rebound', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['renal-hyperkalemia-protection', 'renal-hyperkalemia-removal'] },
  { scenarioId: 'hyperkalemia-cardioprotection-and-rebound', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['renal-hyperkalemia-protection', 'renal-hyperkalemia-shift', 'renal-hyperkalemia-removal'] },
  { scenarioId: 'hyperkalemia-cardioprotection-and-rebound', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['renal-hyperkalemia-shift', 'renal-hyperkalemia-reassessment'] },
  { scenarioId: 'hyperkalemia-cardioprotection-and-rebound', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['renal-hyperkalemia-removal', 'renal-hyperkalemia-handoff'] },
  { scenarioId: 'hyperkalemia-cardioprotection-and-rebound', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['renal-hyperkalemia-reassessment'] },
  { scenarioId: 'hyperkalemia-cardioprotection-and-rebound', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['renal-hyperkalemia-reassessment'] },
  { scenarioId: 'hyperkalemia-cardioprotection-and-rebound', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['renal-hyperkalemia-handoff'] },
  { scenarioId: 'hyperkalemia-cardioprotection-and-rebound', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['renal-hyperkalemia-handoff'] },
  // --- hypokalemia-magnesium-and-ongoing-losses ---
  { scenarioId: 'hypokalemia-magnesium-and-ongoing-losses', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['renal-hypokalemia-replacement', 'renal-hypokalemia-magnesium', 'renal-hypokalemia-losses'] },
  { scenarioId: 'hypokalemia-magnesium-and-ongoing-losses', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['renal-hypokalemia-replacement', 'renal-hypokalemia-magnesium'] },
  { scenarioId: 'hypokalemia-magnesium-and-ongoing-losses', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['renal-hypokalemia-replacement', 'renal-hypokalemia-handoff'] },
  { scenarioId: 'hypokalemia-magnesium-and-ongoing-losses', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['renal-hypokalemia-losses'] },
  { scenarioId: 'hypokalemia-magnesium-and-ongoing-losses', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['renal-hypokalemia-reassessment'] },
  { scenarioId: 'hypokalemia-magnesium-and-ongoing-losses', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['renal-hypokalemia-reassessment'] },
  { scenarioId: 'hypokalemia-magnesium-and-ongoing-losses', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['renal-hypokalemia-reassessment'] },
  { scenarioId: 'hypokalemia-magnesium-and-ongoing-losses', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['renal-hypokalemia-handoff'] },
  { scenarioId: 'hypokalemia-magnesium-and-ongoing-losses', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['renal-hypokalemia-handoff'] },
  // --- hyponatremia-symptoms-and-reassessment ---
  { scenarioId: 'hyponatremia-symptoms-and-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['renal-hyponatremia-rescue'] },
  { scenarioId: 'hyponatremia-symptoms-and-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['renal-hyponatremia-rescue'] },
  { scenarioId: 'hyponatremia-symptoms-and-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['renal-hyponatremia-rescue', 'renal-hyponatremia-handoff'] },
  { scenarioId: 'hyponatremia-symptoms-and-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['renal-hyponatremia-context'] },
  { scenarioId: 'hyponatremia-symptoms-and-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['renal-hyponatremia-reassessment'] },
  { scenarioId: 'hyponatremia-symptoms-and-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['renal-hyponatremia-reassessment', 'renal-hyponatremia-persistent'] },
  { scenarioId: 'hyponatremia-symptoms-and-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['renal-hyponatremia-reassessment', 'renal-hyponatremia-persistent'] },
  { scenarioId: 'hyponatremia-symptoms-and-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['renal-hyponatremia-handoff'] },
  { scenarioId: 'hyponatremia-symptoms-and-reassessment', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['renal-hyponatremia-handoff'] },
  // --- hypernatremia-water-access-and-losses ---
  { scenarioId: 'hypernatremia-water-access-and-losses', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['renal-hypernatremia-volume', 'renal-hypernatremia-replacement'] },
  { scenarioId: 'hypernatremia-water-access-and-losses', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['renal-hypernatremia-volume', 'renal-hypernatremia-replacement'] },
  { scenarioId: 'hypernatremia-water-access-and-losses', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['renal-hypernatremia-context'] },
  { scenarioId: 'hypernatremia-water-access-and-losses', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['renal-hypernatremia-replacement', 'renal-hypernatremia-handoff'] },
  { scenarioId: 'hypernatremia-water-access-and-losses', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['renal-hypernatremia-reassessment'] },
  { scenarioId: 'hypernatremia-water-access-and-losses', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['renal-hypernatremia-reassessment'] },
  { scenarioId: 'hypernatremia-water-access-and-losses', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['renal-hypernatremia-reassessment'] },
  { scenarioId: 'hypernatremia-water-access-and-losses', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['renal-hypernatremia-handoff'] },
  { scenarioId: 'hypernatremia-water-access-and-losses', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['renal-hypernatremia-handoff'] },
  // --- hypocalcemia-ionized-calcium-and-ckd ---
  { scenarioId: 'hypocalcemia-ionized-calcium-and-ckd', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['renal-hypocalcemia-rescue', 'renal-hypocalcemia-continuity'] },
  { scenarioId: 'hypocalcemia-ionized-calcium-and-ckd', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['renal-hypocalcemia-rescue'] },
  { scenarioId: 'hypocalcemia-ionized-calcium-and-ckd', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['renal-hypocalcemia-rescue', 'renal-hypocalcemia-continuity', 'renal-hypocalcemia-handoff'] },
  { scenarioId: 'hypocalcemia-ionized-calcium-and-ckd', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['renal-hypocalcemia-measurement', 'renal-hypocalcemia-reassessment'] },
  { scenarioId: 'hypocalcemia-ionized-calcium-and-ckd', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['renal-hypocalcemia-measurement'] },
  { scenarioId: 'hypocalcemia-ionized-calcium-and-ckd', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['renal-hypocalcemia-reassessment'] },
  { scenarioId: 'hypocalcemia-ionized-calcium-and-ckd', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['renal-hypocalcemia-reassessment'] },
  { scenarioId: 'hypocalcemia-ionized-calcium-and-ckd', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['renal-hypocalcemia-handoff'] },
  { scenarioId: 'hypocalcemia-ionized-calcium-and-ckd', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['renal-hypocalcemia-handoff'] },
  // --- hypermagnesemia-antagonism-and-removal ---
  { scenarioId: 'hypermagnesemia-antagonism-and-removal', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['renal-hypermagnesemia-support', 'renal-hypermagnesemia-removal'] },
  { scenarioId: 'hypermagnesemia-antagonism-and-removal', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['renal-hypermagnesemia-support', 'renal-hypermagnesemia-removal'] },
  { scenarioId: 'hypermagnesemia-antagonism-and-removal', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['renal-hypermagnesemia-context'] },
  { scenarioId: 'hypermagnesemia-antagonism-and-removal', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['renal-hypermagnesemia-removal', 'renal-hypermagnesemia-handoff'] },
  { scenarioId: 'hypermagnesemia-antagonism-and-removal', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['renal-hypermagnesemia-reassessment'] },
  { scenarioId: 'hypermagnesemia-antagonism-and-removal', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['renal-hypermagnesemia-reassessment'] },
  { scenarioId: 'hypermagnesemia-antagonism-and-removal', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['renal-hypermagnesemia-reassessment'] },
  { scenarioId: 'hypermagnesemia-antagonism-and-removal', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['renal-hypermagnesemia-handoff'] },
  { scenarioId: 'hypermagnesemia-antagonism-and-removal', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['renal-hypermagnesemia-handoff'] },
  // --- hypomagnesemia-refractory-potassium-and-the-normal-number ---
  { scenarioId: 'hypomagnesemia-refractory-potassium-and-the-normal-number', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['renal-hypomagnesemia-support'] },
  { scenarioId: 'hypomagnesemia-refractory-potassium-and-the-normal-number', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['renal-hypomagnesemia-support'] },
  { scenarioId: 'hypomagnesemia-refractory-potassium-and-the-normal-number', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['renal-hypomagnesemia-context', 'renal-hypomagnesemia-number'] },
  { scenarioId: 'hypomagnesemia-refractory-potassium-and-the-normal-number', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['renal-hypomagnesemia-number', 'renal-hypomagnesemia-reassessment'] },
  { scenarioId: 'hypomagnesemia-refractory-potassium-and-the-normal-number', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['renal-hypomagnesemia-reassessment'] },
  { scenarioId: 'hypomagnesemia-refractory-potassium-and-the-normal-number', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['renal-hypomagnesemia-reassessment'] },
  { scenarioId: 'hypomagnesemia-refractory-potassium-and-the-normal-number', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['renal-hypomagnesemia-handoff'] },
  { scenarioId: 'hypomagnesemia-refractory-potassium-and-the-normal-number', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['renal-hypomagnesemia-handoff'] },
  { scenarioId: 'hypomagnesemia-refractory-potassium-and-the-normal-number', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['renal-hypomagnesemia-handoff'] },
  // --- contrast-attribution-a-label-that-stopped-the-search ---
  { scenarioId: 'contrast-attribution-a-label-that-stopped-the-search', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['renal-contrast-attribution', 'renal-contrast-alternatives', 'renal-contrast-evidence'] },
  { scenarioId: 'contrast-attribution-a-label-that-stopped-the-search', frameworkId: FRAMEWORK_ID, domainId: 'pbli-1-evidence-based-practice', objectiveIds: ['renal-contrast-evidence'] },
  { scenarioId: 'contrast-attribution-a-label-that-stopped-the-search', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['renal-contrast-reassessment'] },
  { scenarioId: 'contrast-attribution-a-label-that-stopped-the-search', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['renal-contrast-reassessment'] },
  { scenarioId: 'contrast-attribution-a-label-that-stopped-the-search', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['renal-contrast-reassessment'] },
  { scenarioId: 'contrast-attribution-a-label-that-stopped-the-search', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['renal-contrast-handoff'] },
  { scenarioId: 'contrast-attribution-a-label-that-stopped-the-search', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['renal-contrast-handoff'] },
  { scenarioId: 'contrast-attribution-a-label-that-stopped-the-search', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['renal-contrast-handoff'] },
  // --- rhabdomyolysis-a-number-that-does-not-carry-the-risk ---
  { scenarioId: 'rhabdomyolysis-a-number-that-does-not-carry-the-risk', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['renal-rhabdomyolysis-cause', 'renal-rhabdomyolysis-compartment', 'renal-rhabdomyolysis-number'] },
  { scenarioId: 'rhabdomyolysis-a-number-that-does-not-carry-the-risk', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['renal-rhabdomyolysis-compartment'] },
  { scenarioId: 'rhabdomyolysis-a-number-that-does-not-carry-the-risk', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['renal-rhabdomyolysis-number'] },
  { scenarioId: 'rhabdomyolysis-a-number-that-does-not-carry-the-risk', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['renal-rhabdomyolysis-additions'] },
  { scenarioId: 'rhabdomyolysis-a-number-that-does-not-carry-the-risk', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['renal-rhabdomyolysis-additions'] },
  { scenarioId: 'rhabdomyolysis-a-number-that-does-not-carry-the-risk', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['renal-rhabdomyolysis-handoff'] },
  { scenarioId: 'rhabdomyolysis-a-number-that-does-not-carry-the-risk', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['renal-rhabdomyolysis-handoff'] },
  { scenarioId: 'rhabdomyolysis-a-number-that-does-not-carry-the-risk', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['renal-rhabdomyolysis-handoff'] },
  // --- estimated-filtration-a-number-she-was-never-measured-by ---
  { scenarioId: 'estimated-filtration-a-number-she-was-never-measured-by', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['renal-estimate-precision', 'renal-estimate-generation', 'renal-estimate-discordance', 'renal-estimate-reassessment'] },
  { scenarioId: 'estimated-filtration-a-number-she-was-never-measured-by', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['renal-estimate-precision', 'renal-estimate-generation', 'renal-estimate-discordance'] },
  { scenarioId: 'estimated-filtration-a-number-she-was-never-measured-by', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['renal-estimate-reassessment'] },
  { scenarioId: 'estimated-filtration-a-number-she-was-never-measured-by', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['renal-estimate-reassessment'] },
  { scenarioId: 'estimated-filtration-a-number-she-was-never-measured-by', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['renal-estimate-handoff'] },
  { scenarioId: 'estimated-filtration-a-number-she-was-never-measured-by', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['renal-estimate-handoff'] },
  { scenarioId: 'estimated-filtration-a-number-she-was-never-measured-by', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['renal-estimate-handoff'] },
  // --- phosphate-target-a-surrogate-that-moved-the-wrong-way ---
  { scenarioId: 'phosphate-target-a-surrogate-that-moved-the-wrong-way', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['renal-phosphate-surrogate', 'renal-phosphate-reassessment'] },
  { scenarioId: 'phosphate-target-a-surrogate-that-moved-the-wrong-way', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['renal-phosphate-surrogate', 'renal-phosphate-trial', 'renal-phosphate-intake'] },
  { scenarioId: 'phosphate-target-a-surrogate-that-moved-the-wrong-way', frameworkId: FRAMEWORK_ID, domainId: 'pbli-1-evidence-based-practice', objectiveIds: ['renal-phosphate-trial'] },
  { scenarioId: 'phosphate-target-a-surrogate-that-moved-the-wrong-way', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['renal-phosphate-intake'] },
  { scenarioId: 'phosphate-target-a-surrogate-that-moved-the-wrong-way', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['renal-phosphate-reassessment'] },
  { scenarioId: 'phosphate-target-a-surrogate-that-moved-the-wrong-way', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['renal-phosphate-reassessment'] },
  { scenarioId: 'phosphate-target-a-surrogate-that-moved-the-wrong-way', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['renal-phosphate-handoff'] },
  { scenarioId: 'phosphate-target-a-surrogate-that-moved-the-wrong-way', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['renal-phosphate-handoff'] },
  { scenarioId: 'phosphate-target-a-surrogate-that-moved-the-wrong-way', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['renal-phosphate-handoff'] },
  // --- proteinuria-a-ratio-that-doubled-and-a-patient-who-did-not ---
  { scenarioId: 'proteinuria-a-ratio-that-doubled-and-a-patient-who-did-not', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['renal-proteinuria-variation', 'renal-proteinuria-sampling', 'renal-proteinuria-repeat'] },
  { scenarioId: 'proteinuria-a-ratio-that-doubled-and-a-patient-who-did-not', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['renal-proteinuria-variation', 'renal-proteinuria-sampling', 'renal-proteinuria-patient'] },
  { scenarioId: 'proteinuria-a-ratio-that-doubled-and-a-patient-who-did-not', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['renal-proteinuria-patient'] },
  { scenarioId: 'proteinuria-a-ratio-that-doubled-and-a-patient-who-did-not', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['renal-proteinuria-repeat'] },
  { scenarioId: 'proteinuria-a-ratio-that-doubled-and-a-patient-who-did-not', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['renal-proteinuria-handoff'] },
  { scenarioId: 'proteinuria-a-ratio-that-doubled-and-a-patient-who-did-not', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['renal-proteinuria-handoff'] },
  { scenarioId: 'proteinuria-a-ratio-that-doubled-and-a-patient-who-did-not', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['renal-proteinuria-handoff'] },
];
