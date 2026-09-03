import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsAcuteSevereAsthma, type AcuteSevereAsthmaAction, type AcuteSevereAsthmaProgress,
} from '../acute-severe-asthma';
import { acuteSevereAsthmaInlinePrompt } from '../tutor/acute-severe-asthma-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied. Every lesson's prose used to ship twice inside the
 * cockpit bundle — once in the tutor and once as a duplicated string literal
 * here — and gzip cannot reach across that distance to dedupe it. Deriving it
 * also makes "the two cannot drift apart" structural rather than a property
 * maintained by regenerating this file.
 */
function narrate(patient: AcuteSevereAsthmaProgress): string {
  const prompt = acuteSevereAsthmaInlinePrompt('guided', { scenarioVersion: '0.1.0', acuteSevereAsthma: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const ACUTE_SEVERE_ASTHMA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsAcuteSevereAsthmaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsAcuteSevereAsthma(scenario);
}

export interface AcuteSevereAsthmaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: AcuteSevereAsthmaAction; readonly finished?: boolean;
}

/**
 * The worked example for numbers that look better and mean worse.
 *
 * The respiratory rate fell because she is tiring and the saturation rose
 * because the oxygen went up. This example examines nobody, measures no flow,
 * samples and reads no gas, acquires no imaging, and selects no drug, device or
 * ventilator setting.
 */
export function acuteSevereAsthmaDemonstrationStep(
  patient?: AcuteSevereAsthmaProgress,
): AcuteSevereAsthmaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on in active respiratory failure with critical care at the bedside and nothing resolved. Nothing was proven and nothing was excluded — not the cause, not the response to anything, not what happens when someone decides about her airway. This ends the example, not the attack.' };
  }
  if (patient.treatmentAtTick === null) {
    return { id: 'treatment', focus: 'monitor', progress: 0.1, action: 'reconcile-acute-severe-asthma-treatment-and-trajectory',
      narration: narrate(patient) };
  }
  if (patient.failureAtTick === null) {
    return { id: 'failure', focus: 'monitor', progress: 0.32, action: 'recognize-acute-severe-asthma-respiratory-failure',
      narration: narrate(patient) };
  }
  if (patient.escalationAtTick === null) {
    return { id: 'escalation', focus: 'actions', progress: 0.55, action: 'activate-acute-severe-asthma-critical-care-escalation',
      narration: narrate(patient) };
  }
  if (patient.risksAtTick === null) {
    return { id: 'risks', focus: 'monitor', progress: 0.78, action: 'review-acute-severe-asthma-alternatives-and-ventilation-risks',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-acute-severe-asthma-reassessment',
    narration: narrate(patient) };
}
