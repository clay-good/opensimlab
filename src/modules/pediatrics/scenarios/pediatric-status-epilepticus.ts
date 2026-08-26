/** Pediatric convulsive-status escalation after supplied appropriate first-line care. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const PEDIATRIC_STATUS_EPILEPTICUS: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'pediatric-status-epilepticus', version: '0.1.0', maturity: 'preview',
    title: 'Pediatric status epilepticus after first-line care', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 8, difficulty: 'intermediate', objectives: [
      {
        id: 'reconcile-pediatric-status-epilepticus-clock-care-and-whole-child',
        statement: 'Connect the seizure clock, supplied first-line care, breathing, circulation, glucose, and whole-child state.',
        measure: 'The authored trajectory was reconciled without learner seizure timing, examination, monitoring, glucose acquisition, treatment verification, or delivery.',
      },
      {
        id: 'recognize-pediatric-convulsive-status-after-first-line-care',
        statement: 'Recognize persistent pediatric convulsive status after 2 supplied appropriate first-line doses.',
        measure: 'Ongoing bilateral generalized convulsions and absent recovery triggered escalation without learner diagnosis, prescribing, or dose adjudication.',
      },
      {
        id: 'activate-pediatric-status-epilepticus-qualified-second-line-ownership',
        statement: 'Activate qualified second-line seizure-control and pediatric escalation ownership without delay.',
        measure: 'Qualified escalation followed recognition without learner drug, dose, route, access, infusion, airway, or treatment selection or delivery.',
      },
      {
        id: 'review-pediatric-status-epilepticus-airway-causes-and-refractory-boundary',
        statement: 'Keep airway safety, reversible and dangerous causes, monitoring, and the refractory boundary active in parallel.',
        measure: 'Open safety and cause work continued without delaying escalation or claiming learner examination, testing, EEG, airway care, diagnosis, or treatment.',
      },
      {
        id: 'review-pediatric-status-epilepticus-later-response',
        statement: 'After elapsed qualified care, compare the fixed visible-seizure and whole-child trajectory without declaring seizure control.',
        measure: 'Visible convulsion cessation was separated from causal treatment effect, electrographic control, durable recovery, recurrence exclusion, or outcome.',
      },
      {
        id: 'handoff-pediatric-status-epilepticus-active-risk',
        statement: 'Hand off seizure, airway, recovery, cause, recurrence, refractory-risk, and named ownership.',
        measure: 'The handoff preserved active risk without claiming diagnosis, disposition, prognosis, durable control, or outcome.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Royal Children\'s Hospital Melbourne. Clinical Practice Guideline: Seizures - acute management. Last updated June 2025; consulted 2026-08-26.',
        'National Institute for Health and Care Excellence. Epilepsies in children, young people and adults. NICE guideline NG217. Published 2022; last updated 2025. Recommendations 7.1.1-7.1.12.',
        'Glauser T, Shinnar S, Gloss D, et al. Evidence-Based Guideline: Treatment of Convulsive Status Epilepticus in Children and Adults. Epilepsy Curr. 2016;16(1):48-61. PMID:26900382. doi:10.5698/1535-7597-16.1.48.',
      ],
    },
    limitations: [
      'pediatric-status-epilepticus-presentation-care-and-response-are-authored',
      'pediatric-status-epilepticus-controls-reconcile-recognize-escalate-review-reassess-and-handoff-only',
      'no-live-pediatric-status-epilepticus-exam-test-drug-airway-treatment-or-disposition',
    ],
  },
  patient: {
    ageYears: 6, sex: 'female', heightCm: 115, weightKg: 20, asaClass: 4,
    diagnosis: 'Authored ongoing pediatric generalized convulsive status after supplied appropriate first-line care',
    procedure: 'calm pediatric convulsive status recognition after first-line care, qualified escalation, serial reassessment, and active-risk handoff',
    comorbidities: ['Previously well'], medications: ['None reported before the supplied emergency care'],
    allergies: ['No known drug allergies'], fasting: 'Not established during acute care',
    baseline: {
      heartRateBpm: 146, meanArterialMmHg: 81, strokeVolumeMl: 35,
      hemoglobinGPerDl: 12.5, bloodVolumeMl: 1_600, coreTemperatureC: 37.2,
      arterialStiffness: 0.75, baroreflexGain: 1.15, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Ongoing bilateral generalized convulsions with spontaneous chest rise and supplied qualified airway and oxygen support',
    },
    respiratory: { profile: 'healthy-child' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 120, respiratoryRateBpm: 22,
      freshGasFlowLPerMin: 0.5, delivering: false,
    },
  },
  formulary: [],
  timeline: [
    {
      id: 'pediatric-status-epilepticus-presentation', type: 'narrative',
      target: 'pediatric-status-epilepticus-reassessment', atTick: 0, severity: 'critical',
      message: 'A previously well 6-year-old girl weighs 20 kg and measures 115 cm. A first witnessed bilateral generalized convulsion has continued for 14 minutes 30 seconds without recovery. She has a pulse and spontaneous chest rise, but respiratory rate is not reliably countable during the movements and no capnography is supplied. A fixed qualified report supplies HR 146/min, BP 106/68 mmHg (MAP 81), temperature 37.2°C, clean pulse-coherent room-air SpO₂ 94%, warm extremities, normal-volume pulses, and capillary refill 2 seconds. Qualified point-of-care glucose is 108 mg/dL. Experienced airway and oxygen support is immediately available. These are supplied findings, not learner timing, examination, monitoring, testing, or treatment.',
    },
    {
      id: 'pediatric-status-epilepticus-qualified-record', type: 'narrative',
      target: 'pediatric-status-epilepticus-reassessment', atTick: 0, severity: 'critical',
      message: 'The experienced-team record verifies 2 documented appropriate weight-based first-line benzodiazepine doses at seizure minutes 5 and 10. Product, dose, concentration, route, access, preparation, and delivery details are intentionally not shown or learner-selected, verified, or administered. Bilateral generalized convulsions continue without recovery. No fever, nonblanching rash, reported trauma, known ingestion, known epilepsy, or known diabetes is authored, but witness limits, infection, structural, toxic, metabolic, medication, and other causes remain open. Qualified pediatric, neurology, nursing, pharmacy, airway-capable, critical-care, laboratory, imaging, and safeguarding teams are available for immediate second-line care, concurrent support and evaluation, and refractory escalation.',
    },
    {
      id: 'pediatric-status-epilepticus-boundary', type: 'narrative',
      target: 'pediatric-status-epilepticus-reassessment-boundary', atTick: 0,
      severity: 'critical',
      message: 'Reconcile the supplied seizure clock, 2 documented appropriate first-line doses, current convulsions, absent recovery, breathing, circulation, oxygenation, and glucose; recognize persistent pediatric convulsive status after first-line care; then activate qualified second-line ownership without waiting for parallel airway, monitoring, cause, and refractory-boundary review. Compare the strictly later fixed report before another elapsed active-risk handoff. The controls do not time or examine the seizure, acquire or interpret monitoring, glucose, laboratory, EEG, imaging, or lumbar-puncture findings, verify or select a first-line or second-line product, dose, concentration, route, access, infusion, oxygen, suction, airway device, procedure, or treatment, diagnose or treat a cause, assess team performance, determine disposition or prognosis, or predict visible, electrographic, durable, recurrent, neurological, or other outcome.',
    },
  ],
  debrief: { rubric: [
    { id: 'pediatric-status-epilepticus-trajectory', objectiveId: 'reconcile-pediatric-status-epilepticus-clock-care-and-whole-child', question: 'Which supplied clock, first-line-care, convulsion, recovery, breathing, circulation, oxygenation, and glucose facts established the trajectory?' },
    { id: 'pediatric-status-epilepticus-recognition', objectiveId: 'recognize-pediatric-convulsive-status-after-first-line-care', question: 'Why did persistent convulsions after 2 supplied appropriate first-line doses require immediate escalation?' },
    { id: 'pediatric-status-epilepticus-escalation', objectiveId: 'activate-pediatric-status-epilepticus-qualified-second-line-ownership', question: 'How was qualified second-line ownership activated without learner product, dose, route, access, infusion, or delivery?' },
    { id: 'pediatric-status-epilepticus-safety', objectiveId: 'review-pediatric-status-epilepticus-airway-causes-and-refractory-boundary', question: 'Which airway, monitoring, cause, recurrence, and refractory-risk work remained active in parallel?' },
    { id: 'pediatric-status-epilepticus-later', objectiveId: 'review-pediatric-status-epilepticus-later-response', question: 'What changed in the fixed minute-25 report, and why did visible cessation not prove seizure control or recovery?' },
    { id: 'pediatric-status-epilepticus-handoff', objectiveId: 'handoff-pediatric-status-epilepticus-active-risk', question: 'Which seizure, airway, recovery, cause, recurrence, refractory-risk, and ownership work required handoff?' },
  ] },
};
