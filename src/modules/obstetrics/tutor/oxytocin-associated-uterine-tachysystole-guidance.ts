import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { OxytocinTachysystoleProgress } from '../oxytocin-associated-uterine-tachysystole';

export const OXYTOCIN_TACHYSYSTOLE_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a complication somebody caused.
 *
 * Six contractions every ten minutes lasting up to ninety seconds, twenty
 * minutes after an infusion increase, and a fetal heart that has gone from 140
 * with moderate variability to 155 with minimal variability and recurrent late
 * decelerations. The uterus is being driven and the fetus is being squeezed
 * between the contractions. The error this lesson refuses is studying the
 * trace before bringing anyone into the room, because the drug that produced
 * this is still running. None of these prompts examines or palpates her,
 * operates an infusion, changes a position, delivers oxygen or fluid, or plans
 * a birth.
 */
export function oxytocinTachysystoleInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly oxytocinTachysystole?: OxytocinTachysystoleProgress;
}) {
  const patient = input.oxytocinTachysystole;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.supportAtTick === null) return prompt('tachysystole-support', true,
    'Bring senior obstetric and midwifery help in before you study anything.',
    'The drug that produced this is still running, so the interval spent interpreting is an interval the fetus spends under the same contractions. Senior obstetric, midwifery, anesthesia, newborn and support ownership start now. She is awake and frightened and watching everyone’s faces, so someone explaining what is happening is part of the response rather than a courtesy added to it.');
  if (patient.contextAtTick === null) return prompt('tachysystole-context', true,
    'Read the infusion increase and the fetal change as cause and effect.',
    'Six contractions in every ten-minute window averaged across thirty minutes, each lasting seventy to ninety seconds, twenty minutes after the last increase. And in the same window a fetal heart that went from a baseline of 140 with moderate variability and no decelerations to 155 with minimal variability and recurrent late decelerations to 95. Contractions that long, that often, leave too little time in between — and the time in between is when the placenta refills.');
  if (patient.recognitionAtTick === null) return prompt('tachysystole-recognition', true,
    'Call it tachysystole with fetal deterioration, on the trajectory rather than one trace.',
    'The finding is the change over time, not any single feature of the current trace: a baseline that rose, variability that fell, and decelerations that appeared, together, after an increase. Reading one snapshot would let you argue about any of them separately. Naming it also closes nothing — artifact, a maternal cause, an evolving fetal problem, and a deterioration that has nothing to do with the oxytocin all stay open while you act.');
  if (patient.readinessAtTick === null) return prompt('tachysystole-readiness', true,
    'The first correction is to stop causing it, and the rest is what qualified staff do.',
    'Stopping or reducing the oxytocin, a non-supine position, correcting a contributing cause, continued surveillance and readiness for a birth that may be needed all belong to the qualified team here. Two things that get added reflexively are not: routine oxygen for a fetal heart-rate pattern is not supported, and a fluid bolus without hypotension is treating the monitor rather than the mother. Restarting later is a decision that depends on what happens next, and nothing about it is settled now.');
  if (patient.reassessmentAtTick === null) return prompt('tachysystole-reassess', false,
    'Read the fixed 6-minute report as an early recovery rather than a resolved one.',
    'It is a contrast rather than a predicted trajectory, and nothing here says how any individual fetus recovers after contractions like these.');
  return prompt('tachysystole-handoff', true,
    'Hand off a fetus that is better and a cause that could be repeated.',
    'A partial recovery establishes no durable fetal safety, no eligibility to restart the oxytocin, no birth plan and no outcome. The recurrence risk, the fetal surveillance, the oxytocin decision and who makes it, the alternative causes still open, the birth question, the newborn team, what she has just watched happen, and the disposition all travel with them.');
}
