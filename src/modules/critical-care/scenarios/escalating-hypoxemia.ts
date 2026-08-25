/** Bounded structured reassessment of escalating hypoxemia in a ventilated adult. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const ESCALATING_HYPOXEMIA: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'escalating-hypoxemia', version: '0.1.0', maturity: 'draft',
    title: 'Escalating hypoxemia', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 9, difficulty: 'intermediate', objectives: [
      { id: 'validate-hypoxemia-signal', statement: 'Treat the saturation decline as urgent while corroborating signal quality, trend, and the fixed arterial panel.', measure: 'A coherent pleth and matching PaO₂ established a credible decline rather than a monitor-only diagnosis.' },
      { id: 'support-hypoxemia-and-call-help', statement: 'Record immediate oxygen-support and senior plus respiratory-therapy help while troubleshooting proceeds.', measure: 'Support and escalation began before a definitive cause was assumed.' },
      { id: 'trace-oxygen-delivery-path', statement: 'Systematically review oxygen source, circuit, capnography, tracheal-tube depth, and the fixed suction-path check.', measure: 'Equipment and airway threats were reviewed in an outside-in sequence.' },
      { id: 'integrate-hypoxemia-bedside-pattern', statement: 'Integrate bilateral air entry, pressure changes, capnography, and circulation before narrowing the differential.', measure: 'The fixed pattern supported unresolved parenchymal hypoxemia without claiming diagnostic exclusion.' },
      { id: 'escalate-and-reassess-hypoxemia', statement: 'Record urgent gas and imaging intent, protocolized lung-protective support, and whole-patient reassessment.', measure: 'The fixed response was reviewed without implying a universal setting or outcome.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Defence Medical Services. Invasive Mechanical Ventilation. Clinical Guidelines for Operations. Updated 2026-07-01.',
        'Bohringer C, Liu H. Hypoxemia after Emergency Intubation. AHRQ Patient Safety Network. 2024.',
      ] },
    limitations: ['escalating-hypoxemia-findings-and-response-are-authored',
      'escalating-hypoxemia-equipment-airway-and-examination-controls-are-proxies',
      'no-live-hypoxemia-diagnosis-ventilator-management-procedure-or-outcome'],
  },
  patient: { ageYears: 63, sex: 'male', heightCm: 178, weightKg: 81, asaClass: 4,
    diagnosis: 'Authored worsening bilateral parenchymal hypoxemia',
    procedure: 'Structured ventilated-patient hypoxemia reassessment',
    comorbidities: ['Hypertension'], medications: ['ICU infusions not represented'],
    allergies: ['No known drug allergies'], fasting: 'Enteral feeding held for current assessment',
    baseline: { heartRateBpm: 106, meanArterialMmHg: 75, strokeVolumeMl: 58,
      hemoglobinGPerDl: 11.2, bloodVolumeMl: 5000, coreTemperatureC: 37.7,
      arterialStiffness: 1.1, baroreflexGain: 0.9, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Established cuffed tracheal tube, authored 23 cm at the teeth' },
    respiratory: { profile: 'healthy' } },
  equipment: { monitoring: ['ecg', 'arterial-line', 'pulse-oximetry', 'capnography', 'temperature'],
    ventilator: { mode: 'volume-control', fio2: 0.5, tidalVolumeMl: 430,
      respiratoryRateBpm: 22, freshGasFlowLPerMin: 10, delivering: true } },
  formulary: [],
  timeline: [
    { id: 'escalating-hypoxemia-presentation', type: 'narrative', target: 'escalating-hypoxemia',
      atTick: 0, severity: 'critical', message: 'A 63-year-old intubated man with bilateral inflammatory lung opacities deteriorates after a routine turn. On unchanged volume-control support of 430 mL at 22/min, PEEP 10 cm H₂O, and FiO₂ 0.50, SpO₂ falls over 6 minutes from 94% to 84%. The pleth is strong and regular; a fixed arterial panel reports PaO₂ 51 mmHg, pH 7.33, and PaCO₂ 47 mmHg. HR is 106/min and MAP 75 mmHg. No troubleshooting or support change has been recorded.' },
    { id: 'escalating-hypoxemia-boundary', type: 'narrative',
      target: 'escalating-hypoxemia-boundary', atTick: 0, severity: 'warning',
      message: 'Validate the signal and trend; record immediate oxygen support and senior plus respiratory-therapy help; trace oxygen source, circuit, capnography, tube depth, and suction path; integrate bilateral chest, pressure, capnography, and circulation findings; then record urgent gas and imaging intent, protocolized lung-protective escalation, and fixed reassessment. Examination, signal acquisition, equipment manipulation, catheter passage, blood sampling, imaging, diagnosis, ventilator programming, airway rescue, recruitment, bronchoscopy, decompression, tube exchange, proning, ECMO, disposition, and outcome are not simulated.' },
  ],
  debrief: { rubric: [
    { id: 'hypoxemia-signal', objectiveId: 'validate-hypoxemia-signal', question: 'Which observations made the falling saturation credible without making the pulse oximeter diagnostic?' },
    { id: 'hypoxemia-support', objectiveId: 'support-hypoxemia-and-call-help', question: 'Why did oxygen support and experienced help begin before the cause was known?' },
    { id: 'hypoxemia-path', objectiveId: 'trace-oxygen-delivery-path', question: 'How did the outside-in source, circuit, capnography, tube, and suction-path review protect against fixation?' },
    { id: 'hypoxemia-pattern', objectiveId: 'integrate-hypoxemia-bedside-pattern', question: 'Which fixed chest, pressure, capnography, and circulation findings narrowed immediate threats without excluding them?' },
    { id: 'hypoxemia-escalation', objectiveId: 'escalate-and-reassess-hypoxemia', question: 'What was escalated, what changed on reassessment, and which decisions remained outside this rehearsal?' },
  ] },
};
