import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { PediatricFebrileSeizureProgress } from '../pediatric-febrile-seizure';

export const PEDIATRIC_FEBRILE_SEIZURE_TUTOR_VERSION = '0.1.0';

export interface PediatricFebrileSeizurePrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * There is no wrong turn to answer, because this engine case authors none.
 * Every other lesson in this module has to stop a learner from under-reacting;
 * this one has to stop the opposite. A well-looking toddler after a first
 * three-minute febrile convulsion invites two errors at once — reassuring the
 * family that this was nothing, and going after him with tests he does not
 * need. "Simple features to date" is a claim about now, and it is the strongest
 * one available. Care and safety review are unordered, so there is a beat for
 * each of the three ways that pair can be half done. It is silent on the
 * unassisted setting, silent once the handoff is recorded, and silent for any
 * scenario version it was not written against.
 */
export function pediatricFebrileSeizureInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: PediatricFebrileSeizureProgress },
): PediatricFebrileSeizurePrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('pfs-trajectory', true,
    'Read the event, then read the child in front of you.',
    'A previously well, developmentally typical two-year-old, 12 kg, immunizations current including Hib and pneumococcal. Twelve hours of fever, rhinorrhea and slightly less drinking, then a first bilateral generalized convulsion of about three minutes, witnessed by his caregiver, which stopped on its own before this surface opened. No rescue medicine was given, and no focal onset, asymmetry or recurrence is reported. Now: sleepy and clingy, but he opens his eyes to his caregiver\'s voice, makes eye contact, cries appropriately, and moves and reaches symmetrically. Temperature 39.0°C, heart rate 150, saturation 98% on air, refill two seconds. Note what you were not given — no routine glucose, no other test — because that absence is deliberate rather than an oversight.');
  if (patient.recognitionAtTick === null) return prompt('pfs-recognition', true,
    'Say the careful version: simple features to date.',
    'That phrase is doing real work, and both halves matter. The features are simple so far — generalized, about three minutes, one event, a child recovering in front of you — which is what makes an aggressive workup the wrong reflex here. And "to date" is not a formality: it does not settle the fever source, and it does not exclude central-nervous-system infection, serious infection, another seizure cause, deterioration or recurrence during this illness. The authored absences — no nonblanching rash, no meningism, no bulging fontanelle, no persistent focal deficit, no shock, no trauma, no known ingestion, no prior afebrile seizure, no developmental regression — are fixed snapshots of this minute. You are not diagnosing or classifying anything.');
  if (patient.careAtTick === null && patient.safetyAtTick === null) return prompt('pfs-parallel', true,
    'Two things run together: looking after him, and keeping looking.',
    'Start with the care ownership. Experienced pediatric and nursing teams take comfort, hydration and intake context, observation, repeated whole-child and neurological reassessment, airway and recurrence contingencies, fever-source evaluation, escalation, and the conversation with his caregiver. Two things this lesson will not let you reach for: an antipyretic may be considered by that team for distress, and it does not prevent febrile seizures; routine prophylactic antiseizure medicine is not modeled here at all. You choose no drug, dose, route, fluid, device or test.');
  if (patient.careAtTick === null) return prompt('pfs-care', true,
    'The red flags are being watched. Nobody is looking after him.',
    'Reviewing the dangerous alternatives was right, and it is surveillance rather than care. Activating ownership means experienced pediatric and nursing teams take the comfort, the hydration and intake, the observation, the repeated whole-child and neurological reassessment, the airway and recurrence contingencies, the fever-source evaluation, and the caregiver conversation — which for a family who has just watched their two-year-old convulse is not a footnote to the medicine, it is part of it.');
  if (patient.safetyAtTick === null) return prompt('pfs-safety', true,
    'He is being looked after. Now keep the dangerous things open.',
    'This is the half that reassurance closes too early. Experienced teams keep serial appearance and interaction, neurological state, meningism and focal findings, breathing, circulation, hydration, rash, the fever source, immunization and medicine context, recurrence, the triggers that would make this prolonged or focal, and infection, ingestion, trauma and metabolic alternatives. Current negative findings are snapshots and not permanent exclusions — a child who looks well at minute ten can look different at minute forty, which is the entire reason somebody keeps watching rather than deciding.');
  if (patient.laterResponseAtTick === null) return prompt('pfs-later', true,
    'Let time pass, then check him again rather than concluding.',
    'The fixed later report has him awake and interactive, recognizing his caregiver, using age-appropriate words and play, moving and reaching symmetrically, mildly tired, with no recurrent seizure and no focal finding. Temperature 38.7°C, heart rate 126, saturation 99%, refill two seconds. That is a genuinely reassuring half-hour and it is worth saying to the family. It still does not finally prove a simple or benign event, does not establish the fever source, does not exclude central-nervous-system or serious infection, does not prove durable recovery, and does not rule out another seizure during this illness. Reassurance with boundaries is more useful to this family than reassurance without them.');
  return prompt('pfs-handoff', true,
    'Hand off the safety net, not a verdict.',
    'What travels is the event and its description — first, generalized, about three minutes, stopped on its own, no rescue medicine — the recovery from it and the later checkpoint, the fever and its unidentified source, the immunization context, the pattern described as simple features to date rather than as a diagnosis, what stays open including CNS and serious infection, recurrence during this illness and complex features, who owns the observation and how often, and the caregiver guidance: what to watch for, what to do if it happens again, and that this is frightening to see and does not mean what people fear it means. Nothing here claims a diagnosis, a cause, an exclusion, durable recovery, freedom from recurrence, disposition, prognosis or outcome.');
}
