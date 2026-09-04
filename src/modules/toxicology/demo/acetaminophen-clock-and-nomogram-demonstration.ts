import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsAcetaminophen, type AcetaminophenAction, type AcetaminophenProgress,
} from '../acetaminophen-clock-and-nomogram';

export const ACETAMINOPHEN_DEMONSTRATION_VERSION = '0.1.0';

export function supportsAcetaminophenDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsAcetaminophen(scenario);
}

export interface AcetaminophenDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: AcetaminophenAction; readonly finished?: boolean;
}

/**
 * The worked example for the one ingestion the nomogram was actually built for.
 *
 * A demonstration of a tool that answers cleanly is only worth watching if it
 * shows when the tool applies, so this one asks that question before it looks
 * at where the point lands, and names what each missing precondition would turn
 * this into. It keeps the reported tablet count and the normal baseline liver
 * panel out of the reasoning, treats her safety as part of the care rather than
 * as something after it, and finishes by refusing the stop that the 22-hour
 * numbers appear to offer. It plots nothing, calculates nothing, doses nothing.
 */
export function acetaminophenDemonstrationStep(
  patient?: AcetaminophenProgress,
): AcetaminophenDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on with better numbers, an antidote course nobody here is entitled to stop, a liver injury that has had time to start and not time to show, and her safety owned by people who will still be there tomorrow. Nothing was excluded, and the numbers coming down did not need it to be. This ends the example, not her care.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'actions', progress: 0.08, action: 'reconcile-toxicology-acetaminophen-product-ingestion-window-clock-symptoms-and-whole-patient',
      narration: 'Fix the product and the clock first, and leave the tablet count out of it. Immediate-release acetaminophen only, an ingestion witnessed to have finished inside an hour, exactly six hours ago, in a woman who is nauseated and otherwise well. How many tablets she thinks she took is a story rather than a measurement, and it is not a treatment guide here.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'actions', progress: 0.24, action: 'recognize-toxicology-acetaminophen-acute-timed-pattern-and-nomogram-applicability-boundary',
      narration: 'Ask whether this is the ingestion the nomogram was built for, before looking at where the point lands. It means something only for a single acute ingestion with a known completion time, an immediate-release product, and a sample at least four hours after. Unknown timing, a staggered or repeated ingestion, an extended-release product, delayed absorption, a coingestion or a late presentation each turn this into a different qualified evaluation rather than a lower point on the same graph.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.4, action: 'activate-toxicology-acetaminophen-poison-center-emergency-monitoring-and-nonjudgmental-safety-ownership',
      narration: 'Get the owners in place and count the person among them. Poison center or medical toxicology, emergency ownership, the laboratory for serial sampling and continuous monitoring start together — and so does compassionate, nonjudgmental safety ownership. She is a person who has harmed herself, and that part of her care is not a task for after the toxicology is settled.' };
  }
  if (patient.evidenceAtTick === null) {
    return { id: 'evidence', focus: 'monitor', progress: 0.56, action: 'review-toxicology-acetaminophen-supplied-timed-level-nomogram-position-liver-and-coingestion-boundary',
      narration: 'Read the timed level in its context and refuse the two things that look like good news. 132 µg/mL at six hours sits above the treatment line and below the high-risk line on a qualified plot. The normal AST, ALT and INR are six hours old in an injury that takes longer than that to appear, so they are a baseline rather than an absence, and nothing here has excluded a coingestion.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'report', focus: 'monitor', progress: 0.76, action: 'record-toxicology-acetaminophen-bounded-qualified-team-acetylcysteine-intent-and-strict-later-review',
      narration: 'Record the intent as intent, let the authored interval pass, and read the 22-hour report. The interval is a contrast rather than a required wait, and nothing here says how any individual course runs or how long one lasts.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-toxicology-acetaminophen-serial-level-liver-failure-stopping-safety-and-active-risk',
    narration: 'Acetaminophen below 10 µg/mL, AST 27, ALT 24, INR 1.2, mentation stable, nausea easing at 22 hours. That does not authorize an automatic 20- or 21-hour stop, prove a treatment effect, or exclude delayed absorption or evolving liver injury. Hand off the stopping review, the serial testing, the coingestion question, the disposition and her safety as live.' };
}
