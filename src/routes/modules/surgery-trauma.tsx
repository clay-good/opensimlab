/**
 * One clinical module's route. Each module lives in its own file so the bundler
 * can give it its own chunk: opening a scenario should download that module's
 * catalogue, not all sixteen. The shared frame, including the report control,
 * stays in ClinicalModuleRoute.
 */
import { ClinicalModuleRoute, type ClinicalModuleConfig } from '../AnesthesiaRoute';
import { DEFAULT_SURGERY_TRAUMA_SCENARIO_ID, SURGERY_TRAUMA_SCENARIOS, getSurgeryTraumaScenario } from '../../modules/surgery-trauma/scenarios';
import { SURGERY_TRAUMA_LIMITATIONS } from '@platform/docs/limitations/surgery-trauma';

const SURGERY_TRAUMA_CONFIG: ClinicalModuleConfig = {
  id: 'surgery-trauma', basePath: '/surgery-trauma',
  heading: 'Surgery and trauma simulator',
  limitations: SURGERY_TRAUMA_LIMITATIONS,
  catalogIntroduction: 'Rehearsals for the surgical patient who never declares himself: a recovery that has quietly stopped following the operation that predicted it, an investigation that cannot say no, and a decision that belongs to the team that operated.',
  // "1 ... are available" reads as a typo on a module that has just opened with one lab.
  catalogStatus: `${SURGERY_TRAUMA_SCENARIOS.length} of 10 planned Surgery and trauma labs ${SURGERY_TRAUMA_SCENARIOS.length === 1 ? 'is' : 'are'} available as previews. Registration does not establish completed review.`,
  scenarios: SURGERY_TRAUMA_SCENARIOS,
  defaultScenarioId: DEFAULT_SURGERY_TRAUMA_SCENARIO_ID,
  getScenario: getSurgeryTraumaScenario,
};

export function SurgeryTraumaRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={SURGERY_TRAUMA_CONFIG} />;
}
