import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsCholinergic, type CholinergicAction, type CholinergicProgress,
} from '../cholinergic-pesticide-respiratory-failure';

export const CHOLINERGIC_DEMONSTRATION_VERSION = '0.1.0';

export function supportsCholinergicDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsCholinergic(scenario);
}

export interface CholinergicDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: CholinergicAction; readonly finished?: boolean;
}

/**
 * The worked example for the one lesson here where the patient is not the first
 * thing to protect.
 *
 * A demonstration is at its least convincing when it asks someone to wait, so
 * this one spends a whole beat on why the room comes first: he is still wearing
 * the concentrate, nobody is protected yet, and a second and third patient
 * would delay him far longer than decontamination does. It names all three
 * halves of the cholinergic pattern rather than the mnemonic's one, treats the
 * secretions, the bronchospasm and the weakness as a single respiratory
 * problem, and finishes on a chest that sounds better attached to a man who is
 * still weak. It selects no glove, washing method, drug, dose, airway,
 * ventilator setting, or neuromuscular blocker.
 */
export function cholinergicDemonstrationStep(
  patient?: CholinergicProgress,
): CholinergicDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He is handed on breathing with help, sounding far better than he did, and no stronger than he was. Nothing was proven and nothing was excluded — not the decontamination, not his co-workers, not the days ahead. This ends the example, not the exposure.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-toxicology-cholinergic-product-route-secondary-contamination-secretions-breathing-weakness-cns-and-whole-patient',
      narration: 'Say that he is still wearing it, in the same breath as the saturation. Forty-five minutes after an organophosphate concentrate splashed across his clothing in an enclosed space, he is here in wet work clothes before any decontamination, at 86% with copious secretions, fasciculations and weak neck flexion. The clothing is a finding about this room rather than a detail of his history.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'actions', progress: 0.24, action: 'recognize-toxicology-cholinergic-muscarinic-nicotinic-and-cns-pattern-without-mnemonic-or-cholinesterase-only-closure',
      narration: 'Name all three halves of the pattern and refuse the two shortcuts. The muscarinic signs are the ones the mnemonic gives you, and they are not what kills him — the nicotinic weakness and the central depression are, with fasciculations, weak neck flexion, a weak cough, and a pH of 7.27 with a PCO2 of 52 in a man breathing thirty times a minute. The markedly low plasma cholinesterase marks the exposure rather than grading him.' };
  }
  if (patient.safetyAtTick === null) {
    return { id: 'safety', focus: 'actions', progress: 0.4, action: 'activate-toxicology-cholinergic-ppe-decontamination-airway-resuscitation-poison-center-and-safety-ownership',
      narration: 'Protect the room before treating the man in it. He is covered in concentrate and nobody about to work on him is protected yet, so appropriate PPE, contamination control, qualified clothing removal and dermal decontamination come first — not because he can wait, but because a second and third patient would make him wait far longer. Occupational safety and the co-workers still at the greenhouse get an owner too, alongside emergency, critical care, airway, respiratory, pharmacy and the poison center.' };
  }
  if (patient.evidenceAtTick === null) {
    return { id: 'evidence', focus: 'monitor', progress: 0.56, action: 'review-toxicology-cholinergic-supplied-respiratory-neuromuscular-cns-exposure-cholinesterase-and-airway-boundary',
      narration: 'Read the secretions, the bronchospasm and the weakness as one respiratory problem. Bronchorrhea, wheeze, a weak cough and shallow tiring ventilation are not four findings competing for attention — they are the reason this poisoning kills, and the airway question is early rather than eventual. Coformulants, additional routes, the product label and red-cell acetylcholinesterase stay qualified-team work, and this example selects no drug, dose, airway technique, ventilation setting, or neuromuscular blocker.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'report', focus: 'monitor', progress: 0.76, action: 'record-toxicology-cholinergic-bounded-qualified-atropine-pralidoxime-benzodiazepine-airway-and-surveillance-intent-with-strict-later-review',
      narration: 'Record the atropine, pralidoxime, benzodiazepine-if-needed, early airway and decontamination intents as intents, let the authored interval pass, and read the qualified team’s 30-minute report. The interval is a contrast rather than a required wait, and nothing here says how any individual exposure answers.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-toxicology-cholinergic-recurrent-secretions-bronchospasm-weakness-intermediate-syndrome-exposure-seizure-and-active-risk',
    narration: 'Decontamination completed, secretions and wheeze markedly reduced, 96% on assisted ventilation, mentation clearer — and the fasciculations and proximal weakness have not moved. Drying secretions is not neuromuscular recovery, and none of this proves the treatment did it, that decontamination is complete, or that his co-workers are safe. Hand off recurrence, delayed intermediate syndrome, seizure risk, the exposure investigation and his ventilation as live.' };
}
