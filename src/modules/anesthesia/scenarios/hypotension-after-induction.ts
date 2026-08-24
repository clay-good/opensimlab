/**
 * Hypotension after induction: is it the propofol, or is it the volume?
 *
 * An elderly patient who has been vomiting for two days and is dry. Induction
 * drops the pressure, as it always does — but here the mechanism is not the one
 * the routine induction teaches, and the treatment that works for a vasodilated
 * patient only borrows time from a hypovolaemic one.
 *
 * This is the scenario the `vasodilation-versus-hypovolemia` explainer exists
 * for. It uses the same two drugs and no new pharmacology; what is new is that
 * the learner has to read the mechanism off the monitor before choosing.
 *
 * Authored as data. It loads and runs with no change to application source.
 */

import type { Scenario } from './types';

export const HYPOTENSION_AFTER_INDUCTION: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'hypotension-after-induction',
    version: '0.1.0',
    maturity: 'draft',
    title: 'Hypotension after induction',
    author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0',
    estimatedMinutes: 12,
    difficulty: 'intermediate',
    objectives: [
      {
        id: 'dose-for-the-patient',
        statement: 'Dose the induction for the patient in front of you, not for the textbook adult.',
        measure: 'The first propofol bolus was no more than 1.5 mg/kg, and it was given slowly '
          + 'enough that the effect site was allowed to catch up before more was given.',
      },
      {
        id: 'manage-hypotension',
        statement: 'Keep the mean arterial pressure up.',
        measure: 'Mean arterial pressure spent less than two minutes below 65 mmHg, and never '
          + 'fell below 55 mmHg.',
      },
      {
        id: 'read-the-mechanism',
        statement: 'Work out whether the pressure fell because the vessels dilated or because '
          + 'the tank is empty, and treat that.',
        measure: 'Fluid was given, rather than vasopressor alone, in a patient whose pulse '
          + 'pressure was narrow and swinging with the ventilator.',
      },
      {
        id: 'ventilate-before-desaturation',
        statement: 'Establish ventilation before saturation falls.',
        measure: 'Oxygen saturation never fell below 92%.',
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
        'Salmasi V, et al. Anesthesiology 2017;126:47-65',
        'Walsh M, et al. Anesthesiology 2013;119:507-15',
        'ASA Standards for Basic Anesthetic Monitoring',
      ],
    },
    limitations: [
      'bolus-injection-is-instantaneous',
      'no-coagulopathy',
      'peep-not-modelled',
    ],
  },
  patient: {
    ageYears: 78,
    sex: 'female',
    heightCm: 158,
    weightKg: 54,
    asaClass: 3,
    diagnosis: 'Small bowel obstruction, vomiting for two days',
    procedure: 'Laparotomy',
    comorbidities: [
      'Hypertension, treated',
      'Chronic kidney disease, stage 3',
    ],
    medications: ['Ramipril 5 mg daily, taken this morning'],
    allergies: ['None known'],
    fasting: 'Nil by mouth since admission. A nasogastric tube is on free drainage.',
    baseline: {
      heartRateBpm: 96,
      meanArterialMmHg: 86,
      // Small stroke volume with a fast rate: the compensated picture of a dry
      // patient, which is what makes the induction so unforgiving.
      strokeVolumeMl: 42,
      hemoglobinGPerDl: 13.8,
      // About 15% below the predicted volume for this patient.
      bloodVolumeMl: 3100,
      coreTemperatureC: 36.1,
      arterialStiffness: 1.45,
      // An elderly patient on an ACE inhibitor defends her pressure poorly.
      baroreflexGain: 0.55,
      fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.18,
      difficultMaskVentilation: false,
      assessment: 'Mallampati II, edentulous, adequate mouth opening. Full stomach: this is a '
        + 'rapid sequence induction in real life.',
    },
    respiratory: { profile: 'moderately-ill' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'arterial-line', 'capnography', 'pulse-oximetry', 'temperature', 'depth-index'],
    ventilator: {
      mode: 'manual',
      fio2: 0.21,
      tidalVolumeMl: 420,
      respiratoryRateBpm: 14,
      delivering: false,
    },
  },
  formulary: [
    {
      drugId: 'propofol',
      concentration: 10,
      concentrationUnit: 'mg/mL',
      syringeVolumeMl: 20,
      // Deliberately lower than the healthy adult's: an elderly, dry patient
      // needs far less, and the preset labelled 2 mg/kg is there to be resisted.
      typicalDose: 70,
      presets: [
        { label: '20 mg', amount: 20, unit: 'mg' },
        { label: '40 mg', amount: 40, unit: 'mg' },
        { label: '1 mg/kg', amount: 1, unit: 'mg/kg' },
        { label: '2 mg/kg', amount: 2, unit: 'mg/kg' },
      ],
    },
    {
      drugId: 'remifentanil',
      concentration: 50,
      concentrationUnit: 'µg/mL',
      syringeVolumeMl: 20,
      typicalDose: 30,
      presets: [
        { label: '10 µg', amount: 10, unit: 'µg' },
        { label: '25 µg', amount: 25, unit: 'µg' },
        { label: '0.5 µg/kg', amount: 0.5, unit: 'µg/kg' },
      ],
    },
  ],
  timeline: [
    {
      id: 'briefing',
      type: 'narrative',
      atTick: 0,
      message: 'She is on the table, monitors attached, breathing room air. Her mucous membranes '
        + 'are dry and the nasogastric tube has drained 900 mL since this morning.',
      severity: 'info',
    },
    {
      id: 'ongoing-losses',
      type: 'blood-loss',
      atTick: 600,
      value: 240,
      durationTicks: 3600,
      message: 'Third-space and gastric losses continue.',
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
      value: 0.95,
      durationTicks: 1200,
      message: 'Surgical incision.',
      severity: 'advisory',
    },
    {
      id: 'bowel-handling',
      type: 'surgical-stimulus',
      atTick: 5400,
      value: 0.7,
      durationTicks: 2400,
      message: 'The surgeon delivers and handles the bowel.',
      severity: 'info',
    },
  ],
  replayPoints: [{
    id: 'read-the-falling-pressure',
    label: 'Read the falling pressure',
    objectiveId: 'read-the-mechanism',
    atTick: 600,
    reason: 'Return to the first minute with your original setup intact, then reassess the pressure pattern and choose a different response.',
  }],
  debrief: {
    rubric: [
      {
        id: 'how-much-propofol',
        objectiveId: 'dose-for-the-patient',
        question: 'How much propofol did you give, and what in her history should have changed '
          + 'that number before you drew it up?',
        concept: 'hysteresis-and-effect-site-lag',
      },
      {
        id: 'which-mechanism',
        objectiveId: 'read-the-mechanism',
        question: 'When the pressure fell, what on the monitor told you whether it was tone or '
          + 'volume?',
        concept: 'vasodilation-versus-hypovolemia',
      },
      {
        id: 'what-did-the-vasopressor-do',
        objectiveId: 'manage-hypotension',
        question: 'If you gave a vasopressor, how long did the effect last, and what does that '
          + 'tell you?',
        concept: 'vasodilation-versus-hypovolemia',
      },
      {
        id: 'was-the-airway-secured-in-time',
        objectiveId: 'ventilate-before-desaturation',
        question: 'How much apnoeic time did this patient have, and how did her age and her '
          + 'illness change it?',
        concept: 'preoxygenation-and-safe-apnea-time',
      },
      {
        id: 'what-would-you-do-first-next-time',
        objectiveId: 'manage-hypotension',
        question: 'What would you do differently before the induction rather than after it?',
        concept: 'vasodilation-versus-hypovolemia',
      },
    ],
  },
};
