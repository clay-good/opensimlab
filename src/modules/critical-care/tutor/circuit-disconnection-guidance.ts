import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { CircuitDisconnectionProgress } from '../circuit-disconnection';

export const CIRCUIT_DISCONNECTION_TUTOR_VERSION = '0.1.0';

export interface CircuitDisconnectionPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is fixing the thing that is broken. The answer
 * here is genuinely a disconnected circuit and reconnecting it is genuinely the
 * treatment — and a learner who goes straight there leaves a patient with no
 * delivered ventilation while they hunt for the join. The bridge comes second
 * for that reason: troubleshooting happens while he is being oxygenated, not
 * instead of it.
 *
 * It is silent on the unassisted setting, silent once the response is
 * reassessed, and silent for any scenario version it was not written against.
 */
export function circuitDisconnectionInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: CircuitDisconnectionProgress },
): CircuitDisconnectionPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.reassessedAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.recognizedAtTick === null) return prompt('vcd-recognize', true,
    'The settings are unchanged and nothing is being delivered. Say the second half out loud.',
    'The ventilator is still commanded to volume control, 420 mL, 20 a minute, PEEP 8, oxygen at 0.45 — and the exhaled tidal volume and minute ventilation are zero, the airway pressure and measured PEEP have collapsed to zero, and the capnogram is absent. Those are two different facts and only the second one is about the patient. What makes this recognition rather than an alarm is that four independent signals agree: the exhaled volume, the pressure, the capnogram and a coherent pleth showing the saturation falling from 96% to 88%, in a patient making no spontaneous effort. The tube depth and securement are unchanged, which matters because it starts to separate this from a displaced airway. Name it as lost delivered ventilation — not as a disconnect, which is a conclusion you have not yet earned.');
  if (patient.bridgedAtTick === null) return prompt('vcd-bridge', true,
    'Call for help and get oxygen into him now — before you go looking for the join.',
    'This is the step the lesson exists for, and it is the one everybody skips. The cause here really is a disconnected circuit and reconnecting it really is the fix, which is exactly why the pull to go straight there is so strong. But he has no delivered ventilation and a falling saturation, and the seconds spent tracing a circuit are seconds he is not being ventilated. Alternative oxygenation and ventilation intent gets recorded now, without waiting for a final device label, and respiratory therapy and senior ICU help are called at the same time. The engine refuses the inspection until this is done, which is the whole argument made structural.');
  if (patient.inspectedAtTick === null) return prompt('vcd-inspect', true,
    'Now trace it, patient first and machine last, and keep the other causes open.',
    'The patient, the pleth and the pulse; the airway and the capnography; the commanded breaths against the exhaled ones; the pressure; the circuit from the patient end back to the ventilator, including filters and accessories; then the ventilator and the gas source. The direction matters — starting at the machine is how a team spends a minute on a device that is working perfectly. And the alternatives stay open while you trace: a displaced or obstructed tube, a pneumothorax, an equipment failure, apnoea, and a monitor failure would each produce some of this picture, and the fixed review is what localizes a complete circuit discontinuity rather than an assumption. You inspect nothing physically here; this is a review of what the panel reports.');
  if (patient.restoredAtTick === null) return prompt('vcd-restore', true,
    'Reconnect and put him back on the support he was on.',
    'Restoration is two things rather than one: continuity of the circuit, and the established support that was already commanded — the settings never changed, so there is nothing to invent here and nothing to improve while you are at it. It follows the bridge and the source-to-patient check for a reason that is now obvious: reconnecting a circuit you have not traced can reconnect it to a second problem, and reconnecting before he was oxygenated would have been the same mistake in a different order. You handle no equipment and reconnect nothing yourself; the intent is what is recorded.');
  return prompt('vcd-reassess', true,
    'One alarm going quiet is not proof. Make the system show you a delivered breath.',
    'The fixed two-minute response is an exhaled tidal volume of 410 mL, minute ventilation 8.2 L/min, a peak pressure of 27, PEEP 8, an end-tidal of 36 with a continuous waveform, 94% on the unchanged 0.45, 98 and MAP 77. Every one of those is doing a job: exhaled volume and minute ventilation prove gas moved, the pressure and PEEP prove the circuit holds, the continuous capnogram proves it reached his lungs and is coming back, and the saturation and circulation prove it reached the rest of him. Closure requires the whole system to answer, because an alarm that has stopped sounding tells you only that a threshold is no longer being crossed. And the numbers are this patient\'s: the alarm timing, the reserve and the response are authored and do not transfer. Nothing here examines him, acquires monitoring, handles equipment or the airway, ventilates, delivers oxygen or a drug, diagnoses, determines disposition, or predicts outcome.');
}
