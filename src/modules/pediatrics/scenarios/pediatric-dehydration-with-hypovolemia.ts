/** Pediatric dehydration and hypovolemia recognition after acute gastrointestinal losses. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const PEDIATRIC_DEHYDRATION_WITH_HYPOVOLEMIA: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'pediatric-dehydration-with-hypovolemia', version: '0.1.0', maturity: 'preview',
    title: 'Pediatric dehydration with hypovolemia', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 8, difficulty: 'intermediate', objectives: [
      {
        id: 'reconcile-pediatric-dehydration-losses-and-perfusion',
        statement: 'Connect the supplied intake, gastrointestinal losses, weight history, urine, mentation, and whole-child trajectory.',
        measure: 'The authored whole-child trajectory was reconciled without learner examination, weighing, calculation, testing, diagnosis, or treatment delivery.',
      },
      {
        id: 'recognize-pediatric-dehydration-with-hypovolemia',
        statement: 'Recognize clinical dehydration with compensated hypovolemia without relying on one sign or a calculated percentage.',
        measure: 'The supplied classification and no-shock boundary were reviewed without learner scoring, percentage calculation, or a claim of impaired perfusion.',
      },
      {
        id: 'activate-pediatric-dehydration-qualified-rehydration-ownership',
        statement: 'Activate experienced rehydration, electrolyte, glucose, access, monitoring, and reassessment ownership.',
        measure: 'Qualified support was activated without learner fluid, route, solution, volume, rate, access, device, or replacement selection.',
      },
      {
        id: 'review-pediatric-dehydration-ongoing-losses-and-safety',
        statement: 'Review ongoing losses, oral tolerance, alternative serious causes, and recurrence or escalation triggers in parallel.',
        measure: 'Active safety work continued without learner testing, diagnosis, prescribing, treatment, or disposition decisions.',
      },
      {
        id: 'review-pediatric-dehydration-later-response',
        statement: 'After elapsed qualified care, review the fixed whole-child response without declaring rehydration complete.',
        measure: 'Partial improvement was separated from low urine output, ongoing losses, incomplete oral tolerance, and durable recovery.',
      },
      {
        id: 'handoff-pediatric-dehydration-active-risk',
        statement: 'Hand off hydration signs, intake, output, ongoing losses, oral tolerance, laboratory review, caregiver context, and named owners.',
        measure: 'The handoff preserved active work without claiming deficit correction, discharge readiness, prognosis, or outcome.',
      },
    ],
    clinicalReview: {
      reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'World Health Organization. Guideline on management of pneumonia and diarrhoea in children up to 10 years of age. WHO. 2024. ISBN 978-92-4-010341-2.',
        'National Institute for Health and Care Excellence. Intravenous fluid therapy in children and young people in hospital. NICE guideline NG29. Published 2015; last updated 2020; fluid-bolus wording amended October 2022. Recommendations 1.3.1-1.3.5.',
        'National Institute for Health and Care Excellence. Diarrhoea and vomiting caused by gastroenteritis in under 5s: diagnosis and management. Clinical guideline CG84. Published 2009; fluid-bolus wording amended October 2022. Recommendations 1.2, 1.3, and 1.7.',
      ],
    },
    limitations: [
      'pediatric-dehydration-losses-perfusion-care-and-response-are-authored',
      'pediatric-dehydration-controls-reconcile-recognize-coordinate-review-reassess-and-handoff-only',
      'no-live-pediatric-dehydration-exam-calculation-test-fluid-device-treatment-or-disposition',
    ],
  },
  patient: {
    ageYears: 2, sex: 'female', heightCm: 88, weightKg: 12, asaClass: 3,
    diagnosis: 'Authored acute gastrointestinal losses with clinical dehydration and hypovolemia',
    procedure: 'calm pediatric dehydration and hypovolemia recognition, qualified rehydration coordination, serial reassessment, and active-risk handoff',
    comorbidities: ['Previously well'], medications: ['None reported'],
    allergies: ['No known drug allergies'], fasting: 'Minimal intake with vomiting and diarrhea during this illness',
    baseline: {
      heartRateBpm: 138, meanArterialMmHg: 67, strokeVolumeMl: 20,
      hemoglobinGPerDl: 12.8, bloodVolumeMl: 960, coreTemperatureC: 37.8,
      arterialStiffness: 0.72, baroreflexGain: 1.02, fixedStrokeVolume: false,
    },
    airway: {
      difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Tired and irritable but rousable, speaking briefly, with spontaneous breathing',
    },
    respiratory: { profile: 'healthy-child' },
  },
  equipment: {
    monitoring: ['ecg', 'nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: {
      mode: 'manual', fio2: 0.21, tidalVolumeMl: 84, respiratoryRateBpm: 34,
      freshGasFlowLPerMin: 0.5, delivering: false,
    },
  },
  formulary: [],
  timeline: [
    {
      id: 'pediatric-dehydration-presentation', type: 'narrative',
      target: 'pediatric-dehydration-with-hypovolemia-reassessment', atTick: 0, severity: 'warning',
      message: 'A previously well 2-year-old girl weighing 12 kg has 3 days of non-bloody watery diarrhea, repeated vomiting, minimal intake, and one reported urine in 12 hours. Her caregiver and a reliable same-scale clinic record report a weight of 12.6 kg 1 week ago, but weight change is context rather than a stand-alone dehydration or intravascular-deficit calculation. She is irritable but consolable and interactive, with dry mucosa, no tears, mildly sunken eyes, reduced skin turgor, temperature 37.6°C, HR 138/min, RR 28/min, BP 90/56 mmHg (MAP 67), clean pulse-coherent room-air SpO2 99%, warm extremities, normal-volume pulses, and capillary refill 2 seconds.',
    },
    {
      id: 'pediatric-dehydration-qualified-record', type: 'narrative',
      target: 'pediatric-dehydration-with-hypovolemia-reassessment', atTick: 0, severity: 'warning',
      message: 'A supplied experienced-team assessment classifies clinical dehydration with compensated volume depletion and no current shock: consciousness, extremity temperature, pulse volume, refill, and blood pressure are preserved. No fever, blood or mucus in stool, bilious emesis, focal severe abdominal finding, distension, bleeding, diabetes history, respiratory failure, or infection-associated organ dysfunction is authored, but these are fixed snapshots and alternative serious causes remain under qualified review. An experienced pediatric team is available and prepared to own locally protocolized oral rehydration in small frequent amounts, breastfeeding and phase-appropriate feeding context, tolerance and loss monitoring, glucose and electrolyte assessment when indicated, and escalation of route or support if the child deteriorates or cannot tolerate rehydration. The learner does not select or deliver them.',
    },
    {
      id: 'pediatric-dehydration-boundary', type: 'narrative',
      target: 'pediatric-dehydration-with-hypovolemia-reassessment-boundary', atTick: 0, severity: 'warning',
      message: 'Reconcile the supplied losses and whole-child trajectory, recognize compensated dehydration with hypovolemia and no current shock, and keep qualified rehydration ownership active in parallel with ongoing-loss and safety review before a strictly later report and handoff. The controls do not examine, weigh, calculate a dehydration percentage or deficit, diagnose gastroenteritis or another cause, acquire or interpret a glucose, electrolyte, renal, acid-base, urine, stool, culture, or imaging test, choose or deliver oral, nasogastric, intraosseous, or intravenous fluid, a solution, route, bolus, volume, rate, electrolyte, glucose, access, device, drug, feeding plan, procedure, or treatment, determine disposition or prognosis, or predict deficit correction, recovery, recurrence, or outcome.',
    },
  ],
  debrief: { rubric: [
    { id: 'pediatric-dehydration-trajectory', objectiveId: 'reconcile-pediatric-dehydration-losses-and-perfusion', question: 'Which supplied intake, loss, weight, urine, mentation, and hydration facts established the whole-child trajectory?' },
    { id: 'pediatric-dehydration-recognition', objectiveId: 'recognize-pediatric-dehydration-with-hypovolemia', question: 'Why did the fixed pattern support compensated dehydration with hypovolemia without relying on one sign or percentage, and which findings argued against current shock?' },
    { id: 'pediatric-dehydration-rehydration', objectiveId: 'activate-pediatric-dehydration-qualified-rehydration-ownership', question: 'How was qualified rehydration and monitoring ownership activated without selecting a fluid, route, volume, rate, or replacement?' },
    { id: 'pediatric-dehydration-safety', objectiveId: 'review-pediatric-dehydration-ongoing-losses-and-safety', question: 'Which ongoing losses, oral tolerance, alternative causes, and recurrence or escalation triggers remained active?' },
    { id: 'pediatric-dehydration-later', objectiveId: 'review-pediatric-dehydration-later-response', question: 'What improved in the fixed later report, and which findings kept rehydration and safety work open?' },
    { id: 'pediatric-dehydration-handoff', objectiveId: 'handoff-pediatric-dehydration-active-risk', question: 'Which hydration, intake, output, loss, oral-tolerance, laboratory, caregiver, and ownership work required handoff?' },
  ] },
};
