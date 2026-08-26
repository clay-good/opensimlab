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
import {
  DEFAULT_EMERGENCY_MEDICINE_SCENARIO_ID,
  EMERGENCY_MEDICINE_SCENARIOS,
  getEmergencyMedicineScenario,
} from '../modules/emergency-medicine/scenarios';
import {
  CRITICAL_CARE_SCENARIOS, DEFAULT_CRITICAL_CARE_SCENARIO_ID, getCriticalCareScenario,
} from '../modules/critical-care/scenarios';
import {
  CARDIOLOGY_SCENARIOS, DEFAULT_CARDIOLOGY_SCENARIO_ID, getCardiologyScenario,
} from '../modules/cardiology/scenarios';
import {
  RESPIRATORY_MEDICINE_SCENARIOS, DEFAULT_RESPIRATORY_MEDICINE_SCENARIO_ID,
  getRespiratoryMedicineScenario,
} from '../modules/respiratory-medicine/scenarios';
import {
  PEDIATRICS_SCENARIOS, DEFAULT_PEDIATRICS_SCENARIO_ID, getPediatricsScenario,
} from '../modules/pediatrics/scenarios';
import type { Scenario } from '@anesthesia/scenarios/types';

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
  if (path === '/emergency-medicine') return (
    <ModuleMarkup
      moduleId="emergency-medicine"
      basePath="/emergency-medicine"
      heading="Emergency medicine simulator"
      scenarios={EMERGENCY_MEDICINE_SCENARIOS}
    />
  );
  if (path.startsWith('/emergency-medicine/scenario/')) return (
    <ScenarioMarkup
      path={path}
      basePath="/emergency-medicine"
      defaultScenarioId={DEFAULT_EMERGENCY_MEDICINE_SCENARIO_ID}
      getScenario={getEmergencyMedicineScenario}
    />
  );
  if (path === '/critical-care') return (
    <ModuleMarkup moduleId="critical-care" basePath="/critical-care"
      heading="Critical care simulator" scenarios={CRITICAL_CARE_SCENARIOS} />
  );
  if (path.startsWith('/critical-care/scenario/')) return (
    <ScenarioMarkup path={path} basePath="/critical-care"
      defaultScenarioId={DEFAULT_CRITICAL_CARE_SCENARIO_ID}
      getScenario={getCriticalCareScenario} />
  );
  if (path === '/cardiology') return (
    <ModuleMarkup moduleId="cardiology" basePath="/cardiology"
      heading="Cardiology simulator" scenarios={CARDIOLOGY_SCENARIOS} />
  );
  if (path.startsWith('/cardiology/scenario/')) return (
    <ScenarioMarkup path={path} basePath="/cardiology"
      defaultScenarioId={DEFAULT_CARDIOLOGY_SCENARIO_ID}
      getScenario={getCardiologyScenario} />
  );
  if (path === '/respiratory-medicine') return (
    <ModuleMarkup moduleId="respiratory-medicine" basePath="/respiratory-medicine"
      heading="Respiratory medicine simulator" scenarios={RESPIRATORY_MEDICINE_SCENARIOS} />
  );
  if (path.startsWith('/respiratory-medicine/scenario/')) return (
    <ScenarioMarkup path={path} basePath="/respiratory-medicine"
      defaultScenarioId={DEFAULT_RESPIRATORY_MEDICINE_SCENARIO_ID}
      getScenario={getRespiratoryMedicineScenario} />
  );
  if (path === '/pediatrics') return (
    <ModuleMarkup moduleId="pediatrics" basePath="/pediatrics"
      heading="Pediatrics simulator" scenarios={PEDIATRICS_SCENARIOS} />
  );
  if (path.startsWith('/pediatrics/scenario/')) return (
    <ScenarioMarkup path={path} basePath="/pediatrics"
      defaultScenarioId={DEFAULT_PEDIATRICS_SCENARIO_ID}
      getScenario={getPediatricsScenario} />
  );
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
  return (
    <ModuleMarkup
      moduleId="anesthesia"
      basePath="/anesthesia"
      heading="Anesthesia simulator"
      scenarios={scenariosByDifficulty()}
    />
  );
}

function ModuleMarkup({ moduleId, basePath, heading, scenarios }: {
  moduleId: string;
  basePath: string;
  heading: string;
  scenarios: readonly Scenario[];
}) {
  const module = MODULES.find((entry) => entry.id === moduleId);
  return (
    <div className="document">
      <SiteBar current={basePath} />
      <main className="reading" id="main">
        <h1>{heading}</h1>
        <p>{module?.description}</p>
        <ul>
          {scenarios.map((scenario) => (
            <li key={scenario.metadata.id}>
              <a href={`${basePath}/scenario/${scenario.metadata.id}`}>{scenario.metadata.title}</a>
            </li>
          ))}
        </ul>
        <p><a href="/">What Open Sim Lab is, who it is for, and where its pharmacology comes from</a></p>
        <p className="landing__disclaimer">{NOT_FOR_CLINICAL_USE}</p>
      </main>
    </div>
  );
}

function ScenarioMarkup({
  path,
  basePath = '/anesthesia',
  defaultScenarioId = DEFAULT_SCENARIO_ID,
  getScenario: findScenario = getScenario,
}: {
  path: string;
  basePath?: string;
  defaultScenarioId?: string;
  getScenario?: (id: string) => Scenario | undefined;
}) {
  const id = path.slice(`${basePath}/scenario/`.length).replace(/\/+$/, '');
  const scenario = findScenario(id) ?? findScenario(defaultScenarioId)!;
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
          moduleId={basePath.slice(1)}
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
        <p><a href={basePath}>Every scenario in this module</a></p>
        <p className="landing__disclaimer">{NOT_FOR_CLINICAL_USE}</p>
      </main>
    </div>
  );
}
