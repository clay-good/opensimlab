/** Bounded recognition and initial response to suspected venous air entry. */

import type { Scenario } from './types';

export const VENOUS_AIR_EMBOLISM_DURING_LINE_REMOVAL: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'venous-air-embolism-during-line-removal',
    version: '0.1.0',
    maturity: 'draft',
    title: 'Venous air embolism during line removal',
    author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0',
    estimatedMinutes: 8,
    difficulty: 'advanced',
    objectives: [
      {
        id: 'escalate-venous-air-pattern',
        statement: 'Recognize the abrupt cardiopulmonary monitor pattern and call for help.',
        measure: 'A venous-air-event help request was accepted within 30 seconds of the modeled event.',
      },
      {
        id: 'control-venous-air-entry',
        statement: 'Record intent to prevent further air entry while the source remains plausible.',
        measure: 'The bounded source-control intent was accepted within 30 seconds of the modeled event.',
      },
      {
        id: 'support-venous-air-oxygenation',
        statement: 'Deliver 100% oxygen with active breath support.',
        measure: 'Inspired oxygen fraction 1.0 with active breath delivery was in effect within 60 seconds.',
      },
      {
        id: 'reassess-venous-air-recovery',
        statement: 'Reassess carbon dioxide, pressure, and oxygenation as the bounded pattern clears.',
        measure: 'End-tidal carbon dioxide recovered to at least 28 mmHg after accepted source control.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0',
      sources: [
        'Association of Anaesthetists Quick Reference Handbook, June 2023, 3-5 Circulatory embolus v1.',
        'Hinkelbein et al. Cardiac arrest in the perioperative period: a consensus guideline. European Journal of Trauma and Emergency Surgery. 2023;49:2031–2046. PMID 37430174.',
        'McCarthy et al. Air Embolism: Diagnosis, Clinical Management and Outcomes. Diagnostics. 2017;7:5. PMID 28106717.',
      ],
    },
    limitations: [
      'venous-air-embolism-injector-is-a-teaching-trajectory',
      'no-team-or-communication',
      'peep-not-modelled',
    ],
  },
  patient: {
    ageYears: 58, sex: 'male', heightCm: 178, weightKg: 82, asaClass: 2,
    diagnosis: 'Postoperative recovery after abdominal surgery',
    procedure: 'Internal jugular central venous catheter removal',
    comorbidities: ['Controlled hypertension'], medications: ['Amlodipine'],
    allergies: ['None known'], fasting: 'Not clinically relevant during postoperative recovery',
    baseline: {
      heartRateBpm: 78, meanArterialMmHg: 92, strokeVolumeMl: 72,
      hemoglobinGPerDl: 12.5, bloodVolumeMl: 5400, coreTemperatureC: 36.8,
      arterialStiffness: 1.1, baroreflexGain: 0.9, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.25, difficultMaskVentilation: false,
      assessment: 'Awake, speaking, and breathing spontaneously before line removal',
    },
    respiratory: { profile: 'healthy' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'capnography', 'pulse-oximetry'],
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 500,
      respiratoryRateBpm: 12, delivering: false,
    },
  },
  formulary: [{
    drugId: 'propofol', concentration: 10, concentrationUnit: 'mg/mL',
    syringeVolumeMl: 20, typicalDose: 40, deliveryModes: ['bolus'],
    presets: [{ label: '0.5 mg/kg', amount: 0.5, unit: 'mg/kg' }],
  }],
  timeline: [
    {
      id: 'briefing', type: 'narrative', atTick: 0, severity: 'advisory',
      message: 'An awake postoperative patient is monitored during internal jugular central-line removal. The simulator does not diagnose air embolism, teach line-removal or dressing technique, represent air volume or location, or model imaging, aspiration, hyperbaric therapy, neurologic injury, or team performance. Respond to the observable cardiopulmonary change.',
    },
    {
      id: 'venous-air-onset', type: 'venous-air-embolism',
      target: 'central-venous-catheter-track', value: 0.9, atTick: 600, severity: 'critical',
      message: 'The patient becomes suddenly breathless. End-tidal carbon dioxide, arterial pressure, and oxygen saturation begin to fall abruptly.',
    },
    {
      id: 'reassess-venous-air', type: 'narrative', atTick: 2400, severity: 'advisory',
      message: 'Reassess end-tidal carbon dioxide, pressure, and oxygenation. Monitor changes are not specific enough to establish a diagnosis.',
    },
  ],
  debrief: { rubric: [
    {
      id: 'venous-air-escalation', objectiveId: 'escalate-venous-air-pattern',
      question: 'How quickly did you escalate after the abrupt cardiopulmonary change?',
    },
    {
      id: 'venous-air-source-control', objectiveId: 'control-venous-air-entry',
      question: 'When did you record intent to prevent further entry, and what physical actions remain outside the model?',
    },
    {
      id: 'venous-air-oxygen', objectiveId: 'support-venous-air-oxygenation',
      question: 'Which oxygen and breath-delivery settings were accepted during the initial response?',
      concept: 'capnogram-morphology',
    },
    {
      id: 'venous-air-reassessment', objectiveId: 'reassess-venous-air-recovery',
      question: 'How did end-tidal carbon dioxide, pressure, and saturation change after accepted source control?',
      concept: 'capnogram-morphology',
    },
  ] },
};
