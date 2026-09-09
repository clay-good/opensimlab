import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsCircleSystemRebreathing } from '../circle-system-rebreathing';

/**
 * What this worked example reads.
 *
 * The twenty-ninth observed-state demonstration in the anaesthesia module, and
 * the sixth to open with a beat that deliberately does nothing: the absorbent
 * exhausts at tick 1,800 and both bounded circuit actions are refused before it.
 *
 * Its gates are two latched booleans and the fresh-gas flow, all monotone here,
 * so no beat can walk backwards. Note the closing gate reads `absorbentReplaced`
 * rather than the inspired carbon dioxide: that value is ALSO zero before the
 * failure, and a gate on it would finish the example at tick one.
 */
export interface CircleSystemRebreathingProgress {
  readonly absorbentExhausted: boolean;
  readonly inspiredCo2MmHg: number;
  readonly capnogramAssessed: boolean;
  readonly absorbentReplaced: boolean;
  readonly freshGasFlowLPerMin: number;
}

export const CIRCLE_SYSTEM_REBREATHING_DEMONSTRATION_VERSION = '0.1.0';

export function supportsCircleSystemRebreathingDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsCircleSystemRebreathing(scenario);
}

export interface CircleSystemRebreathingDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

/**
 * The worked example for the bridge that is not the repair.
 *
 * Read from the latest stage backwards, as the twenty-eight before it are.
 *
 * It changes nobody's absorbent and predicts no outcome for any person.
 */
export function circleSystemRebreathingDemonstrationStep(
  patient?: CircleSystemRebreathingProgress,
): CircleSystemRebreathingDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.absorbentReplaced) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'The absorbent is changed and the inspired carbon dioxide is on its way to zero. Two comparisons are worth carrying away. A run that stops at the bridge — reads the capnogram correctly, opens the fresh gas to 10 L/min, and never changes the absorbent — holds an inspired carbon dioxide of 2.86 mmHg for the rest of the case. That is a real improvement from 8.0 and it is not a repair, and the number simply stays there. The other comparison cuts the opposite way: a run that reads the capnogram and goes STRAIGHT to the absorbent, skipping the flow entirely, loses the bridging objective and ends with a patient indistinguishable from this one — the same end-tidal carbon dioxide at every tick. In this bounded model the bridge buys nothing once the repair is coming quickly, and the objective scores it anyway, because the habit is what protects a patient when the repair turns out to be slow. One more thing: the saturation reads 100% on every path here including the untreated one. The instrument for this lesson is the inspired baseline on the capnogram, and nothing else on the screen will tell you. This ends the example, not the evaluation.' };
  }
  if (patient.freshGasFlowLPerMin >= 10 && patient.capnogramAssessed) {
    return { id: 'replace', focus: 'actions', progress: 0.8,
      dispatch: { type: 'breathing-circuit', payload: { action: 'replace-absorbent' } },
      narration: 'Now change the absorbent — the objective allows 90 seconds from the failure, and this is the only action that ends the problem rather than diluting it. The engine refuses this until the capnogram has been assessed, which is the right order: replacing a canister on suspicion is a different act from replacing it on evidence.' };
  }
  if (patient.capnogramAssessed) {
    return { id: 'bridge', focus: 'actions', progress: 0.55,
      dispatch: { type: 'ventilator', payload: { freshGasFlowLPerMin: 10 } },
      narration: 'Open the fresh gas to 10 L/min first. This is a bridge and not a treatment: high flow washes the rebreathed gas out of the circuit and buys time while the absorbent is found and changed. The objective scores it only if it comes BEFORE the definitive correction, which is the whole point of calling it a bridge.' };
  }
  if (patient.absorbentExhausted) {
    return { id: 'assess', focus: 'monitor', progress: 0.3,
      dispatch: { type: 'breathing-circuit', payload: { action: 'assess-capnogram' } },
      narration: 'Assess the capnogram — 30 seconds is the window. The finding is an inspired carbon dioxide that no longer returns to zero between breaths, which is a different observation from a rising end-tidal number and means something the end-tidal number alone does not: the patient is breathing back what they exhaled.' };
  }
  return { id: 'watching', focus: 'monitor', progress: 0.05,
    narration: 'A routine maintenance phase, and nothing to do yet. Both circuit actions are refused until the absorbent actually fails, and all three objectives are timed from that moment. Watch the inspiratory baseline of the capnogram rather than the end-tidal value.' };
}
