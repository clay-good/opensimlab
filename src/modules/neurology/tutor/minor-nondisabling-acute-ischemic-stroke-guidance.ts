import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { MinorStrokeProgress } from '../minor-nondisabling-acute-ischemic-stroke';

export const MINOR_STROKE_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a word that sounds like a measurement.
 *
 * "Minor" is doing an enormous amount of work in this case and none of it is
 * arithmetic. An NIHSS of 1 describes what was found; whether the deficit is
 * disabling is a question about this woman's life — a right-handed retired
 * teacher who writes and uses her phone — and the answer is hers as much as
 * anybody's. It is also explicitly revisable, which makes it a status with an
 * expiry rather than a verdict. So the prompts keep the score away from the
 * decision, read the authored negatives as the snapshots they are, and end on
 * a deficit that persisted without spreading, which is stability rather than
 * recovery. None of them scores her, adjudicates disability, excludes a mimic,
 * or selects a product, combination, dose, duration, or route.
 */
export function minorStrokeInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly minorStroke?: MinorStrokeProgress;
}) {
  const patient = input.minorStroke;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('minor-stroke-trajectory', true,
    'Say what she can still do, not just what she has lost.',
    'Ninety-five minutes ago, mid-conversation and witnessed: persistent numbness of the left cheek and arm, with no weakness, no language or visual loss, no ataxia and no swallowing complaint. She walks, dresses, eats, writes, uses her phone and talks normally. The supplied NIHSS is 1. Both halves of that belong in the same sentence, because the second half is the one the decision turns on.');
  if (patient.threatsAtTick === null) return prompt('minor-stroke-threats', true,
    'Read the imaging and the negatives before you name the boundary.',
    'The fixed CT reports no hemorrhage and no established large infarct, and the CTA reports no large-vessel occlusion or flow-limiting stenosis — which is what the imaging says, not a mechanism. And the authored absences are snapshots taken once: no seizure, no trauma, no fever, no hypoglycemia, no anticoagulant exposure today does not close mimics, etiology, bleeding context or deterioration. A score cannot stand in for any of this.');
  if (patient.boundaryAtTick === null) return prompt('minor-stroke-boundary', true,
    'Call it nondisabling for her, and say the two words that make that honest.',
    'The judgment is not that a sensory deficit is minor in general — it is that this deficit does not disable this woman in the life she actually leads, and that is a conversation with her rather than a number from you. "To date" and "revisable" are the words doing the work: a deficit that is nondisabling this hour can stop being so, and the boundary is written down so it can be revisited rather than settled.');
  if (patient.intentAtTick === null) return prompt('minor-stroke-intent', true,
    'Record the antiplatelet strategy as an intent and the surveillance as a person.',
    'The strategy follows the functional boundary rather than the other way round, and it stays a qualified conversation: no product, combination, dose, duration or route is yours to pick here, and neither thrombolysis nor antiplatelet eligibility is determined by this lesson. Surveillance is the part that has to have a name attached, because the whole boundary depends on somebody noticing if it changes.');
  if (patient.laterAtTick === null) return prompt('minor-stroke-later', false,
    'Record the intents, let the interval pass, and read the later report.',
    'The interval is a contrast rather than a required wait or a predicted trajectory. Nothing here says what any individual deficit does next.');
  return prompt('minor-stroke-handoff', true,
    'Hand off a deficit that stayed the same, and be precise about what that is worth.',
    'The sensory change persists without spread, nothing new has appeared, and the observations are steady. That is a short window of stability — not resolution, not a proven mechanism, not a treatment effect, and not a low recurrence risk. The etiology, the rhythm surveillance, the vascular-risk review, the individualized antithrombotic planning, any rehabilitation need and the recurrence question all travel with her, and so does the fact that the nondisabling boundary can still be revised.');
}
