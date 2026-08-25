/** Bounded adult ARDS lung-protective ventilation and reassessment pathway. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const ARDS_LUNG_PROTECTIVE_VENTILATION: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'ards-lung-protective-ventilation', version: '0.1.0', maturity: 'draft',
    title: 'ARDS lung-protective ventilation', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 10, difficulty: 'intermediate', objectives: [
      { id: 'review-ards-ventilation-baseline', statement: 'Review oxygenation, mechanics, current delivered tidal volume, plateau pressure, and the declared ARDS context before changing support.', measure: 'The initial gas-exchange and ventilator panel was integrated without treating saturation alone.' },
      { id: 'calculate-ards-predicted-body-weight', statement: 'Use sex and height, not actual weight, to identify the authored predicted-body-weight tidal-volume basis.', measure: 'The fixed 61.5 kg predicted body weight and current 8.1 mL/kg setting were recognized.' },
      { id: 'record-ards-lung-protective-settings', statement: 'Record a 6 mL/kg predicted-body-weight tidal-volume intent and plateau-pressure limit below 30 cm H₂O.', measure: 'The bounded 370 mL setting preceded reassessment.' },
      { id: 'reassess-ards-gas-and-mechanics', statement: 'Reassess plateau pressure, oxygenation, pH, carbon dioxide, synchrony, and circulation after the protective change.', measure: 'The fixed response accepted bounded hypercapnia without normalizing pH at the expense of protection.' },
      { id: 'escalate-moderate-severe-ards-support', statement: 'Record protocolized PEEP/FiO₂ and prolonged-prone-team intent with hemodynamic and device-safety monitoring.', measure: 'Persistent moderate-severe hypoxemia triggered escalation without recruitment-maneuver or ECMO claims.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Qadir N, Sahetya S, Munshi L, et al. An Update on Management of Adult Patients with Acute Respiratory Distress Syndrome: An Official ATS Clinical Practice Guideline. Am J Respir Crit Care Med. 2024;209:24-36.',
        'Fan E, Del Sorbo L, Goligher EC, et al. Mechanical Ventilation in Adult Patients with ARDS: An Official ATS/ESICM/SCCM Clinical Practice Guideline. Am J Respir Crit Care Med. 2017;195:1253-1263.',
      ] },
    limitations: ['ards-findings-settings-and-response-are-authored',
      'ards-ventilator-reassessment-peep-and-prone-controls-are-proxies',
      'no-live-ards-diagnosis-ventilator-management-proning-procedure-or-outcome'],
  },
  patient: { ageYears: 47, sex: 'female', heightCm: 170, weightKg: 92, asaClass: 4,
    diagnosis: 'Authored moderate-severe ARDS after pneumonia',
    procedure: 'Lung-protective ventilation setup and reassessment',
    comorbidities: ['Obesity'], medications: ['ICU infusions not represented'], allergies: ['No known drug allergies'],
    fasting: 'Enteral feeding held for current assessment', baseline: { heartRateBpm: 108,
      meanArterialMmHg: 72, strokeVolumeMl: 56, hemoglobinGPerDl: 10.8, bloodVolumeMl: 4700,
      coreTemperatureC: 38.1, arterialStiffness: 1.0, baroreflexGain: 0.9, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false, assessment: 'Established cuffed tracheal tube' },
    respiratory: { profile: 'healthy' } },
  equipment: { monitoring: ['ecg', 'arterial-line', 'pulse-oximetry', 'capnography', 'temperature'],
    ventilator: { mode: 'volume-control', fio2: 0.7, tidalVolumeMl: 500, respiratoryRateBpm: 24,
      freshGasFlowLPerMin: 10, delivering: true } },
  formulary: [],
  timeline: [
    { id: 'ards-lung-protective-presentation', type: 'narrative', target: 'ards-lung-protective-ventilation', atTick: 0,
      severity: 'critical', message: 'A 47-year-old woman, height 170 cm and actual weight 92 kg, is intubated for authored pneumonia-associated moderate-severe ARDS. Volume control delivers 500 mL at 24/min, PEEP 8 cm H₂O, and FiO₂ 0.70. SpO₂ is 90%; a fixed arterial panel reports pH 7.36, PaCO₂ 42 mmHg, and PaO₂ 64 mmHg. Plateau pressure is authored as 32 cm H₂O with passive synchrony; MAP is 72 mmHg without a new shock pattern. The lesson has not calculated predicted body weight or changed support.' },
    { id: 'ards-lung-protective-boundary', type: 'narrative', target: 'ards-lung-protective-boundary', atTick: 0,
      severity: 'warning', message: 'Review the baseline; calculate the fixed female predicted body weight from height; record 6 mL/kg predicted-body-weight tidal-volume and plateau-pressure-below-30 intent; reassess mechanics, gas exchange, synchrony, and circulation; then record protocolized PEEP/FiO₂ and prolonged-prone-team intent for persistent moderate-severe hypoxemia. Diagnosis, blood-gas sampling, ventilator setup or mechanics, sedation, paralysis, proning, recruitment maneuvers, procedures, imaging, fluid care, ECMO selection, liberation, disposition, and outcome are not simulated.' },
  ],
  debrief: { rubric: [
    { id: 'ards-baseline', objectiveId: 'review-ards-ventilation-baseline', question: 'Which gas-exchange and mechanics findings made the current setting unsafe despite a near-normal pH?' },
    { id: 'ards-pbw', objectiveId: 'calculate-ards-predicted-body-weight', question: 'Why did height and sex, rather than actual weight, determine the tidal-volume basis?' },
    { id: 'ards-protection', objectiveId: 'record-ards-lung-protective-settings', question: 'How did the tidal-volume and plateau-pressure limits reduce ventilator-induced lung-injury risk?' },
    { id: 'ards-reassessment', objectiveId: 'reassess-ards-gas-and-mechanics', question: 'Which post-change mechanics, gas, synchrony, and circulation findings mattered, and why was some hypercapnia acceptable?' },
    { id: 'ards-escalation', objectiveId: 'escalate-moderate-severe-ards-support', question: 'Why did persistent hypoxemia support protocolized PEEP/FiO₂ and prolonged-prone-team intent, and what remained outside this case?' },
  ] },
};
