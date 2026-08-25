import type { Scenario } from '@anesthesia/scenarios/types';
import { ARDS_LUNG_PROTECTIVE_VENTILATION } from './ards-lung-protective-ventilation';
import { ESCALATING_HYPOXEMIA } from './escalating-hypoxemia';
import { VENTILATOR_DYSSYNCHRONY } from './ventilator-dyssynchrony';
import { AUTO_PEEP } from './auto-peep';
import { MUCUS_PLUGGING } from './mucus-plugging';
import { UNPLANNED_EXTUBATION } from './unplanned-extubation';
import { SPONTANEOUS_BREATHING_TRIAL } from './spontaneous-breathing-trial';
import { POST_INTUBATION_HYPOTENSION } from './post-intubation-hypotension';
import { CARDIOGENIC_SHOCK } from './cardiogenic-shock';
import { MIXED_SHOCK } from './mixed-shock';
import { RIGHT_VENTRICULAR_FAILURE } from './right-ventricular-failure';
import { MASSIVE_PULMONARY_EMBOLISM } from './massive-pulmonary-embolism';
import { UPPER_GI_HEMORRHAGE } from './upper-gi-hemorrhage';
import { STATUS_EPILEPTICUS } from './status-epilepticus';
import { TARGETED_TEMPERATURE_MANAGEMENT } from './targeted-temperature-management';
import { INTRACRANIAL_HYPERTENSION } from './intracranial-hypertension';
import { ACUTE_KIDNEY_INJURY_WITH_FLUID_OVERLOAD } from './acute-kidney-injury-with-fluid-overload';
import { SEVERE_ACIDEMIA } from './severe-acidemia';
import { ICU_HANDOFF_WITH_HIDDEN_DETERIORATION } from './icu-handoff-with-hidden-deterioration';
import { VENTILATOR_CIRCUIT_DISCONNECTION } from './ventilator-circuit-disconnection';
import { DELAYED_VASOPRESSOR_DELIVERY } from './delayed-vasopressor-delivery';
import { PULSE_OXIMETER_MOTION_ARTIFACT } from './pulse-oximeter-motion-artifact';
import { ENDOTRACHEAL_TUBE_MIGRATION_AFTER_REPOSITIONING } from './endotracheal-tube-migration-after-repositioning';

export const CRITICAL_CARE_SCENARIOS: readonly Scenario[] = [
  ARDS_LUNG_PROTECTIVE_VENTILATION,
  ESCALATING_HYPOXEMIA,
  VENTILATOR_DYSSYNCHRONY,
  AUTO_PEEP,
  MUCUS_PLUGGING,
  UNPLANNED_EXTUBATION,
  SPONTANEOUS_BREATHING_TRIAL,
  POST_INTUBATION_HYPOTENSION,
  CARDIOGENIC_SHOCK,
  MIXED_SHOCK,
  RIGHT_VENTRICULAR_FAILURE,
  MASSIVE_PULMONARY_EMBOLISM,
  UPPER_GI_HEMORRHAGE,
  STATUS_EPILEPTICUS,
  TARGETED_TEMPERATURE_MANAGEMENT,
  INTRACRANIAL_HYPERTENSION,
  ACUTE_KIDNEY_INJURY_WITH_FLUID_OVERLOAD,
  SEVERE_ACIDEMIA,
  ICU_HANDOFF_WITH_HIDDEN_DETERIORATION,
  VENTILATOR_CIRCUIT_DISCONNECTION,
  DELAYED_VASOPRESSOR_DELIVERY,
  PULSE_OXIMETER_MOTION_ARTIFACT,
  ENDOTRACHEAL_TUBE_MIGRATION_AFTER_REPOSITIONING,
];
export const DEFAULT_CRITICAL_CARE_SCENARIO_ID = ARDS_LUNG_PROTECTIVE_VENTILATION.metadata.id;

export function getCriticalCareScenario(id: string): Scenario | undefined {
  return CRITICAL_CARE_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
