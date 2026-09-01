import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { AcetaminophenProgress } from '../acetaminophen-clock-and-nomogram';

export const ACETAMINOPHEN_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for the one ingestion the nomogram was actually built
 * for.
 *
 * That is the difficulty, not the relief. A tool that answers cleanly teaches
 * nothing about when it applies, so the prompts spend their weight on the four
 * conditions that make this plot mean anything — a single acute ingestion, a
 * witnessed completion time, an immediate-release product, and a sample drawn
 * at least four hours after — and name what each of them being false would turn
 * this into. They also keep two things that look like reassurance out of the
 * reasoning: the tablet count she reported, which is a story rather than a
 * measurement, and the normal baseline liver panel, which is six hours old in a
 * process that takes longer than that to show. None of them plots, calculates,
 * doses, or stops anything.
 */
export function acetaminophenInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly acetaminophen?: AcetaminophenProgress;
}) {
  const patient = input.acetaminophen;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('acetaminophen-trajectory', true,
    'Fix the product and the clock before anything else, and leave the tablet count out of it.',
    'Immediate-release acetaminophen only, an ingestion witnessed to have finished inside an hour, and exactly six hours since. Those three facts are what the rest of this depends on. How many tablets she thinks she took is a story rather than a measurement, and it is not a treatment guide here.');
  if (patient.recognitionAtTick === null) return prompt('acetaminophen-recognize', true,
    'Ask whether this is the ingestion the nomogram was built for, before you look at where the point lands.',
    'The plot means something only for a single acute ingestion with a known completion time, an immediate-release product, and a sample at least four hours after. Unknown timing, repeated or staggered ingestion, an extended-release product, delayed absorption, a coingestion, or a late presentation each turn it into a different qualified evaluation rather than a lower point on the same graph.');
  if (patient.supportAtTick === null) return prompt('acetaminophen-support', true,
    'Get the owners in place, and count the person among them.',
    'Poison center or medical toxicology, emergency ownership, the laboratory for serial sampling, and continuous monitoring all start together. So does compassionate, nonjudgmental safety ownership: she is a person who has harmed herself, and that part of her care is not a task to be done after the toxicology is settled.');
  if (patient.evidenceAtTick === null) return prompt('acetaminophen-evidence', true,
    'Read the timed level in its context, and refuse the two things that look like good news.',
    '132 µg/mL at six hours sits above the treatment line and below the high-risk line on a qualified plot. The normal AST, ALT and INR are six hours old in an injury that takes longer than that to appear, so they establish a baseline rather than an absence, and a coingestion has not been excluded by anything here.');
  if (patient.reassessmentAtTick === null) return prompt('acetaminophen-observe', false,
    'Record the intent as intent, let the interval pass, and read the 22-hour report.',
    'The interval is a contrast rather than a required wait. Nothing here says how any individual course runs, or how long one lasts.');
  return prompt('acetaminophen-handoff', true,
    'Hand off a set of numbers that got better and a decision nobody here is entitled to make.',
    'Acetaminophen below 10 µg/mL with AST 27, ALT 24 and INR 1.2 at 22 hours does not authorize an automatic 20- or 21-hour stop, prove a treatment effect, or exclude delayed absorption or evolving liver injury. Stopping, continuation, serial testing, coingestion, disposition and her safety all belong to the qualified team, and every one of them travels with her.');
}
