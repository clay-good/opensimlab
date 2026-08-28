/** Toxic shock: a surveillance definition is not a bedside decision rule. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const TOXIC_SHOCK_A_DEFINITION_THAT_CANNOT_CLOSE: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'toxic-shock-a-definition-that-cannot-close', version: '0.1.0', maturity: 'preview',
    title: 'Toxic shock: a definition that cannot close', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 8, difficulty: 'advanced', objectives: [
      { id: 'reconcile-infectious-disease-toxic-shock-erythroderma-hypotension-and-organ-involvement', statement: 'Reconcile the erythroderma, early hypotension, and organ involvement.', measure: 'Temperature 39.4 C, heart rate 128/min, BP 88/44 mmHg, diffuse macular erythroderma, mucosal hyperaemia, vomiting and diarrhoea from onset, platelets 118 x10^9/L, creatinine 1.9 mg/dL, alanine aminotransferase 78 U/L, and creatine kinase 640 U/L were connected without learner history, examination, sampling, or scoring.' },
      { id: 'recognize-infectious-disease-toxic-shock-pattern-without-a-closable-definition', statement: 'Recognize a toxin-mediated pattern without a definition that can close.', measure: 'The pattern was acted on while both surveillance definitions were held open, one for a temporal reason and one for a microbiological reason, and a criteria count was refused as a probability.' },
      { id: 'activate-infectious-disease-toxic-shock-critical-care-and-culture-ownership', statement: 'Activate critical care and culture ownership on the pattern.', measure: 'Critical care and senior ownership were activated without waiting for a definition to close, and blood and sterile-site cultures were requested with the recognition that the same pending result answers one definition and violates the other.' },
      { id: 'review-infectious-disease-toxic-shock-surveillance-definition-boundary', statement: 'Review what a surveillance definition is for.', measure: 'The definitions were identified as instruments for counting cases consistently rather than for bedside decisions, the negative-culture requirement as a clause excluding other diagnoses rather than evidence against infection, and a four-hour no-growth result as uninformative rather than negative.' },
      { id: 'record-infectious-disease-toxic-shock-open-definition-status-and-recheck-horizon', statement: 'Record the definition status openly, with its reason and a re-check horizon.', measure: 'The record stated that the definition is unmet, why it is unmet for each definition, a re-check horizon of one to two weeks, and that it may remain unmet permanently; the fixed later assessment added criteria on both definitions without closing either.' },
      { id: 'handoff-infectious-disease-toxic-shock-an-explicitly-open-diagnosis', statement: 'Hand off an explicitly open diagnosis.', measure: 'The handoff preserved serial perfusion and organ evidence, delivered treatment, pending cultures, public-health considerations where applicable, and the named re-check for desquamation, with the diagnosis handed over open and the reason recorded.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0', sources: [
        'Centers for Disease Control and Prevention and Council of State and Territorial Epidemiologists. Toxic Shock Syndrome (Other Than Streptococcal), 2011 Case Definition. Fever at or above 38.9 C, diffuse macular erythroderma, desquamation 1 to 2 weeks after onset of rash, systolic blood pressure at or below 90 mmHg, and multisystem involvement in at least 3 of 7 organ systems; laboratory criteria include negative blood and cerebrospinal fluid cultures, with blood permitted to be positive for Staphylococcus aureus. Confirmed requires all 5 clinical findings including desquamation unless the patient dies first.',
        'Centers for Disease Control and Prevention and Council of State and Territorial Epidemiologists. Streptococcal Toxic Shock Syndrome, 2010 Case Definition. Hypotension plus at least 2 of renal impairment, coagulopathy, hepatic involvement, acute respiratory distress syndrome, generalized erythematous macular rash, or soft-tissue necrosis; confirmed requires isolation of group A Streptococcus from a normally sterile site, probable from a non-sterile site.',
        'World Health Organization. Increased incidence of scarlet fever and invasive Group A Streptococcus infection, multi-country. Disease Outbreak News, 15 December 2022. The documented international rise changed alerting and contact management rather than the case definitions, which remain at their 2010 and 2011 versions.',
      ] },
    limitations: ['toxic-shock-presentation-and-deterioration-are-authored',
      'toxic-shock-controls-are-recognition-activation-and-intent-only',
      'toxic-shock-definitions-are-surveillance-instruments-not-bedside-rules'],
  },
  patient: {
    ageYears: 22, sex: 'female', heightCm: 168, weightKg: 62, asaClass: 3,
    diagnosis: 'Authored toxin-mediated shock pattern with an unmet surveillance case definition',
    procedure: 'calm pattern recognition, activation, bounded treatment intent, open-definition recording, and handoff practice',
    comorbidities: ['Previously well; source control for the documented focus was completed by the qualified team before this rehearsal'],
    medications: ['Antimicrobial, adjunct, fluid, and vasoactive decisions remain qualified-team work'],
    allergies: ['No known drug allergies'], fasting: 'Not relevant to the infectious-disease fixture',
    baseline: { heartRateBpm: 128, meanArterialMmHg: 59, strokeVolumeMl: 52,
      hemoglobinGPerDl: 12.2, bloodVolumeMl: 4_300, coreTemperatureC: 39.4,
      arterialStiffness: 1, baroreflexGain: 0.7, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Alert but distressed and flushed, protecting the airway in the supplied fixture' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 440, respiratoryRateBpm: 12,
      freshGasFlowLPerMin: 10, delivering: false } }, formulary: [],
  timeline: [
    { id: 'toxic-shock-presentation', type: 'narrative', target: 'toxic-shock', atTick: 0,
      severity: 'critical', message: 'A previously well 22-year-old presents acutely unwell with a diffuse macular erythroderma, conjunctival and oropharyngeal hyperaemia, and vomiting and diarrhoea from the onset of the illness. Authored monitor state is sinus tachycardia 128/min, BP 88/44 mmHg (MAP 59), RR 26/min, SpO2 96% in air, and T 39.4 C. She is alert but distressed. Source control for the documented focus was completed by the qualified team before this rehearsal begins and is not a learner action. There is no authored airway compromise, focal neurologic deficit, or hemorrhage.' },
    { id: 'toxic-shock-evidence', type: 'narrative', target: 'toxic-shock-evidence', atTick: 0,
      severity: 'warning', message: 'Supplied laboratory evidence is white cells 16.8 x10^9/L with 18% band forms, platelets 118 x10^9/L, creatinine 1.9 mg/dL, alanine aminotransferase 78 U/L, creatine kinase 640 U/L, C-reactive protein 210 mg/L, and lactate 3.4 mmol/L. Blood cultures are pending with no growth so far. Two surveillance case definitions apply and neither is met. One requires desquamation one to two weeks after the rash, which cannot have happened. The other requires isolation of the organism, which has not grown. Those are different reasons, and the same pending culture answers one definition and violates the other, because one requires the cultures to be negative and the other requires an organism to grow.' },
    { id: 'toxic-shock-boundary', type: 'narrative', target: 'toxic-shock-boundary', atTick: 0,
      severity: 'warning', message: 'Reconcile the erythroderma, the early hypotension, and the organ involvement; recognize a toxin-mediated pattern without a definition that can close; activate critical care and senior ownership on the pattern rather than waiting for a classification; request blood and sterile-site cultures; review what a surveillance definition is for; record bounded qualified-team treatment intent; and record the definition status openly with its reason and a named re-check horizon. The learner may record only bounded intent for antimicrobial therapy and haemodynamic support per local protocol; no agent, dose, route, combination, adjunct, immunoglobulin, fluid volume, vasoactive choice, or procedure is exposed. These definitions were built to count cases consistently across populations, not to decide treatment at a bedside; a criteria count is not a probability; the requirement in one definition for negative blood cultures is a clause excluding other diagnoses rather than evidence against infection; and cultures showing no growth at four hours are uninformative rather than negative. After elapsed simulated time, a strict fixed deterioration supplies heart rate 138/min, BP 82/40 mmHg despite fluid given by the qualified team, temperature 39.8 C, platelets 84 x10^9/L, creatinine 2.4 mg/dL, alanine aminotransferase 140 U/L, creatine kinase 1450 U/L, and lactate 4.6 mmol/L. More criteria are satisfied on both definitions and neither closes. Desquamation still cannot have occurred, and the cultures still show no growth. Reported case fatality spans a wide range across published series, so no single figure is asserted. No individualized effect, treatment causality, classification, organism, source, eligibility, disposition, prognosis, or outcome is reported. Qualified teams retain antimicrobial and adjunct selection, haemodynamic support, source review, culture interpretation, public-health notification, and all treatment decisions. After another elapsed interval, hand off serial findings, delivered treatment, pending cultures, the named re-check for desquamation, disposition, and outcome uncertainty, with the diagnosis explicitly open. The controls do not take history; examine; acquire or interpret observations, laboratory, imaging, or another test; classify a case; diagnose; select or deliver a drug, dose, route, fluid, oxygen, or device; perform a procedure; determine eligibility, disposition, or prognosis; or predict response, organism, survival, or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'toxic-shock-trajectory', objectiveId: 'reconcile-infectious-disease-toxic-shock-erythroderma-hypotension-and-organ-involvement', question: 'Which findings established the toxin-mediated pattern?' },
    { id: 'toxic-shock-recognition', objectiveId: 'recognize-infectious-disease-toxic-shock-pattern-without-a-closable-definition', question: 'Why could neither definition close, and were the two reasons the same?' },
    { id: 'toxic-shock-activation', objectiveId: 'activate-infectious-disease-toxic-shock-critical-care-and-culture-ownership', question: 'What did the single culture request mean for each definition?' },
    { id: 'toxic-shock-boundaries', objectiveId: 'review-infectious-disease-toxic-shock-surveillance-definition-boundary', question: 'What is a surveillance definition for, and what is it not for?' },
    { id: 'toxic-shock-reassessment', objectiveId: 'record-infectious-disease-toxic-shock-open-definition-status-and-recheck-horizon', question: 'What did recording the definition status openly accomplish?' },
    { id: 'toxic-shock-handoff', objectiveId: 'handoff-infectious-disease-toxic-shock-an-explicitly-open-diagnosis', question: 'Which open questions and re-checks required handoff?' },
  ] },
};
