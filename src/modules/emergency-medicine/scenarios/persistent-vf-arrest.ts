/** Bounded third-cycle shockable cardiac-arrest response in the emergency department. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const PERSISTENT_VF_ARREST: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'persistent-vf-arrest', version: '0.1.0', maturity: 'preview',
    title: 'Persistent VF arrest', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 8, difficulty: 'advanced',
    objectives: [
      { id: 'resume-arrest-compressions', statement: 'Recognize pulseless ventricular fibrillation and resume chest compressions.', measure: 'Modeled 110/min chest compressions were accepted within 20 seconds of the VF event.' },
      { id: 'give-arrest-epinephrine', statement: 'Give the adult cardiac-arrest dose of epinephrine during the third VF cycle.', measure: 'Exactly 1 mg IV or IO epinephrine was accepted while compressions were active.' },
      { id: 'defibrillate-persistent-vf', statement: 'Use the declared biphasic device setting and defibrillate persistent VF.', measure: 'A 200 J shock was accepted after compressions and 1 mg epinephrine, producing bounded modeled ROSC.' },
      { id: 'avoid-shocking-nonshockable-rhythm', statement: 'Distinguish shockable VF from non-shockable asystole or PEA.', measure: 'No defibrillation was delivered to a non-shockable rhythm.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Wigginton JG, et al. Part 9: Adult Advanced Life Support: 2025 AHA Guidelines for CPR and ECC. Circulation. 2025;152(suppl 2):S538-S577. doi:10.1161/CIR.0000000000001376.',
        'American Heart Association. Adult Cardiac Arrest Algorithm (VF/pVT/Asystole/PEA). 2025.',
      ],
    },
    limitations: ['cardiac-arrest-response-is-bounded', 'cardiac-arrest-actions-are-screen-proxies',
      'no-post-cardiac-arrest-care', 'no-team-or-communication'],
  },
  patient: {
    ageYears: 64, sex: 'female', heightCm: 166, weightKg: 74, asaClass: 4,
    diagnosis: 'Witnessed persistent ventricular-fibrillation arrest',
    procedure: 'Emergency third-cycle shockable-arrest response',
    comorbidities: ['Hypertension', 'Coronary artery disease'],
    medications: ['Aspirin', 'Atorvastatin'], allergies: ['No known drug allergies'],
    fasting: 'Not established in the emergency department',
    baseline: { heartRateBpm: 76, meanArterialMmHg: 86, strokeVolumeMl: 64,
      hemoglobinGPerDl: 13.2, bloodVolumeMl: 5000, coreTemperatureC: 36.7,
      arterialStiffness: 1.2, baroreflexGain: 0.8, fixedStrokeVolume: false },
    airway: { difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Bag-mask ventilation with high-concentration oxygen is available' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'capnography', 'pulse-oximetry'],
    ventilator: { mode: 'manual', fio2: 1, tidalVolumeMl: 500,
      respiratoryRateBpm: 10, freshGasFlowLPerMin: 10, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'emergency-vf-briefing', type: 'narrative', atTick: 0, severity: 'advisory',
      message: 'You are taking over a witnessed emergency-department arrest after two unsuccessful biphasic shocks. Bag-mask oxygen, pads, and IV access are available. Compressions pause at handoff. This bounded third VF cycle models fixed-rate compression intent, 1 mg IV/IO epinephrine, and a declared device setting of 200 J. Physical CPR quality, ventilation quality, pad or device technique, reversible-cause treatment, antiarrhythmics, and post-arrest care are outside the case.' },
    { id: 'emergency-persistent-vf', type: 'rhythm-change', target: 'ventricular-fibrillation',
      atTick: 0, severity: 'critical',
      message: 'The rhythm remains ventricular fibrillation with no mechanical pulse. Take over the third shockable-arrest cycle.' },
    { id: 'emergency-reassess-arrest', type: 'narrative', atTick: 1800, severity: 'advisory',
      message: 'Reassess rhythm and the accepted resuscitation intents. Deterministic conversion in this teaching case is not an individual outcome prediction.' },
  ],
  debrief: { rubric: [
    { id: 'emergency-compression-response', objectiveId: 'resume-arrest-compressions', question: 'How quickly were modeled compressions resumed after pulseless VF appeared?' },
    { id: 'emergency-arrest-epinephrine', objectiveId: 'give-arrest-epinephrine', question: 'Was exactly 1 mg IV/IO epinephrine accepted while modeled compressions were active?' },
    { id: 'emergency-energy-selected-shock', objectiveId: 'defibrillate-persistent-vf', question: 'Which declared biphasic setting was selected, and did the accepted shock convert the fixed rhythm?' },
    { id: 'emergency-rhythm-discrimination', objectiveId: 'avoid-shocking-nonshockable-rhythm', question: 'Which displayed rhythms are shockable, and was any non-shockable rhythm shocked?' },
  ] },
};
