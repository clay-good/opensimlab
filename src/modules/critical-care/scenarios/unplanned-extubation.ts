/** Bounded adult unplanned-extubation recognition and escalation. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const UNPLANNED_EXTUBATION: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'unplanned-extubation', version: '0.1.0', maturity: 'preview',
    title: 'Unplanned extubation', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 8, difficulty: 'intermediate', objectives: [
      { id: 'support-unplanned-extubation-and-call-help', statement: 'Support oxygenation and call experienced ICU and airway help after unplanned extubation.', measure: 'Immediate support and help preceded definitive-airway intent.' },
      { id: 'assess-unplanned-extubation-tolerance', statement: 'Assess airway patency, work of breathing, oxygenation, ventilation, mental status, secretions, and circulation.', measure: 'The fixed whole-patient panel was reviewed rather than assuming every unplanned extubation fails.' },
      { id: 'classify-unplanned-extubation-failure', statement: 'Recognize convergent post-extubation respiratory failure and choose prompt reintubation.', measure: 'The decision integrated distress, gas exchange, airway protection, and trajectory.' },
      { id: 'record-unplanned-extubation-airway-plan', statement: 'Record experienced-team preoxygenation and reintubation intent without using noninvasive support to delay a failing airway.', measure: 'The proxy preserved drug, equipment, and procedural boundaries.' },
      { id: 'reassess-unplanned-extubation-response', statement: 'Confirm the reported new airway, reassess the patient, and hand off a prevention review.', measure: 'Placement evidence and whole-patient response preceded incident-learning intent.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Clerk AM, Shah RJ, Kothari J, et al. Position Statement of ISCCM Committee on Weaning from Mechanical Ventilator. Indian J Crit Care Med. 2024;28(S2):S233-S248.',
        'Goel NN, Ferreyro BL, Pitre T, et al. Noninvasive Respiratory Support for Adult Patients with Acute Respiratory Failure: An Official ATS Clinical Practice Guideline. Am J Respir Crit Care Med. Published online June 29, 2026. doi:10.1093/ajrccm/aamag302.',
        'Goodfellow LT, Miller AG, Varekojis SM, et al. AARC Clinical Practice Guideline: Patient-Ventilator Assessment. Respir Care. 2024;69:1042-1054.',
      ] },
    limitations: ['unplanned-extubation-findings-failure-and-response-are-authored',
      'unplanned-extubation-oxygen-airway-and-confirmation-controls-are-proxies',
      'no-live-unplanned-extubation-diagnosis-airway-procedure-or-outcome'],
  },
  patient: { ageYears: 71, sex: 'male', heightCm: 175, weightKg: 79, asaClass: 4,
    diagnosis: 'Authored respiratory failure after unplanned extubation',
    procedure: 'Post-extubation airway escalation',
    comorbidities: ['Pneumonia', 'Chronic obstructive pulmonary disease'],
    medications: ['ICU infusions not represented'], allergies: ['No known drug allergies'],
    fasting: 'Enteral feeding stopped after the event', baseline: { heartRateBpm: 116,
      meanArterialMmHg: 78, strokeVolumeMl: 56, hemoglobinGPerDl: 12.1,
      bloodVolumeMl: 5000, coreTemperatureC: 37.8, arterialStiffness: 1.1,
      baroreflexGain: 0.85, fixedStrokeVolume: false },
    airway: { difficulty: 0.25, difficultMaskVentilation: false,
      assessment: 'Tracheal tube displaced during repositioning and now outside the airway' },
    respiratory: { profile: 'moderately-ill' } },
  equipment: { monitoring: ['ecg', 'arterial-line', 'pulse-oximetry', 'temperature'],
    ventilator: { mode: 'volume-control', fio2: 0.5, tidalVolumeMl: 430,
      respiratoryRateBpm: 18, freshGasFlowLPerMin: 10, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'unplanned-extubation-presentation', type: 'narrative', target: 'unplanned-extubation',
      atTick: 0, severity: 'critical', message: 'After repositioning, the ventilator disconnect alarm sounds and the tracheal tube is visibly outside the mouth. The patient is breathing at 36/min with accessory-muscle use, a hoarse weak voice, weak cough, and pooled secretions. SpO₂ is 86% despite face-mask oxygen, an authored arterial panel is pH 7.27 and PaCO₂ 58 mmHg, the patient is newly drowsy, HR is 116/min, and MAP is 78 mmHg. No continuous exhaled-carbon-dioxide signal is available without an airway. No response has been recorded.' },
    { id: 'unplanned-extubation-boundary', type: 'narrative',
      target: 'unplanned-extubation-boundary', atTick: 0, severity: 'warning',
      message: 'Announce the event, support oxygenation, and call respiratory-therapy, senior ICU, and airway help. Assess patency, work, oxygenation, ventilation, mental status, secretions, and circulation before deciding whether the patient tolerates extubation. This fixed panel shows failure requiring prompt experienced-team reintubation intent; noninvasive support must not delay a failing airway. Then review reported placement evidence and the fixed response before handing off a securement, sedation, mobility, staffing, and communication review. Examination, monitoring acquisition, oxygen delivery, mask ventilation, drugs, airway equipment, intubation, imaging, diagnosis, disposition, and outcome are not simulated.' },
  ],
  debrief: { rubric: [
    { id: 'unplanned-extubation-support', objectiveId: 'support-unplanned-extubation-and-call-help', question: 'How were oxygenation and experienced help mobilized immediately?' },
    { id: 'unplanned-extubation-assessment', objectiveId: 'assess-unplanned-extubation-tolerance', question: 'Which whole-patient findings distinguished tolerance from failure?' },
    { id: 'unplanned-extubation-failure', objectiveId: 'classify-unplanned-extubation-failure', question: 'Why did this patient require prompt reintubation rather than observation?' },
    { id: 'unplanned-extubation-plan', objectiveId: 'record-unplanned-extubation-airway-plan', question: 'How did the plan prepare for reintubation without letting noninvasive support delay it?' },
    { id: 'unplanned-extubation-response', objectiveId: 'reassess-unplanned-extubation-response', question: 'Which placement and patient-response findings closed the immediate loop, and what prevention review remained?' },
  ] },
};
