/** An inherited urgency, and a diagnosis that tonight's treatment can take away. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const INHERITED_URGENCY_AN_EMERGENCY_THAT_MOSTLY_IS_NOT_ONE: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'inherited-urgency-an-emergency-that-mostly-is-not-one', version: '0.1.0', maturity: 'preview',
    title: 'An emergency that mostly is not one', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 8, difficulty: 'intermediate', objectives: [
      { id: 'recognize-oncology-inherited-urgency-the-findings-that-grade-it', statement: 'Record the findings that would make this an emergency, present or absent.', measure: 'Significant laryngeal oedema with stridor, significant cerebral oedema with confusion or obtundation, and significant haemodynamic compromise were each recorded as looked for and absent rather than unmentioned, and grading the presentation by the swelling itself was refused.' },
      { id: 'record-oncology-inherited-urgency-the-tissue-decides', statement: 'Record that the tissue decides the treatment.', measure: 'That the causes of this picture are treated differently from one another, and that an accurate histological diagnosis before radiotherapy is what allows the causative malignancy to be treated optimally, were recorded as the reason diagnosis precedes emergent therapy in most cases.' },
      { id: 'activate-oncology-inherited-urgency-securing-the-pathway', statement: 'Secure the diagnostic pathway rather than waiting for it.', measure: 'Acute oncology was called, the biopsy was requested and prioritised with the imaging finding and the absent emergency findings and their timing, and sending him home to await the biopsy was refused.' },
      { id: 'recognize-oncology-inherited-urgency-the-cost-of-hurrying', statement: 'Refuse treatment before tissue on the sequence rather than on the treatment.', measure: 'Starting radiotherapy tonight ahead of the biopsy was refused with the refusal placed on the order of events, recording that treating first can leave the sample unable to say what this is while the same treatment may be correct once it can.' },
      { id: 'record-oncology-inherited-urgency-bounded-qualified-intent', statement: 'Record bounded qualified-team treatment intent.', measure: 'Radiotherapy and its timing, endovascular stenting, systemic therapy, steroid and anticoagulation decisions, and definitive treatment were recorded as the qualified team’s, and no drug, dose, route, product, fraction, threshold, or procedure was chosen or displayed.' },
      { id: 'review-oncology-inherited-urgency-boundaries-and-their-certainty', statement: 'Review the boundaries and read the proportion in both directions.', measure: 'That about 5 percent present with the life-threatening grade and that death is very rarely caused by the syndrome itself were recorded together with the fact that a proportion is not this patient’s risk and is not a reason to stop looking for the findings that override the default.' },
      { id: 'handoff-oncology-inherited-urgency-what-would-change-it', statement: 'Hand off what makes this not an emergency and what would make it one.', measure: 'The handoff preserved the supplied imaging finding, the three grading findings with the time they were last checked, that the tissue decides the treatment, the state of the biopsy booking, and what to call about overnight, with no diagnosis, treatment effect, or outcome certified.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0', sources: [
        'Straka C, Ying J, Kong FM, Willey CD, Kaminski J, Kim DWN. Review of evolving etiologies, implications and treatment strategies for the superior vena cava syndrome. SpringerPlus. 2016;5:229. "Although only 5 % of SVCS patients present with grade 4 disease, any of the aforementioned complications would be an indication for emergent venogram, stent placement, and thrombolytic therapy if indicated." "Death is very rarely caused by SVCS. In one series of 1986 patients with SVCS, only 1 death was reported." "accumulating evidence has suggested that accurate diagnosis and biopsy should precede emergent therapeutic intervention in most cases"; "obtaining an accurate histologic diagnosis prior to starting RT allows for optimum treatment of the causative malignancy"; and that the syndrome is a medical emergency if associated with laryngeal or cerebral oedema.',
        'Yu JB, Wilson LD, Detterbeck FC. Superior vena cava syndrome — a proposed classification system and algorithm for management. J Thorac Oncol. 2008;3(8):811-814. A grading scale proposed on the basis of symptom severity rather than derived from outcomes. Grade 4 denotes life-threatening disease due to significant cerebral oedema with confusion or obtundation, significant laryngeal oedema with stridor, or significant haemodynamic compromise.',
      ] },
    limitations: ['inherited-urgency-presentation-and-its-stability-are-authored',
      'inherited-urgency-controls-are-recording-and-escalation-only',
      'inherited-urgency-a-proportion-is-not-this-patient'],
  },
  patient: {
    ageYears: 61, sex: 'male', heightCm: 176, weightKg: 79, asaClass: 3,
    diagnosis: 'Authored superior vena caval obstruction from an undiagnosed thoracic mass, without life-threatening grading findings',
    procedure: 'grading, sequencing, diagnostic-pathway escalation, evidence-boundary review, and handoff practice',
    comorbidities: ['Former smoker; no cancer diagnosis and no tissue diagnosis in the supplied record'],
    medications: ['All radiotherapy, stenting, systemic therapy, steroid, and anticoagulation decisions remain qualified-team work'],
    allergies: ['No known drug allergies'], fasting: 'Not relevant to the acute oncology clinic fixture',
    baseline: { heartRateBpm: 88, meanArterialMmHg: 93, strokeVolumeMl: 68,
      hemoglobinGPerDl: 13.1, bloodVolumeMl: 5_200, coreTemperatureC: 36.8,
      arterialStiffness: 1.1, baroreflexGain: 0.9, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Facial and neck swelling with no stridor and no voice change in the supplied fixture' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 520, respiratoryRateBpm: 12,
      freshGasFlowLPerMin: 10, delivering: false } }, formulary: [],
  timeline: [
    { id: 'inherited-urgency-presentation', type: 'narrative', target: 'inherited-urgency', atTick: 0,
      severity: 'warning', message: 'A 61-year-old man is in the acute oncology clinic with two weeks of facial and neck swelling, worse when he wakes, with filled neck veins and dilated veins across his chest wall. He is breathless walking upstairs and not at rest. A computed tomogram taken four hours ago reports a right upper-lobe mass compressing the superior vena cava with collateral filling. He has no cancer diagnosis and there is no tissue diagnosis. Authored observations are heart rate 88/min, blood pressure 128/76 mmHg, respiratory rate 18/min, oxygen saturation 96% in air, temperature 36.8 C, no stridor, and fully alert. The biopsy list is tomorrow morning.' },
    { id: 'inherited-urgency-evidence', type: 'narrative', target: 'inherited-urgency-evidence', atTick: 0,
      severity: 'warning', message: 'This presentation is taught as an oncological emergency, and for a minority it is one. Only about 5 percent present with the life-threatening grade, which is defined by significant cerebral oedema, significant laryngeal oedema, or significant haemodynamic compromise, and any of those is an indication for emergent intervention. Death is very rarely caused by the syndrome itself: one series of 1,986 patients reported one death. Meanwhile accumulating evidence supports accurate diagnosis and biopsy preceding emergent therapeutic intervention in most cases, because an accurate histological diagnosis before radiotherapy is what allows the causative malignancy to be treated optimally. The urgency in the room tonight is largely inherited, and the cost of acting on it is not paid tonight. It is paid by the next decision, which needs a diagnosis that tonight’s treatment can take away.' },
    { id: 'inherited-urgency-boundary', type: 'narrative', target: 'inherited-urgency-boundary', atTick: 0,
      severity: 'warning', message: 'Record the findings that would make this the grade that cannot wait, and whether each is present; record that the tissue decides the treatment; secure the diagnostic pathway with acute oncology; record bounded qualified-team treatment intent; and review the boundaries and their certainty in both directions. Starting radiotherapy tonight ahead of the biopsy, treating the swelling itself as what grades this, sending him home to await the biopsy, and giving a diuretic for the distended veins are all refused. No drug, dose, route, product, fluid, investigation, or procedure is exposed, the learner acquires and interprets no test, and every result is supplied. After elapsed simulated time a treatment slot is offered for tonight while the patient is unchanged, because what arrives is an offer rather than a deterioration and the two are easy to confuse. Acute oncology answers only if it was called, accepts him, books and flags the biopsy for the morning, tells the ward which findings to call about, takes ownership of radiotherapy and its timing, stenting, systemic therapy, steroid and anticoagulation decisions, and states that the histology determines which of those he gets. No diagnosis, individualized risk, treatment causality, eligibility, disposition, prognosis, or outcome is reported, and the rehearsal ends whatever his trajectory. After another elapsed interval, hand off the imaging finding, the grading findings and when they were last checked, the state of the biopsy booking, and what to call about overnight. The controls do not take history; examine; acquire or interpret imaging, a biopsy, or another test; diagnose; select or deliver a drug, dose, route, product, fluid, oxygen, radiotherapy, or device; perform stenting or another procedure; determine eligibility, disposition, or prognosis; or predict response, survival, or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'inherited-urgency-findings', objectiveId: 'recognize-oncology-inherited-urgency-the-findings-that-grade-it', question: 'What would have made this the emergency it is taught as, and was it there?' },
    { id: 'inherited-urgency-tissue', objectiveId: 'record-oncology-inherited-urgency-the-tissue-decides', question: 'What is the biopsy delaying, and what is it deciding?' },
    { id: 'inherited-urgency-pathway', objectiveId: 'activate-oncology-inherited-urgency-securing-the-pathway', question: 'You chose not to treat tonight. What did you do instead?' },
    { id: 'inherited-urgency-sequence', objectiveId: 'recognize-oncology-inherited-urgency-the-cost-of-hurrying', question: 'Somebody offered you a treatment slot. Who pays for taking it, and when?' },
    { id: 'inherited-urgency-intent', objectiveId: 'record-oncology-inherited-urgency-bounded-qualified-intent', question: 'Where does your part of this stop, and what did you hand over?' },
    { id: 'inherited-urgency-boundaries', objectiveId: 'review-oncology-inherited-urgency-boundaries-and-their-certainty', question: 'Five percent of patients present with the grade that cannot wait. What are the two wrong things to do with that number?' },
    { id: 'inherited-urgency-handoff', objectiveId: 'handoff-oncology-inherited-urgency-what-would-change-it', question: 'What had to travel so the night team knew what to call about?' },
  ] },
};
