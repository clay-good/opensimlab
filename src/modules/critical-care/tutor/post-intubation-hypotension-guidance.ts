import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { PostIntubationHypotensionProgress } from '../post-intubation-hypotension';

export const POST_INTUBATION_HYPOTENSION_TUTOR_VERSION = '0.1.0';

export interface PostIntubationHypotensionPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is the explanation already in hand. He was
 * intubated for septic shock, so hypotension two minutes later has an obvious
 * cause and the sedation-plus-positive-pressure story fits perfectly — which is
 * precisely why the danger review comes first, because a tension pneumothorax
 * and a misplaced tube also fit and kill faster. The second reflex is the
 * fluid-versus-vasopressor argument, which this lesson declines to have: it
 * records both, bounded, and says the answer is not universal.
 *
 * It is silent on the unassisted setting, silent once the response is
 * reassessed, and silent for any scenario version it was not written against.
 */
export function postIntubationHypotensionInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: PostIntubationHypotensionProgress },
): PostIntubationHypotensionPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.reassessmentAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.pressureAtTick === null) return prompt('pih-pressure', true,
    'Confirm the number is real, look at the patient, and call for help. Then stop.',
    'Two minutes after intubation for pneumonia and septic shock, the invasive MAP has fallen from 68 to 46 with a pulsatile arterial waveform — and that waveform is what makes this a pressure rather than a reading, which matters because a damped or disconnected line gives you the same panic for nothing. He is 120 in sinus, refill five seconds, extremities warm. Warm and underperfused is a finding rather than a contradiction, and it is the first hint about mechanism. Experienced help is called now, before any classification, because the next two minutes are the ones in which this either becomes straightforward or does not.');
  if (patient.dangerAtTick === null) return prompt('pih-danger', true,
    'Before the physiology, rule out the things that kill in the next few minutes.',
    'You have an explanation already — he was intubated for septic shock, sedation and positive pressure drop the pressure, and that story is probably right. It is also the reason this step exists, because a tension pneumothorax and a displaced or oesophageal tube produce identical hypotension on the same timescale and are not survivable if you spend ten minutes on vasopressors instead. Here the evidence is present rather than assumed: a continuous exhaled carbon dioxide waveform and reported bilateral ventilation, a peak of 27 against a plateau of 21 with expiratory flow reaching zero — no stacking, no obstruction, no tension pattern. No external bleeding, no rash, no wheeze, no facial swelling. Rhythm, sedation timing and the transition to positive pressure all get reviewed too. Everything on that list is checked rather than dismissed.');
  if (patient.mechanismAtTick === null) return prompt('pih-mechanism', true,
    'Now name the pattern, and use the dynamic response rather than an impression.',
    'The fixed passive-leg-raise proxy raises his stroke volume from 48 to 57 mL while the lungs stay clear — he is fluid-responsive, and that is a measurement rather than a guess about a septic patient. Put it beside the warm extremities and the tachycardia and what you have is mixed: vasodilated and preload-sensitive at once. The word that earns its place here is "while": pump failure and obstructive causes stay open, because a leg raise that increases stroke volume tells you a bit of volume would help and tells you nothing about whether something else is also true. This is the same discipline as the mixed-shock lesson, arriving from a different direction.');
  if (patient.supportAtTick === null) return prompt('pih-support', true,
    'Both, together, bounded — and no argument about which one first.',
    'Concurrent norepinephrine intent toward an initial MAP near 65 and a cautious 250 mL balanced-crystalloid challenge with immediate reassessment. The word "cautious" and the number 250 are doing the work: this is a challenge with a defined size and a defined moment to look again, not an open fluid commitment in a patient with pneumonia. And the vasopressor is not deferred while the fluid is tried, because his MAP is 46 and the two act on different halves of what is wrong with him. The lesson is explicit that this is not a universal fluid-versus-vasopressor answer — it is this patient, whose leg raise moved his stroke volume and whose lungs are clear. You select no dose, deliver nothing, and change no ventilator or sedation setting.');
  return prompt('pih-reassess', true,
    'Read the response, and notice that the thing he came in with is untouched.',
    'Pressure, perfusion, the dynamic response again, the lungs, gas exchange, and what shock support he still needs — all read together, because a challenge with a defined moment to look again is only a challenge if somebody looks. The fixed response improves. What it does not do is close anything: he was intubated for pneumonia and septic shock, and none of this addressed the source, the antimicrobials or the ongoing resuscitation. Peri-intubation hypotension is a complication of the treatment rather than the disease, and fixing it returns you to the disease. Nothing here examines him, acquires a pressure, performs ultrasound or a leg raise, delivers fluid or a drug, doses, changes the ventilator or sedation, diagnoses, treats a source, determines disposition, or predicts outcome.');
}
