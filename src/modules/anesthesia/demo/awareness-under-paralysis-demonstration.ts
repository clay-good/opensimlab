import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsAwarenessUnderParalysis } from '../awareness-under-paralysis';

/**
 * What this worked example reads.
 *
 * The fourth observed-state demonstration in the anaesthesia module, and the
 * first whose central beat is a beat that does nothing. Between securing the
 * airway and the line failing there is a stretch where the correct action is to
 * watch a number that is not moving, and an example that skipped it would be
 * skipping the only thing this lesson teaches.
 *
 * The failure is silent by construction: the pump goes on reporting its
 * commanded rate, the saturation, pressure, rate and capnogram do not move, and
 * the only thing that changes is a predicted depth derived from a drug model
 * rather than from the brain. So the example reads the delivery path itself —
 * connected, and inspected — rather than inferring anything from an action list.
 */
export interface AwarenessUnderParalysisProgress {
  readonly inspiredOxygenFraction: number;
  readonly depthIndex: number;
  readonly trainOfFourRatio: number;
  /** False while the pump is running and its propofol is not arriving. */
  readonly hypnoticLineConnected: boolean;
  /** True only after the learner has deliberately looked. */
  readonly hypnoticLineInspected: boolean;
  readonly propofolInfusionRate: number;
  readonly remifentanilPlasma: number;
  readonly propofolPlasma: number;
  readonly rocuroniumPlasma: number;
  readonly intubated: boolean;
  readonly airwayAttempts: number;
  readonly airwayAttemptInProgress: boolean;
}

export const AWARENESS_UNDER_PARALYSIS_DEMONSTRATION_VERSION = '0.1.0';

export function supportsAwarenessUnderParalysisDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsAwarenessUnderParalysis(scenario);
}

export interface AwarenessUnderParalysisDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

/**
 * The worked example for the failure that nothing on the monitor announces.
 *
 * Read from the latest stage backwards, as the three before it are. The gate
 * that matters is `hypnoticLineInspected`, because it is one of only two facts
 * in this run that cannot go back — the other being an airway attempt made. The
 * connection state itself goes false and then true again, and the depth index
 * rises and falls, so neither can order the beats on its own.
 *
 * It gives no real drug, paralyses nobody, and predicts no outcome for anyone.
 */
export function awarenessUnderParalysisDemonstrationStep(
  patient?: AwarenessUnderParalysisProgress,
): AwarenessUnderParalysisDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.hypnoticLineInspected && patient.hypnoticLineConnected) {
    // A learner may hand this back having reconnected a line that was never
    // feeding an infusion in the first place. Restoring the path restores
    // nothing on its own, so the example says so and starts one.
    if (patient.propofolInfusionRate <= 0) {
      return { id: 'restart-infusion', focus: 'actions', progress: 0.9,
        dispatch: { type: 'infusion', payload: { drugId: 'propofol', rate: 0.06, unit: 'mg/kg/min' } },
        narration: 'The path is open and there is nothing going down it. Reconnecting a line is not the same as delivering an anaesthetic, and a depth index that stays high after a reconnection is asking which of the two you actually fixed. Starting the maintenance infusion.' };
    }
    // 60 is the objective's own threshold rather than a round number: it is the
    // line the lesson defines modelled awareness risk against, so it is the line
    // the example is entitled to call the failure over at.
    if (patient.depthIndex < 60) {
      return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
        narration: `Predicted depth back to ${patient.depthIndex.toFixed(0)} and the line delivering again. Look back at what warned you and what did not. The saturation, the pressure, the heart rate and the capnogram were unchanged throughout — they were never going to move, because none of them measures whether she was asleep. The pump went on displaying the rate it had been told to give. What changed was a number computed from a drug model, read next to a block that had taken away every sign she could have shown you herself. That is the only pairing that works here, and it is why both monitors are on the screen. This ends the example, not the evaluation.` };
    }
    return { id: 'settling', focus: 'monitor', progress: 0.92,
      narration: `Reconnected, and the depth index is at ${patient.depthIndex.toFixed(0)} on its way back down. It falls more slowly than it rose, because the effect site has to refill from a plasma that emptied while the pump was reporting success. The interval that was interrupted is over; the exposure it produced is not undone by ending it.` };
  }
  // The airway comes first even if the line has already failed. A learner who
  // is still inducing has nothing to reconnect to, and the example must not
  // abandon an unsecured airway to go and look at a giving set.
  if (patient.intubated) {
    if (!patient.hypnoticLineConnected) {
      if (patient.hypnoticLineInspected) {
        return { id: 'reconnect', focus: 'actions', progress: 0.85,
          dispatch: { type: 'hypnotic-line', payload: { action: 'reconnect' } },
          narration: 'Reconnect it. The pump never stopped and never alarmed, because from where it sits nothing was wrong: it was delivering into a line, and the line was not delivering into her. That is the whole failure and it is why looking at the pump would not have found it.' };
      }
      return { id: 'inspect', focus: 'actions', progress: 0.78,
        dispatch: { type: 'hypnotic-line', payload: { action: 'inspect' } },
        narration: `Predicted depth ${patient.depthIndex.toFixed(0)} and climbing, with the train-of-four ratio at ${patient.trainOfFourRatio.toFixed(2)}. Nothing else has moved. Follow the drug from the syringe to the vein rather than reaching for another bolus — a rising depth index with unchanged vital signs is a delivery question before it is a dosing one, and the pump is the last place it will show.` };
    }
    return { id: 'watching', focus: 'monitor', progress: 0.62,
      narration: 'And now the part with nothing to click. The anaesthetic is running, the surgery has started, and the job is to keep reading two numbers that are not moving. She is fully blocked, so if the hypnotic stops arriving she cannot move, cannot open her eyes, and cannot breathe against the ventilator — every sign that would ordinarily interrupt you has been removed on purpose. The depth index is what is left, and it is a drug model rather than an electroencephalogram.' };
  }
  if (patient.airwayAttemptInProgress) {
    return { id: `attempt-${patient.airwayAttempts}`, focus: 'monitor', progress: 0.55,
      narration: 'The attempt is running. Nothing unusual here — she is a healthy thirty-four-year-old with a Mallampati I airway, and this part of the case is the easy part. What follows it is not.' };
  }
  if (patient.rocuroniumPlasma > 0) {
    // Gated on attempts made rather than on the block, because the block recovers
    // later and a count-based gate would send the example backwards.
    if (patient.airwayAttempts > 0) {
      return { id: `airway-again-${patient.airwayAttempts}`, focus: 'actions', progress: 0.5,
        dispatch: { type: 'laryngoscopy', payload: { technique: 'video' } },
        narration: 'That attempt did not place the tube, which the distribution allows even in an airway that predicted nothing. Going again.' };
    }
    return { id: 'airway', focus: 'actions', progress: 0.48,
      dispatch: { type: 'laryngoscopy', payload: { technique: 'video' } },
      narration: 'The airway. This is the routine part of the case and it is worth naming as routine, because the thing that goes wrong in this lesson goes wrong afterwards, quietly, while everything visible is going well.' };
  }
  if (patient.propofolInfusionRate > 0) {
    return { id: 'relaxant', focus: 'analysis', progress: 0.42,
      dispatch: { type: 'bolus', payload: { drugId: 'rocuronium', amount: 0.6, unit: 'mg/kg' } },
      narration: 'Rocuronium last, after the bolus and after the infusion is running. The order is not a preference. From this point she has no way to tell you anything, and everything that follows depends on a maintenance anaesthetic that is now the only thing keeping her asleep.' };
  }
  if (patient.propofolPlasma > 0) {
    return { id: 'infusion', focus: 'actions', progress: 0.36,
      dispatch: { type: 'infusion', payload: { drugId: 'propofol', rate: 0.06, unit: 'mg/kg/min' } },
      narration: 'The maintenance infusion, started before the relaxant rather than after it. This rate is deliberately light, and that is worth saying plainly: a more generous infusion is safer minute to minute and it hides a delivery failure for longer, because the predicted depth takes much longer to climb. The setting that protects her best is the one that would warn you last.' };
  }
  if (patient.remifentanilPlasma > 0) {
    return { id: 'hypnotic', focus: 'analysis', progress: 0.3,
      dispatch: { type: 'bolus', payload: { drugId: 'propofol', amount: 1.5, unit: 'mg/kg' } },
      narration: 'Propofol, and it is the hypnotic — the drug that makes her unconscious. Nothing else in this room does that. The opioid blunts responses and the relaxant removes movement, and neither of them is sleep.' };
  }
  if (patient.inspiredOxygenFraction < 0.9) {
    return { id: 'oxygen', focus: 'actions', progress: 0.08,
      dispatch: { type: 'ventilator', payload: { fio2: 1 } },
      narration: 'Oxygen first, as always. Nothing in this case threatens her oxygenation, which is part of why the thing that does threaten her is easy to miss.' };
  }
  return { id: 'opioid', focus: 'analysis', progress: 0.2,
    dispatch: { type: 'bolus', payload: { drugId: 'remifentanil', amount: 25, unit: 'µg' } },
    narration: 'Remifentanil to blunt the response to the laryngoscope. Worth noticing what it is not: an opioid alone does not reliably produce unconsciousness, and a patient who is comfortable is not thereby asleep.' };
}
