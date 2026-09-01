import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { CalciumChannelBlockerProgress } from '../calcium-channel-blocker-shock';

export const CALCIUM_CHANNEL_BLOCKER_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a shock with two mechanisms and a clock that has
 * not finished running.
 *
 * The beta-blocker lesson next door is a pump problem. This one is a pump
 * problem and a tone problem at once — poor global contraction with warm
 * extremities and low vascular resistance — so answering either half alone
 * leaves the other, and capturing the block electrically leaves both. The
 * prompts refuse glucose-only, pulse-only and pacing-only closure in the same
 * breath, keep the hyperglycemia as a supporting finding rather than a grade,
 * and hold on to the detail that decides how this evening goes: the product is
 * extended release and the ingestion was five hours ago, so absorption is not
 * over and the worst of it may still be ahead. None of them selects a product,
 * dose, rate, target, access, airway, pacing, decontamination, lipid, methylene
 * blue, or extracorporeal support.
 */
export function calciumChannelBlockerInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly calciumChannelBlocker?: CalciumChannelBlockerProgress;
}) {
  const patient = input.calciumChannelBlocker;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('calcium-channel-blocker-trajectory', true,
    'Say the word “extended release” out loud, with the clock beside it.',
    'Five hours after an extended-release diltiazem ingestion, drowsy, MAP 47, an escape rhythm at 34 and warm extremities. The formulation is not a detail of the history — it is the reason nothing here can be assumed to have peaked, and the quantity and coingestants are still qualified-team work.');
  if (patient.recognitionAtTick === null) return prompt('calcium-channel-blocker-recognize', true,
    'Name this as two problems at once, before you read another number.',
    'Poor global contraction and low systemic vascular tone are both present, so answering either half alone leaves the other, and pacing the complete block would capture the rhythm while leaving both. The glucose of 238 supports the pattern rather than grading him. Closing on the glucose, on the pulse, or on the block is the same mistake three ways.');
  if (patient.supportAtTick === null) return prompt('calcium-channel-blocker-support', true,
    'Build a room for a long night rather than for the next fifteen minutes.',
    'Poison center or medical toxicology, emergency and critical care, nursing and pharmacy for infusions that will need titrating, cardiac and perfusion owners, someone watching the glucose and potassium, an airway-capable clinician, and compassionate nonjudgmental safety ownership. Atropine and an initial vasopressor have already been tried without success, and the drug is still being absorbed.');
  if (patient.evidenceAtTick === null) return prompt('calcium-channel-blocker-evidence', true,
    'Read the contractility and the tone as separate findings, and put the absorption clock next to both.',
    'Complete AV block with an atrial rate of 78, QRS 104 ms, poor global contraction, low vascular tone, glucose 238, lactate 4.6, pH 7.29. That atropine and a first vasopressor failed is information rather than a gap. An extended-release preparation five hours in means the dose is still arriving, so what refractory rescue would mean and who decides it belongs here rather than at the arrest.');
  if (patient.reassessmentAtTick === null) return prompt('calcium-channel-blocker-observe', false,
    'Record the intents as intents, let the interval pass, and read the 45-minute report.',
    'The interval is a contrast rather than a required wait or a predicted response time. Nothing here says how any individual poisoning answers.');
  return prompt('calcium-channel-blocker-handoff', true,
    'Hand off a good forty-five minutes in the middle of an ingestion that is still arriving.',
    'Sinus at 64, MAP 71, lactate 3.0, clearer mentation — none of which proves the treatment did it or that the perfusion will hold. The glucose of 176 and the potassium of 3.4 are the therapy showing up in the chart. And the absorption is not complete, so recurrent shock, returning AV block, the electrolytes, volume overload, the rescue question and his safety all travel with him.');
}
