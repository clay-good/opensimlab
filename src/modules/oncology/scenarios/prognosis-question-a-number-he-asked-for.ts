/** A question no observation answers, and an answer measured by what he repeats back. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const PROGNOSIS_QUESTION_A_NUMBER_HE_ASKED_FOR: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'prognosis-question-a-number-he-asked-for', version: '0.1.0', maturity: 'preview',
    title: 'A question with a number in it', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 10, difficulty: 'intermediate', objectives: [
      { id: 'reconcile-oncology-prognosis-question-the-question-behind-it', statement: 'Establish what he wants the number for before answering it.', measure: 'He was asked what he wanted the number for and what he would rather not be told, before any answer was given, and answering first was refused; the wedding in four months was recorded as the decision the number is being used to make.' },
      { id: 'record-oncology-prognosis-question-in-his-own-words', statement: 'Record the question as he asked it.', measure: 'The words "how long have I got" were recorded with the date, who was present, and what he said he wanted it for, rather than paraphrased into a note that he asked about prognosis.' },
      { id: 'recognize-oncology-prognosis-question-what-he-believes-treatment-is-for', statement: 'Check what he believes the treatment is for before answering what it buys him.', measure: 'He was asked what he understood the treatment to be for and said he assumed it was to get rid of it, and the record carried that 69 percent of lung and 81 percent of colorectal patients on chemotherapy for incurable cancer did not report understanding it was not at all likely to cure them, with the most favourable communication ratings associated with the least accurate belief.' },
      { id: 'record-oncology-prognosis-question-scenarios-not-a-number', statement: 'Answer with scenarios rather than a number.', measure: 'A typical figure, a worse case and a better case were given with the proportions each covers, the wedding was located inside them, and a single number, "nobody can know", and reassurance were each refused.' },
      { id: 'review-oncology-prognosis-question-the-direction-of-the-error', statement: 'State which way the estimate is likely to be wrong.', measure: 'That only 20 percent of doctors’ survival predictions in a cohort of 468 were accurate to within a third, that 63 percent were over-optimistic and long by roughly a factor of five, and that the doctors who had known their patients longest were the least accurate, were stated to him as a property of the people estimating rather than of him.' },
      { id: 'review-oncology-prognosis-question-boundaries-and-their-certainty', statement: 'Review the boundaries and their certainty.', measure: 'That the optimism figure comes from a hospice cohort with a median survival of 24 days and transfers as a direction rather than a size, that the scenario method was measured on 114 patients with a median survival of 11 months and rested on estimates only 29 percent of which fell within a third of observed survival, and that none of the figures is his, were all kept explicit.' },
      { id: 'handoff-oncology-prognosis-question-what-he-took-from-it', statement: 'Hand off what he took from it, not what was said to him.', measure: 'The handoff carried the question in his own words, his belief about the treatment, that he was answered with scenarios and told the direction of the error, and what he actually repeated back, with no prognosis or outcome certified.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0', sources: [
        'Christakis NA, Lamont EB. Extent and determinants of error in doctors’ prognoses in terminally ill patients: prospective cohort study. BMJ. 2000;320(7233):469-472. 343 doctors provided survival estimates for 468 terminally ill patients at hospice referral; median survival 24 days; only 20% of predictions accurate to within 33% of actual survival, 63% over-optimistic, 17% over-pessimistic; survival overestimated by a factor of 5.3. As the duration of the doctor-patient relationship increased and time since last contact decreased, prognostic accuracy decreased.',
        'Weeks JC, Catalano PJ, Cronin A, et al. Patients’ expectations about effects of chemotherapy for advanced cancer. N Engl J Med. 2012;367(17):1616-1625. 69% of patients with lung cancer and 81% with colorectal cancer did not report understanding that chemotherapy was not at all likely to cure their cancer. Patients who rated communication with their physician most favourably were more likely to hold inaccurate beliefs (odds ratio highest versus lowest third 1.90, 95% CI 1.33-2.72).',
        'Kiely BE, Martin AJ, Tattersall MHN, et al. The median informs the message: accuracy of individualized scenarios for survival time based on oncologists’ estimates. J Clin Oncol. 2013;31(28):3565-3571. 21 oncologists estimated survival for 114 patients with advanced cancer; median survival 11 months. Observed survival was between half and double the estimate in 63%, a quarter of it or less in 6%, and three times it or more in 14%. Estimates were imprecise: 29% fell within 0.67 to 1.33 times observed survival.',
      ] },
    limitations: ['prognosis-question-conversation-and-readback-are-authored',
      'prognosis-question-controls-are-conversation-only',
      'prognosis-question-figures-describe-estimators-not-this-patient'],
  },
  patient: {
    ageYears: 74, sex: 'male', heightCm: 173, weightKg: 68, asaClass: 3,
    diagnosis: 'Authored prognosis conversation in metastatic pancreatic cancer on second-line treatment',
    procedure: 'calm conversation practice: establishing the question, answering in scenarios, and handoff',
    comorbidities: ['Metastatic pancreatic cancer, second-line systemic treatment, stable performance status'],
    medications: ['All prescribing, treatment, and change-of-intent decisions remain qualified-team work'],
    allergies: ['No known drug allergies'], fasting: 'Not relevant to the clinic fixture',
    baseline: { heartRateBpm: 82, meanArterialMmHg: 89, strokeVolumeMl: 66,
      hemoglobinGPerDl: 11.2, bloodVolumeMl: 4_700, coreTemperatureC: 36.7,
      arterialStiffness: 1.2, baroreflexGain: 0.8, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Alert, orientated, and speaking in full sentences in the supplied fixture' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 470, respiratoryRateBpm: 12,
      freshGasFlowLPerMin: 10, delivering: false } }, formulary: [],
  timeline: [
    { id: 'prognosis-question-presentation', type: 'narrative', target: 'prognosis-question', atTick: 0,
      severity: 'warning', message: 'A 74-year-old man with metastatic pancreatic cancer is at the end of a routine review on second-line treatment. His daughter is with him. As the appointment finishes he asks, "how long have I got?" Authored observations are heart rate 82/min, blood pressure 124/72 mmHg, respiratory rate 16/min, oxygen saturation 97% in air, temperature 36.7 C, and alert. He has said before that he does not want "all the details". Nothing on the monitor bears on what he has just asked.' },
    { id: 'prognosis-question-evidence', type: 'narrative', target: 'prognosis-question-evidence', atTick: 0,
      severity: 'warning', message: 'Two findings make the comfortable replies unsafe. In a cohort of 468 terminally ill patients, only 20 percent of doctors’ survival predictions were accurate to within a third, 63 percent were over-optimistic, and estimates were long by a factor of about five; the doctors who had known their patients longest were the least accurate. And among patients receiving chemotherapy for incurable lung or colorectal cancer, 69 and 81 percent did not report understanding it was not at all likely to cure them, with those who rated communication with their physician most favourably about twice as likely to believe it. A warm conversation is not evidence that anything was understood. The measured alternative is to give a typical figure with a worse and a better case: in the study of that method, observed survival fell between half and double the estimate in 63 percent, at a quarter or less in 6 percent, and at three times or more in 14 percent.' },
    { id: 'prognosis-question-boundary', type: 'narrative', target: 'prognosis-question-boundary', atTick: 0,
      severity: 'warning', message: 'Ask what he wants the number for and what he would rather not be told, before answering; record the question in his own words with who was present; check what he believes the treatment is for; answer with a typical figure and a worse and better case rather than a number, and locate his decision inside them; state which way the estimate is likely to be wrong and that this is a property of the people estimating; and review the boundaries and their certainty. Giving one number, saying nobody can know, reassuring him and moving on, and answering before asking what he wants are all refused, as is stating the direction of an error before an estimate exists to attach it to. No drug, dose, investigation, or procedure is exposed, no examination is performed, and no prognosis is computed: every figure here describes a published cohort rather than this man. After elapsed simulated time he asks again and says why — a wedding in four months and a decision about whether to book anything. After an answer has been given, he repeats it back to his daughter, and what he repeats is decided by what was actually said: all three scenarios and the direction of the error if both were given, and the best case alone if the direction was not. That contrast is the point of the lesson and predicts nothing about his survival. Qualified teams retain every treatment decision and every change of intent. After another elapsed interval, hand off the question, the belief, the answer, the stated direction, and what he took from it. The controls do not take history; examine; acquire or interpret any test; diagnose; select or deliver a drug, dose, route, fluid, oxygen, or device; perform a procedure; determine eligibility, disposition, or prognosis; or predict response, survival, or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'prognosis-question-intent', objectiveId: 'reconcile-oncology-prognosis-question-the-question-behind-it', question: 'What was he actually asking you to help him decide?' },
    { id: 'prognosis-question-record', objectiveId: 'record-oncology-prognosis-question-in-his-own-words', question: 'What does a paraphrase of his question lose for the next person who sees him?' },
    { id: 'prognosis-question-belief', objectiveId: 'recognize-oncology-prognosis-question-what-he-believes-treatment-is-for', question: 'What was he assuming the treatment would do, and how would you have known?' },
    { id: 'prognosis-question-answer', objectiveId: 'record-oncology-prognosis-question-scenarios-not-a-number', question: 'What does a single number do that three scenarios do not?' },
    { id: 'prognosis-question-direction', objectiveId: 'review-oncology-prognosis-question-the-direction-of-the-error', question: 'Whose bias were you describing to him, and why did it belong in the answer?' },
    { id: 'prognosis-question-boundaries', objectiveId: 'review-oncology-prognosis-question-boundaries-and-their-certainty', question: 'Which of those figures is about him?' },
    { id: 'prognosis-question-handoff', objectiveId: 'handoff-oncology-prognosis-question-what-he-took-from-it', question: 'What did he repeat back, and what does that tell you that your own account of the conversation cannot?' },
  ] },
};
