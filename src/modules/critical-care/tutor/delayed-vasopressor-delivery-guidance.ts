import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { DelayedVasopressorDeliveryProgress } from '../delayed-vasopressor-delivery';

export const DELAYED_VASOPRESSOR_DELIVERY_TUTOR_VERSION = '0.1.0';

export interface DelayedVasopressorDeliveryPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is trusting the display. The pump says RUNNING,
 * so the drug is going in — and the whole lesson is that RUNNING is a claim
 * about a motor, not about a patient. The second reflex is the fix that hurts:
 * once you know the drug is sitting in the tubing, the obvious move is to push
 * it, and pushing it is a concentrated vasopressor bolus into a woman with a
 * MAP of 54.
 *
 * It is silent on the unassisted setting, silent once the response is
 * reassessed, and silent for any scenario version it was not written against.
 */
export function delayedVasopressorDeliveryInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: DelayedVasopressorDeliveryProgress },
): DelayedVasopressorDeliveryPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.reassessedAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.discordanceAtTick === null) return prompt('dvd-discordance', true,
    'The pump says RUNNING. Notice that this is a claim about a motor.',
    'A fifty-eight-year-old woman in septic shock, six minutes into a new vasopressor at 1 mL/h, and nothing has moved: MAP 54, heart rate 124, refill 5 seconds, urine 8 mL/h, mottling above the knees, lactate 5.6. The display and the patient disagree, and the temptation is to explain that away — she is very sick, the dose is low, give it time. Hold the four states apart instead, because the engine does: the pump has a command, the line has transit, the patient has delivery, and the circulation has effect. Any one of those can be true while the next is not. Six minutes of an unchanged number is not a patient failing to respond until you have shown the drug arrived.');
  if (patient.pathAtTick === null) return prompt('dvd-path', true,
    'Follow the drug from the syringe to her, and name every part it passes.',
    'The labeled syringe, the pump fit and its event log, the tubing\'s compliance and resistance, the valves and connectors, the mixing point, the 0.6 mL of drug-free volume downstream of it, the 2 mL/h carrier, the stopcock\'s state and level, the dedicated lumen, the occlusion status. That 0.6 mL is the number to sit with: at 1 mL/h plus a 2 mL/h carrier, a drug-free downstream segment is a transit time, and it is on the order of the six minutes you have been watching. Startup mechanics add to it — syringe and plunger compliance mean a pump at a low rate can be turning without yet having pushed a full column. None of this is inspected or touched here. It is reviewed, from the record.');
  if (patient.classifiedAtTick === null) return prompt('dvd-classify', true,
    'Name the pattern, and say out loud what it does not exclude.',
    'The record supports delayed patient delivery from dead-space transit and startup mechanics. That is a good fit, and a good fit is exactly when a list gets abandoned. Keep it open: wrong drug, wrong concentration, wrong rate, wrong route, lost access, occlusion, extravasation, incompatibility at the mixing point, a pump fault, shock that is simply changing, and measurement error in the pressure you are trusting. This step is a classification, not a diagnosis, and nothing here calculates a transit time at the bedside.');
  if (patient.protocolAtTick === null) return prompt('dvd-protocol', true,
    'Get the people and the local protocol — and do not push what is in the line.',
    'Bedside nursing, pharmacy and critical care, and whatever your own device-specific safe-start or changeover procedure is, because the correct manoeuvre depends on the pump and the set in front of you and cannot be recited from here. The guardrail is the reason this step is separate: once you know a dead-space segment is holding concentrated vasopressor, flushing or purging it becomes the obvious fix, and it is an uncontrolled bolus into a woman with a MAP of 54. No programming, no line manipulation, no flush, no bolus, no prescription and no drug happens on this screen.');
  return prompt('dvd-reassess', true,
    'Read the delivery evidence and the perfusion as two separate answers.',
    'The fixed response is documented drug arrival, MAP 67, heart rate 108, refill 3 seconds, EtCO2 32, SpO2 unchanged at 95% on 0.40, temperature 38.9. The first of those is the one this lesson was about: the delivery is now evidenced rather than assumed. The rest is a better half-hour, not a treated shock — the source, the dose adequacy, whether this line stays reliable, the later perfusion and the outcome are all still open. Nothing here inspects, measures, calculates, primes, purges, flushes, boluses, programs, prescribes, compounds or delivers anything; manipulates equipment; diagnoses her shock; determines disposition; or predicts how she does.');
}
