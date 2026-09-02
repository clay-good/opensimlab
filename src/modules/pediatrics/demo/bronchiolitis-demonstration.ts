import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsBronchiolitis, type BronchiolitisAction, type BronchiolitisProgress,
} from '../bronchiolitis';

export const BRONCHIOLITIS_DEMONSTRATION_VERSION = '0.1.0';

export function supportsBronchiolitisDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsBronchiolitis(scenario);
}

export interface BronchiolitisDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: BronchiolitisAction; readonly finished?: boolean;
}

/**
 * The worked example for an illness that gets treated too much.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. The example takes none of the five refusals. It examines
 * nobody, confirms no diagnosis, identifies no virus, acquires and interprets
 * no test, selects no oxygen, device, flow, fraction, target, feed, fluid
 * route or volume, gives no bronchodilator, steroid or antibiotic, suctions
 * nothing, and determines no admission or discharge.
 */
export function bronchiolitisDemonstrationStep(
  patient?: BronchiolitisProgress,
): BronchiolitisDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He has oxygen, a team watching how he feeds as closely as how he breathes, and nothing in him that did not need to be there. He also has an illness that may not have peaked yet, and a family who need to know what to come back for. Nothing here proves he recovers or that he is ready to go home. This ends the example, not the evaluation.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'monitor', progress: 0.1, action: 'reconcile-bronchiolitis-risk-and-trajectory',
      narration: 'Take in the whole infant, and the feeding history with it. A previously well twelve-month-old, ten kilos, day four of his first coryzal illness. He is awake and interactive, with nasal congestion, diffuse crackles and wheeze, moderate subcostal recession and equal air entry. Heart rate 156, respiratory rate 58, temperature 38.0, and a persistent 88% on air with a clean pleth — warm, strong pulses, refill of two seconds, no apnea, grunting, exhaustion or cyanosis. And the part that is easy to leave out of the summary: intake at about 40% of usual over twenty-four hours, with two wet diapers, feeds interrupted by coughing and fatigue. In an infant this age, how he is feeding is a vital sign.' };
  }
  if (patient.patternAtTick === null) {
    return { id: 'pattern', focus: 'monitor', progress: 0.28, action: 'recognize-bronchiolitis-supportive-care-pattern',
      narration: 'Name it as the supportive-care pattern it is. Recording that this is typical bronchiolitis is what makes the rest of the lesson coherent: it is a disease that gets better with oxygen, feeding, hydration and watching, and worse with enthusiasm. The fixed absences — no focal asymmetry, choking, bark, stridor, drooling, urticaria, facial swelling, prior wheeze, prematurity, chronic cardiopulmonary disease or immunodeficiency — narrow the field, and they do not permanently exclude another diagnosis or a bacterial coinfection.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.46, action: 'activate-bronchiolitis-oxygenation-and-monitoring',
      narration: 'Get experienced supportive-care ownership and monitoring around him. Oxygenation and continuous monitoring, owned by people qualified to choose the specifics — because at 88% he does need oxygen, and none of the details are yours here. No device, flow, fraction or target is selected, nothing is suctioned or delivered by you, and no drug, ventilation or procedure happens. What you are recording is that he is being watched properly by people who can act.' };
  }
  if (patient.feedingHydrationAtTick === null) {
    return { id: 'feeding', focus: 'monitor', progress: 0.64, action: 'review-bronchiolitis-feeding-and-hydration',
      narration: 'Let time pass, then take the feeding as seriously as the breathing. It is a fixed report and cannot be read before simulated time has passed. Forty percent of usual intake and two wet diapers in twenty-four hours is the finding that decides where this infant spends tonight, more often than the saturation does — an infant who cannot feed because he cannot breathe and cannot breathe well because he is dehydrated is on a loop that support interrupts. The route and the volume belong to the team, not to you: nothing here selects or delivers a feed, a fluid route or a fluid.' };
  }
  if (patient.laterResponseAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.8, action: 'review-bronchiolitis-later-response',
      narration: 'Allow more time, then read the later report as a whole infant again. Fixed and strictly later. Look at his work of breathing, his feeding, his hydration, his alertness and his oxygenation together, and ask which way the group is moving. Whatever it says, it is a report on where he is now rather than a verdict on where he ends up — no recovery is proven here and no discharge readiness is established.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-bronchiolitis-active-risk',
    narration: 'Hand off an infant whose illness has probably not peaked. What travels is the day-four timing and what that means for the days after it, the whole-infant severity rather than the saturation alone, the feeding and hydration numbers, the support that was activated, both reviews and the direction between them, the apnea risk, and what stays open — another diagnosis and bacterial coinfection both, which the fixed absences narrowed and did not exclude. Nothing here confirms a diagnosis, identifies a virus, proves recovery or discharge readiness, determines disposition, or predicts an outcome.' };
}
