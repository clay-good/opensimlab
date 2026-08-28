/**
 * One clinical module's route. Each module lives in its own file so the bundler
 * can give it its own chunk: opening a scenario should download that module's
 * catalogue, not all thirteen. The shared frame, including the report control,
 * stays in ClinicalModuleRoute.
 */
import { ClinicalModuleRoute, type ClinicalModuleConfig } from '../AnesthesiaRoute';
import { CRITICAL_CARE_SCENARIOS, DEFAULT_CRITICAL_CARE_SCENARIO_ID, getCriticalCareScenario } from '../../modules/critical-care/scenarios';

const CRITICAL_CARE_CONFIG: ClinicalModuleConfig = {
  id: 'critical-care', basePath: '/critical-care', heading: 'Critical care simulator',
  catalogIntroduction: 'Quiet ICU rehearsals for the decisions that change organ support. Read the trend, make one purposeful change, then reassess what actually moved.',
  catalogStatus: 'Twenty-four bounded critical care labs are playable.',
  scenarios: CRITICAL_CARE_SCENARIOS, defaultScenarioId: DEFAULT_CRITICAL_CARE_SCENARIO_ID,
  getScenario: getCriticalCareScenario,
};

export function CriticalCareRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={CRITICAL_CARE_CONFIG} />;
}
