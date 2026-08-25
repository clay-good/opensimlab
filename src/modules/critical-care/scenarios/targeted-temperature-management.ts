/** Bounded post-ROSC protocolized temperature-control response. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const TARGETED_TEMPERATURE_MANAGEMENT: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'targeted-temperature-management', version: '0.1.0', maturity: 'draft',
    title: 'Post-arrest temperature control', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 8, difficulty: 'advanced', objectives: [
      { id: 'recognize-post-arrest-temperature-control', statement: 'Recognize the indication for temperature control after ROSC without making an early prognosis.', measure: 'Unresponsiveness to verbal commands triggered protocolized temperature control and post-arrest help.' },
      { id: 'review-post-arrest-temperature-context', statement: 'Integrate fixed neurologic, temperature, perfusion, oxygenation, ventilation, seizure, and cause findings.', measure: 'The whole post-ROSC panel shaped temperature strategy without treating one sign as prognostic.' },
      { id: 'activate-post-arrest-temperature-protocol', statement: 'Activate an individualized protocolized target within 32–37.5°C for at least 36 hours.', measure: 'The strategy avoided both no active control and a universally superior temperature claim.' },
      { id: 'record-temperature-control-guardrails', statement: 'Record continuous core-temperature, shivering, perfusion, organ, electrolyte, glucose, and controlled-rewarming review.', measure: 'Guardrails excluded routine rapid cold-fluid loading and rapid rewarming.' },
      { id: 'reassess-post-arrest-temperature-trajectory', statement: 'Reassess temperature and systemic physiology without claiming neurologic recovery or outcome.', measure: 'The fixed response reached the authored range while cause, brain, organ, and prognosis remained open.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Hirsch KG, Amorim E, Coppler PJ, et al. Part 11: Post-Cardiac Arrest Care: 2025 AHA Guidelines for CPR and ECC. Circulation. 2025;152(suppl 2):S673-S718.',
        'Del Rios M, et al. Part 1: Executive Summary: 2025 AHA Guidelines for CPR and ECC. Circulation. 2025;152(suppl 2):S285-S312.',
        'International Liaison Committee on Resuscitation. 2024 International Consensus on CPR and ECC Science With Treatment Recommendations. Circulation. 2024;150:e580-e687.',
      ] },
    limitations: ['post-arrest-temperature-findings-and-response-are-authored',
      'post-arrest-temperature-control-and-guardrail-actions-are-proxies',
      'no-live-post-arrest-temperature-prescribing-device-prognosis-or-outcome'],
  },
  patient: { ageYears: 61, sex: 'female', heightCm: 168, weightKg: 76, asaClass: 5,
    diagnosis: 'Unresponsive after return of spontaneous circulation from witnessed VF arrest',
    procedure: 'Post-arrest temperature control',
    comorbidities: ['Hypertension', 'Hyperlipidemia'],
    medications: ['Post-ROSC vasoactive and sedative support reported; delivery not modeled'],
    allergies: ['No known drug allergies'], fasting: 'ICU patient; enteral-nutrition state not represented',
    baseline: { heartRateBpm: 98, meanArterialMmHg: 68, strokeVolumeMl: 52,
      hemoglobinGPerDl: 12.6, bloodVolumeMl: 4800, coreTemperatureC: 38.3,
      arterialStiffness: 1.15, baroreflexGain: 0.65, fixedStrokeVolume: false },
    airway: { difficulty: 0.25, difficultMaskVentilation: false,
      assessment: 'Intubated with reported continuous capnography and bilateral ventilation' },
    respiratory: { profile: 'moderately-ill' } },
  equipment: { monitoring: ['ecg', 'arterial-line', 'pulse-oximetry', 'capnography', 'temperature'],
    airwayDevice: 'tracheal-tube', ventilator: { mode: 'volume-control', fio2: 0.4,
      tidalVolumeMl: 440, respiratoryRateBpm: 18, freshGasFlowLPerMin: 10, delivering: true } },
  formulary: [],
  timeline: [
    { id: 'post-arrest-temperature-presentation', type: 'narrative', target: 'targeted-temperature-management',
      atTick: 0, severity: 'critical', message: 'A 61-year-old intubated woman achieved ROSC 32 minutes ago after a witnessed VF arrest. She does not follow verbal commands. Core temperature is 38.3°C and rising, HR is 98/min, MAP 68 mmHg on reported vasoactive support, SpO₂ 96% on FiO₂ 0.40, EtCO₂ 36 mmHg, urine output 20 mL/h, and lactate is 5.1 mmol/L. No deliberate temperature-control strategy has been recorded.' },
    { id: 'post-arrest-temperature-boundary', type: 'narrative', target: 'targeted-temperature-management-boundary',
      atTick: 0, severity: 'warning', message: 'Fixed review reports no command following, equal reactive pupils, no current clinical or electrographic seizure, a perfusing sinus rhythm, reported bilateral ventilation and continuous capnography, no active external bleeding, and ongoing cardiac-arrest cause evaluation. Activate post-arrest, cardiac, neurologic, nursing, pharmacy, and temperature-control help. Choose and maintain an individualized protocolized temperature between 32°C and 37.5°C for at least 36 hours while avoiding fever; no one temperature in that range is taught as universally superior. Record continuous core-temperature, shivering, sedation, ventilation, perfusion, rhythm, electrolyte, glucose, skin, device, and controlled-rewarming review. Routine rapid cold-IV-fluid loading is not selected, and rewarming faster than 0.5°C/h is avoided. Examination, monitoring, EEG, laboratory or imaging acquisition or interpretation, diagnosis, oxygen, ventilation, fluid or drug delivery, access, dosing, cooling or warming device use, shivering treatment, coronary or cause-specific treatment, neuroprognostication, transfer, disposition, and outcome are not simulated.' },
  ],
  debrief: { rubric: [
    { id: 'post-arrest-temperature-recognition', objectiveId: 'recognize-post-arrest-temperature-control', question: 'Why did absent command following trigger deliberate temperature control without supporting prognosis?' },
    { id: 'post-arrest-temperature-context', objectiveId: 'review-post-arrest-temperature-context', question: 'Which neurologic and systemic findings shaped the temperature strategy?' },
    { id: 'post-arrest-temperature-protocol', objectiveId: 'activate-post-arrest-temperature-protocol', question: 'Why was the protocol range individualized rather than fixed at one universally superior target?' },
    { id: 'post-arrest-temperature-guardrails', objectiveId: 'record-temperature-control-guardrails', question: 'Which monitoring, shivering, organ, fluid, and rewarming guardrails mattered?' },
    { id: 'post-arrest-temperature-response', objectiveId: 'reassess-post-arrest-temperature-trajectory', question: 'What improved in the authored response, and why did brain recovery and prognosis remain open?' },
  ] },
};
