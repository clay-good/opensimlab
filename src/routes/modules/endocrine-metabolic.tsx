/**
 * One clinical module's route. Each module lives in its own file so the bundler
 * can give it its own chunk: opening a scenario should download that module's
 * catalogue, not all thirteen. The shared frame, including the report control,
 * stays in ClinicalModuleRoute.
 */
import { ClinicalModuleRoute, type ClinicalModuleConfig } from '../AnesthesiaRoute';
import { DEFAULT_ENDOCRINE_METABOLIC_SCENARIO_ID, ENDOCRINE_METABOLIC_SCENARIOS, getEndocrineMetabolicScenario } from '../../modules/endocrine-metabolic/scenarios';
import { ENDOCRINE_METABOLIC_LIMITATIONS } from '@platform/docs/limitations/endocrine-metabolic';

const ENDOCRINE_METABOLIC_CONFIG: ClinicalModuleConfig = {
  id: 'endocrine-metabolic', basePath: '/endocrine-metabolic',
  heading: 'Endocrine and metabolic medicine simulator',
  limitations: ENDOCRINE_METABOLIC_LIMITATIONS,
  catalogIntroduction: 'Calm metabolic rehearsals for reading the biochemical trajectory without losing the whole person. Keep treatment continuity, transition safety, and recurrence prevention visible.',
  catalogStatus: `${ENDOCRINE_METABOLIC_SCENARIOS.length} of 12 planned Endocrine and Metabolic Medicine labs are available as previews. Registration does not establish completed review.`,
  scenarios: ENDOCRINE_METABOLIC_SCENARIOS,
  defaultScenarioId: DEFAULT_ENDOCRINE_METABOLIC_SCENARIO_ID,
  getScenario: getEndocrineMetabolicScenario,
};

export function EndocrineMetabolicRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={ENDOCRINE_METABOLIC_CONFIG} />;
}
