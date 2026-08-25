/** Postoperative opioid-induced ventilatory impairment: detect, support, and escalate. */

import type { Scenario } from './types';

export const OPIOID_INDUCED_VENTILATORY_IMPAIRMENT: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'opioid-induced-ventilatory-impairment', version: '0.1.0', maturity: 'draft',
    title: 'Opioid-induced ventilatory impairment', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 7, difficulty: 'intermediate',
    objectives: [
      {
        id: 'recognize-opioid-ventilatory-impairment',
        statement: 'Recognize advancing sedation and depressed ventilation before oxygen saturation becomes the only signal.',
        measure: 'Help was requested within 30 seconds of the fixed difficult-arousal, low-rate, rising-carbon-dioxide pattern.',
      },
      {
        id: 'support-opioid-impaired-ventilation',
        statement: 'Keep the airway patent and support ventilation while definitive reversal is prepared.',
        measure: 'Active breath delivery with at least 95% oxygen was established within 45 seconds of onset.',
      },
      {
        id: 'prevent-further-opioid-harm',
        statement: 'Hold further opioid instead of chasing a pain score during advancing sedation.',
        measure: 'The fixed further-opioid hold was recorded before reversal intent.',
      },
      {
        id: 'escalate-opioid-reversal',
        statement: 'Record patient-specific naloxone titration intent without treating one reversal as the end of monitoring.',
        measure: 'Naloxone titration intent was accepted after further opioid was held.',
      },
      {
        id: 'reassess-opioid-ventilatory-recovery',
        statement: 'Reassess respiratory rate, tidal volume, carbon dioxide, and oxygenation together.',
        measure: 'Spontaneous rate recovered to at least 10/min with tidal volume and end-tidal carbon dioxide present.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Levy N, et al. An international multidisciplinary consensus statement on the prevention of opioid-related harm in adult surgical patients. Anaesthesia. 2021;76:520-536. PMID 33027841.',
        'Jansen SC, Dahan A. Opioid-induced respiratory depression. BJA Education. 2024;24:100-106. PMID 38375496.',
      ],
    },
    limitations: [
      'opioid-ventilatory-impairment-is-a-fixed-central-drive-model',
      'naloxone-is-intent-not-dose-or-pharmacology',
      'no-pain-withdrawal-recurrence-or-monitoring-workflow',
    ],
  },
  patient: {
    ageYears: 68, sex: 'male', heightCm: 173, weightKg: 88, asaClass: 3,
    diagnosis: 'Severe knee osteoarthritis', procedure: 'Total knee arthroplasty',
    comorbidities: ['Stage 3 chronic kidney disease', 'Hypertension'],
    medications: ['Amlodipine'], allergies: ['None known'],
    fasting: 'Postoperative',
    baseline: {
      heartRateBpm: 70, meanArterialMmHg: 88, strokeVolumeMl: 70,
      hemoglobinGPerDl: 12.8, bloodVolumeMl: 5000, coreTemperatureC: 36.5,
      arterialStiffness: 1.2, baroreflexGain: 0.8, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.08, difficultMaskVentilation: false,
      assessment: 'Post-anesthesia care unit; airway is currently patent with a facemask and continuous capnography',
    },
    respiratory: { profile: 'moderately-ill' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'capnography', 'pulse-oximetry', 'temperature'],
    airwayDevice: 'facemask',
    ventilator: {
      mode: 'manual', fio2: 0.35, tidalVolumeMl: 500, respiratoryRateBpm: 12,
      freshGasFlowLPerMin: 5, sevofluranePercent: 0, delivering: false,
    },
  },
  formulary: [],
  timeline: [
    {
      id: 'opioid-ventilatory-briefing', type: 'narrative', atTick: 0, severity: 'warning',
      message: 'Thirty minutes after a fixed postoperative morphine exposure, the patient is drowsy but breathing with a patent facemask airway. No morphine dose, route, pharmacokinetics, pain score, or sedation-scale technique is simulated. Watch ventilation and arousal together; supplemental oxygen can leave saturation reassuring while ventilation worsens.',
    },
    {
      id: 'opioid-ventilatory-impairment-onset', type: 'opioid-ventilatory-impairment',
      atTick: 100, value: 0.8, severity: 'critical',
      message: 'The patient now opens his eyes only after repeated stimulation and cannot remain awake. Respiratory rate falls with relatively preserved breath size, while end-tidal carbon dioxide begins to rise. The airway remains patent and oxygen saturation is still supported.',
    },
    {
      id: 'opioid-ventilatory-reassessment', type: 'narrative', atTick: 1200,
      severity: 'advisory',
      message: 'Reassess arousal, airway patency, spontaneous rate and breath size, carbon dioxide, oxygenation, analgesia risk, and the need for continued monitoring or repeated reversal outside this model.',
    },
  ],
  debrief: { rubric: [
    { id: 'oivi-recognition', objectiveId: 'recognize-opioid-ventilatory-impairment', question: 'Which arousal and ventilation changes mattered before saturation fell?', concept: 'capnogram-morphology' },
    { id: 'oivi-support', objectiveId: 'support-opioid-impaired-ventilation', question: 'How quickly did you recruit help and support ventilation and oxygenation?', concept: 'preoxygenation-and-safe-apnea-time' },
    { id: 'oivi-hold', objectiveId: 'prevent-further-opioid-harm', question: 'Why did advancing sedation override any impulse to give more opioid?', concept: 'hypnotic-opioid-synergy' },
    { id: 'oivi-reversal', objectiveId: 'escalate-opioid-reversal', question: 'What does naloxone titration intent capture, and which dose and response claims remain absent?', concept: 'hypnotic-opioid-synergy' },
    { id: 'oivi-reassessment', objectiveId: 'reassess-opioid-ventilatory-recovery', question: 'Which ventilation and oxygenation signals recovered, and why would monitoring continue?', concept: 'capnogram-morphology' },
  ] },
};
