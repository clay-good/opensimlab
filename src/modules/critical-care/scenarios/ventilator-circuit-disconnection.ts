/** Bounded ventilator-circuit disconnection with falling oxygen reserve. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const VENTILATOR_CIRCUIT_DISCONNECTION: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'ventilator-circuit-disconnection', version: '0.1.0', maturity: 'draft',
    title: 'Ventilator circuit disconnection', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 7, difficulty: 'intermediate', objectives: [
      { id: 'recognize-ventilator-circuit-disconnection', statement: 'Recognize lost delivered ventilation despite unchanged commanded settings.', measure: 'The fixed alarm, exhaled volume, pressure, capnography, patient, pleth, and saturation were integrated.' },
      { id: 'bridge-ventilator-circuit-disconnection', statement: 'Call for help and record immediate alternative oxygenation and ventilation intent while reserve is falling.', measure: 'The bridge preceded circuit correction and did not wait for a definitive equipment label.' },
      { id: 'inspect-ventilator-circuit-disconnection', statement: 'Trace the patient, airway, circuit, ventilator, and gas source while keeping other causes open.', measure: 'The fixed review localized circuit discontinuity without claiming a physical inspection.' },
      { id: 'restore-ventilator-circuit-support', statement: 'Record restoration of circuit continuity and established ventilator support.', measure: 'Reconnection intent followed immediate support and a source-to-patient check.' },
      { id: 'reassess-ventilator-circuit-response', statement: 'Prove delivered breaths and reassess oxygenation, ventilation, pressures, capnography, and circulation.', measure: 'Closure required a fixed whole-system response rather than disappearance of one alarm.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Goodfellow LT, Miller AG, Varekojis SM, et al. AARC Clinical Practice Guideline: Patient-Ventilator Assessment. Respir Care. 2024;69:1042-1054.',
        'U.S. Food and Drug Administration. Lung Therapy Component Recall: Baxter Healthcare Corporation Recalls Certain Volara System Single-Patient Use Circuits and Blue Ventilator Adapter Assemblies Due to Disconnection Risk That May Prevent Proper Ventilation. 2024.',
        'U.S. Food and Drug Administration. Philips Respironics Issues Voluntary Recall Notification/Field Safety Notice for the V60 Ventilator Product Family. 2022.',
        'Görges M, Markewitz BA, Westenskow DR. Improving alarm performance in the medical intensive care unit using delays and clinical context. Anesth Analg. 2009;108:1546-1552.',
      ] },
    limitations: ['ventilator-disconnection-alarm-findings-reserve-and-response-are-authored',
      'ventilator-disconnection-controls-record-intent-not-device-handling-or-care',
      'no-live-circuit-inspection-oxygen-ventilation-reconnection-or-outcome'],
  },
  patient: { ageYears: 63, sex: 'male', heightCm: 177, weightKg: 84, asaClass: 4,
    diagnosis: 'Authored loss of delivered ventilation after circuit discontinuity',
    procedure: 'Ventilator disconnect alarm with falling oxygen reserve',
    comorbidities: ['Pneumonia', 'Moderate ARDS'], medications: ['ICU infusions not represented'],
    allergies: ['No known drug allergies'], fasting: 'ICU patient; nutrition state not represented',
    baseline: { heartRateBpm: 108, meanArterialMmHg: 76, strokeVolumeMl: 56,
      hemoglobinGPerDl: 11.2, bloodVolumeMl: 5000, coreTemperatureC: 38.0,
      arterialStiffness: 1.05, baroreflexGain: 0.85, fixedStrokeVolume: false },
    airway: { difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Established cuffed tracheal tube with unchanged depth and securement' },
    respiratory: { profile: 'moderately-ill' } },
  equipment: { monitoring: ['ecg', 'arterial-line', 'pulse-oximetry', 'capnography', 'temperature'],
    airwayDevice: 'tracheal-tube', ventilator: { mode: 'volume-control', fio2: 0.45,
      tidalVolumeMl: 420, respiratoryRateBpm: 20, freshGasFlowLPerMin: 10, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'ventilator-circuit-disconnection-presentation', type: 'narrative',
      target: 'ventilator-circuit-disconnection', atTick: 0, severity: 'critical',
      message: 'A fixed high-priority disconnect alarm is active after its declared 10-second teaching delay. The ventilator remains commanded to volume control, 420 mL, 20/min, PEEP 8 cm H₂O, and FiO₂ 0.45, but exhaled tidal volume and minute ventilation are 0, airway pressure and measured PEEP have collapsed to 0 cm H₂O, and the capnogram is absent. The tracheal tube depth and securement are unchanged. A coherent pleth shows SpO₂ falling from 96% to 88%, HR 108/min, MAP 76 mmHg, and no spontaneous respiratory effort. The diagnosis is not announced; no response has been recorded.' },
    { id: 'ventilator-circuit-disconnection-boundary', type: 'narrative',
      target: 'ventilator-circuit-disconnection-boundary', atTick: 0, severity: 'warning',
      message: 'Announce the loss of delivered ventilation, call respiratory-therapy and senior ICU help, and record immediate alternative oxygenation and ventilation intent without waiting for a final device label. Cross-check the patient, pleth, pulse, airway, capnography, commanded versus exhaled breaths, pressure, circuit from patient to ventilator, filters and accessories, ventilator, and gas source while keeping tube displacement or obstruction, pneumothorax, equipment failure, apnea, and monitor failure open. The fixed review localizes a complete circuit discontinuity; record reconnection and restoration of established support, then require exhaled volume, minute ventilation, pressure, PEEP, capnogram, chest movement, oxygenation, and circulation before closure. Fixed 2-minute response is exhaled tidal volume 410 mL, minute ventilation 8.2 L/min, peak pressure 27 cm H₂O, PEEP 8 cm H₂O, EtCO₂ 36 mmHg with a continuous waveform, SpO₂ 94% on unchanged FiO₂ 0.45, HR 98/min, and MAP 77 mmHg. Alarm timing and priority, oxygen reserve, findings, and response are authored and not transferable across devices or patients. Alarm hearing or configuration, examination, monitoring, circuit or airway inspection, bag-mask or artificial-airway ventilation, oxygen delivery, physical reconnection, ventilator programming, diagnosis, procedures, disposition, and outcome are not simulated.' },
  ],
  debrief: { rubric: [
    { id: 'ventilator-disconnection-recognition', objectiveId: 'recognize-ventilator-circuit-disconnection', question: 'Which signals proved that commanded settings were not delivered breaths?' },
    { id: 'ventilator-disconnection-bridge', objectiveId: 'bridge-ventilator-circuit-disconnection', question: 'Why did alternative oxygenation and ventilation intent precede definitive troubleshooting?' },
    { id: 'ventilator-disconnection-inspection', objectiveId: 'inspect-ventilator-circuit-disconnection', question: 'How did the patient-to-source trace localize the problem while preserving alternatives?' },
    { id: 'ventilator-disconnection-restoration', objectiveId: 'restore-ventilator-circuit-support', question: 'What had to be restored after immediate support?' },
    { id: 'ventilator-disconnection-reassessment', objectiveId: 'reassess-ventilator-circuit-response', question: 'Which independent patient and device signals proved that support was restored?' },
  ] },
};
