/** A completed immunotherapy exposure that no list still carries, and the event it explains. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const DELAYED_IMMUNE_EVENT_A_DRUG_THAT_STOPPED_MONTHS_AGO: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'delayed-immune-event-a-drug-that-stopped-months-ago', version: '0.1.0', maturity: 'preview',
    title: 'A delayed immune event: a drug that stopped months ago', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 9, difficulty: 'intermediate', objectives: [
      { id: 'record-oncology-delayed-immune-event-an-exposure-that-ended', statement: 'Record a completed exposure as current history.', measure: 'Four cycles of an anti-PD-1 checkpoint inhibitor with the last dose 22 weeks ago were recorded as current history, together with the fact that the drug is absent from the current medication list and from the referral letter because it stopped, without learner examination, sampling, or diagnosis.' },
      { id: 'recognize-oncology-delayed-immune-event-an-interval-is-not-a-defence', statement: 'Recognize that the interval since the last dose does not exclude the drug.', measure: 'Excluding immunotherapy on the strength of 22 elapsed weeks was refused, and the record stated that immune-related events can begin during treatment or after it has ceased, including beyond six to twelve months, with a median off-treatment interval of six months in the collected series.' },
      { id: 'record-oncology-delayed-immune-event-infection-alongside-not-ahead', statement: 'Record infection evaluation as running alongside rather than ahead.', measure: 'Stool infectious analysis including Clostridioides difficile, and cytomegalovirus where suspicion warrants, were recorded as concurrent with rather than prior to escalation and qualified treatment, and waiting for those results before telling anyone was refused.' },
      { id: 'activate-oncology-delayed-immune-event-the-service-that-gave-the-drug', statement: 'Return the problem to the service holding the treatment record.', measure: 'The treating oncology service was contacted with the exposure, the three-week course, and the absence of an established alternative cause stated together, and slowing the gut with review tomorrow and discharge with oral fluids were each refused.' },
      { id: 'record-oncology-delayed-immune-event-bounded-qualified-intent', statement: 'Record bounded qualified-team treatment intent without selecting treatment.', measure: 'Grading, corticosteroid consideration, and further investigation including endoscopy were recorded as the qualified team’s decisions, and no drug, dose, route, threshold, or eligibility was chosen or displayed.' },
      { id: 'review-oncology-delayed-immune-event-boundaries-and-their-certainty', statement: 'Review the boundaries and their certainty.', measure: 'That the delayed-event series collected 23 cases with a median off-treatment interval of six months and a median of four doses and reports no incidence, that its own argument is diagnostic rather than epidemiological, and that the pharmacovigilance colitis fatality figures describe an anti-CTLA-4 spectrum rather than this anti-PD-1 case, were all kept explicit.' },
      { id: 'handoff-oncology-delayed-immune-event-an-exposure-that-travels', statement: 'Hand off an exposure that must travel with the patient.', measure: 'The handoff preserved the completed exposure with its interval, the symptom course against the patient’s own baseline, the concurrent infection evaluation, the contact with the treating service, and the bounded treatment intent, with no diagnosis, grade, or outcome certified.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0', sources: [
        'Couey MA, Bell RB, Patel AA, et al. Delayed immune-related events (DIRE) after discontinuation of immunotherapy: diagnostic hazard of autoimmunity at a distance. J Immunother Cancer. 2019;7(1):165. DIRE defined as new immune-related adverse events manifesting 90 days or more after discontinuation; 23 qualifying cases; median off-treatment interval to DIRE 6 months (range 3 to 28); median cumulative exposure 4 doses (range 3 to 42); misattribution can lead to unnecessary or harmful interventions.',
        'Brahmer JR, Abu-Sbeih H, Ascierto PA, et al. Society for Immunotherapy of Cancer (SITC) clinical practice guideline on immune checkpoint inhibitor-related adverse events. J Immunother Cancer. 2021;9(6):e002435. Immune-related adverse events can occur at any point during or after cessation of treatment, beyond 6 to 12 months. Diagnostic evaluation should attempt to rule out other etiologies, such as diarrhea or colitis associated with Clostridium difficile infection, but treatment for immune-related adverse events should be initiated as is deemed clinically appropriate. Additional workup at grade 2 or above includes stool infectious analysis with C. difficile and cytomegalovirus testing by polymerase chain reaction.',
        'Wang DY, Salem JE, Cohen JV, et al. Fatal Toxic Effects Associated With Immune Checkpoint Inhibitors: A Systematic Review and Meta-analysis. JAMA Oncol. 2018;4(12):1721-1728. Of 193 reported anti-CTLA-4 deaths, 135 (70%) were usually from colitis; colitis itself carried reported fatalities of only 2% to 5%; anti-PD-1/PD-L1 fatalities were more often pneumonitis, hepatitis, and neurotoxic effects.',
      ] },
    limitations: ['delayed-immune-event-presentation-and-service-response-are-authored',
      'delayed-immune-event-controls-are-recording-and-escalation-only',
      'delayed-immune-event-series-figures-are-not-an-incidence'],
  },
  patient: {
    ageYears: 63, sex: 'male', heightCm: 176, weightKg: 79, asaClass: 3,
    diagnosis: 'Authored delayed immune-related gastrointestinal event after completed adjuvant checkpoint-inhibitor therapy',
    procedure: 'calm exposure recording, evidence-boundary review, escalation to the treating service, and handoff practice',
    comorbidities: ['Resected stage III melanoma in surveillance; four cycles of adjuvant anti-PD-1 therapy completed 22 weeks ago'],
    medications: ['All prescribing, investigation, grading, and treatment decisions remain qualified-team work'],
    allergies: ['No known drug allergies'], fasting: 'Not relevant to the clinic fixture',
    baseline: { heartRateBpm: 104, meanArterialMmHg: 78, strokeVolumeMl: 64,
      hemoglobinGPerDl: 12.8, bloodVolumeMl: 5_100, coreTemperatureC: 36.8,
      arterialStiffness: 1.1, baroreflexGain: 0.8, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Alert, orientated, and speaking in full sentences in the supplied fixture' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 500, respiratoryRateBpm: 12,
      freshGasFlowLPerMin: 10, delivering: false } }, formulary: [],
  timeline: [
    { id: 'delayed-immune-event-presentation', type: 'narrative', target: 'delayed-immune-event', atTick: 0,
      severity: 'warning', message: 'A 63-year-old man is seen with three weeks of increasing diarrhoea, now seven stools a day above his own baseline, with cramping lower abdominal pain and no reported blood. Authored observations are heart rate 104/min, blood pressure 106/64 mmHg, respiratory rate 18/min, oxygen saturation 98% in air, temperature 36.8 C, and alert. He completed four cycles of adjuvant anti-PD-1 immunotherapy for a resected melanoma; the last dose was 22 weeks ago. The referral letter says infectious gastroenteritis and does not mention the immunotherapy, and neither does the current medication list, because the drug stopped.' },
    { id: 'delayed-immune-event-evidence', type: 'narrative', target: 'delayed-immune-event-evidence', atTick: 0,
      severity: 'warning', message: 'Immune-related adverse events can occur at any point during treatment or after it has ceased, including beyond six to twelve months. The series that named delayed immune-related events defined them as beginning 90 days or more after discontinuation, collected 23 cases, and found a median off-treatment interval of six months after a median cumulative exposure of four doses. That series reports no incidence and cannot say how likely this is in this patient; its argument is a diagnostic one, that misattribution leads to unnecessary or harmful interventions. Published guidance runs the infectious evaluation alongside rather than ahead: other causes should be sought while treatment for an immune-related event is initiated as clinically appropriate. Nothing about this presentation is dramatic, and nothing about the elapsed interval makes the drug less relevant.' },
    { id: 'delayed-immune-event-boundary', type: 'narrative', target: 'delayed-immune-event-boundary', atTick: 0,
      severity: 'warning', message: 'Record the completed exposure as current history rather than past history; record the symptom course against this patient’s own baseline with its duration; record infection evaluation as running alongside rather than ahead; contact the service that gave the drug; record bounded qualified-team treatment intent without selecting treatment; and review the boundaries and their certainty. Excluding the drug because it stopped months ago, slowing the gut and reviewing tomorrow, waiting for stool results before telling anyone, and discharging with oral fluids are all refused. No drug, dose, route, fluid, investigation, or procedure is exposed, and the learner performs no examination and orders no test. After elapsed simulated time an eighth stool is counted with the observations barely moved. The treating service answers only if it was contacted, confirms the four cycles and the 22-week interval from its own records, takes ownership of grading, investigation, and treatment, and records that the interval does not exclude an immune-related cause. The observations deliberately stay unremarkable, because a deteriorating patient would turn this into an ordinary sepsis drill rather than a lesson about an exposure nobody is reading. No individualized effect, treatment causality, grade, eligibility, disposition, prognosis, or outcome is reported. Qualified teams retain grading, investigation, prescribing, and every treatment decision. After another elapsed interval, hand off the exposure, the course, the concurrent infection evaluation, the contact made, the bounded intent, disposition, and outcome uncertainty. The controls do not take history; examine; acquire or interpret observations, laboratory, endoscopic, imaging, or another test; diagnose; grade; select or deliver a drug, dose, route, fluid, oxygen, or device; perform a procedure; determine eligibility, disposition, or prognosis; or predict response, survival, or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'delayed-immune-event-exposure', objectiveId: 'record-oncology-delayed-immune-event-an-exposure-that-ended', question: 'Which part of this history had already fallen off every list you read first?' },
    { id: 'delayed-immune-event-interval', objectiveId: 'recognize-oncology-delayed-immune-event-an-interval-is-not-a-defence', question: 'What does 22 weeks since the last dose actually let you rule out?' },
    { id: 'delayed-immune-event-infection', objectiveId: 'record-oncology-delayed-immune-event-infection-alongside-not-ahead', question: 'What would a negative stool result have changed, and what would a positive one not have excluded?' },
    { id: 'delayed-immune-event-activation', objectiveId: 'activate-oncology-delayed-immune-event-the-service-that-gave-the-drug', question: 'Who needed to be told, and what were you asking them for?' },
    { id: 'delayed-immune-event-intent', objectiveId: 'record-oncology-delayed-immune-event-bounded-qualified-intent', question: 'Where does your part of this decision stop?' },
    { id: 'delayed-immune-event-boundaries', objectiveId: 'review-oncology-delayed-immune-event-boundaries-and-their-certainty', question: 'What can 23 collected cases tell you, and what can they not?' },
    { id: 'delayed-immune-event-handoff', objectiveId: 'handoff-oncology-delayed-immune-event-an-exposure-that-travels', question: 'What travelled with the patient, and what stayed open?' },
  ] },
};
