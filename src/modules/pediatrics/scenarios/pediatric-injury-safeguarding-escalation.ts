/** Stable pediatric injury presentation requiring qualified safeguarding escalation. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const PEDIATRIC_INJURY_SAFEGUARDING_ESCALATION: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'pediatric-injury-safeguarding-escalation', version: '0.1.0', maturity: 'preview',
    title: 'Pediatric safeguarding concern', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 8, difficulty: 'intermediate', objectives: [
      {
        id: 'reconcile-pediatric-injury-development-history-and-whole-child',
        statement: 'Connect the child’s development, supplied history, injury distribution, immediate safety, physiology, and whole-child state.',
        measure: 'The authored pattern was reconciled without learner examination, interviewing, bruise identification or dating, testing, diagnosis, or credibility judgment.',
      },
      {
        id: 'recognize-pediatric-injury-safeguarding-concern-without-diagnosis',
        statement: 'Recognize a safeguarding concern that requires further evaluation without diagnosing abuse.',
        measure: 'The injury locations and unsuitable explanation triggered qualified escalation without treating a screening pattern as diagnostic or stable physiology as reassurance.',
      },
      {
        id: 'activate-pediatric-injury-qualified-safeguarding-and-immediate-safety-ownership',
        statement: 'Activate qualified pediatric safeguarding and immediate-safety ownership.',
        measure: 'Named ownership followed recognition without learner confrontation, interview, referral submission, reporting-law selection, separation, disposition, or legal action.',
      },
      {
        id: 'review-pediatric-injury-medical-alternatives-and-information-boundary',
        statement: 'Review injury needs, medical alternatives, history limits, information sharing, and the local safeguarding boundary.',
        measure: 'The open differential and information boundary were preserved without learner examination, testing, documentation performance, diagnosis, reporting, or jurisdictional claims.',
      },
      {
        id: 'review-pediatric-injury-later-safety-state',
        statement: 'At the elapsed checkpoint, review the fixed whole-child safety state and continuing qualified work.',
        measure: 'Physiological stability and named ownership were separated from diagnostic closure, exclusion of occult harm, referral completion, discharge readiness, or outcome.',
      },
      {
        id: 'handoff-pediatric-injury-unresolved-safeguarding-risk',
        statement: 'Hand off unresolved injury, medical, information, immediate-safety, and locally governed safeguarding risk.',
        measure: 'The handoff preserved protected ownership without claiming abuse, perpetrator identity, legal reporting, custody action, disposition, prognosis, or outcome.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'National Institute for Health and Care Excellence. Child maltreatment: when to suspect maltreatment in under 18s. Clinical guideline CG89. Published 2009; updated 2025; minor terminology change 2026. Recommendations 1.1.1, 1.1.2, and 1.1.15.',
        'National Institute for Health and Care Excellence. Child abuse and neglect. NICE guideline NG76. Published 2017. Recommendations 1.1, 1.3 response steps, and 1.4.5.',
        'World Health Organization. Responding to child maltreatment: a clinical handbook for health professionals. 2022. ISBN 978-92-4-004873-7.',
        'Pierce MC, Kaczor K, Lorenz DJ, et al. Validation of a Clinical Decision Rule to Predict Abuse in Young Children Based on Bruising Characteristics. JAMA Network Open. 2021;4(4):e215832. doi:10.1001/jamanetworkopen.2021.5832.',
      ],
    },
    limitations: [
      'pediatric-injury-safeguarding-history-injuries-safety-and-later-state-are-authored',
      'pediatric-injury-safeguarding-controls-reconcile-recognize-activate-review-reassess-and-handoff-only',
      'no-live-pediatric-injury-safeguarding-exam-interview-diagnosis-reporting-procedure-disposition-or-outcome',
    ],
  },
  patient: {
    ageYears: 2, sex: 'female', heightCm: 88, weightKg: 12, asaClass: 2,
    diagnosis: 'Authored stable injury presentation with a safeguarding concern and open medical alternatives',
    procedure: 'calm injury-history reconciliation, safeguarding concern recognition, qualified escalation, and protected handoff',
    comorbidities: ['Previously well', 'Reported developmentally typical and independently walking and running'],
    medications: ['None reported'], allergies: ['No known drug allergies'],
    fasting: 'Not relevant to the supplied safeguarding assessment',
    baseline: {
      heartRateBpm: 108, meanArterialMmHg: 72, strokeVolumeMl: 20,
      hemoglobinGPerDl: 12.5, bloodVolumeMl: 960, coreTemperatureC: 36.8,
      arterialStiffness: 0.72, baroreflexGain: 1.02, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Awake, interactive, using age-appropriate speech and play, and breathing spontaneously without an authored airway concern',
    },
    respiratory: { profile: 'healthy-child' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 84, respiratoryRateBpm: 22,
      freshGasFlowLPerMin: 0.5, delivering: false,
    },
  },
  formulary: [],
  timeline: [
    {
      id: 'pediatric-injury-safeguarding-escalation-presentation', type: 'narrative',
      target: 'pediatric-injury-safeguarding-escalation-reassessment', atTick: 0,
      severity: 'warning',
      message: 'A previously well, reportedly developmentally typical and independently walking and running 2-year-old girl weighs 12 kg and measures 88 cm. Her caregiver reports that she tripped forward onto a carpeted level floor about 2 hours ago. A fixed qualified whole-child examination reports that she is awake, interactive, using age-appropriate speech and play, and stays near her caregiver. Temperature is 36.8°C, HR 108/min, RR 22/min, BP 96/60 mmHg (MAP 72), and room-air SpO₂ 99%, with warm normal-volume pulses and refill 2 seconds. A supplied objective skin description records one oval bruise approximately 2 × 1 cm on the posterior left pinna, three separate similarly shaped 1–2 cm bruises clustered over the right lateral torso below the axilla, and two small anterior-shin bruises. No active bleeding, respiratory distress, shock, altered consciousness, vomiting, seizure, focal neurological finding, abdominal distension, or reported loss of consciousness is authored. Bruise age is not inferred from color.',
    },
    {
      id: 'pediatric-injury-safeguarding-escalation-boundary', type: 'narrative',
      target: 'pediatric-injury-safeguarding-escalation-reassessment-boundary', atTick: 0,
      severity: 'warning',
      message: 'A fixed experienced-team statement says the reported single forward carpet fall does not adequately account for the supplied ear and lateral-torso injury distribution. This establishes a safeguarding concern requiring further evaluation, not physical-abuse diagnosis, perpetrator attribution, or a credibility ruling. No reported bleeding disorder, anticoagulant exposure, chronic illness, recent major trauma, or cultural skin practice is authored, but these history snapshots do not exclude a bleeding condition, accidental mechanism, cultural practice, occult injury, history limitation, or another medical or safeguarding explanation. Reconcile development, history, injuries, physiology, immediate safety, and the whole child; recognize concern without diagnosis; activate qualified pediatric safeguarding and immediate-safety ownership; then review injury needs, medical alternatives, information sharing, and the local-pathway boundary. At a strict later report, the child remains awake, interactive, warm, and stable with HR 104/min, RR 22/min, BP 98/62 mmHg (MAP 74), room-air SpO₂ 99%, and temperature 36.8°C in a supervised clinical setting with named pediatric and safeguarding ownership. Qualified teams preserve the supplied histories and objective injury descriptions while injury assessment, medical alternatives, information gathering, immediate safety, other-child risk, and the locally governed multi-agency pathway remain active. Stability does not establish reassurance or discharge readiness. No abuse determination, perpetrator attribution, test result, referral completion, legal report, custody action, disposition, prognosis, or outcome is supplied. The scenario action controls do not examine, interview, identify or date a bruise, photograph, draw a body map, calculate a screening rule, acquire or interpret a test or image, collect clinical or sensitive free text, diagnose abuse, identify a perpetrator, judge credibility, confront or separate a caregiver, submit a referral or report, select a jurisdiction or law, decide custody or disposition, perform a procedure, deliver treatment, predict prognosis, or report outcome. The separate problem-report form accepts an optional bounded note and warns users not to include patient names or real clinical information.',
    },
  ],
  debrief: { rubric: [
    { id: 'pediatric-injury-safeguarding-reconcile', objectiveId: 'reconcile-pediatric-injury-development-history-and-whole-child', question: 'Which supplied developmental, history, injury, immediate-safety, physiological, and whole-child facts required reconciliation?' },
    { id: 'pediatric-injury-safeguarding-recognition', objectiveId: 'recognize-pediatric-injury-safeguarding-concern-without-diagnosis', question: 'Why did the supplied pattern require further evaluation without establishing abuse?' },
    { id: 'pediatric-injury-safeguarding-ownership', objectiveId: 'activate-pediatric-injury-qualified-safeguarding-and-immediate-safety-ownership', question: 'How was qualified safeguarding and immediate-safety ownership activated without confrontation, reporting, or disposition controls?' },
    { id: 'pediatric-injury-safeguarding-alternatives', objectiveId: 'review-pediatric-injury-medical-alternatives-and-information-boundary', question: 'Which injury, medical-alternative, history-limit, information-sharing, and local-pathway work remained open?' },
    { id: 'pediatric-injury-safeguarding-later', objectiveId: 'review-pediatric-injury-later-safety-state', question: 'What did the fixed later safety state establish, and what did stable physiology not prove?' },
    { id: 'pediatric-injury-safeguarding-handoff', objectiveId: 'handoff-pediatric-injury-unresolved-safeguarding-risk', question: 'Which unresolved injury, medical, information, safety, local-pathway, and outcome risks required protected handoff?' },
  ] },
};
