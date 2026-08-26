/**
 * Laryngospasm after airway stimulation: recognize closure and begin treatment.
 *
 * This is deliberately an initial-response case. It models a held jaw-thrust
 * and CPAP maneuver, oxygen delivery, and deepening anesthesia. It does not
 * supply suction, an airway adjunct, succinylcholine, or a refractory pathway.
 */

import type { Scenario } from './types';

export const LARYNGOSPASM_AFTER_AIRWAY_STIMULATION: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'laryngospasm-after-airway-stimulation',
    version: '0.1.0',
    maturity: 'preview',
    title: 'Laryngospasm after airway stimulation',
    author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0',
    estimatedMinutes: 8,
    difficulty: 'intermediate',
    objectives: [
      {
        id: 'preoxygenate-before-laryngospasm',
        statement: 'Build an oxygen reserve before airway stimulation.',
        measure: 'End-tidal oxygen fraction was at least 0.90 when the scripted airway closure began.',
      },
      {
        id: 'apply-initial-laryngospasm-measures',
        statement: 'Respond with a held jaw thrust, continuous positive airway pressure, and 100% oxygen.',
        measure: 'The combined jaw-thrust and CPAP maneuver and at least 95% delivered oxygen were recorded within 30 seconds of closure.',
      },
      {
        id: 'deepen-during-laryngospasm',
        statement: 'Deepen anesthesia promptly while maintaining the airway maneuver.',
        measure: 'A propofol bolus was recorded within 45 seconds of closure. This is an action proxy, not proof that the clinical dose or sequence was complete.',
      },
      {
        id: 'protect-oxygenation-during-laryngospasm',
        statement: 'Preserve the oxygen margin while the initial measures take effect.',
        measure: 'Oxygen saturation remained at or above 92% during the scenario.',
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
        'Popat M, et al. Difficult Airway Society Guidelines for the management of tracheal '
          + 'extubation. Anaesthesia 2012;67:318-40. PMID 22321104',
        'Visvanathan T, et al. Crisis management during anaesthesia: laryngospasm. Qual Saf '
          + 'Health Care 2005;14:e3. PMID 15933300',
      ],
    },
    limitations: [
      'laryngospasm-initial-measures-are-a-teaching-model',
      'no-refractory-laryngospasm-pathway',
      'no-negative-pressure-pulmonary-edema',
      'no-shunt-or-dead-space-dynamics',
      'bolus-injection-is-instantaneous',
      'no-team-or-communication',
    ],
  },
  patient: {
    ageYears: 22,
    sex: 'male',
    heightCm: 178,
    weightKg: 74,
    asaClass: 2,
    diagnosis: 'Displaced distal radius fracture',
    procedure: 'Open reduction of a distal radius fracture',
    comorbidities: [
      'Upper respiratory infection three weeks ago, now resolved',
      'Smokes five cigarettes per day',
    ],
    medications: ['Paracetamol and ibuprofen'],
    allergies: ['None known'],
    fasting: 'Solids eight hours, clear fluids two hours',
    baseline: {
      heartRateBpm: 76,
      meanArterialMmHg: 92,
      strokeVolumeMl: 78,
      hemoglobinGPerDl: 14.8,
      bloodVolumeMl: 5100,
      coreTemperatureC: 36.7,
      arterialStiffness: 0.95,
      baroreflexGain: 1.1,
      fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.1,
      difficultMaskVentilation: false,
      assessment: 'Mallampati I, good mouth opening, full neck movement',
    },
    respiratory: { profile: 'healthy' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'capnography', 'pulse-oximetry', 'temperature', 'depth-index'],
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 500, respiratoryRateBpm: 12, delivering: false,
    },
  },
  formulary: [
    {
      drugId: 'propofol', concentration: 10, concentrationUnit: 'mg/mL',
      syringeVolumeMl: 20, typicalDose: 150,
      presets: [
        { label: '20 mg', amount: 20, unit: 'mg' },
        { label: '0.5 mg/kg', amount: 0.5, unit: 'mg/kg' },
        { label: '1 mg/kg', amount: 1, unit: 'mg/kg' },
        { label: '2 mg/kg', amount: 2, unit: 'mg/kg' },
      ],
    },
    {
      drugId: 'remifentanil', concentration: 50, concentrationUnit: 'µg/mL',
      syringeVolumeMl: 20, typicalDose: 70,
      presets: [
        { label: '25 µg', amount: 25, unit: 'µg' },
        { label: '0.5 µg/kg', amount: 0.5, unit: 'µg/kg' },
      ],
    },
  ],
  timeline: [
    {
      id: 'briefing', type: 'narrative', atTick: 0, severity: 'advisory',
      message: 'He had a recent respiratory infection and still coughs in the morning. This case models only initial laryngospasm measures. Suction, airway adjuncts, succinylcholine, calling for help, and refractory management are not available.',
    },
    {
      id: 'airway-stimulation', type: 'narrative', atTick: 2340, severity: 'info',
      message: 'An oral airway is inserted while the anesthetic plane is light.',
    },
    {
      id: 'laryngospasm-onset', type: 'laryngospasm', atTick: 2400,
      value: 0.95, severity: 'critical',
      message: 'The chest moves paradoxically, the reservoir bag will not move, and the capnogram disappears. A high-pitched sound becomes silence.',
    },
    {
      id: 'reassessment', type: 'narrative', atTick: 4200, severity: 'advisory',
      message: 'Reassess airway patency, delivered ventilation, saturation, and the next step if initial measures have not worked.',
    },
  ],
  debrief: {
    rubric: [
      {
        id: 'reserve-before-closure', objectiveId: 'preoxygenate-before-laryngospasm',
        question: 'What was the end-tidal oxygen fraction when closure began, and what margin did it buy?',
        concept: 'preoxygenation-and-safe-apnea-time',
      },
      {
        id: 'observable-initial-actions', objectiveId: 'apply-initial-laryngospasm-measures',
        question: 'Which findings prompted the held jaw thrust, continuous positive airway pressure, and 100% oxygen, and how quickly were they applied?',
        concept: 'capnogram-morphology',
      },
      {
        id: 'depth-and-pressure', objectiveId: 'deepen-during-laryngospasm',
        question: 'When did you deepen anesthesia, and what happened to pressure while you maintained the airway maneuver?',
        concept: 'vasodilation-versus-hypovolemia',
      },
      {
        id: 'limits-of-this-response', objectiveId: 'protect-oxygenation-during-laryngospasm',
        question: 'How low did saturation fall? If these initial measures failed, what unavailable actions and drugs would the complete clinical pathway require?',
        concept: 'preoxygenation-and-safe-apnea-time',
      },
    ],
  },
};
