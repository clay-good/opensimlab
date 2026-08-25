/** Hemodynamically stable anterior STEMI with bounded immediate reperfusion preparation. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const STEMI: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'stemi', version: '0.1.0', maturity: 'draft', title: 'STEMI',
    author: 'Open Sim Lab', license: 'CC BY-SA 4.0', estimatedMinutes: 8,
    difficulty: 'introductory',
    objectives: [
      { id: 'recognize-stemi-pattern', statement: 'Integrate symptom timing, a fixed diagnostic 12-lead ECG, hemodynamics, oxygenation, and immediate mimics into a STEMI recognition pattern.', measure: 'The fixed presentation and urgent alternatives were reviewed before treatment.' },
      { id: 'activate-stemi-reperfusion', statement: 'Activate the STEMI pathway and record immediate primary-PCI intent without waiting for biomarker results.', measure: 'Reperfusion-system activation followed recognition.' },
      { id: 'record-stemi-antithrombotic-intent', statement: 'Record an initial aspirin loading dose plus P2Y12-inhibitor and parenteral-anticoagulation intents for the authored primary-PCI pathway.', measure: 'The bounded antithrombotic sequence was completed.' },
      { id: 'reassess-and-handoff-stemi', statement: 'Reassess symptoms, pressure, perfusion, rhythm, oxygenation, and complications before a declared reperfusion handoff.', measure: 'Serial reassessment followed pathway activation and antithrombotic intent.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Rao SV, et al. 2025 ACC/AHA/ACEP/NAEMSP/SCAI Guideline for the Management of Patients With Acute Coronary Syndromes. Circulation. 2025;151:e771-e862. doi:10.1161/CIR.0000000000001309.',
        'Gulati M, et al. 2021 Guideline for the Evaluation and Diagnosis of Chest Pain. Circulation. 2021;144:e368-e454. doi:10.1161/CIR.0000000000001029.',
        'Lawton JS, et al. 2021 Guideline for Coronary Artery Revascularization. Circulation. 2022;145:e18-e114. doi:10.1161/CIR.0000000000001038.',
      ],
    },
    limitations: ['stemi-findings-are-authored', 'stemi-reperfusion-and-antithrombotics-are-intent-controls',
      'no-stemi-procedure-complication-disposition-or-outcome'],
  },
  patient: {
    ageYears: 58, sex: 'male', heightCm: 178, weightKg: 88, asaClass: 4,
    diagnosis: 'Anterior ST-elevation myocardial infarction',
    procedure: 'Emergency recognition and immediate reperfusion preparation for STEMI',
    comorbidities: ['Hypertension', 'Hyperlipidemia'], medications: ['Losartan', 'Atorvastatin'],
    allergies: ['No known drug allergies'], fasting: 'Not established in the emergency department',
    baseline: { heartRateBpm: 104, meanArterialMmHg: 110, strokeVolumeMl: 64,
      hemoglobinGPerDl: 14.2, bloodVolumeMl: 5200, coreTemperatureC: 36.7,
      arterialStiffness: 1.2, baroreflexGain: 0.9, fixedStrokeVolume: false },
    airway: { difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Alert, diaphoretic, speaking full sentences, with no respiratory distress' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'capnography', 'pulse-oximetry', 'temperature'],
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 500,
      respiratoryRateBpm: 20, delivering: false } },
  formulary: [],
  timeline: [{ id: 'stemi-boundary', type: 'narrative', target: 'stemi', atTick: 0,
    severity: 'critical', message: 'A fixed anterior STEMI pattern is present in a hemodynamically stable patient 45 minutes after symptom onset. Review symptoms, the authored 12-lead ECG, pressure, oxygenation, immediate mimics, and contraindications; activate the STEMI reperfusion pathway; record bounded antithrombotic intents; then reassess and hand off. Test acquisition, live ECG interpretation, drug selection beyond the stated intents, PCI or fibrinolysis selection outside the authored PCI-capable setting, procedure performance, complications, disposition, and outcome are outside this vignette.' }],
  debrief: { rubric: [
    { id: 'stemi-pattern', objectiveId: 'recognize-stemi-pattern', question: 'Which symptom, timing, ECG, pressure, oxygenation, and alternative-diagnosis findings established the urgent pattern?' },
    { id: 'stemi-reperfusion', objectiveId: 'activate-stemi-reperfusion', question: 'Why did pathway activation and primary-PCI intent proceed without waiting for biomarkers?' },
    { id: 'stemi-antithrombotics', objectiveId: 'record-stemi-antithrombotic-intent', question: 'How were aspirin, P2Y12 inhibition, anticoagulation, bleeding risk, and PCI preparation bounded?' },
    { id: 'stemi-handoff', objectiveId: 'reassess-and-handoff-stemi', question: 'Which serial findings and complications needed review before reperfusion handoff?' },
  ] },
};
