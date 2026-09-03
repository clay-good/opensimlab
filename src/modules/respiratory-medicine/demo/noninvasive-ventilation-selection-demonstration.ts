import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsNoninvasiveVentilationSelection, type NoninvasiveVentilationSelectionAction,
  type NoninvasiveVentilationSelectionProgress,
} from '../noninvasive-ventilation-selection';
import { noninvasiveVentilationSelectionInlinePrompt } from '../tutor/noninvasive-ventilation-selection-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: NoninvasiveVentilationSelectionProgress): string {
  const prompt = noninvasiveVentilationSelectionInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const NIV_SELECTION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsNoninvasiveVentilationSelectionDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsNoninvasiveVentilationSelection(scenario);
}

export interface NoninvasiveVentilationSelectionDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: NoninvasiveVentilationSelectionAction; readonly finished?: boolean;
}

/**
 * The worked example for a choice between three plausible devices.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. The example never makes the wrong choice — the tutor answers
 * those if a learner does — but it does say plainly why CPAP alone and
 * high-flow alone are not it. It examines nobody, acquires and interprets no
 * test, and sets no interface, pressure, backup rate or FiO₂: it selects a
 * goal and leaves every setting to the qualified staff who own it.
 */
export function noninvasiveVentilationSelectionDemonstrationStep(
  patient?: NoninvasiveVentilationSelectionProgress,
): NoninvasiveVentilationSelectionDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is an hour into a trial that is going the right way, with named guards, a named watcher and a rescue plan that was active before anyone put a mask on her. Nothing here proves the trial will hold, decides a ceiling of care, or predicts how this ends. This ends the example, not the evaluation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.1, action: 'reconcile-noninvasive-ventilation-selection-treatment-and-trajectory',
      narration: narrate(patient) };
  }
  if (patient.suitabilityAtTick === null) {
    return { id: 'suitability', focus: 'monitor', progress: 0.28, action: 'review-noninvasive-ventilation-selection-suitability-and-rescue-readiness',
      narration: narrate(patient) };
  }
  if (patient.selectionAtTick === null) {
    return { id: 'selection', focus: 'actions', progress: 0.46, action: 'select-bilevel-noninvasive-ventilation',
      narration: narrate(patient) };
  }
  if (patient.responseAtTick === null) {
    return { id: 'response', focus: 'monitor', progress: 0.64, action: 'review-noninvasive-ventilation-selection-early-response',
      narration: narrate(patient) };
  }
  if (patient.failureGuardsAtTick === null) {
    return { id: 'guards', focus: 'actions', progress: 0.8, action: 'review-noninvasive-ventilation-selection-failure-guards',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-noninvasive-ventilation-selection-reassessment',
    narration: narrate(patient) };
}
