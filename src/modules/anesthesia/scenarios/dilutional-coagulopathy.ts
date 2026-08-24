/** Lab-guided recognition and reassessment of bounded dilutional coagulopathy. */

import type { Scenario } from './types';

export const DILUTIONAL_COAGULOPATHY: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'dilutional-coagulopathy',
    version: '0.1.0',
    maturity: 'draft',
    title: 'Dilutional coagulopathy during ongoing bleeding',
    author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0',
    estimatedMinutes: 6,
    difficulty: 'advanced',
    objectives: [
      {
        id: 'identify-dilutional-coagulopathy',
        statement: 'Use the new diffuse oozing to prompt coagulation assessment.',
        measure: 'An accepted coagulation panel was obtained within 60 seconds of the diffuse-oozing cue and showed a PT ratio above 1.5.',
      },
      {
        id: 'give-lab-guided-plasma',
        statement: 'Use the abnormal panel, not volume loss alone, to guide the bounded plasma response.',
        measure: 'Four units of plasma were accepted after the abnormal panel while modeled bleeding remained active.',
      },
      {
        id: 'reassess-coagulation-response',
        statement: 'Repeat the panel after plasma rather than assuming correction.',
        measure: 'A second accepted panel within 60 seconds of plasma showed a lower PT ratio and higher fibrinogen concentration.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0',
      sources: [
        'NICE NG24. Blood transfusion: fresh frozen plasma transfusion. Updated February 26, 2026.',
        'NHS Blood and Transplant. Fresh-Frozen Plasma Dosage poster. Version 1.',
      ],
    },
    limitations: [
      'prbc-fixed-unit-model',
      'bounded-dilutional-coagulopathy',
      'blood-bank-handoff-is-instantaneous',
      'plasma-panel-is-instantaneous',
      'no-team-or-communication',
    ],
  },
  patient: {
    ageYears: 67, sex: 'female', heightCm: 163, weightKg: 70, asaClass: 3,
    diagnosis: 'Periprosthetic femoral fracture',
    procedure: 'Revision hip arthroplasty under neuraxial anesthesia',
    comorbidities: ['Hypertension'], medications: ['Amlodipine'], allergies: ['None known'],
    fasting: 'Eight hours for solids, two hours for clear fluids',
    baseline: {
      heartRateBpm: 96, meanArterialMmHg: 76, strokeVolumeMl: 58,
      hemoglobinGPerDl: 8.8, bloodVolumeMl: 5000, coreTemperatureC: 36.1,
      arterialStiffness: 1.25, baroreflexGain: 0.8, fixedStrokeVolume: false,
      coagulationFactorFraction: 0.6, fibrinogenGPerL: 1.8,
    },
    airway: {
      difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Awake under neuraxial anesthesia, speaking clearly, and breathing without assistance',
    },
    respiratory: { profile: 'healthy' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'arterial-line', 'capnography', 'pulse-oximetry', 'temperature'],
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 450, respiratoryRateBpm: 12,
      delivering: false,
    },
  },
  formulary: [{
    drugId: 'propofol', concentration: 10, concentrationUnit: 'mg/mL',
    deliveryModes: ['bolus'], syringeVolumeMl: 20, typicalDose: 20,
    presets: [{ label: '20 mg', amount: 20, unit: 'mg' }],
  }],
  timeline: [
    {
      id: 'briefing', type: 'narrative', atTick: 0, severity: 'advisory',
      message: 'You take over during revision hip surgery under neuraxial anesthesia. Earlier blood loss was replaced predominantly with crystalloid. The current PT-ratio and fibrinogen state represents that prior dilution; the earlier fluid sequence is not replayed. Modest bleeding continues. Requesting products is an instantaneous teaching release, not a compatibility workflow.',
    },
    {
      id: 'ongoing-coagulopathic-bleeding', type: 'blood-loss', atTick: 0, value: 90,
      durationTicks: 4200, severity: 'warning',
      message: 'Measured blood loss continues at approximately 90 mL/min in this bounded model.',
    },
    {
      id: 'diffuse-oozing', type: 'narrative', atTick: 600, severity: 'critical',
      message: 'The field now shows diffuse oozing despite no new focal vessel. Assess the current coagulation state before selecting component support.',
    },
    {
      id: 'reassessment-window', type: 'narrative', atTick: 3000, severity: 'advisory',
      message: 'Reassess the panel after any accepted plasma response. This short case does not model source control, consumption, platelets, cryoprecipitate, reactions, or a massive-transfusion protocol.',
    },
  ],
  replayPoints: [{
    id: 'before-diffuse-oozing', label: 'Before diffuse oozing is reported',
    objectiveId: 'identify-dilutional-coagulopathy', atTick: 599,
    reason: 'Rehearse the lab-guided sequence from the first new clue without replaying prior resuscitation.',
  }],
  debrief: { rubric: [
    {
      id: 'recognize-dilution', objectiveId: 'identify-dilutional-coagulopathy',
      question: 'What made dilutional coagulopathy plausible, and what did the first panel actually show?',
      concept: 'vasodilation-versus-hypovolemia',
    },
    {
      id: 'guide-plasma', objectiveId: 'give-lab-guided-plasma',
      question: 'Which accepted result preceded plasma, and which real product decisions remain outside this model?',
      concept: 'vasodilation-versus-hypovolemia',
    },
    {
      id: 'repeat-panel', objectiveId: 'reassess-coagulation-response',
      question: 'How did PT ratio and fibrinogen change, and why is a repeated test different from assuming correction?',
      concept: 'vasodilation-versus-hypovolemia',
    },
  ] },
};
