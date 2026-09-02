import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { NoninvasiveVentilationSelectionProgress } from '../noninvasive-ventilation-selection';

export const NIV_SELECTION_TUTOR_VERSION = '0.1.0';

export interface NoninvasiveVentilationSelectionPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps — including their last
 * wrong turn.
 *
 * This lesson is the only one in the module where a mistake is a choice
 * rather than an ordering error: CPAP alone and high-flow nasal oxygen alone
 * are offered, are refused, and leave the patient exactly as she was. The
 * engine publishes which one was just tried, so the tutor answers that
 * specific choice instead of repeating the generic beat.
 *
 * It is silent on the unassisted setting, silent once the handoff is
 * recorded, and silent for any scenario version it was not written against.
 */
export function noninvasiveVentilationSelectionInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: NoninvasiveVentilationSelectionProgress },
): NoninvasiveVentilationSelectionPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('niv-trajectory', true,
    'Ask what an hour of correct treatment has already failed to fix.',
    'She has COPD, lives independently and walks to the shops, and her stable gas was pH 7.39 with a PaCO₂ of 48. She arrived at 32 breaths a minute and 84% on air, and over sixty minutes an experienced team gave controlled oxygen, repeated bronchodilators and an antimuscarinic, a systemic steroid and antibiotics for the authored indication. None of that was yours to give, and all of it was right. What matters is that she is still in short phrases with accessory-muscle use, and her repeat gas is pH 7.28 with a PaCO₂ of 68. This is persistent acidotic hypercapnia after correct therapy, which is a different question from the one she arrived with.');
  if (patient.suitabilityAtTick === null) return prompt('niv-suitability', true,
    'Check she is a candidate, and check somebody can rescue her.',
    'The fixed report describes a patent airway, secretions she is handling, cooperation, and none of vomiting, hematemesis, facial injury, untreated pneumothorax, apnea, arrest, severe agitation, lost airway protection, shock or an immediate-deterioration pattern. Her goals and preferences have been discussed, continuous observation and serial reassessment are available, and an airway-capable rescue plan is active. Read that as support for a closely monitored trial in this case — not as your own examination, not as permanent exclusions, and not as a checklist to tick.');
  if (patient.selectionAtTick === null) {
    if (patient.lastUnsupportedChoice === 'cpap') return prompt('niv-cpap-refused', true,
      'CPAP holds the airway open. It does not do the breathing.',
      'Continuous distending pressure is the right tool for a different problem — it recruits and it offloads, and in cardiogenic pulmonary edema that is often exactly what is needed. What it does not provide is inspiratory assistance, and her problem is that her carbon dioxide is 68 and her pH is 7.28 despite an hour of correct therapy. She needs help moving air, not just pressure holding it. Nothing changed when you chose it, because nothing about her changed.');
    if (patient.lastUnsupportedChoice === 'high-flow') return prompt('niv-high-flow-refused', true,
      'High-flow will improve her numbers on the monitor, not her ventilation.',
      'High-flow nasal oxygen is comfortable, it washes out dead space and it can support oxygenation well — and her oxygenation is not what is failing. For this authored acute hypercapnic acidotic COPD pattern, current guidance favors an NIV trial first, and reaching for high-flow here risks a saturation that looks better while the acidosis carries on. Nothing changed when you chose it, because nothing about her changed.');
    return prompt('niv-selection', true,
      'Choose the support that assists her breathing, not just her oxygen.',
      'A closely monitored bilevel NIV trial is what fits persistent acute-on-chronic acidotic hypercapnia after verified initial therapy. CPAP alone and high-flow nasal oxygen alone are both offered here and neither provides the ventilatory assistance this pattern needs. What you are selecting is a goal: qualified staff own the device, the interface, the fit, the pressures, the backup rate, the oxygen and the rapid rescue, and none of those are yours to set.');
  }
  if (patient.responseAtTick === null) return prompt('niv-response', true,
    'Give it time, then read the response you were given.',
    'The first hour is a fixed authored report, not something you titrate your way to, and it cannot be read before simulated time has passed. What you are looking for is whether the acidosis, the carbon dioxide and the work of breathing are moving in the right direction — and whether she is tolerating the trial at all, which is as much a part of the answer as the gas.');
  if (patient.failureGuardsAtTick === null) return prompt('niv-guards', true,
    'Decide now what would make you stop, while there is still time to act on it.',
    'A trial without a failure guard is just an assumption with a mask on it. Name what continuation depends on, what would count as deterioration, who is watching, how often she is reassessed, and who is called and how fast if this does not work. The rescue plan was active before you started, and it has to survive the part where things go well for an hour.');
  return prompt('niv-handoff', true,
    'Hand off a trial that is working so far and is not finished.',
    'What travels is her baseline and her independence, the verified initial care, the trajectory that made this necessary, the choice you made and why the alternatives were not it, the first-hour response, the guards and the triggers, who is watching and who is called. Nothing here proves durable success, determines a ceiling of care, decides a disposition, or predicts an outcome.');
}
