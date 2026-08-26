/** Overt focal motor status after a focal-to-bilateral convulsion becomes less dramatic. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const FOCAL_MOTOR_STATUS_EPILEPTICUS_ESCALATION: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'focal-motor-status-epilepticus-escalation', version: '0.1.0', maturity: 'draft',
    title: 'Focal motor status epilepticus escalation', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 7, difficulty: 'advanced', objectives: [
      { id: 'reconcile-neurology-focal-motor-status-clock-semiology-recovery-and-whole-patient', statement: 'Reconcile the supplied clock, evolving visible motor pattern, recovery, physiology, and whole-patient state.', measure: 'The fixed focal-to-bilateral evolution, continuing unilateral clonus, absent meaningful recovery, breathing, circulation, oxygenation, glucose, and prior-care record were connected without learner history, examination, monitoring, testing, or treatment.' },
      { id: 'recognize-neurology-focal-motor-status-despite-reduced-convulsions', statement: 'Recognize overt focal motor status despite reduced convulsive movement.', measure: 'Continuing stereotyped visible focal clonus within one prolonged evolving event prompted status recognition without a universal focal-status clock, EEG inference, or diagnosis from impaired recovery alone.' },
      { id: 'activate-neurology-focal-motor-status-qualified-seizure-and-airway-ownership', statement: 'Activate qualified seizure, resuscitation, and airway-capable ownership.', measure: 'Named ownership followed recognition without learner drug, dose, route, access, oxygen, airway-device, monitoring, or procedure controls.' },
      { id: 'review-neurology-focal-motor-status-airway-glucose-causes-and-injury-boundary', statement: 'Review airway, glucose, causes, injury risk, and the escalation boundary in parallel.', measure: 'The supplied physiology and glucose were reviewed while structural, vascular, infectious, immune, toxic, metabolic, medication-related, epilepsy-related, and nonepileptic alternatives remained open.' },
      { id: 'review-neurology-focal-motor-status-strict-later-visible-motor-trajectory', statement: 'At a strict later report, compare visible motor activity, recovery, airway, and systemic trajectory.', measure: 'Persistent visible focal clonus and absent meaningful recovery were reviewed without claiming EEG findings, treatment effect, injury, or a nonconvulsive state.' },
      { id: 'handoff-neurology-focal-motor-status-recovery-cause-and-active-risk', statement: 'After another elapsed interval, hand off active visible seizure, recovery, cause, and recurrence risk.', measure: 'The handoff preserved qualified ownership and unresolved seizure control, airway safety, cause, EEG need, rescue choice, disposition, prognosis, and outcome.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Trinka E, Cock H, Hesdorffer D, et al. A definition and classification of status epilepticus. Epilepsia. 2015;56:1515-1523. doi:10.1111/epi.13121.',
        'Smith MD, Sampson CS, Wall SP, et al. Clinical Policy: Critical Issues in the Management of Adult Patients Presenting to the Emergency Department With Seizures. Ann Emerg Med. 2024;84:e1-e6. doi:10.1016/j.annemergmed.2024.02.018.',
        'Glauser T, Shinnar S, Gloss D, et al. Evidence-Based Guideline: Treatment of Convulsive Status Epilepticus in Children and Adults. Epilepsy Curr. 2016;16:48-61. doi:10.5698/1535-7597-16.1.48.',
      ],
    },
    limitations: [
      'focal-motor-status-clock-semiology-care-and-later-state-are-authored',
      'focal-motor-status-controls-reconcile-recognize-activate-review-reassess-and-handoff-only',
      'no-live-seizure-exam-monitor-test-eeg-drug-dose-airway-procedure-disposition-or-outcome',
    ],
  },
  patient: {
    ageYears: 58, sex: 'female', heightCm: 166, weightKg: 68, asaClass: 4,
    diagnosis: 'Authored prolonged evolving seizure with continuing overt left face and arm clonus',
    procedure: 'calm focal motor status recognition, qualified escalation, strict later review, and active-risk handoff',
    comorbidities: ['Previously independent'], medications: ['Qualified initial rescue care documented'],
    allergies: ['No known drug allergies'], fasting: 'Not established during active seizure care',
    baseline: { heartRateBpm: 118, meanArterialMmHg: 97, strokeVolumeMl: 65,
      hemoglobinGPerDl: 13.1, bloodVolumeMl: 4_700, coreTemperatureC: 37.2,
      arterialStiffness: 1.1, baroreflexGain: 0.8, fixedStrokeVolume: false },
    airway: { difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Spontaneous chest rise and a present central pulse are authored at the initial snapshot' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 430, respiratoryRateBpm: 22,
      freshGasFlowLPerMin: 0.5, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'focal-motor-status-epilepticus-escalation-presentation', type: 'narrative',
      target: 'focal-motor-status-epilepticus-escalation-reassessment', atTick: 0,
      severity: 'critical', message: 'A previously independent 58-year-old woman has had one continuous evolving event for 18 minutes. Witnesses describe initial rhythmic left face and arm clonus that progressed to bilateral convulsions. After supplied qualified initial rescue care, the bilateral movements became less dramatic, but continuous stereotyped left face and arm clonus remains plainly visible and meaningful responsiveness has not returned. The supplied record names no product, dose, route, access, preparation, verification, or delivery detail. Temperature is 37.2°C, HR 118/min in sinus rhythm, RR 22/min between visible motor bursts, BP 132/80 mmHg (MAP 97), pulse-coherent room-air SpO2 96%, and supplied glucose 104 mg/dL. A central pulse, spontaneous chest rise, warm perfusion, and 2-second capillary refill are reported.' },
    { id: 'focal-motor-status-epilepticus-escalation-boundary', type: 'narrative',
      target: 'focal-motor-status-epilepticus-escalation-reassessment-boundary', atTick: 0,
      severity: 'warning', message: 'No pulse loss, hypotension, cyanosis, trauma, fever, known toxin exposure, reported medication omission, or pre-event focal deficit is authored, but these are snapshots. Structural, vascular, infectious, immune, toxic, metabolic, medication-related, epilepsy-related, and nonepileptic alternatives remain open. Reconcile the supplied clock, motor evolution, recovery, and whole patient; recognize that less dramatic movement is not seizure resolution while overt focal clonus continues; activate qualified seizure, resuscitation, and airway-capable ownership; and review airway, glucose, causes, injury risk, and the escalation boundary in parallel. At a strict later fixed minute-26 report, visible left face and arm clonus continues without meaningful recovery; T 37.3°C, HR 122/min, RR 23/min between visible motor bursts, BP 128/78 mmHg (MAP 95), pulse-coherent room-air SpO2 95%, spontaneous chest rise, central pulse, and warm perfusion persist. No EEG result, causal diagnosis, treatment effect, movement cessation, electrographic state, or injury is authored. After another elapsed interval, hand off active visible seizure, recovery, airway, cause, recurrence, rescue-choice, EEG-need, and outcome uncertainty. No history, examination, seizure timing, monitoring, glucose acquisition, drug, dose, route, access, oxygen, airway device, EEG, imaging, laboratory test, procedure, treatment, disposition, prognosis, or outcome is learner controlled, predicted, or reported.' },
  ],
  debrief: { rubric: [
    { id: 'focal-motor-status-trajectory', objectiveId: 'reconcile-neurology-focal-motor-status-clock-semiology-recovery-and-whole-patient', question: 'Which clock, motor-evolution, recovery, physiology, glucose, and prior-care facts established the trajectory?' },
    { id: 'focal-motor-status-recognition', objectiveId: 'recognize-neurology-focal-motor-status-despite-reduced-convulsions', question: 'Why did reduced bilateral movement not establish seizure resolution while visible focal clonus continued?' },
    { id: 'focal-motor-status-ownership', objectiveId: 'activate-neurology-focal-motor-status-qualified-seizure-and-airway-ownership', question: 'Why was qualified seizure, resuscitation, and airway-capable ownership activated immediately?' },
    { id: 'focal-motor-status-safety', objectiveId: 'review-neurology-focal-motor-status-airway-glucose-causes-and-injury-boundary', question: 'Which airway, glucose, cause, injury-risk, and escalation work remained active in parallel?' },
    { id: 'focal-motor-status-later', objectiveId: 'review-neurology-focal-motor-status-strict-later-visible-motor-trajectory', question: 'What remained visibly active at minute 26, and which response and EEG questions stayed open?' },
    { id: 'focal-motor-status-handoff', objectiveId: 'handoff-neurology-focal-motor-status-recovery-cause-and-active-risk', question: 'Which seizure, recovery, airway, cause, recurrence, rescue, EEG, and outcome risks required handoff?' },
  ] },
};
