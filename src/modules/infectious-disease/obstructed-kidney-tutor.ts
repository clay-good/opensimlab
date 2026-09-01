import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { ObstructedKidneySnapshot } from '@platform/kernel/protocol';

export const OBSTRUCTED_KIDNEY_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link
 * built from a citation is a guess rather than a lookup. The tray already sends
 * a reader to the source view, which shows the declared citations in full.
 */

/**
 * Observed-state guidance for an obstruction that antimicrobials cannot reach.
 *
 * Two of the refused shortcuts are delays dressed as diligence — carrying on
 * with antimicrobials alone, and waiting for a marker that lags by hours — and
 * the prompts refuse both by naming what the obstruction does to the drug rather
 * than by asserting urgency. The other two are decisions that belong to somebody
 * else: which drainage modality, and when the stone is treated. No prompt picks
 * a modality, because the randomised evidence has not separated them, and none
 * states an hour threshold, because no guideline does.
 */
export function obstructedKidneyInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly obstructedKidney?: ObstructedKidneySnapshot;
}) {
  const patient = input.obstructedKidney;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.recognitionAtTick === null) return prompt('obstructed-kidney-recognize', true,
    'Name what the fever and the obstruction are together.',
    'Fever, flank pain, systemic upset and an obstructing stone with hydronephrosis describe one thing rather than two that happen to coincide. Reading them separately is what makes this look like an infection to treat.');
  if (patient.urologyAtTick === null) return prompt('obstructed-kidney-urology', true,
    'Involve urology and interventional radiology now, together.',
    'They are the people who can relieve it, and telling them early is what makes the timing theirs to work with rather than yours to guess at.');
  if (patient.culturesAtTick === null) return prompt('obstructed-kidney-cultures', true,
    'Request blood and urine cultures, and ask for a collecting-system sample at decompression.',
    'The upstream sample can differ from the bladder one, which is the whole reason for asking. None of it gates the decompression.');
  if (patient.decompressionIntentAtTick === null) return prompt('obstructed-kidney-intent', true,
    'Record bounded intent for urgent decompression.',
    'Both routes are acceptable and the choice is the team’s. What is recorded here is that it should happen urgently, not how.');
  if (patient.stoneDeferralAtTick === null) return prompt('obstructed-kidney-defer', true,
    'Defer definitive stone treatment explicitly.',
    'Decompression relieves the obstruction; it does not remove the stone, and saying so now stops the two decisions being collapsed into one later.');
  if (patient.boundariesReviewedAtTick === null) return prompt('obstructed-kidney-boundaries', true,
    'Review what the evidence does and does not fix.',
    'No guideline states an hour threshold here, and the randomised evidence has not separated nephrostomy from stenting on clinical outcomes. Urgency is well supported; a number and a modality are not.');
  if (patient.monitoringAtTick === null) return prompt('obstructed-kidney-monitor', true,
    'Set the observation cadence to the current risk.',
    'Lack of improvement after an intervention is itself a finding. The cadence is what makes it visible rather than remembered.');
  if (patient.decompressionDueInSeconds !== null) return prompt('obstructed-kidney-observe', false,
    'Keep watching while the authored interval runs.',
    'It is a contrast rather than a real waiting time, and nothing about the recorded intent needs restating while it passes.');
  if (!patient.untreatedResponseObserved && !patient.decompressedResponseObserved) {
    return prompt('obstructed-kidney-reassess', true,
      'Take a current full assessment.',
      'A request is not a response. What the lactate and the perfusion say now is the only thing that describes where this has got to.');
  }
  return prompt('obstructed-kidney-handoff', false,
    'Hand off the obstruction as unrelieved until it is relieved.',
    'A falling marker and a chosen modality are not handoff gates. What travels is that the collecting system is obstructed, that decompression is intended urgently, and that the stone is a separate decision.');
}
