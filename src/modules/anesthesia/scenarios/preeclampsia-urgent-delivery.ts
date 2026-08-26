/** Bounded confirmation, initial treatment, and reassessment before urgent delivery. */

import type { Scenario } from './types';

export const PREECLAMPSIA_URGENT_DELIVERY: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'preeclampsia-urgent-delivery',
    version: '0.1.0',
    maturity: 'preview',
    title: 'Preeclampsia before urgent delivery',
    author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0',
    estimatedMinutes: 8,
    difficulty: 'intermediate',
    objectives: [
      {
        id: 'confirm-persistent-severe-hypertension',
        statement: 'Confirm the persistent severe-range pressure.',
        measure: 'An accepted repeat showed systolic pressure at least 160 mmHg or diastolic pressure at least 110 mmHg before treatment.',
      },
      {
        id: 'treat-severe-pregnancy-hypertension',
        statement: 'Use the listed first-line antihypertensive branch after confirmation.',
        measure: 'The bounded 20 mg IV labetalol action was accepted after the confirming pressure and within the 60-minute emergency-treatment window.',
      },
      {
        id: 'start-preeclampsia-seizure-prophylaxis',
        statement: 'Start the listed magnesium-sulfate loading branch for seizure prophylaxis.',
        measure: 'The bounded 4 g IV magnesium-sulfate action was accepted after confirmation and was distinguished from antihypertensive treatment.',
      },
      {
        id: 'reassess-preeclampsia-response',
        statement: 'Repeat the pressure after antihypertensive treatment and interpret the observed response.',
        measure: 'A later accepted pressure was below 160/110 mmHg while mean arterial pressure remained at least 65 mmHg.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0',
      sources: [
        'ACOG Practice Bulletin No. 222: Gestational Hypertension and Preeclampsia (2020; reaffirmed 2026)',
        'Alliance for Innovation on Maternal Health Severe Hypertension in Pregnancy Patient Safety Bundle (2022)',
        'SMFM Special Statement: Quality metric for timely treatment of severe hypertension (2022; reaffirmed 2025)',
      ],
    },
    limitations: [
      'preeclampsia-response-is-a-bounded-teaching-trajectory',
      'no-team-or-communication',
      'bolus-injection-is-instantaneous',
      'preeclampsia-lesson-stops-before-anesthesia-and-delivery',
    ],
  },
  patient: {
    ageYears: 29, sex: 'female', heightCm: 166, weightKg: 82, asaClass: 3,
    diagnosis: 'Preeclampsia with severe features at 35 weeks; urgent delivery decision made',
    procedure: 'Maternal stabilization before urgent cesarean delivery',
    comorbidities: ['Persistent severe-range hypertension', 'Headache'],
    medications: ['Prenatal vitamin'], allergies: ['None known'],
    fasting: 'Last solids five hours ago; aspiration and anesthetic planning are outside this lesson',
    baseline: {
      heartRateBpm: 96, meanArterialMmHg: 135, strokeVolumeMl: 74,
      hemoglobinGPerDl: 11.7, bloodVolumeMl: 5100, coreTemperatureC: 36.8,
      arterialStiffness: 1, baroreflexGain: 1, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Airway examination is documented but anesthetic technique is outside this focused lesson',
    },
    respiratory: { profile: 'term-pregnancy' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'pulse-oximetry'],
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 470,
      respiratoryRateBpm: 12, freshGasFlowLPerMin: 2, delivering: false,
    },
  },
  formulary: [],
  timeline: [
    {
      id: 'persistent-severe-hypertension', type: 'narrative',
      target: 'persistent-severe-preeclampsia', atTick: 0, severity: 'critical',
      message: 'The urgent-delivery decision is already made. A prior pressure was 168/112 mmHg and headache persists. Repeat the pressure, use the focused maternal-response controls, then reassess. Diagnosis, laboratory testing, fetal status, route or timing of delivery, anesthetic technique, and team performance are outside this lesson.',
    },
    {
      id: 'preeclampsia-reassessment-cue', type: 'narrative', atTick: 1200,
      severity: 'advisory',
      message: 'Recheck the accepted treatment, observed pressure, heart rate, ventilation, and oxygen saturation. Magnesium is seizure prophylaxis, not the antihypertensive response.',
    },
  ],
  replayPoints: [{
    id: 'before-maternal-response', label: 'Before maternal response',
    objectiveId: 'confirm-persistent-severe-hypertension', atTick: 9,
    reason: 'Repeat the confirmation-to-reassessment sequence without replaying the briefing.',
  }],
  debrief: { rubric: [
    {
      id: 'preeclampsia-confirmation', objectiveId: 'confirm-persistent-severe-hypertension',
      question: 'What did the accepted repeat pressure show before treatment?',
      concept: 'vasodilation-versus-hypovolemia',
    },
    {
      id: 'preeclampsia-antihypertensive', objectiveId: 'treat-severe-pregnancy-hypertension',
      question: 'Which accepted action treated pressure, and what remains outside its bounded response?',
      concept: 'vasodilation-versus-hypovolemia',
    },
    {
      id: 'preeclampsia-magnesium', objectiveId: 'start-preeclampsia-seizure-prophylaxis',
      question: 'Why was magnesium started, and which effect does this model deliberately not give it?',
      concept: 'vasodilation-versus-hypovolemia',
    },
    {
      id: 'preeclampsia-reassessment', objectiveId: 'reassess-preeclampsia-response',
      question: 'What did the follow-up pressure show after the accepted antihypertensive action?',
      concept: 'vasodilation-versus-hypovolemia',
    },
  ] },
};
