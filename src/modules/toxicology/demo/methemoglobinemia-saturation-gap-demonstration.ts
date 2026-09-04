import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsMethemoglobinemia, type MethemoglobinemiaAction, type MethemoglobinemiaProgress,
} from '../methemoglobinemia-saturation-gap';

export const METHEMOGLOBINEMIA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsMethemoglobinemiaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsMethemoglobinemia(scenario);
}

export interface MethemoglobinemiaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: MethemoglobinemiaAction; readonly finished?: boolean;
}

/**
 * The worked example for a bedside where the reassuring number is the unreliable
 * one.
 *
 * A demonstration wants to arrive somewhere, and the place this one is tempted
 * to arrive at is the antidote: brown blood, methylene blue, done. It goes the
 * long way instead — the gap, the suspicion, the oxidant that is still on her,
 * the two named hazards — and finishes on a level that fell without anything
 * being proven about why. It selects no product, dose, route or eligibility
 * result, because those belong to the qualified team rather than to this
 * bedside, and it never reads the pulse oximeter as evidence of a response.
 */
export function methemoglobinemiaDemonstrationStep(
  patient?: MethemoglobinemiaProgress,
): MethemoglobinemiaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on with a number that fell, a cause that was never confirmed, an oxidant whose effect on her is not over, and an improvement nobody here can attribute. Nothing was resolved, and the level coming down did not need it to be. This ends the example, not the poisoning.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-toxicology-methemoglobinemia-exposure-cyanosis-symptoms-pulse-ox-arterial-oxygen-and-whole-patient',
      narration: 'Put both oxygen numbers in one sentence with the woman they came from. SpO2 85% and PaO2 238 mmHg are not arguing: the oximeter reports what it can measure, the gas reports dissolved oxygen in plasma, and the 99% beside it is arithmetic on the gas. All three are right about themselves, and none of them measures what her hemoglobin is carrying while she is dusky, breathless and confused after a documented oxidant exposure.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'actions', progress: 0.24, action: 'recognize-toxicology-methemoglobinemia-dyshemoglobin-pattern-without-single-number-or-diagnostic-closure',
      narration: 'Record this as a suspected dyshemoglobin pattern and act on it as one. Cyanosis that oxygen has not fixed, chocolate-brown blood, a wide saturation gap and a named oxidant support urgent suspicion — while pulmonary, circulatory, hemolytic, inherited, medication and other causes all stay open. The gap is the finding rather than the answer, and no single number here makes the diagnosis.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.4, action: 'activate-toxicology-methemoglobinemia-support-monitoring-source-control-poison-center-and-critical-care-ownership',
      narration: 'Keep what is running, stop what caused it, and name who owns her. The oxygen and the monitoring continue even though the oximeter will not reward them, because the number is unreliable here rather than the treatment. Stopping the oxidant is the part that gets left until later, and the poison center or medical toxicology service and critical care are called rather than assumed.' };
  }
  if (patient.hazardsAtTick === null) {
    return { id: 'hazards', focus: 'monitor', progress: 0.56, action: 'review-toxicology-methemoglobinemia-supplied-cooximetry-and-methylene-blue-hazard-boundary',
      narration: 'Read the co-oximetry and the antidote’s two contraindication hazards in the same breath. Co-oximetry measures the dyshemoglobin directly and reports 32%, which the pulse oximeter cannot tell you. In the same look: G6PD deficiency carries a risk of severe hemolysis, and serotonergic medicines carry a serotonin-toxicity risk. Both belong to the team choosing the treatment, and this example chooses no product, dose, route or eligibility result.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'report', focus: 'monitor', progress: 0.76, action: 'record-toxicology-methemoglobinemia-bounded-qualified-team-antidote-intent-and-strict-reassessment',
      narration: 'Record the intent as intent, let the authored interval pass, and read the qualified team’s report. The interval is a contrast rather than a required wait, and nothing here says how fast a real methemoglobin level falls, or in whom.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-toxicology-methemoglobinemia-exposure-rebound-hemolysis-serotonin-rescue-and-active-risk',
    narration: 'Methemoglobin 8%, clearer mentation, easier breathing, heart rate 98. One authored patient improving after a treatment is not evidence the treatment is why, and the pulse oximeter is still not the instrument that would tell you. The oxidant can keep generating methemoglobin after the antidote has cleared, so hand off rebound, hemolysis, serotonin toxicity, repeat co-oximetry and the rescue alternatives as live.' };
}
