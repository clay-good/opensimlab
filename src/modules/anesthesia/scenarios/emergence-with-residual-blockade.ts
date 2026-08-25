/** Bounded emergence decision when clinical signs conflict with quantitative recovery. */

import type { Scenario } from './types';

export const EMERGENCE_WITH_RESIDUAL_BLOCKADE: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'emergence-with-residual-blockade',
    version: '0.1.0',
    maturity: 'draft',
    title: 'Emergence with residual blockade',
    author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0',
    estimatedMinutes: 5,
    difficulty: 'intermediate',
    objectives: [
      {
        id: 'review-emergence-quantitative-monitor',
        statement: 'Read the quantitative train-of-four ratio instead of relying on clinical signs or twitch count alone.',
        measure: 'The focused quantitative monitor review was accepted before classification.',
      },
      {
        id: 'recognize-emergence-residual-blockade',
        statement: 'Identify residual neuromuscular blockade when four twitches show no detectable fade but the ratio remains below 0.9.',
        measure: 'Residual blockade was classified after the quantitative review.',
      },
      {
        id: 'defer-extubation-during-residual-blockade',
        statement: 'Keep the tracheal tube and delivered ventilation in place while recovery is addressed and reassessed.',
        measure: 'The defer-extubation-and-support plan was accepted after residual blockade was classified.',
      },
      {
        id: 'separate-recovery-from-extubation-readiness',
        statement: 'Treat quantitative neuromuscular recovery as necessary but not sufficient for a complete extubation decision.',
        measure: 'The accepted path deferred extubation without claiming that a ratio threshold alone proves readiness.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0',
      sources: [
        'Thilen SR, et al. 2023 ASA Practice Guidelines for Monitoring and Antagonism of Neuromuscular Blockade. Anesthesiology 2023;138:13-41. PMID 36520073.',
        'Fuchs-Buder T, et al. Peri-operative management of neuromuscular blockade: ESAIC guideline. Eur J Anaesthesiol 2023;40:82-94. PMID 36377554.',
      ],
    },
    limitations: [
      'emergence-residual-blockade-is-a-static-decision-vignette',
      'tof-monitor-is-an-idealized-teaching-signal',
      'no-extubation-or-recovery-physiology',
    ],
  },
  patient: {
    ageYears: 58, sex: 'male', heightCm: 178, weightKg: 82, asaClass: 2,
    diagnosis: 'Inguinal hernia', procedure: 'Laparoscopic inguinal hernia repair',
    comorbidities: ['Controlled hypertension'], medications: ['Amlodipine'],
    allergies: ['None known'], fasting: 'Eight hours for solids, two hours for clear fluids',
    baseline: {
      heartRateBpm: 72, meanArterialMmHg: 86, strokeVolumeMl: 72,
      hemoglobinGPerDl: 14.1, bloodVolumeMl: 5100, coreTemperatureC: 36.6,
      arterialStiffness: 1.1, baroreflexGain: 0.85, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.12, difficultMaskVentilation: false,
      assessment: 'Tracheal tube secured; delivered ventilation and continuous capnography remain established',
    },
    respiratory: { profile: 'healthy' },
  },
  equipment: {
    monitoring: [
      'ecg', 'nibp', 'capnography', 'pulse-oximetry', 'temperature', 'train-of-four',
    ],
    airwayDevice: 'tracheal-tube',
    startingTrainOfFourRatio: 0.72,
    ventilator: {
      mode: 'volume-control', fio2: 0.5, tidalVolumeMl: 480,
      respiratoryRateBpm: 12, freshGasFlowLPerMin: 4,
      sevofluranePercent: 0, delivering: true,
    },
  },
  formulary: [],
  timeline: [{
    id: 'emergence-residual-blockade-briefing', type: 'narrative',
    target: 'emergence-residual-blockade', atTick: 0, severity: 'advisory',
    message: 'Surgery is complete. After a reported sustained head lift and adequate tidal volume during a brief supported assessment, four visible twitches show no detectable fade. The tracheal tube and delivered ventilation remain in place. Review the quantitative ratio and choose the next airway plan. This static decision snapshot does not simulate consciousness, reversal, recovery time, airway removal, or full extubation readiness.',
  }],
  debrief: { rubric: [
    {
      id: 'emergence-monitor-review', objectiveId: 'review-emergence-quantitative-monitor',
      question: 'Which quantitative value changed the interpretation of the reassuring clinical signs?',
      concept: 'train-of-four-and-residual-blockade',
    },
    {
      id: 'emergence-residual-classification', objectiveId: 'recognize-emergence-residual-blockade',
      question: 'Why do four twitches and no detectable fade not exclude residual blockade here?',
      concept: 'train-of-four-and-residual-blockade',
    },
    {
      id: 'emergence-airway-plan', objectiveId: 'defer-extubation-during-residual-blockade',
      question: 'What did you preserve while quantitative recovery remained below the threshold?',
      concept: 'train-of-four-and-residual-blockade',
    },
    {
      id: 'emergence-readiness-boundary', objectiveId: 'separate-recovery-from-extubation-readiness',
      question: 'Why would reaching a ratio of at least 0.9 still not answer every extubation-readiness question?',
      concept: 'train-of-four-and-residual-blockade',
    },
  ] },
};
