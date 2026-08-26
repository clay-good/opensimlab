/** Whole-child reassessment of undifferentiated pediatric respiratory distress. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const PEDIATRIC_RESPIRATORY_DISTRESS: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'pediatric-respiratory-distress', version: '0.1.0', maturity: 'draft',
    title: 'Pediatric respiratory distress', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 8, difficulty: 'introductory', objectives: [
      {
        id: 'reconcile-pediatric-respiratory-distress-whole-child',
        statement: 'Reconcile appearance, work of breathing, speech, circulation, and pulse-coherent oxygenation as one whole-child respiratory-distress pattern.',
        measure: 'The fixed appearance, breathing, circulation, and monitor reports were integrated without diagnosing a cause or relying on one number.',
      },
      {
        id: 'activate-pediatric-respiratory-distress-support',
        statement: 'Activate experienced pediatric help, qualified oxygenation, continuous monitoring, and rescue readiness before a complete cause review.',
        measure: 'Immediate support did not wait for imaging, a full history, a disease label, or further deterioration.',
      },
      {
        id: 'review-pediatric-respiratory-distress-early-response',
        statement: 'After elapsed time, review the whole child when oxygen saturation improves but respiratory distress persists.',
        measure: 'The improved saturation was weighed beside persistent grunting, recession, short phrases, and tachypnea rather than treated as recovery.',
      },
      {
        id: 'review-pediatric-respiratory-distress-later-panel',
        statement: 'Recognize evolving inadequate breathing when respiratory rate and visible recession fall as mentation, effort, air movement, and oxygenation worsen.',
        measure: 'The lower rate and quieter chest were identified as fatigue in the authored trajectory, not improvement.',
      },
      {
        id: 'activate-pediatric-respiratory-failure-rescue',
        statement: 'Activate immediate airway-capable pediatric rescue for worsening mentation and inadequate breathing with a pulse.',
        measure: 'Rescue ownership followed the later whole-child report without waiting for apnea, bradycardia, a diagnosis, or another number.',
      },
      {
        id: 'handoff-pediatric-respiratory-distress-reassessment',
        statement: 'Hand off active respiratory support, the trajectory, unresolved causes, deterioration triggers, and named ownership.',
        measure: 'The handoff preserved active risk without claiming diagnosis, treatment success, disposition, prognosis, or outcome.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'American Heart Association and American Academy of Pediatrics. Part 6: Pediatric Basic Life Support: 2025 American Heart Association Guidelines for Cardiopulmonary Resuscitation and Emergency Cardiovascular Care. Pediatrics. 2026;157:e2025074350.',
        'World Health Organization. Paediatric emergency triage, assessment and treatment: care of critically-ill children. Updated guideline. 2016. ISBN 978-92-4-151021-9.',
        'Emeriaud G, et al. Executive Summary of the Second International Guidelines for the Diagnosis and Management of Pediatric Acute Respiratory Distress Syndrome (PALICC-2). Pediatr Crit Care Med. 2023;24:143-168. PMID 36661420.',
      ],
    },
    limitations: [
      'pediatric-respiratory-distress-presentation-support-and-trajectory-are-authored',
      'pediatric-respiratory-distress-controls-review-escalate-reassess-and-handoff-only',
      'no-live-pediatric-diagnosis-device-dose-procedure-treatment-disposition-or-outcome',
    ],
  },
  patient: {
    ageYears: 6, sex: 'female', heightCm: 115, weightKg: 20, asaClass: 3,
    diagnosis: 'Authored undifferentiated pediatric respiratory distress with later fatigue',
    procedure: 'whole-child respiratory-distress recognition, serial reassessment, and escalation',
    comorbidities: ['Previously well'], medications: [], allergies: ['No known drug allergies'],
    fasting: 'Not established during acute care',
    baseline: {
      heartRateBpm: 138, meanArterialMmHg: 79, strokeVolumeMl: 35,
      hemoglobinGPerDl: 12.5, bloodVolumeMl: 1_600, coreTemperatureC: 37.7,
      arterialStiffness: 0.75, baroreflexGain: 1.15, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Awake and anxious with short-phrase speech, grunting, nasal flaring, and marked intercostal and subcostal recession',
    },
    respiratory: { profile: 'healthy-child' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 120, respiratoryRateBpm: 40,
      freshGasFlowLPerMin: 0.5, delivering: false,
    },
  },
  formulary: [],
  timeline: [
    {
      id: 'pediatric-respiratory-distress-presentation', type: 'narrative',
      target: 'pediatric-respiratory-distress-reassessment', atTick: 0, severity: 'critical',
      message: 'A previously well 6-year-old girl weighing 20 kg has 18 hours of cough and increasing breathing effort. Fixed qualified reports describe her awake and anxious, upright, speaking in short phrases, with nasal flaring, grunting, marked intercostal and subcostal recession, and equally reduced bilateral air entry. HR is 138/min, RR 46/min, BP 104/66 mmHg, temperature 37.7 C, and room-air SpO2 87% with a clean pulse-coherent pleth. Extremities are warm, pulses are strong, and capillary refill is 2 seconds. She has spontaneous breathing and a pulse. These are supplied findings, not learner examination or measurement.',
    },
    {
      id: 'pediatric-respiratory-distress-open-causes', type: 'narrative',
      target: 'pediatric-respiratory-distress-reassessment', atTick: 0, severity: 'warning',
      message: 'Fixed current reports do not show abrupt choking, bark or hoarseness, stridor, drooling, wheeze or prolonged expiration, urticaria or facial swelling, focal unilateral air-entry loss, trauma, sedative exposure, chronic cardiopulmonary disease, or prior asthma. Infection, upper or lower airway disease, aspiration, anaphylaxis, metabolic drive, and other causes remain open; absent snapshots do not permanently exclude them. No etiologic diagnosis, test acquisition, or test interpretation occurs in this lab.',
    },
    {
      id: 'pediatric-respiratory-distress-boundary', type: 'narrative',
      target: 'pediatric-respiratory-distress-reassessment-boundary', atTick: 0, severity: 'warning',
      message: 'Reconcile the whole-child respiratory-distress pattern, activate experienced pediatric help with qualified oxygenation, continuous monitoring, and rescue readiness, then review strictly elapsed early and later whole-child reports. The controls do not examine, diagnose, order or interpret tests, select or deliver an oxygen device, flow, fraction, target, drug, dose, fluid, ventilation, airway maneuver, procedure, or treatment, calculate a score, decide disposition or prognosis, or predict recovery or outcome.',
    },
  ],
  debrief: { rubric: [
    { id: 'pediatric-distress-whole-child', objectiveId: 'reconcile-pediatric-respiratory-distress-whole-child', question: 'Which appearance, breathing, circulation, and monitor findings established respiratory distress without naming a cause?' },
    { id: 'pediatric-distress-support', objectiveId: 'activate-pediatric-respiratory-distress-support', question: 'Why did experienced help and qualified support precede a complete cause review?' },
    { id: 'pediatric-distress-early-response', objectiveId: 'review-pediatric-respiratory-distress-early-response', question: 'Why did the early saturation improvement not establish whole-child recovery?' },
    { id: 'pediatric-distress-later-panel', objectiveId: 'review-pediatric-respiratory-distress-later-panel', question: 'Which later findings made the falling respiratory rate and quieter effort concerning?' },
    { id: 'pediatric-distress-rescue', objectiveId: 'activate-pediatric-respiratory-failure-rescue', question: 'Why was airway-capable pediatric rescue activated while a pulse remained present?' },
    { id: 'pediatric-distress-handoff', objectiveId: 'handoff-pediatric-respiratory-distress-reassessment', question: 'Which active support, cause, deterioration, and ownership work remained unresolved?' },
  ] },
};
