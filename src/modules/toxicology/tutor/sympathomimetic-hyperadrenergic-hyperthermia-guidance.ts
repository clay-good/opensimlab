import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { SympathomimeticProgress } from '../sympathomimetic-hyperadrenergic-hyperthermia';

export const SYMPATHOMIMETIC_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a frightening room.
 *
 * Two habits go wrong here and they pull in opposite directions. One is to
 * treat the numbers — a pressure of 196/112 and a rate of 150 look like things
 * to be lowered on their own, when both are the surge and the calm is what
 * lowers them. The other is to treat the person as a problem to be controlled,
 * which adds heat and struggle to a man who already has too much of both. So
 * the prompts name the pattern before the room mobilizes, refuse the five ways
 * it gets closed early, and put de-escalation, sedation and cooling in one beat
 * because they are one intervention. None of them selects a restraint, cooling
 * method, fluid, sedative, antihypertensive, product, dose, or route.
 */
export function sympathomimeticInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly sympathomimetic?: SympathomimeticProgress;
}) {
  const patient = input.sympathomimetic;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('sympathomimetic-trajectory', true,
    'Say what is driving all of it, rather than reading the numbers one at a time.',
    'Seventy minutes after a swallowed methamphetamine exposure: fearful hypervigilance, paranoid statements and severe motor agitation, with sweating, wide pupils, warm skin and active bowel sounds. The heart rate of 150, the 196/112 and the 40.4°C are not three problems. They are one surge, and the agitation is part of it rather than a separate behavior.');
  if (patient.recognitionAtTick === null) return prompt('sympathomimetic-recognize', true,
    'Name the pattern before the room mobilizes, and refuse the five ways it gets closed early.',
    'Exposure plus mental state plus autonomic findings are one pattern, and no toxicology screen, pupil, pressure, temperature, pulse or behavior diagnoses or grades him alone. The wet skin and the busy gut with no clonus, no hyperreflexia and no rising tone are the discriminators worth having — they sit between the serotonergic bedside and the dry, quiet anticholinergic one — and they exclude nothing on their own, with head injury, hypoglycemia, infection, withdrawal, environmental exposure and coingestion all still open.');
  if (patient.supportAtTick === null) return prompt('sympathomimetic-support', true,
    'Make the room calmer and cooler in the same beat, and give both an owner.',
    'De-escalation, sedation and rapid cooling are one intervention here rather than three: the calm is what lowers the pressure, the rate and the heat, and prolonged struggle adds to all three. Cardiac, airway, renal, monitoring, psychiatric, the poison center and compassionate safety ownership start together with it. A frightened man is not a security problem.');
  if (patient.evidenceAtTick === null) return prompt('sympathomimetic-evidence', true,
    'Read the acidosis as work he is doing, and keep the pressure attached to the surge.',
    'Lactate 5.2 with bicarbonate 18 and CK 980 is what a fighting, hot patient is putting into the blood, and a creatinine of 1.2 today says nothing about tomorrow. A QRS of 90 ms is not reassurance about what else he took. The pressure belongs to the catecholamines, so it is not a number to be attacked on its own, and specialist adjunct intent for a hyperadrenergic state that persists is not something this lesson determines him eligible for.');
  if (patient.reassessmentAtTick === null) return prompt('sympathomimetic-observe', false,
    'Record the intents as intents, let the interval pass, and read the 30-minute report.',
    'The interval is a contrast rather than a required wait or a predicted response time. Nothing here says how fast any individual pressure, rate, or temperature comes down.');
  return prompt('sympathomimetic-handoff', true,
    'Hand off the man rather than the improved observations.',
    '38.8°C, heart rate 112, 152/88, cooperative and no supplied chest pain or focal deficit. None of that proves the sedation did it, that the pressure or the temperature stays down, that his heart and kidneys came through it, or that a seizure will not happen. Rebound agitation, psychosis and suicidality, ischemia and arrhythmia, the CK and renal injury, coingestion, exposure completeness and his safety all travel with him.');
}
