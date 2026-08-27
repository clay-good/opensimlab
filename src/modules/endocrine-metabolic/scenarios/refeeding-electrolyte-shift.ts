import type { Scenario } from '@anesthesia/scenarios/types';

export const REFEEDING_ELECTROLYTE_SHIFT: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'refeeding-electrolyte-shift', version: '0.1.0', maturity: 'preview',
    title: 'After nutrition restarts: weakness and falling electrolytes', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 60, difficulty: 'intermediate',
    objectives: [
      { id: 'refeeding-context', statement: 'Connect recent nutrition, depleted intake, and the supplied electrolyte trajectory.', measure: 'Review nutrition and dextrose exposure, prior findings, thiamine availability, and alternative causes with qualified support; no diagnostic score or laboratory click gates urgent care.' },
      { id: 'refeeding-electrolytes', statement: 'Address the complete electrolyte problem, not phosphate alone.', measure: 'Request comprehensive qualified phosphate, potassium, and magnesium care and freshly observe the response. A phosphate-only request is valid partial care, not proof of complete correction. Report elapsed delay without an arbitrary pass/fail cutoff.' },
      { id: 'refeeding-nutrition', statement: 'Coordinate vitamin support and an individualized nutrition plan.', measure: 'Request thiamine and nutrition review in either order, including all calorie sources and further advancement. Retain attempted automatic advancement and premature monitoring closure without treating them as irreversible failure.' },
      { id: 'refeeding-reassessment', statement: 'Reassess the trajectory rather than infer response from elapsed time.', measure: 'Request a fresh combined-care assessment, distinguish historical results from live signs, and interpret partial improvement without declaring normalization or durable safety.' },
      { id: 'refeeding-handoff', statement: 'Hand off continuing nutrition and electrolyte surveillance.', measure: 'Coordinate qualified support, exposure review, monitoring, vitamin and electrolyte care, nutrition planning, and a fresh later observation before continuing-care handoff.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED', competingInterests: 'None declared',
      reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0',
      sources: [
        'da Silva JSV et al. ASPEN Consensus Recommendations for Refeeding Syndrome. Nutrition in Clinical Practice. 2020;35:178–195. doi:10.1002/ncp.10474. Table 6 and treatment discussion: coordinated electrolyte, vitamin, nutrition, and monitoring care. Erratum doi:10.1002/ncp.10491 corrects risk tables. Authored responses are not guideline predictions.',
        'Matthews-Rensch K et al. The Australasian Society of Parenteral and Enteral Nutrition: Consensus statements on refeeding syndrome. Nutrition & Dietetics. 2025. doi:10.1111/1747-0080.70003. Sections 3.5.1–3.5.4 and 3.6–3.7 distinguish nutrition risk, established electrolyte deterioration, individualized advancement, supplementation, and surveillance; no universal feeding rate is taught.',
      ],
    },
    limitations: ['refeeding-authored-contrasts', 'refeeding-individualized-nutrition', 'refeeding-observed-findings'],
  },
  patient: {
    ageYears: 58, sex: 'female', heightCm: 164, weightKg: 46, asaClass: 4,
    diagnosis: 'Established feeding-associated electrolyte deterioration requiring qualified evaluation',
    procedure: 'Coordinated electrolyte rescue, vitamin and nutrition review, repeated assessment, and continuing care',
    comorbidities: ['Negligible intake for 10 days during illness', 'Enteral nutrition began 30 hours earlier',
      'Supplied creatinine 0.8 mg/dL and glucose 126 mg/dL; neither has a response model'],
    medications: ['Thiamine administration is not documented; review enteral and IV dextrose sources'],
    allergies: ['No known drug allergies'], fasting: 'Nutrition is already underway; review the individualized plan rather than assume all feeding must stop',
    baseline: { heartRateBpm: 112, meanArterialMmHg: 77, strokeVolumeMl: 55, hemoglobinGPerDl: 11.2,
      bloodVolumeMl: 3200, coreTemperatureC: 36.7, arterialStiffness: 1, baroreflexGain: 1, fixedStrokeVolume: true },
    airway: { difficulty: 0.1, difficultMaskVentilation: false, assessment: 'Awake with a patent airway; weakness requires ongoing qualified bedside assessment' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], ventilator: { mode: 'manual', fio2: 0.21,
    tidalVolumeMl: 400, respiratoryRateBpm: 22, freshGasFlowLPerMin: 10, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'refeeding-presentation', type: 'narrative', target: 'refeeding', atTick: 0, severity: 'critical',
      message: 'A fictional 58-year-old woman, 46 kg, is awake and weak 30 hours after enteral nutrition began following 10 days of negligible intake. Supplied prefeeding phosphate/potassium/magnesium were 1.00/3.8/0.80 mmol/L; current values are 0.30/2.7/0.48 mmol/L. Thiamine is not documented. BP is 102/64 mmHg, HR 112/min, RR 22/min, SpO2 97%, and temperature 36.7°C. This is an established feeding-associated concern, not proof that any low phosphate value establishes a diagnosis. Begin qualified care while reviewing exposure and alternative causes. New electrolyte results require explicit reassessment.' },
    { id: 'refeeding-boundary', type: 'narrative', target: 'refeeding-boundary', atTick: 0, severity: 'warning',
      message: 'This dose-free lesson separates partial phosphate care from comprehensive electrolyte care, thiamine support, individualized nutrition review, and continuing surveillance. These requests are independent; urgent replacement does not wait for administrative review or new laboratory clicks. Nutrition review does not secretly select a rate or stop all feeding. Guidance differs on initial feeding and reduction; prevent automatic advancement during this severe decline and use qualified local judgment. The 30- and 60-minute changes and 120- and 240-minute instructor stops are authored teaching contrasts, not clinical kinetics, waiting intervals, or deadlines. FiO2 and exhaled CO2 are unavailable. No dose, route, calorie calculation, arrhythmia prediction, discharge decision, or thiamine-deficiency diagnosis is modeled.' },
  ],
  replayPoints: [{ id: 'refeeding-first-response', label: 'Return to coordinated electrolyte care', objectiveId: 'refeeding-electrolytes', atTick: 1,
    reason: 'Compare partial replacement with complete electrolyte and nutrition care while preserving observed history.' }],
  debrief: { rubric: [
    { id: 'refeeding-context-review', objectiveId: 'refeeding-context', question: 'What did the feeding and electrolyte timeline suggest, and what other causes still need review?' },
    { id: 'refeeding-electrolytes-review', objectiveId: 'refeeding-electrolytes', question: 'What could phosphate-only care address, and what did it leave unresolved?' },
    { id: 'refeeding-nutrition-review', objectiveId: 'refeeding-nutrition', question: 'How did thiamine and individualized nutrition planning differ from electrolyte rescue?' },
    { id: 'refeeding-reassessment-review', objectiveId: 'refeeding-reassessment', question: 'Which fresh findings established a partial response rather than complete recovery?' },
    { id: 'refeeding-handoff-review', objectiveId: 'refeeding-handoff', question: 'Who owns ongoing supplementation, nutrition advancement, monitoring, and cause evaluation?' },
  ] },
};
