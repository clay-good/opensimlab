import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { PossibleSepsisSnapshot } from '@platform/kernel/protocol';

export const POSSIBLE_SEPSIS_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link
 * built from a citation is a guess rather than a lookup. The tray already sends
 * a reader to the source view, which shows the declared citations in full.
 */

/**
 * Observed-state guidance for a clock that runs either way.
 *
 * The guidance here is tiered, and the deferral tier is conditional on close
 * monitoring — which makes an unbounded deferral a different thing from the one
 * the guidance permits. So the prompts never offer waiting, only a time-limited
 * course of investigation against a recorded ceiling, and they never assign the
 * likelihood tier, because the operational definitions that separate possible
 * from probable are not supplied here and the classification belongs to the
 * qualified team.
 */
export function possibleSepsisInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly possibleSepsis?: PossibleSepsisSnapshot;
}) {
  const patient = input.possibleSepsis;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.timeZeroAtTick === null) return prompt('possible-sepsis-time-zero', true,
    'Record the time infection was first suspected.',
    'The three hours run from that moment whether or not anyone writes it down. Recording it is what makes the ceiling visible instead of retrospective.');
  if (patient.uncertaintyAtTick === null) return prompt('possible-sepsis-uncertainty', true,
    'Write the uncertainty as it actually stands.',
    'Infection cannot be excluded, there is no shock, and senior assessment is requested. That is a complete statement; a likelihood tier would be a different and less honest one.');
  if (patient.assessmentAtTick === null) return prompt('possible-sepsis-assessment', true,
    'Request a time-limited course of rapid investigation.',
    'Time-limited is the whole of it. This is not an interval of observation, and the ceiling keeps running underneath it.');
  if (patient.boundariesReviewedAtTick === null) return prompt('possible-sepsis-boundaries', true,
    'Review why the guidance is tiered rather than uniform.',
    'Shock, and probable or definite sepsis without it, carry a strong recommendation to treat within the hour. The deferral tier that applies here is explicitly conditional on continuing close monitoring, which is what makes an unbounded deferral something else entirely.');
  if (patient.monitoringAtTick === null) return prompt('possible-sepsis-monitor', true,
    'Set close continuous observation while the assessment runs.',
    'The tier you are relying on is conditional on exactly this. Without it, the deferral is no longer the one the guidance describes.');
  if (patient.immediatePathApplies && patient.antimicrobialIntentAtTick === null) {
    return prompt('possible-sepsis-immediate', true,
      'Record antimicrobial intent now, on the immediate path.',
      'The pressure has fallen and the lactate has risen. This is no longer a possible-sepsis question, and the ceiling has already passed — both facts belong in the record rather than in a reconstruction.');
  }
  if (!patient.investigationReturned) return prompt('possible-sepsis-observe', false,
    'Keep the observation close while the investigation runs.',
    `The ceiling is running${patient.ceilingDueInSeconds === null ? '' : ' and visible'}, and this authored interval predicts no real turnaround time.`);
  if (!patient.investigationObserved) return prompt('possible-sepsis-reassess', true,
    'Take a current full assessment now the investigation has returned.',
    'A returned result is not an observed patient, and no single biomarker rules infection in or out — the guidance says so plainly.');
  if (patient.antimicrobialIntentAtTick === null) return prompt('possible-sepsis-intent', true,
    'Record bounded antimicrobial intent against the ceiling.',
    'Inside it or outside it, the record should say which. A deferral that never resolves is not the tier you reviewed.');
  return prompt('possible-sepsis-handoff', false,
    'Hand off the recorded clock with the uncertainty.',
    'A settled tier and an identified organism are not handoff gates. What travels is the time of first suspicion, what was known when, and whether the intent fell inside the ceiling.');
}
