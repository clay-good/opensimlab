/** Regular narrow-complex tachycardia with authored hemodynamic instability. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const UNSTABLE_NARROW_COMPLEX_TACHYCARDIA: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'unstable-narrow-complex-tachycardia', version: '0.1.0', maturity: 'preview',
    title: 'Unstable narrow-complex tachycardia', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 8, difficulty: 'introductory',
    objectives: [
      { id: 'recognize-unstable-narrow-tachycardia', statement: 'Recognize a persistent regular narrow-complex tachycardia causing hypotension, altered mentation, ischemic discomfort, and shock signs.', measure: 'Rhythm features and instability were reviewed together.' },
      { id: 'prepare-unstable-tachycardia-response', statement: 'Record immediate airway/breathing assessment, monitoring, IV access, help, and synchronized-cardioversion pad preparation without routine oxygen in a nonhypoxemic patient.', measure: 'The bounded preparation followed instability recognition.' },
      { id: 'cardiovert-unstable-narrow-tachycardia', statement: 'Record prompt synchronized cardioversion with sedation only when feasible and without delaying the shock.', measure: 'Synchronized-cardioversion intent followed preparation.' },
      { id: 'reassess-after-tachycardia-cardioversion', statement: 'Reassess rhythm, pressure, mental status, ischemic discomfort, and perfusion after the bounded response.', measure: 'Serial whole-patient reassessment followed cardioversion intent.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Wigginton JG, et al. Part 9: Adult Advanced Life Support: 2025 AHA Guidelines for CPR and ECC. Circulation. 2025;152(suppl 2):S538-S577. doi:10.1161/CIR.0000000000001376.',
        'American Heart Association. Adult Tachyarrhythmia With a Pulse Algorithm. 2025.',
        'Page RL, et al. 2015 ACC/AHA/HRS Guideline for the Management of Adult Patients With Supraventricular Tachycardia. Circulation. 2016;133:e506-e574. doi:10.1161/CIR.0000000000000311.',
      ],
    },
    limitations: ['unstable-tachycardia-rhythm-and-instability-are-authored',
      'synchronized-cardioversion-is-an-intent-control',
      'no-tachycardia-energy-sedation-procedure-recurrence-or-outcome'],
  },
  patient: {
    ageYears: 62, sex: 'female', heightCm: 164, weightKg: 70, asaClass: 4,
    diagnosis: 'Unstable regular narrow-complex tachycardia',
    procedure: 'Emergency recognition and initial synchronized-cardioversion response',
    comorbidities: ['Hypertension'], medications: ['Lisinopril'],
    allergies: ['No known drug allergies'], fasting: 'Not established in the emergency department',
    baseline: { heartRateBpm: 180, meanArterialMmHg: 57, strokeVolumeMl: 32,
      hemoglobinGPerDl: 13.1, bloodVolumeMl: 4700, coreTemperatureC: 36.8,
      arterialStiffness: 1.1, baroreflexGain: 0.8, fixedStrokeVolume: false },
    airway: { difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Drowsy but arousable, speaking short sentences, with a patent airway' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'capnography', 'pulse-oximetry', 'temperature'],
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 460,
      respiratoryRateBpm: 24, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'unstable-narrow-tachycardia-rhythm', type: 'rhythm-change', target: 'svt',
      atTick: 0, severity: 'critical',
      message: 'The teaching monitor shows a very regular narrow-complex tachycardia without visible P waves.' },
    { id: 'unstable-narrow-tachycardia-boundary', type: 'narrative',
      target: 'unstable-narrow-complex-tachycardia', atTick: 0, severity: 'critical',
      message: 'A fixed regular narrow-complex tachycardia is causing hypotension, altered mentation, ischemic discomfort, and shock signs. Review rhythm and instability together; record immediate support, monitoring, access, help, and synchronized-cardioversion preparation; record prompt synchronized-cardioversion intent with sedation only if feasible; then reassess the fixed response. Live 12-lead acquisition, causal diagnosis, device operation, energy selection, sedation delivery, cardioversion technique, refractory treatment, recurrence, disposition, and outcome are outside this vignette.' },
  ],
  debrief: { rubric: [
    { id: 'tachycardia-instability', objectiveId: 'recognize-unstable-narrow-tachycardia', question: 'Which rhythm and whole-patient findings made this tachycardia unstable?' },
    { id: 'tachycardia-preparation', objectiveId: 'prepare-unstable-tachycardia-response', question: 'How did you prepare for immediate synchronized cardioversion without adding routine oxygen?' },
    { id: 'tachycardia-cardioversion', objectiveId: 'cardiovert-unstable-narrow-tachycardia', question: 'Why was synchronized cardioversion prioritized, and how was sedation bounded?' },
    { id: 'tachycardia-reassessment', objectiveId: 'reassess-after-tachycardia-cardioversion', question: 'Which rhythm and perfusion findings changed after the bounded response?' },
  ] },
};
