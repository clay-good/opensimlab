import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { SerotoninProgress } from '../serotonin-toxicity-hyperthermia-clonus';

export const SEROTONIN_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a hyperthermia the muscle is making.
 *
 * Two things are usually missed here. The first is that the new drug is an
 * antibiotic, so nobody reads it as the second serotonergic agent — linezolid
 * is a monoamine oxidase inhibitor, and the interaction is the history. The
 * second is that clonus, hyperreflexia and rising tone are not just the
 * diagnostic finding; they are the thing generating the heat, which is why
 * cooling and sedation are the treatment and the antagonist is an adjunct
 * question rather than a substitute for either. So the prompts name the
 * interaction, refuse the four ways this pattern is usually closed early, put
 * cooling and sedation ahead of the rescue conversation, and end on a clonus
 * that is still inducible at a lower temperature. None of them selects a
 * cooling method, fluid, sedative, restraint, antagonist, neuromuscular
 * blocker, product, dose, or route.
 */
export function serotoninInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly serotonin?: SerotoninProgress;
}) {
  const patient = input.serotonin;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('serotonin-trajectory', true,
    'Say the interaction out loud, because the second serotonergic drug is an antibiotic.',
    'Linezolid is a monoamine oxidase inhibitor, and this is six hours after her first dose on top of stable sertraline. That is the history. On top of it: agitation and confusion, diaphoresis, diarrhea and hyperactive bowel sounds, tremor, ocular and inducible ankle clonus, lower-limb hyperreflexia and rising leg tone — at 40.1°C with a heart rate of 128.');
  if (patient.recognitionAtTick === null) return prompt('serotonin-recognize', true,
    'Name all three parts together, and refuse the four ways this gets closed early.',
    'Mental state, autonomic activity and neuromuscular findings are one pattern, and no Hunter rule, clonus finding, temperature, pulse or medication list diagnoses or grades her alone. The lower-limb predominance and the wet, loud, hurrying gut are the discriminators worth having — they are the opposite of the dry, quiet belly on the anticholinergic bedside next door — and they exclude nothing on their own, with neuroleptic malignant syndrome, infection, withdrawal, environmental exposure and coingestion all still open.');
  if (patient.supportAtTick === null) return prompt('serotonin-support', true,
    'Give the cooling and the sedation an owner before you give the antagonist a thought.',
    'In this syndrome the muscle is the furnace: clonus, hyperreflexia and rising tone are producing the heat, so cooling and sedation are what lowers the temperature, and they start together with airway, monitoring, renal, the poison center and compassionate safety ownership. Reaching for the rescue drug first treats the name of the syndrome instead of the patient.');
  if (patient.evidenceAtTick === null) return prompt('serotonin-evidence', true,
    'Read the chemistry as muscle work, and keep the antagonist an adjunct question.',
    'CK 640 with lactate 3.8 and bicarbonate 19 is what the working muscle is putting into the blood, and a creatinine of 1.0 today says nothing about tomorrow. A QRS of 88 ms is not reassurance about what else she took. Serotonin-antagonist rescue is specialist-led, sits alongside cooling and sedation rather than in place of them, and this lesson does not determine her eligibility for it.');
  if (patient.reassessmentAtTick === null) return prompt('serotonin-observe', false,
    'Record the intents as intents, let the interval pass, and read the 30-minute report.',
    'The interval is a contrast rather than a required wait or a predicted response time. Nothing here says how fast any individual temperature comes down.');
  return prompt('serotonin-handoff', true,
    'Hand off the number that improved and the finding that did not.',
    '38.7°C, heart rate 104, calmer — and the clonus and hyperreflexia are still inducible. That persistence is the part worth saying out loud: the drugs outlast the half hour, so rebound hyperthermia, rising tone, seizure, the CK and her kidneys, coingestion, exposure completeness and the airway all travel with her. Nothing here proves the cooling did it or that she is on the way out of it.');
}
