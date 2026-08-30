/** A rule cited as permission, written to classify data rather than to manage a patient. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const TRIAL_RULE_A_RULE_WRITTEN_FOR_A_DATABASE: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'trial-rule-a-rule-written-for-a-database', version: '0.1.0', maturity: 'preview',
    title: 'A rule written for a database', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 8, difficulty: 'intermediate', objectives: [
      { id: 'recognize-oncology-trial-rule-the-slope-not-the-moment', statement: 'Record the clinical trajectory rather than the scan alone.', measure: 'The fall in function over three weeks, the six-kilogram weight loss, and the breathlessness were recorded as the direction and rate the report cannot supply, and letting the scan alone decide was refused in either direction.' },
      { id: 'record-oncology-trial-rule-what-the-criteria-govern', statement: 'Record what the response criteria do and do not govern.', measure: 'That the criteria were published to standardise data collection in immunotherapy trials, that their working group describes them as recommendations for data handling rather than patient management and as not validated, and that their allowance to treat past a radiological progression is conditional on clinical stability, were all recorded.' },
      { id: 'activate-oncology-trial-rule-the-team-that-decides', statement: 'Call the treating team, which holds the decision.', measure: 'The treating oncology team was called with the trajectory, the supplied report, and the fact that a decision was being held on a criterion whose condition she does not meet, and booking a scan in eight weeks instead was refused.' },
      { id: 'recognize-oncology-trial-rule-both-errors-are-real', statement: 'Refuse both continuing on the rule and stopping on the scan.', measure: 'Calling it pseudoprogression and continuing was refused because the criterion’s condition is clinical stability, and stopping the immunotherapy and telling her it had failed was refused as the opposite error rather than the safe one, with both recorded as the treating team’s decision.' },
      { id: 'record-oncology-trial-rule-bounded-qualified-intent', statement: 'Record bounded qualified-team treatment intent.', measure: 'Whether the immunotherapy continues, whether a further line is offered, whether best supportive care is the honest answer, and what she is told, were recorded as the treating team’s, and no drug, dose, route, cycle, interval, or line of therapy was chosen or displayed.' },
      { id: 'review-oncology-trial-rule-boundaries-and-their-certainty', statement: 'Review the boundaries and read them in both directions.', measure: 'That reported pseudoprogression rates do not exceed 10 percent and rest on small series, that hyperprogression is reported at between 4 and 29 percent with 13.8 percent against 5.1 percent in one lung-cancer comparison, and that the published advice names premature discontinuation and delayed next line as errors to avoid together, were all kept explicit.' },
      { id: 'handoff-oncology-trial-rule-the-direction-and-its-rate', statement: 'Hand off the direction and its rate, not the report.', measure: 'The handoff preserved the three-week trajectory and its rate, the supplied report, what the cited criterion actually governs, any shortcut considered and not taken, and the state of the treating team’s response, with no diagnosis, treatment effect, or outcome certified.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0', sources: [
        'Seymour L, Bogaerts J, Perrone A, et al; RECIST working group. iRECIST: guidelines for response criteria for use in trials testing immunotherapeutics. Lancet Oncol. 2017;18(3):e143-e152. The guideline modifies RECIST 1.1 for immunotherapy trials to ensure consistent design and data collection and to permit the ongoing collection of trial data and ultimate validation of the guideline. Unconfirmed progression allows continued treatment beyond RECIST 1.1 progression if the patient is clinically stable, with confirmatory imaging repeated 4 to 8 weeks later. The RECIST working group states that these are recommendations for data handling rather than patient management, and that they are not validated response criteria.',
        'Onesti CE, Frères P, Jerusalem G. Atypical patterns of response to immune checkpoint inhibitors: interpreting pseudoprogression and hyperprogression in decision making for patients’ treatment. J Thorac Dis. 2019;11(1):35-38. "Overall, the rate of pseudoprogression do not exceed 10% in patients treated with immune checkpoint inhibitors", with small numbers behind the favourable series. Hyperprogressive disease incidence in patients receiving immunotherapy ranges from 4% to 29% across studies, including 13.8% on immunotherapy against 5.1% on chemotherapy in one non-small-cell lung cancer series, with no effective treatment after hyperprogression reported in the literature. "It is crucial to recognize pseudoprogression from a real progression, to avoid both a premature discontinuation of an effective treatment and the delay of starting a new line of therapy."',
      ] },
    limitations: ['trial-rule-presentation-and-the-document-are-authored',
      'trial-rule-controls-are-recording-and-escalation-only',
      'trial-rule-neither-rate-decides-this-patient'],
  },
  patient: {
    ageYears: 58, sex: 'female', heightCm: 164, weightKg: 57, asaClass: 3,
    diagnosis: 'Authored radiological progression at nine weeks of checkpoint-inhibitor treatment in a clinically declining patient',
    procedure: 'trajectory recording, criterion-scope review, escalation to the treating team, evidence-boundary review, and handoff practice',
    comorbidities: ['Metastatic non-small-cell lung cancer in the supplied record; nine weeks of checkpoint-inhibitor treatment'],
    medications: ['All decisions about continuing, stopping, or changing treatment remain the treating team’s work'],
    allergies: ['No known drug allergies'], fasting: 'Not relevant to the oncology day-unit fixture',
    baseline: { heartRateBpm: 96, meanArterialMmHg: 83, strokeVolumeMl: 55,
      hemoglobinGPerDl: 10.6, bloodVolumeMl: 3_900, coreTemperatureC: 36.9,
      arterialStiffness: 1.1, baroreflexGain: 0.8, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Breathless on crossing a room, speaking in full sentences at rest in the supplied fixture' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 420, respiratoryRateBpm: 12,
      freshGasFlowLPerMin: 10, delivering: false } }, formulary: [],
  timeline: [
    { id: 'trial-rule-presentation', type: 'narrative', target: 'trial-rule', atTick: 0,
      severity: 'warning', message: 'A 58-year-old woman is in the oncology day unit at nine weeks of checkpoint-inhibitor treatment for metastatic non-small-cell lung cancer. The restaging report, two days old, describes new lesions and enlargement of existing disease. Over three weeks she has gone from managing her own shopping to needing help to wash, has lost six kilograms, and is breathless crossing a room. Authored observations are heart rate 96/min, blood pressure 112/68 mmHg, respiratory rate 22/min, oxygen saturation 94% in air, and temperature 36.9 C. A colleague says this could be pseudoprogression and that the criteria allow treating through it, with a repeat scan in eight weeks.' },
    { id: 'trial-rule-evidence', type: 'narrative', target: 'trial-rule-evidence', atTick: 0,
      severity: 'warning', message: 'The criterion being cited is real, and it does not say what it is being used to say. It permits continuing past a radiological progression while the patient is clinically stable, with confirmation four to eight weeks later, and the working group that publishes it describes it as recommendations for data handling rather than patient management, and as not yet validated. Pseudoprogression is real and uncommon: reported rates do not exceed 10 percent, on small series. Hyperprogression is reported at between 4 and 29 percent depending on the study and the tumour, including 13.8 percent against 5.1 percent on chemotherapy in one lung-cancer comparison, with nothing established to offer once it has happened. The published advice is to distinguish the two so as to avoid both premature discontinuation of an effective treatment and delay in starting a new line. Waiting is not the cautious option here and stopping is not the decisive one; they are two different ways of deciding without her trajectory.' },
    { id: 'trial-rule-boundary', type: 'narrative', target: 'trial-rule-boundary', atTick: 0,
      severity: 'warning', message: 'Record the clinical trajectory and its rate rather than the scan alone; record what the criteria do and do not govern; call the treating oncology team; record bounded qualified-team treatment intent; and review the boundaries and their certainty in both directions. Calling it pseudoprogression and continuing, stopping the immunotherapy and telling her it has failed, letting the scan alone decide, and booking a scan in eight weeks are all refused. No drug, dose, route, cycle, interval, product, or line of therapy is exposed, the learner acquires and interprets no test, and every result is supplied. After elapsed simulated time the cited criteria themselves arrive and are narrower than they were quoted as being, while nothing about her changes, because the thing that moved was the rule rather than the patient. The treating team answers only if it was called, takes ownership of whether treatment continues, whether a further line is offered, and what she is told, reviews her within days rather than at the eight-week scan, and states that both errors are real. No diagnosis, individualized risk, treatment causality, eligibility, disposition, prognosis, or outcome is reported, and the rehearsal ends whatever her trajectory. After another elapsed interval, hand off the direction and its rate, the supplied report, and what the cited criterion actually governs. The controls do not take history; examine; acquire or interpret imaging, biopsy, or another test; diagnose; select, deliver, continue, or withdraw any drug, dose, route, cycle, or line of therapy; determine eligibility, disposition, or prognosis; or predict response, survival, or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'trial-rule-trajectory', objectiveId: 'recognize-oncology-trial-rule-the-slope-not-the-moment', question: 'The report describes a moment. What were you actually being asked about?' },
    { id: 'trial-rule-governance', objectiveId: 'record-oncology-trial-rule-what-the-criteria-govern', question: 'The criterion was quoted at you as permission. What was it written to do?' },
    { id: 'trial-rule-activation', objectiveId: 'activate-oncology-trial-rule-the-team-that-decides', question: 'Who was going to decide this, and when did they find out?' },
    { id: 'trial-rule-both-errors', objectiveId: 'recognize-oncology-trial-rule-both-errors-are-real', question: 'Continuing and stopping are both wrong here. What makes them the same mistake?' },
    { id: 'trial-rule-intent', objectiveId: 'record-oncology-trial-rule-bounded-qualified-intent', question: 'Where does your part of this stop, and what did you hand over?' },
    { id: 'trial-rule-boundaries', objectiveId: 'review-oncology-trial-rule-boundaries-and-their-certainty', question: 'One rate is under 10 percent and the other reaches 29. What does neither of them tell you?' },
    { id: 'trial-rule-handoff', objectiveId: 'handoff-oncology-trial-rule-the-direction-and-its-rate', question: 'What had to travel so the next person decided about her rather than about the scan?' },
  ] },
};
