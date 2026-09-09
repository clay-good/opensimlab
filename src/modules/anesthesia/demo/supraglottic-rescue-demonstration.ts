import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsDifficultAirwaySupraglotticRescue } from '../difficult-airway-supraglottic-rescue';

/**
 * What this worked example reads.
 *
 * The twenty-fifth observed-state demonstration in the anaesthesia module, and
 * the sibling of the repeated-laryngoscopy one. It carries the same no-dispatch
 * beat while an attempt is in progress, for the same reason: the attempt count
 * is still zero until the procedure completes, so without it the read-backwards
 * chain falls through to an earlier gate.
 */
export interface SupraglotticRescueProgress {
  readonly endTidalOxygenFraction: number;
  readonly helpRequestedAtTick: number | null;
  readonly propofolTotalMg: number;
  readonly attempts: number;
  readonly attemptInProgress: boolean;
  readonly airwayDevice: string;
  readonly ventilatorDelivering: boolean;
}

export const SUPRAGLOTTIC_RESCUE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsSupraglotticRescueDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0'
    && supportsDifficultAirwaySupraglotticRescue(scenario);
}

export interface SupraglotticRescueDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

const VENTILATE: Omit<LearnerAction, 'tick'> = { type: 'ventilator',
  payload: { delivering: true, mode: 'volume-control', fio2: 1, tidalVolumeMl: 500, respiratoryRateBpm: 12 } };

/**
 * The worked example for the rescue that is planned before it is needed.
 *
 * Read from the latest stage backwards, as the twenty-four before it are.
 *
 * It intubates nobody, gives no real drug, and predicts no outcome for anyone.
 */
export function supraglotticRescueDemonstrationStep(
  patient?: SupraglotticRescueProgress,
): SupraglotticRescueDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.airwayDevice === 'supraglottic-airway' && patient.ventilatorDelivering) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'Gas exchange confirmed through the rescue device. Three things are worth carrying away, and two of them are about the escalation objective rather than the airway. First the airway: a run that looks twice instead of once, with no preoxygenation, reaches a lowest saturation of 54%, and the same two looks after the reserve you just built hold 100%. The reserve is doing the work, not the restraint. Second, the escalation objective is coarser than it reads. Asking for help 49 seconds after the failed attempt scores exactly what asking for none at all scores — there is no gradient between late and never, and the attempt count dominates that objective. Third, its stated measure describes a window beginning at the failed attempt, and a request made 96 seconds BEFORE the attempt is nonetheless scored met, so the wording is narrower than the check. Calling early is the better habit and this model will not penalise it. Limits: placement here is an abstraction rather than a skill, there is no can-not-intubate-can-not-oxygenate branch, and the trace stops at a working rescue rather than a plan for what follows. This ends the example, not the evaluation.' };
  }
  if (patient.airwayDevice === 'supraglottic-airway') {
    return { id: 'confirm', focus: 'monitor', progress: 0.9,
      dispatch: VENTILATE,
      narration: 'Prove the device works rather than assuming it. Delivery at 100% oxygen, and then a sustained capnogram: the objective wants thirty continuous seconds between 25 and 55 mmHg with the saturation holding. A device that is seated and a device that is ventilating are two different claims, and only the second one is evidence.' };
  }
  if (patient.attemptInProgress) {
    return { id: 'attempting', focus: 'monitor', progress: 0.6,
      narration: 'The attempt is running. Nothing to add while it does — this beat holds the window so the example does not walk backwards into a step it has already taken, and so the saturation is what gets watched rather than the laryngoscope.' };
  }
  if (patient.attempts >= 1 && patient.helpRequestedAtTick === null) {
    return { id: 'escalate', focus: 'actions', progress: 0.7,
      dispatch: { type: 'call-for-help', payload: { context: 'airway' } },
      narration: 'That look failed, so call for airway help now, before doing anything else about it. The objective\'s window opens at the failed attempt, and the reason to ask at this exact moment rather than after the rescue is that a request made while there is still a full reserve buys a different kind of help than one made during a desaturation.' };
  }
  if (patient.attempts >= 1) {
    return { id: 'rescue', focus: 'actions', progress: 0.78,
      dispatch: { type: 'airway-device', payload: { device: 'supraglottic-airway' } },
      narration: 'Now place the supraglottic airway rather than looking again. This is a decision about stopping, and stopping is harder than it sounds because the case for one more look is always available — the view might be better this time, the bougie might sit differently. Oxygenation is the goal; the tube is one route to it and not the only one.' };
  }
  if (patient.propofolTotalMg > 0 && patient.attempts === 0) {
    return { id: 'attempt', focus: 'actions', progress: 0.5,
      dispatch: { type: 'laryngoscopy', payload: { technique: 'video' } },
      narration: 'One laryngoscopy, with the best tool first rather than after a failure. The plan already has its next clause written, which is what makes stopping after this look possible — that decision is much harder to make for the first time while the saturation is falling.' };
  }
  if (patient.endTidalOxygenFraction >= 0.9) {
    return { id: 'induce', focus: 'actions', progress: 0.35,
      dispatch: { type: 'bolus', payload: { drugId: 'propofol', amount: 150, unit: 'mg' } },
      narration: 'The reserve is built, so induce. Everything that had to be true before this moment is true, and the rescue device is chosen and to hand rather than something to look for once the first attempt has failed.' };
  }
  return { id: 'preoxygenate', focus: 'monitor', progress: 0.15,
    dispatch: VENTILATE,
    narration: 'Build the reserve first, and wait for the number rather than the clock: at least 0.90 end-tidal oxygen before any propofol. That measurement is the one that says the alveoli hold oxygen rather than the mask or the circuit, and in this lesson it is worth more to the patient than anything that happens after it.' };
}
