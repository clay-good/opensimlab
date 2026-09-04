import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import { supportsClinicStemi, type ClinicStemiAction, type ClinicStemiProgress } from '../clinic-stemi';
import { clinicStemiInlinePrompt } from '../tutor/clinic-stemi-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: ClinicStemiProgress): string {
  const prompt = clinicStemiInlinePrompt('guided', { scenarioVersion: '0.1.1', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const CLINIC_STEMI_DEMONSTRATION_VERSION = '0.1.0';

export function supportsClinicStemiDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.1' && supportsClinicStemi(scenario);
}

export interface ClinicStemiDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: ClinicStemiAction; readonly finished?: boolean;
}

/**
 * The worked example for a STEMI in the wrong building.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. Of the unordered pair it activates first and screens second,
 * which is the order the lesson argues for rather than the only one the engine
 * allows. It examines nobody, acquires and interprets no ECG or test,
 * diagnoses no real patient, prescribes and delivers no drug, selects no P2Y12
 * inhibition, anticoagulation, fibrinolysis, PCI, nitrate or opioid therapy,
 * performs no procedure, determines no disposition, and predicts no
 * complication or outcome.
 */
export function clinicStemiDemonstrationStep(
  patient?: ClinicStemiProgress,
): ClinicStemiDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'The ambulance is coming, the receiving team already has her ECG, and nothing was given that somebody down the road will have to work around. The clinic\'s contribution was a phone call made early and a handover nobody else could write. This ends the example, not the evaluation.' };
  }
  if (patient.patternAtTick === null) {
    return { id: 'pattern', focus: 'monitor', progress: 0.12, action: 'reconcile-clinic-stemi-pattern',
      narration: narrate(patient) };
  }
  if (patient.transferAtTick === null) {
    return { id: 'transfer', focus: 'actions', progress: 0.34, action: 'activate-clinic-stemi-transfer',
      narration: narrate(patient) };
  }
  if (patient.dangerAtTick === null) {
    return { id: 'danger', focus: 'monitor', progress: 0.56, action: 'screen-clinic-stemi-danger',
      narration: narrate(patient) };
  }
  if (patient.bridgeAtTick === null) {
    return { id: 'bridge', focus: 'actions', progress: 0.78, action: 'record-clinic-stemi-bridge',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'reassess-clinic-stemi-handoff',
    narration: narrate(patient) };
}
