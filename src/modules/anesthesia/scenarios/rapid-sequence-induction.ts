/**
 * Rapid-sequence induction: prepare the oxygen reserve, then respect the block.
 *
 * This is a full-stomach adult with an otherwise straightforward airway. The
 * case is deliberately not a difficult-airway crisis: it isolates the timing
 * between preoxygenation, induction, rocuronium onset, airway instrumentation,
 * and the return of ventilation.
 */

import type { Scenario } from './types';

export const RAPID_SEQUENCE_INDUCTION: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'rapid-sequence-induction',
    version: '0.1.0',
    title: 'Rapid-sequence induction',
    author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0',
    estimatedMinutes: 10,
    difficulty: 'intermediate',
    objectives: [
      {
        id: 'preoxygenate-before-induction',
        statement: 'Fill the patient\'s oxygen reserve before giving the first induction drug.',
        measure: 'End-tidal oxygen fraction reached at least 0.90 before the first propofol bolus.',
      },
      {
        id: 'wait-for-intubating-block',
        statement: 'Give the hypnotic before paralysis, then allow the modeled block to develop.',
        measure: 'Propofol preceded rocuronium, and the train-of-four count reached zero before laryngoscopy.',
      },
      {
        id: 'protect-the-apnea-margin',
        statement: 'Secure ventilation before the oxygen reserve is exhausted.',
        measure: 'Oxygen saturation remained at or above 92% throughout induction and airway management.',
      },
      {
        id: 'secure-and-confirm',
        statement: 'Resume delivered ventilation and sustained gas exchange after airway instrumentation.',
        measure: 'Laryngoscopy was followed by delivered ventilation and sustained capnography.',
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
        'Wierda et al. 1991 rocuronium pharmacokinetic and pharmacodynamic model',
        '2023 ASA Practice Guidelines for Monitoring and Antagonism of Neuromuscular Blockade',
        'ASA Standards for Basic Anesthetic Monitoring',
      ],
    },
    limitations: [
      'rocuronium-course-is-a-teaching-model',
      'peripheral-tof-does-not-prove-laryngeal-conditions',
      'no-neuromuscular-reversal-or-emergence',
      'no-aspiration-or-regurgitation',
      'no-team-or-communication',
      'bolus-injection-is-instantaneous',
    ],
  },
  patient: {
    ageYears: 41,
    sex: 'female',
    heightCm: 168,
    weightKg: 74,
    asaClass: 3,
    diagnosis: 'Small bowel obstruction with ongoing vomiting',
    procedure: 'Emergency laparotomy',
    comorbidities: ['None known before this admission'],
    medications: ['Antiemetic and intravenous crystalloid in the emergency department'],
    allergies: ['None known'],
    fasting: 'Vomited one hour ago after eating earlier today. Gastric emptying cannot be assumed',
    baseline: {
      heartRateBpm: 96,
      meanArterialMmHg: 86,
      strokeVolumeMl: 64,
      hemoglobinGPerDl: 13.4,
      bloodVolumeMl: 4800,
      coreTemperatureC: 36.5,
      arterialStiffness: 1,
      baroreflexGain: 0.95,
      fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.16,
      difficultMaskVentilation: false,
      assessment: 'Mallampati II, good mouth opening, full neck movement. No predicted difficulty',
    },
    respiratory: { profile: 'healthy' },
  },
  equipment: {
    monitoring: [
      'ecg', 'nibp', 'capnography', 'pulse-oximetry', 'temperature', 'depth-index', 'train-of-four',
    ],
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 480, respiratoryRateBpm: 12, delivering: false,
    },
  },
  formulary: [
    {
      drugId: 'propofol', concentration: 10, concentrationUnit: 'mg/mL',
      syringeVolumeMl: 20, typicalDose: 120,
      presets: [
        { label: '50 mg', amount: 50, unit: 'mg' },
        { label: '1 mg/kg', amount: 1, unit: 'mg/kg' },
        { label: '1.5 mg/kg', amount: 1.5, unit: 'mg/kg' },
        { label: '2 mg/kg', amount: 2, unit: 'mg/kg' },
      ],
    },
    {
      drugId: 'remifentanil', concentration: 50, concentrationUnit: 'µg/mL',
      syringeVolumeMl: 20, typicalDose: 50,
      presets: [
        { label: '25 µg', amount: 25, unit: 'µg' },
        { label: '0.5 µg/kg', amount: 0.5, unit: 'µg/kg' },
        { label: '1 µg/kg', amount: 1, unit: 'µg/kg' },
      ],
    },
    {
      drugId: 'rocuronium', concentration: 10, concentrationUnit: 'mg/mL',
      deliveryModes: ['bolus'],
      syringeVolumeMl: 10, typicalDose: 75,
      presets: [
        { label: '0.6 mg/kg', amount: 0.6, unit: 'mg/kg' },
        { label: '1.0 mg/kg', amount: 1, unit: 'mg/kg' },
        { label: '1.2 mg/kg', amount: 1.2, unit: 'mg/kg' },
      ],
    },
  ],
  timeline: [
    {
      id: 'briefing', type: 'narrative', atTick: 0, severity: 'advisory',
      message: 'She has a full stomach and is still vomiting. The airway assessment is reassuring, but the oxygen reserve and the interval without ventilation are yours to manage.',
    },
    {
      id: 'team-ready', type: 'narrative', atTick: 3000, severity: 'info',
      message: 'The surgical team is ready. The operation can begin once the airway is secured and gas exchange is established.',
    },
  ],
  debrief: {
    rubric: [
      {
        id: 'oxygen-endpoint', objectiveId: 'preoxygenate-before-induction',
        question: 'What end-tidal value told you the oxygen reservoir was ready before the first drug?',
        concept: 'preoxygenation-and-safe-apnea-time',
      },
      {
        id: 'block-onset', objectiveId: 'wait-for-intubating-block',
        question: 'What did the train-of-four show when you instrumented, and what can a peripheral measurement not guarantee about the larynx?',
        concept: 'train-of-four-and-residual-blockade',
      },
      {
        id: 'apnea-margin', objectiveId: 'protect-the-apnea-margin',
        question: 'How close did the saturation come to the steep part of the dissociation curve?',
        concept: 'preoxygenation-and-safe-apnea-time',
      },
      {
        id: 'confirmation', objectiveId: 'secure-and-confirm',
        question: 'What evidence showed that delivered ventilation and gas exchange had resumed?',
        concept: 'capnogram-morphology',
      },
    ],
  },
};
