/** Metastatic spinal-cord-compression recognition and qualified rescue coordination. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const METASTATIC_SPINAL_CORD_COMPRESSION: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'metastatic-spinal-cord-compression', version: '0.1.0', maturity: 'draft',
    title: 'Metastatic spinal cord compression', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 6, difficulty: 'advanced', objectives: [
      { id: 'reconcile-neurology-mscc-cancer-pain-motor-sensory-bladder-and-whole-patient-clock', statement: 'Reconcile the cancer, pain, motor, sensory, bladder, and whole-patient clock.', measure: 'Progressive movement-sensitive thoracic pain, bilateral upper-motor-neuron leg findings, a sensory level, and urinary dysfunction were connected without learner history or examination.' },
      { id: 'recognize-neurology-mscc-oncologic-emergency-before-imaging-confirmation', statement: 'Recognize suspected metastatic spinal cord compression as an oncologic emergency before imaging confirmation.', measure: 'Known cancer plus progressive cord-level symptoms triggered emergency recognition without waiting for learner imaging interpretation or a single isolated symptom.' },
      { id: 'activate-neurology-mscc-qualified-spinal-oncology-radiology-nursing-and-rehabilitation-ownership', statement: 'Activate qualified spinal, oncology, radiology, nursing, and rehabilitation ownership immediately.', measure: 'Parallel named ownership began without learner movement, drug, dose, imaging, procedure, or treatment selection.' },
      { id: 'review-neurology-mscc-stability-movement-whole-spine-mri-corticosteroid-and-definitive-care-boundary', statement: 'Review the stability, movement, whole-spine MRI, corticosteroid, and definitive-care boundary.', measure: 'Qualified teams owned individualized movement precautions, whole-spine MRI, early corticosteroid care, bladder and supportive care, and surgery or radiotherapy decisions.' },
      { id: 'review-neurology-mscc-strict-later-qualified-mri-and-unresolved-function-trajectory', statement: 'At a strict later report, review qualified MRI and the unresolved functional trajectory.', measure: 'Supplied T6 epidural compression and persistent deficits were integrated without learner image interpretation or claims of treatment effect or recovery.' },
      { id: 'handoff-neurology-mscc-level-stability-function-bladder-definitive-care-and-active-risk', statement: 'After another elapsed interval, hand off level, stability, function, bladder, definitive care, and active risk.', measure: 'The handoff preserved pathology, cancer extent, neurological trend, complications, rehabilitation, disposition, prognosis, and outcome uncertainty.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'National Institute for Health and Care Excellence. Spinal metastases and metastatic spinal cord compression. NICE guideline NG234. 2023.',
        'National Institute for Health and Care Excellence. Quality statement 3: Imaging for adults with suspected metastatic spinal cord compression. NICE quality standard QS56. Updated 2023.',
      ] },
    limitations: ['mscc-clock-exam-imaging-care-and-later-state-are-authored',
      'mscc-controls-reconcile-recognize-activate-review-reassess-and-handoff-only',
      'no-live-mscc-history-exam-movement-imaging-diagnosis-drug-procedure-or-outcome'],
  },
  patient: {
    ageYears: 68, sex: 'male', heightCm: 175, weightKg: 79, asaClass: 3,
    diagnosis: 'Authored suspected metastatic thoracic spinal cord compression',
    procedure: 'calm first-hour cord-compression recognition, rescue-boundary, and handoff practice',
    comorbidities: ['Metastatic prostate cancer receiving systemic oncology care'],
    medications: ['Exact oncology and outpatient exposure reconciliation remains qualified-team work'],
    allergies: ['No known drug allergies'], fasting: 'Unknown in the emergency fixture',
    baseline: { heartRateBpm: 88, meanArterialMmHg: 96, strokeVolumeMl: 72,
      hemoglobinGPerDl: 11.4, bloodVolumeMl: 5_200, coreTemperatureC: 36.8,
      arterialStiffness: 1.1, baroreflexGain: 0.8, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Speaking comfortably with an intact supplied cough' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'],
    airwayDevice: 'facemask', ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 420,
      respiratoryRateBpm: 10, freshGasFlowLPerMin: 0.5, delivering: false } }, formulary: [],
  timeline: [
    { id: 'metastatic-spinal-cord-compression-presentation', type: 'narrative',
      target: 'metastatic-spinal-cord-compression-reassessment', atTick: 0,
      severity: 'critical', message: 'A previously independent 68-year-old man with metastatic prostate cancer reports 3 weeks of progressive mid-thoracic back pain that now wakes him at night and worsens with coughing or movement. During the last 48 hours, walking changed from independent to requiring two-person support, both legs became weak, and voiding became difficult. A qualified examination reports normal cognition, cranial function, and arms; bilateral hip flexion 3/5, knee extension 4/5, increased leg tone and reflexes, bilateral extensor plantar responses, and reduced pin sensation below approximately T8. He has not walked since this assessment. T 36.8°C, HR 88/min, RR 14/min, BP 126/81 mmHg (MAP 96), and pulse-coherent room-air SpO2 97% are supplied.' },
    { id: 'metastatic-spinal-cord-compression-evidence', type: 'narrative',
      target: 'metastatic-spinal-cord-compression-reassessment', atTick: 0,
      severity: 'warning', message: 'Known cancer plus progressive movement-sensitive back pain, bilateral upper-motor-neuron leg weakness, a thoracic sensory level, gait loss, and urinary dysfunction establish suspected metastatic spinal cord compression as an oncologic emergency before imaging confirmation. No fever, recent spinal procedure, major trauma, anticoagulant exposure, or upper-limb or cranial deficit is authored, but infection, hemorrhage, nonmalignant structural disease, vascular, inflammatory, metabolic, peripheral, and other causes remain qualified work. No isolated pain feature, bladder symptom, cancer history, or examination sign is sufficient alone.' },
    { id: 'metastatic-spinal-cord-compression-boundary', type: 'narrative',
      target: 'metastatic-spinal-cord-compression-reassessment-boundary', atTick: 0,
      severity: 'warning', message: 'Reconcile the clock and cord-level pattern; recognize the oncologic emergency without waiting for learner image interpretation; activate qualified spinal surgery, oncology, radiology, radiotherapy, nursing, pharmacy, rehabilitation, pain, bladder, skin, and thrombosis-prevention ownership; and review individualized stability and movement precautions, whole-spine MRI, guideline-directed early corticosteroid care, supportive care, and definitive surgery or radiotherapy boundaries. At a strict fixed 4-hour report, a qualified whole-spine MRI describes a metastatic T6 vertebral lesion with epidural extension causing severe thoracic cord compression and focal T2 cord signal change; separate lumbar vertebral metastases do not compress neural structures. Qualified teams report individualized movement precautions and early care active while urgent spinal-surgery and radiotherapy decisions remain open. Hip flexion remains 3/5, the T8 sensory level persists, and a qualified bladder scan reports 780 mL before team-managed drainage. No neurological recovery, treatment effect, definitive intervention, disposition, prognosis, or outcome is reported. After another elapsed interval, hand off lesion level, stability, motor and sensory trend, bladder, pain, cancer extent, pathology, definitive care, skin and thrombosis risks, rehabilitation, and unresolved outcome. The controls do not take history; examine; test gait; move or immobilize; acquire or interpret monitoring, MRI, bladder scan, pathology, staging, or another test; diagnose; select or deliver corticosteroid or another drug, dose, route, or access; catheterize; perform surgery, radiotherapy, biopsy, or another procedure; determine disposition or prognosis; or prove treatment effect, recovery, survival, or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'mscc-trajectory', objectiveId: 'reconcile-neurology-mscc-cancer-pain-motor-sensory-bladder-and-whole-patient-clock', question: 'Which cancer, pain, motor, sensory, bladder, and whole-patient changes established the clock?' },
    { id: 'mscc-recognition', objectiveId: 'recognize-neurology-mscc-oncologic-emergency-before-imaging-confirmation', question: 'Why did the cord-level pattern require emergency recognition before imaging confirmation?' },
    { id: 'mscc-ownership', objectiveId: 'activate-neurology-mscc-qualified-spinal-oncology-radiology-nursing-and-rehabilitation-ownership', question: 'Which qualified owners needed to begin in parallel?' },
    { id: 'mscc-boundary', objectiveId: 'review-neurology-mscc-stability-movement-whole-spine-mri-corticosteroid-and-definitive-care-boundary', question: 'Which stability, movement, MRI, corticosteroid, supportive, and definitive decisions remained with qualified teams?' },
    { id: 'mscc-later', objectiveId: 'review-neurology-mscc-strict-later-qualified-mri-and-unresolved-function-trajectory', question: 'What did the strict later MRI and functional report establish without proving response or recovery?' },
    { id: 'mscc-handoff', objectiveId: 'handoff-neurology-mscc-level-stability-function-bladder-definitive-care-and-active-risk', question: 'Which level, stability, function, bladder, definitive-care, complication, rehabilitation, and outcome risks required handoff?' },
  ] },
};
