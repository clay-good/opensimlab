/**
 * The surgery and trauma module's limitations.
 *
 * Split out of the single register so a module's cockpit chunk carries its own entries and not the
 * other fifteen modules'. An entry is filed here if a surgery-trauma scenario names it through
 * `briefIn` or declares it in its own metadata. The complete register is assembled in
 * `../limitations.ts`.
 */

import type { Limitation } from './types';

export const SURGERY_TRAUMA_LIMITATIONS: readonly Limitation[] = [
  {
    id: 'negative-scan-presentation-and-team-response-are-authored',
    headline: 'One ward round, one telephone call, and a patient who never deteriorates.',
    simplification: 'The case supplies a fixed set of observations that do not move, one repeat round at which he has vomited once and still passed no flatus, and an operating team that answers sixty minutes after it is contacted with a fixed reply. No perfusion, contamination, inflammatory, or healing model runs underneath, and no leak is ever confirmed or excluded.',
    whereItMisleads: 'A learner concludes that an anastomotic leak always looks this calm, that the operating team always answers, or that escalating is what kept this patient stable.',
    correctUnderstanding: 'Nothing the learner does in this rehearsal changes his course, because nothing was going to. The observations are held almost still so that reading a trajectory is the only thing being tested; a real patient may deteriorate quickly, may have another cause entirely, or may have nothing wrong at all. The team reply is authored: in practice the call may not be answered, and the plan has to survive that.',
    briefIn: ['negative-scan-a-scan-that-cannot-say-no'],
  },
  {
    id: 'negative-scan-controls-are-recording-and-escalation-only',
    headline: 'No investigation is ordered, no drug is selected, and no operation is chosen.',
    simplification: 'The learner records the operative course, records the failure to progress against it, records what the reported scan does and does not exclude, contacts the operating team, records bounded qualified-team intent, and reviews the boundaries.',
    whereItMisleads: 'The bounded surgical-intent control is read as booking a return to theatre, or the scan-limits control is read as the learner re-reporting the imaging.',
    correctUnderstanding: 'Re-imaging, direct assessment of the anastomosis, and any decision to reoperate belong to the qualified surgical team, and this lesson exposes no investigation, drug, dose, route, or operation. Recording that a decision exists and belongs to somebody else is not making it.',
    briefIn: ['negative-scan-a-scan-that-cannot-say-no'],
  },
  {
    id: 'negative-scan-single-centre-figures-are-not-a-decision-rule',
    headline: 'Three small single-centre studies, pointing two ways, and none of them about this abdomen.',
    simplification: 'The lesson quotes a positive predictive value of 4 to 11 percent for any aberrant vital sign in 452 bowel resections, computed-tomography sensitivities of 0.59 and 73 percent with negative predictive values of 0.70 and 88 percent, and mortality after a false-negative scan of 62.5 percent in eight patients and 45.5 against 4.2 percent in another series.',
    whereItMisleads: 'A learner treats these as a decision rule — a threshold at which to escalate, or a probability that this patient has a leak.',
    correctUnderstanding: 'These are single-centre cohorts with different populations, different imaging protocols, different leak rates, and small numerators; the two imaging series disagree with each other on sensitivity by fourteen points. They establish only the shape of the problem: that one observation cannot establish a leak and this scan cannot exclude one. They do not give a probability for this patient, and no figure here should be carried to the bedside as one.',
    briefIn: ['negative-scan-a-scan-that-cannot-say-no'],
  },
  {
    id: 'rising-requirement-presentation-and-team-response-are-authored',
    headline: 'One ward, one telephone call, and observations that never move.',
    simplification: 'The case supplies a fixed set of entirely normal observations, one authored worsening at which he asks a fourth time and passive extension stops him mid-sentence, and an on-call team that answers twenty minutes after it is called with a fixed reply. No perfusion, compartment, muscle or ischaemia model runs underneath, and no diagnosis is ever confirmed or excluded.',
    whereItMisleads: 'A learner concludes that this always progresses this slowly, that the pulse and the observations always stay normal for this long, that the team always answers within twenty minutes, or that calling is what preserved the limb.',
    correctUnderstanding: 'Nothing the learner does changes his course, because nothing was going to. The observations are held normal so that reading a trajectory is the only thing being tested; a real limb may declare itself faster, may lose its pulse, or may have nothing wrong with it. The reply is authored: in practice the call may not be answered, and the plan has to survive that.',
    briefIn: ['rising-requirement-a-number-that-under-calls'],
  },
  {
    id: 'rising-requirement-controls-are-recording-and-escalation-only',
    headline: 'No measurement is taken, no drug is selected, and no limb is decompressed.',
    simplification: 'The learner records the injury and its clock, records the rising requirement, records what one pressure reading cannot decide, calls the team, records bounded qualified-team intent, and reviews the boundaries.',
    whereItMisleads: 'The bounded intent control is read as booking a fasciotomy, the pressure control is read as the learner taking or interpreting a measurement, or the refusal of extra analgesia is read as withholding pain relief.',
    correctUnderstanding: 'Repeat assessment, any further measurement, and any decision to decompress belong to the qualified surgical team, and this lesson exposes no drug, dose, route, threshold, incision, or dressing. The analgesia refusal objects to deferring the decision until morning, not to treating his pain, and the lesson says so in the refusal itself.',
    briefIn: ['rising-requirement-a-number-that-under-calls'],
  },
  {
    id: 'rising-requirement-tibial-fracture-figures-are-not-a-threshold',
    headline: 'Tibial-fracture data from single centres, quoted for its direction rather than its number.',
    simplification: 'The lesson quotes clinical findings at 13 to 19 percent sensitivity with 97 to 98 percent specificity and negative predictive value, a probability near 25 percent with one finding and 93 with three, 53 of 116 monitored patients above an absolute 30 mmHg against three cases, and continuous differential monitoring at 94 percent sensitivity and 98 percent specificity in 850 fractures.',
    whereItMisleads: 'A learner carries these to the bedside as a rule: a percentage for this patient, a pressure at which to act, or a count of findings that settles it.',
    correctUnderstanding: 'All of it is tibial-fracture data from single centres with small numerators, and the syndrome occurs at other sites and after other causes where none of it has been measured. The figures are quoted to show which direction each measure fails in — one misses most cases, the other over-calls — and not to supply a probability or a threshold for any individual patient.',
    briefIn: ['rising-requirement-a-number-that-under-calls'],
  },
  {
    id: 'unfinished-survey-presentation-and-team-response-are-authored',
    headline: 'One intensive care bed, one telephone call, and a patient who never deteriorates.',
    simplification: 'The case supplies a fixed set of stable observations that do not move, one authored sedation window at which he localises on the right, does not move the left arm and grimaces when the left forearm is handled, and a trauma team that answers twenty-five minutes after it is asked with a fixed reply. No injury, healing, sedation, or neurological model runs underneath, and no missed injury is ever confirmed or excluded.',
    whereItMisleads: 'A learner concludes that the sedation window always produces a finding, that keeping the question open is what caused the left arm to declare itself, or that a trauma team always answers.',
    correctUnderstanding: 'Nothing the learner does changes his course, because nothing was going to. The window is authored and arrives whether or not anybody was waiting for it; in practice sedation may not be lightened that night, the examination may show nothing at all, and the call may not be answered. The lesson is that the assessment was incomplete before any of that was known, which is the only state the learner is ever actually in.',
    briefIn: ['unfinished-survey-a-patient-who-cannot-be-asked'],
  },
  {
    id: 'unfinished-survey-controls-are-recording-and-escalation-only',
    headline: 'No examination is performed, no imaging is ordered, and no disposition is decided.',
    simplification: 'The learner records why the examination behind the record was limited, records what the injury list rests on, records that no tertiary survey has been done, asks the trauma team to complete it, records bounded qualified-team intent, and reviews the boundaries.',
    whereItMisleads: 'The bounded survey-intent control is read as booking imaging or a referral, or the escalation control is read as the learner refusing the step-down.',
    correctUnderstanding: 'Reexamination, re-review of the admission imaging, further films, specialty referral, and any operation belong to the qualified trauma team, and this lesson exposes no investigation, drug, dose, route, or procedure. The learner never decides where he sleeps tonight; the objection recorded is to calling him fully assessed, not to moving him.',
    briefIn: ['unfinished-survey-a-patient-who-cannot-be-asked'],
  },
  {
    id: 'unfinished-survey-observational-figures-are-not-a-decision-rule',
    headline: 'Observational studies that disagree about whether the step they measure works.',
    simplification: 'The lesson quotes 41 missed injuries in 36 of 399 patients (9 percent against a registry 2), a systematic review putting injuries found by the survey at 4.3 percent and those still missed at 1.5, and a before-and-after cohort of 487 patients in which formalising the survey raised performance from 27 to 42 percent without changing missed injury rates.',
    whereItMisleads: 'A learner treats 9 percent as this patient\u2019s probability of a missed injury, or reads the negative before-and-after result as evidence that the tertiary survey is not worth performing.',
    correctUnderstanding: 'These are observational cohorts from single centres across more than twenty years, with different populations, different definitions of missed injury, and different follow-up; the review that pooled them says none was randomized, none reported long-term health outcomes, and risk of bias varied considerably. Together they establish that examinations of patients who cannot take part miss things and that formalising a checklist did not by itself fix that. They give no probability for this patient, and the reason to complete the survey here is that his assessment is demonstrably unfinished, not that a percentage says so.',
    briefIn: ['unfinished-survey-a-patient-who-cannot-be-asked'],
  },
];
