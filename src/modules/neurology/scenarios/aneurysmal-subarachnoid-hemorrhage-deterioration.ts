/** Aneurysmal SAH with strict-later focal neurological deterioration. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const ANEURYSMAL_SUBARACHNOID_HEMORRHAGE_DETERIORATION: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'aneurysmal-subarachnoid-hemorrhage-deterioration', version: '0.1.0', maturity: 'preview',
    title: 'Aneurysmal SAH delayed deterioration', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 8, difficulty: 'advanced', objectives: [
      { id: 'reconcile-neurology-asah-day-aneurysm-status-new-deficit-and-whole-patient', statement: 'Reconcile the aSAH day, secured-aneurysm record, new deficit clock, physiology, and whole-patient state.', measure: 'The fixed day-7 context, earlier baseline, new focal findings, breathing, circulation, glucose, sodium, and aneurysm record were connected without learner history, examination, testing, diagnosis, or treatment.' },
      { id: 'review-neurology-asah-rebleeding-hydrocephalus-seizure-metabolic-and-perfusion-evidence', statement: 'Review the supplied rebleeding, hydrocephalus, seizure, metabolic, vascular, and perfusion evidence.', measure: 'Fixed CT, CTA, CTP, glucose, sodium, and clinical snapshots were integrated while rebleeding, hydrocephalus, seizure, systemic, procedure-related, and other ischemic alternatives remained open.' },
      { id: 'recognize-neurology-asah-possible-dci-without-imaging-alone', statement: 'Recognize possible delayed cerebral ischemia without equating imaging vasospasm with DCI.', measure: 'The new focal deterioration and convergent supplied evidence prompted a possible-DCI escalation boundary without learner diagnosis, scoring, imaging interpretation, or waiting for a research-definition clock.' },
      { id: 'activate-neurology-asah-qualified-neurocritical-neurovascular-and-rescue-ownership', statement: 'Activate qualified neurocritical, neurovascular, and rescue-capable ownership.', measure: 'Named ownership followed recognition without learner drug, fluid, blood-pressure, airway, angiography, device, procedure, or treatment controls.' },
      { id: 'review-neurology-asah-strict-later-neurologic-and-perfusion-trajectory', statement: 'At a strict later report, compare neurological, airway, perfusion, imaging, and EEG snapshots.', measure: 'Increasing drowsiness and motor deficit were reconciled with fixed repeat CT and captured-interval EEG reports without treating negative snapshots as permanent exclusions or claiming a treatment response.' },
      { id: 'handoff-neurology-asah-dci-aneurysm-recurrence-and-active-risk', statement: 'After another elapsed interval, hand off possible DCI, aneurysm, recurrence, alternatives, and active risk.', measure: 'The handoff preserved qualified ownership and unresolved diagnosis, rescue planning, recurrence, disposition, prognosis, and outcome.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Hoh BL, Ko NU, Amin-Hanjani S, et al. 2023 Guideline for the Management of Patients With Aneurysmal Subarachnoid Hemorrhage. Stroke. 2023;54:e314-e370. doi:10.1161/STR.0000000000000436.',
        'Vergouwen MDI, Vermeulen M, van Gijn J, et al. Definition of delayed cerebral ischemia after aneurysmal subarachnoid hemorrhage as an outcome event in clinical trials and observational studies. Stroke. 2010;41:2391-2395. doi:10.1161/STROKEAHA.110.589275.',
      ],
    },
    limitations: [
      'asah-deterioration-clock-neurologic-imaging-care-and-later-state-are-authored',
      'asah-deterioration-controls-reconcile-review-recognize-activate-reassess-and-handoff-only',
      'no-live-asah-exam-score-imaging-eeg-drug-hemodynamic-airway-endovascular-procedure-disposition-or-outcome',
    ],
  },
  patient: {
    ageYears: 56, sex: 'female', heightCm: 164, weightKg: 62, asaClass: 4,
    diagnosis: 'Authored day-7 aneurysmal subarachnoid hemorrhage with new focal deterioration and possible delayed cerebral ischemia',
    procedure: 'calm delayed neurological deterioration review after aneurysmal subarachnoid hemorrhage, qualified escalation, and active-risk handoff',
    comorbidities: ['Previously independent'], medications: ['Scheduled qualified aSAH care documented'],
    allergies: ['No known drug allergies'], fasting: 'Not established during acute neurological reassessment',
    baseline: { heartRateBpm: 82, meanArterialMmHg: 101, strokeVolumeMl: 65,
      hemoglobinGPerDl: 12.8, bloodVolumeMl: 4_400, coreTemperatureC: 37.1,
      arterialStiffness: 1.1, baroreflexGain: 0.8, fixedStrokeVolume: false },
    airway: { difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Spontaneously breathing with a present cough at the initial fixed snapshot' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 410, respiratoryRateBpm: 16,
      freshGasFlowLPerMin: 0.5, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'aneurysmal-subarachnoid-hemorrhage-deterioration-presentation', type: 'narrative',
      target: 'aneurysmal-subarachnoid-hemorrhage-deterioration-reassessment', atTick: 0,
      severity: 'critical', message: 'A previously independent 56-year-old woman is on day 7 after aneurysmal subarachnoid hemorrhage from a ruptured right middle-cerebral-artery bifurcation aneurysm. An experienced-team record reports coil treatment on day 1 with no residual filling on fixed postprocedure angiography and uninterrupted scheduled enteral nimodipine care; no product, dose, route, verification, prescription, preparation, or administration is learner controlled. This morning she was alert, fluent, and without a focal deficit. Thirty-five minutes ago she developed slowed responses, left visual neglect, mild left facial weakness, and left arm drift. Temperature is 37.1°C, HR 82/min in sinus rhythm, RR 16/min, BP 144/80 mmHg (MAP 101), room-air SpO₂ 98%, supplied glucose 106 mg/dL, and supplied sodium 139 mmol/L. She breathes spontaneously with a present cough and no hypotension.' },
    { id: 'aneurysmal-subarachnoid-hemorrhage-deterioration-boundary', type: 'narrative',
      target: 'aneurysmal-subarachnoid-hemorrhage-deterioration-reassessment-boundary', atTick: 0,
      severity: 'warning', message: 'No witnessed convulsion, new severe headache, vomiting, trauma, hypoglycemia, fever, or newly reported sedating-medicine exposure is authored, but these are snapshots and seizure, rebleeding, hydrocephalus, metabolic or systemic disturbance, procedure-related or other ischemia, aneurysm recurrence, and deterioration remain open. Fixed noncontrast CT reports no rebleeding, acute hydrocephalus, or established new infarct. Fixed CTA reports new moderate-to-severe right M1 and proximal M2 narrowing compared with admission. Fixed CTP reports delayed right-MCA perfusion without a supplied established core. Reconcile the day, aneurysm record, new-deficit clock, physiology, and whole patient; review supplied alternative-cause, vascular, and perfusion evidence; recognize possible delayed cerebral ischemia without diagnosing it from imaging alone or waiting for a one-hour research-definition clock; then activate qualified neurocritical, neurovascular, and rescue-capable ownership. At a strict later report 80 minutes after deficit onset, she is increasingly drowsy, opens her eyes to voice, follows simple commands, has persistent left neglect and facial weakness, and her left arm falls to the bed. Speech remains understandable but slowed. Temperature is 37.2°C, HR 86/min, RR 18/min, BP 148/82 mmHg (MAP 104), and room-air SpO₂ 97%; spontaneous breathing and cough remain present. Fixed repeat CT still reports no rebleeding, hydrocephalus, or established infarct. A fixed qualified continuous-EEG interval reports no electrographic seizure during the captured window, not a permanent exclusion. Qualified ownership is active. After another elapsed interval, hand off possible DCI, aneurysm status, open alternatives, rescue planning, recurrence, and unresolved active risk. No history, examination, score, test or image acquisition or interpretation, diagnosis, drug, dose, route, fluid, pressure target, oxygen or airway device, angiography, endovascular therapy, procedure, transfer mechanics, treatment, disposition, prognosis, response, infarction, durable neurological state, or outcome is learner controlled, predicted, or reported.' },
  ],
  debrief: { rubric: [
    { id: 'asah-reconcile', objectiveId: 'reconcile-neurology-asah-day-aneurysm-status-new-deficit-and-whole-patient', question: 'Which day, secured-aneurysm, earlier-baseline, new-deficit, physiology, and whole-patient facts established this trajectory?' },
    { id: 'asah-evidence', objectiveId: 'review-neurology-asah-rebleeding-hydrocephalus-seizure-metabolic-and-perfusion-evidence', question: 'Which supplied evidence narrowed immediate threats while leaving rebleeding, hydrocephalus, seizure, systemic, and ischemic alternatives open?' },
    { id: 'asah-recognize', objectiveId: 'recognize-neurology-asah-possible-dci-without-imaging-alone', question: 'Why did the clinical change require possible-DCI escalation without equating angiographic narrowing with DCI?' },
    { id: 'asah-ownership', objectiveId: 'activate-neurology-asah-qualified-neurocritical-neurovascular-and-rescue-ownership', question: 'Why was qualified neurocritical, neurovascular, and rescue-capable ownership activated immediately?' },
    { id: 'asah-later', objectiveId: 'review-neurology-asah-strict-later-neurologic-and-perfusion-trajectory', question: 'Which strict-later neurological and supplied-test changes preserved urgency and diagnostic uncertainty?' },
    { id: 'asah-handoff', objectiveId: 'handoff-neurology-asah-dci-aneurysm-recurrence-and-active-risk', question: 'Which possible DCI, aneurysm, alternative-cause, recurrence, rescue, and outcome questions remained unresolved at handoff?' },
  ] },
};
