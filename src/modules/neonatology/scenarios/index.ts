import type { Scenario } from '@anesthesia/scenarios/types';
import { TERM_NEWBORN_TRANSITION } from './term-newborn-transition';
import { NEONATAL_APNEA } from './neonatal-apnea';
import { INEFFECTIVE_VENTILATION_CORRECTION } from './ineffective-ventilation-correction';
import { NEONATAL_BRADYCARDIA } from './neonatal-bradycardia';
import { MECONIUM_STAINED_TRANSITION } from './meconium-stained-transition';
import { PRETERM_RESPIRATORY_DISTRESS } from './preterm-respiratory-distress';
import { NEONATAL_HYPOGLYCEMIA } from './neonatal-hypoglycemia';
import { NEONATAL_SEPSIS } from './neonatal-sepsis';

export const NEONATOLOGY_SCENARIOS: readonly Scenario[] = [
  TERM_NEWBORN_TRANSITION,
  NEONATAL_APNEA,
  INEFFECTIVE_VENTILATION_CORRECTION,
  NEONATAL_BRADYCARDIA,
  MECONIUM_STAINED_TRANSITION,
  PRETERM_RESPIRATORY_DISTRESS,
  NEONATAL_HYPOGLYCEMIA,
  NEONATAL_SEPSIS,
];
export const DEFAULT_NEONATOLOGY_SCENARIO_ID = TERM_NEWBORN_TRANSITION.metadata.id;

export function getNeonatologyScenario(id: string): Scenario | undefined {
  return NEONATOLOGY_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
