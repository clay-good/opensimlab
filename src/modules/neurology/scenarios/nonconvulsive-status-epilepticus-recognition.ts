/** Nonconvulsive status suspicion, urgent qualified EEG, and report-based recognition. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const NONCONVULSIVE_STATUS_EPILEPTICUS_RECOGNITION: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'nonconvulsive-status-epilepticus-recognition', version: '0.1.0', maturity: 'preview',
    title: 'Nonconvulsive status epilepticus recognition', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 7, difficulty: 'advanced', objectives: [
      { id: 'reconcile-neurology-ncse-clock-fluctuation-subtle-signs-and-whole-patient', statement: 'Reconcile the supplied clock, fluctuating cognition and language, subtle recurrent signs, physiology, and whole-patient state.', measure: 'The fixed 95-minute trajectory, intermittent speech arrest, inattention, gaze deviation, breathing, circulation, glucose, sodium, and imaging record were connected without learner history, examination, monitoring, testing, diagnosis, or treatment.' },
      { id: 'recognize-neurology-ncse-suspicion-and-urgent-eeg-boundary-without-clinical-diagnosis', statement: 'Recognize a nonconvulsive-seizure suspicion and urgent EEG boundary without diagnosing NCSE clinically.', measure: 'Fluctuating unexplained dysfunction and subtle recurrent signs prompted urgent qualified EEG while stroke, metabolic, toxic, infectious, medication, delirium, postictal, and other alternatives remained open.' },
      { id: 'activate-neurology-ncse-qualified-neurology-eeg-and-airway-capable-ownership', statement: 'Activate qualified neurology, EEG, resuscitation, and airway-capable ownership.', measure: 'Named ownership followed suspicion without learner EEG acquisition or interpretation, drug, dose, route, access, oxygen, airway-device, monitoring, or procedure controls.' },
      { id: 'review-neurology-ncse-airway-glucose-vascular-metabolic-toxic-and-infectious-alternatives', statement: 'Review airway, glucose, vascular, metabolic, toxic, infectious, medication, and delirium alternatives in parallel.', measure: 'Supplied snapshots were integrated without treating fixed negatives as permanent exclusions or delaying urgent qualified EEG.' },
      { id: 'review-neurology-ncse-strict-later-qualified-eeg-and-clinical-trajectory', statement: 'At a strict later report, review the qualified EEG conclusion with the clinical trajectory.', measure: 'A fixed neurophysiologist report of electrographic status without a motor correlate was integrated with persistent fluctuation without learner raw-tracing interpretation, diagnosis from symptoms alone, or treatment-effect claim.' },
      { id: 'handoff-neurology-ncse-cause-treatment-recurrence-and-active-risk', statement: 'After another elapsed interval, hand off reported electrographic status, cause, treatment, recurrence, airway, and active risk.', measure: 'The handoff preserved qualified ownership and unresolved clinical correlation, cause, treatment choice, seizure burden, recurrence, recovery, disposition, prognosis, and outcome.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Herman ST, Abend NS, Bleck TP, et al. Consensus Statement on Continuous EEG in Critically Ill Adults and Children, Part I: Indications. J Clin Neurophysiol. 2015;32:87-95. doi:10.1097/WNP.0000000000000166.',
        'Hirsch LJ, Fong MWK, Leitinger M, et al. American Clinical Neurophysiology Society Standardized Critical Care EEG Terminology: 2021 Version. J Clin Neurophysiol. 2021;38:1-29. doi:10.1097/WNP.0000000000000806.',
        'Leitinger M, Trinka E, Gardella E, et al. Diagnostic accuracy of the Salzburg EEG criteria for non-convulsive status epilepticus. Lancet Neurol. 2016;15:1054-1062. doi:10.1016/S1474-4422(16)30137-5.',
      ],
    },
    limitations: [
      'ncse-clock-fluctuation-signs-imaging-eeg-and-later-state-are-authored',
      'ncse-controls-reconcile-suspect-activate-review-reassess-and-handoff-only',
      'no-live-ncse-exam-monitor-test-eeg-interpretation-drug-airway-procedure-or-outcome',
    ],
  },
  patient: {
    ageYears: 72, sex: 'female', heightCm: 162, weightKg: 64, asaClass: 4,
    diagnosis: 'Authored fluctuating language and awareness with later qualified electrographic-status report',
    procedure: 'calm nonconvulsive-status suspicion, urgent qualified EEG ownership, report review, and active-risk handoff',
    comorbidities: ['Previously independent', 'Hypertension'], medications: ['Medication record under qualified review'],
    allergies: ['No known drug allergies'], fasting: 'Not established during acute neurological evaluation',
    baseline: { heartRateBpm: 88, meanArterialMmHg: 102, strokeVolumeMl: 62,
      hemoglobinGPerDl: 12.9, bloodVolumeMl: 4_400, coreTemperatureC: 36.9,
      arterialStiffness: 1.2, baroreflexGain: 0.75, fixedStrokeVolume: false },
    airway: { difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Spontaneous breathing, present cough, and secretion handling are authored at the initial snapshot' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 410, respiratoryRateBpm: 17,
      freshGasFlowLPerMin: 0.5, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'nonconvulsive-status-epilepticus-recognition-presentation', type: 'narrative',
      target: 'nonconvulsive-status-epilepticus-recognition-reassessment', atTick: 0,
      severity: 'critical', message: 'A previously independent 72-year-old woman has 95 minutes of fluctuating language and interaction. A qualified witness and examination record describes alternating short fluent phrases, perseveration, 20-to-40-second periods of speech arrest, inattention, and 15-to-25-second rightward gaze deviation with return toward midline. She opens her eyes spontaneously and intermittently follows one-step commands. No bilateral convulsion, sustained unilateral clonus, loss of posture, or meaningful return to her usual baseline is reported. Temperature is 36.9°C, HR 88/min in sinus rhythm, RR 17/min, BP 148/78 mmHg (MAP 102), pulse-coherent room-air SpO2 97%, supplied glucose 108 mg/dL, and supplied sodium 138 mmol/L. A central pulse, spontaneous breathing, present cough, secretion handling, warm perfusion, and 2-second refill are reported.' },
    { id: 'nonconvulsive-status-epilepticus-recognition-boundary', type: 'narrative',
      target: 'nonconvulsive-status-epilepticus-recognition-reassessment-boundary', atTick: 0,
      severity: 'warning', message: 'Fixed noncontrast CT reports no hemorrhage or established large infarct, and fixed CTA reports no large-vessel occlusion. No fever, hypoglycemia, major electrolyte disturbance, known toxin exposure, newly reported sedative exposure, witnessed convulsion, trauma, or pre-event focal deficit is authored, but these are snapshots. Ischemia, postictal dysfunction, delirium, medication, toxic, metabolic, infectious, immune, structural, psychiatric, and other causes remain open. Reconcile the clock, fluctuation, subtle recurrent signs, physiology, and whole patient; recognize a nonconvulsive-seizure suspicion and urgent EEG boundary without diagnosing NCSE from clinical features; activate qualified neurology, EEG, resuscitation, and airway-capable ownership; and review airway, glucose, vascular, metabolic, toxic, infectious, medication, and delirium alternatives in parallel. At a strict later fixed 60-minute recording report, a qualified neurophysiologist reports recurrent evolving left temporal electrographic seizures totaling 24 minutes without a consistent motor correlate and states that the record meets the ACNS electrographic-status definition. The patient still fluctuates between short phrases, speech arrest, inattention, and intermittent command following; no convulsion or sustained clonus is reported. T 37.0°C, HR 92/min, RR 18/min, BP 144/76 mmHg (MAP 99), and pulse-coherent room-air SpO2 96%; spontaneous breathing and cough remain present. This is a supplied report, not learner raw-EEG interpretation, and clinical correlation, cause, treatment, response, recurrence, and outcome remain open. After another elapsed interval, hand off reported electrographic status, clinical trajectory, airway risk, causes, treatment choice, seizure burden, recurrence, recovery, disposition, and outcome uncertainty. No history, examination, seizure timing, monitoring, glucose or sodium acquisition, EEG placement, acquisition or interpretation, imaging or laboratory test, diagnosis from symptoms alone, drug, dose, route, access, oxygen, airway device, infusion, anesthetic, procedure, treatment, disposition, prognosis, or outcome is learner controlled, predicted, or reported.' },
  ],
  debrief: { rubric: [
    { id: 'ncse-trajectory', objectiveId: 'reconcile-neurology-ncse-clock-fluctuation-subtle-signs-and-whole-patient', question: 'Which clock, fluctuation, subtle-sign, physiology, and whole-patient facts established the trajectory?' },
    { id: 'ncse-suspicion', objectiveId: 'recognize-neurology-ncse-suspicion-and-urgent-eeg-boundary-without-clinical-diagnosis', question: 'Why did the pattern require urgent qualified EEG without making a clinical-only NCSE diagnosis?' },
    { id: 'ncse-ownership', objectiveId: 'activate-neurology-ncse-qualified-neurology-eeg-and-airway-capable-ownership', question: 'Why were neurology, EEG, resuscitation, and airway-capable owners activated early?' },
    { id: 'ncse-alternatives', objectiveId: 'review-neurology-ncse-airway-glucose-vascular-metabolic-toxic-and-infectious-alternatives', question: 'Which safety threats and alternative causes remained active while EEG was pursued?' },
    { id: 'ncse-later', objectiveId: 'review-neurology-ncse-strict-later-qualified-eeg-and-clinical-trajectory', question: 'What did the qualified later report establish, and what did it leave unresolved?' },
    { id: 'ncse-handoff', objectiveId: 'handoff-neurology-ncse-cause-treatment-recurrence-and-active-risk', question: 'Which electrographic-status, cause, treatment, recurrence, airway, recovery, and outcome risks required handoff?' },
  ] },
};
