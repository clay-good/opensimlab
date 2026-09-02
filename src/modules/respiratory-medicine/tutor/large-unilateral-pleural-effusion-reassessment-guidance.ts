import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { LargePleuralEffusionProgress } from '../large-unilateral-pleural-effusion-reassessment';

export const LARGE_PLEURAL_EFFUSION_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a number that is a case fact rather than a rule.
 *
 * Two-thirds of a hemithorax is a striking picture, and the temptation it
 * creates is to let the size decide the urgency. The lesson refuses that, and
 * then refuses something subtler at the checkpoint: 850 mL came off before
 * cough and chest tightness stopped it. That volume is what happened to this
 * patient, not a threshold anyone should carry forward — the stop was
 * symptom-led, which is the actual principle. None of these prompts examines
 * her, acquires or reads imaging, ultrasound or fluid, performs a
 * thoracentesis, or selects a device, site or drainage volume.
 */
export function largePleuralEffusionInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly largePleuralEffusion?: LargePleuralEffusionProgress;
}) {
  const patient = input.largePleuralEffusion;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('effusion-trajectory', true,
    'Read six weeks of decline against how she is right now.',
    'Progressive exertional dyspnea, a dry cough and left chest heaviness over six weeks, and she is now breathless crossing a room. Today she is alert in full sentences, 104 and 128/76, breathing at 26, 91% on room air, warm and refilling in two seconds, with markedly reduced left movement and basal air entry. There is no shock, no tension physiology, no fever, no edema pattern and no acute fatigue. This is a large problem that has arrived slowly, which is a different kind of urgency from the ones this module has been practising.');
  if (patient.intentAtTick === null) return prompt('effusion-intent', true,
    'Record what the pleural team is being asked to do, and on what terms.',
    'Image-guided aspiration by qualified operators, for diagnosis and slow symptom relief, with stop triggers that are symptom-led and no target volume set in advance. The terms are the substance here: an aspiration that stops when the patient tells you to is a different procedure from one that stops at a number, and writing down which one you are asking for is the step this lesson exists to record. The imaging supports it — a large, predominantly free-flowing collection with no dense septation and a suitable access window — but size and appearance establish neither urgency nor safety nor a cause.');
  if (patient.responseAtTick === null) return prompt('effusion-response', true,
    'Read the checkpoint as this case, and the volume as a fact rather than a target.',
    '850 mL of amber fluid removed slowly, stopped when persistent cough and mild chest tightness developed. Her rate is 20, her saturation is 95%, and the heaviness is better; the radiograph shows a smaller residual effusion with improved expansion, no pneumothorax and no re-expansion edema pattern. The 850 mL is what happened, not a maximum to carry to the next patient — the stop was driven by her symptoms. None of this proves complete drainage or a cause.');
  if (patient.fluidAtTick === null) return prompt('effusion-fluid', true,
    'Take the exudative classification as a narrowing, not an answer.',
    'A pleural protein of 4.2 against a serum 6.8, an LDH of 310 against a serum 420, a pH of 7.39, glucose 92, and a lymphocyte-predominant differential: the qualified laboratory reports this as exudative. That rules a transudate unlikely and rules nothing in. A lymphocytic exudate in a woman with six weeks of decline raises malignancy and tuberculosis among others, and cytology, microbiology and cause-directed studies are all still pending. The pattern diagnoses nothing.');
  if (patient.evaluationAtTick === null) return prompt('effusion-evaluation', true,
    'Give the pending results and the next step an owner before she leaves the room.',
    'Cytology and microbiology come back to somebody, and a lymphocytic exudate with an unexplained six-week history usually needs more than one aspiration to settle — further imaging, possibly a tissue diagnosis, and a pleural service that keeps hold of her. This is the point at which a patient who feels much better after 850 mL quietly becomes a patient nobody is following up.');
  return prompt('effusion-handoff', true,
    'Hand off a symptom that improved and a cause that has not been found.',
    'Nothing here establishes complete drainage, a diagnosis, a disposition or an outcome. What travels is the six-week trajectory, the terms the aspiration was requested on, the checkpoint as a case fact, the exudative classification and what it narrows rather than settles, the results still pending, and the named ownership for the evaluation that follows.');
}
