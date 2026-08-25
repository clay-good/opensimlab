/** Stable longitudinal symptomatic sinus-bradycardia evaluation. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const SYMPTOMATIC_SINUS_BRADYCARDIA_REASSESSMENT: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'symptomatic-sinus-bradycardia-reassessment', version: '0.1.0', maturity: 'draft',
    title: 'Symptomatic bradycardia', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 8, difficulty: 'intermediate', objectives: [
      { id: 'reconcile-symptomatic-bradycardia-stability', statement: 'Reconcile the sinus bradycardia, pulse, chronic symptoms, and present whole-patient stability without using rate alone.', measure: 'Chronic symptom burden remained distinct from acute cardiopulmonary compromise and its change triggers.' },
      { id: 'review-symptomatic-bradycardia-context', statement: 'Review medication, endocrine, metabolic, sleep, ischemic, infectious, structural, and physiologic context without inventing a cause.', measure: 'Potentially reversible and required-therapy context remained patient-specific and no medication was reflexively stopped.' },
      { id: 'correlate-symptomatic-bradycardia-record', statement: 'Review the fixed ambulatory report and diary for temporal symptom-rhythm correlation and important excluded rhythms.', measure: 'Correlation mattered without creating a universal rate or pause threshold or diagnosing sinus-node dysfunction from the teaching waveform.' },
      { id: 'record-symptomatic-bradycardia-pacing-evaluation', statement: 'After both review lanes, record individualized cardiology/electrophysiology pacing-evaluation and shared-decision intent.', measure: 'The referral did not select a device, procedure, program, eligibility conclusion, guaranteed benefit, or outcome.' },
      { id: 'handoff-symptomatic-bradycardia-plan', statement: 'Record symptom tracking, acute-change safety net, owner, and locally determined follow-up.', measure: 'Current rhythm and unresolved symptom, cause, preference, and device questions stayed visible at handoff.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0', sources: [
        'Kusumoto FM, Schoenfeld MH, Barrett C, et al. 2018 ACC/AHA/HRS Guideline on the Evaluation and Management of Patients With Bradycardia and Cardiac Conduction Delay. Circulation. 2019;140:e382-e482.',
        'American Heart Association. Adult Bradycardia With a Pulse Algorithm. 2025.',
      ] },
    limitations: ['symptomatic-sinus-bradycardia-record-context-and-correlation-are-authored',
      'symptomatic-sinus-bradycardia-controls-record-review-referral-and-handoff-only',
      'no-live-bradycardia-diagnosis-medication-change-pacing-procedure-or-outcome'],
  },
  patient: { ageYears: 69, sex: 'female', heightCm: 165, weightKg: 70, asaClass: 2,
    diagnosis: 'Authored stable symptomatic sinus bradycardia; mechanism and cause remain open',
    procedure: 'Longitudinal symptom-rhythm correlation and shared plan',
    comorbidities: ['Hypertension'], medications: ['Metoprolol; indication and continued need require prescriber review'],
    allergies: ['No known drug allergies'], fasting: 'Outpatient rhythm follow-up; not relevant to this lesson',
    baseline: { heartRateBpm: 44, meanArterialMmHg: 93, strokeVolumeMl: 70,
      hemoglobinGPerDl: 13.1, bloodVolumeMl: 4600, coreTemperatureC: 36.7,
      arterialStiffness: 1.15, baroreflexGain: 0.85, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Alert, speaking comfortably, with a palpable regular pulse' },
    respiratory: { profile: 'healthy' } },
  equipment: { monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'],
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 450,
      respiratoryRateBpm: 16, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'symptomatic-sinus-bradycardia-rhythm', type: 'rhythm-change', target: 'sinus-bradycardia',
      atTick: 0, severity: 'advisory', message: 'The teaching monitor shows sinus bradycardia with a mechanical pulse.' },
    { id: 'symptomatic-sinus-bradycardia-presentation', type: 'narrative',
      target: 'symptomatic-sinus-bradycardia-reassessment', atTick: 0, severity: 'advisory',
      message: 'At a return cardiology rhythm visit, a 69-year-old woman reports 3 weeks of fatigue and exertional lightheadedness without syncope, rest symptoms, chest discomfort, dyspnea, or acute heart failure. A fixed 12-lead report describes sinus bradycardia 44/min, PR 178 ms, QRS 88 ms, and no AV block or acute ischemic pattern. BP is 134/72 mmHg, SpO₂ 98% on room air, RR 16/min, and she is alert, warm, and has a palpable pulse without authored hypotension, altered mentation, shock, ischemic discomfort, or acute heart failure.' },
    { id: 'symptomatic-sinus-bradycardia-boundary', type: 'narrative',
      target: 'symptomatic-sinus-bradycardia-reassessment-boundary', atTick: 0, severity: 'advisory',
      message: 'The fixed return-visit record already includes a completed ambulatory patch and symptom diary: typical lightheadedness repeatedly coincides with sinus rates 38-44/min, without high-grade AV block, long pause, atrial fibrillation, or ventricular arrhythmia. Temperature, potassium, magnesium, TSH, hemoglobin, infection, sleep, ischemic, physiologic, structural, and medication context remain authored review facts, not a diagnosed cause. Reversible-context review and correlation may occur in either order; both precede shared pacing-evaluation intent, symptom tracking, acute-change triggers, owner, and follow-up. No minimum heart rate or pause alone mandates pacing. Examination, ECG or monitor acquisition or interpretation, diagnosis, medication adjustment, atropine, oxygen, infusion, acute pacing, pacemaker eligibility or selection, implantation or programming, procedure, disposition, prognosis, recurrence, and outcome are not simulated.' },
  ],
  debrief: { rubric: [
    { id: 'symptomatic-bradycardia-stability', objectiveId: 'reconcile-symptomatic-bradycardia-stability', question: 'Which fixed findings made this symptomatic rhythm stable now, and which changes would open the emergency pathway?' },
    { id: 'symptomatic-bradycardia-context', objectiveId: 'review-symptomatic-bradycardia-context', question: 'Which reversible, physiologic, and medication considerations remained open?' },
    { id: 'symptomatic-bradycardia-correlation', objectiveId: 'correlate-symptomatic-bradycardia-record', question: 'What did the fixed symptom-rhythm record support, and what did it not prove?' },
    { id: 'symptomatic-bradycardia-pacing', objectiveId: 'record-symptomatic-bradycardia-pacing-evaluation', question: 'Why was shared pacing evaluation appropriate without using a rate threshold or choosing a device?' },
    { id: 'symptomatic-bradycardia-handoff', objectiveId: 'handoff-symptomatic-bradycardia-plan', question: 'Which symptoms, urgent changes, unresolved questions, owner, and follow-up remained visible?' },
  ] },
};
