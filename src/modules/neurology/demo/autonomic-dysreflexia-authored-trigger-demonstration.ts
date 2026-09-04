import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsDysreflexia, type DysreflexiaAction, type DysreflexiaProgress,
} from '../autonomic-dysreflexia-authored-trigger';

export const DYSREFLEXIA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsDysreflexiaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsDysreflexia(scenario);
}

export interface DysreflexiaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: DysreflexiaAction; readonly finished?: boolean;
}

/**
 * The worked example for a blood pressure that is only alarming if you know the
 * usual one.
 *
 * 178/106 does not look like an emergency until you know his verified seated
 * baseline is 98/62 and his lesion is at T4. The bradycardia belongs to the
 * same reflex, and the split at the lesion is the sign. The first intervention
 * costs nothing and is the one most often skipped in the rush to find a cause,
 * so this example sits him up before it goes looking. It is also the only
 * lesson in the module where the learner physically changes something, and it
 * is exactly one thing: a visible external kink. The example manipulates no
 * catheter, performs no bowel care, and selects no drug.
 */
export function dysreflexiaDemonstrationStep(
  patient?: DysreflexiaProgress,
): DysreflexiaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He is handed on near his own baseline with everything that caused this still able to happen again. Nothing was proven and nothing was excluded — not the sole cause, not a complication, not the next transfer. This ends the example, not the risk.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-neurology-autonomic-dysreflexia-lesion-baseline-pressure-symptoms-rhythm-and-whole-patient',
      narration: 'Put his usual pressure next to this one before judging either. His verified usual seated pressure is 98/62 with a rate of 68. He is now 178/106 — eighty millimetres above his own systolic, minutes after a routine transfer, with a pounding headache, flushing and sweating above the lesion and piloerection below it, at a rate of 48. In a complete T4 injury that reading is a crisis, and a pressure that would look unremarkable on anyone else can be one too. The bradycardia is part of the reflex rather than a separate problem.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'actions', progress: 0.26, action: 'recognize-neurology-autonomic-dysreflexia-pattern-without-closing-alternatives-or-definitive-diagnosis',
      narration: 'Name the pattern as urgent, and leave the alternatives open. A baseline-relative surge with the symptoms split above and below a high lesion is enough to act on immediately, and it is not a diagnosis that closes anything. Intracranial, cardiac, medication, pain, infection, urinary, bowel, skin and equipment causes all stay live, and qualified serial review continues regardless of what the trigger survey finds.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.46, action: 'activate-neurology-autonomic-dysreflexia-upright-support-monitoring-and-qualified-ownership',
      narration: 'Sit him up before going looking for anything. Upright with the legs lowered where possible, and loosen anything constricting — this is the intervention that costs nothing, starts working while you are still thinking, and is the first move in every version of this emergency including the ones where no trigger is ever found. It is also the step most often skipped, because hunting the cause feels more like doing something. Frequent pressure and pulse surveillance and spinal-injury, medical, nursing, urology and emergency ownership start with it.' };
  }
  if (patient.triggerAtTick === null) {
    return { id: 'trigger', focus: 'actions', progress: 0.66, action: 'review-and-release-neurology-autonomic-dysreflexia-supplied-external-urinary-trigger-within-role',
      narration: 'Start the survey at the bladder, and free only what you can see. The urinary system is where this comes from most often, and his suprapubic bag has had no urine in it for two hours — that absence is the finding. The external inspection shows the drainage tubing trapped beneath the chair rail, and releasing that visible kink is the entire physical act available here. No insertion, disconnection, irrigation, replacement, catheterization or bowel examination is exposed.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'reassess', focus: 'monitor', progress: 0.84, action: 'reassess-neurology-autonomic-dysreflexia-strict-pressure-pulse-symptom-and-trigger-transition',
      narration: 'Let the authored interval pass and read the strict reassessment. The interval is a contrast rather than a required wait, and nothing here says how any individual pressure behaves after a trigger is removed.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-neurology-autonomic-dysreflexia-baseline-triggers-recurrence-complications-prevention-and-active-risk',
    narration: '108/66 with a rate of 64 and an easing headache, after upright support took it to 166/98 and freeing the kink took it to 124/76 with drainage resuming. That sequence is suggestive and it does not prove the kink was the sole cause, that the response would be the same next time, that this is durably resolved, or that a complication has been excluded. Hand off the baseline, the trigger list, the recurrence risk, the complications and the prevention plan.' };
}
