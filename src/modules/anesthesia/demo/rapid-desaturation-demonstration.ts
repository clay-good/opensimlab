import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsRapidDesaturation } from '../rapid-desaturation';

/**
 * What this worked example reads.
 *
 * The first observed-state demonstration in the anaesthesia module, and it has
 * to be built differently from the module ones. Those read a lesson's assessment
 * sidecar, where each recorded step is a tick that is either null or not. This
 * lesson has no sidecar: the patient is the state, so every beat is gated on a
 * physiological quantity or on a drug that has arrived in the plasma.
 *
 * Plasma concentrations rather than an action list, because a demonstration must
 * be resumable — a learner can take the controls, do something, and hand them
 * back — and the only honest way to know whether the opioid has been given is to
 * look at whether it is in the patient.
 */
export interface RapidDesaturationProgress {
  readonly inspiredOxygenFraction: number;
  readonly endTidalOxygenFraction: number;
  readonly preoxygenationSeconds: number;
  readonly respiratoryRateBpm: number;
  readonly remifentanilPlasma: number;
  readonly propofolPlasma: number;
  readonly intubated: boolean;
  readonly ventilating: boolean;
  /** Accepted laryngoscopy attempts. Once one has been made there is no going back. */
  readonly airwayAttempts: number;
  /** True while an attempt is consuming simulated time and a second would be refused. */
  readonly airwayAttemptInProgress: boolean;
}

export const RAPID_DESATURATION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsRapidDesaturationDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsRapidDesaturation(scenario);
}

export interface RapidDesaturationDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

/**
 * The worked example for the patient who gives you almost no margin.
 *
 * Several of its beats dispatch nothing at all. That is deliberate and it is the
 * lesson: the two waiting beats are the ones a learner is tempted to skip, and a
 * demonstration that fast-forwarded through them would be teaching the thing
 * this patient exists to punish. They narrate while the clock runs and hand back
 * nothing to click.
 *
 * The airway beats repeat as many times as the airway needs, because the view
 * and the number of attempts are drawn from a distribution rather than scripted.
 * An example that could only show a first attempt succeeding would be scripted
 * after all, which is the one thing its own narration says it is not.
 *
 * It intubates nobody, gives no real drug, and predicts no outcome for anyone.
 */
export function rapidDesaturationDemonstrationStep(
  patient?: RapidDesaturationProgress,
): RapidDesaturationDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  // Checked from the LATEST stage backwards, which is not a style choice. The
  // earlier arrangement read forwards and looped: the end-tidal fraction falls
  // again once he is apnoeic, so the "watch it climb" beat became true a second
  // time and the example walked backwards into it. Physiological gates are not
  // monotonic the way a recorded tick is, and a worked example that reads the
  // patient has to be written knowing that.
  if (patient.ventilating && patient.intubated) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'The tube is in, the ventilator started with it, the capnogram is back, and the saturation never moved off the number he arrived with. Nothing here was faster than the induction you would give a healthy patient — it was the same drugs in the same order — and the only difference was three minutes of waiting and reaching for the video laryngoscope first, in a man whose airway assessment said what it said before anything was given. That is the entire margin. Try it without the wait and watch what the number does. This ends the example, not the evaluation.' };
  }
  // No beat turns the ventilator on. Measured: the engine starts delivering the
  // moment the tube is placed, so a beat that dispatched it would be unreachable
  // and a narration promising it would describe something the viewer never sees.
  if (patient.propofolPlasma > 0) {
    // `airwayAttempts === 0` as well as the rate, because the remifentanil wears
    // off during the modelled attempt and he starts breathing again — which sent
    // the example back to this beat mid-laryngoscopy the first time it was
    // written. An attempt already made is the fact that cannot go backwards.
    if (patient.airwayAttempts === 0 && patient.respiratoryRateBpm > 0) {
      return { id: 'apnoea', focus: 'monitor', progress: 0.68,
        narration: 'He is going to stop breathing in a moment, and the clock that matters starts then. In the healthy patient that clock ran for eight minutes. Here it is measured in a fraction of that, which is the only thing this lesson is about.' };
    }
    // The attempt consumes simulated time and a second one during it would be
    // refused, so this beat narrates and dispatches nothing while it runs.
    if (patient.airwayAttemptInProgress) {
      return { id: `attempt-${patient.airwayAttempts}`, focus: 'monitor', progress: 0.84,
        narration: 'The attempt is running and he is not being ventilated during it. This is the part of the airway that is measured in seconds rather than in skill, and it is why the three minutes earlier were spent.' };
    }
    if (patient.airwayAttempts === 0) {
      return { id: 'airway', focus: 'actions', progress: 0.82,
        dispatch: { type: 'laryngoscopy', payload: { technique: 'video' } },
        narration: 'Video, first time, on purpose. The assessment said Mallampati III, a 5.5 cm thyromental distance, limited neck extension and a beard, and it said all of that before anything was given. The view and the number of attempts are drawn from a distribution anchored to reported incidence, so this is not scripted to succeed.' };
    }
    // And it was not. A worked example that could only show a first attempt
    // succeeding would be scripted after all, which is the one thing the beat
    // above promises it is not.
    return { id: `airway-again-${patient.airwayAttempts}`, focus: 'actions', progress: 0.88,
      dispatch: { type: 'laryngoscopy', payload: { technique: 'video' } },
      narration: 'That attempt did not place the tube, which the distribution allows and the guideline expects you to have planned for. Going again, and the rule is that something changes between attempts rather than the same look being repeated harder. The saturation is still where the preoxygenation left it, and that is what is buying this second look.' };
  }
  if (patient.remifentanilPlasma > 0) {
    return { id: 'hypnotic', focus: 'analysis', progress: 0.58,
      dispatch: { type: 'bolus', payload: { drugId: 'propofol', amount: 160, unit: 'mg' } },
      narration: 'Propofol, 160 mg. Not the 2 mg/kg preset, which on 138 kg would be 276. This is roughly 2 mg/kg of lean body mass, and the 50 mL syringe was drawn up so that the syringe would not make that choice for you. It is a choice, and the model does not tell you it is the right one.' };
  }
  if (patient.inspiredOxygenFraction < 0.9) {
    return { id: 'oxygen', focus: 'actions', progress: 0.08,
      dispatch: { type: 'ventilator', payload: { fio2: 1 } },
      narration: 'Oxygen to 100% before anything else. He is 138 kg with obstructive sleep apnoea, and the reserve you are about to build is the only thing standing between an apnoea and a desaturation.' };
  }
  if (patient.endTidalOxygenFraction < 0.9) {
    return { id: 'filling', focus: 'monitor', progress: 0.18,
      narration: 'Nothing to do now but watch the end-tidal oxygen climb. The inspired number went to 1.0 the moment the flowmeter moved; the end-tidal one is still catching up, and it is the one that says his lungs are actually holding the oxygen rather than the circuit.' };
  }
  if (patient.preoxygenationSeconds < 180) {
    return { id: 'waiting', focus: 'monitor', progress: 0.3,
      narration: 'And now the part everyone skips. Three minutes at this end-tidal fraction, counted from when the number arrived rather than from when the oxygen went on. It feels like nothing is happening. What is happening is the only reserve he is going to get.' };
  }
  return { id: 'opioid', focus: 'analysis', progress: 0.45,
    dispatch: { type: 'bolus', payload: { drugId: 'remifentanil', amount: 50, unit: 'µg' } },
    narration: 'Remifentanil first, as before. Watch the concentration plot rather than the syringe: the plasma spikes and the effect site follows it up, and the gap between those two curves is the same gap it was in the last patient.' };
}
