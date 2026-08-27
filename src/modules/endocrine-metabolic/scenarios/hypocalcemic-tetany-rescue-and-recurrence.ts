import type { Scenario } from '@anesthesia/scenarios/types';

export const HYPOCALCEMIC_TETANY_RESCUE_AND_RECURRENCE: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'hypocalcemic-tetany-rescue-and-recurrence', version: '0.1.0', maturity: 'preview',
    title: 'Hypocalcemic tetany: rescue now, prevent recurrence', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 60, difficulty: 'intermediate',
    objectives: [
      { id: 'hypocalcemia-rescue', statement: 'Start qualified monitored calcium rescue for symptomatic hypocalcemia without an artificial treatment delay.', measure: 'Calcium rescue proceeds without waiting for laboratory completion, magnesium normalization, or a support acknowledgment; oral-only and delay choices remain evidence.' },
      { id: 'hypocalcemia-risk', statement: 'Assess airway, seizure, and cardiac risk without assuming every postoperative airway problem is hypocalcemia.', measure: 'Qualified risk assessment records the supplied patent airway and prolonged QTc without delaying calcium rescue or claiming a dynamic ECG measurement.' },
      { id: 'hypocalcemia-cause', statement: 'Address low magnesium and postoperative calcium regulation alongside continuing rescue.', measure: 'Supplied cause findings inform magnesium correction and continuing calcium plus qualified activated-vitamin-D care; initial relief does not end treatment.' },
      { id: 'hypocalcemia-reassessment', statement: 'Use fresh observations to distinguish initial relief, recurrence, and incomplete stabilization.', measure: 'Early and later reassessments explicitly observe the authored course; old calcium results never become current merely because time passes.' },
      { id: 'hypocalcemia-handoff', statement: 'Hand off persistent electrolyte and cardiac risk with ongoing qualified care.', measure: 'Complete care and a fresh later reassessment permit continuing-care handoff without declaring magnesium correction, QT normalization, permanent hypoparathyroidism, or discharge readiness; missing the early observation loses observation credit rather than blocking appropriate handoff.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED', competingInterests: 'None declared',
      reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0',
      sources: [
        'Turner J, Gittoes N, Selby P, Society for Endocrinology Clinical Committee. Emergency management of acute hypocalcaemia in adult patients. Endocrine Connections. 2016;5:G7-G8. doi:10.1530/EC-16-0056. Severe hypocalcemia, investigations, and underlying-cause treatment.',
        'Turner J, Gittoes N, Selby P. Emergency management of acute hypocalcaemia in adult patients: addendum. Endocrine Connections. 2019;8:X1. doi:10.1530/EC-16-0056a. Calcium-preparation equivalence and safety.',
        'Bollerslev J et al. Revised European Society of Endocrinology Clinical Practice Guideline: Treatment of Chronic Hypoparathyroidism in Adults. 2025;193:G83-G112. doi:10.1093/ejendo/lvaf222. Recommendations R.1.1, R.2.5, R.3.3 and R.3.8; acute emergency discussion in section 5.3.',
        'Iliff HA et al. Management of haematoma after thyroid surgery: multidisciplinary DAS, BAETS and ENT-UK consensus guidelines. Anaesthesia. 2022;77:82-95; published online 2021. doi:10.1111/anae.15585. Recognition and escalation of postoperative airway risk.',
      ],
    },
    limitations: ['hypocalcemia-authored-response-and-recurrence', 'hypocalcemia-qualified-care-and-cause-limits', 'hypocalcemia-postoperative-airway-and-handoff'],
  },
  patient: {
    ageYears: 46, sex: 'female', heightCm: 165, weightKg: 68, asaClass: 3,
    diagnosis: 'Acute symptomatic hypocalcemia with tetany after total thyroidectomy',
    procedure: 'Monitored calcium rescue, cause-directed continuing care, reassessment, and handoff',
    comorbidities: ['Postoperative day 1 after total thyroidectomy', 'Cause findings require explicit review'],
    medications: ['Perioperative medication and supplement history requires qualified review'], allergies: ['No known drug allergies'],
    fasting: 'Postoperative intake requires review; oral treatment alone does not address this emergency',
    baseline: { heartRateBpm: 98, meanArterialMmHg: 83, strokeVolumeMl: 70, hemoglobinGPerDl: 12.5,
      bloodVolumeMl: 4400, coreTemperatureC: 36.8, arterialStiffness: 1, baroreflexGain: 1, fixedStrokeVolume: true },
    airway: { difficulty: 0.1, difficultMaskVentilation: false, assessment: 'Initially patent airway without supplied neck hematoma; deterioration requires qualified reassessment' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], ventilator: { mode: 'manual', fio2: 0.21,
    tidalVolumeMl: 450, respiratoryRateBpm: 20, freshGasFlowLPerMin: 10, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'hypocalcemia-presentation', type: 'narrative', target: 'hypocalcemia', atTick: 0, severity: 'critical',
      message: 'A fictional 46-year-old woman on postoperative day 1 after total thyroidectomy has painful carpopedal spasm and perioral tingling. Initial supplied observations: BP 112/68 mmHg, HR 98/min, RR 20/min, SpO2 98%, temperature 36.8°C, adjusted calcium 6.6 mg/dL (about 1.65 mmol/L), and an ECG report with QTc 520 ms. The airway is initially patent with no supplied neck hematoma. The QTc is a fixed report, not a calculated waveform measurement. Qualified monitored calcium rescue must not wait for the cause panel, magnesium normalization, or another button.' },
    { id: 'hypocalcemia-boundary', type: 'narrative', target: 'hypocalcemia-boundary', atTick: 0, severity: 'warning',
      message: 'Dose-free choices represent qualified care, not calcium preparation, dose, rate, access, airway, or seizure-management skills. Review supplied cause findings before the selected magnesium and continuing-care pathways. All lesson clocks are authored: a 5-minute missing-rescue flag, 30-minute no-rescue takeover, 15-minute initial relief, 45-minute recurrence if magnesium or continuing care remains absent, a 60-minute partial checkpoint after all care and support, and a 180-minute unfinished stop. These are not safe delays, kinetics, or predicted outcomes. Reassess earlier whenever needed. Calcium stays low; neither magnesium nor QT normalization is modeled. Postoperative airway deterioration may have another cause, including hematoma. Hand off ongoing care, not recovery or permanent hypoparathyroidism. Pause freely and use 60× during observation.' },
  ],
  replayPoints: [{ id: 'hypocalcemia-first-response', label: 'Return to monitored calcium rescue',
    objectiveId: 'hypocalcemia-rescue', atTick: 1, reason: 'Compare prompt rescue and ongoing cause-directed care with diagnostic delay or stopping after initial relief.' }],
  debrief: { rubric: [
    { id: 'hypocalcemia-rescue-review', objectiveId: 'hypocalcemia-rescue', question: 'What justified urgent monitored calcium rescue, and which information could be gathered alongside it?' },
    { id: 'hypocalcemia-risk-review', objectiveId: 'hypocalcemia-risk', question: 'How did the supplied QTc, tetany, and postoperative context shape airway and cardiac reassessment?' },
    { id: 'hypocalcemia-cause-review', objectiveId: 'hypocalcemia-cause', question: 'Why did low magnesium and postoperative calcium regulation still matter after early symptom relief?' },
    { id: 'hypocalcemia-observation', objectiveId: 'hypocalcemia-reassessment', question: 'Which fresh observations distinguished initial relief from recurrence or incomplete stabilization?' },
    { id: 'hypocalcemia-continuity', objectiveId: 'hypocalcemia-handoff', question: 'Who owns continuing calcium, magnesium, activated-vitamin-D review, ECG and laboratory monitoring, and unresolved postoperative risk?' },
  ] },
};
