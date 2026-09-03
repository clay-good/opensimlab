import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { AutoPeepProgress } from '../auto-peep';

export const AUTO_PEEP_TUTOR_VERSION = '0.1.0';

export interface AutoPeepPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is the peak pressure. Thirty-five looks like the
 * problem and invites turning the tidal volume down, and the plateau is 22 —
 * the pressure is going into resistance rather than into her alveoli. The
 * second reflex is the rate: she is being ventilated at 28 a minute and cannot
 * finish exhaling, so the setting that looks like it is helping her carbon
 * dioxide is the one causing the trapping that is dropping her pressure.
 *
 * It is silent on the unassisted setting, silent once the response is
 * reassessed, and silent for any scenario version it was not written against.
 */
export function autoPeepInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: AutoPeepProgress },
): AutoPeepPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.reassessmentAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.flowAtTick === null) return prompt('apo-flow', true,
    'Watch the expiratory flow reach the next breath without ever getting to zero.',
    'A sixty-seven-year-old intubated woman with COPD on volume control at 480 mL and 28 a minute, set PEEP 5, oxygen at 0.40. The finding is on the flow-time graphic: expiratory flow is still below zero when the next breath begins, which means she never finishes exhaling. Read the rest alongside it, because each part is a consequence. Her peak pressure is 35 and her passive plateau is 22 — that gap is resistance rather than stiff lungs, and it is the peak that invites you to turn her tidal volume down for a problem it is not measuring. Several visible efforts fail to trigger a breath, which is what happens when a patient has to undo trapped pressure before the ventilator notices she is trying. And her MAP is 62, at a rate of 112. All of that is one story.');
  if (patient.measurementAtTick === null) return prompt('apo-measure', true,
    'Now measure it, because seeing the flow is not knowing the number.',
    'A brief authored passive window is available, and the expiratory-hold proxy is only valid in one: a patient making efforts gives a reading that means nothing. Held, the total PEEP is 16 against a set PEEP of 5, so the intrinsic PEEP is 11 — and holding those three apart is the point of this step. Set is what you dialled, total is what is actually in her chest at end-expiration, and intrinsic is the difference, which is the part nobody chose. Eleven centimetres of pressure she cannot get rid of is enough to explain a MAP of 62 in a way that no amount of looking at the waveform would have quantified.');
  if (patient.classificationAtTick === null) return prompt('apo-classify', true,
    'Say what pattern this is and what it is doing to her — then stop short of calling one graphic proof.',
    'Incomplete exhalation with obstructive physiology is dynamic hyperinflation: every breath stacks on the remainder of the last one, and the consequences are in front of you. It raises her intrathoracic pressure, which is why her blood pressure is what it is. It sets a trigger threshold she has to overcome before the ventilator responds, which is the missed efforts. And it is bounded — this is her authored pattern, and one flow-time graphic is not universal proof of trapping in the next patient you see. Naming the mechanism is what makes the correction cause-directed rather than a guess at settings.');
  if (patient.correctionAtTick === null) return prompt('apo-correct', true,
    'Treat the obstruction and buy expiratory time. Record intent, not a set of numbers.',
    'Two things have to happen and only one of them is the ventilator. The obstruction is the reason the air is trapped, and that is a bronchodilator-and-cause question for the treating team. The other half is giving her longer to exhale — which in practice comes from the rate she is being ventilated at, because 28 a minute is what leaves no expiratory time, and it is the setting that looks like it is helping her carbon dioxide while it causes the trapping. The protective volume and pressure guardrails stay. What is not recorded here is a recipe: no universal settings, no target, and specifically no reflex claim about external PEEP, which has a real role in triggering and a real capacity to make things worse, and belongs to respiratory therapy and senior review rather than to a rule.');
  return prompt('apo-reassess', true,
    'Read the ten-minute response, and accept the trade you made.',
    'The fixed response shows less trapping — the flow, the total and intrinsic PEEP, the pressures, the triggering, the gas exchange and the circulation all get read together, because the point of the change was the trapping and the evidence for it is spread across all six. The part worth being honest about is the carbon dioxide: giving her more time to exhale means fewer breaths, and the hypercapnia that follows is bounded and accepted rather than a failure. That trade is the treatment working, not a side effect of it. Nothing here examines her, acquires waveforms or mechanics, handles the airway or the equipment, diagnoses, selects a ventilator mode or setting, titrates external PEEP, prescribes or delivers a drug, sedates or paralyses, samples blood, performs a procedure, determines disposition, or predicts outcome.');
}
