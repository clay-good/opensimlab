/** Bounded adult patient-ventilator dyssynchrony recognition and reassessment. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const VENTILATOR_DYSSYNCHRONY: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'ventilator-dyssynchrony', version: '0.1.0', maturity: 'preview',
    title: 'Ventilator dyssynchrony', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 9, difficulty: 'intermediate', objectives: [
      { id: 'review-dyssynchrony-patient-and-graphics', statement: 'Integrate patient effort with pressure, flow, volume, and delivered-breath observations.', measure: 'The fixed scooping, premature cycling, double triggering, and stacked volume were reviewed together.' },
      { id: 'review-dyssynchrony-drivers', statement: 'Review pain, respiratory drive, airway, secretions, circuit, auto-PEEP, gas exchange, and circulation before changing support.', measure: 'The authored reversible-driver panel preceded phenotype classification.' },
      { id: 'classify-dyssynchrony-pattern', statement: 'Classify the bounded flow-starvation and premature-cycling pattern without treating every irregular breath as equivalent.', measure: 'Double triggering was linked to excess delivered volume and ongoing patient effort.' },
      { id: 'record-dyssynchrony-correction-intent', statement: 'Record analgesia-first and respiratory-therapy adjustment intent that matches flow and cycling while preserving lung-protective limits.', measure: 'The plan avoided reflex deep-sedation or paralysis claims.' },
      { id: 'reassess-dyssynchrony-response', statement: 'Reassess comfort, effort, graphics, delivered volume, pressures, gas exchange, and circulation after adjustment.', measure: 'The fixed 10-minute response demonstrated improvement without claiming universal settings.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Goodfellow LT, Miller AG, Varekojis SM, et al. AARC Clinical Practice Guideline: Patient-Ventilator Assessment. Respir Care. 2024;69:1042-1054.',
        'Sottile PD, Albers D, Higgins C, Mckeehan J, Moss MM. The Association Between Ventilator Dyssynchrony, Delivered Tidal Volume, and Sedation. Crit Care Med. 2018;46:e151-e157.',
      ] },
    limitations: ['dyssynchrony-patient-graphics-drivers-and-response-are-authored',
      'dyssynchrony-waveform-ventilator-and-analgesia-controls-are-proxies',
      'no-live-dyssynchrony-diagnosis-ventilator-prescribing-procedure-or-outcome'],
  },
  patient: { ageYears: 58, sex: 'male', heightCm: 175, weightKg: 78, asaClass: 4,
    diagnosis: 'Authored flow-starvation and premature-cycling dyssynchrony',
    procedure: 'Patient-ventilator interaction review and reassessment',
    comorbidities: ['Pneumonia'], medications: ['ICU infusions not represented'],
    allergies: ['No known drug allergies'], fasting: 'Enteral feeding held for current assessment',
    baseline: { heartRateBpm: 104, meanArterialMmHg: 77, strokeVolumeMl: 60,
      hemoglobinGPerDl: 11.6, bloodVolumeMl: 5000, coreTemperatureC: 37.9,
      arterialStiffness: 1.0, baroreflexGain: 0.9, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Established cuffed tracheal tube' }, respiratory: { profile: 'healthy' } },
  equipment: { monitoring: ['ecg', 'arterial-line', 'pulse-oximetry', 'capnography', 'temperature'],
    ventilator: { mode: 'volume-control', fio2: 0.4, tidalVolumeMl: 420,
      respiratoryRateBpm: 18, freshGasFlowLPerMin: 10, delivering: true } },
  formulary: [],
  timeline: [
    { id: 'ventilator-dyssynchrony-presentation', type: 'narrative',
      target: 'ventilator-dyssynchrony', atTick: 0, severity: 'critical',
      message: 'A 58-year-old intubated man is awake enough to signal discomfort and has visible inspiratory effort on volume control: 420 mL at 18/min, PEEP 8 cm H₂O, and FiO₂ 0.40. In a fixed 20-breath observation, pressure-time scooping suggests insufficient inspiratory flow, early ventilator cycling is followed by continued patient effort, and 8 breaths double trigger. Stacked delivered volume reaches an authored 760 mL; peak pressure is 30 cm H₂O and passive plateau pressure was 22 cm H₂O before this interaction. SpO₂ is 93%, HR 104/min, MAP 77 mmHg, pH 7.31, and PaCO₂ 50 mmHg. No structured assessment has been recorded.' },
    { id: 'ventilator-dyssynchrony-boundary', type: 'narrative',
      target: 'ventilator-dyssynchrony-boundary', atTick: 0, severity: 'warning',
      message: 'Review patient effort with pressure, flow, volume, and delivered breaths; review fixed pain, drive, airway, secretion, circuit, auto-PEEP, gas, and circulation drivers; classify the bounded pattern; record analgesia-first plus respiratory-therapy flow and cycling adjustment intent while preserving protective volume and pressure; then review the fixed 10-minute response. Examination, pain or sedation measurement, airway and equipment handling, waveform acquisition, diagnosis, mode or setting selection, drug prescribing or delivery, paralysis, blood sampling, respiratory-therapy skill, procedures, disposition, and outcome are not simulated.' },
  ],
  debrief: { rubric: [
    { id: 'dyssynchrony-graphics', objectiveId: 'review-dyssynchrony-patient-and-graphics', question: 'Which patient, pressure, flow, volume, and delivered-breath observations established a real interaction problem?' },
    { id: 'dyssynchrony-drivers', objectiveId: 'review-dyssynchrony-drivers', question: 'Which reversible drivers were reviewed before changing support, and why?' },
    { id: 'dyssynchrony-pattern', objectiveId: 'classify-dyssynchrony-pattern', question: 'Why did this fixed pattern fit flow starvation with premature cycling and double triggering?' },
    { id: 'dyssynchrony-correction', objectiveId: 'record-dyssynchrony-correction-intent', question: 'How did the plan match patient demand while retaining volume and pressure guardrails?' },
    { id: 'dyssynchrony-response', objectiveId: 'reassess-dyssynchrony-response', question: 'Which 10-minute changes showed improvement, and what remained outside the simulator?' },
  ] },
};
