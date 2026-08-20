/**
 * The static markup every indexable route is prerendered from.
 *
 * It is real content — headings, prose, links — not an empty application shell,
 * so a crawler, a scripting-disabled browser and a link preview all get something
 * meaningful. The interactive application hydrates over it, which is what keeps
 * cumulative layout shift at zero.
 */

import { MODULES } from '@platform/modules/registry';
import { NOT_FOR_CLINICAL_USE } from '@platform/transcript/transcript';
import { Landing } from '@landing/Landing';
import { About } from '@landing/About';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { DocumentRoute } from './DocumentRoute';
import { PlannedModuleRoute } from './PlannedModuleRoute';

export function PrerenderedBody({ path }: { path: string }) {
  // The landing page, the informational routes and the planned-module pages
  // render their REAL components here, so the prerendered markup is exactly the
  // tree the client produces and hydration succeeds rather than mismatching.
  if (path === '/') return <Landing />;
  if (path === '/about') return <About />;
  const planned = MODULES.find((module) => `/${module.route}` === path && module.status === 'planned');
  if (planned) return <PlannedModuleRoute module={planned} />;
  if (path === '/anesthesia') return <AnesthesiaMarkup />;
  if (path.startsWith('/anesthesia/scenario/')) return <ScenarioMarkup />;
  // The simulator route deliberately renders something different on the client —
  // the acknowledgement gate — so its prerendered markup is the crawler's copy
  // and the client mounts fresh over it rather than hydrating.
  return <DocumentRoute path={path} />;
}

/**
 * The simulator route carries only essential metadata and no marketing prose: the
 * descriptive weight lives on the root domain, and the cockpit never has to carry
 * copy. What is here is what a crawler needs to know the page exists and what it is.
 */
function AnesthesiaMarkup() {
  const anesthesia = MODULES.find((module) => module.id === 'anesthesia');
  return (
    <main className="reading" id="main">
      <h1>Anesthesia simulator</h1>
      <p>{anesthesia?.description}</p>
      <p><a href="/anesthesia/scenario/routine-induction">Routine induction of general anaesthesia</a></p>
      <p><a href="/">What Open Sim Lab is, who it is for, and where its pharmacology comes from</a></p>
      <p className="landing__disclaimer">{NOT_FOR_CLINICAL_USE}</p>
    </main>
  );
}

function ScenarioMarkup() {
  const metadata = ROUTINE_INDUCTION.metadata;
  return (
    <main className="reading" id="main">
      <h1>{metadata.title}</h1>
      <p>
        {ROUTINE_INDUCTION.patient.ageYears}-year-old{' '}
        {ROUTINE_INDUCTION.patient.sex === 'male' ? 'man' : 'woman'} for{' '}
        {ROUTINE_INDUCTION.patient.procedure}. About {metadata.estimatedMinutes} simulated minutes.
      </p>
      <h2>What you will practise</h2>
      <ul>{metadata.objectives.map((objective) => <li key={objective.id}>{objective.statement}</li>)}</ul>
      <p><a href="/anesthesia">Open the anesthesia simulator</a></p>
      <p className="landing__disclaimer">{NOT_FOR_CLINICAL_USE}</p>
    </main>
  );
}
