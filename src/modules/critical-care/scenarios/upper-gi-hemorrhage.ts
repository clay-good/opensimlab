/** Bounded recurrent nonvariceal upper-GI-hemorrhage response. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const UPPER_GI_HEMORRHAGE: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'upper-gi-hemorrhage', version: '0.1.0', maturity: 'preview',
    title: 'Upper GI hemorrhage', author: 'Open Sim Lab', license: 'CC BY-SA 4.0',
    estimatedMinutes: 8, difficulty: 'advanced', objectives: [
      { id: 'recognize-recurrent-upper-gi-hemorrhage', statement: 'Recognize recurrent upper GI bleeding and activate experienced help.', measure: 'The fixed rebleeding and shock pattern prompted GI, hemorrhage, and critical-care escalation.' },
      { id: 'review-upper-gi-hemorrhage-pattern', statement: 'Integrate fixed bleeding, perfusion, airway, medication, and alternate-source findings without relying on hemoglobin alone.', measure: 'The panel supported recurrent nonvariceal bleeding while keeping airway and other sources visible.' },
      { id: 'record-upper-gi-hemorrhage-resuscitation', statement: 'Record individualized hemodynamic, access, laboratory, blood-bank, and transfusion review without a universal threshold.', measure: 'The bridge linked transfusion to the whole patient rather than one isolated number.' },
      { id: 'activate-repeat-endoscopy-pathway', statement: 'Activate repeat endoscopy for recurrent ulcer bleeding and preserve embolization and surgical escalation after failure.', measure: 'Definitive hemostasis pathways proceeded alongside resuscitation rather than waiting for normalization.' },
      { id: 'reassess-upper-gi-hemorrhage-trajectory', statement: 'Reassess perfusion and recurrent bleeding after the authored bridge without claiming hemostasis or outcome.', measure: 'Immediate physiology improved while source control and serial organ trajectory remained open.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01',
      contentVersion: '0.1.0', sources: [
        'Laine L, Barkun AN, Saltzman JR, et al. ACG Clinical Guideline: Upper Gastrointestinal and Ulcer Bleeding. Am J Gastroenterol. 2021;116:899-917.',
        'Gralnek IM, Stanley AJ, Morris AJ, et al. Endoscopic diagnosis and management of nonvariceal upper gastrointestinal hemorrhage: ESGE Guideline Update 2021. Endoscopy. 2021;53:300-332.',
        'Monnet X, Messina A, Greco M, et al. ESICM guidelines on circulatory shock and hemodynamic monitoring 2025. Intensive Care Med. 2025;51:1971-2012.',
      ] },
    limitations: ['upper-gi-hemorrhage-findings-and-response-are-authored',
      'upper-gi-hemorrhage-resuscitation-and-hemostasis-actions-are-proxies',
      'no-live-upper-gi-hemorrhage-diagnosis-transfusion-procedure-or-outcome'],
  },
  patient: { ageYears: 68, sex: 'female', heightCm: 165, weightKg: 72, asaClass: 4,
    diagnosis: 'Recurrent nonvariceal upper gastrointestinal hemorrhage after endoscopic hemostasis',
    procedure: 'Recurrent upper GI hemorrhage rescue',
    comorbidities: ['Hypertension', 'Peptic ulcer disease'],
    medications: ['Proton-pump inhibitor therapy reported; delivery not modeled'],
    allergies: ['No known drug allergies'], fasting: 'ICU patient; oral intake held and aspiration state not modeled',
    baseline: { heartRateBpm: 122, meanArterialMmHg: 55, strokeVolumeMl: 34,
      hemoglobinGPerDl: 6.8, bloodVolumeMl: 3500, coreTemperatureC: 36.1,
      arterialStiffness: 1.1, baroreflexGain: 1.1, fixedStrokeVolume: false },
    airway: { difficulty: 0.25, difficultMaskVentilation: false,
      assessment: 'Awake, speaking briefly, with suction available; active hematemesis and airway procedures are not simulated' },
    respiratory: { profile: 'moderately-ill' } },
  equipment: { monitoring: ['ecg', 'arterial-line', 'pulse-oximetry', 'temperature'],
    airwayDevice: 'facemask', ventilator: { mode: 'manual', fio2: 0.3,
      tidalVolumeMl: 450, respiratoryRateBpm: 24, freshGasFlowLPerMin: 6, delivering: false } },
  formulary: [],
  timeline: [
    { id: 'upper-gi-hemorrhage-presentation', type: 'narrative', target: 'upper-gi-hemorrhage',
      atTick: 0, severity: 'critical', message: 'A 68-year-old woman in the ICU after successful endoscopic therapy for a bleeding duodenal ulcer develops 2 new episodes of hematemesis and melena. MAP is 55 mmHg, HR 122/min, capillary refill 5 seconds, extremities are cool, urine output is 10 mL/h, and lactate rose from 2.1 to 4.6 mmol/L. Hemoglobin is 6.8 g/dL, down from 8.4 g/dL. No definitive hemostasis response has been recorded.' },
    { id: 'upper-gi-hemorrhage-boundary', type: 'narrative', target: 'upper-gi-hemorrhage-boundary',
      atTick: 0, severity: 'warning', message: 'Fixed review reports recurrent hematemesis and melena after prior duodenal-ulcer hemostasis, a soft nontender abdomen, no cirrhosis or known varices, no external bleeding, and no chest-pain or focal-neurologic pattern. Activate GI, hemorrhage, critical-care, and blood-bank help. Reassess airway protection and perfusion; review access, serial blood count, coagulation, fibrinogen, chemistry, lactate, type and crossmatch, medications, and comorbidity. Record an individualized resuscitation and restrictive-transfusion strategy without treating 7 g/dL as a universal trigger. Activate repeat endoscopy for recurrent ulcer bleeding; if endoscopic hemostasis fails, preserve transcatheter embolization and surgical pathways. Examination, monitoring, specimen or test acquisition or interpretation, diagnosis, oxygen, fluid, blood-product or drug delivery, access, dosing, airway management, endoscopy, embolization, surgery, transfer, disposition, and outcome are not simulated.' },
  ],
  debrief: { rubric: [
    { id: 'upper-gi-hemorrhage-recognition', objectiveId: 'recognize-recurrent-upper-gi-hemorrhage', question: 'Which bleeding and perfusion trends made recurrent hemorrhage time critical?' },
    { id: 'upper-gi-hemorrhage-pattern', objectiveId: 'review-upper-gi-hemorrhage-pattern', question: 'How did the fixed source, airway, medication, perfusion, and alternate-source findings shape the response?' },
    { id: 'upper-gi-hemorrhage-resuscitation', objectiveId: 'record-upper-gi-hemorrhage-resuscitation', question: 'Why was the transfusion and resuscitation plan individualized beyond one hemoglobin value?' },
    { id: 'upper-gi-hemorrhage-hemostasis', objectiveId: 'activate-repeat-endoscopy-pathway', question: 'Why did repeat endoscopy and failure pathways proceed alongside resuscitation?' },
    { id: 'upper-gi-hemorrhage-response', objectiveId: 'reassess-upper-gi-hemorrhage-trajectory', question: 'What improved after the authored bridge, and what remained unresolved?' },
  ] },
};
