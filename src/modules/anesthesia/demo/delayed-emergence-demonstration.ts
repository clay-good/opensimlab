import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsDelayedEmergenceDifferential } from '../delayed-emergence-differential';

/**
 * What this worked example reads.
 *
 * The seventeenth observed-state demonstration in the anaesthesia module and the
 * third to read an assessment sidecar. It is also the longest: five beats, each
 * gated on the previous step's tick being recorded, which is the shape the
 * engine's own order enforcement produces for free.
 */
export interface DelayedEmergenceProgress {
  readonly supportReviewedAtTick: number | null;
  readonly exposureReviewedAtTick: number | null;
  readonly metabolicReviewedAtTick: number | null;
  readonly neurologicExamAtTick: number | null;
  readonly escalation: 'urgent-neurologic-evaluation' | 'continue-routine-recovery' | null;
}

export const DELAYED_EMERGENCE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsDelayedEmergenceDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0'
    && supportsDelayedEmergenceDifferential(scenario);
}

export interface DelayedEmergenceDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

const choose = (action: string): Omit<LearnerAction, 'tick'> =>
  ({ type: 'delayed-emergence-assessment', payload: { action } });

/**
 * The worked example for the patient who has not woken up.
 *
 * Read from the latest stage backwards, as the sixteen before it are, though a
 * recorded step never becomes unrecorded so none of these gates can reverse.
 *
 * It diagnoses nobody, orders no imaging, and predicts no outcome.
 */
export function delayedEmergenceDemonstrationStep(
  patient?: DelayedEmergenceProgress,
): DelayedEmergenceDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.escalation !== null) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'Escalated, with a reason. The thing worth taking from the order rather than from the answer: three of those four steps found nothing wrong, and they still had to happen. The exposures reconciled, the glucose and sodium and carbon dioxide and temperature were unremarkable, and the block had recovered — and it is exactly that sequence of negatives that turns an asymmetric arm and a gaze preference from an oddity into the finding. A learner who examined first would have found the same signs with nothing to weigh them against. This example does not name a diagnosis, and the cockpit has no imaging to offer: what it has is a pattern that has stopped being explicable by the anaesthetic. This ends the example, not the evaluation.' };
  }
  if (patient.neurologicExamAtTick !== null) {
    return { id: 'escalate', focus: 'actions', progress: 0.9,
      dispatch: choose('urgent-neurologic-evaluation'),
      narration: 'Escalate urgently. This is the beat the whole vignette exists for, and it is the one a tired anaesthetist skips: the alternative on the tray is to keep observing, which is comfortable, defensible-sounding, and — with a new lateralizing sign and every reversible cause excluded — wrong. Finding the sign and continuing to watch scores four of these five objectives, which is the shape of the mistake.' };
  }
  if (patient.metabolicReviewedAtTick !== null) {
    return { id: 'examine', focus: 'analysis', progress: 0.72,
      dispatch: choose('perform-focused-neurologic-exam'),
      narration: 'Now examine, with everything else excluded. A focused neurologic examination is the step that was available from the first minute and is only interpretable now — the asymmetry it finds means something different in a patient who might still be full of anaesthetic than in one who demonstrably is not.' };
  }
  if (patient.exposureReviewedAtTick !== null) {
    return { id: 'metabolic', focus: 'analysis', progress: 0.55,
      dispatch: choose('check-metabolic-causes'),
      narration: 'The bedside metabolic causes next: glucose, carbon dioxide, sodium, temperature. These are the cheap, common and reversible explanations, and checking them is worth doing precisely because they are usually normal — a negative here is not a wasted step, it is what makes the next finding mean something.' };
  }
  if (patient.supportReviewedAtTick !== null) {
    return { id: 'exposures', focus: 'analysis', progress: 0.4,
      dispatch: choose('review-exposure-and-block'),
      narration: 'Reconcile what she has actually had against what is still in her: volatile, opioid, benzodiazepine, and the quantitative block. Residual drug is by far the commonest reason a patient has not woken, so it is the first thing to exclude rather than the last — and the quantitative monitor is what turns "she looks weak" into a number.' };
  }
  return { id: 'support', focus: 'actions', progress: 0.2,
    dispatch: choose('review-support'),
    narration: 'Support first, before any question about why. The airway stays where it is, and ventilation, oxygenation and circulation get reviewed before anyone starts theorising — the engine will refuse every other choice until this one is recorded, which is the right order made unavoidable rather than merely recommended.' };
}
