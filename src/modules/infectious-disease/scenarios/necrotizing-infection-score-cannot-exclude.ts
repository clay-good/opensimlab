/** Necrotizing infection: the score cannot exclude it, and delay is the harm. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const NECROTIZING_INFECTION_SCORE_CANNOT_EXCLUDE: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'necrotizing-infection-score-cannot-exclude', version: '0.1.0', maturity: 'preview',
    title: 'Cellulitis that is not settling', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 8, difficulty: 'advanced', objectives: [
      { id: 'reconcile-infectious-disease-necrotizing-pain-margin-and-failed-oral-treatment', statement: 'Reconcile the disproportionate pain, the erythema border, and the failed oral treatment.', measure: 'Severe pain extending past the visible edge, 36 hours of oral therapy without settling, temperature 37.4 C, heart rate 104/min, and lactate 2.4 mmol/L were connected without learner history, examination, sampling, imaging, or scoring.' },
      { id: 'recognize-infectious-disease-necrotizing-that-a-low-score-excludes-nothing', statement: 'Recognize that a score below its cutoff excludes nothing.', measure: 'The derived risk score of 3 was read as uninformative rather than reassuring, and absent crepitus, absent bullae, an unremarkable temperature, and pending imaging were each refused as grounds to wait.' },
      { id: 'activate-infectious-disease-necrotizing-surgical-review-and-marked-border-ownership', statement: 'Activate surgical review and mark the border.', measure: 'Urgent surgical review for consideration of exploration was requested with the concern stated explicitly, and the erythema border was marked and timed so progression could be measured rather than remembered.' },
      { id: 'review-infectious-disease-necrotizing-score-sensitivity-and-timing-evidence-boundary', statement: 'Review the score sensitivity and timing evidence boundary.', measure: 'The score derivation against selected controls, its pooled sensitivity near two-thirds, its reliance on late physiology, the low sensitivity of crepitus and bullae, the instruction that imaging must not delay exploration, and the confounded observational basis of the timing evidence were all kept explicit.' },
      { id: 'record-infectious-disease-necrotizing-bounded-antimicrobial-intent-and-strict-reassessment', statement: 'Record bounded antimicrobial intent alongside surgical review, then reassess.', measure: 'Antimicrobial intent per local protocol was recorded without agent, dose, or route and without substituting for surgery; the fixed later assessment showed the border 4 cm beyond its mark and the score risen to 11, which is useful only after the interval in which acting mattered.' },
      { id: 'handoff-infectious-disease-necrotizing-unconfirmed-diagnosis-and-active-risk', statement: 'Hand off an unconfirmed diagnosis and active risk.', measure: 'The handoff preserved the marked border and its rate, serial observations and laboratory evidence, the surgical decision and its timing as the receiving team’s, and the fact that only exploration can confirm or exclude the diagnosis.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0', sources: [
        'Fernando SM, Tran A, Cheng W, et al. Necrotizing Soft Tissue Infection: Diagnostic Accuracy of Physical Examination, Imaging, and LRINEC Score: A Systematic Review and Meta-Analysis. Ann Surg. 2019;269(1):58-65. PMID:29672405. LRINEC at least 6: sensitivity 68.2%, specificity 84.8%; crepitus 25.2%; hypotension 21.0%; CT 88.5%.',
        'Sartelli M, Coccolini F, Kluger Y, et al. WSES/GAIS/WSIS/SIS-E/AAST global clinical pathways for patients with skin and soft tissue infections. World J Emerg Surg. 2022;17:3. doi:10.1186/s13017-022-00406-2. States a low LRINEC score does not rule out the diagnosis.',
        'Nawijn F, Smeeing DPJ, Houwert RM, et al. Time is of the essence when treating necrotizing soft tissue infections: a systematic review and meta-analysis. World J Emerg Surg. 2020;15:4. PMID:31921330. Surgery within 6 hours versus later: odds ratio 0.43 (95% CI 0.26-0.70); patient delay before presentation showed no significant effect.',
      ] },
    limitations: ['necrotizing-infection-presentation-and-progression-are-authored',
      'necrotizing-infection-controls-are-recognition-activation-and-intent-only',
      'necrotizing-infection-score-and-timing-evidence-are-weak-and-confounded'],
  },
  patient: {
    ageYears: 55, sex: 'male', heightCm: 178, weightKg: 94, asaClass: 3,
    diagnosis: 'Authored lower-limb infection not settling on oral therapy, with pain beyond the erythema',
    procedure: 'calm recognition, surgical activation, bounded antimicrobial intent, reassessment, and handoff practice',
    comorbidities: ['Type 2 diabetes; 36 hours of oral antibiotics for presumed cellulitis without improvement'],
    medications: ['Current oral course, any intravenous regimen, and all operative decisions remain qualified-team work'],
    allergies: ['No known drug allergies'], fasting: 'Not relevant to the infectious-disease fixture',
    baseline: { heartRateBpm: 104, meanArterialMmHg: 87, strokeVolumeMl: 72,
      hemoglobinGPerDl: 12.6, bloodVolumeMl: 5_600, coreTemperatureC: 37.4,
      arterialStiffness: 1, baroreflexGain: 0.7, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Alert and speaking in full sentences, distressed by limb pain in the supplied fixture' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 540, respiratoryRateBpm: 12,
      freshGasFlowLPerMin: 10, delivering: false } }, formulary: [],
  timeline: [
    { id: 'necrotizing-infection-presentation', type: 'narrative', target: 'necrotizing-infection', atTick: 0,
      severity: 'critical', message: 'A 55-year-old man with type 2 diabetes returns after 36 hours of oral antibiotics for a lower-limb infection that has not settled. He is alert and speaking normally, but the pain is severe and he reports it extending past the edge of the redness. Authored monitor state is sinus tachycardia 104/min, BP 118/72 mmHg (MAP 87), RR 22/min, SpO2 96% in air, and T 37.4 C. There is no crepitus and there are no bullae. There is no authored airway compromise, focal neurologic deficit, or hemorrhage.' },
    { id: 'necrotizing-infection-evidence', type: 'narrative', target: 'necrotizing-infection-evidence', atTick: 0,
      severity: 'warning', message: 'Supplied laboratory evidence is white cells 14.8 x10^9/L, C-reactive protein 132 mg/L, sodium 136 mmol/L, creatinine 118 µmol/L, glucose 11.4 mmol/L, haemoglobin 12.6 g/dL, and lactate 2.4 mmol/L. The derived laboratory risk score is 3, below its usual cutoff of 6. That score was derived against selected severe-cellulitis controls, and pooled validation puts its sensitivity at that cutoff near two-thirds, so roughly one confirmed case in three scores below it. It also counts late physiology, which early disease has not yet produced. A score below the cutoff therefore excludes nothing here. The absence of crepitus and bullae is likewise uninformative: those signs are roughly a quarter and a fifth sensitive and arrive late.' },
    { id: 'necrotizing-infection-boundary', type: 'narrative', target: 'necrotizing-infection-boundary', atTick: 0,
      severity: 'warning', message: 'Reconcile the disproportionate pain, the erythema border, and the failed oral course; recognize that the low score excludes nothing; mark and time the border so progression can be measured; request urgent surgical review for consideration of exploration with the concern stated explicitly; then review the score and timing evidence boundary. The learner may record only bounded qualified-team antimicrobial intent per local protocol, alongside and never instead of surgical review; no agent, dose, route, combination, incision, extent, theatre time, imaging order, or operative decision is exposed, and no procedure is performed. Exploration is the only test that can exclude this diagnosis, and it is a qualified-team act that happens after this rehearsal ends. Imaging is reasonably sensitive and still not exclusionary, and current guidance is explicit that it must never delay exploration. After elapsed simulated time, a strict fixed progression supplies the erythema 4 cm beyond its marked border, dusky skin, temperature 38.6 C, heart rate 126/min, BP 96/54 mmHg, white cells 22.1 x10^9/L, C-reactive protein 214 mg/L, sodium 131 mmol/L, lactate 4.6 mmol/L, and a derived score of 11. That progression is authored and occurs whatever the learner records, because only an operation treats this and the operation is not in this rehearsal; what the learner changes is whether the surgical team is already mobilized when it arrives. The score becoming firmly positive only then is the lesson, not a reward. The association between earlier surgery and survival is consistent across observational studies but confounded by indication in both directions, and no randomised evidence and no validated hour threshold exists. No individualized effect, treatment causality, diagnosis, organism, operative finding, eligibility, disposition, prognosis, or outcome is reported. Qualified teams retain the decision to explore, its timing and extent, antimicrobial selection and delivery, imaging, critical-care support, and all treatment decisions. After another elapsed interval, hand off the marked border and its rate, serial findings, the pending surgical decision, and outcome uncertainty. The controls do not take history; examine; acquire or interpret observations, laboratory, imaging, or another test; calculate a score; diagnose; select or deliver a drug, dose, route, fluid, or oxygen; perform or schedule a procedure; determine eligibility, disposition, or prognosis; or predict response, organism, survival, or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'necrotizing-infection-trajectory', objectiveId: 'reconcile-infectious-disease-necrotizing-pain-margin-and-failed-oral-treatment', question: 'Which findings, and which failed treatment, established the trajectory?' },
    { id: 'necrotizing-infection-recognition', objectiveId: 'recognize-infectious-disease-necrotizing-that-a-low-score-excludes-nothing', question: 'Why did a score of 3, absent crepitus, and absent bullae fail to lower the urgency?' },
    { id: 'necrotizing-infection-activation', objectiveId: 'activate-infectious-disease-necrotizing-surgical-review-and-marked-border-ownership', question: 'What did marking the border add, and why did surgical review not wait for imaging?' },
    { id: 'necrotizing-infection-boundaries', objectiveId: 'review-infectious-disease-necrotizing-score-sensitivity-and-timing-evidence-boundary', question: 'What did the score and the timing evidence each establish, and what did they leave open?' },
    { id: 'necrotizing-infection-reassessment', objectiveId: 'record-infectious-disease-necrotizing-bounded-antimicrobial-intent-and-strict-reassessment', question: 'What did the later assessment show, and why was the risen score not a success signal?' },
    { id: 'necrotizing-infection-handoff', objectiveId: 'handoff-infectious-disease-necrotizing-unconfirmed-diagnosis-and-active-risk', question: 'Which unconfirmed diagnosis, surgical, and outcome risks required handoff?' },
  ] },
};
