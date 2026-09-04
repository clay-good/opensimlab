import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPediatricAnaphylaxis, type PediatricAnaphylaxisAction,
  type PediatricAnaphylaxisProgress,
} from '../pediatric-anaphylaxis';
import { pediatricAnaphylaxisInlinePrompt } from '../tutor/pediatric-anaphylaxis-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: PediatricAnaphylaxisProgress): string {
  const prompt = pediatricAnaphylaxisInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const PEDIATRIC_ANAPHYLAXIS_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPediatricAnaphylaxisDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPediatricAnaphylaxis(scenario);
}

export interface PediatricAnaphylaxisDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PediatricAnaphylaxisAction;
  readonly finished?: boolean;
}

/**
 * The worked example for anaphylaxis without a rash.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. The steps are a strict line rather than a pair, so this example
 * has only one order available to it. It examines and monitors nobody, scores
 * no criteria, confirms no diagnosis or trigger, verifies or selects no
 * product, concentration, dose, route, device, injection, access, oxygen
 * interface or flow, fluid, bronchodilator, antihistamine, corticosteroid,
 * infusion, vasopressor, airway device or procedure, performs no positioning
 * or trigger removal, and determines no observation duration, prescription,
 * referral, disposition or outcome.
 */
export function pediatricAnaphylaxisDemonstrationStep(
  patient?: PediatricAnaphylaxisProgress,
): PediatricAnaphylaxisDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He is talking in sentences and he never had a rash at all. The team taking over knows both doses, knows he is still on oxygen and still wheezing, and knows that the next few hours are the reason he is being watched rather than sent home. This ends the example, not the evaluation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.1, action: 'reconcile-pediatric-anaphylaxis-exposure-care-and-whole-child',
      narration: narrate(patient) };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'monitor', progress: 0.28, action: 'recognize-pediatric-anaphylaxis-persistent-abc-compromise',
      narration: narrate(patient) };
  }
  if (patient.firstLineAtTick === null) {
    return { id: 'firstLine', focus: 'actions', progress: 0.46, action: 'activate-pediatric-anaphylaxis-qualified-repeat-first-line-and-resuscitation-ownership',
      narration: narrate(patient) };
  }
  if (patient.safetyAtTick === null) {
    return { id: 'safety', focus: 'actions', progress: 0.64, action: 'review-pediatric-anaphylaxis-airway-asthma-causes-and-refractory-boundary',
      narration: narrate(patient) };
  }
  if (patient.laterResponseAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.8, action: 'review-pediatric-anaphylaxis-later-response',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-pediatric-anaphylaxis-observation-allergy-and-caregiver-risk',
    narration: narrate(patient) };
}
