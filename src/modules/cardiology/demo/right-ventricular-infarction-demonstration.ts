import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsRightVentricularInfarction, type RightVentricularInfarctionAction,
  type RightVentricularInfarctionProgress,
} from '../right-ventricular-infarction';
import { rightVentricularInfarctionInlinePrompt } from '../tutor/right-ventricular-infarction-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied. Every lesson's prose used to ship twice inside the
 * cockpit bundle — once in the tutor and once as a duplicated string literal
 * here — and gzip cannot reach across that distance to dedupe it. Deriving it
 * also makes "the two cannot drift apart" structural rather than a property
 * maintained by regenerating this file.
 */
function narrate(patient: RightVentricularInfarctionProgress): string {
  const prompt = rightVentricularInfarctionInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const RIGHT_VENTRICULAR_INFARCTION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsRightVentricularInfarctionDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsRightVentricularInfarction(scenario);
}

export interface RightVentricularInfarctionDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: RightVentricularInfarctionAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a low pressure that must not be treated the usual way.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. Where the pair is unordered the example takes the reperfusion
 * lane first and reviews the phenotype second — a choice, and a pointed one,
 * because the interesting half is the half that quietly consumes the time the
 * other half does not have. It examines nobody, acquires or interprets no ECG,
 * echo, monitoring, laboratory or catheter data, diagnoses no real patient,
 * prescribes or delivers no fluid, nitrate, diuretic, vasopressor, inotrope,
 * antithrombotic, oxygen or other treatment, performs no PCI or other
 * procedure, determines no disposition, and predicts no outcome.
 */
export function rightVentricularInfarctionDemonstrationStep(
  patient?: RightVentricularInfarctionProgress,
): RightVentricularInfarctionDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He is unchanged, and unchanged is the honest word: no nitrate, no diuretic, no fluid volume, no target, no reperfusion completed and nothing delivered. What this review produced was a reason not to give him the two drugs a hypotensive man with chest pain usually gets, and a record showing the right-sided thinking never stood in front of the clock. This ends the example, not the evaluation.' };
  }
  if (patient.reconciledAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.12, action: 'reconcile-right-ventricular-infarction',
      narration: narrate(patient) };
  }
  if (patient.reperfusionAtTick === null) {
    return { id: 'parallel', focus: 'actions', progress: 0.3, action: 'preserve-right-ventricular-infarction-reperfusion',
      narration: narrate(patient) };
  }
  if (patient.phenotypeAtTick === null) {
    return { id: 'phenotype', focus: 'monitor', progress: 0.5, action: 'review-right-ventricular-infarction-phenotype',
      narration: narrate(patient) };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.72, action: 'record-right-ventricular-infarction-support',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-right-ventricular-infarction',
    narration: narrate(patient) };
}
