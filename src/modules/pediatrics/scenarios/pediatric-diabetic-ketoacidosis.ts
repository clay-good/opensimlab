/** Pediatric diabetic ketoacidosis recognition and serial safety reassessment. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const PEDIATRIC_DIABETIC_KETOACIDOSIS: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'pediatric-diabetic-ketoacidosis', version: '0.1.0', maturity: 'draft',
    title: 'Pediatric diabetic ketoacidosis', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 8, difficulty: 'intermediate', objectives: [
      {
        id: 'reconcile-pediatric-dka-illness-and-fixed-pattern',
        statement: 'Connect the supplied illness trajectory, hydration, breathing, mentation, glucose, ketones, and acid-base findings.',
        measure: 'The authored whole-child and biochemical pattern was reconciled without learner examination, calculation, testing, diagnosis, or treatment delivery.',
      },
      {
        id: 'recognize-pediatric-dka-and-current-risk',
        statement: 'Recognize the supplied pediatric diabetic ketoacidosis pattern and its no-current-shock boundary.',
        measure: 'The authored DKA classification was reviewed without learner diagnosis, severity calculation, or reliance on glucose alone.',
      },
      {
        id: 'activate-pediatric-dka-qualified-care-ownership',
        statement: 'Activate experienced pediatric DKA, nursing, laboratory, fluid, insulin, electrolyte, and monitoring ownership.',
        measure: 'Qualified care was activated without learner fluid, insulin, electrolyte, glucose, access, device, dose, rate, or treatment selection.',
      },
      {
        id: 'review-pediatric-dka-neurologic-and-metabolic-safety',
        statement: 'Review neurological status, circulation, electrolytes, glucose, ketones, acid-base response, intake, output, and precipitating causes in parallel.',
        measure: 'Active safety work continued without learner testing, prescribing, treatment, or disposition decisions.',
      },
      {
        id: 'review-pediatric-dka-later-response',
        statement: 'After elapsed qualified care, review the fixed whole-child and biochemical response without declaring DKA resolved.',
        measure: 'Partial improvement was separated from proven treatment effect, biochemical resolution, durable recovery, and disposition.',
      },
      {
        id: 'handoff-pediatric-dka-active-risk',
        statement: 'Hand off neurological, circulatory, glucose, ketone, acid-base, electrolyte, intake, output, precipitant, and ownership work.',
        measure: 'The handoff preserved active DKA risk without claiming resolution, prognosis, disposition, recurrence, or outcome.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Glaser N, Fritsch M, Priyambada L, et al. ISPAD Clinical Practice Consensus Guidelines 2022: Diabetic ketoacidosis and hyperglycemic hyperosmolar state. Pediatric Diabetes. 2022;23(7):835-856. doi:10.1111/pedi.13406.',
        'National Institute for Health and Care Excellence. Diabetes (type 1 and type 2) in children and young people: diagnosis and management. NICE guideline NG18. Published 2015; overall last updated 2023; DKA fluid evidence reviewed 2020; shock-bolus wording amended 2022; minor DKA-checking update 2026. Section 1.4.',
        'British Society for Paediatric Endocrinology and Diabetes. Guideline for the Management of Children and Young People under the age of 18 years with Diabetic Ketoacidosis. 2021. Version 3.',
        'Kuppermann N, Ghetti S, Schunk JE, et al. Clinical Trial of Fluid Infusion Rates for Pediatric Diabetic Ketoacidosis. New England Journal of Medicine. 2018;378:2275-2287. doi:10.1056/NEJMoa1716816.',
      ],
    },
    limitations: [
      'pediatric-dka-presentation-care-laboratories-and-response-are-authored',
      'pediatric-dka-controls-reconcile-recognize-coordinate-review-reassess-and-handoff-only',
      'no-live-pediatric-dka-exam-calculation-test-fluid-insulin-electrolyte-device-or-disposition',
    ],
  },
  patient: {
    ageYears: 9, sex: 'female', heightCm: 133, weightKg: 30, asaClass: 4,
    diagnosis: 'Authored new-onset pediatric diabetic ketoacidosis with no current shock and no authored cerebral-injury warning cluster',
    procedure: 'calm pediatric diabetic ketoacidosis recognition, qualified escalation, serial safety reassessment, and active-risk handoff',
    comorbidities: ['No known diabetes or other chronic condition'], medications: ['None reported'],
    allergies: ['No known drug allergies'], fasting: 'Vomiting with minimal intake since yesterday',
    baseline: {
      heartRateBpm: 124, meanArterialMmHg: 77, strokeVolumeMl: 42,
      hemoglobinGPerDl: 14.6, bloodVolumeMl: 2_400, coreTemperatureC: 37.2,
      arterialStiffness: 0.86, baroreflexGain: 0.96, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Tired but oriented, answering appropriately, protecting the airway, with deep spontaneous breathing',
    },
    respiratory: { profile: 'healthy-child' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 210, respiratoryRateBpm: 30,
      freshGasFlowLPerMin: 0.5, delivering: false,
    },
  },
  formulary: [],
  timeline: [
    {
      id: 'pediatric-dka-presentation', type: 'narrative',
      target: 'pediatric-diabetic-ketoacidosis-reassessment', atTick: 0, severity: 'critical',
      message: 'A 9-year-old girl weighing 30 kg has 2 weeks of thirst, frequent urination, tiredness, and reported weight loss, followed by 1 day of vomiting, abdominal discomfort, deep breathing, and minimal intake. She is tired but oriented and answers appropriately, with dry mucosa, temperature 37.2°C, HR 124/min, deep RR 30/min, BP 102/64 mmHg (MAP 77), clean pulse-coherent room-air SpO2 99%, warm extremities, normal-volume pulses, and capillary refill 2 seconds. A supplied venous sample reports glucose 468 mg/dL, beta-hydroxybutyrate 5.6 mmol/L, pH 7.14, bicarbonate 8 mmol/L, potassium 4.6 mmol/L, and sodium 132 mmol/L.',
    },
    {
      id: 'pediatric-dka-qualified-record', type: 'narrative',
      target: 'pediatric-diabetic-ketoacidosis-reassessment', atTick: 0, severity: 'critical',
      message: 'A supplied experienced-team assessment classifies pediatric diabetic ketoacidosis from the combined hyperglycemia, ketonemia, and metabolic acidosis; glucose alone does not establish it. Preserved orientation, warm extremities, pulse volume, refill, and blood pressure support no current shock, and no current authored cerebral-injury warning cluster is present. No fever, focal infection finding, trauma, toxin exposure, established diabetes, insulin omission, pump failure, focal neurological deficit, headache, bradycardia, hypertension, hypoxemia, or mixed hyperosmolar presentation is authored, but these are fixed snapshots and alternative precipitants and complications remain under qualified review. Experienced pediatric, diabetes, nursing, and laboratory teams are available and prepared to own locally protocolized fluids, insulin, glucose, electrolytes, access, input and output, frequent biochemical and neurological monitoring, and escalation. The learner selects and delivers none of them.',
    },
    {
      id: 'pediatric-dka-boundary', type: 'narrative',
      target: 'pediatric-diabetic-ketoacidosis-reassessment-boundary', atTick: 0, severity: 'warning',
      message: 'Reconcile the supplied whole-child and biochemical trajectory, recognize authored pediatric DKA with no current shock and no current authored cerebral-injury warning cluster while surveillance remains active, and keep qualified DKA care active in parallel with neurological, circulatory, electrolyte, glucose, ketone, acid-base, intake, output, and precipitant review before a strictly later report and handoff. The controls do not examine, weigh, calculate dehydration, sodium, osmolality, deficit, maintenance, dose, or rate, diagnose DKA or its cause, acquire or interpret a test, choose or deliver oral, intravenous, or intraosseous fluid, a solution, bolus, volume, rate, insulin, dextrose, potassium, phosphate, bicarbonate, access, device, drug, procedure, or treatment, determine disposition or prognosis, or predict cerebral injury, biochemical resolution, recovery, recurrence, or outcome.',
    },
  ],
  debrief: { rubric: [
    { id: 'pediatric-dka-trajectory', objectiveId: 'reconcile-pediatric-dka-illness-and-fixed-pattern', question: 'Which supplied illness, hydration, breathing, mentation, glucose, ketone, and acid-base facts established the whole pattern?' },
    { id: 'pediatric-dka-recognition', objectiveId: 'recognize-pediatric-dka-and-current-risk', question: 'Why did the combined fixed pattern support pediatric DKA without relying on glucose alone, which findings argued against current shock, and why did absent warning signs not exclude cerebral injury?' },
    { id: 'pediatric-dka-care', objectiveId: 'activate-pediatric-dka-qualified-care-ownership', question: 'How was qualified DKA ownership activated without selecting a fluid, insulin, electrolyte, dose, route, volume, or rate?' },
    { id: 'pediatric-dka-safety', objectiveId: 'review-pediatric-dka-neurologic-and-metabolic-safety', question: 'Which neurological, circulatory, biochemical, input, output, and precipitant risks remained active?' },
    { id: 'pediatric-dka-later', objectiveId: 'review-pediatric-dka-later-response', question: 'What improved in the fixed later report, and which findings kept DKA care and complication surveillance open?' },
    { id: 'pediatric-dka-handoff', objectiveId: 'handoff-pediatric-dka-active-risk', question: 'Which whole-child, biochemical, precipitant, and ownership work required handoff?' },
  ] },
};
