import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsNeuromuscularRespiratoryFailure, type NeuromuscularRespiratoryFailureAction, type NeuromuscularRespiratoryFailureProgress,
} from '../neuromuscular-respiratory-failure-reassessment';

export const NEUROMUSCULAR_RESPIRATORY_FAILURE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsNeuromuscularRespiratoryFailureDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsNeuromuscularRespiratoryFailure(scenario);
}

export interface NeuromuscularRespiratoryFailureDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: NeuromuscularRespiratoryFailureAction; readonly finished?: boolean;
}

/**
 * The worked example for a patient whose saturation looks fine.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. It examines nobody, acquires, scores and interprets no
 * mechanics, cough test, gas or image, selects no oxygen, device, interface,
 * mode, setting, cough assistance or nutrition, performs no procedure, and
 * determines no disposition, prognosis or outcome.
 */
export function neuromuscularRespiratoryFailureDemonstrationStep(
  patient?: NeuromuscularRespiratoryFailureProgress,
): NeuromuscularRespiratoryFailureDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'Experienced help is connected, the causes are still open, his priorities are written down rather than assumed, and every remaining piece of work has somebody’s name on it. Nothing was diagnosed, nothing was prescribed, and no device was chosen. This ends the example, not the evaluation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.1, action: 'reconcile-neuromuscular-respiratory-failure-trajectory',
      narration: 'Read three months of decline against two weeks of new symptoms. He has established amyotrophic lateral sclerosis, and over three months he has lost walking endurance and cough strength. What is new is two weeks old: orthopnea, fragmented sleep, morning headaches, daytime sleepiness, breathlessness while speaking, and difficulty clearing saliva. In front of you he is alert with short-phrase speech, breathing shallowly at 24, with a room-air saturation of 94%. That saturation is the number most likely to reassure you, and it is the number that says least about whether he is ventilating.' };
  }
  if (patient.failureAtTick === null) {
    return { id: 'failure', focus: 'monitor', progress: 0.28, action: 'recognize-neuromuscular-respiratory-failure',
      narration: 'Let the whole pattern establish it, not one cutoff. Seated FVC has fallen from 68% to 46% predicted over three months, supine FVC is 30%, SNIP has fallen from 50 to 28 cmH₂O, and peak cough flow from 340 to 210 L/min — with acceptable interfaces and repeatability documented for this case. The room-air gas shows pH 7.34, PaCO₂ 52, PaO₂ 68, bicarbonate 28. Orthopnea, the sleep and daytime symptoms, the supine abdominal paradox, the weak cough, the hypercapnia and the convergent serial decline are what establish progressive ventilatory failure. No single one of these is offered as a universal threshold, and you are not the one performing or interpreting any of them.' };
  }
  if (patient.escalationAtTick === null) {
    return { id: 'escalation', focus: 'actions', progress: 0.46, action: 'activate-neuromuscular-respiratory-failure-escalation',
      narration: 'Connect experienced help now, before the cause review is finished. Persistent ventilatory, cough, secretion and bulbar risk is already present, and respiratory-ventilation, critical-care and airway-capable evaluation should not wait for a complete list of contributors. Activating that evaluation is not the same as choosing a treatment: no oxygen, no noninvasive or invasive ventilation, no interface, mode or setting, no cough assistance, no suction and no airway procedure is being selected here. The review runs in parallel with this, not after it.' };
  }
  if (patient.reviewAtTick === null) {
    return { id: 'review', focus: 'monitor', progress: 0.64, action: 'review-neuromuscular-respiratory-failure-bulbar-cough-and-alternatives',
      narration: 'Keep the motor neuron disease central, and keep everything else open. The radiograph shows low lung volumes without consolidation, edema, effusion or pneumothorax; temperature is 36.8°C and glucose 102 mg/dL; the neurologic report describes no abrupt focal change. Those narrow the field and permanently exclude nothing. Aspiration, infection, mucus retention, atelectasis, pulmonary embolism, obstructive or restrictive lung disease, cardiac disease, metabolic or endocrine disturbance, medication effect, another neuromuscular process, central hypoventilation, poor test performance and rapid deterioration all stay open — and so do his cough, his secretions, his swallowing, his communication and his triggers, which belong in the respiratory plan rather than alongside it.' };
  }
  if (patient.ownershipAtTick === null) {
    return { id: 'ownership', focus: 'actions', progress: 0.8, action: 'coordinate-neuromuscular-respiratory-failure-goals-and-ownership',
      narration: 'Name every owner, and ask him rather than assume. Respiratory, neurology, speech and swallowing, nutrition, physiotherapy, nursing, primary care and his caregivers, around documented preferences and symptom goals as well as mechanics. His speech is short-phrase and dysarthric, which makes communication part of the clinical work rather than a courtesy. Nothing here infers what he would want, and nothing here selects a device, a technique, a procedure, a nutrition plan, a treatment, a disposition, a prognosis or an outcome — the respiratory-support and secretion-management evaluation and the follow-up interval are what get owned.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-neuromuscular-respiratory-failure-reassessment',
    narration: 'Hand off work that is still active and still unfinished. What travels is the serial trajectory, the current mechanics and gas evidence, the ventilation, cough, secretion and bulbar risks that are live right now, the causes still open, his documented priorities, the work still pending, the triggers that should bring someone back sooner, and a name against each part of it. Nothing here determines a diagnosis, a support selection, a procedure, a treatment response, a disposition, a prognosis or an outcome.' };
}
