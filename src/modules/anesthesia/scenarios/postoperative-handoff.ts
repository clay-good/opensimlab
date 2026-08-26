/** Postoperative handoff: ready the receiver, share critical content, close the loop, transfer responsibility. */

import type { Scenario } from './types';

export const POSTOPERATIVE_HANDOFF: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'postoperative-handoff', version: '0.1.0', maturity: 'preview',
    title: 'Postoperative handoff', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 7, difficulty: 'introductory',
    objectives: [
      { id: 'confirm-handoff-readiness', statement: 'Confirm the receiver and monitoring are ready before beginning.', measure: 'Receiver readiness was explicitly confirmed.' },
      { id: 'share-handoff-critical-content', statement: 'Share the patient, perioperative course, and current state as distinct critical content.', measure: 'Both fixed content blocks were accepted.' },
      { id: 'assign-handoff-risks-and-ownership', statement: 'Name unresolved risks, required actions, timing, ownership, and escalation.', measure: 'The fixed risk-and-ownership block followed the core content.' },
      { id: 'close-loop-and-accept-transfer', statement: 'Require receiver synthesis and acknowledged acceptance before responsibility changes.', measure: 'Read-back preceded accepted transfer.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Agency for Healthcare Research and Quality. TeamSTEPPS 3.0 Communication Module: Handoff and I-PASS. Current web curriculum.',
        'The Joint Commission. Sentinel Event Alert 58: Inadequate hand-off communication. September 11, 2017.',
      ],
    },
    limitations: [
      'postoperative-handoff-content-is-a-fixed-vignette',
      'handoff-controls-record-events-not-communication-quality',
      'no-bedside-transfer-staffing-documentation-or-outcome',
    ],
  },
  patient: {
    ageYears: 64, sex: 'female', heightCm: 165, weightKg: 82, asaClass: 3,
    diagnosis: 'Right colon adenocarcinoma', procedure: 'Open right hemicolectomy',
    comorbidities: ['Obstructive sleep apnea', 'Controlled hypertension'],
    medications: ['Amlodipine'], allergies: ['None known'],
    fasting: 'Completed operation; now entering post-anesthesia care',
    baseline: {
      heartRateBpm: 76, meanArterialMmHg: 88, strokeVolumeMl: 65,
      hemoglobinGPerDl: 10.8, bloodVolumeMl: 4400, coreTemperatureC: 36.6,
      arterialStiffness: 1.2, baroreflexGain: 0.8, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.3, difficultMaskVentilation: false,
      assessment: 'Extubated awake after video-laryngoscope intubation; airway currently patent',
    },
    respiratory: { profile: 'healthy' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'],
    airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.32, tidalVolumeMl: 430, respiratoryRateBpm: 13, delivering: false },
  },
  formulary: [],
  timeline: [{
    id: 'postoperative-handoff-briefing', type: 'narrative', target: 'postoperative-handoff',
    atTick: 0, severity: 'advisory',
    message: 'The patient has arrived in post-anesthesia care after open abdominal surgery. Build an interruption-resistant handoff: establish receiver readiness, share the fixed course and current state, assign unresolved risks and timed actions, require receiver synthesis, and transfer responsibility only after acknowledgment. Voice, nonverbal behavior, staffing, workload, bedside examination, documentation, interruptions, and outcomes are not simulated.',
  }],
  debrief: { rubric: [
    { id: 'handoff-ready', objectiveId: 'confirm-handoff-readiness', question: 'What needed to be true before the handoff began?', concept: 'depth-monitoring-and-its-limits' },
    { id: 'handoff-content', objectiveId: 'share-handoff-critical-content', question: 'Which course and current-state details made the transfer actionable?', concept: 'depth-monitoring-and-its-limits' },
    { id: 'handoff-ownership', objectiveId: 'assign-handoff-risks-and-ownership', question: 'Which unresolved risks required timing, ownership, and escalation?', concept: 'depth-monitoring-and-its-limits' },
    { id: 'handoff-close-loop', objectiveId: 'close-loop-and-accept-transfer', question: 'How did receiver synthesis differ from silent receipt?', concept: 'depth-monitoring-and-its-limits' },
  ] },
};
