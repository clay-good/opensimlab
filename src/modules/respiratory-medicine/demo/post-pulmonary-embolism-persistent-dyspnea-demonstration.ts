import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPostPeDyspnea, type PostPeDyspneaAction, type PostPeDyspneaProgress,
} from '../post-pulmonary-embolism-persistent-dyspnea';
import { postPeDyspneaInlinePrompt } from '../tutor/post-pulmonary-embolism-persistent-dyspnea-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied. Every lesson's prose used to ship twice inside the
 * cockpit bundle — once in the tutor and once as a duplicated string literal
 * here — and gzip cannot reach across that distance to dedupe it. Deriving it
 * also makes "the two cannot drift apart" structural rather than a property
 * maintained by regenerating this file.
 */
function narrate(patient: PostPeDyspneaProgress): string {
  const prompt = postPeDyspneaInlinePrompt('guided', { scenarioVersion: '0.1.0', postPeDyspnea: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const POST_PE_DYSPNEA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPostPeDyspneaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPostPeDyspnea(scenario);
}

export interface PostPeDyspneaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PostPeDyspneaAction; readonly finished?: boolean;
}

/**
 * The worked example for the clinic visit that gets dismissed.
 *
 * The comfortable resting observations are what make this easy to write off as
 * deconditioning. This example examines nobody, acquires and interprets no
 * test, diagnoses no CTEPD, selects and stops no anticoagulant, and determines
 * no disposition.
 */
export function postPeDyspneaDemonstrationStep(
  patient?: PostPeDyspneaProgress,
): PostPeDyspneaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She leaves with a referral, an unchanged anticoagulant, and no explanation yet for why she stops at 150 metres. Nothing was proven and nothing was excluded. This ends the example, not the investigation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.1, action: 'reconcile-post-pe-symptoms-and-anticoagulation-course',
      narration: narrate(patient) };
  }
  if (patient.safetyAtTick === null) {
    return { id: 'safety', focus: 'monitor', progress: 0.32, action: 'review-post-pe-functional-limitation-and-current-safety',
      narration: narrate(patient) };
  }
  if (patient.evidenceAtTick === null) {
    return { id: 'evidence', focus: 'monitor', progress: 0.55, action: 'review-post-pe-ctepd-evidence-and-alternatives',
      narration: narrate(patient) };
  }
  if (patient.referralAtTick === null) {
    return { id: 'referral', focus: 'actions', progress: 0.78, action: 'activate-post-pe-pulmonary-vascular-referral',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-post-pe-persistent-dyspnea-reassessment',
    narration: narrate(patient) };
}
