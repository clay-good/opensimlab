import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { SevereAcidemiaProgress } from '../severe-acidemia';

export const SEVERE_ACIDEMIA_TUTOR_VERSION = '0.1.0';

export interface SevereAcidemiaPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is treating the number. A pH of 7.09 asks to be
 * corrected, and correcting it is not a treatment — the acid is coming from
 * somewhere, and the two things that would actually move it are ventilation
 * that is currently inadequate and a source nobody has controlled. The second
 * reflex is bicarbonate, where the evidence is genuinely uncomfortable and the
 * lesson says so rather than picking a side.
 *
 * It is silent on the unassisted setting, silent once the trajectory is
 * reassessed, and silent for any scenario version it was not written against.
 */
export function severeAcidemiaInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: SevereAcidemiaProgress },
): SevereAcidemiaPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.reassessmentAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.recognitionAtTick === null) return prompt('sac-recognize', true,
    'Read this as a system in trouble rather than a bad pH, and get the whole team.',
    'A sixty-one-year-old intubated man with septic shock: 122, MAP 61 on reported vasoactive support, 95% on 0.40, temperature 38.4. The gas is pH 7.09, carbon dioxide 48, bicarbonate 14, lactate 8.1. His potassium is 5.7 without ECG change and his creatinine has gone from 1.2 to 3.0. Every one of those is a different organ telling you the same thing, and the combination is what makes this urgent rather than any single value — a pH that low is a cardiovascular risk in a patient already on vasopressors, the potassium is an arrhythmia risk that currently has no ECG signature, and the kidney is both a cause and a casualty. Critical care, respiratory therapy, nursing, pharmacy, nephrology and source control all get called now, because the work ahead needs more hands than a bedside has.');
  if (patient.analysisAtTick === null) return prompt('sac-analyze', true,
    'Do the compensation arithmetic. It is what turns a pH into a diagnosis.',
    'For a bicarbonate of 14 the expected PaCO2 is about 29, plus or minus 2. His is 48. That gap is the whole finding: he does not have a metabolic acidosis with a lung doing its best, he has a metabolic acidosis and a superimposed respiratory acidosis, and the second one is both more dangerous and more fixable in the next few minutes. Then the rest of the map — the corrected anion gap, which needs correcting because his albumin is 2.5 and an uncorrected gap would understate the acid; the lactate of 8.1; ketones; renal and gastrointestinal losses; the chloride; his medications; and the toxic-alcohol, salicylate, cyanide, carbon-monoxide and metformin contexts. A pH is a number, not a diagnosis, and this step is where it becomes one.');
  if (patient.ventilationAtTick === null) return prompt('sac-ventilate', true,
    'Fix the half you can fix in minutes — without forcing a normal pH.',
    'His minute ventilation is inadequate for his acid load, and restoring safe compensatory ventilation is the fastest thing available to you. The word "safe" is the constraint. The airway, the circuit, the plateau pressure, auto-PEEP risk and synchrony all get checked, because the way to make this worse is to chase a number with volume and rate until you are stacking breaths in a patient who cannot exhale — which is the auto-PEEP lesson arriving in a different disguise, and it drops the pressure of a man whose MAP is already 61. Normalization by force is not the goal: the goal is to stop the respiratory half from adding to the metabolic half while the actual cause is treated.');
  if (patient.causePlanAtTick === null) return prompt('sac-cause', true,
    'Treat the sepsis. And be honest about what the evidence says on bicarbonate.',
    'The shock and infection work is the definitive treatment and it continues alongside everything else — the acid is a symptom of a patient whose perfusion and source are not controlled. On bicarbonate the lesson does not pick a side, because the evidence does not: the 2026 sepsis guideline conditionally suggests it for septic shock with a pH at or below 7.2 and moderate-to-severe kidney injury, at very low certainty, and suggests against it purely to improve haemodynamics in hypoperfusion-induced lactic acidaemia. He is arguably in the first group. BICARICU-2 found no 90-day mortality benefit. So it is a live, individualized, team decision rather than a rule, and the same is true of kidney support — although a life-threatening acid-base disturbance keeps urgent kidney-support assessment on the table regardless. No dose, no agent, no target and no modality is selected here.');
  return prompt('sac-reassess', true,
    'Read every axis, and be careful what an improved pH is evidence of.',
    'The fixed response improves the pH and the perfusion. What it does not do is prove that the acid has been cleared, that the source is controlled, that the kidney is recovering, or anything at all about how he does. An improved pH in this patient is consistent with better ventilation alone, which would be a real improvement in the half that was never the underlying problem. So the gas, the perfusion, the ventilation, the potassium, the kidney and the cause all get read as separate trajectories. Nothing here examines him, acquires or interprets a gas, calculates, diagnoses, delivers fluid, a buffer, a vasopressor, an electrolyte or an antidote, doses, changes ventilator settings, starts kidney support, treats a source, determines disposition, or predicts outcome.');
}
