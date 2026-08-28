/**
 * One clinical module's route. Each module lives in its own file so the bundler
 * can give it its own chunk: opening a scenario should download that module's
 * catalogue, not all thirteen. The shared frame, including the report control,
 * stays in ClinicalModuleRoute.
 */
import { ClinicalModuleRoute, type ClinicalModuleConfig } from '../AnesthesiaRoute';
import { DEFAULT_RESPIRATORY_MEDICINE_SCENARIO_ID, RESPIRATORY_MEDICINE_SCENARIOS, getRespiratoryMedicineScenario } from '../../modules/respiratory-medicine/scenarios';

const RESPIRATORY_MEDICINE_CONFIG: ClinicalModuleConfig = {
  id: 'respiratory-medicine', basePath: '/respiratory-medicine',
  heading: 'Respiratory medicine simulator',
  catalogIntroduction: 'Calm respiratory reassessment labs for the moment a familiar pattern changes. Read the trajectory, act on danger early, and leave the next team a clear map.',
  catalogStatus: `${RESPIRATORY_MEDICINE_SCENARIOS.length} bounded respiratory medicine labs are playable.`,
  scenarios: RESPIRATORY_MEDICINE_SCENARIOS,
  defaultScenarioId: DEFAULT_RESPIRATORY_MEDICINE_SCENARIO_ID,
  getScenario: getRespiratoryMedicineScenario,
};

export function RespiratoryMedicineRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={RESPIRATORY_MEDICINE_CONFIG} />;
}
