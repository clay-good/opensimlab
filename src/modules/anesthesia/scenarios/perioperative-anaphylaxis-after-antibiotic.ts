/** Perioperative anaphylaxis teaching model after cefazolin exposure. */

import type { Scenario } from './types';

export const PERIOPERATIVE_ANAPHYLAXIS_AFTER_ANTIBIOTIC: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'perioperative-anaphylaxis-after-antibiotic',
    version: '0.1.0',
    title: 'Perioperative anaphylaxis after antibiotic exposure',
    author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0',
    estimatedMinutes: 8,
    difficulty: 'advanced',
    objectives: [
      {
        id: 'recognize-anaphylaxis-pattern',
        statement: 'Recognize abrupt hypotension after antibiotic exposure with possible bronchospasm.',
        measure: 'A first-line epinephrine action was recorded within 60 seconds of the modeled exposure. This is a behavioral proxy, not a definitive diagnosis.',
      },
      {
        id: 'give-initial-epinephrine',
        statement: 'Give the modeled adult initial dose of intravenous epinephrine promptly.',
        measure: 'Exactly 50 micrograms of intravenous epinephrine was recorded within 60 seconds of exposure.',
      },
      {
        id: 'support-anaphylaxis-circulation',
        statement: 'Begin rapid crystalloid resuscitation for vasodilation and capillary leak.',
        measure: 'At least 1,000 mL of balanced crystalloid was recorded within 120 seconds of exposure.',
      },
      {
        id: 'support-anaphylaxis-oxygenation',
        statement: 'Deliver 100% oxygen and active ventilation while reassessing the observable response.',
        measure: 'By 60 seconds after exposure, at least 95% oxygen and active ventilation were in effect, whether established before or after exposure, and saturation remained at or above 92%.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0',
      sources: [
        'Harper NJN, et al. Anaesthesia, surgery, and life-threatening allergic reactions: epidemiology and clinical features of perioperative anaphylaxis. Br J Anaesth 2018;121:159-71. PMID 29935567',
        'Harper NJN, et al. Management and outcomes of perioperative anaphylaxis. Br J Anaesth 2018;121:172-88. PMID 29935569',
        'Resuscitation Council UK. Emergency treatment of peri-operative anaphylaxis. Anaesthesia 2024;79:535-41. PMID 38205901',
      ],
    },
    limitations: [
      'anaphylaxis-syndrome-is-a-teaching-model',
      'no-cutaneous-signs-or-tryptase',
      'anaphylaxis-initial-treatment-only',
      'crystalloid-volume-model',
      'no-team-or-communication',
      'no-shunt-or-dead-space-dynamics',
    ],
  },
  patient: {
    ageYears: 47, sex: 'female', heightCm: 165, weightKg: 70, asaClass: 2,
    diagnosis: 'Symptomatic cholelithiasis', procedure: 'Laparoscopic cholecystectomy',
    comorbidities: ['Mild gastro-oesophageal reflux'], medications: ['Omeprazole'],
    allergies: ['None known'], fasting: 'Solids eight hours, clear fluids two hours',
    baseline: {
      heartRateBpm: 74, meanArterialMmHg: 94, strokeVolumeMl: 76,
      hemoglobinGPerDl: 13.4, bloodVolumeMl: 4550, coreTemperatureC: 36.7,
      arterialStiffness: 1, baroreflexGain: 1, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Mallampati II, good mouth opening, full neck movement',
    },
    respiratory: { profile: 'healthy' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'capnography', 'pulse-oximetry', 'temperature', 'depth-index'],
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 480,
      respiratoryRateBpm: 12, delivering: false,
    },
  },
  formulary: [
    {
      drugId: 'propofol', concentration: 10, concentrationUnit: 'mg/mL',
      syringeVolumeMl: 20, typicalDose: 140, deliveryModes: ['bolus', 'infusion'],
      presets: [{ label: '1 mg/kg', amount: 1, unit: 'mg/kg' }, { label: '2 mg/kg', amount: 2, unit: 'mg/kg' }],
    },
    {
      drugId: 'remifentanil', concentration: 50, concentrationUnit: 'µg/mL',
      syringeVolumeMl: 20, typicalDose: 70,
      presets: [{ label: '25 µg', amount: 25, unit: 'µg' }, { label: '0.5 µg/kg', amount: 0.5, unit: 'µg/kg' }],
    },
  ],
  timeline: [
    {
      id: 'briefing', type: 'narrative', atTick: 0, severity: 'advisory',
      message: 'Induce anesthesia and manage the airway before prophylactic antibiotic administration. No allergy is documented. NAP6 estimated severe perioperative anaphylaxis near 1 in 10,000 anesthetics; hypotension was the first feature in 46%, bronchospasm in 18%, and antibiotics were identified more often than neuromuscular blockers (94 versus 65 of 199 culprits). This case models an observable pattern and initial treatment only; rash, tryptase, team actions, trigger removal, and refractory management are unavailable.',
    },
    {
      id: 'cefazolin-exposure', type: 'anaphylaxis', target: 'cefazolin', value: 0.9,
      atTick: 1800, severity: 'critical',
      message: 'Cefazolin is administered. Soon afterward, arterial pressure falls abruptly and ventilation becomes more difficult.',
    },
    {
      id: 'reassess', type: 'narrative', atTick: 3000, severity: 'advisory',
      message: 'Reassess pressure, delivered ventilation, saturation, and the response to initial treatment. The displayed findings cannot establish a definitive diagnosis.',
    },
  ],
  debrief: { rubric: [
    {
      id: 'pattern-not-proof', objectiveId: 'recognize-anaphylaxis-pattern',
      question: 'Which observable changes followed cefazolin, and which unmodeled findings would still matter clinically?',
      concept: 'vasodilation-versus-hypovolemia',
    },
    {
      id: 'initial-epinephrine', objectiveId: 'give-initial-epinephrine',
      question: 'When, by which route, and at what dose did you give epinephrine? Which observable findings prompted that action?',
      concept: 'vasodilation-versus-hypovolemia',
    },
    {
      id: 'fluid-for-leak', objectiveId: 'support-anaphylaxis-circulation',
      question: 'How much crystalloid did you give for modeled vasodilation and capillary leak?',
      concept: 'vasodilation-versus-hypovolemia',
    },
    {
      id: 'oxygen-and-reassessment', objectiveId: 'support-anaphylaxis-oxygenation',
      question: 'What oxygen and ventilation did you deliver, and what does the modeled response not prove?',
      concept: 'capnogram-morphology',
    },
  ] },
};
