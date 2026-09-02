import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { HighFlowOxygenEscalationProgress } from '../high-flow-nasal-oxygen-escalation';

export const HIGH_FLOW_OXYGEN_TUTOR_VERSION = '0.1.0';

export interface HighFlowOxygenEscalationPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps, including their last
 * wrong turn.
 *
 * This lesson is the deliberate mirror of the support-selection lesson: the
 * bilevel trial that was the right answer there is not the pathway here, and
 * the tutor is careful to say why without pretending NIV is a bad idea in
 * general. It is silent on the unassisted setting, silent once the handoff
 * is recorded, and silent for any scenario version it was not written
 * against.
 */
export function highFlowOxygenEscalationInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: HighFlowOxygenEscalationProgress },
): HighFlowOxygenEscalationPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('hfno-trajectory', true,
    'The oxygen is working. He is still not managing.',
    'A 52-year-old music teacher who normally walks to work, four days of fever and cough, and new bilateral inflammatory opacities without an edema pattern, pneumothorax or large effusion. Twenty minutes on a verified functioning reservoir mask at 15 L/min, and he is still in short phrases with accessory-muscle use, 34 breaths a minute and 88%. His gas is pH 7.46, PaCO₂ 31, PaO₂ 55 — alkalotic from working hard, not acidotic. The equipment is not the problem and there is nothing left to turn up: this is de novo hypoxemic failure that has outgrown conventional oxygen.');
  if (patient.suitabilityAtTick === null) return prompt('hfno-suitability', true,
    'Check he is a candidate, check somebody can rescue him, and ask him.',
    'The fixed report describes a patent airway, secretions he is handling, cooperation, and none of emesis, hematemesis, facial injury, untreated pneumothorax, apnea, arrest, severe agitation, lost airway protection, shock or an immediate-deterioration pattern. Continuous observation and serial reassessment are available and an airway-capable rescue plan is active. His preference for a nasal interface is documented, which is a clinical fact here rather than a courtesy — the tolerability of what you choose is part of whether it works. Read all of that as support for a closely monitored trial in this case, not as your own examination and not as a checklist to tick.');
  if (patient.selectionAtTick === null) {
    if (patient.lastUnsupportedChoice === 'conventional') return prompt('hfno-conventional-refused', true,
      'Staying is a decision too, and this one has already been tested.',
      'The reservoir mask is documented as functioning and he has had twenty minutes on it. Continuing unchanged is not a neutral pause while you think — it is choosing the support that has already failed to make him adequate, in a man whose work of breathing is the thing most likely to run out first. Nothing changed when you chose it, because nothing about him changed.');
    if (patient.lastUnsupportedChoice === 'bilevel') return prompt('hfno-bilevel-refused', true,
      'Not a bad instinct. Not this case’s pathway.',
      'NIV and CPAP can be entirely reasonable in selected acute hypoxemic failure, and reaching for one is not a misunderstanding of the physiology — this is simply not the case where it is the first choice. He has no acidotic hypercapnia and no cardiogenic-edema pattern, this authored de novo hypoxemic presentation follows the strong high-flow pathway with close rescue monitoring, and he has told you he would prefer a nasal interface. Nothing changed when you chose it, because nothing about him changed.');
    return prompt('hfno-selection', true,
      'Escalate the oxygen delivery, and keep the rescue plan next to it.',
      'A closely monitored high-flow nasal oxygen trial is the strong guideline pathway for this authored de novo hypoxemic pattern. What you are selecting is a goal: qualified staff own the source, the device, the cannula, the fit, the flow, the temperature, the humidification, the FiO₂ and the oxygen target, and none of those are yours to set. The trial only means anything alongside the airway-capable rescue that was already active.');
  }
  if (patient.responseAtTick === null) return prompt('hfno-response', true,
    'Give it time, then read the thirty-minute response you were given.',
    'It is a fixed authored report and it cannot be read before simulated time has passed. Look at the whole person rather than one number: the work of breathing, the respiratory rate, the mentation, the comfort and the tolerance of the interface, alongside the oxygenation. And note what this lesson deliberately does not let you compute — no ROX index, no PaO₂/FiO₂ ratio — because the delivered FiO₂ on that reservoir mask was never actually known.');
  if (patient.guardsAtTick === null) {
    if (patient.lastUnsupportedChoice === 'resolved') return prompt('hfno-resolved-refused', true,
      'Better is not resolved, and he is still on substantial support.',
      'He is talking in longer sentences at 26 breaths a minute with a saturation of 94%, and every one of those numbers is better than it was. None of them was achieved on room air. Calling this resolved retires the very risk that the improvement depends on, in a man whose pathogen and cause are still unresolved. Early improvement is what a working trial looks like at thirty minutes, not what the end of one looks like. Nothing changed when you chose it, because nothing about him changed.');
    if (patient.lastUnsupportedChoice === 'reduced-monitoring') return prompt('hfno-monitoring-refused', true,
      'This is the exact moment the monitoring earns its keep.',
      'Standing the observation down when a patient improves feels like proportionate care, and here it removes the thing that would catch the failure. High-flow can keep someone comfortable and stable-looking while the underlying process continues, so the window where he looks well is the window in which delayed intubation happens. He still needs close reassessment and rapid rescue access. Nothing changed when you chose it, because nothing about him changed.');
    return prompt('hfno-guards', true,
    'Name what would make you stop, and who you would call.',
    'High-flow can make a patient look and feel better while the underlying failure continues, which is exactly why the guards matter more here than in a therapy that declares itself. Say what continuation depends on, what counts as deterioration, how often he is reassessed, who is watching, and who is called and how fast. Delayed intubation is the specific harm this trial risks, and a guard written down in advance is what prevents it.');
  }
  return prompt('hfno-handoff', true,
    'Hand off a trial that is working so far and is not finished.',
    'What travels is his baseline and his independence, the failure of verified conventional oxygen, the trajectory that made escalation necessary, the choice you made and why the alternatives were not it here, the thirty-minute response, the guards and the triggers, his documented preference, and who is watching and who is called. Nothing here proves durable success, resolves the pathogen or the cause, determines a disposition, or predicts an outcome.');
}
