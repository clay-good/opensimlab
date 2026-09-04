import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { ProxyScaleSnapshot } from '@platform/kernel/protocol';
import { supportsProxyScale, type ProxyScaleAction } from '../proxy-scale';
import { proxyScaleInlinePrompt } from '../proxy-scale-tutor';


/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: ProxyScaleSnapshot): string {
  const prompt = proxyScaleInlinePrompt('guided', { scenarioVersion: '0.1.0', proxyScale: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const PROXY_SCALE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsProxyScaleDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsProxyScale(scenario);
}

export interface ProxyScaleDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: ProxyScaleAction; readonly finished?: boolean;
}

/**
 * The worked example for a number without a standard behind it.
 *
 * The example asks him first, knowing he will not answer, because the attempt is
 * the reference standard rather than a formality. It never converts the
 * behavioural total into an intensity and never states how much pain he is in:
 * that quantity does not exist in this lesson, and supplying it is the failure
 * being taught. What it produces instead is a list, a proxy description, and
 * bounded intent with its reasoning attached.
 */
export function proxyScaleDemonstrationStep(patient?: ProxyScaleSnapshot): ProxyScaleDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'What travels is the attempt, the behaviours item by item, what the total is not, and his daughter’s description of him. No intensity was ever stated, because there was never one to state. This ends the example, not his pain.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.selfReportAttemptedAtTick === null) {
    return { id: 'self-report', focus: 'actions', progress: 0.08, action: 'attempt-self-report',
      narration: 'Ask him first, even expecting no answer. Self-report is the reference standard, and skipping it assumes an answer nobody asked for. He does not answer, and the attempt is now part of the record.' };
  }
  if (patient.behavioursRecordedAtTick === null) {
    return { id: 'behaviours', focus: 'actions', progress: 0.2, action: 'record-the-observed-behaviours',
      narration: `Record the behaviours as behaviours, item by item: ${patient.behaviouralTotal} of ${patient.itemCount} scoring. Which ones scored is the information a colleague can check against the patient in front of them; the total alone is not.` };
  }
  if (patient.limitsRecordedAtTick === null) {
    return { id: 'limits', focus: 'actions', progress: 0.32, action: 'record-what-the-score-is-not',
      narration: `Write down what the total is not. It is not ${patient.behaviouralTotal} out of 10 and it does not compare with a self-reported number. These instruments measure observable behaviour, and their own developers say so.` };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.44, action: 'review-boundaries',
      narration: 'Review the hierarchy in its order: attempt self-report, consider whether a cause of pain is present, observe behaviours, ask someone who knows him, then treat on that basis. Each step changes what the next one can support.' };
  }
  if (patient.monitoringAtTick === null) {
    return { id: 'monitor', focus: 'actions', progress: 0.54, action: 'monitor',
      narration: 'Schedule reassessment against these same behaviours. The comparison that means something is this list against itself later, not this total against somebody else’s number.' };
  }
  if (!patient.familyArrived) {
    return { id: 'await', focus: 'monitor', progress: 0.64,
      narration: narrate(patient) };
  }
  if (patient.proxyHistoryAtTick === null) {
    return { id: 'proxy', focus: 'actions', progress: 0.74, action: 'seek-the-proxy-history',
      narration: 'Ask her what he looks like when he is in pain, and what is different today. She says he goes quiet and still rather than restless, and holds his breath in a particular way. That is a baseline nobody else in the building has.' };
  }
  if (patient.analgesicIntentAtTick === null) {
    return { id: 'intent', focus: 'actions', progress: 0.86, action: 'record-analgesic-intent',
      narration: 'Record bounded qualified-team analgesic intent with the reasoning attached: an attempted and unsuccessful self-report, the observed behaviours, a recent operation that would be expected to hurt, and what his daughter described. The reasoning is what the team acts on. This example selects no drug and no dose.' };
  }
  if (!patient.reviewObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.93, action: 'reassess',
      narration: 'Reassess against the behaviours you recorded. Whether those specific behaviours have changed is a question with an answer; whether his pain score has fallen is not, because there was never a score of that kind.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: 'Hand off the attempt, the behaviour list, what the total is not, and his daughter’s description. A number the next nurse could compare with their own was never the gate, and here it would be a fiction.' };
}
