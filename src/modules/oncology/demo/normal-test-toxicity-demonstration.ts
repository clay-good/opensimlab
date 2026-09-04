import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { NormalTestToxicitySnapshot } from '@platform/kernel/protocol';
import { supportsNormalTestToxicity, type NormalTestToxicityAction } from '../normal-test-toxicity';
import { normalTestToxicityInlinePrompt } from '../normal-test-toxicity-tutor';


/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: NormalTestToxicitySnapshot): string {
  const prompt = normalTestToxicityInlinePrompt('guided', { scenarioVersion: '0.1.0', normalTestToxicity: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const NORMAL_TEST_TOXICITY_DEMONSTRATION_VERSION = '0.1.0';

export function supportsNormalTestToxicityDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsNormalTestToxicity(scenario);
}

export interface NormalTestToxicityDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: NormalTestToxicityAction; readonly finished?: boolean;
}

/**
 * The worked example for a normal test and a dose still in his bag.
 *
 * The order is the lesson, and it is not the order a write-up would use. The drug
 * is withheld first, before anything is recorded and before anyone is called,
 * because the supply is with the patient and the next dose falls due inside this
 * lesson. Everything else can wait an hour; that cannot. An example that opened by
 * documenting the toxicity would read as thorough and would still let him take it.
 */
export function normalTestToxicityDemonstrationStep(
  patient?: NormalTestToxicitySnapshot,
): NormalTestToxicityDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'The drug is stopped, what was seen is recorded with its severity and day, what the normal test did not exclude is stated, and the service that owns the treatment has it. This ends the example, not the need for care.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.drugWithheldAtTick === null) {
    return { id: 'withhold', focus: 'actions', progress: 0.06, action: 'withhold-the-drug-now',
      narration: 'Stop the drug first, before recording anything and before calling anyone. The box is in his bag, the next dose is due during this consultation, and he has been told to take it every day for nine days. Nobody has told him otherwise. This is not a treatment decision needing permission; it is stopping something already under way.' };
  }
  if (patient.toxicityRecordedAtTick === null) {
    return { id: 'toxicity', focus: 'actions', progress: 0.18, action: 'record-the-toxicity-and-its-severity',
      narration: 'Now record what is actually there, with its severity and the day of the cycle. Those are what the treating service will grade against; a description carrying neither supports nothing.' };
  }
  if (patient.exclusionsRecordedAtTick === null) {
    return { id: 'exclusions', focus: 'actions', progress: 0.28, action: 'record-what-the-normal-test-does-not-exclude',
      narration: 'Record what the normal pre-treatment result does and does not exclude. A wild-type panel lowers a prior; it does not rule out toxicity. Reading a screening test as a rule-out is the move this whole presentation is built from.' };
  }
  if (patient.escalationAtTick === null) {
    return { id: 'escalate', focus: 'actions', progress: 0.40, action: 'escalate-to-acute-oncology',
      narration: 'Contact acute oncology, with the drug already stopped. Grading, further treatment, and whether it is ever restarted are theirs. Calling them is not the same as waiting for them, and the difference is a dose.' };
  }
  if (patient.supportiveIntentAtTick === null) {
    return { id: 'intent', focus: 'actions', progress: 0.52, action: 'record-bounded-supportive-intent',
      narration: 'Record bounded supportive intent and give nothing. Supportive treatment is not wrong and belongs to the qualified team; offering it instead of withholding is what this lesson refuses.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.62, action: 'review-boundaries',
      narration: 'Review what is not available here. There is no enzyme assay, no confirmed grade, and no restart plan — and none of them is needed to stop a drug that is causing harm.' };
  }
  if (patient.observation === null) {
    return { id: 'assess', focus: 'actions', progress: 0.72, action: 'reassess',
      narration: 'Take a current full assessment rather than a partial check. The treatment record supplies no observations, and the observations supply no treatment record.' };
  }
  if (!patient.serviceResponded) {
    return { id: 'observe-service', focus: 'monitor', progress: 0.84,
      narration: patient.nextDoseDue
        ? 'The evening dose fell due while you waited. He took the box out, looked at it, and put it back, because he had been told plainly not to take it and why. That is the whole difference this lesson turns on.'
        : 'Keep him under review while acute oncology answers. This authored interval is a contrast, not a required clinical wait; pause freely.' };
  }
  if (!patient.serviceObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.92, action: 'reassess',
      narration: 'Take a fresh assessment now the service has answered, confirmed the drug stays stopped, and recorded that a wild-type result does not exclude what is in front of them. The earlier assessment predates both that answer and the dose that fell due.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: narrate(patient) };
}
