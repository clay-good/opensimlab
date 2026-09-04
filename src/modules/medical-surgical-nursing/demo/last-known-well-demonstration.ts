import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { LastKnownWellSnapshot } from '@platform/kernel/protocol';
import { supportsLastKnownWell, type LastKnownWellAction } from '../last-known-well';

export const LAST_KNOWN_WELL_DEMONSTRATION_VERSION = '0.1.0';

export function supportsLastKnownWellDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.1' && supportsLastKnownWell(scenario);
}

export interface LastKnownWellDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: LastKnownWellAction; readonly finished?: boolean;
}

/**
 * The worked example for a time nobody can supply.
 *
 * The example never produces the missing time, which is the hardest thing for a
 * demonstration to do: the form wants a resolution and this one ends with the
 * gap still open. Both ways of closing it are charting errors — the uncertain
 * recollection written as an onset, or the bound written as one — and neither
 * appears here. It also says nothing about what treatment will follow, because
 * that decision belongs to the team being called.
 */
export function lastKnownWellDemonstrationStep(patient?: LastKnownWellSnapshot): LastKnownWellDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'The gap is handed on as a gap: a bound labelled as a bound, an account kept beside it, activation made on the deficit, and every finding since timed. No onset was ever produced, because there was none to produce. This ends the example, not the assessment.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.boundRecordedAtTick === null) {
    return { id: 'bound', focus: 'actions', progress: 0.08, action: 'record-last-known-well',
      narration: `Record ${patient.lastKnownWellClock} as a bound and label it as one: the deficit began at some point after that. True and useful there; in the onset field it would be a claim nobody can support.` };
  }
  if (patient.recollectionRecordedAtTick === null) {
    return { id: 'recollection', focus: 'actions', progress: 0.22, action: 'record-the-uncertain-recollection',
      narration: 'Record the care assistant’s account in her own words and in its own field: she thinks she said hello at about three, and is not certain. Beside the timeline it stays what she said. Inside it, an uncertainty becomes a time.' };
  }
  if (patient.pathwayActivatedAtTick === null) {
    return { id: 'activate', focus: 'actions', progress: 0.38, action: 'activate-the-stroke-pathway',
      narration: 'Activate on the deficit rather than on the clock. She was found with a new focal deficit, and that is what activation depends on — waiting for the time to firm up is waiting for something that will not arrive.' };
  }
  if (patient.consequencesRecordedAtTick === null) {
    return { id: 'consequences', focus: 'actions', progress: 0.52, action: 'record-what-the-unknown-changes',
      narration: 'Record what the unknown changes and what it does not. It does not change the deficit, the activation, or the observations. It changes which assessments the qualified team will use to decide, and that is what the next person needs to know.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.64, action: 'review-boundaries',
      narration: 'Review what a bound is. An unknown time of onset is a reason to escalate for assessment rather than a reason to stop, and what follows from it belongs to the team being called rather than to this bedside.' };
  }
  if (patient.monitoringAtTick === null) {
    return { id: 'monitor', focus: 'actions', progress: 0.74, action: 'monitor',
      narration: `Time every neurological finding from here. The ${patient.unwitnessedHours} unwitnessed hours are behind you; the record from this point forward is the one you control, and it will be read alongside the gap.` };
  }
  if (!patient.assessmentArrived && !patient.recollectionPressed) {
    return { id: 'await', focus: 'monitor', progress: 0.82,
      narration: 'Keep the timed observations going while the assessment is awaited. This authored interval predicts no real response time, and nothing about the gap is going to resolve while you wait.' };
  }
  if (!patient.assessmentArrived) {
    // Its own beat, because watching the record hold is the teaching moment.
    return { id: 'pressed', focus: 'monitor', progress: 0.87,
      narration: 'Someone presses the care assistant to pin the time down, and she offers three, or maybe closer to two, and says she would not want to swear to it. Pressing an uncertain recollection does not make it certain. It makes the person saying it less willing to keep calling it uncertain, so the record stays as she first gave it.' };
  }
  if (!patient.assessmentObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.92, action: 'reassess',
      narration: 'Take a current assessment now the team is here. They record the last documented interaction as a bound, note the recollection separately and as uncertain, and proceed on imaging-based assessment rather than a remembered clock time. Their eligibility decision is theirs.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: 'Hand off the bound, the account beside it, the activation made on the deficit, and the timed findings since. A known onset was never the gate, and there was never going to be one.' };
}
