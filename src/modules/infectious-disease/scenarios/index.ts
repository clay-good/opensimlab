import type { Scenario } from '@anesthesia/scenarios/types';
import { MENINGOCOCCAL_SEPSIS_RECOGNITION_AND_ESCALATION } from './meningococcal-sepsis-recognition-and-escalation';
import { OBSTRUCTED_INFECTED_KIDNEY_DECOMPRESSION } from './obstructed-infected-kidney-decompression';
import { FEBRILE_NEUTROPENIA_BLIND_EXAMINATION } from './febrile-neutropenia-blind-examination';
import { NECROTIZING_INFECTION_SCORE_CANNOT_EXCLUDE } from './necrotizing-infection-score-cannot-exclude';
import { ENDOCARDITIS_MECHANICAL_FAILURE_ON_A_SURGICAL_CLOCK } from './endocarditis-mechanical-failure-on-a-surgical-clock';

export const INFECTIOUS_DISEASE_SCENARIOS: readonly Scenario[] = [MENINGOCOCCAL_SEPSIS_RECOGNITION_AND_ESCALATION, OBSTRUCTED_INFECTED_KIDNEY_DECOMPRESSION, FEBRILE_NEUTROPENIA_BLIND_EXAMINATION, NECROTIZING_INFECTION_SCORE_CANNOT_EXCLUDE, ENDOCARDITIS_MECHANICAL_FAILURE_ON_A_SURGICAL_CLOCK];
export const DEFAULT_INFECTIOUS_DISEASE_SCENARIO_ID = MENINGOCOCCAL_SEPSIS_RECOGNITION_AND_ESCALATION.metadata.id;

export function getInfectiousDiseaseScenario(id: string): Scenario | undefined {
  return INFECTIOUS_DISEASE_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
