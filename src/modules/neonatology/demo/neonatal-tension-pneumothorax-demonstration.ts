import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsTensionPneumothorax, type TensionPneumothoraxAction, type TensionPneumothoraxProgress,
} from '../neonatal-tension-pneumothorax';

export const TENSION_PNEUMOTHORAX_DEMONSTRATION_VERSION = '0.1.0';

export function supportsTensionPneumothoraxDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsTensionPneumothorax(scenario);
}

export interface TensionPneumothoraxDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: TensionPneumothoraxAction; readonly finished?: boolean;
}

/**
 * The worked example for a suspicion that cannot wait for its confirmation.
 *
 * A demonstration wants to arrive at a diagnosis, and this one is not allowed
 * to. It acts on a suspected pattern, holds the alternatives open the whole way
 * through, and finishes on a response that is real and partial: better numbers,
 * still-asymmetric chest movement, an air leak nobody has proven resolved. It
 * selects no device, size, site, or analgesia, because those belong to local
 * protocol and the qualified team rather than to this bedside.
 */
export function tensionPneumothoraxDemonstrationStep(
  patient?: TensionPneumothoraxProgress,
): TensionPneumothoraxDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'The newborn is handed on with the air leak unproven, the diagnosis unconfirmed, the other causes still open, and the response described as partial. Nothing here was resolved, and the improvement did not need it to be. This ends the example, not the emergency.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.08, action: 'activate-neonatal-tension-pneumothorax-respiratory-decompression-monitoring-and-family-support',
      narration: 'Confirm a team that can decompress rather than only ventilate, with airway, drain, monitoring, analgesia, imaging and the parents all owned. The decompression-capable part is the one that is easy to assume and expensive to discover missing.' };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'actions', progress: 0.24, action: 'reconcile-neonatal-tension-pneumothorax-support-clock-sudden-change-asymmetry-perfusion-and-whole-dyad',
      narration: 'Connect the support already running to the moment it stopped working: gestation, the respiratory disease, the device and circuit report, and the clocked deterioration in one sentence. A sudden change during positive pressure is a different finding from a gradual one.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'actions', progress: 0.4, action: 'recognize-suspected-neonatal-tension-pneumothorax-with-cardiopulmonary-compromise-without-imaging-delay',
      narration: 'Record this as a suspected pattern and act on it as one. Rapid deterioration on positive pressure with asymmetric movement and air entry and circulatory compromise supports urgent suspicion — while obstruction, displacement, equipment failure, atelectasis, hemorrhage and infection all stay open, and none of them is a reason to wait for a film.' };
  }
  if (patient.readinessAtTick === null) {
    return { id: 'readiness', focus: 'actions', progress: 0.56, action: 'review-qualified-neonatal-tension-pneumothorax-oxygenation-ventilation-decompression-drain-and-reassessment-boundaries',
      narration: 'Review what the guidance settles and what it leaves to the team. For an unstable newborn with this pattern, emergency decompression should not wait for radiography. The device, size, site, analgesia, ventilation changes, drain and imaging are local-protocol work, and this example chooses none of them.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'report', focus: 'monitor', progress: 0.76, action: 'review-neonatal-tension-pneumothorax-fixed-two-minute-qualified-report',
      narration: 'Let the authored two minutes pass and read the qualified team’s report. The interval is a contrast rather than a required wait, and nothing here predicts how quickly a real chest answers.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-neonatal-tension-pneumothorax-air-leak-lung-support-circulatory-family-and-outcome-risk',
    narration: 'Heart rate 138, 91% on 60% oxygen, mean pressure 40, refill 3 seconds, chest movement improving and still asymmetric. That is improvement without resolution, so hand off the air leak as unproven, the diagnosis as unconfirmed, and the alternatives as still open.' };
}
