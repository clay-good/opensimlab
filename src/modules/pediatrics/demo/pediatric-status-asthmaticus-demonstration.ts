import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPediatricStatusAsthmaticus, type PediatricStatusAsthmaticusAction,
  type PediatricStatusAsthmaticusProgress,
} from '../pediatric-status-asthmaticus';

export const PEDIATRIC_STATUS_ASTHMATICUS_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPediatricStatusAsthmaticusDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPediatricStatusAsthmaticus(scenario);
}

export interface PediatricStatusAsthmaticusDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PediatricStatusAsthmaticusAction; readonly finished?: boolean;
}

/**
 * The worked example for a child in whom every wrong answer costs time.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. The example takes none of the four refusals. It examines
 * nobody, diagnoses and scores nothing, measures no peak flow or spirometry,
 * acquires and interprets no gas, laboratory test or image, chooses no
 * oxygen, inhaler, spacer, nebulizer, drug, dose, concentration, route,
 * interval, intravenous access, fluid, infusion, device or setting, and
 * performs no ventilation, airway maneuver, intubation, sedation, paralysis
 * or procedure.
 */
export function pediatricStatusAsthmaticusDemonstrationStep(
  patient?: PediatricStatusAsthmaticusProgress,
): PediatricStatusAsthmaticusDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'Critical care is at the bedside, the second-line plan has an owner, and she is partly better on treatment she is still receiving. The conversation about why she arrived like this is written down as work still owed to her, for an hour when she can take part in it. This ends the example, not the evaluation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.1, action: 'reconcile-pediatric-status-asthmaticus-treatment-and-trajectory',
      narration: 'An hour of correct treatment has already happened. Start from what it did not fix. A ten-year-old with established asthma, one previous PICU admission, and a personal best of 330 L/min. She followed her action plan at home and got worse. On arrival she was speaking one or two words at a time at 89% on air, with marked recession and a PEF of 105 — 32% of her own best, which is a fact about this child rather than a universal threshold. Since then a qualified team has given monitored oxygen, three bronchodilator and antimuscarinic cycles, and early systemic steroid. At minute sixty she is still one-word, still recessing, still poorly moving air, with a heart rate of 154 and a saturation of 93% on oxygen. That is what nonresponse looks like.' };
  }
  if (patient.nonresponseAtTick === null) {
    return { id: 'nonresponse', focus: 'monitor', progress: 0.28, action: 'recognize-pediatric-status-asthmaticus-severe-nonresponse',
      narration: 'Say plainly that first-line treatment has not worked. Recording severe nonresponse is what turns an hour of correct care into a decision. Everything reasonable has been delivered and she is still one-word, still recessing, still moving air poorly. Note what is reassuring and what it does not mean: she is alert rather than drowsy, there is no quiet chest, no weakening effort, no apnea, no shock and no pulse loss — which tells you she has not arrived at respiratory failure, not that she is safe from it. The fixed absences also narrow rather than exclude foreign body, anaphylaxis, upper-airway disease, infection, pneumothorax, mucus plugging and treatment toxicity, and if allergic features emerge, anaphylaxis care must not wait behind this pathway.' };
  }
  if (patient.escalationAtTick === null) {
    return { id: 'escalation', focus: 'actions', progress: 0.46, action: 'activate-pediatric-status-asthmaticus-critical-care-escalation',
      narration: 'Get pediatric critical care and airway-capable people here now. She has failed first-line treatment in front of you, and the escalation is warranted by that alone — you are not waiting for her to deteriorate further to justify the call. Activating ownership is not performing anything: no drug, dose, route, concentration, interval, intravenous access, infusion, device, setting, ventilation, airway maneuver, intubation, sedation or paralysis is chosen or delivered by you. The point of calling early is that the people who can do those things are present before the moment they are needed.' };
  }
  if (patient.secondLineIntentAtTick === null) {
    return { id: 'secondLine', focus: 'actions', progress: 0.64, action: 'record-pediatric-status-asthmaticus-qualified-second-line-care-intent',
      narration: 'Record experienced-team ownership of the second-line plan, and monitoring with it. The supplied second-line care belongs to the qualified team: the agent, the dose, the concentration, the route, the interval, the access and the infusion are all theirs, and none of them are yours to choose. What you are recording is that somebody experienced owns this plan and that she is being monitored closely enough to see it work or fail. In a child this sick, naming the owner and the monitoring is the intervention available to you.' };
  }
  if (patient.laterResponseAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.8, action: 'review-pediatric-status-asthmaticus-later-response',
      narration: 'Let time pass, then read the whole child again rather than the best number. It is fixed and strictly later. Compare like with like: her speech, her mentation, her effort, her air entry, her oxygenation and her heart rate against where they were at minute sixty. A partial response is a real and useful thing — it is simply not the same as a resolved one, and the distinction is what the next hour depends on.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-pediatric-status-asthmaticus-reassessment',
    narration: 'Hand off a child who is better and still in trouble. What travels is her asthma history including the prior PICU admission, her personal best and the 32% she arrived at, the verified first-hour care and that it did not work, the nonresponse you named, who was called and when, the second-line plan and who owns it, the partial response and what it is not, and the causes the fixed absences narrowed without excluding. The controller access and trigger conversation travels too, as work still owed to her. Nothing here diagnoses, measures, treats, determines disposition or prognosis, or predicts an outcome.' };
}
