/** Bounded adult severe-hyperkalemia pathway with authored ECG toxicity. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const HYPERKALEMIA_WITH_ECG_CHANGE: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'hyperkalemia-with-ecg-change', version: '0.1.0', maturity: 'draft',
    title: 'Hyperkalemia with ECG change', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 9, difficulty: 'advanced', objectives: [
      { id: 'recognize-severe-hyperkalemia-toxicity', statement: 'Confirm severe hyperkalemia, review the ECG and whole-patient state, and identify reversible drivers.', measure: 'The fixed potassium, ECG toxicity, CKD, medication, and dehydration pattern was integrated.' },
      { id: 'protect-heart-in-hyperkalemia', statement: 'Record immediate IV calcium-salt intent for ECG toxicity and repeat the ECG.', measure: 'Membrane stabilization preceded potassium-shifting treatment without claiming potassium reduction.' },
      { id: 'shift-potassium-and-protect-glucose', statement: 'Record insulin-glucose intent with structured glucose monitoring and an adjunct beta-2 agonist intent.', measure: 'Both bounded shifting paths followed calcium and retained the hypoglycemia boundary.' },
      { id: 'remove-potassium-and-control-cause', statement: 'Stop contributors, activate renal expertise, and record potassium-removal and dialysis-contingency intent.', measure: 'Definitive removal and cause control followed temporary shifting.' },
      { id: 'reassess-hyperkalemia-and-rebound', statement: 'Review fixed repeat potassium, ECG, glucose, and renal findings and continue rebound surveillance.', measure: 'Serial reassessment closed the pathway without mistaking early improvement for resolution.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'UK Kidney Association. Clinical Practice Guideline: Management of Hyperkalaemia in Adults. October 2023.',
        'Medicines and Healthcare products Regulatory Agency. Calcium chloride, calcium gluconate: potential risk of underdosing with calcium gluconate in severe hyperkalaemia. June 2023.',
      ],
    },
    limitations: ['hyperkalemia-potassium-ecg-and-response-are-authored',
      'hyperkalemia-calcium-shift-removal-and-monitoring-controls-are-proxies',
      'no-live-hyperkalemia-ecg-labs-dosing-dialysis-rebound-or-outcome'],
  },
  patient: {
    ageYears: 67, sex: 'male', heightCm: 175, weightKg: 82, asaClass: 4,
    diagnosis: 'Severe hyperkalemia with ECG toxicity in stage 4 chronic kidney disease',
    procedure: 'Emergency membrane stabilization, potassium shift, removal, and reassessment',
    comorbidities: ['Stage 4 chronic kidney disease', 'Hypertension'],
    medications: ['Lisinopril', 'Trimethoprim-sulfamethoxazole'],
    allergies: ['No known drug allergies'], fasting: 'Poor intake with diarrhea for 2 days',
    baseline: { heartRateBpm: 48, meanArterialMmHg: 80, strokeVolumeMl: 62,
      hemoglobinGPerDl: 12.0, bloodVolumeMl: 4900, coreTemperatureC: 36.8,
      arterialStiffness: 1.3, baroreflexGain: 0.7, fixedStrokeVolume: false },
    airway: { difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Alert, speaking clearly, and breathing spontaneously' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'],
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 500,
      respiratoryRateBpm: 18, freshGasFlowLPerMin: 10, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'hyperkalemia-presentation', type: 'narrative', target: 'hyperkalemia-with-ecg-change',
      atTick: 0, severity: 'critical', message: 'A 67-year-old with stage 4 CKD has weakness and palpitations after 2 days of diarrhea and poor intake while taking lisinopril and a new trimethoprim-sulfamethoxazole course. He is alert with HR 48/min and BP 104/68 mmHg. A nonhemolyzed repeat sample is fixed at potassium 7.1 mmol/L, glucose 108 mg/dL, bicarbonate 17 mmol/L, and creatinine 3.8 mg/dL. Authored ECG shows bradycardia, peaked T waves, P-wave flattening, and QRS 140 ms; no arrest is authored.' },
    { id: 'hyperkalemia-boundary', type: 'narrative', target: 'hyperkalemia-with-ecg-change-boundary',
      atTick: 0, severity: 'warning', message: 'Review ABCDE, the confirmed potassium and ECG, and drivers; record immediate local-protocol IV calcium-salt intent with repeat ECG; record insulin-glucose plus glucose surveillance and adjunct beta-2 agonist intent; stop contributors and activate renal expertise for removal and dialysis contingency; then reassess potassium, glucose, ECG, renal state, and rebound risk. Examination, specimen acquisition, ECG interpretation, calcium-salt or dose selection, medication delivery, potassium kinetics, dialysis, recurrence, disposition, and outcome are not simulated.' },
  ],
  debrief: { rubric: [
    { id: 'hyperkalemia-recognition', objectiveId: 'recognize-severe-hyperkalemia-toxicity', question: 'Which potassium, ECG, renal, medication, and volume findings established immediate toxicity?' },
    { id: 'hyperkalemia-calcium', objectiveId: 'protect-heart-in-hyperkalemia', question: 'Why did calcium precede shifting, and what did it not do?' },
    { id: 'hyperkalemia-shift', objectiveId: 'shift-potassium-and-protect-glucose', question: 'Which temporary shifting paths were recorded, and why did glucose surveillance matter?' },
    { id: 'hyperkalemia-removal', objectiveId: 'remove-potassium-and-control-cause', question: 'Why were cause control and potassium removal required despite shifting?' },
    { id: 'hyperkalemia-reassessment', objectiveId: 'reassess-hyperkalemia-and-rebound', question: 'Which fixed repeat findings improved, and why was the emergency not yet over?' },
  ] },
};
