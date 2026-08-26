/** Bounded adult major-trauma <C>ABCDE primary-survey and reassessment pathway. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const TRAUMA_PRIMARY_SURVEY: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'trauma-primary-survey', version: '0.1.0', maturity: 'preview',
    title: 'Trauma primary survey', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 9, difficulty: 'intermediate', objectives: [
      { id: 'activate-structured-trauma-response', statement: 'Receive the fixed trauma handoff, activate the trauma and hemorrhage response, and commit to a repeated <C>ABCDE survey.', measure: 'Mechanism, time, injuries, signs, prior treatment, team readiness, and the ordered survey were integrated.' },
      { id: 'control-catastrophic-trauma-hemorrhage', statement: 'Control the life-threatening limb hemorrhage after failed direct pressure with local-protocol tourniquet intent and record its time.', measure: 'Catastrophic hemorrhage control preceded the remaining primary survey.' },
      { id: 'assess-trauma-airway-and-breathing', statement: 'Review airway with spinal-motion precautions and breathing for immediate chest threats without assuming current stability will persist.', measure: 'The fixed patent-airway and bilateral-breathing panel was reviewed after hemorrhage control.' },
      { id: 'manage-trauma-circulation', statement: 'Recognize persistent hemorrhagic shock, stabilize the suspected pelvic source, activate blood-based resuscitation and early antifibrinolytic intent, and minimize imaging delay to definitive control.', measure: 'The bounded circulation and definitive-control plan followed A and B review.' },
      { id: 'complete-and-repeat-trauma-survey', statement: 'Review disability, glucose, full exposure, posterior surfaces, and heat-loss prevention, then repeat <C>ABCDE and hand off change over time.', measure: 'The survey closed with authored reassessment and did not stop at the first injury.' },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'National Institute for Health and Care Excellence. Major trauma: assessment and initial management. NICE guideline NG39. 2016; current online guidance.',
        'Resuscitation Council UK. 2025 Resuscitation Guidelines: First Aid Guidelines. 2025.',
      ],
    },
    limitations: ['trauma-findings-interventions-and-reassessment-are-authored',
      'trauma-survey-hemorrhage-airway-pelvis-imaging-and-handoff-controls-are-proxies',
      'no-live-trauma-exam-procedure-blood-imaging-definitive-control-transfer-or-outcome'],
  },
  patient: {
    ageYears: 42, sex: 'male', heightCm: 180, weightKg: 86, asaClass: 4,
    diagnosis: 'Major blunt trauma with catastrophic limb hemorrhage and suspected pelvic bleeding',
    procedure: 'Structured <C>ABCDE primary survey, immediate threat control, and reassessment',
    comorbidities: ['No known chronic illness'], medications: ['None reported'],
    allergies: ['Not established'], fasting: 'Not established after motorcycle collision',
    baseline: { heartRateBpm: 128, meanArterialMmHg: 65, strokeVolumeMl: 44,
      hemoglobinGPerDl: 11.1, bloodVolumeMl: 3900, coreTemperatureC: 35.6,
      arterialStiffness: 1.1, baroreflexGain: 1.0, fixedStrokeVolume: false },
    airway: { difficulty: 0.2, difficultMaskVentilation: false,
      assessment: 'Speaking in short coherent sentences with midline neck pain; airway currently patent' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'],
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 500,
      respiratoryRateBpm: 26, freshGasFlowLPerMin: 10, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'trauma-primary-survey-presentation', type: 'narrative', target: 'trauma-primary-survey', atTick: 0,
      severity: 'critical', message: 'A 42-year-old arrives 35 minutes after a high-speed motorcycle collision. Direct pressure has failed to control pulsatile bleeding from a mangled left lower leg. He speaks in short coherent sentences with midline neck pain; RR is 26/min, SpO₂ 94% on room air, and bilateral breath sounds are authored as present without severe respiratory compromise. HR is 128/min, BP 86/54 mmHg, skin is cool, and the pelvis is authored as mechanically unstable. He is confused but follows commands; pupils are equal and glucose is 118 mg/dL. Core temperature is 35.6°C. No arrest or immediate tension-pneumothorax pattern is authored.' },
    { id: 'trauma-primary-survey-boundary', type: 'narrative', target: 'trauma-primary-survey-boundary', atTick: 0,
      severity: 'warning', message: 'Receive the structured handoff and activate trauma plus major-hemorrhage response; control catastrophic limb hemorrhage first after failed direct pressure with local-protocol tourniquet intent and record time; review airway with in-line spinal-motion precautions and breathing for immediate threats; then address persistent circulation failure with pelvic-stabilization, blood-component, early tranexamic-acid, minimum-needed imaging, and definitive-control intent. Review disability and glucose, expose fully including posterior surfaces, minimize heat loss, then repeat <C>ABCDE after interventions and hand off change over time. Examination, spinal stabilization, pressure or tourniquet technique, oxygen, access, blood or drug selection and delivery, pelvic binder, imaging, procedures, transport, disposition, and outcome are not simulated.' },
  ],
  debrief: { rubric: [
    { id: 'trauma-activation', objectiveId: 'activate-structured-trauma-response', question: 'Which handoff elements activated the team, and why did the survey need a fixed order plus repetition?' },
    { id: 'trauma-catastrophic-hemorrhage', objectiveId: 'control-catastrophic-trauma-hemorrhage', question: 'Why did the limb bleed precede airway review, and what made tourniquet intent appropriate after direct pressure failed?' },
    { id: 'trauma-airway-breathing', objectiveId: 'assess-trauma-airway-and-breathing', question: 'Which fixed A and B findings were reassuring now, and why could they not be skipped later?' },
    { id: 'trauma-circulation', objectiveId: 'manage-trauma-circulation', question: 'Which findings suggested more than the visible bleed, and how did resuscitation, minimal imaging, and definitive control fit together?' },
    { id: 'trauma-repeat', objectiveId: 'complete-and-repeat-trauma-survey', question: 'What belonged in D and E, what prevented heat loss, and which changes mattered on the repeated survey?' },
  ] },
};
