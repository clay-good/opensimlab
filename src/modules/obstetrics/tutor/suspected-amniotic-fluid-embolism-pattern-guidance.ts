import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { AfeProgress } from '../suspected-amniotic-fluid-embolism-pattern';

export const AFE_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for the one lesson that responds before it
 * understands.
 *
 * Every other lesson in this module reads the picture and then calls the room.
 * This one inverts that on purpose, because there is no confirmatory test for
 * amniotic fluid embolism — it is recognized clinically and only ever settled
 * afterwards, and the interval spent working it out is the interval she does
 * not have. What makes the pattern is the order of events: the breathing and
 * the circulation failed first, and the bleeding came after. In a hemorrhage
 * that order is reversed, and here the uterus is firm and only 180 mL has been
 * lost, so the bleeding does not explain the shock. None of these prompts
 * assesses a pulse, measures a loss, acquires or reads a laboratory value, or
 * selects oxygen, a vasoactive, a component, CPR or a delivery.
 */
export function afeInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly afe?: AfeProgress;
}) {
  const patient = input.afe;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.supportAtTick === null) return prompt('afe-support', true,
    'Call everyone first, before you have worked out what this is.',
    'This lesson puts the activation ahead of the understanding, and that is the teaching rather than an accident of ordering. There is no confirmatory test for amniotic fluid embolism; it is recognized clinically and settled only afterwards, so the minutes spent deciding are minutes she does not have. Obstetrics, anesthesia, critical care, oxygenation and ventilation, hemodynamic and cardiopulmonary support, nursing, pharmacy, coagulation and hemorrhage, blood bank, operating room, arrest readiness, newborn care, communication and dignity-centered ownership all start now.');
  if (patient.trajectoryAtTick === null) return prompt('afe-trajectory', true,
    'Now put the events in the order they actually happened.',
    'Twelve minutes after a term birth and placental delivery: eight minutes ago she abruptly could not breathe, went cyanotic, confused and profoundly hypotensive — and the major visible bleeding started after that. She has a central pulse, a rate of 132, a pressure of 74/42, a saturation of 78%, one-word answers and cool mottled skin, with a firm midline uterus and 180 mL measured. The sequence is the finding.');
  if (patient.recognitionAtTick === null) return prompt('afe-recognition', true,
    'Name the collapse-then-coagulopathy pattern without closing the diagnosis.',
    'Cardiorespiratory collapse followed by diffuse bleeding is the pattern that makes amniotic fluid embolism the leading suspicion here, and in a hemorrhage the order runs the other way — the bleeding comes first and the circulation follows it. A firm uterus and 180 mL do not explain a pressure of 74/42. But suspicion is not closure: high spinal or anesthetic complication, anaphylaxis, pulmonary or air embolism, a cardiac event, sepsis, and a bleeding cause nobody has found yet all stay open.');
  if (patient.evidenceAtTick === null) return prompt('afe-evidence', true,
    'Read the coagulation as the second act of one event.',
    'A fibrinogen of 105 mg/dL down from 430 and platelets of 68 down from 221, at a measured loss of 240 mL, is not dilution and is not consumption from bleeding — that much fibrinogen has gone somewhere else. Coupled to the hypoxemia, the shock and the timing, it belongs to the same event rather than to a separate problem. None of it identifies the cause, excludes the alternatives, or establishes eligibility for anything.');
  if (patient.reassessmentAtTick === null) return prompt('afe-reassess', false,
    'Read the fixed 12-minute report as a checkpoint rather than a direction.',
    'It is a contrast rather than a required wait or a predicted response time. Nothing here says how any individual event of this kind behaves next.');
  return prompt('afe-handoff', true,
    'Hand off someone who is still collapsing, more slowly.',
    'Persistent shock, continuing respiratory compromise and a coagulopathy that is still progressing — nothing here establishes treatment effect, respiratory or hemodynamic recovery, bleeding or coagulation control. The hypoxemia, the shock, the coagulopathy, the bleeding, the arrest risk, the procedures that may follow, the newborn, her family, the staff who were in the room, and the disposition all travel with her.');
}
