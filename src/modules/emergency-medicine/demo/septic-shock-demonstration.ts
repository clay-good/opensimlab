import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import { supportsSepticShock, type SepticShockAction, type SepticShockProgress } from '../septic-shock';
import { septicShockInlinePrompt } from '../tutor/septic-shock-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: SepticShockProgress): string {
  const prompt = septicShockInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const SEPTIC_SHOCK_DEMONSTRATION_VERSION = '0.1.0';

export function supportsSepticShockDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsSepticShock(scenario);
}

export interface SepticShockDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: SepticShockAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a bundle that is not a queue.
 *
 * Seven beats. The engine enforces two short chains and leaves source control
 * free, so the order here is partly enforced and partly chosen. It examines
 * nobody, draws no specimen, selects no agent or dose, hangs no fluid, sets up
 * no pump, images nothing, drains nothing, and predicts no outcome.
 */
export function septicShockDemonstrationStep(
  patient?: SepticShockProgress,
): SepticShockDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.sourceControlEscalationAtTick !== null) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'The step this example put last is the one the engine never made wait. Source control has been available since the first review — it is gated by nothing else — and a run that records the cultures, the antibiotic, the fluid, the reassessment and the pressor in perfect order and simply never escalates the obstructed system is refused by nothing at all. That is the trap: sepsis care is taught as a list, lists get worked through in order, and pus under pressure keeps seeding a bloodstream while somebody supports the blood pressure. Antibiotics treat the bacteria already loose; only drainage stops more arriving. Nothing here was drawn, dosed, hung, titrated, imaged or drained. This ends the example, not the evaluation.' };
  }
  if (patient.infectionAndOrganDysfunctionReviewedAtTick === null) {
    return { id: 'review', focus: 'monitor', progress: 0.1,
      action: 'review-infection-and-organ-dysfunction', narration: narrate(patient) };
  }
  if (patient.culturesAndLactateAtTick === null) {
    return { id: 'cultures', focus: 'actions', progress: 0.24,
      action: 'obtain-cultures-and-lactate', narration: narrate(patient) };
  }
  if (patient.antimicrobialIntentAtTick === null) {
    return { id: 'antimicrobial', focus: 'actions', progress: 0.38,
      action: 'record-immediate-antimicrobial-intent', narration: narrate(patient) };
  }
  if (patient.initialCrystalloidAtTick === null) {
    return { id: 'fluid', focus: 'actions', progress: 0.52,
      action: 'begin-initial-crystalloid', narration: narrate(patient) };
  }
  if (patient.postFluidReassessmentAtTick === null) {
    return { id: 'reassess', focus: 'monitor', progress: 0.66,
      action: 'reassess-after-initial-fluid', narration: narrate(patient) };
  }
  if (patient.norepinephrineIntentAtTick === null) {
    return { id: 'norepinephrine', focus: 'actions', progress: 0.8,
      action: 'start-norepinephrine-intent', narration: narrate(patient) };
  }
  return { id: 'source', focus: 'actions', progress: 0.93,
    action: 'escalate-source-control', narration: narrate(patient) };
}
