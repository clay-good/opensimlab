/**
 * One clinical module's route. Each module lives in its own file so the bundler
 * can give it its own chunk: opening a scenario should download that module's
 * catalogue, not all fifteen. The shared frame, including the report control,
 * stays in ClinicalModuleRoute.
 */
import { ClinicalModuleRoute, type ClinicalModuleConfig } from '../AnesthesiaRoute';
import { DEFAULT_ONCOLOGY_SCENARIO_ID, ONCOLOGY_SCENARIOS, getOncologyScenario } from '../../modules/oncology/scenarios';

const ONCOLOGY_CONFIG: ClinicalModuleConfig = {
  id: 'oncology', basePath: '/oncology',
  heading: 'Oncology simulator',
  catalogIntroduction: 'Rehearsals for the part of cancer care that happens away from the oncology clinic: a treatment exposure that has already stopped, a complication that arrives without its label, and a decision that belongs to the team holding the record.',
  // "1 ... are available" reads as a typo on a module that has just opened with one lab.
  catalogStatus: `${ONCOLOGY_SCENARIOS.length} of 11 planned Oncology labs ${ONCOLOGY_SCENARIOS.length === 1 ? 'is' : 'are'} available as previews. Registration does not establish completed review.`,
  scenarios: ONCOLOGY_SCENARIOS,
  defaultScenarioId: DEFAULT_ONCOLOGY_SCENARIO_ID,
  getScenario: getOncologyScenario,
};

export function OncologyRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={ONCOLOGY_CONFIG} />;
}
