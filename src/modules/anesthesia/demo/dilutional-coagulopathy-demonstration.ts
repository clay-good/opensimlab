import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsDilutionalCoagulopathy } from '../dilutional-coagulopathy';

/**
 * What this worked example reads.
 *
 * The eighth observed-state demonstration in the anaesthesia module, and the
 * first that needs something the equipment snapshot does not carry. Ordering a
 * coagulation panel changes no modelled state at all — it reports numbers the
 * solver was already computing — so a second panel is invisible to every field
 * on the snapshot, and an example gated on those fields cannot tell "I have
 * rechecked" from "I have not". The count of accepted panels is therefore
 * derived from the session's own event log and passed in, which is the only
 * honest way to observe an action whose entire effect is on the observer.
 */
export interface DilutionalCoagulopathyProgress {
  /** Accepted `coagulation-labs` events so far. Ordering one changes nothing else. */
  readonly coagulationPanelCount: number;
  readonly bloodProductsReleased: boolean;
  readonly freshFrozenPlasmaUnits: number;
  readonly prothrombinTimeRatio: number;
  readonly fibrinogenGPerL: number;
}

export const DILUTIONAL_COAGULOPATHY_DEMONSTRATION_VERSION = '0.1.0';

export function supportsDilutionalCoagulopathyDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsDilutionalCoagulopathy(scenario);
}

export interface DilutionalCoagulopathyDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

/**
 * The worked example for the bleeding that is no longer a surgical problem.
 *
 * Read from the latest stage backwards, as the seven before it are. Everything
 * that orders it is monotone by construction: the panel count and the plasma
 * units only ever go up, and neither the prothrombin ratio nor the fibrinogen is
 * used to sequence anything, because both change the instant the plasma is
 * accepted and would let the example skip the recheck it exists to demonstrate.
 *
 * It transfuses nobody, gives no real drug, and predicts no outcome for anyone.
 */
export function dilutionalCoagulopathyDemonstrationStep(
  patient?: DilutionalCoagulopathyProgress,
): DilutionalCoagulopathyDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.freshFrozenPlasmaUnits >= 4 && patient.coagulationPanelCount >= 2) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: `Prothrombin ratio ${patient.prothrombinTimeRatio.toFixed(2)} × normal and fibrinogen ${patient.fibrinogenGPerL.toFixed(1)} g/L on the repeat panel. Read that as a direction rather than as a destination: it is better than it was and it is not normal, the bleeding in this model has not stopped, and a single bounded plasma response is not a massive-transfusion protocol. What this case actually turned on happened before you arrived — the earlier loss was replaced predominantly with crystalloid, and this panel is the bill for it. Notice too what the cockpit would not let you do: plasma was unavailable until the panel had been reported. That is not the software being fussy, it is the whole argument of the lesson made unavoidable. This ends the example, not the evaluation.` };
  }
  if (patient.freshFrozenPlasmaUnits >= 4) {
    return { id: 'recheck', focus: 'actions', progress: 0.85,
      dispatch: { type: 'coagulation-labs', payload: {} },
      narration: 'Repeat the panel rather than assuming the plasma worked. Four units is a bounded response in this model and not a titration, the bleeding is still running, and the only thing that distinguishes a treated coagulopathy from an assumed one is a second measurement. Ordering it changes nothing about the patient, which is exactly why it is easy to skip.' };
  }
  if (patient.coagulationPanelCount >= 1) {
    if (!patient.bloodProductsReleased) {
      return { id: 'blood-bank', focus: 'actions', progress: 0.6,
        dispatch: { type: 'blood-bank-request', payload: {} },
        narration: 'Request products now that there is a number to justify them. The release here is an instantaneous teaching step rather than a compatibility workflow, and the briefing says so — treat the real-world delay as read rather than as absent.' };
    }
    return { id: 'plasma', focus: 'actions', progress: 0.75,
      dispatch: { type: 'blood-product', payload: { productId: 'fresh-frozen-plasma', units: 4 } },
      narration: `Prothrombin ratio ${patient.prothrombinTimeRatio.toFixed(2)} × normal and fibrinogen ${patient.fibrinogenGPerL.toFixed(1)} g/L. That is the abnormal panel the plasma is for, and the reason to have it before the plasma rather than after is that the field looked exactly the same either way. Four units, which is this model's whole bounded response — no platelets, no cryoprecipitate, no protocol.` };
  }
  // No pre-cue beat, and that is a measurement rather than an omission: this
  // scenario's blood-loss event starts at tick 0, so the engine's hemorrhage
  // flag is true from the first frame and any beat gated on its absence is
  // unreachable — which is why this progress type does not carry it. The
  // narration below therefore describes the field without claiming to know how
  // long ago the oozing was reported, because nothing on the snapshot says.
  return { id: 'panel', focus: 'actions', progress: 0.35,
    dispatch: { type: 'coagulation-labs', payload: {} },
    narration: 'Diffuse oozing with no new focal vessel, in a patient whose earlier loss was replaced mostly with crystalloid. That is oozing everywhere rather than bleeding from somewhere, and they are two different problems with two different answers. Ask for the numbers before choosing a product. The instinct is to reach for plasma on the strength of what has been lost, and it is worth knowing that this cockpit will simply refuse — plasma is not released until a panel has been reported, so guessing costs you the time the objective is counting.' };
}
