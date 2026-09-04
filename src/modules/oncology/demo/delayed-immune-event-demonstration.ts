import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { DelayedImmuneEventSnapshot } from '@platform/kernel/protocol';
import { supportsDelayedImmuneEvent, type DelayedImmuneEventAction } from '../delayed-immune-event';

export const DELAYED_IMMUNE_EVENT_DEMONSTRATION_VERSION = '0.1.0';

export function supportsDelayedImmuneEventDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsDelayedImmuneEvent(scenario);
}

export interface DelayedImmuneEventDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: DelayedImmuneEventAction; readonly finished?: boolean;
}

/**
 * The worked example, driven by the snapshot rather than by a script of ticks.
 *
 * It walks the expert fixture's order, and the order is the lesson: the exposure
 * is recorded before anything else, because every later step depends on having
 * asked a question the current medication list does not answer. The two waits are
 * narrated as authored contrasts, not as clinical waiting — this lesson refuses
 * waiting for stool results before escalating, and an example that made waiting
 * look virtuous would teach the thing the scenario refuses.
 */
export function delayedImmuneEventDemonstrationStep(
  patient?: DelayedImmuneEventSnapshot,
): DelayedImmuneEventDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'The exposure, the course against baseline, the concurrent infection evaluation and the bounded intent are handed over with the diagnosis and the grade still open. This ends the example, not the need for care.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.exposureRecordedAtTick === null) {
    return { id: 'exposure', focus: 'actions', progress: 0.05, action: 'record-the-completed-exposure',
      narration: 'Record the completed exposure as current history. The medication list is not wrong; it is answering a different question. Four cycles finished 22 weeks ago, which is why the list dropped it and why the referral letter never carried it.' };
  }
  if (patient.courseRecordedAtTick === null) {
    return { id: 'course', focus: 'actions', progress: 0.15, action: 'record-the-symptom-course',
      narration: 'Record the course against this patient’s own baseline: three weeks of climbing frequency, now seven above their normal, cramping, no blood reported. A count without a baseline decides nothing.' };
  }
  if (patient.infectionEvaluationAtTick === null) {
    return { id: 'infection', focus: 'actions', progress: 0.25, action: 'record-infection-evaluation-in-parallel',
      narration: 'Record infection evaluation as running alongside rather than ahead. Guidance seeks other causes while treatment for an immune-related event is initiated as clinically appropriate. Sequencing them would turn a concurrent evaluation into a delay.' };
  }
  if (!patient.courseProgressed) {
    return { id: 'observe-course', focus: 'monitor', progress: 0.35,
      narration: 'Nothing declares itself here. The observations stay unremarkable while the count climbs, which is the ordinary way this presents rather than a reassurance. This 45-minute contrast is authored, not a required clinical wait; pause freely.' };
  }
  if (patient.escalationAtTick === null) {
    return { id: 'escalate', focus: 'actions', progress: 0.45, action: 'escalate-to-the-treating-service',
      narration: 'Contact the service that gave the drug, stating the exposure, the course and the eighth stool together. This is not asking permission to treat. It is returning the problem to the people holding the treatment record, which is the step that has not happened in three weeks.' };
  }
  if (patient.treatmentIntentAtTick === null) {
    return { id: 'intent', focus: 'actions', progress: 0.58, action: 'record-bounded-treatment-intent',
      narration: 'Record bounded intent and administer nothing. Whether corticosteroid treatment begins, at what grade, and whether endoscopy follows are the qualified team’s decisions. No drug, dose, route, or threshold is chosen here, and none is displayed.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.68, action: 'review-boundaries',
      narration: 'Review what the supplied evidence can carry. Twenty-three collected cases give a median off-treatment interval, not an incidence: they cannot say how often this happens or how likely it is here, and the fatality figures quoted for the class came from a different drug.' };
  }
  if (patient.observation === null) {
    return { id: 'assess', focus: 'actions', progress: 0.78, action: 'reassess',
      narration: 'Take a current full assessment rather than a partial check. Observations alone supply no history and a history check supplies no observations; the handoff needs both, together and current.' };
  }
  if (!patient.serviceResponded) {
    return { id: 'observe-service', focus: 'monitor', progress: 0.85,
      narration: 'Wait for the service that was contacted. Nobody arrives uncontacted in this lesson, because the failure it teaches is that the exposure never reached them. This authored interval establishes no diagnosis, grade, or response.' };
  }
  if (!patient.serviceObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.92, action: 'reassess',
      narration: 'Take a fresh assessment now the service has answered and confirmed the cycles and the interval from their own records. The earlier assessment predates their answer, and a handoff carrying a stale picture asks the receiving team to act on findings nobody has just looked at.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: 'Hand off with the diagnosis and the grade open. What travels is the exposure with its interval, the course against baseline, that infection evaluation runs alongside, that the treating service was contacted and answered, and the bounded intent. A confirmed grade, a negative stool result, and an endoscopy are not handoff gates.' };
}
