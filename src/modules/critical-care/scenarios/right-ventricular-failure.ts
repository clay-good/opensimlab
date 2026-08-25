/** Bounded decompensated pulmonary-hypertension right-ventricular-failure response. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const RIGHT_VENTRICULAR_FAILURE: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'right-ventricular-failure', version: '0.1.0', maturity: 'draft',
    title: 'Right ventricular failure', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 9, difficulty: 'advanced', objectives: [
      { id: 'recognize-rv-failure-trajectory', statement: 'Recognize RV failure from congestion and underperfusion, then activate specialist shock help.', measure: 'The whole-patient trajectory, rather than pressure alone, prompted escalation.' },
      { id: 'review-rv-failure-phenotype', statement: 'Integrate the fixed echo and hemodynamic pattern while keeping acute triggers and dangerous alternatives open.', measure: 'RV dilation, systolic dysfunction, ventricular interdependence, high right-sided filling pressure, and low output were reviewed without treating one value as diagnostic.' },
      { id: 'record-rv-failure-support', statement: 'Record an expert-selected support intent that protects systemic perfusion, oxygenation, acid-base balance, rhythm, and the pressure-loaded RV.', measure: 'The plan avoided indiscriminate fluid, automatic decongestion, universal targets, and simulated prescribing.' },
      { id: 'address-rv-failure-triggers', statement: 'Keep reversible precipitant and pulmonary-vascular therapy pathways active.', measure: 'Hypoxia, acidosis, infection, arrhythmia, ischemia, embolism, medication interruption, and ventilatory load remained under review.' },
      { id: 'reassess-rv-failure-trajectory', statement: 'Reassess perfusion, congestion, rhythm, oxygenation, RV pattern, filling pressure, output, and organ trajectory.', measure: 'The fixed response improved without claiming resolution or a universal endpoint.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Humbert M, Kovacs G, Hoeper MM, et al. 2022 ESC/ERS Guidelines for the diagnosis and treatment of pulmonary hypertension. Eur Heart J. 2022;43:3618-3731.',
        'Konstam MA, Kiernan MS, Bernstein D, et al. Evaluation and Management of Right-Sided Heart Failure: A Scientific Statement From the American Heart Association. Circulation. 2018;137:e578-e622.',
        'Sinha SS, Morrow DA, Kapur NK, Kataria R, Roswell RO. 2025 Concise Clinical Guidance: An ACC Expert Consensus Statement on the Evaluation and Management of Cardiogenic Shock. J Am Coll Cardiol. 2025;85:1618-1641.',
        'Monnet X, Messina A, Greco M, et al. ESICM guidelines on circulatory shock and hemodynamic monitoring 2025. Intensive Care Med. 2025;51:1971-2012.',
      ] },
    limitations: ['right-ventricular-failure-findings-hemodynamics-and-response-are-authored',
      'right-ventricular-failure-support-and-trigger-actions-are-proxies',
      'no-live-right-ventricular-failure-diagnosis-prescribing-procedure-or-outcome'],
  },
  patient: { ageYears: 52, sex: 'female', heightCm: 165, weightKg: 70, asaClass: 4,
    diagnosis: 'Authored acute-on-chronic pulmonary-arterial-hypertension decompensation',
    procedure: 'Right ventricular failure reassessment',
    comorbidities: ['Pulmonary arterial hypertension', 'Chronic right-ventricular dysfunction'],
    medications: ['Pulmonary-vascular therapy regimen not modeled'], allergies: ['No known drug allergies'],
    fasting: 'ICU patient; enteral-nutrition state not represented',
    baseline: { heartRateBpm: 116, meanArterialMmHg: 58, strokeVolumeMl: 31,
      hemoglobinGPerDl: 12.1, bloodVolumeMl: 4500, coreTemperatureC: 37.8,
      arterialStiffness: 1.05, baroreflexGain: 0.7, fixedStrokeVolume: false },
    airway: { difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Spontaneously breathing with reported patent airway' },
    respiratory: { profile: 'moderately-ill' } },
  equipment: { monitoring: ['ecg', 'arterial-line', 'pulse-oximetry', 'temperature'],
    airwayDevice: 'facemask', ventilator: { mode: 'manual', fio2: 0.4, tidalVolumeMl: 420,
      respiratoryRateBpm: 24, freshGasFlowLPerMin: 10, delivering: true } },
  formulary: [],
  timeline: [
    { id: 'rv-failure-presentation', type: 'narrative', target: 'right-ventricular-failure',
      atTick: 0, severity: 'critical', message: 'A 52-year-old woman with pulmonary arterial hypertension has worsening edema and abdominal distension after several days of poor intake and interrupted pulmonary-vascular therapy. MAP is 58 mmHg, HR 116/min in sinus rhythm, capillary refill is 5 seconds, extremities are cool, mentation is slowing, urine output is 12 mL/h, and lactate has risen from 2.8 to 4.3 mmol/L. JVP is reported elevated, lungs have no reported B-lines, and SpO₂ is 91% on reported supplemental oxygen. No response has been recorded.' },
    { id: 'rv-failure-boundary', type: 'narrative', target: 'right-ventricular-failure-boundary',
      atTick: 0, severity: 'warning', message: 'Fixed echocardiography reports a severely dilated RV with reduced systolic function, systolic septal flattening, a small underfilled LV, no effusion, and no reported acute severe left-sided valve lesion. A fixed teaching panel reports CVP 18 mmHg, pulmonary-capillary wedge pressure 10 mmHg, and cardiac index 1.8 L/min/m². These authored findings support a pressure-loaded RV-failure pattern with systemic congestion and low output; no single value is a universal diagnostic or treatment cutoff. Activate pulmonary-hypertension, cardiac, and shock help. Review oxygenation, acid-base balance, rhythm, ischemia, infection, acute pulmonary embolism, medication interruption, airway pressure, and other triggers. Record individualized preload, systemic-perfusion, pulmonary-afterload, and RV-contractility review without reflex fluid loading or reflex decongestion; keep precipitant and specialist pulmonary-vascular therapy pathways active; then reassess the whole trajectory. Examination, monitoring, ECG, laboratory, echo, catheter or imaging acquisition or interpretation, calculation, diagnosis, oxygen or ventilatory change, fluid, diuresis or drug delivery, access, dosing, procedures, mechanical support, transfer, disposition, and outcome are not simulated.' },
  ],
  debrief: { rubric: [
    { id: 'rv-failure-recognition', objectiveId: 'recognize-rv-failure-trajectory', question: 'Which congestion and underperfusion findings made this an RV-failure emergency?' },
    { id: 'rv-failure-phenotype', objectiveId: 'review-rv-failure-phenotype', question: 'How did the fixed RV, septal, LV, filling-pressure, and output findings shape the phenotype without creating cutoffs?' },
    { id: 'rv-failure-support', objectiveId: 'record-rv-failure-support', question: 'Why did support protect perfusion and the pressure-loaded RV without an automatic fluid or decongestion rule?' },
    { id: 'rv-failure-triggers', objectiveId: 'address-rv-failure-triggers', question: 'Which reversible triggers and disease-specific pathways remained active?' },
    { id: 'rv-failure-response', objectiveId: 'reassess-rv-failure-trajectory', question: 'Which findings improved, and which unresolved trajectory work remained?' },
  ] },
};
