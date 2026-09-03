import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsHerniation, type HerniationAction, type HerniationProgress,
} from '../acute-transtentorial-herniation-pattern';
import { herniationInlinePrompt } from '../tutor/acute-transtentorial-herniation-pattern-guidance';


/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: HerniationProgress): string {
  const prompt = herniationInlinePrompt('guided', { scenarioVersion: '0.1.0', herniation: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const HERNIATION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsHerniationDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsHerniation(scenario);
}

export interface HerniationDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: HerniationAction; readonly finished?: boolean;
}

/**
 * The worked example for a pattern that assembled in twelve minutes.
 *
 * Nothing here is waiting to be confirmed. The consciousness, the pupil and the
 * motor response all changed together, and that convergence is the diagnosis:
 * an isolated blown pupil is not, and a complete Cushing triad is not required,
 * so watching for the respiratory irregularity that has not arrived is just
 * watching. The CT was taken before the decline, which makes it context rather
 * than a current picture. This example calculates no score, interprets no
 * imaging, performs no airway procedure, and selects no drug, dose, or
 * operation.
 */
export function herniationDemonstrationStep(
  patient?: HerniationProgress,
): HerniationDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He is handed on with everything started and nothing yet achieved. Nothing was proven and nothing was excluded — not the rescue, not the pressure, not whether the pupil ever comes back. This ends the example, not the emergency.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-neurology-herniation-clock-consciousness-pupils-motor-physiology-and-whole-patient',
      narration: narrate(patient) };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'actions', progress: 0.26, action: 'recognize-neurology-converging-transtentorial-herniation-pattern-without-isolated-pupil-or-complete-triad',
      narration: 'Name it now, and do not wait for the sign that has not arrived. The bradycardia and the hypertension reinforce this and the respiratory irregularity is not required — a complete Cushing triad is a description of how bad things get, not a threshold for acting. An isolated anisocoria would not be enough on its own and neither would the imaging; what makes this the emergency is the convergence already visible. Waiting for one more feature is the only decision here that cannot be taken back.' };
  }
  if (patient.ownershipAtTick === null) {
    return { id: 'ownership', focus: 'actions', progress: 0.46, action: 'activate-neurology-herniation-qualified-airway-neurocritical-neurosurgical-and-brain-rescue-ownership',
      narration: narrate(patient) };
  }
  if (patient.boundaryAtTick === null) {
    return { id: 'boundary', focus: 'monitor', progress: 0.64, action: 'review-neurology-herniation-immediate-systemic-brain-rescue-imaging-and-definitive-source-control-boundary',
      narration: 'Read the CT as context, and notice when it was taken. It reports a 5.2 cm right temporal mass, extensive vasogenic edema, 13 mm of leftward midline shift, effaced right basal cisterns and medial displacement of the uncus — obtained immediately before the steep decline, so it describes the situation he was in rather than the one he is in. Systemic brain protection and expert-selected osmotic rescue are individualized decisions for the teams already called, and definitive source control is the actual treatment. Repeat imaging does not come before any of it.' };
  }
  if (patient.laterAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.82, action: 'review-neurology-herniation-strict-later-qualified-rescue-and-unresolved-neurologic-trajectory',
      narration: 'Let the authored interval pass and read the qualified team’s 15-minute report. The interval is a contrast rather than a required wait, and nothing here says what any individual patient does next.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-neurology-herniation-lesion-airway-pressure-seizure-surgery-and-active-risk',
    narration: 'The airway is secured with bilateral ventilation, an end-tidal of 36 and a saturation of 99%; brain-rescue care has been given; the operating-room pathway is running; the rate is 68 and the pressure 158/88. And the right pupil is still 6 mm and nonreactive, with no neurological recovery reported. Everything that could be started has been started and none of it has worked yet, so hand off the lesion, the consciousness and pupil trajectory, the airway, the pressure strategy, the seizure risk and the surgery.' };
}
