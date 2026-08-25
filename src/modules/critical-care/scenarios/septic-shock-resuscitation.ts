/** Bounded persistent septic-shock reassessment lesson. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const SEPTIC_SHOCK_RESUSCITATION: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'septic-shock-resuscitation', version: '0.1.0', maturity: 'draft',
    title: 'Persistent septic-shock resuscitation', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 8, difficulty: 'intermediate', objectives: [
      { id: 'reconcile-septic-shock-resuscitation-so-far', statement: 'Reconcile prior treatment claims with the current patient response.', measure: 'Prior antimicrobial, fluid, vasopressor, and source-control intents and delivery claims remained separate from the present patient response.' },
      { id: 'reassess-septic-shock-perfusion', statement: 'Reassess pressure alongside brain, skin, kidney, lactate, and respiratory tolerance.', measure: 'MAP was treated as one signal rather than proof of restored perfusion.' },
      { id: 'test-septic-shock-fluid-responsiveness', statement: 'Use the fixed dynamic response and lung findings to constrain further fluid.', measure: 'The 2% passive-leg-raise stroke-volume change and new B-lines prevented a blind repeat bolus.' },
      { id: 'individualize-septic-shock-support-and-source-control', statement: 'Activate individualized hemodynamic support and urgent source control in parallel.', measure: 'The plan preserved patient-specific pressure, flow, rhythm, access, and perfusion review without selecting a dose or performing drainage.' },
      { id: 'reassess-septic-shock-trajectory', statement: 'Reassess multi-organ perfusion and unresolved shock after the bounded plan.', measure: 'Closure retained persistent lactate, oliguria, source, support, and outcome uncertainty.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Surviving Sepsis Campaign. International Guidelines for Management of Sepsis and Septic Shock 2026. Society of Critical Care Medicine and European Society of Intensive Care Medicine.',
        'Monnet X, Messina A, Greco M, et al. ESICM guidelines on circulatory shock and hemodynamic monitoring 2025. Intensive Care Med. 2025;51:1971-2012. PMID:41236566.',
      ] },
    limitations: ['septic-shock-resuscitation-trajectory-and-response-are-authored',
      'septic-shock-resuscitation-controls-record-review-and-plan-intent-only',
      'no-live-sepsis-measurement-prescribing-source-control-or-outcome'],
  },
  patient: { ageYears: 66, sex: 'female', heightCm: 163, weightKg: 70, asaClass: 4,
    diagnosis: 'Authored persistent septic shock with suspected ascending cholangitis',
    procedure: 'Persistent septic-shock reassessment',
    comorbidities: ['Hypertension', 'Type 2 diabetes mellitus'],
    medications: ['Reported empiric antimicrobials and vasopressor support; delivery not modeled'],
    allergies: ['No known drug allergies'], fasting: 'ICU patient; nutrition state not represented',
    baseline: { heartRateBpm: 118, meanArterialMmHg: 64, strokeVolumeMl: 48,
      hemoglobinGPerDl: 10.8, bloodVolumeMl: 4550, coreTemperatureC: 39.1,
      arterialStiffness: 1.15, baroreflexGain: 0.75, fixedStrokeVolume: false },
    airway: { difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Awake on high-flow nasal oxygen; no fixed airway obstruction finding' },
    respiratory: { profile: 'moderately-ill' } },
  equipment: { monitoring: ['ecg', 'arterial-line', 'pulse-oximetry', 'capnography', 'temperature'],
    airwayDevice: 'facemask', ventilator: { mode: 'manual', fio2: 0.35, tidalVolumeMl: 440,
      respiratoryRateBpm: 24, freshGasFlowLPerMin: 10, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'persistent-septic-shock-presentation', type: 'narrative',
      target: 'septic-shock-resuscitation', atTick: 0, severity: 'critical',
      message: 'Two hours after probable ascending cholangitis was recognized, the fixed record reports blood cultures, empiric antimicrobials, 2,100 mL balanced crystalloid (30 mL/kg), and running norepinephrine; command, delivery, and effect remain separate claims. MAP is 64 mmHg, HR 118/min, refill 5 seconds, mottling reaches the knees, urine is 12 mL/h, attention is reduced, and lactate has risen from 5.8 to 6.4 mmol/L. SpO₂ is 94% on FiO₂ 0.35, RR 24/min, EtCO₂ 31 mmHg, and temperature 39.1°C. Urgent biliary source control is not yet performed.' },
    { id: 'persistent-septic-shock-boundary', type: 'narrative',
      target: 'septic-shock-resuscitation-boundary', atTick: 0, severity: 'warning',
      message: 'Reconcile what was ordered, what was reported delivered, and what response is actually present. Reassess pressure with brain, skin, kidney, lactate, capillary refill, gas exchange, and respiratory tolerance. A fixed passive-leg-raise panel changes stroke volume from 48 to 49 mL (+2%) and the fixed lung panel now has diffuse B-lines; these case facts do not support a blind repeat-fluid bolus, but they are not universal cutoffs and do not diagnose one phenotype. Activate senior critical-care, nursing, pharmacy, respiratory, procedural, and source-control help; record individualized hemodynamic-support review and urgent biliary source-control intent in parallel. Fixed 10-minute response is MAP 68 mmHg, HR 110/min, refill 4 seconds, unchanged urine 12 mL/h, lactate not yet repeated, SpO₂ 94% on unchanged FiO₂ 0.35, RR 23/min, EtCO₂ 33 mmHg, and temperature 39.0°C. Persistent hypoperfusion, source control, support requirements, alternate causes, organ failure, durability, and outcome remain open. The screen does not examine, measure, sample, scan, calculate, diagnose, prescribe, deliver fluid or drugs, adjust a device, perform drainage, determine disposition, or predict outcome.' },
  ],
  debrief: { rubric: [
    { id: 'septic-resuscitation-context', objectiveId: 'reconcile-septic-shock-resuscitation-so-far', question: 'Which prior commands, delivery claims, and patient responses had to remain separate?' },
    { id: 'septic-resuscitation-perfusion', objectiveId: 'reassess-septic-shock-perfusion', question: 'Which non-pressure signals showed that MAP alone had not closed resuscitation?' },
    { id: 'septic-resuscitation-fluid', objectiveId: 'test-septic-shock-fluid-responsiveness', question: 'Why did the fixed dynamic and lung panels block a blind repeat bolus?' },
    { id: 'septic-resuscitation-plan', objectiveId: 'individualize-septic-shock-support-and-source-control', question: 'Why did support review and urgent source control proceed together?' },
    { id: 'septic-resuscitation-trajectory', objectiveId: 'reassess-septic-shock-trajectory', question: 'What improved, and which shock and outcome questions remained open?' },
  ] },
};
