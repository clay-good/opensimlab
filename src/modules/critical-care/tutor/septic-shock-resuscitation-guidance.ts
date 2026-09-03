import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { SepticShockResuscitationProgress } from '../septic-shock-resuscitation';

export const SEPTIC_SHOCK_RESUSCITATION_TUTOR_VERSION = '0.1.0';

export interface SepticShockResuscitationPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is the next bolus. Everything about this patient
 * says give more fluid — she is hypotensive, tachycardic, mottled and oliguric
 * two hours into a septic shock — and the fixed dynamic panel says another
 * litre will go into her lungs rather than her circulation. The second reflex
 * is the MAP: 64 has become 68 and nothing else about her has changed, which
 * is why the lesson makes the pressure one signal among six rather than the
 * answer.
 *
 * It is silent on the unassisted setting, silent once the trajectory is
 * reassessed, and silent for any scenario version it was not written against.
 */
export function septicShockResuscitationInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: SepticShockResuscitationProgress },
): SepticShockResuscitationPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.reassessedAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.contextAtTick === null) return prompt('ssr-context', true,
    'Three different things get written down as though they were one. Separate them first.',
    'A sixty-six-year-old woman, two hours after probable ascending cholangitis was recognised. The fixed record reports blood cultures, empiric antimicrobials, 2,100 mL of balanced crystalloid — thirty per kilogram — and running norepinephrine. What was ordered, what was reported delivered, and what response the patient has actually shown are three separate claims, and a resuscitation record that blurs them is how a team ends up believing a patient has had treatment she has not had, or has responded to treatment she has. Her MAP is 64, her rate 118, refill five seconds, mottling to the knees, urine 12 mL/h, attention reduced, and her lactate has gone from 5.8 to 6.4. And the biliary source control has not happened. Start by saying which of those are commands and which are findings.');
  if (patient.perfusionAtTick === null) return prompt('ssr-perfusion', true,
    'Read the pressure as one of six things, not as the result.',
    'The brain: her attention is reduced. The skin: refill of five seconds and mottling reaching the knees. The kidneys: 12 mL/h, which is not a number that tolerates being watched for long. The lactate: rising, 5.8 to 6.4, which is the one that should be loudest, because a lactate going up is not a resuscitation that is nearly there. The gas exchange and respiratory tolerance: 94% on 0.35, a rate of 24, an EtCO2 of 31. And the pressure: 64. Five of those six describe a patient who is not perfusing, and the sixth is the one a MAP target invites you to fix. The reason to say all of this out loud before doing anything is that the next decision is about fluid, and a pressure taken alone will always argue for more of it.');
  if (patient.fluidResponseAtTick === null) return prompt('ssr-fluid', true,
    'Before another bolus, look at what the last ones bought — and where the next one would go.',
    'The fixed passive-leg-raise panel moves her stroke volume from 48 to 49 mL. Two per cent. That is a patient whose circulation has as much volume as it can use, and it is the most useful thing on the screen precisely because everything else about her is still shouting for fluid. The fixed lung panel now shows diffuse B-lines, which is the other half of the same sentence: the volume she has already had has started going somewhere that does not help her, and she is on 0.35 with a respiratory rate of 24. These are her facts rather than universal cutoffs — two per cent is not a threshold and B-lines do not diagnose a phenotype — but in this patient they are enough to make a blind repeat bolus the wrong next move, and this lesson offers you no way to give one.');
  if (patient.planAtTick === null) return prompt('ssr-plan', true,
    'Two things now, and they run alongside each other: individualised support, and the drainage nobody has done.',
    'The support half is a review rather than a prescription — her pressure, her flow, her rhythm, her access and her perfusion, reviewed for this patient, with senior critical-care, nursing, pharmacy and respiratory help called. No dose, no target and no device is selected here, and no drug is delivered. The source-control half is the part that most changes what happens to her: an obstructed, infected biliary tree does not respond to a better vasopressor plan, and antimicrobials cannot reach what is not draining. Two hours have passed and it has not been done. Recording that as urgent, and in parallel with the support, is what stops the hemodynamic work becoming a way to feel busy while the actual problem waits.');
  return prompt('ssr-trajectory', true,
    'Read the ten-minute response, and be honest that almost nothing in it is reassuring.',
    'The fixed response is a MAP of 68 from 64, a rate of 110 from 118, refill four seconds from five, urine unchanged at 12 mL/h, a lactate not yet repeated, an unchanged 94% on an unchanged 0.35, a rate of 23 and an EtCO2 of 33. The pressure and the rate moved a little; the kidney did not move at all, and the number that mattered most has not been rechecked. That is a patient who is still in shock, and calling it a response would be reading two of eight figures. What stays open is everything: the persistent hypoperfusion, the source control, what support she will need, the alternate causes, which organs are failing, whether any of this lasts, and how she does. Nothing here examines her, measures, samples, scans, calculates, diagnoses, prescribes, delivers fluid or a drug, adjusts a device, performs drainage, determines disposition, or predicts outcome.');
}
