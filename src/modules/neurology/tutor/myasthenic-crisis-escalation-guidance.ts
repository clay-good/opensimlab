import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { MyastheniaProgress } from '../myasthenic-crisis-escalation';

export const MYASTHENIA_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for respiratory failure that keeps its saturation.
 *
 * Neuromuscular ventilatory failure does not announce itself the way the
 * monitor teaches people to expect. Her saturation is 97% on room air, her
 * blood gas is unremarkable, and her vital capacity has fallen from 2.4 to 1.4
 * litres in six hours with a maximal inspiratory pressure going the same way.
 * Hypercapnia in this disease is a late finding, so waiting for it is waiting
 * too long — and no single vital capacity, pressure, word count or gas value is
 * a universal threshold, which is why the trend and the bulbar findings carry
 * the decision. So the prompts read the direction rather than the number, keep
 * the pooled secretions as a separate emergency from the breathing, and treat
 * the pneumonia as the trigger rather than the problem. None of them measures
 * mechanics, takes a gas, or selects a drug, dose, oxygen, ventilation, or
 * airway.
 */
export function myastheniaInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly myasthenia?: MyastheniaProgress;
}) {
  const patient = input.myasthenia;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('myasthenia-trajectory', true,
    'Read the direction of travel, not the numbers as they stand.',
    'Thirty-six hours of worsening fatigable weakness after three days of fever and productive cough: diplopia, ptosis, nasal speech, head drop, breathlessness while speaking, a weak cough and saliva she cannot clear. The supplied vital capacity has gone from 2.4 to 1.4 litres and the maximal inspiratory pressure from -38 to -22 in six hours. Two of those are bulbar and two are ventilatory, and both sets are moving the same way.');
  if (patient.recognitionAtTick === null) return prompt('myasthenia-recognition', true,
    'Call this an impending crisis while the saturation is still normal.',
    'A room-air saturation of 97% and a PaCO2 of 41 are exactly what this looks like shortly before it stops looking like anything. Neuromuscular failure holds its oxygenation until it does not, and hypercapnia here is a late sign rather than a warning — so waiting for either is waiting too long. There is no single cutoff to lean on either: no one vital capacity, pressure, count or gas value is a universal threshold, and what decides this is the trajectory plus a bulbar picture that cannot protect an airway.');
  if (patient.ownershipAtTick === null) return prompt('myasthenia-ownership', true,
    'Get neurology, neurocritical care, respiratory and an airway-capable owner in now.',
    'This is escalation ahead of the event rather than in response to it, and the people who will manage the airway need to be present before the airway is the problem. Pooled secretions with a barely effective cough is its own emergency running alongside the falling vital capacity — one is about ventilating and the other is about protecting, and neither waits for the other.');
  if (patient.causesAtTick === null) return prompt('myasthenia-causes', true,
    'Treat the chest as the trigger, and keep every alternative open.',
    'Three days of fever and productive cough with a new right basilar opacity is a precipitant worth chasing, and the radiograph cannot say whether that shadow is infection or aspiration — which matters, because a weak cough and pooled saliva make the second entirely plausible. Medication exposures, test reliability, and metabolic, pulmonary, cardiac, central and other neuromuscular causes all stay open, and this review runs alongside the escalation rather than in front of it.');
  if (patient.laterAtTick === null) return prompt('myasthenia-later', false,
    'Record the review, let the interval pass, and read the 30-minute report.',
    'The interval is a contrast rather than a required wait or a predicted trajectory. Nothing here says what any individual patient does next.');
  return prompt('myasthenia-handoff', true,
    'Hand off a patient who is now ventilated, and note what her saturation did throughout.',
    'One-word speech, no head lift, a barely audible cough, continuous secretion management, a vital capacity of 0.9 litres and a PaCO2 that has only reached 49 — and a pulse-coherent saturation of 95% the whole way down. The qualified airway team has documented that invasive ventilation is required and has provided it. That establishes the crisis and proves nothing else: not the trigger, not a treatment response, not the ventilator course, not the weaning or the extubation risk, all of which travel with her.');
}
