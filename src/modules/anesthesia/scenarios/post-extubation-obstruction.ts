/** Immediate post-extubation soft-tissue obstruction and initial support. */

import type { Scenario } from './types';

export const POST_EXTUBATION_OBSTRUCTION: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'post-extubation-obstruction', version: '0.1.0', maturity: 'draft',
    title: 'Post-extubation obstruction', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 6, difficulty: 'intermediate',
    objectives: [
      {
        id: 'recognize-post-extubation-obstruction',
        statement: 'Recognize obstructed inspiratory effort after extubation as an upper-airway emergency.',
        measure: 'Airway help was requested within 30 seconds of the scripted obstructed-breathing pattern.',
      },
      {
        id: 'support-post-extubation-airway',
        statement: 'Restore upper-airway patency with a held jaw thrust, continuous positive pressure, and 100% oxygen.',
        measure: 'The combined maneuver began with active breath delivery and at least 95% oxygen within 45 seconds of onset.',
      },
      {
        id: 'confirm-post-extubation-recovery',
        statement: 'Confirm that gas movement, capnography, and oxygenation recover after initial support.',
        measure: 'Modeled airway patency returned to at least 95% with tidal volume and end-tidal carbon dioxide present.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0',
      sources: [
        'Difficult Airway Society Extubation Guidelines Group, et al. Difficult Airway Society Guidelines for the management of tracheal extubation. Anaesthesia. 2012;67:318-340. PMID 22321104.',
      ],
    },
    limitations: [
      'post-extubation-obstruction-is-a-bounded-teaching-trajectory',
      'soft-tissue-obstruction-only',
      'no-refractory-post-extubation-airway-pathway',
    ],
  },
  patient: {
    ageYears: 52, sex: 'male', heightCm: 175, weightKg: 108, asaClass: 3,
    diagnosis: 'Umbilical hernia', procedure: 'Laparoscopic umbilical hernia repair',
    comorbidities: ['Obesity', 'Obstructive sleep apnea treated with home CPAP', 'Hypertension'],
    medications: ['Amlodipine'], allergies: ['None known'],
    fasting: 'Eight hours for solids, two hours for clear fluids',
    baseline: {
      heartRateBpm: 76, meanArterialMmHg: 92, strokeVolumeMl: 76,
      hemoglobinGPerDl: 14.1, bloodVolumeMl: 5600, coreTemperatureC: 36.6,
      arterialStiffness: 1.15, baroreflexGain: 0.85, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.18, difficultMaskVentilation: false,
      assessment: 'Tracheal extubation has just occurred after an uncomplicated airway; the patient is supine and drowsy with a facemask in place',
    },
    respiratory: { profile: 'obese' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'capnography', 'pulse-oximetry', 'temperature'],
    airwayDevice: 'facemask',
    ventilator: {
      mode: 'manual', fio2: 0.4, tidalVolumeMl: 500, respiratoryRateBpm: 12,
      freshGasFlowLPerMin: 6, sevofluranePercent: 0, delivering: false,
    },
  },
  formulary: [],
  timeline: [
    {
      id: 'post-extubation-briefing', type: 'narrative', atTick: 0, severity: 'warning',
      message: 'The tracheal tube has already been removed. This lesson begins with a facemask in place and models only initial support for soft-tissue upper-airway obstruction. Laryngospasm, airway edema, aspiration, pulmonary edema, airway adjuncts, reintubation, and team performance are not modeled.',
    },
    {
      id: 'post-extubation-obstruction-onset', type: 'upper-airway-obstruction',
      atTick: 100, value: 0.5, severity: 'critical',
      message: 'Ten seconds after extubation, loud snoring becomes intermittent. Inspiratory effort is paradoxical, tidal volume falls, and the capnogram shrinks. The facemask remains in place.',
    },
    {
      id: 'post-extubation-reassessment', type: 'narrative', atTick: 1000,
      severity: 'advisory',
      message: 'Reassess airway patency, visible gas movement, the capnogram, oxygenation, and whether escalation beyond this bounded initial-response model is needed.',
    },
  ],
  debrief: { rubric: [
    {
      id: 'post-extubation-recognition', objectiveId: 'recognize-post-extubation-obstruction',
      question: 'Which combined findings made upper-airway obstruction more likely than normal drowsy breathing?',
      concept: 'capnogram-morphology',
    },
    {
      id: 'post-extubation-support', objectiveId: 'support-post-extubation-airway',
      question: 'How quickly did you recruit help and begin a held jaw thrust, continuous positive pressure, and high-concentration oxygen?',
      concept: 'preoxygenation-and-safe-apnea-time',
    },
    {
      id: 'post-extubation-recovery', objectiveId: 'confirm-post-extubation-recovery',
      question: 'Which airway, ventilation, capnography, and oxygenation findings showed modeled recovery, and what unmodeled causes would still require escalation?',
      concept: 'capnogram-morphology',
    },
  ] },
};
