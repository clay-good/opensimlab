/** Bounded adult post-intubation hypotension assessment and response. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const POST_INTUBATION_HYPOTENSION: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'post-intubation-hypotension', version: '0.1.0', maturity: 'draft',
    title: 'Post-intubation hypotension', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 8, difficulty: 'intermediate', objectives: [
      { id: 'validate-post-intubation-pressure-and-call-help', statement: 'Validate severe hypotension, assess perfusion, and call experienced ICU help.', measure: 'Pressure confirmation and immediate support preceded mechanism classification.' },
      { id: 'review-post-intubation-danger-pattern', statement: 'Review the airway, ventilation, pressures, rhythm, bleeding, allergy, perfusion, and timing.', measure: 'Immediate dangerous alternatives were actively checked.' },
      { id: 'classify-post-intubation-hemodynamics', statement: 'Recognize a mixed vasodilated and preload-sensitive pattern while keeping pump and obstructive causes open.', measure: 'The classification used the fixed dynamic response and whole-patient panel.' },
      { id: 'record-post-intubation-support-intent', statement: 'Record concurrent vasopressor and cautious balanced-crystalloid challenge intent with a MAP guardrail.', measure: 'Support was cause-linked, bounded, and reassessment-dependent.' },
      { id: 'reassess-post-intubation-hypotension', statement: 'Reassess pressure, perfusion, dynamic response, lungs, gas exchange, and ongoing shock needs.', measure: 'The fixed response improved without closing the underlying septic-shock work.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Acquisto NM, Mosier JM, Bittner EA, et al. Society of Critical Care Medicine Clinical Practice Guidelines for Rapid Sequence Intubation in the Critically Ill Adult Patient. Crit Care Med. 2023;51:1411-1430.',
        'Prescott HC, Antonelli M, Alhazzani W, et al. Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2026. Crit Care Med. 2026;54:725-812.',
        'Goodfellow LT, Miller AG, Varekojis SM, et al. AARC Clinical Practice Guideline: Patient-Ventilator Assessment. Respir Care. 2024;69:1042-1054.',
      ] },
    limitations: ['post-intubation-hypotension-findings-mechanism-and-response-are-authored',
      'post-intubation-hypotension-fluid-vasopressor-and-assessment-controls-are-proxies',
      'no-live-post-intubation-shock-diagnosis-prescribing-procedure-or-outcome'],
  },
  patient: { ageYears: 58, sex: 'female', heightCm: 168, weightKg: 74, asaClass: 4,
    diagnosis: 'Authored mixed post-intubation hypotension during septic shock',
    procedure: 'Post-intubation hemodynamic reassessment',
    comorbidities: ['Pneumonia', 'Sepsis'], medications: ['Recent RSI drugs not represented'],
    allergies: ['No known drug allergies'], fasting: 'Emergency airway; fasting state uncertain',
    baseline: { heartRateBpm: 120, meanArterialMmHg: 46, strokeVolumeMl: 48,
      hemoglobinGPerDl: 11.4, bloodVolumeMl: 4300, coreTemperatureC: 39.0,
      arterialStiffness: 0.85, baroreflexGain: 0.95, fixedStrokeVolume: false },
    airway: { difficulty: 0.15, difficultMaskVentilation: false,
      assessment: 'New cuffed tracheal tube with continuous capnography' },
    respiratory: { profile: 'moderately-ill' } },
  equipment: { monitoring: ['ecg', 'arterial-line', 'pulse-oximetry', 'capnography', 'temperature'],
    airwayDevice: 'tracheal-tube', ventilator: { mode: 'volume-control', fio2: 0.5,
      tidalVolumeMl: 420, respiratoryRateBpm: 20, freshGasFlowLPerMin: 10, delivering: true } },
  formulary: [],
  timeline: [
    { id: 'post-intubation-hypotension-presentation', type: 'narrative',
      target: 'post-intubation-hypotension', atTick: 0, severity: 'critical',
      message: 'Two minutes after ICU intubation for pneumonia and septic shock, invasive MAP falls from 68 to 46 mmHg with a pulsatile arterial waveform. HR is 120/min in sinus rhythm, capillary refill is 5 seconds, and the extremities are warm. SpO₂ is 95%, continuous exhaled-carbon-dioxide waveform is present, bilateral ventilation is reported, peak pressure is 27 cm H₂O, plateau pressure is 21 cm H₂O, and expiratory flow reaches zero. No external bleeding, new rash, wheeze, or facial swelling is reported. No response has been recorded.' },
    { id: 'post-intubation-hypotension-boundary', type: 'narrative',
      target: 'post-intubation-hypotension-boundary', atTick: 0, severity: 'warning',
      message: 'Validate pressure and pulse, assess perfusion, and call experienced help. Review the new airway, gas exchange, pressures, flow, rhythm, bleeding, allergic pattern, sedation timing, positive-pressure transition, and obstructive, pump, vasodilated, and preload-sensitive alternatives. A fixed passive-leg-raise proxy raises stroke volume from 48 to 57 mL while lungs remain clear, supporting fluid responsiveness without proving one cause. Record concurrent norepinephrine intent toward an initial MAP near 65 mmHg and a cautious 250 mL balanced-crystalloid challenge with immediate reassessment. This is not a universal fluid-versus-vasopressor answer. Examination, pressure acquisition, ultrasound, passive leg raise, fluid or drug delivery, dosing, ventilator or sedation changes, diagnosis, source treatment, disposition, and outcome are not simulated.' },
  ],
  debrief: { rubric: [
    { id: 'post-intubation-pressure', objectiveId: 'validate-post-intubation-pressure-and-call-help', question: 'How were severe hypotension and perfusion validated while help was mobilized?' },
    { id: 'post-intubation-danger', objectiveId: 'review-post-intubation-danger-pattern', question: 'Which immediate airway, ventilation, rhythm, bleeding, allergy, pump, and obstructive alternatives were checked?' },
    { id: 'post-intubation-mechanism', objectiveId: 'classify-post-intubation-hemodynamics', question: 'Why did the fixed panel support mixed vasodilation and preload sensitivity without proving one cause?' },
    { id: 'post-intubation-support', objectiveId: 'record-post-intubation-support-intent', question: 'Why was support concurrent, cautious, and tied to a MAP and reassessment guardrail?' },
    { id: 'post-intubation-response', objectiveId: 'reassess-post-intubation-hypotension', question: 'Which response findings improved, and which underlying shock work remained open?' },
  ] },
};
