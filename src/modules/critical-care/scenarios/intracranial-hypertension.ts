/** Bounded first-tier response to monitored intracranial hypertension after severe TBI. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const INTRACRANIAL_HYPERTENSION: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'intracranial-hypertension', version: '0.1.0', maturity: 'preview',
    title: 'Intracranial hypertension', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 8, difficulty: 'advanced', objectives: [
      { id: 'recognize-intracranial-hypertension', statement: 'Recognize sustained intracranial hypertension with inadequate cerebral perfusion.', measure: 'The ICP, CPP, examination, and imaging pattern triggered neurocritical and neurosurgical help.' },
      { id: 'review-intracranial-hypertension-context', statement: 'Review the fixed monitor, examination, imaging, systemic, and reversible-driver context.', measure: 'The whole pattern was checked without treating one ICP value or pupil finding as a diagnosis or prognosis.' },
      { id: 'activate-first-tier-brain-protection', statement: 'Activate first-tier positioning and systemic brain-protection intents.', measure: 'The plan protected venous drainage, oxygenation, ventilation, perfusion, temperature, comfort, synchrony, and seizure surveillance.' },
      { id: 'activate-individualized-hyperosmolar-rescue', statement: 'Activate individualized expert-selected hyperosmolar rescue with safety guardrails.', measure: 'The intent preserved agent, dose, access, fluid, sodium, renal, and osmolar decisions for the treating team.' },
      { id: 'reassess-intracranial-hypertension-trajectory', statement: 'Reassess ICP, CPP, pupils, systemic physiology, and escalation need.', measure: 'The fixed immediate response improved ICP and CPP without proving durable control, recovery, or outcome.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Carney N, Totten AM, O’Reilly C, et al. Guidelines for the Management of Severe Traumatic Brain Injury, Fourth Edition. Neurosurgery. 2017;80(1):6-15.',
        'Hawryluk GWJ, Aguilera S, Buki A, et al. A management algorithm for patients with intracranial pressure monitoring: the Seattle International Severe Traumatic Brain Injury Consensus Conference. Intensive Care Med. 2019;45:1783-1794.',
        'Cook AM, Morgan Jones G, Hawryluk GWJ, et al. Guidelines for the Acute Treatment of Cerebral Edema in Neurocritical Care Patients. Neurocrit Care. 2020;32:647-666.',
      ] },
    limitations: ['intracranial-hypertension-findings-and-response-are-authored',
      'intracranial-hypertension-protection-and-rescue-actions-are-proxies',
      'no-live-icp-monitoring-hyperosmolar-prescribing-procedure-prognosis-or-outcome'],
  },
  patient: { ageYears: 34, sex: 'male', heightCm: 180, weightKg: 84, asaClass: 5,
    diagnosis: 'Severe traumatic brain injury with monitored intracranial hypertension',
    procedure: 'Intracranial hypertension stabilization',
    comorbidities: ['No chronic disease reported'],
    medications: ['Reported analgesia, sedation, and seizure prophylaxis; delivery not modeled'],
    allergies: ['No known drug allergies'], fasting: 'ICU patient; enteral-nutrition state not represented',
    baseline: { heartRateBpm: 88, meanArterialMmHg: 82, strokeVolumeMl: 60,
      hemoglobinGPerDl: 12.9, bloodVolumeMl: 5200, coreTemperatureC: 37.7,
      arterialStiffness: 1.05, baroreflexGain: 0.6, fixedStrokeVolume: false },
    airway: { difficulty: 0.3, difficultMaskVentilation: false,
      assessment: 'Intubated with reported waveform capnography and bilateral ventilation' },
    respiratory: { profile: 'moderately-ill' } },
  equipment: { monitoring: ['ecg', 'arterial-line', 'pulse-oximetry', 'capnography', 'temperature'],
    airwayDevice: 'tracheal-tube', ventilator: { mode: 'volume-control', fio2: 0.35,
      tidalVolumeMl: 480, respiratoryRateBpm: 16, freshGasFlowLPerMin: 10, delivering: true } },
  formulary: [],
  timeline: [
    { id: 'intracranial-hypertension-presentation', type: 'narrative', target: 'intracranial-hypertension',
      atTick: 0, severity: 'critical', message: 'A 34-year-old intubated man is 6 hours from severe blunt traumatic brain injury and decompressive lesion evacuation. A parenchymal ICP monitor reports 28 mmHg for 8 minutes with a consistent waveform. MAP is 82 mmHg, calculated CPP is 54 mmHg, HR is 88/min, SpO₂ 97% on FiO₂ 0.35, EtCO₂ 40 mmHg, and temperature 37.7°C. The right pupil remains 4 mm and sluggish and the left 3 mm and reactive, unchanged from the post-operative examination. No intracranial-hypertension response has been recorded.' },
    { id: 'intracranial-hypertension-boundary', type: 'narrative', target: 'intracranial-hypertension-boundary',
      atTick: 0, severity: 'warning', message: 'Fixed review reports a secured airway, bilateral ventilation, no current seizure, head of bed at 10° with the neck rotated during line care, intermittent ventilator dyssynchrony, sodium 140 mmol/L, glucose 132 mg/dL, hemoglobin 12.9 g/dL, urine output 45 mL/h, and no new external bleeding or hypotension. The latest post-operative CT is reported as diffuse edema without a new evacuable lesion; repeat imaging and surgical review remain open. Activate neurocritical, neurosurgical, nursing, respiratory-therapy, and pharmacy help. Treat sustained ICP above 22 mmHg in the full clinical and imaging context, protect CPP within an individualized 60–70 mmHg range without aggressively forcing it above 70, restore neutral head and venous drainage, and protect oxygenation, ventilation, perfusion, temperature, comfort, synchrony, glucose, sodium, and seizure surveillance. Prolonged prophylactic aggressive hyperventilation is not selected. Activate individualized expert-selected hyperosmolar rescue with sodium, chloride, osmolality, renal, volume, access, and response guardrails; no universal agent, concentration, dose, or route is taught. Examination, ICP or other monitoring acquisition or interpretation, CPP calculation, diagnosis, oxygen, ventilation, positioning, fluid or drug delivery, access, dosing, hyperosmolar therapy, drain use, imaging, surgery, transfer, disposition, prognosis, and outcome are not simulated.' },
  ],
  debrief: { rubric: [
    { id: 'intracranial-hypertension-recognition', objectiveId: 'recognize-intracranial-hypertension', question: 'Which combined ICP, CPP, examination, and imaging findings triggered escalation?' },
    { id: 'intracranial-hypertension-context', objectiveId: 'review-intracranial-hypertension-context', question: 'Which reversible drivers and systemic threats needed review before escalating treatment?' },
    { id: 'intracranial-hypertension-protection', objectiveId: 'activate-first-tier-brain-protection', question: 'How did positioning and systemic protection preserve venous drainage and cerebral perfusion?' },
    { id: 'intracranial-hypertension-rescue', objectiveId: 'activate-individualized-hyperosmolar-rescue', question: 'Why did hyperosmolar rescue remain individualized and safety-monitored?' },
    { id: 'intracranial-hypertension-response', objectiveId: 'reassess-intracranial-hypertension-trajectory', question: 'What improved immediately, and which escalation, durability, recovery, and outcome questions stayed open?' },
  ] },
};
