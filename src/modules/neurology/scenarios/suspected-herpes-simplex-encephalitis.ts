/** Suspected herpes simplex encephalitis with an early negative CSF PCR. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const SUSPECTED_HERPES_SIMPLEX_ENCEPHALITIS: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'suspected-herpes-simplex-encephalitis', version: '0.1.0', maturity: 'preview',
    title: 'Suspected herpes simplex encephalitis', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 7, difficulty: 'advanced', objectives: [
      { id: 'reconcile-neurology-encephalitis-clock-cognition-language-focal-seizure-and-whole-patient', statement: 'Reconcile the fever clock, altered cognition and behavior, language change, focal seizure, physiology, and whole patient.', measure: 'Parenchymal brain dysfunction was distinguished from uncomplicated meningitis, postictal state, delirium, stroke, toxic-metabolic, autoimmune, and other causes without learner history, examination, testing, diagnosis, or treatment.' },
      { id: 'activate-neurology-encephalitis-qualified-neurocritical-infection-airway-and-seizure-ownership', statement: 'Activate qualified neurological, infection, neurocritical, airway-capable, nursing, and seizure ownership.', measure: 'Named owners covered consciousness, airway, seizures, intracranial risk, diagnostics, treatment, deterioration, and systemic complications without learner device, drug, or procedure controls.' },
      { id: 'activate-neurology-encephalitis-qualified-immediate-empiric-antiviral-pathway-without-test-delay', statement: 'Activate a qualified immediate empiric antiviral pathway without waiting for MRI, EEG, CSF, or PCR certainty.', measure: 'Host, renal, allergy, exposure, epidemiology, local-protocol, bacterial-meningitis, and alternative-therapy ownership stayed individualized while the learner selected no agent, dose, route, access, fluid, or treatment.' },
      { id: 'review-neurology-encephalitis-mri-eeg-csf-etiology-and-nonconvulsive-seizure-boundary', statement: 'Review supplied MRI, EEG, CSF, etiologic, and nonconvulsive-seizure boundaries.', measure: 'Imaging, specialist EEG, and CSF evidence supported an encephalitic temporal-lobe pattern without learner interpretation, organism proof, ongoing electrographic seizure, or premature alternative-cause closure.' },
      { id: 'review-neurology-encephalitis-strict-later-early-negative-hsv-pcr-and-clinical-trajectory', statement: 'At a strict later report, integrate the early negative HSV PCR and persistent clinical trajectory without premature closure.', measure: 'Specimen timing, temporal localization, CSF, MRI, EEG, and ongoing dysfunction preserved HSV suspicion and repeat-testing ownership without declaring diagnosis or response.' },
      { id: 'handoff-neurology-encephalitis-repeat-testing-antiviral-seizure-autoimmune-and-active-risk', statement: 'After another elapsed interval, hand off repeat testing, antiviral safety, seizure, autoimmune, rehabilitation, and active risk.', measure: 'The handoff preserved repeat HSV PCR, broader infectious and autoimmune evaluation, treatment optimization and toxicity, seizure surveillance, cognition and function, rehabilitation, disposition, prognosis, and outcome.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Meyding-Lamadé U, Craemer EM, Aydin K, et al. S1 guidelines of the German Society of Neurology for Viral Meningoencephalitis. Neurol Res Pract. 2026;8:24. doi:10.1186/s42466-026-00487-3.',
        'Tunkel AR, Glaser CA, Bloch KC, et al. The Management of Encephalitis: Clinical Practice Guidelines by the Infectious Diseases Society of America. Clin Infect Dis. 2008;47:303-327. doi:10.1086/589747.',
      ] },
    limitations: ['encephalitis-clock-exam-csf-mri-eeg-pcr-treatment-and-later-state-are-authored',
      'encephalitis-controls-reconcile-activate-treat-review-reassess-and-handoff-only',
      'no-live-encephalitis-exam-test-imaging-eeg-lp-diagnosis-drug-procedure-or-outcome'],
  },
  patient: {
    ageYears: 37, sex: 'male', heightCm: 180, weightKg: 78, asaClass: 4,
    diagnosis: 'Authored suspected herpes simplex encephalitis pattern',
    procedure: 'calm early antiviral, multimodal diagnostic, and active-risk handoff practice',
    comorbidities: ['Previously independent', 'No known immunocompromising condition'],
    medications: ['Medication and recent antimicrobial exposure under qualified review'],
    allergies: ['No known drug allergies'], fasting: 'Not established during emergency evaluation',
    baseline: { heartRateBpm: 110, meanArterialMmHg: 91, strokeVolumeMl: 66,
      hemoglobinGPerDl: 14.2, bloodVolumeMl: 5_200, coreTemperatureC: 38.8,
      arterialStiffness: 1.0, baroreflexGain: 0.6, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Drowsy but rousable, speaking short confused phrases, protecting the airway, and breathing spontaneously' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'],
    airwayDevice: 'facemask', ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 440,
      respiratoryRateBpm: 20, freshGasFlowLPerMin: 0.5, delivering: false } }, formulary: [],
  timeline: [
    { id: 'suspected-herpes-simplex-encephalitis-presentation', type: 'narrative',
      target: 'suspected-herpes-simplex-encephalitis-reassessment', atTick: 0,
      severity: 'critical', message: 'A previously independent 37-year-old man has 30 hours of fever and headache followed by 12 hours of irritability, repeatedly asking the same question, forgetting recent events, and using vague or incorrect words. Two hours ago, a witnessed 90-second episode of behavioral arrest, right facial twitching, and right-hand posturing stopped without rescue treatment; he has had no recurrent visible movement. A qualified examination report describes drowsiness with easy rousing, GCS 14, disorientation to date, impaired 3-item recall, anomia, equal reactive pupils, symmetric antigravity limbs, and no neck stiffness, rash, sustained clonus, current gaze deviation, or persistent focal motor deficit. T 38.8°C, HR 110/min, RR 20/min, BP 126/74 mmHg (MAP 91), pulse-coherent room-air SpO2 98%, warm extremities, refill 2 seconds, and bedside glucose 104 mg/dL are supplied.' },
    { id: 'suspected-herpes-simplex-encephalitis-evidence', type: 'narrative',
      target: 'suspected-herpes-simplex-encephalitis-reassessment', atTick: 0,
      severity: 'warning', message: 'Qualified reports show leukocytes 11.8 × 10^9/L, sodium 137 mmol/L, creatinine 0.9 mg/dL, AST 32 U/L, ALT 29 U/L, lactate 1.4 mmol/L, platelets 226 × 10^9/L, and INR 1.0. A qualified uncomplicated LP already reports clear CSF with opening pressure 21 cmH2O, 96 white cells/µL with 86% lymphocytes, 340 red cells/µL, protein 82 mg/dL, glucose 62 mg/dL with paired serum glucose 104 mg/dL, negative Gram stain, and bacterial culture pending. Viral PCR, antibody, and broader infectious and autoimmune studies are pending. These findings support central inflammation but do not prove HSV or exclude infectious, autoimmune, vascular, neoplastic, toxic-metabolic, postictal, medication, systemic, or other causes.' },
    { id: 'suspected-herpes-simplex-encephalitis-boundary', type: 'narrative',
      target: 'suspected-herpes-simplex-encephalitis-reassessment-boundary', atTick: 0,
      severity: 'warning', message: 'The supplied fever plus new behavior, memory, language, and focal-seizure pattern establishes an encephalitic syndrome requiring immediate qualified neurological, infection, airway-capable, seizure, and critical-care ownership. Reconcile the clock and whole patient; activate qualified ownership; activate immediate qualified empiric intravenous antiviral care without waiting for MRI, EEG, CSF, or PCR certainty; and review the MRI, EEG, CSF, nonconvulsive-seizure, and etiologic boundaries. The learner chooses no regimen. At a strict fixed 4-hour report, qualified brain MRI describes left mesial-temporal and insular FLAIR hyperintensity with restricted diffusion and mild swelling but no hemorrhage, hydrocephalus, midline shift, or large-vessel-territory infarct. A qualified 60-minute EEG report describes left temporal slowing and lateralized periodic discharges but no electrographic seizure during the sample. The initial CSF HSV-1/2 PCR is negative from a specimen obtained about 18 hours after neurobehavioral symptom onset. Qualified empiric antiviral care was administered before these reports. The patient remains drowsy but rousable at GCS 14 with persistent anomia and poor recall; T 38.5°C, HR 102/min, RR 19/min, BP 124/72 mmHg (MAP 89), room-air SpO2 98%, and no supplied recurrent visible seizure, electrographic seizure, shock, respiratory compromise, rash, meningism, rapid consciousness decline, or new persistent motor deficit. The early negative PCR does not close HSV suspicion in this compatible localized syndrome; repeat CSF HSV PCR timing remains qualified-team work. After another elapsed interval, hand off repeat testing, broader infectious and autoimmune evaluation, antimicrobial and antiviral optimization and toxicity, renal and hydration safety, seizure recurrence and nonconvulsive surveillance, consciousness, behavior, language, memory, airway, intracranial, systemic complications, rehabilitation, recurrence, disposition, prognosis, and outcome uncertainty. The controls do not take history; examine; acquire or interpret monitoring, glucose, blood, culture, CSF, PCR, antibody, MRI, CT, vascular imaging, EEG, or another test; calculate a score; diagnose; select or deliver oxygen, fluid, antimicrobial, antiviral, antiseizure or immune medicine, drug, dose, route, access, or treatment; perform LP, airway care, imaging, EEG, biopsy, or another procedure; determine transfer, disposition, prognosis, or outcome; or prove seizure control, response, recovery, or etiology.' },
  ],
  debrief: { rubric: [
    { id: 'encephalitis-trajectory', objectiveId: 'reconcile-neurology-encephalitis-clock-cognition-language-focal-seizure-and-whole-patient', question: 'Which fever, cognition, behavior, language, seizure, physiological, and negative findings established an encephalitic syndrome?' },
    { id: 'encephalitis-ownership', objectiveId: 'activate-neurology-encephalitis-qualified-neurocritical-infection-airway-and-seizure-ownership', question: 'Why did qualified neurological, infection, airway, seizure, and critical-care ownership begin immediately?' },
    { id: 'encephalitis-treatment', objectiveId: 'activate-neurology-encephalitis-qualified-immediate-empiric-antiviral-pathway-without-test-delay', question: 'Why could MRI, EEG, CSF, or PCR uncertainty not delay qualified empiric antiviral care?' },
    { id: 'encephalitis-diagnostics', objectiveId: 'review-neurology-encephalitis-mri-eeg-csf-etiology-and-nonconvulsive-seizure-boundary', question: 'How did MRI, EEG, and CSF support localization and risk without proving etiology or ongoing seizure?' },
    { id: 'encephalitis-later', objectiveId: 'review-neurology-encephalitis-strict-later-early-negative-hsv-pcr-and-clinical-trajectory', question: 'Why did the early negative HSV PCR not safely close the compatible temporal-lobe syndrome?' },
    { id: 'encephalitis-handoff', objectiveId: 'handoff-neurology-encephalitis-repeat-testing-antiviral-seizure-autoimmune-and-active-risk', question: 'Which repeat testing, treatment, seizure, autoimmune, cognitive, rehabilitation, and outcome risks required handoff?' },
  ] },
};
