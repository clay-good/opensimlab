/** Bounded third-cycle shockable cardiac-arrest response and initial ROSC. */

import type { Scenario } from './types';

export const PERSISTENT_VF_CARDIAC_ARREST: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'persistent-vf-cardiac-arrest',
    version: '0.1.0',
    maturity: 'draft',
    title: 'Persistent ventricular-fibrillation cardiac arrest',
    author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0',
    estimatedMinutes: 8,
    difficulty: 'advanced',
    objectives: [
      {
        id: 'resume-arrest-compressions',
        statement: 'Recognize pulseless ventricular fibrillation and resume chest compressions.',
        measure: 'Modeled 110/min chest compressions were accepted within 20 seconds of the VF event.',
      },
      {
        id: 'give-arrest-epinephrine',
        statement: 'Give the adult cardiac-arrest dose of epinephrine during the third VF cycle.',
        measure: 'Exactly 1 mg IV or IO epinephrine was accepted while compressions were active.',
      },
      {
        id: 'defibrillate-persistent-vf',
        statement: 'Select the declared biphasic device energy and defibrillate persistent VF.',
        measure: 'A 200 J shock was accepted after compressions and 1 mg epinephrine, producing bounded modeled ROSC.',
      },
      {
        id: 'avoid-shocking-nonshockable-rhythm',
        statement: 'Distinguish shockable VF from non-shockable asystole or PEA.',
        measure: 'No defibrillation was delivered to a non-shockable rhythm.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0',
      sources: [
        'American Heart Association. Adult Cardiac Arrest Algorithm. 2025 AHA Guidelines for CPR and ECC.',
      ],
    },
    limitations: [
      'cardiac-arrest-response-is-bounded',
      'cardiac-arrest-actions-are-screen-proxies',
      'no-post-cardiac-arrest-care',
      'no-team-or-communication',
    ],
  },
  patient: {
    ageYears: 58, sex: 'male', heightCm: 178, weightKg: 82, asaClass: 3,
    diagnosis: 'Coronary artery disease', procedure: 'Intraoperative ventricular-fibrillation response',
    comorbidities: ['Hypertension', 'Coronary artery disease'],
    medications: ['Aspirin', 'Atorvastatin'], allergies: ['None known'],
    fasting: 'Solids eight hours, clear fluids two hours',
    baseline: {
      heartRateBpm: 72, meanArterialMmHg: 88, strokeVolumeMl: 68,
      hemoglobinGPerDl: 13.4, bloodVolumeMl: 5600, coreTemperatureC: 36.7,
      arterialStiffness: 1.2, baroreflexGain: 0.85, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Facemask ventilation available during the bounded handoff',
    },
    respiratory: { profile: 'healthy' },
  },
  equipment: {
    monitoring: ['ecg', 'arterial-line', 'capnography', 'pulse-oximetry'],
    ventilator: {
      mode: 'volume-control', fio2: 1, tidalVolumeMl: 500,
      respiratoryRateBpm: 10, freshGasFlowLPerMin: 10, delivering: true,
    },
  },
  formulary: [{
    drugId: 'propofol', concentration: 10, concentrationUnit: 'mg/mL',
    syringeVolumeMl: 20, typicalDose: 100, deliveryModes: ['bolus'],
    presets: [{ label: '0.5 mg/kg', amount: 0.5, unit: 'mg/kg' }],
  }],
  timeline: [
    {
      id: 'briefing', type: 'narrative', atTick: 0, severity: 'advisory',
      message: 'You are taking over a witnessed intraoperative arrest after two unsuccessful biphasic shocks. Oxygen, assisted facemask ventilation, and IV access are available. The prior team pauses compressions at handoff. This bounded third VF cycle models fixed-rate compressions, 1 mg IV/IO epinephrine, and a declared device setting of 200 J; physical CPR quality, pad placement, reversible-cause treatment, refractory drugs, and post-arrest care are outside the case.',
    },
    {
      id: 'persistent-vf', type: 'rhythm-change', target: 'ventricular-fibrillation',
      atTick: 300, severity: 'critical',
      message: 'The electrocardiogram remains ventricular fibrillation with no mechanical pulse. Take over the third resuscitation cycle.',
    },
    {
      id: 'reassess-arrest', type: 'narrative', atTick: 2100, severity: 'advisory',
      message: 'Reassess the rhythm and accepted resuscitation actions. The deterministic conversion in this teaching case is not an individual outcome prediction.',
    },
  ],
  debrief: { rubric: [
    {
      id: 'compression-response', objectiveId: 'resume-arrest-compressions',
      question: 'How quickly were modeled chest compressions resumed after pulseless VF appeared?',
    },
    {
      id: 'arrest-epinephrine', objectiveId: 'give-arrest-epinephrine',
      question: 'Was exactly 1 mg IV/IO epinephrine accepted while compressions were active?',
    },
    {
      id: 'energy-selected-shock', objectiveId: 'defibrillate-persistent-vf',
      question: 'Which biphasic energy was selected, and did the accepted shock convert VF?',
    },
    {
      id: 'rhythm-discrimination', objectiveId: 'avoid-shocking-nonshockable-rhythm',
      question: 'Which displayed rhythms are shockable, and was any non-shockable rhythm shocked?',
    },
  ] },
};
