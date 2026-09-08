import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsBronchospasm } from '../bronchospasm';

/**
 * What this worked example reads.
 *
 * The sixth observed-state demonstration in the anaesthesia module, and the
 * first whose trigger is a shape rather than a threshold. The obstruction begins
 * at a severity of 0.35 and builds, so the engine's bronchospasm severity moves
 * long before the end-tidal figure leaves its alarm limits — and the example
 * gates on the severity for exactly that reason, because gating on the number
 * would reproduce the delay the lesson exists to argue against.
 */
export interface BronchospasmProgress {
  readonly inspiredOxygenFraction: number;
  readonly endTidalOxygenFraction: number;
  readonly ventilatorDelivering: boolean;
  /** Lower-airway obstruction, which moves before the end-tidal number does. */
  readonly bronchospasmSeverity: number;
  readonly etco2MmHg: number;
  readonly depthIndex: number;
  readonly helpRequested: boolean;
  readonly salbutamolTotalMg: number;
  readonly remifentanilPlasma: number;
  readonly propofolPlasma: number;
  readonly intubated: boolean;
  readonly airwayAttempts: number;
  readonly airwayAttemptInProgress: boolean;
}

export const BRONCHOSPASM_DEMONSTRATION_VERSION = '0.1.0';

export function supportsBronchospasmDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsBronchospasm(scenario);
}

export interface BronchospasmDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

/**
 * The worked example for the obstruction you can see before you can measure it.
 *
 * Read from the latest stage backwards, as the five before it are. The ordering
 * facts that cannot go back are an airway attempt made, a help request accepted
 * and a cumulative salbutamol total — the severity itself rises and falls, so it
 * can trigger the sequence but cannot order it.
 *
 * It intubates nobody, gives no real drug, and predicts no outcome for anyone.
 */
export function bronchospasmDemonstrationStep(
  patient?: BronchospasmProgress,
): BronchospasmDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.salbutamolTotalMg > 0) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: `Salbutamol in, help on the way, the plane deepened, and the inspired oxygen at 100%. Now look back at what started this and when. The end-tidal number was ${patient.etco2MmHg.toFixed(0)} mmHg when the response began, which is inside its alarm limits — nothing on this monitor was flashing. What moved was the shape: the plateau stopped being flat and began to slope, because the lung was still emptying when the next breath arrived. A number tells you where a value is; the slope tells you what the lung is doing to get there. The other half of this case was decided before any of it, at the induction, and it is not in the last two minutes at all. This ends the example, not the evaluation.` };
  }
  if (patient.bronchospasmSeverity > 0.05) {
    if (patient.inspiredOxygenFraction < 0.95) {
      return { id: 'oxygen-up', focus: 'actions', progress: 0.6,
        dispatch: { type: 'ventilator', payload: { fio2: 1 } },
        narration: `The bag is harder to squeeze and the plateau is sloping. End-tidal carbon dioxide is ${patient.etco2MmHg.toFixed(0)} mmHg, which has not alarmed and will not for a while. Oxygen to 100% first, before working out what this is: the margin is cheap now and expensive later.` };
    }
    if (!patient.helpRequested) {
      return { id: 'escalate', focus: 'actions', progress: 0.7,
        dispatch: { type: 'call-for-help', payload: { context: 'bronchospasm' } },
        narration: 'Ask for help now, while this is still an inconvenience. The objective gives sixty seconds from onset for a reason that has nothing to do with what a second person does in the next minute — team arrival and communication are not modelled here at all — and everything to do with the fact that the decision gets harder to make the worse things get.' };
    }
    if (patient.depthIndex > 60) {
      // Keyed on the depth decade so it can titrate rather than dose once. A
      // single fixed id stalls the example when 30 mg is not enough to bring a
      // light plane back into range, which is exactly the patient who needs it.
      return { id: `deepen-${Math.floor(patient.depthIndex / 10)}`, focus: 'analysis', progress: 0.8,
        dispatch: { type: 'bolus', payload: { drugId: 'propofol', amount: 30, unit: 'mg' } },
        narration: `Deepen before treating the wheeze as a separate problem. A light plane is the commonest reason for a rising airway pressure after intubation, it is the cheapest thing to exclude, and it is excluded by doing something rather than by thinking about it. Depth index ${patient.depthIndex.toFixed(0)}.` };
    }
    return { id: 'nebulize', focus: 'actions', progress: 0.9,
      dispatch: { type: 'inhaled-bronchodilator', payload: { agentId: 'salbutamol', route: 'nebulized', doseMg: 5 } },
      narration: `Depth index ${patient.depthIndex.toFixed(0)}, so the cheapest explanation is already excluded rather than assumed — a light plane is the commonest reason for a rising airway pressure after intubation, and this monitor says it is not this one. Now the bronchodilator, in that order rather than first. Five milligrams of nebulized salbutamol; the model bounds it there and refuses anything else, which is a teaching decision rather than a dosing claim. What it does not model is whether any of it reaches a lung that is this tight, which is the actual question.` };
  }
  if (patient.intubated) {
    return { id: 'watching', focus: 'monitor', progress: 0.45,
      narration: 'Tube in, ventilating, and the surgery about to start. Nothing to do here except watch the capnogram as a picture rather than as a figure. She told you her chest has felt tight since the infection and that she has not needed her inhaler this week, and the second half of that sentence is the part that sounds reassuring and is not.' };
  }
  if (patient.airwayAttemptInProgress) {
    return { id: `attempt-${patient.airwayAttempts}`, focus: 'monitor', progress: 0.4,
      narration: 'The attempt is running. Straightforward airway, and the instrumentation itself is one of the things that provokes what happens next.' };
  }
  if (patient.propofolPlasma > 0) {
    if (patient.airwayAttempts > 0) {
      return { id: `airway-again-${patient.airwayAttempts}`, focus: 'actions', progress: 0.38,
        dispatch: { type: 'laryngoscopy', payload: { technique: 'video' } },
        narration: 'That attempt did not place the tube, which the distribution allows. Going again, and repeated instrumentation of a twitchy airway is itself a reason this case goes where it goes.' };
    }
    return { id: 'airway', focus: 'actions', progress: 0.35,
      dispatch: { type: 'laryngoscopy', payload: { technique: 'video' } },
      narration: 'The airway. Mallampati II with large tonsils and nothing predicted, and the tube is going into a bronchial tree that has been irritable for three weeks.' };
  }
  if (patient.remifentanilPlasma > 0) {
    return { id: 'hypnotic', focus: 'analysis', progress: 0.28,
      dispatch: { type: 'bolus', payload: { drugId: 'propofol', amount: 1.5, unit: 'mg/kg' } },
      narration: 'Propofol, 1.5 mg/kg rather than the 2 the syringe also offers. This is the beat that decides half the debrief and it happens four minutes before anything goes wrong: the pressure this induction costs is what the hypotension objective measures, and no amount of managing the wheeze well afterwards gives it back.' };
  }
  if (patient.inspiredOxygenFraction < 0.9) {
    return { id: 'oxygen', focus: 'actions', progress: 0.08,
      dispatch: { type: 'ventilator', payload: { fio2: 1 } },
      narration: 'Oxygen to 100%. She is twenty-nine and healthy apart from a chest that has not settled since a viral infection, which is exactly the history that makes the next ten minutes worth preparing for.' };
  }
  if (patient.endTidalOxygenFraction < 0.9) {
    return { id: 'filling', focus: 'monitor', progress: 0.18,
      narration: 'Watching the end-tidal oxygen climb rather than the flowmeter, as in every induction. The end-tidal fraction is the one that says her lungs are holding it.' };
  }
  return { id: 'opioid', focus: 'analysis', progress: 0.22,
    dispatch: { type: 'bolus', payload: { drugId: 'remifentanil', amount: 30, unit: 'µg' } },
    narration: 'Remifentanil to blunt the airway response. In a twitchy airway that is not only about the pressor response — instrumentation is the stimulus this whole case turns on.' };
}
