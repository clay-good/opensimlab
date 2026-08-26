/** Minor nondisabling acute ischemic stroke with individualized functional review. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const MINOR_NONDISABLING_ACUTE_ISCHEMIC_STROKE: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'minor-nondisabling-acute-ischemic-stroke', version: '0.1.0', maturity: 'preview',
    title: 'Minor nondisabling acute ischemic stroke', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 8, difficulty: 'intermediate', objectives: [
      {
        id: 'reconcile-neurology-minor-stroke-clock-deficit-function-and-whole-patient',
        statement: 'Connect the symptom clock, focal deficit, individualized function, physiology, and whole-patient state.',
        measure: 'The authored trajectory was reconciled without learner history, examination, score calculation, testing, diagnosis, disability adjudication, or treatment.',
      },
      {
        id: 'review-neurology-minor-stroke-imaging-mimics-and-immediate-threats',
        statement: 'Review the fixed imaging, glucose, physiology, open mimics, and immediate-threat boundary.',
        measure: 'Supplied CT, CTA, glucose, breathing, circulation, and neurological facts were reviewed without learner acquisition, interpretation, diagnosis, or mimic exclusion.',
      },
      {
        id: 'recognize-neurology-minor-nondisabling-stroke-boundary-without-score-alone',
        statement: 'Recognize the individually nondisabling minor-stroke boundary without relying on NIHSS alone.',
        measure: 'Persistent supplied sensation and preserved patient-specific activities were integrated without turning a low score or sensory syndrome into a universal rule.',
      },
      {
        id: 'record-neurology-minor-stroke-qualified-antiplatelet-and-surveillance-intent',
        statement: 'Record qualified antiplatelet-strategy and neurological-surveillance ownership.',
        measure: 'Qualified intent followed the functional boundary without learner product, combination, dose, duration, route, access, prescription, preparation, delivery, or treatment.',
      },
      {
        id: 'review-neurology-minor-stroke-later-neurologic-trajectory',
        statement: 'At a strict later report, compare the fixed neurological and whole-patient trajectory.',
        measure: 'Short-window stability was separated from treatment effect, infarct resolution, durable control, complete recovery, or low recurrence risk.',
      },
      {
        id: 'handoff-neurology-minor-stroke-etiology-recurrence-and-secondary-prevention-risk',
        statement: 'After another elapsed interval, hand off etiology, recurrence, secondary-prevention, surveillance, and active-risk work.',
        measure: 'The handoff preserved unresolved work without claiming a cause, treatment, disposition, prognosis, durable stability, or outcome.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Prabhakaran S, Gonzalez NR, Zachrison KS, et al. 2026 Guideline for the Early Management of Patients With Acute Ischemic Stroke. Stroke. 2026;57:e317-e473. doi:10.1161/STR.0000000000000513.',
        'Chen HS, Cui Y, Zhou ZH, et al. Dual Antiplatelet Therapy vs Alteplase for Patients With Minor Nondisabling Acute Ischemic Stroke: The ARAMIS Randomized Clinical Trial. JAMA. 2023;329:2135-2144. doi:10.1001/jama.2023.7827.',
        'Khatri P, Kleindorfer DO, Devlin T, et al. Effect of Alteplase vs Aspirin on Functional Outcome for Patients With Acute Ischemic Stroke and Minor Nondisabling Neurologic Deficits: The PRISMS Randomized Clinical Trial. JAMA. 2018;320:156-166. doi:10.1001/jama.2018.8496.',
      ],
    },
    limitations: [
      'minor-nondisabling-stroke-deficit-function-imaging-care-and-later-state-are-authored',
      'minor-nondisabling-stroke-controls-reconcile-review-recognize-record-reassess-and-handoff-only',
      'no-live-minor-stroke-exam-score-imaging-drug-reperfusion-procedure-disposition-or-outcome',
    ],
  },
  patient: {
    ageYears: 62, sex: 'female', heightCm: 165, weightKg: 68, asaClass: 3,
    diagnosis: 'Authored probable minor nondisabling acute ischemic stroke without large-vessel occlusion',
    procedure: 'calm minor-stroke function review, qualified strategy intent, serial surveillance, and active-risk handoff',
    comorbidities: ['Hypertension', 'Right-handed and independently living'],
    medications: ['Amlodipine'], allergies: ['No known drug allergies'],
    fasting: 'Not established during acute stroke assessment',
    baseline: {
      heartRateBpm: 78, meanArterialMmHg: 111, strokeVolumeMl: 66,
      hemoglobinGPerDl: 13.2, bloodVolumeMl: 4_800, coreTemperatureC: 36.8,
      arterialStiffness: 1.1, baroreflexGain: 0.85, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Awake with fluent speech, spontaneous breathing, and no authored swallowing or airway concern',
    },
    respiratory: { profile: 'healthy' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 420, respiratoryRateBpm: 16,
      freshGasFlowLPerMin: 0.5, delivering: false,
    },
  },
  formulary: [],
  timeline: [
    {
      id: 'minor-nondisabling-acute-ischemic-stroke-presentation', type: 'narrative',
      target: 'minor-nondisabling-acute-ischemic-stroke-reassessment', atTick: 0,
      severity: 'warning',
      message: 'A 62-year-old right-handed, independently living retired teacher developed abrupt persistent numbness of the left cheek and arm during a witnessed conversation 95 minutes ago. A supplied qualified examination reports that she is awake and oriented with fluent language, normal naming and repetition, mild reduced pinprick and light-touch sensation over the left cheek and arm, and no weakness, facial motor droop, visual-field loss, neglect, ataxia, gait impairment, dysarthria, aphasia, or swallowing complaint. She can walk independently, dress, toilet, eat, write, use her phone, and communicate normally. A supplied NIHSS is 1 for sensation, but the decision does not rely on that score. A patient-specific qualified discussion describes the persistent deficit as nondisabling to date and explicitly revisable. Temperature is 36.8°C, HR 78/min in sinus rhythm, RR 16/min, BP 156/88 mmHg (MAP 111), and room-air SpO₂ 98%. Supplied glucose is 106 mg/dL.',
    },
    {
      id: 'minor-nondisabling-acute-ischemic-stroke-boundary', type: 'narrative',
      target: 'minor-nondisabling-acute-ischemic-stroke-reassessment-boundary', atTick: 0,
      severity: 'warning',
      message: 'The stroke system is already active. Fixed noncontrast CT reports no hemorrhage or established large infarct, and fixed CTA head and neck reports no large-vessel occlusion or flow-limiting stenosis. No thrombolytic, antiplatelet, or other treatment is reported delivered. No seizure, loss of consciousness, severe headache, trauma, fever, hypoglycemia, intoxication, or anticoagulant exposure is authored, but these are snapshots and stroke mimics, mechanism, etiology, bleeding context, and deterioration remain open. Reconcile the clock, deficit, individualized function, physiology, and whole patient; review supplied imaging, mimics, and immediate threats; recognize the individually nondisabling boundary without relying on NIHSS alone; then record qualified antiplatelet-strategy and neurological-surveillance intent. At a strict later report, the left facial and arm sensory change persists without spread. No new weakness, aphasia, dysarthria, visual loss, neglect, ataxia, gait change, reduced consciousness, headache, vomiting, or swallowing concern is reported. HR is 76/min, RR 16/min, BP 150/84 mmHg (MAP 106), room-air SpO₂ 98%, and temperature 36.8°C. Named stroke-unit ownership and surveillance remain active. After another elapsed interval, hand off open etiology, rhythm surveillance, vascular-risk review, individualized antithrombotic planning, rehabilitation need, recurrence risk, and disposition. No treatment is reported delivered, and no treatment effect, infarct resolution, durable stability, complete recovery, low recurrence risk, disposition, prognosis, or outcome is claimed. The controls do not take a history; examine; calculate NIHSS or another score; measure glucose or pressure; acquire or interpret CT, CTA, ECG, laboratory, swallowing, or other tests; diagnose stroke, disability, etiology, or a mimic; adjudicate thrombolysis or antiplatelet eligibility; choose, prescribe, prepare, dose, route, or deliver an antiplatelet, thrombolytic, blood-pressure therapy, or other drug; perform reperfusion or another procedure; prescribe rehabilitation; determine admission or discharge; predict prognosis; or report outcome.',
    },
  ],
  debrief: { rubric: [
    { id: 'minor-stroke-reconcile', objectiveId: 'reconcile-neurology-minor-stroke-clock-deficit-function-and-whole-patient', question: 'Which supplied clock, deficit, individualized-function, physiological, and whole-patient facts established the trajectory?' },
    { id: 'minor-stroke-context', objectiveId: 'review-neurology-minor-stroke-imaging-mimics-and-immediate-threats', question: 'Which fixed imaging, glucose, physiology, mimic, and immediate-threat facts required review?' },
    { id: 'minor-stroke-boundary', objectiveId: 'recognize-neurology-minor-nondisabling-stroke-boundary-without-score-alone', question: 'Why was the deficit described as individually nondisabling to date rather than classified from NIHSS alone?' },
    { id: 'minor-stroke-strategy', objectiveId: 'record-neurology-minor-stroke-qualified-antiplatelet-and-surveillance-intent', question: 'How was qualified strategy and surveillance ownership recorded without learner drug or treatment controls?' },
    { id: 'minor-stroke-later', objectiveId: 'review-neurology-minor-stroke-later-neurologic-trajectory', question: 'What remained stable in the strict later report, and what did short-window stability not prove?' },
    { id: 'minor-stroke-handoff', objectiveId: 'handoff-neurology-minor-stroke-etiology-recurrence-and-secondary-prevention-risk', question: 'Which etiology, recurrence, prevention, surveillance, rehabilitation, and disposition risks remained open at handoff?' },
  ] },
};
