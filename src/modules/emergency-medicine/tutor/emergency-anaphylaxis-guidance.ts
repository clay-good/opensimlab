import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EmergencyAnaphylaxisProgress } from '../emergency-anaphylaxis';

export const EMERGENCY_ANAPHYLAXIS_TUTOR_VERSION = '0.1.0';

export interface EmergencyAnaphylaxisPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is preparation. Oxygen and a line feel like what
 * you do before you give a drug, and in anaphylaxis they are the two things
 * most likely to be doing while the one intervention that changes the outcome
 * has not happened yet. The engine gates the intramuscular epinephrine ahead of
 * both adjuncts for exactly that reason.
 *
 * The adjunct claim lives in the beat for the state where neither adjunct has
 * been recorded, because that is the only one of those beats every path passes
 * through.
 *
 * It is silent on the unassisted setting, silent once the reassessment is
 * recorded, and silent for any scenario version it was not written against.
 */
export function emergencyAnaphylaxisInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: EmergencyAnaphylaxisProgress },
): EmergencyAnaphylaxisPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.reassessedAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.patternReviewedAtTick === null) return prompt('ana-pattern', true,
    'Count the systems, and notice what is missing from the list.',
    'Lip and tongue swelling, widespread wheeze, hypoxaemia, hypotension and impaired perfusion, minutes after a plausible peanut exposure. That is airway, breathing and circulation together, and it is already enough. What is absent is the skin: no urticaria, no flush. The reflex is to wait for hives before using the word, and skin findings are missing in a substantial minority of anaphylaxis — more often in the severe presentations, which is exactly the wrong way round for a rule that says wait. This review records what has been observed; it does not make the simulator a diagnostic test, and nothing here proves the diagnosis.');

  if (patient.positionedAndHelpedAtTick === null) return prompt('ana-position', true,
    'Lay him flat and get people moving. Positioning is treatment here, not tidying.',
    'Recumbent with legs raised if he tolerates it, sitting only if breathing demands it, and never standing or walking. This is not comfort: in distributive shock the circulation is depending on whatever venous return it still has, and standing a hypotensive anaphylaxis patient up has caused arrest in the act of sitting or standing them. That is why it is its own recorded step and why it sits ahead of the drug. Emergency help, continuous monitoring, and removing further exposure go with it. Physical positioning, staffing, communication and trigger verification are not simulated.');

  if (patient.imEpinephrineAtTick === null) return prompt('ana-epinephrine', true,
    'Now the drug, before the oxygen and before the line. This is the lesson.',
    'Epinephrine 500 micrograms intramuscularly in the anterolateral thigh — the fixed adult first-line action. The engine will refuse oxygen and fluid until this is recorded, and that refusal is the whole point: oxygen and vascular access feel like preparation, so they get done first, and the interval they add is the interval most consistently found in the fatal cases. Intramuscular into the thigh rather than the deltoid because absorption is faster and more predictable there, and intramuscular rather than intravenous because an intravenous bolus of this drug is where the arrhythmias and the dosing errors come from — the control does not offer it. Preparation, injection technique, absorption, repeat-dose timing and individual response are not simulated.');

  const unsupported = patient.oxygenAtTick === null && patient.crystalloidAtTick === null;
  if (unsupported) return prompt('ana-adjuncts', true,
    'Both adjuncts are open at once now, and the fluid is not an afterthought.',
    'Oxygen and crystalloid are unordered against each other: neither waits on the other. What is worth knowing is that the bolus here is not topping anything up. In anaphylaxis the vasculature both dilates and leaks, and a large fraction of the circulating volume can move into the tissues within minutes — so 1,500 mL of isotonic crystalloid is treating an acute hypovolaemia that arrived in the time it took to walk into the department. The other half of that: neither adjunct is a substitute for a second dose of epinephrine if he does not improve, and this vignette does not offer one. Access, delivery rate, individualised volume, mask fit, airway procedures, and fluid complications are outside it.');

  if (patient.oxygenAtTick === null) return prompt('ana-oxygen', true,
    'Oxygen is still unrecorded — high flow, and no ceiling on this one.',
    'High-flow oxygen by non-rebreather mask. This is one of the few places where the answer really is to open it up: bronchospasm and shock together mean the demand is high and the supply is uncertain, and there is no chronic carbon-dioxide question in this vignette to argue for a ceiling. It buys time; it does not treat the mechanism. Mask fit, flow, delivered concentration and any airway procedure are not simulated, and the airway that is currently swelling is not something this screen can manage.');

  if (patient.crystalloidAtTick === null) return prompt('ana-crystalloid', true,
    'Start the fixed bolus. The volume left the circulation, it did not evaporate.',
    'A fixed 1,500 mL isotonic crystalloid bolus for the hypotension and the impaired perfusion. Anaphylactic shock is distributive and leaky at the same time, so a substantial share of the intravascular volume is now in the interstitium — the bolus is replacing something that has genuinely gone rather than padding a number. It also does not replace a repeat dose of epinephrine, which is the thing to be reaching for if the pressure does not move. Access, delivery rate, individualised volume, and fluid complications are not simulated.');

  return prompt('ana-reassess', true,
    'Let a moment pass, then re-read airway, breathing, circulation and how awake he is.',
    'The same sequence, again, because the question after a first dose is not whether you did the right things but whether they worked — and in anaphylaxis the honest answer often is "not yet, give it again". The reassessment is gated behind a further engine tick because there is nothing new to see at the instant an action is recorded. What the bounded monitor shows next is authored rather than modelled, so read the improvement as a prompt to keep looking rather than as proof: a biphasic reaction hours later, an airway that keeps swelling, and the need for a repeat dose are all real and none of them is in this vignette. Repeat-dose timing, refractory treatment, observation, referral and outcome remain outside it.');
}
