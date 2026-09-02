import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { ChronicOpioidHypoventilationProgress } from '../chronic-opioid-related-hypoventilation-reassessment';

export const CHRONIC_OPIOID_HYPOVENTILATION_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a diagnosis that would be easy and unfair to
 * make.
 *
 * Eight years of prescribed opioids and a sleep study showing hypoventilation
 * is a story that writes itself, and this lesson refuses to let it. Chronic
 * opioid exposure is a contributor here rather than a proven cause: her BMI is
 * 23.7, her spirometry is clean, there is no focal weakness — and obesity,
 * upper-airway obstruction, central sleep apnea, lung, neuromuscular,
 * chest-wall, cardiac and endocrine causes and medication interactions are all
 * still open, including the nighttime gabapentin. Nothing in this lesson gets
 * to change her analgesia. None of these prompts examines her, acquires,
 * scores or interprets a gas or sleep study, selects a dose, a taper or
 * naloxone, or chooses a support device.
 */
export function chronicOpioidHypoventilationInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly chronicOpioidHypoventilation?: ChronicOpioidHypoventilationProgress;
}) {
  const patient = input.chronicOpioidHypoventilation;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('opioid-hypo-trajectory', true,
    'Read eight years of stable therapy against six months of new symptoms.',
    'Prescribed opioids for chronic noncancer pain for eight years, with no recent dose escalation, no illicit exposure, no postoperative recovery and no acute intoxication. What is new is six months old: her partner has noticed shallow irregular breathing in sleep, and she has morning headaches, unrefreshing sleep and increasing daytime sleepiness. She is comfortable in clinic at 94% on room air, breathing ten times a minute. This is not an overdose and it is not an emergency — it is a chronic pattern that has been developing while everyone watched the dose stay the same.');
  if (patient.evidenceAtTick === null) return prompt('opioid-hypo-evidence', true,
    'Let the sleep study say what the daytime numbers cannot.',
    'Her awake gas is essentially normal — pH 7.39, PaCO₂ 44, bicarbonate 26 — and one awake saturation of 94% says nothing about the eight hours nobody was watching. The attended study with transcutaneous CO₂ is where the finding lives: a rise from 46 awake to 58 during sleep, sustained for twenty-four minutes, with desaturation and separately reported central and obstructive events. The sleep specialist calls it a sleep-related hypoventilation pattern requiring integrated review, which is a description rather than a diagnosis.');
  if (patient.alternativesAtTick === null) return prompt('opioid-hypo-alternatives', true,
    'Refuse the obvious cause, and notice what the negatives do not cover.',
    'Chronic opioid exposure is a contributor, not a proven cause. Her BMI is 23.7 and the spirometry shows no obstruction and the examination no focal weakness — but those findings do not exclude upper-airway obstruction, central sleep apnea, chest-wall or neuromuscular disease, cardiac or endocrine causes, or medication interactions. The nighttime gabapentin is in that last category and is easy to overlook because it is not the opioid, and alcohol, nonprescribed substances and other sedatives still need a patient-centered conversation rather than an assumption.');
  if (patient.coordinatedPlanAtTick === null) return prompt('opioid-hypo-plan', true,
    'Name every owner, and do not let this clinic change her analgesia.',
    'Prescriber, sleep, respiratory, pharmacy and primary care, around her pain goals as well as her breathing. Both failure modes here are real: leaving a hypoventilating patient on unchanged therapy because nobody owns the question, and stopping or tapering eight years of analgesia in a single visit on the strength of a pattern that has not been attributed yet. The education, the diagnostic work still outstanding and the reassessment interval are part of the plan rather than things that follow it.');
  return prompt('opioid-hypo-handoff', true,
    'Hand off a pattern that has been described and not attributed.',
    'Nothing here establishes causality, a diagnosis, a medication change, a device or an outcome. What travels is the eight-year exposure and the six-month change, the awake and sleep evidence and the gap between them, the contributors that stay open including the ones that are not the opioid, the safety concerns, the work still to be done, and the name against each part of it.');
}
