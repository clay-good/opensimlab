/** A count that is part of the emergency, and an intervention that moves it without helping. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const LOWERING_THE_COUNT_A_NUMBER_THAT_CAN_BE_MOVED: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'lowering-the-count-a-number-that-can-be-moved', version: '0.1.0', maturity: 'preview',
    title: 'A number that can be moved', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 8, difficulty: 'intermediate', objectives: [
      { id: 'recognize-oncology-lowering-the-count-a-clinical-designation', statement: 'Record the clinical picture rather than the count alone.', measure: 'The white cell count of 240 with blasts on the supplied film was recorded together with the breathlessness at rest and the confusion, as the findings that make this leukostasis rather than a high count, and making the diagnosis on the count alone was refused.' },
      { id: 'record-oncology-lowering-the-count-urgency-without-a-manoeuvre', statement: 'Record what the count licenses and what it does not.', measure: 'That up to 20 percent of acute myeloid leukaemia presents with a count above 100, that early mortality is high and emergent cytoreduction is indicated, and that the optimal strategy is unknown with no standardised guidelines found by a systematic review, were recorded as licensing urgency without selecting a manoeuvre.' },
      { id: 'activate-oncology-lowering-the-count-the-shortest-path', statement: 'Call haematology immediately, without waiting for confirmation.', measure: 'Haematology was called with the count, the pulmonary and neurological findings and their timing, and waiting for the marrow before calling was refused because the call is the shortest path to treatment of the underlying disease.' },
      { id: 'recognize-oncology-lowering-the-count-moving-a-number-is-not-helping', statement: 'Refuse an intervention that lowers the number as proof of benefit.', measure: 'Sending him for apheresis and treating the problem as solved was refused, with the meta-analytic risk ratio of 0.88 (95% CI 0.69 to 1.13) across 13 retrospective studies and 1,743 patients recorded, and the refusal placed on the standing down rather than on the route.' },
      { id: 'record-oncology-lowering-the-count-bounded-qualified-intent', statement: 'Record bounded qualified-team cytoreduction intent.', measure: 'The cytoreduction strategy and its route, transfusion decisions, tumour-lysis prophylaxis, supportive care, and definitive treatment were recorded as the qualified team’s, and no drug, dose, route, product, threshold, or procedure was chosen or displayed.' },
      { id: 'review-oncology-lowering-the-count-boundaries-and-their-certainty', statement: 'Review the boundaries and their certainty in both directions.', measure: 'That the confidence interval includes benefit as well as harm, that the underlying studies are retrospective, and that their own data show confounding by indication — patients with clinical leukostasis were more likely to receive leukapheresis at an odds ratio of about 2 — were all kept explicit, and absence of demonstrated benefit was not recorded as demonstrated uselessness.' },
      { id: 'handoff-oncology-lowering-the-count-what-makes-it-an-emergency', statement: 'Hand off the findings that make it an emergency.', measure: 'The handoff preserved the count with the pulmonary and neurological findings and their timing, any deterioration during the rehearsal, that urgency is licensed and no manoeuvre is, and the bounded intent, with no diagnosis, treatment effect, or outcome certified.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0', sources: [
        'Bewersdorf JP, Giri S, Tallman MS, Zeidan AM, Stahl M. Leukapheresis for the management of hyperleukocytosis in acute myeloid leukemia — a systematic review and meta-analysis. Transfusion. 2020;60(10):2360-2369. Up to 20% of patients with acute myeloid leukemia present with hyperleukocytosis, usually defined as a white blood cell count greater than 100 x 10^9/L; given the high early mortality rate, emergent cytoreduction is indicated but the optimal strategy is unknown. Across 13 two-arm retrospective studies with 1743 patients (486 leukapheresis, 1257 not), leukapheresis did not improve early mortality (risk ratio 0.88, 95% CI 0.69-1.13, P=.321). Patients presenting with clinical leukostasis tended to be more likely to undergo leukapheresis (odds ratio 2.01, 95% CI 0.99-4.08, P=.052). The authors argue against routine use.',
        'Duminuco A, Del Fabro V, De Luca P, Leotta D. Emergencies in Hematology: Why, When and How I Treat? J Clin Med. 2024;13(24):7572. A narrative review. Clinical choices in hyperleukocytosis are crucial within the first hours, and a recent systematic review found no evidence of standardised guidelines for managing it. Pulmonary and neurological signs are the manifestations most strongly linked to early mortality.',
      ] },
    limitations: ['lowering-the-count-presentation-and-deterioration-are-authored',
      'lowering-the-count-controls-are-recording-and-escalation-only',
      'lowering-the-count-absence-of-benefit-is-not-proof-of-uselessness'],
  },
  patient: {
    ageYears: 47, sex: 'male', heightCm: 179, weightKg: 83, asaClass: 4,
    diagnosis: 'Authored clinical leukostasis in newly presenting acute myeloid leukaemia with hyperleukocytosis',
    procedure: 'urgent recognition, immediate escalation, evidence-boundary review, and handoff practice',
    comorbidities: ['Previously well; blasts on the supplied film with a white cell count of 240 x 10^9/L'],
    medications: ['All cytoreduction, transfusion, prophylaxis, and definitive treatment decisions remain qualified-team work'],
    allergies: ['No known drug allergies'], fasting: 'Not relevant to the emergency-department fixture',
    baseline: { heartRateBpm: 108, meanArterialMmHg: 77, strokeVolumeMl: 58,
      hemoglobinGPerDl: 8.4, bloodVolumeMl: 5_400, coreTemperatureC: 37.4,
      arterialStiffness: 1.1, baroreflexGain: 0.7, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Confused but protecting his airway and speaking in short sentences in the supplied fixture' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 530, respiratoryRateBpm: 12,
      freshGasFlowLPerMin: 10, delivering: false } }, formulary: [],
  timeline: [
    { id: 'lowering-the-count-presentation', type: 'narrative', target: 'lowering-the-count', atTick: 0,
      severity: 'warning', message: 'A previously well 47-year-old man is in the emergency department. The supplied film taken an hour ago shows blasts with a white cell count of 240 x 10^9/L. He is breathless at rest and confused. Authored observations are heart rate 108/min, blood pressure 108/62 mmHg, respiratory rate 26/min, oxygen saturation 92% in air, and temperature 37.4 C. There is no marrow result. The haematology registrar is elsewhere in the hospital.' },
    { id: 'lowering-the-count-evidence', type: 'narrative', target: 'lowering-the-count-evidence', atTick: 0,
      severity: 'warning', message: 'The count is genuinely part of this emergency, which is what makes the trap the opposite of the usual one. Up to 20 percent of acute myeloid leukaemia presents with a count above 100, early mortality is high, and emergent cytoreduction is indicated — but the optimal strategy is unknown, and a systematic review found no standardised guidelines. Meanwhile the intervention that most visibly lowers the count has not been shown to lower early mortality: across 13 retrospective studies of 1,743 patients, the risk ratio for early death with leukapheresis was 0.88 with a confidence interval from 0.69 to 1.13, and its authors argue against routine use. That interval includes benefit as well as harm, and the studies behind it show their own confounding, since patients with clinical leukostasis were about twice as likely to receive it. Watching a number fall is the most convincing feedback available in this room, and it is not evidence that anything has been achieved.' },
    { id: 'lowering-the-count-boundary', type: 'narrative', target: 'lowering-the-count-boundary', atTick: 0,
      severity: 'warning', message: 'Record the clinical picture rather than the count alone, naming the breathlessness and the confusion as what make this leukostasis; record what the count licenses and what it does not; call haematology immediately; record bounded qualified-team cytoreduction intent; and review the boundaries and their certainty in both directions. Sending him for apheresis and standing down, making the diagnosis on the count alone, waiting for the marrow before calling, and treating the confusion as delirium are all refused. No drug, dose, route, product, fluid, investigation, or procedure is exposed, the learner acquires and interprets no test, and every result is supplied. After elapsed simulated time he becomes more breathless and harder to rouse while the supplied count is unchanged, because it is the same sample: what deteriorates is the patient, in the two findings that were already abnormal. Haematology answers only if it was called, accepts clinical leukostasis as the working problem, takes ownership of the cytoreduction strategy, transfusion, tumour-lysis prophylaxis and definitive treatment, and states that what changes his outcome is treating the leukaemia rather than any single manoeuvre on the count. No diagnosis, individualized risk, treatment causality, eligibility, disposition, prognosis, or outcome is reported, and the rehearsal ends whatever his trajectory. After another elapsed interval, hand off the count with the findings that make it an emergency, their timing, any deterioration, and the bounded intent. The controls do not take history; examine; acquire or interpret a film, marrow, imaging, or another test; diagnose; select or deliver a drug, dose, route, product, fluid, oxygen, or device; perform apheresis or another procedure; determine eligibility, disposition, or prognosis; or predict response, survival, or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'lowering-the-count-picture', objectiveId: 'recognize-oncology-lowering-the-count-a-clinical-designation', question: 'What makes this leukostasis rather than a high white cell count?' },
    { id: 'lowering-the-count-licence', objectiveId: 'record-oncology-lowering-the-count-urgency-without-a-manoeuvre', question: 'The count tells you to hurry. What does it not tell you?' },
    { id: 'lowering-the-count-activation', objectiveId: 'activate-oncology-lowering-the-count-the-shortest-path', question: 'What would the marrow result have changed about the next hour?' },
    { id: 'lowering-the-count-apheresis', objectiveId: 'recognize-oncology-lowering-the-count-moving-a-number-is-not-helping', question: 'You can watch the count fall. What does that prove?' },
    { id: 'lowering-the-count-intent', objectiveId: 'record-oncology-lowering-the-count-bounded-qualified-intent', question: 'Where does your part of this stop, and what did you hand over?' },
    { id: 'lowering-the-count-boundaries', objectiveId: 'review-oncology-lowering-the-count-boundaries-and-their-certainty', question: 'The confidence interval crosses one. What are the two wrong conclusions to draw from that?' },
    { id: 'lowering-the-count-handoff', objectiveId: 'handoff-oncology-lowering-the-count-what-makes-it-an-emergency', question: 'What had to travel so the next team treated a patient rather than a number?' },
  ] },
};
