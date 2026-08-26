/** Bounded acute-MI cardiogenic-shock recognition and initial response. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const CARDIOGENIC_SHOCK: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'cardiogenic-shock', version: '0.1.0', maturity: 'preview',
    title: 'Cardiogenic shock', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 9, difficulty: 'advanced', objectives: [
      { id: 'recognize-cardiogenic-shock-trajectory', statement: 'Recognize worsening hypoperfusion and activate experienced shock help.', measure: 'Brain, skin, kidney, lactate, pressure, and trajectory prompted multidisciplinary escalation.' },
      { id: 'review-cardiogenic-shock-cause-and-phenotype', statement: 'Review the acute-MI cause, left-sided congested phenotype, and immediate mechanical, rhythm, right-heart, and noncardiac alternatives.', measure: 'The fixed ECG, echo, lung, rhythm, and perfusion panel was integrated without diagnostic overreach.' },
      { id: 'record-cardiogenic-shock-bridge', statement: 'Record perfusion-linked vasopressor support without primary fluid loading while definitive care is mobilized.', measure: 'The bridge was bounded, reassessment-dependent, and did not prescribe a universal target or device.' },
      { id: 'escalate-cardiogenic-shock-cause-control', statement: 'Prioritize prompt culprit-vessel revascularization and expert selection of any further hemodynamic or mechanical support.', measure: 'Cause control preceded unselected device escalation or routine multivessel treatment.' },
      { id: 'reassess-cardiogenic-shock-trajectory', statement: 'Reassess pressure, perfusion, congestion, rhythm, gas exchange, and organ trajectory after initial support.', measure: 'The fixed response improved but did not close revascularization or shock-team work.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Sinha SS, Morrow DA, Kapur NK, Kataria R, Roswell RO. 2025 Concise Clinical Guidance: An ACC Expert Consensus Statement on the Evaluation and Management of Cardiogenic Shock. J Am Coll Cardiol. 2025;85:1618-1641.',
        'Rao SV, O’Donoghue ML, Ruel M, et al. 2025 ACC/AHA/ACEP/NAEMSP/SCAI Guideline for the Management of Patients With Acute Coronary Syndromes. Circulation. 2025;151:e771-e862.',
        'Monnet X, Messina A, Greco M, et al. ESICM guidelines on circulatory shock and hemodynamic monitoring 2025. Intensive Care Med. 2025;51:1971-2012.',
        'Mekontso Dessap A, AlShamsi F, Belletti A, et al. ESICM clinical practice guideline on fluid therapy in adult critically ill patients: part 2—the volume of resuscitation fluids. Intensive Care Med. 2025;51:461-477.',
      ] },
    limitations: ['cardiogenic-shock-findings-phenotype-and-response-are-authored',
      'cardiogenic-shock-support-and-revascularization-controls-are-proxies',
      'no-live-cardiogenic-shock-diagnosis-prescribing-device-procedure-or-outcome'],
  },
  patient: { ageYears: 64, sex: 'male', heightCm: 178, weightKg: 86, asaClass: 4,
    diagnosis: 'Authored left-ventricular-predominant shock after acute anterior myocardial infarction',
    procedure: 'Cardiogenic-shock response',
    comorbidities: ['Hypertension', 'Type 2 diabetes'], medications: ['Home medicines not represented'],
    allergies: ['No known drug allergies'], fasting: 'Emergency cardiac presentation; fasting state uncertain',
    baseline: { heartRateBpm: 112, meanArterialMmHg: 58, strokeVolumeMl: 34,
      hemoglobinGPerDl: 13.1, bloodVolumeMl: 5000, coreTemperatureC: 36.1,
      arterialStiffness: 1.2, baroreflexGain: 0.75, fixedStrokeVolume: false },
    airway: { difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Speaking in short phrases with no fixed upper-airway obstruction finding' },
    respiratory: { profile: 'moderately-ill' } },
  equipment: { monitoring: ['ecg', 'arterial-line', 'pulse-oximetry', 'temperature'],
    airwayDevice: 'facemask', ventilator: { mode: 'manual', fio2: 0.35,
      tidalVolumeMl: 420, respiratoryRateBpm: 28, freshGasFlowLPerMin: 10, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'cardiogenic-shock-presentation', type: 'narrative', target: 'cardiogenic-shock',
      atTick: 0, severity: 'critical',
      message: 'A 64-year-old man with an acute anterior ST-elevation myocardial-infarction pattern deteriorates while the catheterization pathway is being mobilized. Invasive pressure is 78/48 mmHg (MAP 58) with HR 112/min in sinus rhythm, cool mottled extremities, capillary refill 5 seconds, new confusion, urine output 10 mL in the last hour, and lactate rising from 3.1 to 4.8 mmol/L. SpO₂ is 91% on supplemental oxygen with respiratory rate 28/min and bilateral crackles. No response has been recorded.' },
    { id: 'cardiogenic-shock-boundary', type: 'narrative', target: 'cardiogenic-shock-boundary',
      atTick: 0, severity: 'warning',
      message: 'A fixed ECG reports persistent anterior ST elevation. Fixed focused echocardiography reports severe left-ventricular systolic dysfunction with anterior and apical akinesis, preserved right-ventricular size, no pericardial effusion, and no reported acute severe mitral regurgitation or ventricular-septal defect; bilateral B-lines support congestion. Validate the perfusion trajectory and activate the multidisciplinary shock and catheterization teams. Record norepinephrine bridge intent linked to perfusion without primary fluid loading, then prioritize prompt culprit-vessel revascularization. Inotrope, invasive-hemodynamic, transfer, and temporary-support choices remain expert, phenotype, trajectory, risk, and resource dependent; no device is routine. Examination, monitoring or test acquisition, diagnosis, oxygen or drug delivery, access, dosing, imaging, catheterization, revascularization, mechanical support, transfer, disposition, and outcome are not simulated.' },
  ],
  debrief: { rubric: [
    { id: 'cardiogenic-shock-recognition', objectiveId: 'recognize-cardiogenic-shock-trajectory', question: 'Which serial perfusion findings established shock and triggered multidisciplinary help?' },
    { id: 'cardiogenic-shock-phenotype', objectiveId: 'review-cardiogenic-shock-cause-and-phenotype', question: 'What supported a left-sided congested acute-MI phenotype, and which dangerous alternatives remained open?' },
    { id: 'cardiogenic-shock-bridge', objectiveId: 'record-cardiogenic-shock-bridge', question: 'Why was the initial bridge perfusion-linked and free of primary fluid loading or a universal target?' },
    { id: 'cardiogenic-shock-cause-control', objectiveId: 'escalate-cardiogenic-shock-cause-control', question: 'Why did prompt culprit-vessel revascularization take priority over unselected device escalation?' },
    { id: 'cardiogenic-shock-reassessment', objectiveId: 'reassess-cardiogenic-shock-trajectory', question: 'Which response findings improved, and which definitive shock work remained open?' },
  ] },
};
