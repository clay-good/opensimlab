import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsCarbonMonoxide, type CarbonMonoxideAction, type CarbonMonoxideProgress,
} from '../carbon-monoxide-reassuring-monitor';

export const CARBON_MONOXIDE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsCarbonMonoxideDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsCarbonMonoxide(scenario);
}

export interface CarbonMonoxideDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: CarbonMonoxideAction; readonly finished?: boolean;
}

/**
 * The worked example for a monitor that has nothing useful to say and says it
 * confidently.
 *
 * The temptation here is not the antidote but the argument: name the poisoning,
 * quote 28%, and spend the rest of the case on whether he goes to a chamber.
 * This example goes outside the room first — the source, the scene, the partner
 * who breathed the same air — and then reads the number with its timing beside
 * it rather than as a grade. It names no chamber, pressure, duration, threshold
 * or eligibility result, and it finishes on an improvement that leaves the
 * delayed part of this poisoning entirely ahead of him.
 */
export function carbonMonoxideDemonstrationStep(
  patient?: CarbonMonoxideProgress,
): CarbonMonoxideDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He is handed on looking better than he did, with the source unresolved as a hazard, a second exposed person still owed the same care, and the delayed part of this poisoning entirely ahead of him. Nothing was excluded, and the numbers coming down did not need it to be. This ends the example, not the exposure.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-toxicology-carbon-monoxide-shared-exposure-clock-syncope-symptoms-pulse-ox-and-whole-patient',
      narration: 'Say the exposure, the clock and the syncope out loud before looking at the monitor again. A generator in an attached garage, two people with the same headache and nausea, a transient loss of consciousness, and confusion that has not cleared. The SpO2 of 99% goes in that sentence as a finding to be explained rather than as the reassurance it looks like.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'actions', progress: 0.24, action: 'recognize-toxicology-carbon-monoxide-pattern-despite-reassuring-pulse-ox-without-single-value-closure',
      narration: 'Record this as a suspected pattern, and record why the oximeter cannot argue with it: a conventional two-wavelength pulse oximeter cannot rule out carbon-monoxide poisoning, so a normal reading is not evidence against it. That is a reason to keep going rather than a diagnosis, and neurologic, cardiac, metabolic, toxic, traumatic and infectious causes all stay open.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.4, action: 'activate-toxicology-carbon-monoxide-source-safety-qualified-oxygen-monitoring-poison-center-and-emergency-ownership',
      narration: 'Move on the scene and the other person, not only on the patient in front of you. Removal is confirmed and the oxygen is running, so what is outstanding is outside this room: the source, the scene, and a partner with the same symptoms who is a second patient rather than a line in his history. The poison center or medical toxicology service and emergency ownership are called rather than assumed.' };
  }
  if (patient.severityAtTick === null) {
    return { id: 'severity', focus: 'monitor', progress: 0.56, action: 'review-toxicology-carbon-monoxide-supplied-cooximetry-neurologic-cardiac-and-severity-boundary',
      narration: 'Read the 28% with its timing beside it and refuse to let it grade him. The sample was drawn after removal and after oxygen had already started, so it sits below what his exposure was. Carboxyhemoglobin does not reliably grade severity or predict outcome — the syncope, the persistent confusion, the cardiac findings and the whole patient carry that, and none of them excludes a co-exposure or another cause.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'report', focus: 'monitor', progress: 0.76, action: 'record-toxicology-carbon-monoxide-selected-patient-hyperbaric-consultation-and-strict-reassessment',
      narration: 'Record the hyperbaric consultation as a consultation, let the authored interval pass, and read the qualified team’s report. Selection is individualized around symptoms, neurologic and cardiac involvement, severity, chamber availability, transport risk and elapsed time; there is no universal threshold to apply, and this example picks no chamber, pressure, duration or transfer.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-toxicology-carbon-monoxide-delayed-neurologic-cardiac-exposure-followup-and-active-risk',
    narration: 'COHb 7%, clearer orientation, rate 92, SpO2 100%. None of that proves a treatment effect, complete clearance or durable neurologic recovery, and delayed neurologic sequelae can appear days to weeks after an exposure that looked resolved. Hand off the follow-up, the cardiac surveillance, the co-exposed partner and the scene as live.' };
}
