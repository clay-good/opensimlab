import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsLargePleuralEffusion, type LargePleuralEffusionAction, type LargePleuralEffusionProgress,
} from '../large-unilateral-pleural-effusion-reassessment';

export const LARGE_PLEURAL_EFFUSION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsLargePleuralEffusionDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsLargePleuralEffusion(scenario);
}

export interface LargePleuralEffusionDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: LargePleuralEffusionAction; readonly finished?: boolean;
}

/**
 * The worked example for a number that is a case fact rather than a rule.
 *
 * 850 mL is what happened to this patient; the stop was symptom-led. This
 * example examines nobody, acquires and reads no imaging, ultrasound or fluid,
 * performs no thoracentesis, and selects no device, site or drainage volume.
 */
export function largePleuralEffusionDemonstrationStep(
  patient?: LargePleuralEffusionProgress,
): LargePleuralEffusionDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on breathing more easily, with a litre less fluid, an exudate that narrows nothing to a diagnosis, and results somebody else will read. Nothing was proven and nothing was performed. This ends the example, not the investigation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-large-unilateral-pleural-effusion-trajectory',
      narration: 'Read six weeks of decline against how she is right now. Progressive exertional dyspnea, a dry cough and left chest heaviness over six weeks, and she is now breathless crossing a room. Today she is alert in full sentences, 104 and 128/76, breathing at 26, 91% on room air, warm and refilling in two seconds, with markedly reduced left movement and basal air entry. There is no shock, no tension physiology, no fever, no edema pattern and no acute fatigue. This is a large problem that has arrived slowly, which is a different kind of urgency from the ones this module has been practising.' };
  }
  if (patient.intentAtTick === null) {
    return { id: 'intent', focus: 'actions', progress: 0.26, action: 'record-large-unilateral-pleural-effusion-pleural-team-and-drainage-intent',
      narration: 'Record what the pleural team is being asked to do, and on what terms. Image-guided aspiration by qualified operators, for diagnosis and slow symptom relief, with stop triggers that are symptom-led and no target volume set in advance. The terms are the substance here: an aspiration that stops when the patient tells you to is a different procedure from one that stops at a number, and writing down which one you are asking for is the step this lesson exists to record. The imaging supports it — a large, predominantly free-flowing collection with no dense septation and a suitable access window — but size and appearance establish neither urgency nor safety nor a cause.' };
  }
  if (patient.responseAtTick === null) {
    return { id: 'response', focus: 'monitor', progress: 0.46, action: 'review-large-unilateral-pleural-effusion-drainage-response',
      narration: 'Read the checkpoint as this case, and the volume as a fact rather than a target. 850 mL of amber fluid removed slowly, stopped when persistent cough and mild chest tightness developed. Her rate is 20, her saturation is 95%, and the heaviness is better; the radiograph shows a smaller residual effusion with improved expansion, no pneumothorax and no re-expansion edema pattern. The 850 mL is what happened, not a maximum to carry to the next patient — the stop was driven by her symptoms. None of this proves complete drainage or a cause.' };
  }
  if (patient.fluidAtTick === null) {
    return { id: 'fluid', focus: 'monitor', progress: 0.64, action: 'review-large-unilateral-pleural-effusion-fluid-pattern-and-causes',
      narration: 'Take the exudative classification as a narrowing, not an answer. A pleural protein of 4.2 against a serum 6.8, an LDH of 310 against a serum 420, a pH of 7.39, glucose 92, and a lymphocyte-predominant differential: the qualified laboratory reports this as exudative. That rules a transudate unlikely and rules nothing in. A lymphocytic exudate in a woman with six weeks of decline raises malignancy and tuberculosis among others, and cytology, microbiology and cause-directed studies are all still pending. The pattern diagnoses nothing.' };
  }
  if (patient.evaluationAtTick === null) {
    return { id: 'evaluation', focus: 'actions', progress: 0.82, action: 'coordinate-large-unilateral-pleural-effusion-definitive-evaluation',
      narration: 'Give the pending results and the next step an owner before she leaves the room. Cytology and microbiology come back to somebody, and a lymphocytic exudate with an unexplained six-week history usually needs more than one aspiration to settle — further imaging, possibly a tissue diagnosis, and a pleural service that keeps hold of her. This is the point at which a patient who feels much better after 850 mL quietly becomes a patient nobody is following up.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-large-unilateral-pleural-effusion-reassessment',
    narration: 'Hand off a symptom that improved and a cause that has not been found. Nothing here establishes complete drainage, a diagnosis, a disposition or an outcome. What travels is the six-week trajectory, the terms the aspiration was requested on, the checkpoint as a case fact, the exudative classification and what it narrows rather than settles, the results still pending, and the named ownership for the evaluation that follows.' };
}
