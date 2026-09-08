import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsHypotensionAfterInduction } from '../hypotension-after-induction';

/**
 * What this worked example reads.
 *
 * The second observed-state demonstration in the anaesthesia module, and it
 * shares the first one's constraint: this lesson has no assessment sidecar, so
 * every beat is gated on a physiological quantity rather than on a recorded
 * step. What it adds is a beat that repeats on the pressure. Volume is not one
 * decision here, it is a decision taken again every time the pressure sags, and
 * an example that gave a fixed number of litres on a fixed schedule would be
 * teaching a recipe rather than the reading.
 *
 * Plasma concentrations rather than an action list, and the engine's own
 * accepted crystalloid total rather than a count of clicks, because a
 * demonstration must be resumable: a learner can take the controls, give a bag
 * themselves, and hand back, and the example has to pick up from the patient.
 */
export interface HypotensionAfterInductionProgress {
  readonly inspiredOxygenFraction: number;
  /** The clock the pre-induction wait is measured on, as in every anaesthesia lesson. */
  readonly endTidalOxygenFraction: number;
  readonly meanArterialMmHg: number;
  /** Accepted crystalloid, from the engine, not from a count of dispatches. */
  readonly crystalloidTotalMl: number;
  /** True while the modelled gastric and third-space losses are still running. */
  readonly lossesRunning: boolean;
  readonly remifentanilPlasma: number;
  readonly propofolPlasma: number;
  readonly intubated: boolean;
  readonly airwayAttempts: number;
  readonly airwayAttemptInProgress: boolean;
}

export const HYPOTENSION_AFTER_INDUCTION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsHypotensionAfterInductionDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsHypotensionAfterInduction(scenario);
}

export interface HypotensionAfterInductionDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

/**
 * The worked example for the patient whose pressure falls for the other reason.
 *
 * Read from the latest stage backwards, for the same reason the first example
 * is: physiological gates are not monotonic. The mean arterial pressure crosses
 * 70 mmHg downwards and then upwards again every time a bag goes in, so a
 * forward reading walks into the replacement beat a second time and stays there.
 *
 * The replacement beat carries the accepted total in its own id, so it is a new
 * beat each time and repeats as often as the pressure asks. That is deliberate:
 * it is the only beat here that a learner cannot know the count of in advance,
 * and an example that fixed the count would have decided the thing the lesson
 * leaves open.
 *
 * It gives no real drug and predicts no outcome for anyone.
 */
export function hypotensionAfterInductionDemonstrationStep(
  patient?: HypotensionAfterInductionProgress,
): HypotensionAfterInductionDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.intubated && !patient.lossesRunning && patient.meanArterialMmHg >= 65
    && patient.crystalloidTotalMl >= 3000) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: `The modelled losses have stopped and the pressure is holding at ${patient.meanArterialMmHg.toFixed(0)} mmHg on ${patient.crystalloidTotalMl.toFixed(0)} mL of crystalloid, and the example never once reached for the vasopressor. That is the whole thing. The vasopressor was on the tray from the first tick and it would have raised this number at any point in the run — and given it back every time, because the number it produces is real and the volume behind it is not. What actually held the pressure was a third of the textbook induction dose, and a litre that went in before the propofol rather than in answer to a pressure that had already fallen. As a bridge while volume catches up it is a real treatment; as the plan it is the trap this patient exists to set. This ends the example, not the evaluation.` };
  }
  if (patient.intubated) {
    // Repeats as often as the pressure asks, and carries the accepted total in
    // its id so each repeat is a new beat. The count is not knowable in advance
    // and an example that fixed it would have answered the lesson's question.
    if (patient.meanArterialMmHg < 70 && patient.crystalloidTotalMl < 4000) {
      return { id: `replace-${patient.crystalloidTotalMl.toFixed(0)}`, focus: 'actions', progress: 0.9,
        dispatch: { type: 'fluid', payload: { fluidId: 'balanced-crystalloid', volumeMl: 1000 } },
        narration: `The pressure is sagging again at ${patient.meanArterialMmHg.toFixed(0)} mmHg and the losses are still running, so another litre. The model retains a quarter of a crystalloid bag intravascularly, which is why the number on the bag is roughly four times the number that was lost. This is the beat that repeats, and how many times it repeats is the reading rather than a recipe.` };
    }
    // Four litres is where this example stops giving, and saying so is part of
    // the lesson rather than a limit of the model. She is 78 with stage 3 kidney
    // disease; the fifth litre dilutes what is left and the question stops being
    // "how much more" and starts being "what else is going on".
    if (patient.meanArterialMmHg < 70) {
      return { id: 'ceiling', focus: 'analysis', progress: 0.92,
        narration: `Four litres in and the pressure is still ${patient.meanArterialMmHg.toFixed(0)} mmHg. This is where the example stops reaching for the bag. Volume was the right answer and it is not an unlimited one: she is 78 with stage 3 kidney disease, the next litre dilutes what is left, and a pressure that has not answered four is asking a different question. The Why panel ranks what is contributing. Read it rather than repeating the treatment.` };
    }
    return { id: `holding-${patient.crystalloidTotalMl.toFixed(0)}`, focus: 'monitor', progress: 0.85,
      narration: 'Holding, for now. Nothing to give while the pressure is where it should be — the reason to keep watching is that the losses have not stopped, so this is a pause in the treatment rather than the end of it.' };
  }
  if (patient.airwayAttemptInProgress) {
    return { id: `attempt-${patient.airwayAttempts}`, focus: 'monitor', progress: 0.78,
      narration: 'The attempt is running. Her saturation has room in it, which is what a third of the usual induction dose and a full flowmeter bought; the pressure is the number under threat in this patient, not the oxygen.' };
  }
  if (patient.propofolPlasma > 0) {
    // Unreached at the reference seed, where the first attempt places the tube,
    // and reachable in principle because the view is drawn from a distribution.
    // An example that could only show a first attempt working would be scripted.
    if (patient.airwayAttempts > 0) {
      return { id: `airway-again-${patient.airwayAttempts}`, focus: 'actions', progress: 0.8,
        dispatch: { type: 'laryngoscopy', payload: { technique: 'video' } },
        narration: 'That attempt did not place the tube, which the distribution allows. Going again, and the thing to watch while it runs is the pressure rather than the clock: the apnoea is not what is threatening her.' };
    }
    return { id: 'airway', focus: 'actions', progress: 0.72,
      dispatch: { type: 'laryngoscopy', payload: { technique: 'video' } },
      narration: 'The airway now. Mallampati II and edentulous, and in real life this would be a rapid sequence induction because she has a full stomach and a draining nasogastric tube — the cockpit does not model cricoid pressure, so treat that part as read rather than as absent.' };
  }
  if (patient.remifentanilPlasma > 0) {
    return { id: 'hypnotic', focus: 'analysis', progress: 0.55,
      dispatch: { type: 'bolus', payload: { drugId: 'propofol', amount: 40, unit: 'mg' } },
      narration: 'Propofol, 40 mg. That is 0.74 mg/kg, and the preset labelled 2 mg/kg would give 108. She is 78, she has been vomiting for two days, and she took an ACE inhibitor this morning: each of those three lowers the dose on its own, and she has all three. The syringe will offer you the preset anyway.' };
  }
  if (patient.inspiredOxygenFraction < 0.9) {
    return { id: 'oxygen', focus: 'actions', progress: 0.08,
      dispatch: { type: 'ventilator', payload: { fio2: 1 } },
      narration: 'Oxygen to 100% first, as in every induction. It is not the number at risk in this patient, but the order does not change because the risk does.' };
  }
  if (patient.endTidalOxygenFraction >= 0.85 && patient.crystalloidTotalMl >= 1000) {
    return { id: 'opioid', focus: 'analysis', progress: 0.45,
      dispatch: { type: 'bolus', payload: { drugId: 'remifentanil', amount: 10, unit: 'µg' } },
      narration: 'Remifentanil, 10 µg — a third of what the previous patients had. It blunts the airway response and it costs pressure, and in a patient with this little reserve the second half of that sentence is the one that decides the number.' };
  }
  if (patient.crystalloidTotalMl < 1000) {
    return { id: 'preload', focus: 'actions', progress: 0.28,
      dispatch: { type: 'fluid', payload: { fluidId: 'balanced-crystalloid', volumeMl: 1000 } },
      narration: 'A litre before the induction rather than after it. Her nasogastric tube has drained 900 mL today, her membranes are dry, and the pressure she is showing you now is being held up by a fast heart rate and a small stroke volume — the compensated picture. Induction removes the compensation. Giving this now is the difference between treating the cause and chasing the consequence.' };
  }
  return { id: 'filling', focus: 'monitor', progress: 0.35,
    narration: 'Two things are happening at once and neither of them needs a click. The end-tidal oxygen is climbing towards the inspired number, and the litre is going into a circulation that is 15% short. Nothing on the monitor will thank you for the fluid yet — her pressure is already normal, held up by a fast rate and a small stroke volume — which is exactly why it has to go in before the induction rather than after the pressure has fallen.' };
}
