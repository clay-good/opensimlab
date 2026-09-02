import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { HeartFailureProgress } from '../heart-failure';

export const HEART_FAILURE_TUTOR_VERSION = '0.1.0';

export interface HeartFailurePrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * There is no wrong turn to answer, because this engine case authors none.
 * The failure mode is the one that fills readmission wards: a patient who
 * feels better is sent home still congested, and comes back in a fortnight.
 * Feeling better is the first thing to improve and the least reliable thing to
 * discharge on. It is silent on the unassisted setting, silent once the
 * readiness reassessment is recorded, and silent for any scenario version it
 * was not written against.
 */
export function heartFailureInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: HeartFailureProgress },
): HeartFailurePrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.readinessAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.statusAtTick === null) return prompt('hf-status', true,
    'Two questions, and they have different answers. Is he wet, and is he cold?',
    'A seventy-four-year-old man with a fixed ejection fraction of 30%, twenty-four hours in after missed medications and a high-sodium week. Wet: he is still orthopneic, with a raised JVP, bibasal crackles and 2+ leg edema. Cold: he is not — his blood pressure is 118/73, his extremities are warm, and there is no authored shock. That combination is the common one and it is the one people misread, because a warm, comfortable-looking patient with a normal pressure invites the conclusion that the congestion has been dealt with. It has not. And no shock, ischemia, dangerous rhythm, infection or respiratory failure is authored, which narrows the field without emptying it.');
  if (patient.responseAtTick === null) return prompt('hf-response', true,
    'Judge the response on five things, and notice which one is lying to you.',
    'The symptom improved — dyspnea is better — and that is the finding people stop at. Put it next to the rest. Weight has gone 77.2 to 75.8, so 1.4 kg off, against a documented clinic weight of 72.0: he is still 3.8 kg above his own baseline. Net balance is −1.6 L on 2.4 L of urine. The examination has not resolved: JVP still up, crackles still there, edema still 2+. So four of five say partially decongested and one says better, and the one that says better is the one he can tell you about. That is why the physical findings and the weight against a real baseline are what this judgement rests on.');
  if (patient.toleranceAtTick === null) return prompt('hf-tolerance', true,
    'Now ask what the decongestion is costing, and why he decompensated at all.',
    'Creatinine has moved from 1.1 to 1.3. That is worth reading carefully rather than reacting to: a modest rise during effective decongestion in a congested patient is not automatically kidney injury, and stopping diuresis at the first creatinine bump in someone who is still visibly wet is a well-worn way to send a patient home to bounce back. Potassium at 3.7 and magnesium at 1.9 are the numbers that keep the diuresis safe rather than incidental. Then the question that decides whether he is back next month: he missed his medications and had a high-sodium week, and both of those have causes — cost, understanding, side effects, a change at home. This lesson calculates no dry weight, no fluid target, and no dose.');
  if (patient.transitionAtTick === null) return prompt('hf-transition', true,
    'Record the intent, and keep the two jobs separate.',
    'There are two different pieces of work here and they get conflated. One is finishing the decongestion and moving from intravenous to oral in a way that holds. The other is the guideline-directed therapy for his ejection fraction of 30%, which is what changes what happens to him over years rather than over this admission — and an admission is one of the few moments it reliably gets reviewed. Recording the intent is not writing the regimen: no dose, no agent, no schedule is selected here, and the individualization belongs to the team who will follow the response.');
  return prompt('hf-readiness', true,
    'Say plainly that he is not ready to go, and then make the discharge safe when it comes.',
    'The authored snapshot is not discharge-ready, and the reason is on the examination rather than on his face: persistent congestion is the single best predictor of coming straight back. What the record needs before he does leave is the part that keeps working at home — the education, including what his weights mean and what sodium did here, who owns the medication changes and the monitoring, the triggers that should bring him back sooner, and early follow-up rather than a routine appointment in six weeks. Nothing here calculates a dry weight, a target or a dose, diagnoses, prescribes or delivers treatment, selects a regimen, determines disposition, or predicts an outcome.');
}
