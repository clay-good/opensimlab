/**
 * Rapid desaturation: the obese patient with a difficult airway.
 *
 * The routine induction teaches that preoxygenation buys time. This one teaches
 * what that time is worth, by taking most of it away: a small functional residual
 * capacity and a high oxygen consumption give a safe apnoea time of well under
 * three minutes, and the airway is genuinely harder than the last one.
 *
 * It exercises the same engine with no new pharmacology. The one new thing a
 * learner meets is the decision the difficult-airway guideline is built around:
 * how many attempts, and when to stop and go back to the mask.
 *
 * Authored as data. It loads and runs with no change to application source.
 */

import type { Scenario } from './types';

export const RAPID_DESATURATION: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'rapid-desaturation',
    version: '0.1.0',
    title: 'Rapid desaturation in the obese patient',
    author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0',
    estimatedMinutes: 10,
    difficulty: 'intermediate',
    objectives: [
      {
        id: 'preoxygenate',
        statement: 'Preoxygenate properly, because this patient gives you almost no margin.',
        measure: 'End-tidal oxygen fraction reached 0.9 and was held there for at least three '
          + 'minutes before the airway was secured.',
      },
      {
        id: 'ventilate-before-desaturation',
        statement: 'Secure the airway, or go back to the mask, before the saturation falls.',
        measure: 'Oxygen saturation never fell below 92%.',
      },
      {
        id: 'limit-attempts',
        statement: 'Limit laryngoscopy attempts, and change something between them.',
        measure: 'No more than two attempts at direct laryngoscopy before switching technique or '
          + 'returning to mask ventilation.',
      },
      {
        id: 'hysteresis',
        statement: 'Wait for the effect site rather than the syringe.',
        measure: 'No propofol bolus was given while effect-site concentration was still rising '
          + 'toward its peak from the previous one.',
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
        'Benumof JL, Dagg R, Benumof R. Anesthesiology 1997;87:979-82 (PMID 9357902)',
        '2022 ASA Practice Guidelines for Management of the Difficult Airway (PMID 34762729)',
        'ASA Standards for Basic Anesthetic Monitoring',
      ],
    },
    limitations: [
      'bolus-injection-is-instantaneous',
      'no-shunt-or-dead-space-dynamics',
      'peep-not-modelled',
    ],
  },
  patient: {
    ageYears: 54,
    sex: 'male',
    heightCm: 174,
    weightKg: 138,
    asaClass: 3,
    diagnosis: 'Symptomatic gallstones',
    procedure: 'Laparoscopic cholecystectomy',
    comorbidities: [
      'Obesity, body mass index 45.6',
      'Obstructive sleep apnoea, uses continuous positive airway pressure at night',
      'Hypertension, treated',
    ],
    medications: ['Amlodipine 5 mg daily'],
    allergies: ['None known'],
    fasting: 'Six hours for solids, two for clear fluids.',
    baseline: {
      heartRateBpm: 82,
      meanArterialMmHg: 98,
      strokeVolumeMl: 78,
      hemoglobinGPerDl: 15.1,
      bloodVolumeMl: 7200,
      coreTemperatureC: 36.5,
      arterialStiffness: 1.15,
      baroreflexGain: 0.85,
      fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.55,
      difficultMaskVentilation: true,
      assessment: 'Mallampati III, thyromental distance 5.5 cm, limited neck extension, '
        + 'thick neck with a circumference of 46 cm, full beard.',
    },
    respiratory: { profile: 'obese' },
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
      // 50 mL drawn up, because a 20 mL syringe cannot hold a total-body-weight
      // dose for a 138 kg patient and the syringe refusing it would make the
      // decision for the learner. The point of this patient is that dosing on
      // lean body mass rather than total body weight is a CHOICE they make.
      syringeVolumeMl: 50,
      // Roughly 2 mg/kg of lean body mass, not of total body weight.
      typicalDose: 160,
      presets: [
        { label: '50 mg', amount: 50, unit: 'mg' },
        { label: '100 mg', amount: 100, unit: 'mg' },
        { label: '2 mg/kg', amount: 2, unit: 'mg/kg' },
      ],
    },
    {
      drugId: 'remifentanil',
      concentration: 50,
      concentrationUnit: 'µg/mL',
      syringeVolumeMl: 20,
      typicalDose: 80,
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
      message: 'The patient is on the table, ramped, monitors attached, breathing room air. '
        + 'He tells you he has been told before that he was "hard to get a tube into".',
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
  ],
  debrief: {
    rubric: [
      {
        id: 'how-long-did-you-have',
        objectiveId: 'preoxygenate',
        question: 'How long did you have once he stopped breathing, and how did that compare '
          + 'with the last patient you induced here?',
        concept: 'preoxygenation-and-safe-apnea-time',
      },
      {
        id: 'when-to-stop',
        objectiveId: 'limit-attempts',
        question: 'What would have made you stop attempting and go back to the mask, and did you '
          + 'decide that before or during the attempt?',
        concept: 'airway-assessment-predicts-poorly',
      },
      {
        id: 'what-changed-between-attempts',
        objectiveId: 'limit-attempts',
        question: 'If you attempted twice, what did you change the second time?',
        concept: 'airway-assessment-predicts-poorly',
      },
      {
        id: 'when-did-you-know-time-was-short',
        objectiveId: 'ventilate-before-desaturation',
        question: 'What were you watching to know the saturation was about to fall, and how much '
          + 'warning did it give you?',
        concept: 'preoxygenation-and-safe-apnea-time',
      },
      {
        id: 'dose-on-what-weight',
        objectiveId: 'hysteresis',
        question: 'What weight did you dose the propofol against, and why?',
        concept: 'hysteresis-and-effect-site-lag',
      },
    ],
  },
};
