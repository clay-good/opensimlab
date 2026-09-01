import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { AnticholinergicProgress } from '../anticholinergic-hyperthermia-delirium';

export const ANTICHOLINERGIC_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a syndrome that is more interesting than it is
 * urgent, next to a temperature that is the reverse.
 *
 * The findings here are the memorable kind — dilated pupils, dry flushed skin,
 * picking at the air, a bladder you can feel — and they are the clues rather
 * than the emergency. The emergency is 40.3°C, and it is the part of this
 * presentation that gets worse the longer anyone spends admiring the rest. So
 * the prompts put cooling ahead of the workup and say why, refuse the four ways
 * this pattern is usually closed early, and keep the absent sweating as the
 * discriminator it is without letting it exclude anything. Physostigmine stays
 * an eligibility question owned by a toxicologist: the narrow QRS is evidence
 * that belongs in that conversation rather than an answer to it. None of them
 * selects a cooling method, fluid, sedative, restraint, catheter, product,
 * dose, or route.
 */
export function anticholinergicInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly anticholinergic?: AnticholinergicProgress;
}) {
  const patient = input.anticholinergic;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('anticholinergic-trajectory', true,
    'Say the temperature first, then the things that are more interesting than it.',
    'Three hours after a benztropine ingestion: severe agitated delirium with picking behavior, dilated pupils, hot dry flushed skin, no sweating, reduced bowel sounds, a palpable bladder and no urine — and a core temperature of 40.3°C. The rest of that list identifies the syndrome. The temperature is the part that is doing harm while you read it.');
  if (patient.recognitionAtTick === null) return prompt('anticholinergic-recognize', true,
    'Name both halves of the pattern, and refuse the four ways it gets closed early.',
    'Central delirium and peripheral dryness, retention and mydriasis are one syndrome, and no single mnemonic, temperature, pupil or dry surface makes the diagnosis or grades her. The absent sweating is the discriminator worth having — it is what separates this from the sympathomimetic bedside next door — but it excludes nothing on its own, and infection, environmental exposure, endocrine causes and coingestion all stay open.');
  if (patient.supportAtTick === null) return prompt('anticholinergic-support', true,
    'Give the cooling an owner before you give the diagnosis any more attention.',
    'At 40.3°C the temperature is time-dependent in a way that the workup is not, and rapid cooling, airway, monitoring, renal and bladder ownership, the poison center and compassionate safety ownership all start together. Studying an interesting syndrome while a patient stays hot is the shape this lesson is about.');
  if (patient.evidenceAtTick === null) return prompt('anticholinergic-evidence', true,
    'Read the ECG, the CK and the retention as three separate risks, and keep the antidote a question.',
    'A QRS of 86 ms with no terminal rightward pattern in aVR is evidence that belongs in the physostigmine conversation rather than an answer to it — eligibility is toxicologist-led and this lesson does not determine it. A CK of 820 with a hot agitated patient is a renal risk rather than a number, and the distended bladder is its own problem. Exposure purity, coingestants and pregnancy status stay qualified-team work.');
  if (patient.reassessmentAtTick === null) return prompt('anticholinergic-observe', false,
    'Record the intents as intents, let the interval pass, and read the 30-minute report.',
    'The interval is a contrast rather than a required wait or a predicted response time. Nothing here says how fast any individual temperature comes down.');
  return prompt('anticholinergic-handoff', true,
    'Hand off a temperature that is lower and a patient who is not out of it.',
    '38.6°C, heart rate 106, calmer but still confused, and the urinary retention has not resolved. None of that proves the cooling did it, that the temperature will stay down, that her kidneys are safe, or that a seizure will not happen. Rebound delirium and hyperthermia, the retention, the CK and renal injury, coingestion, exposure purity and her safety all travel with her.');
}
