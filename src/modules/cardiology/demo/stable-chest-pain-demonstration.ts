import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsStableChestPain, type StableChestPainAction, type StableChestPainProgress,
} from '../stable-chest-pain';

export const STABLE_CHEST_PAIN_DEMONSTRATION_VERSION = '0.1.0';

export function supportsStableChestPainDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.1' && supportsStableChestPain(scenario);
}

export interface StableChestPainDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: StableChestPainAction; readonly finished?: boolean;
}

/**
 * The worked example for a calm visit that still has to end with a safety net.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. It examines nobody, acquires and interprets no ECG, calculates
 * no risk score, measures no exercise capacity, orders and performs no test,
 * diagnoses no coronary disease or ischemia, prescribes nothing, determines no
 * disposition, and predicts no event or outcome.
 */
export function stableChestPainDemonstrationStep(
  patient?: StableChestPainProgress,
): StableChestPainDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.safetyNetAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'Nothing was diagnosed, nothing was ordered, and nobody called anything atypical. What the visit produced is a described pattern, a likelihood band, a test chosen with him rather than for him, and a clear account of what would bring him back sooner. This ends the example, not the evaluation.' };
  }
  if (patient.stabilityAtTick === null) {
    return { id: 'stability', focus: 'monitor', progress: 0.12, action: 'verify-stable-chest-pain-trajectory',
      narration: 'Establish that this is stable before you treat it as stable. Three months of central pressure on brisk walking or two flights, coming on after about six minutes and settling within four minutes of rest, two or three times a week, with no increase in frequency, severity, duration, or lowering of the threshold that triggers it. No rest or prolonged pain, no syncope, no marked dyspnea, no diaphoresis, and no symptom right now. That unchanging pattern is what the word stable is doing, and it is a description of a trajectory rather than a judgement about danger. The same visit needs its acute-change triggers stated out loud now, while the room is calm: rest or prolonged symptoms, rising frequency or severity, a falling threshold, syncope, marked breathlessness, or instability.' };
  }
  if (patient.patternAtTick === null) {
    return { id: 'pattern', focus: 'monitor', progress: 0.34, action: 'characterize-stable-chest-pain-pattern',
      narration: 'Describe what he actually gets. Do not reach for the word "atypical". Record the pattern as it is: central pressure after about six minutes of brisk walking or two flights, resolving within four minutes of rest, two or three times weekly, not progressing. That description carries information. "Atypical" carries almost none — it has been used to mean everything from "not classic angina" to "probably nothing", it performs worse in women and it has been dropped from contemporary guidance for exactly that reason. Saying what happens, when, for how long, and what relieves it is both more useful to the next reader and more honest about what you know. You are not assigning a cause here.' };
  }
  if (patient.likelihoodAtTick === null) {
    return { id: 'likelihood', focus: 'monitor', progress: 0.56, action: 'estimate-stable-chest-pain-clinical-likelihood',
      narration: 'Estimate before you investigate, and estimate from everything. Integrate the whole picture: his age and sex, the symptom pattern you just recorded, the hypertension, the current tobacco use, an LDL of 168, the fixed examination findings, and a resting ECG reported as sinus rhythm without ischemic ST-T change. That last one is worth naming carefully — a normal resting ECG in a patient with no symptoms at the time tells you very little, and it is routinely over-read as reassurance. The authored likelihood is not very low. That is deliberately a band and not a percentage: no exact score is supplied and you are not calculating one, because the decision that follows turns on which band you are in, not on a second decimal place.' };
  }
  if (patient.testingAtTick === null) {
    return { id: 'testing', focus: 'actions', progress: 0.78, action: 'record-stable-chest-pain-testing-intent',
      narration: 'Decide what question a test would answer, then choose one with him. A likelihood that is not very low is what makes patient-specific noninvasive testing appropriate — and there is no universal right modality here, which is the point rather than a gap. What goes into the choice: the question you are actually asking, the strengths and limitations of each test for that question, whether he can exercise, whether his ECG would be interpretable, radiation and contrast, his comorbidities, his own preference, and what is genuinely accessible near him with local expertise and local quality behind it. The best test on paper performed badly nearby is not the best test for him. Nothing is ordered or performed here; what you record is the shared intent.' };
  }
  return { id: 'safetyNet', focus: 'actions', progress: 0.92, action: 'safety-net-stable-chest-pain-follow-up',
    narration: 'Close the visit with what would make him come back sooner. The follow-up and the safety net are the part of this consultation that keeps working after he leaves the room, and they are easy to leave implicit in a calm visit. Record when he is being seen again and by whom, and record the acute-change triggers explicitly with him: pain at rest or lasting longer, symptoms coming more often or more easily, a threshold that starts dropping, syncope, marked breathlessness. Nothing in this lesson diagnoses coronary disease or ischemia, calculates a score, measures his exercise capacity, orders or performs a test, prescribes anything, determines disposition, or predicts an event or an outcome.' };
}
