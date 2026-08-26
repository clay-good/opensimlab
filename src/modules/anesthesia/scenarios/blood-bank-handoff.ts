/** Ordered blood-bank release and red-cell support during established hemorrhage. */

import type { Scenario } from './types';

export const BLOOD_BANK_HANDOFF: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'blood-bank-handoff', version: '0.1.0', maturity: 'preview',
    title: 'Blood-bank handoff', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 6, difficulty: 'intermediate',
    objectives: [
      {
        id: 'request-blood-bank-release',
        statement: 'Recognize active operative blood loss and make the bounded blood-bank request before selecting a product.',
        measure: 'An accepted blood-bank release was recorded within 60 seconds of the declared hemorrhage onset.',
      },
      {
        id: 'use-released-red-cells',
        statement: 'Use the released red-cell teaching action in the correct order without treating the simulator as a compatibility workflow.',
        measure: 'Packed red cells were accepted after release, with no refused blood-product action before the release.',
      },
      {
        id: 'reassess-red-cell-response',
        statement: 'Reassess perfusion and the modeled hemoglobin and oxygen-delivery response after the red-cell action.',
        measure: 'The accepted red-cell event recorded increased hemoglobin and calculated oxygen delivery, and final mean arterial pressure was at least 65 mmHg.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0',
      sources: [
        'AABB et al. Circular of Information for the Use of Human Blood and Blood Components. June 2024.',
        'Joint United Kingdom Blood Transfusion and Tissue Transplantation Services Professional Advisory Committee. Guidelines: Red Cell Components. Chapter 7.3, current component specification.',
      ],
    },
    limitations: [
      'prbc-fixed-unit-model',
      'blood-bank-handoff-is-instantaneous',
      'no-team-or-communication',
      'crystalloid-volume-model',
    ],
  },
  patient: {
    ageYears: 62, sex: 'female', heightCm: 164, weightKg: 68, asaClass: 3,
    diagnosis: 'Pelvic sarcoma', procedure: 'Open pelvic tumor resection',
    comorbidities: ['Treated hypertension', 'Preoperative anemia'],
    medications: ['Amlodipine'], allergies: ['None known'],
    fasting: 'Eight hours for solids, two hours for clear fluids',
    baseline: {
      heartRateBpm: 84, meanArterialMmHg: 82, strokeVolumeMl: 62,
      hemoglobinGPerDl: 10.2, bloodVolumeMl: 4400, coreTemperatureC: 36.2,
      arterialStiffness: 1.1, baroreflexGain: 1, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.15, difficultMaskVentilation: false,
      assessment: 'Tracheal tube secured; bilateral ventilation and continuous capnography confirmed',
    },
    respiratory: { profile: 'healthy' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'arterial-line', 'capnography', 'pulse-oximetry', 'temperature', 'depth-index'],
    airwayDevice: 'tracheal-tube',
    ventilator: {
      mode: 'volume-control', fio2: 0.5, tidalVolumeMl: 450, respiratoryRateBpm: 12,
      freshGasFlowLPerMin: 2, sevofluranePercent: 1.2, delivering: true,
    },
  },
  formulary: [{
    drugId: 'remifentanil', deliveryModes: ['infusion'],
    concentration: 50, concentrationUnit: 'µg/mL', syringeVolumeMl: 50, typicalDose: 25,
    presets: [{ label: '0.25 µg/kg', amount: 0.25, unit: 'µg/kg' }],
  }],
  timeline: [
    {
      id: 'briefing', type: 'narrative', atTick: 0, severity: 'advisory',
      message: 'General anesthesia and delivered ventilation are established. The operative field has been manageable, but suction losses are beginning to rise. This scenario isolates the order of a bounded blood-bank request, red-cell action, and reassessment; it does not reproduce a real transfusion workflow.',
    },
    {
      id: 'operative-hemorrhage', type: 'blood-loss', atTick: 600, value: 200,
      durationTicks: 1800, severity: 'critical',
      message: 'Suction losses increase and the operative field continues to bleed. Recognize the active loss and decide how to begin the bounded blood-bank handoff.',
    },
    {
      id: 'reassessment', type: 'narrative', atTick: 2400, severity: 'advisory',
      message: 'The modeled operative loss has stopped. Reassess pressure and the recorded red-cell response rather than treating product release as the endpoint.',
    },
    {
      id: 'case-end', type: 'narrative', atTick: 3600, severity: 'advisory',
      message: 'The handoff practice window is ending. Debrief what the simulator recorded, and name the real compatibility and bedside safeguards it deliberately omitted.',
    },
  ],
  replayPoints: [
    {
      id: 'before-release-request', label: 'When operative blood loss becomes active',
      objectiveId: 'request-blood-bank-release', atTick: 599,
      reason: 'Rehearse recognizing the declared loss and ordering the bounded request before product selection.',
    },
    {
      id: 'after-release', label: 'After the bounded release is accepted',
      objectiveId: 'use-released-red-cells', atTick: 601,
      reason: 'Rehearse selecting the released red-cell teaching action without implying a real compatibility workflow.',
    },
  ],
  debrief: { rubric: [
    {
      id: 'ordered-release', objectiveId: 'request-blood-bank-release',
      question: 'What made the request timely, and which real blood-bank steps did this instant release omit?',
      concept: 'vasodilation-versus-hypovolemia',
    },
    {
      id: 'released-product', objectiveId: 'use-released-red-cells',
      question: 'How did the accepted-event order differ from a real specimen, compatibility, issue, and bedside-check workflow?',
      concept: 'vasodilation-versus-hypovolemia',
    },
    {
      id: 'response', objectiveId: 'reassess-red-cell-response',
      question: 'What changed in modeled volume, hemoglobin, calculated oxygen delivery, and pressure after the red-cell action?',
      concept: 'vasodilation-versus-hypovolemia',
    },
  ] },
};
