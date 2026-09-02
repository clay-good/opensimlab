import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { PediatricRespiratoryDistressProgress } from '../pediatric-respiratory-distress';

export const PEDIATRIC_RESPIRATORY_DISTRESS_TUTOR_VERSION = '0.1.0';

export interface PediatricRespiratoryDistressPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps, including their last
 * wrong turn.
 *
 * This lesson refuses at three separate moments, and the last refusal is the
 * one that matters most: a falling respiratory rate in a tiring child is
 * exhaustion, not improvement. It is silent on the unassisted setting,
 * silent once the handoff is recorded, and silent for any scenario version
 * it was not written against.
 */
export function pediatricRespiratoryDistressInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: PediatricRespiratoryDistressProgress },
): PediatricRespiratoryDistressPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.recognitionAtTick === null) return prompt('prd-recognition', true,
    'Look at the whole child, and let no single number speak for her.',
    'She is six, twenty kilos, previously well, and eighteen hours into a cough. She is awake and anxious, sitting upright, speaking in short phrases, with nasal flaring, grunting and marked intercostal and subcostal recession, and equally reduced air entry on both sides. Heart rate 138, respiratory rate 46, saturation 87% on air with a clean pleth, warm extremities, strong pulses, refill of two seconds. The grunting and the flaring are doing as much work in that picture as the 87% is. All of it is supplied — you are not examining her and not measuring anything.');
  if (patient.supportAtTick === null) {
    if (patient.lastUnsupportedChoice === 'history-first') return prompt('prd-history-refused', true,
      'Keep asking. Just not instead of this.',
      'A fuller history genuinely matters here — the causes are still open and somebody needs to take it. But it runs alongside support rather than in front of it, and a child working this hard does not have the minutes it would cost. Ask while help is coming and oxygen is going on, not before. Nothing changed when you chose it, because nothing about her changed.');
    if (patient.lastUnsupportedChoice === 'imaging-first') return prompt('prd-imaging-refused', true,
      'A picture may help with the cause. It will not help with the breathing.',
      'Imaging can be exactly right later, and the fixed reports have left infection, upper and lower airway disease, aspiration, anaphylaxis and metabolic drive all open. But nothing a scan tells you changes what she needs in the next few minutes, and getting it means moving a child in distress away from the people who can help her. Support first, cause afterwards. Nothing changed when you chose it, because nothing about her changed.');
    return prompt('prd-support', true,
      'Get experienced pediatric help and qualified oxygenation started now.',
      'Experienced help, oxygenation delivered by people qualified to choose it, continuous monitoring, and rescue readiness standing by — as one step, because in a child this is one step. None of the specifics are yours: no device, flow, fraction or target is selected here, nothing is delivered by you, and no airway maneuver, drug, fluid or procedure is performed. What you are recording is that the right people and the right monitoring are around her before anything else is decided.');
  }
  if (patient.earlyResponseAtTick === null) return prompt('prd-early', true,
    'Let time pass, then look at her again rather than at the monitor.',
    'The early report is fixed and cannot be read before simulated time has passed. When you read it, read the child: her mentation, her effort, her speech, her air entry, and the saturation as one of several things rather than the headline. This lesson will offer you a comfortable reading of that report, and the whole point is to notice what the comfortable reading leaves out.');
  if (patient.laterPanelAtTick === null) {
    if (patient.lastUnsupportedChoice === 'single-number') return prompt('prd-single-number-refused', true,
      'The number moved. The child did not.',
      'The saturation is better and that is worth something — but she is still grunting, still recessing, still speaking in short phrases, still tachypneic, and her air entry is still reduced. Every one of those is a sign of the work she is doing, and a saturation is what you get when that work is succeeding for now. Treating the improved number as the answer is how a tiring child gets left alone with it. Nothing changed when you chose it, because nothing about her changed.');
    return prompt('prd-later', true,
      'Allow more time, then open the later panel and read it carefully.',
      'It is fixed and strictly later, and it is where this lesson turns. Look at mentation, effort, air movement, rate and oxygenation together, and ask which direction they are moving as a group rather than one at a time. A child who is getting better and a child who is running out of strength can produce some of the same numbers, and the difference is visible only in the whole picture.');
  }
  if (patient.rescueAtTick === null) {
    if (patient.lastUnsupportedChoice === 'falling-rate') return prompt('prd-falling-rate-refused', true,
      'That is not her getting better. That is her running out.',
      'The rate fell from 46 to 28 and the effort looks less dramatic — and she is now drowsy, answering in one weak word, breathing shallowly and irregularly, with markedly reduced air movement, a heart rate that has gone up to 146, and a saturation of 90% on unchanged support. A respiratory rate coming down while mentation, effort, air movement and oxygenation all worsen together is fatigue, not recovery. It is the most dangerous reassuring number in pediatrics, and this is the moment she needs an airway-capable team, not a period of watchful waiting. Nothing changed when you chose it, because nothing about her changed.');
    return prompt('prd-rescue', true,
      'She has a pulse and she is not breathing adequately. Escalate now.',
      'Airway-capable pediatric rescue ownership, activated on the pattern rather than on an arrest that has not happened. Spontaneous breathing and a pulse are exactly the conditions in which this is still preventable, and the window for that is the one she is in now. Activating the pathway is not performing it: nothing here intubates, ventilates, gives a drug or a fluid, or performs a procedure — the people who own those are the people you are calling.');
  }
  return prompt('prd-handoff', true,
    'Hand off a child who is still deteriorating.',
    'What travels is her baseline and the eighteen hours before this, the whole-child pattern rather than any single number, what support was activated and when, both reviews and the direction between them, the fatigue that the falling rate actually represents, the causes that stay open — infection, airway disease, aspiration, anaphylaxis, metabolic drive and others the absent findings do not exclude — and who owns the airway if she stops managing. Nothing here diagnoses a cause, proves recovery, decides disposition or prognosis, or predicts an outcome.');
}
