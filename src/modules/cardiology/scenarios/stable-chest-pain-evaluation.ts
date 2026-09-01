/** Bounded stable chest-pain evaluation lesson. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const STABLE_CHEST_PAIN_EVALUATION: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'stable-chest-pain-evaluation', version: '0.1.0', maturity: 'preview',
    title: 'Stable chest-pain evaluation', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 7, difficulty: 'introductory', objectives: [
      { id: 'verify-stable-chest-pain-trajectory', statement: 'Verify stability and screen the fixed history for acute or changing features.', measure: 'Duration, trigger, relief, recent change, rest symptoms, associated features, and acute escalation triggers were reviewed.' },
      { id: 'characterize-stable-chest-pain-pattern', statement: 'Characterize symptom quality, location, trigger, relief, frequency, and functional impact without using “atypical.”', measure: 'The complete fixed symptom pattern was recorded without declaring a cause.' },
      { id: 'estimate-stable-chest-pain-clinical-likelihood', statement: 'Integrate age, sex, symptoms, risk factors, examination claims, and resting ECG into a bounded clinical-likelihood review.', measure: 'The authored not-very-low likelihood prompted pathway review without an exact score or diagnosis.' },
      { id: 'record-stable-chest-pain-testing-intent', statement: 'Record patient-specific noninvasive-testing intent through shared decision-making and local expertise.', measure: 'Test strengths, limitations, radiation, exercise capacity, ECG interpretability, preference, access, and local quality remained visible.' },
      { id: 'safety-net-stable-chest-pain-follow-up', statement: 'Record follow-up and an explicit acute-change safety net.', measure: 'Rest or prolonged symptoms, increasing frequency or severity, syncope, marked dyspnea, or instability triggered urgent reassessment.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Gulati M, Levy PD, Mukherjee D, et al. 2021 AHA/ACC/ASE/CHEST/SAEM/SCCT/SCMR Guideline for the Evaluation and Diagnosis of Chest Pain. Circulation. 2021;144:e368-e454. PMID:34709928.',
        'Vrints C, Andreotti F, Koskinas KC, et al. 2024 ESC Guidelines for the management of chronic coronary syndromes. Eur Heart J. 2024;45:3415-3537. PMID:39210710.',
      ] },
    limitations: ['stable-chest-pain-history-likelihood-and-plan-are-authored',
      'stable-chest-pain-controls-record-review-and-shared-plan-intent-only',
      'no-live-cardiac-testing-diagnosis-prescribing-prognosis-or-outcome'],
  },
  patient: { ageYears: 54, sex: 'male', heightCm: 178, weightKg: 86, asaClass: 3,
    diagnosis: 'Authored stable exertional chest-pressure pattern; cause unconfirmed',
    procedure: 'Stable chest-pain evaluation',
    comorbidities: ['Hypertension', 'Current tobacco use', 'LDL cholesterol 168 mg/dL'],
    medications: ['Medication reconciliation not represented'], allergies: ['No known drug allergies'],
    fasting: 'Outpatient; fasting is not relevant to this recognition lab',
    baseline: { heartRateBpm: 72, meanArterialMmHg: 92, strokeVolumeMl: 72,
      hemoglobinGPerDl: 14.2, bloodVolumeMl: 5200, coreTemperatureC: 36.8,
      arterialStiffness: 1.15, baroreflexGain: 1, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Speaking comfortably; no fixed respiratory distress finding' },
    respiratory: { profile: 'healthy' } },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'],
    airwayDevice: 'facemask', ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 500,
      respiratoryRateBpm: 14, freshGasFlowLPerMin: 10, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'stable-chest-pain-presentation', type: 'narrative',
      target: 'stable-chest-pain-evaluation', atTick: 0, severity: 'advisory',
      message: 'For 3 months, brisk walking or climbing 2 flights of stairs has produced central pressure after about 6 minutes that resolves within 4 minutes of rest. It occurs 2 or 3 times per week without increasing frequency, severity, duration, or lower trigger threshold. There is no rest or prolonged pain, syncope, marked dyspnea, diaphoresis, or current symptom. HR is 72/min, MAP 92 mmHg, SpO₂ 99% on room air, RR 14/min, and temperature 36.8°C. The fixed resting ECG report is sinus rhythm without ischemic ST-T change. The cause is not announced.' },
    { id: 'stable-chest-pain-boundary', type: 'narrative',
      target: 'stable-chest-pain-evaluation-boundary', atTick: 0, severity: 'warning',
      message: 'First verify the stable trajectory and preserve urgent reassessment for rest or prolonged symptoms, increasing frequency, severity, duration or lower threshold, syncope, marked dyspnea, hemodynamic instability, or other acute concern. Characterize the symptom without calling it atypical. Then integrate age, sex, symptoms, hypertension, current tobacco use, LDL 168 mg/dL, the fixed examination claims, and resting ECG report. The authored risk-factor-weighted likelihood is not very low, so patient-specific noninvasive-testing review is appropriate, but no exact score, coronary diagnosis, or universal test is supplied. Shared choice should consider the question being asked, test strengths and limitations, exercise capacity, ECG interpretability, radiation and contrast, comorbidity, preference, access, local expertise, and local quality. Record follow-up and the acute-change safety net. The screen does not examine, acquire or interpret an ECG, calculate risk, measure exercise capacity, order or perform testing, diagnose coronary disease or ischemia, prescribe medication, determine disposition, or predict events or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'stable-chest-pain-stability', objectiveId: 'verify-stable-chest-pain-trajectory', question: 'Which fixed features support a stable trajectory, and which changes would make it urgent?' },
    { id: 'stable-chest-pain-symptoms', objectiveId: 'characterize-stable-chest-pain-pattern', question: 'How did trigger, relief, frequency, and functional impact shape the pattern without declaring a cause?' },
    { id: 'stable-chest-pain-likelihood', objectiveId: 'estimate-stable-chest-pain-clinical-likelihood', question: 'Which patient and ECG factors informed likelihood, and why was no exact score supplied?' },
    { id: 'stable-chest-pain-testing', objectiveId: 'record-stable-chest-pain-testing-intent', question: 'Which patient, test, preference, and local factors belong in shared test selection?' },
    { id: 'stable-chest-pain-safety-net', objectiveId: 'safety-net-stable-chest-pain-follow-up', question: 'Which changes trigger urgent reassessment rather than routine follow-up?' },
  ] },
};
