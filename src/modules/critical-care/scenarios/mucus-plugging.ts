/** Bounded adult retained-secretion and mucus-plugging reassessment. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const MUCUS_PLUGGING: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'mucus-plugging', version: '0.1.0', maturity: 'draft',
    title: 'Mucus plugging', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 8, difficulty: 'intermediate', objectives: [
      { id: 'support-mucus-plugging-and-call-help', statement: 'Support oxygenation and call respiratory-therapy and senior help while assessing abrupt airway resistance.', measure: 'Support and help preceded airway-clearance intent.' },
      { id: 'review-mucus-plugging-indicators', statement: 'Integrate breath sounds, visible secretions, flow waveform, peak-to-plateau pressure, tube, circuit, gas exchange, and circulation.', measure: 'Multiple retained-secretion indicators were reviewed without treating them as diagnostic proof.' },
      { id: 'record-indicated-airway-suction-intent', statement: 'Record preoxygenated, as-needed artificial-airway suction intent with routine saline avoided.', measure: 'The proxy preserved procedure and equipment boundaries.' },
      { id: 'reassess-mucus-plugging-response', statement: 'Reassess secretions, graphics, pressures, oxygenation, ventilation, breath sounds, and circulation after suction.', measure: 'The fixed response showed partial central-airway improvement with persistent left-base concern.' },
      { id: 'escalate-persistent-mucus-plugging', statement: 'Escalate persistent focal collapse for imaging and experienced airway evaluation while keeping alternatives open.', measure: 'The plan did not make routine bronchoscopy or one diagnosis universal.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Blakeman TC, Scott JB, Yoder MA, Capellari E, Strickland SL. AARC Clinical Practice Guidelines: Artificial Airway Suctioning. Respir Care. 2022;67:258-271.',
        'Goodfellow LT, Miller AG, Varekojis SM, et al. AARC Clinical Practice Guideline: Patient-Ventilator Assessment. Respir Care. 2024;69:1042-1054.',
      ] },
    limitations: ['mucus-plugging-findings-clearance-and-response-are-authored',
      'mucus-plugging-suction-imaging-and-airway-controls-are-proxies',
      'no-live-mucus-plugging-diagnosis-suction-bronchoscopy-or-outcome'],
  },
  patient: { ageYears: 64, sex: 'male', heightCm: 178, weightKg: 82, asaClass: 4,
    diagnosis: 'Authored retained secretions with persistent focal mucus-plug concern',
    procedure: 'Artificial-airway secretion assessment and reassessment',
    comorbidities: ['Pneumonia'], medications: ['ICU infusions not represented'],
    allergies: ['No known drug allergies'], fasting: 'Enteral feeding held for current assessment',
    baseline: { heartRateBpm: 108, meanArterialMmHg: 74, strokeVolumeMl: 58,
      hemoglobinGPerDl: 11.8, bloodVolumeMl: 5000, coreTemperatureC: 38.1,
      arterialStiffness: 1.0, baroreflexGain: 0.9, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Established cuffed tracheal tube' }, respiratory: { profile: 'moderately-ill' } },
  equipment: { monitoring: ['ecg', 'arterial-line', 'pulse-oximetry', 'capnography', 'temperature'],
    ventilator: { mode: 'volume-control', fio2: 0.45, tidalVolumeMl: 440,
      respiratoryRateBpm: 20, freshGasFlowLPerMin: 10, delivering: true } },
  formulary: [],
  timeline: [
    { id: 'mucus-plugging-presentation', type: 'narrative', target: 'mucus-plugging', atTick: 0,
      severity: 'critical', message: 'A 64-year-old intubated man with pneumonia develops coarse central breath sounds, visible thick secretion in the tracheal tube, and a new sawtooth expiratory-flow pattern. Peak pressure has risen from 27 to 38 cm H₂O while passive plateau pressure remains 23 cm H₂O. Left-base air entry is reduced, SpO₂ is 87% on FiO₂ 0.45, ETCO₂ is 46 mmHg with a continuous capnogram, HR is 108/min, and MAP is 74 mmHg. Tube depth and cuff state are unchanged and the circuit remains connected. No airway-clearance response has been recorded.' },
    { id: 'mucus-plugging-boundary', type: 'narrative', target: 'mucus-plugging-boundary', atTick: 0,
      severity: 'warning', message: 'Support oxygenation and call experienced help; integrate breath sounds, visible secretion, flow graphic, pressures, tube, circuit, gas exchange, and circulation; record preoxygenated as-needed suction intent without routine saline; review the fixed post-suction response; then escalate persistent focal abnormality for imaging and experienced airway evaluation while keeping tube migration, pneumothorax, atelectasis, consolidation, blood, foreign body, and equipment problems open. Routine bronchoscopy is not the default. Examination, equipment checks, waveform or mechanics acquisition, suction technique, secretion removal, imaging, bronchoscopy, diagnosis, ventilator programming, drug delivery, procedures, disposition, and outcome are not simulated.' },
  ],
  debrief: { rubric: [
    { id: 'mucus-support', objectiveId: 'support-mucus-plugging-and-call-help', question: 'How were oxygenation and help supported while the airway-resistance pattern was assessed?' },
    { id: 'mucus-indicators', objectiveId: 'review-mucus-plugging-indicators', question: 'Which combined indicators supported as-needed airway clearance, and which alternatives remained?' },
    { id: 'mucus-suction', objectiveId: 'record-indicated-airway-suction-intent', question: 'Which preparation and restraint made the suction intent evidence-aligned?' },
    { id: 'mucus-response', objectiveId: 'reassess-mucus-plugging-response', question: 'Which findings improved after the proxy and which focal concern persisted?' },
    { id: 'mucus-escalation', objectiveId: 'escalate-persistent-mucus-plugging', question: 'Why did the persistent focal pattern require imaging and experienced airway evaluation rather than routine bronchoscopy?' },
  ] },
};
