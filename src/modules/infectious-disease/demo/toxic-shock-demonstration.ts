import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { ToxicShockSnapshot } from '@platform/kernel/protocol';
import { supportsToxicShock, type ToxicShockAction } from '../toxic-shock';
import { toxicShockInlinePrompt } from '../toxic-shock-tutor';


/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: ToxicShockSnapshot): string {
  const prompt = toxicShockInlinePrompt('guided', { scenarioVersion: '0.1.0', toxicShock: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const TOXIC_SHOCK_DEMONSTRATION_VERSION = '0.1.0';

export function supportsToxicShockDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsToxicShock(scenario);
}

export interface ToxicShockDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: ToxicShockAction; readonly finished?: boolean;
}

/**
 * The worked example for a definition that cannot close.
 *
 * Neither definition can be met inside this rehearsal, by construction, and the
 * example ends with both still open. That is the hardest thing for the form to
 * do here: a demonstration is expected to resolve, and resolving would mean
 * either declaring a case that cannot be declared for a week or reading an
 * unmet definition as an answer. It does neither, and it treats throughout.
 */
export function toxicShockDemonstrationStep(patient?: ToxicShockSnapshot): ToxicShockDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'Both definitions are still open and the patient has been treated throughout. Nothing was declared and nothing was excluded, which is what this looks like when it is done properly. This ends the example, not the illness.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'actions', progress: 0.08, action: 'recognize-toxin-pattern',
      narration: 'Record the pattern as a pattern: erythroderma, mucosal hyperaemia, vomiting and diarrhoea from onset, and hypotension out of proportion to the apparent focus. Recognizing that is not the same as naming a case.' };
  }
  if (patient.criticalCareAtTick === null) {
    return { id: 'critical-care', focus: 'actions', progress: 0.2, action: 'activate-critical-care',
      narration: 'Activate critical care on the pattern rather than on a definition. The definitions are days or weeks from answering, and waiting for one is waiting for information that is not coming today.' };
  }
  if (patient.culturesAtTick === null) {
    return { id: 'cultures', focus: 'actions', progress: 0.32, action: 'request-cultures',
      narration: 'Request blood cultures and sterile-site sampling, and notice what that single request is doing: one definition needs them negative and the other needs an organism. The same samples serve two contradictory clauses.' };
  }
  if (patient.treatmentIntentAtTick === null) {
    return { id: 'intent', focus: 'actions', progress: 0.44, action: 'record-treatment-intent',
      narration: 'Record bounded intent for antimicrobial therapy and haemodynamic support per local protocol. No agent, dose, route, combination, adjunct, fluid volume, or vasoactive choice is made here.' };
  }
  if (patient.definitionStatusAtTick === null) {
    return { id: 'definition', focus: 'actions', progress: 0.58, action: 'record-definition-status',
      narration: 'Write down that the case definition is unmet, and why: one waits on desquamation one to two weeks from now, the other on an organism from a sterile site. The reason is what stops the next reader treating an open definition as a closed answer.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.7, action: 'review-boundaries',
      narration: 'Review what these definitions are for. They count cases consistently across populations rather than deciding treatment at a bedside; a criteria count is not a probability, and the negative-culture clause excludes other diagnoses rather than infection.' };
  }
  if (patient.monitoringAtTick === null) {
    return { id: 'monitor', focus: 'actions', progress: 0.78, action: 'monitor',
      narration: 'Watch perfusion and organ function rather than the criteria tally. The tally is not going to move usefully today; the organ function will, in one direction or the other.' };
  }
  if (patient.deteriorationDueInSeconds !== null) {
    return { id: 'observe', focus: 'monitor', progress: 0.86,
      narration: narrate(patient) };
  }
  if (!patient.deteriorationObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.92, action: 'reassess',
      narration: 'Take a current full assessment. A recorded intent is not an observed response, and perfusion and organ function now are the only description of where this has got to.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: 'Hand off an open definition and a treated patient: the pattern, why each definition is unmet, and that none of the treatment waited for either. A confirmed case was never available to reach.' };
}
