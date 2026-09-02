import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsCopdTransition, type CopdTransitionAction, type CopdTransitionProgress,
} from '../copd-exacerbation-transition-reassessment';

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
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on genuinely better and not yet the person she was three days ago, with her oxygen question open and her follow-up requested rather than secured. Nothing was proven and nothing was arranged. This ends the example, not the recovery.' };
  }
  if (patient.readinessAtTick === null) {
    return { id: 'readiness', focus: 'monitor', progress: 0.1, action: 'reconcile-copd-exacerbation-recovery-and-readiness',
      narration: 'Start from who she was before this admission, not from today’s numbers. Independent, walking about 200 metres, resting room-air saturation 92%, no home oxygen. She arrived with a pH of 7.29 and a PaCO₂ of 66 and has had controlled oxygen, bronchodilators, a corticosteroid, an antibiotic and twelve hours of noninvasive ventilation — all correctly given by someone else. Three days later, twenty-four hours off the ventilator, her pH is 7.38 and her PaCO₂ is 54. That is the recovery. The question is whether it reaches back to the person in the first sentence.' };
  }
  if (patient.respiratoryNeedsAtTick === null) {
    return { id: 'needs', focus: 'monitor', progress: 0.32, action: 'review-copd-exacerbation-residual-respiratory-and-oxygen-needs',
      narration: 'Look at the corridor walk before anything else, because that is the answer. She pauses after thirty metres with marked dyspnea, her saturation falls to 86%, and it takes three minutes at rest to come back to 91%. She walked two hundred metres before this. Symptoms and gas exchange improved; function did not, and function is what decides whether home works. Her oxygen need is unresolved rather than absent — and a desaturation on day three of an exacerbation does not establish long-term oxygen eligibility, which is assessed when she is stable and not now.' };
  }
  if (patient.medicationAtTick === null) {
    return { id: 'medication', focus: 'actions', progress: 0.55, action: 'review-copd-exacerbation-maintenance-and-acute-medication-plan',
      narration: 'Separate what she takes from what she was started on, and finish neither here. Preadmission tiotropium and rescue salbutamol, no finalized maintenance transition, and no end points set for the acute corticosteroid and antibiotic courses. An experienced respiratory therapist has already found important inhaler-technique errors — which is a finding to carry rather than something to re-grade, and it matters more than any change of drug, because a maintenance inhaler she cannot use is not a maintenance inhaler.' };
  }
  if (patient.coordinationAtTick === null) {
    return { id: 'coordination', focus: 'actions', progress: 0.78, action: 'coordinate-copd-exacerbation-rehabilitation-self-management-and-follow-up',
      narration: 'Arrange the things that change the next admission rather than this one. Pulmonary rehabilitation after an exacerbation, self-management planning, comorbidity review, and both early and later respiratory follow-up are all unarranged. These are the parts of this admission most likely to be skipped and most likely to matter, and none of them is guaranteed by naming it: access, appointment timing and the local oxygen-reassessment pathway are all outside this room.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-copd-exacerbation-transition-reassessment',
    narration: 'Nothing here establishes long-term oxygen eligibility, a finalized regimen, a corrected technique, an enrolled rehabilitation place or a guaranteed appointment. Hand off the gap between her numbers and her walking, the unresolved oxygen question and when it should properly be asked, the medication end points nobody has set, the technique errors already found, and the follow-up that has been requested rather than secured.' };
}
