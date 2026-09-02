import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { StableChestPainProgress } from '../stable-chest-pain';

export const STABLE_CHEST_PAIN_TUTOR_VERSION = '0.1.0';

export interface StableChestPainPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * There is no wrong turn to answer, because this engine case authors none.
 * This is the first cardiology lesson to get one, and its register is
 * different from every emergency lesson before it: nobody is deteriorating,
 * the room is calm, and the failure modes are a word, a number, and a
 * reflex. The word is "atypical". The number is an exact risk score nobody
 * supplied. The reflex is ordering a test before deciding what question it
 * answers. It is silent on the unassisted setting, silent once the safety net
 * is recorded, and silent for any scenario version it was not written against.
 */
export function stableChestPainInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: StableChestPainProgress },
): StableChestPainPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.1' || !patient) return null;
  if (patient.safetyNetAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.stabilityAtTick === null) return prompt('scp-stability', true,
    'Establish that this is stable before you treat it as stable.',
    'Three months of central pressure on brisk walking or two flights, coming on after about six minutes and settling within four minutes of rest, two or three times a week, with no increase in frequency, severity, duration, or lowering of the threshold that triggers it. No rest or prolonged pain, no syncope, no marked dyspnea, no diaphoresis, and no symptom right now. That unchanging pattern is what the word stable is doing, and it is a description of a trajectory rather than a judgement about danger. The same visit needs its acute-change triggers stated out loud now, while the room is calm: rest or prolonged symptoms, rising frequency or severity, a falling threshold, syncope, marked breathlessness, or instability.');
  if (patient.patternAtTick === null) return prompt('scp-pattern', true,
    'Describe what he actually gets. Do not reach for the word "atypical".',
    'Record the pattern as it is: central pressure after about six minutes of brisk walking or two flights, resolving within four minutes of rest, two or three times weekly, not progressing. That description carries information. "Atypical" carries almost none — it has been used to mean everything from "not classic angina" to "probably nothing", it performs worse in women and it has been dropped from contemporary guidance for exactly that reason. Saying what happens, when, for how long, and what relieves it is both more useful to the next reader and more honest about what you know. You are not assigning a cause here.');
  if (patient.likelihoodAtTick === null) return prompt('scp-likelihood', true,
    'Estimate before you investigate, and estimate from everything.',
    'Integrate the whole picture: his age and sex, the symptom pattern you just recorded, the hypertension, the current tobacco use, an LDL of 168, the fixed examination findings, and a resting ECG reported as sinus rhythm without ischemic ST-T change. That last one is worth naming carefully — a normal resting ECG in a patient with no symptoms at the time tells you very little, and it is routinely over-read as reassurance. The authored likelihood is not very low. That is deliberately a band and not a percentage: no exact score is supplied and you are not calculating one, because the decision that follows turns on which band you are in, not on a second decimal place.');
  if (patient.testingAtTick === null) return prompt('scp-testing', true,
    'Decide what question a test would answer, then choose one with him.',
    'A likelihood that is not very low is what makes patient-specific noninvasive testing appropriate — and there is no universal right modality here, which is the point rather than a gap. What goes into the choice: the question you are actually asking, the strengths and limitations of each test for that question, whether he can exercise, whether his ECG would be interpretable, radiation and contrast, his comorbidities, his own preference, and what is genuinely accessible near him with local expertise and local quality behind it. The best test on paper performed badly nearby is not the best test for him. Nothing is ordered or performed here; what you record is the shared intent.');
  return prompt('scp-safety-net', true,
    'Close the visit with what would make him come back sooner.',
    'The follow-up and the safety net are the part of this consultation that keeps working after he leaves the room, and they are easy to leave implicit in a calm visit. Record when he is being seen again and by whom, and record the acute-change triggers explicitly with him: pain at rest or lasting longer, symptoms coming more often or more easily, a threshold that starts dropping, syncope, marked breathlessness. Nothing in this lesson diagnoses coronary disease or ischemia, calculates a score, measures his exercise capacity, orders or performs a test, prescribes anything, determines disposition, or predicts an event or an outcome.');
}
