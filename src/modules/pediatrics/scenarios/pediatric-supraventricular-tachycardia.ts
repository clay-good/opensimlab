/** Pediatric supraventricular tachycardia recognition with supplied perfusion compromise. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const PEDIATRIC_SUPRAVENTRICULAR_TACHYCARDIA: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'pediatric-supraventricular-tachycardia', version: '0.1.0', maturity: 'preview',
    title: 'Pediatric supraventricular tachycardia with perfusion compromise', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 8, difficulty: 'intermediate', objectives: [
      {
        id: 'reconcile-pediatric-svt-clock-rhythm-and-whole-child',
        statement: 'Connect the abrupt symptom clock, fixed rhythm description, circulation, breathing, and whole-child state.',
        measure: 'The authored trajectory was reconciled without learner examination, pulse assessment, monitoring, ECG acquisition or interpretation, diagnosis, or treatment.',
      },
      {
        id: 'recognize-pediatric-svt-with-perfusion-compromise',
        statement: 'Recognize probable pediatric SVT with supplied perfusion compromise despite a measurable blood pressure.',
        measure: 'Rhythm and whole-child perfusion findings triggered escalation without using rate or blood pressure alone or claiming a mechanism diagnosis.',
      },
      {
        id: 'activate-pediatric-svt-qualified-rhythm-care-and-resuscitation-ownership',
        statement: 'Activate qualified pediatric rhythm-care and resuscitation ownership without delay.',
        measure: 'Qualified escalation followed recognition without learner vagal maneuver, drug, dose, route, access, oxygen, sedation, device, energy, cardioversion, or treatment selection or delivery.',
      },
      {
        id: 'review-pediatric-svt-support-causes-heart-failure-and-deterioration-boundary',
        statement: 'After escalation is active, review support, open causes, heart-failure risk, and the deterioration boundary.',
        measure: 'Open safety work followed escalation without claiming learner examination, testing, diagnosis, treatment, mechanism, or cause exclusion.',
      },
      {
        id: 'review-pediatric-svt-later-response',
        statement: 'After elapsed qualified care, compare the fixed rhythm and whole-child response without declaring resolution.',
        measure: 'Improvement was separated from treatment modality or effect, durable rhythm control, complete recovery, recurrence exclusion, or outcome.',
      },
      {
        id: 'handoff-pediatric-svt-recurrence-cardiology-and-caregiver-risk',
        statement: 'Hand off unresolved recurrence, cardiology, cause, caregiver, and deterioration risk.',
        measure: 'The handoff preserved active risk without claiming mechanism, cause, disposition, prognosis, durable control, or outcome.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Lasa JJ, Dhillon GS, Duff JP, et al. Part 8: Pediatric Advanced Life Support: 2025 AHA/AAP Guidelines for CPR and ECC. Circulation. 2025;152(suppl 2):S479-S537. doi:10.1161/CIR.0000000000001368.',
        'American Heart Association and American Academy of Pediatrics. Pediatric Tachyarrhythmia With a Pulse Algorithm. Figure 7. 2025.',
        'Resuscitation Council UK. Paediatric arrhythmias. Guidelines 2025; current consolidated resource February 2026.',
      ],
    },
    limitations: [
      'pediatric-svt-rhythm-perfusion-care-and-response-are-authored',
      'pediatric-svt-controls-reconcile-recognize-escalate-review-reassess-and-handoff-only',
      'no-live-pediatric-svt-exam-ecg-drug-device-cardioversion-treatment-or-disposition',
    ],
  },
  patient: {
    ageYears: 6, sex: 'male', heightCm: 115, weightKg: 20, asaClass: 4,
    diagnosis: 'Authored probable pediatric supraventricular tachycardia pattern with perfusion compromise',
    procedure: 'calm pediatric rhythm and whole-child recognition, qualified escalation, serial reassessment, and caregiver-centered handoff',
    comorbidities: ['Previously well', 'No known congenital heart disease or prior SVT'],
    medications: ['None reported'], allergies: ['No known drug allergies'],
    fasting: 'Not established during acute care',
    baseline: {
      heartRateBpm: 210, meanArterialMmHg: 72, strokeVolumeMl: 28,
      hemoglobinGPerDl: 12.5, bloodVolumeMl: 1_600, coreTemperatureC: 37,
      arterialStiffness: 0.75, baroreflexGain: 1.15, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Awake and answering appropriately with spontaneous breathing and no fixed airway concern',
    },
    respiratory: { profile: 'healthy-child' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 120, respiratoryRateBpm: 28,
      freshGasFlowLPerMin: 0.5, delivering: false,
    },
  },
  formulary: [],
  timeline: [
    {
      id: 'pediatric-svt-fixed-rhythm', type: 'rhythm-change', target: 'svt',
      atTick: 0, severity: 'critical',
      message: 'The teaching monitor shows a fixed very regular narrow-complex tachycardia at 210/min.',
    },
    {
      id: 'pediatric-svt-presentation', type: 'narrative',
      target: 'pediatric-supraventricular-tachycardia-reassessment', atTick: 0,
      severity: 'critical',
      message: 'A previously well 6-year-old boy weighs 20 kg and measures 115 cm. While seated at school 45 minutes ago, he abruptly reported a pounding heartbeat and dizziness. A fixed qualified ECG report describes a very regular narrow-complex rhythm at 210/min, QRS 70 ms, nonvariable RR intervals, and no clearly visible P waves: a probable SVT pattern without one established mechanism. A fixed whole-child report supplies temperature 37.0°C, HR and palpable central pulse 210/min, RR 28/min, BP 96/60 mmHg (MAP 72), and clean room-air SpO₂ 98%. He is awake, answers appropriately, and is anxious and dizzy, with pale cool distal extremities, capillary refill 4 seconds, and weak peripheral pulses compared with the central pulse. He breathes spontaneously and has neither syncope nor pulse loss. These are supplied findings, not learner examination, pulse assessment, monitoring, ECG acquisition or interpretation, diagnosis, or treatment.',
    },
    {
      id: 'pediatric-svt-context', type: 'narrative',
      target: 'pediatric-supraventricular-tachycardia-reassessment', atTick: 0,
      severity: 'critical',
      message: 'No prior SVT, known congenital heart disease, fever, infectious prodrome, vomiting or diarrhea, poor intake, pain, exertion, stimulant or medicine exposure, focal neurological finding, or respiratory distress is authored. These are limited snapshots, not exclusions of another rhythm, pre-excitation, heart disease, heart failure, a contributor, or another dangerous cause. Qualified pediatric rhythm-care, resuscitation, airway-capable, nursing, pharmacy, and cardiology teams are available immediately.',
    },
    {
      id: 'pediatric-svt-boundary', type: 'narrative',
      target: 'pediatric-supraventricular-tachycardia-reassessment-boundary', atTick: 0,
      severity: 'critical',
      message: 'Reconcile the abrupt clock, fixed rhythm, circulation, breathing, and whole-child state; recognize probable pediatric SVT with perfusion compromise despite a measurable blood pressure; activate qualified rhythm-care and resuscitation ownership without delay; then review support, open causes, heart-failure risk, and deterioration. After a strict elapsed gate, a fixed qualified minute-12 report after unspecified acute rhythm care supplies sinus rhythm 118/min, a visible P wave before each QRS, QRS 70 ms, BP 102/66 mmHg (MAP 78), RR 22/min, room-air SpO₂ 99%, temperature 37.0°C, alert conversation, easing dizziness, warm extremities, refill 2 seconds, and stronger peripheral pulses, with no recurrent tachycardia observed in this short window. Compare that response before another elapsed recurrence, cardiology, cause, caregiver, and risk handoff. The controls do not examine or palpate the child; acquire or interpret monitoring or an ECG; establish a rhythm mechanism or cause; perform a vagal maneuver; choose or deliver access, oxygen, a drug, concentration, dose, route, flush, sedation, pad, synchronization, energy, cardioversion, procedure, refractory therapy, or other treatment; acquire or interpret laboratory testing, imaging, or echocardiography; choose observation or disposition; predict recurrence or prognosis; or report an outcome. The later report does not identify a treatment modality or prove treatment effect, durable rhythm control, complete recovery, mechanism, cause, recurrence exclusion, disposition, or outcome.',
    },
  ],
  debrief: { rubric: [
    { id: 'pediatric-svt-trajectory', objectiveId: 'reconcile-pediatric-svt-clock-rhythm-and-whole-child', question: 'Which clock, rhythm, breathing, circulation, and whole-child facts established the trajectory?' },
    { id: 'pediatric-svt-recognition', objectiveId: 'recognize-pediatric-svt-with-perfusion-compromise', question: 'Why did the fixed rhythm and perfusion findings require escalation despite a measurable blood pressure?' },
    { id: 'pediatric-svt-escalation', objectiveId: 'activate-pediatric-svt-qualified-rhythm-care-and-resuscitation-ownership', question: 'How was qualified pediatric rhythm-care and resuscitation ownership activated without learner treatment or device controls?' },
    { id: 'pediatric-svt-safety', objectiveId: 'review-pediatric-svt-support-causes-heart-failure-and-deterioration-boundary', question: 'Which support, cause, heart-failure, and deterioration work remained active after escalation?' },
    { id: 'pediatric-svt-response', objectiveId: 'review-pediatric-svt-later-response', question: 'What changed in the fixed minute-12 report, and what did that response not prove?' },
    { id: 'pediatric-svt-handoff', objectiveId: 'handoff-pediatric-svt-recurrence-cardiology-and-caregiver-risk', question: 'Which recurrence, cardiology, cause, caregiver, and deterioration risks required handoff?' },
  ] },
};
