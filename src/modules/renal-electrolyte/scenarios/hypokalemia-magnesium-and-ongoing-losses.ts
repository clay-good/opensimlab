import type { Scenario } from '@anesthesia/scenarios/types';

export const RENAL_HYPOKALEMIA_MAGNESIUM_AND_ONGOING_LOSSES: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'hypokalemia-magnesium-and-ongoing-losses', version: '0.1.0', maturity: 'preview',
    title: 'Severe hypokalemia: magnesium and ongoing losses', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 60, difficulty: 'intermediate',
    objectives: [
      { id: 'renal-hypokalemia-replacement', statement: 'Arrange urgent qualified potassium replacement without waiting for administrative steps.', measure: 'Respond to supplied severe hypokalemia and weakness with individualized potassium care and surveillance. Support acknowledgment, context review, and a new laboratory request do not gate treatment; no dose, route, rate, or universal replacement target is prescribed.' },
      { id: 'renal-hypokalemia-magnesium', statement: 'Address the concurrent magnesium deficit alongside potassium.', measure: 'Request independent qualified magnesium care and distinguish single-electrolyte improvement from a fresh combined assessment. Potassium and magnesium requests may occur in either order; an improved potassium-only result cannot refresh older magnesium.' },
      { id: 'renal-hypokalemia-losses', statement: 'Separate review and planning from delivered care for ongoing losses.', measure: 'Review diarrhea, hydrochlorothiazide, kidney function, volume, and other contributors with qualified support. Coordinate individualized management of continuing losses; a review or plan alone does not establish that those losses have been addressed.' },
      { id: 'renal-hypokalemia-reassessment', statement: 'Use fresh findings to distinguish partial response, recurrence, and recovery.', measure: 'Request potassium, magnesium, ECG, and bedside reassessment rather than infer biochemical safety from the waveform or elapsed time. Preserve prior observed recurrence after later improvement; no normal value or flawless earlier sequence is required for continuing care.' },
      { id: 'renal-hypokalemia-handoff', statement: 'Hand off continuing replacement, contributor management, and surveillance.', measure: 'Transfer qualified support, treatment and loss-management responsibilities, fresh combined findings, and monitoring needs. A later improvement is not durable correction, arrhythmia exclusion, or discharge clearance.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED', competingInterests: 'None declared',
      reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0',
      sources: [
        'NHS Specialist Pharmacy Service. Hypokalaemia. 2024. https://sps.nhs.uk/articles/hypokalaemia/ Qualified assessment, individualized replacement, monitoring, and underlying-cause review; no dosing table is reproduced.',
        'NHS Specialist Pharmacy Service. Treating acute hypomagnesaemia in adults. 2024. https://sps.nhs.uk/articles/treating-acute-hypomagnesaemia-in-adults/ Concurrent electrolyte assessment, individualized magnesium treatment, and monitoring; no dose, route, or rate is selected by this lesson.',
        'Resuscitation Council UK. 2025 Resuscitation Guidelines: Special circumstances, Hypokalaemia. Severe hypokalemia, ECG change, replacement, magnesium, and continued monitoring. This lesson concerns an awake perfusing adult, not cardiac arrest.',
        'Krogager ML et al. Update on management of hypokalaemia and goals for the lower potassium level in patients with cardiovascular disease: a review in collaboration with the European Society of Cardiology Working Group on Cardiovascular Pharmacotherapy. 2021. doi:10.1093/ehjcvp/pvab038. Potassium, magnesium, contributors, and reassessment; a collaborative review, not a universal replacement target.',
      ],
    },
    limitations: ['renal-hypokalemia-authored-contrasts', 'renal-hypokalemia-individualized-care', 'renal-hypokalemia-observed-findings'],
  },
  patient: {
    ageYears: 54, sex: 'female', heightCm: 168, weightKg: 64, asaClass: 3,
    diagnosis: 'Severe hypokalemia with concurrent hypomagnesemia and ongoing gastrointestinal losses',
    procedure: 'Qualified electrolyte replacement, contributor and loss management, repeated assessment, and handoff',
    comorbidities: ['Diarrhea for 4 days; ongoing losses and volume status require qualified assessment',
      'Supplied creatinine 1.1 mg/dL is historical context, not a kidney-response model; no chronic kidney disease is supplied'],
    medications: ['Hydrochlorothiazide; individualized medication review is required'],
    allergies: ['No known drug allergies'], fasting: 'Not a refeeding or elective fasting lesson; intake and volume plans require bedside assessment',
    baseline: { heartRateBpm: 96, meanArterialMmHg: 79, strokeVolumeMl: 70, hemoglobinGPerDl: 12,
      bloodVolumeMl: 4500, coreTemperatureC: 36.7, arterialStiffness: 1, baroreflexGain: 1, fixedStrokeVolume: true },
    airway: { difficulty: 0.1, difficultMaskVentilation: false, assessment: 'Awake with generalized weakness and a patent airway' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], ventilator: { mode: 'manual', fio2: 0.21,
    tidalVolumeMl: 450, respiratoryRateBpm: 18, freshGasFlowLPerMin: 10, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'renal-hypokalemia-presentation', type: 'narrative', target: 'renal-hypokalemia', atTick: 0, severity: 'critical',
      message: 'A fictional 54-year-old woman has generalized weakness after 4 days of diarrhea while taking hydrochlorothiazide. Supplied potassium is 2.3 mmol/L and magnesium 0.40 mmol/L; creatinine 1.1 mg/dL is historical context. She is awake with BP 106/66 mmHg, HR 96/min, RR 18/min, SpO2 98%, and temperature 36.7°C. The supplied ECG has qualitative flattened T waves. Arrange qualified potassium and magnesium care promptly while the team individualizes continuing-loss and contributor management. Repeat findings require explicit assessment.' },
    { id: 'renal-hypokalemia-boundary', type: 'narrative', target: 'renal-hypokalemia-boundary', atTick: 0, severity: 'warning',
      message: 'Potassium and magnesium care are independent; reviewing contributors is not the same as delivering individualized care for continuing losses. The 30-minute partial response, 60-minute combined response, 120-minute recurrent decline without loss management, and 60-minute later-care response are fictional teaching contrasts, not treatment kinetics, clinical waiting instructions, or grading deadlines. Potassium-only and ECG-only checks do not refresh older magnesium or establish complete correction. The qualitative ECG is not a measured U wave, QTc, or electrolyte level. No dose, route, rate, fluid prescription, arrhythmia, kidney recovery, normalization, or discharge is predicted. Exhaled CO2 and FiO2 are unavailable.' },
  ],
  replayPoints: [{ id: 'renal-hypokalemia-first-response', label: 'Return to paired electrolyte care', objectiveId: 'renal-hypokalemia-replacement', atTick: 1,
    reason: 'Compare partial replacement with paired care and delivered management of continuing losses.' }],
  debrief: { rubric: [
    { id: 'renal-hypokalemia-replacement-review', objectiveId: 'renal-hypokalemia-replacement', question: 'What established the urgent need for qualified potassium care?' },
    { id: 'renal-hypokalemia-magnesium-review', objectiveId: 'renal-hypokalemia-magnesium', question: 'What did a potassium-only result leave unresolved about magnesium?' },
    { id: 'renal-hypokalemia-losses-review', objectiveId: 'renal-hypokalemia-losses', question: 'What distinguished contributor review and planning from delivered care for ongoing losses?' },
    { id: 'renal-hypokalemia-reassessment-review', objectiveId: 'renal-hypokalemia-reassessment', question: 'Which results were fresh, and did later improvement preserve earlier observed recurrence?' },
    { id: 'renal-hypokalemia-handoff-review', objectiveId: 'renal-hypokalemia-handoff', question: 'Who owns continued replacement, loss management, and monitoring after handoff?' },
  ] },
};
