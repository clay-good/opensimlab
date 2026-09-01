import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { LastKnownWellSnapshot } from '@platform/kernel/protocol';

export const LAST_KNOWN_WELL_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link
 * built from a citation is a guess rather than a lookup. The tray already sends
 * a reader to the source view, which shows the declared citations in full.
 */

/**
 * Observed-state guidance for a time nobody can supply.
 *
 * There are two ways to make the gap disappear, and both are charting errors:
 * write the uncertain recollection as an onset, or write the bound as one. The
 * prompts never do either, and they never ask anyone to firm the recollection
 * up, because pressing a witness for a time she does not have is how an
 * uncertain memory becomes a fact in a record. They also refuse the opposite
 * error — that an unknown onset means nothing can be offered — without saying
 * what will be offered, which is not this lesson's to decide.
 */
export function lastKnownWellInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly lastKnownWell?: LastKnownWellSnapshot;
}) {
  const patient = input.lastKnownWell;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.1' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.boundRecordedAtTick === null) return prompt('last-known-well-bound', true,
    `Record ${patient.lastKnownWellClock} as a bound, and label it as one.`,
    'It says the deficit began at some point after that, which is true and useful. Written in the onset field it becomes a claim nobody can support.');
  if (patient.recollectionRecordedAtTick === null) return prompt('last-known-well-recollection', true,
    'Record the care assistant’s account in her own words, beside the timeline.',
    'She thinks she said hello at about three and is not certain. Kept beside the record it is what she said; moved into it, an uncertainty becomes a time.');
  if (patient.pathwayActivatedAtTick === null) return prompt('last-known-well-activate', true,
    'Activate on the deficit, not on the clock.',
    'Activation depends on the new focal deficit she was found with. Waiting for the time to firm up is waiting for something that is not going to arrive.');
  if (patient.consequencesRecordedAtTick === null) return prompt('last-known-well-consequences', true,
    'Record what the unknown changes, and what it does not.',
    'It does not change the deficit, the activation, or the observations. It changes which assessments the qualified team will use, and that is the part the next person needs.');
  if (patient.boundariesReviewedAtTick === null) return prompt('last-known-well-boundaries', true,
    'Review what a bound is and what it is not.',
    'An unknown time of onset is a reason to escalate for assessment rather than a reason to stop. What follows from it belongs to the team you are calling.');
  if (patient.monitoringAtTick === null) return prompt('last-known-well-monitor', true,
    'Time every neurological finding from here on.',
    `The ${patient.unwitnessedHours} unwitnessed hours are behind you. The record from this point forward is one you control, and it is the one that will be read alongside the gap.`);
  if (!patient.assessmentArrived) return prompt('last-known-well-await', false,
    'Keep the timed observations going while the assessment is awaited.',
    'This authored interval predicts no real response time, and nothing about the gap will resolve while you wait.');
  if (!patient.assessmentObserved) return prompt('last-known-well-reassess', true,
    'Take a current assessment now the team is here.',
    'They need the deficit as it is now, the bound as a bound, and the recollection as a recollection — three separate things that a single onset time would have flattened into one.');
  return prompt('last-known-well-handoff', false,
    'Hand off the gap as a gap.',
    'A known onset is not a handoff gate and there is not going to be one. What travels is the bound, the account beside it, the activation on the deficit, and the timed findings since.');
}
