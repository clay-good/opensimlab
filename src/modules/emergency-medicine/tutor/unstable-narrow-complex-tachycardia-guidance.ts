import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { UnstableNarrowTachycardiaProgress } from '../unstable-narrow-complex-tachycardia';

export const UNSTABLE_NARROW_TACHYCARDIA_TUTOR_VERSION = '0.1.0';

export interface UnstableNarrowTachycardiaPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is the diagnostic detour. A regular narrow-complex
 * tachycardia at 188 invites a mechanism question — is it re-entrant, is it
 * flutter, would adenosine tell me — and this patient is at 76/48 and drowsy,
 * which makes the mechanism question a luxury. Instability converts a rhythm
 * problem into a shock, and there is no control on this screen for adenosine.
 *
 * It is silent on the unassisted setting, silent once the reassessment is
 * recorded, and silent for any scenario version it was not written against.
 */
export function unstableNarrowTachycardiaInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: UnstableNarrowTachycardiaProgress },
): UnstableNarrowTachycardiaPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.reassessedAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.reviewedAtTick === null) return prompt('svt-review', true,
    'Two questions, and only one of them has to be answered now.',
    'Abrupt regular tachycardia at 188 with a QRS of 0.08 second and no clearly visible preceding P waves — narrow and regular. That is the rhythm question, and it is the interesting one. The other question is whether this patient can wait for the answer: blood pressure 76/48, drowsy, ischaemic chest discomfort, cool mottled extremities, delayed capillary refill, SpO₂ 94%, no acute heart failure. He cannot. Instability is what converts this from a rhythm to be characterised into a rhythm to be terminated, and the tachycardia is authored as the cause of that instability rather than a bystander to it. One more thing worth naming: the bedside teaching waveform on this screen does not encode atrial mechanism and is not a diagnostic strip — the twelve-lead is what was read.');

  if (patient.preparedAtTick === null) return prompt('svt-prepare', true,
    'Get the pads on and the people in before you decide to shock.',
    'Confirm the patent airway and breathing, call for help, continuous rhythm, pressure and oximetry monitoring, intravenous access, and the pads placed and the machine ready for a synchronised shock. The engine gates the cardioversion behind this because preparation is where synchronised cardioversion actually goes wrong: the difference between a synchronised shock and an unsynchronised one is a setting somebody has to select and a marker somebody has to see on the complexes, and neither happens while the machine is still in its bag. Note what is deliberately not selected — routine oxygen, because the saturation is 94%. Actual access, pad placement, device operation and synchronisation-marker verification are not simulated.');

  if (patient.cardiovertedAtTick === null) return prompt('svt-cardiovert', true,
    'Shock him. Sedate if you can do it without delay, and not if you cannot.',
    'A prompt synchronised cardioversion intent. The sedation clause is the honest part of that sentence: this is an awake, drowsy, hypotensive patient and shocking him without sedation is genuinely unpleasant, but the drugs that would sedate him also drop a blood pressure that is already 76/48, and finding, drawing up and titrating them takes minutes he is spending in shock. So the rule is sedation if feasible, without delaying the shock — and "if feasible" is a judgement about the next thirty seconds rather than an aspiration. There is no adenosine on this screen, and its absence is deliberate: in an unstable patient the vagal manoeuvre and the drug are the detour. Device-specific energy selection, marker verification, sedation choice or delivery, shock delivery and procedural competence are outside this vignette.');

  return prompt('svt-reassess', true,
    'Let a tick pass, then read the perfusion — and notice what is still unanswered.',
    'Regular sinus rhythm at 92, blood pressure 118/72, alert, the ischaemic discomfort resolving, warm extremities and better capillary refill. As with any rhythm, the rate is the mechanism and the mentation and the skin are the result, so read those first. The reassessment sits one engine tick behind the shock because a rhythm asked about at the instant an intent is recorded reports the clock rather than the patient. And the questions this lesson deliberately leaves open are the ones the stable version of this patient would have started with: what the mechanism actually was, whether it recurs, what medication follows, and whether any of this raises an anticoagulation question. Refractory or recurrent tachycardia, causal investigation, medication therapy, anticoagulation, disposition and outcome remain outside this vignette.');
}
