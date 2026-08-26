/** Adult suspected acute bacterial meningitis first-hour diagnostic and treatment boundary. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const ACUTE_BACTERIAL_MENINGITIS_FIRST_HOUR: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'acute-bacterial-meningitis-first-hour', version: '0.1.0', maturity: 'preview',
    title: 'Acute bacterial meningitis first hour', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 7, difficulty: 'advanced', objectives: [
      { id: 'reconcile-neurology-meningitis-clock-meningeal-infection-neurologic-and-whole-patient', statement: 'Reconcile the acute clock, meningeal and infection pattern, neurological state, physiology, and whole patient.', measure: 'Headache, fever, photophobia, vomiting, neck stiffness, alertness, focal and seizure negatives, perfusion, supplied blood evidence, and alternatives were connected without learner history, examination, testing, diagnosis, or treatment.' },
      { id: 'activate-neurology-meningitis-qualified-time-critical-infection-neurologic-resuscitation-and-precaution-ownership', statement: 'Activate qualified time-critical infection, neurological, resuscitation, nursing, and locally appropriate precaution ownership.', measure: 'Named owners covered rapid deterioration, transmission precautions, airway, seizure, shock, intracranial, diagnostic, treatment, and public-health risk without learner device, drug, or procedure controls.' },
      { id: 'review-neurology-meningitis-lp-safety-no-routine-imaging-and-parallel-diagnostic-boundary', statement: 'Review lumbar-puncture safety, the no-routine-pre-LP-imaging boundary, and parallel blood and CSF diagnostics.', measure: 'The supplied alert nonfocal state supported prompt qualified LP without routine imaging while airway, respiratory, shock, seizure, bleeding, focal, pupillary, consciousness, and evolving-lesion deferral triggers remained explicit.' },
      { id: 'activate-neurology-meningitis-qualified-early-empiric-antimicrobial-and-adjunct-pathway-without-diagnostic-delay', statement: 'Activate qualified early empiric antimicrobial and adjunctive-treatment pathways without diagnostic delay.', measure: 'Age, host, allergy, resistance, epidemiology, and local-protocol ownership were preserved while tests were not allowed to delay treatment and the learner selected no drug, dose, route, or access.' },
      { id: 'review-neurology-meningitis-strict-later-csf-clinical-and-supplied-treatment-trajectory', statement: 'At a strict later report, integrate the supplied CSF, clinical, and qualified-treatment trajectory.', measure: 'The bacterial-pattern CSF and persistent but stable neurological state were integrated without declaring an organism, treatment effect, durable safety, or outcome.' },
      { id: 'handoff-neurology-meningitis-organism-treatment-complication-public-health-hearing-and-active-risk', statement: 'After another elapsed interval, hand off organism, treatment, complications, public health, hearing, and active risk.', measure: 'The handoff preserved microbiology and susceptibility, treatment optimization, infection control, contact management, neurological and systemic complications, hearing assessment, rehabilitation, disposition, prognosis, and outcome.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'World Health Organization. WHO guidelines on meningitis diagnosis, treatment and care. Geneva: WHO; 2025. ISBN 978-92-4-010804-2.',
        'National Institute for Health and Care Excellence. Meningitis (bacterial) and meningococcal disease: recognition, diagnosis and management. NICE guideline NG240. 2024.',
      ] },
    limitations: ['meningitis-clock-exam-blood-lp-csf-treatment-and-later-state-are-authored',
      'meningitis-controls-reconcile-activate-review-escalate-reassess-and-handoff-only',
      'no-live-meningitis-exam-test-imaging-lp-diagnosis-drug-procedure-or-outcome'],
  },
  patient: {
    ageYears: 28, sex: 'female', heightCm: 168, weightKg: 64, asaClass: 4,
    diagnosis: 'Authored suspected acute bacterial meningitis pattern',
    procedure: 'calm first-hour diagnostic, treatment-escalation, and active-risk handoff practice',
    comorbidities: ['Previously independent', 'No known immunocompromising condition'],
    medications: ['Medication and recent antimicrobial exposure under qualified review'],
    allergies: ['No known drug allergies'], fasting: 'Not established during emergency evaluation',
    baseline: { heartRateBpm: 118, meanArterialMmHg: 83, strokeVolumeMl: 64,
      hemoglobinGPerDl: 13.4, bloodVolumeMl: 4_400, coreTemperatureC: 39.3,
      arterialStiffness: 1.0, baroreflexGain: 0.6, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Alert, speaking clearly, protecting the airway, and breathing spontaneously' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'],
    airwayDevice: 'facemask', ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 420,
      respiratoryRateBpm: 22, freshGasFlowLPerMin: 0.5, delivering: false } }, formulary: [],
  timeline: [
    { id: 'acute-bacterial-meningitis-first-hour-presentation', type: 'narrative',
      target: 'acute-bacterial-meningitis-first-hour-reassessment', atTick: 0, severity: 'critical',
      message: 'A previously independent 28-year-old woman has 14 hours of rapidly worsening diffuse headache and fever, followed by 6 hours of photophobia, repeated vomiting, and painful neck movement. A qualified examination report describes marked neck stiffness and photophobia but clear speech, orientation to person, place, time, and situation, GCS 15, equal reactive pupils, symmetric face and limbs, and no aphasia, sensory level, sustained clonus, witnessed seizure, posturing, or rash. T 39.3°C, HR 118/min, RR 22/min, BP 112/68 mmHg (MAP 83), pulse-coherent room-air SpO2 98%, warm extremities, refill 2 seconds, and bedside glucose 102 mg/dL are supplied.' },
    { id: 'acute-bacterial-meningitis-first-hour-evidence', type: 'narrative',
      target: 'acute-bacterial-meningitis-first-hour-reassessment', atTick: 0, severity: 'warning',
      message: 'Qualified blood reports show leukocytes 18.6 × 10^9/L with neutrophils 16.5 × 10^9/L, C-reactive protein 162 mg/L, procalcitonin 4.8 ng/mL, lactate 1.7 mmol/L, sodium 136 mmol/L, platelets 212 × 10^9/L, INR 1.1, creatinine 0.8 mg/dL, and paired serum glucose 102 mg/dL. Blood cultures are being obtained by the qualified team. No peripheral blood marker confirms or excludes bacterial meningitis, and infectious, inflammatory, vascular, toxic-metabolic, structural, and other causes remain open.' },
    { id: 'acute-bacterial-meningitis-first-hour-boundary', type: 'narrative',
      target: 'acute-bacterial-meningitis-first-hour-reassessment-boundary', atTick: 0,
      severity: 'warning', message: 'The supplied alert nonfocal state has no airway compromise, respiratory compromise, shock, uncontrolled seizure, bleeding risk, extensive purpura, abnormal pupil, posturing, rapid consciousness decline, known severe immunocompromise, or other authored evolving-space-occupying-lesion risk. This supports prompt qualified lumbar puncture without routine pre-procedure imaging in this exact case, while continuous reassessment can reopen deferral and imaging needs. Reconcile the acute syndrome and whole patient; activate qualified infection, neurological, resuscitation, nursing, and locally appropriate precaution ownership; review LP safety and parallel blood and CSF diagnostics; and activate early qualified empiric intravenous antimicrobial and adjunctive-treatment pathways without letting tests or imaging delay treatment. The learner chooses no regimen. At a strict fixed 45-minute report, a qualified uncomplicated LP has already produced cloudy CSF with opening pressure 29 cmH2O, 2,200 white cells/µL with 91% neutrophils, protein 190 mg/dL, glucose 28 mg/dL with paired ratio 0.27, and lactate 5.2 mmol/L. Gram stain shows abundant white cells but no organism; culture, susceptibility, and PCR remain pending. Qualified empiric antimicrobial and adjunctive care was administered through the local pathway before this result. The patient remains GCS 15 with headache, photophobia, and neck stiffness; T 38.8°C, HR 106/min, RR 20/min, BP 116/72 mmHg (MAP 87), room-air SpO2 98%, and no supplied focal deficit, seizure, respiratory compromise, shock, purpura, or rapid consciousness decline. This CSF pattern strongly supports acute bacterial meningitis but does not identify an organism or prove treatment response or durable safety. After another elapsed interval, hand off microbiology and susceptibility, antimicrobial and adjunct optimization, infection-control and public-health needs, contact management if indicated, seizure, consciousness, focal, hearing, intracranial, vascular, thrombotic, respiratory, shock, coagulation, electrolyte, rehabilitation, recurrence, disposition, prognosis, and outcome uncertainty. The controls do not take history; examine; acquire or interpret monitoring, glucose, blood, culture, CSF, PCR, imaging, EEG, hearing, or another test; calculate a score; diagnose; select or deliver isolation equipment, oxygen, fluid, antimicrobial, corticosteroid, antiseizure medicine, drug, dose, route, access, or treatment; perform LP, airway care, imaging, or another procedure; determine contacts, transfer, disposition, prognosis, or outcome; or prove response.' },
  ],
  debrief: { rubric: [
    { id: 'meningitis-trajectory', objectiveId: 'reconcile-neurology-meningitis-clock-meningeal-infection-neurologic-and-whole-patient', question: 'Which acute, meningeal, infectious, neurological, and physiological findings established the trajectory?' },
    { id: 'meningitis-ownership', objectiveId: 'activate-neurology-meningitis-qualified-time-critical-infection-neurologic-resuscitation-and-precaution-ownership', question: 'Why did time-critical multidisciplinary and precaution ownership begin before etiologic certainty?' },
    { id: 'meningitis-diagnostics', objectiveId: 'review-neurology-meningitis-lp-safety-no-routine-imaging-and-parallel-diagnostic-boundary', question: 'Why was prompt qualified LP appropriate without routine imaging in this exact supplied state, and what would reopen deferral?' },
    { id: 'meningitis-treatment', objectiveId: 'activate-neurology-meningitis-qualified-early-empiric-antimicrobial-and-adjunct-pathway-without-diagnostic-delay', question: 'How were diagnostics preserved without allowing them to delay qualified empiric care?' },
    { id: 'meningitis-later', objectiveId: 'review-neurology-meningitis-strict-later-csf-clinical-and-supplied-treatment-trajectory', question: 'What did the supplied CSF strongly support, and which organism, response, and safety questions stayed open?' },
    { id: 'meningitis-handoff', objectiveId: 'handoff-neurology-meningitis-organism-treatment-complication-public-health-hearing-and-active-risk', question: 'Which microbiology, treatment, complication, public-health, hearing, and outcome risks required handoff?' },
  ] },
};
