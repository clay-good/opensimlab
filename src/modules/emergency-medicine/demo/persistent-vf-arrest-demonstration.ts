import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import {
  PERSISTENT_VF_DISPATCH, supportsPersistentVfArrest, type PersistentVfProgress,
} from '../persistent-vf-arrest';
import { persistentVfInlinePrompt } from '../tutor/persistent-vf-arrest-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: PersistentVfProgress): string {
  const prompt = persistentVfInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const PERSISTENT_VF_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPersistentVfArrestDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPersistentVfArrest(scenario);
}

export interface PersistentVfDemonstrationStep {
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
 * The worked example for the shock that has already failed twice.
 *
 * Three beats and a close. It never demonstrates the under-energy shock: the
 * tray offers 120 and 150 J and the engine delivers either, so the argument for
 * the declared setting is made in the narration rather than by taking the
 * wrong one on purpose. Nothing here performs CPR, secures access, gives a real
 * drug, works a reversible cause, or predicts what happens to a person.
 */
export function persistentVfDemonstrationStep(
  patient?: PersistentVfProgress,
): PersistentVfDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.roscAtTick != null) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'Compressions, then the dose while they kept running, then the shock at the setting this device declares. Nothing about the third shock was more forceful than the two that failed before the handoff; what was different is the heart it landed on. The organized rhythm on the screen is this model doing what its stated conditions say it does, and it is not a prediction about any person: a real arrest at this point is the beginning of post-arrest care, which is entirely outside this vignette, and the deterministic conversion here should not be read as an expected outcome. This ends the example, not the evaluation.' };
  }
  const compressing = patient.chestCompressionsActive === true;
  if ((patient.chestCompressionSeconds ?? 0) === 0 && !compressing) {
    return { id: 'compressions', focus: 'actions', progress: 0.25,
      dispatch: PERSISTENT_VF_DISPATCH['start-compressions'], narration: narrate(patient) };
  }
  if (!compressing) {
    return { id: 'resume', focus: 'actions', progress: 0.4,
      dispatch: PERSISTENT_VF_DISPATCH['start-compressions'], narration: narrate(patient) };
  }
  if ((patient.arrestEpinephrineTotalMg ?? 0) < 1) {
    return { id: 'epinephrine', focus: 'actions', progress: 0.55,
      dispatch: PERSISTENT_VF_DISPATCH['give-one-milligram-epinephrine'], narration: narrate(patient) };
  }
  return { id: 'shock', focus: 'actions', progress: 0.8,
    dispatch: PERSISTENT_VF_DISPATCH['deliver-declared-shock'], narration: narrate(patient) };
}
