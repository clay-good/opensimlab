/** Pediatric febrile-seizure recovery and serious-illness reassessment. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const PEDIATRIC_FEBRILE_SEIZURE: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'pediatric-febrile-seizure', version: '0.1.0', maturity: 'draft',
    title: 'Pediatric febrile seizure', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 8, difficulty: 'introductory', objectives: [
      {
        id: 'reconcile-pediatric-febrile-seizure-event-recovery-and-fever',
        statement: 'Connect the supplied event, recovery, fever, breathing, circulation, and whole-child findings.',
        measure: 'The authored event and whole-child trajectory were reconciled without learner examination, seizure timing, testing, diagnosis, or treatment.',
      },
      {
        id: 'recognize-pediatric-febrile-seizure-pattern-and-danger-boundary',
        statement: 'Recognize a febrile-seizure pattern with simple features to date while keeping dangerous alternatives open.',
        measure: 'The current pattern and danger boundary were recognized without claiming a confirmed simple seizure, benign illness, or serious-infection exclusion.',
      },
      {
        id: 'activate-pediatric-febrile-seizure-qualified-care-ownership',
        statement: 'Activate experienced fever-source, serious-illness, neurological, and supportive-care ownership.',
        measure: 'Qualified care was activated without learner examination, testing, drug, dose, route, device, procedure, treatment, or disposition selection.',
      },
      {
        id: 'review-pediatric-febrile-seizure-infection-recurrence-and-alternatives',
        statement: 'Review infection, recovery, complex features, recurrence, alternatives, caregiver safety, and escalation in parallel.',
        measure: 'Open illness and recurrence work continued without learner diagnostic closure, rescue-plan prescribing, treatment, or communication-performance claims.',
      },
      {
        id: 'review-pediatric-febrile-seizure-later-response',
        statement: 'After elapsed qualified review, compare the fixed recovery and fever trajectory without declaring the illness resolved.',
        measure: 'Improvement was separated from treatment effect, confirmed simple classification, CNS-infection exclusion, durable recovery, and recurrence exclusion.',
      },
      {
        id: 'handoff-pediatric-febrile-seizure-active-risk',
        statement: 'Hand off fever source, serious-illness guards, recovery, recurrence, caregiver safety, and named ownership.',
        measure: 'The handoff preserved active risk without claiming diagnosis, disposition, prognosis, illness resolution, or outcome.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Royal Children\'s Hospital Melbourne. Clinical Practice Guideline: Febrile seizure. Last updated February 2026; consulted 2026-08-26.',
        'National Institute for Health and Care Excellence. Fever in under 5s: assessment and initial management. NICE guideline NG143. Published 2019; last updated 2021; last reviewed 2025. Recommendations 1.2, 1.5.12-1.5.15, 1.6.1-1.6.6, and 1.7.2-1.7.3.',
        'World Health Organization. Paediatric emergency triage, assessment and treatment: care of critically-ill children. Updated guideline. 2016. ISBN 978-92-4-151021-9. Section 3.3.4 and Recommendation 3.4.',
      ],
    },
    limitations: [
      'pediatric-febrile-seizure-presentation-care-and-response-are-authored',
      'pediatric-febrile-seizure-controls-reconcile-recognize-coordinate-review-reassess-and-handoff-only',
      'no-live-pediatric-febrile-seizure-exam-test-drug-airway-treatment-or-disposition',
    ],
  },
  patient: {
    ageYears: 2, sex: 'male', heightCm: 88, weightKg: 12, asaClass: 3,
    diagnosis: 'Authored febrile-seizure pattern with simple features to date and an open fever source',
    procedure: 'calm pediatric febrile seizure recognition, recovery reassessment, red-flag review, and caregiver-centered handoff',
    comorbidities: ['Previously well and reported developmentally typical'], medications: ['None reported; no antibiotics'],
    allergies: ['No known drug allergies'], fasting: 'Mildly reduced drinking during 12 hours of fever',
    baseline: {
      heartRateBpm: 150, meanArterialMmHg: 70, strokeVolumeMl: 20,
      hemoglobinGPerDl: 12.5, bloodVolumeMl: 960, coreTemperatureC: 39,
      arterialStiffness: 0.72, baroreflexGain: 1.02, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Sleepy and clingy after a stopped seizure, opening eyes to caregiver voice with an appropriate cry and spontaneous breathing',
    },
    respiratory: { profile: 'healthy-child' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 84, respiratoryRateBpm: 30,
      freshGasFlowLPerMin: 0.5, delivering: false,
    },
  },
  formulary: [],
  timeline: [
    {
      id: 'pediatric-febrile-seizure-presentation', type: 'narrative',
      target: 'pediatric-febrile-seizure-reassessment', atTick: 0, severity: 'warning',
      message: 'A previously well, reportedly developmentally typical 2-year-old boy weighs 12 kg and measures 88 cm. Age-appropriate Hib and pneumococcal immunizations are reported current. After 12 hours of fever, rhinorrhea, and mildly reduced drinking, his caregiver witnessed a first bilateral generalized convulsion lasting about 3 minutes. It stopped spontaneously before the learner surface opened; no rescue medicine was given. No focal onset, asymmetry, or recurrence is reported so far. He is sleepy and clingy but opens his eyes to caregiver voice, makes eye contact, cries appropriately, and moves and reaches symmetrically while breathing spontaneously. Temperature is 39.0°C, HR 150/min, RR 30/min, BP 94/58 mmHg (MAP 70), clean pulse-coherent room-air SpO₂ 98%, with warm extremities, normal-volume pulses, and capillary refill 2 seconds. No routine glucose or other test is supplied.',
    },
    {
      id: 'pediatric-febrile-seizure-qualified-record', type: 'narrative',
      target: 'pediatric-febrile-seizure-reassessment', atTick: 0, severity: 'warning',
      message: 'A supplied experienced-team assessment calls this a febrile-seizure pattern with simple features to date, not a confirmed simple or benign event. No nonblanching rash, meningism, bulging fontanelle, persistent focal deficit, respiratory distress, shock, trauma, known ingestion, prior afebrile seizure, or developmental regression is authored, but these are fixed snapshots. The fever source, CNS infection, sepsis, toxic or metabolic provocation, recurrence during this illness, and other dangerous alternatives remain open. Experienced pediatric, nursing, infection, neurological, airway-capable, and safeguarding teams are available to own examination, fever-source and serious-illness review, locally indicated testing and treatment, recovery and recurrence surveillance, caregiver education, and escalation. The learner selects or delivers none of them.',
    },
    {
      id: 'pediatric-febrile-seizure-boundary', type: 'narrative',
      target: 'pediatric-febrile-seizure-reassessment-boundary', atTick: 0, severity: 'warning',
      message: 'Reconcile the supplied event, current recovery, fever, breathing, circulation, and whole-child state; recognize a febrile-seizure pattern with simple features to date while dangerous causes remain open; then keep qualified care active in parallel with infection, recurrence, complex-feature, alternative-cause, caregiver-safety, and escalation review before a strictly later report and handoff. Antipyretics may be considered by qualified teams for distress, but they do not prevent febrile seizures; routine prophylactic antiseizure medicine is not modeled. The controls do not examine, measure temperature, time a seizure, acquire or interpret glucose, urine, blood, culture, lumbar-puncture, EEG, ECG, or imaging findings, diagnose the seizure or fever source, choose or deliver an antipyretic, antimicrobial, antiseizure or rescue medicine, fluid, oxygen, dose, concentration, route, access, device, airway maneuver, procedure, or treatment, assess communication performance, determine disposition or prognosis, or predict CNS-infection exclusion, recurrence, epilepsy, durable recovery, illness resolution, or outcome.',
    },
  ],
  debrief: { rubric: [
    { id: 'pediatric-febrile-seizure-trajectory', objectiveId: 'reconcile-pediatric-febrile-seizure-event-recovery-and-fever', question: 'Which supplied event, recovery, fever, breathing, circulation, and whole-child facts established the trajectory?' },
    { id: 'pediatric-febrile-seizure-recognition', objectiveId: 'recognize-pediatric-febrile-seizure-pattern-and-danger-boundary', question: 'Which features fit a febrile-seizure pattern to date, and why was neither a confirmed simple seizure nor benign illness established?' },
    { id: 'pediatric-febrile-seizure-care', objectiveId: 'activate-pediatric-febrile-seizure-qualified-care-ownership', question: 'How was qualified fever-source, serious-illness, neurological, and supportive-care ownership activated without a learner test, drug, dose, route, or treatment?' },
    { id: 'pediatric-febrile-seizure-safety', objectiveId: 'review-pediatric-febrile-seizure-infection-recurrence-and-alternatives', question: 'Which infection, recovery, complex-feature, recurrence, alternative-cause, caregiver-safety, and escalation work remained open?' },
    { id: 'pediatric-febrile-seizure-later', objectiveId: 'review-pediatric-febrile-seizure-later-response', question: 'What improved in the fixed minute-30 report, and what remained unproved?' },
    { id: 'pediatric-febrile-seizure-handoff', objectiveId: 'handoff-pediatric-febrile-seizure-active-risk', question: 'Which fever-source, serious-illness, recovery, recurrence, caregiver-safety, and ownership work required handoff?' },
  ] },
};
