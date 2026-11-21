/**
 * One clinical module's route. Each module lives in its own file so the bundler
 * can give it its own chunk: opening a scenario should download that module's
 * catalogue, not all thirteen. The shared frame, including the report control,
 * stays in ClinicalModuleRoute.
 */
import { lazy, Suspense } from 'react';
import { ClinicalModuleRoute, type ClinicalModuleConfig } from '../AnesthesiaRoute';
import { DEFAULT_SCENARIO_ID, getScenario, scenariosByDifficulty } from '@anesthesia/scenarios';
import { ANESTHESIA_LIMITATIONS } from '@platform/docs/limitations/anesthesia';
import { ANESTHESIA_TRAYS } from '@anesthesia/trays';

const ANESTHESIA_CONFIG: ClinicalModuleConfig = {
  id: 'anesthesia', basePath: '/anesthesia', heading: 'Anesthesia simulator',
  limitations: ANESTHESIA_LIMITATIONS,
  catalogIntroduction: '', catalogStatus: '',
  trays: ANESTHESIA_TRAYS,
  scenarios: scenariosByDifficulty(), defaultScenarioId: DEFAULT_SCENARIO_ID, getScenario,
};

/**
 * The pharmacology sandbox is the anaesthesia engine with no scenario, so it
 * lives under this module and loads from this chunk. As a top-level route it
 * shared the drug models with the cockpit, and the bundler split them into a
 * chunk of their own that compressed 1.9 KB worse for every lesson.
 */
export const SANDBOX_PATH = '/anesthesia/sandbox';
const SandboxRoute = lazy(async () => ({ default: (await import('../SandboxRoute')).SandboxRoute }));

export function AnesthesiaRoute({ path }: { path: string }) {
  if (path === SANDBOX_PATH) return <Suspense fallback={null}><SandboxRoute /></Suspense>;
  return <ClinicalModuleRoute path={path} config={ANESTHESIA_CONFIG} />;
}
