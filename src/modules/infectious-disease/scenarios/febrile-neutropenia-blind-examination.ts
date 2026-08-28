/** Febrile neutropenia: the examination is blind, so the pathway carries the safety. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const FEBRILE_NEUTROPENIA_BLIND_EXAMINATION: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'febrile-neutropenia-blind-examination', version: '0.1.0', maturity: 'preview',
    title: 'Febrile neutropenia: a well-looking emergency', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 7, difficulty: 'advanced', objectives: [
      { id: 'reconcile-infectious-disease-neutropenia-fever-count-chemotherapy-day-and-absent-local-signs', statement: 'Reconcile the fever, neutrophil count, chemotherapy day, and absent local signs.', measure: 'Temperature 38.4 C, neutrophils 0.2 x10^9/L, day 10 after chemotherapy, a well-appearing patient, and the absence of any localizing finding were connected without learner history, examination, sampling, imaging, or scoring.' },
      { id: 'recognize-infectious-disease-neutropenia-emergency-despite-a-blind-examination', statement: 'Recognize an emergency despite a blind examination.', measure: 'The absent local signs were understood as a consequence of neutropenia rather than evidence against infection, and a well appearance, a modest marker, a flat white cell count, and a low-risk score were each refused as reasons to wait.' },
      { id: 'activate-infectious-disease-neutropenia-pathway-and-culture-ownership', statement: 'Activate the neutropenic sepsis pathway and culture ownership.', measure: 'The pathway and acute oncology team were activated with the clock recorded from arrival, and peripheral and line cultures were arranged so they did not delay empiric therapy.' },
      { id: 'review-infectious-disease-neutropenia-timing-and-risk-score-boundary', statement: 'Review the timing and risk-score boundary.', measure: 'The one-hour target was treated as a system-design safety margin rather than a validated biological threshold, the guidance that says only immediately was distinguished from it, and the risk scores were kept to disposition rather than to whether antimicrobials are given.' },
      { id: 'record-infectious-disease-neutropenia-bounded-empiric-intent-and-strict-reassessment', statement: 'Record bounded empiric intent, then reassess a strict later report.', measure: 'Intent for immediate empiric intravenous therapy per local protocol was recorded without selecting an agent, dose, route, or combination; the fixed later assessment was reviewed without reading the rising marker as failure or the persistent neutropenia as recovery.' },
      { id: 'handoff-infectious-disease-neutropenia-continuing-neutropenia-absent-source-and-active-risk', statement: 'Hand off continuing neutropenia, an absent source, and active risk.', measure: 'The handoff preserved serial observations and laboratory evidence, delivered empiric therapy pending culture review, the continuing neutropenia, daily reassessment, and a source that may never be identified.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0', sources: [
        'National Institute for Health and Care Excellence. Neutropenic sepsis: prevention and management in people with cancer. NICE clinical guideline CG151. Published 2012-09-19; surveillance 2019 and 2020 decided not to update. Key priority: treat as an acute medical emergency and offer empiric antibiotic therapy immediately.',
        'Freifeld AG, Bow EJ, Sepkowitz KA, et al. Clinical Practice Guideline for the Use of Antimicrobial Agents in Neutropenic Patients with Cancer: 2010 Update by the Infectious Diseases Society of America. Clin Infect Dis. 2011;52(4):e56-e93. doi:10.1093/cid/cir073. Still the standing comprehensive IDSA document.',
        'Taplitz RA, Kennedy EB, Bow EJ, et al. Outpatient Management of Fever and Neutropenia in Adults: ASCO and IDSA Clinical Practice Guideline Update. J Clin Oncol. 2018;36(14):1443-1453. doi:10.1200/JCO.2017.77.6211. Scope limited to outpatient management of low-risk adults.',
      ] },
    limitations: ['febrile-neutropenia-presentation-and-response-are-authored',
      'febrile-neutropenia-controls-are-recognition-activation-and-intent-only',
      'febrile-neutropenia-timing-and-risk-scores-rest-on-thin-dated-evidence'],
  },
  patient: {
    ageYears: 61, sex: 'male', heightCm: 176, weightKg: 78, asaClass: 3,
    diagnosis: 'Authored febrile neutropenia on day 10 after chemotherapy for a solid tumour',
    procedure: 'calm recognition, pathway activation, bounded empiric intent, reassessment, and handoff practice',
    comorbidities: ['Solid-tumour chemotherapy, day 10 of the cycle; no indwelling line infection documented'],
    medications: ['Chemotherapy regimen, prophylaxis, and any empiric antimicrobial choice remain qualified-team work'],
    allergies: ['No known drug allergies'], fasting: 'Not relevant to the infectious-disease fixture',
    baseline: { heartRateBpm: 104, meanArterialMmHg: 87, strokeVolumeMl: 68,
      hemoglobinGPerDl: 10.4, bloodVolumeMl: 5_000, coreTemperatureC: 38.4,
      arterialStiffness: 1, baroreflexGain: 0.7, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Well-appearing, fully alert, speaking in full sentences in the supplied fixture' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 500, respiratoryRateBpm: 12,
      freshGasFlowLPerMin: 10, delivering: false } }, formulary: [],
  timeline: [
    { id: 'febrile-neutropenia-presentation', type: 'narrative', target: 'febrile-neutropenia', atTick: 0,
      severity: 'critical', message: 'A 61-year-old man walks into the assessment unit on day 10 after chemotherapy, reporting one temperature reading at home. He looks well, is fully alert, and has no cough, no dysuria, no line-site redness, no rash, and no abdominal pain. Authored monitor state is sinus tachycardia 104/min, BP 118/72 mmHg (MAP 87), RR 20/min, SpO2 97% in air, and T 38.4 C. Capillary refill is 2 s. There is no authored airway compromise, focal lung finding, focal neurologic deficit, or hemorrhage.' },
    { id: 'febrile-neutropenia-evidence', type: 'narrative', target: 'febrile-neutropenia-evidence', atTick: 0,
      severity: 'warning', message: 'Supplied laboratory evidence is neutrophils 0.2 x10^9/L, white cells 0.8 x10^9/L, platelets 96 x10^9/L, C-reactive protein 42 mg/L, and lactate 1.8 mmol/L. The absent local findings are a consequence of profound neutropenia rather than evidence against infection: without neutrophils there is no pus, erythema and swelling are muted, and imaging can stay clear. Roughly three in five febrile episodes never localize, and most of those still respond to antimicrobial therapy. The modest C-reactive protein reflects a marker that takes many hours to rise, not a mild illness. A commonly used risk score would sit close to its low-risk cutoff here.' },
    { id: 'febrile-neutropenia-boundary', type: 'narrative', target: 'febrile-neutropenia-boundary', atTick: 0,
      severity: 'warning', message: 'Reconcile the fever, neutrophil count, chemotherapy day, and absent local signs; recognize an emergency despite a blind examination; activate the neutropenic sepsis pathway and acute oncology team with the clock recorded from arrival; request peripheral and line cultures without delaying therapy; then review the timing and risk-score boundary. The learner may record only bounded qualified-team intent for immediate empiric intravenous broad-spectrum therapy according to local protocol; no agent, dose, route, combination, duration, de-escalation, antifungal, growth-factor, or prophylaxis decision is exposed, because guidance delegates the agent to local microbiology policy. The widely quoted one-hour target is a system-design safety margin defended because the door cannot tell you who is deteriorating, not a validated biological threshold; the United Kingdom guidance says immediately and states no number, and the timing evidence specific to this population is sparse and conflicting. Risk scores stratify disposition after the emergency response has begun and are not validated to decide whether antimicrobials are given at all. After elapsed simulated time without recorded intent, a strict fixed untreated contrast supplies temperature 36.1 C, heart rate 128/min, BP 86/48 mmHg, RR 26/min, capillary refill 4 s, neutrophils 0.1 x10^9/L, C-reactive protein 118 mg/L, and lactate 3.9 mmol/L: falling temperature and an absent leucocytosis are consistent with worsening infection here, not with improvement. Once intent is recorded, a strict fixed later assessment instead supplies temperature 37.6 C, heart rate 96/min, BP 112/68 mmHg, and lactate 1.9 mmol/L alongside a C-reactive protein of 126 mg/L that is still rising because that marker lags. The patient remains profoundly neutropenic and no organism is identified. No individualized effect, treatment causality, source, organism, marrow recovery, eligibility, disposition, prognosis, or outcome is reported. Qualified teams retain antimicrobial selection, delivery, review, de-escalation and duration, antifungal and growth-factor decisions, source investigation, and all treatment decisions. After another elapsed interval, hand off serial findings, delivered therapy pending cultures, the continuing neutropenia, daily reassessment, disposition, and outcome uncertainty. The controls do not take history; examine; acquire or interpret observations, laboratory, imaging, or another test; calculate a risk score; diagnose; select or deliver a drug, dose, route, access, infusion, fluid, or oxygen; perform a procedure; determine eligibility, disposition, or prognosis; or predict response, organism, survival, or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'febrile-neutropenia-trajectory', objectiveId: 'reconcile-infectious-disease-neutropenia-fever-count-chemotherapy-day-and-absent-local-signs', question: 'Which findings, and which absent findings, established the trajectory?' },
    { id: 'febrile-neutropenia-recognition', objectiveId: 'recognize-infectious-disease-neutropenia-emergency-despite-a-blind-examination', question: 'Why did a well appearance, a modest marker, and a flat white cell count fail to lower the urgency?' },
    { id: 'febrile-neutropenia-activation', objectiveId: 'activate-infectious-disease-neutropenia-pathway-and-culture-ownership', question: 'Which owners and samples needed to begin together, and what could not wait for them?' },
    { id: 'febrile-neutropenia-boundaries', objectiveId: 'review-infectious-disease-neutropenia-timing-and-risk-score-boundary', question: 'What did the one-hour target and the risk scores each establish, and what did they leave open?' },
    { id: 'febrile-neutropenia-reassessment', objectiveId: 'record-infectious-disease-neutropenia-bounded-empiric-intent-and-strict-reassessment', question: 'What did the bounded intent and the later assessment establish without proving a source or recovery?' },
    { id: 'febrile-neutropenia-handoff', objectiveId: 'handoff-infectious-disease-neutropenia-continuing-neutropenia-absent-source-and-active-risk', question: 'Which continuing neutropenia, source, and outcome risks required handoff?' },
  ] },
};
