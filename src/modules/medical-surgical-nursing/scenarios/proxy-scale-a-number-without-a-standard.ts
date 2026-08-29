/** A behavioural total of 4, and no reference standard to compare it against. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const PROXY_SCALE_A_NUMBER_WITHOUT_A_STANDARD: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'proxy-scale-a-number-without-a-standard', version: '0.1.0', maturity: 'preview',
    title: 'A number without a standard', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 8, difficulty: 'intermediate', objectives: [
      { id: 'reconcile-medical-surgical-nursing-proxy-scale-an-attempt-that-came-first', statement: 'Attempt self-report before scoring anyone.', measure: 'A verbal prompt, a yes-or-no prompt, and a picture scale were attempted and recorded as attempted and unsuccessful, which is distinct from not attempted and distinct again from a denial of pain, without learner diagnosis or treatment selection.' },
      { id: 'recognize-medical-surgical-nursing-proxy-scale-a-total-is-not-an-intensity', statement: 'Recognize that a total is not an intensity.', measure: 'Four behavioural items each scoring one and consolability scoring zero were recorded as observations with the total stated as their sum, and reading it as four out of ten was refused because no validated conversion to an intensity exists.' },
      { id: 'record-medical-surgical-nursing-proxy-scale-what-a-low-total-cannot-license', statement: 'State what the total cannot license in either direction.', measure: 'That a limited behavioural repertoire produces few behaviours whether or not something hurts, and that the item sets are not comprehensive, were recorded so a low total is weak evidence in the same way a high one is.' },
      { id: 'activate-medical-surgical-nursing-proxy-scale-a-proxy-who-knows-the-person', statement: 'Obtain a proxy history from someone who knows him.', measure: 'His daughter was asked what he looks like in pain and what is different today, and her account was recorded in her words as sitting above behavioural scoring and below his own unavailable report in the assessment hierarchy.' },
      { id: 'review-medical-surgical-nursing-proxy-scale-boundaries-and-their-certainty', statement: 'Review the hierarchy and its certainty.', measure: 'The attempt-cause-observe-proxy-trial hierarchy, the placement of pulse and blood pressure at its bottom as unreliable indicators, and the review finding that no behavioural tool could be recommended for broad adoption on its intensity claims were all kept explicit.' },
      { id: 'handoff-medical-surgical-nursing-proxy-scale-a-number-handed-over-as-what-it-is', statement: 'Hand the number over as what it is.', measure: 'The handoff preserved the attempted self-report, the behaviours with the total alongside them, that the total is a behavioural sum rather than an intensity, the proxy account, and that the response to treatment will be read as further evidence rather than confirmation.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0', sources: [
        'Herr K, Bjoro K, Decker S. Tools for assessment of pain in nonverbal older adults with dementia: a state-of-the-science review. J Pain Symptom Manage. 2006;31(2):170-192. Concluded that no tool could then be recommended for broad adoption, with the instruments in early stages of development and testing.',
        'Herr K, Coyne PJ, Key T, et al. Pain assessment in the nonverbal patient: position statement with clinical practice recommendations. Pain Manag Nurs. 2006;7(2):44-52. American Society for Pain Management Nursing. Sets out the hierarchy of pain assessment: attempt self-report, consider potential causes, observe behaviours, obtain a proxy report from a person who knows the patient, and attempt an analgesic trial. Behavioural scores are not intensity scores, and physiologic indicators are placed at the bottom of the hierarchy.',
        'Pain in non-communicative older adults beyond dementia: a narrative review. Front Med. 2024;11:1393367. Notes that behavioural item sets are non-comprehensive and that subtle behavioural change may be missed.',
      ] },
    limitations: ['proxy-scale-presentation-and-behaviours-are-authored',
      'proxy-scale-controls-are-assessment-and-bounded-intent-only',
      'proxy-scale-no-validated-intensity-conversion-exists'],
  },
  patient: {
    ageYears: 84, sex: 'male', heightCm: 168, weightKg: 61, asaClass: 3,
    diagnosis: 'Authored postoperative pain assessment in advanced dementia, where self-report is unavailable',
    procedure: 'calm self-report attempt, behavioural observation, proxy history, bounded intent, and handoff practice',
    comorbidities: ['Advanced dementia, non-verbal at baseline; day 1 after hemiarthroplasty'],
    medications: ['Analgesic selection, dose, route, and interval remain qualified-team work'],
    allergies: ['No known drug allergies'], fasting: 'Not relevant to the nursing fixture',
    baseline: { heartRateBpm: 78, meanArterialMmHg: 95, strokeVolumeMl: 62,
      hemoglobinGPerDl: 10.6, bloodVolumeMl: 4_300, coreTemperatureC: 36.9,
      arterialStiffness: 1.3, baroreflexGain: 0.6, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Awake and protecting the airway in the supplied fixture' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 420, respiratoryRateBpm: 12,
      freshGasFlowLPerMin: 10, delivering: false } }, formulary: [],
  timeline: [
    { id: 'proxy-scale-presentation', type: 'narrative', target: 'proxy-scale', atTick: 0,
      severity: 'warning', message: 'An 84-year-old with advanced dementia, non-verbal at baseline, is one day after hemiarthroplasty. Authored observations are pulse 78/min, blood pressure 132/76 mmHg, respiratory rate 18/min, oxygen saturation 96% in air, temperature 36.9 C, all unremarkable. He is awake, not speaking, with a flat facial expression. A behavioural pain scale has been scored at 4: breathing independent of vocalisation, negative vocalisation, facial expression, and body language each scoring one, and consolability scoring zero.' },
    { id: 'proxy-scale-evidence', type: 'narrative', target: 'proxy-scale-evidence', atTick: 0,
      severity: 'warning', message: 'The reference standard for pain is self-report, and here it is unavailable. What is left is a behavioural observation scale whose numeric output looks like an intensity but is not one: the instruments are described by their developers as measuring observable behaviour, and a state-of-the-science review concluded that no tool could then be recommended for broad adoption on the strength of its intensity claims. There is no validated conversion from a behavioural total to a self-reported number. The scale also cannot be read downward: a patient with a limited behavioural repertoire produces few behaviours whether or not something hurts, and the item sets are not comprehensive, so subtle change can score nothing at all. The professional guidance sets out a hierarchy instead of a number: attempt self-report; consider whether a cause of pain is present; observe behaviours; obtain a proxy report from someone who knows the person; and treat the response to an analgesic trial as further information. Pulse and blood pressure sit at the bottom of that hierarchy as unreliable indicators.' },
    { id: 'proxy-scale-boundary', type: 'narrative', target: 'proxy-scale-boundary', atTick: 0,
      severity: 'warning', message: 'Attempt self-report first, and record the attempt as attempted and unsuccessful, which is different from not attempted and different again from a denial of pain; record the observed behaviours as behaviours with the total stated as their sum; state what the total is and is not, in both directions; obtain the proxy history from the person who knows his baseline, in her words; record bounded qualified-team analgesic intent with the reasoning stated; review the hierarchy and its certainty; and schedule reassessment with the behaviours recorded alongside the total rather than the total alone. Reading the total as an intensity out of ten, using pulse and blood pressure to confirm pain, reading a zero as comfortable, and waiting for him to ask are all refused. Observation before an attempt at self-report is refused, because the hierarchy exists so that a patient who could have answered is asked first. Seeking a proxy history before anyone who knows him is present is refused, because a proxy is a person rather than a field on a form. No agent, dose, route, interval, or procedure is exposed, and the learner performs no examination beyond the observation instrument and orders no test. The observations stay unremarkable throughout, because a lesson in which the pulse rises would teach physiological confirmation, which the hierarchy places last. After elapsed simulated time his daughter arrives for visiting; she has cared for him at home for four years and can describe what he looks like when something hurts. If bounded intent is recorded, the qualified team later reviews and records that the behavioural total is unchanged, that a total is not an intensity, and that the response to treatment is further evidence rather than confirmation that the score was right. No individualized effect, treatment causality, pain intensity, cause, eligibility, disposition, prognosis, or outcome is reported. Qualified teams retain analgesic selection, delivery, and every treatment decision. After another elapsed interval, hand off the attempted self-report, the behaviours and their total, the proxy account, the reassessment schedule, disposition, and outcome uncertainty. The controls do not take history beyond the proxy account; examine beyond the observation instrument; acquire or interpret laboratory, imaging, or another test; diagnose; select or deliver a drug, dose, route, fluid, oxygen, or device; perform a procedure; determine eligibility, disposition, or prognosis; or predict response, cause, survival, or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'proxy-scale-trajectory', objectiveId: 'reconcile-medical-surgical-nursing-proxy-scale-an-attempt-that-came-first', question: 'Why does an unsuccessful attempt get recorded rather than skipped?' },
    { id: 'proxy-scale-recognition', objectiveId: 'recognize-medical-surgical-nursing-proxy-scale-a-total-is-not-an-intensity', question: 'What does the total of 4 actually count?' },
    { id: 'proxy-scale-limits', objectiveId: 'record-medical-surgical-nursing-proxy-scale-what-a-low-total-cannot-license', question: 'What would a total of 0 have licensed you to conclude?' },
    { id: 'proxy-scale-activation', objectiveId: 'activate-medical-surgical-nursing-proxy-scale-a-proxy-who-knows-the-person', question: 'What did his daughter know that no scale contains?' },
    { id: 'proxy-scale-boundaries', objectiveId: 'review-medical-surgical-nursing-proxy-scale-boundaries-and-their-certainty', question: 'Where do pulse and blood pressure sit in the hierarchy, and why?' },
    { id: 'proxy-scale-handoff', objectiveId: 'handoff-medical-surgical-nursing-proxy-scale-a-number-handed-over-as-what-it-is', question: 'How should the response to analgesia be read afterwards?' },
  ] },
};
