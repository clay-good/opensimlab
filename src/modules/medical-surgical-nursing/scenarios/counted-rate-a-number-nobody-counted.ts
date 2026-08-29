/** Six charted respiratory rates, two distinct values, and nobody counted. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const COUNTED_RATE_A_NUMBER_NOBODY_COUNTED: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'counted-rate-a-number-nobody-counted', version: '0.1.0', maturity: 'preview',
    title: 'A number nobody counted', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 7, difficulty: 'intermediate', objectives: [
      { id: 'reconcile-medical-surgical-nursing-counted-rate-a-trend-read-as-a-distribution', statement: 'Read the trend as a distribution, not a trajectory.', measure: 'Six charted respiratory rates of 18, 18, 20, 18, 18, 20 across three shifts were recognised as six values drawn from a set of two, which is the documented signature of estimation rather than measurement, without learner examination or diagnosis.' },
      { id: 'recognize-medical-surgical-nursing-counted-rate-the-measurement-is-the-finding', statement: 'Recognize that counting is what changed.', measure: 'A rate counted for a full sixty seconds returned 28 while nothing about the patient changed, establishing that the difference between the two numbers is the difference between counting and estimating rather than a change in condition.' },
      { id: 'record-medical-surgical-nursing-counted-rate-a-discrepancy-left-unreconciled', statement: 'Record the discrepancy without resolving it.', measure: 'Both numbers were recorded side by side with the earlier entries left exactly as another clinician wrote them, and amending them, anchoring to the previous entry, and charting a monitor-derived value as a counted one were each refused.' },
      { id: 'activate-medical-surgical-nursing-counted-rate-escalation-on-the-counted-value', statement: 'Escalate on the counted value, with the chart alongside it.', measure: 'Review was requested on the counted rate stated as counted for a full minute, with the charted column given unaltered so the reviewer knows the record does not show it, and escalating before anything had been counted was refused as premature.' },
      { id: 'review-medical-surgical-nursing-counted-rate-boundaries-and-their-certainty', statement: 'Review the boundaries and their certainty.', measure: 'That respiratory rate is the strongest routine predictor of in-hospital cardiac arrest and also the least reliably recorded, that a rising rate precedes desaturation so a normal saturation does not make it redundant, and that monitor-derived equivalence is not established in retrievable evidence were all kept explicit.' },
      { id: 'handoff-medical-surgical-nursing-counted-rate-a-record-that-disagrees-with-itself', statement: 'Hand off a record that disagrees with itself.', measure: 'The handoff preserved the charted column as written, the counted rate, the unreconciled discrepancy, and that escalation was made on the counted value, with cause and outcome left uncertified.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0', sources: [
        'Cretikos MA, Bellomo R, Hillman K, et al. Respiratory rate: the neglected vital sign. Med J Aust. 2008;188(11):657-659. A respiratory rate above 27 per minute was the strongest predictor of in-hospital cardiac arrest; more than half of serious adverse events had a rate above 24 identifiable up to 24 hours beforehand at greater than 95% specificity; respiratory rate was documented in only about 30% of ward patients before an early-warning score was introduced.',
        'Palmer J, et al. How registered nurses measure and record respiratory rate: an integrative review. J Clin Nurs. 2023. Documents over-representation of the values 16, 18, and 20 in charted respiratory rates and rates recorded without being counted.',
      ] },
    limitations: ['counted-rate-charted-trend-and-counted-value-are-authored',
      'counted-rate-controls-are-counting-recording-and-escalation-only',
      'counted-rate-monitor-equivalence-is-not-claimed'],
  },
  patient: {
    ageYears: 64, sex: 'male', heightCm: 178, weightKg: 88, asaClass: 3,
    diagnosis: 'Authored postoperative deterioration visible only in a respiratory rate that was never counted',
    procedure: 'calm chart reading, measurement, discrepancy recording, escalation, and handoff practice',
    comorbidities: ['Obesity; day 2 after open abdominal surgery'],
    medications: ['All prescribing, investigation, and treatment decisions remain qualified-team work'],
    allergies: ['No known drug allergies'], fasting: 'Not relevant to the nursing fixture',
    baseline: { heartRateBpm: 96, meanArterialMmHg: 89, strokeVolumeMl: 70,
      hemoglobinGPerDl: 11.4, bloodVolumeMl: 5_600, coreTemperatureC: 37.2,
      arterialStiffness: 1.1, baroreflexGain: 0.7, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Alert and speaking in full sentences in the supplied fixture' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 500, respiratoryRateBpm: 12,
      freshGasFlowLPerMin: 10, delivering: false } }, formulary: [],
  timeline: [
    { id: 'counted-rate-presentation', type: 'narrative', target: 'counted-rate', atTick: 0,
      severity: 'warning', message: 'A 64-year-old is two days after open abdominal surgery. The last six charted respiratory rates, across three shifts, read 18, 18, 20, 18, 18, 20. Oxygen saturation is 95% in air, pulse 96/min, blood pressure 124/72 mmHg, temperature 37.2 C. He is alert and speaking in full sentences. Read as a trend, the respiratory rate has been stable for three shifts.' },
    { id: 'counted-rate-evidence', type: 'narrative', target: 'counted-rate-evidence', atTick: 0,
      severity: 'warning', message: 'Read as a distribution rather than a trajectory, those six entries take two distinct values. Reviews of how respiratory rate is actually measured on wards describe exactly this clustering on 16, 18, and 20, and describe rates entered without being counted. Respiratory rate is at the same time the strongest routine predictor of in-hospital cardiac arrest: a rate above 27 was the single strongest predictor in one series, and more than half of serious adverse events had a rate above 24 identifiable up to 24 hours beforehand. A rate counted for a full sixty seconds in this patient is 28. Nothing about him has changed. What changed is that somebody counted.' },
    { id: 'counted-rate-boundary', type: 'narrative', target: 'counted-rate-boundary', atTick: 0,
      severity: 'warning', message: 'Review the charted trend and say what kind of evidence it is; count the rate for a full sixty seconds; record the discrepancy without reconciling it, leaving the earlier entries exactly as another clinician wrote them; request review on the counted value with the charted column given unaltered alongside it; review the boundaries and their certainty; and arrange increased observation in which the rate is counted rather than estimated. Reading the flat trend as a stable patient, charting a monitor-derived rate as a counted one, recording a value anchored to the previous entry, and amending the earlier entries are all refused. Recording a discrepancy or escalating before anything has been counted is refused as premature rather than accepted, because there is only one number until then. No drug, dose, route, fluid, investigation, or procedure is exposed, and the learner performs no examination beyond counting and orders no test. The charted entries never change in this rehearsal, because they are a record of what was written rather than of what was measured, and the patient never changes either: the rate was 28 before anyone counted it. If review is requested, the qualified team counts independently, reaches the same number, and records that the chart gave no indication of it. Whether a monitor-derived respiratory rate agrees with a counted one is not established in the retrievable evidence, and this lesson does not claim it either way. No individualized effect, treatment causality, cause, eligibility, disposition, prognosis, or outcome is reported. Qualified teams retain review, investigation, prescribing, and every treatment decision. After another elapsed interval, hand off the charted column as written, the counted rate, the unreconciled discrepancy, disposition, and outcome uncertainty. The controls do not take history; examine beyond counting a rate; acquire or interpret laboratory, imaging, or another test; diagnose; select or deliver a drug, dose, route, fluid, oxygen, or device; perform a procedure; determine eligibility, disposition, or prognosis; or predict response, cause, survival, or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'counted-rate-trajectory', objectiveId: 'reconcile-medical-surgical-nursing-counted-rate-a-trend-read-as-a-distribution', question: 'What does a column of six entries taking two values tell you?' },
    { id: 'counted-rate-recognition', objectiveId: 'recognize-medical-surgical-nursing-counted-rate-the-measurement-is-the-finding', question: 'What changed between the charted rate and the counted one?' },
    { id: 'counted-rate-record', objectiveId: 'record-medical-surgical-nursing-counted-rate-a-discrepancy-left-unreconciled', question: 'Why are the earlier entries left exactly as they were written?' },
    { id: 'counted-rate-activation', objectiveId: 'activate-medical-surgical-nursing-counted-rate-escalation-on-the-counted-value', question: 'Why does the reviewer need the charted column as well as your number?' },
    { id: 'counted-rate-boundaries', objectiveId: 'review-medical-surgical-nursing-counted-rate-boundaries-and-their-certainty', question: 'Why does a normal oxygen saturation not make the rate redundant?' },
    { id: 'counted-rate-handoff', objectiveId: 'handoff-medical-surgical-nursing-counted-rate-a-record-that-disagrees-with-itself', question: 'What travelled with the patient, and what stayed contradictory?' },
  ] },
};
