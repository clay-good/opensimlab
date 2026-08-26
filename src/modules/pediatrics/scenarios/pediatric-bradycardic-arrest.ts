/** Pediatric compromised bradycardia crossing into authored nonshockable arrest. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const PEDIATRIC_BRADYCARDIC_ARREST: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'pediatric-bradycardic-arrest', version: '0.1.0', maturity: 'preview',
    title: 'Pediatric bradycardic arrest transition', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 8, difficulty: 'advanced', objectives: [
      {
        id: 'reconcile-pediatric-bradycardic-arrest-support-and-trajectory',
        statement: 'Connect the supplied effective breathing support, persistent bradycardia, pulse, perfusion, and whole-child trajectory.',
        measure: 'The authored support and trajectory were reconciled without learner airway, breathing, pulse, monitor, capnography, examination, treatment, or device assessment.',
      },
      {
        id: 'recognize-pediatric-bradycardia-with-persistent-compromise',
        statement: 'Recognize pediatric bradycardia below 60/min with persistent cardiopulmonary compromise despite supplied effective ventilation with oxygen.',
        measure: 'The combined rate, pulse, support, mentation, pressure, and perfusion pattern triggered escalation without using one number alone.',
      },
      {
        id: 'activate-pediatric-bradycardic-arrest-qualified-resuscitation-ownership',
        statement: 'Activate qualified pediatric CPR and resuscitation ownership without waiting for pulse loss.',
        measure: 'Qualified ownership followed recognition without learner compression, ventilation, access, drug, dose, device, pacing, or treatment selection or delivery.',
      },
      {
        id: 'review-pediatric-bradycardic-arrest-causes-pulse-and-arrest-boundary',
        statement: 'After resuscitation is active, review support evidence, open causes, pulse surveillance, and the arrest-transition boundary.',
        measure: 'Open safety work followed escalation without claiming learner examination, pulse check, testing, diagnosis, airway care, cause treatment, or resuscitation skill.',
      },
      {
        id: 'review-pediatric-bradycardic-arrest-pulse-loss-response',
        statement: 'At the elapsed qualified checkpoint, recognize pulse loss with organized electrical activity and preserve the nonshockable pathway.',
        measure: 'The authored PEA transition was recognized without learner pulse assessment, rhythm interpretation, shock, drug, CPR, procedure, or treatment.',
      },
      {
        id: 'handoff-pediatric-bradycardic-arrest-active-risk',
        statement: 'Hand off active nonshockable resuscitation, support, open causes, pulse-loss trajectory, and unresolved outcome.',
        measure: 'The handoff preserved active risk without claiming ROSC, cause, termination, post-arrest care, prognosis, or outcome.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Lasa JJ, Dhillon GS, Duff JP, et al. Part 8: Pediatric Advanced Life Support: 2025 AHA/AAP Guidelines for CPR and ECC. Circulation. 2025;152(suppl 2):S479-S537. doi:10.1161/CIR.0000000000001368.',
        'American Heart Association and American Academy of Pediatrics. Pediatric Bradycardia With a Pulse Algorithm. 2025.',
        'American Heart Association and American Academy of Pediatrics. Pediatric Cardiac Arrest Algorithm. 2025.',
      ],
    },
    limitations: [
      'pediatric-bradycardic-arrest-support-pulse-loss-and-rhythm-are-authored',
      'pediatric-bradycardic-arrest-controls-reconcile-recognize-escalate-review-and-handoff-only',
      'no-live-pediatric-bradycardic-arrest-exam-cpr-drug-device-treatment-or-outcome',
    ],
  },
  patient: {
    ageYears: 6, sex: 'female', heightCm: 115, weightKg: 20, asaClass: 5,
    diagnosis: 'Authored compromised pediatric sinus bradycardia crossing into pulseless electrical activity',
    procedure: 'calm pediatric bradycardia-to-arrest recognition, qualified resuscitation ownership, and active-risk handoff',
    comorbidities: ['Previously well'], medications: ['None reported'],
    allergies: ['No known drug allergies'], fasting: 'Not established during resuscitation',
    baseline: {
      heartRateBpm: 52, meanArterialMmHg: 45, strokeVolumeMl: 20,
      hemoglobinGPerDl: 12.5, bloodVolumeMl: 1_600, coreTemperatureC: 36.8,
      arterialStiffness: 0.75, baroreflexGain: 1.15, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Supplied patent airway with qualified assisted positive-pressure ventilation, oxygen, and equal bilateral chest rise',
    },
    respiratory: { profile: 'healthy-child' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'capnography', 'pulse-oximetry', 'temperature'],
    airwayDevice: 'facemask',
    ventilator: {
      mode: 'manual', fio2: 1, tidalVolumeMl: 120, respiratoryRateBpm: 20,
      freshGasFlowLPerMin: 10, delivering: true,
    },
  },
  formulary: [],
  timeline: [
    {
      id: 'pediatric-bradycardic-arrest-rhythm', type: 'rhythm-change',
      target: 'sinus-bradycardia', atTick: 0, severity: 'critical',
      message: 'The teaching monitor shows fixed sinus bradycardia at 52/min with an authored central pulse.',
    },
    {
      id: 'pediatric-bradycardic-arrest-presentation', type: 'narrative',
      target: 'pediatric-bradycardic-arrest-reassessment', atTick: 0, severity: 'critical',
      message: 'A previously well 6-year-old girl weighs 20 kg and measures 115 cm. After several hours of worsening breathing and fatigue from an unestablished cause, she is now unresponsive without purposeful movement and has no spontaneous effective breathing. A fixed qualified support report documents a patent airway, assisted positive-pressure ventilation with oxygen, equal visible bilateral chest rise, a continuous capnogram with EtCO₂ 36 mmHg, and SpO₂ improving from 79% to 95%. Despite that authored effective support, fixed sinus bradycardia and central pulse persist at 52/min with BP 64/36 mmHg (MAP 45), temperature 36.8°C, pale cool mottled skin, capillary refill 5 seconds, a weak central pulse, and no peripheral pulse reported. There is no pulse loss yet. No trauma, abrupt choking, wheeze, stridor, urticaria, focal unilateral air-entry loss, known congenital heart disease, known toxin or medication exposure, hypothermia, or seizure is authored. These snapshots do not exclude hypoxia, airway or lung disease, toxins, metabolic or neurologic disease, heart block, or another dangerous cause. All findings and support are supplied, not learner examination, palpation, monitoring, capnography interpretation, airway or ventilation assessment, diagnosis, or treatment.',
    },
    {
      id: 'pediatric-bradycardic-arrest-boundary', type: 'narrative',
      target: 'pediatric-bradycardic-arrest-reassessment-boundary', atTick: 0,
      severity: 'critical',
      message: 'Reconcile the supplied effective breathing support, persistent sinus bradycardia, pulse, perfusion, and whole-child state; recognize HR below 60/min with persistent cardiopulmonary compromise despite effective ventilation with oxygen; activate qualified pediatric CPR and resuscitation ownership without waiting for pulse loss; then review support evidence, open causes, pulse surveillance, and the arrest boundary. At a strict elapsed qualified checkpoint, a fixed report supplies organized electrical activity at 46/min with no central pulse, a nonpulsatile pleth, unobtainable NIBP, persistent unresponsiveness, and continued qualified assisted ventilation: authored PEA and pulse loss, not persistent bradycardia with a pulse. Preserve the nonshockable pathway before another elapsed active-resuscitation handoff. No ROSC, termination, cause, prognosis, or outcome is reported. The controls do not examine or palpate the child; assess a pulse, airway, ventilation, monitor, capnogram, or CPR quality; acquire or interpret a rhythm or test; diagnose or treat a cause; choose or deliver oxygen, ventilation, compressions, access, drug, concentration, dose, route, flush, pacing, shock, energy, device operation, procedure, resuscitation, post-arrest care, or other treatment; determine termination or disposition; predict prognosis; or report an outcome.',
    },
  ],
  debrief: { rubric: [
    { id: 'pediatric-bradycardic-arrest-trajectory', objectiveId: 'reconcile-pediatric-bradycardic-arrest-support-and-trajectory', question: 'Which supplied support, breathing, rhythm, pulse, perfusion, and whole-child facts established the trajectory?' },
    { id: 'pediatric-bradycardic-arrest-recognition', objectiveId: 'recognize-pediatric-bradycardia-with-persistent-compromise', question: 'Why did persistent HR 52/min with compromise require escalation despite supplied effective ventilation and a central pulse?' },
    { id: 'pediatric-bradycardic-arrest-escalation', objectiveId: 'activate-pediatric-bradycardic-arrest-qualified-resuscitation-ownership', question: 'How was qualified pediatric CPR and resuscitation ownership activated without learner treatment or psychomotor controls?' },
    { id: 'pediatric-bradycardic-arrest-safety', objectiveId: 'review-pediatric-bradycardic-arrest-causes-pulse-and-arrest-boundary', question: 'Which support, cause, pulse-surveillance, and arrest-transition work remained active after escalation?' },
    { id: 'pediatric-bradycardic-arrest-pulse-loss', objectiveId: 'review-pediatric-bradycardic-arrest-pulse-loss-response', question: 'Which fixed later findings established PEA and why was shock not exposed?' },
    { id: 'pediatric-bradycardic-arrest-handoff', objectiveId: 'handoff-pediatric-bradycardic-arrest-active-risk', question: 'Which active resuscitation, support, cause, and unresolved-outcome risks required handoff?' },
  ] },
};
