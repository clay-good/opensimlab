/** Bounded STEMI recognition and transfer lesson for a non-PCI cardiology clinic. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const STEMI_RECOGNITION_AND_FIRST_ACTIONS: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'stemi-recognition-and-first-actions', version: '0.1.1', maturity: 'preview',
    title: 'STEMI recognition and first actions', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 7, difficulty: 'introductory', objectives: [
      { id: 'reconcile-clinic-stemi-pattern', statement: 'Reconcile the ongoing symptom trajectory with the fixed diagnostic 12-lead report.', measure: 'Onset, persistence, associated symptoms, ECG report, and current physiology were reviewed together.' },
      { id: 'screen-clinic-stemi-danger', statement: 'Screen current stability, immediate complications, and dangerous alternatives in parallel with escalation.', measure: 'Shock, heart failure, rhythm and conduction, right-ventricular, mechanical, dissection, bleeding, allergy, and hypoxemia context remained visible.' },
      { id: 'activate-clinic-stemi-transfer', statement: 'Activate EMS and the regional STEMI system without waiting for biomarkers or a completed danger screen.', measure: 'Emergency transport, fixed-ECG transmission, and system-selected receiving-team pre-alert replaced self-transport and local delay.' },
      { id: 'record-clinic-stemi-bridge', statement: 'Record setting-bounded aspirin, monitoring, and transport-readiness intent.', measure: 'Aspirin suitability, rhythm and defibrillation readiness, access, and change triggers were reviewed without selecting downstream therapy.' },
      { id: 'reassess-clinic-stemi-handoff', statement: 'Reassess and hand off exact onset, ECG, physiology, allergy, medication, and change data.', measure: 'The receiving team got a concise trajectory while reperfusion, complications, and outcome remained open.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.1', sources: [
        'Rao SV, O’Donoghue ML, Ruel M, et al. 2025 ACC/AHA/ACEP/NAEMSP/SCAI Guideline for the Management of Patients With Acute Coronary Syndromes. Circulation. 2025;151:e771-e862. PMID:40014670. doi:10.1161/CIR.0000000000001309.',
        'Jacobs AK, Ali MJ, Best PJ, et al. Systems of Care for ST-Segment-Elevation Myocardial Infarction: A Policy Statement From the American Heart Association. Circulation. 2021;144:e310-e327. PMID:34641735. doi:10.1161/CIR.0000000000001025.',
        'Hewett Brumberg EK, Douma MJ, Alibertis K, et al. 2024 American Heart Association and American Red Cross Guidelines for First Aid. Circulation. 2024;150:e519-e579. PMID:39540278. doi:10.1161/CIR.0000000000001281.',
      ] },
    limitations: ['clinic-stemi-symptoms-ecg-and-stability-are-authored',
      'clinic-stemi-controls-record-escalation-transfer-and-bridge-intent-only',
      'no-live-ecg-testing-diagnosis-drug-delivery-reperfusion-disposition-or-outcome'],
  },
  patient: { ageYears: 61, sex: 'female', heightCm: 165, weightKg: 74, asaClass: 4,
    diagnosis: 'Authored inferior ST-elevation myocardial infarction',
    procedure: 'Recognition and first actions in a non-PCI cardiology clinic',
    comorbidities: ['Hypertension', 'Hyperlipidemia', 'Former tobacco use'],
    medications: ['Amlodipine', 'Rosuvastatin'], allergies: ['No known drug allergies'],
    fasting: 'Outpatient clinic; fasting status is not established',
    baseline: { heartRateBpm: 62, meanArterialMmHg: 93, strokeVolumeMl: 68,
      hemoglobinGPerDl: 13.1, bloodVolumeMl: 4500, coreTemperatureC: 36.7,
      arterialStiffness: 1.2, baroreflexGain: 0.95, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Alert, diaphoretic, and speaking complete sentences' },
    respiratory: { profile: 'healthy' } },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'],
    airwayDevice: 'facemask', ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 500,
      respiratoryRateBpm: 16, freshGasFlowLPerMin: 10, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'clinic-stemi-presentation', type: 'narrative',
      target: 'stemi-recognition-and-first-actions', atTick: 0, severity: 'critical',
      message: 'During a non-PCI cardiology-clinic visit, a 61-year-old woman reports 22 minutes of ongoing central pressure with diaphoresis and nausea. A fixed 12-lead report states ST elevation in II, III, and aVF with reciprocal depression in I and aVL, diagnostic of an acute inferior STEMI in this authored case. HR is 62/min, BP 128/76 mmHg, SpO₂ 96% on room air, and RR 16/min. She is alert with warm extremities. No shock, acute heart failure, sustained arrhythmia, syncope, new murmur, pulse or neurologic asymmetry, active bleeding, aspirin allergy, or recent aspirin use is authored. Right-ventricular involvement and evolving bradyarrhythmia or atrioventricular block remain open receiving-pathway questions.' },
    { id: 'clinic-stemi-boundary', type: 'narrative',
      target: 'stemi-recognition-and-first-actions-boundary', atTick: 0,
      severity: 'warning', message: 'Reconcile the ongoing symptom and fixed diagnostic ECG trajectory. Then activate EMS and the regional STEMI system immediately while screening stability, complications, and dangerous alternatives in parallel. Do not use private transport or delay for a completed checklist, biomarkers, or paperwork. Transmit the fixed ECG and pre-alert the receiving team selected by that system. Record protocol-bounded aspirin, monitoring, defibrillation-readiness, access, and transport intent; oxygen is not routine at the authored SpO₂. After the next engine tick, reassess and hand off exact onset, ECG, physiology, allergy, medication, and change data. The controls do not examine, acquire or interpret an ECG or test, diagnose a real patient, prescribe or deliver aspirin or another drug, select P2Y12 inhibition, anticoagulation, fibrinolysis, PCI, nitrate, or opioid therapy, perform a procedure, determine disposition, or predict complications or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'clinic-stemi-pattern', objectiveId: 'reconcile-clinic-stemi-pattern', question: 'Which symptom, timing, fixed ECG, and physiology facts establish the authored time-sensitive pattern?' },
    { id: 'clinic-stemi-danger', objectiveId: 'screen-clinic-stemi-danger', question: 'Which instability, complication, alternative, bleeding, allergy, and oxygenation findings matter during escalation?' },
    { id: 'clinic-stemi-transfer', objectiveId: 'activate-clinic-stemi-transfer', question: 'Why did EMS and receiving-center activation proceed without biomarkers or self-transport?' },
    { id: 'clinic-stemi-bridge', objectiveId: 'record-clinic-stemi-bridge', question: 'What belongs in the clinic bridge, and which antithrombotic or reperfusion choices stay with the regional pathway?' },
    { id: 'clinic-stemi-handoff', objectiveId: 'reassess-clinic-stemi-handoff', question: 'Which exact trajectory and change facts must travel with the patient?' },
  ] },
};
