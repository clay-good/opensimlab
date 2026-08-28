/** Endocarditis: the antimicrobials are working and the patient is dying. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const ENDOCARDITIS_MECHANICAL_FAILURE_ON_A_SURGICAL_CLOCK: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'endocarditis-mechanical-failure-on-a-surgical-clock', version: '0.1.0', maturity: 'preview',
    title: 'Endocarditis on a surgical clock', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 7, difficulty: 'advanced', objectives: [
      { id: 'reconcile-infectious-disease-endocarditis-breathlessness-with-a-responding-infection', statement: 'Reconcile the breathlessness with an infection that is responding.', measure: 'Day three of appropriate antimicrobial therapy, falling C-reactive protein 180 mg/L, clearing cultures, heart rate 118/min, respiratory rate 26/min, oxygen saturation 92%, and a supplied new severe regurgitation with a 12 mm vegetation were connected without learner history, examination, imaging acquisition, or interpretation.' },
      { id: 'recognize-infectious-disease-endocarditis-mechanical-failure-not-antimicrobial-failure', statement: 'Recognize mechanical failure rather than antimicrobial failure.', measure: 'The deterioration was attributed to valve destruction rather than to a failing antimicrobial course, and falling markers, clearing cultures, and a non-wide pulse pressure were each refused as reassurance.' },
      { id: 'activate-infectious-disease-endocarditis-team-and-surgical-centre-ownership', statement: 'Activate the endocarditis team and a surgical centre.', measure: 'The multidisciplinary endocarditis team was convened and the case discussed with a centre performing valve surgery, with the surgical decision and its timing left to that team.' },
      { id: 'review-infectious-disease-endocarditis-acute-regurgitation-and-timing-evidence-boundary', statement: 'Review the acute-regurgitation and timing evidence boundary.', measure: 'The narrow pulse pressure of acute severe regurgitation, the soft first heart sound and easily missed murmur, the fact that vegetation size is not a standalone trigger, and the consensus rather than trial basis of the surgical timing tiers were all kept explicit.' },
      { id: 'record-infectious-disease-endocarditis-bounded-surgical-referral-and-strict-reassessment', statement: 'Record bounded surgical-referral intent, then reassess a strict later report.', measure: 'Intent for urgent surgical assessment and transfer was recorded without selecting an operation, prosthesis, theatre time, or anaesthetic plan; the fixed later assessment showed the C-reactive protein fallen to 128 mg/L while the patient required 15 L of oxygen and had a pulse pressure of 18 mmHg.' },
      { id: 'handoff-infectious-disease-endocarditis-pending-surgical-decision-and-active-risk', statement: 'Hand off a pending surgical decision and active risk.', measure: 'The handoff preserved serial perfusion and respiratory findings, the pending surgical decision and transfer, continuing antimicrobial therapy, and embolic and neurologic risk that this rehearsal does not resolve.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0', sources: [
        'Delgado V, Ajmone Marsan N, de Waha S, et al. 2023 ESC Guidelines for the management of endocarditis. Eur Heart J. 2023;44(39):3948-4042. doi:10.1093/eurheartj/ehad193. Endocarditis Team and Heart Valve Centre referral; surgical timing tiers of emergency (under 24 hours) for refractory pulmonary oedema or cardiogenic shock, and urgent (about 3 to 5 days) for heart failure or locally uncontrolled infection. Corrigendum Eur Heart J. 2025;46(11):1082.',
        'Fowler VG, Durack DT, Selton-Suty C, et al. The 2023 Duke-International Society for Cardiovascular Infectious Diseases Criteria for Infective Endocarditis. Clin Infect Dis. 2023;77(4):518-526. doi:10.1093/cid/ciad271.',
        'Baddour LM, Wilson WR, Bayer AS, et al. Infective Endocarditis in Adults: Diagnosis, Antimicrobial Therapy, and Management of Complications. Circulation. 2015;132:1435-1486. doi:10.1161/CIR.0000000000000296. Still the standing United States statement as of 2026-08-28 and predates the 2023 European guidance.',
      ] },
    limitations: ['endocarditis-presentation-and-decompensation-are-authored',
      'endocarditis-controls-are-recognition-activation-and-referral-intent-only',
      'endocarditis-surgical-timing-tiers-are-consensus-not-trial-validated'],
  },
  patient: {
    ageYears: 44, sex: 'male', heightCm: 180, weightKg: 82, asaClass: 4,
    diagnosis: 'Authored Staphylococcus aureus aortic-valve endocarditis with new severe regurgitation',
    procedure: 'calm recognition of mechanical failure, team activation, bounded surgical-referral intent, reassessment, and handoff practice',
    comorbidities: ['Day 3 of appropriate intravenous antimicrobial therapy for confirmed aortic-valve endocarditis'],
    medications: ['The antimicrobial regimen, its duration, and every operative decision remain qualified-team work'],
    allergies: ['No known drug allergies'], fasting: 'Not relevant to the infectious-disease fixture',
    baseline: { heartRateBpm: 118, meanArterialMmHg: 76, strokeVolumeMl: 58,
      hemoglobinGPerDl: 10.8, bloodVolumeMl: 5_200, coreTemperatureC: 38.4,
      arterialStiffness: 1, baroreflexGain: 0.7, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Alert and breathless on minimal exertion, protecting the airway in the supplied fixture' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 520, respiratoryRateBpm: 12,
      freshGasFlowLPerMin: 10, delivering: false } }, formulary: [],
  timeline: [
    { id: 'endocarditis-heart-failure-presentation', type: 'narrative', target: 'endocarditis-heart-failure', atTick: 0,
      severity: 'critical', message: 'A 44-year-old man is on day 3 of appropriate intravenous antimicrobial therapy for confirmed Staphylococcus aureus aortic-valve endocarditis. He has become breathless on minimal exertion since this morning. Authored monitor state is sinus tachycardia 118/min, BP 104/62 mmHg with a pulse pressure of 42, RR 26/min, SpO2 92% in air, and T 38.4 C. He is alert. There is no authored airway compromise, focal neurologic deficit, new rash, or hemorrhage.' },
    { id: 'endocarditis-heart-failure-evidence', type: 'narrative', target: 'endocarditis-heart-failure-evidence', atTick: 0,
      severity: 'warning', message: 'Supplied evidence: echocardiography reports a 12 mm aortic vegetation and new severe aortic regurgitation. Laboratory values are white cells 16.8 x10^9/L, C-reactive protein 180 mg/L and falling from admission, creatinine 124 µmol/L, and lactate 2.1 mmol/L; the latest blood cultures show no growth. The infection is responding to the antimicrobial course. The valve is being destroyed at the same time, and no inflammatory marker measures that. Imaging is supplied and is not acquired or interpreted by the learner.' },
    { id: 'endocarditis-heart-failure-boundary', type: 'narrative', target: 'endocarditis-heart-failure-boundary', atTick: 0,
      severity: 'warning', message: 'Reconcile the breathlessness with an infection that is responding; recognize mechanical failure of the valve rather than failure of the antimicrobial course; convene the multidisciplinary endocarditis team and discuss the case with a centre performing valve surgery; then review the acute-regurgitation and timing boundary. The learner may record only bounded qualified-team intent for urgent surgical assessment and transfer; no operation, prosthesis, incision, theatre time, anaesthetic plan, antimicrobial, dose, route, fluid, diuretic, vasoactive agent, or oxygen setting is exposed, and no procedure is performed. Acute severe regurgitation presents with a normal or narrow pulse pressure, a soft or absent first heart sound, and a short quiet murmur; the collapsing pulse and wide pulse pressure of the textbook belong to chronic regurgitation, where the ventricle has had time to dilate. Vegetation size is not a standalone surgical trigger, because the size threshold operates together with an embolic episode or another indication; this patient already has the stronger indication, which is heart failure from valve destruction. After elapsed simulated time, a strict fixed decompensation supplies heart rate 132/min, BP 96/78 mmHg with a pulse pressure of 18, RR 36/min, SpO2 84% on 15 L via a non-rebreather mask, crackles to the apices, and lactate 4.3 mmol/L, alongside a C-reactive protein that has fallen further to 128 mg/L with cultures still showing no growth. That divergence between falling markers and a much worse patient is the lesson. The decompensation occurs whatever the learner records, because the treatment is an operation that is not in this rehearsal; what the learner changes is whether the surgical team is already engaged when it arrives. The surgical timing tiers are consensus operationalizations of urgency rather than thresholds validated by randomised trial, and the one major trial in this area enrolled a narrow, stable population that does not generalise to a decompensating patient. No individualized effect, treatment causality, operability, transfer acceptance, eligibility, disposition, prognosis, or outcome is reported. Qualified teams retain the surgical decision and its timing, the transfer, antimicrobial therapy and duration, critical-care support, and all treatment decisions. After another elapsed interval, hand off serial findings, the pending surgical decision, continuing antimicrobial therapy, embolic and neurologic risk, disposition, and outcome uncertainty. The controls do not take history; examine; acquire or interpret observations, echocardiography, laboratory, or another test; diagnose; select or deliver a drug, dose, route, fluid, oxygen, or device; perform or schedule a procedure; determine operability, eligibility, disposition, or prognosis; or predict response, survival, or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'endocarditis-trajectory', objectiveId: 'reconcile-infectious-disease-endocarditis-breathlessness-with-a-responding-infection', question: 'Which findings established that the infection was responding while the patient was not?' },
    { id: 'endocarditis-recognition', objectiveId: 'recognize-infectious-disease-endocarditis-mechanical-failure-not-antimicrobial-failure', question: 'Why was this mechanical failure rather than a failing antimicrobial course?' },
    { id: 'endocarditis-activation', objectiveId: 'activate-infectious-disease-endocarditis-team-and-surgical-centre-ownership', question: 'Which team and which centre needed to be engaged, and whose decision was the operation?' },
    { id: 'endocarditis-boundaries', objectiveId: 'review-infectious-disease-endocarditis-acute-regurgitation-and-timing-evidence-boundary', question: 'What did the pulse pressure, the vegetation size, and the timing tiers each establish and leave open?' },
    { id: 'endocarditis-reassessment', objectiveId: 'record-infectious-disease-endocarditis-bounded-surgical-referral-and-strict-reassessment', question: 'What did the later assessment show, and why was the falling marker not reassurance?' },
    { id: 'endocarditis-handoff', objectiveId: 'handoff-infectious-disease-endocarditis-pending-surgical-decision-and-active-risk', question: 'Which pending surgical, embolic, and outcome risks required handoff?' },
  ] },
};
