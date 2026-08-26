/** Bounded local-anesthetic systemic-toxicity recognition and initial response. */

import type { Scenario } from './types';

export const LOCAL_ANESTHETIC_SYSTEMIC_TOXICITY: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'local-anesthetic-systemic-toxicity',
    version: '0.1.0',
    maturity: 'preview',
    title: 'Local-anesthetic systemic toxicity after block injection',
    author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0',
    estimatedMinutes: 8,
    difficulty: 'advanced',
    objectives: [
      {
        id: 'recognize-last-pattern',
        statement: 'Recognize neurologic and cardiovascular toxicity after local-anesthetic exposure.',
        measure: 'An accepted initial response was recorded within 60 seconds of the modeled exposure.',
      },
      {
        id: 'support-last-airway-and-seizure',
        statement: 'Deliver high inspired oxygen with active ventilation and suppress modeled seizure activity.',
        measure: 'At least 95% oxygen and active ventilation were in effect, and an IV benzodiazepine action was accepted within 60 seconds.',
      },
      {
        id: 'start-last-lipid',
        statement: 'Start the ASRA 2020 weight-banded initial 20% lipid-emulsion protocol.',
        measure: 'The engine accepted 20% lipid, calculated the 60 kg initial bolus as 90 mL, and started 15 mL/min infusion within 60 seconds.',
      },
      {
        id: 'use-reduced-last-epinephrine',
        statement: 'If epinephrine is used, keep the initial IV bolus at or below 1 microgram/kg and reassess.',
        measure: 'The first accepted epinephrine action, if any, was no more than 60 micrograms IV.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0',
      sources: [
        'Neal JM, Neal EJ, Weinberg GL. American Society of Regional Anesthesia and Pain Medicine Local Anesthetic Systemic Toxicity checklist: 2020 version. Reg Anesth Pain Med 2021;46:81-2. PMID 33148630',
      ],
    },
    limitations: [
      'last-syndrome-is-a-teaching-model',
      'last-initial-response-only',
      'no-regional-anaesthesia',
      'no-team-or-communication',
    ],
  },
  patient: {
    ageYears: 42, sex: 'female', heightCm: 165, weightKg: 60, asaClass: 1,
    diagnosis: 'Distal radius fracture', procedure: 'Open reduction after planned upper-limb block',
    comorbidities: ['None'], medications: ['None'], allergies: ['None known'],
    fasting: 'Solids eight hours, clear fluids two hours',
    baseline: {
      heartRateBpm: 76, meanArterialMmHg: 92, strokeVolumeMl: 72,
      hemoglobinGPerDl: 13.1, bloodVolumeMl: 4200, coreTemperatureC: 36.8,
      arterialStiffness: 1, baroreflexGain: 1, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Mallampati II, normal mouth opening and neck movement',
    },
    respiratory: { profile: 'healthy' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'capnography', 'pulse-oximetry'],
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 420,
      respiratoryRateBpm: 12, delivering: false,
    },
  },
  formulary: [
    {
      drugId: 'propofol', concentration: 10, concentrationUnit: 'mg/mL',
      syringeVolumeMl: 20, typicalDose: 120, deliveryModes: ['bolus', 'infusion'],
      presets: [{ label: '0.5 mg/kg', amount: 0.5, unit: 'mg/kg' }],
    },
  ],
  timeline: [
    {
      id: 'briefing', type: 'narrative', atTick: 0, severity: 'advisory',
      message: 'A 60 kg adult is awake during injection for a planned upper-limb block. The block, injection technique, local-anesthetic pharmacokinetics, and diagnosis are not modeled. Follow the ASRA 2020 LAST checklist if an observable toxicity pattern develops: manage the airway, suppress seizure activity with a benzodiazepine, use smaller-than-normal epinephrine doses if needed, avoid vasopressin, beta blockers, calcium-channel blockers and further local anesthetic, and use weight-banded 20% lipid emulsion.',
    },
    {
      id: 'bupivacaine-exposure', type: 'local-anesthetic-toxicity',
      target: 'bupivacaine', value: 0.9, atTick: 600, severity: 'critical',
      message: 'Soon after the injection, tinnitus and agitation are followed by generalized seizure activity, bradycardia, and falling arterial pressure.',
    },
    {
      id: 'reassess', type: 'narrative', atTick: 2400, severity: 'advisory',
      message: 'Reassess seizure status, oxygen delivery, cardiac output, and pressure. Modeled improvement is not diagnostic confirmation or a guarantee of recovery.',
    },
  ],
  debrief: { rubric: [
    {
      id: 'pattern-after-exposure', objectiveId: 'recognize-last-pattern',
      question: 'Which findings followed the exposure, and why does that sequence not prove the diagnosis?',
    },
    {
      id: 'airway-and-seizure', objectiveId: 'support-last-airway-and-seizure',
      question: 'What oxygen, ventilation, and seizure-suppression actions were accepted?',
      concept: 'capnogram-morphology',
    },
    {
      id: 'weight-banded-lipid', objectiveId: 'start-last-lipid',
      question: 'Which ASRA weight band applied, and what initial bolus and infusion did it produce?',
    },
    {
      id: 'reduced-epinephrine', objectiveId: 'use-reduced-last-epinephrine',
      question: 'If epinephrine was used, how did its dose compare with 1 microgram/kg?',
      concept: 'vasodilation-versus-hypovolemia',
    },
  ] },
};
