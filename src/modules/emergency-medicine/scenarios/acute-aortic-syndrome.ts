/** Bounded acute aortic-syndrome recognition before definitive imaging. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const ACUTE_AORTIC_SYNDROME: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'acute-aortic-syndrome', version: '0.1.0', maturity: 'preview',
    title: 'Acute aortic syndrome', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 8, difficulty: 'advanced', objectives: [
      { id: 'assess-aortic-presentation-without-closure', statement: 'Integrate abrupt maximal-at-onset chest-to-back pain with a plausible coronary alternative without leaking a definitive diagnosis.', measure: 'The initial history, ECG, bilateral pressures, pulses, perfusion, and neurologic baseline were reviewed together.' },
      { id: 'detect-evolving-aortic-asymmetry', statement: 'Repeat bilateral pressure, pulse, limb-perfusion, and neurologic assessment when pain migrates and new symptoms appear.', measure: 'The authored multi-territory asymmetry was discovered by reassessment rather than shown at arrival.' },
      { id: 'escalate-suspected-aortic-syndrome', statement: 'Activate a multidisciplinary aortic pathway and protect the patient from unsupported default coronary or stroke treatment.', measure: 'Aortic escalation followed the evolving high-risk pattern before definitive imaging.' },
      { id: 'record-aortic-anti-impulse-intent', statement: 'Record monitored analgesia and local-protocol anti-impulse intent toward heart-rate and perfusion-preserving pressure goals.', measure: 'Rate control preceded any added pressure reduction and end-organ perfusion remained an explicit guardrail.' },
      { id: 'image-and-hand-off-aortic-uncertainty', statement: 'Prioritize urgent definitive aortic imaging while repeating malperfusion checks and handing off changes and uncertainty.', measure: 'Imaging intent and a final serial assessment were recorded without inventing a scan result or operation.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Isselbacher EM, Preventza O, Black JH 3rd, et al. 2022 ACC/AHA Guideline for the Diagnosis and Management of Aortic Disease. Circulation. 2022;146:e334-e482.',
      ],
    },
    limitations: ['aortic-presentation-asymmetry-and-response-are-authored',
      'aortic-assessment-escalation-anti-impulse-and-imaging-controls-are-proxies',
      'no-live-aortic-diagnosis-risk-score-drug-delivery-imaging-procedure-transfer-or-outcome'],
  },
  patient: {
    ageYears: 58, sex: 'male', heightCm: 178, weightKg: 84, asaClass: 4,
    diagnosis: 'Undifferentiated abrupt chest and back pain with evolving malperfusion concern',
    procedure: 'Serial asymmetry assessment and urgent acute-aortic-syndrome pathway',
    comorbidities: ['Hypertension'], medications: ['Medication history pending'],
    allergies: ['No known drug allergies'], fasting: 'Not established',
    baseline: { heartRateBpm: 104, meanArterialMmHg: 137, strokeVolumeMl: 72,
      hemoglobinGPerDl: 14.2, bloodVolumeMl: 4900, coreTemperatureC: 36.8,
      arterialStiffness: 1.25, baroreflexGain: 0.9, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false, assessment: 'Speaking clearly; airway patent' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry'], ventilator: { mode: 'manual',
    fio2: 0.21, tidalVolumeMl: 500, respiratoryRateBpm: 20, freshGasFlowLPerMin: 10, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'acute-aortic-syndrome-presentation', type: 'narrative', target: 'acute-aortic-syndrome', atTick: 0,
      severity: 'critical', message: 'A 58-year-old with hypertension reports abrupt severe central chest pain, maximal at onset 18 minutes ago and now felt between the shoulder blades, with diaphoresis and nausea. HR is 104/min, SpO₂ 96% on room air, and initial left and right arm pressures are 198/106 and 194/104 mmHg. Pulses, limb temperature, strength, speech, and sensation are authored as initially symmetric. A fixed ECG shows sinus tachycardia with nonspecific ST-T changes; acute coronary syndrome remains plausible. No definitive aortic imaging is yet available.' },
    { id: 'acute-aortic-syndrome-boundary', type: 'narrative', target: 'acute-aortic-syndrome-boundary', atTick: 0,
      severity: 'warning', message: 'Review the incomplete presentation without premature closure; repeat bilateral arm pressures, pulses, limb perfusion, and neurologic findings when the pain migrates; integrate any new discordance; activate local multidisciplinary aortic response; record monitored analgesia and anti-impulse intent with rate control before additional pressure reduction and adequate end-organ perfusion preserved; prioritize urgent definitive aortic imaging; then repeat and hand off the evolution. Examination, risk scoring, diagnosis, arterial-line placement, drug or dose selection and delivery, imaging acquisition or interpretation, surgery, transfer, disposition, and outcome are not simulated.' },
  ],
  debrief: { rubric: [
    { id: 'aortic-initial', objectiveId: 'assess-aortic-presentation-without-closure', question: 'Which initial features raised concern, and why did the plausible coronary alternative remain open?' },
    { id: 'aortic-evolution', objectiveId: 'detect-evolving-aortic-asymmetry', question: 'Which serial pulse, pressure, perfusion, and neurologic changes transformed the risk pattern?' },
    { id: 'aortic-escalation', objectiveId: 'escalate-suspected-aortic-syndrome', question: 'Why did evolving discordance require immediate aortic-team escalation and protection from an unsupported default pathway?' },
    { id: 'aortic-anti-impulse', objectiveId: 'record-aortic-anti-impulse-intent', question: 'How did analgesia, rate-first anti-impulse intent, pressure control, monitoring, and perfusion guardrails fit together?' },
    { id: 'aortic-imaging-handoff', objectiveId: 'image-and-hand-off-aortic-uncertainty', question: 'Why was urgent definitive imaging appropriate, and what serial change and uncertainty belonged in the handoff?' },
  ] },
};
