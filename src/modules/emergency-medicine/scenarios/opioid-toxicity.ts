/** Bounded adult opioid-toxicity pathway with respiratory depression and recurrence. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const OPIOID_TOXICITY: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'opioid-toxicity', version: '0.1.0', maturity: 'draft',
    title: 'Opioid toxicity', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 9, difficulty: 'intermediate', objectives: [
      { id: 'recognize-opioid-respiratory-emergency', statement: 'Recognize suspected opioid toxicity from depressed responsiveness and ventilation while confirming a pulse and reviewing immediate mimics.', measure: 'The fixed breathing, oxygenation, carbon-dioxide, pupil, pulse, glucose, and exposure pattern was integrated without claiming diagnostic proof.' },
      { id: 'ventilate-opioid-toxicity-first', statement: 'Activate help and record airway opening, oxygen, effective bag-mask ventilation, monitoring, access, and glucose review immediately.', measure: 'Ventilatory support followed recognition and did not wait for antagonist effect.' },
      { id: 'record-opioid-antagonist-intent', statement: 'Record local-protocol naloxone intent while continuing ventilation, targeting normal spontaneous breathing.', measure: 'Antagonist intent followed support without using full arousal as the endpoint.' },
      { id: 'reassess-opioid-breathing-response', statement: 'Review the fixed initial breathing, oxygenation, carbon-dioxide, responsiveness, and pulse response.', measure: 'The initial response was reassessed before observation.' },
      { id: 'manage-recurrent-opioid-depression', statement: 'Recognize recurrent respiratory depression and record renewed ventilation, repeat-antagonist intent, monitored observation, co-exposure review, and discharge-safety planning.', measure: 'Recurrence triggered renewed rescue and a longer safety horizon rather than premature discharge.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'American Heart Association. 2025 Guidelines for CPR and ECC, Part 10: Adult and Pediatric Special Circumstances of Resuscitation.',
        'Substance Abuse and Mental Health Services Administration. Overdose Prevention and Response Toolkit. Publication PEP23-03-00-001. 2025.',
      ],
    },
    limitations: ['opioid-toxicity-pattern-response-and-recurrence-are-authored',
      'opioid-ventilation-antagonist-monitoring-and-handoff-controls-are-proxies',
      'no-live-opioid-exam-airway-drug-coexposure-recurrence-disposition-or-outcome'],
  },
  patient: {
    ageYears: 35, sex: 'male', heightCm: 178, weightKg: 79, asaClass: 4,
    diagnosis: 'Suspected opioid toxicity with severe respiratory depression and a palpable pulse',
    procedure: 'Emergency ventilatory support, antagonist intent, and recurrence surveillance',
    comorbidities: ['Opioid use disorder'], medications: ['Buprenorphine-naloxone; adherence unknown'],
    allergies: ['No known drug allergies'], fasting: 'Not established in the emergency department',
    baseline: { heartRateBpm: 58, meanArterialMmHg: 80, strokeVolumeMl: 66,
      hemoglobinGPerDl: 14.2, bloodVolumeMl: 5000, coreTemperatureC: 36.4,
      arterialStiffness: 1.0, baroreflexGain: 0.8, fixedStrokeVolume: false },
    airway: { difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Unresponsive to voice, shallow respirations, airway not yet supported' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'capnography', 'temperature'],
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 220,
      respiratoryRateBpm: 4, freshGasFlowLPerMin: 10, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'opioid-toxicity-presentation', type: 'narrative', target: 'opioid-toxicity', atTick: 0,
      severity: 'critical', message: 'A 35-year-old is found unresponsive after a friend reports likely fentanyl use. He has a definite carotid pulse at 58/min, shallow respirations at 4/min, room-air SpO₂ 78%, authored end-tidal CO₂ 68 mmHg, and pinpoint pupils. Fixed glucose is 102 mg/dL; BP is 108/66 mmHg. No trauma, focal deficit, seizure, or cardiac arrest is authored, and co-exposure remains possible.' },
    { id: 'opioid-toxicity-boundary', type: 'narrative', target: 'opioid-toxicity-boundary', atTick: 0,
      severity: 'warning', message: 'Confirm pulse and breathing, activate the emergency response, open and support the airway, provide oxygen and effective bag-mask ventilation, monitor, obtain access, and review glucose immediately. Record local-protocol naloxone intent without interrupting ventilation, aiming for normal spontaneous breathing rather than full arousal. Review the fixed initial response, then recognize a fixed recurrent respiratory-depression panel and record renewed ventilation, repeat-antagonist intent, co-exposure evaluation, monitored observation until recurrence risk is low, and naloxone plus use-instruction intent at eventual discharge. Examination, ventilation technique, access, drug or route selection, dose, delivery, pharmacology, co-exposure diagnosis, withdrawal, aspiration, pulmonary edema, disposition, and outcome are not simulated.' },
  ],
  debrief: { rubric: [
    { id: 'opioid-recognition', objectiveId: 'recognize-opioid-respiratory-emergency', question: 'Which breathing, oxygenation, carbon-dioxide, pupil, pulse, glucose, and exposure findings supported the working diagnosis, and which did not prove it?' },
    { id: 'opioid-ventilation', objectiveId: 'ventilate-opioid-toxicity-first', question: 'Why did airway support and effective ventilation begin before waiting for naloxone?' },
    { id: 'opioid-antagonist', objectiveId: 'record-opioid-antagonist-intent', question: 'What was the naloxone endpoint, and why was full wakefulness not required?' },
    { id: 'opioid-response', objectiveId: 'reassess-opioid-breathing-response', question: 'Which fixed findings showed an adequate initial respiratory response?' },
    { id: 'opioid-recurrence', objectiveId: 'manage-recurrent-opioid-depression', question: 'What proved recurrence, and why did renewed rescue, observation, co-exposure review, and discharge safety remain necessary?' },
  ] },
};
