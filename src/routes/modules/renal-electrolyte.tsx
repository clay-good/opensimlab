/**
 * One clinical module's route. Each module lives in its own file so the bundler
 * can give it its own chunk: opening a scenario should download that module's
 * catalogue, not all thirteen. The shared frame, including the report control,
 * stays in ClinicalModuleRoute.
 */
import { ClinicalModuleRoute, type ClinicalModuleConfig } from '../AnesthesiaRoute';
import { DEFAULT_RENAL_ELECTROLYTE_SCENARIO_ID, RENAL_ELECTROLYTE_SCENARIOS, getRenalElectrolyteScenario } from '../../modules/renal-electrolyte/scenarios';
import { RENAL_ELECTROLYTE_LIMITATIONS } from '@platform/docs/limitations/renal-electrolyte';

const RENAL_ELECTROLYTE_CONFIG: ClinicalModuleConfig = {
  id: 'renal-electrolyte', basePath: '/renal-electrolyte',
  heading: 'Renal and Electrolyte Medicine simulator',
  limitations: RENAL_ELECTROLYTE_LIMITATIONS,
  catalogIntroduction: 'Calm kidney and electrolyte rehearsals for protecting the person while following the trajectory. Distinguish immediate protection from correction, reassess what changed, and keep recurrent risk visible.',
  catalogStatus: `${RENAL_ELECTROLYTE_SCENARIOS.length} of 12 planned Renal and Electrolyte Medicine labs are available as previews. Registration does not establish completed review.`,
  scenarios: RENAL_ELECTROLYTE_SCENARIOS,
  defaultScenarioId: DEFAULT_RENAL_ELECTROLYTE_SCENARIO_ID,
  getScenario: getRenalElectrolyteScenario,
};

export function RenalElectrolyteRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={RENAL_ELECTROLYTE_CONFIG} />;
}
