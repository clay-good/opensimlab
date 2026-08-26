/** Pediatric severe-asthma nonresponse, escalation, and serial reassessment. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const PEDIATRIC_STATUS_ASTHMATICUS: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'pediatric-status-asthmaticus', version: '0.1.0', maturity: 'preview',
    title: 'Pediatric status asthmaticus after initial care', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 8, difficulty: 'intermediate', objectives: [
      {
        id: 'reconcile-pediatric-status-asthmaticus-treatment-and-trajectory',
        statement: 'Reconcile the established asthma history, risk, verified first-hour care, and current whole-child trajectory.',
        measure: 'Prior care and current response were separated without learner examination, peak-flow testing, scoring, diagnosis, or treatment delivery.',
      },
      {
        id: 'recognize-pediatric-status-asthmaticus-severe-nonresponse',
        statement: 'Recognize persistent severe lower-airway obstruction after the verified initial-care bundle.',
        measure: 'Speech, work, air entry, oxygenation, mentation, circulation, and trajectory outweighed wheeze loudness or one number.',
      },
      {
        id: 'activate-pediatric-status-asthmaticus-critical-care-escalation',
        statement: 'Activate immediate pediatric critical-care and airway-capable ownership with continuous reassessment.',
        measure: 'Escalation did not wait for a complete trigger review, another learner treatment cycle, or respiratory failure.',
      },
      {
        id: 'record-pediatric-status-asthmaticus-qualified-second-line-care-intent',
        statement: 'Record experienced-team ownership of the supplied second-line care plan and qualified monitoring.',
        measure: 'Team ownership and monitoring were recorded without learner drug selection, dose, route, access, dilution, infusion, pump, or delivery.',
      },
      {
        id: 'review-pediatric-status-asthmaticus-later-response',
        statement: 'After elapsed time, review the fixed whole-child partial response without declaring durable recovery.',
        measure: 'Improved speech, effort, air entry, breathing, and oxygenation were weighed beside residual obstruction and oxygen need.',
      },
      {
        id: 'handoff-pediatric-status-asthmaticus-reassessment',
        statement: 'Hand off active obstruction, oxygen need, reported medication exposure, toxicity surveillance, failure triggers, open causes, and named owners.',
        measure: 'The handoff preserved active acute and long-term asthma work without claiming disposition, prognosis, or outcome.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'World Health Organization. WHO consolidated guidelines for the management of common childhood illness: management of asthma in children and adolescents and bronchiolitis in infants and young children. 2026. ISBN 978-92-4-012268-0.',
        'Global Initiative for Asthma. Global Strategy for Asthma Management and Prevention. 2026 update.',
        'Canadian Paediatric Society, Acute Care Committee. Managing an acute asthma exacerbation in children. 2021.',
      ],
    },
    limitations: [
      'pediatric-status-asthmaticus-history-care-nonresponse-and-partial-response-are-authored',
      'pediatric-status-asthmaticus-controls-reconcile-escalate-record-reassess-and-handoff-only',
      'no-live-pediatric-asthma-exam-score-test-drug-dose-device-airway-treatment-or-disposition',
    ],
  },
  patient: {
    ageYears: 10, sex: 'female', heightCm: 138, weightKg: 32, asaClass: 3,
    diagnosis: 'Authored established asthma with severe persistent obstruction after verified initial care',
    procedure: 'first-hour treatment reconciliation, severe-nonresponse escalation, and serial reassessment',
    comorbidities: ['Asthma with one prior PICU admission and no prior intubation'],
    medications: ['Prescribed controller and reliever therapy; access and adherence remain open'],
    allergies: ['No known drug allergies'], fasting: 'Not established during acute care',
    baseline: {
      heartRateBpm: 154, meanArterialMmHg: 80, strokeVolumeMl: 45,
      hemoglobinGPerDl: 12.8, bloodVolumeMl: 2_560, coreTemperatureC: 37.2,
      arterialStiffness: 0.8, baroreflexGain: 1.05, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Alert and anxious with one-word speech, marked recession, persistently poor equal bilateral air entry, and diffuse expiratory wheeze',
    },
    respiratory: { profile: 'healthy-child' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: {
      mode: 'manual', fio2: 0.35, tidalVolumeMl: 190, respiratoryRateBpm: 40,
      freshGasFlowLPerMin: 0.5, delivering: false,
    },
  },
  formulary: [],
  timeline: [
    {
      id: 'pediatric-status-asthmaticus-presentation', type: 'narrative',
      target: 'pediatric-status-asthmaticus-reassessment', atTick: 0, severity: 'critical',
      message: 'A 10-year-old girl weighing 32 kg has established asthma, one prior PICU admission without intubation, and a recorded personal-best peak expiratory flow of 330 L/min. After 2 days of coryza and cough, her breathing worsened despite following the reliever portion of her action plan. At arrival she was alert and anxious, upright, and speaking one or two words at a time, with marked suprasternal and intercostal recession, markedly reduced equal bilateral air entry, and diffuse expiratory wheeze. HR was 142/min, RR 38/min, BP 112/70 mmHg, and persistent room-air SpO2 89% with a clean pulse-coherent pleth. A qualified-team PEF report was 105 L/min, 32% of her personal best; this is an authored child-specific severity fact, not a universal threshold or learner maneuver.',
    },
    {
      id: 'pediatric-status-asthmaticus-care-and-current-state', type: 'narrative',
      target: 'pediatric-status-asthmaticus-reassessment', atTick: 0, severity: 'critical',
      message: 'The verified delivered-care record states that monitored oxygen support, 3 clinician-delivered inhaled short-acting bronchodilator plus antimuscarinic cycles, and an early systemic corticosteroid were completed during the first hour. At minute 60 she remains alert and anxious with one-word speech, marked recession, persistently poor equal bilateral air entry, diffuse wheeze, HR 154/min, RR 40/min, BP 108/66 mmHg, and SpO2 93% on authored oxygen support. PEF is not repeated because she cannot perform it comfortably and reliably. She is not drowsy or confused; no quiet chest, weakening effort, apnea, shock, or pulse loss is reported. This is supplied persistent severe nonresponse, not learner diagnosis or treatment.',
    },
    {
      id: 'pediatric-status-asthmaticus-alternative-guards', type: 'narrative',
      target: 'pediatric-status-asthmaticus-reassessment', atTick: 0, severity: 'warning',
      message: 'No abrupt choking, focal unilateral loss of air entry, bark, hoarseness, stridor, drooling, urticaria, angioedema, vomiting, hypotension, fever, toxic appearance, trauma, or sedative exposure is reported. These snapshots narrow but do not permanently exclude foreign body, anaphylaxis, upper-airway disease, infection, pneumothorax, mucus plugging, dysfunctional breathing, treatment toxicity, or another cause. If systemic allergic features emerge or uncertainty remains, qualified emergency anaphylaxis care must not be delayed. Controller access, adherence, triggers, and barriers remain patient-centered questions without blame.',
    },
    {
      id: 'pediatric-status-asthmaticus-boundary', type: 'narrative',
      target: 'pediatric-status-asthmaticus-reassessment-boundary', atTick: 0, severity: 'warning',
      message: 'Reconcile the verified first-hour care and whole-child trajectory, recognize severe nonresponse, activate pediatric critical-care and airway-capable ownership, and record experienced-team ownership and monitoring for the supplied second-line plan before a strictly later reassessment and handoff. The controls do not examine, diagnose, score, measure PEF or spirometry, acquire or interpret a gas, laboratory test, or image, choose or deliver oxygen, an inhaler, spacer, nebulizer, drug, dose, concentration, route, interval, intravenous access, fluid, infusion, device, setting, ventilation, airway maneuver, intubation, sedation, paralysis, procedure, or treatment, determine disposition or prognosis, or predict outcome.',
    },
  ],
  debrief: { rubric: [
    { id: 'pediatric-status-asthmaticus-trajectory', objectiveId: 'reconcile-pediatric-status-asthmaticus-treatment-and-trajectory', question: 'Which asthma-risk, arrival, verified-care, and minute-60 findings established the trajectory?' },
    { id: 'pediatric-status-asthmaticus-nonresponse', objectiveId: 'recognize-pediatric-status-asthmaticus-severe-nonresponse', question: 'Why did persistent speech, work, air-entry, oxygenation, and trajectory findings establish severe nonresponse without one universal threshold?' },
    { id: 'pediatric-status-asthmaticus-escalation', objectiveId: 'activate-pediatric-status-asthmaticus-critical-care-escalation', question: 'Why did pediatric critical-care and airway-capable ownership precede complete trigger review or respiratory failure?' },
    { id: 'pediatric-status-asthmaticus-second-line', objectiveId: 'record-pediatric-status-asthmaticus-qualified-second-line-care-intent', question: 'How did recording experienced-team ownership and monitoring avoid learner drug, dose, route, access, infusion, and treatment delivery?' },
    { id: 'pediatric-status-asthmaticus-later', objectiveId: 'review-pediatric-status-asthmaticus-later-response', question: 'What improved in the fixed later report, and which severe-asthma risks remained active?' },
    { id: 'pediatric-status-asthmaticus-handoff', objectiveId: 'handoff-pediatric-status-asthmaticus-reassessment', question: 'Which obstruction, oxygen, medication-exposure, toxicity, failure-trigger, cause, access, and ownership work remained unresolved?' },
  ] },
};
