import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import {
  PEA_ARREST_DISPATCH, supportsPeaArrest, type PeaArrestProgress,
} from '../pea-arrest';
import { peaArrestInlinePrompt } from '../tutor/pea-arrest-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: PeaArrestProgress): string {
  const prompt = peaArrestInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const PEA_ARREST_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPeaArrestDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPeaArrest(scenario);
}

export interface PeaArrestDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  /**
   * This lesson drives the generic scripted-arrest controls rather than one
   * lesson action type, so every beat carries its own whole dispatch.
   */
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

/**
 * The worked example for the arrest that looks like it wants a shock.
 *
 * Two beats and a close. There is no third beat, because the third objective is
 * a thing not done: an example cannot demonstrate a shock that was never
 * delivered, so the argument for it sits in the closing narration, which every
 * path reaches. Nothing here performs CPR, secures access, gives a real drug,
 * finds a cause, or predicts an outcome.
 */
export function peaArrestDemonstrationStep(
  patient?: PeaArrestProgress,
): PeaArrestDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  const compressing = patient.chestCompressionsActive === true;
  const dosed = (patient.arrestEpinephrineTotalMg ?? 0) >= 1;
  if (compressing && dosed) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'Compressions first, then one milligram while they kept running. The third thing this example did is the one you cannot see: it never reached for the defibrillator. That is not restraint, and it is not the tray hiding a button — the shock is available and the engine will deliver it, record that a non-shockable rhythm did not convert, and put it in the debrief. It was not given because there is nothing here for it to stop. Reversible causes, further doses, rhythm and pulse checks at the cycle boundary, the airway, the team, and everything after this first cycle are outside the case. This ends the example, not the evaluation.' };
  }
  if ((patient.chestCompressionSeconds ?? 0) === 0 && !compressing) {
    return { id: 'compressions', focus: 'actions', progress: 0.3,
      dispatch: PEA_ARREST_DISPATCH['start-compressions'], narration: narrate(patient) };
  }
  if (!compressing) {
    return { id: 'resume', focus: 'actions', progress: 0.5,
      dispatch: PEA_ARREST_DISPATCH['start-compressions'], narration: narrate(patient) };
  }
  return { id: 'epinephrine', focus: 'actions', progress: 0.7,
    dispatch: PEA_ARREST_DISPATCH['give-one-milligram-epinephrine'], narration: narrate(patient) };
}
