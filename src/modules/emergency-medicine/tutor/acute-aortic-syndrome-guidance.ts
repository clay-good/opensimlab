import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { AcuteAorticSyndromeProgress } from '../acute-aortic-syndrome';

export const ACUTE_AORTIC_SYNDROME_TUTOR_VERSION = '0.1.0';

export interface AcuteAorticSyndromePrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is the default pathway. A fifty-eight-year-old
 * with hypertension, crushing chest pain and a nondiagnostic ECG is an acute
 * coronary syndrome until proven otherwise, and the treatment for that is
 * antithrombotic — which is the wrong drug to give a dissecting aorta. The
 * second reflex is trusting a normal examination: the first pulse check here is
 * symmetric, and the lesson makes repeating it a deliberate act.
 *
 * It is silent on the unassisted setting, silent once the handoff is recorded,
 * and silent for any scenario version it was not written against.
 */
export function acuteAorticSyndromeInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: AcuteAorticSyndromeProgress },
): AcuteAorticSyndromePrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handedOffAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.initialReviewedAtTick === null) return prompt('aas-initial', true,
    'Say what you have without deciding what it is.',
    'Abrupt, severe, maximal at onset eighteen minutes ago, and now between the shoulder blades. Every one of those words is a high-risk aortic feature, and "maximal at onset" is the one that separates this from most cardiac pain, which builds. Against that: both arms are 198/106 and 194/104, pulses and perfusion and the neurological examination are symmetric, and the ECG is nondiagnostic. So an acute coronary syndrome is still plausible and so are the other dangerous causes. The point of recording this step is what it declines to do — no diagnosis, and no default antithrombotic pathway started on the strength of chest pain and a hypertensive man, because that is the drug you would least like to have given if this turns out to be a dissection.');
  if (patient.evolutionReviewedAtTick === null) return prompt('aas-evolution', true,
    'The story changed. Examine him again rather than trusting the first exam.',
    'The pain has migrated toward the abdomen, and migrating pain is the aorta being described to you. So the discordant territories get rechecked, deliberately, because a symmetric examination is a fact about a moment and not a promise. What comes back: left arm 202/108 against right arm 166/92, a thirty-six millimetre gap where there was four; a newly weak right radial; a cool left foot with a diminished pedal pulse and slow refill; and new mild left-arm drift with clear speech. Three territories — an arm, a leg and a brain — is not three diagnoses, it is one process at a branch point. The glucose is 112, which is worth having because it removes the cheapest explanation for the drift. None of this is a definitive diagnosis.');
  if (patient.escalatedAtTick === null) return prompt('aas-escalate', true,
    'Escalate now — and say out loud which pathways you are pausing.',
    'The evolving pain, a 36 mmHg inter-arm difference, a pulse deficit, a cold foot and a focal neurological sign go to the aortic and critical-care teams immediately, because the next decision is not one a single clinician makes. The second half of this step is the one that saves him: routine coronary anticoagulation or thrombolysis is paused, and so is isolated stroke thrombolysis. He now has a plausible reason to receive both — chest pain with an abnormal story, and a focal deficit — and both would be given for the diagnosis he does not have. Pausing is not the same as ruling out; it is refusing to commit to a drug that is hard to take back until the urgent evaluation says which disease this is. Nothing is consulted, transferred or treated here.');
  if (patient.antiImpulseAtTick === null) return prompt('aas-impulse', true,
    'Rate first, then pressure — and only as far as his organs will allow.',
    'ICU-level monitoring, an arterial line, titrated analgesia, and local-protocol intravenous rate control recorded before any vasodilator. The order is the content: lowering pressure with a vasodilator while the heart rate is still 104 increases the force of each ejection, which is the thing tearing the aorta, so rate comes first and a vasodilator is added afterwards. The pain matters here too, because it is what is driving the tachycardia and the hypertension. Targets are 60 to 80 and a systolic below 120 — with an explicit ceiling on how far you chase them, because he already has a cool foot and a drifting arm, and a lower number that starves a brain or a leg is not a better number. No drug, contraindication review, dose, line or response is simulated.');
  if (patient.imagingAtTick === null) return prompt('aas-imaging', true,
    'Get the scan that answers it, while he is still someone you can move.',
    'Urgent definitive CT of the aorta and its branch vessels, prioritised now for a specific reason: he is transportable at this moment and there is no guarantee he stays that way. TEE or MRI is the alternative where CT is unsuitable, which is a context decision rather than a ranking. And the honest part of this step is that the scan is not yet available — the imaging is ordered and the answer does not exist, which is the state everything after this has to be good enough to survive. Acquisition, contrast decisions, transport risk, interpretation, classification and any operative choice are all outside this lesson.');
  return prompt('aas-handoff', true,
    'Examine him once more, then hand over the uncertainty rather than a diagnosis.',
    'The repeat before imaging: pain still present, heart rate down to 82, left arm 156/88 against right 132/78, the weak right radial and left pedal pulses persisting, the foot still cool, the drift unchanged with clear speech. The numbers falling is the anti-impulse intent doing what it was recorded for, and the persistent deficits are the reason nothing here is reassuring. What goes to the aortic team is the shape of the problem: the times, the trends, the intents you recorded, the competing diagnoses you have not closed, the malperfusion concern, and the fact that the scan has not resulted. That is a more useful handover than a confident label would be. No diagnosis, image result, procedure, transfer, disposition or outcome is simulated.');
}
