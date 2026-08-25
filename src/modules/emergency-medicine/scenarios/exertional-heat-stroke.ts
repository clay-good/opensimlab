/** Bounded adult exertional-heat-stroke recognition, cooling, and surveillance pathway. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const EXERTIONAL_HEAT_STROKE: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'exertional-heat-stroke', version: '0.1.0', maturity: 'draft',
    title: 'Exertional heat stroke', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 8, difficulty: 'intermediate', objectives: [
      { id: 'recognize-exertional-heat-stroke', statement: 'Recognize exertional heat stroke from CNS dysfunction and an elevated rectal core temperature while reviewing immediate mimics.', measure: 'The fixed exertion, neurologic, temperature, glucose, sodium, trauma, and medication pattern was integrated.' },
      { id: 'stabilize-and-prepare-heat-stroke-cooling', statement: 'Activate help, record ABC support and monitoring, remove insulating clothing, and prepare immediate active cooling.', measure: 'The bounded support bundle followed recognition without delaying cooling.' },
      { id: 'cool-exertional-heat-stroke-rapidly', statement: 'Record whole-body cold-water immersion with continuous rectal core-temperature monitoring and transport coordination.', measure: 'Rapid conductive cooling was prioritized over slower adjuncts and transport delay.' },
      { id: 'stop-heat-stroke-cooling-at-target', statement: 'Review the fixed cooling panel and stop active cooling below 39°C to limit overshoot.', measure: 'Cooling stopped at the authored 38.9°C panel rather than continuing toward normal temperature.' },
      { id: 'monitor-heat-stroke-organ-injury', statement: 'Record critical-care surveillance for delayed renal, hepatic, coagulation, muscle, electrolyte, glucose, and urine abnormalities.', measure: 'The handoff kept delayed organ injury visible and explicitly excluded antipyretics and dantrolene.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Eifling KP, et al. Wilderness Medical Society Clinical Practice Guidelines for the Prevention and Treatment of Heat Illness: 2024 Update. Wilderness Environ Med. 2024;35(1 Suppl):112S-127S. doi:10.1177/10806032241227924.',
        'Society of Critical Care Medicine. Guideline for the Treatment of Heat Stroke. 2024.',
      ],
    },
    limitations: ['heat-stroke-temperature-neurologic-cooling-and-organ-panels-are-authored',
      'heat-stroke-support-immersion-monitoring-and-handoff-controls-are-proxies',
      'no-live-heat-stroke-exam-cooling-fluids-labs-complications-transport-or-outcome'],
  },
  patient: {
    ageYears: 29, sex: 'female', heightCm: 170, weightKg: 64, asaClass: 4,
    diagnosis: 'Exertional heat stroke with encephalopathy',
    procedure: 'Emergency active cooling and organ-injury surveillance',
    comorbidities: ['No known chronic illness'], medications: ['Sertraline'],
    allergies: ['No known drug allergies'], fasting: 'Completed a half marathon in high heat and humidity',
    baseline: { heartRateBpm: 146, meanArterialMmHg: 67, strokeVolumeMl: 48,
      hemoglobinGPerDl: 15.0, bloodVolumeMl: 4000, coreTemperatureC: 41.3,
      arterialStiffness: 1.0, baroreflexGain: 0.9, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Agitated and confused, speaking incoherently, breathing spontaneously' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'],
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 520,
      respiratoryRateBpm: 28, freshGasFlowLPerMin: 10, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'heat-stroke-presentation', type: 'narrative', target: 'exertional-heat-stroke', atTick: 0,
      severity: 'critical', message: 'A 29-year-old runner collapses near a half-marathon finish in high heat and humidity. She is agitated, confused, and speaking incoherently with HR 146/min, BP 92/54 mmHg, RR 28/min, hot wet skin, and a fixed rectal core temperature of 41.3°C. Fixed point-of-care glucose is 110 mg/dL and sodium 139 mmol/L. No trauma, seizure, focal deficit, infection, stimulant exposure, or rigidity is authored.' },
    { id: 'heat-stroke-boundary', type: 'narrative', target: 'exertional-heat-stroke-boundary', atTick: 0,
      severity: 'warning', message: 'Recognize exertional heat stroke from CNS dysfunction plus measured core hyperthermia while keeping mimics open; activate help, record ABC support, monitoring, glucose review, and removal of insulating clothing; then record immediate whole-body cold-water immersion with airway access, continuous rectal core-temperature monitoring, and transport coordination. Review the fixed cooling panel and stop active cooling below 39°C. Continue critical-care surveillance for renal, hepatic, coagulation, muscle, electrolyte, glucose, urine, and neurologic abnormalities; do not use antipyretics or dantrolene for heat stroke. Examination, rectal measurement, immersion technique, cooling rate, fluids, transport, labs, complications, procedures, disposition, and outcome are not simulated.' },
  ],
  debrief: { rubric: [
    { id: 'heat-recognition', objectiveId: 'recognize-exertional-heat-stroke', question: 'Which exertion, brain, core-temperature, glucose, sodium, trauma, and medication findings established the working emergency and kept mimics open?' },
    { id: 'heat-support', objectiveId: 'stabilize-and-prepare-heat-stroke-cooling', question: 'Which support steps ran in parallel without delaying cooling?' },
    { id: 'heat-cooling', objectiveId: 'cool-exertional-heat-stroke-rapidly', question: 'Why was whole-body cold-water immersion prioritized, and how did transport fit around cooling?' },
    { id: 'heat-target', objectiveId: 'stop-heat-stroke-cooling-at-target', question: 'Why did active cooling stop at 38.9°C rather than continue to normal?' },
    { id: 'heat-organs', objectiveId: 'monitor-heat-stroke-organ-injury', question: 'Which delayed organ-injury domains remained under surveillance, and which fever-directed drugs were inappropriate?' },
  ] },
};
