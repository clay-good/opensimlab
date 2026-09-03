import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { DyssynchronyProgress } from '../dyssynchrony';

export const DYSSYNCHRONY_TUTOR_VERSION = '0.1.0';

export interface DyssynchronyPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is sedation. A man visibly fighting a ventilator
 * is the commonest reason a team reaches for a propofol bolus or a paralytic,
 * and everything on his screen says he is trying to breathe and being refused:
 * scooped pressure because the flow is too slow for him, cycling that ends
 * before he has finished, and eight breaths in twenty where he pulls a second
 * one on top of the first. Sedating him would remove the evidence rather than
 * the cause, and the lesson is built so that the drivers and the pattern have to
 * be established before any correction is recorded.
 *
 * It is silent on the unassisted setting, silent once the response is
 * reassessed, and silent for any scenario version it was not written against.
 */
export function dyssynchronyInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: DyssynchronyProgress },
): DyssynchronyPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.reassessmentAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.graphicsAtTick === null) return prompt('vds-graphics', true,
    'Look at the man and the waveform as one thing. He is telling you what the ventilator is getting wrong.',
    'A fifty-eight-year-old intubated man, awake enough to signal discomfort, with visible inspiratory effort on volume control at 420 mL and 18 a minute, PEEP 8, oxygen at 0.40. Over a fixed twenty-breath observation: the pressure-time trace scoops, which is what a patient pulling harder than the set flow will give you. The ventilator cycles early and he keeps going afterwards, so the breath ends while he is still asking for it. And eight of those twenty double trigger — a second breath stacked on the first, taking the delivered volume to 760 mL against a set 420. His peak is 30 with a passive plateau of 22 recorded before this started, and he is 93%, 104, MAP 77, pH 7.31 with a carbon dioxide of 50. Every one of those observations is the same sentence: his demand and the machine\'s delivery do not match.');
  if (patient.driversAtTick === null) return prompt('vds-drivers', true,
    'Before you touch the settings, ask what is making him breathe like this.',
    'Pain, respiratory drive, the airway, secretions, the circuit, auto-PEEP, gas exchange and circulation all get reviewed, and this step exists ahead of the classification for a reason: a patient fighting a ventilator can be fighting something that has nothing to do with the ventilator. Pain and an unmet drive are the two that matter most here, because he is awake enough to tell you he is uncomfortable and his carbon dioxide is 50 with a pH of 7.31 — a chemical reason to want more breath than he is being given. Secretions and a circuit problem produce the same picture from a different cause. Auto-PEEP deserves particular attention given the last lesson: trapped pressure raises the trigger threshold and looks exactly like a patient who cannot get a breath. Finding one of these means the correction is a different correction.');
  if (patient.classificationAtTick === null) return prompt('vds-classify', true,
    'Name the two patterns, and resist calling every irregular breath the same thing.',
    'What the panel supports is flow starvation and premature cycling: he wants a faster inspiratory flow than the setting gives, and the breath ends before his effort does. The double triggering is the consequence rather than a third finding — a breath that stops while he is still pulling gets a second breath immediately, which is where 760 mL from a set 420 comes from, and that stacked volume is the part with a lung-injury cost. Being specific matters because the corrections diverge: flow starvation and premature cycling are fixed by matching flow and cycling, while ineffective triggering or reverse triggering would need something else entirely. One bounded observation in one patient supports this pattern and is not a rule about irregular breaths in general.');
  if (patient.correctionAtTick === null) return prompt('vds-correct', true,
    'Analgesia first, then match the support to the patient — and do not sedate the evidence away.',
    'Analgesia comes first because he is awake, uncomfortable and has told you so, and because pain is a driver rather than a nuisance. Then the flow and the cycling get matched to him by respiratory therapy, with the lung-protective volume and pressure limits kept — the stacked 760 mL is exactly why those limits are not negotiable in a patient who is double triggering. What this lesson explicitly refuses is the reflex it is built against: no deep-sedation claim and no paralysis. Sedating a patient who is fighting because the settings do not fit him removes the signal and leaves the mismatch, and paralysis makes a comfortable-looking patient out of an unaddressed problem. No dose, no agent, no setting and no target is selected here.');
  return prompt('vds-reassess', true,
    'Read the response across comfort and mechanics together, because either alone can mislead.',
    'The fixed ten-minute response improves. Comfort, effort, the graphics, the delivered volume, the pressures, gas exchange and circulation all get read together — a patient who looks settled while his delivered volume is still stacking has not been helped, and graphics that have tidied up while he is still distressed have not either. No universal settings are claimed: what worked for this man\'s flow demand is his, not a number to carry to the next patient. Nothing here examines him, measures pain or sedation, handles the airway or equipment, acquires waveforms, diagnoses, selects a mode or setting, prescribes or delivers a drug, paralyses, samples blood, performs a procedure, determines disposition, or predicts outcome.');
}
