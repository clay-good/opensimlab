import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { DeliriumProgress } from '../acute-delirium-reversible-causes';

export const DELIRIUM_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a diagnosis that lives in the baseline.
 *
 * Everything turns on who she was this morning. An eighty-two-year-old with
 * fluctuating confusion is read as dementia unless somebody establishes that
 * she was managing her own medicines and finances and conversing normally at
 * eight o'clock — and the person who can say so is her daughter. The other
 * thing this lesson refuses is a single cause: the six-hour review finds a
 * bladder holding 690 mL, an antihistamine given eight hours before the first
 * change, poor intake, movement pain, broken sleep and hearing aids in a
 * drawer. None of those is the cause and all of them are contributors. So the
 * prompts anchor on the baseline, keep the withdrawn periods inside the
 * diagnosis rather than outside it, and keep safety least-restrictive. None of
 * them scores her, assesses capacity, selects a restraint or an observation
 * level, or chooses a drug.
 */
export function deliriumInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly delirium?: DeliriumProgress;
}) {
  const patient = input.delirium;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('delirium-trajectory', true,
    'Start with who she was at eight this morning, and let her daughter tell you.',
    'Independently living, managing her own medicines and finances, conversing normally, with no diagnosed cognitive disorder — confirmed by family for eight o\'clock today. Ten hours later she alternates between withdrawal with slow responses and restless periods pulling at the bed linen, and twice pointed at children she believed were in the room. The withdrawn stretches are part of this rather than the quiet in between it, which is the half that gets recorded as settled.');
  if (patient.recognitionAtTick === null) return prompt('delirium-recognition', true,
    'Name delirium against that baseline, and refuse both easy closures.',
    'A 4AT of 8 from the recorded fluctuation, attention failure and orientation errors supports the assessment a qualified clinician has already made — it is not a diagnosis you calculate, a severity scale, a cause finder, a capacity test, or a dementia label. And it is not one cause either: infection, respiratory, circulatory, metabolic, medication, pain, urinary, bowel, neurological, psychiatric and environmental contributors all stay open for serial review.');
  if (patient.ownershipAtTick === null) return prompt('delirium-ownership', true,
    'Bring in the people whose work actually treats this, and that is mostly not medical.',
    'Nursing, pharmacy, family, falls, capacity, mobility, pain, nutrition, bladder, bowel, sensory, sleep and safeguarding ownership are the intervention here — the medicine review, the familiar face, the hearing aids, the walk to the toilet. Her daughter is part of the care rather than a visitor, because familiar reorientation from someone she knows does something no member of staff can.');
  if (patient.boundaryAtTick === null) return prompt('delirium-boundary', true,
    'Work the ordinary contributors, and keep safety least-restrictive.',
    'Oxygenation, infection, hydration, medicines, pain, retention, constipation, nutrition, sensory aids, sleep and mobility are the list, and the environment is part of it: consistency, reassurance, and a room that is easier to understand. Her hearing aids are in the bedside drawer. De-escalation and least-restrictive safety come before anything else — you are selecting no restraint, no observation level and no drug.');
  if (patient.laterAtTick === null) return prompt('delirium-later', false,
    'Record the boundaries, let the interval pass, and read the 6-hour report.',
    'The interval is a contrast rather than a required wait or a predicted trajectory. Nothing here says what any individual patient recovers.');
  return prompt('delirium-handoff', true,
    'Hand off six contributors and no cause.',
    'The review found 690 mL in her bladder before the team drained it, diphenhydramine 25 mg given eight hours before the first recorded change, poor oral intake, movement-related pain, fragmented sleep and the hearing aids still out of her ears. She now recognizes her daughter and the hospital and still loses the task after three months backward. That is improvement without resolution: no single cause, no proven treatment effect, no recovered baseline and no capacity conclusion. The causes, the capacity question, the safety, the medicines, the function, the recurrence risk and the follow-up all travel with her.');
}
