/** A bounded pediatric inhalational-induction wash-in lesson for one healthy child. */

import type { Scenario } from './types';

export const ROUTINE_PEDIATRIC_INHALATIONAL_INDUCTION: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'routine-pediatric-inhalational-induction', version: '0.1.0', maturity: 'preview',
    title: 'Routine pediatric inhalational induction', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 7, difficulty: 'introductory',
    objectives: [
      {
        id: 'prepare-pediatric-inhalational-circuit',
        statement: 'Prepare oxygen and fresh-gas flow before starting volatile delivery.',
        measure: 'An accepted setting established at least 95% inspired oxygen and 6 L/min fresh-gas flow while the vaporizer remained off.',
      },
      {
        id: 'follow-pediatric-end-tidal-wash-in',
        statement: 'Follow end-tidal sevoflurane rather than treating the vaporizer dial as the patient concentration.',
        measure: 'After circuit preparation, accepted sevoflurane delivery stayed within the labeled 0–8% induction range and the recorded end-tidal concentration rose through 0.8 age-adjusted MAC.',
      },
      {
        id: 'settle-pediatric-volatile-depth',
        statement: 'Reduce delivery as end-tidal agent accumulates and reassess the modeled response.',
        measure: 'After reaching the wash-in target, an accepted reduction to 0.5–3% was followed by 60 seconds with predicted depth 40–60, mean arterial pressure at least 55 mmHg, and oxygen saturation at least 92%.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0',
      sources: [
        'United States FDA. Sevoflurane prescribing information. Indications, Dosage and Administration, Pediatric Use, and Table 9. Reference ID 4944925.',
        'Mapleson WW. Effect of age on MAC in humans: a meta-analysis. Br J Anaesth 1996;76:179-85. PMID 8777094.',
        'Welborn LG, et al. Sevoflurane versus halothane for general anesthesia in pediatric patients. J Clin Anesth 1996;8:283-92. PMID 7669316.',
        'Klein AA, et al. Recommendations for standards of monitoring during anaesthesia and recovery 2021. Anaesthesia 2021;76:1212-23. PMID 34013531.',
      ],
    },
    limitations: [
      'pediatric-respiratory-profile-is-a-teaching-model',
      'pediatric-hemodynamic-maturation-is-not-modeled',
      'pediatric-airway-equipment-sizing-is-not-modeled',
      'pediatric-case-is-one-bounded-profile',
      'pediatric-emergence-is-not-modeled',
      'fresh-gas-flow-is-a-teaching-model',
      'depth-index-is-a-drug-model-not-an-eeg',
      'pediatric-inhalational-induction-behavior-is-not-modeled',
      'volatile-circulatory-effect-is-a-teaching-model',
    ],
  },
  patient: {
    ageYears: 6, sex: 'female', heightCm: 115, weightKg: 20, asaClass: 1,
    diagnosis: 'Chronic otitis media with effusion', procedure: 'Bilateral myringotomy and tympanostomy tubes',
    comorbidities: [], medications: [], allergies: ['None known'],
    fasting: 'Eight hours for solids, two hours for clear fluids',
    baseline: {
      heartRateBpm: 96, meanArterialMmHg: 70, strokeVolumeMl: 28,
      hemoglobinGPerDl: 12.5, bloodVolumeMl: 1600, coreTemperatureC: 36.7,
      arterialStiffness: 0.75, baroreflexGain: 1.1, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.08, difficultMaskVentilation: false,
      assessment: 'No predicted difficult airway; this screen does not assess cooperation, mask seal, or airway-device technique',
    },
    respiratory: { profile: 'healthy-child' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'capnography', 'pulse-oximetry', 'temperature', 'depth-index'],
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 120, respiratoryRateBpm: 29,
      freshGasFlowLPerMin: 2, sevofluranePercent: 0, delivering: false,
    },
  },
  formulary: [],
  timeline: [
    {
      id: 'briefing', type: 'narrative', atTick: 0, severity: 'advisory',
      message: 'A healthy 6-year-old is breathing spontaneously before a planned mask induction. Prepare the modeled circuit, then use the vaporizer and end-tidal agent as two different signals. Cooperation, mask seal, excitement, consciousness, airway reflexes, respiratory depression, IV access, and airway placement are outside this screen.',
    },
    {
      id: 'wash-in-check', type: 'narrative', atTick: 1200, severity: 'info',
      message: 'Compare the vaporizer setting with end-tidal sevoflurane and age-adjusted MAC. The dial is machine output; the end-tidal value is the model signal that reached the patient.',
    },
    {
      id: 'case-end', type: 'narrative', atTick: 4200, severity: 'advisory',
      message: 'The wash-in practice window is ending. Settle delivery, reassess the modeled depth and pressure trends, and stop before inferring consciousness, airway readiness, or an individual anesthetic plan.',
    },
  ],
  replayPoints: [{
    id: 'before-volatile-wash-in', label: 'Before volatile wash-in',
    objectiveId: 'follow-pediatric-end-tidal-wash-in', atTick: 99,
    reason: 'Rehearse preparing the circuit and separating the vaporizer dial from the end-tidal patient signal.',
  }],
  debrief: { rubric: [
    {
      id: 'child-circuit-preparation', objectiveId: 'prepare-pediatric-inhalational-circuit',
      question: 'Which accepted settings prepared oxygen delivery before the vaporizer was turned on?',
      concept: 'preoxygenation-and-safe-apnea-time',
    },
    {
      id: 'child-volatile-wash-in', objectiveId: 'follow-pediatric-end-tidal-wash-in',
      question: 'How did vaporizer delivery, end-tidal sevoflurane, and age-adjusted MAC differ during wash-in?',
      concept: 'depth-monitoring-and-its-limits',
    },
    {
      id: 'child-volatile-settle', objectiveId: 'settle-pediatric-volatile-depth',
      question: 'What happened after delivery was reduced, and which conclusions remain outside this model?',
      concept: 'depth-monitoring-and-its-limits',
    },
  ] },
};
