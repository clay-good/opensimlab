/** Pediatric sepsis-without-shock recognition and serial reassessment. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const PEDIATRIC_SEPSIS: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'pediatric-sepsis', version: '0.1.0', maturity: 'preview',
    title: 'Pediatric sepsis without shock', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 8, difficulty: 'intermediate', objectives: [
      {
        id: 'reconcile-pediatric-sepsis-infection-and-organ-dysfunction',
        statement: 'Connect the supplied suspected infection, coagulation dysfunction, whole-child state, and qualified-care record.',
        measure: 'The authored pattern was reconciled without learner examination, scoring, testing, diagnosis, or treatment delivery.',
      },
      {
        id: 'distinguish-pediatric-sepsis-without-shock',
        statement: 'Distinguish authored pediatric sepsis from current septic shock while preserving close shock surveillance.',
        measure: 'The supplied cardiovascular findings were weighed without treating preserved blood pressure or perfusion as low risk.',
      },
      {
        id: 'confirm-pediatric-sepsis-qualified-care-ownership',
        statement: 'Confirm ongoing experienced ownership of the supplied evaluation, antimicrobial care, source work, and serial reassessment.',
        measure: 'Ongoing qualified ownership was confirmed without learner test, culture, antimicrobial, dose, route, access, fluid, oxygen, or treatment selection.',
      },
      {
        id: 'review-pediatric-sepsis-source-organs-and-alternatives',
        statement: 'Review unresolved source, organ trends, alternative causes, and deterioration triggers in parallel.',
        measure: 'Source and organ work continued without waiting for every result or claiming an exclusive pathogen or cause.',
      },
      {
        id: 'review-pediatric-sepsis-later-response',
        statement: 'After elapsed qualified care, review the fixed whole-child and coagulation trajectory without declaring recovery.',
        measure: 'Improved physiology was separated from persistent organ dysfunction, unresolved source, and durable outcome.',
      },
      {
        id: 'handoff-pediatric-sepsis-active-risk',
        statement: 'Hand off infection, organ dysfunction, shock surveillance, pending source work, treatment review, caregiver context, and named owners.',
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
      'pediatric-sepsis-infection-organ-dysfunction-care-and-response-are-authored',
      'pediatric-sepsis-controls-reconcile-distinguish-activate-review-reassess-and-handoff-only',
      'no-live-pediatric-sepsis-exam-score-test-drug-fluid-device-procedure-treatment-or-disposition',
    ],
  },
  patient: {
    ageYears: 6, sex: 'male', heightCm: 116, weightKg: 20, asaClass: 3,
    diagnosis: 'Authored suspected infection with coagulation organ dysfunction and no current shock',
    procedure: 'calm pediatric sepsis recognition without shock, qualified-care reconciliation, serial reassessment, and active-risk handoff',
    comorbidities: ['Previously well'], medications: ['None reported'],
    allergies: ['No known drug allergies'], fasting: 'Reduced intake with vomiting during this illness',
    baseline: {
      heartRateBpm: 140, meanArterialMmHg: 76, strokeVolumeMl: 32,
      hemoglobinGPerDl: 11.8, bloodVolumeMl: 1_600, coreTemperatureC: 39.1,
      arterialStiffness: 0.78, baroreflexGain: 1.08, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.15, difficultMaskVentilation: false,
      assessment: 'Tired but awake, fully interactive, speaking normally, and breathing spontaneously without upper-airway signs',
    },
    respiratory: { profile: 'healthy-child' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 140, respiratoryRateBpm: 28,
      freshGasFlowLPerMin: 0.5, delivering: false,
    },
  },
  formulary: [],
  timeline: [
    {
      id: 'pediatric-sepsis-presentation', type: 'narrative',
      target: 'pediatric-sepsis-reassessment', atTick: 0, severity: 'critical',
      message: 'A previously well 6-year-old boy weighing 20 kg has 30 hours of fever, dysuria, right-flank discomfort, reduced intake, and vomiting. At arrival he was tired but awake and fully interactive, with reactive pupils, temperature 39.4°C, HR 148/min, RR 30/min, BP 106/64 mmHg (MAP 78), clean pulse-coherent room-air SpO2 97%, warm extremities, normal-volume pulses, and capillary refill 2 seconds. A qualified examination supports a probable urinary source, but source and pathogen remain unconfirmed.',
    },
    {
      id: 'pediatric-sepsis-care-and-current-state', type: 'narrative',
      target: 'pediatric-sepsis-reassessment', atTick: 0, severity: 'critical',
      message: 'The fixed qualified-care record states that blood culture and source-directed specimens were obtained without materially delaying care, lactate was measured, and local empiric broad-spectrum antimicrobial therapy was delivered by the experienced team at minute 25. At minute 35 he remains fully interactive, with temperature 39.1°C, HR 140/min, RR 28/min, BP 104/62 mmHg (MAP 76), room-air SpO2 97%, warm normal-volume pulses, capillary refill 2 seconds, and no active bleeding. Platelets are 82,000 per microliter, INR 1.5, and lactate 2.6 mmol/L. A supplied expert report assigns 2 coagulation points and 0 cardiovascular, respiratory, and neurological points on the Phoenix Sepsis Score: authored pediatric sepsis without current shock. The learner does not calculate or interpret this score. Phoenix is not an early screening tool.',
    },
    {
      id: 'pediatric-sepsis-shock-and-alternative-guards', type: 'narrative',
      target: 'pediatric-sepsis-reassessment', atTick: 0, severity: 'warning',
      message: 'No hypotension, prolonged refill, weak pulses, mottling, oliguria, vasoactive support, respiratory failure, altered consciousness, focal neurologic sign, meningism, petechiae or purpura, active bleeding, anaphylaxis pattern, trauma, immune compromise, indwelling device, or known toxic exposure is reported. No routine fluid bolus is authored because shock is not present in this fixed state. These snapshots do not establish low risk, permanently exclude another source or cause, or remove the need for frequent circulation, mentation, breathing, urine, bleeding, and organ-function reassessment.',
    },
    {
      id: 'pediatric-sepsis-boundary', type: 'narrative',
      target: 'pediatric-sepsis-reassessment-boundary', atTick: 0, severity: 'warning',
      message: 'Reconcile the supplied infection and organ-dysfunction pattern, distinguish current sepsis from shock, confirm ongoing qualified ownership of the delivered evaluation and antimicrobial care, and review source, organs, alternatives, and deterioration triggers before a strictly later response and handoff. The controls do not examine, diagnose, screen, calculate Phoenix, PEWS, SIRS, or another score, acquire or interpret monitoring, a culture, specimen, lactate, gas, laboratory test, or image, identify a source or pathogen, choose or deliver an antimicrobial, drug, dose, concentration, route, interval, intravenous or intraosseous access, fluid, bolus, volume, rate, vasoactive, oxygen, device, flow, ventilation, airway maneuver, source-control procedure, or treatment, determine disposition or prognosis, or predict recovery or outcome.',
    },
  ],
  debrief: { rubric: [
    { id: 'pediatric-sepsis-pattern', objectiveId: 'reconcile-pediatric-sepsis-infection-and-organ-dysfunction', question: 'Which supplied infection, organ-dysfunction, whole-child, and qualified-care facts established the trajectory?' },
    { id: 'pediatric-sepsis-shock-boundary', objectiveId: 'distinguish-pediatric-sepsis-without-shock', question: 'Why was this authored sepsis without current shock, and why did preserved pressure and perfusion not establish low risk?' },
    { id: 'pediatric-sepsis-care', objectiveId: 'confirm-pediatric-sepsis-qualified-care-ownership', question: 'How was ongoing qualified ownership of the delivered evaluation and antimicrobial care confirmed without learner test, drug, dose, route, access, fluid, or treatment selection?' },
    { id: 'pediatric-sepsis-source-organs', objectiveId: 'review-pediatric-sepsis-source-organs-and-alternatives', question: 'Which source, organ, alternative-cause, and deterioration work remained active in parallel?' },
    { id: 'pediatric-sepsis-later', objectiveId: 'review-pediatric-sepsis-later-response', question: 'What changed in the fixed later report, and what remained unresolved despite improved physiology?' },
    { id: 'pediatric-sepsis-handoff', objectiveId: 'handoff-pediatric-sepsis-active-risk', question: 'Which infection, coagulation, shock-surveillance, pending-source, treatment-review, caregiver, and ownership work required handoff?' },
  ] },
};
