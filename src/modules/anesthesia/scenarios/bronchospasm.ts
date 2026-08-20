/**
 * Bronchospasm after intubation: the shape changes before the number does.
 *
 * The capnogram generator can already draw the four phases, the alpha angle and
 * the shark fin, and until now no scenario reached any of it. That was capacity
 * built and never used — and it is the best thing this simulator has to teach,
 * because a capnogram that has changed SHAPE while its number is still inside
 * the alarm limits is exactly the observation a screen can teach and a textbook
 * figure cannot.
 *
 * The trap is deliberate: the end-tidal number stays unremarkable for a while.
 * A learner watching only the tiles will miss it, and the debrief will say so.
 *
 * Authored as data. It loads and runs with no change to application source.
 */

import type { Scenario } from './types';

export const BRONCHOSPASM: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'bronchospasm',
    version: '0.1.0',
    title: 'Bronchospasm after intubation',
    author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0',
    estimatedMinutes: 12,
    difficulty: 'intermediate',
    objectives: [
      {
        id: 'read-the-capnogram',
        statement: 'Read the capnogram as a shape, not as a number.',
        measure: 'The obstruction was recognised while the end-tidal carbon dioxide value was '
          + 'still inside its alarm limits — that is, from the waveform rather than from the '
          + 'alarm.',
      },
      {
        id: 'deepen-before-reaching-for-anything-else',
        statement: 'Deepen the anaesthetic before treating the wheeze as a separate problem.',
        measure: 'Predicted depth was brought back into the surgical range, or a bolus was given, '
          + 'in the two minutes after the obstruction began.',
      },
      {
        id: 'ventilate-before-desaturation',
        statement: 'Keep the saturation up while you work out what is happening.',
        measure: 'Oxygen saturation never fell below 92%.',
      },
      {
        id: 'manage-hypotension',
        statement: 'Keep the mean arterial pressure up.',
        measure: 'Mean arterial pressure spent less than two minutes below 65 mmHg, and never '
          + 'fell below 55 mmHg.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED',
      credential: 'UNSIGNED',
      institution: 'UNSIGNED',
      competingInterests: 'None declared',
      reviewedOn: '1970-01-01',
      reviewBy: '1970-01-01',
      contentVersion: '0.1.0',
      sources: [
        'ASA Standards for Basic Anesthetic Monitoring',
        '2022 ASA Practice Guidelines for Management of the Difficult Airway (PMID 34762729)',
      ],
    },
    limitations: [
      'no-shunt-or-dead-space-dynamics',
      'bolus-injection-is-instantaneous',
      'respiratory-depression-is-calibrated',
      'peep-not-modelled',
    ],
  },
  patient: {
    ageYears: 29,
    sex: 'female',
    heightCm: 168,
    weightKg: 71,
    asaClass: 2,
    diagnosis: 'Recurrent tonsillitis',
    procedure: 'Tonsillectomy',
    comorbidities: [
      'Asthma, well controlled, inhaled steroid daily',
      'A chest infection three weeks ago, now resolved',
    ],
    medications: ['Beclometasone inhaler', 'Salbutamol inhaler as required'],
    allergies: ['None known'],
    fasting: 'Six hours for solids, two for clear fluids.',
    baseline: {
      heartRateBpm: 78,
      meanArterialMmHg: 88,
      strokeVolumeMl: 72,
      hemoglobinGPerDl: 13.1,
      bloodVolumeMl: 4800,
      coreTemperatureC: 36.7,
      arterialStiffness: 0.95,
      baroreflexGain: 1.1,
      fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.15,
      difficultMaskVentilation: false,
      assessment: 'Mallampati II, good mouth opening, full neck movement. Large tonsils.',
    },
    respiratory: { profile: 'healthy' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'capnography', 'pulse-oximetry', 'temperature', 'depth-index'],
    ventilator: {
      mode: 'manual',
      fio2: 0.21,
      tidalVolumeMl: 500,
      respiratoryRateBpm: 12,
      delivering: false,
    },
  },
  formulary: [
    {
      drugId: 'propofol',
      concentration: 10,
      concentrationUnit: 'mg/mL',
      syringeVolumeMl: 20,
      typicalDose: 140,
      presets: [
        { label: '20 mg', amount: 20, unit: 'mg' },
        { label: '50 mg', amount: 50, unit: 'mg' },
        { label: '2 mg/kg', amount: 2, unit: 'mg/kg' },
      ],
    },
    {
      drugId: 'remifentanil',
      concentration: 50,
      concentrationUnit: 'µg/mL',
      syringeVolumeMl: 20,
      typicalDose: 70,
      presets: [
        { label: '25 µg', amount: 25, unit: 'µg' },
        { label: '50 µg', amount: 50, unit: 'µg' },
        { label: '1 µg/kg', amount: 1, unit: 'µg/kg' },
      ],
    },
  ],
  timeline: [
    {
      id: 'briefing',
      type: 'narrative',
      atTick: 0,
      message: 'She is on the table, monitors attached, breathing room air. She mentions her '
        + 'chest has felt "a bit tight" since the infection, but she has not needed her blue '
        + 'inhaler this week.',
      severity: 'info',
    },
    {
      // The whole point. It begins gently and builds, so the SHAPE moves well
      // before the number leaves its alarm limits.
      id: 'bronchospasm-onset',
      type: 'obstruction',
      atTick: 2400,
      value: 0.35,
      durationTicks: 900,
      message: 'The reservoir bag is becoming harder to squeeze.',
      severity: 'info',
    },
    {
      id: 'bronchospasm-worsens',
      type: 'obstruction',
      atTick: 3300,
      value: 0.75,
      durationTicks: 2400,
      message: 'It is getting harder still, and there is an expiratory wheeze.',
      severity: 'advisory',
    },
    {
      id: 'surgeon-ready',
      type: 'narrative',
      atTick: 3600,
      message: 'The surgeon asks whether they may start.',
      severity: 'info',
    },
  ],
  debrief: {
    rubric: [
      {
        id: 'what-told-you-first',
        objectiveId: 'read-the-capnogram',
        question: 'What told you something had changed — the number, the trace, or the bag? '
          + 'How long was the trace abnormal before anything alarmed?',
        concept: 'capnogram-morphology',
      },
      {
        id: 'what-is-the-alpha-angle-doing',
        objectiveId: 'read-the-capnogram',
        question: 'Describe the shape of the plateau. What does a rising plateau mean about how '
          + 'the lung is emptying?',
        concept: 'capnogram-morphology',
      },
      {
        id: 'why-deepen-first',
        objectiveId: 'deepen-before-reaching-for-anything-else',
        question: 'Why is a light anaesthetic the first thing to exclude when the airway '
          + 'pressure rises after intubation?',
        concept: 'capnogram-morphology',
      },
      {
        id: 'how-close-did-saturation-get',
        objectiveId: 'ventilate-before-desaturation',
        question: 'How much margin did you have, and what were you watching to know it?',
        concept: 'preoxygenation-and-safe-apnea-time',
      },
      {
        id: 'what-happened-to-the-pressure',
        objectiveId: 'manage-hypotension',
        question: 'If the pressure fell while you were dealing with the airway, why did it?',
        concept: 'vasodilation-versus-hypovolemia',
      },
    ],
  },
};
