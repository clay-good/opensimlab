/** Hypertensive acute pulmonary edema with bounded support and pressure response. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const ACUTE_PULMONARY_EDEMA: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'acute-pulmonary-edema', version: '0.1.0', maturity: 'preview',
    title: 'Acute pulmonary edema', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 9, difficulty: 'introductory',
    objectives: [
      { id: 'recognize-acute-pulmonary-edema-pattern', statement: 'Recognize acute pulmonary edema from respiratory distress, congestion, pressure, perfusion, and fixed focused tests while checking immediate mimics and precipitants.', measure: 'The whole fixed pattern and immediate alternatives were reviewed before treatment.' },
      { id: 'support-pulmonary-edema-gas-exchange', statement: 'Record early noninvasive positive pressure with titrated oxygen for the authored respiratory-failure pattern.', measure: 'NIV and oxygen intent followed whole-patient review.' },
      { id: 'treat-hypertensive-pulmonary-edema', statement: 'Pair loop-diuretic intent for congestion with vasodilator intent when systolic pressure is safely above 110 mmHg.', measure: 'Both bounded treatment intents were recorded.' },
      { id: 'reassess-pulmonary-edema-response', statement: 'Reassess breathing, oxygenation, pressure, and perfusion after initial support and treatment.', measure: 'Serial whole-patient reassessment followed all accepted initial actions.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'McDonagh TA, et al. 2021 ESC Guidelines for acute and chronic heart failure. Eur Heart J. 2021;42:3599-3726. Section 11.3.',
        'Masip J, et al. Acute Heart Failure in the 2021 ESC Heart Failure Guidelines: ACVC scientific statement. Eur Heart J Acute Cardiovasc Care. 2022;11:173-185.',
        'Mullens W, et al. Vasodilator agents in acute heart failure: HFA scientific statement. Eur J Heart Fail. 2025;27:1067-1091.',
      ],
    },
    limitations: [
      'acute-pulmonary-edema-findings-are-authored',
      'pulmonary-edema-support-and-treatment-are-intent-controls',
      'no-pulmonary-edema-precipitant-disposition-or-outcome',
    ],
  },
  patient: {
    ageYears: 72, sex: 'female', heightCm: 162, weightKg: 74, asaClass: 4,
    diagnosis: 'Hypertensive acute pulmonary edema',
    procedure: 'Emergency assessment and initial response to acute pulmonary edema',
    comorbidities: ['Hypertension', 'Heart failure with preserved ejection fraction'],
    medications: ['Amlodipine', 'Furosemide'], allergies: ['No known drug allergies'],
    fasting: 'Not established in the emergency department',
    baseline: {
      heartRateBpm: 112, meanArterialMmHg: 137, strokeVolumeMl: 58,
      hemoglobinGPerDl: 12.8, bloodVolumeMl: 4800, coreTemperatureC: 36.8,
      arterialStiffness: 1.35, baroreflexGain: 0.8, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.25, difficultMaskVentilation: false,
      assessment: 'Upright, speaking short phrases, with severe work of breathing and no upper-airway swelling',
    },
    respiratory: { profile: 'moderately-ill' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'capnography', 'pulse-oximetry', 'temperature'],
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 420, respiratoryRateBpm: 32,
      delivering: false,
    },
  },
  formulary: [],
  timeline: [{
    id: 'acute-pulmonary-edema-boundary', type: 'narrative', target: 'acute-pulmonary-edema',
    atTick: 0, severity: 'critical',
    message: 'A fixed hypertensive acute-pulmonary-edema pattern is present. Review congestion, respiratory failure, perfusion, immediate mimics, and precipitants; record early NIV with titrated oxygen, loop-diuretic intent, and vasodilator intent; then reassess. Examination, test acquisition, device setup, dosing, titration, precipitant treatment, disposition, and outcome are outside this vignette.',
  }],
  debrief: { rubric: [
    { id: 'pulmonary-edema-pattern', objectiveId: 'recognize-acute-pulmonary-edema-pattern', question: 'Which respiratory, congestion, pressure, perfusion, and fixed-test findings formed the pattern, and which immediate alternatives still mattered?' },
    { id: 'pulmonary-edema-support', objectiveId: 'support-pulmonary-edema-gas-exchange', question: 'Why was early noninvasive positive pressure selected, and what monitoring remained necessary?' },
    { id: 'pulmonary-edema-treatment', objectiveId: 'treat-hypertensive-pulmonary-edema', question: 'How did congestion and high systolic pressure shape the two treatment intents?' },
    { id: 'pulmonary-edema-reassessment', objectiveId: 'reassess-pulmonary-edema-response', question: 'How did breathing, oxygenation, pressure, and perfusion change after the bounded initial response?' },
  ] },
};
