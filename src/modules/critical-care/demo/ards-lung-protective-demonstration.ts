import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsArdsLungProtective, type ArdsLungProtectiveAction, type ArdsLungProtectiveProgress,
} from '../ards-lung-protective';
import { ardsLungProtectiveInlinePrompt } from '../tutor/ards-lung-protective-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: ArdsLungProtectiveProgress): string {
  const prompt = ardsLungProtectiveInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const ARDS_LUNG_PROTECTIVE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsArdsLungProtectiveDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsArdsLungProtective(scenario);
}

export interface ArdsLungProtectiveDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: ArdsLungProtectiveAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a breath that looked modest against the wrong weight.
 *
 * Five beats in the only order the engine accepts. It samples no gas, verifies
 * no airway, measures no mechanics, programs no ventilator, performs no
 * recruitment manoeuvre, sedates, paralyses and turns nobody, diagnoses
 * nothing, determines no disposition, and predicts no outcome.
 */
export function ardsLungProtectiveDemonstrationStep(
  patient?: ArdsLungProtectiveProgress,
): ArdsLungProtectiveDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.escalationAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'One number ran this example and it was her height. Against 92 kg a 500 mL breath looks careful; against the 61.5 kg her height predicts it is 8.1 mL/kg, and the plateau of 32 was the lung saying so. The trade was made explicitly — a plateau of 27 bought with a pH of 7.29 — and then nobody undid it to fix the number they could see. She is still hypoxaemic, which is the next problem rather than a reason to give the volume back. This ends the example, not the evaluation.' };
  }
  if (patient.baselineAtTick === null) {
    return { id: 'baseline', focus: 'monitor', progress: 0.12,
      action: 'review-ards-baseline', narration: narrate(patient) };
  }
  if (patient.pbwAtTick === null) {
    return { id: 'pbw', focus: 'monitor', progress: 0.32,
      action: 'calculate-ards-pbw', narration: narrate(patient) };
  }
  if (patient.protectionAtTick === null) {
    return { id: 'protect', focus: 'actions', progress: 0.54,
      action: 'record-ards-protective-settings', narration: narrate(patient) };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'reassess', focus: 'monitor', progress: 0.76,
      action: 'reassess-ards-protection', narration: narrate(patient) };
  }
  return { id: 'escalate', focus: 'actions', progress: 0.9,
    action: 'record-ards-peep-prone-escalation', narration: narrate(patient) };
}
