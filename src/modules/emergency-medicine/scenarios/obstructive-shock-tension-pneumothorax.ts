/** Penetrating chest trauma with a fixed left tension-pneumothorax obstructive-shock pattern. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const OBSTRUCTIVE_SHOCK_TENSION_PNEUMOTHORAX: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'obstructive-shock-tension-pneumothorax', version: '0.1.0', maturity: 'draft',
    title: 'Obstructive shock from tension pneumothorax', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 7, difficulty: 'intermediate',
    objectives: [
      { id: 'assess-obstructive-pleural-shock', statement: 'Join unilateral breathing findings with hypoxia and shock in a compatible trauma context.', measure: 'A bilateral-ventilation assessment was accepted within 30 seconds of the modeled event.' },
      { id: 'escalate-obstructive-pleural-shock', statement: 'Call for help while treating the immediately reversible threat.', measure: 'A pleural-crisis help request was accepted within 30 seconds.' },
      { id: 'support-obstructive-pleural-oxygenation', statement: 'Record high-concentration oxygen while definitive pleural treatment proceeds.', measure: 'Inspired oxygen fraction 1.0 was accepted within 60 seconds.' },
      { id: 'decompress-obstructive-pleural-shock', statement: 'Record immediate left-chest decompression intent without waiting for imaging.', measure: 'Bounded decompression intent was accepted within 60 seconds.' },
      { id: 'reassess-obstructive-pleural-recovery', statement: 'Reassess oxygenation and circulation after the accepted intent action.', measure: 'Oxygen saturation reached at least 94% and mean arterial pressure at least 65 mmHg after accepted decompression.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Coccolini F, Cremonini C, Moore EE, et al. Thoracic trauma WSES-AAST guidelines. World J Emerg Surg. 2025;20:78. PMID 41094688. doi:10.1186/s13017-025-00651-1.',
        'European Resuscitation Council Guidelines 2025: Special Circumstances in Resuscitation. Resuscitation. 2025;215(Suppl 1):110753.',
      ],
    },
    limitations: [
      'obstructive-pleural-findings-are-authored',
      'pneumothorax-response-is-a-teaching-trajectory',
      'no-procedure-or-equipment-selection',
      'no-obstructive-shock-differential-or-outcome',
    ],
  },
  patient: {
    ageYears: 29, sex: 'female', heightCm: 168, weightKg: 64, asaClass: 4,
    diagnosis: 'Penetrating left-chest trauma with severe respiratory and hemodynamic compromise',
    procedure: 'Emergency recognition and initial response to obstructive shock',
    comorbidities: ['None known'], medications: ['None known'], allergies: ['Unknown at arrival'],
    fasting: 'Not established in the emergency department',
    baseline: {
      heartRateBpm: 126, meanArterialMmHg: 82, strokeVolumeMl: 64,
      hemoglobinGPerDl: 12.3, bloodVolumeMl: 4100, coreTemperatureC: 36.1,
      arterialStiffness: 1, baroreflexGain: 1.1, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Speaking in short phrases; no tracheal tube is present',
    },
    respiratory: { profile: 'moderately-ill' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'capnography', 'pulse-oximetry'],
    airwayDevice: 'facemask',
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 500,
      respiratoryRateBpm: 26, freshGasFlowLPerMin: 2, delivering: false,
    },
  },
  formulary: [],
  timeline: [
    {
      id: 'left-tension-obstructive-shock-at-arrival', type: 'tension-pneumothorax',
      target: 'left-pleural-space', value: 0.9, atTick: 0, severity: 'critical',
      message: 'After penetrating left-chest trauma, respiratory distress, hypoxia, and severe hypotension worsen together.',
    },
    {
      id: 'obstructive-pleural-shock-boundary', type: 'narrative',
      target: 'obstructive-shock-tension-pneumothorax', atTick: 0, severity: 'advisory',
      message: 'Assess bilateral ventilation, escalate, give high-concentration oxygen, record immediate left-chest decompression intent, and reassess. Examination, POCUS, imaging, procedural technique, equipment selection, later drainage, recurrence, differential diagnosis, and outcome are not simulated.',
    },
  ],
  debrief: { rubric: [
    { id: 'obstructive-pleural-assessment', objectiveId: 'assess-obstructive-pleural-shock', question: 'Which trauma, breathing, oxygenation, and circulation findings formed the dangerous pattern?' },
    { id: 'obstructive-pleural-escalation', objectiveId: 'escalate-obstructive-pleural-shock', question: 'How did escalation proceed alongside treatment of the reversible threat?' },
    { id: 'obstructive-pleural-oxygen', objectiveId: 'support-obstructive-pleural-oxygenation', question: 'When was high-concentration oxygen recorded, and what could it not fix?' },
    { id: 'obstructive-pleural-decompression', objectiveId: 'decompress-obstructive-pleural-shock', question: 'Why was decompression intent not delayed for imaging, and which procedural details remain outside the lab?' },
    { id: 'obstructive-pleural-reassessment', objectiveId: 'reassess-obstructive-pleural-recovery', question: 'How did oxygenation and pressure change after the accepted intent action?' },
  ] },
};
