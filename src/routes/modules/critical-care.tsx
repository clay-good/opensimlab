/**
 * One clinical module's route. Each module lives in its own file so the bundler
 * can give it its own chunk: opening a scenario should download that module's
 * catalogue, not all thirteen. The shared frame, including the report control,
 * stays in ClinicalModuleRoute.
 */
import { ClinicalModuleRoute, type ClinicalModuleConfig } from '../AnesthesiaRoute';
import { CRITICAL_CARE_SCENARIOS, DEFAULT_CRITICAL_CARE_SCENARIO_ID, getCriticalCareScenario } from '../../modules/critical-care/scenarios';
import { CRITICAL_CARE_LIMITATIONS } from '@platform/docs/limitations/critical-care';
import { CRITICAL_CARE_TRAYS } from '../../modules/critical-care/trays';
import { CRITICAL_CARE_DEMONSTRATIONS } from '../../modules/critical-care/demo/demonstrations';

const CRITICAL_CARE_CONFIG: ClinicalModuleConfig = {
  id: 'critical-care', basePath: '/critical-care', heading: 'Critical care simulator',
  limitations: CRITICAL_CARE_LIMITATIONS,
  catalogIntroduction: 'Quiet ICU rehearsals for the decisions that change organ support. Read the trend, make one purposeful change, then reassess what actually moved.',
  catalogStatus: 'Twenty-four bounded critical care labs are playable.',
  trays: CRITICAL_CARE_TRAYS,
  scenarios: CRITICAL_CARE_SCENARIOS, defaultScenarioId: DEFAULT_CRITICAL_CARE_SCENARIO_ID,
  getScenario: getCriticalCareScenario,
  demonstrations: CRITICAL_CARE_DEMONSTRATIONS,
};

export function CriticalCareRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={CRITICAL_CARE_CONFIG} />;
}
