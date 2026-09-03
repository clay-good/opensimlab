import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { SpontaneousBreathingTrialProgress } from '../spontaneous-breathing-trial';

export const SPONTANEOUS_BREATHING_TRIAL_TUTOR_VERSION = '0.1.0';

export interface SpontaneousBreathingTrialPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * This is the one lesson in the module that ends in a failure, and the reflex
 * it works against is reading that failure as a verdict. A trial that goes
 * badly is information about a reversible list — load, weakness, fluid, pain,
 * sedation, sleep, secretions — not a statement about whether she can ever come
 * off. The second reflex is the opposite error at the other end: treating a
 * good trial as permission to extubate, when the airway is a separate decision.
 *
 * It is silent on the unassisted setting, silent once the plan is recorded, and
 * silent for any scenario version it was not written against.
 */
export function spontaneousBreathingTrialInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: SpontaneousBreathingTrialProgress },
): SpontaneousBreathingTrialPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.planAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.readinessAtTick === null) return prompt('sbt-readiness', true,
    'Ask whether she has earned a trial — and do not wait for an index to say so.',
    'Day four for a pneumonia that is improving. She is awake, follows commands and is initiating her own breaths; SpO2 95% on 0.35 with a PEEP of 5; heart rate 94, MAP 73, and nobody is climbing the vasopressor; cough moderate, secretions manageable. That is the standardized panel, and it is enough. No rapid shallow breathing index has been calculated and none is required to offer a trial — the habit of gatekeeping behind a ratio delays extubation more often than it prevents one. Reviewing readiness is its own step because the alternative is starting a trial on a patient who was never a candidate, which teaches you nothing except that she failed.');
  if (patient.startedAtTick === null) return prompt('sbt-start', true,
    'Run a bounded, standardized trial, not an experiment you improvise.',
    'Thirty minutes, pressure support 5, FiO2 left where it is at 0.35, and someone watching her rather than the numbers. Two things are deliberate. The FiO2 does not go up for the trial — raising it hides exactly the oxygenation change you are testing for. And the method is local: trials are run with or without pressure support and the evidence does not crown one, so this records an intent under a local protocol rather than programming a ventilator or prescribing a universal recipe. Bounded means the endpoint exists before you start, so the decision to stop is not made by whoever gets nervous first.');
  if (patient.failureAtTick === null) return prompt('sbt-failure', true,
    'Read the pattern converging, not one number crossing a line.',
    'At thirty minutes: rate 36, tidal volumes down to 220, accessory muscles working, diaphoretic, visibly distressed, saturation 88%, heart rate 124, MAP 68. Take those one at a time and each has an excuse — a rate of 36 alone might be anxiety, an 88% might be a probe. Together they are one story: the work, the breathing pattern, the oxygenation, the circulation, her comfort and the direction of travel all moving the same way. That convergence is what makes this failure, and it is why no single threshold is the answer. She looks like someone who cannot keep this up, and that observation is the finding.');
  if (patient.recoveryAtTick === null) return prompt('sbt-recovery', true,
    'Stop it and put her back. Letting it run is not perseverance.',
    'Prior support restored, and ten minutes later: rate 20, tidal volume 420, accessory use and distress gone, 95% on 0.35, heart rate 101, MAP 72. She recovers, which is what a stopped trial is supposed to do and is a reason to stop early rather than late — a failing trial pushed further buys fatigue, and fatigue makes the next trial worse. Nothing is programmed here and none of this predicts anything; it is an authored recovery panel that says the failure was tolerated.');
  return prompt('sbt-plan', true,
    'Now the part that matters: what made her fail, and what a good trial would not have proved.',
    'The failure is a list, not a verdict — respiratory load, weakness, fluid and cardiac load, pain, anxiety, sedation, nutrition, electrolytes, sleep, secretions. Each of those is something a team can work on before another standardized daily assessment, and the point of naming them is that a trial repeated tomorrow with nothing changed is likely to go the same way. The other half is the error at the opposite end: extubation is not recorded here, and it would not have been even if she had passed. Tolerating a trial says the breathing works; it says nothing about airway protection, secretion clearance, her neurology, her risk of failure after the tube comes out, goals of care, or what support she would need afterwards. Nothing here examines, calculates, programs a ventilator, dose or drug, extubates, determines disposition, or predicts outcome.');
}
