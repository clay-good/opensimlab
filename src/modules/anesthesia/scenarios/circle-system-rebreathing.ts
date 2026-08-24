/** Rising inspired carbon dioxide from exhausted absorbent in a circle system. */

import type { Scenario } from './types';

export const CIRCLE_SYSTEM_REBREATHING: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'circle-system-rebreathing', version: '0.1.0', maturity: 'draft',
    title: 'Circle-system rebreathing', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 8, difficulty: 'intermediate',
    objectives: [
      {
        id: 'recognize-inspired-carbon-dioxide',
        statement: 'Recognize rebreathing from a raised inspiratory carbon-dioxide baseline while breath delivery continues.',
        measure: 'An accepted capnogram assessment was recorded within 30 seconds of absorbent failure.',
      },
      {
        id: 'bridge-with-fresh-gas-flow',
        statement: 'Increase fresh-gas flow as a bounded bridge while preparing definitive circuit correction.',
        measure: 'Fresh-gas flow reached at least 10 L/min within 60 seconds of failure and before absorbent replacement.',
      },
      {
        id: 'replace-exhausted-absorbent',
        statement: 'Replace the exhausted absorbent after assessing the trace, then confirm inspired carbon dioxide clears.',
        measure: 'Accepted absorbent replacement followed assessment within 90 seconds of failure and inspired carbon dioxide later fell below 1 mmHg.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0',
      sources: [
        'Verbeke D, et al. When to replace a CO2 absorber? Acta Anaesthesiol Belg 2023;74:43-49. DOI 10.56126/74.1.06.',
        'Feldman JM. Replacing CO2 Absorbent During Surgery—The Risk of Hypoventilation Continues. APSF Newsletter 2024;39(3).',
        'Klein et al. Recommendations for standards of monitoring during anaesthesia and recovery 2021. Anaesthesia 2021;76:1212-23. PMID 34013531.',
      ],
    },
    limitations: [
      'circle-system-rebreathing-is-a-bounded-teaching-trajectory',
      'breathing-circuit-actions-are-screen-intent',
      'initial-maintenance-state-is-not-an-individual-prediction',
      'bolus-injection-is-instantaneous',
    ],
  },
  patient: {
    ageYears: 47, sex: 'female', heightCm: 166, weightKg: 72, asaClass: 2,
    diagnosis: 'Symptomatic cholelithiasis', procedure: 'Laparoscopic cholecystectomy',
    comorbidities: ['Controlled gastroesophageal reflux'], medications: ['Omeprazole'], allergies: ['None known'],
    fasting: 'Eight hours for solids, two hours for clear fluids',
    baseline: {
      heartRateBpm: 72, meanArterialMmHg: 82, strokeVolumeMl: 68,
      hemoglobinGPerDl: 13.4, bloodVolumeMl: 4700, coreTemperatureC: 36.6,
      arterialStiffness: 1, baroreflexGain: 1, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.15, difficultMaskVentilation: false,
      assessment: 'Tracheal tube secured; bilateral ventilation and a normal capnogram were confirmed before this practice window',
    },
    respiratory: { profile: 'healthy' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'capnography', 'pulse-oximetry', 'temperature', 'depth-index'],
    airwayDevice: 'tracheal-tube',
    ventilator: {
      mode: 'volume-control', fio2: 0.5, tidalVolumeMl: 450, respiratoryRateBpm: 12,
      freshGasFlowLPerMin: 1, sevofluranePercent: 1.6, delivering: true,
    },
  },
  formulary: [{
    drugId: 'propofol', concentration: 10, concentrationUnit: 'mg/mL',
    deliveryModes: ['bolus'], syringeVolumeMl: 20, typicalDose: 20,
    presets: [{ label: '20 mg', amount: 20, unit: 'mg' }],
  }],
  timeline: [
    {
      id: 'briefing', type: 'narrative', atTick: 0, severity: 'advisory',
      message: 'Maintenance anesthesia is established through a circle system at 1 L/min fresh-gas flow. The tracheal tube, delivered breaths, saturation, and capnogram are stable. When carbon dioxide changes, read the whole trace and decide whether the problem is ventilation, metabolism, or the breathing system.',
    },
    {
      id: 'absorbent-exhausts', type: 'equipment-failure', atTick: 1800,
      target: 'co2-absorbent-exhaustion', severity: 'warning',
    },
    {
      id: 'rebreathing-cue', type: 'narrative', atTick: 1800, severity: 'warning',
      message: 'The capnogram no longer returns to zero during inspiration. End-tidal carbon dioxide is rising, while delivered breaths, airway pressure, saturation, and temperature remain stable. Diagnose the pattern, limit ongoing rebreathing, and correct the circuit cause.',
    },
    {
      id: 'case-end', type: 'narrative', atTick: 4800, severity: 'advisory',
      message: 'The practice window is ending. Confirm that the inspiratory baseline has returned near zero, then debrief what separated rebreathing from hypoventilation, bronchospasm, and hypermetabolism.',
    },
  ],
  replayPoints: [{
    id: 'before-rebreathing', label: 'Before inspired carbon dioxide rises',
    objectiveId: 'recognize-inspired-carbon-dioxide', atTick: 1799,
    reason: 'Rehearse reading the full capnogram and choosing a circuit response before carbon dioxide accumulates.',
  }],
  debrief: { rubric: [
    {
      id: 'inspiratory-baseline', objectiveId: 'recognize-inspired-carbon-dioxide',
      question: 'Which part of the capnogram identified rebreathing rather than absent ventilation or bronchospasm?',
      concept: 'capnogram-morphology',
    },
    {
      id: 'fresh-gas-bridge', objectiveId: 'bridge-with-fresh-gas-flow',
      question: 'How did fresh-gas flow change inspired carbon dioxide, and why was it a bridge rather than the definitive correction?',
      concept: 'capnogram-morphology',
    },
    {
      id: 'absorber-replacement', objectiveId: 'replace-exhausted-absorbent',
      question: 'What evidence showed that absorber replacement corrected the modeled circuit cause?',
      concept: 'capnogram-morphology',
    },
  ] },
};
