/**
 * One clinical module's route. Each module lives in its own file so the bundler
 * can give it its own chunk: opening a scenario should download that module's
 * catalogue, not all sixteen. The shared frame, including the report control,
 * stays in ClinicalModuleRoute.
 */
import { ClinicalModuleRoute, type ClinicalModuleConfig } from '../AnesthesiaRoute';
import { DEFAULT_SURGERY_TRAUMA_SCENARIO_ID, SURGERY_TRAUMA_SCENARIOS, getSurgeryTraumaScenario } from '../../modules/surgery-trauma/scenarios';
import { SURGERY_TRAUMA_LIMITATIONS } from '@platform/docs/limitations/surgery-trauma';
import { SURGERY_TRAUMA_DEMONSTRATIONS } from '../../modules/surgery-trauma/demo/demonstrations';
import { SURGERY_TRAUMA_TRAYS } from '../../modules/surgery-trauma/trays';

const SURGERY_TRAUMA_CONFIG: ClinicalModuleConfig = {
  id: 'surgery-trauma', basePath: '/surgery-trauma',
  heading: 'Surgery and trauma simulator',
  limitations: SURGERY_TRAUMA_LIMITATIONS,
  catalogIntroduction: 'Rehearsals for the surgical patient who never declares himself: a recovery that has quietly stopped following the operation that predicted it, a limb whose only moving finding is how often he asks, and a record that is accurate about an examination he could not take part in, a pressure that answers volume and falls again, a normal chart that was measuring somebody lying still, two days of delay with no author anywhere, a third attendance nobody has examined yet, a timed step waiting on a person rather than a clock, a true diagnosis that explains everything and excludes nothing, and ninety seconds between noticing something and saying it.',
  // "1 ... are available" reads as a typo on a module that has just opened with one lab.
  catalogStatus: `${SURGERY_TRAUMA_SCENARIOS.length} of 10 planned Surgery and trauma labs ${SURGERY_TRAUMA_SCENARIOS.length === 1 ? 'is' : 'are'} available as previews. Registration does not establish completed review.`,
  scenarios: SURGERY_TRAUMA_SCENARIOS,
  defaultScenarioId: DEFAULT_SURGERY_TRAUMA_SCENARIO_ID,
  getScenario: getSurgeryTraumaScenario,
  demonstrations: SURGERY_TRAUMA_DEMONSTRATIONS,
  trays: SURGERY_TRAUMA_TRAYS,
};

export function SurgeryTraumaRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={SURGERY_TRAUMA_CONFIG} />;
}
