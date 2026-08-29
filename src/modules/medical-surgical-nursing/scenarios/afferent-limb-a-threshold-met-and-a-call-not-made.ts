/** Three criteria met, documented, and a call that keeps not being made. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const AFFERENT_LIMB_A_THRESHOLD_MET_AND_A_CALL_NOT_MADE: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'afferent-limb-a-threshold-met-and-a-call-not-made', version: '0.1.0', maturity: 'preview',
    title: 'A threshold met, and a call not made', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 7, difficulty: 'intermediate', objectives: [
      { id: 'reconcile-medical-surgical-nursing-afferent-limb-criteria-already-met', statement: 'Record criteria that are already met.', measure: 'A respiratory rate of 30, a new oxygen requirement, and a systolic pressure of 88 were recorded as met activation criteria against a local policy requiring one, without learner examination, diagnosis, or treatment selection.' },
      { id: 'recognize-medical-surgical-nursing-afferent-limb-obstacles-that-are-not-clinical', statement: 'Name the obstacles as non-clinical.', measure: 'That the team attended yesterday and found nothing, that they are occupied elsewhere, and that the covering doctor is in theatre were recorded plainly as reasons operating on the decision, none of which appears among the criteria or constitutes a clinical finding.' },
      { id: 'activate-medical-surgical-nursing-afferent-limb-a-call-on-the-threshold', statement: 'Call on the threshold, without seeking permission.', measure: 'The response team was called directly on the met criteria, and calling the covering doctor instead, waiting for the ward round, documenting without calling, and seeking permission were each refused.' },
      { id: 'record-medical-surgical-nursing-afferent-limb-a-concern-stated-to-a-person', statement: 'State the concern to a person, in words.', measure: 'Which criteria are met, what has changed since yesterday, and what is being asked for were stated to the person on the other end of the call rather than softened into a question about availability.' },
      { id: 'review-medical-surgical-nursing-afferent-limb-boundaries-and-their-certainty', statement: 'Review the boundaries and their certainty.', measure: 'That afferent-limb failure appears in roughly a fifth to a third of reviewed adverse events, that staff believed the situation was under control in about half of missed activations, that physician-first calling was the more frequent action in about three quarters, and that these are observational system findings rather than predictions about this patient were all kept explicit.' },
      { id: 'handoff-medical-surgical-nursing-afferent-limb-a-call-made-on-a-threshold', statement: 'Hand off a call made on a threshold.', measure: 'The handoff preserved which criteria were met and when, that the call was made on the threshold rather than on permission, and the obstacles as recorded, with whether the call proved necessary left explicitly beside the point.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0', sources: [
        'Difonzo M. Performance of the Afferent Limb of Rapid Response Systems in Managing Deteriorating Patients: A Systematic Review. Crit Care Res Pract. 2019;2019:6902420. Afferent limb failure in 22.8% and delayed calls in 30.2% of adverse events in the studies reviewed; staff believed the situation was under control in 51.8% of missed activations; 75.9% of nurses called a physician first rather than the rapid response team.',
        'Johnston MJ, Arora S, King D, et al. A systematic review to identify the factors that affect failure to rescue and escalation of care in surgery. Surgery. 2015;157(4):752-763. Failure-to-rescue incidence 8.0% to 16.9%; delayed escalation reported in 20.7% to 47.1% of cases.',
      ] },
    limitations: ['afferent-limb-presentation-and-team-response-are-authored',
      'afferent-limb-controls-are-recording-and-calling-only',
      'afferent-limb-system-findings-are-not-causal-claims'],
  },
  patient: {
    ageYears: 73, sex: 'male', heightCm: 172, weightKg: 71, asaClass: 3,
    diagnosis: 'Authored ward deterioration meeting local response-team activation criteria, with the call obstructed by social rather than clinical factors',
    procedure: 'calm criteria recording, obstacle naming, escalation on a threshold, and handoff practice',
    comorbidities: ['Chronic kidney disease; day 5 after emergency laparotomy'],
    medications: ['All prescribing, investigation, and treatment decisions remain qualified-team work'],
    allergies: ['No known drug allergies'], fasting: 'Not relevant to the nursing fixture',
    baseline: { heartRateBpm: 118, meanArterialMmHg: 65, strokeVolumeMl: 54,
      hemoglobinGPerDl: 9.8, bloodVolumeMl: 4_700, coreTemperatureC: 37.8,
      arterialStiffness: 1.3, baroreflexGain: 0.5, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Alert, anxious, speaking in short phrases in the supplied fixture' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.28, tidalVolumeMl: 440, respiratoryRateBpm: 12,
      freshGasFlowLPerMin: 10, delivering: false } }, formulary: [],
  timeline: [
    { id: 'afferent-limb-presentation', type: 'narrative', target: 'afferent-limb', atTick: 0,
      severity: 'warning', message: 'A 73-year-old is five days after an emergency laparotomy. Authored observations are respiratory rate 30/min, blood pressure 88/54 mmHg, oxygen saturation 93% on newly required supplemental oxygen, pulse 118/min, temperature 37.8 C. He is alert, anxious, and speaking in short phrases. Three of the five local response-team activation criteria are met, the policy requires one, and all three are already documented. The recognition has already happened, and it was correct.' },
    { id: 'afferent-limb-evidence', type: 'narrative', target: 'afferent-limb-evidence', atTick: 0,
      severity: 'warning', message: 'The charge nurse says the team came yesterday and it was nothing, and that they are busy with an arrest downstairs. The covering doctor is in theatre. None of that is a clinical finding and none of it appears among the criteria. This is the part of escalation that fails: in a systematic review of rapid response systems, afferent-limb failure was documented in 22.8% of adverse events and delayed calls in 30.2%, staff believed the situation was under control in 51.8% of missed activations, and 75.9% of nurses called a physician first rather than the response team. In failure-to-rescue reviews, delayed escalation appears in 20.7% to 47.1% of cases. The knowledge is rarely the missing thing.' },
    { id: 'afferent-limb-boundary', type: 'narrative', target: 'afferent-limb-boundary', atTick: 0,
      severity: 'warning', message: 'Record the met criteria as they stand; record the obstacles plainly, because naming them is how they stop operating silently; call the response team directly on the threshold; state the concern to the person on the other end in words, naming which criteria are met and what is being asked for; review the boundaries and their certainty; and increase observation with its reason recorded. Calling the covering doctor instead of the team, waiting for the ward round, documenting the concern without calling, and asking permission to call are all refused. The criteria are the authorisation and no permission is required or sought; a threshold that needs someone senior to agree is not a threshold. No drug, dose, route, fluid, oxygen setting, investigation, or procedure is exposed, and the learner performs no examination and orders no test. Stating a concern before the call is placed is refused, because a concern written in the notes is not a concern stated to a person. After elapsed simulated time with no call made, the charge nurse repeats the discouragement; nothing about the patient changes, and the only thing that grows is the cost of making the call. If the team is called they arrive after a short interval, record that the criteria were met on arrival, and take over assessment and treatment. Nothing rescues an uncalled patient in this rehearsal. The patient deliberately does not deteriorate, because a deterioration would make this a lesson about recognition, and recognition has already happened correctly. Whether the call proves necessary is not what makes it correct, and the authored stop is not evidence that a delay caused harm. No individualized effect, treatment causality, cause, eligibility, disposition, prognosis, or outcome is reported. Qualified teams retain assessment, investigation, prescribing, and every treatment decision. After another elapsed interval, hand off which criteria were met and when, that the call was made on the threshold, the obstacles as recorded, disposition, and outcome uncertainty. The controls do not take history; examine; acquire or interpret observations, laboratory, imaging, or another test; diagnose; select or deliver a drug, dose, route, fluid, oxygen, or device; perform a procedure; determine eligibility, disposition, or prognosis; or predict response, cause, survival, or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'afferent-limb-trajectory', objectiveId: 'reconcile-medical-surgical-nursing-afferent-limb-criteria-already-met', question: 'What had already been established before this rehearsal began?' },
    { id: 'afferent-limb-recognition', objectiveId: 'recognize-medical-surgical-nursing-afferent-limb-obstacles-that-are-not-clinical', question: 'Which of the reasons not to call was a clinical finding?' },
    { id: 'afferent-limb-activation', objectiveId: 'activate-medical-surgical-nursing-afferent-limb-a-call-on-the-threshold', question: 'Whose agreement was needed before the call could be made?' },
    { id: 'afferent-limb-statement', objectiveId: 'record-medical-surgical-nursing-afferent-limb-a-concern-stated-to-a-person', question: 'What is the difference between recording a concern and stating one?' },
    { id: 'afferent-limb-boundaries', objectiveId: 'review-medical-surgical-nursing-afferent-limb-boundaries-and-their-certainty', question: 'What do the escalation-failure figures describe, and what do they not?' },
    { id: 'afferent-limb-handoff', objectiveId: 'handoff-medical-surgical-nursing-afferent-limb-a-call-made-on-a-threshold', question: 'If the team finds nothing again, was the call wrong?' },
  ] },
};
