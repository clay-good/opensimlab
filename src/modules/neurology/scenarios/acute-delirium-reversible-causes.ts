/** Acute-delirium recognition and reversible-contributor coordination. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const ACUTE_DELIRIUM_REVERSIBLE_CAUSES: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'acute-delirium-reversible-causes', version: '0.1.0', maturity: 'preview',
    title: 'Acute delirium with reversible causes', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 6, difficulty: 'intermediate', objectives: [
      { id: 'reconcile-neurology-delirium-baseline-clock-fluctuation-attention-perception-function-and-whole-patient', statement: 'Reconcile baseline, clock, fluctuation, attention, perception, function, and the whole patient.', measure: 'The hours-long departure from independently verified baseline was connected across hypoactive and restless periods without learner history, examination, scoring, diagnosis, or treatment.' },
      { id: 'recognize-neurology-delirium-indicators-and-qualified-assessment-boundary-without-dementia-or-single-cause-closure', statement: 'Recognize delirium indicators and the qualified assessment boundary without dementia or single-cause closure.', measure: 'Acute fluctuation and inattention prompted qualified 4AT assessment and expert diagnosis while dementia, psychiatric illness, and one-cause shortcuts remained open.' },
      { id: 'activate-neurology-delirium-qualified-medical-nursing-pharmacy-family-safety-capacity-and-mobility-ownership', statement: 'Activate qualified medical, nursing, pharmacy, family, safety, capacity, and mobility ownership.', measure: 'Parallel supportive ownership began without learner restraint, observation, medication, mobility, capacity, or disposition decisions.' },
      { id: 'review-neurology-delirium-reversible-contributors-communication-environment-deescalation-and-treatment-boundary', statement: 'Review reversible contributors, communication, environment, de-escalation, and treatment boundaries.', measure: 'Qualified teams owned oxygenation, infection, hydration, bladder, bowel, pain, medicines, nutrition, sensory aids, sleep, mobility, communication, and least-restrictive safety review.' },
      { id: 'review-neurology-delirium-strict-later-contributor-and-unresolved-cognitive-trajectory', statement: 'At a strict later report, review contributors and the unresolved cognitive trajectory.', measure: 'Supplied retention, exposure, sensory, pain, sleep, and fluctuating cognition were integrated without assigning causality or claiming treatment effect or recovery.' },
      { id: 'handoff-neurology-delirium-causes-capacity-safety-medicines-function-recurrence-follow-up-and-active-risk', statement: 'After another elapsed interval, hand off causes, capacity, safety, medicines, function, recurrence, follow-up, and active risk.', measure: 'The handoff preserved unresolved causes, serial cognition, decision-specific capacity, least-restrictive safety, baseline recovery, dementia assessment if unresolved, disposition, and outcome uncertainty.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0', sources: [
        'National Institute for Health and Care Excellence. Delirium: prevention, diagnosis and management in hospital and long-term care. NICE guideline CG103. Updated 2023.',
        'National Institute for Health and Care Excellence. Delirium in adults. NICE quality standard QS63. Updated 2023.',
      ] },
    limitations: ['delirium-baseline-clock-assessment-contributors-care-and-later-state-are-authored',
      'delirium-controls-reconcile-recognize-activate-review-reassess-and-handoff-only',
      'no-live-delirium-history-exam-score-capacity-test-diagnosis-drug-restraint-procedure-or-outcome'],
  },
  patient: {
    ageYears: 82, sex: 'female', heightCm: 163, weightKg: 64, asaClass: 3,
    diagnosis: 'Authored acute fluctuating delirium pattern with multiple possible contributors',
    procedure: 'calm delirium recognition, reversible-contributor, safety, and handoff practice',
    comorbidities: ['Hospital day 2 after a stable nonoperative pubic-ramus fracture', 'Uses bilateral hearing aids'],
    medications: ['Exact inpatient and outpatient medication reconciliation remains qualified-team work'],
    allergies: ['No known drug allergies'], fasting: 'Not applicable to the ward fixture',
    baseline: { heartRateBpm: 92, meanArterialMmHg: 97, strokeVolumeMl: 62,
      hemoglobinGPerDl: 11.8, bloodVolumeMl: 4_300, coreTemperatureC: 37.0,
      arterialStiffness: 1.25, baroreflexGain: 0.65, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Speaking in sentences with a supplied intact cough and secretion handling' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 420, respiratoryRateBpm: 10,
      freshGasFlowLPerMin: 0.5, delivering: false } }, formulary: [],
  timeline: [
    { id: 'acute-delirium-reversible-causes-presentation', type: 'narrative', target: 'acute-delirium-reversible-causes-reassessment', atTick: 0,
      severity: 'critical', message: 'An 82-year-old woman on hospital day 2 after a stable nonoperative pubic-ramus fracture was independently living, managing medicines and finances, and conversing normally before admission; her daughter confirms no diagnosed cognitive disorder and normal conversation at 08:00 today. Over 10 hours, staff report alternating withdrawal with slow responses and short restless periods pulling at bed linen, plus twice pointing toward children she believed were in the room. A qualified examination at 18:00 reports distractibility, disorganized answers, inability to sustain attention beyond 2 months backward, and errors on age and current year, without facial asymmetry, arm drift, new unilateral weakness, meningism, witnessed convulsion, or persistent gaze deviation. Her hearing aids are in the bedside drawer. T 37.0°C, HR 92/min, RR 14/min, BP 128/82 mmHg (MAP 97), pulse-coherent room-air SpO2 97%, and supplied glucose 104 mg/dL are authored.' },
    { id: 'acute-delirium-reversible-causes-evidence', type: 'narrative', target: 'acute-delirium-reversible-causes-reassessment', atTick: 0,
      severity: 'warning', message: 'A qualified practitioner supplies 4AT 8 from the recorded acute fluctuation, attention failure, and orientation errors; a qualified clinician reports delirium after integrating the history and examination. The score supports assessment but is not a learner calculation, universal diagnosis, severity scale, cause finder, capacity test, or dementia label. No fever, shock, hypoxemia, hypoglycemia, major electrolyte disturbance, focal deficit, witnessed seizure, intoxication history, or head injury is authored, but infection, respiratory, circulatory, metabolic, medication, pain, urinary, bowel, neurological, psychiatric, environmental, and other causes require qualified serial review.' },
    { id: 'acute-delirium-reversible-causes-boundary', type: 'narrative', target: 'acute-delirium-reversible-causes-reassessment-boundary', atTick: 0,
      severity: 'warning', message: 'Reconcile baseline and fluctuation; recognize delirium indicators and the qualified assessment boundary without one-cause or dementia closure; activate qualified medical, nursing, pharmacy, family, falls, capacity, mobility, pain, nutrition, bladder, bowel, sensory, sleep, and safeguarding ownership; and review oxygenation, infection, hydration, medicines, pain, retention, constipation, nutrition, sensory aids, sleep, mobility, communication, reassurance, environmental consistency, de-escalation, and least-restrictive safety boundaries. At a strict fixed 6-hour report, qualified review identifies bladder volume 690 mL before team-managed drainage, diphenhydramine 25 mg administered 8 hours before the first recorded change, poor oral intake, movement-related pain, fragmented sleep, and absent hearing aids. Qualified teams report individualized contributor care and familiar reorientation active. She now recognizes her daughter and the hospital but still loses the task after 3 months backward and intermittently misidentifies the time; no treatment effect, single cause, resolved delirium, baseline recovery, capacity conclusion, disposition, prognosis, or outcome is reported. After another elapsed interval, hand off possible cause combination, serial cognition, distress, decision-specific capacity, falls and mobility safety, medicines, hydration, bladder and bowel, pain, nutrition, senses, sleep, family communication, recurrence, baseline recovery, follow-up for possible dementia if unresolved, disposition, and outcome uncertainty. The controls do not take history; examine; calculate or interpret 4AT or another score; test capacity; monitor; acquire or interpret glucose, oxygenation, bladder, blood, urine, imaging, EEG, or another test; diagnose; restrain; observe; mobilize; reorient; select or deliver fluid, analgesic, antipsychotic, sedative, or another drug, dose, route, or access; catheterize; perform a procedure; determine disposition or prognosis; or prove cause, treatment effect, recovery, survival, or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'delirium-trajectory', objectiveId: 'reconcile-neurology-delirium-baseline-clock-fluctuation-attention-perception-function-and-whole-patient', question: 'Which baseline, clock, attention, perception, function, and whole-patient changes established the fluctuation?' },
    { id: 'delirium-recognition', objectiveId: 'recognize-neurology-delirium-indicators-and-qualified-assessment-boundary-without-dementia-or-single-cause-closure', question: 'Why did this require qualified delirium assessment without dementia or one-cause closure?' },
    { id: 'delirium-ownership', objectiveId: 'activate-neurology-delirium-qualified-medical-nursing-pharmacy-family-safety-capacity-and-mobility-ownership', question: 'Which qualified owners needed to begin in parallel?' },
    { id: 'delirium-boundary', objectiveId: 'review-neurology-delirium-reversible-contributors-communication-environment-deescalation-and-treatment-boundary', question: 'Which contributor, communication, environmental, safety, capacity, and treatment decisions remained with qualified teams?' },
    { id: 'delirium-later', objectiveId: 'review-neurology-delirium-strict-later-contributor-and-unresolved-cognitive-trajectory', question: 'What did the strict later report establish without proving one cause, response, or recovery?' },
    { id: 'delirium-handoff', objectiveId: 'handoff-neurology-delirium-causes-capacity-safety-medicines-function-recurrence-follow-up-and-active-risk', question: 'Which cause, capacity, safety, medicine, function, recurrence, follow-up, disposition, and outcome risks required handoff?' },
  ] },
};
