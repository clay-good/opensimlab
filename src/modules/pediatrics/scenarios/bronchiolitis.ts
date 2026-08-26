/** Supportive-care prioritization and serial reassessment in authored infant bronchiolitis. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const BRONCHIOLITIS: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'bronchiolitis', version: '0.1.0', maturity: 'preview',
    title: 'Bronchiolitis', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 8, difficulty: 'introductory', objectives: [
      {
        id: 'reconcile-bronchiolitis-risk-and-trajectory',
        statement: 'Reconcile young age, illness day, the supplied first-wheeze history, work of breathing, feeding, hydration, circulation, and pulse-coherent oxygenation as one severity trajectory.',
        measure: 'The whole-infant pattern and fixed working diagnosis were accepted without learner examination, viral attribution, or reliance on one value.',
      },
      {
        id: 'recognize-bronchiolitis-supportive-care-pattern',
        statement: 'Recognize the supplied clinical bronchiolitis pattern and need for hospital support without routine imaging, etiologic testing, or low-value medicines.',
        measure: 'The clinical pattern and support need followed whole-infant review without learner examination, etiologic certainty, or disposition choice.',
      },
      {
        id: 'activate-bronchiolitis-oxygenation-and-monitoring',
        statement: 'Activate experienced-team standard oxygenation and monitoring without selecting a device, flow, fraction, or target.',
        measure: 'Qualified oxygenation and monitoring followed the fixed support need without learner treatment or equipment operation.',
      },
      {
        id: 'review-bronchiolitis-feeding-and-hydration',
        statement: 'After elapsed time, review feeding and hydration risk when oxygen saturation improves but respiratory effort and safe oral intake do not.',
        measure: 'The improved saturation was weighed beside persistent recession, tachypnea, fatigue, and inadequate oral intake.',
      },
      {
        id: 'review-bronchiolitis-later-response',
        statement: 'Review a strictly later fixed panel for mentation, breathing, circulation, oxygenation, and hydration trajectory.',
        measure: 'The later report was treated as an active-risk snapshot rather than proof of treatment success, deterioration, or disposition.',
      },
      {
        id: 'handoff-bronchiolitis-active-risk',
        statement: 'Hand off the authored trajectory, current support, feeding and hydration risk, apnea and fatigue triggers, and named ownership.',
        measure: 'The handoff preserved unresolved respiratory and hydration risk without claiming cure, admission, discharge, prognosis, or outcome.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'World Health Organization. WHO consolidated guidelines for the management of common childhood illness: management of asthma in children and adolescents and bronchiolitis in infants and young children. 2026. ISBN 978-92-4-012268-0.',
        'National Institute for Health and Care Excellence. Bronchiolitis in children: diagnosis and management. NICE guideline NG9. Updated 2021; minor update 2025.',
        'Ralston SL, et al. Clinical Practice Guideline: The Diagnosis, Management, and Prevention of Bronchiolitis. Pediatrics. 2014;134:e1474-e1502. doi:10.1542/peds.2014-2742.',
      ],
    },
    limitations: [
      'bronchiolitis-infant-presentation-working-diagnosis-support-and-trajectory-are-authored',
      'bronchiolitis-controls-prioritize-reassess-escalate-and-handoff-only',
      'no-live-bronchiolitis-exam-test-device-fluid-route-medicine-treatment-or-disposition',
    ],
  },
  patient: {
    ageYears: 1, sex: 'male', heightCm: 75, weightKg: 10, asaClass: 3,
    diagnosis: 'Authored clinical bronchiolitis with respiratory and hydration risk',
    procedure: 'whole-infant severity review, supportive-care prioritization, serial reassessment, and escalation',
    comorbidities: ['Born at term', 'No chronic cardiopulmonary disease'],
    medications: [], allergies: ['No known drug allergies'], fasting: 'Oral intake about 40% of usual',
    baseline: {
      heartRateBpm: 156, meanArterialMmHg: 67, strokeVolumeMl: 20,
      hemoglobinGPerDl: 11.5, bloodVolumeMl: 800, coreTemperatureC: 38,
      arterialStiffness: 0.6, baroreflexGain: 1.2, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.15, difficultMaskVentilation: false,
      assessment: 'Awake and interactive, with nasal congestion and moderate subcostal recession',
    },
    respiratory: { profile: 'healthy-child' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 70, respiratoryRateBpm: 40,
      freshGasFlowLPerMin: 0.5, delivering: false,
    },
  },
  formulary: [],
  timeline: [
    {
      id: 'bronchiolitis-presentation', type: 'narrative', target: 'bronchiolitis-reassessment',
      atTick: 0, severity: 'critical',
      message: 'A previously well term 12-month-old boy weighing 10 kg is on day 4 of his first coryzal illness, with persistent cough and noisy breathing. Fixed qualified reports describe him awake and interactive, with nasal congestion, diffuse crackles and wheeze, moderate subcostal recession, and equal bilateral air entry. HR is 156/min, RR 58/min, BP 92/54 mmHg, temperature 38.0 C, and persistent room-air SpO2 88% with a clean pulse-coherent pleth. Extremities are warm, pulses are strong, and capillary refill is 2 seconds. No apnea, grunting, exhaustion, or cyanosis is reported. These are supplied findings, not learner examination or measurement.',
    },
    {
      id: 'bronchiolitis-feeding-risk', type: 'narrative', target: 'bronchiolitis-reassessment',
      atTick: 0, severity: 'warning',
      message: 'His caregiver reports intake near 40% of usual over 24 hours and 2 wet diapers, with coughing and fatigue interrupting feeds. A qualified team has supplied the working diagnosis of bronchiolitis from the history and examination. No focal asymmetry, abrupt choking, bark, stridor, drooling, urticaria, facial swelling, prior wheeze, prematurity, chronic cardiopulmonary disease, or immunodeficiency is reported. Those fixed absences do not permanently exclude another diagnosis or bacterial coinfection.',
    },
    {
      id: 'bronchiolitis-boundary', type: 'narrative', target: 'bronchiolitis-reassessment-boundary',
      atTick: 0, severity: 'warning',
      message: 'Reconcile the supplied whole-infant severity pattern, prioritize experienced supportive-care and hydration ownership, and review strictly elapsed whole-infant reports. The controls do not examine; make or confirm a diagnosis; identify a virus; acquire or interpret radiography, blood, urine, or viral tests; choose or deliver oxygen, suction, feeding, a fluid route or volume, a bronchodilator, steroid, antibiotic, nebulized therapy, ventilation, an airway maneuver, procedure, or treatment; determine admission or discharge; or predict recovery or outcome.',
    },
  ],
  debrief: { rubric: [
    { id: 'bronchiolitis-whole-infant', objectiveId: 'reconcile-bronchiolitis-risk-and-trajectory', question: 'Which supplied age, illness-day, breathing, feeding, hydration, circulation, and monitor findings established the whole-infant severity trajectory?' },
    { id: 'bronchiolitis-pattern', objectiveId: 'recognize-bronchiolitis-supportive-care-pattern', question: 'Why was this treated as a supplied clinical bronchiolitis pattern without routine tests or etiologic certainty?' },
    { id: 'bronchiolitis-oxygenation', objectiveId: 'activate-bronchiolitis-oxygenation-and-monitoring', question: 'Why did experienced-team oxygenation and monitoring follow immediately without learner device or target selection?' },
    { id: 'bronchiolitis-feeding', objectiveId: 'review-bronchiolitis-feeding-and-hydration', question: 'Why did an improved saturation not make feeding or breathing safe?' },
    { id: 'bronchiolitis-later', objectiveId: 'review-bronchiolitis-later-response', question: 'What did the later fixed report establish, and what did it leave unresolved?' },
    { id: 'bronchiolitis-handoff', objectiveId: 'handoff-bronchiolitis-active-risk', question: 'Which respiratory, feeding, hydration, apnea, fatigue, and ownership risks remained active at handoff?' },
  ] },
};
