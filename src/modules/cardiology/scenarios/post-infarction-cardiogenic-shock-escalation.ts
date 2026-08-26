/** Post-PCI cardiogenic-shock reassessment and escalation at a non-advanced center. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const POST_INFARCTION_CARDIOGENIC_SHOCK_ESCALATION: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'post-infarction-cardiogenic-shock-escalation', version: '0.1.0', maturity: 'preview',
    title: 'Cardiogenic shock escalation', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 9, difficulty: 'advanced', objectives: [
      { id: 'reconcile-post-infarction-shock-trajectory', statement: 'Recognize persistent post-PCI shock from the serial brain, skin, kidney, lactate, congestion, and pressure trajectory rather than pressure alone.', measure: 'Failure to improve prompted renewed shock-system escalation.' },
      { id: 'reopen-post-infarction-shock-causes', statement: 'Reconcile reported care with fixed post-PCI findings and reopen ischemic, mechanical, right-heart, rhythm, bleeding, vasodilated, and obstructive contributors.', measure: 'The learner did not attribute persistent shock to left-ventricular failure by default.' },
      { id: 'contact-post-infarction-shock-center', statement: 'Activate the local shock team and contact the regional advanced shock center early for consultation and transfer evaluation.', measure: 'Consultation and transfer evaluation proceeded without waiting for a device decision.' },
      { id: 'record-post-infarction-shock-bridge', statement: 'Record an individualized transport bridge linked to perfusion, congestion, trajectory, candidacy, and available expertise.', measure: 'No blind fluid load, universal target, fixed drug, or routine mechanical-support device was selected.' },
      { id: 'handoff-post-infarction-shock-trajectory', statement: 'After elapsed reassessment time, hand off unresolved perfusion, cause, support, organ-risk, and transfer work.', measure: 'A modest pressure change did not become a claim that shock had resolved.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Sinha SS, Morrow DA, Kapur NK, Kataria R, Roswell RO. 2025 Concise Clinical Guidance: An ACC Expert Consensus Statement on the Evaluation and Management of Cardiogenic Shock. J Am Coll Cardiol. 2025;85:1618-1641.',
        'Rao SV, O’Donoghue ML, Ruel M, et al. 2025 ACC/AHA/ACEP/NAEMSP/SCAI Guideline for the Management of Patients With Acute Coronary Syndromes. Circulation. 2025;151:e771-e862.',
        'Sinha SS, Geller BJ, Katz JN, et al. Evolution of Critical Care Cardiology: An Update on Structure, Care Delivery, Training, and Research Paradigms. Circulation. 2025;151:e687-e707.',
      ] },
    limitations: ['post-infarction-shock-findings-support-and-response-are-authored',
      'post-infarction-shock-controls-record-consultation-bridge-and-handoff-intent-only',
      'no-live-post-infarction-shock-testing-treatment-device-transfer-or-outcome'],
  },
  patient: { ageYears: 67, sex: 'female', heightCm: 165, weightKg: 74, asaClass: 4,
    diagnosis: 'Persistent shock after anterior STEMI and reported culprit-vessel PCI; cause under reassessment',
    procedure: 'Post-infarction shock reassessment and escalation',
    comorbidities: ['Hypertension', 'Type 2 diabetes'], medications: ['Current ICU therapies are reported in the vignette'],
    allergies: ['No known drug allergies'], fasting: 'Critical cardiac admission; fasting state not relevant to this lesson',
    baseline: { heartRateBpm: 108, meanArterialMmHg: 64, strokeVolumeMl: 35,
      hemoglobinGPerDl: 11.8, bloodVolumeMl: 4600, coreTemperatureC: 36.3,
      arterialStiffness: 1.2, baroreflexGain: 0.72, fixedStrokeVolume: false },
    airway: { difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Drowsy but answers simple questions; no fixed upper-airway obstruction finding' },
    respiratory: { profile: 'moderately-ill' } },
  equipment: { monitoring: ['ecg', 'arterial-line', 'pulse-oximetry', 'temperature'],
    airwayDevice: 'facemask', ventilator: { mode: 'manual', fio2: 0.35,
      tidalVolumeMl: 420, respiratoryRateBpm: 26, freshGasFlowLPerMin: 10, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'post-infarction-shock-presentation', type: 'narrative',
      target: 'post-infarction-cardiogenic-shock-escalation', atTick: 0, severity: 'critical',
      message: 'Six hours after reported culprit-vessel PCI with immediate post-procedure patency for anterior STEMI, a 67-year-old woman remains at a hospital without on-site advanced shock support. Documented initial vasoactive support was delivered and MAP rose from 57 to 64 mmHg; its agent, dose, target, and ongoing adequacy are not modeled. Despite that pressure response, she is newly drowsy with cool mottled knees, capillary refill 5 seconds, urine output 8 mL in the last hour, lactate rising from 4.2 to 5.1 mmol/L, RR 26/min, SpO₂ 93% on reported supplemental oxygen, and persistent bilateral crackles.' },
    { id: 'post-infarction-shock-boundary', type: 'narrative',
      target: 'post-infarction-shock-boundary', atTick: 0, severity: 'warning',
      message: 'Fixed reports show patent culprit-vessel flow immediately after PCI, persistent severe LV systolic dysfunction, preserved RV size, no pericardial effusion, no reported acute severe mitral regurgitation or ventricular-septal defect, sinus tachycardia, hemoglobin 11.8 g/dL, and no visible access-site bleeding. These snapshots do not permanently exclude re-occlusion, evolving mechanical disease, right-heart, rhythm, bleeding, vasodilated, or obstructive causes. Reconcile the serial perfusion trajectory and reported therapy; reopen causes while activating the local shock team and contacting the regional advanced shock center for consultation and transfer evaluation; record only an individualized potential-transport bridge; then reassess after elapsed time and hand off unresolved work. Stability, contraindications, preferences, accepting-center selection, and whether or when transfer occurs remain open. Examination, monitoring, laboratory, ECG, echo, angiography, hemodynamic acquisition or interpretation, diagnosis, prescribing, drug or fluid delivery, device selection or placement, PCI, surgery, transport, disposition, prognosis, and outcome are not simulated.' },
  ],
  debrief: { rubric: [
    { id: 'post-infarction-shock-trajectory', objectiveId: 'reconcile-post-infarction-shock-trajectory', question: 'Why did the multi-organ trajectory establish persistent shock despite the higher MAP?' },
    { id: 'post-infarction-shock-causes', objectiveId: 'reopen-post-infarction-shock-causes', question: 'Which reported treatments and fixed findings required reconciliation, and which causes remained open?' },
    { id: 'post-infarction-shock-transfer', objectiveId: 'contact-post-infarction-shock-center', question: 'Why did local shock-team activation and regional-center consultation proceed before device selection?' },
    { id: 'post-infarction-shock-bridge', objectiveId: 'record-post-infarction-shock-bridge', question: 'How was the transport bridge individualized without blind fluid, a universal target, or a routine device?' },
    { id: 'post-infarction-shock-handoff', objectiveId: 'handoff-post-infarction-shock-trajectory', question: 'What remained unresolved after elapsed reassessment, and who owned each next step?' },
  ] },
};
