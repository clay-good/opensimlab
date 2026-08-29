/** An onset field, and nobody in the building who can honestly fill it. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const LAST_KNOWN_WELL_A_TIME_NOBODY_CAN_SUPPLY: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'last-known-well-a-time-nobody-can-supply', version: '0.1.0', maturity: 'preview',
    title: 'A time nobody can supply', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 7, difficulty: 'intermediate', objectives: [
      { id: 'reconcile-medical-surgical-nursing-last-known-well-a-bound-and-not-an-onset', statement: 'Record last known well as a bound.', measure: 'The 22:40 nursing entry was recorded as the last documented interaction and explicitly as a bound, meaning the deficit began at some point after it, without learner examination, diagnosis, or treatment selection.' },
      { id: 'recognize-medical-surgical-nursing-last-known-well-an-uncertain-account-kept-uncertain', statement: 'Keep an uncertain account uncertain.', measure: 'The care assistant’s recollection of about three o’clock was recorded in her words in its own field and marked uncertain, and entering it or the bound into the onset field was refused because a timestamp cannot later be distinguished from a witnessed observation.' },
      { id: 'activate-medical-surgical-nursing-last-known-well-on-the-deficit-not-the-clock', statement: 'Activate on the deficit, not the clock.', measure: 'The stroke pathway was activated on a new focal deficit without waiting for a time to firm up, and treating an unknown onset as a reason to stand down and waiting for the family to supply a time were both refused.' },
      { id: 'record-medical-surgical-nursing-last-known-well-what-the-unknown-changes', statement: 'State what the unknown does and does not change.', measure: 'The record stated that the unknown changes which assessments the qualified team will use rather than the deficit, the activation, or the observations, because an unwitnessed onset is assessed by imaging rather than by a clock.' },
      { id: 'review-medical-surgical-nursing-last-known-well-boundaries-and-their-certainty', statement: 'Review the boundaries and their certainty.', measure: 'That last known well is a bound rather than an onset, that a randomised trial in unknown-onset deficits assessed eligibility by imaging as a surrogate for lesion age rather than by a remembered time, and that the trial describes a population rather than this patient were all kept explicit.' },
      { id: 'handoff-medical-surgical-nursing-last-known-well-an-empty-field-handed-over-empty', statement: 'Hand over the empty field as empty.', measure: 'The handoff preserved 22:40 labelled as a bound, the recollection marked uncertain, that activation rested on the deficit, and that the onset field is empty because nobody knows what belongs in it, with eligibility and outcome left uncertified.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0', sources: [
        'Thomalla G, Simonsen CZ, Boutitie F, et al. MRI-guided thrombolysis for stroke with unknown time of onset (WAKE-UP). N Engl J Med. 2018;379(7):611-622. doi:10.1056/NEJMoa1804355. Randomised trial in 503 patients with stroke of unknown onset; favourable outcome 53.3% versus 41.8%, odds ratio 1.61 (95% CI 1.09-2.36), P=0.02. Eligibility rested on imaging as a surrogate for lesion age rather than on a remembered time of onset.',
        'Difonzo M. Performance of the Afferent Limb of Rapid Response Systems in Managing Deteriorating Patients: A Systematic Review. Crit Care Res Pract. 2019;2019:6902420. At least one vital sign was missing in 77% of patients with adverse events, supporting the general finding that gaps in observation precede unrecognised deterioration.',
      ] },
    limitations: ['last-known-well-timeline-and-assessment-response-are-authored',
      'last-known-well-controls-are-recording-and-activation-only',
      'last-known-well-trial-evidence-describes-a-population'],
  },
  patient: {
    ageYears: 76, sex: 'female', heightCm: 162, weightKg: 66, asaClass: 3,
    diagnosis: 'Authored unwitnessed new focal deficit with an onset time nobody present can supply',
    procedure: 'calm timeline recording, uncertainty preservation, activation, and handoff practice',
    comorbidities: ['Atrial fibrillation; admitted four days ago with a fractured wrist'],
    medications: ['All prescribing, imaging, eligibility, and treatment decisions remain qualified-team work'],
    allergies: ['No known drug allergies'], fasting: 'Not relevant to the nursing fixture',
    baseline: { heartRateBpm: 86, meanArterialMmHg: 111, strokeVolumeMl: 64,
      hemoglobinGPerDl: 12.2, bloodVolumeMl: 4_500, coreTemperatureC: 36.7,
      arterialStiffness: 1.4, baroreflexGain: 0.5, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Awake and protecting the airway in the supplied fixture' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 440, respiratoryRateBpm: 12,
      freshGasFlowLPerMin: 10, delivering: false } }, formulary: [],
  timeline: [
    { id: 'last-known-well-presentation', type: 'narrative', target: 'last-known-well', atTick: 0,
      severity: 'warning', message: 'A 76-year-old with atrial fibrillation, admitted four days ago with a fractured wrist, is found at 06:10 with new right-sided weakness and word-finding difficulty. Authored observations are pulse 86/min, blood pressure 158/88 mmHg, respiratory rate 16/min, oxygen saturation 96% in air, temperature 36.7 C, blood glucose 6.2 mmol/L. She is awake and protecting her airway. The last documented interaction is a nursing entry at 22:40. A care assistant thinks she said hello at about three but is not certain.' },
    { id: 'last-known-well-evidence', type: 'narrative', target: 'last-known-well-evidence', atTick: 0,
      severity: 'warning', message: 'The onset time governs what happens next and nobody in this building knows it. The interval containing it is seven and a half hours wide. The chart offers a box labelled onset time, and anything written in that box becomes, for every later reader, indistinguishable from a time somebody observed. Last known well is not that time: it is a bound, meaning the deficit began at some point after 22:40, which is true and useful and is not an onset. The recollection is not that time either: pressed on it, the care assistant moves it by an hour and says she would not swear to it. An unknown onset is also not a reason to stand down. A randomised trial enrolled exactly this population, patients whose deficits began at an unknown time, and found a higher rate of favourable outcome in the treated group, with eligibility assessed by imaging as a surrogate for lesion age rather than by a remembered clock time.' },
    { id: 'last-known-well-boundary', type: 'narrative', target: 'last-known-well-boundary', atTick: 0,
      severity: 'warning', message: 'Record last known well as the last documented interaction and label it a bound rather than an onset; record the care assistant’s account in her words in its own field and marked uncertain, beside the timeline rather than inside it; activate the stroke pathway on the deficit, because activation depends on a new focal deficit and not on knowing when it started; state what the unknown changes and what it does not; review the boundaries and their certainty; and arrange timed neurological observation, because from this point the times are knowable and worth recording precisely. Entering the recollection in the onset field, entering the bound in the onset field, treating an unknown onset as a reason to offer nothing, and waiting for the family to supply a time are all refused. Stating the consequences of the unknown before the bound is recorded is refused as premature. No drug, dose, route, fluid, imaging request, interpretation, eligibility determination, or procedure is exposed; the learner performs no examination beyond observation and orders no test. After elapsed simulated time somebody presses the care assistant for a firmer time; she moves it and becomes less willing to say it is uncertain, and nothing about the record has improved. If the pathway is activated, the stroke team assesses after a short interval, records the bound as a bound, keeps the recollection separate and uncertain, and proceeds on imaging-based assessment; the eligibility decision is theirs and is not reported here. The deficit does not change during this rehearsal, because no amount of looking at her will supply the missing hours, and a deficit that evolved would let a learner treat the evolution as the answer. No individualized effect, treatment causality, onset time, eligibility, disposition, prognosis, or outcome is reported. Qualified teams retain assessment, imaging, eligibility, prescribing, and every treatment decision. After another elapsed interval, hand off the bound, the uncertain recollection, the basis for activation, the empty onset field, disposition, and outcome uncertainty. The controls do not take history beyond the recollection already offered; examine beyond observation; acquire or interpret laboratory, imaging, or another test; diagnose; determine eligibility; select or deliver a drug, dose, route, fluid, oxygen, or device; perform a procedure; determine disposition or prognosis; or predict response, survival, or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'last-known-well-trajectory', objectiveId: 'reconcile-medical-surgical-nursing-last-known-well-a-bound-and-not-an-onset', question: 'What does 22:40 actually tell you?' },
    { id: 'last-known-well-recognition', objectiveId: 'recognize-medical-surgical-nursing-last-known-well-an-uncertain-account-kept-uncertain', question: 'What happens to an uncertain recollection once it is a timestamp?' },
    { id: 'last-known-well-activation', objectiveId: 'activate-medical-surgical-nursing-last-known-well-on-the-deficit-not-the-clock', question: 'What did activation actually depend on?' },
    { id: 'last-known-well-consequences', objectiveId: 'record-medical-surgical-nursing-last-known-well-what-the-unknown-changes', question: 'What does the missing time change, and what does it leave untouched?' },
    { id: 'last-known-well-boundaries', objectiveId: 'review-medical-surgical-nursing-last-known-well-boundaries-and-their-certainty', question: 'How was eligibility assessed in the trial, and by whom here?' },
    { id: 'last-known-well-handoff', objectiveId: 'handoff-medical-surgical-nursing-last-known-well-an-empty-field-handed-over-empty', question: 'Why is an empty field the honest entry?' },
  ] },
};
