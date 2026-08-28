/**
 * One clinical module's route. Each module lives in its own file so the bundler
 * can give it its own chunk: opening a scenario should download that module's
 * catalogue, not all thirteen. The shared frame, including the report control,
 * stays in ClinicalModuleRoute.
 */
import { ClinicalModuleRoute, type ClinicalModuleConfig } from '../AnesthesiaRoute';
import { DEFAULT_EMERGENCY_MEDICINE_SCENARIO_ID, EMERGENCY_MEDICINE_SCENARIOS, getEmergencyMedicineScenario } from '../../modules/emergency-medicine/scenarios';

const EMERGENCY_MEDICINE_CONFIG: ClinicalModuleConfig = {
  id: 'emergency-medicine', basePath: '/emergency-medicine',
  heading: 'Emergency medicine simulator', scenarios: EMERGENCY_MEDICINE_SCENARIOS,
  catalogIntroduction: 'Short, focused emergency-department rehearsals. Start with one uncertain patient, make the next useful decision, then see exactly what your sequence established.',
  catalogStatus: 'Twenty-five bounded emergency medicine labs are playable.',
  defaultScenarioId: DEFAULT_EMERGENCY_MEDICINE_SCENARIO_ID,
  getScenario: getEmergencyMedicineScenario,
};

export function EmergencyMedicineRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={EMERGENCY_MEDICINE_CONFIG} />;
}
