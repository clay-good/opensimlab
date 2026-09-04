import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsBronchiolitis, type BronchiolitisAction, type BronchiolitisProgress,
} from '../bronchiolitis';
import { bronchiolitisInlinePrompt } from '../tutor/bronchiolitis-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: BronchiolitisProgress): string {
  const prompt = bronchiolitisInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const BRONCHIOLITIS_DEMONSTRATION_VERSION = '0.1.0';

export function supportsBronchiolitisDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsBronchiolitis(scenario);
}

export interface BronchiolitisDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: BronchiolitisAction; readonly finished?: boolean;
}

/**
 * The worked example for an illness that gets treated too much.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. The example takes none of the five refusals. It examines
 * nobody, confirms no diagnosis, identifies no virus, acquires and interprets
 * no test, selects no oxygen, device, flow, fraction, target, feed, fluid
 * route or volume, gives no bronchodilator, steroid or antibiotic, suctions
 * nothing, and determines no admission or discharge.
 */
export function bronchiolitisDemonstrationStep(
  patient?: BronchiolitisProgress,
): BronchiolitisDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He has oxygen, a team watching how he feeds as closely as how he breathes, and nothing in him that did not need to be there. He also has an illness that may not have peaked yet, and a family who need to know what to come back for. Nothing here proves he recovers or that he is ready to go home. This ends the example, not the evaluation.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'monitor', progress: 0.1, action: 'reconcile-bronchiolitis-risk-and-trajectory',
      narration: narrate(patient) };
  }
  if (patient.patternAtTick === null) {
    return { id: 'pattern', focus: 'monitor', progress: 0.28, action: 'recognize-bronchiolitis-supportive-care-pattern',
      narration: narrate(patient) };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.46, action: 'activate-bronchiolitis-oxygenation-and-monitoring',
      narration: narrate(patient) };
  }
  if (patient.feedingHydrationAtTick === null) {
    return { id: 'feeding', focus: 'monitor', progress: 0.64, action: 'review-bronchiolitis-feeding-and-hydration',
      narration: narrate(patient) };
  }
  if (patient.laterResponseAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.8, action: 'review-bronchiolitis-later-response',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-bronchiolitis-active-risk',
    narration: narrate(patient) };
}
