import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { AfRvrProgress } from '../af-rvr';

export const AF_RVR_TUTOR_VERSION = '0.1.0';

export interface AfRvrPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * There is no wrong turn to answer, because this engine case authors none.
 * The number on the monitor is 142 and it pulls hard: the reflex is to treat
 * the rate and consider everything else afterwards. She is stable, which means
 * there is time, and the stroke question is on a different lane from the rate
 * question rather than downstream of it. It is silent on the unassisted
 * setting, silent once the reassessment is recorded, and silent for any
 * scenario version it was not written against.
 */
export function afRvrInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: AfRvrProgress },
): AfRvrPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.reassessmentAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.stabilityAtTick === null) return prompt('af-stability', true,
    'The rate is 142 and she is stable. Both halves of that matter.',
    'A sixty-nine-year-old woman with palpitations she noticed six hours ago. The fixed twelve-lead report names an irregular narrow-complex rhythm at 142 with no pre-excitation and no acute ischemic change — and the absence of pre-excitation is not a detail, because it is what makes the ordinary rate-control thinking safe here rather than dangerous. Now the other half: her pressure is 119/71, her saturation is 97% on air, she is alert and warm, and no hypotension, shock, ischemic discomfort, acute heart failure, syncope or altered mentation is authored. Stable does not mean untreated. It means you have time to get the next decisions right instead of reaching for the fastest one.');
  if (patient.contextAtTick === null) return prompt('af-context', true,
    'Before you touch the rate, find out how long this has been going on.',
    'She noticed the palpitations six hours ago and her last symptom-free check was three days ago. That gap is the single most consequential fact in the consultation, and it means the duration is uncertain rather than six hours — which changes what can safely be done about rhythm later. The rest of the context earns its place too: prior AF, her medications and whether she has been taking them, a fixed ejection fraction of 55%, and the acute contributors that can drive a fast ventricular response rather than being caused by it. Her haemoglobin, potassium, magnesium, TSH and temperature are within the authored ranges, and no infection, alcohol binge, stimulant exposure or medication change is supplied — which narrows without concluding.');
  if (patient.rateIntentAtTick === null) return prompt('af-rate', true,
    'Record what the rate control has to respect, not which drug does it.',
    'What shapes the choice: her haemodynamics, her ventricular function at 55%, the contraindications that apply to her specifically, and how symptomatic she actually is. What this lab does not supply is an agent, a dose, or a universal target number — and the target is genuinely individual, because a resting rate that is right for a symptomatic patient with preserved function is not the same as one chosen for someone else. You select no drug and perform no cardioversion. Note the thing the number invites: treating 142 as the problem, when the rate is a symptom of the rhythm and the rhythm is a symptom of something you have only started to look for.');
  if (patient.strokePreventionAtTick === null) return prompt('af-stroke', true,
    'This is a separate lane. Slowing her heart does not make it safer.',
    'The most common error in this consultation is treating stroke prevention as something that follows rate control, or as something the rate response makes less urgent. It is neither. A slower ventricular rate is a more comfortable patient with exactly the same atrium, and the thromboembolic question is decided by validated risk assessment, her bleeding context and her own preferences — not by whether she now feels better. The uncertain duration comes back here too: it is what makes cardioversion a decision with anticoagulation implications rather than a quick fix. No score is calculated and no anticoagulant is selected in this lab.');
  return prompt('af-reassessment', true,
    'Read the lower rate for what it is, then say who is watching and when.',
    'The fixed later report is a rate response, and a rate response is not a resolved rhythm, a settled duration, a made stroke-prevention decision or an identified cause. What the record needs is the monitoring, the triggers that would change the plan — recurrence, symptoms, a rate that climbs again, any of the instability that is absent now — who owns the medication decisions and the anticoagulation review, and when she is next seen. Nothing here acquires or interprets an ECG or test, calculates a score, diagnoses, prescribes or delivers medication, selects a rate or rhythm agent, performs cardioversion, determines disposition, or predicts an outcome.');
}
