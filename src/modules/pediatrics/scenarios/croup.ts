/** Calm upper-airway support and serial reassessment in authored pediatric croup. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const CROUP: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'croup', version: '0.1.0', maturity: 'preview',
    title: 'Croup with stridor at rest', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 8, difficulty: 'introductory', objectives: [
      {
        id: 'reconcile-croup-whole-child-upper-airway-pattern',
        statement: 'Reconcile the supplied prodrome, bark, hoarseness, stridor at calm rest, work of breathing, mentation, perfusion, and pulse-coherent oxygenation as one upper-airway pattern.',
        measure: 'The whole-child pattern was accepted without learner examination, diagnosis, testing, or reassurance from preserved oxygenation alone.',
      },
      {
        id: 'review-croup-severity-and-alternative-red-flags',
        statement: 'Review whole-child severity and the supplied guards for dangerous upper-airway and adjacent alternatives.',
        measure: 'Behavior, work, stridor at rest, color, and open red flags were reviewed without relying on loudness or one score.',
      },
      {
        id: 'record-croup-minimal-distress-support-and-qualified-treatment-intent',
        statement: 'Keep the child calm with her caregiver and record experienced pediatric and airway support plus qualified-team corticosteroid and nebulized epinephrine intent.',
        measure: 'Minimal-distress support and standard qualified care were recorded without learner drug, dose, route, device, setting, procedure, or treatment delivery.',
      },
      {
        id: 'review-croup-early-response',
        statement: 'After elapsed time, review the fixed early whole-child response without treating improvement as cure or discharge readiness.',
        measure: 'Stridor, work, behavior, voice, breathing, and oxygenation were reviewed together after elapsed support.',
      },
      {
        id: 'review-croup-recurrence-and-preserve-airway-readiness',
        statement: 'Review the strictly later recurrence of stridor at rest and renew pediatric and airway-capable ownership.',
        measure: 'Recurrence was recognized as active upper-airway risk without automatic redosing, airway intervention, or disposition.',
      },
      {
        id: 'handoff-croup-active-upper-airway-risk',
        statement: 'Hand off the trajectory, time since reported care, recurrence, open mimics, deterioration triggers, monitoring, and named owners.',
        measure: 'The handoff preserved active risk without declaring durable recovery, disposition, prognosis, or outcome.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Canadian Paediatric Society, Acute Care Committee. Acute management of croup in the emergency department. Updated 2026 Mar 6.',
        'Royal Children’s Hospital Melbourne. Clinical Practice Guidelines: Croup (Laryngotracheobronchitis). Updated 2024 Sep.',
        'Aregbesola A, et al. Glucocorticoids for croup in children. Cochrane Database Syst Rev. 2023;1:CD001955. doi:10.1002/14651858.CD001955.pub5.',
      ],
    },
    limitations: [
      'croup-presentation-severity-treatment-intent-and-serial-response-are-authored',
      'croup-controls-reconcile-prioritize-reassess-escalate-and-handoff-only',
      'no-live-croup-exam-test-drug-dose-route-device-airway-procedure-treatment-or-disposition',
    ],
  },
  patient: {
    ageYears: 3, sex: 'female', heightCm: 96, weightKg: 15, asaClass: 2,
    diagnosis: 'Authored croup pattern with stridor at rest',
    procedure: 'whole-child severity review, minimal-distress support, serial reassessment, and escalation',
    comorbidities: ['Previously well', 'Immunizations current'], medications: [],
    allergies: ['No known drug allergies'], fasting: 'Not assessed in this lab',
    baseline: {
      heartRateBpm: 132, meanArterialMmHg: 71, strokeVolumeMl: 30,
      hemoglobinGPerDl: 12, bloodVolumeMl: 1_200, coreTemperatureC: 37.8,
      arterialStiffness: 0.7, baroreflexGain: 1.2, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Alert and frightened but consolable with her caregiver; bark, hoarseness, inspiratory stridor at calm rest, and moderate recession are supplied',
    },
    respiratory: { profile: 'healthy-child' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 105, respiratoryRateBpm: 34,
      freshGasFlowLPerMin: 0.5, delivering: false,
    },
  },
  formulary: [],
  timeline: [
    {
      id: 'croup-presentation', type: 'narrative', target: 'croup-reassessment',
      atTick: 0, severity: 'critical',
      message: 'A previously well 3-year-old girl weighing 15 kg has 2 days of coryza and low fever, then 2 hours of worsening nighttime barking cough, hoarse voice, and noisy inspiration. Held in her caregiver\'s position of comfort, she is alert, frightened, and consolable. Fixed qualified reports describe inspiratory stridor clearly audible at calm rest, moderate tracheal tug with intercostal and subcostal recession, and equal air entry. HR is 132/min, RR 34/min, BP 96/58 mmHg, temperature 37.8 C, and room-air SpO2 96% with a clean pulse-coherent pleth. She has normal color, warm strong pulses, and capillary refill of 2 seconds. Preserved oxygenation does not make the upper-airway risk mild; hypoxemia can be late. These are supplied findings, not learner examination or measurement.',
    },
    {
      id: 'croup-alternative-guards', type: 'narrative', target: 'croup-reassessment',
      atTick: 0, severity: 'warning',
      message: 'No drooling, dysphagia, tripod posture, high fever, toxic appearance, abrupt choking, possible ingestion, wheeze, focal asymmetry, urticaria, facial swelling, vomiting, hypotension, trauma, recurrent course, airway anomaly, or prior intubation is reported. Those fixed absences help distinguish this branch but do not permanently exclude foreign body, anaphylaxis, epiglottitis, bacterial tracheitis, deep-neck infection, or another cause if the trajectory changes or response is poor.',
    },
    {
      id: 'croup-boundary', type: 'narrative', target: 'croup-reassessment-boundary',
      atTick: 0, severity: 'warning',
      message: 'Keep the child calm with her caregiver, reconcile whole-child severity, activate experienced pediatric and airway-capable support, record qualified-team treatment intent, and review strictly elapsed reports. The controls do not examine the mouth or throat; score, diagnose, test, image, swab, or identify a pathogen; choose or deliver a drug, dose, route, concentration, repeat interval, oxygen target, flow, interface, nebulizer, airway maneuver, ventilation, intubation, procedure, or treatment; determine discharge or admission; or predict recovery or outcome.',
    },
  ],
  debrief: { rubric: [
    { id: 'croup-pattern', objectiveId: 'reconcile-croup-whole-child-upper-airway-pattern', question: 'Which supplied trajectory, bark, voice, stridor, work, behavior, perfusion, and oxygenation findings established the upper-airway pattern?' },
    { id: 'croup-severity', objectiveId: 'review-croup-severity-and-alternative-red-flags', question: 'Why did preserved SpO2 and stridor loudness not settle severity, and which alternative red flags stayed open?' },
    { id: 'croup-support', objectiveId: 'record-croup-minimal-distress-support-and-qualified-treatment-intent', question: 'How did caregiver-centered minimal-distress care and qualified treatment ownership avoid learner treatment or equipment operation?' },
    { id: 'croup-early', objectiveId: 'review-croup-early-response', question: 'What improved in the fixed early report, and why was that not durable recovery or discharge readiness?' },
    { id: 'croup-recurrence', objectiveId: 'review-croup-recurrence-and-preserve-airway-readiness', question: 'What did recurrent stridor at rest establish, and which treatment and airway decisions remained with the qualified team?' },
    { id: 'croup-handoff', objectiveId: 'handoff-croup-active-upper-airway-risk', question: 'Which timing, recurrence, mimic, deterioration, monitoring, and ownership details remained active at handoff?' },
  ] },
};
