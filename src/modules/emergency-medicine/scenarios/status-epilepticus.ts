/** Bounded adult generalized-convulsive status-epilepticus first-line response. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const STATUS_EPILEPTICUS: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'status-epilepticus', version: '0.1.0', maturity: 'preview',
    title: 'Status epilepticus', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 8, difficulty: 'intermediate', objectives: [
      { id: 'recognize-convulsive-status-epilepticus', statement: 'Recognize generalized convulsive status epilepticus from seizure type, duration, and absent recovery.', measure: 'Ongoing generalized convulsions beyond 5 minutes without recovery were reviewed with airway, breathing, circulation, and glucose status.' },
      { id: 'stabilize-convulsive-status-epilepticus', statement: 'Record injury protection, airway and oxygen support, monitoring, help, vascular access, and point-of-care glucose in parallel.', measure: 'The bounded stabilization bundle followed recognition without delaying first-line treatment.' },
      { id: 'give-first-line-status-benzodiazepine', statement: 'Record the fixed adult 4 mg IV lorazepam action for ongoing generalized convulsive status.', measure: 'The single scenario-bounded lorazepam action followed stabilization.' },
      { id: 'reassess-status-after-benzodiazepine', statement: 'Reassess visible seizure activity, airway, ventilation, oxygenation, and the need for prompt escalation.', measure: 'Post-treatment reassessment followed the modeled seizure response and retained a clear second-line boundary.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Glauser T, et al. Evidence-Based Guideline: Treatment of Convulsive Status Epilepticus in Children and Adults. Epilepsy Curr. 2016;16(1):48-61. doi:10.5698/1535-7597-16.1.48.',
        'American College of Emergency Physicians Clinical Policies Subcommittee. Clinical Policy: Critical Issues in the Management of Adult Patients Presenting to the Emergency Department With Seizures. Ann Emerg Med. 2024;84(1):e1-e6. doi:10.1016/j.annemergmed.2024.02.018.',
        'Trinka E, et al. A definition and classification of status epilepticus. Epilepsia. 2015;56(10):1515-1523. doi:10.1111/epi.13121.',
      ],
    },
    limitations: ['status-epilepticus-pattern-and-response-are-bounded',
      'status-epilepticus-controls-are-screen-proxies',
      'no-status-second-line-eeg-cause-airway-recurrence-or-outcome'],
  },
  patient: {
    ageYears: 46, sex: 'female', heightCm: 168, weightKg: 74, asaClass: 4,
    diagnosis: 'Generalized convulsive status epilepticus',
    procedure: 'Emergency recognition, stabilization, and first-line treatment',
    comorbidities: ['Epilepsy'], medications: ['Levetiracetam'],
    allergies: ['No known drug allergies'], fasting: 'Not established in the emergency department',
    baseline: { heartRateBpm: 118, meanArterialMmHg: 88, strokeVolumeMl: 62,
      hemoglobinGPerDl: 13.1, bloodVolumeMl: 4700, coreTemperatureC: 37.2,
      arterialStiffness: 1.1, baroreflexGain: 0.8, fixedStrokeVolume: false },
    airway: { difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Generalized convulsions; airway patent between movements with spontaneous breathing' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'capnography', 'pulse-oximetry', 'temperature'],
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 480,
      respiratoryRateBpm: 24, freshGasFlowLPerMin: 10, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'status-epilepticus-onset', type: 'status-epilepticus',
      target: 'generalized-convulsive', value: 1, atTick: 0, severity: 'critical',
      message: 'Generalized bilateral convulsive activity has continued for 6 minutes 20 seconds without recovery. This meets the operational treatment threshold for generalized convulsive status epilepticus.' },
    { id: 'status-epilepticus-boundary', type: 'narrative',
      target: 'status-epilepticus', atTick: 0, severity: 'critical',
      message: 'Protect from injury without restraint; review airway, breathing, circulation, seizure duration, and recovery; record oxygen, suction readiness, monitoring, help, vascular access, and point-of-care glucose in parallel; give the fixed 4 mg IV lorazepam action; then reassess visible seizure activity and airway support. Physical care, medication preparation or delivery, repeat or alternate benzodiazepine, second-line antiseizure loading, EEG, airway procedures, causal diagnosis, recurrence, disposition, and outcome are outside this vignette.' },
  ],
  debrief: { rubric: [
    { id: 'status-recognition', objectiveId: 'recognize-convulsive-status-epilepticus', question: 'Which seizure, clock, recovery, and whole-patient findings crossed the treatment threshold?' },
    { id: 'status-stabilization', objectiveId: 'stabilize-convulsive-status-epilepticus', question: 'Which stabilization and glucose actions were recorded in parallel?' },
    { id: 'status-benzodiazepine', objectiveId: 'give-first-line-status-benzodiazepine', question: 'Why did the fixed first-line benzodiazepine action follow immediately?' },
    { id: 'status-reassessment', objectiveId: 'reassess-status-after-benzodiazepine', question: 'What stopped, what still required surveillance, and where did the second-line boundary begin?' },
  ] },
};
