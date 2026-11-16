/**
 * The neonatology lessons mapped to the ACGME's Neonatal-Perinatal Medicine
 * Milestones (framework-mapping-expansion → scenario mappings).
 *
 * This module maps to the neonatal subspecialty reading rather than to the
 * paediatrics one, because a programme assessing neonatal fellows uses that
 * document and the paediatrics milestones have no emergency stabilization of a
 * newborn in them. All eleven lessons are declared `delivery-room`.
 *
 * The convention follows this module's authored shape, which is the most
 * uniform in the catalogue - every lesson activates, reconciles, recognises,
 * reviews a boundary, reviews a fixed later report, and hands over:
 *
 * - Activating the prepared team and starting the clock → emergency
 *   stabilization with coordination of care and team communication.
 * - Joining the pregnancy, the birth and the clock with what the newborn shows
 *   → neonatal and maternal history with physical examination. The history of a
 *   newborn is partly the mother's, which is why this reading keeps them in one
 *   subcompetency and why these objectives sit there.
 * - Naming what is happening without closing on a cause, a calculator or an
 *   outcome → clinical reasoning with neonatal-perinatal knowledge.
 * - Reviewing what a qualified team may and may not do → disease management
 *   with organization and prioritization, plus procedures where the objective
 *   names one (positive-pressure ventilation, compressions, selective airway
 *   clearing, CPAP) and diagnostic evaluation where it names a culture, a
 *   glucose or a confirmation.
 * - The fixed later report → physical examination with patient safety.
 * - Handing over → transitions in care with communication within health care
 *   systems.
 * - Any objective whose own words carry the dyad, the parents or the family →
 *   family-centred communication.
 *
 * COMPLEX COMMUNICATION AROUND SERIOUS NEWS IS NOT CLAIMED, and it is the one
 * absence here worth reading twice. This reading makes it a separate
 * subcompetency from family-centred communication, and these lessons keep the
 * parents present, informed and in the plan without ever asking the learner to
 * tell them something that changes everything. Claiming it because a handoff
 * mentions outcome risk would be the easy error.
 *
 * Eleven of the twenty-six are mapped by nothing, each with its reason below
 * and pinned in both directions by `tests/unit/neonatology-curriculum.test.ts`.
 */

import { ACGME_NEONATAL_PERINATAL_MILESTONES } from '@platform/curriculum/acgme-neonatal-perinatal';
import type { FrameworkRecord } from '@platform/curriculum/framework-records';
import type { ScenarioMapping } from '@platform/curriculum/mapping';

const FRAMEWORK_ID = ACGME_NEONATAL_PERINATAL_MILESTONES.id;

/** The readings this module's lessons are mapped against. */
export const NEONATOLOGY_FRAMEWORKS: readonly FrameworkRecord[] = [
  ACGME_NEONATAL_PERINATAL_MILESTONES,
];

/** Subcompetencies no lesson in this module exercises, and why. */
export const NEONATOLOGY_UNCOVERED: Readonly<Record<string, string>> = {
  'pc-8-discharge-from-the-nicu': 'Every lesson is a delivery-room lesson; the furthest any of them reaches is a handoff to the unit.',
  'sbp-2-quality-improvement': 'Quality improvement is measured over cases; every lesson here is one birth.',
  'sbp-5-population-and-community-health': 'Nothing here models a population.',
  'sbp-6-physician-role-in-health-care-systems': 'No lesson models cost, access, or what a health system makes available.',
  'pbli-1-evidence-based-practice': 'Lessons cite the evidence behind their own steps, but none asks the learner to locate or appraise it.',
  'pbli-2-reflective-practice': 'Reflection happens in the debrief, which is not part of any lesson\'s objectives.',
  'prof-1-professional-behavior': 'Conduct toward the parents and the team is modelled as communication rather than tested as behaviour.',
  'prof-2-ethical-principles': 'The newborn and the family are never in conflict in these lessons.',
  'prof-3-accountability': 'Recording what was done is how every lesson works, which makes it the medium rather than a thing measured.',
  'prof-4-well-being': 'Nothing here models the learner\'s own state.',
  'ics-4-complex-communication-around-serious-news': 'These lessons keep the parents present, informed and in the plan, but none asks the learner to tell them something that changes everything. This reading makes that a separate subcompetency, and claiming it because a handoff mentions outcome risk would overstate what the lessons do.',
};

export const NEONATOLOGY_SCENARIO_MAPPINGS: readonly ScenarioMapping[] = [
  // --- term-newborn-transition ---
  { scenarioId: 'term-newborn-transition', frameworkId: FRAMEWORK_ID, domainId: 'pc-7-emergency-stabilization', objectiveIds: ['activate-term-newborn-transition-prepared-newborn-and-dyad-support'] },
  { scenarioId: 'term-newborn-transition', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-coordination-of-care', objectiveIds: ['activate-term-newborn-transition-prepared-newborn-and-dyad-support'] },
  { scenarioId: 'term-newborn-transition', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-term-newborn-transition-prepared-newborn-and-dyad-support'] },
  { scenarioId: 'term-newborn-transition', frameworkId: FRAMEWORK_ID, domainId: 'ics-1-family-centered-communication', objectiveIds: ['activate-term-newborn-transition-prepared-newborn-and-dyad-support', 'reconcile-term-newborn-transition-gestation-birth-breathing-tone-heart-rate-temperature-and-whole-dyad', 'handoff-term-newborn-transition-breathing-temperature-feeding-parent-and-outcome-risk'] },
  { scenarioId: 'term-newborn-transition', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-neonatal-and-maternal-history', objectiveIds: ['reconcile-term-newborn-transition-gestation-birth-breathing-tone-heart-rate-temperature-and-whole-dyad'] },
  { scenarioId: 'term-newborn-transition', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-exam', objectiveIds: ['reconcile-term-newborn-transition-gestation-birth-breathing-tone-heart-rate-temperature-and-whole-dyad', 'review-term-newborn-transition-fixed-one-hour-qualified-report'] },
  { scenarioId: 'term-newborn-transition', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-clinical-reasoning', objectiveIds: ['recognize-term-newborn-transition-without-resuscitation-or-well-newborn-closure'] },
  { scenarioId: 'term-newborn-transition', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-neonatal-perinatal-knowledge', objectiveIds: ['recognize-term-newborn-transition-without-resuscitation-or-well-newborn-closure'] },
  { scenarioId: 'term-newborn-transition', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-disease-management', objectiveIds: ['review-term-newborn-transition-qualified-cord-skin-to-skin-thermal-and-observation-care'] },
  { scenarioId: 'term-newborn-transition', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-organization-and-prioritization', objectiveIds: ['review-term-newborn-transition-qualified-cord-skin-to-skin-thermal-and-observation-care'] },
  { scenarioId: 'term-newborn-transition', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-term-newborn-transition-fixed-one-hour-qualified-report'] },
  { scenarioId: 'term-newborn-transition', frameworkId: FRAMEWORK_ID, domainId: 'sbp-4-transitions-in-care', objectiveIds: ['handoff-term-newborn-transition-breathing-temperature-feeding-parent-and-outcome-risk'] },
  { scenarioId: 'term-newborn-transition', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-term-newborn-transition-breathing-temperature-feeding-parent-and-outcome-risk'] },
  // --- neonatal-apnea ---
  { scenarioId: 'neonatal-apnea', frameworkId: FRAMEWORK_ID, domainId: 'pc-7-emergency-stabilization', objectiveIds: ['activate-neonatal-apnea-qualified-newborn-airway-clock-and-dyad-support'] },
  { scenarioId: 'neonatal-apnea', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-coordination-of-care', objectiveIds: ['activate-neonatal-apnea-qualified-newborn-airway-clock-and-dyad-support'] },
  { scenarioId: 'neonatal-apnea', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-neonatal-apnea-qualified-newborn-airway-clock-and-dyad-support'] },
  { scenarioId: 'neonatal-apnea', frameworkId: FRAMEWORK_ID, domainId: 'ics-1-family-centered-communication', objectiveIds: ['activate-neonatal-apnea-qualified-newborn-airway-clock-and-dyad-support', 'reconcile-neonatal-apnea-gestation-birth-clock-breathing-heart-rate-tone-temperature-and-whole-dyad', 'handoff-neonatal-apnea-respiratory-thermal-glucose-neurologic-parent-and-outcome-risk'] },
  { scenarioId: 'neonatal-apnea', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-neonatal-and-maternal-history', objectiveIds: ['reconcile-neonatal-apnea-gestation-birth-clock-breathing-heart-rate-tone-temperature-and-whole-dyad'] },
  { scenarioId: 'neonatal-apnea', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-exam', objectiveIds: ['reconcile-neonatal-apnea-gestation-birth-clock-breathing-heart-rate-tone-temperature-and-whole-dyad', 'review-neonatal-apnea-fixed-ninety-second-qualified-response-report'] },
  { scenarioId: 'neonatal-apnea', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-clinical-reasoning', objectiveIds: ['recognize-neonatal-apnea-ventilation-threshold-without-cause-or-outcome-closure'] },
  { scenarioId: 'neonatal-apnea', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-neonatal-perinatal-knowledge', objectiveIds: ['recognize-neonatal-apnea-ventilation-threshold-without-cause-or-outcome-closure'] },
  { scenarioId: 'neonatal-apnea', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-disease-management', objectiveIds: ['review-neonatal-apnea-qualified-effective-ventilation-heart-rate-and-escalation-readiness'] },
  { scenarioId: 'neonatal-apnea', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-organization-and-prioritization', objectiveIds: ['review-neonatal-apnea-qualified-effective-ventilation-heart-rate-and-escalation-readiness'] },
  { scenarioId: 'neonatal-apnea', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-procedures', objectiveIds: ['review-neonatal-apnea-qualified-effective-ventilation-heart-rate-and-escalation-readiness'] },
  { scenarioId: 'neonatal-apnea', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-neonatal-apnea-fixed-ninety-second-qualified-response-report'] },
  { scenarioId: 'neonatal-apnea', frameworkId: FRAMEWORK_ID, domainId: 'sbp-4-transitions-in-care', objectiveIds: ['handoff-neonatal-apnea-respiratory-thermal-glucose-neurologic-parent-and-outcome-risk'] },
  { scenarioId: 'neonatal-apnea', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-neonatal-apnea-respiratory-thermal-glucose-neurologic-parent-and-outcome-risk'] },
  // --- ineffective-ventilation-correction ---
  { scenarioId: 'ineffective-ventilation-correction', frameworkId: FRAMEWORK_ID, domainId: 'pc-7-emergency-stabilization', objectiveIds: ['activate-ineffective-neonatal-ventilation-qualified-airway-ventilation-clock-and-dyad-response'] },
  { scenarioId: 'ineffective-ventilation-correction', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-coordination-of-care', objectiveIds: ['activate-ineffective-neonatal-ventilation-qualified-airway-ventilation-clock-and-dyad-response'] },
  { scenarioId: 'ineffective-ventilation-correction', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-ineffective-neonatal-ventilation-qualified-airway-ventilation-clock-and-dyad-response'] },
  { scenarioId: 'ineffective-ventilation-correction', frameworkId: FRAMEWORK_ID, domainId: 'ics-1-family-centered-communication', objectiveIds: ['activate-ineffective-neonatal-ventilation-qualified-airway-ventilation-clock-and-dyad-response', 'reconcile-ineffective-neonatal-ventilation-birth-clock-interface-chest-movement-heart-rate-and-whole-dyad', 'handoff-ineffective-neonatal-ventilation-airway-respiratory-neurologic-parent-and-outcome-risk'] },
  { scenarioId: 'ineffective-ventilation-correction', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-neonatal-and-maternal-history', objectiveIds: ['reconcile-ineffective-neonatal-ventilation-birth-clock-interface-chest-movement-heart-rate-and-whole-dyad'] },
  { scenarioId: 'ineffective-ventilation-correction', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-exam', objectiveIds: ['reconcile-ineffective-neonatal-ventilation-birth-clock-interface-chest-movement-heart-rate-and-whole-dyad', 'review-ineffective-neonatal-ventilation-fixed-two-minute-qualified-response-report'] },
  { scenarioId: 'ineffective-ventilation-correction', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-clinical-reasoning', objectiveIds: ['recognize-ineffective-neonatal-ventilation-from-absent-heart-rate-rise-without-cause-closure'] },
  { scenarioId: 'ineffective-ventilation-correction', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-neonatal-perinatal-knowledge', objectiveIds: ['recognize-ineffective-neonatal-ventilation-from-absent-heart-rate-rise-without-cause-closure'] },
  { scenarioId: 'ineffective-ventilation-correction', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-disease-management', objectiveIds: ['review-qualified-neonatal-ventilation-correction-alternative-airway-and-compression-boundary'] },
  { scenarioId: 'ineffective-ventilation-correction', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-organization-and-prioritization', objectiveIds: ['review-qualified-neonatal-ventilation-correction-alternative-airway-and-compression-boundary'] },
  { scenarioId: 'ineffective-ventilation-correction', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-procedures', objectiveIds: ['review-qualified-neonatal-ventilation-correction-alternative-airway-and-compression-boundary'] },
  { scenarioId: 'ineffective-ventilation-correction', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-ineffective-neonatal-ventilation-fixed-two-minute-qualified-response-report'] },
  { scenarioId: 'ineffective-ventilation-correction', frameworkId: FRAMEWORK_ID, domainId: 'sbp-4-transitions-in-care', objectiveIds: ['handoff-ineffective-neonatal-ventilation-airway-respiratory-neurologic-parent-and-outcome-risk'] },
  { scenarioId: 'ineffective-ventilation-correction', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-ineffective-neonatal-ventilation-airway-respiratory-neurologic-parent-and-outcome-risk'] },
  // --- neonatal-bradycardia ---
  { scenarioId: 'neonatal-bradycardia', frameworkId: FRAMEWORK_ID, domainId: 'pc-7-emergency-stabilization', objectiveIds: ['activate-neonatal-bradycardia-qualified-compression-ventilation-clock-and-dyad-response'] },
  { scenarioId: 'neonatal-bradycardia', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-coordination-of-care', objectiveIds: ['activate-neonatal-bradycardia-qualified-compression-ventilation-clock-and-dyad-response'] },
  { scenarioId: 'neonatal-bradycardia', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-neonatal-bradycardia-qualified-compression-ventilation-clock-and-dyad-response'] },
  { scenarioId: 'neonatal-bradycardia', frameworkId: FRAMEWORK_ID, domainId: 'ics-1-family-centered-communication', objectiveIds: ['activate-neonatal-bradycardia-qualified-compression-ventilation-clock-and-dyad-response', 'reconcile-neonatal-bradycardia-adequate-ventilation-heart-rate-airway-oxygenation-and-whole-dyad', 'handoff-neonatal-bradycardia-respiratory-circulatory-neurologic-parent-and-outcome-risk'] },
  { scenarioId: 'neonatal-bradycardia', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-neonatal-and-maternal-history', objectiveIds: ['reconcile-neonatal-bradycardia-adequate-ventilation-heart-rate-airway-oxygenation-and-whole-dyad'] },
  { scenarioId: 'neonatal-bradycardia', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-exam', objectiveIds: ['reconcile-neonatal-bradycardia-adequate-ventilation-heart-rate-airway-oxygenation-and-whole-dyad', 'review-neonatal-bradycardia-fixed-three-minute-qualified-response-report'] },
  { scenarioId: 'neonatal-bradycardia', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-clinical-reasoning', objectiveIds: ['recognize-neonatal-bradycardia-compression-threshold-after-adequate-ventilation'] },
  { scenarioId: 'neonatal-bradycardia', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-neonatal-perinatal-knowledge', objectiveIds: ['recognize-neonatal-bradycardia-compression-threshold-after-adequate-ventilation'] },
  { scenarioId: 'neonatal-bradycardia', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-disease-management', objectiveIds: ['review-qualified-neonatal-compression-ventilation-coordination-and-epinephrine-boundary'] },
  { scenarioId: 'neonatal-bradycardia', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-organization-and-prioritization', objectiveIds: ['review-qualified-neonatal-compression-ventilation-coordination-and-epinephrine-boundary'] },
  { scenarioId: 'neonatal-bradycardia', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-procedures', objectiveIds: ['review-qualified-neonatal-compression-ventilation-coordination-and-epinephrine-boundary'] },
  { scenarioId: 'neonatal-bradycardia', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-neonatal-bradycardia-fixed-three-minute-qualified-response-report'] },
  { scenarioId: 'neonatal-bradycardia', frameworkId: FRAMEWORK_ID, domainId: 'sbp-4-transitions-in-care', objectiveIds: ['handoff-neonatal-bradycardia-respiratory-circulatory-neurologic-parent-and-outcome-risk'] },
  { scenarioId: 'neonatal-bradycardia', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-neonatal-bradycardia-respiratory-circulatory-neurologic-parent-and-outcome-risk'] },
  // --- meconium-stained-transition ---
  { scenarioId: 'meconium-stained-transition', frameworkId: FRAMEWORK_ID, domainId: 'pc-7-emergency-stabilization', objectiveIds: ['activate-meconium-stained-transition-prepared-newborn-airway-and-dyad-support'] },
  { scenarioId: 'meconium-stained-transition', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-coordination-of-care', objectiveIds: ['activate-meconium-stained-transition-prepared-newborn-airway-and-dyad-support'] },
  { scenarioId: 'meconium-stained-transition', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-meconium-stained-transition-prepared-newborn-airway-and-dyad-support'] },
  { scenarioId: 'meconium-stained-transition', frameworkId: FRAMEWORK_ID, domainId: 'ics-1-family-centered-communication', objectiveIds: ['activate-meconium-stained-transition-prepared-newborn-airway-and-dyad-support', 'reconcile-meconium-stained-transition-fluid-breathing-tone-heart-rate-airway-and-whole-dyad', 'handoff-meconium-stained-transition-respiratory-thermal-feeding-parent-and-outcome-risk'] },
  { scenarioId: 'meconium-stained-transition', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-neonatal-and-maternal-history', objectiveIds: ['reconcile-meconium-stained-transition-fluid-breathing-tone-heart-rate-airway-and-whole-dyad'] },
  { scenarioId: 'meconium-stained-transition', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-exam', objectiveIds: ['reconcile-meconium-stained-transition-fluid-breathing-tone-heart-rate-airway-and-whole-dyad', 'review-meconium-stained-transition-fixed-thirty-minute-qualified-report'] },
  { scenarioId: 'meconium-stained-transition', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-clinical-reasoning', objectiveIds: ['recognize-vigorous-meconium-stained-transition-without-routine-suction'] },
  { scenarioId: 'meconium-stained-transition', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-neonatal-perinatal-knowledge', objectiveIds: ['recognize-vigorous-meconium-stained-transition-without-routine-suction'] },
  { scenarioId: 'meconium-stained-transition', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-disease-management', objectiveIds: ['review-qualified-selective-airway-clearing-observation-and-escalation-boundaries'] },
  { scenarioId: 'meconium-stained-transition', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-organization-and-prioritization', objectiveIds: ['review-qualified-selective-airway-clearing-observation-and-escalation-boundaries'] },
  { scenarioId: 'meconium-stained-transition', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-procedures', objectiveIds: ['review-qualified-selective-airway-clearing-observation-and-escalation-boundaries'] },
  { scenarioId: 'meconium-stained-transition', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-meconium-stained-transition-fixed-thirty-minute-qualified-report'] },
  { scenarioId: 'meconium-stained-transition', frameworkId: FRAMEWORK_ID, domainId: 'sbp-4-transitions-in-care', objectiveIds: ['handoff-meconium-stained-transition-respiratory-thermal-feeding-parent-and-outcome-risk'] },
  { scenarioId: 'meconium-stained-transition', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-meconium-stained-transition-respiratory-thermal-feeding-parent-and-outcome-risk'] },
  // --- preterm-respiratory-distress ---
  { scenarioId: 'preterm-respiratory-distress', frameworkId: FRAMEWORK_ID, domainId: 'pc-7-emergency-stabilization', objectiveIds: ['activate-preterm-respiratory-distress-newborn-respiratory-thermal-and-family-support'] },
  { scenarioId: 'preterm-respiratory-distress', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-coordination-of-care', objectiveIds: ['activate-preterm-respiratory-distress-newborn-respiratory-thermal-and-family-support'] },
  { scenarioId: 'preterm-respiratory-distress', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-preterm-respiratory-distress-newborn-respiratory-thermal-and-family-support'] },
  { scenarioId: 'preterm-respiratory-distress', frameworkId: FRAMEWORK_ID, domainId: 'ics-1-family-centered-communication', objectiveIds: ['activate-preterm-respiratory-distress-newborn-respiratory-thermal-and-family-support', 'reconcile-preterm-respiratory-distress-gestation-breathing-work-heart-rate-oxygenation-temperature-and-whole-dyad', 'handoff-preterm-respiratory-distress-breathing-oxygen-thermal-glucose-infection-family-and-outcome-risk'] },
  { scenarioId: 'preterm-respiratory-distress', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-neonatal-and-maternal-history', objectiveIds: ['reconcile-preterm-respiratory-distress-gestation-breathing-work-heart-rate-oxygenation-temperature-and-whole-dyad'] },
  { scenarioId: 'preterm-respiratory-distress', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-exam', objectiveIds: ['reconcile-preterm-respiratory-distress-gestation-breathing-work-heart-rate-oxygenation-temperature-and-whole-dyad', 'review-preterm-respiratory-distress-fixed-ten-minute-qualified-report'] },
  { scenarioId: 'preterm-respiratory-distress', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-clinical-reasoning', objectiveIds: ['recognize-spontaneously-breathing-preterm-respiratory-distress-suitable-for-qualified-initial-cpap'] },
  { scenarioId: 'preterm-respiratory-distress', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-neonatal-perinatal-knowledge', objectiveIds: ['recognize-spontaneously-breathing-preterm-respiratory-distress-suitable-for-qualified-initial-cpap'] },
  { scenarioId: 'preterm-respiratory-distress', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-disease-management', objectiveIds: ['review-qualified-cpap-oxygen-thermal-monitoring-and-escalation-boundaries'] },
  { scenarioId: 'preterm-respiratory-distress', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-organization-and-prioritization', objectiveIds: ['review-qualified-cpap-oxygen-thermal-monitoring-and-escalation-boundaries'] },
  { scenarioId: 'preterm-respiratory-distress', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-procedures', objectiveIds: ['review-qualified-cpap-oxygen-thermal-monitoring-and-escalation-boundaries'] },
  { scenarioId: 'preterm-respiratory-distress', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-preterm-respiratory-distress-fixed-ten-minute-qualified-report'] },
  { scenarioId: 'preterm-respiratory-distress', frameworkId: FRAMEWORK_ID, domainId: 'sbp-4-transitions-in-care', objectiveIds: ['handoff-preterm-respiratory-distress-breathing-oxygen-thermal-glucose-infection-family-and-outcome-risk'] },
  { scenarioId: 'preterm-respiratory-distress', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-preterm-respiratory-distress-breathing-oxygen-thermal-glucose-infection-family-and-outcome-risk'] },
  // --- neonatal-hypoglycemia ---
  { scenarioId: 'neonatal-hypoglycemia', frameworkId: FRAMEWORK_ID, domainId: 'pc-7-emergency-stabilization', objectiveIds: ['activate-neonatal-hypoglycemia-newborn-glucose-feeding-neurologic-and-family-support'] },
  { scenarioId: 'neonatal-hypoglycemia', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-coordination-of-care', objectiveIds: ['activate-neonatal-hypoglycemia-newborn-glucose-feeding-neurologic-and-family-support'] },
  { scenarioId: 'neonatal-hypoglycemia', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-neonatal-hypoglycemia-newborn-glucose-feeding-neurologic-and-family-support'] },
  { scenarioId: 'neonatal-hypoglycemia', frameworkId: FRAMEWORK_ID, domainId: 'ics-1-family-centered-communication', objectiveIds: ['activate-neonatal-hypoglycemia-newborn-glucose-feeding-neurologic-and-family-support', 'reconcile-neonatal-hypoglycemia-risk-clock-signs-glucose-temperature-feeding-and-whole-dyad', 'handoff-neonatal-hypoglycemia-recurrence-neurologic-feeding-thermal-cause-family-and-outcome-risk'] },
  { scenarioId: 'neonatal-hypoglycemia', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-neonatal-and-maternal-history', objectiveIds: ['reconcile-neonatal-hypoglycemia-risk-clock-signs-glucose-temperature-feeding-and-whole-dyad'] },
  { scenarioId: 'neonatal-hypoglycemia', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-exam', objectiveIds: ['reconcile-neonatal-hypoglycemia-risk-clock-signs-glucose-temperature-feeding-and-whole-dyad', 'review-neonatal-hypoglycemia-fixed-thirty-minute-qualified-report'] },
  { scenarioId: 'neonatal-hypoglycemia', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-clinical-reasoning', objectiveIds: ['recognize-symptomatic-low-neonatal-glucose-requiring-qualified-immediate-escalation-without-universal-threshold-closure'] },
  { scenarioId: 'neonatal-hypoglycemia', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-neonatal-perinatal-knowledge', objectiveIds: ['recognize-symptomatic-low-neonatal-glucose-requiring-qualified-immediate-escalation-without-universal-threshold-closure'] },
  { scenarioId: 'neonatal-hypoglycemia', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-disease-management', objectiveIds: ['review-qualified-neonatal-hypoglycemia-local-protocol-treatment-confirmation-and-cause-boundaries'] },
  { scenarioId: 'neonatal-hypoglycemia', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-organization-and-prioritization', objectiveIds: ['review-qualified-neonatal-hypoglycemia-local-protocol-treatment-confirmation-and-cause-boundaries'] },
  { scenarioId: 'neonatal-hypoglycemia', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-diagnostic-evaluation', objectiveIds: ['review-qualified-neonatal-hypoglycemia-local-protocol-treatment-confirmation-and-cause-boundaries'] },
  { scenarioId: 'neonatal-hypoglycemia', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-neonatal-hypoglycemia-fixed-thirty-minute-qualified-report'] },
  { scenarioId: 'neonatal-hypoglycemia', frameworkId: FRAMEWORK_ID, domainId: 'sbp-4-transitions-in-care', objectiveIds: ['handoff-neonatal-hypoglycemia-recurrence-neurologic-feeding-thermal-cause-family-and-outcome-risk'] },
  { scenarioId: 'neonatal-hypoglycemia', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-neonatal-hypoglycemia-recurrence-neurologic-feeding-thermal-cause-family-and-outcome-risk'] },
  // --- neonatal-sepsis ---
  { scenarioId: 'neonatal-sepsis', frameworkId: FRAMEWORK_ID, domainId: 'pc-7-emergency-stabilization', objectiveIds: ['activate-neonatal-sepsis-newborn-infection-respiratory-circulatory-and-family-support'] },
  { scenarioId: 'neonatal-sepsis', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-coordination-of-care', objectiveIds: ['activate-neonatal-sepsis-newborn-infection-respiratory-circulatory-and-family-support'] },
  { scenarioId: 'neonatal-sepsis', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-neonatal-sepsis-newborn-infection-respiratory-circulatory-and-family-support'] },
  { scenarioId: 'neonatal-sepsis', frameworkId: FRAMEWORK_ID, domainId: 'ics-1-family-centered-communication', objectiveIds: ['activate-neonatal-sepsis-newborn-infection-respiratory-circulatory-and-family-support', 'reconcile-neonatal-sepsis-maternal-risk-clock-clinical-change-physiology-and-whole-dyad', 'handoff-neonatal-sepsis-respiratory-circulatory-neurologic-culture-family-and-outcome-risk'] },
  { scenarioId: 'neonatal-sepsis', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-neonatal-and-maternal-history', objectiveIds: ['reconcile-neonatal-sepsis-maternal-risk-clock-clinical-change-physiology-and-whole-dyad'] },
  { scenarioId: 'neonatal-sepsis', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-exam', objectiveIds: ['reconcile-neonatal-sepsis-maternal-risk-clock-clinical-change-physiology-and-whole-dyad', 'review-neonatal-sepsis-fixed-one-hour-qualified-report'] },
  { scenarioId: 'neonatal-sepsis', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-clinical-reasoning', objectiveIds: ['recognize-clinically-ill-newborn-sepsis-risk-without-calculator-laboratory-or-diagnosis-closure'] },
  { scenarioId: 'neonatal-sepsis', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-neonatal-perinatal-knowledge', objectiveIds: ['recognize-clinically-ill-newborn-sepsis-risk-without-calculator-laboratory-or-diagnosis-closure'] },
  { scenarioId: 'neonatal-sepsis', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-disease-management', objectiveIds: ['review-qualified-neonatal-sepsis-culture-antimicrobial-support-investigation-and-reassessment-boundaries'] },
  { scenarioId: 'neonatal-sepsis', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-organization-and-prioritization', objectiveIds: ['review-qualified-neonatal-sepsis-culture-antimicrobial-support-investigation-and-reassessment-boundaries'] },
  { scenarioId: 'neonatal-sepsis', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-diagnostic-evaluation', objectiveIds: ['review-qualified-neonatal-sepsis-culture-antimicrobial-support-investigation-and-reassessment-boundaries'] },
  { scenarioId: 'neonatal-sepsis', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-neonatal-sepsis-fixed-one-hour-qualified-report'] },
  { scenarioId: 'neonatal-sepsis', frameworkId: FRAMEWORK_ID, domainId: 'sbp-4-transitions-in-care', objectiveIds: ['handoff-neonatal-sepsis-respiratory-circulatory-neurologic-culture-family-and-outcome-risk'] },
  { scenarioId: 'neonatal-sepsis', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-neonatal-sepsis-respiratory-circulatory-neurologic-culture-family-and-outcome-risk'] },
  // --- thermoregulation-failure ---
  { scenarioId: 'thermoregulation-failure', frameworkId: FRAMEWORK_ID, domainId: 'pc-7-emergency-stabilization', objectiveIds: ['activate-neonatal-thermoregulation-newborn-thermal-glucose-feeding-and-family-support'] },
  { scenarioId: 'thermoregulation-failure', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-coordination-of-care', objectiveIds: ['activate-neonatal-thermoregulation-newborn-thermal-glucose-feeding-and-family-support'] },
  { scenarioId: 'thermoregulation-failure', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-neonatal-thermoregulation-newborn-thermal-glucose-feeding-and-family-support'] },
  { scenarioId: 'thermoregulation-failure', frameworkId: FRAMEWORK_ID, domainId: 'ics-1-family-centered-communication', objectiveIds: ['activate-neonatal-thermoregulation-newborn-thermal-glucose-feeding-and-family-support', 'reconcile-neonatal-thermoregulation-gestation-admission-temperature-environment-trajectory-physiology-and-whole-dyad', 'handoff-neonatal-thermoregulation-temperature-glucose-feeding-infection-neurologic-family-and-outcome-risk'] },
  { scenarioId: 'thermoregulation-failure', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-neonatal-and-maternal-history', objectiveIds: ['reconcile-neonatal-thermoregulation-gestation-admission-temperature-environment-trajectory-physiology-and-whole-dyad'] },
  { scenarioId: 'thermoregulation-failure', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-exam', objectiveIds: ['reconcile-neonatal-thermoregulation-gestation-admission-temperature-environment-trajectory-physiology-and-whole-dyad', 'review-neonatal-thermoregulation-fixed-forty-five-minute-qualified-report'] },
  { scenarioId: 'thermoregulation-failure', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-clinical-reasoning', objectiveIds: ['recognize-unintentional-neonatal-hypothermia-requiring-qualified-rewarming-without-rate-cause-or-diagnosis-closure'] },
  { scenarioId: 'thermoregulation-failure', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-neonatal-perinatal-knowledge', objectiveIds: ['recognize-unintentional-neonatal-hypothermia-requiring-qualified-rewarming-without-rate-cause-or-diagnosis-closure'] },
  { scenarioId: 'thermoregulation-failure', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-disease-management', objectiveIds: ['review-qualified-neonatal-rewarming-monitoring-glucose-feeding-cause-and-hyperthermia-prevention-boundaries'] },
  { scenarioId: 'thermoregulation-failure', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-organization-and-prioritization', objectiveIds: ['review-qualified-neonatal-rewarming-monitoring-glucose-feeding-cause-and-hyperthermia-prevention-boundaries'] },
  { scenarioId: 'thermoregulation-failure', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-diagnostic-evaluation', objectiveIds: ['review-qualified-neonatal-rewarming-monitoring-glucose-feeding-cause-and-hyperthermia-prevention-boundaries'] },
  { scenarioId: 'thermoregulation-failure', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-neonatal-thermoregulation-fixed-forty-five-minute-qualified-report'] },
  { scenarioId: 'thermoregulation-failure', frameworkId: FRAMEWORK_ID, domainId: 'sbp-4-transitions-in-care', objectiveIds: ['handoff-neonatal-thermoregulation-temperature-glucose-feeding-infection-neurologic-family-and-outcome-risk'] },
  { scenarioId: 'thermoregulation-failure', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-neonatal-thermoregulation-temperature-glucose-feeding-infection-neurologic-family-and-outcome-risk'] },
  // --- delivery-room-to-nicu-handoff ---
  { scenarioId: 'delivery-room-to-nicu-handoff', frameworkId: FRAMEWORK_ID, domainId: 'pc-7-emergency-stabilization', objectiveIds: ['activate-delivery-room-nicu-sending-receiving-transport-and-family-handoff-support'] },
  { scenarioId: 'delivery-room-to-nicu-handoff', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-coordination-of-care', objectiveIds: ['activate-delivery-room-nicu-sending-receiving-transport-and-family-handoff-support'] },
  { scenarioId: 'delivery-room-to-nicu-handoff', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-delivery-room-nicu-sending-receiving-transport-and-family-handoff-support'] },
  { scenarioId: 'delivery-room-to-nicu-handoff', frameworkId: FRAMEWORK_ID, domainId: 'ics-1-family-centered-communication', objectiveIds: ['activate-delivery-room-nicu-sending-receiving-transport-and-family-handoff-support', 'reconcile-delivery-room-nicu-gestation-perinatal-birth-resuscitation-current-state-parent-and-whole-dyad', 'review-qualified-delivery-room-nicu-transport-continuity-receiving-readiness-check-back-and-family-boundaries', 'handoff-delivery-room-nicu-respiratory-thermal-glucose-neurologic-infection-feeding-family-and-outcome-risk'] },
  { scenarioId: 'delivery-room-to-nicu-handoff', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-neonatal-and-maternal-history', objectiveIds: ['reconcile-delivery-room-nicu-gestation-perinatal-birth-resuscitation-current-state-parent-and-whole-dyad'] },
  { scenarioId: 'delivery-room-to-nicu-handoff', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-exam', objectiveIds: ['reconcile-delivery-room-nicu-gestation-perinatal-birth-resuscitation-current-state-parent-and-whole-dyad', 'review-delivery-room-nicu-fixed-receiver-check-back-and-ten-minute-arrival-report'] },
  { scenarioId: 'delivery-room-to-nicu-handoff', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['review-delivery-room-nicu-patient-assessment-situation-safety-background-actions-timing-ownership-and-next-step-content', 'review-qualified-delivery-room-nicu-transport-continuity-receiving-readiness-check-back-and-family-boundaries', 'handoff-delivery-room-nicu-respiratory-thermal-glucose-neurologic-infection-feeding-family-and-outcome-risk'] },
  { scenarioId: 'delivery-room-to-nicu-handoff', frameworkId: FRAMEWORK_ID, domainId: 'sbp-4-transitions-in-care', objectiveIds: ['review-delivery-room-nicu-patient-assessment-situation-safety-background-actions-timing-ownership-and-next-step-content', 'review-qualified-delivery-room-nicu-transport-continuity-receiving-readiness-check-back-and-family-boundaries', 'handoff-delivery-room-nicu-respiratory-thermal-glucose-neurologic-infection-feeding-family-and-outcome-risk'] },
  { scenarioId: 'delivery-room-to-nicu-handoff', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-delivery-room-nicu-fixed-receiver-check-back-and-ten-minute-arrival-report'] },
  // --- neonatal-tension-pneumothorax ---
  { scenarioId: 'neonatal-tension-pneumothorax', frameworkId: FRAMEWORK_ID, domainId: 'pc-7-emergency-stabilization', objectiveIds: ['activate-neonatal-tension-pneumothorax-respiratory-decompression-monitoring-and-family-support'] },
  { scenarioId: 'neonatal-tension-pneumothorax', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-coordination-of-care', objectiveIds: ['activate-neonatal-tension-pneumothorax-respiratory-decompression-monitoring-and-family-support'] },
  { scenarioId: 'neonatal-tension-pneumothorax', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-neonatal-tension-pneumothorax-respiratory-decompression-monitoring-and-family-support'] },
  { scenarioId: 'neonatal-tension-pneumothorax', frameworkId: FRAMEWORK_ID, domainId: 'ics-1-family-centered-communication', objectiveIds: ['activate-neonatal-tension-pneumothorax-respiratory-decompression-monitoring-and-family-support', 'reconcile-neonatal-tension-pneumothorax-support-clock-sudden-change-asymmetry-perfusion-and-whole-dyad', 'handoff-neonatal-tension-pneumothorax-air-leak-lung-support-circulatory-family-and-outcome-risk'] },
  { scenarioId: 'neonatal-tension-pneumothorax', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-neonatal-and-maternal-history', objectiveIds: ['reconcile-neonatal-tension-pneumothorax-support-clock-sudden-change-asymmetry-perfusion-and-whole-dyad'] },
  { scenarioId: 'neonatal-tension-pneumothorax', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-exam', objectiveIds: ['reconcile-neonatal-tension-pneumothorax-support-clock-sudden-change-asymmetry-perfusion-and-whole-dyad', 'review-neonatal-tension-pneumothorax-fixed-two-minute-qualified-report'] },
  { scenarioId: 'neonatal-tension-pneumothorax', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-clinical-reasoning', objectiveIds: ['recognize-suspected-neonatal-tension-pneumothorax-with-cardiopulmonary-compromise-without-imaging-delay'] },
  { scenarioId: 'neonatal-tension-pneumothorax', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-neonatal-perinatal-knowledge', objectiveIds: ['recognize-suspected-neonatal-tension-pneumothorax-with-cardiopulmonary-compromise-without-imaging-delay'] },
  { scenarioId: 'neonatal-tension-pneumothorax', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-disease-management', objectiveIds: ['review-qualified-neonatal-tension-pneumothorax-oxygenation-ventilation-decompression-drain-and-reassessment-boundaries'] },
  { scenarioId: 'neonatal-tension-pneumothorax', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-organization-and-prioritization', objectiveIds: ['review-qualified-neonatal-tension-pneumothorax-oxygenation-ventilation-decompression-drain-and-reassessment-boundaries'] },
  { scenarioId: 'neonatal-tension-pneumothorax', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-procedures', objectiveIds: ['review-qualified-neonatal-tension-pneumothorax-oxygenation-ventilation-decompression-drain-and-reassessment-boundaries'] },
  { scenarioId: 'neonatal-tension-pneumothorax', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-neonatal-tension-pneumothorax-fixed-two-minute-qualified-report'] },
  { scenarioId: 'neonatal-tension-pneumothorax', frameworkId: FRAMEWORK_ID, domainId: 'sbp-4-transitions-in-care', objectiveIds: ['handoff-neonatal-tension-pneumothorax-air-leak-lung-support-circulatory-family-and-outcome-risk'] },
  { scenarioId: 'neonatal-tension-pneumothorax', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['handoff-neonatal-tension-pneumothorax-air-leak-lung-support-circulatory-family-and-outcome-risk'] },
];
