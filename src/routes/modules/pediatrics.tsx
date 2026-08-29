/**
 * One clinical module's route. Each module lives in its own file so the bundler
 * can give it its own chunk: opening a scenario should download that module's
 * catalogue, not all thirteen. The shared frame, including the report control,
 * stays in ClinicalModuleRoute.
 */
import { ClinicalModuleRoute, type ClinicalModuleConfig } from '../AnesthesiaRoute';
import { DEFAULT_PEDIATRICS_SCENARIO_ID, PEDIATRICS_SCENARIOS, getPediatricsScenario } from '../../modules/pediatrics/scenarios';
import { PEDIATRICS_LIMITATIONS } from '@platform/docs/limitations/pediatrics';

const PEDIATRICS_CONFIG: ClinicalModuleConfig = {
  id: 'pediatrics', basePath: '/pediatrics', heading: 'Pediatrics simulator',
  limitations: PEDIATRICS_LIMITATIONS,
  catalogIntroduction: 'Gentle, focused rehearsals for noticing when a child is changing. Read the whole child, support early, and make every reassessment count.',
  catalogStatus: `${PEDIATRICS_SCENARIOS.length} of 16 bounded Pediatrics labs is playable.`,
  scenarios: PEDIATRICS_SCENARIOS, defaultScenarioId: DEFAULT_PEDIATRICS_SCENARIO_ID,
  getScenario: getPediatricsScenario,
};

export function PediatricsRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={PEDIATRICS_CONFIG} />;
}
