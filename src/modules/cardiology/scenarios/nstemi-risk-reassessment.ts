/** Bounded serial-risk reassessment after confirmed NSTEMI. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const NSTEMI_RISK_REASSESSMENT: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'nstemi-risk-reassessment', version: '0.1.0', maturity: 'draft',
    title: 'NSTEMI risk reassessment', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 8, difficulty: 'intermediate', objectives: [
      { id: 'reconcile-nstemi-serial-trajectory', statement: 'Reconcile symptoms, serial ECG reports, and the assay-bounded high-sensitivity-troponin change.', measure: 'The complete authored trajectory was reviewed rather than one isolated result.' },
      { id: 'verify-nstemi-and-alternatives', statement: 'Verify the authored NSTEMI conclusion while preserving competing causes of myocardial injury.', measure: 'Clinical ischemia, dynamic evidence, assay context, and alternatives remained explicit.' },
      { id: 'screen-nstemi-very-high-risk-features', statement: 'Re-screen current symptoms, hemodynamics, heart failure, rhythm, arrest, mechanical complications, and dynamic ECG change.', measure: 'No current very-high-risk feature was assumed from the earlier presentation.' },
      { id: 'classify-nstemi-invasive-strategy', statement: 'Record ischemic- and bleeding-risk review before a region-specific inpatient invasive strategy.', measure: 'The plan used the authored high-risk tier without an exact score or universal clock.' },
      { id: 'record-nstemi-monitoring-and-handoff', statement: 'Record serial monitoring, change triggers, ownership, and the next reassessment.', measure: 'Deterioration triggers and handoff ownership remained visible after the plan.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Rao SV, O’Donoghue ML, Ruel M, et al. 2025 ACC/AHA/ACEP/NAEMSP/SCAI Guideline for the Management of Patients With Acute Coronary Syndromes. Circulation. 2025;151:e771-e862. PMID:40014670. doi:10.1161/CIR.0000000000001309.',
        'Byrne RA, Rossello X, Coughlan JJ, et al. 2023 ESC Guidelines for the management of acute coronary syndromes. Eur Heart J. 2023;44:3720-3826. PMID:37622654.',
      ] },
    limitations: ['nstemi-serial-findings-and-risk-tier-are-authored',
      'nstemi-controls-record-reassessment-and-plan-intent-only',
      'no-live-nstemi-testing-scoring-treatment-procedure-prognosis-or-outcome'],
  },
  patient: { ageYears: 67, sex: 'female', heightCm: 164, weightKg: 72, asaClass: 4,
    diagnosis: 'Authored confirmed NSTEMI with high-risk but no current very-high-risk feature',
    procedure: 'NSTEMI risk reassessment',
    comorbidities: ['Hypertension', 'Type 2 diabetes', 'Chronic kidney disease stage 3a'],
    medications: ['Medication reconciliation not represented'], allergies: ['No known drug allergies'],
    fasting: 'Inpatient; fasting and procedure preparation are not represented',
    baseline: { heartRateBpm: 88, meanArterialMmHg: 96, strokeVolumeMl: 65,
      hemoglobinGPerDl: 12.8, bloodVolumeMl: 4400, coreTemperatureC: 36.7,
      arterialStiffness: 1.25, baroreflexGain: 0.9, fixedStrokeVolume: false },
    airway: { difficulty: 0.15, difficultMaskVentilation: false,
      assessment: 'Alert, pain-free, speaking comfortably, without authored respiratory distress' },
    respiratory: { profile: 'healthy' } },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'],
    airwayDevice: 'facemask', ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 500,
      respiratoryRateBpm: 16, freshGasFlowLPerMin: 10, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'nstemi-risk-presentation', type: 'narrative', target: 'nstemi-risk-reassessment',
      atTick: 0, severity: 'warning', message: 'A 67-year-old woman had 25 minutes of central pressure 5 hours ago and is pain-free now. Fixed high-sensitivity troponin rises from 18 to 146 ng/L above the assay-specific 99th percentile. The initial 12-lead report shows horizontal ST depression in V4-V6; the repeat report shows new lateral T-wave inversion. HR is 88/min, BP 132/78 mmHg, SpO₂ 97% on room air, RR 16/min, and temperature 36.7°C. There is no authored shock, recurrent or refractory pain, acute heart failure, life-threatening arrhythmia, cardiac arrest, mechanical complication, or recurrent dynamic ST change.' },
    { id: 'nstemi-risk-boundary', type: 'narrative', target: 'nstemi-risk-reassessment-boundary',
      atTick: 0, severity: 'advisory', message: 'Reconcile the symptom, serial ECG-report, and assay-bounded troponin trajectory. The authored conclusion is confirmed NSTEMI with high-risk features and no current very-high-risk feature, but myocardial injury alternatives remain part of real assessment. Re-screen very-high-risk features now; do not inherit stability from an earlier observation. Review ischemic and bleeding risk, comorbidity, preference, and local capability before recording an inpatient invasive strategy whose exact timing follows the applicable region and pathway. Preserve serial monitoring, deterioration triggers, ownership, and the next reassessment. The screen does not examine, acquire or interpret tests, calculate a score, diagnose, prescribe or deliver treatment, choose a procedure, determine universal timing or disposition, or predict prognosis or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'nstemi-trajectory', objectiveId: 'reconcile-nstemi-serial-trajectory', question: 'What changed across symptoms, ECG reports, and assay-bounded troponin values?' },
    { id: 'nstemi-verification', objectiveId: 'verify-nstemi-and-alternatives', question: 'Why does the authored case conclude NSTEMI, and which myocardial-injury alternatives remain outside it?' },
    { id: 'nstemi-very-high-risk', objectiveId: 'screen-nstemi-very-high-risk-features', question: 'Which current findings would move the pathway to immediate escalation?' },
    { id: 'nstemi-invasive-strategy', objectiveId: 'classify-nstemi-invasive-strategy', question: 'How did ischemic risk, bleeding risk, patient context, and regional pathway shape invasive intent?' },
    { id: 'nstemi-handoff', objectiveId: 'record-nstemi-monitoring-and-handoff', question: 'Who owns the next reassessment, and which changes trigger escalation?' },
  ] },
};
