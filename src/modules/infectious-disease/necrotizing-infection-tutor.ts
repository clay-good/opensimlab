import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { NecrotizingInfectionSnapshot } from '@platform/kernel/protocol';

export const NECROTIZING_INFECTION_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link
 * built from a citation is a guess rather than a lookup. The tray already sends
 * a reader to the source view, which shows the declared citations in full.
 */

/**
 * Observed-state guidance for a score that cannot exclude.
 *
 * Three of the refused shortcuts are the same error with different instruments:
 * a laboratory score, an absent physical sign, and an image, each read as a
 * rule-out. The prompts answer each with its own sensitivity rather than with
 * alarm, because the sensitivities are the whole argument. They also never
 * assert the diagnosis — nothing here confirms it, and exploration is what would
 * — and they never let the antimicrobial intent stand in for the surgical
 * review, which is the substitution the lesson is built around.
 */
export function necrotizingInfectionInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly necrotizingInfection?: NecrotizingInfectionSnapshot;
}) {
  const patient = input.necrotizingInfection;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.recognitionAtTick === null) return prompt('necrotizing-recognize', true,
    'Record the pain that runs past the visible edge.',
    'Severe pain extending beyond the erythema, in a limb that has not settled on treatment, is the finding worth acting on. It is a reason to look harder rather than a diagnosis.');
  if (patient.marginMarkedAtTick === null) return prompt('necrotizing-margin', true,
    'Mark the border and write the time on the skin.',
    'It costs nothing and needs no equipment, and it converts a static impression into a rate. Without it, the next person inherits an opinion instead of a measurement.');
  if (patient.surgeryAtTick === null) return prompt('necrotizing-surgery', true,
    'Request urgent surgical review, and say what the concern is.',
    'A request that describes cellulitis not settling will be read as cellulitis not settling. Naming the possibility is what gets the right person to the bedside.');
  if (patient.antimicrobialIntentAtTick === null) return prompt('necrotizing-intent', true,
    'Record antimicrobial intent alongside the surgical review, not instead of it.',
    'No agent, dose, or route is chosen here. The point of recording it beside the referral is that the drug does not replace the exploration.');
  if (patient.boundariesReviewedAtTick === null) return prompt('necrotizing-boundaries', true,
    'Review what each instrument can and cannot do.',
    'The laboratory score sits near two-thirds sensitive, so about one confirmed case in three falls below its cutoff. Crepitus and bullae are roughly a quarter and a fifth sensitive — they rule in and rule out nothing. Imaging is not exclusionary and must not delay exploration.');
  if (patient.monitoringAtTick === null) return prompt('necrotizing-monitor', true,
    'Recheck the marked border on a stated interval.',
    'A laboratory result or a glance at the limb is useful and does not refresh the rate. The mark and the clock are what make progression visible.');
  if (patient.progressionDueInSeconds !== null) return prompt('necrotizing-observe', false,
    'Keep watching while the authored interval runs.',
    'It is a contrast rather than a real progression rate, and nothing about the referral needs restating while it passes.');
  if (!patient.progressionObserved) return prompt('necrotizing-reassess', true,
    'Take a current full assessment against the mark.',
    'Where the erythema sits relative to the line you drew is the measurement. Elapsed time on its own is not an observation of anything.');
  return prompt('necrotizing-handoff', false,
    'Hand off the concern with the rate you measured.',
    'A score below the cutoff and an unremarkable image are not handoff gates and cannot close this. What travels is the pain out of proportion, the marked border with its times, and that surgical review is requested.');
}
