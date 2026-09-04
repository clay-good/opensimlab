import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsHighFlowOxygenEscalation, type HighFlowOxygenEscalationAction,
  type HighFlowOxygenEscalationProgress,
} from '../high-flow-nasal-oxygen-escalation';
import { highFlowOxygenEscalationInlinePrompt } from '../tutor/high-flow-nasal-oxygen-escalation-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: HighFlowOxygenEscalationProgress): string {
  const prompt = highFlowOxygenEscalationInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const HIGH_FLOW_OXYGEN_DEMONSTRATION_VERSION = '0.1.0';

export function supportsHighFlowOxygenEscalationDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsHighFlowOxygenEscalation(scenario);
}

export interface HighFlowOxygenEscalationDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: HighFlowOxygenEscalationAction; readonly finished?: boolean;
}

/**
 * The worked example for the moment conventional oxygen runs out.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. The example never makes either wrong choice — the tutor
 * answers those if a learner does — but it is explicit that neither is
 * absurd. It examines nobody, acquires and interprets no test, computes no
 * ROX index or PaO₂/FiO₂ ratio, and sets no flow, temperature, humidification
 * or FiO₂: it selects a goal and leaves every setting to the qualified staff
 * who own it.
 */
export function highFlowOxygenEscalationDemonstrationStep(
  patient?: HighFlowOxygenEscalationProgress,
): HighFlowOxygenEscalationDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He is half an hour into a trial that is going the right way, on the interface he said he wanted, with named guards and an airway-capable rescue that was active before any of this started. The pathogen is still unknown and nothing here proves the trial will hold. This ends the example, not the evaluation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.1, action: 'reconcile-high-flow-oxygen-conventional-support-trajectory',
      narration: narrate(patient) };
  }
  if (patient.suitabilityAtTick === null) {
    return { id: 'suitability', focus: 'monitor', progress: 0.28, action: 'review-high-flow-oxygen-suitability-and-rescue-readiness',
      narration: narrate(patient) };
  }
  if (patient.selectionAtTick === null) {
    return { id: 'selection', focus: 'actions', progress: 0.46, action: 'select-high-flow-nasal-oxygen-escalation',
      narration: narrate(patient) };
  }
  if (patient.responseAtTick === null) {
    return { id: 'response', focus: 'monitor', progress: 0.64, action: 'review-high-flow-oxygen-early-response',
      narration: narrate(patient) };
  }
  if (patient.guardsAtTick === null) {
    return { id: 'guards', focus: 'actions', progress: 0.8, action: 'preserve-high-flow-oxygen-monitoring-and-failure-guards',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-high-flow-oxygen-escalation',
    narration: narrate(patient) };
}
