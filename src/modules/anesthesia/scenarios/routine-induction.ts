/**
 * The routine induction scenario.
 *
 * A healthy adult, propofol and remifentanil, bag-mask ventilation, intubation,
 * incision. Chosen because it exercises the compartment solver, the interaction
 * surface, the haemodynamic response, the airway sequence, apnoea and
 * desaturation, all five traces, the alarm system, the concentration plot, and
 * the debrief — while needing only two pharmacology models to reach clinical
 * review.
 *
 * Authored as data. It loads and runs with no change to application source.
 */

import type { Scenario } from './types';

export const ROUTINE_INDUCTION: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'routine-induction',
    version: '0.1.0',
    title: 'Routine induction of general anaesthesia',
    author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0',
    estimatedMinutes: 12,
    difficulty: 'introductory',
    objectives: [
      {
        id: 'preoxygenate',
        statement: 'Preoxygenate before inducing, and explain what it buys you.',
        measure: 'End-tidal oxygen fraction reached 0.9 and was held there for at least three '
          + 'minutes before the airway was secured. End-tidal, not inspired: the inspired fraction '
          + 'says what the machine delivered, not whether the lungs filled.',
      },
      {
        id: 'hysteresis',
        statement: 'Wait for the effect site rather than the syringe: recognise that the last dose has not yet fully acted.',
        measure: 'No propofol bolus was given while effect-site concentration was still rising toward its peak from the previous one.',
      },
      {
        id: 'manage-hypotension',
        statement: 'Recognise vasodilatory hypotension after induction and treat the mechanism.',
        measure: 'Mean arterial pressure spent less than two minutes below 65 mmHg, and never '
          + 'fell below 55 mmHg.',
      },
      {
        id: 'ventilate-before-desaturation',
        statement: 'Establish ventilation before saturation falls.',
        measure: 'Oxygen saturation never fell below 92%.',
      },
      {
        id: 'blunt-incision',
        statement: 'Give enough opioid that incision does not provoke a haemodynamic response.',
        measure: 'Heart rate and mean arterial pressure rose by less than 20% in the minute after incision.',
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
        'Benumof JL, Dagg R, Benumof R. Anesthesiology 1997;87:979-82 (PMID 9357902)',
        '2022 ASA Practice Guidelines for Management of the Difficult Airway (PMID 34762729)',
      ],
    },
    // Ids, not sentences. These were prose, so they matched nothing in the
    // limitations register and could not be linked to it — while the other
    // three scenarios stored ids and had them printed at the learner as raw
    // kebab-case. Ids everywhere, sentences rendered from the register.
    limitations: [
      'no-fresh-gas-flow',
      'no-neuromuscular-blockade',
      'no-regional-anaesthesia',
      'no-coagulopathy',
      'acid-base-approximate',
    ],
  },
  patient: {
    ageYears: 42,
    sex: 'female',
    heightCm: 165,
    weightKg: 68,
    asaClass: 1,
    diagnosis: 'Symptomatic cholelithiasis',
    procedure: 'Laparoscopic cholecystectomy',
    comorbidities: [],
    medications: ['Combined oral contraceptive'],
    allergies: [],
    fasting: 'Nil by mouth 8 hours',
    baseline: {
      heartRateBpm: 74,
      meanArterialMmHg: 92,
      strokeVolumeMl: 68,
      hemoglobinGPerDl: 13.4,
      bloodVolumeMl: 4600,
      coreTemperatureC: 36.6,
      arterialStiffness: 1.0,
      baroreflexGain: 1.0,
      fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.12,
      difficultMaskVentilation: false,
      assessment: 'Mallampati II, thyromental distance over 6 cm, full neck movement, good mouth opening.',
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
      message: 'The patient is on the table, monitors attached, breathing room air. The surgeon is scrubbing.',
      severity: 'info',
    },
    {
      id: 'surgeon-ready',
      type: 'narrative',
      atTick: 3000,
      message: 'The surgeon asks whether they may start.',
      severity: 'info',
    },
    {
      id: 'incision',
      type: 'surgical-stimulus',
      atTick: 3600,
      value: 0.9,
      durationTicks: 900,
      message: 'Surgical incision.',
      severity: 'advisory',
    },
    {
      id: 'port-insertion',
      type: 'surgical-stimulus',
      atTick: 4800,
      value: 0.6,
      durationTicks: 1800,
      message: 'Port insertion and pneumoperitoneum.',
      severity: 'info',
    },
  ],
  debrief: {
    rubric: [
      {
        id: 'why-preoxygenate',
        objectiveId: 'preoxygenate',
        question: 'What did preoxygenation buy you, and how would you know if it had not worked?',
        concept: 'preoxygenation-and-safe-apnea-time',
      },
      {
        id: 'why-wait',
        objectiveId: 'hysteresis',
        question: 'When you gave the second dose, what were you responding to?',
        concept: 'hysteresis-and-effect-site-lag',
      },
      {
        id: 'why-pressure-fell',
        objectiveId: 'manage-hypotension',
        question: 'Why did the pressure fall, and what would have treated the cause rather than the number?',
        concept: 'vasodilation-versus-hypovolemia',
      },
      {
        id: 'why-saturation-held',
        objectiveId: 'ventilate-before-desaturation',
        question: 'How much time did you have, and what were you watching to know it was running out?',
        concept: 'preoxygenation-and-safe-apnea-time',
      },
      {
        id: 'why-incision-was-quiet',
        objectiveId: 'blunt-incision',
        question: 'What made the incision uneventful, or what would have?',
        concept: 'hypnotic-opioid-synergy',
      },
    ],
  },
};
