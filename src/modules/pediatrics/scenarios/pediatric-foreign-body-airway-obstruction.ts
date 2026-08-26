/** Pediatric foreign-body airway obstruction crossing from effective cough to unresponsiveness. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const PEDIATRIC_FOREIGN_BODY_AIRWAY_OBSTRUCTION: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'pediatric-foreign-body-airway-obstruction', version: '0.1.0', maturity: 'preview',
    title: 'Pediatric foreign-body airway obstruction', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 7, difficulty: 'intermediate', objectives: [
      {
        id: 'reconcile-pediatric-foreign-body-airway-obstruction-event-cough-and-whole-child',
        statement: 'Connect the abrupt eating event, current effective cough, airflow, speech, breathing, circulation, and whole-child state.',
        measure: 'The authored event and whole-child state were reconciled without learner examination, cough assessment, object visualization, monitoring, diagnosis, or treatment.',
      },
      {
        id: 'preserve-pediatric-foreign-body-airway-obstruction-effective-cough-and-surveillance',
        statement: 'Preserve effective coughing and close surveillance while qualified help remains ready.',
        measure: 'The effective-cough branch was preserved without learner back blows, thrusts, sweeps, suction, oxygen, device, procedure, or treatment.',
      },
      {
        id: 'recognize-pediatric-foreign-body-airway-obstruction-severe-responsive-transition',
        statement: 'At the elapsed checkpoint, recognize the transition to severe responsive airway obstruction.',
        measure: 'The fixed loss of audible cough, speech, and effective air movement with cyanosis triggered escalation without learner examination or maneuver performance.',
      },
      {
        id: 'activate-pediatric-foreign-body-airway-obstruction-qualified-responsive-pathway',
        statement: 'Activate qualified responsive-child foreign-body airway obstruction care without delay.',
        measure: 'Qualified pathway ownership followed recognition without learner back blow, thrust, sweep, suction, oxygen, airway, device, or treatment selection or delivery.',
      },
      {
        id: 'activate-pediatric-foreign-body-airway-obstruction-unresponsive-cpr-pathway',
        statement: 'At the next elapsed checkpoint, activate the qualified unresponsive-child CPR and airway-check pathway.',
        measure: 'The unresponsive transition triggered qualified care without learner pulse assessment, CPR mechanics, ventilation, object removal, device operation, or treatment.',
      },
      {
        id: 'handoff-pediatric-foreign-body-airway-obstruction-active-risk',
        statement: 'Hand off the choking trajectory, active qualified pathway, unresolved obstruction, and unknown outcome.',
        measure: 'The handoff preserved active risk without claiming object removal, pulse status, recovery, ROSC, disposition, prognosis, or outcome.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Joyner BL Jr, Dewan M, Bavare A, et al. Part 6: Pediatric Basic Life Support: 2025 AHA/AAP Guidelines for CPR and ECC. Circulation. 2025;152(suppl 2):S424-S447. doi:10.1161/CIR.0000000000001370.',
        'American Heart Association and American Academy of Pediatrics. Child Foreign-Body Airway Obstruction Algorithm. 2025.',
        'Djakow J, Lott C, de Lucas N, et al. European Resuscitation Council Guidelines 2025: Paediatric life support. Resuscitation. 2025;215:110767. doi:10.1016/j.resuscitation.2025.110767.',
        'Resuscitation Council UK. Paediatric life support: Foreign body airway obstruction. Guidelines 2025.',
      ],
    },
    limitations: [
      'pediatric-foreign-body-airway-obstruction-event-transitions-and-care-are-authored',
      'pediatric-foreign-body-airway-obstruction-controls-reconcile-preserve-recognize-activate-and-handoff-only',
      'no-live-pediatric-foreign-body-airway-obstruction-exam-maneuver-cpr-device-treatment-or-outcome',
    ],
  },
  patient: {
    ageYears: 6, sex: 'male', heightCm: 115, weightKg: 20, asaClass: 4,
    diagnosis: 'Authored suspected foreign-body airway obstruction crossing from effective cough to unresponsiveness',
    procedure: 'calm pediatric choking recognition, cough-effectiveness reassessment, qualified escalation, and active-risk handoff',
    comorbidities: ['Previously well'], medications: ['None reported'],
    allergies: ['No known drug allergies'], fasting: 'Eating immediately before the reported event',
    baseline: {
      heartRateBpm: 118, meanArterialMmHg: 76, strokeVolumeMl: 28,
      hemoglobinGPerDl: 12.5, bloodVolumeMl: 1_600, coreTemperatureC: 36.7,
      arterialStiffness: 0.75, baroreflexGain: 1.15, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.3, difficultMaskVentilation: false,
      assessment: 'Fixed initial effective-cough report with audible airflow and normal voice between coughs; no object is reported visible',
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
      id: 'pediatric-foreign-body-airway-obstruction-presentation', type: 'narrative',
      target: 'pediatric-foreign-body-airway-obstruction-reassessment', atTick: 0,
      severity: 'warning',
      message: 'A previously well 6-year-old boy weighs 20 kg and measures 115 cm. While eating a whole grape at school, he suddenly coughed and signaled that something was stuck. No object was seen to exit; the object and its location remain unconfirmed. At the fixed initial report he is awake, frightened, follows directions, coughs forcefully and loudly with audible airflow, says “Something is stuck” in a normal voice between coughs, and has spontaneous breathing. Temperature is 36.7°C, HR 118/min, RR 24/min between coughs, BP 100/64 mmHg (MAP 76), and room-air SpO₂ 98%, with normal color, warm strong pulses, and refill 2 seconds. No fever or respiratory prodrome, bark, hoarseness, stridor before the event, drooling, dysphagia, urticaria, swelling, vomiting, wheeze, neurological change, trauma, or known nonfood ingestion is authored. These snapshots do not exclude retained airway material, aspiration, evolving obstruction, or another dangerous cause. All findings are supplied, not learner examination, cough assessment, object visualization, monitoring, diagnosis, or treatment.',
    },
    {
      id: 'pediatric-foreign-body-airway-obstruction-boundary', type: 'narrative',
      target: 'pediatric-foreign-body-airway-obstruction-reassessment-boundary', atTick: 0,
      severity: 'critical',
      message: 'Reconcile the abrupt event, cough effectiveness, airflow, speech, breathing, circulation, and whole-child state; preserve effective coughing with close qualified surveillance and no thrusts. At a strict elapsed minute-2 checkpoint, a fixed report supplies a responsive child who tracks his caregiver but cannot speak or make an audible cough, has silent ineffective cough attempts, minimal air movement, perioral cyanosis, HR 138/min, BP 98/60 mmHg (MAP 73), room-air SpO₂ 91% and falling on a coherent signal, an uncountable respiratory rate, and a central pulse; no object is expelled or visibly accessible. Recognize severe responsive obstruction and activate qualified care. At a strict elapsed minute-3 checkpoint, obstruction is not reported relieved: he is unresponsive without purposeful movement, normal breathing, effective cough, speech, or audible airflow. A supplied ECG display reports electrical activity at 132/min, while pulse status is intentionally not supplied and BP and SpO₂ are unavailable. No visible object or successful removal is reported. Activate the qualified unresponsive-child CPR and airway-check pathway before an elapsed active-risk handoff. The controls do not examine the child; assess cough, airflow, breathing, or pulse; acquire or interpret an ECG; visualize, sweep, suction, or remove an object; choose or perform back blows, chest or abdominal thrusts, ventilation, compressions, CPR sequence, oxygen, airway device, laryngoscopy, bronchoscopy, device operation, procedure, drug, or treatment; determine disposition; predict prognosis; or report recovery, ROSC, or outcome.',
    },
  ],
  debrief: { rubric: [
    { id: 'pediatric-foreign-body-airway-obstruction-reconcile', objectiveId: 'reconcile-pediatric-foreign-body-airway-obstruction-event-cough-and-whole-child', question: 'Which supplied event, cough, airflow, speech, breathing, circulation, and whole-child facts established the initial branch?' },
    { id: 'pediatric-foreign-body-airway-obstruction-effective-cough', objectiveId: 'preserve-pediatric-foreign-body-airway-obstruction-effective-cough-and-surveillance', question: 'Why were effective coughing and close surveillance preserved without thrusts?' },
    { id: 'pediatric-foreign-body-airway-obstruction-severe-transition', objectiveId: 'recognize-pediatric-foreign-body-airway-obstruction-severe-responsive-transition', question: 'Which strictly later findings established severe responsive obstruction?' },
    { id: 'pediatric-foreign-body-airway-obstruction-responsive-pathway', objectiveId: 'activate-pediatric-foreign-body-airway-obstruction-qualified-responsive-pathway', question: 'How was qualified responsive-child care activated without learner psychomotor controls?' },
    { id: 'pediatric-foreign-body-airway-obstruction-unresponsive-pathway', objectiveId: 'activate-pediatric-foreign-body-airway-obstruction-unresponsive-cpr-pathway', question: 'Which later findings required transition to qualified unresponsive-child CPR and airway-check ownership?' },
    { id: 'pediatric-foreign-body-airway-obstruction-handoff', objectiveId: 'handoff-pediatric-foreign-body-airway-obstruction-active-risk', question: 'Which unresolved obstruction, pathway, pulse-status, and outcome risks required handoff?' },
  ] },
};
