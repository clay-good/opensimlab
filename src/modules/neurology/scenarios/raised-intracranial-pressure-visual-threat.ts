/** Subacute raised intracranial pressure with papilledema and a worsening visual field. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const RAISED_INTRACRANIAL_PRESSURE_VISUAL_THREAT: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'raised-intracranial-pressure-visual-threat', version: '0.1.0', maturity: 'preview',
    title: 'Raised intracranial pressure with visual threat', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 7, difficulty: 'advanced', objectives: [
      { id: 'reconcile-neurology-raised-icp-headache-visual-tinnitus-diplopia-and-whole-patient', statement: 'Reconcile the headache, visual, tinnitus, diplopia, neurological, physiological, and whole-patient clock.', measure: 'The subacute raised-pressure syndrome and urgent visual threat were recognized without learner history, examination, diagnosis, or demographic shortcut.' },
      { id: 'activate-neurology-raised-icp-qualified-neurology-neuro-ophthalmology-imaging-and-procedure-ownership', statement: 'Activate qualified neurological, neuro-ophthalmic, imaging, and procedure ownership.', measure: 'Named owners covered vision, papilledema confirmation, secondary causes, imaging, LP safety, deterioration, and rescue without learner testing or procedures.' },
      { id: 'review-neurology-raised-icp-confirmed-papilledema-visual-function-and-pseudopapilledema-boundary', statement: 'Review confirmed papilledema, visual function, and the pseudopapilledema boundary.', measure: 'Specialist fundus, acuity, color, pupil, motility, OCT, photography, and perimetry reports were integrated without learner eye examination or interpretation.' },
      { id: 'review-neurology-raised-icp-mri-venography-lp-secondary-cause-and-diagnostic-boundary', statement: 'Review supplied MRI, venography, LP, secondary-cause, and diagnostic boundaries.', measure: 'Mass, hydrocephalus, meningeal, and venous-thrombosis exclusions plus raised opening pressure and normal CSF were integrated without relying on one value or claiming a learner diagnosis.' },
      { id: 'review-neurology-raised-icp-strict-later-worsening-visual-field-and-imminent-sight-threat', statement: 'At a strict later report, recognize worsening visual field as an imminent sight threat.', measure: 'Objective field deterioration triggered urgent qualified sight-preservation escalation despite stable acuity and neurology, without treatment or outcome claims.' },
      { id: 'handoff-neurology-raised-icp-vision-rescue-cause-disease-headache-follow-up-and-active-risk', statement: 'After another elapsed interval, hand off vision rescue, cause, disease, headache, follow-up, and active risk.', measure: 'The handoff preserved procedure choice, underlying-cause review, disease modification, headache care, visual surveillance, recurrence, disposition, prognosis, and outcome.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Mollan SP, Davies B, Silver NC, et al. Idiopathic intracranial hypertension: consensus guidelines on management. J Neurol Neurosurg Psychiatry. 2018;89:1088-1100. doi:10.1136/jnnp-2017-317440.',
        'Wakerley BR, Mollan SP, Sinclair AJ. Idiopathic intracranial hypertension: Update on diagnosis and management. Clin Med (Lond). 2020;20:384-388. doi:10.7861/clinmed.2020-0232.',
      ] },
    limitations: ['raised-icp-clock-eye-exam-fields-imaging-lp-care-and-later-state-are-authored',
      'raised-icp-controls-reconcile-activate-review-reassess-and-handoff-only',
      'no-live-raised-icp-exam-test-imaging-lp-diagnosis-drug-procedure-or-outcome'],
  },
  patient: {
    ageYears: 31, sex: 'female', heightCm: 168, weightKg: 102, asaClass: 3,
    diagnosis: 'Authored raised intracranial pressure with visual-threat pattern',
    procedure: 'calm papilledema, secondary-cause, visual-trajectory, and rescue handoff practice',
    comorbidities: ['Recent 11 kg weight gain over 8 months', 'No known thrombotic disorder'],
    medications: ['Exposure and secondary-cause medication review remains qualified-team work'],
    allergies: ['No known drug allergies'], fasting: 'Not relevant to the authored assessment',
    baseline: { heartRateBpm: 82, meanArterialMmHg: 96, strokeVolumeMl: 70,
      hemoglobinGPerDl: 13.4, bloodVolumeMl: 5_200, coreTemperatureC: 36.8,
      arterialStiffness: 1.0, baroreflexGain: 0.8, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Alert, conversant, protecting the airway, and breathing comfortably' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'],
    airwayDevice: 'facemask', ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 440,
      respiratoryRateBpm: 16, freshGasFlowLPerMin: 0.5, delivering: false } }, formulary: [],
  timeline: [
    { id: 'raised-intracranial-pressure-visual-threat-presentation', type: 'narrative',
      target: 'raised-intracranial-pressure-visual-threat-reassessment', atTick: 0,
      severity: 'critical', message: 'A 31-year-old previously independent woman reports 5 weeks of a new daily pressure-like headache, worse on waking and with coughing, plus pulse-synchronous tinnitus and seconds-long greying of vision when standing. Horizontal diplopia began 3 days ago. She is alert and oriented at GCS 15 with fluent speech, symmetric antigravity limbs, no seizure, fever, neck stiffness, or persistent focal motor or sensory deficit. A qualified examination reports a left abduction deficit consistent with a sixth-nerve palsy and otherwise intact supplied cranial and limb function. T 36.8°C, HR 82/min, RR 16/min, BP 132/78 mmHg (MAP 96), pulse-coherent room-air SpO2 99%, warm extremities, and refill 2 seconds are supplied.' },
    { id: 'raised-intracranial-pressure-visual-threat-evidence', type: 'narrative',
      target: 'raised-intracranial-pressure-visual-threat-reassessment', atTick: 0,
      severity: 'warning', message: 'A qualified neuro-ophthalmologist confirms bilateral papilledema rather than pseudopapilledema using dilated stereoscopic examination, fundus photography, and OCT. Best-corrected acuity is 20/20 in each eye, color plates are full, pupils are equal without a relative afferent defect, and automated perimetry has reliable enlarged blind spots with early inferior-nasal depression in both eyes. These specialist reports establish optic-nerve-head swelling and visual function for this fixture; the learner does not examine eyes, grade papilledema, acquire images, perform OCT or fields, or interpret raw studies.' },
    { id: 'raised-intracranial-pressure-visual-threat-boundary', type: 'narrative',
      target: 'raised-intracranial-pressure-visual-threat-reassessment-boundary', atTick: 0,
      severity: 'warning', message: 'Qualified contrast brain MRI reports no mass, hydrocephalus, structural displacement, abnormal meningeal enhancement, acute infarct, or hemorrhage; MR venography reports no cerebral venous sinus thrombosis. Mild posterior-globe flattening and perioptic CSF prominence support raised pressure but are not diagnostic alone. After qualified imaging and safety review, a properly positioned lateral-decubitus LP already reports opening pressure 34 cm CSF with normal cells, protein, and glucose. Pregnancy testing, CBC, secondary-cause exposure review, and broader work remain qualified-team responsibilities. The integrated pattern strongly supports raised intracranial pressure with an idiopathic-pattern differential, but demographics and one pressure value do not establish the diagnosis. Reconcile the syndrome; activate qualified neurological, neuro-ophthalmic, imaging, and procedure ownership; review confirmed papilledema and visual function; and review imaging, venography, LP, and secondary-cause boundaries. At a strict fixed 24-hour report after qualified initial care, reliable automated perimetry shows new moderate inferior-nasal constriction in both eyes, worse than baseline, while acuity remains 20/20, pupils remain equal, GCS remains 15, and there is no supplied seizure, consciousness decline, new persistent motor deficit, Cushing pattern, or other herniation sign. Worsening field function despite preserved central acuity is an imminent sight threat requiring urgent qualified surgical sight-preservation review; the learner chooses no procedure. After another elapsed interval, hand off field and papilledema surveillance, urgent rescue selection, secondary causes, individualized disease modification and medicine safety, headache disability and medication overuse, diplopia, recurrence, follow-up, disposition, prognosis, and outcome uncertainty. The controls do not take history; examine; acquire or interpret fundus, acuity, color, pupils, motility, OCT, fields, MRI, venography, CT, blood, CSF, pressure, or another test; diagnose; select or deliver a drug, dose, route, access, weight intervention, headache treatment, or other treatment; perform LP, imaging, venography, optic-nerve-sheath fenestration, CSF diversion, venous stenting, or another procedure; determine disposition or prognosis; or prove visual rescue, recovery, or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'raised-icp-trajectory', objectiveId: 'reconcile-neurology-raised-icp-headache-visual-tinnitus-diplopia-and-whole-patient', question: 'Which headache, transient-visual, tinnitus, diplopia, neurological, and physiological findings established the clock?' },
    { id: 'raised-icp-ownership', objectiveId: 'activate-neurology-raised-icp-qualified-neurology-neuro-ophthalmology-imaging-and-procedure-ownership', question: 'Why did neurological, neuro-ophthalmic, imaging, and procedure ownership begin urgently?' },
    { id: 'raised-icp-eyes', objectiveId: 'review-neurology-raised-icp-confirmed-papilledema-visual-function-and-pseudopapilledema-boundary', question: 'Which specialist findings confirmed papilledema and measured the visual threat without relying on acuity alone?' },
    { id: 'raised-icp-diagnostics', objectiveId: 'review-neurology-raised-icp-mri-venography-lp-secondary-cause-and-diagnostic-boundary', question: 'How did imaging, venography, CSF, opening pressure, and secondary-cause review support but bound the diagnosis?' },
    { id: 'raised-icp-later', objectiveId: 'review-neurology-raised-icp-strict-later-worsening-visual-field-and-imminent-sight-threat', question: 'Why did worsening fields establish imminent sight risk despite preserved acuity and stable neurology?' },
    { id: 'raised-icp-handoff', objectiveId: 'handoff-neurology-raised-icp-vision-rescue-cause-disease-headache-follow-up-and-active-risk', question: 'Which rescue, cause, disease, headache, surveillance, recurrence, and outcome risks required handoff?' },
  ] },
};
