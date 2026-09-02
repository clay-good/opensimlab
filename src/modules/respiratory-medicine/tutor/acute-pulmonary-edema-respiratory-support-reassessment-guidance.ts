import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { ApeSupportProgress } from '../acute-pulmonary-edema-respiratory-support-reassessment';

export const APE_SUPPORT_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a patient failing on treatment that worked.
 *
 * Everything the experienced team did was right, and her pressure came down
 * from 196/118 to 108/68. What has happened underneath that is the part this
 * lesson is about: a respiratory rate of 34 is now 12, she is drowsy and
 * speaking in single words, and the gas has gone to a pH of 7.18 with a PaCO₂
 * of 68. The falling rate is fatigue, not improvement — the same trap as the
 * asthma lab, arriving here through a treatment that is genuinely working on
 * the thing it was aimed at. None of these prompts examines her, acquires or
 * reads a gas or an image, touches the noninvasive support or its settings, or
 * selects a drug or an airway.
 */
export function apeSupportInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly apeSupport?: ApeSupportProgress;
}) {
  const patient = input.apeSupport;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('ape-trajectory', true,
    'Separate what the team did from where she has ended up.',
    'Thirty minutes ago: abrupt dyspnea, orthopnea, crackles, a raised JVP, 196/118 and a room-air saturation of 82%, with the reports supporting hypertensive acute pulmonary edema. The experienced team sat her up, started monitored noninvasive support with titrated oxygen, and gave a loop diuretic and a pressure-appropriate vasodilator. That is the right care, delivered by someone else, and her pressure has come down to 108/68. The question is what the rest of her has done since.');
  if (patient.failureAtTick === null) return prompt('ape-failure', true,
    'Name the failure from the mentation, the effort and the gas together.',
    'Drowsy but rousable, single words, shallow effort, a respiratory rate of 34 that is now 12, a saturation of 86% on an authored FiO₂ of 0.60, an end-tidal CO₂ of 60 on a continuous waveform, and a gas of pH 7.18, PaCO₂ 68, PaO₂ 58. The rate fell because she is tiring, not because she is better. That is progressive hypoxemic, hypercapnic, acidemic failure occurring during noninvasive support that is reportedly running — which is the specific situation the support does not fix.');
  if (patient.wholePatientAtTick === null) return prompt('ape-whole-patient', true,
    'Read the pressure and the congestion together, and keep the precipitants open.',
    'A pressure of 196/118 that is now 108/68 with warm perfusion and a two-second refill is a treated afterload rather than shock — nothing here establishes shock or arrest. The crackles and the bilateral edema findings persist, so the congestion has not resolved either. Ischemia, an arrhythmia, acute valve or other mechanical disease, infection, pulmonary embolism, the treatment effect itself, and renal and medication factors all stay open as precipitants, and none of the current reports permanently excludes a change.');
  if (patient.escalationAtTick === null) return prompt('ape-escalation', true,
    'Call respiratory, critical-care and airway-capable help now.',
    'This is escalation for a failure that has already been established rather than a request to help decide. Noninvasive support is reportedly running and she is deteriorating through it, which is the indication; the people who might have to take over her ventilation should be present rather than summoned once the decision is unavoidable.');
  return prompt('ape-handoff', true,
    'Hand off a deterioration that treatment did not stop.',
    'Nothing here establishes a device, a setting, a drug, a procedure, a disposition or an outcome. What travels is the trajectory through correct initial care, the failure as the mentation, effort, oxygenation, ventilation and acid-base evidence describe it, the pressure and congestion picture, the precipitants still open, and the airway-capable help that is now involved.');
}
