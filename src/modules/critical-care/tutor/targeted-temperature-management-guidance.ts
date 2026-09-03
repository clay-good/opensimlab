import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { TargetedTemperatureManagementProgress } from '../targeted-temperature-management';

export const TARGETED_TEMPERATURE_MANAGEMENT_TUTOR_VERSION = '0.1.0';

export interface TargetedTemperatureManagementPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is the remembered number. A generation learned
 * "cool to 33" and the engine records a range of 32 to 37.5 with nothing in it
 * declared superior, which turns the decision from picking a figure into
 * controlling temperature deliberately and not letting her get hot. The second
 * reflex is the one that ends careers of thought early: reading an unresponsive
 * post-arrest patient's examination as a prognosis at thirty-two minutes.
 *
 * It is silent on the unassisted setting, silent once the trajectory is
 * reassessed, and silent for any scenario version it was not written against.
 */
export function targetedTemperatureManagementInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: TargetedTemperatureManagementProgress },
): TargetedTemperatureManagementPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.reassessmentAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.recognitionAtTick === null) return prompt('ttm-recognize', true,
    'She is unresponsive and getting hotter. Both halves of that need a decision.',
    'A sixty-one-year-old woman, thirty-two minutes from ROSC after a witnessed VF arrest, not following commands, core temperature 38.3 and rising. Not following commands is what makes her eligible for deliberate temperature control; it is not what tells you how she does. Thirty-two minutes after an arrest, the examination is the least reliable thing in the room, and treating it as a prognosis is the way this goes wrong quietly. The rising temperature is the other half and it is not incidental — fever after an arrest is a load on a brain that has just been without blood. Post-arrest, cardiac, neurology, nursing, pharmacy and the temperature-control team get called, because this is a protocol rather than a manoeuvre.');
  if (patient.contextAtTick === null) return prompt('ttm-context', true,
    'Look at all of it, and refuse to let any one sign mean something on its own.',
    'No command following, pupils equal and reactive, no clinical or electrographic seizure, a perfusing sinus rhythm, MAP 68 on reported support, bilateral ventilation, saturation 96%, EtCO2 36, no external bleeding, urine 20 mL an hour, lactate 5.1, and a cause evaluation still running. Take them together: the lactate and the oliguria are the arrest still being paid for, the reactive pupils are reassuring and prove nothing, and the absent seizures are worth knowing because a seizing brain is a hotter brain. The discipline in this step is the last clause — no isolated sign is used for prognosis, and the temptation to build one out of a good pupil or a bad examination is exactly what the next few days are for instead.');
  if (patient.protocolAtTick === null) return prompt('ttm-protocol', true,
    'Pick a range and commit to controlling it — not a number you remember.',
    'The protocol is a temperature held between 32 and 37.5 for at least thirty-six hours, and nothing inside that range is treated as universally superior. If you learned "cool to 33", that is the thing to notice: the evidence moved, and what survived it is that deliberate temperature control and the avoidance of fever matter, while the specific figure inside the range is a local, individualized choice. So the decision here is not which number — it is that her temperature is going to be actively controlled rather than allowed to drift up, and that the choice belongs to a protocol rather than to whoever is at the bedside. No device, fluid, medication, target-selection rule or outcome benefit is selected or simulated here.');
  if (patient.guardrailsAtTick === null) return prompt('ttm-guardrails', true,
    'The guardrails are where temperature control actually gets dangerous.',
    'Continuous core temperature, because intermittent measurement of a controlled variable is not control. Then shivering and the sedation it drags in, ventilation, oxygenation, perfusion, rhythm, electrolytes, glucose, skin and the device itself, and the organs. Two things are named because they are the classic harms: routine rapid cold intravenous fluid loading is not selected, since it is a large volume into a heart that just arrested, and rewarming faster than 0.5°C an hour is avoided, because coming back up too quickly undoes the point of having gone down and provokes exactly the instability you were managing. Nothing is measured, given, warmed, cooled or treated on this screen.');
  return prompt('ttm-reassess', true,
    'She is 37.4 and inside the range. Be careful what that is and is not.',
    'Forty-five minutes on: core temperature 37.4 within the selected range, MAP 70, heart rate 92, saturation 97%, EtCO2 36. She still does not follow commands, and that is the number most likely to be misread — it is the same finding it was at the start, at a moment far too early for it to mean anything about her recovery. What the response says is that the temperature is currently where the protocol wants it. Durability, shivering, the cause of the arrest, seizures, cardiac function, organ recovery, neurologic recovery, neuroprognostication and outcome are all still open. Nothing here measures, cools, warms, doses, delivers, diagnoses, determines disposition, or predicts outcome.');
}
