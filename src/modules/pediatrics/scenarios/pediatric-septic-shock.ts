/** Pediatric septic-shock recognition after cautious qualified resuscitation. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const PEDIATRIC_SEPTIC_SHOCK: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'pediatric-septic-shock', version: '0.1.0', maturity: 'draft',
    title: 'Pediatric septic shock', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 9, difficulty: 'advanced', objectives: [
      {
        id: 'reconcile-pediatric-septic-shock-care-and-trajectory',
        statement: 'Connect the supplied suspected infection, qualified care, impaired perfusion, and worsening whole-child trajectory.',
        measure: 'The authored trajectory was reconciled without learner examination, scoring, testing, diagnosis, or treatment delivery.',
      },
      {
        id: 'recognize-pediatric-septic-shock-after-fluid-reassessment',
        statement: 'Recognize persistent pediatric septic shock and congestion warnings after individually reassessed fluid aliquots.',
        measure: 'The supplied Phoenix classification and fluid boundary were reviewed without learner calculation or automatic fluid continuation.',
      },
      {
        id: 'activate-pediatric-septic-shock-critical-care-and-vasoactive-ownership',
        statement: 'Activate experienced critical-care, vasoactive, monitoring, and access ownership without waiting for central access.',
        measure: 'Qualified support was activated without learner agent, dose, rate, route, access, pump, or treatment selection.',
      },
      {
        id: 'escalate-pediatric-septic-shock-source-control',
        statement: 'Escalate source-control evaluation in parallel with hemodynamic rescue.',
        measure: 'Source work continued without waiting for shock resolution or claiming a diagnosis, pathogen, procedure, or outcome.',
      },
      {
        id: 'review-pediatric-septic-shock-later-response',
        statement: 'After elapsed qualified care, review the fixed perfusion trajectory without declaring shock resolution.',
        measure: 'Partial improvement was separated from persistent cardiovascular dysfunction, congestion, unresolved source, and durable outcome.',
      },
      {
        id: 'handoff-pediatric-septic-shock-active-risk',
        statement: 'Hand off shock, source, organ trends, fluid balance, vasoactive support, failure triggers, caregiver context, and named owners.',
        measure: 'The handoff preserved active work without claiming disposition, prognosis, recovery, or outcome.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Weiss SL, Peters MJ, Oczkowski SJ, et al. Surviving Sepsis Campaign international guidelines for the management of sepsis and septic shock in children 2026. Pediatr Crit Care Med. 2026;27(4):379-434. doi:10.1097/PCC.0000000000003927.',
        'Schlapbach LJ, Watson RS, Sorce LR, et al. International Consensus Criteria for Pediatric Sepsis and Septic Shock. JAMA. 2024;331(8):665-674. doi:10.1001/jama.2024.0179.',
      ],
    },
    limitations: [
      'pediatric-septic-shock-infection-perfusion-care-and-response-are-authored',
      'pediatric-septic-shock-controls-reconcile-recognize-activate-escalate-reassess-and-handoff-only',
      'no-live-pediatric-septic-shock-exam-score-test-drug-fluid-device-procedure-treatment-or-disposition',
    ],
  },
  patient: {
    ageYears: 4, sex: 'female', heightCm: 102, weightKg: 16, asaClass: 4,
    diagnosis: 'Authored suspected infection with cardiovascular organ dysfunction',
    procedure: 'calm pediatric septic-shock recognition, qualified rescue coordination, serial reassessment, and active-risk handoff',
    comorbidities: ['Previously well'], medications: ['None reported'],
    allergies: ['No known drug allergies'], fasting: 'Reduced intake with vomiting during this illness',
    baseline: {
      heartRateBpm: 170, meanArterialMmHg: 43, strokeVolumeMl: 20,
      hemoglobinGPerDl: 11.6, bloodVolumeMl: 1_280, coreTemperatureC: 39.3,
      arterialStiffness: 0.74, baroreflexGain: 0.96, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.15, difficultMaskVentilation: false,
      assessment: 'Drowsy but localizing and answering, with reactive pupils and spontaneous breathing',
    },
    respiratory: { profile: 'healthy-child' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 112, respiratoryRateBpm: 40,
      freshGasFlowLPerMin: 0.5, delivering: false,
    },
  },
  formulary: [],
  timeline: [
    {
      id: 'pediatric-septic-shock-presentation', type: 'narrative',
      target: 'pediatric-septic-shock-reassessment', atTick: 0, severity: 'critical',
      message: 'A previously well 4-year-old girl weighing 16 kg has 3 days of fever, worsening abdominal pain, vomiting, and little urine. At arrival she was tired but answered appropriately, with reactive pupils, temperature 39.5°C, HR 162/min, RR 36/min, BP 78/42 mmHg (MAP 54), clean pulse-coherent room-air SpO2 96%, cool extremities, weak pulses, capillary refill 4 seconds, mottling, and urine output 0.3 mL/kg/h. A qualified abdominal examination and ultrasound report localize right-lower-quadrant inflammation and complex fluid concerning for a perforated appendiceal source, but source and pathogen remain unconfirmed and the experienced team owns interpretation.',
    },
    {
      id: 'pediatric-septic-shock-care-and-current-state', type: 'narrative',
      target: 'pediatric-septic-shock-reassessment', atTick: 0, severity: 'critical',
      message: 'The fixed qualified-care record states that blood culture, source-directed specimens, and lactate were obtained without materially delaying care, and local empiric broad-spectrum antimicrobial therapy was delivered at minute 15. In a system with pediatric intensive care, the experienced team delivered two individually reassessed 10 mL/kg balanced-crystalloid aliquots at minutes 10 and 25. At minute 35 she is drowsier but localizes and answers, with GCS 11 and reactive pupils, temperature 39.3°C, HR 170/min, RR 42/min, BP 66/32 mmHg (MAP 43), room-air SpO2 94%, cool mottled extremities, weak pulses, capillary refill 6 seconds, urine output 0.2 mL/kg/h, and lactate 6.2 mmol/L. New qualified reports of bibasal crackles and a liver edge 3 cm below the costal margin are congestion warnings, not proof that fluid caused them. No further fluid is authored pending expert reassessment.',
    },
    {
      id: 'pediatric-septic-shock-phoenix-classification', type: 'narrative',
      target: 'pediatric-septic-shock-reassessment', atTick: 0, severity: 'critical',
      message: 'A supplied expert report assigns 2 cardiovascular points and 0 respiratory, coagulation, and neurological points on the Phoenix Sepsis Score: one point for MAP 32-44 mmHg at age 2 to younger than 5 years and one for lactate 5-10.9 mmol/L. Suspected infection plus the fixed score establishes authored pediatric sepsis with cardiovascular dysfunction: pediatric septic shock. The learner does not calculate or interpret Phoenix, which is classification after overt organ dysfunction rather than an early screening tool.',
    },
    {
      id: 'pediatric-septic-shock-boundary', type: 'narrative',
      target: 'pediatric-septic-shock-reassessment-boundary', atTick: 0, severity: 'warning',
      message: 'Reconcile the supplied care and worsening trajectory, recognize persistent shock and congestion warnings after individually reassessed fluid, and activate critical-care and vasoactive ownership in parallel with source-control escalation before a strictly later response and handoff. The controls do not examine, diagnose, screen, calculate Phoenix, PEWS, SIRS, or another score, acquire or interpret monitoring, a culture, specimen, lactate, gas, laboratory test, ultrasound, point-of-care ultrasound, or image, identify a source or pathogen, choose or deliver an antimicrobial, drug, dose, concentration, route, interval, intravenous, intraosseous, or central access, fluid, bolus, volume, rate, vasoactive, oxygen, device, flow, ventilation, airway maneuver, source-control procedure, or treatment, determine disposition or prognosis, or predict recovery or outcome.',
    },
  ],
  debrief: { rubric: [
    { id: 'pediatric-septic-shock-trajectory', objectiveId: 'reconcile-pediatric-septic-shock-care-and-trajectory', question: 'Which supplied infection, care, perfusion, organ-dysfunction, and whole-child facts established the trajectory?' },
    { id: 'pediatric-septic-shock-recognition', objectiveId: 'recognize-pediatric-septic-shock-after-fluid-reassessment', question: 'Why did persistent hypoperfusion and congestion warnings after individually reassessed fluid require a changed rescue plan?' },
    { id: 'pediatric-septic-shock-rescue', objectiveId: 'activate-pediatric-septic-shock-critical-care-and-vasoactive-ownership', question: 'How was qualified critical-care and vasoactive ownership activated without waiting for central access or selecting an agent or dose?' },
    { id: 'pediatric-septic-shock-source', objectiveId: 'escalate-pediatric-septic-shock-source-control', question: 'Why did source-control evaluation continue in parallel without claiming an appendiceal diagnosis or procedure?' },
    { id: 'pediatric-septic-shock-later', objectiveId: 'review-pediatric-septic-shock-later-response', question: 'What improved in the fixed later report, and which findings kept shock and source work active?' },
    { id: 'pediatric-septic-shock-handoff', objectiveId: 'handoff-pediatric-septic-shock-active-risk', question: 'Which shock, source, organ, fluid-balance, vasoactive, caregiver, and ownership work required handoff?' },
  ] },
};
