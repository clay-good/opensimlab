import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { BronchiectasisMucusPluggingProgress } from '../bronchiectasis-mucus-plugging-reassessment';

export const BRONCHIECTASIS_MUCUS_PLUGGING_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a woman who normally does this herself.
 *
 * She has bronchiectasis and an individualized clearance routine that works,
 * and for two days it has stopped working. That is the finding: not the
 * collapsed lobe, but a person whose own effective system has been overwhelmed
 * — which is why the treatment here is a physiotherapist supporting her
 * routine rather than anyone inventing a new one. The second refusal is the
 * CT: dense endobronchial material in a woman with bronchiectasis makes mucus
 * the working pattern and leaves infection, blood, aspiration, a foreign body
 * and an occult obstructing lesion open. None of these prompts examines her,
 * tests her cough, assesses sputum, performs clearance or suction, or selects
 * a device or technique.
 */
export function bronchiectasisMucusPluggingInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly bronchiectasisMucusPlugging?: BronchiectasisMucusPluggingProgress;
}) {
  const patient = input.bronchiectasisMucusPlugging;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('plugging-trajectory', true,
    'Start from the routine that normally works, and note that it has stopped.',
    'She is independent with an individualized airway-clearance routine and normally sits at 95% on room air. Over two days the sputum has thickened, the fatigue has built, and she can no longer clear it. Now: short sentences, 108, breathing at 28, 88% on room air, a weak ineffective cough, coarse central sounds and markedly reduced left-base air entry. The weak cough is the mechanism — the secretions have not changed location, her ability to move them has.');
  if (patient.evidenceAtTick === null) return prompt('plugging-evidence', true,
    'Let the imaging support the working pattern without closing it.',
    'New left-lower-lobe volume loss with retrocardiac opacity and a raised left hemidiaphragm, and a CT showing dense endobronchial material in the left-lower-lobe bronchus with downstream atelectasis and no definite central mass. In a woman with bronchiectasis and two days of failing clearance, mucus impaction is the working pattern. It is not a diagnosis: infection, blood, aspiration, a foreign body, an occult obstructing lesion and compression all stay open, and "no definite central mass" on one study is not the same as no lesion.');
  if (patient.clearanceIntentAtTick === null) return prompt('plugging-intent', true,
    'Ask for a physiotherapist and support her own routine rather than replacing it.',
    'Experienced respiratory-physiotherapy review and a supported, individualized airway-clearance trial. Individualized is the operative word: she already has a routine that works for her, and what she needs is help executing it while she is exhausted, not somebody else’s protocol. This is the step the lesson exists to record, and it is recorded as intent — the technique, the device and the delivery belong to the physiotherapist.');
  if (patient.responseAtTick === null) return prompt('plugging-response', true,
    'Read the response as real and incomplete.',
    'Thick secretions expectorated during team-delivered care, a stronger cough, full sentences, 98, breathing at 22, and 93% on room air, with coarse sounds and left-base air entry both improved. The radiograph shows partial re-expansion with residual left-lower-lobe volume loss. That is a genuine response to the right treatment, and it proves neither complete clearance nor complete re-expansion — the residual collapse is the part that still needs explaining.');
  if (patient.escalationAtTick === null) return prompt('plugging-escalation', true,
    'Escalate what is left rather than accepting it as her new normal.',
    'Residual focal collapse after effective clearance is the finding that should not be filed under bronchiectasis. It needs experienced respiratory and airway-capable evaluation, because the alternatives that were open at the start — a lesion, a foreign body, something obstructing that is not mucus — are exactly the ones that a partial response fails to exclude. A patient who improved is the easiest patient in the department to stop thinking about.');
  return prompt('plugging-handoff', true,
    'Hand off an improvement with an unexplained remainder.',
    'Nothing here establishes complete clearance, complete re-expansion, a cause, a disposition or an outcome. What travels is her normal routine and why it failed, the imaging and what it leaves open, the physiotherapy support and what it achieved, the residual collapse, and the named respiratory and airway-capable ownership for the evaluation of what is still there.');
}
