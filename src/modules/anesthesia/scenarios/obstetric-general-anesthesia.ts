/**
 * Bounded obstetric general anesthesia: prepare, induce, and confirm ventilation.
 *
 * The case isolates screen-observable maternal oxygen reserve and induction
 * sequencing. It ends after gas exchange returns and does not simulate the
 * fetus, delivery, aspiration, awareness, neonatal effects, or obstetric surgery.
 */

import type { Scenario } from './types';

export const OBSTETRIC_GENERAL_ANESTHESIA: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'obstetric-general-anesthesia',
    version: '0.1.0',
    maturity: 'draft',
    title: 'Obstetric general anesthesia',
    author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0',
    estimatedMinutes: 8,
    difficulty: 'intermediate',
    objectives: [
      {
        id: 'prepare-obstetric-oxygen-reserve',
        statement: 'Reach an end-tidal oxygen endpoint before the first induction drug.',
        measure: 'At least 95% inspired oxygen and 10 L/min fresh-gas flow were accepted, and end-tidal oxygen reached at least 0.90 before propofol.',
      },
      {
        id: 'wait-for-intubating-block',
        statement: 'Give the hypnotic before paralysis, then allow the modeled block to develop.',
        measure: 'Propofol preceded rocuronium, and the train-of-four count reached zero before laryngoscopy.',
      },
      {
        id: 'protect-obstetric-apnea-margin',
        statement: 'Protect the smaller modeled oxygen margin during induction.',
        measure: 'Maternal oxygen saturation remained at or above 95% from the first induction drug until gas exchange returned.',
      },
      {
        id: 'confirm-obstetric-ventilation',
        statement: 'Resume delivered ventilation and confirm sustained gas exchange.',
        measure: 'Successful modeled tracheal placement was followed by delivered ventilation and sustained capnography.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0',
      sources: [
        'Mushambi et al. 2015 OAA/DAS obstetric difficult-airway guidelines',
        'McClelland, Bogod and Hardman 2008 pregnancy apnoea model',
        'Craig et al. 2026 obstetric general-anesthesia induction umbrella review',
        'ASA Standards for Basic Anesthetic Monitoring',
      ],
    },
    limitations: [
      'term-pregnancy-respiratory-profile-is-calibrated',
      'no-aspiration-or-regurgitation',
      'peripheral-tof-does-not-prove-laryngeal-conditions',
      'rocuronium-course-is-a-teaching-model',
      'no-team-or-communication',
      'bolus-injection-is-instantaneous',
      'obstetric-general-anesthesia-stops-before-delivery',
    ],
  },
  patient: {
    ageYears: 30, sex: 'female', heightCm: 168, weightKg: 78, asaClass: 2,
    diagnosis: 'Term pregnancy with persistent fetal bradycardia',
    procedure: 'Emergency cesarean delivery under general anesthesia',
    comorbidities: ['None known'], medications: ['Prenatal vitamin'], allergies: ['None known'],
    fasting: 'Ate four hours ago. Gastric emptying cannot be assumed',
    baseline: {
      heartRateBpm: 94, meanArterialMmHg: 88, strokeVolumeMl: 72,
      hemoglobinGPerDl: 11.8, bloodVolumeMl: 5200, coreTemperatureC: 36.7,
      arterialStiffness: 0.9, baroreflexGain: 1, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Mallampati II, normal mouth opening and neck movement; pregnancy-related airway change is not modeled',
    },
    respiratory: { profile: 'term-pregnancy' },
  },
  equipment: {
    monitoring: [
      'ecg', 'nibp', 'capnography', 'pulse-oximetry', 'depth-index', 'train-of-four',
    ],
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 470,
      respiratoryRateBpm: 12, freshGasFlowLPerMin: 2, delivering: false,
    },
  },
  formulary: [
    {
      drugId: 'propofol', concentration: 10, concentrationUnit: 'mg/mL',
      syringeVolumeMl: 20, typicalDose: 150, deliveryModes: ['bolus'],
      presets: [
        { label: '1.5 mg/kg', amount: 1.5, unit: 'mg/kg' },
        { label: '2 mg/kg', amount: 2, unit: 'mg/kg' },
      ],
    },
    {
      drugId: 'rocuronium', concentration: 10, concentrationUnit: 'mg/mL',
      syringeVolumeMl: 10, typicalDose: 90, deliveryModes: ['bolus'],
      presets: [
        { label: '1.0 mg/kg', amount: 1, unit: 'mg/kg' },
        { label: '1.2 mg/kg', amount: 1.2, unit: 'mg/kg' },
      ],
    },
  ],
  timeline: [
    {
      id: 'briefing', type: 'narrative', atTick: 0, severity: 'advisory',
      message: 'General anesthesia is required for emergency cesarean delivery. Prepare the maternal oxygen reserve, then rehearse the modeled induction-to-ventilation sequence. Fetal status, delivery, aspiration, cricoid pressure, awareness, neonatal drug effects, hemorrhage, and team performance are outside this screen.',
    },
    {
      id: 'reassess', type: 'narrative', atTick: 2400, severity: 'advisory',
      message: 'Reassess delivered ventilation, capnography, oxygen saturation, pressure, and predicted depth. This short lesson ends before delivery.',
    },
  ],
  replayPoints: [{
    id: 'before-obstetric-induction', label: 'Before obstetric induction',
    objectiveId: 'prepare-obstetric-oxygen-reserve', atTick: 99,
    reason: 'Repeat the preparation and induction sequence without replaying the briefing.',
  }],
  debrief: { rubric: [
    {
      id: 'obstetric-oxygen-reserve', objectiveId: 'prepare-obstetric-oxygen-reserve',
      question: 'What end-tidal value showed that the modeled oxygen reservoir was ready, and which machine settings preceded it?',
      concept: 'preoxygenation-and-safe-apnea-time',
    },
    {
      id: 'obstetric-block-onset', objectiveId: 'wait-for-intubating-block',
      question: 'What did the train-of-four show when you instrumented, and what can a peripheral measurement not guarantee?',
      concept: 'train-of-four-and-residual-blockade',
    },
    {
      id: 'obstetric-apnea-margin', objectiveId: 'protect-obstetric-apnea-margin',
      question: 'What was the lowest maternal oxygen saturation before gas exchange returned?',
      concept: 'preoxygenation-and-safe-apnea-time',
    },
    {
      id: 'obstetric-gas-exchange', objectiveId: 'confirm-obstetric-ventilation',
      question: 'What screen evidence showed delivered ventilation and gas exchange had returned?',
      concept: 'capnogram-morphology',
    },
  ] },
};
