import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsAnticholinergic, type AnticholinergicAction, type AnticholinergicProgress,
} from '../anticholinergic-hyperthermia-delirium';

export const ANTICHOLINERGIC_DEMONSTRATION_VERSION = '0.1.0';

export function supportsAnticholinergicDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsAnticholinergic(scenario);
}

export interface AnticholinergicDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: AnticholinergicAction; readonly finished?: boolean;
}

/**
 * The worked example for a syndrome that is more interesting than it is urgent,
 * next to a temperature that is the reverse.
 *
 * Everything memorable at this bedside — the dilated pupils, the dry flushed
 * skin, the picking at the air, the palpable bladder — is a clue rather than
 * the emergency, and the emergency is 40.3°C. So this example says the
 * temperature first, gives cooling an owner before it gives the diagnosis any
 * more attention, and only then reads the ECG, the CK and the retention as
 * three separate risks. Physostigmine stays a toxicologist-led eligibility
 * question rather than a decision, and the example selects no cooling method,
 * fluid, sedative, restraint, catheter, product, dose, or route.
 */
export function anticholinergicDemonstrationStep(
  patient?: AnticholinergicProgress,
): AnticholinergicDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on cooler, calmer, still confused and still not passing urine. Nothing was proven and nothing was excluded — not the cause, not her kidneys, not the days her temperature could still take. This ends the example, not the poisoning.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-toxicology-anticholinergic-product-clock-delirium-temperature-dryness-retention-ecg-and-whole-patient',
      narration: 'Say the temperature first, then the things that are more interesting than it. Three hours after a benztropine ingestion: severe agitated delirium with picking behavior, dilated pupils, hot dry flushed skin, no sweating, reduced bowel sounds, a palpable bladder and no urine — and a core temperature of 40.3°C. The rest of that list identifies the syndrome; the temperature is the part doing harm while you read it.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'actions', progress: 0.24, action: 'recognize-toxicology-anticholinergic-central-and-peripheral-pattern-without-mnemonic-temperature-or-pupil-only-closure',
      narration: 'Name both halves of the pattern and refuse the four ways it gets closed early. Central delirium and peripheral dryness, retention and mydriasis are one syndrome, and no single mnemonic, temperature, pupil or dry surface diagnoses or grades her. The absent sweating is the discriminator worth having — it separates this from the sympathomimetic bedside next door — and it excludes nothing on its own, with infection, environmental exposure, endocrine causes and coingestion all still open.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.4, action: 'activate-toxicology-anticholinergic-resuscitation-cooling-airway-toxicology-monitoring-and-compassionate-safety-ownership',
      narration: 'Give the cooling an owner before giving the diagnosis any more attention. At 40.3°C the temperature is time-dependent in a way the workup is not, so rapid cooling, airway, monitoring, renal and bladder ownership, the poison center and compassionate safety ownership all start together. Studying an interesting syndrome while a patient stays hot is the shape this lesson is about.' };
  }
  if (patient.evidenceAtTick === null) {
    return { id: 'evidence', focus: 'monitor', progress: 0.56, action: 'review-toxicology-anticholinergic-supplied-temperature-cns-ecg-renal-ck-retention-and-differential-boundary',
      narration: 'Read the ECG, the CK and the retention as three separate risks, and keep the antidote a question. A QRS of 86 ms with no terminal rightward pattern in aVR belongs in the physostigmine conversation rather than answering it — eligibility is toxicologist-led and this example does not determine it. A CK of 820 in a hot agitated patient is a renal risk rather than a number, the distended bladder is its own problem, and exposure purity, coingestants and pregnancy status stay qualified-team work.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'report', focus: 'monitor', progress: 0.76, action: 'record-toxicology-anticholinergic-bounded-qualified-cooling-support-sedation-seizure-surveillance-and-physostigmine-eligibility-intent-with-strict-later-review',
      narration: 'Record the cooling and supportive care, the sedation-and-seizure care if needed, the temperature, renal, CK and bladder surveillance, and the physostigmine eligibility question as intents. Let the authored interval pass and read the qualified team’s 30-minute report. The interval is a contrast rather than a required wait, and nothing here says how fast any individual temperature comes down.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-toxicology-anticholinergic-rebound-delirium-hyperthermia-retention-rhabdomyolysis-seizure-coingestion-and-active-risk',
    narration: '38.6°C, heart rate 106, calmer but still confused, and the urinary retention has not resolved. None of that proves the cooling did it, that the temperature will stay down, that her kidneys are safe, or that a seizure will not happen. Hand off rebound delirium and hyperthermia, the retention, the CK and renal injury, coingestion, exposure purity and her safety as live.' };
}
