import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { ExertionalHeatStrokeProgress } from '../exertional-heat-stroke';

export const EXERTIONAL_HEAT_STROKE_TUTOR_VERSION = '0.1.0';

export interface ExertionalHeatStrokePrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is sequence, again, but with a different cost.
 * A collapsed, confused patient triggers a well-drilled routine — airway,
 * access, monitor, bloods, imaging — and in this one diagnosis every minute
 * that routine occupies is a minute at 41°C. Cooling is not something you do
 * after resuscitating; here it is the resuscitation, and the engine records the
 * support bundle explicitly as parallel to it.
 *
 * It is silent on the unassisted setting, silent once surveillance is recorded,
 * and silent for any scenario version it was not written against.
 */
export function exertionalHeatStrokeInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: ExertionalHeatStrokeProgress },
): ExertionalHeatStrokePrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.surveillanceAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.patternReviewedAtTick === null) return prompt('heat-pattern', true,
    'Two findings make the diagnosis, and one of them depends entirely on where you measured.',
    'Exertional collapse in heat with agitation, confusion and incoherent speech — central nervous system dysfunction — plus a core temperature of 41.3°C. That is the definition, and the word core is load-bearing: an oral, tympanic, temporal or axillary reading in a hot, sweating, vasodilated runner can read whole degrees low, which is how this diagnosis gets missed by someone who did measure a temperature. Rectal is the number that counts. The glucose of 110 and the sodium of 139 are the two cheap answers that would have changed everything if they had been different — exercise-associated hyponatraemia collapses runners too and is treated in the opposite direction. No trauma, seizure, focal deficit, infection, stimulant exposure or rigidity is authored. This screen does not examine, measure, test, or exclude real mimics.');

  if (patient.supportAtTick === null) return prompt('heat-support', true,
    'Do the support — and understand that it runs alongside cooling, not before it.',
    'Emergency activation, airway, breathing and circulation support, monitoring, the glucose you already have, insulating clothing off, the cooling team assembling, and transport organised around cooling rather than instead of it. This is the step where the lesson lives, because a collapsed confused patient triggers a routine that everyone here is good at: secure, monitor, cannulate, bloods, scan. In this one diagnosis, every minute that routine owns is a minute of brain and gut and muscle at 41 degrees, and the outcome tracks the time above roughly 40 more closely than it tracks anything else you will do today. The engine records this bundle explicitly as not delaying active cooling. Equipment, airway care, and team performance are not simulated.');

  if (patient.coolingAtTick === null) return prompt('heat-cooling', true,
    'Immerse her now, in cold water, with the thermometer still in.',
    'Whole-body cold-water immersion is the fastest cooling method available and nothing else is close — evaporative fanning and ice packs to the groin and axillae are what you use when immersion is impossible, not a gentler equivalent. Cool first and transport second: an ambulance is a much worse place to cool someone than a tub is, so the transport gets organised around the cooling rather than interrupting it. Two things stay attached throughout — airway access, because she is confused and going into water, and continuous rectal core monitoring, because you cannot know when to stop without it. Setup, water temperature, immersion technique, cooling rate, airway safety and transport are not simulated; this records an intent.');

  if (patient.targetAtTick === null) return prompt('heat-target', true,
    'Read the panel and stop the cooling. Stopping is a decision, not an omission.',
    'Fourteen minutes in: rectal core 38.9°C, heart rate 118, blood pressure 104/62, coherent short answers with residual fatigue. Active cooling comes off below 39 rather than at normal, because the body has thermal inertia and a tub does not stop working the moment you decide it has — chase 37 and you arrive at hypothermia, which in a patient whose clotting is already at risk is a real complication rather than a tidy number. These are authored findings: no cooling rate is modelled and nothing here predicts what an individual would do.');

  return prompt('heat-surveillance', true,
    'The temperature is fixed. She is not. Hand over what you are watching for, and what you are not giving.',
    'Serial neurologic, renal, hepatic, coagulation, creatine-kinase, electrolyte, glucose, urine-output and temperature surveillance — because the heat injury declares itself over hours to days, and a patient who is cool and talking can still be heading for rhabdomyolysis, acute kidney injury, transaminitis or disseminated intravascular coagulation. Two things are explicitly not on this path, and the reasons are worth keeping. Antipyretics do nothing, because the hypothalamic set point was never raised — this is not fever, it is a body that could not shed the heat it made. And dantrolene is for malignant hyperthermia, a different mechanism entirely, with no evidence of benefit here. Tests, fluids, procedures, later injury, disposition, recovery and outcome are outside this lesson.');
}
