import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPediatricStatusEpilepticus, type PediatricStatusEpilepticusAction,
  type PediatricStatusEpilepticusProgress,
} from '../pediatric-status-epilepticus';

export const PEDIATRIC_STATUS_EPILEPTICUS_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPediatricStatusEpilepticusDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPediatricStatusEpilepticus(scenario);
}

export interface PediatricStatusEpilepticusDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PediatricStatusEpilepticusAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a seizure that stops being visible.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. Of the unordered pair it takes second-line ownership first and
 * the safety review second, which is one valid order rather than the required
 * one. The example times and examines nothing, acquires and interprets no
 * monitoring, glucose, laboratory, EEG, imaging or lumbar-puncture finding,
 * verifies or selects no first-line or second-line product, dose,
 * concentration, route, access, infusion, oxygen, suction, airway device or
 * procedure, diagnoses and treats no cause, and determines no disposition or
 * outcome.
 */
export function pediatricStatusEpilepticusDemonstrationStep(
  patient?: PediatricStatusEpilepticusProgress,
): PediatricStatusEpilepticusDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is still, and still is not the same as well. The team taking over has the clock, the two doses that failed, who owns the agent that followed them, and the sentence that matters most: no visible convulsion is not the same as no seizure. This ends the example, not the evaluation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.1, action: 'reconcile-pediatric-status-epilepticus-clock-care-and-whole-child',
      narration: 'Start with the clock, because the clock is what decides the next drug. A previously well six-year-old, 20 kg, is fourteen and a half minutes into a first witnessed bilateral generalized convulsion with no recovery between movements. The experienced-team record verifies two documented appropriate weight-based first-line benzodiazepine doses, at seizure minutes five and ten. Product, dose, concentration, route and delivery are deliberately not shown and were not yours to select or verify. The supplied findings: heart rate 146, MAP 81, saturation 94% on air, refill two seconds, and a point-of-care glucose of 108 — which matters because a treatable cause has already been looked for and is not the answer here. Note what you cannot have: the respiratory rate is not reliably countable during the movements and there is no capnography.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'monitor', progress: 0.28, action: 'recognize-pediatric-convulsive-status-after-first-line-care',
      narration: 'Two adequate doses have failed. Say that, because it changes the drug class. Persistent convulsive status after two documented appropriate first-line doses is the pattern, and naming it is what stops the most common error in this room: reaching for a third benzodiazepine. More of the same is not the next step — the next step is a second-line agent, chosen and given by the qualified team. The absences you were handed narrow without closing: no fever, no nonblanching rash, no reported trauma, no known ingestion, no known epilepsy, no known diabetes, and yet witness limits, infection, structural, toxic, metabolic and medication causes stay open. You have diagnosed nothing and timed nothing.' };
  }
  if (patient.secondLineAtTick === null) {
    return { id: 'secondLine', focus: 'actions', progress: 0.46, action: 'activate-pediatric-status-epilepticus-qualified-second-line-ownership',
      narration: 'The second-line drug and the airway do not queue behind each other. Start by activating second-line ownership. Qualified pediatric, neurology, nursing, pharmacy, airway-capable, critical-care, laboratory, imaging and safeguarding teams are available now, and the agent, the dose, the concentration, the route, the access and the infusion are all theirs. The reason this is urgent rather than merely correct is that time in convulsive status is the variable nobody gets back. What you record is that somebody owns the next drug, immediately, and without waiting for the airway and cause work to finish first.' };
  }
  if (patient.safetyAtTick === null) {
    return { id: 'safety', focus: 'actions', progress: 0.64, action: 'review-pediatric-status-epilepticus-airway-causes-and-refractory-boundary',
      narration: 'The drug is owned. Now hold the airway, the causes, and the refractory line. Three things run together here. Her airway and breathing, because you cannot count a respiratory rate through the movements and there is no capnography, and because the second-line agent itself can depress her breathing — experienced airway and oxygen support is immediately available and that is not incidental. The causes, which the authored absences narrow without excluding. And the refractory boundary: what would count as failure of this agent, and who gets called when it does. Deciding that in advance is the difference between escalating and noticing late.' };
  }
  if (patient.laterResponseAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.8, action: 'review-pediatric-status-epilepticus-later-response',
      narration: 'Let time pass, then be careful about what stillness means. The fixed minute-25 report: no visible convulsions since minute eighteen. She is drowsy, opens her eyes to voice, localizes and moves symmetrically, is not at baseline, and is not safe to swallow. Heart rate 116, respiratory rate 22, saturation 98%. The movements stopping is the thing everyone in the room wanted, and it is also the most over-read finding in this lesson. It does not prove the treatment caused it, does not establish electrographic seizure control, does not make control durable, does not prove neurological recovery, does not identify the cause, and does not exclude recurrence. A child who has stopped moving and is not back to herself is a child who still needs watching, not a child who is finished.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-pediatric-status-epilepticus-active-risk',
    narration: 'Hand off a seizure that has stopped being visible. What travels is the seizure clock from onset, the two documented first-line doses and their times, that they failed, who owns the second-line agent and when it was given, the airway and breathing risk including that her rate could not be counted during the movements and that the agent can depress it, the minute-25 state described as not at baseline and not safe to swallow, the explicit gap between no visible convulsion and no seizure, the refractory triggers and who gets called, the causes still open, and the caregiver context. Nothing here claims a cause, a treatment effect, electrographic or durable control, neurological recovery, freedom from recurrence, disposition, prognosis or outcome.' };
}
