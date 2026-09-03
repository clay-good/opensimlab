import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsMethanol, type MethanolAction, type MethanolProgress,
} from '../methanol-visual-acidosis-gaps';
import { methanolInlinePrompt } from '../tutor/methanol-visual-acidosis-gaps-guidance';


/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: MethanolProgress): string {
  const prompt = methanolInlinePrompt('guided', { scenarioVersion: '0.1.0', methanol: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const METHANOL_DEMONSTRATION_VERSION = '0.1.0';

export function supportsMethanolDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsMethanol(scenario);
}

export interface MethanolDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: MethanolAction; readonly finished?: boolean;
}

/**
 * The worked example for two numbers that look like an answer.
 *
 * The gaps are the most satisfying thing at this bedside and the least
 * conclusive: they move in opposite directions on the clock, so neither settles
 * anything and a narrow one later would exclude nothing. The vision is the part
 * that is not a clue — snowfield blurring at fourteen hours is injury already
 * underway. So this example dates the vision by the clock, reads the gaps as a
 * pair, finds the antidote and extracorporeal owners before any concentration
 * arrives, and ends on a better pH beside an eye that has not changed. It
 * calculates no gap, interprets no laboratory value, and selects no product,
 * dose, route, airway, or extracorporeal modality.
 */
export function methanolDemonstrationStep(
  patient?: MethanolProgress,
): MethanolDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He is handed on with a better pH and the same blurred vision. Nothing was proven and nothing was excluded — not the cause, not the toxin cleared, not whether he will see properly again. This ends the example, not the poisoning.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-toxicology-methanol-source-clock-vision-acid-base-gaps-and-whole-patient',
      narration: 'Say the vision and the clock together, because one dates the other. Fourteen hours after a supplied windshield-washer-fluid ingestion, with nausea, headache, snowfield-like blurring, a respiratory rate of 30 and confusion. The breathing is not distress — it is the acidosis being blown off — and blurred vision at this point in the clock is injury that is already happening rather than a symptom to be observed.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'actions', progress: 0.24, action: 'recognize-toxicology-methanol-coupled-pattern-without-source-vision-anion-osmolar-or-level-only-closure',
      narration: narrate(patient) };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.4, action: 'activate-toxicology-methanol-resuscitation-airway-antidote-extracorporeal-toxicology-laboratory-and-vision-ownership',
      narration: narrate(patient) };
  }
  if (patient.evidenceAtTick === null) {
    return { id: 'evidence', focus: 'monitor', progress: 0.56, action: 'review-toxicology-methanol-supplied-acid-base-osmolar-electrolyte-renal-visual-coingestion-and-differential-boundary',
      narration: 'Notice which acid this is not, and keep every gap a clue. A pH of 7.19 with a bicarbonate of 7 and an anion gap of 31 sitting next to a lactate of 2.4 says the acid is not lactate and is not being measured. The ethanol below the reporting limit removes one thing that would have masked it rather than confirming what is there, and the creatinine of 1.2 matters for what comes next rather than for the diagnosis. No gap, level, or threshold here establishes antidote or extracorporeal eligibility, and this example determines neither.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'report', focus: 'monitor', progress: 0.76, action: 'record-toxicology-methanol-bounded-qualified-source-antidote-cofactor-acid-base-extracorporeal-surveillance-and-airway-intent-with-strict-later-review',
      narration: 'Record the source cessation, the antidote and cofactor, the acid-base and electrolyte support, the serial laboratory, neurologic, visual, renal and cardiac surveillance, the airway preparedness and the extracorporeal question as intents. Let the authored interval pass and read the qualified team’s 45-minute report. The interval is a contrast rather than a required wait, and nothing here says how fast any individual acidosis corrects.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-toxicology-methanol-rebound-acidosis-vision-neurologic-airway-renal-electrolyte-coingestion-and-active-risk',
    narration: 'pH 7.27, bicarbonate 10, a heart rate of 106 — and the blurred vision and the confusion are exactly where they were. A partially corrected acidosis is not cleared toxin. Hand off recurrent acidosis, the visual and neurologic injury, the airway, electrolytes, coingestion, exposure completeness and whether the extracorporeal course finishes, and prove none of it.' };
}
