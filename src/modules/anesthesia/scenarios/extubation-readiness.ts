/** Low-risk awake-extubation readiness integration without tube removal. */

import type { Scenario } from './types';

export const EXTUBATION_READINESS: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'extubation-readiness', version: '0.1.0', maturity: 'draft',
    title: 'Extubation readiness', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 5, difficulty: 'intermediate',
    objectives: [
      {
        id: 'confirm-extubation-quantitative-recovery',
        statement: 'Confirm quantitative neuromuscular recovery without treating it as the whole decision.',
        measure: 'A train-of-four ratio of 0.93 was reviewed before the broader readiness assessment.',
      },
      {
        id: 'assess-awake-airway-protection',
        statement: 'Review awake response, command following, cough, and secretion management.',
        measure: 'The fixed awake-airway findings were accepted after quantitative recovery.',
      },
      {
        id: 'assess-extubation-gas-exchange',
        statement: 'Review spontaneous breathing, ventilation, and oxygenation together.',
        measure: 'The bounded breathing and gas-exchange findings were accepted after awake-airway review.',
      },
      {
        id: 'plan-extubation-risk-and-rescue',
        statement: 'Classify the airway as low risk only after checking airway change, resources, and a rescue plan.',
        measure: 'The fixed airway-risk and reintubation-plan review was accepted before the decision.',
      },
      {
        id: 'integrate-awake-extubation-readiness',
        statement: 'Integrate every declared checkpoint into a planned awake-extubation readiness decision.',
        measure: 'Readiness was accepted after all four reviews without simulating tube removal.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0',
      sources: [
        'Difficult Airway Society Extubation Guidelines Group, et al. Difficult Airway Society Guidelines for the management of tracheal extubation. Anaesthesia. 2012;67:318-340. PMID 22321104.',
        'Apfelbaum JL, et al. 2022 American Society of Anesthesiologists Practice Guidelines for Management of the Difficult Airway. Anesthesiology. 2022;136:31-81. PMID 34762729.',
        'Thilen SR, et al. 2023 American Society of Anesthesiologists Practice Guidelines for Monitoring and Antagonism of Neuromuscular Blockade. Anesthesiology. 2023;138:13-41. PMID 36520073.',
      ],
    },
    limitations: [
      'extubation-readiness-findings-are-fixed',
      'low-risk-awake-extubation-only',
      'no-airway-removal-or-postextubation-outcome',
    ],
  },
  patient: {
    ageYears: 47, sex: 'male', heightCm: 178, weightKg: 82, asaClass: 2,
    diagnosis: 'Symptomatic cholelithiasis', procedure: 'Laparoscopic cholecystectomy',
    comorbidities: ['Controlled hypertension'], medications: ['Lisinopril'],
    allergies: ['None known'], fasting: 'Eight hours for solids, two hours for clear fluids',
    baseline: {
      heartRateBpm: 72, meanArterialMmHg: 86, strokeVolumeMl: 72,
      hemoglobinGPerDl: 14.2, bloodVolumeMl: 5200, coreTemperatureC: 36.8,
      arterialStiffness: 1.05, baroreflexGain: 0.9, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.08, difficultMaskVentilation: false,
      assessment: 'Mask ventilation and tracheal intubation were uncomplicated; no airway surgery, edema, bleeding, or distortion is declared',
    },
    respiratory: { profile: 'healthy' },
  },
  equipment: {
    monitoring: [
      'ecg', 'nibp', 'capnography', 'pulse-oximetry', 'temperature', 'train-of-four',
    ],
    airwayDevice: 'tracheal-tube', startingTrainOfFourRatio: 0.93,
    ventilator: {
      mode: 'volume-control', fio2: 0.4, tidalVolumeMl: 480,
      respiratoryRateBpm: 10, freshGasFlowLPerMin: 4,
      sevofluranePercent: 0, delivering: true,
    },
  },
  formulary: [],
  timeline: [{
    id: 'extubation-readiness-briefing', type: 'narrative',
    target: 'extubation-readiness', atTick: 0, severity: 'warning',
    message: 'Surgery and anesthetic delivery have ended. The tracheal tube and delivered ventilation remain in place. A quantitative train-of-four ratio above 0.90 is only the first checkpoint: review awake airway protection, bounded spontaneous gas exchange, airway risk, and the rescue plan before deciding whether the declared low-risk patient is ready for a planned awake extubation. Tube removal and post-extubation outcome are not simulated.',
  }],
  debrief: { rubric: [
    { id: 'extubation-recovery', objectiveId: 'confirm-extubation-quantitative-recovery', question: 'Why was a ratio above 0.90 necessary but not sufficient?' },
    { id: 'extubation-airway', objectiveId: 'assess-awake-airway-protection', question: 'Which awake and airway-protection findings did you review?' },
    { id: 'extubation-gas', objectiveId: 'assess-extubation-gas-exchange', question: 'Which breathing, ventilation, and oxygenation findings belonged together?' },
    { id: 'extubation-plan', objectiveId: 'plan-extubation-risk-and-rescue', question: 'What made this declared airway low risk, and what rescue planning still mattered?' },
    { id: 'extubation-integration', objectiveId: 'integrate-awake-extubation-readiness', question: 'How did you integrate the checkpoints without treating the screen as extubation technique?' },
  ] },
};
