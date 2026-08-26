/** Autonomic-dysreflexia recognition and bounded trigger transition. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const AUTONOMIC_DYSREFLEXIA_AUTHORED_TRIGGER: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'autonomic-dysreflexia-authored-trigger', version: '0.1.0', maturity: 'draft',
    title: 'Autonomic dysreflexia with an authored trigger', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 6, difficulty: 'advanced', objectives: [
      { id: 'reconcile-neurology-autonomic-dysreflexia-lesion-baseline-pressure-symptoms-rhythm-and-whole-patient', statement: 'Reconcile the lesion, usual pressure, acute symptoms, rhythm, and whole patient.', measure: 'The T4 injury, verified 98/62 mmHg baseline, severe relative pressure rise, headache, flushing, sweating, piloerection, and bradycardia were connected without learner history, examination, monitoring, or diagnosis.' },
      { id: 'recognize-neurology-autonomic-dysreflexia-pattern-without-closing-alternatives-or-definitive-diagnosis', statement: 'Recognize the autonomic-dysreflexia pattern without closing alternatives or definitive diagnosis.', measure: 'The baseline-relative syndrome triggered urgent action while intracranial, cardiac, medication, pain, infection, urinary, bowel, skin, and other causes remained open.' },
      { id: 'activate-neurology-autonomic-dysreflexia-upright-support-monitoring-and-qualified-ownership', statement: 'Activate upright support, frequent surveillance, and qualified spinal-injury ownership.', measure: 'Upright positioning, lowered legs where possible, loosened external constriction, frequent pressure and pulse checks, and qualified help were recorded without learner medication or procedure selection.' },
      { id: 'review-and-release-neurology-autonomic-dysreflexia-supplied-external-urinary-trigger-within-role', statement: 'Review and release the supplied visible external urinary trigger within role.', measure: 'A urinary-first survey found and released one visible external drainage-tubing kink without catheter insertion, irrigation, replacement, medication, or sole-cause closure.' },
      { id: 'reassess-neurology-autonomic-dysreflexia-strict-pressure-pulse-symptom-and-trigger-transition', statement: 'At a strict later report, reassess pressure, pulse, symptoms, and the trigger transition.', measure: 'The authored 108/66 mmHg, 64/min, easing-headache, and resumed-drainage state was integrated without claiming individualized effect, durable resolution, complication exclusion, or outcome.' },
      { id: 'handoff-neurology-autonomic-dysreflexia-baseline-triggers-recurrence-complications-prevention-and-active-risk', statement: 'After another elapsed interval, hand off baseline, triggers, recurrence, complications, prevention, and active risk.', measure: 'The handoff preserved serial pressure and pulse, possible additional triggers, recurrence, complication review, medication boundaries, education, prevention, disposition, and outcome uncertainty.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0', sources: [
        'Consortium for Spinal Cord Medicine. Evaluation and Management of Autonomic Dysreflexia and Other Autonomic Dysfunctions: Preventing the Highs and Lows. J Spinal Cord Med. 2021;44(4):631-683. doi:10.1080/10790268.2021.1925058.',
      ] },
    limitations: ['autonomic-dysreflexia-lesion-baseline-trigger-vitals-response-and-later-state-are-authored',
      'autonomic-dysreflexia-controls-reconcile-recognize-support-review-release-reassess-and-handoff-only',
      'no-live-spinal-injury-exam-diagnosis-catheter-technique-drug-procedure-or-outcome'],
  },
  patient: {
    ageYears: 36, sex: 'male', heightCm: 178, weightKg: 76, asaClass: 3,
    diagnosis: 'Authored suspected autonomic-dysreflexia pattern with an external urinary trigger',
    procedure: 'calm pattern recognition, trigger transition, reassessment, and handoff practice',
    comorbidities: ['Declared chronic complete T4 spinal cord injury', 'Indwelling suprapubic urinary drainage system'],
    medications: ['Exact medicines and recent vasopressor or antihypotensive exposure remain qualified-team work'],
    allergies: ['No known drug allergies'], fasting: 'Not applicable to the rehabilitation fixture',
    baseline: { heartRateBpm: 48, meanArterialMmHg: 130, strokeVolumeMl: 70,
      hemoglobinGPerDl: 14.1, bloodVolumeMl: 5_200, coreTemperatureC: 36.8,
      arterialStiffness: 1.1, baroreflexGain: 0.5, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Alert, conversant, and handling secretions in the supplied fixture' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 420, respiratoryRateBpm: 10,
      freshGasFlowLPerMin: 0.5, delivering: false } }, formulary: [],
  timeline: [
    { id: 'autonomic-dysreflexia-authored-trigger-presentation', type: 'narrative', target: 'autonomic-dysreflexia-authored-trigger-transition', atTick: 0,
      severity: 'critical', message: 'A 36-year-old man with a declared chronic complete T4 spinal cord injury arrives well and conversant for a rehabilitation visit. His verified usual seated blood pressure is 98/62 mmHg and heart rate 68/min. Minutes after a routine chair transfer he reports a sudden pounding headache. Supplied observation shows facial flushing and sweating above the lesion with piloerection below it. Authored monitor state is sinus bradycardia 48/min, BP 178/106 mmHg (MAP 130), RR 16/min, pulse-coherent room-air SpO2 98%, and T 36.8°C. There is no authored fever, hypoxemia, chest pain, new focal cranial finding, witnessed seizure, trauma, or loss of consciousness.' },
    { id: 'autonomic-dysreflexia-authored-trigger-evidence', type: 'narrative', target: 'autonomic-dysreflexia-authored-trigger-transition', atTick: 0,
      severity: 'warning', message: 'The acute pressure is 80 mmHg above his verified usual systolic pressure in a person with a T4 lesion, with headache, flushing, sweating, piloerection, and bradycardia. This supports urgent autonomic-dysreflexia-pattern recognition but does not make a learner diagnosis or exclude intracranial, cardiac, medication, pain, infection, urinary, bowel, skin, equipment, or other causes. Qualified assessment and serial pressure, pulse, neurological, cardiopulmonary, abdominal, urinary, bowel, skin, medication, and complication review remain active.' },
    { id: 'autonomic-dysreflexia-authored-trigger-boundary', type: 'narrative', target: 'autonomic-dysreflexia-authored-trigger-transition-boundary', atTick: 0,
      severity: 'warning', message: 'Reconcile the lesion, verified baseline, symptoms, pressure, pulse, and whole patient; recognize the syndrome pattern without definitive closure; immediately record upright positioning with legs lowered where possible, loosen external constriction, frequent pressure and pulse surveillance, and qualified spinal-injury, medical, nursing, urology, emergency, and complication ownership; then survey supplied triggers beginning with the urinary system. The declared indwelling suprapubic drainage system has no urine in its bag for 2 hours. A supplied external inspection finds drainage tubing trapped beneath the chair rail. The learner may release only this visible external kink; no insertion, disconnection, irrigation, replacement, catheterization, bowel examination, or other procedure is exposed. Upright support produces the authored intermediate monitor state BP 166/98 mmHg (MAP 121) and sinus rate 50/min. Releasing the visible kink produces the authored discrete transition to BP 124/76 mmHg (MAP 92) and sinus rate 60/min with drainage resuming. At a strict fixed later reassessment, BP is 108/66 mmHg (MAP 80), sinus rate 64/min, and headache is easing. No sole cause, individualized treatment effect, durable resolution, second-trigger exclusion, complication exclusion, recurrence, disposition, prognosis, or outcome is reported. The qualified team retains rapid short-duration antihypertensive consideration, contraindication review, invasive bladder or bowel care, further diagnostics, and emergency escalation if severe pressure persists. After another elapsed interval, hand off baseline, serial pressure and pulse, symptoms, known and possible triggers, recurrence, complications, medication and procedure boundaries, education, prevention, follow-up, disposition, and outcome uncertainty. The controls do not take history; examine; accept a real lesion or baseline; acquire or interpret monitoring, ECG, urine, bladder, blood, imaging, or another test; diagnose; select or deliver a drug, dose, route, access, oxygen, fluid, or device; insert, disconnect, irrigate, replace, or manipulate a catheter; perform bowel care; perform another procedure; determine disposition or prognosis; or predict response, recurrence, survival, or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'autonomic-dysreflexia-trajectory', objectiveId: 'reconcile-neurology-autonomic-dysreflexia-lesion-baseline-pressure-symptoms-rhythm-and-whole-patient', question: 'Which lesion, baseline, pressure, symptom, rhythm, and whole-patient findings established the acute trajectory?' },
    { id: 'autonomic-dysreflexia-recognition', objectiveId: 'recognize-neurology-autonomic-dysreflexia-pattern-without-closing-alternatives-or-definitive-diagnosis', question: 'Why did the baseline-relative pattern require urgent action without closing the diagnosis or alternatives?' },
    { id: 'autonomic-dysreflexia-support', objectiveId: 'activate-neurology-autonomic-dysreflexia-upright-support-monitoring-and-qualified-ownership', question: 'Which immediate support, surveillance, and qualified owners needed to begin together?' },
    { id: 'autonomic-dysreflexia-trigger', objectiveId: 'review-and-release-neurology-autonomic-dysreflexia-supplied-external-urinary-trigger-within-role', question: 'What made the supplied external tubing kink a bounded trigger action rather than catheter technique?' },
    { id: 'autonomic-dysreflexia-reassessment', objectiveId: 'reassess-neurology-autonomic-dysreflexia-strict-pressure-pulse-symptom-and-trigger-transition', question: 'What did the strict pressure, pulse, symptom, and drainage report establish without proving durable resolution or sole causality?' },
    { id: 'autonomic-dysreflexia-handoff', objectiveId: 'handoff-neurology-autonomic-dysreflexia-baseline-triggers-recurrence-complications-prevention-and-active-risk', question: 'Which baseline, trigger, recurrence, complication, prevention, disposition, and outcome risks required handoff?' },
  ] },
};
