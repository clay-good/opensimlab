import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsEmergencyAnaphylaxis, type EmergencyAnaphylaxisAction,
  type EmergencyAnaphylaxisProgress,
} from '../emergency-anaphylaxis';
import { emergencyAnaphylaxisInlinePrompt } from '../tutor/emergency-anaphylaxis-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: EmergencyAnaphylaxisProgress): string {
  const prompt = emergencyAnaphylaxisInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const EMERGENCY_ANAPHYLAXIS_DEMONSTRATION_VERSION = '0.1.0';

export function supportsEmergencyAnaphylaxisDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsEmergencyAnaphylaxis(scenario);
}

export interface EmergencyAnaphylaxisDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: EmergencyAnaphylaxisAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a drug that does not wait on getting ready.
 *
 * Six beats. The first four are the only order the engine accepts; the two
 * adjuncts are unordered against each other. It examines nobody, prepares and
 * injects nothing, positions no one physically, manages no airway, diagnoses
 * nothing, determines no disposition, and predicts no outcome.
 */
export function emergencyAnaphylaxisDemonstrationStep(
  patient?: EmergencyAnaphylaxisProgress,
): EmergencyAnaphylaxisDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.reassessedAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'The drug went in before the oxygen and before the line, and that is the whole example. The engine refuses both adjuncts until the intramuscular epinephrine is recorded, because they are the two things that feel like preparation and the interval they add is the interval the fatal cases share. Nothing here was drawn up, injected, positioned, or connected, the monitor improvement is authored rather than modelled, and a second dose — which is what the real answer often is — is not something this vignette offers. This ends the example, not the evaluation.' };
  }
  if (patient.patternReviewedAtTick === null) {
    return { id: 'pattern', focus: 'monitor', progress: 0.1,
      action: 'review-systemic-pattern', narration: narrate(patient) };
  }
  if (patient.positionedAndHelpedAtTick === null) {
    return { id: 'position', focus: 'actions', progress: 0.27,
      action: 'position-and-call-for-help', narration: narrate(patient) };
  }
  if (patient.imEpinephrineAtTick === null) {
    return { id: 'epinephrine', focus: 'actions', progress: 0.45,
      action: 'give-im-epinephrine', narration: narrate(patient) };
  }
  if (patient.oxygenAtTick === null) {
    return { id: 'oxygen', focus: 'actions', progress: 0.62,
      action: 'give-high-flow-oxygen', narration: narrate(patient) };
  }
  if (patient.crystalloidAtTick === null) {
    return { id: 'crystalloid', focus: 'actions', progress: 0.79,
      action: 'begin-fixed-crystalloid', narration: narrate(patient) };
  }
  return { id: 'reassess', focus: 'monitor', progress: 0.92,
    action: 'reassess-response', narration: narrate(patient) };
}
