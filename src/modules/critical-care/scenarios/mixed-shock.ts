/** Bounded cardiac-vasodilatory mixed-shock recognition and response. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const MIXED_SHOCK: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'mixed-shock', version: '0.1.0', maturity: 'draft', title: 'Mixed shock',
    author: 'Open Sim Lab', license: 'CC BY-SA 4.0', estimatedMinutes: 9,
    difficulty: 'advanced', objectives: [
      { id: 'recognize-mixed-shock-discordance', statement: 'Recognize worsening shock with discordant cardiac and vasodilatory clues and activate experienced help.', measure: 'Perfusion, congestion, infection, trajectory, and treatment context prompted escalation.' },
      { id: 'classify-mixed-shock-hemodynamics', statement: 'Integrate output, filling pressure, vascular tone, echo, lungs, and perfusion without forcing one shock label.', measure: 'The authored panel supported a cardiac-vasodilatory phenotype without turning suggested ranges into diagnostic cutoffs.' },
      { id: 'record-mixed-shock-support', statement: 'Record concurrent tone and output support review while avoiding blind fluid loading.', measure: 'Support addressed both physiological halves and remained expert-selected and reassessment-dependent.' },
      { id: 'address-mixed-shock-causes', statement: 'Keep cardiac and infectious cause-control pathways active in parallel.', measure: 'Neither the cardiac nor pneumonia pathway was closed by the mixed classification.' },
      { id: 'reassess-mixed-shock-trajectory', statement: 'Reassess perfusion, hemodynamics, congestion, infection, gas exchange, and organ trajectory.', measure: 'The fixed response improved without claiming resolution or a universal endpoint.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'van Diepen S, Pöss J, Senaratne JM, Gage A, Morrow DA. Mixed Cardiogenic Shock: A Proposal for Standardized Classification, a Hemodynamic Definition, and Framework for Management. Circulation. 2024;150:1459-1468.',
        'Sinha SS, Morrow DA, Kapur NK, Kataria R, Roswell RO. 2025 Concise Clinical Guidance: An ACC Expert Consensus Statement on the Evaluation and Management of Cardiogenic Shock. J Am Coll Cardiol. 2025;85:1618-1641.',
        'Monnet X, Messina A, Greco M, et al. ESICM guidelines on circulatory shock and hemodynamic monitoring 2025. Intensive Care Med. 2025;51:1971-2012.',
        'Prescott HC, Antonelli M, Alhazzani W, et al. Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2026. Crit Care Med. 2026;54:725-812.',
      ] },
    limitations: ['mixed-shock-findings-hemodynamics-and-response-are-authored',
      'mixed-shock-support-and-cause-control-actions-are-proxies',
      'no-live-mixed-shock-diagnosis-prescribing-hemodynamic-procedure-or-outcome'],
  },
  patient: { ageYears: 66, sex: 'female', heightCm: 164, weightKg: 78, asaClass: 4,
    diagnosis: 'Authored cardiac-vasodilatory shock after myocardial infarction with pneumonia',
    procedure: 'Mixed-shock reassessment', comorbidities: ['Recent anterior myocardial infarction',
      'Ischemic cardiomyopathy', 'Pneumonia'], medications: ['Current vasoactive therapy not modeled'],
    allergies: ['No known drug allergies'], fasting: 'ICU patient; enteral-nutrition state not represented',
    baseline: { heartRateBpm: 122, meanArterialMmHg: 54, strokeVolumeMl: 32,
      hemoglobinGPerDl: 10.8, bloodVolumeMl: 4600, coreTemperatureC: 39.1,
      arterialStiffness: 1.05, baroreflexGain: 0.7, fixedStrokeVolume: false },
    airway: { difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Intubated with reported continuous capnography and bilateral ventilation' },
    respiratory: { profile: 'moderately-ill' } },
  equipment: { monitoring: ['ecg', 'arterial-line', 'pulse-oximetry', 'capnography', 'temperature'],
    airwayDevice: 'tracheal-tube', ventilator: { mode: 'volume-control', fio2: 0.5,
      tidalVolumeMl: 400, respiratoryRateBpm: 22, freshGasFlowLPerMin: 10, delivering: true } },
  formulary: [],
  timeline: [
    { id: 'mixed-shock-presentation', type: 'narrative', target: 'mixed-shock', atTick: 0,
      severity: 'critical', message: 'Two days after culprit-vessel PCI for anterior myocardial infarction, an intubated 66-year-old woman with new right-lower-lobe pneumonia deteriorates despite reported vasoactive support. MAP is 54 mmHg, HR 122/min in sinus rhythm, capillary refill 4 seconds, knees are mottled but hands remain warm, confusion is increasing, urine output is 10 mL/h, and lactate has risen from 3.4 to 5.1 mmol/L. Temperature is 39.1°C. SpO₂ is 92% on FiO₂ 0.50 with bilateral crackles. No response has been recorded.' },
    { id: 'mixed-shock-boundary', type: 'narrative', target: 'mixed-shock-boundary', atTick: 0,
      severity: 'warning', message: 'Fixed echocardiography reports LVEF 25%, preserved right-ventricular size, no effusion, and no reported acute severe mitral regurgitation or ventricular-septal defect. A fixed pulmonary-artery-catheter teaching panel reports cardiac index 1.7 L/min/m², pulmonary-capillary wedge pressure 24 mmHg, central venous pressure 11 mmHg, and SVR 720 dyn·s/cm⁵. Bilateral B-lines and right-lower-lobe consolidation are reported. This combination supports a cardiac-vasodilatory mixed phenotype, but suggested ranges are not universal diagnostic cutoffs and current vasoactive treatment changes their interpretation. Activate shock, cardiac, and infection help; review rhythm, ischemia, mechanical complications, right-heart, obstruction, bleeding, medication, equipment, and infection alternatives. Record tone support plus expert output-support review without blind fluid loading, keep cardiac and pneumonia cause-control pathways active, and reassess the whole trajectory. Examination, monitoring, catheter or test acquisition, calculation, diagnosis, oxygen, fluid or drug delivery, access, dosing, imaging, procedures, revascularization, source treatment, mechanical support, transfer, disposition, and outcome are not simulated.' },
  ],
  debrief: { rubric: [
    { id: 'mixed-shock-discordance', objectiveId: 'recognize-mixed-shock-discordance', question: 'Which conflicting findings and trends prompted mixed-shock escalation?' },
    { id: 'mixed-shock-hemodynamics', objectiveId: 'classify-mixed-shock-hemodynamics', question: 'How did output, filling pressure, tone, congestion, and treatment context support a mixed phenotype without creating universal cutoffs?' },
    { id: 'mixed-shock-support', objectiveId: 'record-mixed-shock-support', question: 'Why did support address both vascular tone and output while avoiding blind fluid loading?' },
    { id: 'mixed-shock-causes', objectiveId: 'address-mixed-shock-causes', question: 'Which cardiac and infectious cause-control pathways remained active?' },
    { id: 'mixed-shock-response', objectiveId: 'reassess-mixed-shock-trajectory', question: 'Which findings improved, and which unresolved trajectory work remained?' },
  ] },
};
