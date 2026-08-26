/** Bounded recognition and initial response to tension physiology during positive-pressure ventilation. */

import type { Scenario } from './types';

export const PNEUMOTHORAX_UNDER_POSITIVE_PRESSURE: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'pneumothorax-under-positive-pressure',
    version: '0.1.0',
    maturity: 'preview',
    title: 'Pneumothorax under positive pressure',
    author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0',
    estimatedMinutes: 8,
    difficulty: 'advanced',
    objectives: [
      {
        id: 'assess-pneumothorax-pattern',
        statement: 'Check bilateral ventilation when airway pressure, oxygenation, and circulation deteriorate together.',
        measure: 'A bilateral-ventilation assessment was accepted within 30 seconds of the modeled event.',
      },
      {
        id: 'escalate-pneumothorax-pattern',
        statement: 'Call for help when the combined breathing and circulation pattern appears.',
        measure: 'A pneumothorax-context help request was accepted within 30 seconds of the modeled event.',
      },
      {
        id: 'support-pneumothorax-oxygenation',
        statement: 'Deliver 100% oxygen while the cause is addressed.',
        measure: 'Inspired oxygen fraction 1.0 with active breath delivery was in effect within 60 seconds.',
      },
      {
        id: 'decompress-pneumothorax',
        statement: 'Record immediate left-chest decompression intent for severe tension physiology.',
        measure: 'The bounded decompression-intent action was accepted within 60 seconds of the modeled event.',
      },
      {
        id: 'reassess-pneumothorax-recovery',
        statement: 'Reassess oxygenation and pressure after accepted decompression intent.',
        measure: 'Oxygen saturation recovered to at least 94% and mean arterial pressure to at least 65 mmHg after accepted decompression.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0',
      sources: [
        'Association of Anaesthetists. Quick Reference Handbook, June 2023: 2-2 Hypoxia/desaturation/cyanosis, 2-3 Increased airway pressure, and 2-4 Hypotension.',
        'Resuscitation Council UK. Special circumstances guidelines. October 27, 2025: tension pneumothorax.',
        'European Resuscitation Council Guidelines 2025: Special Circumstances in Resuscitation. Resuscitation. 2025;215(Suppl 1):110753.',
      ],
    },
    limitations: [
      'pneumothorax-response-is-a-teaching-trajectory',
      'no-airway-pressure-or-compliance-model',
      'no-procedure-or-equipment-selection',
      'no-team-or-communication',
    ],
  },
  patient: {
    ageYears: 63, sex: 'female', heightCm: 165, weightKg: 70, asaClass: 3,
    diagnosis: 'Colon cancer after left subclavian central-line placement', procedure: 'Open right hemicolectomy',
    comorbidities: ['Controlled hypertension'], medications: ['Amlodipine'],
    allergies: ['None known'], fasting: '8 hours solids, 2 hours clear liquids',
    baseline: {
      heartRateBpm: 76, meanArterialMmHg: 90, strokeVolumeMl: 68,
      hemoglobinGPerDl: 12.1, bloodVolumeMl: 4550, coreTemperatureC: 36.7,
      arterialStiffness: 1.15, baroreflexGain: 0.85, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Tracheal tube secured; bilateral ventilation was equal after intubation',
    },
    respiratory: { profile: 'healthy' },
  },
  equipment: {
    monitoring: ['ecg', 'arterial-line', 'capnography', 'pulse-oximetry'],
    airwayDevice: 'tracheal-tube',
    ventilator: {
      mode: 'volume-control', fio2: 0.4, tidalVolumeMl: 450,
      respiratoryRateBpm: 12, freshGasFlowLPerMin: 2, sevofluranePercent: 2,
      delivering: true,
    },
  },
  formulary: [],
  timeline: [
    {
      id: 'briefing', type: 'narrative', atTick: 0, severity: 'advisory',
      message: 'A stable, intubated adult is receiving volume-controlled positive-pressure ventilation after left subclavian central-line placement. The simulator does not diagnose pneumothorax, model airway pressure or lung compliance, teach decompression technique, choose equipment or anatomic site, or represent imaging and team performance. Respond to the observable change.',
    },
    {
      id: 'left-tension-physiology', type: 'tension-pneumothorax', target: 'left-pleural-space',
      value: 0.9, atTick: 600, severity: 'critical',
      message: 'The airway-pressure alarm rises abruptly. Delivered breaths continue, while oxygen saturation, end-tidal carbon dioxide, and arterial pressure begin to fall.',
    },
    {
      id: 'reassess-after-response', type: 'narrative', atTick: 1800, severity: 'advisory',
      message: 'Reassess oxygenation, carbon dioxide, and circulation after the initial response. The monitor pattern is a bounded teaching trajectory, not a diagnosis or patient prediction.',
    },
  ],
  debrief: { rubric: [
    {
      id: 'pneumothorax-assessment', objectiveId: 'assess-pneumothorax-pattern',
      question: 'When did you check bilateral ventilation, and what findings were returned?',
    },
    {
      id: 'pneumothorax-escalation', objectiveId: 'escalate-pneumothorax-pattern',
      question: 'How quickly did you escalate the combined breathing and circulation change?',
    },
    {
      id: 'pneumothorax-oxygen', objectiveId: 'support-pneumothorax-oxygenation',
      question: 'Which inspired oxygen and breath-delivery settings were accepted?',
    },
    {
      id: 'pneumothorax-decompression', objectiveId: 'decompress-pneumothorax',
      question: 'When was decompression intent accepted, and which procedural details remain outside the model?',
    },
    {
      id: 'pneumothorax-reassessment', objectiveId: 'reassess-pneumothorax-recovery',
      question: 'How did oxygen saturation and pressure change after accepted decompression intent?',
    },
  ] },
};
