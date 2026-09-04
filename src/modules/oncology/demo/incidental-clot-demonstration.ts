import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { IncidentalClotSnapshot } from '@platform/kernel/protocol';
import { supportsIncidentalClot, type IncidentalClotAction } from '../incidental-clot';

export const INCIDENTAL_CLOT_DEMONSTRATION_VERSION = '0.1.0';

export function supportsIncidentalClotDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsIncidentalClot(scenario);
}

export interface IncidentalClotDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: IncidentalClotAction; readonly finished?: boolean;
}

/**
 * The worked example for a decision the evidence cannot make.
 *
 * It assembles the decision and then hands it over undecided, which is the whole
 * point: the example must not model confidence the panel did not have. Nothing in
 * it chooses to anticoagulate or not to, and the narration says so where a learner
 * would most expect an answer.
 */
export function incidentalClotDemonstrationStep(
  patient?: IncidentalClotSnapshot,
): IncidentalClotDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'The finding, the certainty behind the recommendation, both directions of the trade, his bleeding risk and his own words are handed over with the decision still open. This ends the example, not the decision.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.findingRecordedAtTick === null) {
    return { id: 'finding', focus: 'actions', progress: 0.05, action: 'record-the-finding-and-how-it-was-found',
      narration: 'Record the finding and how it was found. A result nobody asked for still needs an owner, and it has sat unacknowledged for four days precisely because nobody went looking for it.' };
  }
  if (patient.certaintyRecordedAtTick === null) {
    return { id: 'certainty', focus: 'actions', progress: 0.14, action: 'record-the-certainty-of-the-recommendation',
      narration: 'Record the strength and the certainty alongside the recommendation rather than underneath it. The panel suggests treatment conditionally, on very low certainty, having found no randomised trial that addressed the question. That is not a weak instruction; it is an instruction to decide with him.' };
  }
  if (patient.tradeoffRecordedAtTick === null) {
    return { id: 'tradeoff', focus: 'actions', progress: 0.24, action: 'record-the-benefit-and-the-harm-together',
      narration: 'Record both directions in one place. Fewer deaths and fewer symptomatic emboli sit beside more major bleeds, all on very uncertain evidence. Either figure alone would be a different and more comfortable lesson.' };
  }
  if (patient.bleedingRiskRecordedAtTick === null) {
    return { id: 'bleeding-risk', focus: 'actions', progress: 0.33, action: 'record-this-patients-bleeding-risk',
      narration: 'Record his own bleeding risk rather than the population’s: intermittent bleeding from the primary over two months, most recently last week, with a drifting haemoglobin. This is not deciding against treatment. It is putting the number that decides in front of the people deciding.' };
  }
  if (!patient.patientAsked) {
    return { id: 'listen', focus: 'monitor', progress: 0.42,
      narration: 'Nothing is pressing here, and that is the difficulty. This authored moment is a contrast rather than a required clinical wait; pause freely while he gathers what he wants to say.' };
  }
  if (patient.escalationAtTick === null) {
    return { id: 'escalate', focus: 'actions', progress: 0.52, action: 'escalate-to-the-treating-service',
      narration: 'Contact the treating service and ask for a decision rather than reporting one. Whether to anticoagulate, with what, and for how long is theirs — and the finding reached this clinic before it reached them.' };
  }
  if (patient.sharedDecisionAtTick === null) {
    return { id: 'shared', focus: 'actions', progress: 0.63, action: 'record-the-decision-as-shared',
      narration: 'Record it as a decision to be made with him and not for him. No agreement is recorded, because none has been reached; what is recorded is that the recommendation is conditional, that both directions were put to him together, and that he raised it himself.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.72, action: 'review-boundaries',
      narration: 'Review what the evidence cannot settle. The panel named this a research priority. Nothing available in this lesson will resolve the uncertainty, and proceeding as though it had is the error it teaches.' };
  }
  if (patient.observation === null) {
    return { id: 'assess', focus: 'actions', progress: 0.80, action: 'reassess',
      narration: 'Take a current full assessment rather than a partial check. The report alone supplies no observations, and the observations supply no report.' };
  }
  if (!patient.serviceResponded) {
    return { id: 'observe-service', focus: 'monitor', progress: 0.87,
      narration: 'Wait for the service that was contacted. Nobody rings back unbidden here, because the failure this lesson can produce is a decision taken alone. The authored interval settles nothing.' };
  }
  if (!patient.serviceObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.93, action: 'reassess',
      narration: 'Take a fresh assessment now the service has answered and asked that the bleeding history and his own words travel with the referral. The earlier assessment predates their answer.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: 'Hand off with the decision open. An agreed plan, a chosen drug, and a resolved uncertainty are not handoff gates, and this example ends without choosing for him — because the evidence it was given cannot.' };
}
