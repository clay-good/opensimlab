/** Bounded adult spontaneous-breathing-trial readiness, failure, and recovery. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const SPONTANEOUS_BREATHING_TRIAL: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'spontaneous-breathing-trial', version: '0.1.0', maturity: 'draft',
    title: 'Spontaneous-breathing trial', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 8, difficulty: 'intermediate', objectives: [
      { id: 'review-sbt-readiness', statement: 'Review spontaneous-breathing-trial readiness without requiring RSBI.', measure: 'Improving cause, oxygenation, circulation, alertness, and spontaneous effort were reviewed.' },
      { id: 'start-bounded-sbt', statement: 'Record a protocolized spontaneous-breathing trial without increasing inspired oxygen.', measure: 'The trial method and unchanged FiO₂ were explicit.' },
      { id: 'recognize-sbt-failure', statement: 'Integrate work, breathing pattern, oxygenation, circulation, comfort, and trajectory during the trial.', measure: 'Multiple intolerance signs, not one threshold, established failure.' },
      { id: 'stop-failed-sbt-and-recover', statement: 'Stop the failed trial, restore prior support, and reassess recovery.', measure: 'Support restoration preceded the fixed recovery panel.' },
      { id: 'plan-after-failed-sbt', statement: 'Review reversible contributors and plan another standardized assessment rather than extubating.', measure: 'The plan kept SBT success distinct from extubation readiness.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Roberts KJ, Goodfellow LT, Battey-Muse CM, et al. AARC Clinical Practice Guideline: Spontaneous Breathing Trials for Liberation From Adult Mechanical Ventilation. Respir Care. 2024;69:891-901.',
        'Ouellette DR, Patel S, Girard TD, et al. Liberation From Mechanical Ventilation in Critically Ill Adults: An Official CHEST/ATS Clinical Practice Guideline. Chest. 2017;151:166-180.',
        'Goodfellow LT, Miller AG, Varekojis SM, et al. AARC Clinical Practice Guideline: Patient-Ventilator Assessment. Respir Care. 2024;69:1042-1054.',
      ] },
    limitations: ['sbt-readiness-trial-failure-and-recovery-are-authored',
      'sbt-ventilator-assessment-and-support-controls-are-proxies',
      'no-live-sbt-prescribing-extubation-or-outcome'],
  },
  patient: { ageYears: 63, sex: 'female', heightCm: 165, weightKg: 72, asaClass: 4,
    diagnosis: 'Authored intolerance during a spontaneous-breathing trial',
    procedure: 'Breathing-trial readiness and reassessment',
    comorbidities: ['Improving pneumonia'], medications: ['Low-dose ICU sedation not represented'],
    allergies: ['No known drug allergies'], fasting: 'Enteral nutrition managed by the ICU team',
    baseline: { heartRateBpm: 94, meanArterialMmHg: 73, strokeVolumeMl: 62,
      hemoglobinGPerDl: 10.9, bloodVolumeMl: 4600, coreTemperatureC: 37.5,
      arterialStiffness: 1.0, baroreflexGain: 0.9, fixedStrokeVolume: false },
    airway: { difficulty: 0.15, difficultMaskVentilation: false,
      assessment: 'Established cuffed tracheal tube; moderate cough and manageable secretions' },
    respiratory: { profile: 'moderately-ill' } },
  equipment: { monitoring: ['ecg', 'arterial-line', 'pulse-oximetry', 'capnography', 'temperature'],
    airwayDevice: 'tracheal-tube', ventilator: { mode: 'pressure-control', fio2: 0.35,
      tidalVolumeMl: 420, respiratoryRateBpm: 16, freshGasFlowLPerMin: 10, delivering: true } },
  formulary: [],
  timeline: [
    { id: 'sbt-presentation', type: 'narrative', target: 'spontaneous-breathing-trial', atTick: 0,
      severity: 'advisory', message: 'On ventilator day 4 for improving pneumonia, a 63-year-old woman is awake, follows commands, initiates breaths, has a moderate cough with manageable secretions, SpO₂ 95% on FiO₂ 0.35 and PEEP 5 cm H₂O, HR 94/min, and MAP 73 mmHg without escalating vasopressor support. A standardized spontaneous-breathing-trial readiness review is due. No rapid shallow breathing index has been calculated and no trial has been recorded.' },
    { id: 'sbt-boundary', type: 'narrative', target: 'spontaneous-breathing-trial-boundary',
      atTick: 0, severity: 'warning', message: 'Review the improving cause, oxygenation, circulation, alertness, spontaneous effort, airway protection, and secretions. Record the local 30-minute pressure-support-5 cm H₂O trial without increasing FiO₂; SBTs may also be conducted without pressure support. The fixed trial develops respiratory rate 36/min, 220 mL tidal volume, accessory use, diaphoresis, distress, SpO₂ 88%, HR 124/min, and MAP 68 mmHg. Stop the failed trial, restore prior support, review recovery, and address reversible respiratory load, weakness, fluid status, cardiac load, pain, anxiety, sedation, nutrition, electrolytes, sleep, and secretions before another standardized assessment. SBT success alone would not prove extubation readiness. Examination, ventilator programming, monitoring acquisition, gas sampling, sedation changes, treatment, extubation, disposition, and outcome are not simulated.' },
  ],
  debrief: { rubric: [
    { id: 'sbt-readiness', objectiveId: 'review-sbt-readiness', question: 'Which domains made a trial reasonable without requiring one predictive index?' },
    { id: 'sbt-start', objectiveId: 'start-bounded-sbt', question: 'How was the trial standardized without hiding intolerance by increasing inspired oxygen?' },
    { id: 'sbt-failure', objectiveId: 'recognize-sbt-failure', question: 'Which convergent findings made this a failed trial?' },
    { id: 'sbt-recovery', objectiveId: 'stop-failed-sbt-and-recover', question: 'How did restoring support and reassessment close the immediate loop?' },
    { id: 'sbt-plan', objectiveId: 'plan-after-failed-sbt', question: 'What should be reviewed before another trial, and why is SBT success not extubation permission by itself?' },
  ] },
};
