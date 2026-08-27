import type { Scenario } from '@anesthesia/scenarios/types';

export const RENAL_HYPONATREMIA_SYMPTOMS_AND_REASSESSMENT: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'hyponatremia-symptoms-and-reassessment', version: '0.1.0', maturity: 'preview',
    title: 'Hyponatremia: sodium rises, symptoms persist', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 90, difficulty: 'intermediate',
    objectives: [
      { id: 'renal-hyponatremia-rescue', statement: 'Arrange qualified symptom-led treatment without waiting for cause classification.', measure: 'Use the explicitly selected Society for Endocrinology 2022 pathway for this symptomatic patient. Initial rescue is independent of support acknowledgment, context review, or a new test; no concentration, dose, rate, or regional prescription is selected.' },
      { id: 'renal-hyponatremia-context', statement: 'Interpret paired pretreatment findings with diuretic and duration uncertainty.', measure: 'Review confirmed hypotonicity, contemporaneous pretreatment serum and urine findings, hydrochlorothiazide exposure, and unknown duration. Urine sodium alone does not establish SIADH, and cause evaluation must not delay urgent symptom-led care.' },
      { id: 'renal-hyponatremia-reassessment', statement: 'Keep sodium and neurologic observations distinct and current.', measure: 'Request full sodium and bedside reassessment before concluding what rescue established. A sodium-only check cannot refresh older headache, nausea, or confusion findings; a neurologic check cannot refresh sodium.' },
      { id: 'renal-hyponatremia-persistent', statement: 'Respond to persistent symptoms without declaring recovery from a sodium rise.', measure: 'After a current full first-response assessment, arrange selected qualified additional rescue while investigating alternative or additional causes of persistent symptoms. Neurologic evaluation is available at any time and does not itself cure symptoms.' },
      { id: 'renal-hyponatremia-handoff', statement: 'Transfer unresolved symptoms and ongoing treatment review.', measure: 'Hand off qualified support, context, monitoring, neurologic investigation, delivered rescue, and current full later findings. A total rise of 6 mmol/L is an authored checkpoint, not a treatment-stop rule, recovery, or discharge clearance; continued reassessment and escalation remain necessary.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED', competingInterests: 'None declared',
      reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0',
      sources: [
        'Society for Endocrinology. Emergency management of severe and moderately severely symptomatic hyponatraemia in adult patients. Revised 2022, pp. 3–4 and Figure 2. Selected symptom-led early treatment and persistent-symptom reassessment pathway; no dose or universal regional protocol is reproduced.',
        'Spasovski G et al. Clinical practice guideline on diagnosis and treatment of hyponatraemia. European Journal of Endocrinology. 2014;170:G1–G47. doi:10.1530/EJE-13-1020. Sections 6.3 and 7.2: paired serum and urine interpretation, diuretic-related diagnostic caution, and moderately severe symptoms. Its treatment target differs from the selected Society for Endocrinology 2022 path; neither is presented as a universal regional rule.',
        'Sterns RH et al. Treatment Guidelines for Hyponatremia: Stay the Course. Clinical Journal of the American Society of Nephrology. 2024;19:129–135. doi:10.2215/CJN.0000000000000244. Correction-risk review and continuing surveillance; a review of prior recommendations, not a newly issued guideline.',
      ],
    },
    limitations: ['renal-hyponatremia-authored-contrasts', 'renal-hyponatremia-persistent-symptoms', 'renal-hyponatremia-observed-findings'],
  },
  patient: {
    ageYears: 70, sex: 'female', heightCm: 163, weightKg: 58, asaClass: 3,
    diagnosis: 'Symptomatic hypotonic hyponatremia with headache, nausea, and confusion of uncertain cause and duration',
    procedure: 'Qualified symptom-led rescue, paired sodium and neurologic reassessment, investigation, and continuing-care handoff',
    comorbidities: ['Unknown duration of hyponatremia', 'No seizure is supplied; headache, nausea, and confusion require ongoing clinical assessment',
      'Contemporaneous pretreatment serum osmolality 250 mOsm/kg, glucose 99 mg/dL, potassium 3.6 mmol/L, urine osmolality 460 mOsm/kg, and urine sodium 52 mmol/L are historical findings, not response models'],
    medications: ['Hydrochlorothiazide exposure; contribution and medication management require qualified review'],
    allergies: ['No known drug allergies'], fasting: 'Not a fasting lesson; intake, volume, and cause assessment remain individualized',
    baseline: { heartRateBpm: 92, meanArterialMmHg: 96, strokeVolumeMl: 70, hemoglobinGPerDl: 12,
      bloodVolumeMl: 4000, coreTemperatureC: 36.7, arterialStiffness: 1, baroreflexGain: 1, fixedStrokeVolume: true },
    airway: { difficulty: 0.1, difficultMaskVentilation: false, assessment: 'Awake but confused with a patent airway; headache and nausea persist' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], ventilator: { mode: 'manual', fio2: 0.21,
    tidalVolumeMl: 450, respiratoryRateBpm: 18, freshGasFlowLPerMin: 10, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'renal-hyponatremia-presentation', type: 'narrative', target: 'renal-hyponatremia', atTick: 0, severity: 'critical',
      message: 'A fictional 70-year-old woman taking hydrochlorothiazide is awake but confused with headache and nausea; no seizure is supplied. Confirmed pretreatment sodium is 118 mmol/L with measured serum osmolality 250 mOsm/kg, glucose 99 mg/dL, and potassium 3.6 mmol/L. Contemporaneous pretreatment urine osmolality is 460 mOsm/kg and urine sodium 52 mmol/L. Duration is unknown, and diuretic exposure complicates cause classification. BP is 132/78 mmHg, HR 92/min, RR 18/min, SpO2 98%, and temperature 36.7°C. Arrange qualified symptom-led treatment while evaluating the whole patient. Repeat sodium and neurologic findings require explicit assessment.' },
    { id: 'renal-hyponatremia-boundary', type: 'narrative', target: 'renal-hyponatremia-boundary', atTick: 0, severity: 'warning',
      message: 'This lesson explicitly selects the Society for Endocrinology 2022 early-treatment pathway, not a universal regional rule. Initial rescue is independent of administrative or diagnostic review. After a current full first-response assessment, selected additional rescue and neurologic investigation address persistent symptoms. Neurologic investigation is available at any time. The 60-minute first response and 30-minute additional response are authored contrasts, not treatment kinetics or clinical waiting instructions. Headache, nausea, and confusion persist throughout; a sodium rise does not prove recovery. A later total rise of 6 mmol/L is not an automatic treatment-stop rule: further treatment review, investigation, surveillance, and escalation remain open. Partial observations retain the other findings as historical. No dose, rate, SIADH diagnosis, automatic aquaresis, relowering response, neurologic recovery, or discharge is simulated. Exhaled CO2 and FiO2 are unavailable.' },
  ],
  replayPoints: [{ id: 'renal-hyponatremia-first-response', label: 'Return to symptom-led treatment', objectiveId: 'renal-hyponatremia-rescue', atTick: 1,
    reason: 'Compare a sodium-only conclusion with paired reassessment and ongoing care for persistent symptoms.' }],
  debrief: { rubric: [
    { id: 'renal-hyponatremia-rescue-review', objectiveId: 'renal-hyponatremia-rescue', question: 'What justified symptom-led treatment before the cause was settled?' },
    { id: 'renal-hyponatremia-context-review', objectiveId: 'renal-hyponatremia-context', question: 'Why did the pretreatment urine findings and thiazide exposure not establish SIADH?' },
    { id: 'renal-hyponatremia-reassessment-review', objectiveId: 'renal-hyponatremia-reassessment', question: 'Which sodium and neurologic observations were current, and which remained historical?' },
    { id: 'renal-hyponatremia-persistent-review', objectiveId: 'renal-hyponatremia-persistent', question: 'How did persistent headache, nausea, and confusion change the response to the sodium rise?' },
    { id: 'renal-hyponatremia-handoff-review', objectiveId: 'renal-hyponatremia-handoff', question: 'Who owns further treatment review, neurologic investigation, surveillance, and escalation?' },
  ] },
};
