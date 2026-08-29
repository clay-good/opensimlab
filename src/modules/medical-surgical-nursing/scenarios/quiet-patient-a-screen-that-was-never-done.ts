/** Three shifts of "resting comfortably", and not one screening result. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const QUIET_PATIENT_A_SCREEN_THAT_WAS_NEVER_DONE: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'quiet-patient-a-screen-that-was-never-done', version: '0.1.0', maturity: 'preview',
    title: 'A screen that was never done', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 7, difficulty: 'intermediate', objectives: [
      { id: 'reconcile-medical-surgical-nursing-quiet-patient-impressions-are-not-results', statement: 'Distinguish an impression from a screening result.', measure: 'Three consecutive shift entries reading as impressions were reviewed and recognised as containing no screening result of any kind, so that the record holds no negative screen rather than a reassuring one, without learner diagnosis or treatment selection.' },
      { id: 'recognize-medical-surgical-nursing-quiet-patient-the-screen-is-what-changed', statement: 'Recognize that performing the screen is what changed.', measure: 'A screen performed rather than deferred returned rousable but slow, unable to give the months backwards, inattentive within seconds, and a family report of change, while nothing about the patient altered in that minute.' },
      { id: 'record-medical-surgical-nursing-quiet-patient-a-result-recorded-as-a-result', statement: 'Record the result as a screening result.', measure: 'The tool, the time, and the positive components were recorded alongside the earlier impressions rather than replacing them, because those impressions are themselves the evidence of how the absence was produced.' },
      { id: 'activate-medical-surgical-nursing-quiet-patient-escalation-on-a-positive-screen', statement: 'Escalate on a positive screen, not on a worry.', measure: 'Review was requested on a screening result with its components and the prior impressions supplied, and deferring the screen, reading quiet as settled, relying on a non-existent earlier negative, and attributing it to low mood were each refused.' },
      { id: 'review-medical-surgical-nursing-quiet-patient-boundaries-and-their-certainty', statement: 'Review the boundaries and their certainty.', measure: 'That the hypoactive subtype is about half of cases and the most missed, that routine-use sensitivity was 76 percent for the 4AT and 40 percent for the CAM so a negative result is weak evidence of absence, and that impaired arousal is scoreable rather than a reason to defer were all kept explicit.' },
      { id: 'handoff-medical-surgical-nursing-quiet-patient-a-record-with-a-specific-gap', statement: 'Hand off a record with a specific gap.', measure: 'The handoff preserved the three impressions as written, the screen and its positive components, the repeat schedule, and that the preceding shifts contain no screening result, with cause and outcome left uncertified.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0', sources: [
        'Shenkin SD, Fox C, Godfrey M, et al. Delirium detection in older acute medical inpatients: a multicentre prospective comparative diagnostic test accuracy study of the 4AT and the confusion assessment method. BMC Med. 2019;17:138. doi:10.1186/s12916-019-1367-9. 4AT sensitivity 76% (95% CI 61-87) and specificity 94% (92-97); CAM sensitivity 40% (26-57) and specificity 100% (98-100) under routine conditions.',
        'Krewulak KD, Stelfox HT, Leigh JP, et al. Scoping review of delirium motor subtype prevalence. Hypoactive delirium 50.3% (95% CI 46.0-54.7), mixed 27.7%, hyperactive 22.7%.',
        'Peritogiannis V, Bolosi M, Lixouriotis C, Rizos DV. Recent Insights on Prevalence and Corelations of Hypoactive Delirium. Behav Neurol. 2015;2015:416792. Hypoactive delirium is substantially under-recognised and is frequently misread as depression or fatigue.',
      ] },
    limitations: ['quiet-patient-presentation-and-screen-result-are-authored',
      'quiet-patient-controls-are-screening-and-escalation-only',
      'quiet-patient-a-positive-screen-is-not-a-diagnosis'],
  },
  patient: {
    ageYears: 79, sex: 'male', heightCm: 170, weightKg: 68, asaClass: 3,
    diagnosis: 'Authored hypoactive delirium concealed by three shifts of charted impressions and no screening result',
    procedure: 'calm chart reading, screening, result recording, escalation, and handoff practice',
    comorbidities: ['Hypertension; day 2 after fixation of a fractured neck of femur'],
    medications: ['All prescribing, investigation, and treatment decisions remain qualified-team work'],
    allergies: ['No known drug allergies'], fasting: 'Not relevant to the nursing fixture',
    baseline: { heartRateBpm: 82, meanArterialMmHg: 91, strokeVolumeMl: 64,
      hemoglobinGPerDl: 10.4, bloodVolumeMl: 4_600, coreTemperatureC: 36.8,
      arterialStiffness: 1.3, baroreflexGain: 0.6, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Rousable and protecting the airway in the supplied fixture' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 440, respiratoryRateBpm: 12,
      freshGasFlowLPerMin: 10, delivering: false } }, formulary: [],
  timeline: [
    { id: 'quiet-patient-presentation', type: 'narrative', target: 'quiet-patient', atTick: 0,
      severity: 'warning', message: 'A 79-year-old is two days after fixation of a fractured neck of femur. Authored observations are pulse 82/min, blood pressure 126/74 mmHg, respiratory rate 16/min, oxygen saturation 96% in air, temperature 36.8 C, all unremarkable. The last three shift entries read: "Resting comfortably. No concerns." "Settled overnight. Slept well." "Quiet. Declined breakfast." He has been sleeping through meals and is slow to answer. His family say this is not how he was at home a week ago.' },
    { id: 'quiet-patient-evidence', type: 'narrative', target: 'quiet-patient-evidence', atTick: 0,
      severity: 'warning', message: 'Every one of those three entries is an impression, and none is a screening result. The record therefore contains no negative screen; it contains no screen. Absence of a positive finding and a negative finding are different things, and only the first is present here. The hypoactive subtype is the most prevalent, at roughly half of cases in reported series, and the most frequently missed, because it does not ask for attention and is regularly read as depression or fatigue. Screening accuracy depends heavily on conditions: in a multicentre study under routine use the 4AT reached 76% sensitivity and the CAM 40%, so a negative result from either is weak evidence of absence. Impaired arousal is itself a scoreable component, so a drowsy patient is one who can be screened rather than one who must be left.' },
    { id: 'quiet-patient-boundary', type: 'narrative', target: 'quiet-patient-boundary', atTick: 0,
      severity: 'warning', message: 'Review the charted impressions and say what kind of evidence they are; perform the screen rather than defer it; record the result as a screening result, naming the tool, the time, and the positive components, and leave the earlier impressions exactly as another clinician wrote them, because they are the evidence of how the absence was produced; request review on the screening result rather than on a worry about how he seems, supplying the prior impressions so the reviewer knows there is no earlier screen to compare against; review the boundaries and their certainty; and schedule repeat screening at defined intervals, because delirium fluctuates and a single result is a point rather than a line. Deferring the screen because he is asleep, reading quiet as settled, relying on an earlier negative screen that does not exist in this record, and attributing the presentation to low mood are all refused. Recording a result or escalating before any screen has been performed is refused as premature, because there is nothing to record and escalating on an impression is the pattern this lesson is about. No drug, dose, route, fluid, investigation, or procedure is exposed, and the learner performs no examination beyond the screening instrument and orders no test. The observations are unremarkable throughout and stay unremarkable, which is why three shifts of charts look complete. If review is requested, the qualified team performs its own assessment, reaches the same conclusion, and records that the preceding shifts contain no screening result of any kind. A positive screen is a screening result and not a diagnosis; what is causing it is the review team’s question, and delirium screens do not distinguish cause. No individualized effect, treatment causality, cause, eligibility, disposition, prognosis, or outcome is reported. Qualified teams retain assessment, investigation, prescribing, and every treatment decision. After another elapsed interval, hand off the impressions as written, the screen and its components, the repeat schedule, disposition, and outcome uncertainty. The controls do not take history; examine beyond the screening instrument; acquire or interpret laboratory, imaging, or another test; diagnose; select or deliver a drug, dose, route, fluid, oxygen, or device; perform a procedure; determine eligibility, disposition, or prognosis; or predict response, cause, survival, or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'quiet-patient-trajectory', objectiveId: 'reconcile-medical-surgical-nursing-quiet-patient-impressions-are-not-results', question: 'What does the record actually contain, and what does it not?' },
    { id: 'quiet-patient-recognition', objectiveId: 'recognize-medical-surgical-nursing-quiet-patient-the-screen-is-what-changed', question: 'What changed between the third shift and your assessment?' },
    { id: 'quiet-patient-record', objectiveId: 'record-medical-surgical-nursing-quiet-patient-a-result-recorded-as-a-result', question: 'Why are the earlier impressions left exactly as written?' },
    { id: 'quiet-patient-activation', objectiveId: 'activate-medical-surgical-nursing-quiet-patient-escalation-on-a-positive-screen', question: 'What is the difference between escalating on a result and on a worry?' },
    { id: 'quiet-patient-boundaries', objectiveId: 'review-medical-surgical-nursing-quiet-patient-boundaries-and-their-certainty', question: 'What would a negative screen have licensed you to conclude?' },
    { id: 'quiet-patient-handoff', objectiveId: 'handoff-medical-surgical-nursing-quiet-patient-a-record-with-a-specific-gap', question: 'What travelled with the patient, and what gap was named?' },
  ] },
};
