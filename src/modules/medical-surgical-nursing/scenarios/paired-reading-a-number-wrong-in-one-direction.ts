/** An oximeter reading 94 percent while the arterial sample says 86. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const PAIRED_READING_A_NUMBER_WRONG_IN_ONE_DIRECTION: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'paired-reading-a-number-wrong-in-one-direction', version: '0.1.0', maturity: 'preview',
    title: 'A number wrong in one direction', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 8, difficulty: 'intermediate', objectives: [
      { id: 'reconcile-medical-surgical-nursing-paired-reading-a-reading-recorded-as-a-reading', statement: 'Record an oximeter reading as an oximeter reading.', measure: 'Ninety-four percent on room air with a good trace, no supplemental oxygen, and a respiratory rate of 24 counted for a full minute were recorded as what the device displayed rather than as the arterial saturation, without learner examination beyond observation or any test.' },
      { id: 'recognize-medical-surgical-nursing-paired-reading-error-with-a-direction', statement: 'Recognize an error that runs one way.', measure: 'Both values from the same minute were recorded together, 94 percent by oximeter and 86 percent by arterial sample, with the oximeter entry left unamended because it is a true record of what the device displayed.' },
      { id: 'record-medical-surgical-nursing-paired-reading-what-the-gap-is-not', statement: 'State what the gap is and is not.', measure: 'The discrepancy was characterised as a known limitation of optical measurement rather than a poor trace, a cold hand, nail covering, motion, or probe position, with the systematic-review finding of substantially more frequent occult hypoxaemia in Black patients reported at its stated moderate certainty.' },
      { id: 'activate-medical-surgical-nursing-paired-reading-escalation-on-the-arterial-value', statement: 'Escalate on the arterial value, with the reading alongside it.', measure: 'Review was requested on the arterial saturation with the oximeter reading given and labelled, and repositioning the probe, warming the hand, trusting the steady trend, and assuming a regulatory change had resolved it were each refused.' },
      { id: 'review-medical-surgical-nursing-paired-reading-boundaries-and-their-certainty', statement: 'Review the boundaries and their certainty.', measure: 'That the bias is optical rather than a perfusion artifact, that the meta-analytic evidence is moderate certainty, that a 2025 draft guidance governs future device submissions rather than devices in service, and that the oximeter trends change better than it reports an absolute value were all kept explicit.' },
      { id: 'handoff-medical-surgical-nursing-paired-reading-a-chart-that-reads-reassuringly', statement: 'Hand off a chart that reads reassuringly.', measure: 'The handoff preserved both values, the reason the gap exists, that escalation was made on the arterial value, and that the observation chart will continue to show numbers in the nineties, with cause and outcome left uncertified.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0', sources: [
        'Parr B, Beech A, Young M, Valley TS. Racial and ethnic disparities in occult hypoxemia prevalence and clinical outcomes among hospitalized patients: a systematic review and meta-analysis. J Gen Intern Med. 2024;39(13):2543-2553. doi:10.1007/s11606-024-08852-1. Moderate certainty. Across 732,505 paired measurements, the prevalence ratio for occult hypoxaemia was 1.67 (95% CI 1.47-1.90) in Black compared with white patients, and 1.39 (95% CI 1.19-1.64) for other groups.',
        'Sjoding MW, Dickson RP, Iwashyna TJ, Gay SE, Valley TS. Racial bias in pulse oximetry measurement. N Engl J Med. 2020;383:2477-2478. doi:10.1056/NEJMc2029240. Where oxygen saturation by pulse oximetry read 92 to 96 percent, arterial saturation was below 88 percent in 12 percent of Black patients compared with 4 percent of white patients in one cohort, and 17 percent compared with 6 percent in another.',
        'United States Food and Drug Administration. Draft guidance on pulse oximeters for medical purposes, January 2025. Applies to devices submitted for premarket review after issuance; it does not recall, recalibrate, or replace devices already in clinical service.',
      ] },
    limitations: ['paired-reading-presentation-and-arterial-value-are-authored',
      'paired-reading-controls-are-recording-and-escalation-only',
      'paired-reading-prevalence-ratios-are-population-statistics'],
  },
  patient: {
    ageYears: 57, sex: 'female', heightCm: 165, weightKg: 79, asaClass: 3,
    diagnosis: 'Authored hypoxaemia concealed by an oximeter reading that overestimates arterial saturation',
    procedure: 'calm reading recording, paired-value recording, escalation, and handoff practice',
    comorbidities: ['Type 2 diabetes; day 4 after abdominal surgery; darker skin pigmentation'],
    medications: ['All prescribing, oxygen, investigation, and treatment decisions remain qualified-team work'],
    allergies: ['No known drug allergies'], fasting: 'Not relevant to the nursing fixture',
    baseline: { heartRateBpm: 98, meanArterialMmHg: 96, strokeVolumeMl: 66,
      hemoglobinGPerDl: 11.2, bloodVolumeMl: 5_000, coreTemperatureC: 37.4,
      arterialStiffness: 1.2, baroreflexGain: 0.7, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Alert and speaking in full sentences in the supplied fixture' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 460, respiratoryRateBpm: 12,
      freshGasFlowLPerMin: 10, delivering: false } }, formulary: [],
  timeline: [
    { id: 'paired-reading-presentation', type: 'narrative', target: 'paired-reading', atTick: 0,
      severity: 'warning', message: 'A 57-year-old is four days after abdominal surgery. The pulse oximeter reads 94% on room air with a good plethysmographic trace, a warm hand, and no nail covering. Respiratory rate counted for a full minute is 24. Blood pressure 132/78 mmHg, pulse 98/min, temperature 37.4 C. She is alert and speaking in full sentences. An arterial sample was sent earlier by the qualified team and has not yet returned. She has darker skin pigmentation.' },
    { id: 'paired-reading-evidence', type: 'narrative', target: 'paired-reading-evidence', atTick: 0,
      severity: 'warning', message: 'Pulse oximetry infers arterial saturation from how light is absorbed as it passes through tissue, and skin pigmentation changes that absorbance. The consequence is a device error with a direction: the reading tends to overestimate arterial saturation in patients with darker skin, which means the error runs toward reassurance. A systematic review and meta-analysis of 732,505 paired measurements reports occult hypoxaemia, meaning an arterial saturation below 88 percent while the oximeter reads 92 to 96, with a prevalence ratio of 1.67 in Black compared with white patients at moderate certainty of evidence. In one cohort the arterial saturation was below 88 percent in 12 percent of Black patients reading 92 to 96, against 4 percent of white patients. When the arterial sample in this rehearsal returns, it reads 86 percent, taken while the oximeter read 94.' },
    { id: 'paired-reading-boundary', type: 'narrative', target: 'paired-reading-boundary', atTick: 0,
      severity: 'warning', message: 'Record the oximeter reading as an oximeter reading rather than as the saturation, because those are different quantities and only one of them was measured; once the arterial result returns, record both values together with the time they were taken and leave the oximeter entry unamended, since it is a true record of what the device displayed; state what the gap is and is not; request review on the arterial value with the oximeter reading given and labelled alongside it; review the boundaries and their certainty; and arrange observation that does not depend on the oximeter, counting the respiratory rate and describing the work of breathing in words. Repositioning the probe, warming the hand, reading the steady oximeter numbers as a stable saturation, and assuming a regulatory change has resolved the problem are all refused. No drug, dose, route, fluid, oxygen setting, investigation, or procedure is exposed; the learner orders no test, and the arterial sample was sent by the qualified team before this rehearsal began. Recording paired values, characterising the gap, or escalating before the arterial result has returned is refused as premature, because until then only one number exists. The displayed saturation never changes in this rehearsal: the patient was hypoxaemic before the sample returned and is hypoxaemic after it, and only what is known changes. The bias is optical rather than a perfusion artifact, so nothing available at the bedside corrects it. The 2025 draft regulatory guidance applies to devices submitted for approval in future and does not recall or recalibrate devices already in service. No individualized effect, treatment causality, cause, eligibility, disposition, prognosis, or outcome is reported. Qualified teams retain review, investigation, oxygen decisions, and every treatment decision. After another elapsed interval, hand off both values, the reason the gap exists, that the chart will continue to read reassuringly, disposition, and outcome uncertainty. The controls do not take history; examine beyond observation; acquire or interpret laboratory, imaging, or another test; diagnose; select or deliver a drug, dose, route, fluid, oxygen, or device; perform a procedure; determine eligibility, disposition, or prognosis; or predict response, cause, survival, or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'paired-reading-trajectory', objectiveId: 'reconcile-medical-surgical-nursing-paired-reading-a-reading-recorded-as-a-reading', question: 'Why record it as an oximeter reading rather than as the saturation?' },
    { id: 'paired-reading-recognition', objectiveId: 'recognize-medical-surgical-nursing-paired-reading-error-with-a-direction', question: 'What does it mean for a measurement error to have a direction?' },
    { id: 'paired-reading-record', objectiveId: 'record-medical-surgical-nursing-paired-reading-what-the-gap-is-not', question: 'Which bedside explanations were ruled out, and why do none of them fit?' },
    { id: 'paired-reading-activation', objectiveId: 'activate-medical-surgical-nursing-paired-reading-escalation-on-the-arterial-value', question: 'Why does the reviewer need both numbers rather than the arterial one alone?' },
    { id: 'paired-reading-boundaries', objectiveId: 'review-medical-surgical-nursing-paired-reading-boundaries-and-their-certainty', question: 'What does the oximeter do well, and what does it not do well?' },
    { id: 'paired-reading-handoff', objectiveId: 'handoff-medical-surgical-nursing-paired-reading-a-chart-that-reads-reassuringly', question: 'What will the next person see on the chart, and what must travel with it?' },
  ] },
};
