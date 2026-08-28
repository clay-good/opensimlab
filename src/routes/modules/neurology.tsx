/**
 * One clinical module's route. Each module lives in its own file so the bundler
 * can give it its own chunk: opening a scenario should download that module's
 * catalogue, not all thirteen. The shared frame, including the report control,
 * stays in ClinicalModuleRoute.
 */
import { ClinicalModuleRoute, type ClinicalModuleConfig } from '../AnesthesiaRoute';
import { DEFAULT_NEUROLOGY_SCENARIO_ID, NEUROLOGY_SCENARIOS, getNeurologyScenario } from '../../modules/neurology/scenarios';

const NEUROLOGY_CONFIG: ClinicalModuleConfig = {
  id: 'neurology', basePath: '/neurology', heading: 'Neurology simulator',
  catalogIntroduction: 'Calm neurological rehearsals for reading function, change, and uncertainty. Follow the trajectory, involve the right team, and leave unresolved risk visible.',
  catalogStatus: `${NEUROLOGY_SCENARIOS.length} of 15 bounded Neurology labs is playable.`,
  scenarios: NEUROLOGY_SCENARIOS, defaultScenarioId: DEFAULT_NEUROLOGY_SCENARIO_ID,
  getScenario: getNeurologyScenario,
};

export function NeurologyRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={NEUROLOGY_CONFIG} />;
}
