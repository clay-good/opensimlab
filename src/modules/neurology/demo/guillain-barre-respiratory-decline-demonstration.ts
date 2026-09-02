import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsGbs, type GbsAction, type GbsProgress,
} from '../guillain-barre-respiratory-decline';

export const GBS_DEMONSTRATION_VERSION = '0.1.0';

export function supportsGbsDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsGbs(scenario);
}

export interface GbsDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: GbsAction; readonly finished?: boolean;
}

/**
 * The worked example for a story so typical it stops people looking.
 *
 * It shares the saturation trap with the myasthenic lesson and adds two things
 * that lesson does not have. A mimic must be excluded before the obvious answer
 * is allowed, because ascending weakness with areflexia is also what a cord
 * lesion looks like. And dysautonomia is a third axis of risk where the
 * instruction is to monitor rather than chase — a rate between 48 and 138 is a
 * reason for cardiac ownership, not a list of numbers to treat one at a time.
 * This example measures no mechanics, takes no gas or CSF, interprets no
 * monitor, and selects no drug, dose, oxygen, ventilation, airway, rhythm or
 * pressure treatment.
 */
export function gbsDemonstrationStep(
  patient?: GbsProgress,
): GbsDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He is handed on with three problems running at once and the right people watching all of them. Nothing was proven and nothing was excluded — not the diagnosis, not the treatment, not what his autonomic swings do tonight. This ends the example, not the illness.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-neurology-gbs-clock-ascending-weakness-bulbar-respiratory-autonomic-and-whole-patient',
      narration: 'Measure this in days rather than in findings, because the speed is the risk. He walked yesterday morning, needed two people last night, and now cannot stand or lift either arm — forty-eight hours of ascending symmetric weakness after diarrhoea a fortnight ago. Facial diplegia, neck flexion weakness, mild dysphagia, short-phrase speech and a weak cough put the bulbar muscles in it too, and a rate of 112 with shallow breathing at 24 belongs to the same picture. How fast this has climbed is what predicts where it goes next.' };
  }
  if (patient.evidenceAtTick === null) {
    return { id: 'evidence', focus: 'monitor', progress: 0.26, action: 'review-neurology-gbs-supportive-evidence-mimics-and-diagnostic-boundary',
      narration: 'Ask what else does this, before the obvious answer is allowed to close. A CSF protein of 86 with 3 cells and a demyelinating nerve-conduction pattern support the picture and do not make any one test diagnostic. The mimic that matters is a cord lesion, because ascending weakness with absent reflexes is also what that looks like — and what argues against it here is worth saying out loud: sensation preserved enough for him to report tingling, no sensory level, no extensor plantar. Brainstem, junctional, motor-neuron, toxic, metabolic, infectious and inflammatory causes all stay open.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'actions', progress: 0.46, action: 'recognize-neurology-gbs-high-risk-respiratory-decline-without-score-or-single-cutoff',
      narration: 'Call this a high-risk respiratory decline while the saturation is still 98%. The vital capacity has gone from 3.6 to 2.4 litres, the single-breath count from 28 to 18, and the maximal inspiratory pressure from -45 to -30, all in twelve hours — and the blood gas is entirely normal, because in neuromuscular failure it is normal until it is not. No score and no single cutoff carries this decision: what carries it is the slope, plus a cough and a swallow that are already failing.' };
  }
  if (patient.ownershipAtTick === null) {
    return { id: 'ownership', focus: 'actions', progress: 0.64, action: 'activate-neurology-gbs-qualified-neurocritical-respiratory-airway-and-cardiac-ownership',
      narration: 'Bring neurocritical care, respiratory, an airway-capable owner and cardiac monitoring in together. The cardiac piece is the part that gets left off. A monitored hour with sinus rates from 58 to 126 and pressures from 96/58 to 176/104 is labile autonomic function, which is its own cause of death in this disease and is a reason to watch him continuously rather than a set of readings to correct one by one. Provoking or automatically treating each value is the failure mode; ownership and monitoring are the response.' };
  }
  if (patient.laterAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.82, action: 'review-neurology-gbs-strict-later-respiratory-bulbar-and-autonomic-trajectory',
      narration: 'Let the authored interval pass and read the qualified team’s 4-hour report. The interval is a contrast rather than a required wait, and nothing here says what any individual patient does next.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-neurology-gbs-airway-dysautonomia-treatment-recurrence-and-active-risk',
    narration: 'He cannot lift his head, speaks one word per breath, has a barely audible cough and needs continuous help clearing saliva; the vital capacity is 1.5 litres, the single-breath count 8, the PaCO2 only 46 — and the saturation is still 96%. Meanwhile the captured interval swings between 48 and 138 beats and between 88/52 and 188/110. Hand off the airway, the ventilation and the dysautonomia as three live problems, along with the treatment decision, the recurrence risk and a diagnosis that is still probable rather than proven.' };
}
