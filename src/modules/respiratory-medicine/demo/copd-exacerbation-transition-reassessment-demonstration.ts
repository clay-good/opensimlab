import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsCopdTransition, type CopdTransitionAction, type CopdTransitionProgress,
} from '../copd-exacerbation-transition-reassessment';
import { copdTransitionInlinePrompt } from '../tutor/copd-exacerbation-transition-reassessment-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied. Every lesson's prose used to ship twice inside the
 * cockpit bundle — once in the tutor and once as a duplicated string literal
 * here — and gzip cannot reach across that distance to dedupe it. Deriving it
 * also makes "the two cannot drift apart" structural rather than a property
 * maintained by regenerating this file.
 */
function narrate(patient: CopdTransitionProgress): string {
  const prompt = copdTransitionInlinePrompt('guided', { scenarioVersion: '0.1.0', copdTransition: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const COPD_TRANSITION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsCopdTransitionDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsCopdTransition(scenario);
}

export interface CopdTransitionDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: CopdTransitionAction; readonly finished?: boolean;
}

/**
 * The worked example for a recovery that stopped at 30 metres.
 *
 * The numbers came back and the function did not, and it is the function that
 * decides whether going home works. This example examines nobody, delivers no
 * treatment or oxygen, selects no regimen, grades no technique, enrolls nobody
 * and guarantees no appointment.
 */
export function copdTransitionDemonstrationStep(
  patient?: CopdTransitionProgress,
): CopdTransitionDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on genuinely better and not yet the person she was three days ago, with her oxygen question open and her follow-up requested rather than secured. Nothing was proven and nothing was arranged. This ends the example, not the recovery.' };
  }
  if (patient.readinessAtTick === null) {
    return { id: 'readiness', focus: 'monitor', progress: 0.1, action: 'reconcile-copd-exacerbation-recovery-and-readiness',
      narration: narrate(patient) };
  }
  if (patient.respiratoryNeedsAtTick === null) {
    return { id: 'needs', focus: 'monitor', progress: 0.32, action: 'review-copd-exacerbation-residual-respiratory-and-oxygen-needs',
      narration: narrate(patient) };
  }
  if (patient.medicationAtTick === null) {
    return { id: 'medication', focus: 'actions', progress: 0.55, action: 'review-copd-exacerbation-maintenance-and-acute-medication-plan',
      narration: narrate(patient) };
  }
  if (patient.coordinationAtTick === null) {
    return { id: 'coordination', focus: 'actions', progress: 0.78, action: 'coordinate-copd-exacerbation-rehabilitation-self-management-and-follow-up',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-copd-exacerbation-transition-reassessment',
    narration: narrate(patient) };
}
