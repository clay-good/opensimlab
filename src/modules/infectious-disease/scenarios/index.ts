import type { Scenario } from '@anesthesia/scenarios/types';
import { MENINGOCOCCAL_SEPSIS_RECOGNITION_AND_ESCALATION } from './meningococcal-sepsis-recognition-and-escalation';
import { OBSTRUCTED_INFECTED_KIDNEY_DECOMPRESSION } from './obstructed-infected-kidney-decompression';
import { FEBRILE_NEUTROPENIA_BLIND_EXAMINATION } from './febrile-neutropenia-blind-examination';
import { NECROTIZING_INFECTION_SCORE_CANNOT_EXCLUDE } from './necrotizing-infection-score-cannot-exclude';
import { ENDOCARDITIS_MECHANICAL_FAILURE_ON_A_SURGICAL_CLOCK } from './endocarditis-mechanical-failure-on-a-surgical-clock';
import { SEVERE_PNEUMONIA_THE_SCORE_ANSWERED_ANOTHER_QUESTION } from './severe-pneumonia-the-score-answered-another-question';
import { TOXIC_SHOCK_A_DEFINITION_THAT_CANNOT_CLOSE } from './toxic-shock-a-definition-that-cannot-close';
import { POSSIBLE_SEPSIS_A_CLOCK_THAT_RUNS_EITHER_WAY } from './possible-sepsis-a-clock-that-runs-either-way';
import { SEPTIC_SHOCK_A_LABEL_THE_TREATMENT_CREATES } from './septic-shock-a-label-the-treatment-creates';
import { MENINGITIS_IMAGING_A_RULE_THAT_DOES_NOT_AGREE } from './meningitis-imaging-a-rule-that-does-not-agree';

export const INFECTIOUS_DISEASE_SCENARIOS: readonly Scenario[] = [MENINGOCOCCAL_SEPSIS_RECOGNITION_AND_ESCALATION, OBSTRUCTED_INFECTED_KIDNEY_DECOMPRESSION, FEBRILE_NEUTROPENIA_BLIND_EXAMINATION, NECROTIZING_INFECTION_SCORE_CANNOT_EXCLUDE, ENDOCARDITIS_MECHANICAL_FAILURE_ON_A_SURGICAL_CLOCK, SEVERE_PNEUMONIA_THE_SCORE_ANSWERED_ANOTHER_QUESTION, TOXIC_SHOCK_A_DEFINITION_THAT_CANNOT_CLOSE, POSSIBLE_SEPSIS_A_CLOCK_THAT_RUNS_EITHER_WAY, SEPTIC_SHOCK_A_LABEL_THE_TREATMENT_CREATES, MENINGITIS_IMAGING_A_RULE_THAT_DOES_NOT_AGREE];
export const DEFAULT_INFECTIOUS_DISEASE_SCENARIO_ID = MENINGOCOCCAL_SEPSIS_RECOGNITION_AND_ESCALATION.metadata.id;

export function getInfectiousDiseaseScenario(id: string): Scenario | undefined {
  return INFECTIOUS_DISEASE_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
