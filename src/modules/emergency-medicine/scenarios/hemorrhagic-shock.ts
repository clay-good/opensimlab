/** Blunt pelvic trauma with ongoing concealed hemorrhage and bounded damage-control intents. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const HEMORRHAGIC_SHOCK: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'hemorrhagic-shock', version: '0.1.0', maturity: 'draft',
    title: 'Hemorrhagic shock', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 8, difficulty: 'intermediate',
    objectives: [
      { id: 'recognize-traumatic-hemorrhagic-shock', statement: 'Integrate mechanism, injury pattern, physiology, and perfusion rather than waiting for visible bleeding.', measure: 'The fixed pelvic-trauma and tissue-hypoperfusion evidence was reviewed together.' },
      { id: 'stabilize-and-expedite-bleeding-control', statement: 'Record pelvic stabilization and definitive bleeding-control escalation without delaying either for resuscitation.', measure: 'Both control intents followed recognition and proceeded alongside resuscitation.' },
      { id: 'activate-and-bridge-with-blood', statement: 'Activate a major-hemorrhage response and use the bounded red-cell bridge instead of liberal crystalloid.', measure: 'Major-hemorrhage activation preceded 2 fixed adult red-cell units.' },
      { id: 'monitor-and-reassess-traumatic-bleeding', statement: 'Review coagulation and temperature, then reassess perfusion while bleeding control remains definitive.', measure: 'Monitoring and red-cell delivery preceded serial perfusion reassessment.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Rossaint R, Afshari A, Bouillon B, et al. The European guideline on management of major bleeding and coagulopathy following trauma: sixth edition. Crit Care. 2023;27:80. PMID 36859355. doi:10.1186/s13054-023-04327-7.',
        'AABB Circular of Information for the Use of Human Blood and Blood Components, June 2024.',
      ],
    },
    limitations: [
      'trauma-findings-and-source-are-authored',
      'trauma-control-and-major-hemorrhage-actions-are-intents',
      'no-trauma-protocol-procedure-ratio-or-outcome',
    ],
  },
  patient: {
    ageYears: 41, sex: 'male', heightCm: 180, weightKg: 82, asaClass: 4,
    diagnosis: 'Blunt pelvic trauma with ongoing concealed hemorrhage',
    procedure: 'Emergency recognition and initial response to traumatic hemorrhagic shock',
    comorbidities: ['None known'], medications: ['None known'], allergies: ['Unknown at arrival'],
    fasting: 'Not established in the emergency department',
    baseline: {
      heartRateBpm: 132, meanArterialMmHg: 55, strokeVolumeMl: 38,
      hemoglobinGPerDl: 10.1, bloodVolumeMl: 3900, coreTemperatureC: 35.3,
      arterialStiffness: 1, baroreflexGain: 1.2, fixedStrokeVolume: false,
      fibrinogenGPerL: 2.1,
    },
    airway: {
      difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Speaking, no fixed airway obstruction finding, no severe traumatic brain injury in this vignette',
    },
    respiratory: { profile: 'moderately-ill' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'],
    airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 500, respiratoryRateBpm: 24, delivering: false },
  },
  formulary: [],
  timeline: [
    {
      id: 'traumatic-hemorrhage-pattern-at-arrival', type: 'hemorrhagic-shock-pattern',
      target: 'blunt-pelvic-trauma', value: 1, atTick: 0, severity: 'critical',
      message: 'Blunt pelvic trauma, impaired perfusion, and concealed blood loss are present together. Severe traumatic brain injury is excluded from this fixed vignette.',
    },
    {
      id: 'ongoing-concealed-pelvic-blood-loss', type: 'blood-loss', atTick: 0,
      value: 360, durationTicks: 3000, severity: 'critical',
      message: 'Concealed pelvic blood loss continues until definitive control outside this vignette.',
    },
    {
      id: 'hemorrhagic-shock-lesson-boundary', type: 'narrative', target: 'hemorrhagic-shock',
      atTick: 0, severity: 'advisory',
      message: 'Integrate mechanism and perfusion, record pelvic stabilization and immediate definitive-control escalation, activate a major-hemorrhage response, give the bounded 2-unit red-cell bridge, review coagulation and temperature, and reassess. Procedures, component ratios, TXA, calcium, and outcome are outside this vignette.',
    },
  ],
  debrief: { rubric: [
    { id: 'trauma-recognition', objectiveId: 'recognize-traumatic-hemorrhagic-shock', question: 'Which mechanism, anatomy, and perfusion findings mattered before any visible external blood?' },
    { id: 'trauma-control', objectiveId: 'stabilize-and-expedite-bleeding-control', question: 'Why did pelvic stabilization and definitive-control escalation proceed alongside resuscitation?' },
    { id: 'trauma-blood-bridge', objectiveId: 'activate-and-bridge-with-blood', question: 'What did the bounded red-cell bridge replace, and what could it never control?' },
    { id: 'trauma-reassessment', objectiveId: 'monitor-and-reassess-traumatic-bleeding', question: 'How did coagulation, temperature, and serial perfusion evidence change the next priorities?' },
  ] },
};
