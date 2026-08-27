import type { Scenario } from '@anesthesia/scenarios/types';

export const THYROID_STORM_HEMODYNAMIC_RISK: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'thyroid-storm-hemodynamic-risk', version: '0.1.1', maturity: 'preview',
    title: 'Thyroid storm: treat the person, not just the pulse', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 180, difficulty: 'intermediate',
    objectives: [
      { id: 'thyroid-urgent-treatment', statement: 'Begin qualified multimodal treatment without waiting for laboratory confirmation.', measure: 'Antithyroid and supportive pathways start without a diagnostic-delay choice or incomplete-coverage deterioration.' },
      { id: 'thyroid-circulation', statement: 'Assess circulation before selecting individualized rate control.', measure: 'Fresh circulation findings inform qualified rate-control review without a blanket beta-blocker choice.' },
      { id: 'thyroid-sequence', statement: 'Sequence iodine safely within the selected treatment pathway.', measure: 'Iodine follows antithyroid therapy by at least one hour; other urgent treatment is not delayed.' },
      { id: 'thyroid-reassessment', statement: 'Reassess the whole person and distinguish partial support from resolution.', measure: 'A new bedside assessment observes the authored later checkpoint rather than relying on stale observations or a pulse alone.' },
      { id: 'thyroid-handoff', statement: 'Hand off ongoing treatment, precipitant work, and escalation needs.', measure: 'Qualified support and the complete pathway reach ongoing monitored handoff without claiming durable recovery.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED', competingInterests: 'None declared',
      reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.1',
      sources: [
        'European Thyroid Association, British Thyroid Association, Society for Endocrinology, and Welsh Endocrine and Diabetes Society. Management of thyroid emergencies: joint consensus statement on management of thyroid storm. 2026. doi:10.1530/ETJ-26-0043.',
        'Ross DS et al. 2016 American Thyroid Association Guidelines for Diagnosis and Management of Hyperthyroidism and Other Causes of Thyrotoxicosis. Recommendations 34–35 and Table 7. doi:10.1089/thy.2016.0229.',
        'Satoh T et al. 2016 Guidelines for the management of thyroid storm from The Japan Thyroid Association and Japan Endocrine Society. Sections on iodide and beta-adrenergic antagonists. doi:10.1507/endocrj.EJ16-0336.',
      ],
    },
    limitations: ['thyroid-authored-checkpoints', 'thyroid-qualified-treatment-not-prescribing', 'thyroid-sequence-and-recovery-boundaries'],
  },
  patient: {
    ageYears: 38, sex: 'female', heightCm: 165, weightKg: 62, asaClass: 4,
    diagnosis: 'Known Graves disease with fever, agitation, vomiting, tachycardia, and circulatory instability',
    procedure: 'Thyroid emergency treatment and reassessment rehearsal',
    comorbidities: ['Graves disease'], medications: ['Antithyroid medication interrupted during vomiting'],
    allergies: ['No known drug allergies'], fasting: 'Vomiting and poor oral intake',
    baseline: { heartRateBpm: 148, meanArterialMmHg: 71, strokeVolumeMl: 42, hemoglobinGPerDl: 12.5,
      bloodVolumeMl: 4000, coreTemperatureC: 39.8, arterialStiffness: 1, baroreflexGain: 1, fixedStrokeVolume: true },
    airway: { difficulty: 0.1, difficultMaskVentilation: false, assessment: 'Agitated and confused, breathing spontaneously, with vomiting' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], ventilator: { mode: 'manual', fio2: 0.21,
    tidalVolumeMl: 430, respiratoryRateBpm: 28, freshGasFlowLPerMin: 10, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'thyroid-presentation', type: 'narrative', target: 'thyroid-storm', atTick: 0, severity: 'critical',
      message: 'A 38-year-old with known Graves disease has fever, agitation, confusion, vomiting, and interrupted antithyroid treatment. Supplied BP 96/58 mmHg, HR 148/min, RR 28/min, room-air SpO2 94%, temperature 39.8°C. Qualified clinicians suspect thyroid storm. Infection and other causes can coexist; laboratory confirmation and a score are not prerequisites for urgent treatment. Request a focused circulation assessment while treatment starts.' },
    { id: 'thyroid-boundary', type: 'narrative', target: 'thyroid-storm-boundary', atTick: 0, severity: 'warning',
      message: 'Dose-free decisions represent qualified team care, not prescribing. This lesson selects the 2026 joint consensus and ATA pathway: iodine at least one hour after antithyroid therapy; Japanese guidance allows concurrent treatment in selected hyperthyroid disease. Steroid, cooling, respiratory, individualized fluid, and precipitant care proceed without waiting. Five-minute deterioration, 30-minute incomplete-rescue takeover, a two-hour early partial-support checkpoint after the complete pathway, and a four-hour unfinished-lesson stop are authored teaching clocks, not safe delays or expected treatment kinetics. Marked clinical improvement generally takes 24–72 hours. Reassess sooner whenever the patient worsens; use 60× for observation periods.' },
  ],
  replayPoints: [{ id: 'thyroid-first-treatment', label: 'Return to urgent treatment and circulation assessment',
    objectiveId: 'thyroid-urgent-treatment', atTick: 1, reason: 'Compare parallel qualified care with waiting for a laboratory result or choosing rate control from the pulse alone.' }],
  debrief: { rubric: [
    { id: 'thyroid-urgency', objectiveId: 'thyroid-urgent-treatment', question: 'What justified treatment while confirmation and alternative-cause work continued?' },
    { id: 'thyroid-cardiac-risk', objectiveId: 'thyroid-circulation', question: 'How did perfusion and congestion change the rate-control decision?' },
    { id: 'thyroid-iodine', objectiveId: 'thyroid-sequence', question: 'Which treatment had a sequence constraint, and which treatments could proceed immediately?' },
    { id: 'thyroid-observation', objectiveId: 'thyroid-reassessment', question: 'What did the new bedside assessment establish, and what did it not prove?' },
    { id: 'thyroid-continuity', objectiveId: 'thyroid-handoff', question: 'Which treatment, precipitant, organ-support, and escalation responsibilities remained with the receiving team?' },
  ] },
};
