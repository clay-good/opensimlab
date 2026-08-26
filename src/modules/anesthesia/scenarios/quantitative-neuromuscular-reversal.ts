/** Quantitative monitoring and depth-matched reversal during established anesthesia. */

import type { Scenario } from './types';

export const QUANTITATIVE_NEUROMUSCULAR_REVERSAL: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'quantitative-neuromuscular-reversal', version: '0.1.0', maturity: 'preview',
    title: 'Quantitative neuromuscular reversal', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 8, difficulty: 'intermediate',
    objectives: [
      {
        id: 'establish-quantitative-baseline',
        statement: 'Confirm quantitative neuromuscular monitoring before giving the declared blocking dose.',
        measure: 'A recorded train-of-four ratio of at least 0.9 preceded one accepted 0.6 mg/kg rocuronium bolus.',
      },
      {
        id: 'reverse-recovering-block',
        statement: 'Use the measured recovery-phase block depth rather than elapsed time to select reversal.',
        measure: 'The engine accepted a recovery-phase reversal matched to train-of-four count, ratio, and post-tetanic count.',
      },
      {
        id: 'confirm-quantitative-recovery',
        statement: 'Reassess the quantitative response after the accepted reversal.',
        measure: 'A train-of-four ratio of at least 0.9 was recorded after reversal.',
      },
      {
        id: 'maintain-anesthesia-during-block',
        statement: 'Keep hypnosis, ventilation, and oxygenation established while neuromuscular state changes.',
        measure: 'Predicted depth remained 40–60, oxygen saturation remained at least 92%, and no accepted action stopped delivered ventilation after rocuronium.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0',
      sources: [
        'Thilen SR, et al. 2023 ASA Practice Guidelines for Monitoring and Antagonism of Neuromuscular Blockade. Anesthesiology 2023;138:13-41. PMID 36520073.',
        'McCoy EP, et al. Neuromuscular effects of rocuronium bromide during fentanyl and halothane anaesthesia. Anaesthesia 1993;48:103-5. PMID 8460753.',
        'Klein et al. Recommendations for standards of monitoring during anaesthesia and recovery 2021. PMID 34013531.',
      ],
    },
    limitations: [
      'rocuronium-course-is-a-teaching-model',
      'tof-monitor-is-an-idealized-teaching-signal',
      'neuromuscular-reversal-is-bounded-without-emergence',
      'volatile-circulatory-effect-is-a-teaching-model',
    ],
  },
  patient: {
    ageYears: 45, sex: 'female', heightCm: 166, weightKg: 70, asaClass: 2,
    diagnosis: 'Symptomatic cholelithiasis', procedure: 'Laparoscopic cholecystectomy',
    comorbidities: ['Controlled gastroesophageal reflux'], medications: ['Omeprazole'],
    allergies: ['None known'], fasting: 'Eight hours for solids, two hours for clear fluids',
    baseline: {
      heartRateBpm: 70, meanArterialMmHg: 84, strokeVolumeMl: 68,
      hemoglobinGPerDl: 13.4, bloodVolumeMl: 4700, coreTemperatureC: 36.6,
      arterialStiffness: 1, baroreflexGain: 1, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.14, difficultMaskVentilation: false,
      assessment: 'Tracheal tube secured; bilateral ventilation and continuous capnography confirmed before this practice window',
    },
    respiratory: { profile: 'healthy' },
  },
  equipment: {
    monitoring: [
      'ecg', 'nibp', 'capnography', 'pulse-oximetry', 'temperature',
      'depth-index', 'train-of-four',
    ],
    airwayDevice: 'tracheal-tube',
    ventilator: {
      mode: 'volume-control', fio2: 0.5, tidalVolumeMl: 450, respiratoryRateBpm: 12,
      freshGasFlowLPerMin: 2, sevofluranePercent: 1.25, delivering: true,
    },
  },
  formulary: [{
    drugId: 'rocuronium', deliveryModes: ['bolus'], concentration: 10,
    concentrationUnit: 'mg/mL', syringeVolumeMl: 10, typicalDose: 42,
    presets: [{ label: '0.6 mg/kg', amount: 0.6, unit: 'mg/kg' }],
  }],
  timeline: [
    {
      id: 'briefing', type: 'narrative', atTick: 0, severity: 'advisory',
      message: 'Anesthesia, the tracheal tube, and delivered ventilation are established. The surgeon requests one 0.6 mg/kg rocuronium dose for the remaining dissection. Confirm the quantitative baseline, give the declared dose, and keep watching the measured block rather than the clock.',
    },
    {
      id: 'closure-sooner-than-expected', type: 'narrative', atTick: 3000, severity: 'info',
      message: 'The operation is ending sooner than expected. Use the current train-of-four count, ratio, and post-tetanic count to decide whether a modeled reversal branch is available.',
    },
    {
      id: 'case-end', type: 'narrative', atTick: 6000, severity: 'advisory',
      message: 'The reversal practice window is ending. Confirm quantitative recovery and review what this screen cannot say about emergence or extubation readiness.',
    },
  ],
  replayPoints: [{
    id: 'before-reversal-decision', label: 'Before the reversal decision',
    objectiveId: 'reverse-recovering-block', atTick: 2999,
    reason: 'Compare waiting for a measured recovery branch with choosing from elapsed time or an onset-phase value.',
  }],
  debrief: { rubric: [
    {
      id: 'baseline', objectiveId: 'establish-quantitative-baseline',
      question: 'What quantitative value established the reference before rocuronium?',
      concept: 'train-of-four-and-residual-blockade',
    },
    {
      id: 'recovery-depth', objectiveId: 'reverse-recovering-block',
      question: 'Which measured recovery-phase depth supported the accepted branch, and why was elapsed time insufficient?',
      concept: 'train-of-four-and-residual-blockade',
    },
    {
      id: 'ratio-after', objectiveId: 'confirm-quantitative-recovery',
      question: 'What quantitative ratio was recorded after reversal, and what does it not prove?',
      concept: 'train-of-four-and-residual-blockade',
    },
    {
      id: 'paralysis-is-not-anesthesia', objectiveId: 'maintain-anesthesia-during-block',
      question: 'Which separate signals showed that hypnosis and ventilation continued while movement was suppressed?',
      concept: 'depth-monitoring-and-its-limits',
    },
  ] },
};
