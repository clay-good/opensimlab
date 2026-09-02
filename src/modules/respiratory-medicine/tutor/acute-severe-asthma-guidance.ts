import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { AcuteSevereAsthmaProgress } from '../acute-severe-asthma';

export const ACUTE_SEVERE_ASTHMA_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for numbers that look better and mean worse.
 *
 * Her respiratory rate has fallen from 36 to 18 and her saturation has risen
 * from 89% to 93%. Both moved the way you want them to move, and both are the
 * wrong reading: the rate fell because she is running out of the strength to
 * breathe, and the saturation rose because she is now on 35% oxygen. The chest
 * that has gone quiet is the same finding said a third way. None of these
 * prompts examines her, measures a flow, samples or reads a gas, acquires
 * imaging, or selects a drug, a device or a ventilator setting.
 */
export function acuteSevereAsthmaInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly acuteSevereAsthma?: AcuteSevereAsthmaProgress;
}) {
  const patient = input.acuteSevereAsthma;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.treatmentAtTick === null) return prompt('asthma-treatment', true,
    'Separate what was already done from how she has responded to it.',
    'The record is complete and it is somebody else’s work: controlled oxygen from arrival, three bronchodilator and antimuscarinic cycles at minutes 0, 20 and 40, a systemic corticosteroid at minute 5, and IV magnesium at minute 45 after a poor response. That is a full initial treatment, correctly given. Seventy-five minutes in she is drowsy, confused, cannot speak, has a quiet chest and weakening effort, and cannot perform a peak flow. The treatment is not the question. The response to it is.');
  if (patient.failureAtTick === null) return prompt('asthma-failure', true,
    'Read the falling respiratory rate as fatigue, not as improvement.',
    'A rate of 36 became 18 and a saturation of 89% became 93% — one because she is running out of the strength to breathe, the other because she is now on 35% oxygen rather than room air. The quiet chest is the same thing again: air movement has fallen below what makes a wheeze. Put that beside a pH that has gone from 7.45 to 7.24 and a PaCO₂ from 31 to 58 in a woman who was blowing it off an hour ago, and this is respiratory failure. No single one of those numbers is a threshold; the combination after a poor response is the finding.');
  if (patient.escalationAtTick === null) return prompt('asthma-escalation', true,
    'Call critical care and airway-capable help now, before the review.',
    'Escalation here does not wait for another treatment cycle, for the differential to be finished, or for her to get worse in a way that settles the argument. She has been treated properly and is failing anyway, which is the whole indication. The people who might have to secure her airway need to be present before that becomes urgent rather than summoned when it does.');
  if (patient.risksAtTick === null) return prompt('asthma-risks', true,
    'Review what else this could be, and what ventilating her would risk.',
    'The imaging shows hyperinflation without pneumothorax or focal opacity, and there is no stridor, urticaria, facial swelling, unilateral silence, fever or edema pattern — which narrows anaphylaxis, upper-airway obstruction, pneumothorax, infection, edema, mucus plugging, aspiration, embolism and dysfunctional breathing without permanently excluding any of them. The ventilation risks are planning concerns rather than controls: an asthmatic chest that cannot empty stacks breaths, and dynamic hyperinflation is how ventilating this patient causes hypotension and barotrauma.');
  return prompt('asthma-handoff', true,
    'Hand off active failure, not a treatment response.',
    'There is no response panel coming, because nothing in this lesson treated her. What travels is the active critical-care and airway work, the evidence as it stands, the causes that are narrowed rather than closed, the triggers that would mean she is deteriorating, and the names of the people who own each of those.');
}
