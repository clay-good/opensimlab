import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsRepeatedLaryngoscopyHarm } from '../repeated-laryngoscopy-harm';

/**
 * What this worked example reads.
 *
 * The twenty-fourth observed-state demonstration in the anaesthesia module. Its
 * gates are the end-tidal oxygen fraction, a latched help tick, the accepted
 * propofol milligrams, the recorded attempt count, and the airway device --
 * every one of them monotone across this lesson, so no beat can walk backwards.
 */
export interface RepeatedLaryngoscopyProgress {
  readonly endTidalOxygenFraction: number;
  readonly helpRequestedAtTick: number | null;
  readonly propofolTotalMg: number;
  readonly attempts: number;
  readonly attemptInProgress: boolean;
  readonly airwayDevice: string;
  readonly ventilatorDelivering: boolean;
}

export const REPEATED_LARYNGOSCOPY_DEMONSTRATION_VERSION = '0.1.0';

export function supportsRepeatedLaryngoscopyDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsRepeatedLaryngoscopyHarm(scenario);
}

export interface RepeatedLaryngoscopyDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

/**
 * The worked example for the attempts that are not the injury.
 *
 * Read from the latest stage backwards, as the twenty-three before it are.
 *
 * It intubates nobody, gives no real drug, and predicts no outcome for anyone.
 */
export function repeatedLaryngoscopyDemonstrationStep(
  patient?: RepeatedLaryngoscopyProgress,
): RepeatedLaryngoscopyDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.airwayDevice === 'supraglottic-airway' && patient.ventilatorDelivering) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'Gas exchange confirmed through the rescue device, and the saturation never left the hundreds. Now the comparison this lesson is named for, and it does not say what the name suggests. A run that makes THREE attempts before this rescue, with the preoxygenation you watched at the start, also never drops below 100%. The attempts cost it two objectives and cost the patient nothing measurable. The same three attempts without that preoxygenation reach a lowest saturation of 41%. So repeated laryngoscopy is not the injury here: it is how the reserve gets spent, and the injury is what happens when there was none to spend. The rubric marks the attempts down either way, identically, which is the honest division of labour — it is scoring a behaviour that usually predicts harm rather than harm it can see. Limits worth naming: placement here is an abstraction rather than a skill, there is no can-not-intubate-can-not-oxygenate branch and no front-of-neck airway, and this trace stops at a working rescue rather than at a plan for what follows. This ends the example, not the evaluation.' };
  }
  if (patient.airwayDevice === 'supraglottic-airway') {
    return { id: 'confirm', focus: 'monitor', progress: 0.9,
      dispatch: { type: 'ventilator',
        payload: { delivering: true, mode: 'volume-control', fio2: 1, tidalVolumeMl: 500, respiratoryRateBpm: 12 } },
      narration: 'The device is in; now prove it works rather than assuming it. Start delivery at 100% oxygen and watch for a sustained carbon dioxide trace — the objective asks for thirty continuous seconds between 25 and 55 mmHg with the saturation holding. A device that is in place and a device that is ventilating are two different claims, and only the second one is evidence.' };
  }
  if (patient.attemptInProgress) {
    return { id: 'attempting', focus: 'monitor', progress: 0.68,
      narration: 'The attempt is under way. Nothing to add while it runs — this beat exists so the example does not walk backwards through a step it has already taken, and so the saturation is what gets watched rather than the laryngoscope.' };
  }
  if (patient.attempts >= 1) {
    return { id: 'rescue', focus: 'actions', progress: 0.75,
      dispatch: { type: 'airway-device', payload: { device: 'supraglottic-airway' } },
      narration: 'That attempt failed, so place the supraglottic airway now rather than looking again. This is the decision the whole lesson turns on and it is a decision about stopping: the case for one more look is always available and always sounds reasonable, because the view might be better this time. Oxygenation is the goal, and the tube is only one way to reach it.' };
  }
  if (patient.propofolTotalMg > 0 && patient.attempts === 0) {
    return { id: 'attempt', focus: 'actions', progress: 0.6,
      dispatch: { type: 'laryngoscopy', payload: { technique: 'video' } },
      narration: 'One laryngoscopy, with the best tool available first rather than after a failure. The plan is already made and its most important clause is what happens if this does not work — deciding that in advance is what makes stopping after one attempt possible, because it will not feel like the right moment when it arrives.' };
  }
  if (patient.helpRequestedAtTick !== null && patient.propofolTotalMg === 0) {
    return { id: 'induce', focus: 'actions', progress: 0.45,
      dispatch: { type: 'bolus', payload: { drugId: 'propofol', amount: 150, unit: 'mg' } },
      narration: 'Now induce. Everything that had to be true before this moment is true: the reserve is built, the record has been acted on, and help is already coming rather than being summoned once things are difficult.' };
  }
  if (patient.endTidalOxygenFraction >= 0.9) {
    return { id: 'help', focus: 'actions', progress: 0.3,
      dispatch: { type: 'call-for-help', payload: { context: 'airway' } },
      narration: 'Call for airway help BEFORE the first attempt, not after a failed one. There is a prior record here saying this airway was difficult, and the objective reads that record as something to act on rather than to have read. Helped summoned early is a different resource from help summoned during a desaturation.' };
  }
  return { id: 'preoxygenate', focus: 'monitor', progress: 0.15,
    dispatch: { type: 'ventilator',
      payload: { delivering: true, mode: 'volume-control', fio2: 1, tidalVolumeMl: 500, respiratoryRateBpm: 12 } },
    narration: 'Build the reserve first, and wait for the number rather than the clock: the objective wants an end-tidal oxygen fraction of at least 0.90 before any propofol, which is the measurement that says the alveoli — not the mask, not the circuit — actually hold oxygen. This is the step that decides how much the rest of the case costs.' };
}
