import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { CroupProgress } from '../croup';

export const CROUP_TUTOR_VERSION = '0.1.0';

export interface CroupPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps, including their last
 * wrong turn.
 *
 * The through-line of this lesson is that upsetting the child is itself a
 * clinical act: crying tightens an already narrowed airway, so the things
 * that feel like thoroughness — a look in the throat, a trip to radiology,
 * a mask held on a screaming toddler — are the things that make her worse.
 * It is silent on the unassisted setting, silent once the handoff is
 * recorded, and silent for any scenario version it was not written against.
 */
export function croupInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: CroupProgress },
): CroupPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.patternAtTick === null) return prompt('croup-pattern', true,
    'Leave her where she is, and read her from there.',
    'A previously well three-year-old, fifteen kilos, two days of coryza and then two hours of barking cough, a hoarse voice and noisy inspiration at night. She is alert, frightened and consolable, held in her caregiver’s position of comfort — and that position is treatment, not sentiment. Inspiratory stridor is audible at calm rest, with moderate tracheal tug and recession and equal air entry; heart rate 132, respiratory rate 34, temperature 37.8, saturation 96% on air. Stridor at rest is the finding that matters here. Taking her out of her caregiver’s arms to be examined properly would cost more than it could possibly tell you.');
  if (patient.severityAtTick === null) {
    if (patient.lastUnsupportedChoice === 'albuterol') return prompt('croup-albuterol-refused', true,
      'That noise is coming from above the vocal cords.',
      'Stridor is inspiratory and upper airway; wheeze is expiratory and lower airway. A beta agonist works on bronchial smooth muscle that is not what is narrowed here, so it treats a problem she does not have — and delivering it means a mask on the face of a frightened toddler, which tightens the airway you are trying to open. Nothing changed when you chose it, because nothing about her changed.');
    if (patient.lastUnsupportedChoice === 'radiograph') return prompt('croup-radiograph-refused', true,
      'Radiology is a cold room, a flat table, and a child who will scream.',
      'Typical croup is a clinical assessment, and this presentation is typical: barking cough, hoarse voice, stridor at rest, no drooling, no dysphagia, no tripod posture, no toxic appearance. A neck film would delay calm support and would upset her to get it, in a child whose airway narrows further every time she cries. Imaging earns its place when a specific alternative changes the question — that is a different situation from this one. Nothing changed when you chose it, because nothing about her changed.');
    return prompt('croup-severity', true,
      'Grade her without touching her, and keep the alternatives open.',
      'Stridor at rest with tracheal tug and recession, in a child who is still alert, consolable and moving air equally, is what the severity assessment rests on — all of it observable from across the room. The fixed absences of drooling, dysphagia, tripod posture, high fever, toxic appearance, choking, possible ingestion, wheeze, focal asymmetry, urticaria, facial swelling, hypotension, trauma, a recurrent course, airway anomaly or prior intubation help place this branch. They do not permanently exclude foreign body, anaphylaxis, epiglottitis, bacterial tracheitis or a deep-neck infection if her trajectory changes or she responds poorly.');
  }
  if (patient.treatmentIntentAtTick === null) return prompt('croup-treatment-intent', true,
    'Keep her calm, get airway-capable people here, and let them treat.',
    'Minimal-distress support with her caregiver, experienced pediatric and airway-capable ownership, and qualified-team treatment intent recorded as intent — because the drug, the dose, the route, the concentration, the repeat interval, the nebulizer and the oxygen are all theirs to choose and none of them are yours. What you are recording is that the right people are coming and that nobody is going to upset her to look busy in the meantime.');
  if (patient.earlyResponseAtTick === null) return prompt('croup-early', true,
    'Let time pass, then read what the treatment actually did.',
    'It is a fixed report and cannot be read before simulated time has passed. Look at her behavior, her stridor at rest, her work of breathing, her color and her air entry together — the same things you graded before, so the comparison means something. What you are looking for is a direction, not a verdict.');
  if (patient.recurrenceAtTick === null) {
    if (patient.lastUnsupportedChoice === 'discharge-early') return prompt('croup-discharge-refused', true,
      'Nebulized epinephrine wears off, and she can come back worse.',
      'The improvement after it is real and it is temporary, which is exactly why an observation period exists — a child who looks well half an hour after treatment can have her stridor return once the drug does. Discharging on the peak of that effect is how a family ends up back at three in the morning with a child who is worse than when they left. Early improvement is not durable recovery and it is not discharge readiness. Nothing changed when you chose it, because nothing about her changed.');
    if (patient.lastUnsupportedChoice === 'normal-saturation') return prompt('croup-saturation-refused', true,
      'In an upper airway, the saturation falls last.',
      'She is 96% and she has been 96% throughout, and that number will hold until she is close to exhausted — in obstruction above the cords, hypoxemia is a late finding rather than an early warning, so a normal saturation says almost nothing about how much airway she has left. Her behavior, her stridor at rest, her work of breathing, her color and her air entry are what carry the risk. Nothing changed when you chose it, because nothing about her changed.');
    return prompt('croup-recurrence', true,
      'Allow more time, then look for the return and keep the airway plan alive.',
      'Fixed and strictly later. The question is whether the stridor is coming back as the treatment fades, and whether airway-capable readiness is still in place if it does — the readiness has to outlast the improvement. Nothing here proves recovery, establishes discharge readiness, or determines where she goes.');
  }
  return prompt('croup-handoff', true,
    'Hand off an airway that is better for now.',
    'What travels is the two-day coryza and the two hours that changed it, the stridor at rest and what her severity looked like before treatment, that she was kept calm and why, the qualified-team treatment and what followed it, the recurrence review, and the airway-capable readiness that has to stay in place. What also travels is what the fixed absences did not exclude — foreign body, anaphylaxis, epiglottitis, bacterial tracheitis, deep-neck infection — if she changes direction. Nothing here diagnoses her, identifies a pathogen, proves recovery, determines discharge or admission, or predicts an outcome.');
}
