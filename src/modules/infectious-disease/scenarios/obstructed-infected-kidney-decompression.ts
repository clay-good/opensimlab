/** Infected obstructed kidney: antimicrobials are not source control. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const OBSTRUCTED_INFECTED_KIDNEY_DECOMPRESSION: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'obstructed-infected-kidney-decompression', version: '0.1.0', maturity: 'preview',
    title: 'Infected obstructed kidney: drainage is the treatment', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 8, difficulty: 'advanced', objectives: [
      { id: 'reconcile-infectious-disease-obstruction-fever-perfusion-kidney-function-and-supplied-imaging', statement: 'Reconcile the fever, perfusion, kidney function, and supplied imaging.', measure: 'Temperature 38.9 C, heart rate 118/min, BP 104/58 mmHg, respiratory rate 26/min, track-and-trigger score 8, lactate 2.6 mmol/L, creatinine 148 µmol/L against a baseline near 70, and the supplied obstructing stone with hydronephrosis were connected without learner history, examination, sampling, imaging acquisition, or scoring.' },
      { id: 'recognize-infectious-disease-obstruction-undrained-source-rather-than-severe-infection', statement: 'Recognize an undrained source rather than a more severe infection.', measure: 'The obstruction was identified as a source-control problem that antimicrobial therapy alone may not resolve, without closing on the organism, the degree of obstruction, or recoverable kidney function.' },
      { id: 'activate-infectious-disease-obstruction-urology-interventional-radiology-and-culture-ownership', statement: 'Activate urology, interventional radiology, and culture ownership.', measure: 'Early urology and interventional-radiology involvement, blood and urine cultures with a further collecting-system sample at decompression, and surveillance were recorded, with the timing of intervention left to the receiving team after senior advice.' },
      { id: 'review-infectious-disease-obstruction-timing-modality-and-evidence-boundary', statement: 'Review the timing, modality, and evidence boundary.', measure: 'The absence of any guideline hour threshold, the strong urological recommendation resting on low-grade evidence against a conditional six-hour sepsis figure of very low certainty, the unresolved choice between nephrostomy and stenting, the withdrawn urosepsis section, and the trial evidence that rarely enrolled obstructed patients were all kept explicit.' },
      { id: 'record-infectious-disease-obstruction-bounded-decompression-intent-and-deferred-stone-treatment', statement: 'Record bounded decompression intent and defer definitive stone treatment.', measure: 'Urgent decompression intent was recorded without selecting modality, access, timing, or operator, and definitive stone treatment was deferred until the infection is treated; the authored later assessment showed improvement with a still-rising C-reactive protein reflecting its lag.' },
      { id: 'handoff-infectious-disease-obstruction-unresolved-infection-kidney-function-and-active-risk', statement: 'Hand off unresolved infection, kidney function, and active risk.', measure: 'The handoff preserved serial observations and laboratory evidence, the requested decompression and its pending timing, culture and antimicrobial review, kidney-function recovery, the later stone decision, and the possibility of deterioration after drainage.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0', sources: [
        'American Urological Association. Surgical Management of Kidney and Ureteral Stones: AUA Guideline (2026). Approved November 2025. Statement 38 (urgent renal drainage; Strong Recommendation, Evidence Level Grade C) and its nephrostomy-or-stent sub-statement (Conditional Recommendation, Evidence Level Grade A).',
        'European Association of Urology. Guidelines on Urolithiasis, limited text update March 2026. Management of sepsis and anuria in the obstructed kidney: urgent decompression and deferral of definitive stone treatment, both Strong.',
        'National Institute for Health and Care Excellence. Suspected sepsis in people aged 16 or over. NICE guideline NG253. Published 2025-11-19, replacing NG51. Recommendations 1.6.2, 1.6.4, 1.6.5, 1.11.1 to 1.11.4.',
      ] },
    limitations: ['obstructed-kidney-presentation-and-response-are-authored',
      'obstructed-kidney-controls-are-recognition-activation-and-intent-only',
      'obstructed-kidney-timing-and-modality-are-not-established-by-evidence'],
  },
  patient: {
    ageYears: 58, sex: 'female', heightCm: 164, weightKg: 72, asaClass: 2,
    diagnosis: 'Authored infected obstructed kidney from a distal ureteric stone',
    procedure: 'calm source-control recognition, escalation, bounded decompression intent, reassessment, and handoff practice',
    comorbidities: ['Three days of right flank pain and rigors; no prior urological history'],
    medications: ['Appropriate intravenous antimicrobial therapy is already running as a supplied premise; agent, dose, and review remain qualified-team work'],
    allergies: ['No known drug allergies'], fasting: 'Not relevant to the infectious-disease fixture',
    baseline: { heartRateBpm: 118, meanArterialMmHg: 73, strokeVolumeMl: 54,
      hemoglobinGPerDl: 11.8, bloodVolumeMl: 4_600, coreTemperatureC: 38.9,
      arterialStiffness: 1, baroreflexGain: 0.7, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Alert but exhausted, speaking in full sentences and protecting the airway in the supplied fixture' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 460, respiratoryRateBpm: 12,
      freshGasFlowLPerMin: 10, delivering: false } }, formulary: [],
  timeline: [
    { id: 'obstructed-kidney-presentation', type: 'narrative', target: 'obstructed-kidney', atTick: 0,
      severity: 'critical', message: 'A 58-year-old woman has had three days of right flank pain and rigors. Appropriate intravenous antimicrobial therapy is already running: that is a supplied premise of this lesson, not something the learner selects or verifies. Authored monitor state is sinus tachycardia 118/min, BP 104/58 mmHg (MAP 73), RR 26/min, SpO2 95% in air, and T 38.9 C. She is alert but exhausted, and the authored track-and-trigger score is 8. There is no authored airway obstruction, focal lung finding, rash, focal neurologic deficit, or major hemorrhage.' },
    { id: 'obstructed-kidney-evidence', type: 'narrative', target: 'obstructed-kidney-evidence', atTick: 0,
      severity: 'warning', message: 'Supplied laboratory evidence is lactate 2.6 mmol/L, creatinine 148 µmol/L against a documented baseline near 70, white cells 18.4 x10^9/L, platelets 148 x10^9/L, and C-reactive protein 210 mg/L. Supplied imaging reports an 8 mm obstructing distal ureteric stone on the right with moderate hydronephrosis and perinephric stranding. The imaging is given, not acquired or interpreted by the learner. The pattern supports an infected obstructed kidney, but no single value makes a learner diagnosis, and the organism, the true degree of obstruction, and the kidney’s recoverable function all remain open.' },
    { id: 'obstructed-kidney-boundary', type: 'narrative', target: 'obstructed-kidney-boundary', atTick: 0,
      severity: 'warning', message: 'Reconcile the fever, perfusion, kidney function, and supplied imaging; recognize an undrained source rather than a more severe infection; involve urology and interventional radiology early, request blood and urine cultures with a further collecting-system sample at decompression, and arrange surveillance; then review the timing, modality, and evidence boundary. The learner may record only bounded qualified-team intent for urgent decompression and the deferral of definitive stone treatment; no modality, access, anaesthetic, operator, timing, antimicrobial, dose, route, fluid, or oxygen setting is exposed, and no procedure is performed. No guideline states an hour threshold for decompression: urological bodies recommend urgent drainage strongly on low-grade evidence, while the sepsis guidance that supplies a six-hour figure grades it conditional on very-low-certainty observational evidence. Percutaneous nephrostomy and retrograde stenting are not separated by outcome evidence, so neither is marked correct. After elapsed simulated time with the collecting system still obstructed, a strict fixed untreated contrast supplies heart rate 132/min, BP 86/44 mmHg, RR 30/min, new confusion, track-and-trigger score 15, lactate 4.2 mmol/L, creatinine 212 µmol/L, and platelets 96 x10^9/L. Once decompression intent is recorded, a strict fixed later assessment instead supplies heart rate 104/min, BP 108/62 mmHg, track-and-trigger score 5, lactate 2.1 mmol/L, and creatinine 176 µmol/L alongside a C-reactive protein of 268 mg/L that is still rising because that marker lags by many hours and is not a decompression trigger. Improvement after drainage is not cure: deterioration after decompression is well described. No individualized effect, treatment causality, organism, eligibility, disposition, prognosis, or outcome is reported. Qualified teams retain antimicrobial selection and review, drainage modality, access, timing and operator, anaesthetic care, kidney-function management, definitive stone treatment, and all treatment decisions. After another elapsed interval, hand off serial findings, the requested decompression and its pending timing, culture and antimicrobial review, kidney recovery, the later stone decision, disposition, and outcome uncertainty. The controls do not take history; examine; acquire or interpret observations, laboratory, imaging, or another test; calculate a score; diagnose; select or deliver a drug, dose, route, fluid, oxygen, or device; perform or schedule a procedure; determine eligibility, disposition, or prognosis; or predict response, organism, survival, or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'obstructed-kidney-trajectory', objectiveId: 'reconcile-infectious-disease-obstruction-fever-perfusion-kidney-function-and-supplied-imaging', question: 'Which observations, laboratory values, and imaging findings established the trajectory?' },
    { id: 'obstructed-kidney-recognition', objectiveId: 'recognize-infectious-disease-obstruction-undrained-source-rather-than-severe-infection', question: 'Why was this an undrained source rather than simply a more severe infection?' },
    { id: 'obstructed-kidney-activation', objectiveId: 'activate-infectious-disease-obstruction-urology-interventional-radiology-and-culture-ownership', question: 'Which owners and samples needed to begin together, and whose decision was the timing?' },
    { id: 'obstructed-kidney-boundaries', objectiveId: 'review-infectious-disease-obstruction-timing-modality-and-evidence-boundary', question: 'What did the timing and modality evidence establish, and what did it leave genuinely open?' },
    { id: 'obstructed-kidney-reassessment', objectiveId: 'record-infectious-disease-obstruction-bounded-decompression-intent-and-deferred-stone-treatment', question: 'What did the bounded intent and the deferred stone decision each establish, and why did the marker still rise?' },
    { id: 'obstructed-kidney-handoff', objectiveId: 'handoff-infectious-disease-obstruction-unresolved-infection-kidney-function-and-active-risk', question: 'Which unresolved infection, kidney, drainage, and stone risks required handoff?' },
  ] },
};
