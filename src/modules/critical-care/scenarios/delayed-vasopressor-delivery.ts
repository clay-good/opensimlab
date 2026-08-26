/** Bounded vasopressor command-versus-delivery systems lesson. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const DELAYED_VASOPRESSOR_DELIVERY: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'delayed-vasopressor-delivery', version: '0.1.0', maturity: 'preview',
    title: 'Delayed vasopressor delivery', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 8, difficulty: 'intermediate', objectives: [
      { id: 'review-vasopressor-command-delivery-discordance', statement: 'Recognize that a running pump command does not prove vasopressor delivery to the patient.', measure: 'Persistent shock, the event log, and the fixed delivery record were reconciled.' },
      { id: 'trace-vasopressor-source-to-patient-path', statement: 'Trace the declared syringe, pump, tubing, connections, downstream volume, carrier, catheter, and patient.', measure: 'The complete source-to-patient path was reviewed without manipulating equipment.' },
      { id: 'classify-vasopressor-dead-space-startup-delay', statement: 'Classify the fixed pattern as delayed delivery from dead-space and startup mechanics while keeping other causes open.', measure: 'Command, transit, and patient delivery remained separate states.' },
      { id: 'activate-vasopressor-startup-safety-plan', statement: 'Activate nursing, pharmacy, and local safe-start or changeover protocol without flushing concentrated drug into the patient.', measure: 'The proxy preserved device, sterility, pressure, bolus, and prescribing boundaries.' },
      { id: 'reassess-vasopressor-delivery-and-perfusion', statement: 'Reassess delivery evidence, pressure, perfusion, and the ongoing shock plan.', measure: 'The fixed response improved but did not close shock, durability, or outcome.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Weiss M, van der Eijk A, Lönnqvist PA, Lucchini A, Timmerman A. 10 clinical tips for advancing patient safety when using syringe pump systems for microinfusion intravenous drug therapy. Eur J Anaesthesiol. 2023;40:387-390. PMID:37132300.',
        'Lovich MA, et al. Infusion system carrier flow perturbations and dead-volume: large effects on drug delivery in vitro and hemodynamic responses in a swine model. Anesth Analg. 2015;120:1255-1263. PMID:25811259.',
        'Baeckert M, Batliner M, Grass B, et al. Performance of modern syringe infusion pump assemblies at low infusion rates in the perioperative setting. Br J Anaesth. 2020;124:173-182.',
        'Neves EB, et al. Start-up delay in syringe infusion pumps with different rates and priming techniques of intravenous sets. Rev Gaucha Enferm. 2022;43:e20210071.',
      ] },
    limitations: ['vasopressor-delivery-setup-mechanics-and-response-are-authored',
      'vasopressor-delivery-controls-record-review-and-protocol-intent-only',
      'no-live-infusion-calculation-manipulation-drug-delivery-or-outcome'],
  },
  patient: { ageYears: 58, sex: 'female', heightCm: 165, weightKg: 72, asaClass: 5,
    diagnosis: 'Authored septic shock with delayed vasopressor delivery',
    procedure: 'Vasopressor infusion-path and startup review',
    comorbidities: ['Type 2 diabetes mellitus'], medications: ['New vasopressor microinfusion'],
    allergies: ['No known drug allergies'], fasting: 'ICU patient; nutrition state not represented',
    baseline: { heartRateBpm: 124, meanArterialMmHg: 54, strokeVolumeMl: 44,
      hemoglobinGPerDl: 10.8, bloodVolumeMl: 4700, coreTemperatureC: 39,
      arterialStiffness: 1.05, baroreflexGain: 0.7, fixedStrokeVolume: false },
    airway: { difficulty: 0.15, difficultMaskVentilation: false,
      assessment: 'Established tracheal tube with continuous capnography' },
    respiratory: { profile: 'moderately-ill' } },
  equipment: { monitoring: ['ecg', 'arterial-line', 'pulse-oximetry', 'capnography', 'temperature'],
    airwayDevice: 'tracheal-tube', ventilator: { mode: 'volume-control', fio2: 0.4,
      tidalVolumeMl: 410, respiratoryRateBpm: 20, freshGasFlowLPerMin: 10, delivering: true } },
  formulary: [],
  timeline: [
    { id: 'delayed-vasopressor-delivery-presentation', type: 'narrative',
      target: 'delayed-vasopressor-delivery', atTick: 0, severity: 'critical',
      message: 'A newly connected vasopressor syringe pump has displayed RUNNING at 1 mL/h for 6 minutes, but MAP remains 54 mmHg, HR 124/min, refill 5 seconds, urine 8 mL/h, mottling extends above the knees, lactate is 5.6 mmol/L, EtCO₂ is 29 mmHg, and SpO₂ is 95% on FiO₂ 0.40. The fixed setup record declares a drug-free 0.6 mL downstream segment beyond the mixing point, carrier flow 2 mL/h, a patent dedicated central lumen, no occlusion alarm, and no detected drug arrival at the catheter tip. The pump command, line transit, and patient delivery are separate teaching states; no response has been recorded.' },
    { id: 'delayed-vasopressor-delivery-boundary', type: 'narrative',
      target: 'delayed-vasopressor-delivery-boundary', atTick: 0, severity: 'warning',
      message: 'Recognize persistent shock despite a running command; review the timestamped pump and connection record; then trace the labeled syringe, pump, secure fit, tubing compliance and resistance, valves and connectors, mixing point, downstream volume, carrier flow, stopcock state and level, catheter, occlusion status, and patient. The fixed record supports delayed patient delivery from dead-space transit and startup mechanics, while wrong drug, concentration, rate, route, access, occlusion, extravasation, incompatibility, pump fault, changing shock, and measurement error remain open. Activate bedside nursing, pharmacy, critical-care, and the local device-specific safe-start or changeover protocol; do not flush or purge concentrated vasopressor into the patient. Fixed 5-minute response is documented drug arrival, MAP 67 mmHg, HR 108/min, refill 3 seconds, EtCO₂ 32 mmHg, unchanged SpO₂ 95% on FiO₂ 0.40, and temperature 38.9°C. Shock, source control, dose adequacy, line durability, later perfusion, and outcome remain open. The screen does not inspect, measure, calculate, prime, purge, flush, bolus, program, prescribe, compound, or deliver a drug; manipulate equipment; diagnose shock; determine disposition; or predict outcome.' },
  ],
  debrief: { rubric: [
    { id: 'vasopressor-delivery-discordance', objectiveId: 'review-vasopressor-command-delivery-discordance', question: 'Which evidence separated pump running from drug reaching the patient?' },
    { id: 'vasopressor-delivery-path', objectiveId: 'trace-vasopressor-source-to-patient-path', question: 'Which declared components belong in a complete source-to-patient trace?' },
    { id: 'vasopressor-delivery-classification', objectiveId: 'classify-vasopressor-dead-space-startup-delay', question: 'Why did the fixed setup support delayed delivery without closing other causes?' },
    { id: 'vasopressor-delivery-plan', objectiveId: 'activate-vasopressor-startup-safety-plan', question: 'Which local protocol and bolus guardrails made the response safe?' },
    { id: 'vasopressor-delivery-reassessment', objectiveId: 'reassess-vasopressor-delivery-and-perfusion', question: 'Which delivery and perfusion signals improved, and what remained open?' },
  ] },
};
