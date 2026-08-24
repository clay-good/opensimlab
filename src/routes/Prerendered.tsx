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
import { EducatorsRoute } from './EducatorsRoute';
import { CurriculumRoute } from './CurriculumRoute';
import { DEFAULT_SCENARIO_ID, getScenario, scenariosByDifficulty } from '@anesthesia/scenarios';
import { DocumentRoute } from './DocumentRoute';
import { PlannedModuleRoute } from './PlannedModuleRoute';
import { patientPersonNoun } from '@anesthesia/scenarios/patient-label';
import { MaturityMarker } from '@platform/governance/MaturityMarker';
import { SiteBar } from '@platform/ui';
import { isUnreviewed } from '@platform/governance/review-gate';

export function PrerenderedBody({ path }: { path: string }) {
  // The landing page, the informational routes and the planned-module pages
  // render their REAL components here, so the prerendered markup is exactly the
  // tree the client produces and hydration succeeds rather than mismatching.
  if (path === '/') return <Landing />;
  if (path === '/about') return <About />;
  // The educator pages are prerendered as their real components: they are prose
  // and tables, and a program director may well arrive with scripting blocked.
  if (path === '/for-educators') return <EducatorsRoute />;
  if (path === '/curriculum') return <CurriculumRoute />;
  const planned = MODULES.find((module) => `/${module.route}` === path && module.status === 'planned');
  if (planned) return <PlannedModuleRoute module={planned} />;
  if (path === '/anesthesia') return <AnesthesiaMarkup />;
  if (path.startsWith('/anesthesia/scenario/')) return <ScenarioMarkup path={path} />;
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
    <div className="document">
      <SiteBar current="/anesthesia" />
      <main className="reading" id="main">
        <h1>Anesthesia simulator</h1>
        <p>{anesthesia?.description}</p>
        <ul>
          {scenariosByDifficulty().map((scenario) => (
            <li key={scenario.metadata.id}>
              <a href={`/anesthesia/scenario/${scenario.metadata.id}`}>{scenario.metadata.title}</a>
            </li>
          ))}
        </ul>
        <p><a href="/">What Open Sim Lab is, who it is for, and where its pharmacology comes from</a></p>
        <p className="landing__disclaimer">{NOT_FOR_CLINICAL_USE}</p>
      </main>
    </div>
  );
}

function ScenarioMarkup({ path }: { path: string }) {
  const id = path.slice('/anesthesia/scenario/'.length).replace(/\/+$/, '');
  const scenario = getScenario(id) ?? getScenario(DEFAULT_SCENARIO_ID)!;
  const { metadata, patient } = scenario;
  const unreviewed = isUnreviewed(metadata.clinicalReview);
  return (
    <div className="document">
      <SiteBar />
      <main className="reading" id="main">
        <h1>{metadata.title}</h1>
        <MaturityMarker
          status={metadata.maturity}
          subjectKind="scenario"
          subjectId={metadata.id}
          contentVersion={metadata.version}
        />
        <p>
          {patient.ageYears}-year-old{' '}
          {patientPersonNoun(patient)} for{' '}
          {patient.procedure}. About {metadata.estimatedMinutes} simulated minutes.
        </p>
        <h2>What you will practise</h2>
        <ul>{metadata.objectives.map((objective) => <li key={objective.id}>{objective.statement}</li>)}</ul>
        <section aria-labelledby="review-and-sources">
          <h2 id="review-and-sources">Review and sources</h2>
          <p>
            {unreviewed
              ? 'Not clinically reviewed. No clinician has signed this scenario.'
              : `Clinically reviewed by ${metadata.clinicalReview.reviewer}, ${metadata.clinicalReview.credential}, on ${metadata.clinicalReview.reviewedOn}.`}
          </p>
          <ul>
            {metadata.clinicalReview.sources.map((source) => <li key={source}>{source}</li>)}
          </ul>
        </section>
        <p><a href="/anesthesia">Every anesthesia scenario</a></p>
        <p className="landing__disclaimer">{NOT_FOR_CLINICAL_USE}</p>
      </main>
    </div>
  );
}
