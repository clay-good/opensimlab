import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { CerebellarIchProgress } from '../spontaneous-cerebellar-intracerebral-hemorrhage';

export const CEREBELLAR_ICH_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a patient who looks well and cannot sit up.
 *
 * Everything reassuring here is a timestamp. She is awake and oriented, the
 * volume is small by supratentorial standards, and the first scan says no
 * hydrocephalus, no brainstem compression, no herniation — all true at that
 * minute and none of it a forecast. What the scan does say is that eleven
 * millilitres of blood sits in a closed box with the fourth ventricle already
 * effaced, and in the posterior fossa the location is the risk rather than the
 * volume. So the prompts read the negatives as a clock reading, escalate while
 * she still looks well, and keep the cough as the airway warning it becomes.
 * None of them measures a hematoma, determines an etiology or a reversal
 * eligibility, or selects a drug, dose, pressure target, airway, drain, or
 * operation.
 */
export function cerebellarIchInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly cerebellarIch?: CerebellarIchProgress;
}) {
  const patient = input.cerebellarIch;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('cerebellar-ich-trajectory', true,
    'Say that she is fully alert and cannot sit up, and let the second half carry the weight.',
    'Seventy-five minutes ago: witnessed abrupt vertigo, vomiting, dysarthria and severe truncal ataxia, in a previously independent 67-year-old. She is awake, oriented and conversational — and she cannot sit or stand unsupported. An intact conversation is the most reassuring thing at this bedside and the least predictive; being unable to hold your own trunk up is the finding that says where the problem is.');
  if (patient.imagingAtTick === null) return prompt('cerebellar-ich-imaging', true,
    'Read the scan before you decide what this is, because the syndrome does not tell you.',
    'Vertigo with ataxia is a cerebellar syndrome, and that is as far as the bedside gets you — the CT is what makes it eleven millilitres of blood rather than an infarct, and blood changes who is called and what happens next. The report also gives the fact that matters more than the volume: the fourth ventricle is already effaced. In the posterior fossa the box is small and the brainstem is next door, so a number that would be modest above the tentorium is not modest here.');
  if (patient.boundaryAtTick === null) return prompt('cerebellar-ich-boundary', true,
    'Name the escalation boundary now, while she still looks well.',
    'The first scan reports no hydrocephalus, no brainstem compression and no herniation — read those as a clock reading rather than a reassurance, because they describe one minute and nothing else. A confined posterior-fossa hemorrhage with an effaced fourth ventricle in an alert patient is exactly the moment the boundary is meant to be named, not the moment to wait for it to declare itself.');
  if (patient.ownershipAtTick === null) return prompt('cerebellar-ich-ownership', true,
    'Get neurosurgery, neurocritical care and an airway-capable owner involved before anything changes.',
    'This is the escalation that has to happen while the patient still looks like she does not need it, because in the posterior fossa the interval between looking well and being obstructed is short and one-directional. Her cough is present now and the vomiting is recurrent; airway capability belongs alongside the surgical conversation rather than after it. Nothing about a drain, an operation or an airway is decided here — those stay with the people being called.');
  if (patient.laterAtTick === null) return prompt('cerebellar-ich-later', false,
    'Record the ownership, let the interval pass, and read the repeat report.',
    'The interval is a contrast rather than a required wait or a predicted trajectory. Nothing here says what any individual hemorrhage does next.');
  return prompt('cerebellar-ich-handoff', true,
    'Hand off a patient who has already changed, and name what changed first.',
    'Fourteen millilitres now, with new obstructive hydrocephalus and brainstem compression, and she is drowsy after more vomiting with a weaker cough. The alertness went before the airway did, which is the order this lesson is about. Nothing proves the cause, nothing excludes further expansion or herniation, and nothing here protects her airway beyond this snapshot — the imaging trajectory, the etiology, the antithrombotic question, the pressure, the airway and the surgical decision all travel with her.');
}
