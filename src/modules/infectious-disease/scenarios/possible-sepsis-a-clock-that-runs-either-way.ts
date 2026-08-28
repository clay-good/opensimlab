/** Possible sepsis: a clock that runs whether or not anyone looks at it. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const POSSIBLE_SEPSIS_A_CLOCK_THAT_RUNS_EITHER_WAY: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'possible-sepsis-a-clock-that-runs-either-way', version: '0.1.0', maturity: 'preview',
    title: 'Possible sepsis: a clock that runs either way', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 8, difficulty: 'advanced', objectives: [
      { id: 'reconcile-infectious-disease-possible-sepsis-fever-without-a-source-or-shock', statement: 'Reconcile a fever without a source and without shock.', measure: 'Temperature 38.4 C, heart rate 108/min, BP 118/72 mmHg with no hypotension, respiratory rate 22/min, lactate 2.4 mmol/L, and no identified source were connected without learner history, examination, sampling, imaging, or tier assignment.' },
      { id: 'recognize-infectious-disease-possible-sepsis-that-the-ceiling-runs-from-suspicion', statement: 'Recognize that the ceiling runs from first suspicion.', measure: 'The time infection was first suspected was recorded and the three-hour ceiling displayed, with the understanding that it runs whether or not anyone watches it, and that recording it is what makes a later delay visible.' },
      { id: 'activate-infectious-disease-possible-sepsis-time-limited-assessment-not-observation', statement: 'Request a time-limited assessment rather than observation.', measure: 'A time-limited course of rapid investigation was requested with the ceiling already running and close monitoring arranged, and passive waiting, unbounded deferral, and self-assigned tiers were each refused.' },
      { id: 'review-infectious-disease-possible-sepsis-tiered-guidance-and-certainty-boundary', statement: 'Review the tiered guidance and its certainty.', measure: 'The one-hour target for shock and for probable or definite sepsis, the three-hour ceiling for possible sepsis with a conditional recommendation, the very low certainty underlying every tier including the strong ones, the rule that no single biomarker rules sepsis in or out, and the quality-measure tension were all kept explicit.' },
      { id: 'record-infectious-disease-possible-sepsis-bounded-intent-inside-the-ceiling', statement: 'Record bounded antimicrobial intent inside the ceiling.', measure: 'Intent was recorded without selecting an agent, dose, route, or combination; the returned assessment showed persisting concern with a source identified and lactate 3.1 mmol/L, and the ceiling did not move because it runs from first suspicion rather than from the result.' },
      { id: 'handoff-infectious-disease-possible-sepsis-a-travelling-clock-and-open-classification', statement: 'Hand off a travelling clock and an open classification.', measure: 'The handoff preserved the recorded time of first suspicion, whether intent fell inside the ceiling, the open likelihood classification as the qualified team’s, continued close monitoring, and de-escalation once cultures return.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0', sources: [
        'Prescott HC, Antonelli M, Alhazzani W, et al. Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2026. Crit Care Med. Published 2026-03-23. doi:10.1097/CCM.0000000000007075. Tiered antimicrobial timing: septic shock and probable or definite sepsis without shock, immediately and ideally within 1 hour, strong recommendation, very low certainty; possible sepsis without shock, a time-limited course of rapid investigation and, if concern persists, antimicrobials within 3 hours, conditional recommendation, very low certainty; low likelihood of infection without shock, defer while continuing close monitoring, conditional. Sepsis is a clinical diagnosis and should not be ruled in or out using a single biomarker or diagnostic test. Statement numbers were not retrievable; wording taken from the issuing society guideline page.',
        'Infectious Diseases Society of America. Practice guideline listing: Surviving Sepsis Campaign 2026 adult and children guidelines, endorsed. IDSA declined to endorse the 2016 edition and published a position paper in 2021 seeking to restrict the SEP-1 measure to septic shock; it endorses the 2026 edition, whose tiered structure addresses that objection.',
        'Rhee C, Chiotos K, Cosgrove SE, et al. Infectious Diseases Society of America Position Paper: Recommended Revisions to the National Severe Sepsis and Septic Shock Early Management Bundle (SEP-1) Sepsis Quality Measure. Clin Infect Dis. 2021;72(4):541-552. doi:10.1093/cid/ciaa059. Argues the time-zero definition is not evidence based and is prone to inter-observer variation, and that the measure risks driving antimicrobial overuse because it ignores sepsis overdiagnosis.',
      ] },
    limitations: ['possible-sepsis-presentation-and-resolution-are-authored',
      'possible-sepsis-controls-are-recording-and-bounded-intent-only',
      'possible-sepsis-tiers-rest-on-very-low-certainty-and-a-contested-measure'],
  },
  patient: {
    ageYears: 49, sex: 'female', heightCm: 166, weightKg: 70, asaClass: 2,
    diagnosis: 'Authored possible sepsis without shock and without an identified source at presentation',
    procedure: 'calm uncertainty recording, time-limited assessment against a visible ceiling, bounded intent, and handoff practice',
    comorbidities: ['Previously well; unwell for one day with fever and malaise'],
    medications: ['Antimicrobial selection, duration, and de-escalation remain qualified-team work'],
    allergies: ['No known drug allergies'], fasting: 'Not relevant to the infectious-disease fixture',
    baseline: { heartRateBpm: 108, meanArterialMmHg: 87, strokeVolumeMl: 66,
      hemoglobinGPerDl: 12.9, bloodVolumeMl: 4_700, coreTemperatureC: 38.4,
      arterialStiffness: 1, baroreflexGain: 0.7, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Alert and orientated, speaking in full sentences in the supplied fixture' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 460, respiratoryRateBpm: 12,
      freshGasFlowLPerMin: 10, delivering: false } }, formulary: [],
  timeline: [
    { id: 'possible-sepsis-presentation', type: 'narrative', target: 'possible-sepsis', atTick: 0,
      severity: 'warning', message: 'A previously well 49-year-old has been unwell for a day with fever and malaise. Authored monitor state is sinus tachycardia 108/min, BP 118/72 mmHg (MAP 87), RR 22/min, SpO2 95% in air, and T 38.4 C. She is alert and orientated. There is no hypotension, so this is not septic shock, and no source has been identified on the supplied assessment so far. There is no authored airway compromise, rash, focal neurologic deficit, or hemorrhage.' },
    { id: 'possible-sepsis-evidence', type: 'narrative', target: 'possible-sepsis-evidence', atTick: 0,
      severity: 'warning', message: 'Supplied laboratory evidence is lactate 2.4 mmol/L, white cells 13.6 x10^9/L, C-reactive protein 96 mg/L, and creatinine 96 µmol/L. Infection cannot be excluded and neither can a non-infective cause; in comparable populations roughly a third of patients treated empirically for suspected sepsis turn out to have no bacterial infection, with viral illness, volume overload, drug effect, and hypovolaemia among the commonest alternatives. Current guidance is tiered rather than uniform, and this patient sits in the tier where a time-limited course of rapid investigation is permitted, with antimicrobials within three hours of first suspicion if concern persists.' },
    { id: 'possible-sepsis-boundary', type: 'narrative', target: 'possible-sepsis-boundary', atTick: 0,
      severity: 'warning', message: 'Record the time infection was first suspected, so the three-hour ceiling is displayed rather than remembered; record the uncertainty as it stands, that infection cannot be excluded, that there is no shock, and that senior assessment is requested; request a time-limited course of rapid investigation with close monitoring; review the tiered guidance and its certainty; and record bounded qualified-team antimicrobial intent. There is deliberately no waiting action in this lesson. What the guidance permits is a bounded assessment against a running clock, which is a different decision from observation, and the ceiling runs from first suspicion whether or not anyone looks at it. The learner does not assign the likelihood tier: that classification belongs to the qualified team, and the operational definitions separating possible from probable are not supplied here. No agent, dose, route, combination, fluid volume, vasoactive agent, or procedure is exposed. After elapsed simulated time the assessment returns with concern persisting, a source identified, and lactate risen to 3.1 mmol/L; the ceiling does not move, because it runs from suspicion rather than from the result. If no antimicrobial intent has been recorded by a later authored point, the pressure falls, the lactate rises further, and the branch collapses to the immediate path where antimicrobial therapy is indicated within the hour and no time-limited investigation remains available; that change is not the learner’s to weigh. If three hours elapse from first suspicion with no intent recorded, the ceiling is reported as passed rather than hidden. Every tier in the current guidance rests on very low certainty of evidence, including the strong recommendations, so conditional does not mean optional, and sepsis is a clinical diagnosis that should not be ruled in or out on a single biomarker or test. No individualized effect, treatment causality, likelihood tier, organism, source confirmation, eligibility, disposition, prognosis, or outcome is reported. Qualified teams retain the classification, antimicrobial selection and delivery, de-escalation, source review, and all treatment decisions. After another elapsed interval, hand off the recorded time of first suspicion, whether intent fell inside the ceiling, the open classification, continued monitoring, disposition, and outcome uncertainty. The controls do not take history; examine; acquire or interpret observations, laboratory, imaging, or another test; assign a tier; diagnose; select or deliver a drug, dose, route, fluid, oxygen, or device; perform a procedure; determine eligibility, disposition, or prognosis; or predict response, organism, survival, or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'possible-sepsis-trajectory', objectiveId: 'reconcile-infectious-disease-possible-sepsis-fever-without-a-source-or-shock', question: 'Which findings placed this patient outside the immediate path?' },
    { id: 'possible-sepsis-recognition', objectiveId: 'recognize-infectious-disease-possible-sepsis-that-the-ceiling-runs-from-suspicion', question: 'When did the clock start, and what did recording it accomplish?' },
    { id: 'possible-sepsis-activation', objectiveId: 'activate-infectious-disease-possible-sepsis-time-limited-assessment-not-observation', question: 'How is a time-limited assessment different from waiting to see?' },
    { id: 'possible-sepsis-boundaries', objectiveId: 'review-infectious-disease-possible-sepsis-tiered-guidance-and-certainty-boundary', question: 'What does each tier recommend, and on what certainty of evidence?' },
    { id: 'possible-sepsis-reassessment', objectiveId: 'record-infectious-disease-possible-sepsis-bounded-intent-inside-the-ceiling', question: 'What did the returned assessment change, and what did it not change?' },
    { id: 'possible-sepsis-handoff', objectiveId: 'handoff-infectious-disease-possible-sepsis-a-travelling-clock-and-open-classification', question: 'What travelled with the patient at handoff, and what stayed open?' },
  ] },
};
