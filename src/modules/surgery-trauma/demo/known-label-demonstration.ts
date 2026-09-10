import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { KnownLabelSnapshot } from '@platform/kernel/protocol';
import { supportsKnownLabel, type KnownLabelAction } from '../known-label';

export const KNOWN_LABEL_DEMONSTRATION_VERSION = '0.1.0';

export function supportsKnownLabelDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsKnownLabel(scenario);
}

export interface KnownLabelDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: KnownLabelAction; readonly finished?: boolean;
}

/**
 * The worked example for a diagnosis that explains everything.
 *
 * It never says the label is wrong and never names a competing diagnosis. It takes the history
 * while the support worker is still in the department, because an example that recorded her
 * account after she left would teach that an account like hers keeps, when the whole design of
 * the lesson is that it does not.
 */
export function knownLabelDemonstrationStep(
  patient?: KnownLabelSnapshot,
): KnownLabelDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'The assessment travels recorded as adjusted-for rather than impossible, with the label intact and nothing about a second diagnosis settled here. This ends the example, not his afternoon.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.labelRecordedAtTick === null) {
    return { id: 'label', focus: 'actions', progress: 0.08, action: 'record-the-label-and-what-it-explains',
      narration: `Start with the label, and be fair to it. Chronic constipation, ${patient.labelYears} years on the record, and almost certainly still true today. Notice what it does: it explains the abdomen, the not eating and the distress in one move, so there is nothing left over to wonder about. That is the effect you are writing down.` };
  }
  if (patient.carerAccountRecordedAtTick === null) {
    return { id: 'carer', focus: 'actions', progress: 0.20, action: 'record-what-has-changed-according-to-someone-who-knows-him',
      narration: `Now take the history, while she is still standing here. ${patient.informantYears} years. He is quiet when distress usually makes him loud. He will not sit. He refused the thing he never refuses. Write it down as history, with her name on it — this is the only observation in the building that nobody else can make.` };
  }
  if (patient.exclusionLimitsRecordedAtTick === null) {
    return { id: 'limits', focus: 'actions', progress: 0.32, action: 'record-what-the-label-cannot-exclude',
      narration: 'Then write down what the label cannot do. A mean of 11.04 conditions each and 98.7 percent multimorbid in 1,023 adults, with constipation among the five commonest. A true label here is one of about eleven, and not one of them rules out any of the others. Explaining and excluding are different operations.' };
  }
  if (patient.escalationAtTick === null) {
    return { id: 'escalate', focus: 'actions', progress: 0.46, action: 'escalate-to-the-surgical-team',
      narration: 'Ask them to see him, and say the constipation is probably still there when you do. You are not disputing a diagnosis; you are asking for the examination nobody has managed yet, and for the time and quiet it will take to manage it.' };
  }
  if (patient.adjustmentIntentAtTick === null) {
    return { id: 'intent', focus: 'actions', progress: 0.58, action: 'record-bounded-adjustment-intent',
      narration: 'Record bounded intent and choose nothing — and include what the examination needs in order to happen at all. Time, quiet, a familiar person. An examination he cannot take part in is a limitation of the examination, not a fact about him.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.68, action: 'review-boundaries',
      narration: 'Review the evidence and notice which way the strongest bit points. It backs the label: he very probably is constipated. And in 247 reviewed deaths, 37 percent were amenable to good healthcare against 13 in the general population, with carers not feeling listened to significant at 0.006. Both true. Being usually right is how a label stops anybody looking.' };
  }
  if (!patient.carerLeft) {
    return { id: 'hold', focus: 'monitor', progress: 0.78,
      narration: 'Look at what you have and what is about to go. The observations will sit exactly where they are all afternoon. The one instrument that can tell today from last Tuesday finishes her shift at four, and she is not a test you can repeat later — which is why her account went into the record a minute ago rather than into your memory.' };
  }
  if (!patient.teamResponded) {
    return { id: 'handover', focus: 'actions', progress: 0.87,
      narration: 'She has gone, and the relief worker is willing and has met him twice. Nothing about the patient changed. What left was the comparison — and it is still on the page, in her words, with her name and her six years, because you wrote it down while she was here.' };
  }
  if (!patient.teamObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.93, action: 'reassess',
      narration: 'Take a current assessment now they have answered and have read the constipation the way you did — as explaining part of it and excluding none of it. They own the examination and its adjustments, any investigation, and whether he stays.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: 'Hand it off recorded as adjusted-for rather than impossible. A diagnosis, a completed examination and a disposition are not handoff gates. What travels is the label with its work, the account and whose it was, and that nobody has yet examined him in a way he could take part in.' };
}
