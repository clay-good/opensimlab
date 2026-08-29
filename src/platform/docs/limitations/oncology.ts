/**
 * The oncology module's limitations.
 *
 * Split out of the single register so a module's cockpit chunk carries its own entries and not the
 * other fourteen modules'. An entry is filed here if a oncology scenario names it through `briefIn`
 * or declares it in its own metadata; a few entries are named by scenarios in two modules and are
 * filed in both. The complete register is assembled in `../limitations.ts`.
 */

import type { Limitation } from './types';

export const ONCOLOGY_LIMITATIONS: readonly Limitation[] = [
  {
    id: 'delayed-immune-event-presentation-and-service-response-are-authored',
    headline: 'One presentation, one telephone call, and a patient who does not deteriorate.',
    simplification: 'The case supplies a fixed set of observations, a stool count that rises once, and a treating service that answers sixty minutes after it is contacted with a fixed reply. No immune, mucosal, infective, or treatment-response model runs underneath, and no grade is assigned.',
    whereItMisleads: 'A learner concludes that a delayed immune-related event presents this calmly, that the treating service always answers, or that recognising the exposure is what kept this patient stable.',
    correctUnderstanding: 'Nothing the learner does in this rehearsal changes his course, because nothing was going to. The observations are held unremarkable so that the attribution problem is the only thing being tested, and a real presentation may be more unwell, may have another cause entirely, or may be both at once. The service reply is authored: in practice the call may not be answered, and the plan has to survive that.',
    briefIn: ['delayed-immune-event-a-drug-that-stopped-months-ago'],
  },
  {
    id: 'delayed-immune-event-controls-are-recording-and-escalation-only',
    headline: 'No drug is selected, no grade is assigned, and no test is ordered.',
    simplification: 'The learner records the completed exposure, records the course against the patient\u2019s own baseline, records infection evaluation as running alongside, contacts the treating service, records bounded qualified-team intent, and reviews the boundaries.',
    whereItMisleads: 'The bounded treatment-intent control is read as prescribing corticosteroids, or the infection-evaluation control is read as the learner ordering and interpreting stool tests.',
    correctUnderstanding: 'Grading, investigation including endoscopy, and every treatment decision belong to the qualified team, and this lesson exposes no drug, dose, route, threshold, or eligibility rule. Recording that a decision exists and belongs to somebody else is not making it.',
    briefIn: ['delayed-immune-event-a-drug-that-stopped-months-ago'],
  },
  {
    id: 'delayed-immune-event-series-figures-are-not-an-incidence',
    headline: 'Twenty-three collected cases cannot tell you how often this happens.',
    simplification: 'The case reports that the series naming delayed immune-related events found a median off-treatment interval of six months after a median of four doses, and that pharmacovigilance data attribute most reported anti-CTLA-4 fatalities to colitis.',
    whereItMisleads: 'A learner reads the six-month median as the expected timing, treats 23 cases as a risk estimate, or carries the anti-CTLA-4 colitis fatality figure onto an anti-PD-1 patient.',
    correctUnderstanding: 'The series is a literature collation of reported cases with no denominator: it establishes that these events occur late and are missed, not how likely they are in any patient. Its own argument is diagnostic rather than epidemiological. The fatality spectrum differs by drug class — anti-PD-1 and anti-PD-L1 fatalities were more often pneumonitis, hepatitis, and neurotoxic effects — so the colitis figure describes a class this patient did not receive.',
    briefIn: ['delayed-immune-event-a-drug-that-stopped-months-ago'],
  },
  {
    id: 'incidental-clot-presentation-and-service-response-are-authored',
    headline: 'One report, one telephone call, and a patient who stays well throughout.',
    simplification: 'The case supplies a fixed set of observations that never move, a patient who asks his question at a fixed time, and a treating service that answers sixty minutes after it is contacted with a fixed reply. No thrombosis, bleeding, or anticoagulation-response model runs underneath, and no decision is reached.',
    whereItMisleads: 'A learner concludes that an incidental pulmonary embolus is always this quiet, that the treating service always answers, or that patients reliably volunteer what matters to them.',
    correctUnderstanding: 'Nothing the learner does changes his course, because nothing was going to. He is held well so that the decision cannot be settled by a deterioration, and his question is authored so that the values input arrives at all. In practice the patient may be unwell, may never raise it, and the call may not be answered; the plan has to survive each of those.',
    briefIn: ['incidental-clot-a-decision-the-evidence-cannot-make'],
  },
  {
    id: 'incidental-clot-controls-are-recording-and-escalation-only',
    headline: 'No anticoagulant is selected, and no decision is reached.',
    simplification: 'The learner records the finding and how it was found, records the strength and certainty of the recommendation, records the benefit and the harm together, records this patient\u2019s bleeding risk, contacts the treating service, records the decision as shared, and reviews the boundaries.',
    whereItMisleads: 'The shared-decision control is read as obtaining consent or agreeing a plan, or the refusal of immediate anticoagulation is read as this lesson recommending observation.',
    correctUnderstanding: 'Nothing is agreed and nothing is administered. The lesson refuses both reflexes and reaches neither conclusion, because the guidance it rests on suggests treatment conditionally on very low certainty and says the individual risk of thrombosis and of major bleeding should decide after full discussion. Observation is a legitimate outcome of that discussion; so is anticoagulation. Neither is this learner\u2019s to declare.',
    briefIn: ['incidental-clot-a-decision-the-evidence-cannot-make'],
  },
  {
    id: 'incidental-clot-figures-are-population-estimates-on-very-low-certainty',
    headline: 'Every number in this lesson is a population estimate the panel itself rated very low.',
    simplification: 'The case reports about 89 fewer deaths, 77 fewer symptomatic emboli, and 128 more major bleeds per 1000 with treatment, a six-month mortality of about 37 percent, and an incidence of about 3 percent.',
    whereItMisleads: 'A learner reads the per-1000 figures as this patient\u2019s risks, treats the mortality figure as an effect of the clot or of the decision, or takes the direction of the estimates as settled.',
    correctUnderstanding: 'The effect estimates come from observational data with no randomised trial and no systematic review addressing the question, and the panel rated the certainty very low for risk of bias, inconsistency and imprecision. The 37 percent six-month mortality is the mortality of the population studied \u2014 people with advanced cancer \u2014 not a consequence of the embolus or of anticoagulating it. The registry cohort points the other way on bleeding, and its authors call the risk-benefit ratio uncertain.',
    briefIn: ['incidental-clot-a-decision-the-evidence-cannot-make'],
  },
  {
    id: 'normal-test-toxicity-presentation-and-service-response-are-authored',
    headline: 'One presentation, one dose falling due, and one telephone call.',
    simplification: 'The case supplies fixed observations, an evening dose that falls due at a fixed time and is taken unless the drug was withheld, and an acute oncology service that answers sixty minutes after it is contacted with a fixed reply. No enzyme, absorption, or toxicity-kinetics model runs underneath, and no grade is assigned.',
    whereItMisleads: 'A learner reads the taken dose as a modelled harm, concludes that severe fluoropyrimidine toxicity always looks like this, or expects the treating service to answer.',
    correctUnderstanding: 'The taken dose is recorded as a fact about what happened, not as a prediction about what it will do; the fixture models no consequence of it, because it cannot. A real presentation may be far more unwell, may involve fever or a low neutrophil count that this fixture does not supply, and the call may not be answered. The withholding has to happen regardless of any of that.',
    briefIn: ['normal-test-toxicity-the-dose-in-his-bag'],
  },
  {
    id: 'normal-test-toxicity-controls-are-withholding-and-escalation-only',
    headline: 'One drug is stopped here, and no drug is ever chosen.',
    simplification: 'The learner withholds the oral anticancer drug, records what the normal pre-treatment panel does and does not exclude, records the toxicity with its severity and cycle day, contacts acute oncology, records bounded qualified-team supportive intent, and reviews the boundaries.',
    whereItMisleads: 'The bounded supportive-intent control is read as prescribing fluids or an antidote, or the refusal to advise a halved dose is read as this lesson taking a position on dose modification.',
    correctUnderstanding: 'Stopping a drug and starting one are different acts, and only the first is exposed here. Grading, dose modification, supportive treatment, any specific antidotal treatment, and whether the drug is ever restarted all belong to the qualified team, and no agent, dose, route, fluid, or threshold appears anywhere in this lesson.',
    briefIn: ['normal-test-toxicity-the-dose-in-his-bag'],
  },
  {
    id: 'normal-test-toxicity-genotype-figures-are-not-this-patients-risk',
    headline: 'The genotype figures describe cohorts, and this patient is not a cohort.',
    simplification: 'The case reports severe toxicity in 23 percent of wild-type patients and 39 percent of dose-reduced variant carriers, severe toxicity in up to 30 percent of treated patients, and adjusted relative risks of roughly 2.9 to 4.4 for the screened variants.',
    whereItMisleads: 'A learner reads 23 percent as this patient\u2019s probability, treats the panel as useless because it did not predict him, or infers that he has an enzyme deficiency.',
    correctUnderstanding: 'These are cohort frequencies and adjusted relative risks, not individual probabilities, and the prospective analysis was a safety study rather than a randomised comparison. The panel is genuinely predictive, which is precisely why a wild-type result narrows the differential without closing it. Nothing in this lesson establishes why this patient became toxic; no enzyme activity was measured, and none is claimed.',
    briefIn: ['normal-test-toxicity-the-dose-in-his-bag'],
  },
  {
    id: 'prognosis-question-conversation-and-readback-are-authored',
    headline: 'One conversation, one repeated question, and one readback in a corridor.',
    simplification: 'The case supplies a patient who asks at a fixed time, states his reason at a fixed time, and repeats the answer back thirty minutes after it is given. What he repeats is decided by whether the direction of the error was stated. No survival, disease, or comprehension model runs underneath.',
    whereItMisleads: 'A learner reads the readback as evidence that saying the right thing reliably produces understanding, or that a patient who repeats three scenarios has accepted them.',
    correctUnderstanding: 'The readback is an authored contrast built to make one difference visible, not a measurement of comprehension. Real understanding is partial, moves between conversations, and often has to be rebuilt from the beginning next time. A patient may repeat a range accurately and still plan on the best case, and none of that is modelled here.',
    briefIn: ['prognosis-question-a-number-he-asked-for'],
  },
  {
    id: 'prognosis-question-controls-are-conversation-only',
    headline: 'Nothing is examined, ordered, prescribed, or predicted in this lesson.',
    simplification: 'The learner establishes what the question is for, records it, checks a belief, answers in scenarios, states the direction of the error, and reviews the boundaries. The observations are supplied and are deliberately irrelevant.',
    whereItMisleads: 'The scenario answer is read as this project generating a prognosis, or the typical figure is taken to be computed from the patient in front of the learner.',
    correctUnderstanding: 'No number here is derived from this patient. The lesson teaches the shape an honest answer takes and where its uncertainty comes from; the estimate a real answer is built around is a clinician\u2019s judgement, made with the patient\u2019s disease, treatment, and trajectory in front of them, and this simulator neither makes nor checks one.',
    briefIn: ['prognosis-question-a-number-he-asked-for'],
  },
  {
    id: 'prognosis-question-figures-describe-estimators-not-this-patient',
    headline: 'Every figure in this lesson describes the people answering, not the man asking.',
    simplification: 'The case reports that 20 percent of predictions were accurate to within a third, that 63 percent were over-optimistic by roughly fivefold, and that observed survival fell between half and double an estimate in 63 percent of patients.',
    whereItMisleads: 'A learner carries the fivefold optimism onto a patient on second-line treatment, or reads the scenario proportions as this patient\u2019s probabilities.',
    correctUnderstanding: 'The optimism cohort was 468 patients at hospice referral with a median survival of 24 days; what generalises from it is the direction of the error, which was consistent, not its size, which is not. The scenario proportions come from 114 patients of 21 oncologists and describe how often that method\u2019s brackets contained the truth, not how long anyone lived. Neither says anything about this man.',
    briefIn: ['prognosis-question-a-number-he-asked-for'],
  },
  {
    id: 'laboratory-tls-bloods-and-team-response-are-authored',
    headline: 'One set of bloods, one repeat, and a patient who stays well throughout.',
    simplification: 'The case supplies a laboratory picture that meets the definition, a repeat set thirty minutes later that has moved further, and a treating team that answers sixty minutes after it is contacted. The observations never change. No metabolic, renal, or tumour-burden model runs underneath.',
    whereItMisleads: 'A learner concludes that laboratory tumour lysis reliably stays laboratory, that a patient who is well at 18 hours will be well at 72, or that the repeat set moving is itself reassuring because he did not.',
    correctUnderstanding: 'The fixture holds him well so that the definition cannot be settled by a deterioration, which is the only way to keep the lesson about what a definition is for. It says nothing about whether this patient would cross over, and it models no consequence of the bloods it moves. A real patient may cross, quickly, and the window exists precisely because that cannot be read off how he looks.',
    briefIn: ['laboratory-tls-a-syndrome-he-does-not-have-yet'],
  },
  {
    id: 'laboratory-tls-controls-are-recording-and-escalation-only',
    headline: 'Nothing is given, corrected, prescribed, or ordered in this lesson.',
    simplification: 'The learner records which definition is met, what crossed and when, and what raises the risk of crossing over, contacts the treating team, records bounded qualified-team intent, and reviews the boundaries.',
    whereItMisleads: 'The refusal of "treat the potassium and stand down" is read as this lesson taking a position on whether the potassium should be treated, or the bounded-intent control is read as ordering fluids.',
    correctUnderstanding: 'What was refused is the standing down, not the treating: correcting one value and recording the problem as handled is how a laboratory picture becomes a clinical one unobserved. Hydration, hypouricaemic treatment, electrolyte management, monitoring frequency and any renal referral all belong to the qualified team, and no agent, dose, rate, or threshold appears anywhere in this lesson.',
    briefIn: ['laboratory-tls-a-syndrome-he-does-not-have-yet'],
  },
  {
    id: 'laboratory-tls-published-rates-disagree-and-none-is-his',
    headline: 'The published incidence figures disagree, and one is widely restated wrongly.',
    simplification: 'The case reports laboratory tumour lysis in 42 percent and clinical in 6 percent of one series, and hyperuricaemia in 18.9 percent of a second cohort with 27.8 percent of those meeting tumour-lysis criteria.',
    whereItMisleads: 'A learner reads either figure as this patient\u2019s probability of crossing over, or repeats the version of the second study that a 2024 review states, in which 18.9 percent is a laboratory tumour-lysis rate.',
    correctUnderstanding: 'The two studies used different definitions, populations and eras of prophylaxis, and neither is a risk estimate for an individual. The second measured hyperuricaemia, not laboratory tumour lysis, and its authors noted their rates were lower than earlier reports; a review restating it otherwise is the ordinary way a number drifts from what was measured. That drift is the reason this lesson records the finding in front of the learner rather than the name of a syndrome.',
    briefIn: ['laboratory-tls-a-syndrome-he-does-not-have-yet'],
  },
];
