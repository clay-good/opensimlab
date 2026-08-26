import type { Scenario } from '@anesthesia/scenarios/types';
import { CARBON_MONOXIDE_REASSURING_MONITOR } from './carbon-monoxide-reassuring-monitor';
import { ACETAMINOPHEN_CLOCK_AND_NOMOGRAM } from './acetaminophen-clock-and-nomogram';
import { METHEMOGLOBINEMIA_SATURATION_GAP } from './methemoglobinemia-saturation-gap';
import { SALICYLATE_FALLING_NUMBER } from './salicylate-falling-number';
import { TRICYCLIC_SODIUM_CHANNEL_CARDIOTOXICITY } from './tricyclic-sodium-channel-cardiotoxicity';
import { BETA_BLOCKER_CARDIOGENIC_SHOCK } from './beta-blocker-cardiogenic-shock';
import { CALCIUM_CHANNEL_BLOCKER_SHOCK } from './calcium-channel-blocker-shock';
import { DIGOXIN_RHYTHM_POTASSIUM } from './digoxin-rhythm-potassium';
import { CHOLINERGIC_PESTICIDE_RESPIRATORY_FAILURE } from './cholinergic-pesticide-respiratory-failure';
import { ANTICHOLINERGIC_HYPERTHERMIA_DELIRIUM } from './anticholinergic-hyperthermia-delirium';
import { SEROTONIN_TOXICITY_HYPERTHERMIA_CLONUS } from './serotonin-toxicity-hyperthermia-clonus';
import { SYMPATHOMIMETIC_HYPERADRENERGIC_HYPERTHERMIA } from './sympathomimetic-hyperadrenergic-hyperthermia';
import { METHANOL_VISUAL_ACIDOSIS_GAPS } from './methanol-visual-acidosis-gaps';
import { DELAYED_LOCAL_ANESTHETIC_CNS_CARDIAC_TOXICITY } from './delayed-local-anesthetic-cns-cardiac-toxicity';
import { OPIOID_XYLAZINE_PERSISTENT_SEDATION } from './opioid-xylazine-persistent-sedation';

export const TOXICOLOGY_SCENARIOS: readonly Scenario[] = [
  METHEMOGLOBINEMIA_SATURATION_GAP,
  CARBON_MONOXIDE_REASSURING_MONITOR,
  ACETAMINOPHEN_CLOCK_AND_NOMOGRAM,
  SALICYLATE_FALLING_NUMBER,
  TRICYCLIC_SODIUM_CHANNEL_CARDIOTOXICITY,
  BETA_BLOCKER_CARDIOGENIC_SHOCK,
  CALCIUM_CHANNEL_BLOCKER_SHOCK,
  DIGOXIN_RHYTHM_POTASSIUM,
  CHOLINERGIC_PESTICIDE_RESPIRATORY_FAILURE,
  ANTICHOLINERGIC_HYPERTHERMIA_DELIRIUM,
  SEROTONIN_TOXICITY_HYPERTHERMIA_CLONUS,
  SYMPATHOMIMETIC_HYPERADRENERGIC_HYPERTHERMIA,
  METHANOL_VISUAL_ACIDOSIS_GAPS,
  DELAYED_LOCAL_ANESTHETIC_CNS_CARDIAC_TOXICITY,
  OPIOID_XYLAZINE_PERSISTENT_SEDATION,
];
export const DEFAULT_TOXICOLOGY_SCENARIO_ID = METHEMOGLOBINEMIA_SATURATION_GAP.metadata.id;

export function getToxicologyScenario(id: string): Scenario | undefined {
  return TOXICOLOGY_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
