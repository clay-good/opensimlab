/**
 * One clinical module's route. Each module lives in its own file so the bundler
 * can give it its own chunk: opening a scenario should download that module's
 * catalogue, not all thirteen. The shared frame, including the report control,
 * stays in ClinicalModuleRoute.
 */
import { ClinicalModuleRoute, type ClinicalModuleConfig } from '../AnesthesiaRoute';
import { DEFAULT_INFECTIOUS_DISEASE_SCENARIO_ID, INFECTIOUS_DISEASE_SCENARIOS, getInfectiousDiseaseScenario } from '../../modules/infectious-disease/scenarios';

const INFECTIOUS_DISEASE_CONFIG: ClinicalModuleConfig = {
  id: 'infectious-disease', basePath: '/infectious-disease',
  heading: 'Infectious disease simulator',
  catalogIntroduction: 'Calm infection rehearsals for seeing the dangerous pattern early and acting on it in time. Recognize without closing the diagnosis, activate the right people, and keep the treatment boundary and the unresolved risk visible.',
  catalogStatus: `${INFECTIOUS_DISEASE_SCENARIOS.length} of 10 planned Infectious disease labs are available as previews. Registration does not establish completed review.`,
  scenarios: INFECTIOUS_DISEASE_SCENARIOS,
  defaultScenarioId: DEFAULT_INFECTIOUS_DISEASE_SCENARIO_ID,
  getScenario: getInfectiousDiseaseScenario,
};

export function InfectiousDiseaseRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={INFECTIOUS_DISEASE_CONFIG} />;
}
