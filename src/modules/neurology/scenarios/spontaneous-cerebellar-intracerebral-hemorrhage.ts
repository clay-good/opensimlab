/** Spontaneous cerebellar ICH with strict-later posterior-fossa deterioration. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const SPONTANEOUS_CEREBELLAR_INTRACEREBRAL_HEMORRHAGE: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'spontaneous-cerebellar-intracerebral-hemorrhage', version: '0.1.0', maturity: 'draft',
    title: 'Spontaneous cerebellar ICH escalation', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 8, difficulty: 'advanced', objectives: [
      { id: 'reconcile-neurology-cerebellar-ich-clock-deficit-alertness-and-whole-patient', statement: 'Connect the clock, posterior-fossa deficits, alertness, physiology, and whole-patient state.', measure: 'The fixed symptom clock, neurological findings, breathing, circulation, glucose, and baseline function were reconciled without learner history, examination, testing, diagnosis, or treatment.' },
      { id: 'review-neurology-cerebellar-ich-imaging-location-causes-and-immediate-threats', statement: 'Review the fixed imaging, posterior-fossa location, open causes, and immediate threats.', measure: 'The 11 mL cerebellar hemorrhage, fourth-ventricle effacement, absent initial hydrocephalus, and open cause were integrated without learner image interpretation or etiologic closure.' },
      { id: 'recognize-neurology-cerebellar-ich-posterior-fossa-escalation-boundary', statement: 'Recognize the confined posterior-fossa escalation boundary before overt hydrocephalus or brainstem compression.', measure: 'The anatomy and deterioration risk prompted escalation without learner scoring, surgical eligibility adjudication, procedure selection, or outcome prediction.' },
      { id: 'activate-neurology-cerebellar-ich-qualified-neurocritical-neurosurgical-and-airway-ownership', statement: 'Activate qualified neurocritical, neurosurgical, and airway-capable ownership.', measure: 'Named ownership followed recognition without learner drug, pressure, airway, device, transfer, procedure, or treatment controls.' },
      { id: 'review-neurology-cerebellar-ich-strict-later-neurologic-and-airway-trajectory', statement: 'At a strict later report, compare the fixed neurological, airway, and imaging deterioration.', measure: 'Drowsiness, recurrent vomiting, weaker cough, expansion, hydrocephalus, and brainstem compression were recognized without attributing a treatment response or selecting a procedure.' },
      { id: 'handoff-neurology-cerebellar-ich-imaging-expansion-etiology-and-active-risk', statement: 'After another elapsed interval, hand off imaging expansion, open etiology, airway risk, and unresolved care.', measure: 'The handoff preserved active qualified ownership without claiming treatment, durable stability, disposition, prognosis, or outcome.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Greenberg SM, Ziai WC, Cordonnier C, et al. 2022 Guideline for the Management of Patients With Spontaneous Intracerebral Hemorrhage. Stroke. 2022;53:e282-e361. doi:10.1161/STR.0000000000000407.',
        'Ruff IM, de Havenon A, Bergman DL, et al. 2024 AHA/ASA Performance and Quality Measures for Spontaneous Intracerebral Hemorrhage. Stroke. 2024;55:e199-e230. doi:10.1161/STR.0000000000000464.',
      ],
    },
    limitations: [
      'cerebellar-ich-clock-neurologic-imaging-care-and-later-state-are-authored',
      'cerebellar-ich-controls-reconcile-review-recognize-activate-reassess-and-handoff-only',
      'no-live-cerebellar-ich-exam-score-imaging-drug-airway-device-procedure-disposition-or-outcome',
    ],
  },
  patient: {
    ageYears: 67, sex: 'female', heightCm: 165, weightKg: 68, asaClass: 4,
    diagnosis: 'Authored spontaneous right cerebellar intracerebral hemorrhage with open etiology',
    procedure: 'calm posterior-fossa danger recognition, qualified escalation, serial reassessment, and active-risk handoff',
    comorbidities: ['Hypertension', 'Previously independent'], medications: ['Amlodipine'],
    allergies: ['No known drug allergies'], fasting: 'Not established during acute neurological assessment',
    baseline: { heartRateBpm: 78, meanArterialMmHg: 117, strokeVolumeMl: 65,
      hemoglobinGPerDl: 13.3, bloodVolumeMl: 4_800, coreTemperatureC: 36.7,
      arterialStiffness: 1.2, baroreflexGain: 0.75, fixedStrokeVolume: false },
    airway: { difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Awake with spontaneous breathing and a present cough at the initial fixed snapshot' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 430, respiratoryRateBpm: 18,
      freshGasFlowLPerMin: 0.5, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'spontaneous-cerebellar-intracerebral-hemorrhage-presentation', type: 'narrative',
      target: 'spontaneous-cerebellar-intracerebral-hemorrhage-reassessment', atTick: 0,
      severity: 'critical', message: 'A previously independent 67-year-old woman developed witnessed abrupt vertigo, vomiting, dysarthria, and severe truncal ataxia 75 minutes ago. A supplied qualified examination reports that she is awake, oriented, and unable to sit or stand unsupported, with dysarthria and right-limb dysmetria but no authored weakness, sensory loss, seizure, trauma, or loss of consciousness. She is spontaneously breathing with a present cough. Temperature is 36.7°C, HR 78/min in sinus rhythm, RR 18/min, BP 168/92 mmHg (MAP 117), room-air SpO₂ 97%, and supplied glucose 112 mg/dL. No antithrombotic exposure is authored.' },
    { id: 'spontaneous-cerebellar-intracerebral-hemorrhage-boundary', type: 'narrative',
      target: 'spontaneous-cerebellar-intracerebral-hemorrhage-reassessment-boundary', atTick: 0,
      severity: 'warning', message: 'The stroke system is active. Fixed CT reports an 11 mL right cerebellar intracerebral hemorrhage with fourth-ventricle effacement but no initial hydrocephalus, brainstem compression, or herniation. No trauma or antithrombotic exposure is authored, but these are snapshots and hemorrhage cause, expansion, edema, hydrocephalus, airway deterioration, and outcome remain open. Reconcile the clock, deficits, alertness, physiology, and whole patient; review fixed imaging, location, causes, and immediate threats; recognize the confined posterior-fossa escalation boundary; then activate qualified neurocritical, neurosurgical, and airway-capable ownership. At a strict later report, she is increasingly drowsy after recurrent vomiting and opens her eyes to repeated voice; spontaneous breathing continues but the supplied cough is weaker. Temperature is 36.7°C, HR 82/min, RR 20/min, BP 176/96 mmHg (MAP 123), room-air SpO₂ 95%. Fixed repeat CT reports expansion to 14 mL with new obstructive hydrocephalus and brainstem compression; no herniation is authored. Qualified ownership is already active. After another elapsed interval, hand off the neurological and airway deterioration, imaging expansion, open etiology, and active unresolved risk. No drug, pressure target, reversal, airway device, drain, surgery, procedure, treatment, disposition, prognosis, or outcome is selected, delivered, predicted, or reported.' },
  ],
  debrief: { rubric: [
    { id: 'cerebellar-ich-reconcile', objectiveId: 'reconcile-neurology-cerebellar-ich-clock-deficit-alertness-and-whole-patient', question: 'Which clock, deficit, alertness, breathing, circulation, glucose, and whole-patient facts established the initial trajectory?' },
    { id: 'cerebellar-ich-imaging', objectiveId: 'review-neurology-cerebellar-ich-imaging-location-causes-and-immediate-threats', question: 'Which fixed posterior-fossa imaging facts and open threats required review?' },
    { id: 'cerebellar-ich-boundary', objectiveId: 'recognize-neurology-cerebellar-ich-posterior-fossa-escalation-boundary', question: 'Why did fourth-ventricle effacement in the confined posterior fossa require escalation before overt hydrocephalus?' },
    { id: 'cerebellar-ich-ownership', objectiveId: 'activate-neurology-cerebellar-ich-qualified-neurocritical-neurosurgical-and-airway-ownership', question: 'Why were neurocritical, neurosurgical, and airway-capable teams activated before the later deterioration?' },
    { id: 'cerebellar-ich-later', objectiveId: 'review-neurology-cerebellar-ich-strict-later-neurologic-and-airway-trajectory', question: 'Which strict-later neurological, airway, and imaging changes sharpened the danger boundary?' },
    { id: 'cerebellar-ich-handoff', objectiveId: 'handoff-neurology-cerebellar-ich-imaging-expansion-etiology-and-active-risk', question: 'Which expansion, cause, airway, procedural, and outcome questions remained unresolved at handoff?' },
  ] },
};
