/** Acute transtentorial herniation-pattern recognition and qualified rescue coordination. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const ACUTE_TRANSTENTORIAL_HERNIATION_PATTERN: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'acute-transtentorial-herniation-pattern', version: '0.1.0', maturity: 'draft',
    title: 'Acute transtentorial herniation pattern', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 6, difficulty: 'advanced', objectives: [
      { id: 'reconcile-neurology-herniation-clock-consciousness-pupils-motor-physiology-and-whole-patient', statement: 'Reconcile the consciousness, pupil, motor, respiratory, circulatory, structural, and whole-patient clock.', measure: 'The rapid multidomain decline was connected without learner history, examination, scoring, monitoring, imaging, diagnosis, or treatment.' },
      { id: 'recognize-neurology-converging-transtentorial-herniation-pattern-without-isolated-pupil-or-complete-triad', statement: 'Recognize a converging transtentorial herniation pattern without relying on an isolated pupil or complete Cushing triad.', measure: 'Rapid consciousness decline, new ipsilateral pupillary nonreactivity, contralateral motor change, physiology, and known temporal mass effect triggered emergency recognition together.' },
      { id: 'activate-neurology-herniation-qualified-airway-neurocritical-neurosurgical-and-brain-rescue-ownership', statement: 'Activate qualified airway, neurocritical, neurosurgical, and brain-rescue ownership immediately.', measure: 'Parallel named ownership began without waiting for repeat imaging or learner selection of an airway, drug, dose, access, device, or operation.' },
      { id: 'review-neurology-herniation-immediate-systemic-brain-rescue-imaging-and-definitive-source-control-boundary', statement: 'Review the immediate systemic brain-rescue, imaging, and definitive source-control boundary.', measure: 'Qualified teams owned oxygenation, ventilation, perfusion, glucose, temperature, positioning, seizure, individualized osmotherapy, imaging, and decompression decisions without a universal recipe.' },
      { id: 'review-neurology-herniation-strict-later-qualified-rescue-and-unresolved-neurologic-trajectory', statement: 'At a strict later report, review qualified rescue and the unresolved neurological trajectory.', measure: 'Supplied airway and rescue care plus an active operating-room pathway were integrated without attributing physiology, pupil state, or survival to treatment.' },
      { id: 'handoff-neurology-herniation-lesion-airway-pressure-seizure-surgery-and-active-risk', statement: 'After another elapsed interval, hand off lesion, airway, pressure, seizure, surgery, and active risk.', measure: 'The handoff preserved cause, definitive control, monitoring, complications, neurological recovery, disposition, prognosis, and outcome uncertainty.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Neurocritical Care Society. Emergency Neurological Life Support: Intracranial Hypertension and Herniation Protocol. Version 6.0. 2026.',
        'Stevens RD, Shoykhet M, Cadena R. Emergency Neurological Life Support: Intracranial Hypertension and Herniation. Neurocrit Care. 2015;23 Suppl 2:S76-S82. doi:10.1007/s12028-015-0168-z.',
      ] },
    limitations: ['herniation-clock-exam-imaging-care-and-later-state-are-authored',
      'herniation-controls-reconcile-recognize-activate-review-reassess-and-handoff-only',
      'no-live-herniation-exam-monitor-imaging-diagnosis-airway-drug-procedure-or-outcome'],
  },
  patient: {
    ageYears: 58, sex: 'male', heightCm: 178, weightKg: 84, asaClass: 4,
    diagnosis: 'Authored acute right transtentorial herniation pattern from temporal mass effect',
    procedure: 'calm first-hour herniation recognition, rescue-boundary, and handoff practice',
    comorbidities: ['Recently identified right temporal mass awaiting tissue diagnosis'],
    medications: ['Exact outpatient exposure reconciliation remains qualified-team work'],
    allergies: ['No known drug allergies'], fasting: 'Unknown in the emergency fixture',
    baseline: { heartRateBpm: 54, meanArterialMmHg: 130, strokeVolumeMl: 76,
      hemoglobinGPerDl: 13.8, bloodVolumeMl: 5_500, coreTemperatureC: 36.9,
      arterialStiffness: 1.1, baroreflexGain: 0.7, fixedStrokeVolume: false },
    airway: { difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Spontaneously breathing but no longer reliably protecting the airway' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'],
    airwayDevice: 'facemask', ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 420,
      respiratoryRateBpm: 10, freshGasFlowLPerMin: 0.5, delivering: false } }, formulary: [],
  timeline: [
    { id: 'acute-transtentorial-herniation-pattern-presentation', type: 'narrative',
      target: 'acute-transtentorial-herniation-pattern-reassessment', atTick: 0,
      severity: 'critical', message: 'A previously independent 58-year-old man with a recently identified right temporal mass developed worsening headache and repeated vomiting over 2 hours. During the last 12 minutes, a qualified examination reports decline from conversant GCS 14 to GCS 9, a new right 6 mm nonreactive pupil versus left 3 mm reactive pupil, and new left-arm extension to pain while the right arm localizes. He is spontaneously breathing at 14/min but no longer reliably protects the airway. T 36.9°C, HR 54/min, BP 168/111 mmHg (MAP 130), and pulse-coherent room-air SpO2 97% are supplied. Bradycardia and hypertension reinforce severity, but respiratory irregularity and a complete Cushing triad are not required.' },
    { id: 'acute-transtentorial-herniation-pattern-evidence', type: 'narrative',
      target: 'acute-transtentorial-herniation-pattern-reassessment', atTick: 0,
      severity: 'warning', message: 'A qualified CT report obtained immediately before the steep decline describes a 5.2 cm right temporal mass with extensive vasogenic edema, 13 mm leftward midline shift, effaced right basal cisterns, and medial displacement of the right uncus. No acute intracranial hemorrhage or obstructive hydrocephalus is reported. Glucose is 118 mg/dL. The converging clinical change and supplied structural context establish the authored acute transtentorial herniation pattern; neither anisocoria nor imaging alone is a universal diagnosis, and urgent qualified rescue must not wait for learner examination or repeat imaging.' },
    { id: 'acute-transtentorial-herniation-pattern-boundary', type: 'narrative',
      target: 'acute-transtentorial-herniation-pattern-reassessment-boundary', atTick: 0,
      severity: 'warning', message: 'Reconcile the clock and whole pattern; recognize the emergency without waiting for an isolated sign or complete triad; activate qualified airway, neurocritical, neurosurgical, nursing, respiratory, pharmacy, imaging, and operating-room ownership; and review immediate systemic brain protection, individualized expert-selected osmotic rescue, imaging, and definitive source-control boundaries. At a strict fixed 15-minute report, qualified teams have secured the airway, report bilateral ventilation with pulse-coherent SpO2 99% and end-tidal CO2 36 mmHg, and have delivered individualized brain-rescue care while the emergency operating-room pathway remains active. HR is 68/min and BP 158/88 mmHg (MAP 111). The right pupil remains 6 mm nonreactive, and no neurological recovery, durable pressure control, decompression, treatment effect, prognosis, or outcome is yet reported. After another elapsed interval, hand off the structural lesion, consciousness and pupil trajectory, airway and ventilation, perfusion, pressure strategy, seizure risk, definitive surgery, complications, and unresolved outcome. The controls do not take history; examine; calculate GCS; acquire or interpret pupils, monitoring, blood gas, imaging, pressure, or another test; diagnose; position; select or deliver oxygen, ventilation, fluid, hyperosmolar or other drug, dose, route, or access; manage an airway; perform imaging, decompression, drain placement, or another procedure; determine disposition or prognosis; or prove treatment effect, recovery, survival, or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'herniation-trajectory', objectiveId: 'reconcile-neurology-herniation-clock-consciousness-pupils-motor-physiology-and-whole-patient', question: 'Which rapid consciousness, pupil, motor, physiological, structural, and whole-patient changes established the clock?' },
    { id: 'herniation-recognition', objectiveId: 'recognize-neurology-converging-transtentorial-herniation-pattern-without-isolated-pupil-or-complete-triad', question: 'Why did the converging pattern require immediate recognition without an isolated pupil or complete Cushing triad?' },
    { id: 'herniation-ownership', objectiveId: 'activate-neurology-herniation-qualified-airway-neurocritical-neurosurgical-and-brain-rescue-ownership', question: 'Which qualified owners needed to begin in parallel before repeat certainty?' },
    { id: 'herniation-boundary', objectiveId: 'review-neurology-herniation-immediate-systemic-brain-rescue-imaging-and-definitive-source-control-boundary', question: 'Which immediate systemic, brain-rescue, imaging, and definitive-control decisions remained with qualified teams?' },
    { id: 'herniation-later', objectiveId: 'review-neurology-herniation-strict-later-qualified-rescue-and-unresolved-neurologic-trajectory', question: 'What did the strict later report establish, and why did it not prove treatment effect or recovery?' },
    { id: 'herniation-handoff', objectiveId: 'handoff-neurology-herniation-lesion-airway-pressure-seizure-surgery-and-active-risk', question: 'Which lesion, airway, pressure, seizure, surgical, complication, recovery, and outcome risks required handoff?' },
  ] },
};
