/** Bounded pulse-oximeter signal-quality and corroboration lesson. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const PULSE_OXIMETER_MOTION_ARTIFACT: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'pulse-oximeter-motion-artifact', version: '0.1.0', maturity: 'preview',
    title: 'Pulse-oximeter motion artifact', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 7, difficulty: 'intermediate', objectives: [
      { id: 'recognize-pulse-oximeter-discordance', statement: 'Cross-check an isolated saturation against signal quality and the patient.', measure: 'The displayed saturation, ECG rate, pleth quality, perfusion, and patient were separated before escalation.' },
      { id: 'inspect-pleth-and-pulse-rate-coherence', statement: 'Inspect pleth quality and compare the oximeter pulse rate with an independent heart rate.', measure: 'The fixed irregular low-amplitude pleth and 132/min oximeter pulse were compared with ECG 86/min.' },
      { id: 'review-probe-motion-and-perfusion', statement: 'Review the declared probe, motion, contact, temperature, and local perfusion state.', measure: 'The fixed motion and cool low-perfusion probe site were identified without claiming a physical examination.' },
      { id: 'corroborate-oxygenation-independently', statement: 'Corroborate oxygenation with the whole patient and another oxygenation signal.', measure: 'The fixed arterial panel and patient observations were reviewed while capnography remained supportive but not exclusionary.' },
      { id: 'reassess-pulse-oximeter-signal', statement: 'Reassess signal quality, display coherence, oxygenation, and the unresolved clinical context.', measure: 'The fixed clean-site response restored coherent pleth and display without treating authored stable physiology.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Gehring H, Hornberger C, Matz H, Konecny E, Schmucker P. The effects of motion artifact and low perfusion on the performance of a new generation of pulse oximeters in volunteers undergoing hypoxemia. Respir Care. 2002;47:48-60. PMID:11749687.',
        'U.S. Food and Drug Administration. Pulse Oximeters. Current web guidance; accessed August 25, 2026.',
      ] },
    limitations: ['pulse-oximeter-artifact-display-and-corroboration-are-authored',
      'pulse-oximeter-controls-record-review-intent-only',
      'no-live-probe-assessment-arterial-sampling-diagnosis-treatment-or-outcome'],
  },
  patient: { ageYears: 67, sex: 'male', heightCm: 176, weightKg: 79, asaClass: 4,
    diagnosis: 'Authored monitor discordance during shivering',
    procedure: 'Pulse-oximeter motion-artifact cross-check',
    comorbidities: ['Peripheral vascular disease'], medications: ['No modeled active drug'],
    allergies: ['No known drug allergies'], fasting: 'ICU patient; nutrition state not represented',
    baseline: { heartRateBpm: 86, meanArterialMmHg: 76, strokeVolumeMl: 66,
      hemoglobinGPerDl: 11.4, bloodVolumeMl: 5100, coreTemperatureC: 36.4,
      arterialStiffness: 1.2, baroreflexGain: 0.8, fixedStrokeVolume: false },
    airway: { difficulty: 0.15, difficultMaskVentilation: false,
      assessment: 'Awake, speaking clearly, and breathing without visible distress in the authored record' },
    respiratory: { profile: 'healthy' } },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'capnography', 'temperature'],
    ventilator: { mode: 'manual', fio2: 0.28, tidalVolumeMl: 500,
      respiratoryRateBpm: 16, freshGasFlowLPerMin: 4, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'pulse-oximeter-motion-begins', type: 'artifact', target: 'pulse-oximeter-motion',
      atTick: 0, severity: 'artifact' },
    { id: 'pulse-oximeter-motion-artifact-presentation', type: 'narrative',
      target: 'pulse-oximeter-motion-artifact', atTick: 0, severity: 'warning',
      message: 'During shivering, the pulse oximeter displays 82% and pulse 132/min, while ECG remains 86/min. The pleth is irregular and low amplitude at a cool finger; the patient is awake, speaking clearly, breathing 16/min without visible distress, and has stable MAP 76 mmHg and EtCO₂ 37 mmHg on unchanged oxygen. Canonical modeled SpO₂ remains 97%; display, probe, pleth, pulse rate, alarm, perfusion, and patient oxygenation are separate teaching states.' },
    { id: 'pulse-oximeter-motion-artifact-boundary', type: 'narrative',
      target: 'pulse-oximeter-motion-artifact-boundary', atTick: 0, severity: 'warning',
      message: 'Inspect pleth quality and pulse-rate coherence; review the declared probe contact, motion, skin temperature, and local perfusion; then corroborate with the whole patient and the fixed arterial panel, SaO₂ 97% and PaO₂ 94 mmHg. A clean capnogram supports ongoing ventilation but does not exclude hypoxemia. The fixed clean-site reassessment displays SpO₂ 97%, pulse 86/min, and a regular stronger pleth with unchanged patient physiology. Motion artifact is supported in this authored state, but true hypoxemia, dyshemoglobinemia, optical interference, venous pulsation, probe fault, and evolving illness must remain open when evidence differs. If a real patient is unstable, support and escalation proceed while the signal is checked. The screen does not inspect or move a probe, examine perfusion, sample blood, diagnose artifact or hypoxemia, deliver oxygen or treatment, configure a monitor, determine disposition, or predict outcome.' },
  ],
  debrief: { rubric: [
    { id: 'pulse-ox-discordance', objectiveId: 'recognize-pulse-oximeter-discordance', question: 'Which discordant facts made the isolated 82% display uncertain?' },
    { id: 'pulse-ox-pleth', objectiveId: 'inspect-pleth-and-pulse-rate-coherence', question: 'How did pleth quality and pulse-rate mismatch change your confidence?' },
    { id: 'pulse-ox-probe', objectiveId: 'review-probe-motion-and-perfusion', question: 'Which declared motion, contact, temperature, and perfusion facts belonged to the sensor path?' },
    { id: 'pulse-ox-corroboration', objectiveId: 'corroborate-oxygenation-independently', question: 'Which independent evidence corroborated oxygenation, and what could capnography not exclude?' },
    { id: 'pulse-ox-reassessment', objectiveId: 'reassess-pulse-oximeter-signal', question: 'What became coherent after clean-site reassessment, and what remained outside the model?' },
  ] },
};
