import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { AcutePulmonaryEdemaProgress } from '../acute-pulmonary-edema';

export const ACUTE_PULMONARY_EDEMA_TUTOR_VERSION = '0.1.0';

export interface AcutePulmonaryEdemaPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is rank. Three initial treatments are open at
 * once and none of them waits for the others, but one of the three is the word
 * most people have filed under "pulmonary edema" — and it is the slowest of the
 * three at the thing this patient needs in the next few minutes. The engine
 * accepts them in any order for exactly that reason.
 *
 * The claim the lesson turns on lives in the beat for the state where none of
 * the three has been recorded, because that is the only one of them every path
 * passes through.
 *
 * It is silent on the unassisted setting, silent once the reassessment is
 * recorded, and silent for any scenario version it was not written against.
 */
export function acutePulmonaryEdemaInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: AcutePulmonaryEdemaProgress },
): AcutePulmonaryEdemaPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.reassessedAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.patternReviewedAtTick === null) return prompt('ape-pattern', true,
    'Read the lungs, the pressure, and the perfusion as one picture before you treat any part of it.',
    'Abrupt severe dyspnoea and orthopnoea, short-phrase speech, a respiratory rate of 32, SpO₂ 90%, diffuse crackles, a raised jugular venous pressure — and a blood pressure of 188/112. The pressure is not incidental to that list; in this vignette it is the part that explains the rest. The authored ECG shows sinus tachycardia without ST elevation, the radiograph a bilateral perihilar pattern, the ultrasound diffuse B-lines with preserved left ventricular contraction. No fever, no focal consolidation, no unilateral loss of ventilation, no abrupt pleuritic onset. That is what rules the immediate mimics out here. What it does not rule out is a precipitant: ischaemia, a missed medication, worsening renal function, a valve. This screen performs no examination and acquires no test; the findings are given.');

  const untreated = patient.nivAtTick === null && patient.diureticIntentAtTick === null
    && patient.vasodilatorIntentAtTick === null;
  if (untreated) return prompt('ape-initial', true,
    'Three treatments are open at once. Start with the one that works fastest, not the one that sounds like the diagnosis.',
    'They are unordered on purpose: positive pressure, a vasodilator, and a loop diuretic are three parallel initial treatments and none of them is waiting on the others. But they are not equal in speed. Preserved contraction and a systolic of 188 point at a redistribution picture rather than a slow accumulation of litres — the pressure drove fluid into the alveoli, and total body volume may be close to normal. Noninvasive positive pressure is the fastest lever on that: it recruits alveoli, unloads the work of breathing, and drops both preload and afterload over minutes. The word most people have filed under "pulmonary edema" is the diuretic, and of the three it is the slowest at the thing the next few minutes need. Record it — the congestion is real — but recording it does not buy you the other two. Interface choice, fit, pressure titration, synchrony, and contraindications are not simulated here.');

  if (patient.nivAtTick === null) return prompt('ape-niv', true,
    'Positive pressure is still not recorded, and it is the fastest thing available.',
    'A respiratory rate above 25, severe work of breathing, and SpO₂ at 90% are the authored indication. Early noninvasive positive-pressure support with oxygen titrated to a target is the intervention with the shortest interval between recording it and the patient looking different — it recruits flooded alveoli and reduces both preload and afterload at once. A bounded teaching setting is displayed; interface, fit, titration, synchrony, contraindications, and airway rescue are outside this vignette.');

  if (patient.vasodilatorIntentAtTick === null) return prompt('ape-vasodilator', true,
    'Record the vasodilator intent. This is the one aimed at the mechanism.',
    'A systolic of 188 is what is holding fluid in the alveoli, and it is also what makes the vasodilator safe to record here — the qualifying question is whether systolic pressure sits comfortably above 110, and in this vignette it does. Reducing afterload lets a ventricle with preserved contraction empty against less resistance, which is the same problem seen from the other end. The agent, the dose, the delivery, the titration, contraindications, and any ischaemia evaluation are not simulated; this records an intent, not a drug going in.');

  if (patient.diureticIntentAtTick === null) return prompt('ape-diuretic', true,
    'Now the loop diuretic — for the congestion, and not as the thing that turns this around in ten minutes.',
    'The raised venous pressure and the diffuse B-lines are real congestion and an intravenous loop-diuretic intent belongs in this record. What is worth being honest about is what it is doing and when: natriuresis takes time to matter, and in a redistribution picture the volume it removes was not the whole problem. Recorded alongside pressure and support it is one of three; recorded instead of them it is the reason a patient looks the same twenty minutes later. Agent, prior-dose adjustment, dose, delivery, urine output, renal function, electrolytes, and individual response are outside this vignette.');

  return prompt('ape-reassess', true,
    'Let a moment pass, then read the same four things you read at the start.',
    'Work of breathing, oxygenation, blood pressure, and peripheral perfusion — the same picture, re-read, because a single set of numbers at arrival tells you nothing about direction. The reassessment is gated behind a further engine tick for that reason: there is nothing new to see at the instant an intent is recorded, and asking too early trains the habit of reading a decision as a result. What the bounded monitor shows next is authored, not modelled, so treat it as a prompt to look rather than as proof that anything worked. Congestion, urine output, renal function, electrolytes, precipitant evaluation, weaning, disposition, and outcome remain outside this initial-response vignette.');
}
