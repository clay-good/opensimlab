/** Meningococcal sepsis recognition, activation, and bounded qualified-team intent. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const MENINGOCOCCAL_SEPSIS_RECOGNITION_AND_ESCALATION: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'meningococcal-sepsis-recognition-and-escalation', version: '0.1.0', maturity: 'preview',
    title: 'Meningococcal sepsis with a non-blanching rash', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 7, difficulty: 'advanced', objectives: [
      { id: 'reconcile-infectious-disease-meningococcal-rash-perfusion-conscious-level-and-whole-patient', statement: 'Reconcile the rash, perfusion, conscious level, laboratory evidence, and whole patient.', measure: 'The non-blanching lesions larger than 2 mm, fever, heart rate 138/min, BP 88/44 mmHg, capillary refill 4 s, conscious level 14/15, lactate 4.1 mmol/L, platelets 96 x10^9/L, and leucopenia were connected without learner history, examination, sampling, or scoring.' },
      { id: 'recognize-infectious-disease-meningococcal-pattern-without-single-marker-or-vaccination-closure', statement: 'Recognize a strongly suspected meningococcal pattern without closing on one marker or on vaccination.', measure: 'The pattern prompted urgent action while an unimpressive C-reactive protein, leucopenia, prior MenACWY vaccination, and the absence of a rash were each refused as exclusions and other causes remained open.' },
      { id: 'activate-infectious-disease-meningococcal-senior-decision-maker-and-critical-care-ownership', statement: 'Activate senior decision-making, laboratory, and critical-care ownership.', measure: 'A senior clinical decision maker, blood culture and whole-blood PCR sampling arranged without delaying care, and critical-care review of vasoactive and access needs were recorded without learner drug, dose, device, or procedure selection.' },
      { id: 'review-infectious-disease-meningococcal-timing-and-fluid-ceiling-boundary', statement: 'Review the antimicrobial timing and fluid-ceiling boundary.', measure: 'The one-hour antimicrobial target, the refusal to delay transfer for pre-hospital antimicrobials, the lagging inflammatory markers, and the contested divergence between the United Kingdom bolus cap and the international paediatric ceiling were kept explicit.' },
      { id: 'record-infectious-disease-meningococcal-bounded-intent-and-consultant-attendance', statement: 'Record bounded qualified-team intent, then escalate when the authored review shows an inadequate response.', measure: 'Antimicrobial and fluid intent were recorded without agent, dose, route, or volume; the fixed one-hour review showed heart rate 144/min, MAP 56 mmHg, lactate 4.4 mmol/L and a rising C-reactive protein, and a consultant was alerted to attend in person rather than accepting telephone ownership.' },
      { id: 'handoff-infectious-disease-meningococcal-unresolved-shock-source-and-active-risk', statement: 'Hand off unresolved shock, source and contact questions, and active risk.', measure: 'The handoff preserved serial bedside and laboratory evidence, delivered antimicrobial and fluid care, critical-care review, unconfirmed diagnosis, contact and public-health questions, and outcome uncertainty.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0', sources: [
        'National Institute for Health and Care Excellence. Meningitis (bacterial) and meningococcal disease: recognition, diagnosis and management. NICE guideline NG240. Published 2024-03-19. Recommendations 1.1.9, 1.1.10, 1.1.12, 1.2.3, 1.5.1, 1.5.3, 1.5.4.',
        'National Institute for Health and Care Excellence. Suspected sepsis in under 16s: recognition, diagnosis and early management. NICE guideline NG254. Published 2025-11-19, replacing NG51. Table 3 and recommendations 1.7.2, 1.7.6, 1.7.9, 1.7.10, 1.7.11, 1.9.2.',
        'Sanchez-Pinto LN, Bennett TD, DeWitt PE, et al. Development and Validation of the Phoenix Criteria for Pediatric Sepsis and Septic Shock. JAMA. 2024;331(8):675-686. doi:10.1001/jama.2024.0196.',
      ] },
    limitations: ['meningococcal-sepsis-presentation-and-response-are-authored',
      'meningococcal-sepsis-controls-are-recognition-and-intent-only',
      'meningococcal-sepsis-timing-and-fluid-ceiling-are-regionally-contested'],
  },
  patient: {
    ageYears: 15, sex: 'female', heightCm: 165, weightKg: 60, asaClass: 2,
    diagnosis: 'Authored strongly suspected meningococcal sepsis with a non-blanching rash',
    procedure: 'calm recognition, escalation, bounded antimicrobial and fluid intent, reassessment, and handoff practice',
    comorbidities: ['Previously well; MenACWY vaccinated through the routine adolescent programme'],
    medications: ['Exact home medicines, immunisation records, and travel or contact history remain qualified-team work'],
    allergies: ['No known drug allergies'], fasting: 'Not relevant to the infectious-disease fixture',
    baseline: { heartRateBpm: 138, meanArterialMmHg: 59, strokeVolumeMl: 48,
      hemoglobinGPerDl: 12.6, bloodVolumeMl: 4_200, coreTemperatureC: 39.2,
      arterialStiffness: 1, baroreflexGain: 0.7, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Irritable but rousable, speaking in short sentences and protecting the airway in the supplied fixture' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 420, respiratoryRateBpm: 12,
      freshGasFlowLPerMin: 10, delivering: false } }, formulary: [],
  timeline: [
    { id: 'meningococcal-sepsis-presentation', type: 'narrative', target: 'meningococcal-sepsis', atTick: 0,
      severity: 'critical', message: 'A previously well 15-year-old arrives nine hours after a headache and fever began. She is irritable but rousable, with cold hands and a rash her family first noticed an hour ago. Authored monitor state is sinus tachycardia 138/min, BP 88/44 mmHg (MAP 59), RR 28/min, SpO2 96% in air, and T 39.2 C. Capillary refill is 4 s and the conscious level is 14/15. Petechiae are visible on the ankles and trunk, including two lesions larger than 2 mm; they do not blanch under gentle pressure. There is no authored airway obstruction, wheeze, focal lung finding, seizure, focal neurologic deficit, or major hemorrhage.' },
    { id: 'meningococcal-sepsis-evidence', type: 'narrative', target: 'meningococcal-sepsis-evidence', atTick: 0,
      severity: 'warning', message: 'Supplied laboratory evidence is lactate 4.1 mmol/L, platelets 96 x10^9/L, INR 1.5, white cells 3.4 x10^9/L with neutrophils 2.1, and C-reactive protein 48 mg/L. The low white cell count and unimpressive C-reactive protein are adverse and lagging findings rather than reassurance. She completed the routine adolescent MenACWY programme, which does not cover serogroup B. The rash, perfusion, conscious level, and laboratory pattern support urgent action, but no single number makes a learner diagnosis; other invasive bacterial, viral, and non-infectious causes remain open.' },
    { id: 'meningococcal-sepsis-boundary', type: 'narrative', target: 'meningococcal-sepsis-boundary', atTick: 0,
      severity: 'warning', message: 'Reconcile the rash, perfusion, conscious level, laboratory evidence, and the whole patient; recognize a strongly suspected meningococcal pattern without diagnostic closure; record senior clinical decision-maker ownership, blood culture and whole-blood PCR sampling arranged so it does not delay care, and critical-care review of vasoactive and access needs; then review the timing and fluid boundary. The learner may record only bounded qualified-team antimicrobial and fluid intent; no agent, dose, route, preparation, access, infusion, bolus volume, oxygen setting, lumbar-puncture decision, imaging, source control, or contact prophylaxis is exposed. Petechiae are harder to see on brown, black, and tanned skin, so the whole body, conjunctivae, and soles are checked under good light, and the absence of a rash would not exclude the pattern. After elapsed simulated time without recorded antimicrobial and fluid intent, a strict fixed untreated contrast supplies heart rate 152/min, BP 76/36 mmHg, capillary refill 5 s, conscious level 10/15, lactate 6.8 mmol/L, and spreading purpura. Once intent is recorded, a strict fixed one-hour review instead supplies heart rate 144/min, BP 84/42 mmHg, lactate 4.4 mmol/L, platelets 84 x10^9/L, and a risen C-reactive protein of 96 mg/L; a rising C-reactive protein is expected with elapsed time and is not by itself treatment failure. That inadequate response requires alerting a consultant to attend in person, which is a distinct escalation from earlier telephone ownership. No individualized effect, treatment causality, source control, organism confirmation, eligibility, disposition, prognosis, or outcome is reported. Qualified teams retain antimicrobial selection and delivery, fluid volume, vasoactive and access decisions, lumbar puncture and imaging timing, source control, public-health notification, contact prophylaxis, and all treatment decisions. After another elapsed interval, hand off serial findings, delivered care, unresolved shock, the unconfirmed diagnosis, contact questions, disposition, and outcome uncertainty. The controls do not take history; examine; acquire or interpret monitoring, blood gas, laboratory, ECG, imaging, or another test; calculate a sepsis score; diagnose; select or deliver oxygen, a drug, dose, route, access, infusion, fluid volume, or device; perform a procedure; determine eligibility, disposition, or prognosis; or predict response, organism, survival, or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'meningococcal-sepsis-trajectory', objectiveId: 'reconcile-infectious-disease-meningococcal-rash-perfusion-conscious-level-and-whole-patient', question: 'Which rash, perfusion, conscious-level, and laboratory findings established the trajectory?' },
    { id: 'meningococcal-sepsis-recognition', objectiveId: 'recognize-infectious-disease-meningococcal-pattern-without-single-marker-or-vaccination-closure', question: 'Why did an unimpressive C-reactive protein, leucopenia, and prior vaccination fail to exclude this pattern?' },
    { id: 'meningococcal-sepsis-activation', objectiveId: 'activate-infectious-disease-meningococcal-senior-decision-maker-and-critical-care-ownership', question: 'Which owners, samples, and reviews needed to begin together, and what could not wait for them?' },
    { id: 'meningococcal-sepsis-boundaries', objectiveId: 'review-infectious-disease-meningococcal-timing-and-fluid-ceiling-boundary', question: 'What did the one-hour target and the contested fluid ceiling each establish and leave open?' },
    { id: 'meningococcal-sepsis-reassessment', objectiveId: 'record-infectious-disease-meningococcal-bounded-intent-and-consultant-attendance', question: 'What did the authored one-hour review show, and why was attendance in person a distinct escalation?' },
    { id: 'meningococcal-sepsis-handoff', objectiveId: 'handoff-infectious-disease-meningococcal-unresolved-shock-source-and-active-risk', question: 'Which unresolved shock, source, contact, and outcome risks required handoff?' },
  ] },
};
