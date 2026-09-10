/**
 * One clinical module's route. Each module lives in its own file so the bundler
 * can give it its own chunk: opening a scenario should download that module's
 * catalogue, not all thirteen. The shared frame, including the report control,
 * stays in ClinicalModuleRoute.
 */
import { ClinicalModuleRoute, type ClinicalModuleConfig } from '../AnesthesiaRoute';
import { DEFAULT_SCENARIO_ID, getScenario, scenariosByDifficulty } from '@anesthesia/scenarios';
import { ANESTHESIA_LIMITATIONS } from '@platform/docs/limitations/anesthesia';
import { ANESTHESIA_TRAYS } from '@anesthesia/trays';

const ANESTHESIA_CONFIG: ClinicalModuleConfig = {
  id: 'anesthesia', basePath: '/anesthesia', heading: 'Anesthesia simulator',
  limitations: ANESTHESIA_LIMITATIONS,
  catalogIntroduction: '', catalogStatus: '',
  trays: ANESTHESIA_TRAYS,
  scenarios: scenariosByDifficulty(), defaultScenarioId: DEFAULT_SCENARIO_ID, getScenario,
};

export function AnesthesiaRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={ANESTHESIA_CONFIG} />;
}
