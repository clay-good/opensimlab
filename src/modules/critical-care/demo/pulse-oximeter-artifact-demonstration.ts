import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPulseOximeterArtifact, type PulseOximeterArtifactAction,
  type PulseOximeterArtifactProgress,
} from '../pulse-oximeter-artifact';
import { pulseOximeterArtifactInlinePrompt } from '../tutor/pulse-oximeter-artifact-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: PulseOximeterArtifactProgress): string {
  const prompt = pulseOximeterArtifactInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const PULSE_OXIMETER_ARTIFACT_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPulseOximeterArtifactDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPulseOximeterArtifact(scenario);
}

export interface PulseOximeterArtifactDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PulseOximeterArtifactAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a number nobody should treat and nobody should
 * dismiss.
 *
 * Five beats in the only order the engine accepts. It inspects and moves no
 * probe, examines no perfusion, samples no blood, delivers no oxygen or
 * treatment, configures no monitor, diagnoses neither artifact nor hypoxaemia,
 * determines no disposition, and predicts no outcome.
 */
export function pulseOximeterArtifactDemonstrationStep(
  patient?: PulseOximeterArtifactProgress,
): PulseOximeterArtifactDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.reassessedAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'Nobody treated the 82% and nobody dismissed it either. Those are the two ways this goes wrong, and the step that separates them is the arterial panel: everything before it was a persuasive case that the signal was bad, and a persuasive case is exactly what makes a real desaturation easy to explain away. The pulse rates agreeing at the end is what closes the loop, because the mismatch was the first thing that was wrong. Artifact is supported here, not proven. This ends the example, not the evaluation.' };
  }
  if (patient.discordanceAtTick === null) {
    return { id: 'discordance', focus: 'monitor', progress: 0.12,
      action: 'recognize-pulse-oximeter-discordance', narration: narrate(patient) };
  }
  if (patient.plethAtTick === null) {
    return { id: 'pleth', focus: 'monitor', progress: 0.32,
      action: 'inspect-pleth-and-pulse-rate-coherence', narration: narrate(patient) };
  }
  if (patient.probePerfusionAtTick === null) {
    return { id: 'probe', focus: 'monitor', progress: 0.54,
      action: 'review-probe-motion-and-perfusion', narration: narrate(patient) };
  }
  if (patient.corroboratedAtTick === null) {
    return { id: 'corroborate', focus: 'actions', progress: 0.76,
      action: 'corroborate-oxygenation-independently', narration: narrate(patient) };
  }
  return { id: 'reassess', focus: 'monitor', progress: 0.9,
    action: 'reassess-pulse-oximeter-signal', narration: narrate(patient) };
}
