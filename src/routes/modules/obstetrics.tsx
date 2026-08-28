/**
 * One clinical module's route. Each module lives in its own file so the bundler
 * can give it its own chunk: opening a scenario should download that module's
 * catalogue, not all thirteen. The shared frame, including the report control,
 * stays in ClinicalModuleRoute.
 */
import { ClinicalModuleRoute, type ClinicalModuleConfig } from '../AnesthesiaRoute';
import { DEFAULT_OBSTETRICS_SCENARIO_ID, OBSTETRICS_SCENARIOS, getObstetricsScenario } from '../../modules/obstetrics/scenarios';

const OBSTETRICS_CONFIG: ClinicalModuleConfig = {
  id: 'obstetrics', basePath: '/obstetrics', heading: 'Obstetrics simulator',
  catalogIntroduction: 'Calm delivery-room rehearsals for recognizing change early, bringing the right team together, and protecting the whole family through reassessment and handoff.',
  catalogStatus: `${OBSTETRICS_SCENARIOS.length} of 15 bounded Obstetrics labs is playable.`,
  scenarios: OBSTETRICS_SCENARIOS, defaultScenarioId: DEFAULT_OBSTETRICS_SCENARIO_ID,
  getScenario: getObstetricsScenario,
};

export function ObstetricsRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={OBSTETRICS_CONFIG} />;
}
