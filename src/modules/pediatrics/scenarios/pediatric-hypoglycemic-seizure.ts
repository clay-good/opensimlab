/** Pediatric hypoglycemic seizure recognition and serial recurrence-risk reassessment. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const PEDIATRIC_HYPOGLYCEMIC_SEIZURE: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'pediatric-hypoglycemic-seizure', version: '0.1.0', maturity: 'preview',
    title: 'Pediatric hypoglycemic seizure', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 8, difficulty: 'intermediate', objectives: [
      {
        id: 'reconcile-pediatric-hypoglycemic-seizure-whole-child-and-glucose',
        statement: 'Connect the supplied convulsion, postictal state, airway safety, circulation, and glucose finding.',
        measure: 'The authored whole-child and glucose trajectory was reconciled without learner examination, testing, diagnosis, or treatment delivery.',
      },
      {
        id: 'recognize-pediatric-hypoglycemic-seizure',
        statement: 'Recognize the supplied severe hypoglycemia pattern after a stopped generalized convulsion.',
        measure: 'The supplied glucose and whole-child pattern were recognized without learner glucose acquisition, interpretation, or etiologic closure.',
      },
      {
        id: 'activate-pediatric-hypoglycemic-seizure-qualified-rescue-ownership',
        statement: 'Activate experienced pediatric hypoglycemia rescue, airway-safety, monitoring, and escalation ownership.',
        measure: 'Qualified rescue was activated without learner glucose, glucagon, route, concentration, dose, access, device, airway, or treatment selection.',
      },
      {
        id: 'review-pediatric-hypoglycemic-seizure-causes-and-recurrence-risk',
        statement: 'Review recurrent hypoglycemia, neurological change, intake, illness, exposure, metabolic, endocrine, hepatic, and other causes in parallel.',
        measure: 'Cause and recurrence work remained open without learner testing, diagnosis, prescribing, treatment, or disposition decisions.',
      },
      {
        id: 'review-pediatric-hypoglycemic-seizure-later-response',
        statement: 'After elapsed qualified care, review the fixed whole-child and glucose response without declaring durable recovery.',
        measure: 'Improvement was separated from proven treatment effect, durable euglycemia, neurological recovery, etiologic closure, and recurrence exclusion.',
      },
      {
        id: 'handoff-pediatric-hypoglycemic-seizure-active-risk',
        statement: 'Hand off neurological, airway-safety, glucose, recurrence, intake, exposure, cause, and qualified ownership work.',
        measure: 'The handoff preserved active risk without claiming durable correction, prognosis, disposition, recurrence exclusion, or outcome.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Thornton PS, Stanley CA, De Leon DD, et al. Recommendations from the Pediatric Endocrine Society for Evaluation and Management of Persistent Hypoglycemia in Neonates, Infants, and Children. Journal of Pediatrics. 2015;167(2):238-245. doi:10.1016/j.jpeds.2015.03.057.',
        'Royal Children\'s Hospital Melbourne. Clinical Practice Guideline: Hypoglycaemia. Last updated August 2025; consulted 2026-08-26.',
        'Royal Children\'s Hospital Melbourne. Clinical Practice Guideline: Seizures - acute management. Last updated June 2025; consulted 2026-08-26.',
        'Abraham MB, Karges B, Dovc K, et al. ISPAD Clinical Practice Consensus Guidelines 2022: Assessment and management of hypoglycemia in children and adolescents with diabetes. Pediatric Diabetes. 2022;23(8):1322-1340. doi:10.1111/pedi.13443.',
      ],
    },
    limitations: [
      'pediatric-hypoglycemic-seizure-presentation-care-glucose-and-response-are-authored',
      'pediatric-hypoglycemic-seizure-controls-reconcile-recognize-coordinate-review-reassess-and-handoff-only',
      'no-live-pediatric-hypoglycemic-seizure-exam-test-glucose-drug-airway-treatment-or-disposition',
    ],
  },
  patient: {
    ageYears: 5, sex: 'male', heightCm: 110, weightKg: 18, asaClass: 4,
    diagnosis: 'Authored severe hypoglycemia after a brief stopped generalized convulsion',
    procedure: 'calm pediatric hypoglycemic seizure recognition, qualified rescue coordination, serial reassessment, and active-risk handoff',
    comorbidities: ['Previously well; no known diabetes'], medications: ['None reported'],
    allergies: ['No known drug allergies'], fasting: 'Recent intake and fasting duration remain under qualified review',
    baseline: {
      heartRateBpm: 132, meanArterialMmHg: 74, strokeVolumeMl: 30,
      hemoglobinGPerDl: 12.5, bloodVolumeMl: 1_440, coreTemperatureC: 36.6,
      arterialStiffness: 0.76, baroreflexGain: 1.02, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Drowsy after a stopped convulsion, opens eyes to voice and localizes, with spontaneous breathing but not safe to swallow',
    },
    respiratory: { profile: 'healthy-child' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 126, respiratoryRateBpm: 24,
      freshGasFlowLPerMin: 0.5, delivering: false,
    },
  },
  formulary: [],
  timeline: [
    {
      id: 'pediatric-hypoglycemic-seizure-presentation', type: 'narrative',
      target: 'pediatric-hypoglycemic-seizure-reassessment', atTick: 0, severity: 'critical',
      message: 'A previously well 5-year-old boy weighing 18 kg and measuring 110 cm had a witnessed generalized convulsion lasting about 90 seconds. It stopped before the learner surface opened. He is now drowsy, localizes, and opens his eyes to voice but is not safe to swallow. He is breathing spontaneously, with temperature 36.6°C, HR 132/min, RR 24/min, BP 98/62 mmHg (MAP 74), clean pulse-coherent room-air SpO₂ 99%, warm extremities, normal-volume pulses, and capillary refill 2 seconds. A supplied qualified glucose result is 34 mg/dL.',
    },
    {
      id: 'pediatric-hypoglycemic-seizure-qualified-record', type: 'narrative',
      target: 'pediatric-hypoglycemic-seizure-reassessment', atTick: 0, severity: 'critical',
      message: 'A supplied experienced-team assessment treats the whole-child state and glucose result as severe hypoglycemia requiring immediate qualified rescue and repeated neurological, airway-safety, glucose, and recurrence reassessment. No fever, meningism, trauma, focal neurological deficit, known diabetes, or reported insulin or glucose-lowering medicine exposure is authored, but these are fixed snapshots and illness, ingestion or exposure, fasting, metabolic, endocrine, hepatic, and other causes remain open. Experienced pediatric, nursing, pharmacy, laboratory, airway-capable, and safeguarding teams are available and prepared to own locally protocolized rescue, monitoring, cause evaluation, escalation, and caregiver communication. The learner selects and delivers none of them.',
    },
    {
      id: 'pediatric-hypoglycemic-seizure-boundary', type: 'narrative',
      target: 'pediatric-hypoglycemic-seizure-reassessment-boundary', atTick: 0, severity: 'warning',
      message: 'Reconcile the supplied convulsion, whole-child state, airway safety, circulation, and glucose; recognize authored severe hypoglycemia; and activate qualified rescue ownership in parallel with cause and recurrence-risk review before a strictly later report and handoff. The controls do not examine, palpate, acquire or interpret glucose or another test, diagnose the seizure or cause, choose or deliver oral, intravenous, or intraosseous glucose, dextrose, glucagon, carbohydrate, fluid, anticonvulsant, other drug, concentration, route, dose, rate, access, infusion, feeding plan, oxygen, device, airway maneuver, procedure, or treatment, determine disposition or prognosis, or predict durable euglycemia, neurological recovery, recurrence, or outcome.',
    },
  ],
  debrief: { rubric: [
    { id: 'pediatric-hypoglycemic-seizure-trajectory', objectiveId: 'reconcile-pediatric-hypoglycemic-seizure-whole-child-and-glucose', question: 'Which supplied convulsion, mentation, airway-safety, circulation, and glucose facts established the whole-child trajectory?' },
    { id: 'pediatric-hypoglycemic-seizure-recognition', objectiveId: 'recognize-pediatric-hypoglycemic-seizure', question: 'Why did the supplied whole-child and glucose pattern support severe hypoglycemia after the stopped convulsion?' },
    { id: 'pediatric-hypoglycemic-seizure-rescue', objectiveId: 'activate-pediatric-hypoglycemic-seizure-qualified-rescue-ownership', question: 'How was immediate qualified rescue and monitoring ownership activated without choosing a product, concentration, route, dose, access, or airway intervention?' },
    { id: 'pediatric-hypoglycemic-seizure-causes', objectiveId: 'review-pediatric-hypoglycemic-seizure-causes-and-recurrence-risk', question: 'Which recurrence, neurological, intake, illness, exposure, metabolic, endocrine, hepatic, and other cause work remained open?' },
    { id: 'pediatric-hypoglycemic-seizure-later', objectiveId: 'review-pediatric-hypoglycemic-seizure-later-response', question: 'What improved in the fixed minute-20 report, and what remained unproved?' },
    { id: 'pediatric-hypoglycemic-seizure-handoff', objectiveId: 'handoff-pediatric-hypoglycemic-seizure-active-risk', question: 'Which neurological, glucose, recurrence, cause, caregiver, and ownership work required handoff?' },
  ] },
};
