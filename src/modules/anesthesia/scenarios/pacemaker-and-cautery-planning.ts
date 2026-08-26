/** Pacemaker and cautery planning: review the device, procedure, coordinated plan, and restoration. */

import type { Scenario } from './types';

export const PACEMAKER_AND_CAUTERY_PLANNING: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'pacemaker-and-cautery-planning', version: '0.1.0', maturity: 'preview',
    title: 'Pacemaker and cautery planning', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 8, difficulty: 'intermediate',
    objectives: [
      {
        id: 'review-cied-device-record',
        statement: 'Review device type, pacing dependence, recent function, and documented magnet response.',
        measure: 'The fixed CIED record was deliberately reviewed.',
      },
      {
        id: 'review-cied-procedure-risk',
        statement: 'Join procedure location and anticipated electrosurgery with the device-specific risk pattern.',
        measure: 'The fixed above-umbilicus monopolar-electrosurgery pattern was reviewed.',
      },
      {
        id: 'choose-coordinated-cied-plan',
        statement: 'Choose coordinated asynchronous pacing for this pacing-dependent case without inventing a universal magnet rule.',
        measure: 'The correct coordinated plan followed both reviews.',
      },
      {
        id: 'document-cied-backup-and-restoration',
        statement: 'Include external backup, monitoring, and explicit post-procedure restoration in the plan.',
        measure: 'Backup and restoration were documented after the device plan.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Thompson A, et al. 2024 AHA/ACC Guideline for Perioperative Cardiovascular Management for Noncardiac Surgery. Circulation. 2024;150:e351-e442.',
        'Wan EY, et al. Periprocedural Management and Multidisciplinary Care Pathways for Patients With Cardiac Implantable Electronic Devices. Circulation. 2024;150:e183-e196.',
      ],
    },
    limitations: [
      'cied-record-and-procedure-are-fixed-vignette-facts',
      'no-device-programming-magnet-or-electrosurgery-model',
      'no-cied-malfunction-emergency-or-team-performance',
    ],
  },
  patient: {
    ageYears: 71, sex: 'female', heightCm: 163, weightKg: 68, asaClass: 3,
    diagnosis: 'Right rotator cuff tear', procedure: 'Elective right shoulder arthroplasty',
    comorbidities: ['Complete atrioventricular block', 'Transvenous dual-chamber pacemaker'],
    medications: ['Amlodipine'], allergies: ['None known'],
    fasting: 'Eight hours for solids, two hours for clear fluids',
    baseline: {
      heartRateBpm: 70, meanArterialMmHg: 91, strokeVolumeMl: 64,
      hemoglobinGPerDl: 13.0, bloodVolumeMl: 4400, coreTemperatureC: 36.7,
      arterialStiffness: 1.25, baroreflexGain: 0.75, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.15, difficultMaskVentilation: false,
      assessment: 'Mallampati II, good mouth opening, full neck movement',
    },
    respiratory: { profile: 'healthy' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'pulse-oximetry'],
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 450,
      respiratoryRateBpm: 12, delivering: false,
    },
  },
  formulary: [],
  timeline: [{
    id: 'cied-cautery-briefing', type: 'narrative', target: 'cied-cautery-planning',
    atTick: 0, severity: 'advisory',
    message: 'During preoperative planning for right shoulder surgery, the chart identifies a left-pectoral pacemaker and anticipated monopolar electrosurgery. Review the device and procedure facts, coordinate a patient-specific plan, and include backup and restoration. No interrogation, programming, magnet effect, electrosurgery technique, malfunction, or emergency response is simulated.',
  }],
  debrief: { rubric: [
    { id: 'cied-device', objectiveId: 'review-cied-device-record', question: 'Which device facts changed the planning question?', concept: 'depth-monitoring-and-its-limits' },
    { id: 'cied-procedure', objectiveId: 'review-cied-procedure-risk', question: 'How did procedure location and anticipated electrosurgery change the interference risk?', concept: 'depth-monitoring-and-its-limits' },
    { id: 'cied-plan', objectiveId: 'choose-coordinated-cied-plan', question: 'Why was a coordinated asynchronous plan safer than a universal magnet shortcut?', concept: 'depth-monitoring-and-its-limits' },
    { id: 'cied-restoration', objectiveId: 'document-cied-backup-and-restoration', question: 'What backup and post-procedure restoration belonged in the plan?', concept: 'depth-monitoring-and-its-limits' },
  ] },
};
