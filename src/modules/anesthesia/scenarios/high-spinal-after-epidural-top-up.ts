/** Bounded high-central-neuraxial-block recognition and initial response. */

import type { Scenario } from './types';

export const HIGH_SPINAL_AFTER_EPIDURAL_TOP_UP: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'high-spinal-after-epidural-top-up',
    version: '0.1.0',
    maturity: 'draft',
    title: 'High spinal after epidural top-up',
    author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0',
    estimatedMinutes: 8,
    difficulty: 'advanced',
    objectives: [
      {
        id: 'call-for-high-spinal-help',
        statement: 'Recognize the rapidly progressive pattern and call for help.',
        measure: 'A high-spinal help request was accepted within 30 seconds of the modeled event.',
      },
      {
        id: 'support-high-spinal-breathing',
        statement: 'Give high inspired oxygen and support breathing as ventilation weakens.',
        measure: 'At least 95% inspired oxygen with active breath delivery was in effect within 60 seconds.',
      },
      {
        id: 'support-high-spinal-circulation',
        statement: 'Treat hypotension with a small fluid bolus and the stocked vasopressor.',
        measure: 'A 250–500 mL crystalloid bolus and a listed ephedrine bolus were accepted within 60 seconds.',
      },
      {
        id: 'protect-high-spinal-oxygenation',
        statement: 'Protect oxygenation while the modeled block progresses.',
        measure: 'Oxygen saturation remained at or above 92%.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0',
      sources: [
        'Obstetric Anaesthetists’ Association. High central neuraxial block. Obstetric Quick Reference Handbook, section 2-7, version 1.',
      ],
    },
    limitations: [
      'high-spinal-injector-is-a-teaching-trajectory',
      'no-team-or-communication',
      'bolus-injection-is-instantaneous',
      'peep-not-modelled',
    ],
  },
  patient: {
    ageYears: 31, sex: 'female', heightCm: 165, weightKg: 72, asaClass: 2,
    diagnosis: 'Term pregnancy with fetal distress', procedure: 'Emergency cesarean delivery',
    comorbidities: ['None'], medications: ['None'], allergies: ['None known'],
    fasting: 'Solids six hours, clear fluids two hours',
    baseline: {
      heartRateBpm: 92, meanArterialMmHg: 90, strokeVolumeMl: 70,
      hemoglobinGPerDl: 11.8, bloodVolumeMl: 4800, coreTemperatureC: 36.7,
      arterialStiffness: 0.9, baroreflexGain: 1, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.22, difficultMaskVentilation: false,
      assessment: 'Mallampati II, normal mouth opening and neck movement',
    },
    respiratory: { profile: 'healthy' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'capnography', 'pulse-oximetry'],
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 450,
      respiratoryRateBpm: 12, delivering: false,
    },
  },
  formulary: [{
    drugId: 'propofol', concentration: 10, concentrationUnit: 'mg/mL',
    syringeVolumeMl: 20, typicalDose: 70, deliveryModes: ['bolus'],
    presets: [{ label: '0.5 mg/kg', amount: 0.5, unit: 'mg/kg' }],
  }],
  timeline: [
    {
      id: 'briefing', type: 'narrative', atTick: 0, severity: 'advisory',
      message: 'An awake patient has just received an epidural top-up for emergency cesarean delivery. The simulator does not model neuraxial dose, spread, block height, pregnancy physiology, aortocaval compression, fetal status, or delivery. Respond to the observable airway, breathing, and circulation pattern.',
    },
    {
      id: 'high-spinal-onset', type: 'high-spinal', target: 'neuraxial-local-anesthetic',
      value: 1, atTick: 600, severity: 'critical',
      message: 'She reports difficulty breathing and heavy arms. Her heart rate and arterial pressure begin to fall.',
    },
    {
      id: 'reassess-high-spinal', type: 'narrative', atTick: 2400, severity: 'advisory',
      message: 'Reassess oxygen delivery, ventilation, heart rate, and pressure. The modeled block does not recede during this short initial-response case.',
    },
  ],
  debrief: { rubric: [
    {
      id: 'high-spinal-escalation', objectiveId: 'call-for-high-spinal-help',
      question: 'How quickly did you escalate when breathing difficulty and cardiovascular compromise appeared?',
    },
    {
      id: 'high-spinal-respiratory-support', objectiveId: 'support-high-spinal-breathing',
      question: 'Which oxygen and ventilation settings were in effect as unassisted breathing weakened?',
      concept: 'capnogram-morphology',
    },
    {
      id: 'high-spinal-circulatory-support', objectiveId: 'support-high-spinal-circulation',
      question: 'Which fluid and vasopressor actions were accepted, and what remains outside this model?',
      concept: 'vasodilation-versus-hypovolemia',
    },
    {
      id: 'high-spinal-oxygenation', objectiveId: 'protect-high-spinal-oxygenation',
      question: 'What was the lowest oxygen saturation during the modeled progression?',
    },
  ] },
};
