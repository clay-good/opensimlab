/**
 * The neurology lessons mapped to the ACGME's Neurology Milestones
 * (framework-mapping-expansion → scenario mappings).
 *
 * Neurology splits its subcompetencies more finely than the other two ACGME
 * readings, and the convention below uses that: a lesson that reviews imaging,
 * a lesson that reviews an EEG and a lesson that turns on a lumbar puncture do
 * not land in the same place.
 *
 * - Joining the clock, the account and the observed state → Patient Care 1 and
 *   Patient Care 2.
 * - Naming the syndrome and the boundary of what naming it claims → Patient
 *   Care 3, with Medical Knowledge 1 where the recognition turns on where the
 *   lesion is.
 * - Handing the work to a qualified service → Patient Care 5, Systems-Based
 *   Practice 3 and Interpersonal and Communication Skills 3. Every lesson here
 *   is declared a ward lesson, which is why management is inpatient and never
 *   outpatient; Patient Care 6 is added for the thirteen whose own objectives
 *   name an escalation that will not wait.
 * - Holding investigations and alternatives open in parallel → Medical
 *   Knowledge 2, plus the procedure subcompetency the objective actually names:
 *   Patient Care 8 for imaging, 9 for EEG, 11 for the tap.
 * - Looking at the patient again at the strict later report, without calling an
 *   improvement a recovery → Patient Care 2 and Systems-Based Practice 1.
 * - Handing over → Systems-Based Practice 3 and Interpersonal and
 *   Communication Skills 4.
 *
 * Three placements are specific rather than patterned, and each follows the
 * objective's own words: the meningitis handoff carries public-health
 * notification, which is Systems-Based Practice 4; the delirium lesson's
 * cognition and reversible contributors are Patient Care 12, and its family,
 * safety and capacity work is Interpersonal and Communication Skills 1 with
 * Professionalism 1; and the autonomic dysreflexia lesson's release of the
 * supplied trigger within role is Patient Care 6 with Systems-Based Practice 1,
 * because acting outside the role is the harm the objective is about.
 *
 * Nine of the twenty-seven are mapped by nothing, each with its reason below
 * and pinned in both directions by `tests/unit/neurology-curriculum.test.ts`.
 */

import { ACGME_NEUROLOGY_MILESTONES } from '@platform/curriculum/acgme-neurology';
import type { FrameworkRecord } from '@platform/curriculum/framework-records';
import type { ScenarioMapping } from '@platform/curriculum/mapping';

const FRAMEWORK_ID = ACGME_NEUROLOGY_MILESTONES.id;

/** The readings this module's lessons are mapped against. */
export const NEUROLOGY_FRAMEWORKS: readonly FrameworkRecord[] = [ACGME_NEUROLOGY_MILESTONES];

/** Subcompetencies no lesson in this module exercises, and why. */
export const NEUROLOGY_UNCOVERED: Readonly<Record<string, string>> = {
  'pc-4-outpatient-management': 'Every lesson here is declared a ward lesson; none happens in clinic or over visits.',
  'pc-7-determination-of-death': 'No lesson reaches death, and none would be a defensible place to practise determining it.',
  'pc-10-ncs-emg': 'The Guillain-Barre and myasthenia lessons stop at supplied supportive evidence; neither asks for nerve conduction or needle study findings.',
  'sbp-2-quality-improvement': 'Quality improvement is measured over cases; every lesson here is one patient on one day.',
  'pbli-1-evidence-based-practice': 'Lessons cite the evidence behind their own steps, but none asks the learner to locate or appraise it.',
  'pbli-2-reflective-practice': 'Reflection happens in the debrief, which is not part of any lesson\'s objectives.',
  'prof-2-accountability': 'Recording what was done is how every lesson works, which makes it the medium rather than a thing measured.',
  'prof-3-well-being': 'Nothing here models the learner\'s own state.',
  'ics-2-barrier-and-bias-mitigation': 'No lesson models a barrier of language, literacy or disability, or a bias to mitigate.',
};

export const NEUROLOGY_SCENARIO_MAPPINGS: readonly ScenarioMapping[] = [
  // --- minor-nondisabling-acute-ischemic-stroke ---
  { scenarioId: 'minor-nondisabling-acute-ischemic-stroke', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-neurology-minor-stroke-clock-deficit-function-and-whole-patient'] },
  { scenarioId: 'minor-nondisabling-acute-ischemic-stroke', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-neurologic-exam', objectiveIds: ['reconcile-neurology-minor-stroke-clock-deficit-function-and-whole-patient', 'review-neurology-minor-stroke-later-neurologic-trajectory'] },
  { scenarioId: 'minor-nondisabling-acute-ischemic-stroke', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-diagnostic-investigation', objectiveIds: ['review-neurology-minor-stroke-imaging-mimics-and-immediate-threats'] },
  { scenarioId: 'minor-nondisabling-acute-ischemic-stroke', frameworkId: FRAMEWORK_ID, domainId: 'pc-8-neuroimaging', objectiveIds: ['review-neurology-minor-stroke-imaging-mimics-and-immediate-threats'] },
  { scenarioId: 'minor-nondisabling-acute-ischemic-stroke', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-formulation', objectiveIds: ['recognize-neurology-minor-nondisabling-stroke-boundary-without-score-alone'] },
  { scenarioId: 'minor-nondisabling-acute-ischemic-stroke', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-inpatient-management', objectiveIds: ['record-neurology-minor-stroke-qualified-antiplatelet-and-surveillance-intent'] },
  { scenarioId: 'minor-nondisabling-acute-ischemic-stroke', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['record-neurology-minor-stroke-qualified-antiplatelet-and-surveillance-intent', 'review-neurology-minor-stroke-later-neurologic-trajectory'] },
  { scenarioId: 'minor-nondisabling-acute-ischemic-stroke', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-system-navigation', objectiveIds: ['handoff-neurology-minor-stroke-etiology-recurrence-and-secondary-prevention-risk'] },
  { scenarioId: 'minor-nondisabling-acute-ischemic-stroke', frameworkId: FRAMEWORK_ID, domainId: 'ics-4-communication-within-health-care-systems', objectiveIds: ['handoff-neurology-minor-stroke-etiology-recurrence-and-secondary-prevention-risk'] },
  // --- basilar-artery-occlusion-escalation ---
  { scenarioId: 'basilar-artery-occlusion-escalation', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-neurology-basilar-lvo-clock-posterior-syndrome-and-whole-patient'] },
  { scenarioId: 'basilar-artery-occlusion-escalation', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-neurologic-exam', objectiveIds: ['reconcile-neurology-basilar-lvo-clock-posterior-syndrome-and-whole-patient', 'review-neurology-basilar-lvo-strict-later-neurologic-and-airway-trajectory'] },
  { scenarioId: 'basilar-artery-occlusion-escalation', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-diagnostic-investigation', objectiveIds: ['review-neurology-basilar-lvo-imaging-selection-and-open-mimics'] },
  { scenarioId: 'basilar-artery-occlusion-escalation', frameworkId: FRAMEWORK_ID, domainId: 'pc-8-neuroimaging', objectiveIds: ['review-neurology-basilar-lvo-imaging-selection-and-open-mimics'] },
  { scenarioId: 'basilar-artery-occlusion-escalation', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-formulation', objectiveIds: ['recognize-neurology-basilar-lvo-thrombectomy-escalation-boundary'] },
  { scenarioId: 'basilar-artery-occlusion-escalation', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-localization', objectiveIds: ['recognize-neurology-basilar-lvo-thrombectomy-escalation-boundary'] },
  { scenarioId: 'basilar-artery-occlusion-escalation', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-inpatient-management', objectiveIds: ['activate-neurology-basilar-lvo-qualified-endovascular-and-airway-capable-ownership'] },
  { scenarioId: 'basilar-artery-occlusion-escalation', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-system-navigation', objectiveIds: ['activate-neurology-basilar-lvo-qualified-endovascular-and-airway-capable-ownership', 'handoff-neurology-basilar-lvo-clocks-imaging-deterioration-and-unresolved-outcome'] },
  { scenarioId: 'basilar-artery-occlusion-escalation', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-interprofessional-and-team-communication', objectiveIds: ['activate-neurology-basilar-lvo-qualified-endovascular-and-airway-capable-ownership'] },
  { scenarioId: 'basilar-artery-occlusion-escalation', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-neurologic-emergencies', objectiveIds: ['activate-neurology-basilar-lvo-qualified-endovascular-and-airway-capable-ownership'] },
  { scenarioId: 'basilar-artery-occlusion-escalation', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-neurology-basilar-lvo-strict-later-neurologic-and-airway-trajectory'] },
  { scenarioId: 'basilar-artery-occlusion-escalation', frameworkId: FRAMEWORK_ID, domainId: 'ics-4-communication-within-health-care-systems', objectiveIds: ['handoff-neurology-basilar-lvo-clocks-imaging-deterioration-and-unresolved-outcome'] },
  // --- spontaneous-cerebellar-intracerebral-hemorrhage ---
  { scenarioId: 'spontaneous-cerebellar-intracerebral-hemorrhage', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-neurology-cerebellar-ich-clock-deficit-alertness-and-whole-patient'] },
  { scenarioId: 'spontaneous-cerebellar-intracerebral-hemorrhage', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-neurologic-exam', objectiveIds: ['reconcile-neurology-cerebellar-ich-clock-deficit-alertness-and-whole-patient', 'review-neurology-cerebellar-ich-strict-later-neurologic-and-airway-trajectory'] },
  { scenarioId: 'spontaneous-cerebellar-intracerebral-hemorrhage', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-diagnostic-investigation', objectiveIds: ['review-neurology-cerebellar-ich-imaging-location-causes-and-immediate-threats'] },
  { scenarioId: 'spontaneous-cerebellar-intracerebral-hemorrhage', frameworkId: FRAMEWORK_ID, domainId: 'pc-8-neuroimaging', objectiveIds: ['review-neurology-cerebellar-ich-imaging-location-causes-and-immediate-threats'] },
  { scenarioId: 'spontaneous-cerebellar-intracerebral-hemorrhage', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-formulation', objectiveIds: ['recognize-neurology-cerebellar-ich-posterior-fossa-escalation-boundary'] },
  { scenarioId: 'spontaneous-cerebellar-intracerebral-hemorrhage', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-localization', objectiveIds: ['recognize-neurology-cerebellar-ich-posterior-fossa-escalation-boundary'] },
  { scenarioId: 'spontaneous-cerebellar-intracerebral-hemorrhage', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-inpatient-management', objectiveIds: ['activate-neurology-cerebellar-ich-qualified-neurocritical-neurosurgical-and-airway-ownership'] },
  { scenarioId: 'spontaneous-cerebellar-intracerebral-hemorrhage', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-system-navigation', objectiveIds: ['activate-neurology-cerebellar-ich-qualified-neurocritical-neurosurgical-and-airway-ownership', 'handoff-neurology-cerebellar-ich-imaging-expansion-etiology-and-active-risk'] },
  { scenarioId: 'spontaneous-cerebellar-intracerebral-hemorrhage', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-interprofessional-and-team-communication', objectiveIds: ['activate-neurology-cerebellar-ich-qualified-neurocritical-neurosurgical-and-airway-ownership'] },
  { scenarioId: 'spontaneous-cerebellar-intracerebral-hemorrhage', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-neurologic-emergencies', objectiveIds: ['activate-neurology-cerebellar-ich-qualified-neurocritical-neurosurgical-and-airway-ownership'] },
  { scenarioId: 'spontaneous-cerebellar-intracerebral-hemorrhage', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-neurology-cerebellar-ich-strict-later-neurologic-and-airway-trajectory'] },
  { scenarioId: 'spontaneous-cerebellar-intracerebral-hemorrhage', frameworkId: FRAMEWORK_ID, domainId: 'ics-4-communication-within-health-care-systems', objectiveIds: ['handoff-neurology-cerebellar-ich-imaging-expansion-etiology-and-active-risk'] },
  // --- aneurysmal-subarachnoid-hemorrhage-deterioration ---
  { scenarioId: 'aneurysmal-subarachnoid-hemorrhage-deterioration', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-neurology-asah-day-aneurysm-status-new-deficit-and-whole-patient'] },
  { scenarioId: 'aneurysmal-subarachnoid-hemorrhage-deterioration', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-neurologic-exam', objectiveIds: ['reconcile-neurology-asah-day-aneurysm-status-new-deficit-and-whole-patient', 'review-neurology-asah-strict-later-neurologic-and-perfusion-trajectory'] },
  { scenarioId: 'aneurysmal-subarachnoid-hemorrhage-deterioration', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-diagnostic-investigation', objectiveIds: ['review-neurology-asah-rebleeding-hydrocephalus-seizure-metabolic-and-perfusion-evidence'] },
  { scenarioId: 'aneurysmal-subarachnoid-hemorrhage-deterioration', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-formulation', objectiveIds: ['recognize-neurology-asah-possible-dci-without-imaging-alone'] },
  { scenarioId: 'aneurysmal-subarachnoid-hemorrhage-deterioration', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-inpatient-management', objectiveIds: ['activate-neurology-asah-qualified-neurocritical-neurovascular-and-rescue-ownership'] },
  { scenarioId: 'aneurysmal-subarachnoid-hemorrhage-deterioration', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-system-navigation', objectiveIds: ['activate-neurology-asah-qualified-neurocritical-neurovascular-and-rescue-ownership', 'handoff-neurology-asah-dci-aneurysm-recurrence-and-active-risk'] },
  { scenarioId: 'aneurysmal-subarachnoid-hemorrhage-deterioration', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-interprofessional-and-team-communication', objectiveIds: ['activate-neurology-asah-qualified-neurocritical-neurovascular-and-rescue-ownership'] },
  { scenarioId: 'aneurysmal-subarachnoid-hemorrhage-deterioration', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-neurologic-emergencies', objectiveIds: ['activate-neurology-asah-qualified-neurocritical-neurovascular-and-rescue-ownership'] },
  { scenarioId: 'aneurysmal-subarachnoid-hemorrhage-deterioration', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-neurology-asah-strict-later-neurologic-and-perfusion-trajectory'] },
  { scenarioId: 'aneurysmal-subarachnoid-hemorrhage-deterioration', frameworkId: FRAMEWORK_ID, domainId: 'ics-4-communication-within-health-care-systems', objectiveIds: ['handoff-neurology-asah-dci-aneurysm-recurrence-and-active-risk'] },
  // --- focal-motor-status-epilepticus-escalation ---
  { scenarioId: 'focal-motor-status-epilepticus-escalation', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-neurology-focal-motor-status-clock-semiology-recovery-and-whole-patient'] },
  { scenarioId: 'focal-motor-status-epilepticus-escalation', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-neurologic-exam', objectiveIds: ['reconcile-neurology-focal-motor-status-clock-semiology-recovery-and-whole-patient', 'review-neurology-focal-motor-status-strict-later-visible-motor-trajectory'] },
  { scenarioId: 'focal-motor-status-epilepticus-escalation', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-formulation', objectiveIds: ['recognize-neurology-focal-motor-status-despite-reduced-convulsions'] },
  { scenarioId: 'focal-motor-status-epilepticus-escalation', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-inpatient-management', objectiveIds: ['activate-neurology-focal-motor-status-qualified-seizure-and-airway-ownership'] },
  { scenarioId: 'focal-motor-status-epilepticus-escalation', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-system-navigation', objectiveIds: ['activate-neurology-focal-motor-status-qualified-seizure-and-airway-ownership', 'handoff-neurology-focal-motor-status-recovery-cause-and-active-risk'] },
  { scenarioId: 'focal-motor-status-epilepticus-escalation', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-interprofessional-and-team-communication', objectiveIds: ['activate-neurology-focal-motor-status-qualified-seizure-and-airway-ownership'] },
  { scenarioId: 'focal-motor-status-epilepticus-escalation', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-neurologic-emergencies', objectiveIds: ['activate-neurology-focal-motor-status-qualified-seizure-and-airway-ownership'] },
  { scenarioId: 'focal-motor-status-epilepticus-escalation', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-diagnostic-investigation', objectiveIds: ['review-neurology-focal-motor-status-airway-glucose-causes-and-injury-boundary'] },
  { scenarioId: 'focal-motor-status-epilepticus-escalation', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-neurology-focal-motor-status-strict-later-visible-motor-trajectory'] },
  { scenarioId: 'focal-motor-status-epilepticus-escalation', frameworkId: FRAMEWORK_ID, domainId: 'ics-4-communication-within-health-care-systems', objectiveIds: ['handoff-neurology-focal-motor-status-recovery-cause-and-active-risk'] },
  // --- nonconvulsive-status-epilepticus-recognition ---
  { scenarioId: 'nonconvulsive-status-epilepticus-recognition', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-neurology-ncse-clock-fluctuation-subtle-signs-and-whole-patient'] },
  { scenarioId: 'nonconvulsive-status-epilepticus-recognition', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-neurologic-exam', objectiveIds: ['reconcile-neurology-ncse-clock-fluctuation-subtle-signs-and-whole-patient', 'review-neurology-ncse-strict-later-qualified-eeg-and-clinical-trajectory'] },
  { scenarioId: 'nonconvulsive-status-epilepticus-recognition', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-formulation', objectiveIds: ['recognize-neurology-ncse-suspicion-and-urgent-eeg-boundary-without-clinical-diagnosis'] },
  { scenarioId: 'nonconvulsive-status-epilepticus-recognition', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-inpatient-management', objectiveIds: ['activate-neurology-ncse-qualified-neurology-eeg-and-airway-capable-ownership'] },
  { scenarioId: 'nonconvulsive-status-epilepticus-recognition', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-system-navigation', objectiveIds: ['activate-neurology-ncse-qualified-neurology-eeg-and-airway-capable-ownership', 'handoff-neurology-ncse-cause-treatment-recurrence-and-active-risk'] },
  { scenarioId: 'nonconvulsive-status-epilepticus-recognition', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-interprofessional-and-team-communication', objectiveIds: ['activate-neurology-ncse-qualified-neurology-eeg-and-airway-capable-ownership'] },
  { scenarioId: 'nonconvulsive-status-epilepticus-recognition', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-neurologic-emergencies', objectiveIds: ['activate-neurology-ncse-qualified-neurology-eeg-and-airway-capable-ownership'] },
  { scenarioId: 'nonconvulsive-status-epilepticus-recognition', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-diagnostic-investigation', objectiveIds: ['review-neurology-ncse-airway-glucose-vascular-metabolic-toxic-and-infectious-alternatives'] },
  { scenarioId: 'nonconvulsive-status-epilepticus-recognition', frameworkId: FRAMEWORK_ID, domainId: 'pc-8-neuroimaging', objectiveIds: ['review-neurology-ncse-airway-glucose-vascular-metabolic-toxic-and-infectious-alternatives'] },
  { scenarioId: 'nonconvulsive-status-epilepticus-recognition', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-neurology-ncse-strict-later-qualified-eeg-and-clinical-trajectory'] },
  { scenarioId: 'nonconvulsive-status-epilepticus-recognition', frameworkId: FRAMEWORK_ID, domainId: 'ics-4-communication-within-health-care-systems', objectiveIds: ['handoff-neurology-ncse-cause-treatment-recurrence-and-active-risk'] },
  // --- myasthenic-crisis-escalation ---
  { scenarioId: 'myasthenic-crisis-escalation', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-neurology-myasthenic-crisis-clock-fatigability-bulbar-respiratory-and-whole-patient'] },
  { scenarioId: 'myasthenic-crisis-escalation', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-neurologic-exam', objectiveIds: ['reconcile-neurology-myasthenic-crisis-clock-fatigability-bulbar-respiratory-and-whole-patient', 'review-neurology-myasthenic-crisis-strict-later-bulbar-ventilatory-and-supplied-airway-trajectory'] },
  { scenarioId: 'myasthenic-crisis-escalation', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-formulation', objectiveIds: ['recognize-neurology-impending-myasthenic-crisis-without-spo2-or-single-cutoff-reassurance'] },
  { scenarioId: 'myasthenic-crisis-escalation', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-inpatient-management', objectiveIds: ['activate-neurology-myasthenic-crisis-qualified-neurocritical-and-airway-capable-ownership'] },
  { scenarioId: 'myasthenic-crisis-escalation', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-system-navigation', objectiveIds: ['activate-neurology-myasthenic-crisis-qualified-neurocritical-and-airway-capable-ownership', 'handoff-neurology-myasthenic-crisis-trigger-treatment-weaning-recurrence-and-active-risk'] },
  { scenarioId: 'myasthenic-crisis-escalation', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-interprofessional-and-team-communication', objectiveIds: ['activate-neurology-myasthenic-crisis-qualified-neurocritical-and-airway-capable-ownership'] },
  { scenarioId: 'myasthenic-crisis-escalation', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-neurologic-emergencies', objectiveIds: ['activate-neurology-myasthenic-crisis-qualified-neurocritical-and-airway-capable-ownership'] },
  { scenarioId: 'myasthenic-crisis-escalation', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-diagnostic-investigation', objectiveIds: ['review-neurology-myasthenic-crisis-secretion-aspiration-infection-medication-and-alternative-causes'] },
  { scenarioId: 'myasthenic-crisis-escalation', frameworkId: FRAMEWORK_ID, domainId: 'pc-8-neuroimaging', objectiveIds: ['review-neurology-myasthenic-crisis-secretion-aspiration-infection-medication-and-alternative-causes'] },
  { scenarioId: 'myasthenic-crisis-escalation', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-neurology-myasthenic-crisis-strict-later-bulbar-ventilatory-and-supplied-airway-trajectory'] },
  { scenarioId: 'myasthenic-crisis-escalation', frameworkId: FRAMEWORK_ID, domainId: 'ics-4-communication-within-health-care-systems', objectiveIds: ['handoff-neurology-myasthenic-crisis-trigger-treatment-weaning-recurrence-and-active-risk'] },
  // --- guillain-barre-respiratory-decline ---
  { scenarioId: 'guillain-barre-respiratory-decline', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-neurology-gbs-clock-ascending-weakness-bulbar-respiratory-autonomic-and-whole-patient'] },
  { scenarioId: 'guillain-barre-respiratory-decline', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-neurologic-exam', objectiveIds: ['reconcile-neurology-gbs-clock-ascending-weakness-bulbar-respiratory-autonomic-and-whole-patient', 'review-neurology-gbs-strict-later-respiratory-bulbar-and-autonomic-trajectory'] },
  { scenarioId: 'guillain-barre-respiratory-decline', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-diagnostic-investigation', objectiveIds: ['review-neurology-gbs-supportive-evidence-mimics-and-diagnostic-boundary'] },
  { scenarioId: 'guillain-barre-respiratory-decline', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-formulation', objectiveIds: ['recognize-neurology-gbs-high-risk-respiratory-decline-without-score-or-single-cutoff'] },
  { scenarioId: 'guillain-barre-respiratory-decline', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-inpatient-management', objectiveIds: ['activate-neurology-gbs-qualified-neurocritical-respiratory-airway-and-cardiac-ownership'] },
  { scenarioId: 'guillain-barre-respiratory-decline', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-system-navigation', objectiveIds: ['activate-neurology-gbs-qualified-neurocritical-respiratory-airway-and-cardiac-ownership', 'handoff-neurology-gbs-airway-dysautonomia-treatment-recurrence-and-active-risk'] },
  { scenarioId: 'guillain-barre-respiratory-decline', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-interprofessional-and-team-communication', objectiveIds: ['activate-neurology-gbs-qualified-neurocritical-respiratory-airway-and-cardiac-ownership'] },
  { scenarioId: 'guillain-barre-respiratory-decline', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-neurologic-emergencies', objectiveIds: ['activate-neurology-gbs-qualified-neurocritical-respiratory-airway-and-cardiac-ownership'] },
  { scenarioId: 'guillain-barre-respiratory-decline', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-neurology-gbs-strict-later-respiratory-bulbar-and-autonomic-trajectory'] },
  { scenarioId: 'guillain-barre-respiratory-decline', frameworkId: FRAMEWORK_ID, domainId: 'ics-4-communication-within-health-care-systems', objectiveIds: ['handoff-neurology-gbs-airway-dysautonomia-treatment-recurrence-and-active-risk'] },
  // --- acute-bacterial-meningitis-first-hour ---
  { scenarioId: 'acute-bacterial-meningitis-first-hour', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-neurology-meningitis-clock-meningeal-infection-neurologic-and-whole-patient'] },
  { scenarioId: 'acute-bacterial-meningitis-first-hour', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-neurologic-exam', objectiveIds: ['reconcile-neurology-meningitis-clock-meningeal-infection-neurologic-and-whole-patient', 'review-neurology-meningitis-strict-later-csf-clinical-and-supplied-treatment-trajectory'] },
  { scenarioId: 'acute-bacterial-meningitis-first-hour', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-inpatient-management', objectiveIds: ['activate-neurology-meningitis-qualified-time-critical-infection-neurologic-resuscitation-and-precaution-ownership', 'activate-neurology-meningitis-qualified-early-empiric-antimicrobial-and-adjunct-pathway-without-diagnostic-delay'] },
  { scenarioId: 'acute-bacterial-meningitis-first-hour', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-system-navigation', objectiveIds: ['activate-neurology-meningitis-qualified-time-critical-infection-neurologic-resuscitation-and-precaution-ownership', 'activate-neurology-meningitis-qualified-early-empiric-antimicrobial-and-adjunct-pathway-without-diagnostic-delay', 'handoff-neurology-meningitis-organism-treatment-complication-public-health-hearing-and-active-risk'] },
  { scenarioId: 'acute-bacterial-meningitis-first-hour', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-interprofessional-and-team-communication', objectiveIds: ['activate-neurology-meningitis-qualified-time-critical-infection-neurologic-resuscitation-and-precaution-ownership', 'activate-neurology-meningitis-qualified-early-empiric-antimicrobial-and-adjunct-pathway-without-diagnostic-delay'] },
  { scenarioId: 'acute-bacterial-meningitis-first-hour', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-neurologic-emergencies', objectiveIds: ['activate-neurology-meningitis-qualified-time-critical-infection-neurologic-resuscitation-and-precaution-ownership', 'activate-neurology-meningitis-qualified-early-empiric-antimicrobial-and-adjunct-pathway-without-diagnostic-delay'] },
  { scenarioId: 'acute-bacterial-meningitis-first-hour', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-diagnostic-investigation', objectiveIds: ['review-neurology-meningitis-lp-safety-no-routine-imaging-and-parallel-diagnostic-boundary'] },
  { scenarioId: 'acute-bacterial-meningitis-first-hour', frameworkId: FRAMEWORK_ID, domainId: 'pc-8-neuroimaging', objectiveIds: ['review-neurology-meningitis-lp-safety-no-routine-imaging-and-parallel-diagnostic-boundary'] },
  { scenarioId: 'acute-bacterial-meningitis-first-hour', frameworkId: FRAMEWORK_ID, domainId: 'pc-11-lumbar-puncture', objectiveIds: ['review-neurology-meningitis-lp-safety-no-routine-imaging-and-parallel-diagnostic-boundary'] },
  { scenarioId: 'acute-bacterial-meningitis-first-hour', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-neurology-meningitis-strict-later-csf-clinical-and-supplied-treatment-trajectory'] },
  { scenarioId: 'acute-bacterial-meningitis-first-hour', frameworkId: FRAMEWORK_ID, domainId: 'ics-4-communication-within-health-care-systems', objectiveIds: ['handoff-neurology-meningitis-organism-treatment-complication-public-health-hearing-and-active-risk'] },
  { scenarioId: 'acute-bacterial-meningitis-first-hour', frameworkId: FRAMEWORK_ID, domainId: 'sbp-4-physician-role-in-health-care-systems', objectiveIds: ['handoff-neurology-meningitis-organism-treatment-complication-public-health-hearing-and-active-risk'] },
  // --- suspected-herpes-simplex-encephalitis ---
  { scenarioId: 'suspected-herpes-simplex-encephalitis', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-neurology-encephalitis-clock-cognition-language-focal-seizure-and-whole-patient'] },
  { scenarioId: 'suspected-herpes-simplex-encephalitis', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-neurologic-exam', objectiveIds: ['reconcile-neurology-encephalitis-clock-cognition-language-focal-seizure-and-whole-patient', 'review-neurology-encephalitis-strict-later-early-negative-hsv-pcr-and-clinical-trajectory'] },
  { scenarioId: 'suspected-herpes-simplex-encephalitis', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-inpatient-management', objectiveIds: ['activate-neurology-encephalitis-qualified-neurocritical-infection-airway-and-seizure-ownership', 'activate-neurology-encephalitis-qualified-immediate-empiric-antiviral-pathway-without-test-delay'] },
  { scenarioId: 'suspected-herpes-simplex-encephalitis', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-system-navigation', objectiveIds: ['activate-neurology-encephalitis-qualified-neurocritical-infection-airway-and-seizure-ownership', 'activate-neurology-encephalitis-qualified-immediate-empiric-antiviral-pathway-without-test-delay', 'handoff-neurology-encephalitis-repeat-testing-antiviral-seizure-autoimmune-and-active-risk'] },
  { scenarioId: 'suspected-herpes-simplex-encephalitis', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-interprofessional-and-team-communication', objectiveIds: ['activate-neurology-encephalitis-qualified-neurocritical-infection-airway-and-seizure-ownership', 'activate-neurology-encephalitis-qualified-immediate-empiric-antiviral-pathway-without-test-delay'] },
  { scenarioId: 'suspected-herpes-simplex-encephalitis', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-neurologic-emergencies', objectiveIds: ['activate-neurology-encephalitis-qualified-neurocritical-infection-airway-and-seizure-ownership', 'activate-neurology-encephalitis-qualified-immediate-empiric-antiviral-pathway-without-test-delay'] },
  { scenarioId: 'suspected-herpes-simplex-encephalitis', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-diagnostic-investigation', objectiveIds: ['review-neurology-encephalitis-mri-eeg-csf-etiology-and-nonconvulsive-seizure-boundary'] },
  { scenarioId: 'suspected-herpes-simplex-encephalitis', frameworkId: FRAMEWORK_ID, domainId: 'pc-8-neuroimaging', objectiveIds: ['review-neurology-encephalitis-mri-eeg-csf-etiology-and-nonconvulsive-seizure-boundary'] },
  { scenarioId: 'suspected-herpes-simplex-encephalitis', frameworkId: FRAMEWORK_ID, domainId: 'pc-9-eeg', objectiveIds: ['review-neurology-encephalitis-mri-eeg-csf-etiology-and-nonconvulsive-seizure-boundary'] },
  { scenarioId: 'suspected-herpes-simplex-encephalitis', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-neurology-encephalitis-strict-later-early-negative-hsv-pcr-and-clinical-trajectory'] },
  { scenarioId: 'suspected-herpes-simplex-encephalitis', frameworkId: FRAMEWORK_ID, domainId: 'ics-4-communication-within-health-care-systems', objectiveIds: ['handoff-neurology-encephalitis-repeat-testing-antiviral-seizure-autoimmune-and-active-risk'] },
  // --- raised-intracranial-pressure-visual-threat ---
  { scenarioId: 'raised-intracranial-pressure-visual-threat', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-neurology-raised-icp-headache-visual-tinnitus-diplopia-and-whole-patient'] },
  { scenarioId: 'raised-intracranial-pressure-visual-threat', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-neurologic-exam', objectiveIds: ['reconcile-neurology-raised-icp-headache-visual-tinnitus-diplopia-and-whole-patient', 'review-neurology-raised-icp-strict-later-worsening-visual-field-and-imminent-sight-threat'] },
  { scenarioId: 'raised-intracranial-pressure-visual-threat', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-inpatient-management', objectiveIds: ['activate-neurology-raised-icp-qualified-neurology-neuro-ophthalmology-imaging-and-procedure-ownership'] },
  { scenarioId: 'raised-intracranial-pressure-visual-threat', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-system-navigation', objectiveIds: ['activate-neurology-raised-icp-qualified-neurology-neuro-ophthalmology-imaging-and-procedure-ownership', 'handoff-neurology-raised-icp-vision-rescue-cause-disease-headache-follow-up-and-active-risk'] },
  { scenarioId: 'raised-intracranial-pressure-visual-threat', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-interprofessional-and-team-communication', objectiveIds: ['activate-neurology-raised-icp-qualified-neurology-neuro-ophthalmology-imaging-and-procedure-ownership'] },
  { scenarioId: 'raised-intracranial-pressure-visual-threat', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-neurologic-emergencies', objectiveIds: ['activate-neurology-raised-icp-qualified-neurology-neuro-ophthalmology-imaging-and-procedure-ownership'] },
  { scenarioId: 'raised-intracranial-pressure-visual-threat', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-diagnostic-investigation', objectiveIds: ['review-neurology-raised-icp-confirmed-papilledema-visual-function-and-pseudopapilledema-boundary', 'review-neurology-raised-icp-mri-venography-lp-secondary-cause-and-diagnostic-boundary'] },
  { scenarioId: 'raised-intracranial-pressure-visual-threat', frameworkId: FRAMEWORK_ID, domainId: 'pc-8-neuroimaging', objectiveIds: ['review-neurology-raised-icp-confirmed-papilledema-visual-function-and-pseudopapilledema-boundary', 'review-neurology-raised-icp-mri-venography-lp-secondary-cause-and-diagnostic-boundary'] },
  { scenarioId: 'raised-intracranial-pressure-visual-threat', frameworkId: FRAMEWORK_ID, domainId: 'pc-11-lumbar-puncture', objectiveIds: ['review-neurology-raised-icp-mri-venography-lp-secondary-cause-and-diagnostic-boundary'] },
  { scenarioId: 'raised-intracranial-pressure-visual-threat', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-neurology-raised-icp-strict-later-worsening-visual-field-and-imminent-sight-threat'] },
  { scenarioId: 'raised-intracranial-pressure-visual-threat', frameworkId: FRAMEWORK_ID, domainId: 'ics-4-communication-within-health-care-systems', objectiveIds: ['handoff-neurology-raised-icp-vision-rescue-cause-disease-headache-follow-up-and-active-risk'] },
  // --- acute-transtentorial-herniation-pattern ---
  { scenarioId: 'acute-transtentorial-herniation-pattern', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-neurology-herniation-clock-consciousness-pupils-motor-physiology-and-whole-patient'] },
  { scenarioId: 'acute-transtentorial-herniation-pattern', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-neurologic-exam', objectiveIds: ['reconcile-neurology-herniation-clock-consciousness-pupils-motor-physiology-and-whole-patient', 'review-neurology-herniation-strict-later-qualified-rescue-and-unresolved-neurologic-trajectory'] },
  { scenarioId: 'acute-transtentorial-herniation-pattern', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-formulation', objectiveIds: ['recognize-neurology-converging-transtentorial-herniation-pattern-without-isolated-pupil-or-complete-triad'] },
  { scenarioId: 'acute-transtentorial-herniation-pattern', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-localization', objectiveIds: ['recognize-neurology-converging-transtentorial-herniation-pattern-without-isolated-pupil-or-complete-triad'] },
  { scenarioId: 'acute-transtentorial-herniation-pattern', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-inpatient-management', objectiveIds: ['activate-neurology-herniation-qualified-airway-neurocritical-neurosurgical-and-brain-rescue-ownership'] },
  { scenarioId: 'acute-transtentorial-herniation-pattern', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-system-navigation', objectiveIds: ['activate-neurology-herniation-qualified-airway-neurocritical-neurosurgical-and-brain-rescue-ownership', 'handoff-neurology-herniation-lesion-airway-pressure-seizure-surgery-and-active-risk'] },
  { scenarioId: 'acute-transtentorial-herniation-pattern', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-interprofessional-and-team-communication', objectiveIds: ['activate-neurology-herniation-qualified-airway-neurocritical-neurosurgical-and-brain-rescue-ownership'] },
  { scenarioId: 'acute-transtentorial-herniation-pattern', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-neurologic-emergencies', objectiveIds: ['activate-neurology-herniation-qualified-airway-neurocritical-neurosurgical-and-brain-rescue-ownership'] },
  { scenarioId: 'acute-transtentorial-herniation-pattern', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-diagnostic-investigation', objectiveIds: ['review-neurology-herniation-immediate-systemic-brain-rescue-imaging-and-definitive-source-control-boundary'] },
  { scenarioId: 'acute-transtentorial-herniation-pattern', frameworkId: FRAMEWORK_ID, domainId: 'pc-8-neuroimaging', objectiveIds: ['review-neurology-herniation-immediate-systemic-brain-rescue-imaging-and-definitive-source-control-boundary'] },
  { scenarioId: 'acute-transtentorial-herniation-pattern', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-neurology-herniation-strict-later-qualified-rescue-and-unresolved-neurologic-trajectory'] },
  { scenarioId: 'acute-transtentorial-herniation-pattern', frameworkId: FRAMEWORK_ID, domainId: 'ics-4-communication-within-health-care-systems', objectiveIds: ['handoff-neurology-herniation-lesion-airway-pressure-seizure-surgery-and-active-risk'] },
  // --- metastatic-spinal-cord-compression ---
  { scenarioId: 'metastatic-spinal-cord-compression', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-neurology-mscc-cancer-pain-motor-sensory-bladder-and-whole-patient-clock'] },
  { scenarioId: 'metastatic-spinal-cord-compression', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-neurologic-exam', objectiveIds: ['reconcile-neurology-mscc-cancer-pain-motor-sensory-bladder-and-whole-patient-clock', 'review-neurology-mscc-strict-later-qualified-mri-and-unresolved-function-trajectory'] },
  { scenarioId: 'metastatic-spinal-cord-compression', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-formulation', objectiveIds: ['recognize-neurology-mscc-oncologic-emergency-before-imaging-confirmation'] },
  { scenarioId: 'metastatic-spinal-cord-compression', frameworkId: FRAMEWORK_ID, domainId: 'mk-1-localization', objectiveIds: ['recognize-neurology-mscc-oncologic-emergency-before-imaging-confirmation'] },
  { scenarioId: 'metastatic-spinal-cord-compression', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-inpatient-management', objectiveIds: ['activate-neurology-mscc-qualified-spinal-oncology-radiology-nursing-and-rehabilitation-ownership'] },
  { scenarioId: 'metastatic-spinal-cord-compression', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-system-navigation', objectiveIds: ['activate-neurology-mscc-qualified-spinal-oncology-radiology-nursing-and-rehabilitation-ownership', 'handoff-neurology-mscc-level-stability-function-bladder-definitive-care-and-active-risk'] },
  { scenarioId: 'metastatic-spinal-cord-compression', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-interprofessional-and-team-communication', objectiveIds: ['activate-neurology-mscc-qualified-spinal-oncology-radiology-nursing-and-rehabilitation-ownership'] },
  { scenarioId: 'metastatic-spinal-cord-compression', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-neurologic-emergencies', objectiveIds: ['activate-neurology-mscc-qualified-spinal-oncology-radiology-nursing-and-rehabilitation-ownership'] },
  { scenarioId: 'metastatic-spinal-cord-compression', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-diagnostic-investigation', objectiveIds: ['review-neurology-mscc-stability-movement-whole-spine-mri-corticosteroid-and-definitive-care-boundary'] },
  { scenarioId: 'metastatic-spinal-cord-compression', frameworkId: FRAMEWORK_ID, domainId: 'pc-8-neuroimaging', objectiveIds: ['review-neurology-mscc-stability-movement-whole-spine-mri-corticosteroid-and-definitive-care-boundary'] },
  { scenarioId: 'metastatic-spinal-cord-compression', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-neurology-mscc-strict-later-qualified-mri-and-unresolved-function-trajectory'] },
  { scenarioId: 'metastatic-spinal-cord-compression', frameworkId: FRAMEWORK_ID, domainId: 'ics-4-communication-within-health-care-systems', objectiveIds: ['handoff-neurology-mscc-level-stability-function-bladder-definitive-care-and-active-risk'] },
  // --- acute-delirium-reversible-causes ---
  { scenarioId: 'acute-delirium-reversible-causes', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-neurology-delirium-baseline-clock-fluctuation-attention-perception-function-and-whole-patient'] },
  { scenarioId: 'acute-delirium-reversible-causes', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-neurologic-exam', objectiveIds: ['reconcile-neurology-delirium-baseline-clock-fluctuation-attention-perception-function-and-whole-patient', 'review-neurology-delirium-strict-later-contributor-and-unresolved-cognitive-trajectory'] },
  { scenarioId: 'acute-delirium-reversible-causes', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-formulation', objectiveIds: ['recognize-neurology-delirium-indicators-and-qualified-assessment-boundary-without-dementia-or-single-cause-closure'] },
  { scenarioId: 'acute-delirium-reversible-causes', frameworkId: FRAMEWORK_ID, domainId: 'pc-12-psychiatric-and-functional', objectiveIds: ['recognize-neurology-delirium-indicators-and-qualified-assessment-boundary-without-dementia-or-single-cause-closure', 'review-neurology-delirium-reversible-contributors-communication-environment-deescalation-and-treatment-boundary'] },
  { scenarioId: 'acute-delirium-reversible-causes', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-inpatient-management', objectiveIds: ['activate-neurology-delirium-qualified-medical-nursing-pharmacy-family-safety-capacity-and-mobility-ownership'] },
  { scenarioId: 'acute-delirium-reversible-causes', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-system-navigation', objectiveIds: ['activate-neurology-delirium-qualified-medical-nursing-pharmacy-family-safety-capacity-and-mobility-ownership', 'handoff-neurology-delirium-causes-capacity-safety-medicines-function-recurrence-follow-up-and-active-risk'] },
  { scenarioId: 'acute-delirium-reversible-causes', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-interprofessional-and-team-communication', objectiveIds: ['activate-neurology-delirium-qualified-medical-nursing-pharmacy-family-safety-capacity-and-mobility-ownership'] },
  { scenarioId: 'acute-delirium-reversible-causes', frameworkId: FRAMEWORK_ID, domainId: 'ics-1-patient-and-family-communication', objectiveIds: ['activate-neurology-delirium-qualified-medical-nursing-pharmacy-family-safety-capacity-and-mobility-ownership', 'handoff-neurology-delirium-causes-capacity-safety-medicines-function-recurrence-follow-up-and-active-risk'] },
  { scenarioId: 'acute-delirium-reversible-causes', frameworkId: FRAMEWORK_ID, domainId: 'prof-1-professional-behavior-and-ethics', objectiveIds: ['activate-neurology-delirium-qualified-medical-nursing-pharmacy-family-safety-capacity-and-mobility-ownership', 'handoff-neurology-delirium-causes-capacity-safety-medicines-function-recurrence-follow-up-and-active-risk'] },
  { scenarioId: 'acute-delirium-reversible-causes', frameworkId: FRAMEWORK_ID, domainId: 'mk-2-diagnostic-investigation', objectiveIds: ['review-neurology-delirium-reversible-contributors-communication-environment-deescalation-and-treatment-boundary'] },
  { scenarioId: 'acute-delirium-reversible-causes', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-neurology-delirium-strict-later-contributor-and-unresolved-cognitive-trajectory'] },
  { scenarioId: 'acute-delirium-reversible-causes', frameworkId: FRAMEWORK_ID, domainId: 'ics-4-communication-within-health-care-systems', objectiveIds: ['handoff-neurology-delirium-causes-capacity-safety-medicines-function-recurrence-follow-up-and-active-risk'] },
  // --- autonomic-dysreflexia-authored-trigger ---
  { scenarioId: 'autonomic-dysreflexia-authored-trigger', frameworkId: FRAMEWORK_ID, domainId: 'pc-1-history', objectiveIds: ['reconcile-neurology-autonomic-dysreflexia-lesion-baseline-pressure-symptoms-rhythm-and-whole-patient'] },
  { scenarioId: 'autonomic-dysreflexia-authored-trigger', frameworkId: FRAMEWORK_ID, domainId: 'pc-2-neurologic-exam', objectiveIds: ['reconcile-neurology-autonomic-dysreflexia-lesion-baseline-pressure-symptoms-rhythm-and-whole-patient', 'reassess-neurology-autonomic-dysreflexia-strict-pressure-pulse-symptom-and-trigger-transition'] },
  { scenarioId: 'autonomic-dysreflexia-authored-trigger', frameworkId: FRAMEWORK_ID, domainId: 'pc-3-formulation', objectiveIds: ['recognize-neurology-autonomic-dysreflexia-pattern-without-closing-alternatives-or-definitive-diagnosis'] },
  { scenarioId: 'autonomic-dysreflexia-authored-trigger', frameworkId: FRAMEWORK_ID, domainId: 'pc-5-inpatient-management', objectiveIds: ['activate-neurology-autonomic-dysreflexia-upright-support-monitoring-and-qualified-ownership'] },
  { scenarioId: 'autonomic-dysreflexia-authored-trigger', frameworkId: FRAMEWORK_ID, domainId: 'sbp-3-system-navigation', objectiveIds: ['activate-neurology-autonomic-dysreflexia-upright-support-monitoring-and-qualified-ownership', 'handoff-neurology-autonomic-dysreflexia-baseline-triggers-recurrence-complications-prevention-and-active-risk'] },
  { scenarioId: 'autonomic-dysreflexia-authored-trigger', frameworkId: FRAMEWORK_ID, domainId: 'ics-3-interprofessional-and-team-communication', objectiveIds: ['activate-neurology-autonomic-dysreflexia-upright-support-monitoring-and-qualified-ownership'] },
  { scenarioId: 'autonomic-dysreflexia-authored-trigger', frameworkId: FRAMEWORK_ID, domainId: 'pc-6-neurologic-emergencies', objectiveIds: ['activate-neurology-autonomic-dysreflexia-upright-support-monitoring-and-qualified-ownership', 'review-and-release-neurology-autonomic-dysreflexia-supplied-external-urinary-trigger-within-role'] },
  { scenarioId: 'autonomic-dysreflexia-authored-trigger', frameworkId: FRAMEWORK_ID, domainId: 'sbp-1-patient-safety', objectiveIds: ['review-and-release-neurology-autonomic-dysreflexia-supplied-external-urinary-trigger-within-role', 'reassess-neurology-autonomic-dysreflexia-strict-pressure-pulse-symptom-and-trigger-transition'] },
  { scenarioId: 'autonomic-dysreflexia-authored-trigger', frameworkId: FRAMEWORK_ID, domainId: 'ics-4-communication-within-health-care-systems', objectiveIds: ['handoff-neurology-autonomic-dysreflexia-baseline-triggers-recurrence-complications-prevention-and-active-risk'] },
];
