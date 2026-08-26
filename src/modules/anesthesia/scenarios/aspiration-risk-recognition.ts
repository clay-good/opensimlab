/** Bounded day-of-procedure recognition of elevated aspiration risk. */

import type { Scenario } from './types';

export const ASPIRATION_RISK_RECOGNITION: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'aspiration-risk-recognition',
    version: '0.1.0',
    maturity: 'preview',
    title: 'Aspiration-risk recognition',
    author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0',
    estimatedMinutes: 6,
    difficulty: 'intermediate',
    objectives: [
      {
        id: 'review-aspiration-risk-cues',
        statement: 'Review medication phase, gastrointestinal symptoms, fasting, and procedure urgency together.',
        measure: 'The focused aspiration-risk cue review was accepted before classification.',
      },
      {
        id: 'classify-elevated-aspiration-risk',
        statement: 'Recognize elevated delayed-gastric-emptying risk despite an ordinary fasting interval.',
        measure: 'The case was classified as elevated risk after the cue review.',
      },
      {
        id: 'choose-shared-elective-plan',
        statement: 'Defer this elective case for symptom resolution and shared replanning.',
        measure: 'The defer-and-replan pathway was selected after elevated-risk classification.',
      },
      {
        id: 'avoid-blanket-glp1-rule',
        statement: 'Use the patient-specific risk pattern rather than a blanket GLP-1 medication rule.',
        measure: 'The accepted reasoning named escalation and symptoms without claiming every GLP-1 user should stop treatment or cancel surgery.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0',
      sources: [
        'Kindel et al. Multi-society clinical practice guidance for the safe use of GLP-1 receptor agonists in the perioperative period. Surg Endosc. 2025;39:180-183.',
        'American Society of Anesthesiologists. New Multi-Society GLP-1 Clinical Practice Guidance Released. October 29, 2024.',
        'ASA Practice Guidelines for Preoperative Fasting. Anesthesiology. 2017;126:376-393.',
      ],
    },
    limitations: [
      'aspiration-risk-choice-is-a-bounded-vignette',
      'no-gastric-content-or-aspiration-physiology',
      'no-ultrasound-or-airway-technique-instruction',
      'no-team-or-communication',
    ],
  },
  patient: {
    ageYears: 52, sex: 'female', heightCm: 167, weightKg: 92, asaClass: 2,
    diagnosis: 'Symptomatic cholelithiasis', procedure: 'Elective laparoscopic cholecystectomy',
    comorbidities: ['Obesity without diagnosed diabetes'],
    medications: ['Weekly semaglutide for weight management; dose increased three days ago in week 3 of escalation'],
    allergies: ['None known'],
    fasting: 'No solids for 10 hours; clear water stopped 2 hours ago',
    baseline: {
      heartRateBpm: 78, meanArterialMmHg: 92, strokeVolumeMl: 70,
      hemoglobinGPerDl: 13.2, bloodVolumeMl: 5000, coreTemperatureC: 36.7,
      arterialStiffness: 1.05, baroreflexGain: 0.9, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.18, difficultMaskVentilation: false,
      assessment: 'Mallampati II, good mouth opening, full neck movement',
    },
    respiratory: { profile: 'healthy' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'pulse-oximetry'],
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 480,
      respiratoryRateBpm: 12, delivering: false,
    },
  },
  formulary: [],
  timeline: [
    {
      id: 'aspiration-risk-briefing', type: 'narrative', target: 'aspiration-risk-recognition',
      atTick: 0, severity: 'advisory',
      message: 'During the day-of-procedure review, the patient reports nausea and abdominal bloating since a semaglutide dose increase three days ago. She is in week 3 of dose escalation and has followed the ordinary fasting instructions. The operation is elective. Review the combined risk pattern and choose a disposition; no gastric contents, regurgitation, aspiration, ultrasound, or airway technique are simulated.',
    },
  ],
  debrief: { rubric: [
    {
      id: 'aspiration-cue-review', objectiveId: 'review-aspiration-risk-cues',
      question: 'Which medication-phase, symptom, fasting, and urgency cues changed the assessment?',
    },
    {
      id: 'aspiration-classification', objectiveId: 'classify-elevated-aspiration-risk',
      question: 'Why did the ordinary fasting interval not settle the risk question in this patient?',
    },
    {
      id: 'aspiration-plan', objectiveId: 'choose-shared-elective-plan',
      question: 'Which disposition did you choose, and what needs shared replanning before a later procedure?',
    },
    {
      id: 'aspiration-no-blanket-rule', objectiveId: 'avoid-blanket-glp1-rule',
      question: 'How does this patient-specific decision differ from automatically stopping treatment or canceling every GLP-1 case?',
    },
  ] },
};
