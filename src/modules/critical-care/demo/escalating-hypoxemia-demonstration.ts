import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsEscalatingHypoxemia, type EscalatingHypoxemiaAction, type EscalatingHypoxemiaProgress,
} from '../escalating-hypoxemia';
import { escalatingHypoxemiaInlinePrompt } from '../tutor/escalating-hypoxemia-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: EscalatingHypoxemiaProgress): string {
  const prompt = escalatingHypoxemiaInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const ESCALATING_HYPOXEMIA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsEscalatingHypoxemiaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsEscalatingHypoxemia(scenario);
}

export interface EscalatingHypoxemiaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: EscalatingHypoxemiaAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a desaturation a sick lung would explain.
 *
 * Five beats in the only order the engine accepts. It examines nobody, acquires
 * no signal, manipulates no equipment, passes no catheter, samples no blood,
 * images nothing, diagnoses nothing, programs no ventilator, rescues no airway,
 * recruits nothing, performs no bronchoscopy, decompresses nothing, exchanges no
 * tube, prones nobody, cannulates nobody, determines no disposition, and
 * predicts no outcome.
 */
export function escalatingHypoxemiaDemonstrationStep(
  patient?: EscalatingHypoxemiaProgress,
): EscalatingHypoxemiaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.escalationAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'The oxygen path was intact, which is a finding rather than a formality — it is the reason "his lungs are worse" is now a conclusion instead of an assumption. Nothing was touched, exchanged or programmed. He desaturated after a turn, and the turn is exactly why the tube depth was worth checking before anybody blamed the parenchyma. This ends the example, not the evaluation.' };
  }
  if (patient.signalAtTick === null) {
    return { id: 'signal', focus: 'monitor', progress: 0.12,
      action: 'validate-hypoxemia-signal', narration: narrate(patient) };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.32,
      action: 'support-hypoxemia-and-call-help', narration: narrate(patient) };
  }
  if (patient.deliveryPathAtTick === null) {
    return { id: 'path', focus: 'monitor', progress: 0.54,
      action: 'trace-hypoxemia-delivery-path', narration: narrate(patient) };
  }
  if (patient.bedsidePatternAtTick === null) {
    return { id: 'pattern', focus: 'monitor', progress: 0.76,
      action: 'integrate-hypoxemia-bedside-pattern', narration: narrate(patient) };
  }
  return { id: 'escalate', focus: 'actions', progress: 0.9,
    action: 'escalate-and-reassess-hypoxemia', narration: narrate(patient) };
}
