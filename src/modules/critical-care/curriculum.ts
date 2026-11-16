/**
 * The critical care lessons mapped to the ACGME's Internal Medicine Milestones
 * (framework-mapping-expansion → scenario mappings).
 *
 * The third module on the internal medicine reading, and the largest: 24
 * lessons, all declared `icu`, so management is inpatient throughout and
 * nothing claims the clinic.
 *
 * This module's objectives are the most varied in the catalogue - twenty-five
 * distinct leading verbs against cardiology's thirteen - and each addition
 * below exists because an objective would otherwise have gone unplaced:
 *
 * - `calculate-` a predicted body weight is applied physiology, not a test.
 * - `measure-` auto-PEEP is a bedside measurement: a test's knowledge and an
 *   examination at once.
 * - `validate-`, `cross-check-`, `integrate-`, `assess-` and `corroborate-`
 *   are all forms of reading the patient against a signal → examination with
 *   clinical reasoning, and system navigation where the objective also calls
 *   for help.
 * - `trace-` and `inspect-` a delivery path are reasoning over device evidence.
 * - `bridge-` is immediate management plus the call that goes with it.
 * - `limit-` and `protect-` and `stop-` are patient safety: the fluid not
 *   given, the compensation not forced, the trial stopped.
 * - `establish-`, `receive-` and `synthesize-` belong to the handoff lesson and
 *   are communication within health care systems.
 * - `analyze-` and `test-` turn on the underlying physiology.
 * - `individualize-` and `restore-` direct care.
 *
 * Ten of the twenty-one are mapped by nothing, each with its reason below and
 * pinned in both directions by `tests/unit/critical-care-curriculum.test.ts`.
 * The one that may surprise: no lesson here communicates with a patient or a
 * family. Every patient in this module is sedated, intubated or unresponsive,
 * which is a fact about intensive care rather than an oversight, and it is why
 * the only communication subcompetencies covered are the ones between
 * clinicians.
 */

import { ACGME_INTERNAL_MEDICINE_MILESTONES } from '@platform/curriculum/acgme-internal-medicine';
import type { FrameworkRecord } from '@platform/curriculum/framework-records';
import type { ScenarioMapping } from '@platform/curriculum/mapping';

const FRAMEWORK_ID = ACGME_INTERNAL_MEDICINE_MILESTONES.id;

/** The readings this module's lessons are mapped against. */
export const CRITICAL_CARE_FRAMEWORKS: readonly FrameworkRecord[] = [
  ACGME_INTERNAL_MEDICINE_MILESTONES,
];

/** Subcompetencies no lesson in this module exercises, and why. */
export const CRITICAL_CARE_UNCOVERED: Readonly<Record<string, string>> = {
  'pc-5-outpatient-management': 'All 24 lessons are declared ICU lessons.',
  'pc-6-digital-health': 'No lesson is a telehealth encounter or uses a patient-facing digital tool; the ventilator and pump displays several lessons read are bedside devices, not digital care.',
  'sbp-3-physician-role-in-health-care-systems': 'No lesson models cost, access, or what a health system makes available.',
  'pbli-1-evidence-based-practice': 'Lessons cite the evidence behind their own steps, but none asks the learner to locate or appraise it.',
  'pbli-2-reflective-practice': 'Reflection happens in the debrief, which is not part of any lesson\'s objectives.',
  'prof-1-professional-behavior': 'Conduct toward the team is modelled as communication rather than tested as behaviour.',
  'prof-2-ethical-principles': 'Several lessons refuse to claim an outcome or a prognosis, but no objective measures the ethical reasoning behind that refusal.',
  'prof-3-accountability': 'Recording what was done is how every lesson works, which makes it the medium rather than a thing measured.',
  'prof-4-knowledge-of-well-being-factors': 'Nothing here models well-being, the learner\'s or anybody else\'s.',
  'ics-1-patient-and-family-communication': 'Every patient in this module is sedated, intubated or unresponsive; no lesson has a conversation to hold with them or with a family.',
};

export const CRITICAL_CARE_SCENARIO_MAPPINGS: readonly ScenarioMapping[] = [
  // --- ards-lung-protective-ventilation (icu) ---
  { scenarioId: 'ards-lung-protective-ventilation', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['review-ards-ventilation-baseline'] },
  { scenarioId: 'ards-lung-protective-ventilation', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-applied-foundational-sciences', objectiveIds: ['calculate-ards-predicted-body-weight'] },
  { scenarioId: 'ards-lung-protective-ventilation', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['record-ards-lung-protective-settings', 'reassess-ards-gas-and-mechanics'] },
  { scenarioId: 'ards-lung-protective-ventilation', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-ards-lung-protective-settings'] },
  { scenarioId: 'ards-lung-protective-ventilation', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['reassess-ards-gas-and-mechanics'] },
  { scenarioId: 'ards-lung-protective-ventilation', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['escalate-moderate-severe-ards-support'] },
  { scenarioId: 'ards-lung-protective-ventilation', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['escalate-moderate-severe-ards-support'] },
  // --- escalating-hypoxemia (icu) ---
  { scenarioId: 'escalating-hypoxemia', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['validate-hypoxemia-signal', 'integrate-hypoxemia-bedside-pattern'] },
  { scenarioId: 'escalating-hypoxemia', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['validate-hypoxemia-signal', 'trace-oxygen-delivery-path', 'integrate-hypoxemia-bedside-pattern'] },
  { scenarioId: 'escalating-hypoxemia', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['support-hypoxemia-and-call-help'] },
  { scenarioId: 'escalating-hypoxemia', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['support-hypoxemia-and-call-help', 'escalate-and-reassess-hypoxemia'] },
  { scenarioId: 'escalating-hypoxemia', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['support-hypoxemia-and-call-help', 'escalate-and-reassess-hypoxemia'] },
  { scenarioId: 'escalating-hypoxemia', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['trace-oxygen-delivery-path'] },
  // --- ventilator-dyssynchrony (icu) ---
  { scenarioId: 'ventilator-dyssynchrony', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['review-dyssynchrony-patient-and-graphics', 'review-dyssynchrony-drivers', 'classify-dyssynchrony-pattern'] },
  { scenarioId: 'ventilator-dyssynchrony', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['record-dyssynchrony-correction-intent', 'reassess-dyssynchrony-response'] },
  { scenarioId: 'ventilator-dyssynchrony', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-dyssynchrony-correction-intent'] },
  { scenarioId: 'ventilator-dyssynchrony', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['reassess-dyssynchrony-response'] },
  // --- auto-peep (icu) ---
  { scenarioId: 'auto-peep', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['review-auto-peep-patient-and-flow', 'classify-auto-peep-pattern'] },
  { scenarioId: 'auto-peep', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['measure-auto-peep'] },
  { scenarioId: 'auto-peep', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['measure-auto-peep'] },
  { scenarioId: 'auto-peep', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['record-auto-peep-correction-intent', 'reassess-auto-peep-response'] },
  { scenarioId: 'auto-peep', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-auto-peep-correction-intent'] },
  { scenarioId: 'auto-peep', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['reassess-auto-peep-response'] },
  // --- mucus-plugging (icu) ---
  { scenarioId: 'mucus-plugging', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['support-mucus-plugging-and-call-help', 'record-indicated-airway-suction-intent', 'reassess-mucus-plugging-response'] },
  { scenarioId: 'mucus-plugging', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['support-mucus-plugging-and-call-help', 'escalate-persistent-mucus-plugging'] },
  { scenarioId: 'mucus-plugging', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['support-mucus-plugging-and-call-help', 'escalate-persistent-mucus-plugging'] },
  { scenarioId: 'mucus-plugging', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['review-mucus-plugging-indicators'] },
  { scenarioId: 'mucus-plugging', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-indicated-airway-suction-intent'] },
  { scenarioId: 'mucus-plugging', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['reassess-mucus-plugging-response'] },
  // --- unplanned-extubation (icu) ---
  { scenarioId: 'unplanned-extubation', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['support-unplanned-extubation-and-call-help', 'record-unplanned-extubation-airway-plan', 'reassess-unplanned-extubation-response'] },
  { scenarioId: 'unplanned-extubation', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['support-unplanned-extubation-and-call-help'] },
  { scenarioId: 'unplanned-extubation', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['support-unplanned-extubation-and-call-help'] },
  { scenarioId: 'unplanned-extubation', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['assess-unplanned-extubation-tolerance'] },
  { scenarioId: 'unplanned-extubation', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['assess-unplanned-extubation-tolerance', 'classify-unplanned-extubation-failure'] },
  { scenarioId: 'unplanned-extubation', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-unplanned-extubation-airway-plan'] },
  { scenarioId: 'unplanned-extubation', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['reassess-unplanned-extubation-response'] },
  // --- spontaneous-breathing-trial (icu) ---
  { scenarioId: 'spontaneous-breathing-trial', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['review-sbt-readiness', 'recognize-sbt-failure', 'plan-after-failed-sbt'] },
  { scenarioId: 'spontaneous-breathing-trial', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['start-bounded-sbt', 'stop-failed-sbt-and-recover', 'plan-after-failed-sbt'] },
  { scenarioId: 'spontaneous-breathing-trial', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['start-bounded-sbt'] },
  { scenarioId: 'spontaneous-breathing-trial', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['stop-failed-sbt-and-recover'] },
  // --- post-intubation-hypotension (icu) ---
  { scenarioId: 'post-intubation-hypotension', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['validate-post-intubation-pressure-and-call-help'] },
  { scenarioId: 'post-intubation-hypotension', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['validate-post-intubation-pressure-and-call-help', 'review-post-intubation-danger-pattern', 'classify-post-intubation-hemodynamics'] },
  { scenarioId: 'post-intubation-hypotension', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['validate-post-intubation-pressure-and-call-help'] },
  { scenarioId: 'post-intubation-hypotension', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['validate-post-intubation-pressure-and-call-help'] },
  { scenarioId: 'post-intubation-hypotension', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['record-post-intubation-support-intent', 'reassess-post-intubation-hypotension'] },
  { scenarioId: 'post-intubation-hypotension', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-post-intubation-support-intent'] },
  { scenarioId: 'post-intubation-hypotension', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['reassess-post-intubation-hypotension'] },
  // --- cardiogenic-shock (icu) ---
  { scenarioId: 'cardiogenic-shock', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['recognize-cardiogenic-shock-trajectory', 'review-cardiogenic-shock-cause-and-phenotype'] },
  { scenarioId: 'cardiogenic-shock', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-applied-foundational-sciences', objectiveIds: ['review-cardiogenic-shock-cause-and-phenotype'] },
  { scenarioId: 'cardiogenic-shock', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['record-cardiogenic-shock-bridge', 'reassess-cardiogenic-shock-trajectory'] },
  { scenarioId: 'cardiogenic-shock', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-cardiogenic-shock-bridge'] },
  { scenarioId: 'cardiogenic-shock', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['escalate-cardiogenic-shock-cause-control'] },
  { scenarioId: 'cardiogenic-shock', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['escalate-cardiogenic-shock-cause-control'] },
  { scenarioId: 'cardiogenic-shock', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['reassess-cardiogenic-shock-trajectory'] },
  // --- mixed-shock (icu) ---
  { scenarioId: 'mixed-shock', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['recognize-mixed-shock-discordance', 'classify-mixed-shock-hemodynamics', 'address-mixed-shock-causes'] },
  { scenarioId: 'mixed-shock', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['record-mixed-shock-support', 'address-mixed-shock-causes', 'reassess-mixed-shock-trajectory'] },
  { scenarioId: 'mixed-shock', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-mixed-shock-support'] },
  { scenarioId: 'mixed-shock', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['reassess-mixed-shock-trajectory'] },
  // --- right-ventricular-failure (icu) ---
  { scenarioId: 'right-ventricular-failure', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['recognize-rv-failure-trajectory', 'review-rv-failure-phenotype', 'address-rv-failure-triggers'] },
  { scenarioId: 'right-ventricular-failure', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-applied-foundational-sciences', objectiveIds: ['review-rv-failure-phenotype'] },
  { scenarioId: 'right-ventricular-failure', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['record-rv-failure-support', 'address-rv-failure-triggers', 'reassess-rv-failure-trajectory'] },
  { scenarioId: 'right-ventricular-failure', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-rv-failure-support'] },
  { scenarioId: 'right-ventricular-failure', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['reassess-rv-failure-trajectory'] },
  // --- massive-pulmonary-embolism (icu) ---
  { scenarioId: 'massive-pulmonary-embolism', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['recognize-refractory-pe-shock', 'review-refractory-pe-pattern'] },
  { scenarioId: 'massive-pulmonary-embolism', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['record-refractory-pe-support', 'reassess-pe-ecmo-trajectory'] },
  { scenarioId: 'massive-pulmonary-embolism', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-refractory-pe-support'] },
  { scenarioId: 'massive-pulmonary-embolism', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-pe-ecmo-bridge'] },
  { scenarioId: 'massive-pulmonary-embolism', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-pe-ecmo-bridge'] },
  { scenarioId: 'massive-pulmonary-embolism', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['reassess-pe-ecmo-trajectory'] },
  // --- upper-gi-hemorrhage (icu) ---
  { scenarioId: 'upper-gi-hemorrhage', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['recognize-recurrent-upper-gi-hemorrhage', 'review-upper-gi-hemorrhage-pattern'] },
  { scenarioId: 'upper-gi-hemorrhage', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['record-upper-gi-hemorrhage-resuscitation', 'reassess-upper-gi-hemorrhage-trajectory'] },
  { scenarioId: 'upper-gi-hemorrhage', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-upper-gi-hemorrhage-resuscitation'] },
  { scenarioId: 'upper-gi-hemorrhage', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-repeat-endoscopy-pathway'] },
  { scenarioId: 'upper-gi-hemorrhage', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-repeat-endoscopy-pathway'] },
  { scenarioId: 'upper-gi-hemorrhage', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['reassess-upper-gi-hemorrhage-trajectory'] },
  // --- status-epilepticus (icu) ---
  { scenarioId: 'status-epilepticus', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['recognize-refractory-status-epilepticus', 'review-refractory-status-pattern', 'address-refractory-status-causes'] },
  { scenarioId: 'status-epilepticus', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-refractory-status-pathway'] },
  { scenarioId: 'status-epilepticus', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-refractory-status-pathway'] },
  { scenarioId: 'status-epilepticus', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['address-refractory-status-causes', 'reassess-refractory-status-trajectory'] },
  { scenarioId: 'status-epilepticus', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['reassess-refractory-status-trajectory'] },
  // --- targeted-temperature-management (icu) ---
  { scenarioId: 'targeted-temperature-management', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['recognize-post-arrest-temperature-control', 'review-post-arrest-temperature-context'] },
  { scenarioId: 'targeted-temperature-management', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-applied-foundational-sciences', objectiveIds: ['review-post-arrest-temperature-context'] },
  { scenarioId: 'targeted-temperature-management', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-post-arrest-temperature-protocol'] },
  { scenarioId: 'targeted-temperature-management', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-post-arrest-temperature-protocol'] },
  { scenarioId: 'targeted-temperature-management', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['record-temperature-control-guardrails', 'reassess-post-arrest-temperature-trajectory'] },
  { scenarioId: 'targeted-temperature-management', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-temperature-control-guardrails'] },
  { scenarioId: 'targeted-temperature-management', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['reassess-post-arrest-temperature-trajectory'] },
  // --- intracranial-hypertension (icu) ---
  { scenarioId: 'intracranial-hypertension', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['recognize-intracranial-hypertension', 'review-intracranial-hypertension-context'] },
  { scenarioId: 'intracranial-hypertension', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-applied-foundational-sciences', objectiveIds: ['review-intracranial-hypertension-context'] },
  { scenarioId: 'intracranial-hypertension', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-first-tier-brain-protection', 'activate-individualized-hyperosmolar-rescue'] },
  { scenarioId: 'intracranial-hypertension', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-first-tier-brain-protection', 'activate-individualized-hyperosmolar-rescue'] },
  { scenarioId: 'intracranial-hypertension', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['reassess-intracranial-hypertension-trajectory'] },
  { scenarioId: 'intracranial-hypertension', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['reassess-intracranial-hypertension-trajectory'] },
  // --- acute-kidney-injury-with-fluid-overload (icu) ---
  { scenarioId: 'acute-kidney-injury-with-fluid-overload', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['recognize-aki-fluid-overload', 'review-aki-fluid-overload-context'] },
  { scenarioId: 'acute-kidney-injury-with-fluid-overload', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-applied-foundational-sciences', objectiveIds: ['review-aki-fluid-overload-context'] },
  { scenarioId: 'acute-kidney-injury-with-fluid-overload', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['limit-fluid-and-review-diuretic-response', 'reassess-aki-fluid-overload-trajectory'] },
  { scenarioId: 'acute-kidney-injury-with-fluid-overload', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['limit-fluid-and-review-diuretic-response'] },
  { scenarioId: 'acute-kidney-injury-with-fluid-overload', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['limit-fluid-and-review-diuretic-response', 'reassess-aki-fluid-overload-trajectory'] },
  { scenarioId: 'acute-kidney-injury-with-fluid-overload', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-individualized-kidney-support-pathway'] },
  { scenarioId: 'acute-kidney-injury-with-fluid-overload', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-individualized-kidney-support-pathway'] },
  // --- severe-acidemia (icu) ---
  { scenarioId: 'severe-acidemia', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['recognize-severe-acidemia', 'analyze-severe-acidemia-context'] },
  { scenarioId: 'severe-acidemia', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-applied-foundational-sciences', objectiveIds: ['analyze-severe-acidemia-context'] },
  { scenarioId: 'severe-acidemia', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['protect-severe-acidemia-ventilation', 'reassess-severe-acidemia-trajectory'] },
  { scenarioId: 'severe-acidemia', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['protect-severe-acidemia-ventilation', 'reassess-severe-acidemia-trajectory'] },
  { scenarioId: 'severe-acidemia', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-severe-acidemia-cause-plan'] },
  { scenarioId: 'severe-acidemia', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-severe-acidemia-cause-plan'] },
  // --- icu-handoff-with-hidden-deterioration (icu) ---
  { scenarioId: 'icu-handoff-with-hidden-deterioration', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-communication-within-health-care-systems', objectiveIds: ['establish-icu-handoff-readiness', 'receive-icu-handoff-content', 'synthesize-accept-and-reassess-icu-handoff'] },
  { scenarioId: 'icu-handoff-with-hidden-deterioration', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['establish-icu-handoff-readiness', 'receive-icu-handoff-content', 'escalate-icu-handoff-deterioration', 'synthesize-accept-and-reassess-icu-handoff'] },
  { scenarioId: 'icu-handoff-with-hidden-deterioration', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['cross-check-hidden-deterioration'] },
  { scenarioId: 'icu-handoff-with-hidden-deterioration', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['cross-check-hidden-deterioration'] },
  { scenarioId: 'icu-handoff-with-hidden-deterioration', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['escalate-icu-handoff-deterioration'] },
  // --- ventilator-circuit-disconnection (icu) ---
  { scenarioId: 'ventilator-circuit-disconnection', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['recognize-ventilator-circuit-disconnection', 'inspect-ventilator-circuit-disconnection'] },
  { scenarioId: 'ventilator-circuit-disconnection', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['bridge-ventilator-circuit-disconnection', 'restore-ventilator-circuit-support', 'reassess-ventilator-circuit-response'] },
  { scenarioId: 'ventilator-circuit-disconnection', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['bridge-ventilator-circuit-disconnection'] },
  { scenarioId: 'ventilator-circuit-disconnection', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['bridge-ventilator-circuit-disconnection'] },
  { scenarioId: 'ventilator-circuit-disconnection', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['inspect-ventilator-circuit-disconnection'] },
  { scenarioId: 'ventilator-circuit-disconnection', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['reassess-ventilator-circuit-response'] },
  // --- delayed-vasopressor-delivery (icu) ---
  { scenarioId: 'delayed-vasopressor-delivery', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['review-vasopressor-command-delivery-discordance', 'trace-vasopressor-source-to-patient-path', 'classify-vasopressor-dead-space-startup-delay'] },
  { scenarioId: 'delayed-vasopressor-delivery', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['trace-vasopressor-source-to-patient-path'] },
  { scenarioId: 'delayed-vasopressor-delivery', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['activate-vasopressor-startup-safety-plan'] },
  { scenarioId: 'delayed-vasopressor-delivery', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['activate-vasopressor-startup-safety-plan'] },
  { scenarioId: 'delayed-vasopressor-delivery', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['reassess-vasopressor-delivery-and-perfusion'] },
  { scenarioId: 'delayed-vasopressor-delivery', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['reassess-vasopressor-delivery-and-perfusion'] },
  // --- pulse-oximeter-motion-artifact (icu) ---
  { scenarioId: 'pulse-oximeter-motion-artifact', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['recognize-pulse-oximeter-discordance', 'inspect-pleth-and-pulse-rate-coherence', 'review-probe-motion-and-perfusion'] },
  { scenarioId: 'pulse-oximeter-motion-artifact', frameworkId: FRAMEWORK_ID, domainId: 'mk-3-knowledge-of-diagnostic-testing', objectiveIds: ['inspect-pleth-and-pulse-rate-coherence'] },
  { scenarioId: 'pulse-oximeter-motion-artifact', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['corroborate-oxygenation-independently'] },
  { scenarioId: 'pulse-oximeter-motion-artifact', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['corroborate-oxygenation-independently', 'reassess-pulse-oximeter-signal'] },
  { scenarioId: 'pulse-oximeter-motion-artifact', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['reassess-pulse-oximeter-signal'] },
  // --- endotracheal-tube-migration-after-repositioning (icu) ---
  { scenarioId: 'endotracheal-tube-migration-after-repositioning', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['recognize-post-repositioning-ventilation-change', 'integrate-tube-depth-and-bilateral-ventilation'] },
  { scenarioId: 'endotracheal-tube-migration-after-repositioning', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['bridge-post-repositioning-oxygenation', 'record-experienced-tube-correction-intent', 'reassess-tube-position-and-gas-exchange'] },
  { scenarioId: 'endotracheal-tube-migration-after-repositioning', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['bridge-post-repositioning-oxygenation'] },
  { scenarioId: 'endotracheal-tube-migration-after-repositioning', frameworkId: FRAMEWORK_ID, domainId: 'ics-2-interprofessional-and-team-communication', objectiveIds: ['bridge-post-repositioning-oxygenation'] },
  { scenarioId: 'endotracheal-tube-migration-after-repositioning', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-physical-examination', objectiveIds: ['integrate-tube-depth-and-bilateral-ventilation'] },
  { scenarioId: 'endotracheal-tube-migration-after-repositioning', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-therapeutic-knowledge', objectiveIds: ['record-experienced-tube-correction-intent'] },
  { scenarioId: 'endotracheal-tube-migration-after-repositioning', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['reassess-tube-position-and-gas-exchange'] },
  // --- septic-shock-resuscitation (icu) ---
  { scenarioId: 'septic-shock-resuscitation', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-septic-shock-resuscitation-so-far'] },
  { scenarioId: 'septic-shock-resuscitation', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-clinical-reasoning', objectiveIds: ['reconcile-septic-shock-resuscitation-so-far', 'test-septic-shock-fluid-responsiveness'] },
  { scenarioId: 'septic-shock-resuscitation', frameworkId: FRAMEWORK_ID, domainId: 'pc-4-inpatient-management', objectiveIds: ['reassess-septic-shock-perfusion', 'individualize-septic-shock-support-and-source-control', 'reassess-septic-shock-trajectory'] },
  { scenarioId: 'septic-shock-resuscitation', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety-and-quality-improvement', objectiveIds: ['reassess-septic-shock-perfusion', 'reassess-septic-shock-trajectory'] },
  { scenarioId: 'septic-shock-resuscitation', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-applied-foundational-sciences', objectiveIds: ['test-septic-shock-fluid-responsiveness'] },
  { scenarioId: 'septic-shock-resuscitation', frameworkId: FRAMEWORK_ID, domainId: 'sbp-2-system-navigation', objectiveIds: ['individualize-septic-shock-support-and-source-control'] },
];
