import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsSymptomaticBradycardia, type SymptomaticBradycardiaAction,
  type SymptomaticBradycardiaProgress,
} from '../symptomatic-bradycardia';
import { symptomaticBradycardiaInlinePrompt } from '../tutor/symptomatic-bradycardia-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied. Every lesson's prose used to ship twice inside the
 * cockpit bundle — once in the tutor and once as a duplicated string literal
 * here — and gzip cannot reach across that distance to dedupe it. Deriving it
 * also makes "the two cannot drift apart" structural rather than a property
 * maintained by regenerating this file.
 */
function narrate(patient: SymptomaticBradycardiaProgress): string {
  const prompt = symptomaticBradycardiaInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const SYMPTOMATIC_BRADYCARDIA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsSymptomaticBradycardiaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsSymptomaticBradycardia(scenario);
}

export interface SymptomaticBradycardiaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: SymptomaticBradycardiaAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a slow rhythm that is not treated because it is slow.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. Where the middle pair is unordered the example takes context
 * first — a choice, not a rule, and the engine accepts the other order just as
 * readily. It examines nobody, acquires and interprets no ECG or monitor,
 * makes no diagnosis, changes no medication, gives no atropine, oxygen or
 * infusion, paces nothing, reaches no eligibility conclusion, selects or
 * implants or programs no device, performs no procedure, determines no
 * disposition, and predicts no recurrence or outcome.
 */
export function symptomaticBradycardiaDemonstrationStep(
  patient?: SymptomaticBradycardiaProgress,
): SymptomaticBradycardiaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She leaves in the rhythm she arrived in, still on the medication she arrived on, with no cause established and no device decided. What changed is that her symptoms are now attached to a rhythm, a referral, an owner and a safety net. The rate of 44 never decided anything. This ends the example, not the evaluation.' };
  }
  if (patient.stabilityAtTick === null) {
    return { id: 'stability', focus: 'monitor', progress: 0.12, action: 'reconcile-symptomatic-bradycardia-stability',
      narration: narrate(patient) };
  }
  if (patient.contextAtTick === null) {
    return { id: 'review', focus: 'monitor', progress: 0.3, action: 'review-symptomatic-bradycardia-context',
      narration: narrate(patient) };
  }
  if (patient.correlationAtTick === null) {
    return { id: 'correlation', focus: 'monitor', progress: 0.5, action: 'correlate-symptomatic-bradycardia-record',
      narration: narrate(patient) };
  }
  if (patient.pacingEvaluationAtTick === null) {
    return { id: 'pacing', focus: 'actions', progress: 0.72, action: 'record-symptomatic-bradycardia-pacing-evaluation',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-symptomatic-bradycardia-plan',
    narration: narrate(patient) };
}
