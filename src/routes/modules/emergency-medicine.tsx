/**
 * One clinical module's route. Each module lives in its own file so the bundler
 * can give it its own chunk: opening a scenario should download that module's
 * catalogue, not all thirteen. The shared frame, including the report control,
 * stays in ClinicalModuleRoute.
 */
import { ClinicalModuleRoute, type ClinicalModuleConfig } from '../AnesthesiaRoute';
import { DEFAULT_EMERGENCY_MEDICINE_SCENARIO_ID, EMERGENCY_MEDICINE_SCENARIOS, getEmergencyMedicineScenario } from '../../modules/emergency-medicine/scenarios';
import { EMERGENCY_MEDICINE_LIMITATIONS } from '@platform/docs/limitations/emergency-medicine';
import { EMERGENCY_MEDICINE_TRAYS } from '../../modules/emergency-medicine/trays';
import { EMERGENCY_MEDICINE_DEMONSTRATIONS } from '../../modules/emergency-medicine/demo/demonstrations';

const EMERGENCY_MEDICINE_CONFIG: ClinicalModuleConfig = {
  id: 'emergency-medicine', basePath: '/emergency-medicine',
  heading: 'Emergency medicine simulator', trays: EMERGENCY_MEDICINE_TRAYS,
  scenarios: EMERGENCY_MEDICINE_SCENARIOS,
  limitations: EMERGENCY_MEDICINE_LIMITATIONS,
  catalogIntroduction: 'Short, focused emergency-department rehearsals. Start with one uncertain patient, make the next useful decision, then see exactly what your sequence established.',
  catalogStatus: 'Twenty-five bounded emergency medicine labs are playable.',
  defaultScenarioId: DEFAULT_EMERGENCY_MEDICINE_SCENARIO_ID,
  getScenario: getEmergencyMedicineScenario,
  demonstrations: EMERGENCY_MEDICINE_DEMONSTRATIONS,
};

export function EmergencyMedicineRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={EMERGENCY_MEDICINE_CONFIG} />;
}
