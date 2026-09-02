import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPediatricAnaphylaxis, type PediatricAnaphylaxisAction,
  type PediatricAnaphylaxisProgress,
} from '../pediatric-anaphylaxis';

export const PEDIATRIC_ANAPHYLAXIS_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPediatricAnaphylaxisDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPediatricAnaphylaxis(scenario);
}

export interface PediatricAnaphylaxisDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PediatricAnaphylaxisAction;
  readonly finished?: boolean;
}

/**
 * The worked example for anaphylaxis without a rash.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. The steps are a strict line rather than a pair, so this example
 * has only one order available to it. It examines and monitors nobody, scores
 * no criteria, confirms no diagnosis or trigger, verifies or selects no
 * product, concentration, dose, route, device, injection, access, oxygen
 * interface or flow, fluid, bronchodilator, antihistamine, corticosteroid,
 * infusion, vasopressor, airway device or procedure, performs no positioning
 * or trigger removal, and determines no observation duration, prescription,
 * referral, disposition or outcome.
 */
export function pediatricAnaphylaxisDemonstrationStep(
  patient?: PediatricAnaphylaxisProgress,
): PediatricAnaphylaxisDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He is talking in sentences and he never had a rash at all. The team taking over knows both doses, knows he is still on oxygen and still wheezing, and knows that the next few hours are the reason he is being watched rather than sent home. This ends the example, not the evaluation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.1, action: 'reconcile-pediatric-anaphylaxis-exposure-care-and-whole-child',
      narration: 'There are no hives. Do not let that be the finding you weigh most. A six-year-old with mild asthma and no prior anaphylaxis, stung at school at minute zero — species, allergen and causal trigger all unconfirmed. Within minutes: sudden cough and diffuse wheeze, a hoarse one-to-two-word voice, repeated vomiting, pallor, drowsiness and poor perfusion. At minute ten his heart rate is 148, his MAP is 54, his saturation is 91% on supplied oxygen, his skin is pale and cool, his pulses are weak and his refill is four seconds. A qualified responder called for help, kept him lying flat rather than standing or walking, gave oxygen, and documented one appropriate intramuscular epinephrine dose at minute five. Note the position deliberately: standing a child up in this state is its own harm.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'monitor', progress: 0.28, action: 'recognize-pediatric-anaphylaxis-persistent-abc-compromise',
      narration: 'Sudden onset, more than one system, after a plausible exposure. That is the pattern. Airway, breathing and circulation are all involved — a hoarse voice, wheeze, vomiting and poor perfusion — after a witnessed sting, and it began within minutes. That is anaphylaxis, and the absent skin findings do not argue against it: no hives and no swelling in a child this sick is a known presentation and one of the reasons the diagnosis gets missed. The other absences narrow without closing. No fever, no infectious prodrome, no abrupt choking, no focal unilateral air-entry loss, no trauma, no seizure, no known food or medicine exposure — and asthma overlap, another trigger and another dangerous cause all stay open. You have scored nothing and confirmed nothing.' };
  }
  if (patient.firstLineAtTick === null) {
    return { id: 'firstLine', focus: 'actions', progress: 0.46, action: 'activate-pediatric-anaphylaxis-qualified-repeat-first-line-and-resuscitation-ownership',
      narration: 'One dose has not worked. The second one does not wait for anything else. Five minutes after an appropriate intramuscular dose, his airway, breathing and circulation are all still compromised. That is what a repeat dose is for, and it comes before the broader review rather than after it — this lesson will not let you open the airway and cause work first, because the interval is the treatment. Qualified pediatric, emergency, nursing, pharmacy, airway-capable and critical-care teams take the repeat first-line care and the resuscitation together. The product, the concentration, the dose, the route, the device, the injection, the access, the fluids and the oxygen are all theirs, and none of them was ever yours to verify.' };
  }
  if (patient.safetyAtTick === null) {
    return { id: 'safety', focus: 'actions', progress: 0.64, action: 'review-pediatric-anaphylaxis-airway-asthma-causes-and-refractory-boundary',
      narration: 'The second dose is owned. Now review what could still be true. Repeated airway, breathing, circulation, perfusion, neurological, skin and gastrointestinal reassessment, the trigger and alternative-cause work, how he is responding to the medicine, and the boundary at which this becomes refractory and somebody else gets called. His asthma matters here, because wheeze in a child with asthma invites the comfortable explanation and the two can be present together. The current negative findings are snapshots, and none of them has excluded anything.' };
  }
  if (patient.laterResponseAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.8, action: 'review-pediatric-anaphylaxis-later-response',
      narration: 'Let time pass, then read the improvement carefully. At minute eighteen there has been no further vomiting since minute eleven, he is alert, he speaks in full short sentences with a clearer voice, and his cough and wheeze are reduced but persistent. Heart rate 122, MAP 72, saturation 97% on continued oxygen, warm with normal pulses and a refill of two seconds. That is a real and welcome change, and it is where this diagnosis is most dangerous: improvement after epinephrine does not prove the treatment caused it, does not confirm anaphylaxis, does not identify the trigger, does not resolve the airway risk or the shock, does not exclude a refractory course, and above all does not exclude a biphasic reaction. He is still on oxygen and still wheezing.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-pediatric-anaphylaxis-observation-allergy-and-caregiver-risk',
    narration: 'Hand off a child who got better and is not out of it. What travels is the reported sting with the trigger unconfirmed, his asthma, the timing of onset and of both epinephrine doses and who gave them, the compromise that persisted through the first, the minute-18 state including the continued oxygen and the persistent wheeze, the biphasic and refractory risk with the observation that follows from it, the trigger and alternative-cause work still open, the allergy follow-up, and the caregiver conversation — including what an adrenaline autoinjector is for and when to use it, which belongs to a prescriber rather than to you. Nothing here confirms anaphylaxis or its trigger, proves a treatment effect, resolves airway risk or shock, excludes a refractory or biphasic course or recurrence, or determines disposition, prognosis or outcome.' };
}
