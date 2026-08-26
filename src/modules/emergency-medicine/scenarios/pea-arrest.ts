/** Bounded first-cycle pulseless-electrical-activity response. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const PEA_ARREST: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'pea-arrest', version: '0.1.0', maturity: 'preview', title: 'PEA arrest',
    author: 'Open Sim Lab', license: 'CC BY-SA 4.0', estimatedMinutes: 7,
    difficulty: 'intermediate', objectives: [
      { id: 'resume-arrest-compressions', statement: 'Recognize organized electrical activity without a pulse and start chest compressions.', measure: 'Modeled 110/min chest compressions were accepted within 20 seconds of the PEA event.' },
      { id: 'give-arrest-epinephrine', statement: 'Record the adult cardiac-arrest epinephrine action promptly during active compressions.', measure: 'Exactly 1 mg IV or IO epinephrine was accepted while compressions were active.' },
      { id: 'avoid-shocking-nonshockable-rhythm', statement: 'Keep PEA on the nonshockable pathway while reversible causes are pursued.', measure: 'No defibrillation was delivered to PEA.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Wigginton JG, et al. Part 9: Adult Advanced Life Support: 2025 AHA Guidelines for CPR and ECC. Circulation. 2025;152(suppl 2):S538-S577. doi:10.1161/CIR.0000000000001376.',
        'American Heart Association. Adult Cardiac Arrest Algorithm (VF/pVT/Asystole/PEA). 2025.',
      ] },
    limitations: ['cardiac-arrest-response-is-bounded', 'cardiac-arrest-actions-are-screen-proxies',
      'no-post-cardiac-arrest-care', 'no-team-or-communication'],
  },
  patient: { ageYears: 67, sex: 'male', heightCm: 174, weightKg: 79, asaClass: 4,
    diagnosis: 'Witnessed pulseless electrical activity',
    procedure: 'Emergency nonshockable-arrest recognition and first-cycle response',
    comorbidities: ['Hypertension'], medications: ['Lisinopril'],
    allergies: ['No known drug allergies'], fasting: 'Not established in the emergency department',
    baseline: { heartRateBpm: 72, meanArterialMmHg: 84, strokeVolumeMl: 62,
      hemoglobinGPerDl: 12.9, bloodVolumeMl: 5200, coreTemperatureC: 36.6,
      arterialStiffness: 1.2, baroreflexGain: 0.8, fixedStrokeVolume: false },
    airway: { difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Bag-mask ventilation with high-concentration oxygen is available' },
    respiratory: { profile: 'healthy' } },
  equipment: { monitoring: ['ecg', 'capnography', 'pulse-oximetry'], ventilator: {
    mode: 'manual', fio2: 1, tidalVolumeMl: 500, respiratoryRateBpm: 10,
    freshGasFlowLPerMin: 10, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'pea-arrest-briefing', type: 'narrative', atTick: 0, severity: 'critical',
      message: 'A witnessed emergency-department collapse now shows organized electrical activity without a mechanical pulse. Bag-mask oxygen, a monitor-defibrillator, and IV access are available. This bounded first cycle models compression intent and one 1 mg IV/IO epinephrine action. Defibrillation is not indicated. Physical CPR or ventilation quality, definitive cause, cause-specific treatment, repeated cycles, airway procedures, team performance, termination, ROSC, and post-arrest care are outside the case.' },
    { id: 'pea-arrest-rhythm', type: 'rhythm-change', target: 'pea', atTick: 0,
      severity: 'critical', message: 'Organized electrical activity is present without a mechanical pulse: PEA.' },
  ],
  debrief: { rubric: [
    { id: 'pea-compressions', objectiveId: 'resume-arrest-compressions', question: 'How quickly were modeled compressions started after PEA appeared?' },
    { id: 'pea-epinephrine', objectiveId: 'give-arrest-epinephrine', question: 'Was exactly 1 mg IV/IO epinephrine accepted during active compressions?' },
    { id: 'pea-nonshockable', objectiveId: 'avoid-shocking-nonshockable-rhythm', question: 'Was PEA kept on the nonshockable pathway while reversible causes remained in view?' },
  ] },
};
