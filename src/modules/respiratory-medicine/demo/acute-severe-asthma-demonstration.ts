import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsAcuteSevereAsthma, type AcuteSevereAsthmaAction, type AcuteSevereAsthmaProgress,
} from '../acute-severe-asthma';

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
      narration: 'Separate what was already done from how she has responded to it. The record is complete and it is somebody else’s work: controlled oxygen from arrival, three bronchodilator and antimuscarinic cycles at minutes 0, 20 and 40, a systemic corticosteroid at minute 5, and IV magnesium at minute 45 after a poor response. That is a full initial treatment, correctly given. Seventy-five minutes in she is drowsy, confused, cannot speak, has a quiet chest and weakening effort, and cannot perform a peak flow. The treatment is not the question. The response to it is.' };
  }
  if (patient.failureAtTick === null) {
    return { id: 'failure', focus: 'monitor', progress: 0.32, action: 'recognize-acute-severe-asthma-respiratory-failure',
      narration: 'Read the falling respiratory rate as fatigue, not as improvement. A rate of 36 became 18 and a saturation of 89% became 93% — one because she is running out of the strength to breathe, the other because she is now on 35% oxygen rather than room air. The quiet chest is the same thing again: air movement has fallen below what makes a wheeze. Put that beside a pH that has gone from 7.45 to 7.24 and a PaCO₂ from 31 to 58 in a woman who was blowing it off an hour ago, and this is respiratory failure. No single one of those numbers is a threshold; the combination after a poor response is the finding.' };
  }
  if (patient.escalationAtTick === null) {
    return { id: 'escalation', focus: 'actions', progress: 0.55, action: 'activate-acute-severe-asthma-critical-care-escalation',
      narration: 'Call critical care and airway-capable help now, before the review. Escalation here does not wait for another treatment cycle, for the differential to be finished, or for her to get worse in a way that settles the argument. She has been treated properly and is failing anyway, which is the whole indication. The people who might have to secure her airway need to be present before that becomes urgent rather than summoned when it does.' };
  }
  if (patient.risksAtTick === null) {
    return { id: 'risks', focus: 'monitor', progress: 0.78, action: 'review-acute-severe-asthma-alternatives-and-ventilation-risks',
      narration: 'Review what else this could be, and what ventilating her would risk. The imaging shows hyperinflation without pneumothorax or focal opacity, and there is no stridor, urticaria, facial swelling, unilateral silence, fever or edema pattern — which narrows anaphylaxis, upper-airway obstruction, pneumothorax, infection, edema, mucus plugging, aspiration, embolism and dysfunctional breathing without permanently excluding any of them. The ventilation risks are planning concerns rather than controls: an asthmatic chest that cannot empty stacks breaths, and dynamic hyperinflation is how ventilating this patient causes hypotension and barotrauma.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-acute-severe-asthma-reassessment',
    narration: 'There is no response panel coming, because nothing in this lesson treated her. Hand off the active critical-care and airway work, the evidence as it stands, the causes that are narrowed rather than closed, the triggers that would mean she is deteriorating, and the names of the people who own each of those.' };
}
