import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { MeningococcalSepsisSnapshot } from '@platform/kernel/protocol';

export const MENINGOCOCCAL_SEPSIS_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link
 * built from a citation is a guess rather than a lookup. The tray already sends
 * a reader to the source view, which shows the declared citations in full.
 */

/**
 * Observed-state guidance for a presentation that will not wait for a result.
 *
 * Both refused shortcuts here are exclusions offered by a number or a history:
 * an unimpressive C-reactive protein and a low white cell count, and a
 * vaccination that does not cover the serogroup in question. The prompts refuse
 * both without ever asserting the diagnosis, because recognition of a pattern is
 * not confirmation of it and this lesson never confirms. They also select no
 * agent, dose, route, or rate — what is recorded here is intent, and the
 * escalation for attendance stays unavailable until the authored review has
 * actually shown an inadequate response.
 */
export function meningococcalSepsisInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly meningococcalSepsis?: MeningococcalSepsisSnapshot;
}) {
  const patient = input.meningococcalSepsis;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.rashRecognizedAtTick === null) return prompt('meningococcal-rash', true,
    'Record the pattern you can see, as a pattern.',
    'A non-blanching rash with lesions over 2 mm in a febrile, poorly perfused young person is a strongly suspected presentation. Recognition is not a diagnosis, and it is not waiting for one either.');
  if (patient.seniorAtTick === null) return prompt('meningococcal-senior', true,
    'Give a senior decision maker ownership of this now.',
    'Urgent assessment, the alternative diagnoses, and the antimicrobial decision belong to one person who knows about it. Naming them is the fastest thing on this list.');
  if (patient.bloodsAtTick === null) return prompt('meningococcal-bloods', true,
    'Request the blood sampling alongside everything else, not before it.',
    'Culture, gas with lactate and glucose, counts, clotting, and the molecular tests are requested in parallel. None of them is a gate on the treatment intent that follows.');
  if (patient.antimicrobialIntentAtTick === null) return prompt('meningococcal-antimicrobial', true,
    'Record bounded antimicrobial intent for delivery within the hour.',
    'The intent is what the qualified team acts on. No agent, dose, route, dilution, or infusion is chosen here, and none needs to be for the clock to start.');
  if (patient.fluidIntentAtTick === null) return prompt('meningococcal-fluid', true,
    'Record fluid intent together with the critical-care referral.',
    'Central access and vasoactive support are decisions for the team you are referring to. Recording the referral with the intent is what puts the question in front of them.');
  if (patient.boundariesReviewedAtTick === null) return prompt('meningococcal-boundaries', true,
    'Review what cannot exclude this.',
    'An unimpressive C-reactive protein, procalcitonin, or white cell count does not rule it out — those markers lag, and a low count can be the illness rather than its absence. Prior MenACWY does not cover serogroup B.');
  if (patient.monitoringAtTick === null) return prompt('meningococcal-monitor', true,
    'Set the observation frequency and the conscious level with it.',
    'Continuous or at least half-hourly, with a track-and-trigger tool. A laboratory-only or perfusion-only look is not the same as watching the patient.');
  if (patient.responseDueInSeconds !== null) return prompt('meningococcal-observe', false,
    'Keep watching while the authored review interval runs.',
    'This interval is a contrast rather than a real response time, and nothing about the intent needs restating while it runs.');
  if (!patient.treatedResponseObserved && !patient.incompleteResponseObserved
    && !patient.attendanceResponseObserved) return prompt('meningococcal-reassess', true,
    'Take a current full assessment.',
    'Requests and elapsed time are not an observed response. The comparison that matters is the perfusion and conscious level in front of you now.');
  if (patient.incompleteResponseObserved && patient.consultantAtTick === null) {
    return prompt('meningococcal-consultant', true,
      'Alert a consultant to attend in person.',
      'The hour has passed and the response is inadequate — that specific finding is what this escalation answers, which is why it was not available before.');
  }
  return prompt('meningococcal-handoff', false,
    'Hand off the suspicion with what has not been excluded.',
    'A confirmed organism and a corrected lactate are not handoff gates. What travels is the recognized pattern, the recorded intents, the markers that cannot rule it out, and the response as observed.');
}
