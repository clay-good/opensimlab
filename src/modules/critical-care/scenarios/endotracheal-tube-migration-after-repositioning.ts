/** Bounded post-repositioning tracheal-tube migration lesson. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const ENDOTRACHEAL_TUBE_MIGRATION_AFTER_REPOSITIONING: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'endotracheal-tube-migration-after-repositioning', version: '0.1.0', maturity: 'draft',
    title: 'Post-turn endotracheal tube migration', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 7, difficulty: 'intermediate', objectives: [
      { id: 'recognize-post-repositioning-ventilation-change', statement: 'Recognize the immediate ventilation and gas-exchange change after repositioning.', measure: 'The temporal change, patient, exhaled volume, pressure, capnography, and oxygenation were integrated.' },
      { id: 'bridge-post-repositioning-oxygenation', statement: 'Call experienced airway and respiratory help and record immediate oxygenation and ventilation support intent.', measure: 'Support intent preceded definitive airway classification or correction.' },
      { id: 'integrate-tube-depth-and-bilateral-ventilation', statement: 'Compare pre/post tube depth, securement, cuff, bilateral ventilation, circuit, pressure, and gas exchange.', measure: 'The complete fixed airway-position panel was reviewed while plausible alternatives remained open.' },
      { id: 'record-experienced-tube-correction-intent', statement: 'Record experienced-airway correction and resecurement intent for the authored migrated tube.', measure: 'The proxy changed typed tube position without claiming physical repositioning or a universal depth.' },
      { id: 'reassess-tube-position-and-gas-exchange', statement: 'Prove bilateral ventilation, delivered breath, pressure, capnography, oxygenation, and circulation after correction intent.', measure: 'Closure required a fixed multi-signal response rather than one depth mark.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Tailleur R, Bathory I, Dolci M, Frascarolo P, Kern C, Schoettker P. Endotracheal tube displacement during head and neck movements: observational clinical trial. J Clin Anesth. 2016;32:54-58. PMID:27290945.',
        'Hansel J, Law JA, Chrimes N, Higgs A, Cook TM. Clinical tests for confirming tracheal intubation or excluding oesophageal intubation: a diagnostic test accuracy systematic review and meta-analysis. Anaesthesia. 2023;78:1020-1030. PMID:37325847.',
      ] },
    limitations: ['tube-migration-position-ventilation-and-response-are-authored',
      'tube-migration-controls-record-assessment-support-and-correction-intent-only',
      'no-live-auscultation-tube-handling-imaging-diagnosis-or-outcome'],
  },
  patient: { ageYears: 61, sex: 'female', heightCm: 164, weightKg: 74, asaClass: 4,
    diagnosis: 'Authored unilateral ventilation after ICU repositioning',
    procedure: 'Post-repositioning airway reassessment',
    comorbidities: ['Pneumonia'], medications: ['ICU infusions not represented'],
    allergies: ['No known drug allergies'], fasting: 'ICU patient; nutrition state not represented',
    baseline: { heartRateBpm: 104, meanArterialMmHg: 75, strokeVolumeMl: 58,
      hemoglobinGPerDl: 11.1, bloodVolumeMl: 4800, coreTemperatureC: 37.6,
      arterialStiffness: 1.05, baroreflexGain: 0.8, fixedStrokeVolume: false },
    airway: { difficulty: 0.25, difficultMaskVentilation: false,
      assessment: 'Established cuffed tracheal tube; documented 22 cm at the teeth before turning' },
    respiratory: { profile: 'moderately-ill' } },
  equipment: { monitoring: ['ecg', 'arterial-line', 'pulse-oximetry', 'capnography', 'temperature'],
    airwayDevice: 'tracheal-tube', ventilator: { mode: 'volume-control', fio2: 0.5,
      tidalVolumeMl: 420, respiratoryRateBpm: 18, freshGasFlowLPerMin: 10, delivering: true } },
  formulary: [],
  timeline: [
    { id: 'tube-migration-presentation', type: 'narrative',
      target: 'endotracheal-tube-migration-after-repositioning', atTick: 0, severity: 'critical',
      message: 'Immediately after a turn and head repositioning, volume control remains commanded at 420 mL and 18/min on FiO₂ 0.50, but exhaled volume is 310 mL, peak pressure has risen from 26 to 36 cm H₂O with plateau 22, left ventilation is markedly reduced while right ventilation persists, and continuous capnography shows EtCO₂ 45 mmHg. SpO₂ has fallen from 97% to 89%, HR is 104/min, and MAP is 75 mmHg. The pre-turn record was 22 cm at the teeth; the current fixed mark is 25 cm with intact securement and unchanged cuff state. The diagnosis is not announced.' },
    { id: 'tube-migration-boundary', type: 'narrative',
      target: 'endotracheal-tube-migration-after-repositioning-boundary', atTick: 0, severity: 'warning',
      message: 'Recognize the post-movement change; call respiratory-therapy, senior ICU, and experienced airway help; and record immediate oxygenation and ventilation support intent. Compare the patient, pleth, pulse, capnography, commanded and exhaled breaths, pressures, circuit, pre/post depth, securement, cuff state, bilateral chest movement and reported air entry, and whole gas-exchange trend. The fixed pattern supports right-mainstem migration while mucus plugging, pneumothorax, atelectasis, consolidation, circuit or ventilator problems, and other causes remain open. Record experienced-airway tube correction and resecurement intent; the control does not move a tube. Fixed 3-minute response is tube mark 22 cm, typed tracheal position, bilateral ventilation, exhaled volume 410 mL, peak pressure 27 cm H₂O, plateau 21, PEEP 8, continuous EtCO₂ 39 mmHg, SpO₂ 96% on unchanged FiO₂ 0.50, HR 94/min, and MAP 77 mmHg. Exact depth is a case fact, not a recommendation. The screen does not turn or examine a patient; auscultate; inspect equipment; measure depth or pressure; deliver oxygen or ventilation; reposition, withdraw, advance, exchange, or secure a tube; acquire or interpret imaging; perform bronchoscopy; diagnose; determine disposition; or predict outcome.' },
  ],
  debrief: { rubric: [
    { id: 'tube-migration-recognition', objectiveId: 'recognize-post-repositioning-ventilation-change', question: 'Which pre/post signals made the movement-linked deterioration credible?' },
    { id: 'tube-migration-bridge', objectiveId: 'bridge-post-repositioning-oxygenation', question: 'Why did support and experienced help precede final classification?' },
    { id: 'tube-migration-panel', objectiveId: 'integrate-tube-depth-and-bilateral-ventilation', question: 'How did depth, bilateral ventilation, pressure, exhaled volume, capnography, and alternatives fit together?' },
    { id: 'tube-migration-correction', objectiveId: 'record-experienced-tube-correction-intent', question: 'What made the correction bounded rather than a universal tube-depth instruction?' },
    { id: 'tube-migration-reassessment', objectiveId: 'reassess-tube-position-and-gas-exchange', question: 'Which independent signals proved the fixed response?' },
  ] },
};
