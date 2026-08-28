/** Severe pneumonia: the score answered a different question. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const SEVERE_PNEUMONIA_THE_SCORE_ANSWERED_ANOTHER_QUESTION: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'severe-pneumonia-the-score-answered-another-question', version: '0.1.0', maturity: 'preview',
    title: 'Pneumonia: two scores, one question', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 8, difficulty: 'advanced', objectives: [
      { id: 'reconcile-infectious-disease-pneumonia-two-correct-instruments-that-disagree', statement: 'Reconcile two supplied instruments that are both correct and disagree.', measure: 'A mortality score of 2 placing the patient in a ward band, and 3 severity criteria met from respiratory rate 30/min, an oxygenation ratio of 171, and multilobar shadowing, were held together without learner history, examination, sampling, imaging, or scoring.' },
      { id: 'recognize-infectious-disease-pneumonia-instrument-question-mismatch', statement: 'Recognize that one instrument answers a different question.', measure: 'The mortality score was identified as a prognostic instrument for thirty-day death and admission rather than for level of care, with pooled discrimination for critical-care admission of about 0.69, and the severity criteria identified as the instrument built for the question in front of the learner.' },
      { id: 'activate-infectious-disease-pneumonia-critical-care-review-ownership', statement: 'Activate critical-care review while the patient is still on a ward trajectory.', measure: 'Critical-care review was requested citing the severity criteria met rather than the mortality band, framed as a review rather than an admission decision, with surveillance arranged.' },
      { id: 'review-infectious-disease-pneumonia-triage-evidence-boundary', statement: 'Review the triage evidence boundary.', measure: 'The absence of any randomised evidence that a severity tool improves outcomes when used for triage, the confounded observational basis of the delay-harm evidence, the fact that the severity criteria have never been re-derived, the irrelevance of the C-reactive protein and sodium to every criteria set, and the public split between the two guideline bodies were all kept explicit.' },
      { id: 'record-infectious-disease-pneumonia-bounded-escalation-intent-and-strict-reassessment', statement: 'Record bounded escalation intent, then reassess a strict later report.', measure: 'Intent for anticipated respiratory and circulatory support review was recorded without selecting an oxygen device, ventilation mode, fluid volume, vasoactive agent, antimicrobial, or steroid; the fixed later assessment showed an oxygenation ratio of 92, new confusion, and the mortality score risen to 4.' },
      { id: 'handoff-infectious-disease-pneumonia-pending-level-of-care-and-active-risk', statement: 'Hand off a pending level-of-care decision and active risk.', measure: 'The handoff preserved serial respiratory and laboratory findings, the pending level-of-care decision as the receiving team’s, and the fact that bed availability is a real-world constraint this rehearsal does not model.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0', sources: [
        'Metlay JP, Waterer GW, Long AC, et al. Diagnosis and Treatment of Adults with Community-acquired Pneumonia. An Official Clinical Practice Guideline of the American Thoracic Society and Infectious Diseases Society of America. Am J Respir Crit Care Med. 2019;200(7):e45-e67. Severe CAP major and minor criteria; three or more minor criteria define severe pneumonia. The 2025 ATS update did not revise the severity definition, and IDSA did not endorse that update.',
        'National Institute for Health and Care Excellence. Pneumonia: diagnosis and management. NICE guideline NG250. Published 2025-09-02, replacing NG138 and NG139 and partially replacing CG191. CURB65 supports place-of-care decisions alongside clinical judgement rather than in isolation; a score of 3 or more indicates inpatient care with referral to critical care services if appropriate.',
        'Marti C, Garin N, Grosgurin O, et al. Prediction of severe community-acquired pneumonia: a systematic review and meta-analysis. Crit Care. 2012;16:R141. Pooled discrimination of about 0.69 for CURB-65 and PSI in predicting critical-care admission; severity criteria and purpose-built tools discriminate better.',
      ] },
    limitations: ['severe-pneumonia-presentation-and-deterioration-are-authored',
      'severe-pneumonia-controls-are-recognition-activation-and-intent-only',
      'severe-pneumonia-triage-tools-have-no-randomised-outcome-evidence'],
  },
  patient: {
    ageYears: 62, sex: 'male', heightCm: 174, weightKg: 88, asaClass: 3,
    diagnosis: 'Authored severe community-acquired pneumonia with multilobar consolidation',
    procedure: 'calm reconciliation of two instruments, critical-care activation, bounded escalation intent, reassessment, and handoff practice',
    comorbidities: ['Right lower and middle lobe consolidation on the supplied chest radiograph'],
    medications: ['Antimicrobial, steroid, oxygen, fluid, and vasoactive decisions remain qualified-team work'],
    allergies: ['No known drug allergies'], fasting: 'Not relevant to the infectious-disease fixture',
    baseline: { heartRateBpm: 116, meanArterialMmHg: 78, strokeVolumeMl: 70,
      hemoglobinGPerDl: 13.1, bloodVolumeMl: 5_600, coreTemperatureC: 38.7,
      arterialStiffness: 1, baroreflexGain: 0.7, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Orientated and breathless in short sentences, protecting the airway in the supplied fixture' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.35, tidalVolumeMl: 540, respiratoryRateBpm: 12,
      freshGasFlowLPerMin: 10, delivering: false } }, formulary: [],
  timeline: [
    { id: 'severe-pneumonia-presentation', type: 'narrative', target: 'severe-pneumonia', atTick: 0,
      severity: 'critical', message: 'A 62-year-old man is admitted with community-acquired pneumonia and right lower and middle lobe consolidation on the supplied chest radiograph. He is orientated and speaking in short sentences. Authored monitor state is sinus tachycardia 116/min, BP 106/64 mmHg (MAP 78), RR 30/min, SpO2 92% on an inspired oxygen fraction of 0.35, and T 38.7 C. There is no authored airway compromise, focal neurologic deficit, rash, or hemorrhage.' },
    { id: 'severe-pneumonia-evidence', type: 'narrative', target: 'severe-pneumonia-evidence', atTick: 0,
      severity: 'warning', message: 'Supplied laboratory evidence is urea 8.4 mmol/L, white cells 16.4 x10^9/L, platelets 148 x10^9/L, C-reactive protein 284 mg/L, sodium 129 mmol/L, and lactate 2.6 mmol/L. The supplied arterial oxygen tension is 60 mmHg, giving an oxygenation ratio of 171. Two instruments are supplied and both are correctly calculated. The mortality score reads 2, from the urea and the respiratory rate, which places him in a ward band. The severity criteria count 3, from a respiratory rate at or above 30, an oxygenation ratio at or below 250, and multilobar shadowing, which defines severe pneumonia. Nothing is hidden and nothing is mismeasured. The C-reactive protein and the sodium, however abnormal, appear in neither instrument.' },
    { id: 'severe-pneumonia-boundary', type: 'narrative', target: 'severe-pneumonia-boundary', atTick: 0,
      severity: 'warning', message: 'Reconcile the two supplied instruments; recognize that the mortality score is answering a different question from the one in front of you; request critical-care review while the patient is still on a ward trajectory, citing the severity criteria rather than the mortality band; then review the triage evidence boundary. The learner may record only bounded qualified-team intent for anticipated escalation of respiratory and circulatory support; no oxygen device, flow, ventilation mode or pressure, fluid volume, vasoactive agent, antimicrobial, steroid, or procedure is exposed. The mortality score is validated for thirty-day mortality and to support the decision to admit; pooled discrimination for predicting critical-care admission is about 0.69, and it weights age and comorbidity heavily, so a patient in early respiratory failure can score low. The severity criteria are the instrument built for the level-of-care question, and even they are an aid to judgement rather than an automatic order. After elapsed simulated time, a strict fixed deterioration supplies respiratory rate 34/min, SpO2 90% on an inspired fraction of 0.60 with an oxygenation ratio of 92, BP 84/46 mmHg after a litre of crystalloid, heart rate 128/min, new confusion, lactate 4.1 mmol/L, urea 10.6 mmol/L, and a mortality score risen to 4. The score catching up is the point rather than a reward: it was always going to, and it was never the instrument for this question. No severity tool has been shown in a randomised trial to improve outcomes when used for triage, the evidence that delayed escalation harms is observational and confounded by indication, the severity criteria have never been formally re-derived, and the two guideline bodies that publish on this condition are publicly split. No individualized effect, treatment causality, level-of-care decision, bed availability, eligibility, disposition, prognosis, or outcome is reported. Qualified teams retain the level-of-care decision, oxygen and ventilatory strategy, circulatory support, antimicrobial and steroid decisions, and all treatment decisions. After another elapsed interval, hand off serial findings, the pending level-of-care decision, disposition, and outcome uncertainty. The controls do not take history; examine; acquire or interpret observations, blood gas, laboratory, imaging, or another test; calculate a score; diagnose; select or deliver a drug, dose, route, fluid, oxygen, or device; perform a procedure; determine eligibility, disposition, or prognosis; or predict response, survival, or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'severe-pneumonia-trajectory', objectiveId: 'reconcile-infectious-disease-pneumonia-two-correct-instruments-that-disagree', question: 'Which findings fed each instrument, and why were both correct?' },
    { id: 'severe-pneumonia-recognition', objectiveId: 'recognize-infectious-disease-pneumonia-instrument-question-mismatch', question: 'What question was each instrument built to answer?' },
    { id: 'severe-pneumonia-activation', objectiveId: 'activate-infectious-disease-pneumonia-critical-care-review-ownership', question: 'Why request review while the patient still looked like a ward admission?' },
    { id: 'severe-pneumonia-boundaries', objectiveId: 'review-infectious-disease-pneumonia-triage-evidence-boundary', question: 'What does the triage evidence establish, and what has never been shown?' },
    { id: 'severe-pneumonia-reassessment', objectiveId: 'record-infectious-disease-pneumonia-bounded-escalation-intent-and-strict-reassessment', question: 'What did the later assessment show, and why was the risen score not a success signal?' },
    { id: 'severe-pneumonia-handoff', objectiveId: 'handoff-infectious-disease-pneumonia-pending-level-of-care-and-active-risk', question: 'Which pending level-of-care and outcome risks required handoff?' },
  ] },
};
