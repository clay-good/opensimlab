import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPediatricHypoglycemicSeizure, type PediatricHypoglycemicSeizureAction,
  type PediatricHypoglycemicSeizureProgress,
} from '../pediatric-hypoglycemic-seizure';

export const PEDIATRIC_HYPOGLYCEMIC_SEIZURE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPediatricHypoglycemicSeizureDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPediatricHypoglycemicSeizure(scenario);
}

export interface PediatricHypoglycemicSeizureDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PediatricHypoglycemicSeizureAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a child whose number came back up.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. Of the unordered pair it takes rescue first and the cause
 * review second, which is one valid order rather than the required one. The
 * example examines nobody, acquires and interprets no glucose or other test,
 * diagnoses nothing, chooses no glucose formulation, dextrose, glucagon,
 * carbohydrate, fluid, anticonvulsant, drug, concentration, route, dose,
 * volume, rate, access, infusion, feeding plan, oxygen or device, performs no
 * airway maneuver or procedure, and determines no disposition or outcome.
 */
export function pediatricHypoglycemicSeizureDemonstrationStep(
  patient?: PediatricHypoglycemicSeizureProgress,
): PediatricHypoglycemicSeizureDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He is awake and talking and his glucose is 86, and not one person in this room knows yet why a previously well five-year-old had a seizure. The team taking over knows that too, and knows what they are still looking for. This ends the example, not the evaluation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.1, action: 'reconcile-pediatric-hypoglycemic-seizure-whole-child-and-glucose',
      narration: 'The convulsion has stopped. Read what it left behind. A previously well five-year-old, 18 kg, had a witnessed generalized convulsion of about ninety seconds that ended before this surface opened. He is drowsy, localizes and opens his eyes to voice, and he is not safe to swallow — that last part is a fact about the route, and it is the reason the rescue is not a cup of juice. He has a pulse, he is breathing spontaneously, his saturation is 99% on air, his refill is two seconds and his heart rate is 132. The supplied qualified glucose is 34. You did not examine him, take that sample or interpret it.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'monitor', progress: 0.28, action: 'recognize-pediatric-hypoglycemic-seizure',
      narration: 'Name it as time-critical, and keep the cause open while you do. A stopped seizure plus a glucose of 34 is a pediatric hypoglycemic emergency, and the supplied association is what justifies immediate qualified rescue rather than further investigation first. Two things stay true at the same time here. The rescue cannot wait for a cause. And the association is not the cause: no fever, no meningism, no trauma, no focal deficit, no known diabetes and no reported insulin or glucose-lowering exposure is authored — all fixed snapshots — while illness, ingestion or exposure, fasting, and metabolic, endocrine and hepatic causes stay wide open. A previously well five-year-old does not usually run out of sugar for no reason.' };
  }
  if (patient.rescueAtTick === null) {
    return { id: 'rescue', focus: 'actions', progress: 0.46, action: 'activate-pediatric-hypoglycemic-seizure-qualified-rescue-ownership',
      narration: 'Two things start now: the sugar, and the question of why. Begin with rescue ownership. Experienced pediatric, nursing, pharmacy, airway-capable and escalation teams take immediate seizure safety, locally protocolized glucose correction, cardiorespiratory surveillance, repeated glucose review, access and airway contingencies, and frequent neurological reassessment. He is not safe to swallow, so the route is theirs to choose along with the formulation, the concentration, the dose, the volume, the rate and the access — you select none of it. What you record is that the people who can do it own it, now.' };
  }
  if (patient.safetyAtTick === null) {
    return { id: 'safety', focus: 'actions', progress: 0.64, action: 'review-pediatric-hypoglycemic-seizure-causes-and-recurrence-risk',
      narration: 'Rescue is owned. Now ask why a well child ran out of sugar. This is the half that gets skipped once the number comes up. Experienced teams keep serial consciousness, seizure activity, airway, breathing, circulation, temperature, glucose, intake, medication and exposure history, endocrine, metabolic, hepatic, infectious and injury review, safeguarding, recurrence and escalation. Two of those are worth saying out loud: an accidental or non-accidental ingestion is on the list for a previously well child, and so is safeguarding — asked as part of the work rather than as an accusation. The fixed negatives you were handed are snapshots, and none of them closes the question.' };
  }
  if (patient.laterResponseAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.8, action: 'review-pediatric-hypoglycemic-seizure-later-response',
      narration: 'Let time pass, then check the child rather than the meter. The fixed later report has him awake, following commands, using age-appropriate speech, still tired, with no recurrent convulsion, a heart rate of 106, a MAP of 76, a saturation of 99% and a glucose of 86. That is exactly the moment the room relaxes, and it is worth being precise about what those numbers earned. They do not prove the treatment caused the change, they do not establish the cause of the seizure, they do not make the euglycemia durable, they do not prove neurological recovery, and they do not exclude recurrence. He is better. Nothing is explained.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-pediatric-hypoglycemic-seizure-active-risk',
    narration: 'Hand off a child who woke up with the question still open. What travels is the witnessed convulsion and its duration, the postictal state and the swallow safety that shaped the route, the glucose of 34 and the later 86 with the interval between them, who owns the rescue and what was given by them, the neurological and glucose reassessments and when the next ones are due, the causes still open — illness, ingestion or exposure, fasting, endocrine, metabolic, hepatic — the safeguarding review as part of that work, the recurrence triggers, and the caregiver context. Nothing here claims a treatment effect, a proven cause, durable euglycemia, neurological recovery, freedom from recurrence, disposition, prognosis or outcome.' };
}
