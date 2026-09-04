import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsMucusPlugging, type MucusPluggingAction, type MucusPluggingProgress,
} from '../mucus-plugging';
import { mucusPluggingInlinePrompt } from '../tutor/mucus-plugging-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: MucusPluggingProgress): string {
  const prompt = mucusPluggingInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const MUCUS_PLUGGING_DEMONSTRATION_VERSION = '0.1.0';

export function supportsMucusPluggingDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsMucusPlugging(scenario);
}

export interface MucusPluggingDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: MucusPluggingAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a treatment that works and does not work.
 *
 * Five beats in the only order the engine accepts. It examines nobody, checks
 * no equipment, acquires no waveform or mechanics, suctions and removes
 * nothing, images nothing, performs no bronchoscopy, diagnoses nothing,
 * programs no ventilator, delivers no drug, performs no procedure, determines
 * no disposition, and predicts no outcome.
 */
export function mucusPluggingDemonstrationStep(
  patient?: MucusPluggingProgress,
): MucusPluggingDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.escalationAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'His central airway is clear, his left base is not, and the reason to keep looking is precisely that the suction worked. Nobody suctioned him here and nobody named what the left base is — what the review produced was a finding that survived the treatment for the diagnosis everybody assumed. The visible secretion in the tube was the most persuasive thing on the screen and the least specific. This ends the example, not the evaluation.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.12,
      action: 'support-mucus-plugging-and-call-help', narration: narrate(patient) };
  }
  if (patient.indicatorsAtTick === null) {
    return { id: 'indicators', focus: 'monitor', progress: 0.32,
      action: 'review-mucus-plugging-indicators', narration: narrate(patient) };
  }
  if (patient.suctionAtTick === null) {
    return { id: 'suction', focus: 'actions', progress: 0.54,
      action: 'record-indicated-airway-suction-intent', narration: narrate(patient) };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'reassess', focus: 'monitor', progress: 0.76,
      action: 'reassess-mucus-plugging-response', narration: narrate(patient) };
  }
  return { id: 'escalate', focus: 'actions', progress: 0.9,
    action: 'escalate-persistent-mucus-plugging', narration: narrate(patient) };
}
