/** A definition met by the blood results and not by the patient, and the window between them. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const LABORATORY_TLS_A_SYNDROME_HE_DOES_NOT_HAVE_YET: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'laboratory-tls-a-syndrome-he-does-not-have-yet', version: '0.1.0', maturity: 'preview',
    title: 'A syndrome he does not have yet', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 9, difficulty: 'intermediate', objectives: [
      { id: 'recognize-oncology-laboratory-tls-which-definition-is-met', statement: 'Record which definition is met and which is not.', measure: 'The laboratory criteria were recorded as met and the clinical criteria as not met, with the difference stated: the clinical definition requires the laboratory picture plus a consequence, and writing "tumour lysis syndrome" without the qualifier loses what the next reader needs.' },
      { id: 'record-oncology-laboratory-tls-what-crossed-and-when', statement: 'Record what crossed and how long after treatment.', measure: 'The rise in phosphate, potassium and urate with the fall in corrected calcium was recorded at 18 hours after the first cycle, against the described interval of 6 to 24 hours for laboratory changes and 48 to 72 hours for the first clinical signs.' },
      { id: 'record-oncology-laboratory-tls-the-crossing-risk', statement: 'Record what raises the risk of crossing over.', measure: 'Bulky high-grade disease, a high pre-treatment urate, and normal pre-treatment renal function were recorded as the factors the next reader will weigh, with pre-treatment renal impairment named as the factor the defining series associated with clinical tumour lysis.' },
      { id: 'activate-oncology-laboratory-tls-a-trajectory-not-an-alarm', statement: 'Report a trajectory to the team that owns the treatment.', measure: 'The treating haematology team was contacted with both halves of the picture stated together, and dismissing it as numbers, calling it tumour lysis and moving him to intensive care, waiting for the next set, and correcting the potassium and standing down were each refused.' },
      { id: 'record-oncology-laboratory-tls-bounded-qualified-intent', statement: 'Record bounded qualified-team monitoring and treatment intent.', measure: 'Hydration, hypouricaemic treatment, monitoring frequency, electrolyte management, and any renal referral were recorded as the qualified team’s decisions, and no drug, dose, route, fluid rate, or threshold was chosen or displayed.' },
      { id: 'review-oncology-laboratory-tls-boundaries-and-their-certainty', statement: 'Review the boundaries and their certainty.', measure: 'That the published rates disagree — 42 percent laboratory and 6 percent clinical in the defining 102-patient series, and hyperuricaemia in 18.9 percent of 788 European patients with 27.8 percent of those meeting tumour-lysis criteria — that a 2024 review restated the second as a laboratory rate of 18.9 percent which is not what it measured, and that none of the figures is a probability for this patient, were all kept explicit.' },
      { id: 'handoff-oncology-laboratory-tls-a-window-not-an-event', statement: 'Hand off a window rather than an event.', measure: 'The handoff preserved which definition is met, what crossed and when, the pre-treatment renal function, the bounded intent, and what the treating team asked to be told about, with no clinical tumour lysis, treatment effect, or outcome certified.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0', sources: [
        'Hande KR, Garrow GC. Acute tumor lysis syndrome in patients with high-grade non-Hodgkin’s lymphoma. Am J Med. 1993;94(2):133-139. 102 patients receiving combination chemotherapy. "Laboratory tumor lysis" defined as two of a 25% rise in serum phosphate, potassium, uric acid or urea nitrogen, or a 25% fall in calcium, within 4 days of treatment. "Clinical tumor lysis" defined as laboratory tumor lysis plus one of potassium above 6 mmol/L, creatinine above 221 micromol/L, calcium below 1.5 mmol/L, a life-threatening arrhythmia, or sudden death. Laboratory tumor lysis occurred in 42% and clinical in 6%; clinical tumor lysis occurred more frequently in patients with pretreatment renal insufficiency.',
        'Annemans L, Moeremans K, Lamotte M, et al. Incidence, medical resource utilisation and costs of hyperuricemia and tumour lysis syndrome in patients with acute leukaemia and non-Hodgkin’s lymphoma in four European countries. Leuk Lymphoma. 2003;44(1):77-83. 788 patients screened retrospectively in Belgium, the Netherlands, Spain and the UK. Hyperuricaemia occurred in 18.9% of patients, and 27.8% of those fulfilled tumour-lysis criteria. The authors note the observed incidence rates were lower than earlier reports.',
        'Duminuco A, Del Fabro V, De Luca P, Leotta D. Emergencies in Hematology: Why, When and How I Treat? J Clin Med. 2024;13(24):7572. A narrative review. Laboratory data may be present in the first 6 to 24 hours after chemotherapy starts, and the first clinical signs appear in the first 48 to 72 hours. This review restates Annemans et al. as a laboratory tumour-lysis incidence of 18.9% with clinical at 5%, which is not what that study reported.',
      ] },
    limitations: ['laboratory-tls-bloods-and-team-response-are-authored',
      'laboratory-tls-controls-are-recording-and-escalation-only',
      'laboratory-tls-published-rates-disagree-and-none-is-his'],
  },
  patient: {
    ageYears: 58, sex: 'male', heightCm: 178, weightKg: 81, asaClass: 3,
    diagnosis: 'Authored laboratory tumour-lysis picture without clinical tumour lysis, 18 hours after a first cycle',
    procedure: 'calm definition recording, evidence-boundary review, escalation to the treating team, and handoff practice',
    comorbidities: ['High-grade non-Hodgkin lymphoma with bulky disease; first cycle of combination chemotherapy 18 hours ago; normal pre-treatment renal function'],
    medications: ['All hydration, hypouricaemic, electrolyte, and renal-referral decisions remain qualified-team work'],
    allergies: ['No known drug allergies'], fasting: 'Not relevant to the ward fixture',
    baseline: { heartRateBpm: 86, meanArterialMmHg: 91, strokeVolumeMl: 70,
      hemoglobinGPerDl: 11.8, bloodVolumeMl: 5_300, coreTemperatureC: 36.8,
      arterialStiffness: 1.1, baroreflexGain: 0.9, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Alert, orientated, and speaking in full sentences in the supplied fixture' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 520, respiratoryRateBpm: 12,
      freshGasFlowLPerMin: 10, delivering: false } }, formulary: [],
  timeline: [
    { id: 'laboratory-tls-presentation', type: 'narrative', target: 'laboratory-tls', atTick: 0,
      severity: 'warning', message: 'A 58-year-old man is 18 hours after the first cycle of chemotherapy for a bulky high-grade non-Hodgkin lymphoma. The morning bloods show a rise in phosphate, potassium and urate with a fall in corrected calcium; the creatinine is unchanged. Authored observations are heart rate 86/min, blood pressure 126/74 mmHg, respiratory rate 16/min, oxygen saturation 98% in air, temperature 36.8 C, sinus rhythm, passing urine freely, and alert. He is asking when he can have breakfast. The ward is split between two readings: that he has tumour lysis syndrome and needs intensive care, and that he is well so these are just numbers.' },
    { id: 'laboratory-tls-evidence', type: 'narrative', target: 'laboratory-tls-evidence', atTick: 0,
      severity: 'warning', message: 'Both readings are wrong in the same place. The series that introduced these terms defined laboratory tumour lysis on the movement of the blood results alone, and clinical tumour lysis as that picture plus a consequence — potassium above 6, creatinine above 221 micromoles per litre, calcium below 1.5, a life-threatening arrhythmia, or sudden death. In its 102 patients, laboratory tumour lysis occurred in 42 percent and clinical in 6 percent, and clinical tumour lysis was more frequent in those with pre-treatment renal impairment. Laboratory changes are described within the first 6 to 24 hours and the first clinical signs at 48 to 72, so a well patient with moved bloods at 18 hours is the expected appearance of the thing being watched for. The definition is met by his results and not by him, and that gap is the window the definition exists to open.' },
    { id: 'laboratory-tls-boundary', type: 'narrative', target: 'laboratory-tls-boundary', atTick: 0,
      severity: 'warning', message: 'Record which definition is met and which is not; record what crossed and how long after treatment; record what raises the risk of crossing over, including his normal pre-treatment renal function; contact the treating haematology team with both halves stated together; record bounded qualified-team monitoring and treatment intent; and review the boundaries and their certainty. Filing it as numbers in a well patient, calling it tumour lysis syndrome and moving him to intensive care, waiting for the next set before telling anyone, and correcting the potassium and standing down are all refused. No drug, dose, route, fluid rate, investigation, or procedure is exposed, and the learner performs no examination and orders no test. After elapsed simulated time the repeat set returns with the phosphate risen again and the corrected calcium fallen further, while the creatinine is unchanged, the rhythm is sinus, and he is unchanged: the laboratory picture moves and the patient does not. The treating team answers only if it was contacted, accepts the laboratory definition as met and the clinical one as not, takes ownership of hydration, hypouricaemic treatment, monitoring frequency and any renal referral, and asks to be told if the creatinine moves or the rhythm changes rather than when the next number crosses a line. He stays well throughout, because a deterioration would settle the definition and end the lesson. No clinical tumour lysis, individualized risk, treatment causality, eligibility, disposition, prognosis, or outcome is reported. After another elapsed interval, hand off the definition, the timing, the crossing risk, the bounded intent, and what the team asked to be told. The controls do not take history; examine; acquire or interpret bloods, imaging, or another test; diagnose; select or deliver a drug, dose, route, fluid, oxygen, or device; perform a procedure; determine eligibility, disposition, or prognosis; or predict response, survival, or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'laboratory-tls-definition', objectiveId: 'recognize-oncology-laboratory-tls-which-definition-is-met', question: 'Which definition does he meet, and what does the other one require?' },
    { id: 'laboratory-tls-timing', objectiveId: 'record-oncology-laboratory-tls-what-crossed-and-when', question: 'Why does the number of hours since treatment belong in the record?' },
    { id: 'laboratory-tls-risk', objectiveId: 'record-oncology-laboratory-tls-the-crossing-risk', question: 'What would the next person want to know that his bloods do not tell them?' },
    { id: 'laboratory-tls-activation', objectiveId: 'activate-oncology-laboratory-tls-a-trajectory-not-an-alarm', question: 'What were you reporting, and how is that different from raising an alarm?' },
    { id: 'laboratory-tls-intent', objectiveId: 'record-oncology-laboratory-tls-bounded-qualified-intent', question: 'What would change the plan, and who changes it?' },
    { id: 'laboratory-tls-boundaries', objectiveId: 'review-oncology-laboratory-tls-boundaries-and-their-certainty', question: 'The published rates disagree. What does that tell you to do?' },
    { id: 'laboratory-tls-handoff', objectiveId: 'handoff-oncology-laboratory-tls-a-window-not-an-event', question: 'What did the next team need in order to keep watching rather than to react?' },
  ] },
};
