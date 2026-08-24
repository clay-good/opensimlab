/**
 * Awareness risk under paralysis: the pump runs, but propofol does not arrive.
 *
 * The case stops at early maintenance. It models the pharmacologic warning
 * pattern after a TIVA-line disconnection; it does not model consciousness,
 * explicit recall, distress, or an incidence for this individual patient.
 */

import type { Scenario } from './types';

export const AWARENESS_UNDER_PARALYSIS: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'awareness-under-paralysis',
    version: '0.1.0',
    title: 'Silent TIVA-line disconnection',
    author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0',
    estimatedMinutes: 10,
    difficulty: 'advanced',
    objectives: [
      {
        id: 'hypnosis-before-paralysis',
        statement: 'Establish hypnosis before giving a drug that removes movement as a warning.',
        measure: 'Propofol preceded rocuronium, and propofol infusion was running before the line failure.',
      },
      {
        id: 'inspect-the-tiva-line',
        statement: 'Investigate the intravenous delivery path when predicted depth rises without a vital-sign explanation.',
        measure: 'The hypnotic line was inspected within 45 seconds of its disconnection.',
      },
      {
        id: 'restore-hypnotic-delivery',
        statement: 'Reconnect the hypnotic line before a silent delivery failure becomes prolonged.',
        measure: 'The propofol line was reconnected within 90 seconds of disconnection.',
      },
      {
        id: 'recognize-paralysis-risk',
        statement: 'Use quantitative block and predicted depth together; paralysis is not hypnosis.',
        measure: 'The trace showed suppressed train-of-four while predicted depth rose above 60. NAP5 (Br J Anaesth 2014;113:549-59) reported awareness near 1 in 19,600 overall, about 1 in 8,200 with neuromuscular blockade versus about 1 in 135,900 without, with two-thirds at induction or emergence.',
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
        'Pandit JJ, et al. 5th National Audit Project (NAP5) on accidental awareness during '
          + 'general anaesthesia: summary of main findings and risk factors. Br J Anaesth '
          + '2014;113:549-59. PMID 25204697',
        'Nimmo AF, et al. Guidelines for the safe practice of total intravenous anaesthesia. '
          + 'Anaesthesia 2019;74:211-24',
        '2023 ASA Practice Guidelines for Monitoring and Antagonism of Neuromuscular Blockade',
      ],
    },
    limitations: [
      'awareness-risk-is-not-consciousness-or-recall',
      'depth-index-is-a-drug-model-not-an-eeg',
      'tiva-line-disconnection-is-a-teaching-model',
      'opioid-alone-hypnosis',
      'rocuronium-course-is-a-teaching-model',
      'neuromuscular-reversal-is-bounded-without-emergence',
      'no-team-or-communication',
    ],
  },
  patient: {
    ageYears: 34,
    sex: 'female',
    heightCm: 166,
    weightKg: 68,
    asaClass: 2,
    diagnosis: 'Symptomatic cholelithiasis',
    procedure: 'Laparoscopic cholecystectomy',
    comorbidities: ['Mild gastroesophageal reflux'],
    medications: ['Omeprazole'],
    allergies: ['None known'],
    fasting: 'Solids eight hours, clear fluids two hours',
    baseline: {
      heartRateBpm: 76,
      meanArterialMmHg: 90,
      strokeVolumeMl: 72,
      hemoglobinGPerDl: 13.1,
      bloodVolumeMl: 4500,
      coreTemperatureC: 36.7,
      arterialStiffness: 0.95,
      baroreflexGain: 1,
      fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.12,
      difficultMaskVentilation: false,
      assessment: 'Mallampati I, good mouth opening, full neck movement',
    },
    respiratory: { profile: 'healthy' },
  },
  equipment: {
    monitoring: [
      'ecg', 'nibp', 'capnography', 'pulse-oximetry', 'temperature', 'depth-index', 'train-of-four',
    ],
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 450, respiratoryRateBpm: 12, delivering: false,
    },
  },
  formulary: [
    {
      drugId: 'propofol', concentration: 10, concentrationUnit: 'mg/mL',
      syringeVolumeMl: 50, typicalDose: 120,
      presets: [
        { label: '50 mg', amount: 50, unit: 'mg' },
        { label: '1.5 mg/kg', amount: 1.5, unit: 'mg/kg' },
        { label: '2 mg/kg', amount: 2, unit: 'mg/kg' },
      ],
    },
    {
      drugId: 'remifentanil', concentration: 50, concentrationUnit: 'µg/mL',
      syringeVolumeMl: 50, typicalDose: 50,
      presets: [
        { label: '25 µg', amount: 25, unit: 'µg' },
        { label: '0.5 µg/kg', amount: 0.5, unit: 'µg/kg' },
      ],
    },
    {
      drugId: 'rocuronium', concentration: 10, concentrationUnit: 'mg/mL',
      deliveryModes: ['bolus'],
      syringeVolumeMl: 10, typicalDose: 40,
      presets: [
        { label: '0.6 mg/kg', amount: 0.6, unit: 'mg/kg' },
      ],
    },
  ],
  timeline: [
    {
      id: 'briefing', type: 'narrative', atTick: 0, severity: 'advisory',
      message: 'This is a total intravenous anesthetic. The predicted depth value comes from the drug models, not from the brain. Neuromuscular blockade removes movement as a warning but does not cause sleep, amnesia, or analgesia.',
    },
    {
      id: 'surgery-underway', type: 'surgical-stimulus', atTick: 1200,
      durationTicks: 4800, value: 0.45, severity: 'info',
      message: 'Laparoscopic dissection begins. Ventilation and vital signs are stable.',
    },
    {
      id: 'hypnotic-line-disconnected', type: 'equipment-failure', atTick: 1800,
      target: 'hypnotic-line-disconnection', severity: 'warning',
      message: 'The operation continues without a change in the ordinary vital signs.',
    },
    {
      id: 'maintenance-check', type: 'narrative', atTick: 5400, severity: 'advisory',
      message: 'The surgeon asks whether the anesthetic is stable enough to continue.',
    },
  ],
  debrief: {
    rubric: [
      {
        id: 'block-is-not-sleep', objectiveId: 'hypnosis-before-paralysis',
        question: 'Which drug produced hypnosis, and what did rocuronium remove as a warning?',
        concept: 'train-of-four-and-residual-blockade',
      },
      {
        id: 'why-inspect', objectiveId: 'inspect-the-tiva-line',
        question: 'What changed before you inspected the intravenous delivery path, and which ordinary vital signs did not warn you?',
        concept: 'depth-monitoring-and-its-limits',
      },
      {
        id: 'delivery-restored', objectiveId: 'restore-hypnotic-delivery',
        question: 'How long was propofol delivery interrupted while the pump still showed its commanded rate?',
        concept: 'hysteresis-and-effect-site-lag',
      },
      {
        id: 'nap5-risk', objectiveId: 'recognize-paralysis-risk',
        question: 'NAP5 reported accidental awareness near 1 in 19,600 overall, about 1 in 8,200 with neuromuscular blockade versus about 1 in 135,900 without, with two-thirds of reports at induction or emergence. Why do paralysis and dynamic phases increase the risk?',
        concept: 'depth-monitoring-and-its-limits',
      },
    ],
  },
};
