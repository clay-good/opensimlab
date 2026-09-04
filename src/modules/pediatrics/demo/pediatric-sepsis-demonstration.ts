import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPediatricSepsis, type PediatricSepsisAction, type PediatricSepsisProgress,
} from '../pediatric-sepsis';
import { pediatricSepsisInlinePrompt } from '../tutor/pediatric-sepsis-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: PediatricSepsisProgress): string {
  const prompt = pediatricSepsisInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const PEDIATRIC_SEPSIS_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPediatricSepsisDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPediatricSepsis(scenario);
}

export interface PediatricSepsisDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PediatricSepsisAction; readonly finished?: boolean;
}

/**
 * The worked example for a child who does not look like the emergency he is.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. The example examines nobody, calculates no score, acquires and
 * interprets no culture, specimen, lactate, laboratory test or image,
 * identifies no source or pathogen, chooses no antimicrobial, drug, dose,
 * concentration, route, interval, access, fluid, bolus, volume, rate,
 * vasoactive, oxygen, device or flow, performs no source-control procedure,
 * and determines no disposition or outcome.
 */
export function pediatricSepsisDemonstrationStep(
  patient?: PediatricSepsisProgress,
): PediatricSepsisDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He is cooler, slower and passing urine, and his clotting is exactly where it was two hours ago. The people taking over know both of those things, know what is still pending, and know who owns each part of it. This ends the example, not the evaluation.' };
  }
  if (patient.patternAtTick === null) {
    return { id: 'pattern', focus: 'monitor', progress: 0.1, action: 'reconcile-pediatric-sepsis-infection-and-organ-dysfunction',
      narration: narrate(patient) };
  }
  if (patient.shockBoundaryAtTick === null) {
    return { id: 'shockBoundary', focus: 'monitor', progress: 0.28, action: 'distinguish-pediatric-sepsis-without-shock',
      narration: narrate(patient) };
  }
  if (patient.careAtTick === null) {
    return { id: 'care', focus: 'actions', progress: 0.46, action: 'confirm-pediatric-sepsis-qualified-care-ownership',
      narration: narrate(patient) };
  }
  if (patient.sourceReviewAtTick === null) {
    return { id: 'source', focus: 'actions', progress: 0.64, action: 'review-pediatric-sepsis-source-organs-and-alternatives',
      narration: narrate(patient) };
  }
  if (patient.laterResponseAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.8, action: 'review-pediatric-sepsis-later-response',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-pediatric-sepsis-active-risk',
    narration: narrate(patient) };
}
