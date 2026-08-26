/** Carbon-monoxide recognition, consultation, and delayed-risk transition. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const CARBON_MONOXIDE_REASSURING_MONITOR: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'carbon-monoxide-reassuring-monitor', version: '0.1.0', maturity: 'draft',
    title: 'Carbon monoxide with a reassuring monitor', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 6, difficulty: 'advanced', objectives: [
      { id: 'reconcile-toxicology-carbon-monoxide-shared-exposure-clock-syncope-symptoms-pulse-ox-and-whole-patient', statement: 'Reconcile the shared exposure, clock, syncope, symptoms, conventional pulse oximetry, and whole patient.', measure: 'The documented enclosed-space generator exposure, similarly symptomatic partner, transient loss of consciousness, headache, nausea, confusion, conventional SpO2 99%, elapsed time, and whole-patient state were connected without learner history, examination, monitoring, sampling, or calculation.' },
      { id: 'recognize-toxicology-carbon-monoxide-pattern-despite-reassuring-pulse-ox-without-single-value-closure', statement: 'Recognize a carbon-monoxide pattern despite reassuring pulse oximetry and without single-value closure.', measure: 'Exposure and neurologic findings prompted urgent suspected carbon-monoxide-pattern recognition while conventional pulse oximetry was treated as unreliable and neurologic, cardiac, metabolic, toxic, traumatic, infectious, and other causes remained open.' },
      { id: 'activate-toxicology-carbon-monoxide-source-safety-qualified-oxygen-monitoring-poison-center-and-emergency-ownership', statement: 'Activate source safety, qualified oxygen, monitoring, and poison-center and emergency ownership.', measure: 'Removal from exposure, scene and co-exposed-person escalation, existing high-concentration oxygen, continuous monitoring, poison-center or medical-toxicology consultation, and emergency ownership were recorded without learner oxygen, device, drug, or procedure selection.' },
      { id: 'review-toxicology-carbon-monoxide-supplied-cooximetry-neurologic-cardiac-and-severity-boundary', statement: 'Review supplied co-oximetry and the neurologic, cardiac, and severity boundary.', measure: 'Supplied COHb 28%, sample and oxygen timing, transient loss of consciousness, confusion, ECG, glucose, and whole-patient severity were integrated without treating COHb magnitude as a severity score or excluding co-exposure and alternative causes.' },
      { id: 'record-toxicology-carbon-monoxide-selected-patient-hyperbaric-consultation-and-strict-reassessment', statement: 'Record selected-patient hyperbaric consultation, then reassess a strict later report.', measure: 'Qualified hyperbaric-center consultation was recorded as an individualized decision based on symptoms, severity, availability, transport, and time; a fixed later neurologic and COHb report was reviewed after elapsed time without claiming treatment selection, causality, or durable recovery.' },
      { id: 'handoff-toxicology-carbon-monoxide-delayed-neurologic-cardiac-exposure-followup-and-active-risk', statement: 'Hand off delayed neurologic, cardiac, exposure, follow-up, and active risk.', measure: 'The handoff preserved serial clinical and co-oximetry evidence, cardiac surveillance, co-exposed-person and scene safety, delayed neurologic complications, follow-up, disposition, and outcome uncertainty.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0', sources: [
        'CDC. Clinical Guidance for Carbon Monoxide Poisoning Following Disasters and Severe Weather. Updated 2024-07-08.',
        'American College of Emergency Physicians. A Critical Issue in the Management of Adult Patients Presenting to the Emergency Department With Acute Carbon Monoxide Poisoning. Ann Emerg Med. 2025;85:e45-e59. doi:10.1016/j.annemergmed.2024.12.005.',
      ] },
    limitations: ['carbon-monoxide-exposure-cooximetry-clinical-transition-and-response-are-authored',
      'carbon-monoxide-controls-reconcile-recognize-support-review-consult-reassess-and-handoff-only',
      'no-live-exposure-diagnosis-cooximetry-oxygen-selection-hyperbaric-eligibility-treatment-or-outcome'],
  },
  patient: {
    ageYears: 36, sex: 'male', heightCm: 178, weightKg: 79, asaClass: 2,
    diagnosis: 'Authored suspected acute carbon-monoxide poisoning pattern after documented exposure',
    procedure: 'calm hidden-hypoxia recognition, escalation, selected-patient consultation, reassessment, and handoff practice',
    comorbidities: ['Documented generator exhaust exposure in an attached garage during a power outage'],
    medications: ['Exact home medicines and additional toxic exposures remain qualified-team work'],
    allergies: ['No known drug allergies'], fasting: 'Not relevant to the toxicology fixture',
    baseline: { heartRateBpm: 112, meanArterialMmHg: 89, strokeVolumeMl: 66,
      hemoglobinGPerDl: 14.2, bloodVolumeMl: 5_100, coreTemperatureC: 36.8,
      arterialStiffness: 1, baroreflexGain: 0.7, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Confused but speaking and handling secretions in the supplied fixture' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 1, tidalVolumeMl: 450, respiratoryRateBpm: 10,
      freshGasFlowLPerMin: 10, delivering: true } }, formulary: [],
  timeline: [
    { id: 'carbon-monoxide-reassuring-monitor-presentation', type: 'narrative', target: 'carbon-monoxide-reassuring-monitor-transition', atTick: 0,
      severity: 'critical', message: 'A 36-year-old man and his partner developed headache, nausea, and dizziness after a generator ran in an attached garage during a power outage. He briefly lost consciousness before removal and remains confused. The qualified team has confirmed removal from exposure and is already delivering high-concentration oxygen. Authored monitor state is sinus tachycardia 112/min, BP 118/74 mmHg (MAP 89), RR 24/min, pulse-coherent conventional SpO2 99%, and T 36.8°C. There is no authored fire, smoke inhalation, burn, trauma, focal neurologic deficit, seizure, chest pain, pulmonary edema, or hypotension.' },
    { id: 'carbon-monoxide-reassuring-monitor-evidence', type: 'narrative', target: 'carbon-monoxide-reassuring-monitor-transition', atTick: 0,
      severity: 'warning', message: 'A supplied multiwavelength co-oximetry sample drawn after removal and initial qualified oxygen reports carboxyhemoglobin 28%. Supplied glucose is normal and ECG shows sinus tachycardia without authored acute ischemic change. Conventional two-wavelength pulse oximetry cannot rule out carbon-monoxide poisoning, and COHb magnitude does not reliably grade severity or outcome. Exposure context, elapsed time, oxygen already received, transient loss of consciousness, neurologic findings, cardiac findings, and the whole patient must travel together.' },
    { id: 'carbon-monoxide-reassuring-monitor-boundary', type: 'narrative', target: 'carbon-monoxide-reassuring-monitor-transition-boundary', atTick: 0,
      severity: 'warning', message: 'Reconcile the shared exposure, clock, syncope, symptoms, conventional pulse oximetry, and whole patient; recognize a suspected carbon-monoxide pattern without single-value closure; record removal and scene safety, continued qualified high-concentration oxygen and monitoring, co-exposed-person escalation, poison-center or medical-toxicology consultation, and emergency ownership; then review supplied co-oximetry, neurologic, cardiac, metabolic, co-exposure, and severity evidence. The learner may record only qualified hyperbaric-center consultation. Selection remains individualized around symptoms, neurologic or cardiac involvement, severity, availability, transport risk, and elapsed time; no universal threshold, chamber destination, pressure, duration, transfer plan, eligibility result, or treatment is exposed. After elapsed simulated time, a strict fixed report supplies clearer orientation, easing headache and nausea, sinus rate 92/min, RR 18/min, conventional SpO2 100%, and co-oximetry COHb 7%. This does not prove individualized treatment effect, hyperbaric benefit, complete toxin clearance, durable neurologic recovery, cardiac safety, co-exposure exclusion, disposition, prognosis, or outcome. After another elapsed interval, hand off exposure and source safety, co-exposed people, serial neurologic and cardiac findings, serial co-oximetry with timing, delayed neurologic complications, follow-up, disposition, and outcome uncertainty. The controls do not take history; examine; acquire or interpret monitoring, blood gas, co-oximetry, laboratory, ECG, imaging, or another test; diagnose; select or deliver oxygen, a drug, dose, route, access, infusion, fluid, or device; choose hyperbaric treatment or transport; perform a procedure; determine eligibility, disposition, or prognosis; or predict response, recurrence, survival, or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'carbon-monoxide-trajectory', objectiveId: 'reconcile-toxicology-carbon-monoxide-shared-exposure-clock-syncope-symptoms-pulse-ox-and-whole-patient', question: 'Which shared-exposure, clock, syncope, symptom, pulse-oximetry, and whole-patient findings established the trajectory?' },
    { id: 'carbon-monoxide-recognition', objectiveId: 'recognize-toxicology-carbon-monoxide-pattern-despite-reassuring-pulse-ox-without-single-value-closure', question: 'Why could reassuring conventional pulse oximetry and one COHb value not close recognition or severity?' },
    { id: 'carbon-monoxide-support', objectiveId: 'activate-toxicology-carbon-monoxide-source-safety-qualified-oxygen-monitoring-poison-center-and-emergency-ownership', question: 'Which source-safety, oxygen, surveillance, co-exposed-person, and qualified-owner actions needed to begin together?' },
    { id: 'carbon-monoxide-severity', objectiveId: 'review-toxicology-carbon-monoxide-supplied-cooximetry-neurologic-cardiac-and-severity-boundary', question: 'How did sample timing, neurologic findings, cardiac findings, and the whole patient contextualize the supplied COHb?' },
    { id: 'carbon-monoxide-reassessment', objectiveId: 'record-toxicology-carbon-monoxide-selected-patient-hyperbaric-consultation-and-strict-reassessment', question: 'Why was hyperbaric review an individualized consultation, and what remained unproven after the strict later report?' },
    { id: 'carbon-monoxide-handoff', objectiveId: 'handoff-toxicology-carbon-monoxide-delayed-neurologic-cardiac-exposure-followup-and-active-risk', question: 'Which delayed neurologic, cardiac, exposure, follow-up, disposition, and outcome risks required handoff?' },
  ] },
};
