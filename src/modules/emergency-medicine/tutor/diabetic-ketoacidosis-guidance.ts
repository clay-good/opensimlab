import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { DiabeticKetoacidosisProgress } from '../diabetic-ketoacidosis';

export const DIABETIC_KETOACIDOSIS_TUTOR_VERSION = '0.1.0';

export interface DiabeticKetoacidosisPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is the word that follows DKA. Insulin is the
 * treatment, and in this patient it is the treatment that has to wait: a
 * potassium of 3.2 mmol/L is already low before the drug that moves potassium
 * into cells has been given. The engine refuses the insulin intent until
 * replacement is recorded, and the second half of the lesson is the mirror
 * image — the glucose comes down long before the ketoacidosis clears, so the
 * moment the number looks reassuring is the moment insulin must not stop.
 *
 * It is silent on the unassisted setting, silent once the transition is
 * recorded, and silent for any scenario version it was not written against.
 */
export function diabeticKetoacidosisInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: DiabeticKetoacidosisProgress },
): DiabeticKetoacidosisPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.transitionAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.presentationReviewedAtTick === null) return prompt('dka-presentation', true,
    'Three numbers name this, and a fourth decides what you can do about it.',
    'Glucose 486 mg/dL, β-hydroxybutyrate 5.4 mmol/L, venous pH 7.16 with a bicarbonate of 11 — hyperglycaemia, ketones and acidosis together, which is what the diagnosis actually requires rather than a high glucose on its own. She is alert, dry, and breathing deeply, which is compensation rather than distress. The fourth number is the potassium at 3.2 mmol/L, and it is the one that will shape the next few minutes. There is also a cause on the table: a kinked insulin-pump infusion set, authored, with no infection and no mixed hyperosmolar state. A precipitant you can name is a recurrence you can prevent. This screen performs no examination and draws no specimens; the panel is given.');

  if (patient.fluidsAtTick === null) return prompt('dka-fluids', true,
    'Fluid and the monitoring schedule first — before either drug.',
    'Isotonic crystalloid, cardiac and vital-sign monitoring, access, urine output, hourly glucose, and four-hourly electrolytes, creatinine, β-hydroxybutyrate and venous pH. Volume comes first because much of what looks like a glucose problem is a water problem: rehydration alone lowers glucose by dilution and by restoring the renal clearance of it, and it fills a circulation that osmotic diuresis has been emptying for eighteen hours. The monitoring schedule is part of the same step rather than an afterthought, because everything downstream is a comparison between panels. Fluid selection, volume, rate, physical delivery and specimens are not simulated.');

  if (patient.potassiumAtTick === null) return prompt('dka-potassium', true,
    'Potassium is 3.2. Replace it and recheck before insulin — this is the lesson.',
    'Total-body potassium in DKA is depleted no matter what the serum says, because acidosis and insulin deficiency have been pushing it out of cells and the kidneys have been losing it. A serum potassium that is already low means the deficit is severe. Insulin is the drug that drives potassium back into cells, so giving it here does not risk hypokalaemia, it produces it — with arrhythmia and respiratory-muscle weakness at the end of that. The engine will refuse the insulin intent until replacement is recorded and the authored repeat comes back at 3.7. That refusal is the teaching: the treatment for the diagnosis is not always the first thing you may do about the patient. Product, dose, concentration, access, rate, delivery and individual kinetics are not simulated.');

  if (patient.insulinAtTick === null) return prompt('dka-insulin', true,
    'The gate is open at 3.7. Record the insulin intent now.',
    'A local-protocol short-acting intravenous insulin infusion intent. Intravenous and infused rather than bolused, because what closes the anion gap is a steady low rate suppressing ketogenesis rather than a large dose chasing the glucose — and a bolus buys a faster glucose fall and a larger potassium shift, which is the trade nobody wants in the patient you just corrected. This records an intent, not a pump: dose selection, preparation, programming, delivery, the rate of glucose fall, ketone clearance and the potassium shift are all outside the vignette.');

  if (patient.dextroseAtTick === null) return prompt('dka-dextrose', true,
    'Glucose 238 and the acidosis is still there. Add dextrose, do not stop insulin.',
    'The interval panel: glucose 238 mg/dL, β-hydroxybutyrate 2.2, venous pH 7.24, bicarbonate 15, potassium 4.1. Read it as two separate stories that are moving at different speeds. The glucose is nearly reasonable; the ketoacidosis is only half-treated. Insulin is what is clearing the ketones, so it has to keep running — and the way to keep it running without making her hypoglycaemic is to give it something to work on, which is what the dextrose is for. Stopping insulin because the glucose looks better is the commonest way this goes wrong after the potassium: the number that was frightening improves first, and the process that is actually dangerous is still going. Fluid concentration, insulin rate, delivery and kinetics are not simulated.');

  return prompt('dka-transition', true,
    'Prove it is over with the right two numbers, then close the loop on the cause.',
    'Resolution panel: β-hydroxybutyrate 0.4 mmol/L with venous pH 7.32 and bicarbonate 19. Those are the criteria — a plasma ketone below 0.6 together with a pH of at least 7.3 or a bicarbonate of at least 18. Not the anion gap, which can stay open on hyperchloraemia from all the saline she has had, and not urine ketones, which lag by hours and measure the wrong ketone. Then the part that decides whether she is back next week: the subcutaneous insulin has to overlap the infusion before it stops, because the infusion has no reservoir behind it and a gap of an hour is a return to ketogenesis. And the kinked infusion set gets replaced, with sick-day rules, supply access and follow-up. Dosing, delivery, device testing, disposition, recurrence and outcome are not simulated.');
}
