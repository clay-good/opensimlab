/** An event under one percent likely, with the highest fatality of its class and a short window. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const RARE_EARLY_MYOCARDITIS_A_BASE_RATE_IS_NOT_A_THRESHOLD: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'rare-early-myocarditis-a-base-rate-is-not-a-threshold', version: '0.1.0', maturity: 'preview',
    title: 'A base rate is not a threshold', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 9, difficulty: 'intermediate', objectives: [
      { id: 'record-oncology-rare-early-myocarditis-the-exposure-interval', statement: 'Record the exposure interval as part of the finding.', measure: 'Four weeks and two cycles into combination checkpoint therapy were recorded against the described onset — a median of 4 weeks and a median of the second cycle in a 161-patient series, with deaths occurring mainly within 60 days — rather than noted as background.' },
      { id: 'recognize-oncology-rare-early-myocarditis-what-does-not-sound-cardiac', statement: 'Record what is present that does not sound cardiac.', measure: 'Fatigue, exertional breathlessness, aching and weak shoulders, and the complete absence of chest pain were recorded together, with concomitant myositis named as one of the predictors of cardiotoxicity-related death in that series.' },
      { id: 'activate-oncology-rare-early-myocarditis-watch-the-conduction', statement: 'Arrange continuous rhythm monitoring, and say why.', measure: 'Monitoring was arranged on the basis of a new first-degree block and the fact that conduction can progress without a symptom, and it was recorded as a monitoring decision rather than a treatment; the conduction change that follows is visible only where monitoring was arranged.' },
      { id: 'activate-oncology-rare-early-myocarditis-both-teams-not-one', statement: 'Escalate to both teams rather than one.', measure: 'Cardiology and the treating oncology service were contacted together with the suspected problem, the exposure interval and the shoulder symptoms, because a cardiologist called alone receives a troponin without the drug and an oncologist called alone receives a drug without the conduction.' },
      { id: 'recognize-oncology-rare-early-myocarditis-rarity-is-not-a-reason', statement: 'Refuse rarity as a reason not to look.', measure: 'Setting it aside as too rare, discounting the troponin because it rises in many conditions, repeating the troponin in a week, and running the coronary pathway and stopping there were each refused, with the incidence and the fatality stated as answering different questions.' },
      { id: 'review-oncology-rare-early-myocarditis-boundaries-and-their-certainty', statement: 'Review the boundaries and their certainty.', measure: 'That reported trial incidence is roughly 0.1 to 1 percent and higher with combination regimens, that historical mortality is quoted at 30 to 50 percent and myocarditis had the highest fatality of any checkpoint-inhibitor toxicity at 52 of 131 reported cases, and that the 161-patient series is retrospective, drawn from referral centres, and describes people already diagnosed, were all kept explicit.' },
      { id: 'handoff-oncology-rare-early-myocarditis-a-window-held-jointly', statement: 'Hand off a problem neither team owns alone.', measure: 'The handoff preserved the interval, the troponin with the conduction abnormality and the shoulder weakness together, that he is monitored and why, any conduction change already seen, and the bounded intent, with no diagnosis or outcome certified.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0', sources: [
        'Fan Y, Xu Y, Liu X, Liu G. Immune checkpoint inhibitor-related myocarditis: a comprehensive analysis of clinical manifestations and prognostic factors. Oncologist. 2025;30(10). Multicentre retrospective study of 161 patients with biopsy-proven or clinically diagnosed ICI-myocarditis. Onset a median of 4 weeks after initiation, at a median of the second cycle, with mortality occurring mainly within 60 days. Reported incidence 0.1% to 1% in clinical trials, higher with combination regimens; historical mortality quoted at 30% to 50%. Predictors of cardiotoxicity-related death included initial left ventricular ejection fraction below 50%, alanine aminotransferase, creatine kinase-MB, and concomitant ICI-myositis.',
        'Wang DY, Salem JE, Cohen JV, et al. Fatal Toxic Effects Associated With Immune Checkpoint Inhibitors: A Systematic Review and Meta-analysis. JAMA Oncol. 2018;4(12):1721-1728. Myocarditis had the highest fatality rate of any checkpoint-inhibitor toxicity reported, at 52 (39.7%) of 131 reported cases, against 2% to 5% for colitis and endocrine events.',
      ] },
    limitations: ['rare-early-myocarditis-presentation-and-conduction-are-authored',
      'rare-early-myocarditis-controls-are-monitoring-and-escalation-only',
      'rare-early-myocarditis-incidence-and-fatality-answer-different-questions'],
  },
  patient: {
    ageYears: 63, sex: 'male', heightCm: 175, weightKg: 77, asaClass: 3,
    diagnosis: 'Authored suspected checkpoint-inhibitor myocarditis four weeks into combination therapy',
    procedure: 'calm interval recording, rhythm monitoring, joint escalation, and handoff practice',
    comorbidities: ['Metastatic renal cell carcinoma; two cycles of combination checkpoint inhibitor therapy over four weeks'],
    medications: ['All imaging, testing, immunosuppressive, rhythm, and restart decisions remain qualified-team work'],
    allergies: ['No known drug allergies'], fasting: 'Not relevant to the acute assessment fixture',
    baseline: { heartRateBpm: 72, meanArterialMmHg: 86, strokeVolumeMl: 64,
      hemoglobinGPerDl: 11.9, bloodVolumeMl: 5_100, coreTemperatureC: 36.6,
      arterialStiffness: 1.2, baroreflexGain: 0.8, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Alert, orientated, and speaking in full sentences in the supplied fixture' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 500, respiratoryRateBpm: 12,
      freshGasFlowLPerMin: 10, delivering: false } }, formulary: [],
  timeline: [
    { id: 'rare-early-myocarditis-presentation', type: 'narrative', target: 'rare-early-myocarditis', atTick: 0,
      severity: 'warning', message: 'A 63-year-old man attends four weeks and two cycles into combination checkpoint inhibitor therapy for metastatic renal cancer. He describes five days of fatigue, breathlessness on exertion only, and aching, weak shoulders. He has no chest pain and apologises for wasting anybody’s time. Authored observations are heart rate 72/min, blood pressure 118/70 mmHg, respiratory rate 18/min, oxygen saturation 96% in air, and temperature 36.6 C. The supplied electrocardiogram shows new first-degree atrioventricular block and the supplied troponin is markedly raised.' },
    { id: 'rare-early-myocarditis-evidence', type: 'narrative', target: 'rare-early-myocarditis-evidence', atTick: 0,
      severity: 'warning', message: 'Two numbers here answer different questions and are easily used as though they answered the same one. Reported incidence in trials is roughly 0.1 to 1 percent, higher with combination regimens: that says you will rarely meet this. Historical mortality is quoted at 30 to 50 percent, and in a pharmacovigilance analysis myocarditis had the highest fatality of any checkpoint-inhibitor toxicity, 52 of 131 reported cases: that says what it costs to meet it late. In a multicentre series of 161 patients, onset came a median of 4 weeks after starting, at a median of the second cycle, and deaths occurred mainly within 60 days; concomitant myositis was among the predictors of death. He is inside that window, with the conduction abnormality, the troponin, and the shoulders. A base rate sets what you expect. The consequence and the window set how hard you look.' },
    { id: 'rare-early-myocarditis-boundary', type: 'narrative', target: 'rare-early-myocarditis-boundary', atTick: 0,
      severity: 'warning', message: 'Record the exposure interval against the described onset; record what is present that does not sound cardiac, including the shoulders; arrange continuous rhythm monitoring and record why; contact cardiology and the treating oncology service together; record bounded qualified-team treatment intent; and review the boundaries and their certainty. Setting it aside as too rare, discounting the troponin because it rises in many conditions, sending him home to repeat it in a week, and running the coronary pathway and stopping there are all refused. No drug, dose, route, fluid, investigation, or procedure is exposed, the learner acquires and interprets no test, and every result is supplied. After elapsed simulated time the conduction progresses to intermittent Mobitz type I without symptoms — and only where monitoring was arranged, because that is the honest consequence of arranging it or not. Both teams answer only if both were contacted, and take joint ownership of imaging, further testing, immunosuppressive treatment, rhythm management, and any restart. He looks well throughout, because a collapsing patient would answer the question this lesson asks. No diagnosis, individualized risk, treatment causality, eligibility, disposition, prognosis, or outcome is reported. After another elapsed interval, hand off the interval, the results together, the monitoring and its reason, any conduction change, and the bounded intent. The controls do not take history; examine; acquire or interpret an electrocardiogram, troponin, imaging, or another test; diagnose; select or deliver a drug, dose, route, fluid, oxygen, or device; perform a procedure; determine eligibility, disposition, or prognosis; or predict response, survival, or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'rare-early-myocarditis-interval', objectiveId: 'record-oncology-rare-early-myocarditis-the-exposure-interval', question: 'Where does he sit in the described window, and how would you have known?' },
    { id: 'rare-early-myocarditis-non-cardiac', objectiveId: 'recognize-oncology-rare-early-myocarditis-what-does-not-sound-cardiac', question: 'Which symptom would you have been most likely to leave out of the referral?' },
    { id: 'rare-early-myocarditis-monitoring', objectiveId: 'activate-oncology-rare-early-myocarditis-watch-the-conduction', question: 'What can change here without anybody noticing, and what does that cost?' },
    { id: 'rare-early-myocarditis-teams', objectiveId: 'activate-oncology-rare-early-myocarditis-both-teams-not-one', question: 'What does a cardiologist called alone not receive?' },
    { id: 'rare-early-myocarditis-rarity', objectiveId: 'recognize-oncology-rare-early-myocarditis-rarity-is-not-a-reason', question: 'The incidence is under one percent. What question does that number answer?' },
    { id: 'rare-early-myocarditis-boundaries', objectiveId: 'review-oncology-rare-early-myocarditis-boundaries-and-their-certainty', question: 'Whom does the 161-patient series describe, and whom does it not?' },
    { id: 'rare-early-myocarditis-handoff', objectiveId: 'handoff-oncology-rare-early-myocarditis-a-window-held-jointly', question: 'What had to travel so that neither team could assume the other was holding it?' },
  ] },
};
