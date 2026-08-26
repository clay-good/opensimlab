/** Late-window basilar artery occlusion escalation with fixed selection evidence. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const BASILAR_ARTERY_OCCLUSION_ESCALATION: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'basilar-artery-occlusion-escalation', version: '0.1.0', maturity: 'draft',
    title: 'Late-window basilar occlusion escalation', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 8, difficulty: 'advanced', objectives: [
      { id: 'reconcile-neurology-basilar-lvo-clock-posterior-syndrome-and-whole-patient', statement: 'Connect the 10-hour clock, posterior-circulation syndrome, physiology, and whole-patient state.', measure: 'The fixed clock, deficits, baseline function, breathing, circulation, and glucose were reconciled without learner history, examination, scoring, testing, diagnosis, or treatment.' },
      { id: 'review-neurology-basilar-lvo-imaging-selection-and-open-mimics', statement: 'Review the fixed CT, CTA, selection facts, and open mimic boundary.', measure: 'No hemorrhage, pc-ASPECTS 8, mid-basilar occlusion, supplied NIHSS 14, and open alternatives were integrated without learner acquisition, interpretation, or eligibility adjudication.' },
      { id: 'recognize-neurology-basilar-lvo-thrombectomy-escalation-boundary', statement: 'Recognize the supplied basilar-occlusion thrombectomy-escalation boundary without predicting benefit for one patient.', measure: 'The fixed baseline mRS 0, NIHSS 14, pc-ASPECTS 8, occlusion, and 10-hour clock prompted escalation without a futility, candidacy, or outcome claim.' },
      { id: 'activate-neurology-basilar-lvo-qualified-endovascular-and-airway-capable-ownership', statement: 'Activate qualified endovascular and airway-capable ownership without waiting for a treatment decision or response.', measure: 'Named ownership followed recognition without learner drug, airway, transfer, procedure, or treatment controls.' },
      { id: 'review-neurology-basilar-lvo-strict-later-neurologic-and-airway-trajectory', statement: 'At a strict later report, compare the fixed neurological, airway-risk, and whole-patient trajectory.', measure: 'Persistent deficits and current secretion handling were separated from improvement, durable airway safety, treatment effect, reperfusion, or outcome.' },
      { id: 'handoff-neurology-basilar-lvo-clocks-imaging-deterioration-and-unresolved-outcome', statement: 'After another elapsed interval, hand off clocks, imaging, deterioration risk, and unresolved care.', measure: 'The handoff preserved thrombolysis review, etiology, airway risk, procedure, complications, disposition, and outcome as qualified-team work.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Prabhakaran S, Gonzalez NR, Zachrison KS, et al. 2026 Guideline for the Early Management of Patients With Acute Ischemic Stroke. Stroke. 2026;57:e317-e473. doi:10.1161/STR.0000000000000513.',
        'Tao C, Nogueira RG, Zhu Y, et al. Trial of Endovascular Treatment of Acute Basilar-Artery Occlusion. N Engl J Med. 2022;387:1361-1372. doi:10.1056/NEJMoa2206317.',
        'Jovin TG, Li C, Wu L, et al. Trial of Thrombectomy 6 to 24 Hours after Stroke Due to Basilar-Artery Occlusion. N Engl J Med. 2022;387:1373-1384. doi:10.1056/NEJMoa2207576.',
      ],
    },
    limitations: [
      'basilar-lvo-clock-neurologic-imaging-selection-and-later-state-are-authored',
      'basilar-lvo-controls-reconcile-review-recognize-activate-reassess-and-handoff-only',
      'no-live-basilar-lvo-exam-score-imaging-drug-airway-transfer-thrombectomy-reperfusion-disposition-or-outcome',
    ],
  },
  patient: {
    ageYears: 74, sex: 'male', heightCm: 175, weightKg: 78, asaClass: 4,
    diagnosis: 'Authored acute ischemic stroke with mid-basilar artery occlusion',
    procedure: 'calm posterior-circulation recognition, qualified escalation, surveillance, and active-risk handoff',
    comorbidities: ['Hypertension', 'Independently living with supplied prestroke modified Rankin Scale 0'],
    medications: ['Amlodipine'], allergies: ['No known drug allergies'],
    fasting: 'Not established during acute stroke assessment',
    baseline: { heartRateBpm: 84, meanArterialMmHg: 122, strokeVolumeMl: 66,
      hemoglobinGPerDl: 13.5, bloodVolumeMl: 5_000, coreTemperatureC: 36.8,
      arterialStiffness: 1.2, baroreflexGain: 0.8, fixedStrokeVolume: false },
    airway: { difficulty: 0.3, difficultMaskVentilation: false,
      assessment: 'Spontaneously breathing with a present cough and handling secretions at this snapshot; bulbar signs and fluctuating alertness keep airway deterioration risk active' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 470, respiratoryRateBpm: 20,
      freshGasFlowLPerMin: 0.5, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'basilar-artery-occlusion-escalation-presentation', type: 'narrative',
      target: 'basilar-artery-occlusion-escalation-reassessment', atTick: 0, severity: 'critical',
      message: 'A previously independent 74-year-old man developed witnessed abrupt diplopia, vertigo, severe dysarthria, and left face, arm, and leg weakness 10 hours ago. A supplied qualified examination now reports that he is drowsy but opens his eyes to voice and follows simple commands, with impaired horizontal eye movements and diplopia, severe dysarthria, left facial weakness, left arm and leg weakness, and marked truncal and limb ataxia. Supplied NIHSS is 14 and prestroke modified Rankin Scale is 0; neither score is learner-calculated. He is spontaneously breathing with a present cough and handles secretions at this snapshot, while bulbar findings and fluctuating alertness keep deterioration risk active. Temperature is 36.8°C, HR 84/min in sinus rhythm, RR 20/min, BP 174/96 mmHg (MAP 122), room-air SpO₂ 96%, and supplied glucose 110 mg/dL.' },
    { id: 'basilar-artery-occlusion-escalation-boundary', type: 'narrative',
      target: 'basilar-artery-occlusion-escalation-reassessment-boundary', atTick: 0, severity: 'warning',
      message: 'The stroke system is active. Fixed neuroradiology reports noncontrast CT without hemorrhage and with pc-ASPECTS 8, and CTA with a mid-basilar artery occlusion. No thrombolytic or other treatment is reported delivered; thrombolysis review remains qualified-team-owned and endovascular escalation must not wait for a treatment decision or response. No seizure, trauma, fever, hypoglycemia, or reported intoxication is authored, but these are snapshots and mimics, etiology, deterioration, bleeding context, and outcome remain open. Reconcile the clock, posterior syndrome, physiology, and whole patient; review fixed imaging, selection facts, and open mimics; recognize the supplied thrombectomy-escalation boundary; then activate qualified endovascular and airway-capable ownership. At a strict later report, ownership is active and the deficits remain present without reported improvement: he is drowsy but opens his eyes to voice, follows commands, has severe dysarthria and the same ocular-motor and left-sided weakness pattern, with a present cough and continued secretion handling. HR is 86/min, RR 20/min, BP 166/92 mmHg (MAP 117), room-air SpO₂ 95%, and temperature 36.8°C. After another elapsed interval, hand off clocks, imaging, thrombolysis review, airway and deterioration risk, etiology, procedure, complications, disposition, and outcome. The controls do not take a history; examine; calculate NIHSS, mRS, pc-ASPECTS, or another score; measure glucose or pressure; acquire or interpret imaging or tests; diagnose stroke, etiology, or a mimic; adjudicate thrombolysis or thrombectomy eligibility; select or deliver a drug, blood-pressure target, airway device, transfer, procedure, or treatment; grade reperfusion; determine disposition or prognosis; or predict or report outcome.' },
  ],
  debrief: { rubric: [
    { id: 'basilar-lvo-reconcile', objectiveId: 'reconcile-neurology-basilar-lvo-clock-posterior-syndrome-and-whole-patient', question: 'Which fixed clock, posterior neurological, breathing, circulation, glucose, and whole-patient facts established the trajectory?' },
    { id: 'basilar-lvo-imaging', objectiveId: 'review-neurology-basilar-lvo-imaging-selection-and-open-mimics', question: 'Which fixed imaging and supplied selection facts mattered, and which mimics remained open?' },
    { id: 'basilar-lvo-boundary', objectiveId: 'recognize-neurology-basilar-lvo-thrombectomy-escalation-boundary', question: 'Why did the supplied basilar-occlusion context require immediate qualified endovascular escalation without predicting one patient’s benefit?' },
    { id: 'basilar-lvo-ownership', objectiveId: 'activate-neurology-basilar-lvo-qualified-endovascular-and-airway-capable-ownership', question: 'Why must endovascular and airway-capable ownership proceed without waiting for a treatment decision or response?' },
    { id: 'basilar-lvo-later', objectiveId: 'review-neurology-basilar-lvo-strict-later-neurologic-and-airway-trajectory', question: 'What persisted in the strict later report, and what did current secretion handling not prove?' },
    { id: 'basilar-lvo-handoff', objectiveId: 'handoff-neurology-basilar-lvo-clocks-imaging-deterioration-and-unresolved-outcome', question: 'Which clocks, imaging, treatment decisions, deterioration risks, and outcomes remained unresolved at handoff?' },
  ] },
};
