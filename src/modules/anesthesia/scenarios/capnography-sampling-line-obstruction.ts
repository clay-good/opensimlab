/** A stable patient whose carbon-dioxide sample path, not ventilation, fails. */

import type { Scenario } from './types';

export const CAPNOGRAPHY_SAMPLING_LINE_OBSTRUCTION: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'capnography-sampling-line-obstruction',
    version: '0.1.0',
    maturity: 'preview',
    title: 'Capnography sampling-line obstruction',
    author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0',
    estimatedMinutes: 5,
    difficulty: 'introductory',
    objectives: [
      {
        id: 'cross-check-capnography-loss',
        statement: 'Cross-check the patient and independent signals before treating a flat capnogram as apnea.',
        measure: 'An accepted ventilation cross-check was recorded within 30 seconds of sampling-line obstruction and before reconnection.',
      },
      {
        id: 'preserve-stable-ventilation',
        statement: 'Preserve the stable respiratory trajectory while diagnosing the isolated monitor failure.',
        measure: 'Before sample-path restoration, spontaneous respiratory rate stayed above zero, saturation stayed at least 94%, and no airway instrumentation or commanded-breath change was recorded.',
      },
      {
        id: 'restore-capnography-sampling',
        statement: 'Restore the carbon-dioxide sample path and confirm that the waveform returns.',
        measure: 'An accepted sample-line reconnection followed the cross-check within 60 seconds of obstruction.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0',
      sources: [
        'Klein et al. Recommendations for standards of monitoring during anaesthesia and recovery 2021. Anaesthesia 2021;76:1212-23. PMID 34013531',
        'WFSA Minimum Capnometer Specifications 2021. Anesth Analg 2021;133:1132-7. PMID 34427566',
      ],
    },
    limitations: [
      'capnography-sampling-line-obstruction-is-display-only',
      'capnography-cross-check-is-screen-intent',
      'bolus-injection-is-instantaneous',
    ],
  },
  patient: {
    ageYears: 45, sex: 'female', heightCm: 165, weightKg: 68, asaClass: 1,
    diagnosis: 'Distal radius fracture', procedure: 'Wrist fixation under brachial plexus block',
    comorbidities: ['None'], medications: ['None'], allergies: ['None known'],
    fasting: 'Eight hours for solids, two hours for clear fluids',
    baseline: {
      heartRateBpm: 70, meanArterialMmHg: 88, strokeVolumeMl: 70,
      hemoglobinGPerDl: 13.6, bloodVolumeMl: 4500, coreTemperatureC: 36.6,
      arterialStiffness: 1, baroreflexGain: 1, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.12, difficultMaskVentilation: false,
      assessment: 'Awake, conversing, and breathing comfortably through a nasal carbon-dioxide sampling cannula',
    },
    respiratory: { profile: 'healthy' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'capnography', 'pulse-oximetry', 'temperature'],
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 450, respiratoryRateBpm: 12,
      delivering: false,
    },
  },
  formulary: [{
    drugId: 'propofol', concentration: 10, concentrationUnit: 'mg/mL',
    deliveryModes: ['bolus'], syringeVolumeMl: 20, typicalDose: 20,
    presets: [
      { label: '10 mg', amount: 10, unit: 'mg' },
      { label: '20 mg', amount: 20, unit: 'mg' },
    ],
  }],
  timeline: [
    {
      id: 'briefing', type: 'narrative', atTick: 0, severity: 'advisory',
      message: 'The block is working. She is awake, conversing, and breathing steadily without sedative medication. A nasal carbon-dioxide sampling cannula shows a normal trace. When the monitor changes, decide whether the patient changed with it. This case tests signal discrimination, not sedation technique.',
    },
    {
      id: 'sampling-line-blocks', type: 'artifact', atTick: 1200,
      target: 'sampling-line-obstruction', severity: 'artifact',
    },
    {
      id: 'case-end', type: 'narrative', atTick: 3600, severity: 'advisory',
      message: 'The practice window is ending. Confirm that the sampled waveform is present again, then debrief which independent evidence separated equipment failure from apnea.',
    },
  ],
  replayPoints: [{
    id: 'before-capnography-loss',
    label: 'Before the capnogram disappears',
    objectiveId: 'cross-check-capnography-loss',
    atTick: 1199,
    reason: 'Rehearse the first discrimination step while the patient trajectory and independent signals are still stable.',
  }],
  debrief: { rubric: [
    {
      id: 'signal-cross-check', objectiveId: 'cross-check-capnography-loss',
      question: 'Which independent observations told you whether ventilation had changed with the capnogram?',
      concept: 'capnogram-morphology',
    },
    {
      id: 'avoid-monitor-treatment', objectiveId: 'preserve-stable-ventilation',
      question: 'Which patient-changing actions did you avoid while testing the monitor explanation?',
      concept: 'capnogram-morphology',
    },
    {
      id: 'restore-sample-path', objectiveId: 'restore-capnography-sampling',
      question: 'What confirmed that the carbon-dioxide sample path, rather than patient ventilation, had been restored?',
      concept: 'capnogram-morphology',
    },
  ] },
};
