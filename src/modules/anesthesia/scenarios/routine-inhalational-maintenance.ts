/** Routine volatile maintenance across changing surgical stimulation. */

import type { Scenario } from './types';

export const ROUTINE_INHALATIONAL_MAINTENANCE: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'routine-inhalational-maintenance', version: '0.1.0', maturity: 'draft',
    title: 'Routine inhalational maintenance', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 9, difficulty: 'introductory',
    objectives: [
      {
        id: 'maintain-bounded-depth',
        statement: 'Use end-tidal agent, predicted depth, and the whole patient trend to preserve a bounded maintenance state.',
        measure: 'Predicted depth remained between 40 and 60 for at least 80% of the scored maintenance window.',
      },
      {
        id: 'anticipate-surgical-stimulus',
        statement: 'Anticipate the declared surgical stimulus with modeled analgesic delivery, then judge the observed response.',
        measure: 'An accepted remifentanil infusion was running before stimulus onset, and heart rate and mean arterial pressure each rose by less than 20% in the following minute.',
      },
      {
        id: 'reassess-when-stimulus-falls',
        statement: 'Reduce or stop the modeled opioid when the stimulus ends, then confirm pressure and depth recover together.',
        measure: 'Remifentanil was reduced or stopped within 30 seconds of stimulus offset; by scenario end mean arterial pressure was at least 65 mmHg and predicted depth was between 40 and 60.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0',
      sources: [
        'United States Food and Drug Administration. Sevoflurane prescribing information. Drugs@FDA reference ID 4944925.',
        'Mapleson WW. Effect of age on MAC in humans. Br J Anaesth 1996;76:179-85. PMID 8777094.',
        'United States Food and Drug Administration approved labeling. Remifentanil hydrochloride for injection. Current DailyMed label.',
        'Klein et al. Recommendations for standards of monitoring during anaesthesia and recovery 2021. PMID 34013531.',
      ],
    },
    limitations: [
      'routine-maintenance-is-a-bounded-teaching-trajectory',
      'depth-index-is-a-drug-model-not-an-eeg',
      'volatile-circulatory-effect-is-a-teaching-model',
      'opioid-alone-hypnosis',
      'fresh-gas-flow-is-a-teaching-model',
    ],
  },
  patient: {
    ageYears: 47, sex: 'female', heightCm: 166, weightKg: 72, asaClass: 2,
    diagnosis: 'Symptomatic cholelithiasis', procedure: 'Laparoscopic cholecystectomy',
    comorbidities: ['Controlled gastroesophageal reflux'], medications: ['Omeprazole'],
    allergies: ['None known'], fasting: 'Eight hours for solids, two hours for clear fluids',
    baseline: {
      heartRateBpm: 72, meanArterialMmHg: 82, strokeVolumeMl: 68,
      hemoglobinGPerDl: 13.4, bloodVolumeMl: 4700, coreTemperatureC: 36.6,
      arterialStiffness: 1, baroreflexGain: 1, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.15, difficultMaskVentilation: false,
      assessment: 'Tracheal tube secured; bilateral ventilation and continuous capnography confirmed before this practice window',
    },
    respiratory: { profile: 'healthy' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'capnography', 'pulse-oximetry', 'temperature', 'depth-index'],
    airwayDevice: 'tracheal-tube',
    ventilator: {
      mode: 'volume-control', fio2: 0.5, tidalVolumeMl: 450, respiratoryRateBpm: 12,
      freshGasFlowLPerMin: 2, sevofluranePercent: 1.2, delivering: true,
    },
  },
  formulary: [{
    drugId: 'remifentanil', deliveryModes: ['infusion'],
    concentration: 50, concentrationUnit: 'µg/mL', syringeVolumeMl: 50, typicalDose: 25,
    presets: [{ label: '0.25 µg/kg', amount: 0.25, unit: 'µg/kg' }],
  }],
  timeline: [
    {
      id: 'briefing', type: 'narrative', atTick: 0, severity: 'advisory',
      message: 'The tracheal tube and delivered breaths are established. End-tidal sevoflurane, predicted depth, and circulation are stable. The surgeon expects a more stimulating dissection in four minutes. Build a maintenance plan, observe what it changes, and keep reassessing as the surgical stimulus changes.',
    },
    {
      id: 'stimulus-warning', type: 'narrative', atTick: 1200, severity: 'info',
      message: 'The surgeon says the more stimulating portion will begin in two minutes.',
    },
    {
      id: 'dissection', type: 'surgical-stimulus', atTick: 2400, value: 0.6,
      durationTicks: 1200, severity: 'advisory',
      message: 'More stimulating dissection begins. Interpret the response across depth, heart rate, and pressure.',
    },
    {
      id: 'stimulus-falls', type: 'narrative', atTick: 3600, severity: 'info',
      message: 'The stimulating dissection ends. The surgeon is closing with little ongoing stimulation. Reassess every maintenance input rather than carrying the earlier plan forward automatically.',
    },
    {
      id: 'case-end', type: 'narrative', atTick: 5400, severity: 'advisory',
      message: 'The maintenance practice window is ending. Confirm that predicted depth and pressure have settled together, then debrief how planning differed from reaction.',
    },
  ],
  replayPoints: [
    {
      id: 'before-dissection', label: 'Before surgical stimulus rises',
      objectiveId: 'anticipate-surgical-stimulus', atTick: 2399,
      reason: 'Rehearse planning analgesic delivery before the observed response rather than chasing it afterward.',
    },
    {
      id: 'when-stimulus-falls', label: 'When surgical stimulus ends',
      objectiveId: 'reassess-when-stimulus-falls', atTick: 3599,
      reason: 'Rehearse reducing a maintenance input and confirming that pressure and depth recover together.',
    },
  ],
  debrief: { rubric: [
    {
      id: 'maintenance-evidence', objectiveId: 'maintain-bounded-depth',
      question: 'Which signals supported your maintenance assessment, and what could none of them prove alone?',
      concept: 'depth-monitoring-and-its-limits',
    },
    {
      id: 'planning-versus-reaction', objectiveId: 'anticipate-surgical-stimulus',
      question: 'What changed when you planned before the stimulus instead of reacting to the first pressure or heart-rate rise?',
      concept: 'hypnotic-opioid-synergy',
    },
    {
      id: 'reassessment', objectiveId: 'reassess-when-stimulus-falls',
      question: 'After the stimulus fell, which trend told you whether the earlier maintenance plan had become excessive?',
      concept: 'vasodilation-versus-hypovolemia',
    },
  ] },
};
