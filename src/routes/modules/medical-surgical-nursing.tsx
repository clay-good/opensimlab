/**
 * One clinical module's route. Each module lives in its own file so the bundler
 * can give it its own chunk: opening a scenario should download that module's
 * catalogue, not all fourteen. The shared frame, including the report control,
 * stays in ClinicalModuleRoute.
 */
import { ClinicalModuleRoute, type ClinicalModuleConfig } from '../AnesthesiaRoute';
import { DEFAULT_MEDICAL_SURGICAL_NURSING_SCENARIO_ID, MEDICAL_SURGICAL_NURSING_SCENARIOS, getMedicalSurgicalNursingScenario } from '../../modules/medical-surgical-nursing/scenarios';

const MEDICAL_SURGICAL_NURSING_CONFIG: ClinicalModuleConfig = {
  id: 'medical-surgical-nursing', basePath: '/medical-surgical-nursing',
  heading: 'Nursing simulator',
  catalogIntroduction: 'Calm ward rehearsals for the part of nursing that is hardest to teach: seeing a change the tools do not register, escalating it when the system resists, and handing over a concern that is still unresolved.',
  catalogStatus: `${MEDICAL_SURGICAL_NURSING_SCENARIOS.length} of 9 planned Nursing labs are available as previews. Registration does not establish completed review.`,
  scenarios: MEDICAL_SURGICAL_NURSING_SCENARIOS,
  defaultScenarioId: DEFAULT_MEDICAL_SURGICAL_NURSING_SCENARIO_ID,
  getScenario: getMedicalSurgicalNursingScenario,
};

export function MedicalSurgicalNursingRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={MEDICAL_SURGICAL_NURSING_CONFIG} />;
}
