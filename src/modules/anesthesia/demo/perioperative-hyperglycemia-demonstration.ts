import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsPerioperativeHyperglycemia } from '../perioperative-hyperglycemia';

/**
 * What this worked example reads.
 *
 * The thirty-fourth observed-state demonstration in the anaesthesia module, and
 * the tenth to open with a beat that deliberately does nothing.
 *
 * It also carries the module's longest hold: after the insulin intent it waits
 * thirty simulated minutes with a no-dispatch beat, because asking early is
 * refused. Every gate is a latched tick, and `repeatEligible` is read from the
 * engine rather than computed here.
 */
export interface PerioperativeHyperglycemiaProgress {
  readonly pointOfCareGlucoseMgPerDl: number | null;
  readonly pointOfCareConfirmedAtTick: number | null;
  readonly insulinProtocolIntentAtTick: number | null;
  readonly repeatEligible: boolean;
  readonly repeatPointOfCareAtTick: number | null;
  readonly repeatPointOfCareGlucoseMgPerDl: number | null;
}

export const PERIOPERATIVE_HYPERGLYCEMIA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPerioperativeHyperglycemiaDemonstration(scenario: Scenario): boolean {
  // The module's only 0.1.1 lesson; every other one pins 0.1.0.
  return scenario.metadata.version === '0.1.1' && supportsPerioperativeHyperglycemia(scenario);
}

export interface PerioperativeHyperglycemiaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

const glycemic = (response: string): Omit<LearnerAction, 'tick'> =>
  ({ type: 'glycemic-response', payload: { response } });

/**
 * The worked example for the check that cannot be hurried.
 *
 * Read from the latest stage backwards, as the thirty-three before it are.
 *
 * It gives no insulin to anyone and predicts no outcome for any person.
 */
export function perioperativeHyperglycemiaDemonstrationStep(
  patient?: PerioperativeHyperglycemiaProgress,
): PerioperativeHyperglycemiaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.repeatPointOfCareAtTick !== null) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'The repeat is recorded at 174 mg/dL, inside the 100 to 180 target. Two things are worth carrying away and both are about what this lesson can and cannot show you. The repeat value is authored: it is 174 on every run that obtains it, whatever was recorded beforehand, because insulin action here is intent without dose or delivery. So the third objective grades whether the check was made, never what it found — no path through this lesson can produce a repeat outside the target, and none can produce a worse one by giving a worse response. And the run worth comparing against is not a careless one: it confirms correctly, records the protocol correctly, and asks for the repeat at fifteen minutes instead of thirty. The engine declines it, and if nobody asks again the objective is lost to impatience rather than to neglect. Waiting is the skill this particular objective measures. Nothing here changes a monitored physiological variable at all; this is a documentation lesson and it says so. This ends the example, not the evaluation.' };
  }
  if (patient.repeatEligible && patient.insulinProtocolIntentAtTick !== null) {
    return { id: 'repeat', focus: 'monitor', progress: 0.9,
      dispatch: glycemic('repeat-point-of-care-glucose'),
      narration: 'Thirty simulated minutes have passed, so the repeat check is now available. Ask for it. The interval is the point: a glucose repeated too soon measures the assay and the last dose rather than the response, which is why the engine refuses an earlier attempt outright rather than returning a number that would look like information.' };
  }
  if (patient.insulinProtocolIntentAtTick !== null) {
    return { id: 'waiting', focus: 'monitor', progress: 0.7,
      narration: 'Now wait. This beat holds for thirty simulated minutes and dispatches nothing, because the repeat check is refused until the interval has elapsed and asking early would simply be declined. The waiting is not dead time in the case — it is the interval the third objective is actually about.' };
  }
  if (patient.pointOfCareConfirmedAtTick !== null) {
    return { id: 'protocol', focus: 'actions', progress: 0.5,
      dispatch: glycemic('record-insulin-protocol-intent'),
      narration: 'Record institutional insulin-protocol intent, with the 100 to 180 mg/dL perioperative target it carries. Intent is the honest word: no dose is selected, nothing is delivered, and electrolytes and hypoglycaemia rescue are outside this model entirely. What is being practised is reaching for the protocol rather than improvising a number.' };
  }
  if (patient.pointOfCareGlucoseMgPerDl !== null) {
    return { id: 'confirm', focus: 'monitor', progress: 0.25,
      dispatch: glycemic('confirm-point-of-care-glucose'),
      narration: 'Confirm the point-of-care glucose deliberately before responding to it. The engine enforces this: the insulin response is refused until a confirmation is on record. A value that appeared on a screen and a value someone has confirmed are different things, and only the second is a reason to start a protocol.' };
  }
  return { id: 'watching', focus: 'monitor', progress: 0.05,
    narration: 'No glucose course is running yet, and every bounded glycemic response is refused until one is. Nothing to record. Note that nothing on the monitor will tell you about this — the value arrives as a point-of-care result rather than as a trace.' };
}
