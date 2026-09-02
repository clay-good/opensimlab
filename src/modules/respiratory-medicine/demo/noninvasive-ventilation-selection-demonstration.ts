import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsNoninvasiveVentilationSelection, type NoninvasiveVentilationSelectionAction,
  type NoninvasiveVentilationSelectionProgress,
} from '../noninvasive-ventilation-selection';

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
      narration: 'Ask what an hour of correct treatment has already failed to fix. She has COPD, lives independently and walks to the shops, and her stable gas was pH 7.39 with a PaCO₂ of 48. She arrived at 32 breaths a minute and 84% on air, and over sixty minutes an experienced team gave controlled oxygen, repeated bronchodilators and an antimuscarinic, a systemic steroid and antibiotics for the authored indication. None of that was yours to give, and all of it was right. What matters is that she is still in short phrases with accessory-muscle use, and her repeat gas is pH 7.28 with a PaCO₂ of 68. This is persistent acidotic hypercapnia after correct therapy, which is a different question from the one she arrived with.' };
  }
  if (patient.suitabilityAtTick === null) {
    return { id: 'suitability', focus: 'monitor', progress: 0.28, action: 'review-noninvasive-ventilation-selection-suitability-and-rescue-readiness',
      narration: 'Check she is a candidate, and check somebody can rescue her. The fixed report describes a patent airway, secretions she is handling, cooperation, and none of vomiting, hematemesis, facial injury, untreated pneumothorax, apnea, arrest, severe agitation, lost airway protection, shock or an immediate-deterioration pattern. Her goals and preferences have been discussed, continuous observation and serial reassessment are available, and an airway-capable rescue plan is active. Read that as support for a closely monitored trial in this case — not as your own examination, not as permanent exclusions, and not as a checklist to tick.' };
  }
  if (patient.selectionAtTick === null) {
    return { id: 'selection', focus: 'actions', progress: 0.46, action: 'select-bilevel-noninvasive-ventilation',
      narration: 'Choose the support that assists her breathing, not just her oxygen. A closely monitored bilevel NIV trial is what fits persistent acute-on-chronic acidotic hypercapnia after verified initial therapy. CPAP alone and high-flow nasal oxygen alone are both offered here and neither provides the ventilatory assistance this pattern needs. What you are selecting is a goal: qualified staff own the device, the interface, the fit, the pressures, the backup rate, the oxygen and the rapid rescue, and none of those are yours to set.' };
  }
  if (patient.responseAtTick === null) {
    return { id: 'response', focus: 'monitor', progress: 0.64, action: 'review-noninvasive-ventilation-selection-early-response',
      narration: 'Give it time, then read the response you were given. The first hour is a fixed authored report, not something you titrate your way to, and it cannot be read before simulated time has passed. What you are looking for is whether the acidosis, the carbon dioxide and the work of breathing are moving in the right direction — and whether she is tolerating the trial at all, which is as much a part of the answer as the gas.' };
  }
  if (patient.failureGuardsAtTick === null) {
    return { id: 'guards', focus: 'actions', progress: 0.8, action: 'review-noninvasive-ventilation-selection-failure-guards',
      narration: 'Decide now what would make you stop, while there is still time to act on it. A trial without a failure guard is just an assumption with a mask on it. Name what continuation depends on, what would count as deterioration, who is watching, how often she is reassessed, and who is called and how fast if this does not work. The rescue plan was active before you started, and it has to survive the part where things go well for an hour.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-noninvasive-ventilation-selection-reassessment',
    narration: 'Hand off a trial that is working so far and is not finished. What travels is her baseline and her independence, the verified initial care, the trajectory that made this necessary, the choice you made and why the alternatives were not it, the first-hour response, the guards and the triggers, who is watching and who is called. Nothing here proves durable success, determines a ceiling of care, decides a disposition, or predicts an outcome.' };
}
