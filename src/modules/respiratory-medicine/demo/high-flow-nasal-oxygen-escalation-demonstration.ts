import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsHighFlowOxygenEscalation, type HighFlowOxygenEscalationAction,
  type HighFlowOxygenEscalationProgress,
} from '../high-flow-nasal-oxygen-escalation';

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
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He is half an hour into a trial that is going the right way, on the interface he said he wanted, with named guards and an airway-capable rescue that was active before any of this started. The pathogen is still unknown and nothing here proves the trial will hold. This ends the example, not the evaluation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.1, action: 'reconcile-high-flow-oxygen-conventional-support-trajectory',
      narration: 'The oxygen is working. He is still not managing. A 52-year-old music teacher who normally walks to work, four days of fever and cough, and new bilateral inflammatory opacities without an edema pattern, pneumothorax or large effusion. Twenty minutes on a verified functioning reservoir mask at 15 L/min, and he is still in short phrases with accessory-muscle use, 34 breaths a minute and 88%. His gas is pH 7.46, PaCO₂ 31, PaO₂ 55 — alkalotic from working hard, not acidotic. The equipment is not the problem and there is nothing left to turn up: this is de novo hypoxemic failure that has outgrown conventional oxygen.' };
  }
  if (patient.suitabilityAtTick === null) {
    return { id: 'suitability', focus: 'monitor', progress: 0.28, action: 'review-high-flow-oxygen-suitability-and-rescue-readiness',
      narration: 'Check he is a candidate, check somebody can rescue him, and ask him. The fixed report describes a patent airway, secretions he is handling, cooperation, and none of emesis, hematemesis, facial injury, untreated pneumothorax, apnea, arrest, severe agitation, lost airway protection, shock or an immediate-deterioration pattern. Continuous observation and serial reassessment are available and an airway-capable rescue plan is active. His preference for a nasal interface is documented, which is a clinical fact here rather than a courtesy — the tolerability of what you choose is part of whether it works. Read all of that as support for a closely monitored trial in this case, not as your own examination and not as a checklist to tick.' };
  }
  if (patient.selectionAtTick === null) {
    return { id: 'selection', focus: 'actions', progress: 0.46, action: 'select-high-flow-nasal-oxygen-escalation',
      narration: 'Escalate the oxygen delivery, and keep the rescue plan next to it. A closely monitored high-flow nasal oxygen trial is the strong guideline pathway for this authored de novo hypoxemic pattern. What you are selecting is a goal: qualified staff own the source, the device, the cannula, the fit, the flow, the temperature, the humidification, the FiO₂ and the oxygen target, and none of those are yours to set. The trial only means anything alongside the airway-capable rescue that was already active.' };
  }
  if (patient.responseAtTick === null) {
    return { id: 'response', focus: 'monitor', progress: 0.64, action: 'review-high-flow-oxygen-early-response',
      narration: 'Give it time, then read the thirty-minute response you were given. It is a fixed authored report and it cannot be read before simulated time has passed. Look at the whole person rather than one number: the work of breathing, the respiratory rate, the mentation, the comfort and the tolerance of the interface, alongside the oxygenation. And note what this lesson deliberately does not let you compute — no ROX index, no PaO₂/FiO₂ ratio — because the delivered FiO₂ on that reservoir mask was never actually known.' };
  }
  if (patient.guardsAtTick === null) {
    return { id: 'guards', focus: 'actions', progress: 0.8, action: 'preserve-high-flow-oxygen-monitoring-and-failure-guards',
      narration: 'Name what would make you stop, and who you would call. High-flow can make a patient look and feel better while the underlying failure continues, which is exactly why the guards matter more here than in a therapy that declares itself. Say what continuation depends on, what counts as deterioration, how often he is reassessed, who is watching, and who is called and how fast. Delayed intubation is the specific harm this trial risks, and a guard written down in advance is what prevents it.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-high-flow-oxygen-escalation',
    narration: 'Hand off a trial that is working so far and is not finished. What travels is his baseline and his independence, the failure of verified conventional oxygen, the trajectory that made escalation necessary, the choice you made and why the alternatives were not it here, the thirty-minute response, the guards and the triggers, his documented preference, and who is watching and who is called. Nothing here proves durable success, resolves the pathogen or the cause, determines a disposition, or predicts an outcome.' };
}
