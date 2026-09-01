import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { QuietPatientSnapshot } from '@platform/kernel/protocol';

export const QUIET_PATIENT_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link
 * built from a citation is a guess rather than a lookup. The tray already sends
 * a reader to the source view, which shows the declared citations in full.
 */

/**
 * Observed-state guidance for a screen that was never done.
 *
 * A positive screen is not a diagnosis, and the prompts never turn it into one:
 * what the learner has is a result with named components, which is a different
 * and more useful object than a conclusion. They also refuse the sentence that
 * makes this lesson happen — that a quiet patient is a settled one — without
 * substituting a second impression for the first. Three shifts of impressions
 * are not a negative screen, because they are not a screen at all.
 */
export function quietPatientInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly quietPatient?: QuietPatientSnapshot;
}) {
  const patient = input.quietPatient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.impressionsReviewedAtTick === null) return prompt('quiet-patient-impressions', true,
    'Read the last three shifts for what they contain.',
    `${patient.chartedImpressions.length} entries and ${patient.recordedScreenResults} screening results. Every line is an impression, which is why the column looks consistent: it is agreement rather than measurement.`);
  if (patient.screenedAtTick === null) return prompt('quiet-patient-screen', true,
    'Do the screen now, while he is as he is.',
    'Impaired arousal is a scoreable component rather than a reason to come back later. Deferring is the mechanism that produced three shifts without a single result.');
  if (patient.resultRecordedAtTick === null) return prompt('quiet-patient-record', true,
    'Record it as a screening result, with the tool named.',
    'The time it was taken and which components were positive are what make it checkable. It sits alongside the earlier impressions rather than replacing them, because they are evidence of how this happened.');
  if (patient.escalationAtTick === null) return prompt('quiet-patient-escalate', true,
    'Escalate on the result, not on how he seems.',
    'A positive screen with its components is a different object from a worry, and it is the one the reviewer can act on. Give the three shifts of impressions alongside it.');
  if (patient.boundariesReviewedAtTick === null) return prompt('quiet-patient-boundaries', true,
    'Review what this subtype does.',
    'The hypoactive form is about half of cases in reported series and the most frequently missed, because it does not ask for attention. It is regularly read as depression or fatigue, and a screen is what separates them.');
  if (patient.monitoringAtTick === null) return prompt('quiet-patient-monitor', true,
    'Put repeat screening on a schedule, with its reason recorded.',
    'It fluctuates, so one result is a point rather than a line. Left to whoever notices something, screening becomes an impression again.');
  if (!patient.reviewArrived) return prompt('quiet-patient-await', false,
    'Keep to the screening schedule while the review is awaited.',
    'This authored interval predicts no real response time, and a quiet stretch is not evidence of anything either way.');
  if (!patient.reviewObserved) return prompt('quiet-patient-reassess', true,
    'Take a current full assessment now the review has happened.',
    'What travels is a result rather than a conclusion. The screen identifies who needs assessing; it does not make the diagnosis, and neither do you.');
  return prompt('quiet-patient-handoff', false,
    'Hand off the result, the schedule, and the impressions it replaced.',
    'A named cause and a resolved patient are not handoff gates. The next shift needs to know a screen exists now, when the next one is due, and what the record looked like before it.');
}
