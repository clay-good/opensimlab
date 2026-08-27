import type { Scenario } from '@anesthesia/scenarios/types';

export const HYPONATREMIA_AQUARESIS_AND_OVERCORRECTION: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'hyponatremia-aquaresis-and-overcorrection', version: '0.1.0', maturity: 'preview',
    title: 'Hyponatremia after rescue: keep correction controlled', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 90, difficulty: 'intermediate',
    objectives: [
      { id: 'sodium-correction-risk', statement: 'Preserve the original correction window and recognize a high-risk patient after seizure rescue.', measure: 'Review the original sodium of 106, the hour-1 rise to 111, unknown duration, malnutrition, alcohol-use disorder, low potassium, and possible thiazide contribution without treating normalization as the goal.' },
      { id: 'sodium-correction-surveillance', statement: 'Request serial sodium and urine-output findings rather than waiting for symptoms.', measure: 'Monitoring and explicit reassessment reveal the authored changing water losses; old findings remain historical, and the symptom-wait choice remains evidence.' },
      { id: 'sodium-correction-response', statement: 'Respond to observed water diuresis or excessive correction with qualified treatment.', measure: 'Water-loss control follows an observed problem; after observed excessive correction, expert-directed relowering and water-loss management proceed in either order without an administrative prerequisite.' },
      { id: 'sodium-correction-reassessment', statement: 'Confirm the later trajectory while retaining the original baseline and observed peak.', measure: 'A fresh later response assessment is required; time, accepted requests, and a lower later value do not erase the correction history.' },
      { id: 'sodium-correction-handoff', statement: 'Transfer ongoing correction-risk surveillance rather than declaring recovery.', measure: 'Qualified support, risk/cause/potassium review, monitoring, necessary response, and a fresh later observation support continuing-care handoff, not discharge or guaranteed neurologic safety.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED', competingInterests: 'None declared',
      reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0',
      sources: [
        'Society for Endocrinology. Emergency management of severe and moderately severely symptomatic hyponatraemia in adult patients. Revised 2022, pp. 3–5: treatment, surveillance, aquaresis, and overcorrection. https://www.endocrinology.org/media/xhrhxhxm/emergency-management-of-severe-and-moderately-severely-symptomatic-hyponatraemia-in-adult-patients-2022.pdf',
        'Sterns RH et al. Treatment Guidelines for Hyponatremia: Stay the Course. Clinical Journal of the American Society of Nephrology. 2024;19:129–135. doi:10.2215/CJN.0000000000000244. pp. 131–133: reaffirmed high-risk correction limits, risk factors, and relowering considerations; not a newly issued guideline.',
        'Spasovski G et al. Clinical practice guideline on diagnosis and treatment of hyponatraemia. European Journal of Endocrinology. 2014;170:G1–G47. doi:10.1530/EJE-13-1020. Sections 7.1, 7.4.4 and 7.5: surveillance, potassium contribution, and overcorrection rescue.',
      ],
    },
    limitations: ['hyponatremia-correction-authored-checkpoints', 'hyponatremia-correction-high-risk-window', 'hyponatremia-correction-qualified-care'],
  },
  patient: {
    ageYears: 62, sex: 'female', heightCm: 165, weightKg: 54, asaClass: 4,
    diagnosis: 'Severe hyponatremia after initial seizure rescue with risk of excessive correction',
    procedure: 'Monitored sodium-correction surveillance, water-loss management, reassessment, and continuing-care handoff',
    comorbidities: ['Unknown duration of hyponatremia', 'Malnutrition', 'Documented alcohol-use disorder', 'Supplied potassium 2.7 mmol/L'],
    medications: ['Recent thiazide use; thiazide already withheld', 'Initial hypertonic saline rescue already stopped'],
    allergies: ['No known drug allergies'], fasting: 'Qualified nutrition and electrolyte care require ongoing review',
    baseline: { heartRateBpm: 84, meanArterialMmHg: 86, strokeVolumeMl: 70, hemoglobinGPerDl: 12.5,
      bloodVolumeMl: 3500, coreTemperatureC: 36.8, arterialStiffness: 1, baroreflexGain: 1, fixedStrokeVolume: true },
    airway: { difficulty: 0.1, difficultMaskVentilation: false, assessment: 'Awake with a patent airway after initial seizure rescue; ongoing qualified neurologic and airway surveillance' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], ventilator: { mode: 'manual', fio2: 0.21,
    tidalVolumeMl: 450, respiratoryRateBpm: 16, freshGasFlowLPerMin: 10, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'sodium-correction-presentation', type: 'narrative', target: 'hyponatremia-correction', atTick: 0, severity: 'critical',
      message: 'A fictional 62-year-old woman, 54 kg, is awake but tired after emergency treatment ended a seizure. Pretreatment sodium was 106 mmol/L; supplied sodium is now 111 after one hour, a rise of 5. Hypertonic saline has stopped and the thiazide has been withheld. Tick zero is correction-hour 1, not a new correction window. Malnutrition, alcohol-use disorder, potassium 2.7 mmol/L, and unknown duration require qualified review. Initial BP 118/70 mmHg, HR 84/min, RR 16/min, SpO2 98%, and temperature 36.8°C are authored constants. Sodium and urine output require explicit reassessment; continued neurologic comfort does not establish a controlled trajectory.' },
    { id: 'sodium-correction-boundary', type: 'narrative', target: 'hyponatremia-correction-boundary', atTick: 0, severity: 'warning',
      message: 'This dose-free post-rescue lesson selects a high-risk 4–6 mmol/L daily goal and 8 mmol/L ceiling in any 24 hours, not sodium normalization. US and GB profiles share this explicit teaching plan; general guideline limits differ. Authored 30- and 60-minute surveillance contrasts, a 60-minute response checkpoint after necessary requests, a 120-minute missing-control stop, and a 240-minute unfinished stop are not safe waiting intervals or clinical kinetics. Reassess earlier whenever needed. Qualified relowering and water-loss management after an observed breach do not wait for risk review or support acknowledgment. Potassium treatment contributes to correction but no potassium kinetics, dose, water-balance solver, or ODS prediction is supplied. Necessary resuscitation is never withheld for instability. Generic ventilator defaults are inactive compatibility fields; FiO2 and exhaled CO2 are not supplied. Hand off continuing 24–48-hour surveillance, not discharge or guaranteed safety.' },
  ],
  replayPoints: [{ id: 'sodium-correction-first-review', label: 'Return to post-rescue surveillance', objectiveId: 'sodium-correction-surveillance',
    atTick: 1, reason: 'Compare observation-led early prevention with waiting for symptoms and later qualified rescue while preserving the original correction window.' }],
  debrief: { rubric: [
    { id: 'sodium-correction-risk-review', objectiveId: 'sodium-correction-risk', question: 'How did the original baseline, elapsed correction hour, and high-risk context change the plan after seizure rescue?' },
    { id: 'sodium-correction-surveillance-review', objectiveId: 'sodium-correction-surveillance', question: 'Which requested sodium and urine-output findings changed your assessment despite no recurrent symptoms?' },
    { id: 'sodium-correction-response-review', objectiveId: 'sodium-correction-response', question: 'What supported early water-loss management or combined rescue after observed excessive correction?' },
    { id: 'sodium-correction-reassessment-review', objectiveId: 'sodium-correction-reassessment', question: 'What did the later assessment establish, and which original and peak values still matter?' },
    { id: 'sodium-correction-handoff-review', objectiveId: 'sodium-correction-handoff', question: 'Who owns the remaining sodium, urine-output, potassium, neurologic, fluid-balance, and cause surveillance?' },
  ] },
};
