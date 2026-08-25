/** Symptomatic bradycardia with authored cardiopulmonary compromise. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const UNSTABLE_BRADYCARDIA: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'unstable-bradycardia', version: '0.1.0', maturity: 'draft',
    title: 'Unstable bradycardia', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 8, difficulty: 'introductory',
    objectives: [
      { id: 'recognize-unstable-bradycardia', statement: 'Recognize a clinically inappropriate bradycardia causing hypotension, altered mentation, ischemic discomfort, and shock signs.', measure: 'Rate, rhythm, pulse, and cardiopulmonary compromise were reviewed together.' },
      { id: 'support-unstable-bradycardia', statement: 'Record airway and breathing support, oxygen, continuous cardiorespiratory monitoring, pulse monitoring, help, and vascular access.', measure: 'The bounded support bundle followed instability recognition.' },
      { id: 'give-atropine-for-unstable-bradycardia', statement: 'Record the fixed 1 mg IV atropine intent after persistent cardiopulmonary compromise.', measure: 'The scenario-bounded atropine intent followed support.' },
      { id: 'reassess-unstable-bradycardia', statement: 'Reassess rate, rhythm, pressure, mental status, ischemic discomfort, perfusion, and the need to pursue reversible causes and escalation.', measure: 'Serial whole-patient reassessment followed atropine intent.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Wigginton JG, et al. Part 9: Adult Advanced Life Support: 2025 AHA Guidelines for CPR and ECC. Circulation. 2025;152(suppl 2):S538-S577. doi:10.1161/CIR.0000000000001376.',
        'American Heart Association. Adult Bradycardia With a Pulse Algorithm. 2025; change notice updated February 6, 2026.',
      ],
    },
    limitations: ['unstable-bradycardia-rhythm-and-compromise-are-authored',
      'bradycardia-support-and-atropine-are-intent-controls',
      'no-bradycardia-pacing-infusions-cause-procedure-recurrence-or-outcome'],
  },
  patient: {
    ageYears: 71, sex: 'male', heightCm: 176, weightKg: 82, asaClass: 4,
    diagnosis: 'Unstable symptomatic bradycardia',
    procedure: 'Emergency recognition and initial atropine response',
    comorbidities: ['Hypertension'], medications: ['Metoprolol'],
    allergies: ['No known drug allergies'], fasting: 'Not established in the emergency department',
    baseline: { heartRateBpm: 38, meanArterialMmHg: 57, strokeVolumeMl: 50,
      hemoglobinGPerDl: 13.4, bloodVolumeMl: 5200, coreTemperatureC: 36.7,
      arterialStiffness: 1.2, baroreflexGain: 0.7, fixedStrokeVolume: false },
    airway: { difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Drowsy but arousable, answering slowly, with a patent airway' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'capnography', 'pulse-oximetry', 'temperature'],
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 470,
      respiratoryRateBpm: 20, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'unstable-bradycardia-rhythm', type: 'rhythm-change', target: 'sinus-bradycardia',
      atTick: 0, severity: 'critical',
      message: 'The teaching monitor shows a regular sinus bradycardia with a palpable pulse.' },
    { id: 'unstable-bradycardia-boundary', type: 'narrative', target: 'unstable-bradycardia',
      atTick: 0, severity: 'critical',
      message: 'A fixed bradycardia is causing hypotension, altered mentation, ischemic discomfort, and shock signs. Review appropriateness and compromise together; record immediate support, oxygen, monitoring, pulse checks, help, and vascular access; record the fixed atropine intent; then reassess the bounded response and ongoing cause/escalation needs. Live ECG acquisition, definitive cause, medication delivery, pacing, adrenergic infusions, procedures, recurrence, disposition, and outcome are outside this vignette.' },
  ],
  debrief: { rubric: [
    { id: 'bradycardia-compromise', objectiveId: 'recognize-unstable-bradycardia', question: 'Which rate, rhythm, pulse, and whole-patient findings made this bradycardia unstable?' },
    { id: 'bradycardia-support', objectiveId: 'support-unstable-bradycardia', question: 'Which immediate support and monitoring steps were recorded before medication intent?' },
    { id: 'bradycardia-atropine', objectiveId: 'give-atropine-for-unstable-bradycardia', question: 'Why was the fixed atropine intent appropriate in this bounded case?' },
    { id: 'bradycardia-reassessment', objectiveId: 'reassess-unstable-bradycardia', question: 'Which rhythm and perfusion findings changed, and what remained outside the vignette?' },
  ] },
};
