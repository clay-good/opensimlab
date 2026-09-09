import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { RisingRequirementSnapshot } from '@platform/kernel/protocol';
import { supportsRisingRequirement, type RisingRequirementAction } from '../rising-requirement';

export const RISING_REQUIREMENT_DEMONSTRATION_VERSION = '0.1.0';

export function supportsRisingRequirementDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsRisingRequirement(scenario);
}

export interface RisingRequirementDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: RisingRequirementAction; readonly finished?: boolean;
}

/**
 * The worked example for a limb whose only moving finding is the requirement.
 *
 * It calls the team before seeking any further number, and it never names the diagnosis. The
 * example that would teach the wrong thing here is one that waits for a measurement to justify
 * the call, because the interval spent waiting is where this is missed.
 */
export function risingRequirementDemonstrationStep(
  patient?: RisingRequirementSnapshot,
): RisingRequirementDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'The clock and the direction are handed on, with the decision owned by the team that can act on it and nothing about the diagnosis settled here. This ends the example, not his night.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.injuryRecordedAtTick === null) {
    return { id: 'clock', focus: 'actions', progress: 0.08, action: 'record-the-injury-and-the-clock',
      narration: `Start the record with the clock. A closed tibial fracture ${patient.hoursSinceInjury} hours ago, in a cast. Everything that follows is a judgement about elapsed time, so the elapsed time goes in first where the next person will see it.` };
  }
  if (patient.requirementRecordedAtTick === null) {
    return { id: 'requirement', focus: 'actions', progress: 0.20, action: 'record-the-rising-requirement',
      narration: `Now the one thing that is moving: ${patient.analgesiaRequests} requests for more analgesia, each sooner than the last, with pain on passive extension of the toes. Recorded as a direction and an interval, because pain after a fracture is ordinary and a requirement climbing every hour is not.` };
  }
  if (patient.pressureLimitsRecordedAtTick === null) {
    return { id: 'reading', focus: 'actions', progress: 0.32, action: 'record-what-one-pressure-cannot-decide',
      narration: `The reading of ${patient.singlePressureMmHg}, written down as what it is. In 116 monitored fractures, 53 passed an absolute 30 mmHg in twelve hours and three had the syndrome. The quantity that discriminated was the differential against diastolic, followed continuously. One number, taken once, is neither of those.` };
  }
  if (patient.escalationAtTick === null) {
    return { id: 'escalate', focus: 'actions', progress: 0.46, action: 'escalate-to-the-surgical-team',
      narration: 'Call them now, before any further measurement. The at-risk limb, the requirement climbing, the hours since injury. Not a request for permission and not a request for a number — the number is theirs to arrange, and waiting for it only spends the interval this is missed in.' };
  }
  if (patient.decompressionIntentAtTick === null) {
    return { id: 'intent', focus: 'actions', progress: 0.58, action: 'record-bounded-decompression-intent',
      narration: 'Record bounded intent and do nothing. Repeat assessment, continuous measurement rather than one reading, and any decision to decompress belong to them.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.68, action: 'review-boundaries',
      narration: 'Review how each measure fails. Clinical findings: sensitivity 13 to 19 percent, so they miss most cases, but specificity and negative predictive value 97 to 98, so their absence is worth a lot. Absolute pressure: over-calls badly. Continuous differential in 850 fractures: 94 percent sensitive, 98 specific. Tibial-fracture data, from single centres, and none of it says wait.' };
  }
  if (!patient.worsened) {
    return { id: 'observe', focus: 'monitor', progress: 0.78,
      narration: 'Watch what does not change. The pulse stays easy to feel, the foot stays warm, the refill stays under two seconds, and every monitored number stays where it started. None of that is reassurance — it is what this diagnosis looks like while it is happening.' };
  }
  if (!patient.teamResponded) {
    return { id: 'hold', focus: 'monitor', progress: 0.87,
      narration: 'A fourth request, and passive extension now stops him mid-sentence. The foot is still warm and the pulse is still there. That combination is the whole lesson: the limb is reporting through the one channel no monitor carries.' };
  }
  if (!patient.teamObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.93, action: 'reassess',
      narration: 'Take a current assessment now they have answered and confirmed the fracture and its timing from their own record. They act on the trend rather than one measurement, and the trend is what your record now holds.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: 'Hand off the clock and the direction. A confirmed diagnosis, a repeat pressure and a decision about theatre are not handoff gates. What travels is the hours on the limb, the requirement climbing through them, and what one reading could not settle.' };
}
