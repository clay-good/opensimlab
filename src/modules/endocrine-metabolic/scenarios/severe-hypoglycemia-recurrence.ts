import type { Scenario } from '@anesthesia/scenarios/types';

export const SEVERE_HYPOGLYCEMIA_RECURRENCE: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'severe-hypoglycemia-recurrence', version: '0.1.2', maturity: 'preview',
    title: 'Severe hypoglycemia: rescue is not the end', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 45, difficulty: 'intermediate',
    objectives: [
      { id: 'hypoglycemia-recognize', statement: 'Check glucose when alertness changes and connect the result with the patient.', measure: 'A simulated glucose check precedes rescue; severity is not judged from the number alone.' },
      { id: 'hypoglycemia-safe-rescue', statement: 'Choose qualified parenteral rescue when oral treatment is unsafe.', measure: 'Qualified support and rescue are activated without an unsafe oral-treatment choice.' },
      { id: 'hypoglycemia-reassess', statement: 'Recheck after rescue instead of assuming that improved alertness proves recovery.', measure: 'The first post-rescue glucose check occurs after the 10-minute checkpoint and before recurrence.' },
      { id: 'hypoglycemia-recurrence', statement: 'Uncover the medication and intake risks, continue monitoring, and respond to recurrence.', measure: 'Medication review, continued monitoring, recurrent glucose confirmation, repeat rescue, and another post-rescue check are recorded.' },
      { id: 'hypoglycemia-handoff', statement: 'Hand off ongoing recurrence risk without treating one normal result as discharge permission.', measure: 'A monitored, medication-informed handoff closes the fictional practice after the repeated response.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED', competingInterests: 'None declared',
      reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.2',
      sources: [
        'American Diabetes Association Professional Practice Committee. Glycemic Goals, Hypoglycemia, and Hyperglycemic Crises: Standards of Care in Diabetes—2026. Diabetes Care. 2026;49(Suppl 1). doi:10.2337/dc26-s006.',
        'Joint British Diabetes Societies for Inpatient Care. The Hospital Management of Hypoglycaemia in Adults with Diabetes Mellitus. January 2023. Severe pathway and follow-up; consulted 2026-08-26.',
      ],
    },
    limitations: ['adult-hypoglycemia-authored-timed-states-not-kinetics', 'adult-hypoglycemia-qualified-rescue-not-dose-or-technique', 'adult-hypoglycemia-handoff-not-durable-recovery'],
  },
  patient: {
    ageYears: 72, sex: 'female', heightCm: 165, weightKg: 70, asaClass: 4,
    diagnosis: 'Drowsiness and sweating in a fictional adult with diabetes', procedure: 'Hypoglycemia rescue and recurrence rehearsal',
    comorbidities: ['Type 2 diabetes', 'Kidney disease; review the medication record'], medications: ['Medication record available through the review action'],
    allergies: ['No known drug allergies'], fasting: 'Recent intake needs review',
    baseline: { heartRateBpm: 112, meanArterialMmHg: 95, strokeVolumeMl: 60, hemoglobinGPerDl: 13, bloodVolumeMl: 4600, coreTemperatureC: 36.6, arterialStiffness: 1.1, baroreflexGain: 1, fixedStrokeVolume: true },
    airway: { difficulty: 0.1, difficultMaskVentilation: false, assessment: 'Drowsy, rousable to voice, and not safe for oral treatment by the supplied initial assessment' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 450, respiratoryRateBpm: 18, freshGasFlowLPerMin: 10, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'severe-hypoglycemia-presentation', type: 'narrative', target: 'severe-hypoglycemia-recurrence', atTick: 0, severity: 'critical', message: 'A 72-year-old woman on the ward is sweaty and drowsy. She responds briefly to voice and is breathing spontaneously. The supplied initial assessment says oral treatment is unsafe. HR 112/min, BP 132/76 mm Hg, RR 18/min, room-air SpO2 98%, temperature 36.6°C. A bedside glucose check and medication record are available. Choose what to observe and do; the patient clock continues while you decide.' },
    { id: 'severe-hypoglycemia-boundary', type: 'narrative', target: 'severe-hypoglycemia-recurrence-boundary', atTick: 0, severity: 'warning', message: 'This is a dose-free state-transition simulation, not a glucose kinetics or treatment calculator. The fixed IV rescue action represents a qualified team pathway, not learner access placement or drug administration. Recheck after 10 simulated minutes; the 60× speed control lets a minute pass in a second. Monitor clinical change and repeat glucose, uncover medication and intake risks, and revise the plan as needed. Oral treatment is refused in the unsafe-swallow branch. A handoff or instructor takeover ends the modeled branch; neither determines real disposition, neurologic outcome, or competence.' },
  ],
  replayPoints: [{ id: 'hypoglycemia-first-decision', label: 'Return to the first rescue decision', objectiveId: 'hypoglycemia-safe-rescue', atTick: 1, reason: 'Compare assessment and safe rescue with delayed or unsafe choices using the same fictional patient.' }],
  debrief: { rubric: [
    { id: 'hypoglycemia-observation', objectiveId: 'hypoglycemia-recognize', question: 'What connected the glucose result with impaired alertness and the need for assistance?' },
    { id: 'hypoglycemia-rescue', objectiveId: 'hypoglycemia-safe-rescue', question: 'How did swallowing safety change the rescue route you chose?' },
    { id: 'hypoglycemia-repeat', objectiveId: 'hypoglycemia-reassess', question: 'What did the timed recheck add beyond improved appearance?' },
    { id: 'hypoglycemia-return', objectiveId: 'hypoglycemia-recurrence', question: 'Why could the earlier glucose result not rule out recurrent hypoglycemia?' },
    { id: 'hypoglycemia-continuity', objectiveId: 'hypoglycemia-handoff', question: 'Which medication, intake, monitoring, and recurrence risks remain for the receiving team?' },
  ] },
};
