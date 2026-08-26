/** Bounded adult auto-PEEP recognition and reassessment. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const AUTO_PEEP: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'auto-peep', version: '0.1.0', maturity: 'preview',
    title: 'Auto-PEEP and dynamic hyperinflation', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 9, difficulty: 'intermediate', objectives: [
      { id: 'review-auto-peep-patient-and-flow', statement: 'Integrate the patient, expiratory flow-time graphic, delivered breathing pattern, pressures, gas exchange, and circulation.', measure: 'Persistent end-expiratory flow and a short expiratory interval were reviewed with the whole-patient pattern.' },
      { id: 'measure-auto-peep', statement: 'Use a valid passive expiratory-hold proxy to distinguish set, total, and intrinsic PEEP.', measure: 'Total PEEP 16 cm H₂O minus set PEEP 5 cm H₂O yielded 11 cm H₂O intrinsic PEEP.' },
      { id: 'classify-auto-peep-pattern', statement: 'Classify the bounded obstructive dynamic-hyperinflation pattern and its trigger, pressure, and hemodynamic consequences.', measure: 'The learner linked incomplete exhalation to air trapping without treating one graphic as universal proof.' },
      { id: 'record-auto-peep-correction-intent', statement: 'Record respiratory-therapy and senior-review intent to treat obstruction and preserve more expiratory time while retaining protective guardrails.', measure: 'The plan avoided universal settings and reflex external-PEEP claims.' },
      { id: 'reassess-auto-peep-response', statement: 'Reassess flow, total and intrinsic PEEP, pressures, triggering, gas exchange, and circulation after adjustment.', measure: 'The fixed 10-minute response demonstrated less trapping with bounded hypercapnia.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Goodfellow LT, Miller AG, Varekojis SM, et al. AARC Clinical Practice Guideline: Patient-Ventilator Assessment. Respir Care. 2024;69:1042-1054.',
        'Blanch L, Bernabé F, Lucangelo U. Measurement of air trapping, intrinsic positive end-expiratory pressure, and dynamic hyperinflation in mechanically ventilated patients. Respir Care. 2005;50:110-124.',
        'Mein SA, Ferrera MC. Management of Asthma and COPD Exacerbations in Adults in the ICU. CHEST Crit Care. 2025;3:100107.',
      ] },
    limitations: ['auto-peep-flow-mechanics-and-response-are-authored',
      'auto-peep-expiratory-hold-airway-and-ventilator-controls-are-proxies',
      'no-live-auto-peep-diagnosis-ventilator-prescribing-procedure-or-outcome'],
  },
  patient: { ageYears: 67, sex: 'female', heightCm: 165, weightKg: 70, asaClass: 4,
    diagnosis: 'Authored obstructive dynamic hyperinflation with intrinsic PEEP',
    procedure: 'Auto-PEEP recognition and reassessment',
    comorbidities: ['Chronic obstructive pulmonary disease'],
    medications: ['ICU infusions and bronchodilators not represented'],
    allergies: ['No known drug allergies'], fasting: 'Enteral feeding held for current assessment',
    baseline: { heartRateBpm: 112, meanArterialMmHg: 62, strokeVolumeMl: 48,
      hemoglobinGPerDl: 12.1, bloodVolumeMl: 4800, coreTemperatureC: 37.2,
      arterialStiffness: 1.1, baroreflexGain: 0.8, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Established cuffed tracheal tube' }, respiratory: { profile: 'moderately-ill' } },
  equipment: { monitoring: ['ecg', 'arterial-line', 'pulse-oximetry', 'capnography', 'temperature'],
    ventilator: { mode: 'volume-control', fio2: 0.4, tidalVolumeMl: 480,
      respiratoryRateBpm: 28, freshGasFlowLPerMin: 10, delivering: true } },
  formulary: [],
  timeline: [
    { id: 'auto-peep-presentation', type: 'narrative', target: 'auto-peep', atTick: 0,
      severity: 'critical', message: 'A 67-year-old intubated woman with COPD receives volume control at 480 mL and 28/min, set PEEP 5 cm H₂O, and FiO₂ 0.40. Expiratory flow remains below zero when each next breath begins. Peak pressure is 35 cm H₂O while a passive plateau is 22 cm H₂O; several visible efforts fail to trigger a breath. SpO₂ is 92%, HR 112/min, MAP 62 mmHg, pH 7.24, and PaCO₂ 64 mmHg. A brief authored passive window is available for the expiratory-hold proxy. No structured assessment has been recorded.' },
    { id: 'auto-peep-boundary', type: 'narrative', target: 'auto-peep-boundary', atTick: 0,
      severity: 'warning', message: 'Review the patient with expiratory flow, timing, delivered volume, pressures, gas exchange, and circulation; review the valid passive expiratory-hold panel; classify the bounded dynamic-hyperinflation pattern; record senior and respiratory-therapy intent to treat obstruction and preserve more time for exhalation while retaining protective volume and pressure guardrails; then review the fixed 10-minute response. Examination, waveform or mechanics acquisition, airway or equipment handling, diagnosis, ventilator mode or setting selection, external-PEEP titration, drug prescribing or delivery, sedation or paralysis, blood sampling, procedures, disposition, and outcome are not simulated.' },
  ],
  debrief: { rubric: [
    { id: 'auto-peep-flow', objectiveId: 'review-auto-peep-patient-and-flow', question: 'Which patient, flow-time, timing, pressure, gas, and circulation observations raised concern for incomplete exhalation?' },
    { id: 'auto-peep-measurement', objectiveId: 'measure-auto-peep', question: 'How were set, total, and intrinsic PEEP separated, and when is the hold measurement valid?' },
    { id: 'auto-peep-pattern', objectiveId: 'classify-auto-peep-pattern', question: 'How could this pattern impair triggering and circulation without proving every obstructive mechanism?' },
    { id: 'auto-peep-correction', objectiveId: 'record-auto-peep-correction-intent', question: 'How did the plan create more expiratory time and treat resistance without prescribing universal settings?' },
    { id: 'auto-peep-response', objectiveId: 'reassess-auto-peep-response', question: 'Which 10-minute changes supported less trapping, and which tradeoff remained under observation?' },
  ] },
};
