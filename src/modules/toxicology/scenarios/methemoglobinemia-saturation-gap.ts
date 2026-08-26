/** Methemoglobinemia recognition and bounded antidote-intent transition. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const METHEMOGLOBINEMIA_SATURATION_GAP: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'methemoglobinemia-saturation-gap', version: '0.1.0', maturity: 'draft',
    title: 'Methemoglobinemia with a saturation gap', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 6, difficulty: 'advanced', objectives: [
      { id: 'reconcile-toxicology-methemoglobinemia-exposure-cyanosis-symptoms-pulse-ox-arterial-oxygen-and-whole-patient', statement: 'Reconcile the exposure, cyanosis, symptoms, pulse oximetry, arterial oxygen evidence, and whole patient.', measure: 'The documented benzocaine exposure, dusky appearance, dyspnea, headache, confusion, pulse-coherent SpO2 85%, PaO2 238 mmHg, and whole-patient state were connected without learner history, examination, monitoring, sampling, or calculation.' },
      { id: 'recognize-toxicology-methemoglobinemia-dyshemoglobin-pattern-without-single-number-or-diagnostic-closure', statement: 'Recognize a dyshemoglobin pattern without relying on one number or closing the diagnosis.', measure: 'The discordant evidence prompted urgent methemoglobinemia-pattern recognition while pulmonary, circulatory, hemolytic, inherited, medication, toxic, and other causes remained open.' },
      { id: 'activate-toxicology-methemoglobinemia-support-monitoring-source-control-poison-center-and-critical-care-ownership', statement: 'Activate support, monitoring, source control, and qualified toxicology and critical-care ownership.', measure: 'Existing high-concentration oxygen, continuous monitoring, oxidant cessation, poison-center or medical-toxicology consultation, and critical-care ownership were recorded without learner oxygen, device, drug, or procedure selection.' },
      { id: 'review-toxicology-methemoglobinemia-supplied-cooximetry-and-methylene-blue-hazard-boundary', statement: 'Review supplied co-oximetry and the methylene-blue hazard boundary.', measure: 'Chocolate-brown blood, PaO2 238 mmHg, calculated saturation 99%, and co-oximetry methemoglobin 32% were integrated with G6PD-deficiency hemolysis and serotonergic-drug hazards kept explicit.' },
      { id: 'record-toxicology-methemoglobinemia-bounded-qualified-team-antidote-intent-and-strict-reassessment', statement: 'Record bounded qualified-team antidote intent, then reassess a strict later report.', measure: 'Qualified-team methylene-blue intent was recorded without dose, route, eligibility, or delivery; the fixed later symptoms, heart rate 98/min, and co-oximetry methemoglobin 8% were reviewed after elapsed time without treating pulse oximetry as proof.' },
      { id: 'handoff-toxicology-methemoglobinemia-exposure-rebound-hemolysis-serotonin-rescue-and-active-risk', statement: 'Hand off exposure, rebound, hemolysis, serotonin, rescue, and active risk.', measure: 'The handoff preserved serial clinical and co-oximetry evidence, exposure control, contraindication hazards, rebound, rescue alternatives, disposition, and outcome uncertainty.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0', sources: [
        'American Heart Association. 2023 Focused Update on Life-Threatening Toxicity Due to Poisoning. Circulation. 2023;148:e149-e184. doi:10.1161/CIR.0000000000001161.',
        'Iolascon A, et al. Recommendations for diagnosis and treatment of methemoglobinemia. Am J Hematol. 2021;96(12):1666-1678. PMID:34467556.',
        'DailyMed. Methylene Blue Injection prescribing information. Set ID 4f222ee5-df03-46d5-a060-c63565b7186f. Updated 2026-02-09.',
      ] },
    limitations: ['methemoglobinemia-exposure-saturation-gap-cooximetry-and-response-are-authored',
      'methemoglobinemia-controls-reconcile-recognize-support-review-intent-reassess-and-handoff-only',
      'no-live-dyshemoglobin-diagnosis-gas-calculation-antidote-dose-delivery-rescue-or-outcome'],
  },
  patient: {
    ageYears: 42, sex: 'female', heightCm: 165, weightKg: 68, asaClass: 2,
    diagnosis: 'Authored suspected acquired methemoglobinemia pattern after documented oxidant exposure',
    procedure: 'calm discordance recognition, escalation, bounded antidote intent, reassessment, and handoff practice',
    comorbidities: ['Documented topical benzocaine exposure during a completed procedure'],
    medications: ['Exact home medicines, serotonergic agents, opioids, and recent oxidant exposure remain qualified-team work'],
    allergies: ['No known drug allergies'], fasting: 'Not relevant to the toxicology fixture',
    baseline: { heartRateBpm: 122, meanArterialMmHg: 83, strokeVolumeMl: 62,
      hemoglobinGPerDl: 13.4, bloodVolumeMl: 4_500, coreTemperatureC: 36.9,
      arterialStiffness: 1, baroreflexGain: 0.7, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Confused but speaking in short sentences and handling secretions in the supplied fixture' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 1, tidalVolumeMl: 420, respiratoryRateBpm: 10,
      freshGasFlowLPerMin: 10, delivering: true } }, formulary: [],
  timeline: [
    { id: 'methemoglobinemia-saturation-gap-presentation', type: 'narrative', target: 'methemoglobinemia-saturation-gap-transition', atTick: 0,
      severity: 'critical', message: 'A 42-year-old woman becomes dusky, dyspneic, headachy, and confused 30 minutes after documented topical benzocaine exposure during a completed procedure. The qualified team is already delivering high-concentration oxygen. Authored monitor state is sinus tachycardia 122/min, BP 112/68 mmHg (MAP 83), RR 26/min, pulse-coherent SpO2 85%, and T 36.9°C. There is no authored airway obstruction, wheeze, focal lung finding, pulmonary edema, hypotension, major hemorrhage, fever, focal neurologic deficit, or witnessed seizure.' },
    { id: 'methemoglobinemia-saturation-gap-evidence', type: 'narrative', target: 'methemoglobinemia-saturation-gap-transition', atTick: 0,
      severity: 'warning', message: 'A supplied arterial sample is chocolate-brown. Its authored PaO2 is 238 mmHg and calculated oxygen saturation 99%; multiwavelength co-oximetry reports methemoglobin 32%. The pulse-coherent SpO2, arterial oxygen evidence, exposure, symptoms, and blood observation support urgent dyshemoglobin-pattern recognition but no single number makes a learner diagnosis. Pulmonary, circulatory, hemolytic, inherited, medication, toxic, equipment, and other causes remain open.' },
    { id: 'methemoglobinemia-saturation-gap-boundary', type: 'narrative', target: 'methemoglobinemia-saturation-gap-transition-boundary', atTick: 0,
      severity: 'warning', message: 'Reconcile exposure, cyanosis, symptoms, pulse oximetry, arterial oxygen evidence, and the whole patient; recognize a suspected methemoglobinemia pattern without diagnostic closure; record continued qualified oxygen and monitoring, oxidant-source cessation, poison-center or medical-toxicology consultation, and critical-care ownership; then review the supplied co-oximetry and methylene-blue hazard boundary. G6PD deficiency carries severe hemolysis risk, and serotonergic medicines and opioids require an explicit serotonin-syndrome hazard review. The learner may record only bounded qualified-team methylene-blue intent; no product, dose, route, preparation, access, infusion, eligibility result, or delivery is exposed. After elapsed simulated time, a strict fixed report supplies clearer mentation, easier breathing, heart rate 98/min, and co-oximetry methemoglobin 8%. Conventional pulse oximetry remains secondary and is not proof of treatment success. No individualized effect, treatment causality, rebound exclusion, hemolysis exclusion, serotonin-syndrome exclusion, ongoing-exposure exclusion, rescue eligibility, disposition, prognosis, or outcome is reported. Qualified teams retain repeated co-oximetry, laboratory and medication review, rescue alternatives such as exchange transfusion or hyperbaric oxygen when appropriate, and all treatment decisions. After another elapsed interval, hand off exposure, serial findings, co-oximetry, contraindication hazards, rebound, rescue planning, disposition, and outcome uncertainty. The controls do not take history; examine; acquire or interpret monitoring, blood gas, co-oximetry, laboratory, ECG, imaging, or another test; calculate a saturation gap; diagnose; select or deliver oxygen, a drug, dose, route, access, infusion, fluid, or device; perform a procedure; determine eligibility, disposition, or prognosis; or predict response, recurrence, survival, or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'methemoglobinemia-trajectory', objectiveId: 'reconcile-toxicology-methemoglobinemia-exposure-cyanosis-symptoms-pulse-ox-arterial-oxygen-and-whole-patient', question: 'Which exposure, symptom, pulse-oximetry, arterial oxygen, and whole-patient findings established the discordant trajectory?' },
    { id: 'methemoglobinemia-recognition', objectiveId: 'recognize-toxicology-methemoglobinemia-dyshemoglobin-pattern-without-single-number-or-diagnostic-closure', question: 'Why did the pattern require urgent dyshemoglobin action without a single-number diagnosis or closed differential?' },
    { id: 'methemoglobinemia-support', objectiveId: 'activate-toxicology-methemoglobinemia-support-monitoring-source-control-poison-center-and-critical-care-ownership', question: 'Which support, source control, surveillance, and qualified owners needed to begin together?' },
    { id: 'methemoglobinemia-hazards', objectiveId: 'review-toxicology-methemoglobinemia-supplied-cooximetry-and-methylene-blue-hazard-boundary', question: 'What did co-oximetry add, and which G6PD and serotonergic hazards had to remain explicit?' },
    { id: 'methemoglobinemia-reassessment', objectiveId: 'record-toxicology-methemoglobinemia-bounded-qualified-team-antidote-intent-and-strict-reassessment', question: 'What did the bounded antidote intent and strict later report establish without proving individualized effect?' },
    { id: 'methemoglobinemia-handoff', objectiveId: 'handoff-toxicology-methemoglobinemia-exposure-rebound-hemolysis-serotonin-rescue-and-active-risk', question: 'Which exposure, rebound, hemolysis, serotonin, rescue, disposition, and outcome risks required handoff?' },
  ] },
};
