import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { BetaBlockerProgress } from '../beta-blocker-cardiogenic-shock';

export const BETA_BLOCKER_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a shock whose most visible number is not the one
 * that matters.
 *
 * A rate of 42 invites a rate answer, and the prompts spend their weight on why
 * that is the wrong end of the problem: the reduced global contraction and the
 * lactate say this is a pump failing rather than a clock running slow, and
 * atropine and an initial vasopressor have already been tried by the treating
 * team and have already failed. They keep the glucose of 62 attached to the
 * poisoning rather than treated as an incidental, and then name the awkward
 * thing about the treatment — that a high-dose-insulin approach makes glucose
 * and potassium surveillance part of the therapy rather than a check on it.
 * None of them selects a product, dose, rate, target, access, airway, pacing,
 * dialysis, lipid, or extracorporeal support.
 */
export function betaBlockerInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly betaBlocker?: BetaBlockerProgress;
}) {
  const patient = input.betaBlocker;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('beta-blocker-trajectory', true,
    'Say the pressure, the mentation and the glucose out loud, not just the rate.',
    'Two hours after immediate-release metoprolol, drowsy but arousable, MAP 51, and a glucose of 62. The rate of 42 is the number everyone will say first. It is one of five findings here, and the quantity and the coingestants are still qualified-team work.');
  if (patient.recognitionAtTick === null) return prompt('beta-blocker-recognize', true,
    'Name this as shock rather than as bradycardia.',
    'Globally reduced left ventricular contraction with a lactate of 3.8 is a pump that is not moving blood, not a clock running slow. Closing on the pulse — or on pacing — answers the visible half and leaves the half that is killing her. A low glucose belongs to this poisoning rather than beside it, and the phenotype, coingestants and prior care all stay coupled.');
  if (patient.supportAtTick === null) return prompt('beta-blocker-support', true,
    'Assemble for a shock that is expected to be difficult.',
    'Poison center or medical toxicology, emergency and critical care, nursing and pharmacy for the infusions this will take, cardiac and perfusion owners, someone watching the glucose, an airway-capable clinician, and compassionate nonjudgmental safety ownership. The treating team has already tried atropine and an initial vasopressor without success, which is the reason to build the room now rather than to try the next single thing.');
  if (patient.evidenceAtTick === null) return prompt('beta-blocker-evidence', true,
    'Read the contractility, the glucose and the failed prior care together, and say what the treatment will do to the numbers.',
    'PR 220 ms with a narrow QRS, poor global contraction, glucose 62, lactate 3.8, pH 7.31. That atropine and a first vasopressor did not fix it is information rather than a gap. And a high-dose-insulin approach inverts the metabolic picture: glucose and potassium surveillance becomes part of the treatment rather than a check on it. What refractory rescue would mean, and who decides, belongs here rather than at the arrest.');
  if (patient.reassessmentAtTick === null) return prompt('beta-blocker-observe', false,
    'Record the intents as intents, let the interval pass, and read the 45-minute report.',
    'The interval is a contrast rather than a required wait or a predicted response time. Nothing here says how any individual poisoning answers.');
  return prompt('beta-blocker-handoff', true,
    'Hand off a better pressure and the two numbers now moving because of the treatment.',
    'HR 58, MAP 73, clearer mentation, lactate 2.8 — none of which proves the treatment did it or that the perfusion will hold. The glucose is 104 and the potassium has fallen to 3.5, and both of those are the therapy showing up in the chart. Recurrent shock, bradycardia, AV block, hypoglycemia, hypokalemia, volume overload, the rescue question and her safety all travel with her.');
}
