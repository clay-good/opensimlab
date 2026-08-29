/**
 * One clinical module's route. Each module lives in its own file so the bundler
 * can give it its own chunk: opening a scenario should download that module's
 * catalogue, not all thirteen. The shared frame, including the report control,
 * stays in ClinicalModuleRoute.
 */
import { ClinicalModuleRoute, type ClinicalModuleConfig } from '../AnesthesiaRoute';
import { CARDIOLOGY_SCENARIOS, DEFAULT_CARDIOLOGY_SCENARIO_ID, getCardiologyScenario } from '../../modules/cardiology/scenarios';
import { CARDIOLOGY_LIMITATIONS } from '@platform/docs/limitations/cardiology';

const CARDIOLOGY_CONFIG: ClinicalModuleConfig = {
  id: 'cardiology', basePath: '/cardiology', heading: 'Cardiology simulator',
  limitations: CARDIOLOGY_LIMITATIONS,
  catalogIntroduction: 'Calm cardiovascular rehearsals from clinic to inpatient care. Read the trajectory, surface what remains, and make each next step earn its place.',
  catalogStatus: 'All seventeen bounded cardiology labs are playable.',
  scenarios: CARDIOLOGY_SCENARIOS, defaultScenarioId: DEFAULT_CARDIOLOGY_SCENARIO_ID,
  getScenario: getCardiologyScenario,
};

export function CardiologyRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={CARDIOLOGY_CONFIG} />;
}
