import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { ConcealedAbruptionProgress } from '../concealed-placental-abruption-hemorrhage';

export const CONCEALED_ABRUPTION_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for blood that is not on the floor.
 *
 * Eighty millilitres has been collected and she is shocked, her fibrinogen is
 * 1.5 g/L, and the fetal trace is abnormal. The error this lesson refuses is
 * letting the visible volume stand in for the loss: in a concealed abruption
 * most of the blood stays behind the placenta, and the maternal and fetal
 * physiology is the only honest measure of it. The second refusal is the scan.
 * Ultrasound finds an abruption often enough to be worth having and misses it
 * often enough that a normal scan excludes nothing, so waiting for one is
 * waiting for a test that cannot answer the question. None of these prompts
 * measures or totals a loss, interprets the fetal trace, acquires or reads an
 * ultrasound, or selects a fluid, component, anesthetic or delivery.
 */
export function concealedAbruptionInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly concealedAbruption?: ConcealedAbruptionProgress;
}) {
  const patient = input.concealedAbruption;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('abruption-trajectory', true,
    'Believe the physiology over the eighty millilitres in the bowl.',
    'Thirty-five minutes of abrupt constant pain at 36 weeks and 4 days, a tense tender uterus, pallor and restlessness, a heart rate of 126 and a pressure of 92/56 — and a fetal baseline of 170 with minimal variability and recurrent late decelerations. Two people are showing you the same bleed. The blood that has been collected is the only part of it anyone can see.');
  if (patient.recognitionAtTick === null) return prompt('abruption-recognition', true,
    'Call it a concealed hemorrhage now, and do not send for a scan to be sure.',
    'In an abruption most of the loss can stay behind the placenta, so visible volume is not total loss and a small amount of dark blood is consistent with a very large one. Ultrasound detects an abruption often enough to be useful and misses it often enough that a normal scan excludes nothing. Naming it also closes nothing — rupture, previa, vasa previa, labor, trauma and non-obstetric causes stay open behind the name, and the supplied prior placental-location record is one piece of history rather than an exclusion.');
  if (patient.supportAtTick === null) return prompt('abruption-support', true,
    'Bring the room for two patients at once, blood bank and neonatal included.',
    'Obstetric hemorrhage, anesthesia, nursing, blood bank, operating room, neonatal, pain, privacy, consent, communication and dignity-centered ownership start together rather than in sequence, because components, an operating room and a neonatal team are the slowest to arrange and are needed before anyone knows whether they will be used. She is awake, frightened, and being told her baby may be born in the next few minutes — the consent and the support are part of the response rather than courtesies added to it.');
  if (patient.evidenceAtTick === null) return prompt('abruption-evidence', true,
    'Read the coagulation as part of the bleed rather than a laboratory result.',
    'A fibrinogen of 1.5 g/L is not merely low; late in pregnancy it is usually well above 4, so this is a value that has already fallen a long way, alongside platelets of 112 and an INR of 1.4. That pattern belongs to the hemorrhage rather than sitting beside it. None of the supplied evidence identifies how much blood has been lost, and none of it excludes the competing causes.');
  if (patient.reassessmentAtTick === null) return prompt('abruption-reassess', false,
    'Record the bounded simultaneous intent, let the interval pass, and read the 10-minute report.',
    'The interval is a contrast rather than a required wait or a predicted response time. Nothing here says how fast any individual abruption declares itself.');
  return prompt('abruption-handoff', true,
    'Hand off a fetus that has not recovered and a loss nobody has quantified.',
    'A rate of 118, a pressure of 98/60, and 120 mL now visible — none of which quantifies the concealed loss, proves her coagulation is holding, or says the fetal compromise is improving, because it has not. The total loss, the shock, the coagulopathy, the delivery and anesthesia decisions, the neonatal team, the pathology, the recurrence risk, the bereavement support that may be needed, and the disposition all travel with her.');
}
