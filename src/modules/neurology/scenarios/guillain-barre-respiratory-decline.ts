/** Rapid Guillain-Barré respiratory, bulbar, and autonomic deterioration. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const GUILLAIN_BARRE_RESPIRATORY_DECLINE: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'guillain-barre-respiratory-decline', version: '0.1.0', maturity: 'draft',
    title: 'Guillain-Barré respiratory decline', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 7, difficulty: 'advanced', objectives: [
      { id: 'reconcile-neurology-gbs-clock-ascending-weakness-bulbar-respiratory-autonomic-and-whole-patient', statement: 'Reconcile the clock, ascending weakness, bulbar and respiratory trajectory, autonomic variation, supplied evidence, and whole-patient state.', measure: 'Post-infectious timing, rapid functional loss, serial cough, swallowing, FVC, single-breath count, MIP, heart-rate and pressure reports, gas exchange, and perfusion were connected without learner history, examination, testing, diagnosis, or treatment.' },
      { id: 'review-neurology-gbs-supportive-evidence-mimics-and-diagnostic-boundary', statement: 'Review supplied supportive evidence, dangerous mimics, and the qualified diagnostic boundary.', measure: 'CSF and electrodiagnostic reports supported an authored probable GBS pattern while spinal cord, brainstem, neuromuscular-junction, motor-neuron, toxic, metabolic, infectious, inflammatory, and other causes remained open.' },
      { id: 'recognize-neurology-gbs-high-risk-respiratory-decline-without-score-or-single-cutoff', statement: 'Recognize high-risk respiratory decline without relying on oxygen saturation, a score, or one respiratory cutoff.', measure: 'Serial multidomain decline triggered escalation before hypoxemia, marked hypercapnia, arrest, or learner mEGRIS calculation.' },
      { id: 'activate-neurology-gbs-qualified-neurocritical-respiratory-airway-and-cardiac-ownership', statement: 'Activate qualified neurocritical, respiratory, airway-capable, nursing, and cardiac-monitoring ownership.', measure: 'Named ownership covered ventilation, aspiration, dysautonomia, and rapid change without learner device, setting, airway, drug, dose, access, or procedure controls.' },
      { id: 'review-neurology-gbs-strict-later-respiratory-bulbar-and-autonomic-trajectory', statement: 'At a strict later report, review respiratory, bulbar, and autonomic deterioration.', measure: 'Further mechanics, cough, secretion, breathing, heart-rate, and pressure change were integrated without causal, treatment, ventilation, arrest, or outcome claims.' },
      { id: 'handoff-neurology-gbs-airway-dysautonomia-treatment-recurrence-and-active-risk', statement: 'After another elapsed interval, hand off airway, dysautonomia, treatment, complications, recovery, and active risk.', measure: 'The handoff preserved open diagnosis and cause, individualized immune treatment, airway and ventilation decisions, arrhythmia and pressure risk, pain, thrombosis, infection, rehabilitation, recurrence, disposition, prognosis, and outcome.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0', sources: [
        'van Doorn PA, Van den Bergh PYK, Hadden RDM, et al. European Academy of Neurology/Peripheral Nerve Society Guideline on diagnosis and treatment of Guillain-Barré syndrome. Eur J Neurol. 2023;30:3646-3674. doi:10.1111/ene.16073.',
        'McKenzie ED, Kromm JA, Mobach T, et al. Risk Stratification and Management of Acute Respiratory Failure in Patients With Neuromuscular Disease. Crit Care Med. 2024;52:1781-1789. doi:10.1097/CCM.0000000000006417.',
      ] },
    limitations: ['gbs-clock-weakness-tests-mechanics-autonomic-and-later-state-are-authored',
      'gbs-controls-reconcile-review-recognize-activate-reassess-and-handoff-only',
      'no-live-gbs-exam-score-test-diagnosis-drug-ventilation-airway-procedure-or-outcome'],
  },
  patient: {
    ageYears: 33, sex: 'male', heightCm: 178, weightKg: 76, asaClass: 4,
    diagnosis: 'Authored probable Guillain-Barré pattern with rapid respiratory and autonomic decline',
    procedure: 'calm serial respiratory-risk recognition, qualified escalation, and active-risk handoff',
    comorbidities: ['Previously independent'], medications: ['Medication record under qualified review'],
    allergies: ['No known drug allergies'], fasting: 'Not established during acute neurological evaluation',
    baseline: { heartRateBpm: 112, meanArterialMmHg: 93, strokeVolumeMl: 62,
      hemoglobinGPerDl: 14.1, bloodVolumeMl: 5_100, coreTemperatureC: 37.1,
      arterialStiffness: 1.0, baroreflexGain: 0.55, fixedStrokeVolume: false },
    airway: { difficulty: 0.15, difficultMaskVentilation: false,
      assessment: 'Spontaneous breathing with weak cough, short-phrase speech, mild dysphagia, and supplied facial and neck weakness' },
    respiratory: { profile: 'moderately-ill' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 360, respiratoryRateBpm: 24,
      freshGasFlowLPerMin: 0.5, delivering: false } }, formulary: [],
  timeline: [
    { id: 'guillain-barre-respiratory-decline-presentation', type: 'narrative',
      target: 'guillain-barre-respiratory-decline-reassessment', atTick: 0, severity: 'critical',
      message: 'A previously independent 33-year-old man had diarrhea 14 days ago, distal tingling for 5 days, and 48 hours of rapidly ascending symmetric weakness. He walked yesterday morning, needed two-person help last night, and now cannot stand or lift either arm above shoulder level. A qualified examination report describes alertness, symmetric leg-greater-than-arm weakness, facial diplegia, neck flexion weakness, absent leg reflexes, reduced arm reflexes, mild dysphagia, short-phrase speech, and a weak cough, with preserved sensation sufficient to report tingling and no sensory level, extensor plantar response, ophthalmoplegia, or altered mentation. T 37.1°C, HR 112/min, shallow RR 24/min, BP 132/74 mmHg (MAP 93), pulse-coherent room-air SpO2 98%, warm perfusion, and refill 2 seconds are supplied.' },
    { id: 'guillain-barre-respiratory-decline-evidence', type: 'narrative',
      target: 'guillain-barre-respiratory-decline-reassessment', atTick: 0, severity: 'warning',
      message: 'Qualified reports show FVC falling from 3.6 L to 2.4 L, single-breath count from 28 to 18, and MIP from -45 to -30 cmH2O over 12 hours, with acceptable technique documented for this case. A fixed room-air blood gas reports pH 7.40, PaCO2 40 mmHg, PaO2 88 mmHg, and bicarbonate 24 mmol/L. Supplied CSF has protein 86 mg/dL and 3 white cells/uL; a qualified nerve-conduction report describes a demyelinating polyradiculoneuropathy pattern. These findings support the authored probable GBS pattern but do not make one test diagnostic or exclude cord, brainstem, junctional, motor-neuron, toxic, metabolic, infectious, inflammatory, or other causes.' },
    { id: 'guillain-barre-respiratory-decline-autonomic', type: 'narrative',
      target: 'guillain-barre-respiratory-decline-reassessment-boundary', atTick: 0, severity: 'warning',
      message: 'A fixed monitored hour records sinus rates from 58 to 126/min and blood pressures from 96/58 to 176/104 mmHg without sustained shock, chest pain, pulmonary edema, or a documented malignant rhythm. These snapshots establish labile autonomic risk, not a learner rhythm interpretation or a license to provoke or automatically treat each value. Reconcile the clock, ascending weakness, bulbar and respiratory trajectory, autonomic variation, supportive evidence, and whole patient; review dangerous mimics and diagnostic limits; recognize high-risk respiratory decline without saturation, score, or one cutoff; and activate qualified neurocritical, respiratory, airway-capable, nursing, and cardiac-monitoring ownership. At a strict fixed 4-hour report, the patient cannot lift his head, speaks one word per breath, cough is barely audible, saliva clearance requires continuous experienced-team help, abdominal paradox is persistent, and RR is shallow at 30/min while pulse-coherent room-air SpO2 remains 96%. Qualified FVC is 1.5 L, single-breath count 8, MIP -18 cmH2O, and blood gas pH 7.35, PaCO2 46 mmHg, PaO2 80 mmHg, bicarbonate 25 mmol/L. The captured interval also reports sinus rate varying from 48 to 138/min and BP from 88/52 to 188/110 mmHg without supplied arrest or sustained shock. This is a fixed deterioration report, not a ventilation, airway, rhythm-treatment, or outcome decision. After another elapsed interval, hand off airway and aspiration risk, dysautonomia, open diagnosis and cause, individualized immune treatment, ventilation and airway decisions, pain, thrombosis, infection, rehabilitation, recurrence, disposition, prognosis, and outcome uncertainty. The controls do not take history; examine; calculate mEGRIS or another score; acquire or interpret monitoring, ECG, oximetry, capnography, blood gas, FVC, SBC, MIP, MEP, CSF, imaging, laboratory, microbiology, electrodiagnostic, swallowing, cough, secretion, or other tests; diagnose; select or deliver oxygen, noninvasive or invasive ventilation, interface, setting, IVIG, plasma exchange, antimicrobial, analgesic, anticoagulant, drug, dose, route, access, fluid, nutrition, suction, airway device, rhythm or pressure treatment; intubate; pace; shock; perform a procedure; determine disposition or prognosis; or predict response or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'gbs-trajectory', objectiveId: 'reconcile-neurology-gbs-clock-ascending-weakness-bulbar-respiratory-autonomic-and-whole-patient', question: 'Which clock, weakness, bulbar, respiratory, autonomic, and whole-patient changes established the trajectory?' },
    { id: 'gbs-evidence', objectiveId: 'review-neurology-gbs-supportive-evidence-mimics-and-diagnostic-boundary', question: 'How did the supplied CSF and electrodiagnostic evidence support but not independently prove the diagnosis?' },
    { id: 'gbs-risk', objectiveId: 'recognize-neurology-gbs-high-risk-respiratory-decline-without-score-or-single-cutoff', question: 'Why did serial multidomain decline matter more than saturation, a score, or one mechanics cutoff?' },
    { id: 'gbs-ownership', objectiveId: 'activate-neurology-gbs-qualified-neurocritical-respiratory-airway-and-cardiac-ownership', question: 'Why were airway-capable and cardiac-monitoring owners activated before arrest or sustained shock?' },
    { id: 'gbs-later', objectiveId: 'review-neurology-gbs-strict-later-respiratory-bulbar-and-autonomic-trajectory', question: 'What worsened in the fixed later respiratory, bulbar, and autonomic report?' },
    { id: 'gbs-handoff', objectiveId: 'handoff-neurology-gbs-airway-dysautonomia-treatment-recurrence-and-active-risk', question: 'Which airway, dysautonomia, treatment, complication, rehabilitation, and outcome risks required handoff?' },
  ] },
};
