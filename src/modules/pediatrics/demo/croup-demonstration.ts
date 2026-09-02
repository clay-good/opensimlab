import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import { supportsCroup, type CroupAction, type CroupProgress } from '../croup';

export const CROUP_DEMONSTRATION_VERSION = '0.1.0';

export function supportsCroupDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsCroup(scenario);
}

export interface CroupDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: CroupAction; readonly finished?: boolean;
}

/**
 * The worked example for a child who gets worse if you upset her.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. The example takes none of the four refusals, and never once
 * moves her: it examines no mouth or throat, scores, diagnoses, tests, images
 * or swabs nothing, identifies no pathogen, chooses no drug, dose, route,
 * concentration, repeat interval, oxygen target, flow, interface or
 * nebulizer, performs no airway maneuver, ventilation, intubation or
 * procedure, and determines no discharge or admission.
 */
export function croupDemonstrationStep(
  patient?: CroupProgress,
): CroupDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She never left her caregiver’s arms, nobody looked in her throat, and the people who could open her airway were there before anyone needed them to. She is better than she was, on a treatment that wears off, with the readiness still in place for if it does. This ends the example, not the evaluation.' };
  }
  if (patient.patternAtTick === null) {
    return { id: 'pattern', focus: 'monitor', progress: 0.1, action: 'reconcile-croup-whole-child-upper-airway-pattern',
      narration: 'Leave her where she is, and read her from there. A previously well three-year-old, fifteen kilos, two days of coryza and then two hours of barking cough, a hoarse voice and noisy inspiration at night. She is alert, frightened and consolable, held in her caregiver’s position of comfort — and that position is treatment, not sentiment. Inspiratory stridor is audible at calm rest, with moderate tracheal tug and recession and equal air entry; heart rate 132, respiratory rate 34, temperature 37.8, saturation 96% on air. Stridor at rest is the finding that matters here. Taking her out of her caregiver’s arms to be examined properly would cost more than it could possibly tell you.' };
  }
  if (patient.severityAtTick === null) {
    return { id: 'severity', focus: 'monitor', progress: 0.28, action: 'review-croup-severity-and-alternative-red-flags',
      narration: 'Grade her without touching her, and keep the alternatives open. Stridor at rest with tracheal tug and recession, in a child who is still alert, consolable and moving air equally, is what the severity assessment rests on — all of it observable from across the room. The fixed absences of drooling, dysphagia, tripod posture, high fever, toxic appearance, choking, possible ingestion, wheeze, focal asymmetry, urticaria, facial swelling, hypotension, trauma, a recurrent course, airway anomaly or prior intubation help place this branch. They do not permanently exclude foreign body, anaphylaxis, epiglottitis, bacterial tracheitis or a deep-neck infection if her trajectory changes or she responds poorly.' };
  }
  if (patient.treatmentIntentAtTick === null) {
    return { id: 'treatment', focus: 'actions', progress: 0.46, action: 'record-croup-minimal-distress-support-and-qualified-treatment-intent',
      narration: 'Keep her calm, get airway-capable people here, and let them treat. Minimal-distress support with her caregiver, experienced pediatric and airway-capable ownership, and qualified-team treatment intent recorded as intent — because the drug, the dose, the route, the concentration, the repeat interval, the nebulizer and the oxygen are all theirs to choose and none of them are yours. What you are recording is that the right people are coming and that nobody is going to upset her to look busy in the meantime.' };
  }
  if (patient.earlyResponseAtTick === null) {
    return { id: 'early', focus: 'monitor', progress: 0.64, action: 'review-croup-early-response',
      narration: 'Let time pass, then read what the treatment actually did. It is a fixed report and cannot be read before simulated time has passed. Look at her behavior, her stridor at rest, her work of breathing, her color and her air entry together — the same things you graded before, so the comparison means something. What you are looking for is a direction, not a verdict.' };
  }
  if (patient.recurrenceAtTick === null) {
    return { id: 'recurrence', focus: 'monitor', progress: 0.8, action: 'review-croup-recurrence-and-preserve-airway-readiness',
      narration: 'Allow more time, then look for the return and keep the airway plan alive. Fixed and strictly later. The question is whether the stridor is coming back as the treatment fades, and whether airway-capable readiness is still in place if it does — the readiness has to outlast the improvement. Nothing here proves recovery, establishes discharge readiness, or determines where she goes.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-croup-active-upper-airway-risk',
    narration: 'Hand off an airway that is better for now. What travels is the two-day coryza and the two hours that changed it, the stridor at rest and what her severity looked like before treatment, that she was kept calm and why, the qualified-team treatment and what followed it, the recurrence review, and the airway-capable readiness that has to stay in place. What also travels is what the fixed absences did not exclude — foreign body, anaphylaxis, epiglottitis, bacterial tracheitis, deep-neck infection — if she changes direction. Nothing here diagnoses her, identifies a pathogen, proves recovery, determines discharge or admission, or predicts an outcome.' };
}
