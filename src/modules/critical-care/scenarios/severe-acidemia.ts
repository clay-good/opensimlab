/** Bounded severe mixed-acidemia recognition and stabilization response. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const SEVERE_ACIDEMIA: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'severe-acidemia', version: '0.1.0', maturity: 'preview',
    title: 'Severe acidemia', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 8, difficulty: 'advanced', objectives: [
      { id: 'recognize-severe-acidemia', statement: 'Recognize severe mixed acidemia with cardiovascular, respiratory, electrolyte, and kidney risk.', measure: 'pH, PaCO₂, bicarbonate, lactate, potassium, ECG, perfusion, ventilation, and kidney trends triggered experienced help.' },
      { id: 'analyze-severe-acidemia-context', statement: 'Confirm the gas and distinguish metabolic acid accumulation from inadequate respiratory compensation.', measure: 'The fixed blood gas, corrected anion gap, lactate, expected compensation, and cause review identified a mixed process without treating pH as a diagnosis.' },
      { id: 'protect-severe-acidemia-ventilation', statement: 'Restore safe ventilatory compensation while avoiding normalization-by-force.', measure: 'The plan preserved minute ventilation, checked mechanics and auto-PEEP risk, and kept definitive cause treatment central.' },
      { id: 'activate-severe-acidemia-cause-plan', statement: 'Activate cause-directed shock care and individualized buffer and kidney-support planning.', measure: 'Perfusion and infection work continued while bicarbonate and kidney support remained indication-, physiology-, and team-specific.' },
      { id: 'reassess-severe-acidemia-trajectory', statement: 'Reassess gas, perfusion, ventilation, potassium, kidney, and cause trajectories.', measure: 'The fixed response improved pH and perfusion without claiming acid clearance, source control, kidney recovery, or outcome.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Society of Critical Care Medicine and European Society of Intensive Care Medicine. Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2026. Intensive Care Med. 2026.',
        'Jung B, Martinez M, Claessens YE, et al. Diagnosis and management of metabolic acidosis: guidelines from a French expert panel. Ann Intensive Care. 2019;9:92.',
        'Jung B, Jabaudon M, De Jong A, et al. Sodium Bicarbonate for Severe Metabolic Acidemia and Acute Kidney Injury: The BICARICU-2 Randomized Clinical Trial. JAMA. 2025;334:2000-2010.',
        'Kidney Disease: Improving Global Outcomes. KDIGO Clinical Practice Guideline for Acute Kidney Injury. Kidney Int Suppl. 2012;2:1-138.',
      ] },
    limitations: ['severe-acidemia-gas-causes-and-response-are-authored',
      'severe-acidemia-stabilization-actions-are-proxies',
      'no-live-acid-base-diagnosis-ventilation-buffer-kidney-support-prescribing-or-outcome'],
  },
  patient: { ageYears: 61, sex: 'male', heightCm: 178, weightKg: 84, asaClass: 5,
    diagnosis: 'Septic shock with severe mixed metabolic and respiratory acidemia',
    procedure: 'Acidemia stabilization and cause review',
    comorbidities: ['Hypertension', 'Chronic kidney disease stage 2'],
    medications: ['Reported antimicrobial and vasoactive therapy; delivery not modeled'],
    allergies: ['No known drug allergies'], fasting: 'ICU patient; nutrition state not represented',
    baseline: { heartRateBpm: 122, meanArterialMmHg: 61, strokeVolumeMl: 48,
      hemoglobinGPerDl: 10.2, bloodVolumeMl: 5200, coreTemperatureC: 38.4,
      arterialStiffness: 1.15, baroreflexGain: 0.7, fixedStrokeVolume: false },
    airway: { difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Intubated with reported waveform capnography and bilateral ventilation' },
    respiratory: { profile: 'moderately-ill' } },
  equipment: { monitoring: ['ecg', 'arterial-line', 'pulse-oximetry', 'capnography', 'temperature'],
    airwayDevice: 'tracheal-tube', ventilator: { mode: 'volume-control', fio2: 0.4,
      tidalVolumeMl: 420, respiratoryRateBpm: 18, freshGasFlowLPerMin: 10, delivering: true } },
  formulary: [],
  timeline: [
    { id: 'severe-acidemia-presentation', type: 'narrative', target: 'severe-acidemia', atTick: 0,
      severity: 'critical', message: 'A 61-year-old intubated man with septic shock has HR 122/min, MAP 61 mmHg on reported vasoactive support, SpO₂ 95% on FiO₂ 0.40, and temperature 38.4°C. A promptly repeated arterial sample reports pH 7.09, PaCO₂ 48 mmHg, bicarbonate 14 mmol/L, lactate 8.1 mmol/L, sodium 139 mmol/L, chloride 103 mmol/L, albumin 2.5 g/dL, potassium 5.7 mmol/L without ECG change, and creatinine 3.0 mg/dL from 1.2 mg/dL. For bicarbonate 14 mmol/L, reported expected PaCO₂ is approximately 29 ±2 mmHg; the actual 48 mmHg identifies added respiratory acidemia rather than appropriate compensation.' },
    { id: 'severe-acidemia-boundary', type: 'narrative', target: 'severe-acidemia-boundary', atTick: 0,
      severity: 'warning', message: 'Activate critical-care, respiratory-therapy, nursing, pharmacy, nephrology, and source-control help. Confirm sampling and trends; review airway, circuit, minute ventilation, plateau pressure, auto-PEEP, synchrony, oxygen delivery, perfusion, ECG and potassium, corrected anion gap, lactate and ketones, renal and gastrointestinal losses, chloride, medications, and toxic alcohol, salicylate, cyanide, carbon-monoxide, and metformin contexts. Preserve safe compensatory ventilation without forcing a normal pH or causing injurious ventilation, while treating shock, infection, and the identified cause. The 2026 sepsis guideline conditionally suggests bicarbonate for septic shock with pH ≤7.2 and moderate-to-severe AKI at very low certainty, but suggests against it solely to improve hemodynamics in hypoperfusion-induced lactic acidemia. BICARICU-2 found no 90-day mortality benefit. Exact buffer, fluid, vasopressor, ventilation, electrolyte, antidote, and kidney-support decisions remain individualized; life-threatening acid-base imbalance preserves urgent kidney-support assessment. Examination, monitoring or sample acquisition or interpretation, calculations, diagnosis, oxygen, ventilation, fluid or drug delivery, source control, prescribing, procedures, kidney support, transfer, disposition, recovery, and outcome are not simulated.' },
  ],
  debrief: { rubric: [
    { id: 'severe-acidemia-recognition', objectiveId: 'recognize-severe-acidemia', question: 'Which gas and organ findings made this acidemia immediately dangerous?' },
    { id: 'severe-acidemia-analysis', objectiveId: 'analyze-severe-acidemia-context', question: 'How did you identify both metabolic and respiratory processes and keep the cause differential open?' },
    { id: 'severe-acidemia-ventilation', objectiveId: 'protect-severe-acidemia-ventilation', question: 'How did you protect compensation without using injurious ventilation or chasing a normal pH?' },
    { id: 'severe-acidemia-cause-plan', objectiveId: 'activate-severe-acidemia-cause-plan', question: 'Why were cause treatment, bicarbonate, and kidney support separated into individualized decisions?' },
    { id: 'severe-acidemia-response', objectiveId: 'reassess-severe-acidemia-trajectory', question: 'What improved, and what remained unproven?' },
  ] },
};
