import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsThermoregulation, type ThermoregulationAction, type ThermoregulationProgress,
} from '../thermoregulation-failure';

export const THERMOREGULATION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsThermoregulationDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsThermoregulation(scenario);
}

export interface ThermoregulationDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: ThermoregulationAction; readonly finished?: boolean;
}

/**
 * The worked example for a question the evidence declines to answer.
 *
 * A demonstration is expected to know how fast to rewarm, and the honest
 * version says the evidence does not support prescribing one optimal rate. That
 * is the hardest thing this example does; the second hardest is refusing the
 * explanation it has been handed, because a warming-continuity gap accounts for
 * the cold so neatly that the illness underneath stops being looked for. It
 * warms nothing, cools nothing, operates no device and selects no set point,
 * and it finishes on a temperature that is rising and has not arrived.
 */
export function thermoregulationDemonstrationStep(
  patient?: ThermoregulationProgress,
): ThermoregulationDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'The newborn is handed on warmer and not yet warm, with no rate prescribed, no cause determined, and infection still on the list. The rewarming was right and it answered none of the questions it was started to answer. This ends the example, not the watching.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.08, action: 'activate-neonatal-thermoregulation-newborn-thermal-glucose-feeding-and-family-support',
      narration: 'Confirm the thermal, glucose and feeding pathways together: a trained newborn team, the local thermal and glucose pathway, feeding and respiratory and escalation support, the shared clock, communication, dignity, follow-up ownership, and a parent distressed that her newborn became cold. At 2.4 kg and thirty-five weeks the cold, the glucose and the feed are one problem, and splitting them across three people who are not talking is how the second one gets missed.' };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'actions', progress: 0.24, action: 'reconcile-neonatal-thermoregulation-gestation-admission-temperature-environment-trajectory-physiology-and-whole-dyad',
      narration: 'Read the trajectory, and notice how good the available explanation is. Three hours old at thirty-five weeks and four days, 2.4 kg, admission axillary 36.6°C, then a transfer and a warming-continuity gap, then a repeated verified 35.5°C, with sleepiness, a feed she cannot sustain, heart rate 126, regular breathing at 48, saturation 97% in air, refill 3 seconds, glucose 58. The gap explains the cold neatly, and an explanation that neat is the reason to keep looking rather than to stop.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'actions', progress: 0.4, action: 'recognize-unintentional-neonatal-hypothermia-requiring-qualified-rewarming-without-rate-cause-or-diagnosis-closure',
      narration: 'Rewarm now, and refuse the rate the question is really asking for. A verified axillary 35.5°C after an initially normal value requires immediate qualified rewarming and evaluation. Fast or slow is what everybody asks, and the evidence does not support prescribing one optimal rate — saying so is more useful than picking. Nothing here diagnoses her, and this is not the therapeutic-hypothermia pathway, which is separately protocolized and not authored in this lesson.' };
  }
  if (patient.readinessAtTick === null) {
    return { id: 'readiness', focus: 'actions', progress: 0.56, action: 'review-qualified-neonatal-rewarming-monitoring-glucose-feeding-cause-and-hyperthermia-prevention-boundaries',
      narration: 'Review the warm chain and the harm on the other side of it: warm-chain restoration on the current local protocol, frequent or continuous temperature monitoring, glucose and feeding protection, review of environmental and clinical causes including infection, serial reassessment of the whole newborn, and avoiding hyperthermia. This is the lesson where the correction has a named harm in the opposite direction, which is why the monitoring is part of the treatment rather than a check on it.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'report', focus: 'monitor', progress: 0.76, action: 'review-neonatal-thermoregulation-fixed-forty-five-minute-qualified-report',
      narration: 'Let the authored forty-five minutes pass and read the qualified team’s report. The interval is a contrast rather than a required wait or a promised rewarming time, and nothing here says how fast a real newborn comes up. That is the point rather than an omission.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-neonatal-thermoregulation-temperature-glucose-feeding-infection-neurologic-family-and-outcome-risk',
    narration: 'Axillary 36.3°C, heart rate 134, respiratory rate 44, saturation 97% in air, refill 2 seconds, glucose 64, improved alertness, feeding assessment continuing. She is still below the normal range, so hand off a temperature that is rising and has not arrived, no prescribed and no proven rate, the cause undetermined, infection and other illness unexcluded, and overheating now a risk in the direction of the treatment.' };
}
