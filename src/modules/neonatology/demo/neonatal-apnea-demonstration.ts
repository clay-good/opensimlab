import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsNeonatalApnea, type NeonatalApneaAction, type NeonatalApneaProgress,
} from '../neonatal-apnea';

export const NEONATAL_APNEA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsNeonatalApneaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsNeonatalApnea(scenario);
}

export interface NeonatalApneaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: NeonatalApneaAction; readonly finished?: boolean;
}

/**
 * The worked example for the minute in which one thing matters.
 *
 * A demonstration wants to show range, and this one narrows instead. Everything
 * a newborn resuscitation can offer is available in the room, and the example
 * declines all of it until the lungs are inflated, because a rising heart rate
 * is what says they are. It delivers no ventilation, manages no airway, gives
 * no oxygen and reaches for no cause, and it finishes on the 90-second report as
 * a first answer rather than a recovery.
 */
export function neonatalApneaDemonstrationStep(
  patient?: NeonatalApneaProgress,
): NeonatalApneaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'The newborn is handed on breathing better than he was, with the cause unknown, the transition unfinished, and nobody claiming his brain is safe. The ventilation worked; that is the whole of what has been shown. This ends the example, not the resuscitation.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.08, action: 'activate-neonatal-apnea-qualified-newborn-airway-clock-and-dyad-support',
      narration: 'Name who owns the ventilation before naming the problem: a leader, an airway and ventilation owner, a heart-rate assessor, a timekeeper, a recorder, checked equipment, and a parent who is being spoken to. The airway owner is the role this minute is about; the others exist so that role does not have to do everything.' };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'actions', progress: 0.24, action: 'reconcile-neonatal-apnea-gestation-birth-clock-breathing-heart-rate-tone-temperature-and-whole-dyad',
      narration: 'Connect the clock to the steps already done. Thirty-nine weeks and two days, an urgent birth after a prolonged deceleration, forty seconds elapsed, warmth and positioning and drying and stimulation and airway assessment all completed by qualified staff, heart rate 92, tone reduced, 36.6°C, and a parent watching. Apnea after the initial steps is a different finding from apnea before them.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'actions', progress: 0.4, action: 'recognize-neonatal-apnea-ventilation-threshold-without-cause-or-outcome-closure',
      narration: 'Let the threshold decide rather than the search for a reason. Not breathing within the first sixty seconds, or a heart rate under 100 despite initial steps, calls for assisted ventilation. Why he is apneic stays open — the deceleration, hypoxia, sedation, infection, something structural — and none of it changes what comes first.' };
  }
  if (patient.readinessAtTick === null) {
    return { id: 'readiness', focus: 'actions', progress: 0.56, action: 'review-neonatal-apnea-qualified-effective-ventilation-heart-rate-and-escalation-readiness',
      narration: 'Review what effective ventilation means and let the heart rate be the evidence: assisted ventilation begun before sixty seconds, chest movement checked, heart-rate response watched, warmth and monitoring maintained. Corrective steps, an alternative airway, oxygen titration, compressions, access and medication are prepared and not used, because a rising heart rate means the lungs are being inflated and the rest is not yet indicated.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'report', focus: 'monitor', progress: 0.76, action: 'review-neonatal-apnea-fixed-ninety-second-qualified-response-report',
      narration: 'Let the authored ninety seconds pass and read the qualified team’s report. The interval is a contrast rather than a required wait, and nothing here predicts how quickly a real newborn answers effective ventilation.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-neonatal-apnea-respiratory-thermal-glucose-neurologic-parent-and-outcome-risk',
    narration: 'Visible chest movement, heart rate risen to 126, irregular respirations emerging while assisted ventilation continues. That is a first answer and not the last word, so hand off recurrent apnea, thermal and glucose risk, neurologic uncertainty, the unknown cause and the parents as the open questions they still are.' };
}
