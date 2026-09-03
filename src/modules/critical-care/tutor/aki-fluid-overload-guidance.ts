import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { AkiFluidOverloadProgress } from '../aki-fluid-overload';

export const AKI_FLUID_OVERLOAD_TUTOR_VERSION = '0.1.0';

export interface AkiFluidOverloadPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is arguing about dialysis. Nine kilograms of
 * water is a dramatic problem with a famous solution, and the step before it —
 * stopping the intake that is still running — is free, is nobody's job, and is
 * where most of that fluid came from. The second reflex is the trigger: a
 * creatinine, a urine output or a fluid percentage that decides for you, when
 * the engine records explicitly that no single value is an automatic one.
 *
 * It is silent on the unassisted setting, silent once the trajectory is
 * reassessed, and silent for any scenario version it was not written against.
 */
export function akiFluidOverloadInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: AkiFluidOverloadProgress },
): AkiFluidOverloadPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.reassessmentAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.recognitionAtTick === null) return prompt('aki-recognize', true,
    'Nine kilograms of water is a finding. Say it out loud and get help.',
    'ICU day three after septic shock: creatinine 3.4 from a baseline of 1.0, urine 0.15 mL/kg/h across twelve hours, cumulative balance plus 8.2 litres, weight 82 kg from 73. She is 91% on 0.50 with imaging showing more oedema, and an adequate diuretic challenge produced 40 mL in six hours. The weight is the honest number there — it is the same fluid the balance chart claims, measured a way that does not depend on anyone remembering to write down a flush. What makes this urgent is the direction: intake still exceeds output, so tomorrow is worse than today by default. Critical care, nephrology, nursing, respiratory therapy and pharmacy now — and note what the record refuses to do, which is let any single creatinine, urea, urine output or fluid percentage be an automatic trigger for anything.');
  if (patient.contextAtTick === null) return prompt('aki-context', true,
    'Ask why the kidney is failing before you plan around the fact that it has.',
    'The whole panel: urine, balance, weight, respiratory support, perfusion, potassium and the ECG, acid-base, urea, uraemic complications — then the causes people stop looking for once "septic AKI" is written down. Obstruction, because a bladder scan is cheap and an obstructed kidney is a fixable one. Toxins and contrast. Whether the infection is actually being treated. Her medications. Her haemodynamics, because a kidney under a MAP of 72 on vasopressors may be underperfused rather than injured. Her abdominal pressure, since 8.2 litres of oedema raises it and a raised abdominal pressure is itself a cause of oliguria — the fluid becomes its own reason for the fluid. What this step concludes is narrow and useful: demand exceeds the kidney\'s reported capacity. It does not conclude urgency, reversibility, recovery or a prescription.');
  if (patient.fluidPlanAtTick === null) return prompt('aki-fluid', true,
    'Before you decide how to remove it: stop putting it in.',
    'This is the step everybody skips on the way to the dialysis conversation, and it is free. The 8.2 litres arrived one reasonable decision at a time — carriers, diluents, flushes, antimicrobials in 250 mL, nutrition, maintenance nobody cancelled. So nonessential fluid and sodium stop, and every infusion, antimicrobial, medication and nutrition input gets reconciled against what is actually necessary, while perfusion and real treatment are preserved. Restriction is not the same as under-resuscitation. Then the diuretic: an adequate challenge gave 40 mL, and that is information — it says this kidney will not solve this by being pushed harder. Recording it is what stops the blind escalation, the fourth larger dose given because the third did nothing. Nothing is counted, restricted, changed or delivered on this screen.');
  if (patient.supportAtTick === null) return prompt('aki-support', true,
    'Now kidney support — as a planning decision with almost everything left open.',
    'Refractory fluid demand is the indication here, and the one thing that stays unambiguous is that a life-threatening fluid, electrolyte or acid-base disturbance justifies urgent initiation regardless of any of the rest. Everything else is genuinely undecided and is named that way: haemodynamics, access, modality, dose, anticoagulation, solute and medication clearance, net removal rate, her goals and preferences, what your unit actually has, and the response you will look for. Accelerated initiation is not treated as universally beneficial — the trials that asked whether starting earlier helps did not find that it does, so "she looks bad, start now" is a position rather than a rule. No setup, circuit or therapy happens here.');
  return prompt('aki-reassess', true,
    'Minus 1.1 litres in six hours. Read what that is, and what is still true.',
    'Net balance −1.1 L, saturation 95% on an unchanged 0.50, heart rate 96, MAP 74, potassium 5.1, pH 7.31, temperature 37.3. The oxygenation improving on the same FiO2 is the meaningful part — the lung is carrying less water. And the oliguria persists, which is the sentence to sit with: the fluid is coming off because it is being removed, not because the kidney started working. Nothing here says how much more can come off, whether she tolerates it haemodynamically, how the solute or her drug dosing behaves, how long this runs, whether the kidney recovers, or how she does. Nothing on this screen counts, restricts, doses, delivers, cannulates, starts a circuit, diagnoses, determines disposition, or predicts outcome.');
}
