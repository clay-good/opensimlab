import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsSerotonin, type SerotoninAction, type SerotoninProgress,
} from '../serotonin-toxicity-hyperthermia-clonus';

export const SEROTONIN_DEMONSTRATION_VERSION = '0.1.0';

export function supportsSerotoninDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsSerotonin(scenario);
}

export interface SerotoninDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: SerotoninAction; readonly finished?: boolean;
}

/**
 * The worked example for a hyperthermia the muscle is making.
 *
 * The new drug is an antibiotic, which is why nobody reads it as the second
 * serotonergic agent, and the clonus is not only the diagnostic finding — it is
 * the furnace. So this example names the interaction, gives cooling and
 * sedation an owner before the antagonist gets a thought, reads the CK and the
 * lactate as muscle work rather than numbers, and ends on a clonus that is
 * still inducible at a lower temperature. Rescue eligibility stays
 * specialist-led rather than a decision, and the example selects no cooling
 * method, fluid, sedative, restraint, antagonist, neuromuscular blocker,
 * product, dose, or route.
 */
export function serotoninDemonstrationStep(
  patient?: SerotoninProgress,
): SerotoninDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on cooler and calmer with the clonus still inducible. Nothing was proven and nothing was excluded — not the cause, not her kidneys, not the hours of drug still to come. This ends the example, not the toxicity.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-toxicology-serotonin-agents-clock-mental-autonomic-neuromuscular-temperature-and-whole-patient',
      narration: 'Say the interaction out loud, because the second serotonergic drug is an antibiotic. Linezolid is a monoamine oxidase inhibitor, and this is six hours after her first dose on top of stable sertraline. On top of that history: agitation and confusion, diaphoresis, diarrhea and hyperactive bowel sounds, tremor, ocular and inducible ankle clonus, lower-limb hyperreflexia and rising leg tone — at 40.1°C with a heart rate of 128.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'actions', progress: 0.24, action: 'recognize-toxicology-serotonin-coupled-pattern-without-hunter-clonus-temperature-or-medication-list-only-closure',
      narration: 'Name all three parts together and refuse the four ways this gets closed early. Mental state, autonomic activity and neuromuscular findings are one pattern, and no Hunter rule, clonus finding, temperature, pulse or medication list diagnoses or grades her alone. The lower-limb predominance and the wet, loud, hurrying gut are the discriminators worth having — they are the opposite of the dry, quiet belly on the anticholinergic bedside next door — and they exclude nothing on their own, with neuroleptic malignant syndrome, infection, withdrawal, environmental exposure and coingestion all still open.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.4, action: 'activate-toxicology-serotonin-resuscitation-cooling-airway-toxicology-monitoring-and-compassionate-safety-ownership',
      narration: 'Give the cooling and the sedation an owner before giving the antagonist a thought. In this syndrome the muscle is the furnace: clonus, hyperreflexia and rising tone are producing the heat, so cooling and sedation are what lowers the temperature, and they start together with airway, monitoring, renal, the poison center and compassionate safety ownership. Reaching for the rescue drug first treats the name of the syndrome instead of the patient.' };
  }
  if (patient.evidenceAtTick === null) {
    return { id: 'evidence', focus: 'monitor', progress: 0.56, action: 'review-toxicology-serotonin-supplied-cns-autonomic-neuromuscular-temperature-ecg-renal-ck-and-differential-boundary',
      narration: 'Read the chemistry as muscle work and keep the antagonist an adjunct question. CK 640 with lactate 3.8 and bicarbonate 19 is what the working muscle is putting into the blood, and a creatinine of 1.0 today says nothing about tomorrow. A QRS of 88 ms is not reassurance about what else she took. Serotonin-antagonist rescue is specialist-led, sits alongside cooling and sedation rather than in place of them, and this example does not determine her eligibility for it.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'report', focus: 'monitor', progress: 0.76, action: 'record-toxicology-serotonin-bounded-qualified-source-cessation-cooling-support-sedation-seizure-surveillance-airway-and-antagonist-intent-with-strict-later-review',
      narration: 'Record the implicated-agent cessation, the rapid cooling and support, the sedation and seizure care if needed, the temperature, renal and CK surveillance, the airway preparedness, and the specialist-led rescue question as intents. Let the authored interval pass and read the qualified team’s 30-minute report. The interval is a contrast rather than a required wait, and nothing here says how fast any individual temperature comes down.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-toxicology-serotonin-rebound-hyperthermia-clonus-rigidity-seizure-rhabdomyolysis-coingestion-airway-and-active-risk',
    narration: '38.7°C, heart rate 104, calmer — and the clonus and hyperreflexia are still inducible. That persistence is the part worth saying out loud: the drugs outlast the half hour, so hand off rebound hyperthermia, rising tone, seizure, the CK and her kidneys, coingestion, exposure completeness and the airway as live. Nothing here proves the cooling did it or that she is on the way out of it.' };
}
