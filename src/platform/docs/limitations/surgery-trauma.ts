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
];
