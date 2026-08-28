/**
 * One clinical module's route. Each module lives in its own file so the bundler
 * can give it its own chunk: opening a scenario should download that module's
 * catalogue, not all thirteen. The shared frame, including the report control,
 * stays in ClinicalModuleRoute.
 */
import { ClinicalModuleRoute, type ClinicalModuleConfig } from '../AnesthesiaRoute';
import { DEFAULT_NEONATOLOGY_SCENARIO_ID, NEONATOLOGY_SCENARIOS, getNeonatologyScenario } from '../../modules/neonatology/scenarios';

const NEONATOLOGY_CONFIG: ClinicalModuleConfig = {
  id: 'neonatology', basePath: '/neonatology', heading: 'Neonatology simulator',
  catalogIntroduction: 'Quiet newborn rehearsals for protecting transition, noticing change early, and keeping the parent-newborn dyad at the center of every handoff.',
  catalogStatus: `${NEONATOLOGY_SCENARIOS.length} of 11 bounded Neonatology labs is playable.`,
  scenarios: NEONATOLOGY_SCENARIOS, defaultScenarioId: DEFAULT_NEONATOLOGY_SCENARIO_ID,
  getScenario: getNeonatologyScenario,
};

export function NeonatologyRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={NEONATOLOGY_CONFIG} />;
}
