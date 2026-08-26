/** Pediatric anaphylaxis escalation after supplied community first-line care. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const PEDIATRIC_ANAPHYLAXIS: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'pediatric-anaphylaxis', version: '0.1.0', maturity: 'draft',
    title: 'Pediatric anaphylaxis after first-line care', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 8, difficulty: 'intermediate', objectives: [
      {
        id: 'reconcile-pediatric-anaphylaxis-exposure-care-and-whole-child',
        statement: 'Connect the reported exposure, supplied first-line care, airway, breathing, circulation, and whole-child trajectory.',
        measure: 'The authored trajectory was reconciled without learner examination, monitoring, trigger confirmation, treatment verification, or delivery.',
      },
      {
        id: 'recognize-pediatric-anaphylaxis-persistent-abc-compromise',
        statement: 'Recognize persistent pediatric airway, breathing, and circulation compromise after supplied first-line care.',
        measure: 'The abrupt multisystem pattern triggered escalation without learner diagnosis, criteria scoring, asthma closure, or trigger proof.',
      },
      {
        id: 'activate-pediatric-anaphylaxis-qualified-repeat-first-line-and-resuscitation-ownership',
        statement: 'Activate qualified repeat first-line and pediatric resuscitation ownership without delay.',
        measure: 'Qualified escalation followed recognition without learner product, dose, route, device, access, oxygen, fluid, airway, or treatment selection or delivery.',
      },
      {
        id: 'review-pediatric-anaphylaxis-airway-asthma-causes-and-refractory-boundary',
        statement: 'After urgent escalation is active, review airway risk, asthma overlap, open causes, circulation, and the refractory boundary.',
        measure: 'Open safety work followed escalation without claiming learner examination, testing, diagnosis, airway care, or treatment.',
      },
      {
        id: 'review-pediatric-anaphylaxis-later-response',
        statement: 'After elapsed qualified care, compare the fixed whole-child response without declaring resolution.',
        measure: 'Partial improvement was separated from causal treatment effect, trigger proof, durable recovery, recurrence exclusion, or outcome.',
      },
      {
        id: 'handoff-pediatric-anaphylaxis-observation-allergy-and-caregiver-risk',
        statement: 'Hand off unresolved observation, airway, recurrence, allergy, caregiver, and escalation risk.',
        measure: 'The handoff preserved active risk without claiming a universal observation period, referral completion, disposition, prognosis, or outcome.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Royal Children\'s Hospital Melbourne. Clinical Practice Guideline: Anaphylaxis. Last updated October 2025; consulted 2026-08-26.',
        'Australasian Society of Clinical Immunology and Allergy. Guidelines: Acute Management of Anaphylaxis. Current web guideline significantly updated 2026; consulted 2026-08-26.',
        'National Institute for Health and Care Excellence. Anaphylaxis: assessment and referral after emergency treatment. NICE guideline NG258. Published 2026-05-27; last reviewed 2026-06-04.',
      ],
    },
    limitations: [
      'pediatric-anaphylaxis-presentation-care-and-response-are-authored',
      'pediatric-anaphylaxis-controls-reconcile-recognize-escalate-review-reassess-and-handoff-only',
      'no-live-pediatric-anaphylaxis-exam-dose-device-treatment-observation-or-disposition',
    ],
  },
  patient: {
    ageYears: 6, sex: 'male', heightCm: 115, weightKg: 20, asaClass: 4,
    diagnosis: 'Authored persistent pediatric anaphylaxis pattern after supplied first-line care',
    procedure: 'calm pediatric anaphylaxis recognition after first-line care, qualified escalation, reassessment, and caregiver handoff',
    comorbidities: ['Mild asthma', 'No prior anaphylaxis reported'],
    medications: ['Reliever inhaler as needed'], allergies: ['No confirmed allergy before this event'],
    fasting: 'Not established during acute care',
    baseline: {
      heartRateBpm: 148, meanArterialMmHg: 54, strokeVolumeMl: 24,
      hemoglobinGPerDl: 12.5, bloodVolumeMl: 1_600, coreTemperatureC: 36.7,
      arterialStiffness: 0.75, baroreflexGain: 1.15, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Hoarse one-to-two-word speech with persistent cough and supplied qualified airway and oxygen support',
    },
    respiratory: { profile: 'healthy-child' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 120, respiratoryRateBpm: 24,
      freshGasFlowLPerMin: 0.5, delivering: false,
    },
  },
  formulary: [],
  timeline: [
    {
      id: 'pediatric-anaphylaxis-presentation', type: 'narrative',
      target: 'pediatric-anaphylaxis-reassessment', atTick: 0, severity: 'critical',
      message: 'A 6-year-old boy weighs 20 kg and measures 115 cm. He has mild asthma but no reported prior anaphylaxis. A witnessed insect sting is reported at school at minute 0, but the species, allergen, and causal trigger remain unconfirmed. Within minutes he developed sudden persistent cough and diffuse wheeze, hoarse one-to-two-word speech, repeated vomiting, pallor, drowsiness, and poor perfusion. A fixed qualified minute-10 report supplies HR 148/min, RR 34/min, BP 78/42 mmHg (MAP 54), clean pulse-coherent SpO₂ 91% on unspecified supplied oxygen, temperature 36.7°C, pale cool skin, weak pulses, and capillary refill 4 seconds. He opens his eyes to his caregiver\'s voice, has spontaneous breathing, and has neither apnea nor pulse loss. These are supplied findings, not learner examination, monitoring, diagnosis, or treatment.',
    },
    {
      id: 'pediatric-anaphylaxis-qualified-record', type: 'narrative',
      target: 'pediatric-anaphylaxis-reassessment', atTick: 0, severity: 'critical',
      message: 'A qualified responder activated emergency help, kept the child lying flat and not standing or walking, supplied oxygen, and documented one appropriate first-line intramuscular epinephrine dose at minute 5. Product, concentration, dose, device, preparation, injection technique, and delivery details are intentionally not shown or learner-selected, verified, or administered. Five minutes later, airway, breathing, and circulation compromise persists. No hives, facial or tongue swelling, fever, infectious prodrome, abrupt choking, focal unilateral air-entry loss, trauma, seizure, or known medicine or food exposure is authored. These snapshots do not exclude anaphylaxis, asthma overlap, another trigger, or another dangerous cause. Qualified pediatric, emergency, nursing, pharmacy, airway-capable, and critical-care teams are available for immediate repeat first-line and resuscitation care, concurrent safety review, and refractory escalation.',
    },
    {
      id: 'pediatric-anaphylaxis-boundary', type: 'narrative',
      target: 'pediatric-anaphylaxis-reassessment-boundary', atTick: 0,
      severity: 'critical',
      message: 'Reconcile the reported exposure, supplied first-line care, persistent airway, breathing, and circulation compromise, and whole-child state; recognize the authored pediatric anaphylaxis pattern; activate qualified repeat first-line and resuscitation ownership; then review airway, asthma overlap, open causes, circulation, and the refractory boundary. Compare the strictly later fixed response before another elapsed observation, allergy, recurrence, caregiver, and escalation-risk handoff. The controls do not examine or monitor the child, score criteria, confirm a diagnosis or trigger, verify or select a product, concentration, dose, route, device, injection, access, oxygen interface or flow, fluid type, volume or rate, bronchodilator, antihistamine, corticosteroid, infusion, vasopressor, airway device or procedure, CPR, tryptase or allergy test, observation duration, prescription, training, referral, disposition, prognosis, recurrence, or outcome.',
    },
  ],
  debrief: { rubric: [
    { id: 'pediatric-anaphylaxis-trajectory', objectiveId: 'reconcile-pediatric-anaphylaxis-exposure-care-and-whole-child', question: 'Which reported exposure, supplied care, airway, breathing, circulation, and whole-child facts established the trajectory?' },
    { id: 'pediatric-anaphylaxis-recognition', objectiveId: 'recognize-pediatric-anaphylaxis-persistent-abc-compromise', question: 'Why did persistent airway, breathing, and circulation compromise require urgent anaphylaxis escalation despite absent skin findings?' },
    { id: 'pediatric-anaphylaxis-escalation', objectiveId: 'activate-pediatric-anaphylaxis-qualified-repeat-first-line-and-resuscitation-ownership', question: 'How was qualified repeat first-line and resuscitation ownership activated without learner drug, dose, device, route, access, oxygen, fluid, or treatment delivery?' },
    { id: 'pediatric-anaphylaxis-safety', objectiveId: 'review-pediatric-anaphylaxis-airway-asthma-causes-and-refractory-boundary', question: 'Which airway, asthma-overlap, circulation, cause, recurrence, and refractory-risk work remained active after escalation?' },
    { id: 'pediatric-anaphylaxis-later', objectiveId: 'review-pediatric-anaphylaxis-later-response', question: 'What changed in the fixed minute-18 report, and why did partial improvement not prove resolution or treatment effect?' },
    { id: 'pediatric-anaphylaxis-handoff', objectiveId: 'handoff-pediatric-anaphylaxis-observation-allergy-and-caregiver-risk', question: 'Which observation, airway, recurrence, allergy, caregiver, escalation, and ownership risks required handoff?' },
  ] },
};
