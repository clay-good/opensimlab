import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { RareEarlyMyocarditisSnapshot } from '@platform/kernel/protocol';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link
 * built from a citation is a guess rather than a lookup. The tray already sends a
 * reader to the source view, which shows the declared citations in full.
 */

/**
 * Observed-state guidance for a base rate that is not a threshold.
 *
 * "It is too rare to be that" is the failure, and it is a reasoning error rather
 * than a knowledge gap: a low prior is an input to a decision, not a reason to
 * stop making one. The prompts therefore never argue about how common this is.
 * They point at the two things that are actually decidable here — the interval
 * since the exposure against the described onset, and what is present that does
 * not sound cardiac — and at arranging the monitoring that is the only way the
 * part which moves first will be seen at all.
 */
export function rareEarlyMyocarditisInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly rareEarlyMyocarditis?: RareEarlyMyocarditisSnapshot;
}) {
  const patient = input.rareEarlyMyocarditis;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.intervalRecordedAtTick === null) return prompt('rare-early-myocarditis-interval', true,
    'Record how long he has been on it, against when this is described as starting.',
    'The interval is decidable and the base rate is not. How rare something is cannot tell you whether this is it; where in the exposure he sits can tell you whether it is worth excluding.');
  if (patient.nonCardiacRecordedAtTick === null) return prompt('rare-early-myocarditis-non-cardiac', true,
    'Record what is present that does not sound cardiac.',
    'The findings that do not fit a coronary story are the ones carrying information. A pathway that never asks what he is taking will reach an unhelpful answer without excluding what the exposure makes worth excluding.');
  if (patient.monitoringAtTick === null) return prompt('rare-early-myocarditis-monitor', true,
    'Arrange continuous rhythm monitoring now.',
    'Conduction is the part of this that moves first and the part nobody sees without a monitor. Nothing is hidden from someone watching, and nothing is revealed to someone who is not.');
  if (patient.escalationAtTick === null) return prompt('rare-early-myocarditis-escalate', true,
    'Contact both teams rather than one.',
    'Cardiology without the treating service loses the exposure, and the treating service without cardiology loses the rhythm. Neither team owns this alone, and calling one is how it becomes nobody’s.');
  if (patient.treatmentIntentAtTick === null) return prompt('rare-early-myocarditis-intent', true,
    'Record bounded treatment intent and give nothing.',
    'Imaging, further testing, immunosuppressive treatment and whether the drug is ever restarted are joint decisions for the teams you have called.');
  if (patient.boundariesReviewedAtTick === null) return prompt('rare-early-myocarditis-boundaries', true,
    'Review what this lesson does not settle.',
    'No diagnosis is confirmed here and no imaging is available. A rhythm that has not yet moved is not evidence that it will not.');
  if (!patient.conductionProgressed) return prompt('rare-early-myocarditis-observe-rhythm', false,
    'Watch the rhythm you asked for.',
    'This authored interval is a contrast rather than a required clinical wait. What it shows is only visible because monitoring was arranged.');
  if (!patient.teamsResponded) return prompt('rare-early-myocarditis-observe-teams', false,
    'Keep him monitored while both teams answer.',
    'The conduction has moved without symptoms accompanying it. A patient who is still sitting up talking is not evidence that it has stopped moving.');
  if (!patient.teamsObserved) return prompt('rare-early-myocarditis-reassess', true,
    'Take a current assessment including the rhythm.',
    'The earlier assessment predates both the conduction change and the teams answering. The rhythm is the part that moved, so a handoff without it carries the least current half.');
  return prompt('rare-early-myocarditis-handoff', false,
    'Hand off with the diagnosis unconfirmed.',
    'A confirmed diagnosis, an imaging result, and a stable rhythm are not handoff gates. What travels is the interval, what does not sound cardiac, and what the monitor has recorded.');
}
