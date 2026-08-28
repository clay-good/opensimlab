/**
 * One clinical module's route. Each module lives in its own file so the bundler
 * can give it its own chunk: opening a scenario should download that module's
 * catalogue, not all thirteen. The shared frame, including the report control,
 * stays in ClinicalModuleRoute.
 */
import { ClinicalModuleRoute, type ClinicalModuleConfig } from '../AnesthesiaRoute';
import { DEFAULT_TOXICOLOGY_SCENARIO_ID, TOXICOLOGY_SCENARIOS, getToxicologyScenario } from '../../modules/toxicology/scenarios';

const TOXICOLOGY_CONFIG: ClinicalModuleConfig = {
  id: 'toxicology', basePath: '/toxicology', heading: 'Toxicology simulator',
  catalogIntroduction: 'Calm poisoning rehearsals for finding the dangerous pattern without losing the whole patient. Support first, keep antidote hazards visible, and make reassessment count.',
  catalogStatus: `${TOXICOLOGY_SCENARIOS.length} of 15 bounded Toxicology labs is playable.`,
  scenarios: TOXICOLOGY_SCENARIOS, defaultScenarioId: DEFAULT_TOXICOLOGY_SCENARIO_ID,
  getScenario: getToxicologyScenario,
};

export function ToxicologyRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={TOXICOLOGY_CONFIG} />;
}
