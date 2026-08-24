/** A known difficult airway where fixation on tracheal attempts spends oxygen reserve. */

import type { Scenario } from './types';

export const REPEATED_LARYNGOSCOPY_HARM: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'repeated-laryngoscopy-harm',
    version: '0.1.0',
    maturity: 'draft',
    title: 'Known difficult airway: stop repeated attempts',
    author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0',
    estimatedMinutes: 9,
    difficulty: 'advanced',
    objectives: [
      {
        id: 'prepare-rescue-oxygen-reserve',
        statement: 'Reach an end-tidal preoxygenation endpoint before induction.',
        measure: 'End-tidal oxygen fraction was at least 0.90 before the first accepted propofol bolus.',
      },
      {
        id: 'act-on-prior-airway-record',
        statement: 'Act on the prior difficult-airway record before laryngoscopy begins.',
        measure: 'An accepted airway-help request was recorded before the first accepted laryngoscopy attempt.',
      },
      {
        id: 'limit-attempts-and-call-for-help',
        statement: 'Stop after the failed tracheal attempt rather than spending more oxygen reserve.',
        measure: 'No further laryngoscopy was accepted before rescue, and airway help was requested no later than 30 seconds after the failed attempt.',
      },
      {
        id: 'place-supraglottic-rescue',
        statement: 'Move to a supraglottic airway to restore a route for oxygenation.',
        measure: 'A supraglottic airway was placed after failed intubation without another tracheal attempt.',
      },
      {
        id: 'confirm-rescue-gas-exchange',
        statement: 'Explicitly deliver oxygen and confirm sustained gas exchange after rescue.',
        measure: 'After supraglottic placement, inspired oxygen was at least 0.95, breath delivery was active, saturation stayed at least 92%, and end-tidal carbon dioxide remained 25–55 mmHg for 30 seconds.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0',
      sources: [
        '2022 American Society of Anesthesiologists Practice Guidelines for Management of the Difficult Airway. Anesthesiology 2022;136:31-81. PMID 34762729',
        'Ahmad I, et al. Difficult Airway Society 2025 guidelines for management of unanticipated difficult tracheal intubation in adults. Br J Anaesth 2026;136:283-307. PMID 41203471',
      ],
    },
    limitations: [
      'difficult-airway-failure-and-mask-ventilation-are-teaching-bounds',
      'repeated-laryngoscopy-trauma-is-a-teaching-model',
      'supraglottic-airway-placement-is-an-abstraction',
      'airway-help-request-does-not-model-a-team',
      'no-cico-or-front-of-neck-airway',
      'no-post-supraglottic-airway-plan',
      'bolus-injection-is-instantaneous',
    ],
  },
  patient: {
    ageYears: 61, sex: 'male', heightCm: 178, weightKg: 88, asaClass: 2,
    diagnosis: 'Inguinal hernia', procedure: 'Elective laparoscopic inguinal hernia repair',
    comorbidities: ['Hypertension, treated'], medications: ['Amlodipine 5 mg daily'],
    allergies: ['None known'], fasting: 'Eight hours for solids, two hours for clear fluids',
    baseline: {
      heartRateBpm: 72, meanArterialMmHg: 94, strokeVolumeMl: 72,
      hemoglobinGPerDl: 14.2, bloodVolumeMl: 5300, coreTemperatureC: 36.5,
      arterialStiffness: 1.15, baroreflexGain: 0.85, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.65, difficultMaskVentilation: false,
      assessment: 'A prior anesthetic record documents a grade 3 direct-laryngoscopy view, two unsuccessful tracheal attempts, and rescue oxygenation with a supraglottic airway',
    },
    respiratory: { profile: 'healthy' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'capnography', 'pulse-oximetry', 'temperature', 'depth-index'],
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 500, respiratoryRateBpm: 12,
      delivering: false,
    },
  },
  formulary: [
    {
      drugId: 'propofol', concentration: 10, concentrationUnit: 'mg/mL',
      deliveryModes: ['bolus'], syringeVolumeMl: 20, typicalDose: 150,
      presets: [
        { label: '50 mg', amount: 50, unit: 'mg' },
        { label: '1.5 mg/kg', amount: 1.5, unit: 'mg/kg' },
        { label: '2 mg/kg', amount: 2, unit: 'mg/kg' },
      ],
    },
  ],
  timeline: [
    {
      id: 'known-difficult-airway-course', type: 'difficult-airway', atTick: 0,
      target: 'failed-intubation-with-marginal-mask', value: 1,
    },
    {
      id: 'briefing', type: 'narrative', atTick: 0, severity: 'advisory',
      message: 'The prior anesthetic record is visible in the airway assessment. Facemask oxygenation is fully effective in this bounded course, but every tracheal attempt is configured to fail. Use the record before induction, protect oxygen reserve, and choose when to stop. This case ends after rescue oxygenation.',
    },
    {
      id: 'case-end', type: 'narrative', atTick: 4800, severity: 'advisory',
      message: 'The practice window is ending. Confirm the oxygenation route and gas exchange, then debrief what each additional attempt consumed.',
    },
  ],
  replayPoints: [{
    id: 'before-first-airway-attempt',
    label: 'Before the first airway attempt',
    objectiveId: 'act-on-prior-airway-record',
    atTick: 1,
    reason: 'Return to the visible prior airway record and rehearse the escalation and oxygenation plan before laryngoscopy begins.',
  }],
  debrief: { rubric: [
    {
      id: 'reserve-before-attempt', objectiveId: 'prepare-rescue-oxygen-reserve',
      question: 'Which end-tidal value showed that oxygen had reached the alveoli before induction?',
      concept: 'preoxygenation-and-safe-apnea-time',
    },
    {
      id: 'use-the-record', objectiveId: 'act-on-prior-airway-record',
      question: 'What did the prior airway record change before your first laryngoscopy attempt?',
      concept: 'airway-assessment-predicts-poorly',
    },
    {
      id: 'attempt-cost', objectiveId: 'limit-attempts-and-call-for-help',
      question: 'How many attempts were recorded, and how much unventilated simulated time did they consume?',
      concept: 'airway-assessment-predicts-poorly',
    },
    {
      id: 'rescue-route', objectiveId: 'place-supraglottic-rescue',
      question: 'Why was supraglottic placement an oxygenation rescue rather than proof of tracheal intubation?',
      concept: 'airway-assessment-predicts-poorly',
    },
    {
      id: 'confirm-the-rescue', objectiveId: 'confirm-rescue-gas-exchange',
      question: 'Which sustained monitor evidence confirmed oxygen delivery and ventilation after rescue?',
      concept: 'capnogram-morphology',
    },
  ] },
};
