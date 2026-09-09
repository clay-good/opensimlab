import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsOpioidInducedVentilatoryImpairment } from '../opioid-induced-ventilatory-impairment';

/**
 * What this worked example reads.
 *
 * The twenty-second observed-state demonstration in the anaesthesia module. It
 * gates on latched ticks and on whether the machine is delivering, never on the
 * saturation -- which is the point of the lesson and also a practical necessity,
 * since the saturation here reads 100% both when the patient is supported and
 * when they are merely receiving oxygen while breathing four times a minute.
 */
export interface OpioidVentilatoryImpairmentProgress {
  readonly severity: number;
  readonly helpRequestedAtTick: number | null;
  readonly ventilatorDelivering: boolean;
  readonly inspiredOxygenFraction: number;
  readonly furtherOpioidHeldAtTick: number | null;
  readonly naloxoneIntentAtTick: number | null;
  readonly respiratoryRateBpm: number;
}

export const OPIOID_VENTILATORY_IMPAIRMENT_DEMONSTRATION_VERSION = '0.1.0';

export function supportsOpioidVentilatoryImpairmentDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0'
    && supportsOpioidInducedVentilatoryImpairment(scenario);
}

export interface OpioidVentilatoryImpairmentDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

const response = (value: string): Omit<LearnerAction, 'tick'> =>
  ({ type: 'opioid-ventilatory-response', payload: { response: value } });

/**
 * The worked example for the number that gets better while the patient does not.
 *
 * Read from the latest stage backwards, as the twenty-one before it are. The
 * wean beat is the only one that can be reached twice in principle, so it is
 * gated on the reversal intent having been recorded rather than on the machine
 * state alone.
 *
 * It gives no real drug to anyone and predicts no outcome for any person.
 */
export function opioidVentilatoryImpairmentDemonstrationStep(
  patient?: OpioidVentilatoryImpairmentProgress,
): OpioidVentilatoryImpairmentDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.naloxoneIntentAtTick !== null && !patient.ventilatorDelivering) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'Breathing again without the machine, which is the only way the last objective can be read at all. The comparison worth carrying away is with the run that turns the oxygen up to 100% and does nothing else. That run reads a saturation of 100% for its whole length while the rate stays at four a minute and the carbon dioxide climbs to 50 mmHg — and the run that does NOTHING reads 96% at the same moment, with the same rate and the same carbon dioxide. The oxygen made the monitored number better and the patient no safer. That is what the briefing means when it says saturation can stay reassuring while ventilation worsens: the reassurance is manufactured by the intervention. Two limits worth stating. Naloxone here is recorded intent, not a dose, a route, or a pharmacological response, and this trace ends at one recovery — recurrent depression after a short-acting reversal is exactly the thing continued monitoring exists for and exactly the thing this model does not simulate. This ends the example, not the evaluation.' };
  }
  if (patient.naloxoneIntentAtTick !== null) {
    return { id: 'wean', focus: 'monitor', progress: 0.88,
      dispatch: { type: 'ventilator', payload: { delivering: false } },
      narration: 'Now stop delivering breaths and watch what the patient does without them. This is a measurement rather than a discharge: while the machine is breathing for someone, the rate and the breath size on the screen are the machine\'s and tell you nothing about their drive. Read rate, breath size, carbon dioxide and saturation together — any one of them alone is the mistake this lesson is about.' };
  }
  if (patient.furtherOpioidHeldAtTick !== null) {
    return { id: 'reversal', focus: 'actions', progress: 0.72,
      dispatch: response('record-naloxone-titration'),
      narration: 'Now record the intent to titrate naloxone. Titrate is the operative word: the goal is breathing, not wakefulness, and the endpoint that matters is ventilation rather than a patient who sits up. What this records is intent — no dose and no individual response is modelled here — and reversal is the beginning of a monitoring problem rather than the end of one.' };
  }
  if (patient.ventilatorDelivering) {
    return { id: 'hold', focus: 'actions', progress: 0.55,
      dispatch: response('hold-further-opioid'),
      narration: 'Before reaching for a reversal, hold further opioid. This sounds too obvious to be a step and it is the one most often missed, because a drowsy patient in recovery is easy to read as a patient in pain, and the chart still has a dose due. Stopping the cause is not a smaller intervention than treating it.' };
  }
  if (patient.helpRequestedAtTick !== null) {
    return { id: 'support', focus: 'actions', progress: 0.38,
      dispatch: { type: 'ventilator',
        payload: { delivering: true, mode: 'volume-control', fio2: 1, tidalVolumeMl: 500, respiratoryRateBpm: 12 } },
      narration: 'Now support the ventilation, and note precisely what that means: breaths are being DELIVERED, not just oxygen being supplied. Turning the oxygen up without delivering a breath is the intervention that treats the number rather than the patient. The objective reads active breath delivery at 95% oxygen or more, and it reads it within 45 seconds of the pattern beginning.' };
  }
  if (patient.severity <= 0.05) {
    return { id: 'watching', focus: 'monitor', progress: 0.05,
      narration: 'Nothing has happened yet, and this beat exists because that matters. The patient is drowsy and breathing, half an hour after a fixed opioid exposure, and there is no pattern to act on. Watch the rate and the arousal together rather than the saturation, and wait for the change — every objective in this lesson is timed from the moment it appears, so acting before there is anything to act on records nothing at all.' };
  }
  return { id: 'recognize', focus: 'monitor', progress: 0.15,
    dispatch: { type: 'call-for-help', payload: { context: 'airway' } },
    narration: 'Call for help first, and call now — the objective allows 30 seconds. What has just been read is difficult arousal with a falling rate and a rising carbon dioxide, and the reason to escalate before the saturation moves is that the saturation is the last thing to move and the first thing to be believed. Waiting for it is waiting for the least informative number on the screen.' };
}
