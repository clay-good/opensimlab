import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPediatricStatusAsthmaticus, type PediatricStatusAsthmaticusAction,
  type PediatricStatusAsthmaticusProgress,
} from '../pediatric-status-asthmaticus';
import { pediatricStatusAsthmaticusInlinePrompt } from '../tutor/pediatric-status-asthmaticus-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: PediatricStatusAsthmaticusProgress): string {
  const prompt = pediatricStatusAsthmaticusInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const PEDIATRIC_STATUS_ASTHMATICUS_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPediatricStatusAsthmaticusDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPediatricStatusAsthmaticus(scenario);
}

export interface PediatricStatusAsthmaticusDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PediatricStatusAsthmaticusAction; readonly finished?: boolean;
}

/**
 * The worked example for a child in whom every wrong answer costs time.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. The example takes none of the four refusals. It examines
 * nobody, diagnoses and scores nothing, measures no peak flow or spirometry,
 * acquires and interprets no gas, laboratory test or image, chooses no
 * oxygen, inhaler, spacer, nebulizer, drug, dose, concentration, route,
 * interval, intravenous access, fluid, infusion, device or setting, and
 * performs no ventilation, airway maneuver, intubation, sedation, paralysis
 * or procedure.
 */
export function pediatricStatusAsthmaticusDemonstrationStep(
  patient?: PediatricStatusAsthmaticusProgress,
): PediatricStatusAsthmaticusDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'Critical care is at the bedside, the second-line plan has an owner, and she is partly better on treatment she is still receiving. The conversation about why she arrived like this is written down as work still owed to her, for an hour when she can take part in it. This ends the example, not the evaluation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.1, action: 'reconcile-pediatric-status-asthmaticus-treatment-and-trajectory',
      narration: narrate(patient) };
  }
  if (patient.nonresponseAtTick === null) {
    return { id: 'nonresponse', focus: 'monitor', progress: 0.28, action: 'recognize-pediatric-status-asthmaticus-severe-nonresponse',
      narration: narrate(patient) };
  }
  if (patient.escalationAtTick === null) {
    return { id: 'escalation', focus: 'actions', progress: 0.46, action: 'activate-pediatric-status-asthmaticus-critical-care-escalation',
      narration: narrate(patient) };
  }
  if (patient.secondLineIntentAtTick === null) {
    return { id: 'secondLine', focus: 'actions', progress: 0.64, action: 'record-pediatric-status-asthmaticus-qualified-second-line-care-intent',
      narration: narrate(patient) };
  }
  if (patient.laterResponseAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.8, action: 'review-pediatric-status-asthmaticus-later-response',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-pediatric-status-asthmaticus-reassessment',
    narration: narrate(patient) };
}
