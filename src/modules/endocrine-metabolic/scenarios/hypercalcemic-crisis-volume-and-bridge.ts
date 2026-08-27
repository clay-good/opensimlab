import type { Scenario } from '@anesthesia/scenarios/types';

export const HYPERCALCEMIC_CRISIS_VOLUME_AND_BRIDGE: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'hypercalcemic-crisis-volume-and-bridge', version: '0.1.0', maturity: 'preview',
    title: 'Hypercalcemic crisis: restore volume, bridge the delay', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 240, difficulty: 'intermediate',
    objectives: [
      { id: 'hypercalcemia-volume', statement: 'Restore depleted volume while respecting cardiac and renal risk.', measure: 'Qualified tailored hydration starts promptly and its response is freshly assessed without an unrestricted-fluid or pre-rehydration routine-diuretic shortcut.' },
      { id: 'hypercalcemia-bridge', statement: 'Use a short calcitonin bridge while longer-acting treatment is arranged.', measure: 'Calcitonin and a qualified antiresorptive pathway are accepted without delaying urgent treatment for the cause; partial calcium improvement is not mistaken for recovery.' },
      { id: 'hypercalcemia-renal', statement: 'Review supplied cardiorenal findings before selecting an antiresorptive pathway.', measure: 'Supplied renal and cardiac risk are reviewed before qualified individualized antiresorptive care, without requiring a new laboratory result or completed hydration.' },
      { id: 'hypercalcemia-reassessment', statement: 'Distinguish volume response from calcium response using fresh observations.', measure: 'Fresh assessments record supported circulation and the later authored calcitonin-bridge state instead of relying on old measurements.' },
      { id: 'hypercalcemia-handoff', statement: 'Hand off persistent severe hypercalcemia and ongoing cancer-directed care.', measure: 'The complete qualified pathway reaches continuing-care handoff with serial calcium, cardiorenal and volume monitoring, bridge limits, and oncology ownership still open.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED', competingInterests: 'None declared',
      reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0',
      sources: [
        'Walsh J, Gittoes N, Selby P, Society for Endocrinology Clinical Committee. Emergency management of acute hypercalcaemia in adult patients. Endocrine Connections. 2016;5:G9–G11. doi:10.1530/EC-16-0055.',
        'El-Hajj Fuleihan G et al. Treatment of Hypercalcemia of Malignancy in Adults: An Endocrine Society Clinical Practice Guideline. 2023. Recommendations 1–3 and Tables 1–2. doi:10.1210/clinem/dgac621.',
      ],
    },
    limitations: ['hypercalcemia-authored-bridge-states', 'hypercalcemia-cardiorenal-and-treatment-limits', 'hypercalcemia-hcm-and-handoff-boundaries'],
  },
  patient: {
    ageYears: 61, sex: 'female', heightCm: 165, weightKg: 68, asaClass: 4,
    diagnosis: 'Severe hypercalcemia of malignancy with dehydration and acute kidney dysfunction on CKD',
    procedure: 'Tailored volume support, short bridge treatment, reassessment, and continuing-care handoff',
    comorbidities: ['Metastatic breast cancer', 'Heart failure with preserved ejection fraction', 'Chronic kidney disease stage 3b'],
    medications: ['Oncology treatment regimen requires qualified medication review'], allergies: ['No known drug allergies'],
    fasting: 'Poor intake with thirst and nausea',
    baseline: { heartRateBpm: 108, meanArterialMmHg: 72, strokeVolumeMl: 55, hemoglobinGPerDl: 11.5,
      bloodVolumeMl: 4200, coreTemperatureC: 36.8, arterialStiffness: 1, baroreflexGain: 1, fixedStrokeVolume: true },
    airway: { difficulty: 0.1, difficultMaskVentilation: false, assessment: 'Confused but breathing spontaneously; qualified reassessment remains necessary' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], ventilator: { mode: 'manual', fio2: 0.21,
    tidalVolumeMl: 450, respiratoryRateBpm: 20, freshGasFlowLPerMin: 10, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'hypercalcemia-presentation', type: 'narrative', target: 'hypercalcemia', atTick: 0, severity: 'critical',
      message: 'A fictional 61-year-old woman with metastatic breast cancer has severe hypercalcemia of malignancy, dehydration, thirst, nausea, and confusion. Supplied BP 96/60 mmHg, HR 108/min, RR 20/min, SpO2 96%, temperature 36.8°C, adjusted serum calcium 16.4 mg/dL, and creatinine 2.2 mg/dL from baseline 1.4. HFpEF and CKD stage 3b increase fluid-overload and treatment risk. Qualified volume assessment and tailored hydration proceed promptly with a short calcitonin bridge, renal-informed antiresorptive care, and parallel cause evaluation.' },
    { id: 'hypercalcemia-boundary', type: 'narrative', target: 'hypercalcemia-boundary', atTick: 0, severity: 'warning',
      message: 'Dose-free choices represent qualified care, not a fluid prescription or a drug-selection rule. Tailored hydration includes immediate volume assessment; it does not wait for the record-review button. Supplied cardiorenal review precedes antiresorptive selection without a new laboratory wait or hydration-completion gate. All patient changes are authored: a 15-minute fluid-response contrast, a 4-hour calcitonin-bridge contrast, a 15-minute missing-urgent-care flag, a 30-minute incomplete-care takeover, and a 6-hour unfinished-lesson stop. No antiresorptive effect is simulated. These clocks are not safe delays, drug kinetics, or recovery predictions. Calcitonin is a short bridge, limited clinically to 48–72 hours. Ongoing calcium, volume, kidney, electrolyte, vitamin D, and oncology review remain necessary. Pause freely and use 60× during observation.' },
  ],
  replayPoints: [{ id: 'hypercalcemia-first-response', label: 'Return to tailored volume support and bridge treatment',
    objectiveId: 'hypercalcemia-volume', atTick: 1, reason: 'Compare prompt individualized treatment with unbounded fluids, premature routine diuresis, or waiting for the cause.' }],
  debrief: { rubric: [
    { id: 'hypercalcemia-volume-review', objectiveId: 'hypercalcemia-volume', question: 'How did dehydration and cardiorenal risk change the hydration decision?' },
    { id: 'hypercalcemia-bridge-review', objectiveId: 'hypercalcemia-bridge', question: 'What does a calcitonin bridge provide while an antiresorptive is arranged, and what does it not establish?' },
    { id: 'hypercalcemia-renal-review', objectiveId: 'hypercalcemia-renal', question: 'Which supplied renal and cardiac findings informed treatment without delaying urgent hydration?' },
    { id: 'hypercalcemia-observation', objectiveId: 'hypercalcemia-reassessment', question: 'Which fresh observation showed volume response, and which showed only partial calcium improvement?' },
    { id: 'hypercalcemia-continuity', objectiveId: 'hypercalcemia-handoff', question: 'Who owns serial calcium and cardiorenal review, the short bridge limit, delayed antiresorptive response, and cancer-directed care?' },
  ] },
};
