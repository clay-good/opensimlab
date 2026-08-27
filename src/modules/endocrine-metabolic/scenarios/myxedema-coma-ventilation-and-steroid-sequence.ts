import type { Scenario } from '@anesthesia/scenarios/types';

export const MYXEDEMA_COMA_VENTILATION_AND_STEROID_SEQUENCE: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'myxedema-coma-ventilation-and-steroid-sequence', version: '0.1.0', maturity: 'preview',
    title: 'Myxedema coma: support breathing, protect the sequence', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 12, difficulty: 'intermediate',
    objectives: [
      { id: 'myxedema-ventilation', statement: 'Support ventilation and assess its response, not just oxygen saturation.', measure: 'Qualified ventilation and a fresh supported respiratory observation are recorded without a missing-ventilation delay.' },
      { id: 'myxedema-steroid-sequence', statement: 'Establish empiric steroid coverage before thyroid hormone replacement.', measure: 'Hydrocortisone precedes levothyroxine without an early-thyroxine attempt; no artificial waiting interval is imposed.' },
      { id: 'myxedema-parallel-care', statement: 'Coordinate urgent treatment, supportive care, and investigation in parallel.', measure: 'Qualified support and supportive care accompany endocrine treatment without a laboratory-delay choice, endocrine omission, or rapid-rewarming request.' },
      { id: 'myxedema-reassessment', statement: 'Separate early support from thyroid recovery through fresh reassessment.', measure: 'A new bedside assessment records the later partial-support state rather than relying on saturation or a historical observation.' },
      { id: 'myxedema-handoff', statement: 'Hand off ongoing organ support, treatment, and unresolved causes.', measure: 'The complete pathway and observed response reach continuing-care handoff without implying extubation or discharge readiness.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED', competingInterests: 'None declared',
      reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0',
      sources: [
        'Jonklaas J et al. Guidelines for the Treatment of Hypothyroidism. American Thyroid Association. 2014. Recommendations 21a–21d. doi:10.1089/thy.2014.0028.',
        'Taylor P et al. Management of endocrine emergencies: joint consensus statement for management of myxoedema coma. 2026. Treatment, Thyroid hormone replacement, Glucocorticoid treatment, Warming, Hypoventilation, and Ongoing management sections. doi:10.1530/ETJ-26-0044.',
      ],
    },
    limitations: ['myxedema-authored-support-states', 'myxedema-qualified-team-not-procedures', 'myxedema-sequence-and-recovery-limits'],
  },
  patient: {
    ageYears: 72, sex: 'female', heightCm: 160, weightKg: 68, asaClass: 4,
    diagnosis: 'Severe decompensated hypothyroidism with hypoventilation and possible respiratory infection',
    procedure: 'Myxedema emergency support, treatment sequence, and reassessment rehearsal',
    comorbidities: ['Primary hypothyroidism', 'Coronary artery disease'], medications: ['Levothyroxine interrupted during recent illness'],
    allergies: ['No known drug allergies'], fasting: 'Poor intake during illness',
    baseline: { heartRateBpm: 42, meanArterialMmHg: 65, strokeVolumeMl: 45, hemoglobinGPerDl: 11.5,
      bloodVolumeMl: 4200, coreTemperatureC: 34, arterialStiffness: 1, baroreflexGain: 1, fixedStrokeVolume: true },
    airway: { difficulty: 0.1, difficultMaskVentilation: false, assessment: 'Drowsy with slow, shallow breathing; qualified airway assessment is required' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], ventilator: { mode: 'manual', fio2: 0.21,
    tidalVolumeMl: 400, respiratoryRateBpm: 8, freshGasFlowLPerMin: 10, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'myxedema-presentation', type: 'narrative', target: 'myxedema', atTick: 0, severity: 'critical',
      message: 'A fictional 72-year-old with primary hypothyroidism, interrupted replacement, coronary disease, and possible respiratory infection is drowsy, cold, and breathing shallowly. Supplied BP 88/54 mmHg, HR 42/min, RR 8/min, room-air SpO2 90%, temperature 34°C, initial PaCO2 68 mmHg. Qualified clinicians suspect severe decompensated hypothyroidism (myxedema coma); profound coma is not required. Support breathing and investigate other causes while treatment begins. Do not wait for a thyroid score or laboratory confirmation.' },
    { id: 'myxedema-boundary', type: 'narrative', target: 'myxedema-boundary', atTick: 0, severity: 'warning',
      message: 'Dose-free choices represent qualified team care, not prescribing or procedures. Empiric glucocorticoids precede levothyroxine; no minimum waiting interval is invented. Oxygen can improve saturation without treating carbon-dioxide retention. All patient changes and clocks are authored: 5-minute respiratory response or missing-ventilation deterioration, 15-minute endocrine-omission contrast, 60-minute complete-care partial support, 30-minute incomplete-urgent-care takeover, and 180-minute unfinished-lesson stop. They are not safe delays or treatment kinetics. Ongoing respiratory, cardiovascular, temperature, glucose, sodium, thyroid, and precipitant monitoring remain necessary. Use 60× for observation periods and pause freely.' },
  ],
  replayPoints: [{ id: 'myxedema-first-response', label: 'Return to breathing support and steroid sequencing',
    objectiveId: 'myxedema-ventilation', atTick: 1, reason: 'Compare oxygen-only reassurance with qualified ventilation and parallel endocrine treatment.' }],
  debrief: { rubric: [
    { id: 'myxedema-breathing', objectiveId: 'myxedema-ventilation', question: 'What did a better oxygen saturation fail to establish about ventilation?' },
    { id: 'myxedema-coverage', objectiveId: 'myxedema-steroid-sequence', question: 'Why did empiric glucocorticoid coverage precede levothyroxine?' },
    { id: 'myxedema-urgency', objectiveId: 'myxedema-parallel-care', question: 'Which treatments and investigations could proceed together without waiting for a laboratory result?' },
    { id: 'myxedema-observation', objectiveId: 'myxedema-reassessment', question: 'Which changes reflected organ support, and why did they not establish recovery?' },
    { id: 'myxedema-continuity', objectiveId: 'myxedema-handoff', question: 'Which respiratory, endocrine, metabolic, precipitant, and escalation responsibilities remained open?' },
  ] },
};
