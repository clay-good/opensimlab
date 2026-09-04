import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { NecrotizingInfectionSnapshot } from '@platform/kernel/protocol';
import { supportsNecrotizingInfection, type NecrotizingInfectionAction } from '../necrotizing-infection';

export const NECROTIZING_INFECTION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsNecrotizingInfectionDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsNecrotizingInfection(scenario);
}

export interface NecrotizingInfectionDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: NecrotizingInfectionAction; readonly finished?: boolean;
}

/**
 * The worked example for a score that cannot exclude.
 *
 * The example requests surgical review before the limb has progressed, which is
 * the only place the decision is actually hard: afterwards it is obvious, and an
 * example that waited for the progression would be demonstrating hindsight. It
 * never asserts the diagnosis, because nothing here confirms one and exploration
 * is what would, and it never lets the antimicrobial intent stand in for the
 * referral.
 */
export function necrotizingInfectionDemonstrationStep(
  patient?: NecrotizingInfectionSnapshot,
): NecrotizingInfectionDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'The concern travels with a measured rate rather than an impression, and the review was asked for before the limb made the case for it. Nothing was diagnosed here; exploration is what would do that. This ends the example, not the illness.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'actions', progress: 0.08, action: 'recognize-disproportionate-pain',
      narration: 'Record the pain that runs past the visible edge of the redness, in a limb that has not settled on treatment. That is the finding worth acting on, and it is a reason to look harder rather than a diagnosis.' };
  }
  if (patient.marginMarkedAtTick === null) {
    return { id: 'margin', focus: 'actions', progress: 0.22, action: 'mark-the-margin',
      narration: 'Mark the border of the erythema and write the time on the skin. It costs nothing and needs no equipment, and it turns a static impression into a rate that the next person can read.' };
  }
  if (patient.surgeryAtTick === null) {
    return { id: 'surgery', focus: 'actions', progress: 0.38, action: 'call-surgery',
      narration: 'Request urgent surgical review now, before the limb has made the case for you, and say what the concern is. A request describing cellulitis that is not settling gets read as cellulitis that is not settling.' };
  }
  if (patient.antimicrobialIntentAtTick === null) {
    return { id: 'intent', focus: 'actions', progress: 0.52, action: 'record-antimicrobial-intent',
      narration: 'Record antimicrobial intent alongside the review rather than instead of it. No agent, dose, or route is chosen here, and the reason it sits beside the referral is that the drug does not replace the exploration.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.64, action: 'review-boundaries',
      narration: 'Review what each instrument can do. The laboratory score is near two-thirds sensitive, so roughly one confirmed case in three falls below its cutoff; crepitus and bullae are about a quarter and a fifth sensitive, ruling in and never out; imaging is not exclusionary and must not delay exploration.' };
  }
  if (patient.monitoringAtTick === null) {
    return { id: 'monitor', focus: 'actions', progress: 0.74, action: 'monitor',
      narration: 'Recheck the marked border on a stated interval. A laboratory result or a glance at the limb is useful and does not refresh the rate; the mark and the clock are what make progression visible.' };
  }
  if (patient.progressionDueInSeconds !== null) {
    return { id: 'observe', focus: 'monitor', progress: 0.84,
      narration: 'Keep watching while the authored interval runs. It is a contrast rather than a real progression rate, and the referral does not need restating while it passes.' };
  }
  if (!patient.progressionObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.9, action: 'reassess',
      narration: 'Take a current assessment against the mark. Where the erythema sits relative to the line you drew is the measurement, and elapsed time on its own observes nothing.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: 'Hand off the concern with the rate you measured, the marked border and its times, and the review already requested. A score below the cutoff and an unremarkable image were never able to close this.' };
}
