/** Bounded stable atrial-fibrillation reassessment with separate stroke prevention. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const ATRIAL_FIBRILLATION_WITH_RAPID_RESPONSE: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'atrial-fibrillation-with-rapid-response', version: '0.1.0', maturity: 'draft',
    title: 'Atrial fibrillation with rapid response', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 8, difficulty: 'intermediate', objectives: [
      { id: 'reconcile-af-rvr-rhythm-and-stability', statement: 'Reconcile the authored irregular narrow-complex rhythm report with current hemodynamics, perfusion, ischemia, and heart-failure features.', measure: 'The learner separated stable rapid AF from an unstable tachycardia pathway without using heart rate alone.' },
      { id: 'review-af-rvr-context-and-triggers', statement: 'Review symptom and rhythm duration, prior AF, adherence, comorbidities, ventricular function, and reversible contributors.', measure: 'Uncertain duration and the fixed trigger screen remained visible before rate or rhythm strategy.' },
      { id: 'record-af-rvr-rate-control-intent', statement: 'Record patient-specific acute rate-control intent using stability, ventricular function, comorbidity, contraindications, and symptoms.', measure: 'A bounded rate-control plan was recorded without selecting an agent, dose, or universal target.' },
      { id: 'record-af-rvr-stroke-prevention-intent', statement: 'Review validated thromboembolic risk, bleeding context, preferences, and cardioversion implications separately from rate control.', measure: 'Stroke-prevention intent remained independent of symptom or rate improvement and no exact score was supplied.' },
      { id: 'reassess-af-rvr-trajectory-and-follow-up', statement: 'Reassess rhythm, rate, pressure, symptoms, perfusion, and heart failure, then record monitoring and longitudinal ownership.', measure: 'The fixed lower-rate response remained AF and closed with change triggers, owner, and follow-up.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Joglar JA, Chung MK, Armbruster AL, et al. 2023 ACC/AHA/ACCP/HRS Guideline for the Diagnosis and Management of Atrial Fibrillation. Circulation. 2024;149:e1-e156. PMID:38033089. doi:10.1161/CIR.0000000000001193.',
        'Chyou JY, Barkoudah E, Dukes JW, et al. Atrial Fibrillation Occurring During Acute Hospitalization: A Scientific Statement From the American Heart Association. Circulation. 2023;147:e676-e698. PMID:36912134. doi:10.1161/CIR.0000000000001133.',
      ] },
    limitations: ['af-rvr-rhythm-duration-risk-and-response-are-authored',
      'af-rvr-controls-record-review-and-plan-intent-only',
      'no-live-af-rvr-ecg-scoring-prescribing-cardioversion-prognosis-or-outcome'],
  },
  patient: { ageYears: 69, sex: 'female', heightCm: 165, weightKg: 78, asaClass: 3,
    diagnosis: 'Authored hemodynamically stable atrial fibrillation with rapid ventricular response',
    procedure: 'Stable rapid atrial-fibrillation reassessment',
    comorbidities: ['Hypertension', 'Type 2 diabetes'],
    medications: ['Medication reconciliation and adherence are not represented'],
    allergies: ['No known drug allergies'], fasting: 'Not relevant to this bounded reassessment',
    baseline: { heartRateBpm: 142, meanArterialMmHg: 87, strokeVolumeMl: 49,
      hemoglobinGPerDl: 13.2, bloodVolumeMl: 4900, coreTemperatureC: 36.7,
      arterialStiffness: 1.2, baroreflexGain: 0.85, fixedStrokeVolume: false },
    airway: { difficulty: 0.15, difficultMaskVentilation: false,
      assessment: 'Alert, speaking comfortably, warm, and without authored respiratory distress' },
    respiratory: { profile: 'healthy' } },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'],
    airwayDevice: 'facemask', ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 500,
      respiratoryRateBpm: 18, freshGasFlowLPerMin: 10, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'af-rvr-rhythm', type: 'rhythm-change', target: 'atrial-fibrillation', atTick: 0,
      severity: 'warning', message: 'The teaching monitor displays an irregularly irregular narrow-complex rhythm; a fixed diagnostic 12-lead report names atrial fibrillation.' },
    { id: 'af-rvr-presentation', type: 'narrative', target: 'atrial-fibrillation-with-rapid-response',
      atTick: 0, severity: 'warning', message: 'A 69-year-old woman reports palpitations noticed 6 hours ago, but her last symptom-free check was 3 days ago, so AF duration is uncertain. A fixed diagnostic 12-lead report names an irregular narrow-complex rhythm at 142/min without pre-excitation or acute ischemic change. HR is 142/min, BP 119/71 mmHg, SpO₂ 97% on room air, RR 18/min, and she is alert with warm extremities. There is no authored hypotension, shock, ischemic discomfort, acute heart failure, syncope, or altered mentation. Fixed LVEF report is 55%; hemoglobin, potassium, magnesium, TSH, and temperature are within the authored reference ranges. No infection, alcohol binge, stimulant exposure, medication change, or missed-dose conclusion is supplied.' },
    { id: 'af-rvr-boundary', type: 'narrative', target: 'atrial-fibrillation-with-rapid-response-boundary',
      atTick: 0, severity: 'advisory', message: 'Reconcile rhythm and stability before acting on rate. Review symptom and rhythm duration, prior AF, medications and adherence, ventricular function, comorbidities, and acute contributors. Record patient-specific rate-control intent using hemodynamics, ventricular function, contraindications, and symptoms without selecting an agent, dose, or universal target. Review validated thromboembolic risk, bleeding context, preferences, and cardioversion implications on a separate lane; rate improvement does not remove AF or stroke-prevention questions. Then reassess the fixed lower-rate response and record monitoring, change triggers, ownership, and follow-up. The screen does not acquire or interpret an ECG or test, calculate a score, diagnose, prescribe or deliver medication, select a rate or rhythm agent, perform cardioversion, determine anticoagulation or cardioversion eligibility, disposition, prognosis, or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'af-rvr-stability', objectiveId: 'reconcile-af-rvr-rhythm-and-stability', question: 'Which authored findings support stable rapid AF, and which changes would make it unstable?' },
    { id: 'af-rvr-context', objectiveId: 'review-af-rvr-context-and-triggers', question: 'How did uncertain duration, prior history, ventricular function, and contributor review shape the plan?' },
    { id: 'af-rvr-rate', objectiveId: 'record-af-rvr-rate-control-intent', question: 'Which patient factors belong in acute rate-control selection and reassessment?' },
    { id: 'af-rvr-stroke', objectiveId: 'record-af-rvr-stroke-prevention-intent', question: 'Why does thromboembolic and bleeding review remain separate from rate improvement?' },
    { id: 'af-rvr-reassessment', objectiveId: 'reassess-af-rvr-trajectory-and-follow-up', question: 'What changed, what remained AF, and who owns the next reassessment?' },
  ] },
};
