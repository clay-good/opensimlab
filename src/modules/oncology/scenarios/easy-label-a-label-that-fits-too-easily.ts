/** A label whose treatment is what makes the alternative worse. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const EASY_LABEL_A_LABEL_THAT_FITS_TOO_EASILY: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'easy-label-a-label-that-fits-too-easily', version: '0.1.0', maturity: 'preview',
    title: 'A label that fits too easily', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 8, difficulty: 'intermediate', objectives: [
      { id: 'recognize-oncology-easy-label-a-diagnosis-of-exclusion', statement: 'Record that the label is a diagnosis of exclusion.', measure: 'That this colitis requires the exclusion of other competing causes, and that those causes present indistinguishably from it, were recorded as the definition of the diagnosis rather than a caution attached to it, and concluding that four cycles of the drug make this the drug was refused.' },
      { id: 'record-oncology-easy-label-what-remains-open', statement: 'Record what has not been excluded.', measure: 'That no microbiological studies had been reported and which competing infectious causes therefore remained open were recorded, together with the recent admission and antibiotics once visible, and excluding infection on an absent fever was refused.' },
      { id: 'activate-oncology-easy-label-both-at-once', statement: 'Escalate so the samples and the treatment decision start together.', measure: 'The treating team was called with a request for both at once rather than one behind the other, and waiting for every result before telling anyone was refused because only one of the two decisions has to wait for a result.' },
      { id: 'recognize-oncology-easy-label-a-treatment-that-worsens-the-alternative', statement: 'Refuse immunosuppression before exclusion, for the specific reason.', measure: 'Starting immunosuppression on the obvious label was refused on the ground that the treatment for the assumed diagnosis worsens the competing one, with the increased risk of infectious colitis in these patients recorded rather than a general caution about being wrong.' },
      { id: 'record-oncology-easy-label-bounded-qualified-intent', statement: 'Record bounded qualified-team treatment intent.', measure: 'Which samples are taken, whether and when immunosuppression begins, what is given if a competing cause is found, and whether the checkpoint inhibitor continues, were recorded as the treating team’s and gastroenterology’s, and no drug, dose, route, grade threshold, or escalation agent was chosen or displayed.' },
      { id: 'review-oncology-easy-label-boundaries-that-pull-apart', statement: 'Review two boundaries that pull against each other.', measure: 'That guidelines universally recommend corticosteroids as initial management at grade 2 or above, and that microbiological studies should be performed first to exclude common infectious causes, were both kept explicit, with the resolution recorded as parallel action rather than a choice between them.' },
      { id: 'handoff-oncology-easy-label-an-answer-nobody-reached', statement: 'Hand off the open question rather than a settled label.', measure: 'The handoff preserved that the label requires exclusion and the exclusion has not happened, which causes remain open, the recent antibiotic exposure, the stool frequency above baseline and its onset, and the state of both halves, with no diagnosis, treatment effect, or outcome certified.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0', sources: [
        'Li H, Fu ZY, Arslan ME, Cho D, Lee H. Differential diagnosis and management of immune checkpoint inhibitor-induced colitis: a comprehensive review. World J Exp Med. 2021;11(6):79-92. "The diagnosis of ICI-induced colitis is one of exclusion and requires exclusion of other competing etiologies", including cytomegalovirus and Clostridioides difficile, whose clinical presentation is described as indistinguishable from that of ICI-induced colitis. "microbiological studies and/or stool culture should be performed first to exclude the common infectious etiologies" before immunosuppressive therapy, and ICI-induced colitis patients are at increased risk for infectious colitis. "current guidelines universally recommend corticosteroids as initial management for ICI-induced colitis that is grade 2 or of higher grade".',
        'Dougan M, Wang Y, Rubio-Tapia A, Lim JK. AGA clinical practice update on diagnosis and management of immune checkpoint inhibitor colitis and hepatitis: expert review. Gastroenterology. 2021;160(4):1384-1393. An expert review providing best practice advice on the diagnosis and management of the gastrointestinal and hepatic toxicities of immune checkpoint inhibitors, cited here as the existence of a formal practice statement on this problem rather than for any figure.',
      ] },
    limitations: ['easy-label-presentation-and-the-record-are-authored',
      'easy-label-controls-are-recording-and-escalation-only',
      'easy-label-exclusion-first-is-not-treatment-later'],
  },
  patient: {
    ageYears: 63, sex: 'male', heightCm: 178, weightKg: 81, asaClass: 3,
    diagnosis: 'Authored diarrhoea during checkpoint-inhibitor treatment with competing causes not excluded',
    procedure: 'exclusion recording, open-question recording, parallel escalation, evidence-boundary review, and handoff practice',
    comorbidities: ['Metastatic melanoma on checkpoint-inhibitor treatment in the supplied record; admission with a chest infection three weeks ago'],
    medications: ['All sampling, immunosuppression, and continuation decisions remain qualified-team work'],
    allergies: ['No known drug allergies'], fasting: 'Not relevant to the acute oncology assessment fixture',
    baseline: { heartRateBpm: 92, meanArterialMmHg: 87, strokeVolumeMl: 62,
      hemoglobinGPerDl: 12.2, bloodVolumeMl: 5_100, coreTemperatureC: 36.8,
      arterialStiffness: 1.1, baroreflexGain: 0.9, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Comfortable at rest and speaking in full sentences in the supplied fixture' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 520, respiratoryRateBpm: 12,
      freshGasFlowLPerMin: 10, delivering: false } }, formulary: [],
  timeline: [
    { id: 'easy-label-presentation', type: 'narrative', target: 'easy-label', atTick: 0,
      severity: 'warning', message: 'A 63-year-old man is in the acute oncology assessment area after four cycles of checkpoint-inhibitor treatment for metastatic melanoma. For four days he has opened his bowels six times a day more than his baseline, with cramping and no blood. Authored observations are heart rate 92/min, blood pressure 118/72 mmHg, respiratory rate 18/min, temperature 36.8 C, and oxygen saturation 97% in air. No microbiological studies have been reported. A colleague says this is immune colitis and suggests starting immunosuppression now. A discharge summary sits unopened in his record.' },
    { id: 'easy-label-evidence', type: 'narrative', target: 'easy-label-evidence', atTick: 0,
      severity: 'warning', message: 'Both halves of this are true at once and the lesson is what to do about that. Guidelines universally recommend corticosteroids as initial management for this colitis at grade 2 or above, so treating is indicated and delay is not free. And this colitis is a diagnosis of exclusion: it requires the exclusion of competing causes including cytomegalovirus and Clostridioides difficile, whose presentations are described as indistinguishable from it, patients who have it are at increased risk of infectious colitis, and microbiological studies should be performed first to exclude the common infectious causes before immunosuppression. So the treatment for the likely answer is the thing that makes the competing answer worse. That is not the ordinary cost of being wrong; it is a wrong answer whose treatment removes the chance of being cheaply right. The way out is not to pick one. It is to notice that only one of these two decisions has to wait for a result.' },
    { id: 'easy-label-boundary', type: 'narrative', target: 'easy-label-boundary', atTick: 0,
      severity: 'warning', message: 'Record that the label is a diagnosis of exclusion; record what has not been excluded; escalate so the samples and the treatment decision start together; record bounded qualified-team treatment intent; and review the boundaries and their certainty in both directions. Starting immunosuppression now on the obvious label, waiting for every result before telling anyone, excluding infection because he has no fever, and concluding that four cycles make this the drug are all refused. No drug, dose, route, grade threshold, product, or escalation agent is exposed, the learner acquires and interprets no test, and every result and record is supplied. After elapsed simulated time the discharge summary already in his record surfaces an admission and a course of antibiotics three weeks ago, while nothing about him changes, because what moves is the strength of the competing cause rather than the patient. The treating team answers only if it was called, with gastroenterology present, takes ownership of the samples and the treatment decision together rather than in a queue, and states that which of the two matters is decided by results that do not exist yet. No diagnosis, individualized risk, treatment causality, eligibility, disposition, prognosis, or outcome is reported, and the rehearsal ends whatever his trajectory. After another elapsed interval, hand off the open question rather than a settled label. The controls do not take history; examine; acquire or interpret microbiology, endoscopy, imaging, or another test; diagnose; select or deliver any drug, dose, route, product, or immunosuppressant; perform a procedure; determine eligibility, disposition, or prognosis; or predict response, survival, or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'easy-label-exclusion', objectiveId: 'recognize-oncology-easy-label-a-diagnosis-of-exclusion', question: 'The label was probably right. What had still not been done to it?' },
    { id: 'easy-label-open', objectiveId: 'record-oncology-easy-label-what-remains-open', question: 'What did you write down that was still an open question?' },
    { id: 'easy-label-parallel', objectiveId: 'activate-oncology-easy-label-both-at-once', question: 'You were offered a choice between treating and testing. What was wrong with the question?' },
    { id: 'easy-label-treatment', objectiveId: 'recognize-oncology-easy-label-a-treatment-that-worsens-the-alternative', question: 'Being wrong usually just means not helping. Why was it worse than that here?' },
    { id: 'easy-label-intent', objectiveId: 'record-oncology-easy-label-bounded-qualified-intent', question: 'Where does your part of this stop, and what did you hand over?' },
    { id: 'easy-label-boundaries', objectiveId: 'review-oncology-easy-label-boundaries-that-pull-apart', question: 'Treat at grade 2, and exclude infection first. How do both survive?' },
    { id: 'easy-label-handoff', objectiveId: 'handoff-oncology-easy-label-an-answer-nobody-reached', question: 'What had to travel so the next person did not inherit a diagnosis nobody made?' },
  ] },
};
