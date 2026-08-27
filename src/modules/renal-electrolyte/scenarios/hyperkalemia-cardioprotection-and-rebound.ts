import type { Scenario } from '@anesthesia/scenarios/types';

export const RENAL_HYPERKALEMIA_CARDIOPROTECTION_AND_REBOUND: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'hyperkalemia-cardioprotection-and-rebound', version: '0.1.0', maturity: 'preview',
    title: 'Hyperkalemia: protection is not removal', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 60, difficulty: 'intermediate',
    objectives: [
      { id: 'renal-hyperkalemia-protection', statement: 'Protect the heart without mistaking ECG improvement for potassium removal.', measure: 'Arrange qualified calcium treatment promptly and reassess its temporary ECG benefit. Urgent treatment does not wait for an administrative review click; waveform morphology cannot establish potassium safety.' },
      { id: 'renal-hyperkalemia-shift', statement: 'Distinguish temporary shifting from potassium elimination.', measure: 'Arrange qualified insulin-glucose care with supplied baseline glucose verification, prevention measures, and continuing surveillance. Compare a temporary response with the later rebound branch without inferring total-body potassium removal.' },
      { id: 'renal-hyperkalemia-removal', statement: 'Establish individualized removal and renal ownership.', measure: 'Review kidney trajectory, volume, urine output, and contributing medications with renal or critical-care support. Distinguish planning from qualified delivered elimination care; no automatic dialysis, diuresis, or universal medication cessation is prescribed.' },
      { id: 'renal-hyperkalemia-reassessment', statement: 'Keep ECG, glucose, and full reassessments distinct.', measure: 'Obtain fresh potassium, glucose, ECG, and bedside findings after care. An ECG-only or glucose-only observation must retain the older potassium result. Improved ECG findings cannot justify stopping surveillance.' },
      { id: 'renal-hyperkalemia-handoff', statement: 'Transfer unresolved risk and continued surveillance.', measure: 'Hand off current findings, elimination progress, repeat cardiac protection if indicated, and ongoing potassium and glucose monitoring. Earlier incomplete care remains visible but does not prevent later appropriate handoff.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED', competingInterests: 'None declared',
      reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0',
      sources: [
        'UK Kidney Association. Clinical Practice Guideline: Management of Hyperkalaemia in Adults. December 2023. Sections 16–17 and 19: calcium, shifting, elimination, serial potassium and glucose surveillance, and individualized renal or critical-care decisions. No dose or universal schedule is reproduced.',
        'Lindner G, Burdmann EA, Clase CM, et al. Acute hyperkalemia in the emergency department: a summary from a Kidney Disease: Improving Global Outcomes conference. European Journal of Emergency Medicine. 2020;27:329–337. doi:10.1097/MEJ.0000000000000691. Temporary calcium benefit, shifting without total-body removal, and rebound surveillance; a conference report, not a newly issued guideline.',
        'Resuscitation Council UK. 2025 Resuscitation Guidelines: Special circumstances, Hyperkalaemia. Qualified calcium for severe hyperkalemia with ECG changes, insulin-glucose shifting, elimination, and individualized dialysis consideration for refractory severe hyperkalemia. This lesson concerns a perfusing adult, not cardiac arrest.',
      ],
    },
    limitations: ['renal-hyperkalemia-authored-contrasts', 'renal-hyperkalemia-individualized-care', 'renal-hyperkalemia-observed-findings'],
  },
  patient: {
    ageYears: 68, sex: 'male', heightCm: 175, weightKg: 78, asaClass: 3,
    diagnosis: 'Confirmed severe hyperkalemia with ECG changes in chronic kidney disease and superimposed acute kidney injury',
    procedure: 'Cardiac protection, shifting, individualized elimination, serial reassessment, and handoff',
    comorbidities: ['Stage 4 chronic kidney disease; not receiving maintenance dialysis', 'Recent poor intake and dehydration-associated acute kidney injury; cause and volume status require qualified reassessment'],
    medications: ['Lisinopril; individualized medication and illness review is required'],
    allergies: ['No known drug allergies'], fasting: 'Not an elective fasting lesson; intake and volume plans require bedside assessment',
    baseline: { heartRateBpm: 48, meanArterialMmHg: 79, strokeVolumeMl: 70, hemoglobinGPerDl: 12,
      bloodVolumeMl: 5000, coreTemperatureC: 36.7, arterialStiffness: 1, baroreflexGain: 1, fixedStrokeVolume: true },
    airway: { difficulty: 0.1, difficultMaskVentilation: false, assessment: 'Awake with generalized weakness and a patent airway; circulation is preserved' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], ventilator: { mode: 'manual', fio2: 0.21,
    tidalVolumeMl: 450, respiratoryRateBpm: 18, freshGasFlowLPerMin: 10, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'renal-hyperkalemia-presentation', type: 'narrative', target: 'renal-hyperkalemia', atTick: 0, severity: 'critical',
      message: 'A fictional 68-year-old man with stage 4 CKD, recent poor intake, and superimposed AKI has generalized weakness and new ECG conduction changes. Confirmed nonhemolyzed potassium is 6.9 mmol/L; supplied glucose is 108 mg/dL. He is awake with a pulse, BP 110/64 mmHg, HR 48/min, RR 18/min, SpO2 98%, and temperature 36.7°C. Arrange qualified cardiac protection and potassium shifting promptly while the team individualizes elimination and reviews kidney function, volume, urine output, and lisinopril. Repeat findings require explicit assessment.' },
    { id: 'renal-hyperkalemia-boundary', type: 'narrative', target: 'renal-hyperkalemia-boundary', atTick: 0, severity: 'warning',
      message: 'Calcium can improve ECG findings without lowering potassium, and its benefit is temporary. Shifting is not removal. Consultation and a removal plan do not themselves remove potassium. The 30-minute shift, 45-minute calcium benefit, 60-minute delivered-removal response, and 150-minute rebound are fictional teaching contrasts, not treatment kinetics, recommended waits, or grading deadlines. ECG morphology is qualitative, not a potassium measurement or calibrated QRS prediction. Hypoglycemia is a possible delayed risk, not an inevitable modeled event. No dose, dialysis prescription, arrhythmia, cardiac arrest, kidney recovery, or discharge is predicted. Exhaled CO2 and FiO2 are unavailable.' },
  ],
  replayPoints: [{ id: 'renal-hyperkalemia-first-response', label: 'Return to cardiac protection and shifting', objectiveId: 'renal-hyperkalemia-protection', atTick: 1,
    reason: 'Compare transient ECG improvement with fresh potassium results and accountable elimination care.' }],
  debrief: { rubric: [
    { id: 'renal-hyperkalemia-protection-review', objectiveId: 'renal-hyperkalemia-protection', question: 'What did cardiac protection change, and what could it not establish?' },
    { id: 'renal-hyperkalemia-shift-review', objectiveId: 'renal-hyperkalemia-shift', question: 'How did temporary shifting differ from removal and durable safety?' },
    { id: 'renal-hyperkalemia-removal-review', objectiveId: 'renal-hyperkalemia-removal', question: 'Who owned elimination, and what distinguished planning from delivered care?' },
    { id: 'renal-hyperkalemia-reassessment-review', objectiveId: 'renal-hyperkalemia-reassessment', question: 'Which observations were fresh and which potassium findings remained historical?' },
    { id: 'renal-hyperkalemia-handoff-review', objectiveId: 'renal-hyperkalemia-handoff', question: 'How will the receiving team monitor rebound, glucose, ECG changes, and elimination progress?' },
  ] },
};
