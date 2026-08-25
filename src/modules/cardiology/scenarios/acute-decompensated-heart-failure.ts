/** Bounded inpatient decongestion and transition reassessment. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const ACUTE_DECOMPENSATED_HEART_FAILURE: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'acute-decompensated-heart-failure', version: '0.1.0', maturity: 'draft',
    title: 'Acute decompensated heart failure', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 8, difficulty: 'intermediate', objectives: [
      { id: 'reconcile-heart-failure-congestion-and-perfusion', statement: 'Reconcile the authored congestion, oxygenation, pressure, and perfusion trajectory after admission.', measure: 'Current status was read as a whole rather than from weight, creatinine, or one symptom alone.' },
      { id: 'review-heart-failure-diuretic-response', statement: 'Review serial symptoms, weight, intake and output, urine output, and examination claims after reported diuretic treatment.', measure: 'Partial response and persistent congestion remained visible without calculating a dose or target.' },
      { id: 'review-heart-failure-tolerance-and-precipitant', statement: 'Review kidney function, electrolytes, hemodynamic tolerance, and the authored precipitant context.', measure: 'A small creatinine change was interpreted with the whole decongestion trajectory, and precipitant review stayed explicit.' },
      { id: 'record-heart-failure-transition-intent', statement: 'Record individualized decongestion, oral-transition, and guideline-directed-therapy review intent.', measure: 'The transition plan preserved contraindications, patient context, access, education, and follow-up without prescribing.' },
      { id: 'reassess-heart-failure-discharge-readiness', statement: 'Reassess residual congestion, stability, self-management needs, medication ownership, and early follow-up.', measure: 'Persistent congestion prevented a discharge-ready declaration and ownership of the next reassessment was recorded.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Heidenreich PA, Bozkurt B, Aguilar D, et al. 2022 AHA/ACC/HFSA Guideline for the Management of Heart Failure. Circulation. 2022;145:e895-e1032. PMID:35363499. doi:10.1161/CIR.0000000000001063.',
        'McDonagh TA, Metra M, Adamo M, et al. 2021 ESC Guidelines for the diagnosis and treatment of acute and chronic heart failure. Eur Heart J. 2021;42:3599-3726. PMID:34447992. doi:10.1093/eurheartj/ehab368.',
      ] },
    limitations: ['heart-failure-status-response-and-precipitant-are-authored',
      'heart-failure-controls-record-review-and-transition-intent-only',
      'no-live-heart-failure-exam-testing-dosing-treatment-disposition-prognosis-or-outcome'],
  },
  patient: { ageYears: 74, sex: 'male', heightCm: 175, weightKg: 75.8, asaClass: 4,
    diagnosis: 'Authored acute decompensated HFrEF with partial decongestion and residual congestion',
    procedure: 'Inpatient decongestion and transition reassessment',
    comorbidities: ['HFrEF with LVEF 30%', 'Hypertension', 'Chronic kidney disease stage 2'],
    medications: ['Medication reconciliation and administration are not represented'],
    allergies: ['No known drug allergies'],
    fasting: 'Inpatient; fasting and procedure preparation are not represented',
    baseline: { heartRateBpm: 84, meanArterialMmHg: 88, strokeVolumeMl: 58,
      hemoglobinGPerDl: 12.5, bloodVolumeMl: 5000, coreTemperatureC: 36.8,
      arterialStiffness: 1.25, baroreflexGain: 0.9, fixedStrokeVolume: false },
    airway: { difficulty: 0.15, difficultMaskVentilation: false,
      assessment: 'Alert, warm, speaking full sentences, and still orthopneic with fixed bibasal crackle and edema claims' },
    respiratory: { profile: 'healthy' } },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'],
    airwayDevice: 'facemask', ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 500,
      respiratoryRateBpm: 18, freshGasFlowLPerMin: 10, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'heart-failure-presentation', type: 'narrative',
      target: 'acute-decompensated-heart-failure', atTick: 0, severity: 'warning',
      message: 'A 74-year-old man with HFrEF (fixed LVEF report 30%) is 24 hours into admission after missed home medications and a high-sodium week. Reported IV loop-diuretic treatment has already occurred. Weight changed from 77.2 to 75.8 kg versus a documented clinic weight of 72.0 kg; recorded net balance is −1.6 L with 2.4 L urine output. Dyspnea is improved, but he remains orthopneic with authored JVP elevation, bibasal crackles, and 2+ leg edema. HR is 84/min, BP 118/73 mmHg, SpO₂ 94% on room air, RR 18/min, and extremities are warm. Fixed creatinine changed from 1.1 to 1.3 mg/dL, sodium is 137 mmol/L, potassium 3.7 mmol/L, and magnesium 1.9 mg/dL. There is no authored shock, ischemia, dangerous rhythm, infection, or respiratory failure.' },
    { id: 'heart-failure-boundary', type: 'narrative',
      target: 'acute-decompensated-heart-failure-boundary', atTick: 0, severity: 'advisory',
      message: 'Reconcile congestion and perfusion, then judge the reported decongestion response across symptoms, weight, fluid balance, urine output, and fixed examination claims. Review kidney and electrolyte context, hemodynamic tolerance, adherence and sodium exposure, and other real-world precipitants before recording individualized decongestion, oral-transition, and guideline-directed-therapy review intent. This persistent congestion means the authored snapshot is not discharge-ready. Record education, medication and monitoring ownership, change triggers, and early follow-up before the next reassessment. The screen does not examine, acquire or interpret tests, calculate a dry weight, fluid target, dose, or score, diagnose, prescribe or deliver treatment, select a regimen, determine disposition or prognosis, or predict outcome.' },
  ],
  debrief: { rubric: [
    { id: 'heart-failure-status', objectiveId: 'reconcile-heart-failure-congestion-and-perfusion', question: 'Which fixed findings describe congestion, oxygenation, pressure, and perfusion now?' },
    { id: 'heart-failure-response', objectiveId: 'review-heart-failure-diuretic-response', question: 'Which serial changes show response, and which findings show residual congestion?' },
    { id: 'heart-failure-tolerance', objectiveId: 'review-heart-failure-tolerance-and-precipitant', question: 'How should kidney, electrolyte, hemodynamic, and precipitant context shape the next review?' },
    { id: 'heart-failure-transition', objectiveId: 'record-heart-failure-transition-intent', question: 'What belongs in a safe individualized decongestion and oral-transition plan?' },
    { id: 'heart-failure-readiness', objectiveId: 'reassess-heart-failure-discharge-readiness', question: 'What prevents discharge readiness, and who owns the next reassessment and follow-up?' },
  ] },
};
