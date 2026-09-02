import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { CopdTransitionProgress } from '../copd-exacerbation-transition-reassessment';

export const COPD_TRANSITION_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a recovery that stopped at 30 metres.
 *
 * Her gas is nearly back, her rate is 20, and she speaks in full sentences —
 * and she walked 200 metres before this admission and now stops after thirty
 * with a saturation of 86%. The numbers recovered and the function did not,
 * and it is the function that decides whether going home works. The second
 * refusal is the temptation to settle her oxygen from this snapshot: a
 * desaturation three days into an exacerbation says nothing about what she
 * needs in a month. None of these prompts examines her, delivers treatment or
 * oxygen, selects a regimen, grades an inhaler technique, enrolls her in
 * anything, or guarantees an appointment.
 */
export function copdTransitionInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly copdTransition?: CopdTransitionProgress;
}) {
  const patient = input.copdTransition;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.readinessAtTick === null) return prompt('copd-readiness', true,
    'Start from who she was before this admission, not from today’s numbers.',
    'Independent, walking about 200 metres, resting room-air saturation 92%, no home oxygen. She arrived with a pH of 7.29 and a PaCO₂ of 66 and has had controlled oxygen, bronchodilators, a corticosteroid, an antibiotic and twelve hours of noninvasive ventilation — all correctly given by someone else. Three days later, twenty-four hours off the ventilator, her pH is 7.38 and her PaCO₂ is 54. That is the recovery. The question is whether it reaches back to the person in the first sentence.');
  if (patient.respiratoryNeedsAtTick === null) return prompt('copd-needs', true,
    'Look at the corridor walk before anything else, because that is the answer.',
    'She pauses after thirty metres with marked dyspnea, her saturation falls to 86%, and it takes three minutes at rest to come back to 91%. She walked two hundred metres before this. Symptoms and gas exchange improved; function did not, and function is what decides whether home works. Her oxygen need is unresolved rather than absent — and a desaturation on day three of an exacerbation does not establish long-term oxygen eligibility, which is assessed when she is stable and not now.');
  if (patient.medicationAtTick === null) return prompt('copd-medication', true,
    'Separate what she takes from what she was started on, and finish neither here.',
    'Preadmission tiotropium and rescue salbutamol, no finalized maintenance transition, and no end points set for the acute corticosteroid and antibiotic courses. An experienced respiratory therapist has already found important inhaler-technique errors — which is a finding to carry rather than something to re-grade, and it matters more than any change of drug, because a maintenance inhaler she cannot use is not a maintenance inhaler.');
  if (patient.coordinationAtTick === null) return prompt('copd-coordination', true,
    'Arrange the things that change the next admission rather than this one.',
    'Pulmonary rehabilitation after an exacerbation, self-management planning, comorbidity review, and both early and later respiratory follow-up are all unarranged. These are the parts of this admission most likely to be skipped and most likely to matter, and none of them is guaranteed by naming it: access, appointment timing and the local oxygen-reassessment pathway are all outside this room.');
  return prompt('copd-handoff', true,
    'Hand off a recovery that is real and incomplete.',
    'Nothing here establishes long-term oxygen eligibility, a finalized regimen, a corrected technique, an enrolled rehabilitation place or a guaranteed appointment. What travels is the gap between her numbers and her walking, the unresolved oxygen question and when it should properly be asked, the medication end points nobody has set, the technique errors already found, and the follow-up that has been requested rather than secured.');
}
