/** A correctly calculated score, below its threshold, in a patient who is septic. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const LOW_SCORE_WHAT_THE_THRESHOLD_DOES_NOT_EXCLUDE: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'low-score-what-the-threshold-does-not-exclude', version: '0.1.0', maturity: 'preview',
    title: 'A low score: what the threshold does not exclude', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 8, difficulty: 'intermediate', objectives: [
      { id: 'reconcile-medical-surgical-nursing-low-score-observations-that-are-correct', statement: 'Reconcile observations that are entirely correct.', measure: 'Respiratory rate 18 counted for a full minute, oxygen saturation 96% on air, systolic 118, heart rate 88 on a rate-controlling medication, temperature 36.9, and alert were recorded with an aggregate score of 2 calculated correctly, without learner examination, sampling, or diagnosis.' },
      { id: 'recognize-medical-surgical-nursing-low-score-a-screen-is-not-a-rule-out', statement: 'Recognize that a screen is not a rule-out test.', measure: 'The record stated what the score does and does not support: a reported sensitivity near 87 percent leaves roughly one in eight patients with sepsis and a positive blood culture below the escalation threshold, and the instrument’s own authors write that a score below it cannot definitively rule out sepsis.' },
      { id: 'activate-medical-surgical-nursing-low-score-escalate-on-concern-not-threshold', statement: 'Escalate on recorded concern, not on the threshold.', measure: 'Medical review was requested with the score below the trigger, the observations unremarkable, and an unaccounted-for change stated plainly, and deferring on the low score, excluding infection on a normal temperature, substituting a more specific tool, and documenting without calling were each refused.' },
      { id: 'review-medical-surgical-nursing-low-score-boundaries-and-their-certainty', statement: 'Review the boundaries and their certainty.', measure: 'The screening rather than diagnostic purpose of the score, the absence of fever in roughly a third of older adults with serious infection, the blunting effect of rate-controlling medication, and the strong recommendation against one tool as a single screen were all kept explicit.' },
      { id: 'record-medical-surgical-nursing-low-score-a-family-report-as-evidence', statement: 'Record a family report as evidence in its own words.', measure: 'The report that the patient is not herself was recorded as given rather than converted into a number, and the requested review later confirmed treatment was warranted while the score at the time of the call was still 2.' },
      { id: 'handoff-medical-surgical-nursing-low-score-a-concern-that-outlived-the-shift', statement: 'Hand off a concern that outlived the shift.', measure: 'The handoff preserved the observations with the score as calculated, what the score does not exclude, the family report in its own words, that review was requested on concern rather than threshold, and the open diagnosis, with no organism or outcome certified.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0', sources: [
        'Prytz M, et al. Diagnostic accuracy of NEWS2 for sepsis among patients with bacteraemia. APMIS. 2025;133(12):e70129. Sensitivity of a NEWS2 of 5 or more for sepsis 86.6% (95% CI 83.0-89.7), specificity 51.5%; approximately 13% of patients with sepsis and a positive blood culture scored below 5. The authors state that a NEWS2 below 5 cannot definitively rule out sepsis.',
        'Evans L, et al. Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2021. Strong recommendation against using qSOFA compared with SIRS, NEWS, or MEWS as a single screening tool for sepsis or septic shock, on moderate-quality evidence.',
        'Difonzo M. Performance of the Afferent Limb of Rapid Response Systems in Managing Deteriorating Patients: A Systematic Review. Crit Care Res Pract. 2019;2019:6902420. Afferent limb failure and delayed activation are common; staff believed the situation was under control in 51.8% of missed activations, and calling a physician rather than the response team was the more frequent first action.',
      ] },
    limitations: ['low-score-presentation-and-review-outcome-are-authored',
      'low-score-controls-are-recording-and-escalation-only',
      'low-score-sensitivity-figures-are-population-statistics'],
  },
  patient: {
    ageYears: 81, sex: 'female', heightCm: 160, weightKg: 62, asaClass: 3,
    diagnosis: 'Authored postoperative infection whose aggregate early-warning score remains below the escalation threshold',
    procedure: 'calm observation recording, evidence-boundary review, escalation on concern, and handoff practice',
    comorbidities: ['Hypertension on a rate-controlling medication; day 3 after elective hemiarthroplasty'],
    medications: ['All prescribing, investigation, and treatment decisions remain qualified-team work'],
    allergies: ['No known drug allergies'], fasting: 'Not relevant to the nursing fixture',
    baseline: { heartRateBpm: 88, meanArterialMmHg: 85, strokeVolumeMl: 62,
      hemoglobinGPerDl: 10.9, bloodVolumeMl: 4_300, coreTemperatureC: 36.9,
      arterialStiffness: 1.3, baroreflexGain: 0.6, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Alert, orientated, and speaking in full sentences in the supplied fixture' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 420, respiratoryRateBpm: 12,
      freshGasFlowLPerMin: 10, delivering: false } }, formulary: [],
  timeline: [
    { id: 'low-score-presentation', type: 'narrative', target: 'low-score', atTick: 0,
      severity: 'warning', message: 'An 81-year-old is three days after an elective hemiarthroplasty. Authored observations are respiratory rate 18 counted for a full minute, oxygen saturation 96% in air with no supplemental oxygen, blood pressure 118/68 mmHg, heart rate 88/min, temperature 36.9 C, and alert. The aggregate early-warning score is 2, which is below the local escalation threshold. The arithmetic is correct and the observations are real. Her daughter says she is not herself, and cannot say more than that.' },
    { id: 'low-score-evidence', type: 'narrative', target: 'low-score-evidence', atTick: 0,
      severity: 'warning', message: 'She takes a rate-controlling medication, so the heart rate is not free to rise in the way the score partly depends on. She is an older adult, and roughly a third of older adults with serious infection are not febrile. In a cohort of patients with bacteraemia, an aggregate score at the escalation threshold had a sensitivity for sepsis of about 87 percent, meaning roughly one in eight patients with sepsis and a positive blood culture scored below it; the authors state plainly that a score below the threshold cannot definitively rule out sepsis. The score in front of you is a screening instrument working exactly as designed, and the design accepts a miss rate it cannot display.' },
    { id: 'low-score-boundary', type: 'narrative', target: 'low-score-boundary', atTick: 0,
      severity: 'warning', message: 'Record the observations as measured with the score as calculated, because nothing here is a documentation failure and pretending otherwise would teach the wrong lesson; record what the score does and does not exclude; record the family report in the words it was given rather than converting it into a number the instrument does not collect; request medical review on recorded concern rather than on a threshold; review the boundaries and their certainty; and arrange increased observation while the review is awaited. Deferring because the score is low, excluding infection on a normal temperature, substituting a more specific screening tool, and documenting the concern without calling anyone are all refused. No drug, dose, route, fluid, investigation, or procedure is exposed, and the learner performs no examination and orders no test. After elapsed simulated time the family states the concern more plainly, with the observations and the score unchanged. The requested review arrives only if it was requested, and confirms that treatment was warranted at the time of the call while the score at that moment was still 2. The observations deliberately never drift, because a rising score would trigger the threshold and make this an ordinary escalation drill rather than a lesson about what a low one licenses. No individualized effect, treatment causality, organism, eligibility, disposition, prognosis, or outcome is reported. Qualified teams retain review, investigation, prescribing, and every treatment decision. After another elapsed interval, hand off the observations, what the score does not exclude, the family report, the reason review was requested, disposition, and outcome uncertainty. The controls do not take history; examine; acquire or interpret observations, laboratory, imaging, or another test; diagnose; select or deliver a drug, dose, route, fluid, oxygen, or device; perform a procedure; determine eligibility, disposition, or prognosis; or predict response, organism, survival, or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'low-score-trajectory', objectiveId: 'reconcile-medical-surgical-nursing-low-score-observations-that-are-correct', question: 'What, if anything, was done incorrectly here?' },
    { id: 'low-score-recognition', objectiveId: 'recognize-medical-surgical-nursing-low-score-a-screen-is-not-a-rule-out', question: 'What does a score below the threshold actually license you to conclude?' },
    { id: 'low-score-activation', objectiveId: 'activate-medical-surgical-nursing-low-score-escalate-on-concern-not-threshold', question: 'On what basis was review requested, and what made that defensible?' },
    { id: 'low-score-boundaries', objectiveId: 'review-medical-surgical-nursing-low-score-boundaries-and-their-certainty', question: 'Which features of this patient weaken the score you are holding?' },
    { id: 'low-score-reassessment', objectiveId: 'record-medical-surgical-nursing-low-score-a-family-report-as-evidence', question: 'How do you record something for which there is no field?' },
    { id: 'low-score-handoff', objectiveId: 'handoff-medical-surgical-nursing-low-score-a-concern-that-outlived-the-shift', question: 'What travelled with the patient, and what stayed unresolved?' },
  ] },
};
