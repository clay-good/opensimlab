/**
 * Unexpected intraoperative hemorrhage: recognize volume loss and temporize it.
 *
 * The patient begins compensated, then loses volume rapidly when the abdomen is
 * opened. Balanced crystalloid can temporarily improve circulating volume, and
 * a bounded adult packed-red-cell action can restore volume and hemoglobin mass.
 * Compatibility, coagulation, laboratory guidance, and a massive-transfusion
 * protocol remain outside this case.
 */

import type { Scenario } from './types';

export const UNEXPECTED_INTRAOPERATIVE_HEMORRHAGE: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'unexpected-intraoperative-hemorrhage',
    version: '0.1.0',
    maturity: 'draft',
    title: 'Unexpected intraoperative hemorrhage',
    author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0',
    estimatedMinutes: 9,
    difficulty: 'advanced',
    objectives: [
      {
        id: 'recognize-hemorrhage',
        statement: 'Recognize compensated hemorrhage before the pressure is the only clue.',
        measure: 'Balanced crystalloid was started within 60 seconds of the rapid blood-loss event.',
      },
      {
        id: 'temporize-volume-loss',
        statement: 'Temporize volume loss while definitive hemorrhage control is obtained.',
        measure: 'At least 1,000 mL of balanced crystalloid was given before surgical control.',
      },
      {
        id: 'avoid-full-dose-induction',
        statement: 'Reduce the induction dose for a patient who is already volume depleted.',
        measure: 'The first propofol bolus was no more than 0.75 mg/kg.',
      },
      {
        id: 'manage-hypotension',
        statement: 'Protect perfusion while the surgeon controls the bleeding.',
        measure: 'Mean arterial pressure spent less than two minutes below 65 mmHg and never fell below 55 mmHg.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED',
      credential: 'UNSIGNED',
      institution: 'UNSIGNED',
      competingInterests: 'None declared',
      reviewedOn: '1970-01-01',
      reviewBy: '1970-01-01',
      contentVersion: '0.1.0',
      sources: [
        'Advanced Trauma Life Support, American College of Surgeons, 10th edition',
        'Mutschler M, et al. Injury 2014;45 Suppl 3:S35-8',
        'AABB Circular of Information for the Use of Human Blood and Blood Components, June 2024',
        'JPAC Guidelines for the Blood Transfusion Services, current Chapter 7.3',
        'NICE NG24, Fresh frozen plasma transfusion, updated February 2026',
        'NHS Blood and Transplant, Fresh-Frozen Plasma Dosage poster',
        'ASA Standards for Basic Anesthetic Monitoring',
      ],
    },
    limitations: [
      'crystalloid-volume-model',
      'prbc-fixed-unit-model',
      'bounded-dilutional-coagulopathy',
      'blood-bank-handoff-is-instantaneous',
      'no-team-or-communication',
      'bolus-injection-is-instantaneous',
    ],
  },
  patient: {
    ageYears: 34,
    sex: 'female',
    heightCm: 166,
    weightKg: 63,
    asaClass: 3,
    diagnosis: 'Hemoperitoneum from a ruptured ectopic pregnancy',
    procedure: 'Emergency laparotomy',
    comorbidities: ['None known before today'],
    medications: ['None'],
    allergies: ['None known'],
    fasting: 'Ate four hours ago. This would require rapid-sequence induction in clinical care',
    baseline: {
      heartRateBpm: 112,
      meanArterialMmHg: 78,
      strokeVolumeMl: 48,
      hemoglobinGPerDl: 9.6,
      bloodVolumeMl: 3500,
      coreTemperatureC: 35.9,
      arterialStiffness: 0.9,
      baroreflexGain: 1.2,
      fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.2,
      difficultMaskVentilation: false,
      assessment: 'Mallampati II, good mouth opening, full neck movement',
    },
    respiratory: { profile: 'healthy' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'arterial-line', 'capnography', 'pulse-oximetry', 'temperature', 'depth-index'],
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 450, respiratoryRateBpm: 14, delivering: false,
    },
  },
  formulary: [
    {
      drugId: 'propofol', concentration: 10, concentrationUnit: 'mg/mL',
      syringeVolumeMl: 20, typicalDose: 50,
      presets: [
        { label: '20 mg', amount: 20, unit: 'mg' },
        { label: '0.5 mg/kg', amount: 0.5, unit: 'mg/kg' },
        { label: '0.75 mg/kg', amount: 0.75, unit: 'mg/kg' },
        { label: '2 mg/kg', amount: 2, unit: 'mg/kg' },
      ],
    },
    {
      drugId: 'remifentanil', concentration: 50, concentrationUnit: 'µg/mL',
      syringeVolumeMl: 20, typicalDose: 40,
      presets: [
        { label: '10 µg', amount: 10, unit: 'µg' },
        { label: '25 µg', amount: 25, unit: 'µg' },
        { label: '0.5 µg/kg', amount: 0.5, unit: 'µg/kg' },
      ],
    },
  ],
  timeline: [
    {
      id: 'briefing', type: 'narrative', atTick: 0, severity: 'advisory',
      message: 'She is pale and cold with a heart rate of 112. Her pressure is holding, but the pulse pressure is narrow. The surgeon is ready.',
    },
    {
      id: 'ongoing-loss', type: 'blood-loss', atTick: 300, value: 180,
      durationTicks: 2100, severity: 'info',
      message: 'Blood continues to collect in the abdomen while anesthesia is established.',
    },
    {
      id: 'incision', type: 'surgical-stimulus', atTick: 2100, value: 0.9,
      durationTicks: 900, severity: 'advisory', message: 'Surgical incision.',
    },
    {
      id: 'rapid-blood-loss', type: 'blood-loss', atTick: 2400, value: 500,
      durationTicks: 1200, severity: 'critical',
      message: 'The abdomen is opened and the suction bottle fills rapidly. The tamponade has been released.',
    },
    {
      id: 'hemorrhage-controlled', type: 'narrative', atTick: 3900, severity: 'advisory',
      message: 'The surgeon has controlled the bleeding. What has been lost still needs definitive replacement.',
    },
  ],
  debrief: {
    rubric: [
      {
        id: 'first-clue', objectiveId: 'recognize-hemorrhage',
        question: 'What changed before the mean pressure fell, and which clue made you act?',
        concept: 'vasodilation-versus-hypovolemia',
      },
      {
        id: 'fluid-as-bridge', objectiveId: 'temporize-volume-loss',
        question: 'What did crystalloid improve, what did it dilute, and what definitive treatment is absent here?',
        concept: 'vasodilation-versus-hypovolemia',
      },
      {
        id: 'induction-dose', objectiveId: 'avoid-full-dose-induction',
        question: 'How did known volume loss change your induction dose?',
        concept: 'hysteresis-and-effect-site-lag',
      },
      {
        id: 'perfusion', objectiveId: 'manage-hypotension',
        question: 'How long was perfusion pressure low, and which part of your response treated the cause?',
        concept: 'vasodilation-versus-hypovolemia',
      },
    ],
  },
};
