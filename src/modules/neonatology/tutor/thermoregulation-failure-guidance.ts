import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { ThermoregulationProgress } from '../thermoregulation-failure';

export const THERMOREGULATION_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a question the evidence declines to answer.
 *
 * Everyone asks whether to rewarm quickly or slowly, and the evidence does not
 * support prescribing one optimal rate. Saying so is harder than picking, so
 * these prompts say it and then give what the guidance does settle: restore the
 * warm chain on the current local protocol, monitor frequently or continuously,
 * protect glucose and feeding, review environmental *and* clinical causes
 * including infection, and avoid hyperthermia — the one lesson here where the
 * treatment has a named harm in the opposite direction. The cold has an
 * available explanation in the transfer gap, which is exactly what makes an
 * illness easy to miss underneath it. None of these prompts warms, cools, uses
 * skin-to-skin, operates a device, or selects a set point.
 */
export function thermoregulationInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly thermoregulation?: ThermoregulationProgress;
}) {
  const patient = input.thermoregulation;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.supportAtTick === null) return prompt('thermoregulation-support', true,
    'Confirm the thermal, glucose and feeding pathways together.',
    'A trained newborn team, the local thermal and glucose pathway, feeding and respiratory and escalation support, the shared clock, communication, dignity, follow-up ownership, and a parent distressed that her newborn became cold. At 2.4 kg and 35 weeks the cold, the glucose and the feed are one problem, and splitting them across three people who are not talking is how the second one gets missed.');
  if (patient.contextAtTick === null) return prompt('thermoregulation-context', true,
    'Read the trajectory, and notice how good the available explanation is.',
    'Three hours old at thirty-five weeks and four days, admission axillary 36.6°C, then a transfer and a warming-continuity gap, then a repeated verified 35.5°C, with sleepiness, a feed she cannot sustain, glucose 58, and everything else unremarkable. The gap explains the cold neatly. An explanation that neat is the reason to keep looking rather than to stop.');
  if (patient.recognitionAtTick === null) return prompt('thermoregulation-recognize', true,
    'Rewarm now, and refuse the rate the question is really asking for.',
    'A verified axillary 35.5°C after an initially normal value requires immediate qualified rewarming and evaluation. Fast or slow is the question everybody asks, and the evidence does not support prescribing one optimal rate; saying so is more useful than picking. Nothing here diagnoses her, and this is not the therapeutic-hypothermia pathway, which is separately protocolized and not authored in this lesson.');
  if (patient.readinessAtTick === null) return prompt('thermoregulation-readiness', true,
    'Review the warm chain, and the harm on the other side of it.',
    'Warm-chain restoration on the current local protocol, frequent or continuous temperature monitoring, glucose and feeding protection, review of environmental and clinical causes including infection, serial reassessment of the whole newborn — and avoiding hyperthermia. This is the lesson where the correction has a named harm in the opposite direction, which is why the monitoring is part of the treatment rather than a check on it.');
  if (patient.reassessmentAtTick === null) return prompt('thermoregulation-observe', false,
    'Let the authored interval pass, then read the qualified team’s report.',
    'Forty-five minutes is a contrast rather than a required wait or a promised rewarming time. Nothing here says how fast a real newborn comes up, and that is the point rather than an omission.');
  return prompt('thermoregulation-handoff', true,
    'Hand off a temperature that is rising and has not arrived.',
    'Axillary 36.3°C, heart rate 134, rate 44, refill 2 seconds, glucose 64, more alert, feeding assessment continuing. She is still below the normal range, no rate was prescribed and none was proven, the cause is undetermined, infection and other illness are unexcluded, and overheating is now a risk in the direction of the treatment.');
}
