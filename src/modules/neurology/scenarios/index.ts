import type { Scenario } from '@anesthesia/scenarios/types';
import { BASILAR_ARTERY_OCCLUSION_ESCALATION } from './basilar-artery-occlusion-escalation';
import { MINOR_NONDISABLING_ACUTE_ISCHEMIC_STROKE } from './minor-nondisabling-acute-ischemic-stroke';

export const NEUROLOGY_SCENARIOS: readonly Scenario[] = [
  MINOR_NONDISABLING_ACUTE_ISCHEMIC_STROKE,
  BASILAR_ARTERY_OCCLUSION_ESCALATION,
];
export const DEFAULT_NEUROLOGY_SCENARIO_ID = MINOR_NONDISABLING_ACUTE_ISCHEMIC_STROKE.metadata.id;

export function getNeurologyScenario(id: string): Scenario | undefined {
  return NEUROLOGY_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
