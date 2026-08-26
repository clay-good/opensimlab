/** Bounded AKI fluid-overload recognition and kidney-support planning response. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const ACUTE_KIDNEY_INJURY_WITH_FLUID_OVERLOAD: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'acute-kidney-injury-with-fluid-overload', version: '0.1.0', maturity: 'preview',
    title: 'Acute kidney injury with fluid overload', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 8, difficulty: 'advanced', objectives: [
      { id: 'recognize-aki-fluid-overload', statement: 'Recognize severe AKI with harmful fluid accumulation and organ dysfunction.', measure: 'Urine, fluid, weight, respiratory, perfusion, electrolyte, acid-base, and uremic trends triggered critical-care and nephrology help.' },
      { id: 'review-aki-fluid-overload-context', statement: 'Review reversible AKI causes, urgent complications, kidney capacity, and treatment context.', measure: 'The whole trajectory was reviewed without using creatinine, urine output, or one fluid percentage as an automatic kidney-support trigger.' },
      { id: 'limit-fluid-and-review-diuretic-response', statement: 'Stop nonessential accumulation and review the reported diuretic response with safety guardrails.', measure: 'The plan separated de-resuscitation intent from blind fluid or repeated-diuretic escalation.' },
      { id: 'activate-individualized-kidney-support-pathway', statement: 'Activate individualized kidney-support planning for refractory fluid demand.', measure: 'Nephrology and critical care preserved timing, access, modality, dose, anticoagulation, fluid removal, and goals decisions.' },
      { id: 'reassess-aki-fluid-overload-trajectory', statement: 'Reassess fluid, respiratory, kidney, hemodynamic, and metabolic trajectories.', measure: 'The fixed response improved oxygenation and net balance without proving kidney recovery or outcome.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Kidney Disease: Improving Global Outcomes. KDIGO Clinical Practice Guideline for Acute Kidney Injury. Kidney Int Suppl. 2012;2:1-138.',
        'Ostermann M, Bellomo R, Burdmann EA, et al. Controversies in acute kidney injury: conclusions from a KDIGO Conference. Kidney Int. 2020;98:294-309.',
        'STARRT-AKI Investigators. Timing of Initiation of Renal-Replacement Therapy in Acute Kidney Injury. N Engl J Med. 2020;383:240-251.',
      ] },
    limitations: ['aki-fluid-overload-findings-and-response-are-authored',
      'aki-fluid-and-kidney-support-actions-are-proxies',
      'no-live-aki-diagnosis-diuretic-kidney-support-prescribing-procedure-or-outcome'],
  },
  patient: { ageYears: 67, sex: 'female', heightCm: 165, weightKg: 82, asaClass: 5,
    diagnosis: 'Severe acute kidney injury with progressive fluid overload after septic shock',
    procedure: 'Fluid-balance stabilization',
    comorbidities: ['Hypertension', 'Type 2 diabetes mellitus'],
    medications: ['Reported antimicrobial, vasopressor, and diuretic therapy; delivery not modeled'],
    allergies: ['No known drug allergies'], fasting: 'ICU patient; enteral-nutrition state not represented',
    baseline: { heartRateBpm: 104, meanArterialMmHg: 72, strokeVolumeMl: 55,
      hemoglobinGPerDl: 9.8, bloodVolumeMl: 5400, coreTemperatureC: 37.4,
      arterialStiffness: 1.2, baroreflexGain: 0.6, fixedStrokeVolume: false },
    airway: { difficulty: 0.25, difficultMaskVentilation: false,
      assessment: 'Intubated with reported waveform capnography and bilateral ventilation' },
    respiratory: { profile: 'moderately-ill' } },
  equipment: { monitoring: ['ecg', 'arterial-line', 'pulse-oximetry', 'capnography', 'temperature'],
    airwayDevice: 'tracheal-tube', ventilator: { mode: 'volume-control', fio2: 0.5,
      tidalVolumeMl: 420, respiratoryRateBpm: 20, freshGasFlowLPerMin: 10, delivering: true } },
  formulary: [],
  timeline: [
    { id: 'aki-fluid-overload-presentation', type: 'narrative', target: 'acute-kidney-injury-with-fluid-overload',
      atTick: 0, severity: 'critical', message: 'A 67-year-old intubated woman on ICU day 3 after septic shock has creatinine 3.4 mg/dL from a 1.0 mg/dL baseline, urine output 0.15 mL/kg/h over 12 hours, cumulative fluid balance +8.2 L, and weight 82 kg from 73 kg. SpO₂ is 91% on FiO₂ 0.50, HR 104/min, MAP 72 mmHg on low reported vasoactive support, and temperature 37.4°C. Reported chest imaging shows increasing bilateral interstitial and alveolar edema. An adequate reported loop-diuretic challenge produced only 40 mL urine over 6 hours, and ongoing intake still exceeds output.' },
    { id: 'aki-fluid-overload-boundary', type: 'narrative', target: 'acute-kidney-injury-with-fluid-overload-boundary',
      atTick: 0, severity: 'warning', message: 'Fixed review reports generalized edema, rising ventilatory support, potassium 5.3 mmol/L without ECG change, pH 7.28, bicarbonate 17 mmol/L, BUN 70 mg/dL, no pericarditis, seizure, active bleeding, obstruction on reported ultrasound, or toxin requiring extracorporeal removal. Sepsis treatment and source control are reported underway; medication, contrast, hemodynamic, abdominal-pressure, urinary, and intrinsic-kidney causes remain open. Activate critical-care, nephrology, nursing, respiratory-therapy, and pharmacy help. Stop nonessential fluid and sodium, reconcile infusions and nutrition, preserve perfusion, review nephrotoxins and dosing, and reassess the poor reported diuretic response without blind repeated escalation. Initiate individualized kidney-support planning when fluid and metabolic demands exceed kidney capacity, urgently for life-threatening fluid, electrolyte, or acid-base imbalance, while using the broader clinical trajectory rather than a single creatinine or BUN threshold. Exact access, modality, dose, anticoagulation, fluid-removal rate, timing, goals, and patient preferences remain expert decisions; accelerated kidney support is not taught as universally beneficial. Examination, monitoring or test acquisition or interpretation, diagnosis, fluid accounting, ultrasound, oxygen, ventilation, nutrition, fluid or drug delivery, diuretic therapy, access, prescribing, kidney-support setup or delivery, transfer, disposition, kidney recovery, and outcome are not simulated.' },
  ],
  debrief: { rubric: [
    { id: 'aki-fluid-overload-recognition', objectiveId: 'recognize-aki-fluid-overload', question: 'Which kidney, fluid, respiratory, and systemic trends made accumulation harmful?' },
    { id: 'aki-fluid-overload-context', objectiveId: 'review-aki-fluid-overload-context', question: 'Which reversible causes and urgent kidney-support indications were present or absent?' },
    { id: 'aki-fluid-overload-limit', objectiveId: 'limit-fluid-and-review-diuretic-response', question: 'How did you stop further accumulation without using blind fluid or diuretic escalation?' },
    { id: 'aki-fluid-overload-support', objectiveId: 'activate-individualized-kidney-support-pathway', question: 'Why did kidney-support timing and prescription remain individualized?' },
    { id: 'aki-fluid-overload-response', objectiveId: 'reassess-aki-fluid-overload-trajectory', question: 'What improved immediately, and why did kidney recovery and outcome remain open?' },
  ] },
};
