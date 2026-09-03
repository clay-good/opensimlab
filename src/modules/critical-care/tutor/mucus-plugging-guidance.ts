import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { MucusPluggingProgress } from '../mucus-plugging';

export const MUCUS_PLUGGING_TUTOR_VERSION = '0.1.0';

export interface MucusPluggingPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is the obvious answer being obviously right.
 * There is visible secretion in the tube, so of course this is a plug — and the
 * peak-to-plateau gap, the sawtooth flow and the reduced left base are each
 * consistent with several other things that would kill him differently. The
 * second reflex is stopping when the suction works: the central airway clears
 * and the left base does not, and a partial response is the most persuasive
 * reason to stop looking.
 *
 * It is silent on the unassisted setting, silent once the escalation is
 * recorded, and silent for any scenario version it was not written against.
 */
export function mucusPluggingInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: MucusPluggingProgress },
): MucusPluggingPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.escalationAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.supportAtTick === null) return prompt('mpl-support', true,
    'Oxygen and help first. This is the one lesson in the module that starts with treatment.',
    'A sixty-four-year-old intubated man with pneumonia, suddenly at 87% on 0.45 with a peak pressure that has gone from 27 to 38 while his passive plateau stays at 23. That gap is resistance and it appeared abruptly, which in an intubated patient is an airway problem until proved otherwise. Support and experienced help come before the assessment for the simple reason that oxygen does not require a diagnosis, and respiratory therapy and a senior take time to arrive — calling them while you look is free, and calling them after you have decided costs minutes. Everything after this step is about establishing what the resistance is; this step is about him not desaturating while you do it.');
  if (patient.indicatorsAtTick === null) return prompt('mpl-indicators', true,
    'Gather the indicators — and notice none of them is proof.',
    'Coarse central breath sounds, visible thick secretion in the tube, a new sawtooth expiratory-flow pattern, a peak-to-plateau gap that has widened while the plateau held, reduced left-base air entry, 87% on 0.45, an end-tidal of 46 with a continuous capnogram, 108, MAP 74. Tube depth and cuff are unchanged and the circuit is connected, which is itself a finding — the two commonest equipment causes of exactly this picture have been looked at rather than assumed. Retained secretions explain all of it, and so do several other things: a migrated tube, a pneumothorax, collapse, consolidation, blood, a foreign body. The visible secretion is the most persuasive item here and the least specific, because a patient with pneumonia has secretions whether or not they are today\'s problem.');
  if (patient.suctionAtTick === null) return prompt('mpl-suction', true,
    'Record suction as indicated, preoxygenated, and without routine saline.',
    'As-needed rather than scheduled, because suctioning a patient who does not need it costs oxygen and causes trauma for nothing. Preoxygenated, because the procedure itself desaturates people, and he is already at 87%. And without routine saline instillation — the reflex squirt is a habit rather than a treatment, and it has been repeatedly shown to do more harm than good. What you record is the intent; you do not perform the suction, choose a catheter, or handle the airway, and the technique belongs to the people you called in the first step.');
  if (patient.reassessmentAtTick === null) return prompt('mpl-reassess', true,
    'Read the response, and pay attention to the half that did not improve.',
    'The fixed response shows partial improvement: the central airway is better — the secretions, the graphics, the pressures — and the left base is not. That is the most important sentence in this lesson. A partial response is more persuasive than no response at all, because it confirms you were partly right and makes it easy to stop; and the part that did not respond is exactly the part that was never going to be a central plug. Secretions, graphics, pressures, oxygenation, ventilation, breath sounds and circulation all get read, because the point of reassessing was to find out what suction did not fix.');
  return prompt('mpl-escalate', true,
    'Escalate the part that did not respond, and keep the list open.',
    'A persistent focal abnormality after effective central clearance needs imaging and experienced airway evaluation — not because bronchoscopy is the answer, but because you now have a finding that has survived the treatment for the diagnosis you assumed. Routine bronchoscopy is not the default, and this lesson does not make it one. Tube migration, pneumothorax, atelectasis, consolidation, blood, a foreign body and equipment problems all stay open, because the reason to escalate is that you do not know which of them this is. Nothing here examines him, checks equipment, acquires waveforms or mechanics, suctions or removes secretions, images, performs bronchoscopy, diagnoses, programs a ventilator, delivers a drug, performs a procedure, determines disposition, or predicts outcome.');
}
