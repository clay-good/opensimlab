/** Penetrating central-chest trauma with a bounded cardiac-tamponade physiology trajectory. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const CARDIAC_TAMPONADE: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'cardiac-tamponade', version: '0.1.0', maturity: 'preview',
    title: 'Cardiac tamponade', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 7, difficulty: 'advanced',
    objectives: [
      { id: 'recognize-traumatic-tamponade-pattern', statement: 'Join penetrating central-chest trauma with worsening perfusion and obstructive circulation.', measure: 'Mechanism, bilateral breathing, pressure, perfusion, and end-tidal carbon dioxide were reviewed together.' },
      { id: 'review-tamponade-focused-pocus', statement: 'Use the fixed focused-ultrasound finding to support urgent action without treating it as an acquired skill.', measure: 'The fixed pericardial-fluid and right-sided-collapse statement was reviewed after whole-patient assessment.' },
      { id: 'escalate-traumatic-tamponade-control', statement: 'Record immediate trauma and surgical definitive-control intent for the unstable pattern.', measure: 'Definitive-control intent followed recognition and the fixed POCUS statement.' },
      { id: 'reassess-traumatic-tamponade', statement: 'Reassess perfusion after accepted control intent without inferring procedural success.', measure: 'Serial canonical monitor review followed the accepted intent event.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'European Resuscitation Council Guidelines 2025: Special Circumstances in Resuscitation. Resuscitation. 2025;215(Suppl 1):110753.',
        'Resuscitation Council UK. Adult traumatic cardiac arrest/peri-arrest algorithm. October 27, 2025.',
      ],
    },
    limitations: [
      'tamponade-findings-and-pocus-are-authored',
      'tamponade-physiology-is-a-teaching-trajectory',
      'tamponade-control-is-intent-only',
      'no-tamponade-procedure-differential-or-outcome',
    ],
  },
  patient: {
    ageYears: 37, sex: 'male', heightCm: 178, weightKg: 79, asaClass: 4,
    diagnosis: 'Penetrating central-chest trauma with progressive obstructive shock',
    procedure: 'Emergency recognition and initial response to traumatic cardiac tamponade',
    comorbidities: ['None known'], medications: ['None known'], allergies: ['Unknown at arrival'],
    fasting: 'Not established in the emergency department',
    baseline: {
      heartRateBpm: 118, meanArterialMmHg: 88, strokeVolumeMl: 72,
      hemoglobinGPerDl: 13.2, bloodVolumeMl: 5000, coreTemperatureC: 36.2,
      arterialStiffness: 1, baroreflexGain: 1.1, fixedStrokeVolume: false,
    },
    airway: { difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Speaking in short phrases; bilateral air entry is present; no tracheal tube' },
    respiratory: { profile: 'moderately-ill' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'capnography', 'pulse-oximetry'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.6, tidalVolumeMl: 500,
      respiratoryRateBpm: 24, freshGasFlowLPerMin: 10, delivering: false },
  },
  formulary: [],
  timeline: [
    { id: 'traumatic-cardiac-tamponade-at-arrival', type: 'cardiac-tamponade',
      target: 'traumatic-pericardial-pressure', value: 0.9, atTick: 0, severity: 'critical',
      message: 'After penetrating central-chest trauma, perfusion, pressure, stroke volume, and end-tidal carbon dioxide worsen while bilateral air entry remains present.' },
    { id: 'cardiac-tamponade-lesson-boundary', type: 'narrative', target: 'cardiac-tamponade',
      atTick: 0, severity: 'advisory',
      message: 'Integrate mechanism and perfusion, review one fixed POCUS statement, record immediate trauma and surgical definitive-control intent, and reassess. Image acquisition, procedure selection or technique, transport, technical success, complications, differential diagnosis, arrest, and outcome are outside this vignette.' },
  ],
  debrief: { rubric: [
    { id: 'tamponade-recognition', objectiveId: 'recognize-traumatic-tamponade-pattern', question: 'Which mechanism and perfusion findings made this more than isolated respiratory distress?' },
    { id: 'tamponade-pocus', objectiveId: 'review-tamponade-focused-pocus', question: 'How did the fixed POCUS statement change urgency without proving acquisition competence?' },
    { id: 'tamponade-control', objectiveId: 'escalate-traumatic-tamponade-control', question: 'Why did definitive-control escalation proceed immediately, and which procedure decisions remain outside the lab?' },
    { id: 'tamponade-reassessment', objectiveId: 'reassess-traumatic-tamponade', question: 'What changed after accepted intent, and why is that not proof of technical success?' },
  ] },
};
