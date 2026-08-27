import type { Scenario } from '@anesthesia/scenarios/types';

export const PERIOPERATIVE_DIABETES_INSULIN_CONTINUITY: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'perioperative-diabetes-insulin-continuity', version: '0.1.0', maturity: 'preview',
    title: 'Surgery delayed: protect insulin continuity', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 60, difficulty: 'intermediate',
    objectives: [
      { id: 'perioperative-diabetes-context', statement: 'Recognize interrupted insulin delivery during prolonged fasting.', measure: 'Review diabetes type, pump interruption, absent long-acting backup, fasting, and procedural changes with qualified support. A support acknowledgment or new laboratory click must not delay reliable insulin coverage.' },
      { id: 'perioperative-diabetes-insulin', statement: 'Restore verified insulin coverage even while the patient is fasting.', measure: 'Arrange an appropriate qualified alternative insulin source and obtain fresh full findings after care. A pump display, correction-only plan, or fasting status does not establish reliable basal coverage. Record actual elapsed delay without a grading deadline.' },
      { id: 'perioperative-diabetes-plan', statement: 'Coordinate fasting, monitoring, and the revised surgical plan.', measure: 'Individualize insulin, substrate, fluid, electrolyte, procedural, and postoperative responsibilities with serial point-of-care surveillance. Do not imply all fasting patients need the same infusion or that a planning click changes the biochemical response.' },
      { id: 'perioperative-diabetes-reassessment', statement: 'Distinguish a glucose check from a complete reassessment.', measure: 'Obtain fresh glucose, blood ketones, and bedside findings after the later authored response. A glucose-only check retains the older full assessment and cannot prove ketone improvement or surgical readiness.' },
      { id: 'perioperative-diabetes-handoff', statement: 'Hand off ongoing insulin delivery and perioperative surveillance.', measure: 'Transfer qualified continuing-care ownership after fresh full reassessment without stopping insulin, certifying metabolic recovery, or automatically clearing surgery. Earlier refused choices do not prevent a later appropriate handoff.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED', competingInterests: 'None declared',
      reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0',
      sources: [
        'American Diabetes Association Professional Practice Committee. Diabetes Care in the Hospital: Standards of Care in Diabetes—2026. Diabetes Care. 2026;49(Suppl 1):S339–S355. doi:10.2337/dc26-S016. Type 1 Diabetes and Perioperative Care: basal coverage while fasting, individualized device and medication plans, and point-of-care monitoring. No dose schedule is reproduced.',
        'Levy NA, El-Boghdadly K, Lobo DN, et al. Peri-operative management of diabetes mellitus: a multidisciplinary consensus statement from the Association of Anaesthetists and the Joint British Diabetes Societies for Inpatient Care group. Anaesthesia. 2026;81(8):1116–1131. doi:10.1111/anae.70181. Table 3, Box 1, and postoperative handover sections: prompt alternative insulin after delivery disruption, device suitability, and continuing-care ownership. Authored clocks are not clinical kinetics.',
      ],
    },
    limitations: ['perioperative-diabetes-authored-contrasts', 'perioperative-diabetes-individualized-care', 'perioperative-diabetes-observed-findings'],
  },
  patient: {
    ageYears: 42, sex: 'female', heightCm: 165, weightKg: 68, asaClass: 3,
    diagnosis: 'Type 1 diabetes with interrupted pump insulin delivery during delayed elective surgery',
    procedure: 'Preoperative insulin continuity, individualized fasting care, reassessment, and handoff',
    comorbidities: ['Established type 1 diabetes; no long-acting insulin backup',
      'Supplied venous pH 7.38, bicarbonate 24 mmol/L, potassium 4.2 mmol/L, creatinine 0.8 mg/dL; these are historical context, not evolving models'],
    medications: ['Rapid-acting insulin by personal pump; delivery stopped 90 minutes before presentation'],
    allergies: ['No known drug allergies'], fasting: 'Elective laparoscopic cholecystectomy is delayed beyond one missed meal; reassess the individualized plan',
    baseline: { heartRateBpm: 88, meanArterialMmHg: 87, strokeVolumeMl: 70, hemoglobinGPerDl: 12.5,
      bloodVolumeMl: 4500, coreTemperatureC: 36.7, arterialStiffness: 1, baroreflexGain: 1, fixedStrokeVolume: true },
    airway: { difficulty: 0.1, difficultMaskVentilation: false, assessment: 'Awake and thirsty with a patent airway; continued bedside assessment is needed' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], ventilator: { mode: 'manual', fio2: 0.21,
    tidalVolumeMl: 450, respiratoryRateBpm: 16, freshGasFlowLPerMin: 10, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'perioperative-diabetes-presentation', type: 'narrative', target: 'perioperative-diabetes', atTick: 0, severity: 'critical',
      message: 'A fictional 42-year-old woman with type 1 diabetes is fasting for elective laparoscopic cholecystectomy, now delayed beyond one missed meal. Her pump stopped delivering insulin 90 minutes ago and she has no long-acting backup. Supplied glucose is 180 mg/dL and blood beta-hydroxybutyrate is 0.6 mmol/L. She is awake and thirsty; BP 118/72 mmHg, HR 88/min, RR 16/min, SpO2 98%, temperature 36.7°C. Arrange qualified verified alternative insulin delivery promptly while reviewing the device and procedural plan. New glucose and ketone findings require an explicit assessment.' },
    { id: 'perioperative-diabetes-boundary', type: 'narrative', target: 'perioperative-diabetes-boundary', atTick: 0, severity: 'warning',
      message: 'Fasting does not remove basal insulin needs in type 1 diabetes. Reliable coverage means verified delivery through an appropriate qualified plan, not blindly restarting a pump or selecting a universal dose, route, or glucose infusion. A glucose-only check is valid partial information; it does not update older ketones. CGM can be an adjunct but cannot replace required point-of-care checks. The 30- and 60-minute changes and 120- and 240-minute instructor stops are fictional teaching contrasts, not safe waiting periods or pass/fail deadlines. No acidosis, dose kinetics, surgery, automatic clearance, discharge, or durable recovery is modeled. Exhaled CO2 and FiO2 are unavailable.' },
  ],
  replayPoints: [{ id: 'perioperative-diabetes-first-response', label: 'Return to reliable insulin coverage', objectiveId: 'perioperative-diabetes-insulin', atTick: 1,
    reason: 'Compare verified delivery and fresh full assessment with relying on fasting status or glucose alone.' }],
  debrief: { rubric: [
    { id: 'perioperative-diabetes-context-review', objectiveId: 'perioperative-diabetes-context', question: 'How did pump interruption and the delayed procedure change the care plan?' },
    { id: 'perioperative-diabetes-insulin-review', objectiveId: 'perioperative-diabetes-insulin', question: 'What established reliable insulin delivery, and what could not replace it?' },
    { id: 'perioperative-diabetes-plan-review', objectiveId: 'perioperative-diabetes-plan', question: 'Who coordinated fasting, substrate, monitoring, and the revised procedural plan?' },
    { id: 'perioperative-diabetes-reassessment-review', objectiveId: 'perioperative-diabetes-reassessment', question: 'Which findings were fresh, and which remained historical after a glucose-only check?' },
    { id: 'perioperative-diabetes-handoff-review', objectiveId: 'perioperative-diabetes-handoff', question: 'How will the next team preserve insulin delivery and reassess readiness without assuming clearance?' },
  ] },
};
