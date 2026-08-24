/** A stable patient whose invasive pressure display, not circulation, changes. */

import type { Scenario } from './types';

export const ARTERIAL_PRESSURE_TRANSDUCER_ARTIFACT: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'arterial-pressure-transducer-artifact', version: '0.1.0', maturity: 'draft',
    title: 'Arterial-pressure transducer artifact', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 6, difficulty: 'intermediate',
    objectives: [
      {
        id: 'verify-invasive-pressure-independently',
        statement: 'Verify an implausible invasive pressure with an independent cuff result before treating the patient.',
        measure: 'An accepted cuff cycle completed within 60 seconds of the artifact and before a patient-changing fluid or drug action.',
      },
      {
        id: 'correct-transducer-level',
        statement: 'Recognize and remove the hydrostatic pressure offset by recording level-and-zero intent.',
        measure: 'Accepted level-and-zero intent removed the 20 cm transducer offset within 60 seconds of the artifact.',
      },
      {
        id: 'assess-arterial-dynamic-response',
        statement: 'Use waveform morphology to identify and correct the over-damped pressure system.',
        measure: 'A waveform assessment preceded accepted pressure-tubing replacement and normal morphology returned.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0',
      sources: [
        'Saugel B, et al. How to measure blood pressure using an arterial catheter: a systematic 5-step approach. Crit Care 2020;24:172. PMID 32331527.',
        'Gardner RM. Direct blood pressure measurement—dynamic response requirements. Anesthesiology 1981;54:227-36. PMID 7469106.',
        'American Society of Anesthesiologists. Standards for Basic Anesthetic Monitoring. Last amended October 15, 2025.',
      ],
    },
    limitations: [
      'arterial-pressure-artifact-is-display-only',
      'arterial-line-actions-are-screen-intent',
      'nibp-is-a-delayed-independent-sample',
      'bolus-injection-is-instantaneous',
    ],
  },
  patient: {
    ageYears: 58, sex: 'male', heightCm: 178, weightKg: 82, asaClass: 2,
    diagnosis: 'Quadriceps tendon rupture', procedure: 'Repair under neuraxial anesthesia',
    comorbidities: ['Controlled hypertension'], medications: ['Losartan'], allergies: ['None known'],
    fasting: 'Eight hours for solids, two hours for clear fluids',
    baseline: {
      heartRateBpm: 68, meanArterialMmHg: 78, strokeVolumeMl: 72,
      hemoglobinGPerDl: 14.2, bloodVolumeMl: 5600, coreTemperatureC: 36.7,
      arterialStiffness: 1.15, baroreflexGain: 0.9, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.15, difficultMaskVentilation: false,
      assessment: 'Awake under established neuraxial anesthesia, comfortable, conversing, and breathing spontaneously',
    },
    respiratory: { profile: 'healthy' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'arterial-line', 'capnography', 'pulse-oximetry', 'temperature'],
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 500, respiratoryRateBpm: 12, delivering: false },
  },
  formulary: [{
    drugId: 'propofol', concentration: 10, concentrationUnit: 'mg/mL',
    deliveryModes: ['bolus'], syringeVolumeMl: 20, typicalDose: 20,
    presets: [{ label: '20 mg', amount: 20, unit: 'mg' }],
  }],
  timeline: [
    {
      id: 'briefing', type: 'narrative', atTick: 0, severity: 'advisory',
      message: 'The neuraxial block is established. The patient is comfortable, conversing, and hemodynamically stable. An arterial line and cuff are available. When the invasive pressure changes, decide whether the patient changed with it before giving treatment.',
    },
    { id: 'transducer-raised', type: 'artifact', atTick: 600, target: 'arterial-transducer-misleveled', severity: 'artifact' },
    { id: 'pressure-system-damped', type: 'artifact', atTick: 600, target: 'arterial-damping', severity: 'artifact' },
    {
      id: 'artifact-cue', type: 'narrative', atTick: 600, severity: 'warning',
      message: 'After repositioning, the invasive MAP falls and its waveform becomes blunted. The patient remains comfortable and the other signals are unchanged. Verify the measurement system and obtain an independent pressure before treating the number.',
    },
    {
      id: 'case-end', type: 'narrative', atTick: 3600, severity: 'advisory',
      message: 'The practice window is ending. Confirm the pressure display, independent cuff result, and waveform morphology, then debrief which observations belonged to the sensor and which belonged to the patient.',
    },
  ],
  replayPoints: [{
    id: 'before-pressure-artifact', label: 'Before the invasive pressure changes',
    objectiveId: 'verify-invasive-pressure-independently', atTick: 599,
    reason: 'Rehearse the measurement-verification sequence while canonical circulation remains stable.',
  }],
  debrief: { rubric: [
    {
      id: 'independent-pressure', objectiveId: 'verify-invasive-pressure-independently',
      question: 'Which independent result separated patient pressure from the invasive display, and what did you avoid treating prematurely?',
      concept: 'vasodilation-versus-hypovolemia',
    },
    {
      id: 'hydrostatic-offset', objectiveId: 'correct-transducer-level',
      question: 'How did the 20 cm height error change displayed pressure, and what changed after level-and-zero intent?',
      concept: 'vasodilation-versus-hypovolemia',
    },
    {
      id: 'dynamic-response', objectiveId: 'assess-arterial-dynamic-response',
      question: 'Which waveform features suggested over-damping, and what confirmed that morphology was restored?',
      concept: 'vasodilation-versus-hypovolemia',
    },
  ] },
};
