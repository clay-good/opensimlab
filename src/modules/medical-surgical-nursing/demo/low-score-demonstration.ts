import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { LowScoreSnapshot } from '@platform/kernel/protocol';
import { supportsLowScore, type LowScoreAction } from '../low-score';

export const LOW_SCORE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsLowScoreDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsLowScore(scenario);
}

export interface LowScoreDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: LowScoreAction; readonly finished?: boolean;
}

/**
 * The worked example for a score that is right and a conclusion that is not.
 *
 * An example is exposed here in a particular way: the run ends with a positive
 * culture, and a demonstration that arrives there can read as though the nurse
 * knew. So this one is written to make the call while the score is still 2 and
 * nothing has been confirmed. The escalation is justified by the concern that
 * exists at that moment, and the result is narrated afterwards as what the
 * review found rather than as what the example knew.
 */
export function lowScoreDemonstrationStep(patient?: LowScoreSnapshot): LowScoreDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'The concern travels with the score as calculated, what it does not exclude, and the words the family used. Nothing here was a documentation failure and nothing was diagnosed. This ends the example, not the admission.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.observationsRecordedAtTick === null) {
    return { id: 'observations', focus: 'actions', progress: 0.06, action: 'record-observations-and-score',
      narration: 'Record the observations and the score as measured. Respiratory rate 18, saturation 96% on air, systolic 118, heart rate 88, temperature 36.9, alert: the score is 2, and it is 2 correctly. Nothing so far has been done wrong, which is what makes the rest of this hard to see.' };
  }
  if (patient.exclusionsRecordedAtTick === null) {
    return { id: 'exclusions', focus: 'actions', progress: 0.16, action: 'record-what-the-score-excludes',
      narration: 'Record what the score does and does not support. Its own validation puts sensitivity for sepsis around 87 percent, so roughly one in eight patients with sepsis and a positive culture scored below this threshold. A screen set to catch most people is not a test that clears this one.' };
  }
  if (!patient.familyConcernRaised) {
    return { id: 'listen', focus: 'monitor', progress: 0.26,
      narration: 'Wait with her. The observations are stable and the score will not move, so nothing new is going to arrive from the monitor. What arrives is the daughter saying it again, more plainly.' };
  }
  if (patient.familyReportRecordedAtTick === null) {
    return { id: 'family', focus: 'actions', progress: 0.36, action: 'record-the-family-report',
      narration: 'Record it in the words she used: she is not herself. She cannot name a sign, and there is no field for this, which is the point rather than a problem with the form. A relative reporting an unexplained change is information the instrument does not collect.' };
  }
  if (patient.escalationAtTick === null) {
    return { id: 'escalate', focus: 'actions', progress: 0.48, action: 'escalate-on-concern',
      narration: 'Ask for review now, with the score still 2 and nothing confirmed. The reason given is the true one: the trigger is not met, the observations are unremarkable, and there is a change nobody can account for. The protocol’s own guidance is that concern overrides a low score.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.58, action: 'review-boundaries',
      narration: 'Review what the instrument was built for. It is a screen, not a diagnostic test; about a third of older adults with serious infection are afebrile; and her rate-controlling medication blunts the tachycardia the score partly relies on. That does not make the score useless. It makes it a screen.' };
  }
  if (patient.monitoringAtTick === null) {
    return { id: 'monitor', focus: 'actions', progress: 0.68, action: 'monitor',
      narration: 'Shorten the observation interval while the review is awaited, and record that it was shortened because concern was recorded rather than because the score changed.' };
  }
  if (!patient.reviewArrived) {
    return { id: 'await', focus: 'monitor', progress: 0.8,
      narration: 'Keep watching while the review is awaited. This authored delay predicts no real response time, and nothing arrives here on its own — the review happens only because somebody called for it.' };
  }
  if (!patient.reviewObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.9, action: 'reassess',
      narration: 'Take a current assessment now the review has happened. The cultures later grow a gram-negative organism and the team records that treatment was warranted at the time of the call, when the score was 2, correctly. The score was never the thing that was wrong.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: 'Hand off with the score as calculated, what it does not exclude, the family’s own words, and that the call was made on concern rather than on a threshold. A rising score, a fever, and a confirmed organism were never the gates.' };
}
