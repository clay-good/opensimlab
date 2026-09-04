import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { SepticShockProgress } from '../septic-shock';

export const SEPTIC_SHOCK_TUTOR_VERSION = '0.1.0';

export interface SepticShockPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is the bundle as a queue. Sepsis care is taught
 * as a list, and a list gets worked through in order — so the one step the
 * engine deliberately leaves unordered, source control, ends up last or not at
 * all. Antibiotics treat the bacteria that are already loose; only drainage
 * stops more arriving.
 *
 * It is silent on the unassisted setting, silent once source control is
 * escalated, and silent for any scenario version it was not written against.
 */
export function septicShockInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: SepticShockProgress },
): SepticShockPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.sourceControlEscalationAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.infectionAndOrganDysfunctionReviewedAtTick === null) return prompt('sepsis-review', true,
    'Two halves of one sentence: where the infection is, and what it has already broken.',
    'Fever, rigors, dysuria and right-flank tenderness say urinary tract and say which side. New inattention, a capillary refill of five seconds, oliguria and hypotension say the infection has stopped being local. Sepsis is that conjunction rather than either half — a febrile patient with dysuria is a urinary infection, and the same patient not attending to you is a different problem with a different clock. The flank tenderness is worth holding on to: it is the first hint that this is an obstructed system rather than a simple one, and obstruction is the part antibiotics cannot fix. This supports immediate evaluation and treatment; it is not a diagnostic test and nothing here diagnoses a cause.');

  if (patient.culturesAndLactateAtTick === null) return prompt('sepsis-cultures', true,
    'Cultures before antibiotics — and note the word before, not instead.',
    'Blood cultures and a venous lactate, recorded without waiting for either result. Before matters because a single dose of antimicrobial can sterilise a bottle within minutes and cost you the organism and its sensitivities for the rest of the admission. The engine gates the antimicrobial behind this for exactly that reason, and the refusal it prints if you skip it says the rest: record cultures first, without delaying immediate antimicrobial intent. Those two instructions only conflict if drawing cultures is slow. The lactate comes back at 5.2, which is the number that turns a worrying blood pressure into a quantified one. Sampling, contamination, assay behaviour and culture results are not simulated.');

  if (patient.antimicrobialIntentAtTick === null) return prompt('sepsis-antimicrobial', true,
    'Now the antimicrobial, inside the hour, empirically.',
    'Empiric because the culture will take a day or more and the patient has minutes-to-hours; the whole point of drawing first was to keep the option of narrowing later rather than to delay starting now. The authored window is one hour, and it is worth knowing what that number is and is not: in shock the association between delay and death is strong enough to treat as causal, which is why this is an intent recorded against a clock. No agent, dose, allergy reconciliation, local resistance pattern, delivery or effect is simulated here.');

  if (patient.initialCrystalloidAtTick === null) return prompt('sepsis-fluid', true,
    'Start the fixed 30 mL/kg course — and know how little of it stays.',
    'Two thousand one hundred millilitres of balanced crystalloid for this seventy-kilogram patient. The shared teaching model retains a quarter of it intravascularly, and that fraction is the honest reason frequent reassessment is not a formality: three-quarters of what you give is going somewhere that does not raise a blood pressure, and in leaky sepsis it is going into lung and gut. So this is a defined course with a defined end rather than a tap left running, and the next step is looking rather than pouring.');

  if (patient.postFluidReassessmentAtTick === null) return prompt('sepsis-reassess', true,
    'Let a tick pass, then look. The panel is going to be disappointing.',
    'Hypotension, delayed capillary refill, inattention and oliguria all persist after the declared course, and the repeat lactate is not back yet. The engine says the important thing in one line: ongoing fluid is not an automatic next step. This is the moment the bundle stops being a list — a patient still shocked after an adequate initial course is telling you the problem is vascular tone rather than volume, and more litres buy oedema instead of pressure. The reassessment is gated behind a further tick because a perfusion asked about at the instant the bag is hung reports the clock rather than the patient.');

  if (patient.norepinephrineIntentAtTick === null) return prompt('sepsis-norepinephrine', true,
    'Norepinephrine now, toward a mean of 65 — and do not let it queue in front of the source.',
    'First-line vasopressor intent, aimed at an initial mean arterial pressure of 65 rather than at normality, because the target is the lowest pressure that perfuses rather than the nicest number on the monitor. Start it while you are still resuscitating rather than after: waiting for a vasopressor to be a last resort is how a patient spends an extra hour underperfused. And the thing to notice about this screen is what it does not force — the engine gates this behind the fluid reassessment, but it does not gate source control behind anything except the first review. No concentration, route, pump setup, titration or patient-specific dose is provided.');

  return prompt('sepsis-source', true,
    'Escalate the obstructed source. This is the step a list gets to last and a patient needs first.',
    'Urgent evaluation of the suspected obstructed urinary tract, senior help and critical-care escalation. The engine has been letting you record this since the first review — it never waits for the fluid or the pressor — and that permission is the lesson, because an obstructed infected system is the one part of this that antimicrobials genuinely cannot treat. Pus under pressure keeps seeding a bloodstream you are busy supporting, and the patient stays septic on perfect antibiotics until somebody drains it. Recording it early costs nothing and starts other people moving. Imaging, drainage, consultation, disposition and outcome are not simulated.');
}
