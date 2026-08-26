/** Bounded ICU refractory status-epilepticus response. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const STATUS_EPILEPTICUS: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'status-epilepticus', version: '0.1.0', maturity: 'preview',
    title: 'Refractory status epilepticus', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 9, difficulty: 'advanced', objectives: [
      { id: 'recognize-refractory-status-epilepticus', statement: 'Recognize refractory electrographic status after emergent and urgent therapy.', measure: 'Persistent EEG seizures and absent recovery triggered neurocritical-care escalation despite stopped convulsions.' },
      { id: 'review-refractory-status-pattern', statement: 'Integrate fixed EEG, airway, ventilation, perfusion, medication, and mimic findings without treating immobility as seizure control.', measure: 'The whole panel separated absent movement from electrographic seizure suppression.' },
      { id: 'activate-refractory-status-pathway', statement: 'Activate expert-selected continuous anesthetic therapy with continuous EEG and organ-support guardrails.', measure: 'The pathway linked seizure suppression to EEG, ventilation, and hemodynamic monitoring without selecting a universal drug or target.' },
      { id: 'address-refractory-status-causes', statement: 'Keep time-critical metabolic, toxic, infectious, structural, immune, and medication causes under active review.', measure: 'Cause investigation and immediate reversible-treatment pathways continued alongside seizure suppression.' },
      { id: 'reassess-refractory-status-trajectory', statement: 'Reassess EEG seizure burden and systemic physiology without claiming durable control or outcome.', measure: 'The fixed response improved briefly while recurrence, cause, sedation, and organ trajectories remained open.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Neurocritical Care Society. Emergency Neurological Life Support: Status Epilepticus Protocol. Version 5.0. 2024.',
        'Herman ST, Abend NS, Bleck TP, et al. Consensus statement on continuous EEG in critically ill adults and children, part I: indications. J Clin Neurophysiol. 2015;32:87-95.',
        'Hirsch LJ, Fong MWK, Leitinger M, et al. ACNS Standardized Critical Care EEG Terminology: 2021 Version. J Clin Neurophysiol. 2021;38:1-29.',
      ] },
    limitations: ['critical-care-status-epilepticus-findings-and-response-are-authored',
      'critical-care-status-epilepticus-eeg-anesthetic-and-cause-actions-are-proxies',
      'no-live-critical-care-status-epilepticus-diagnosis-prescribing-eeg-airway-or-outcome'],
  },
  patient: { ageYears: 52, sex: 'male', heightCm: 180, weightKg: 84, asaClass: 5,
    diagnosis: 'Refractory status epilepticus with persistent electrographic seizures',
    procedure: 'Refractory status epilepticus rescue',
    comorbidities: ['Hypertension', 'Remote traumatic brain injury'],
    medications: ['Lorazepam and levetiracetam load reported; delivery not modeled'],
    allergies: ['No known drug allergies'], fasting: 'ICU patient; enteral-nutrition state not represented',
    baseline: { heartRateBpm: 118, meanArterialMmHg: 62, strokeVolumeMl: 45,
      hemoglobinGPerDl: 13.4, bloodVolumeMl: 5000, coreTemperatureC: 38.1,
      arterialStiffness: 1.1, baroreflexGain: 0.7, fixedStrokeVolume: false },
    airway: { difficulty: 0.25, difficultMaskVentilation: false,
      assessment: 'Intubated with reported continuous capnography and bilateral ventilation; no visible convulsions' },
    respiratory: { profile: 'moderately-ill' } },
  equipment: { monitoring: ['ecg', 'arterial-line', 'pulse-oximetry', 'capnography', 'temperature'],
    airwayDevice: 'tracheal-tube', ventilator: { mode: 'volume-control', fio2: 0.4,
      tidalVolumeMl: 460, respiratoryRateBpm: 18, freshGasFlowLPerMin: 10, delivering: true } },
  formulary: [],
  timeline: [
    { id: 'critical-care-status-presentation', type: 'narrative', target: 'critical-care-status-epilepticus',
      atTick: 0, severity: 'critical', message: 'A 52-year-old intubated man remains unresponsive after reported adequate IV lorazepam and levetiracetam for generalized convulsive status. Visible convulsions stopped 12 minutes ago, but fixed continuous EEG reports recurrent evolving electrographic seizures without recovery between events. HR is 118/min, MAP 62 mmHg, SpO₂ 94% on FiO₂ 0.40, temperature 38.1°C, urine output 18 mL/h, and lactate is 4.2 mmol/L.' },
    { id: 'critical-care-status-boundary', type: 'narrative', target: 'critical-care-status-epilepticus-boundary',
      atTick: 0, severity: 'warning', message: 'Persistent seizures despite reported emergent benzodiazepine and urgent antiseizure therapy support a fixed refractory-status pattern. Absence of movement does not prove seizure control. Activate neurocritical-care, epilepsy, EEG, pharmacy, airway, and critical-care help. Review continuous EEG, airway, ventilation, oxygenation, pressure, perfusion, temperature, glucose, electrolytes, medication delivery, and dangerous mimics. Activate expert-selected continuous anesthetic therapy with continuous EEG and organ-support guardrails; no universal agent, dose, depth, burst-suppression target, or duration is taught. Keep metabolic, toxic, infectious, structural, immune, medication, and other causes active; then reassess the whole trajectory. Examination, monitoring or EEG acquisition or interpretation, diagnosis, oxygen or ventilator change, fluid or drug delivery, access, dosing, airway management, imaging, lumbar puncture, procedure, transfer, disposition, prognosis, and outcome are not simulated.' },
  ],
  debrief: { rubric: [
    { id: 'critical-care-status-recognition', objectiveId: 'recognize-refractory-status-epilepticus', question: 'Why did stopped convulsions fail to establish seizure control?' },
    { id: 'critical-care-status-pattern', objectiveId: 'review-refractory-status-pattern', question: 'How did EEG and systemic physiology define the refractory pattern and immediate risks?' },
    { id: 'critical-care-status-pathway', objectiveId: 'activate-refractory-status-pathway', question: 'Why were continuous anesthetic therapy, EEG, ventilation, and hemodynamic guardrails linked?' },
    { id: 'critical-care-status-causes', objectiveId: 'address-refractory-status-causes', question: 'Which reversible and dangerous cause pathways had to remain active during suppression?' },
    { id: 'critical-care-status-response', objectiveId: 'reassess-refractory-status-trajectory', question: 'What improved in the fixed response, and why was durable control still unproven?' },
  ] },
};
