/** Failed tracheal intubation with preserved, but marginal, rescue oxygenation. */

import type { Scenario } from './types';

export const DIFFICULT_AIRWAY_SUPRAGLOTTIC_RESCUE: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'difficult-airway-supraglottic-rescue',
    version: '0.1.0',
    title: 'Difficult airway: supraglottic rescue',
    author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0',
    estimatedMinutes: 10,
    difficulty: 'advanced',
    objectives: [
      {
        id: 'prepare-rescue-oxygen-reserve',
        statement: 'Reach an end-tidal preoxygenation endpoint before induction.',
        measure: 'End-tidal oxygen fraction was at least 0.90 before the first accepted propofol bolus.',
      },
      {
        id: 'limit-attempts-and-call-for-help',
        statement: 'Stop repeated tracheal attempts and request airway help early.',
        measure: 'No further laryngoscopy was accepted before rescue, and airway help was requested from the start of the failed attempt through 30 seconds after it completed.',
      },
      {
        id: 'place-supraglottic-rescue',
        statement: 'Move to a supraglottic airway to restore a route for oxygenation.',
        measure: 'A supraglottic airway was placed after failed intubation without another tracheal attempt.',
      },
      {
        id: 'confirm-rescue-gas-exchange',
        statement: 'Explicitly deliver high-concentration oxygen and confirm sustained gas exchange.',
        measure: 'After supraglottic placement, inspired oxygen was at least 0.95, breath delivery was active, saturation stayed at least 92%, and end-tidal carbon dioxide remained 25–55 mmHg for 30 seconds.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0',
      sources: [
        '2022 American Society of Anesthesiologists Practice Guidelines for Management of the Difficult Airway. Anesthesiology 2022;136:31-81. PMID 34762729',
        'Frerk C, et al. Difficult Airway Society 2015 guidelines for management of unanticipated difficult intubation in adults. Br J Anaesth 2015;115:827-48. PMID 26556848',
      ],
    },
    limitations: [
      'difficult-airway-failure-and-mask-ventilation-are-teaching-bounds',
      'supraglottic-airway-placement-is-an-abstraction',
      'airway-help-request-does-not-model-a-team',
      'no-cico-or-front-of-neck-airway',
      'no-post-supraglottic-airway-plan',
      'rocuronium-course-is-a-teaching-model',
      'peripheral-tof-does-not-prove-laryngeal-conditions',
      'no-neuromuscular-reversal-or-emergence',
      'bolus-injection-is-instantaneous',
    ],
  },
  patient: {
    ageYears: 47, sex: 'female', heightCm: 166, weightKg: 72, asaClass: 2,
    diagnosis: 'Symptomatic uterine fibroids', procedure: 'Elective laparoscopic hysterectomy',
    comorbidities: ['Well-controlled hypertension'], medications: ['Amlodipine 5 mg daily'],
    allergies: ['None known'], fasting: 'Eight hours for solids, two hours for clear fluids',
    baseline: {
      heartRateBpm: 78, meanArterialMmHg: 92, strokeVolumeMl: 68,
      hemoglobinGPerDl: 13.1, bloodVolumeMl: 4700, coreTemperatureC: 36.6,
      arterialStiffness: 1, baroreflexGain: 0.95, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Mallampati II, good mouth opening, normal neck movement, and no previous anesthetic airway record',
    },
    respiratory: { profile: 'healthy' },
  },
  equipment: {
    monitoring: [
      'ecg', 'nibp', 'capnography', 'pulse-oximetry', 'temperature', 'depth-index', 'train-of-four',
    ],
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 480, respiratoryRateBpm: 12,
      delivering: false,
    },
  },
  formulary: [
    {
      drugId: 'propofol', concentration: 10, concentrationUnit: 'mg/mL',
      deliveryModes: ['bolus'], syringeVolumeMl: 20, typicalDose: 140,
      presets: [
        { label: '50 mg', amount: 50, unit: 'mg' },
        { label: '1.5 mg/kg', amount: 1.5, unit: 'mg/kg' },
        { label: '2 mg/kg', amount: 2, unit: 'mg/kg' },
      ],
    },
    {
      drugId: 'rocuronium', concentration: 10, concentrationUnit: 'mg/mL',
      deliveryModes: ['bolus'], syringeVolumeMl: 10, typicalDose: 45,
      presets: [
        { label: '0.6 mg/kg', amount: 0.6, unit: 'mg/kg' },
        { label: '1 mg/kg', amount: 1, unit: 'mg/kg' },
      ],
    },
  ],
  timeline: [
    {
      id: 'failed-intubation-context', type: 'difficult-airway', atTick: 0,
      target: 'failed-intubation-with-marginal-mask', value: 0.35,
    },
    {
      id: 'briefing', type: 'narrative', atTick: 0, severity: 'info',
      message: 'This elective patient has a reassuring bedside airway assessment and no previous airway record. Induce anesthesia, then respond to the airway you actually encounter. This case ends after rescue oxygenation; it does not model a complete difficult-airway pathway.',
    },
    {
      id: 'case-end', type: 'narrative', atTick: 5400, severity: 'advisory',
      message: 'The case window is ending. Confirm the oxygenation route and gas exchange, then debrief the next clinical decision that this bounded scenario does not model.',
    },
  ],
  debrief: { rubric: [
    {
      id: 'rescue-oxygen-reserve', objectiveId: 'prepare-rescue-oxygen-reserve',
      question: 'Which end-tidal value showed that preoxygenation had reached the alveoli before induction?',
      concept: 'preoxygenation-and-safe-apnea-time',
    },
    {
      id: 'declare-and-escalate', objectiveId: 'limit-attempts-and-call-for-help',
      question: 'When did you stop tracheal attempts and request help relative to the failed attempt?',
      concept: 'airway-assessment-predicts-poorly',
    },
    {
      id: 'rescue-route', objectiveId: 'place-supraglottic-rescue',
      question: 'Why was a supraglottic airway an oxygenation rescue rather than proof of tracheal intubation?',
      concept: 'airway-assessment-predicts-poorly',
    },
    {
      id: 'rescue-confirmation', objectiveId: 'confirm-rescue-gas-exchange',
      question: 'What sustained monitor evidence showed that oxygen delivery and ventilation had resumed?',
      concept: 'capnogram-morphology',
    },
  ] },
};
