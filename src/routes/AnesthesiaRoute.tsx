/**
 * The anaesthesia module's route.
 *
 * Carries only essential metadata and never marketing copy: the descriptive
 * weight lives on the root domain. It gates INTERACTION on the
 * not-for-clinical-use acknowledgement, never the delivery of the page.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Select, SiteBar, useLocalPreference } from '@platform/ui';
import { useSession, sessionInternals, type GuidanceLevel } from '@platform/session/session-store';
import { NotForClinicalUseGate, hasAcknowledged, recordAcknowledgement } from '@platform/safety/not-for-clinical-use';
import { SonificationEngine } from '@platform/audio/sonification';
import { guessRegion, getRegion, REGIONS } from '@anesthesia/region/profiles';
import { DEFAULT_SCENARIO_ID, getScenario, scenariosByDifficulty } from '@anesthesia/scenarios';
import type { Scenario } from '@anesthesia/engine';
import { ENGINE_VERSION } from '@anesthesia/engine';
import { MODEL_SET_REVISION } from '@anesthesia/pharmacology/registry';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { DEMONSTRATION_SCENARIO_ID, demonstrationRequested } from '@anesthesia/demo/demonstration';
import { Cockpit } from '@anesthesia/ui/Cockpit';
import { Debrief } from '@anesthesia/ui/Debrief';
import { assertTranscriptIsAnonymous, NOT_FOR_CLINICAL_USE } from '@platform/transcript/transcript';
import { patientPersonNoun } from '@anesthesia/scenarios/patient-label';
import { MaturityMarker } from '@platform/governance/MaturityMarker';
import {
  EMPTY_CATALOG_QUERY,
  catalogQueryString,
  filterCatalog,
  hasCatalogFilters,
  readCatalogQuery,
  type CatalogQuery,
} from '@anesthesia/catalog/query';
import {
  PREPARATION_PATHS,
  pathMinutes,
  preparationPath,
  recommendNextScenario,
} from '@anesthesia/catalog/preparation-paths';
import { completedScenarioIds, loadPracticeHistory } from '@anesthesia/catalog/practice-history';
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
import { APP_VERSION } from '@platform/governance/status';
import { ScenarioProblemReport } from '@platform/reporting/ScenarioProblemReport';
import { SITE_ORIGIN } from './site-metadata';

interface ClinicalModuleConfig {
  readonly id: 'anesthesia' | 'emergency-medicine' | 'critical-care' | 'cardiology';
  readonly basePath: '/anesthesia' | '/emergency-medicine' | '/critical-care' | '/cardiology';
  readonly heading: string;
  readonly catalogIntroduction: string;
  readonly catalogStatus: string;
  readonly scenarios: readonly Scenario[];
  readonly defaultScenarioId: string;
  readonly getScenario: (id: string) => Scenario | undefined;
}

const ANESTHESIA_CONFIG: ClinicalModuleConfig = {
  id: 'anesthesia', basePath: '/anesthesia', heading: 'Anesthesia simulator',
  catalogIntroduction: '', catalogStatus: '',
  scenarios: scenariosByDifficulty(), defaultScenarioId: DEFAULT_SCENARIO_ID, getScenario,
};

const EMERGENCY_MEDICINE_CONFIG: ClinicalModuleConfig = {
  id: 'emergency-medicine', basePath: '/emergency-medicine',
  heading: 'Emergency medicine simulator', scenarios: EMERGENCY_MEDICINE_SCENARIOS,
  catalogIntroduction: 'Short, focused emergency-department rehearsals. Start with one uncertain patient, make the next useful decision, then see exactly what your sequence established.',
  catalogStatus: 'Twenty-five bounded emergency medicine labs are playable.',
  defaultScenarioId: DEFAULT_EMERGENCY_MEDICINE_SCENARIO_ID,
  getScenario: getEmergencyMedicineScenario,
};

const CRITICAL_CARE_CONFIG: ClinicalModuleConfig = {
  id: 'critical-care', basePath: '/critical-care', heading: 'Critical care simulator',
  catalogIntroduction: 'Quiet ICU rehearsals for the decisions that change organ support. Read the trend, make one purposeful change, then reassess what actually moved.',
  catalogStatus: 'Twenty-four bounded critical care labs are playable.',
  scenarios: CRITICAL_CARE_SCENARIOS, defaultScenarioId: DEFAULT_CRITICAL_CARE_SCENARIO_ID,
  getScenario: getCriticalCareScenario,
};

const CARDIOLOGY_CONFIG: ClinicalModuleConfig = {
  id: 'cardiology', basePath: '/cardiology', heading: 'Cardiology simulator',
  catalogIntroduction: 'Calm cardiovascular rehearsals from clinic to inpatient care. Read the trajectory, surface what remains, and make each next step earn its place.',
  catalogStatus: 'Nine bounded cardiology labs are playable now. The remaining Wave C titles stay visibly planned until their full contracts pass.',
  scenarios: CARDIOLOGY_SCENARIOS, defaultScenarioId: DEFAULT_CARDIOLOGY_SCENARIO_ID,
  getScenario: getCardiologyScenario,
};

/**
 * The scenario a path names.
 *
 * `missingId` is the whole point of the return shape. This used to fall back to
 * the default scenario for ANY unrecognised id, so `/anesthesia/scenario/
 * bronchspasm` opened routine induction with the wrong URL still in the bar and
 * nothing said otherwise. An instructor who typed a scenario id wrong in a
 * cohort link would have sent thirty students to the wrong case without one of
 * them being told.
 */
function scenarioForPath(
  path: string,
  config: ClinicalModuleConfig,
): { scenario: Scenario; missingId: string | null } {
  const fallback = config.getScenario(config.defaultScenarioId)!;
  const prefix = `${config.basePath}/scenario/`;
  if (!path.startsWith(prefix)) return { scenario: fallback, missingId: null };
  const id = path.slice(prefix.length).replace(/\/+$/, '');
  const found = config.getScenario(id);
  if (found) return { scenario: found, missingId: null };
  // The id is shown back to whoever followed the link, bounded, because it came
  // from a URL and a URL can carry anything.
  return { scenario: fallback, missingId: id.slice(0, 80) };
}

/** A seed derived from the scenario rather than from a clock, so a session replays. */
const DEFAULT_SEED = 20260819;

/**
 * An assignment carried in the URL (platform/adoption → Assignment Links Without
 * Accounts).
 *
 * An instructor hands out one link and the whole cohort meets the identical
 * patient. NOTHING is trusted from the link: the scenario is looked up in the
 * registry, the guidance level must be one of the three, and the seed must be a
 * finite number. A parameter that fails any of those is dropped rather than
 * used, because a URL is input from outside.
 *
 * The link carries no identity and there is nowhere for it to report to. An
 * instructor can tell a cohort to open it; they cannot learn who did.
 */
export interface Assignment {
  readonly seed: number;
  readonly guidance: GuidanceLevel | null;
  readonly label: string | null;
}

const GUIDANCE_LEVELS: readonly GuidanceLevel[] = ['guided', 'coached', 'unassisted'];

export function readAssignment(search: string): Assignment {
  const params = new URLSearchParams(search);
  const rawSeed = Number(params.get('seed'));
  const rawGuidance = params.get('guidance');
  const rawLabel = params.get('assignment');
  return {
    seed: Number.isFinite(rawSeed) && rawSeed !== 0 ? Math.trunc(rawSeed) : DEFAULT_SEED,
    guidance: GUIDANCE_LEVELS.find((level) => level === rawGuidance) ?? null,
    // Shown back to the learner, so it is trimmed and bounded rather than
    // rendered at whatever length a URL happens to carry.
    label: rawLabel ? rawLabel.slice(0, 80) : null,
  };
}

function ClinicalModuleRoute({ path, config }: { path: string; config: ClinicalModuleConfig }) {
  const session = useSession();
  const { scenario, missingId } = useMemo(() => scenarioForPath(path, config), [path, config]);
  const assignment = useMemo(
    () => readAssignment(typeof location === 'undefined' ? '' : location.search),
    [],
  );
  const selectedGoal = useMemo(
    () => readCatalogQuery(typeof location === 'undefined' ? '' : location.search).goal,
    [],
  );
  const contentVersion = scenario.metadata.version;
  // The index at /anesthesia lists what there is to do rather than dropping the
  // learner into whichever scenario happened to be first.
  const isIndex = !path.startsWith(`${config.basePath}/scenario/`);
  const [acknowledged, setAcknowledged] = useState(() => hasAcknowledged());
  // Whether the scripted demonstration is driving this session. Deliberately not
  // in the URL: a demonstration is something you start, not somewhere you are.
  const [demonstrating, setDemonstrating] = useState(false);
  /**
   * `?demo=1` starts the demonstration without the briefing.
   *
   * Someone who followed "watch a 90-second demonstration" from the front door
   * has already decided to watch. Putting the briefing in front of them is
   * asking the question they just answered.
   */
  const autoDemo = useRef(
    demonstrationRequested(typeof location === 'undefined' ? '' : location.search),
  );
  // Validated against the registry, not just type-checked: the default is null,
  // so a shape check cannot tell a real region id from any other string, and an
  // unknown one used to throw and take the whole simulator down.
  const [regionId, setRegionId] = useLocalPreference<string | null>(
    'practice-region',
    null,
    (candidate): candidate is string | null =>
      candidate === null || (typeof candidate === 'string' && REGIONS.some((r) => r.id === candidate)),
  );
  const audio = useMemo(() => new SonificationEngine(), []);
  const reportWasRunning = useRef(false);

  const guess = useMemo(() => guessRegion(
    typeof navigator === 'undefined' ? ['en-GB'] : [...navigator.languages],
  ), []);
  const region = (regionId ? getRegion(regionId) : null) ?? guess.profile;

  const reportControl = (
    <ScenarioProblemReport
      context={{
        scenarioId: scenario.metadata.id,
        contentVersion: scenario.metadata.version,
        appVersion: APP_VERSION,
        engineVersion: ENGINE_VERSION,
        moduleId: config.id,
        maturity: scenario.metadata.maturity,
        practiceRegion: region.id,
        fidelityClass: config.id === 'anesthesia' ? 'closed_loop_physiology' : 'state_transition',
        surface: session.phase === 'ended'
          ? 'debrief'
          : session.phase === 'briefing' || session.phase === 'idle' ? 'prebrief' : 'live',
        simulatedTick: session.tick,
        canonicalUrl: `${SITE_ORIGIN}${config.basePath}/scenario/${scenario.metadata.id}`,
      }}
      onOpen={() => {
        reportWasRunning.current = session.transport === 'running';
        if (reportWasRunning.current) session.pause();
      }}
      onClose={() => {
        if (reportWasRunning.current) session.play();
        reportWasRunning.current = false;
      }}
    />
  );

  // The assignment's guidance level is applied once, before the session begins.
  // After that it is the learner's own control: a link sets the starting point,
  // it does not lock them out of the escape hatch the curriculum requires.
  const appliedGuidance = useRef(false);
  useEffect(() => {
    if (appliedGuidance.current || assignment.guidance === null) return;
    appliedGuidance.current = true;
    session.setGuidance(assignment.guidance);
  }, [assignment.guidance, session]);

  useEffect(() => {
    if (isIndex || !acknowledged || session.phase !== 'idle') return;
    session.begin(
      {
        scenarioId: scenario.metadata.id,
        scenarioVersion: scenario.metadata.version,
        contentVersion: contentVersion,
        modelSetRevision: MODEL_SET_REVISION,
        engineVersion: ENGINE_VERSION,
        practiceRegion: region.id,
        seed: assignment.seed,
        scenario,
      },
      () => new Worker(new URL('../modules/anesthesia/solver.worker.ts', import.meta.url), { type: 'module' }),
      {
        engine: ENGINE_VERSION, content: contentVersion,
        modelSet: MODEL_SET_REVISION, scenario: scenario.metadata.version,
      },
      config.id,
    );
  }, [acknowledged, session, region.id, config.id, isIndex]);

  // `?demo=1`: skip the briefing and start watching. Fires once, only for the
  // scenario the script was authored against, and only once the session is
  // actually ready to run.
  useEffect(() => {
    if (!autoDemo.current) return;
    if (session.phase !== 'briefing' && session.phase !== 'idle') return;
    if (!session.ready) return;
    if (config.id !== 'anesthesia' || scenario.metadata.id !== DEMONSTRATION_SCENARIO_ID) return;
    autoDemo.current = false;
    setDemonstrating(true);
    session.setSpeed(5);
    session.play();
  }, [session, scenario.metadata.id]);

  const exportTranscript = useCallback(async () => {
    const transcript = await session.exportTranscript();
    // Nothing identifying may leave the device, so the export is checked first.
    assertTranscriptIsAnonymous(transcript);
    const blob = new Blob([JSON.stringify(transcript, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `opensimlab-${transcript.scenarioId}-transcript.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [session]);

  // Browsing the catalog is not simulator interaction. Let a learner understand
  // what exists before asking for the safety acknowledgement.
  if (isIndex) return config.id === 'anesthesia'
    ? <ScenarioIndex />
    : <EmergencyMedicineScenarioIndex config={config} />;

  if (!acknowledged) {
    return (
      <>
        <SiteBar />
        {/* The page content is delivered regardless; only interaction is gated. */}
        <main className="reading" id="main">
          <h1>{config.heading}</h1>
          <p>{isIndex ? 'Choose a scenario.' : scenario.metadata.title}</p>
        </main>
        <NotForClinicalUseGate
          open
          onAcknowledge={() => { recordAcknowledgement(); setAcknowledged(true); }}
        />
      </>
    );
  }

  // A link to a scenario that does not exist says so, rather than quietly
  // opening a different patient.
  if (missingId !== null) return <UnknownScenario id={missingId} config={config} />;

  if (session.phase === 'ended') {
    const internals = sessionInternals();
    const nextRecommendation = config.id !== 'anesthesia' || selectedGoal === 'all' ? undefined : (() => {
      const goal = preparationPath(selectedGoal);
      const completed = completedScenarioIds(loadPracticeHistory());
      completed.add(scenario.metadata.id);
      const next = recommendNextScenario(goal, scenariosByDifficulty(), completed);
      return {
        pathId: goal.id, pathTitle: goal.title,
        scenario: next.scenario, reason: next.reason,
      };
    })();
    return (
      <>
      <Debrief
        scenario={scenario}
        history={session.history}
        log={session.log}
        actions={internals.recorder ? internals.recorder.build('pending').actions : []}
        attributionByTick={() => session.attribution}
        timeToPeakSeconds={{ propofol: 100, remifentanil: 90 }}
        replayOptions={{
          scenario, seed: assignment.seed,
          practiceRegion: region.id, ticks: session.tick || 1,
        }}
        preoxygenationSeconds={session.equipment?.preoxygenationSeconds ?? 0}
        moduleId={config.id}
        onOpenExplainer={() => { /* the debrief opens explainers inline */ }}
        onExportTranscript={() => { void exportTranscript(); }}
        onReplayScenario={session.resetSession}
        onReplayDecisionPoint={(point) => session.rehearseFromDecisionPoint(point.id, point.atTick)}
        {...(nextRecommendation ? { nextRecommendation } : {})}
      />
      {reportControl}
      </>
    );
  }

  if (session.phase === 'briefing' || session.phase === 'idle') {
    return (
      <>
        <Prebrief
          scenario={scenario}
          region={region}
          environment={config.id}
          guidance={session.guidance}
          onGuidance={session.setGuidance}
          onStart={() => { setDemonstrating(false); session.play(); }}
          {...(config.id === 'anesthesia' && scenario.metadata.id === DEMONSTRATION_SCENARIO_ID
            ? { onWatch: () => { setDemonstrating(true); session.setSpeed(5); session.play(); } }
            : {})}
          {...(assignment.label ? { assignmentLabel: assignment.label } : {})}
        />
        {guess.isFallback && regionId === null && (
          <div className="reading">
            <p className="field__hint">{guess.reason}</p>
            <Button compact onClick={() => setRegionId(region.id === 'US' ? 'GB' : 'US')}>
              Use the other profile instead
            </Button>
          </div>
        )}
        <p className="visually-hidden">{path}</p>
        {reportControl}
      </>
    );
  }

  return (
    <>
    <Cockpit
      scenario={scenario}
      region={region}
      audio={audio}
      demonstrating={demonstrating}
      onTakeControls={() => { setDemonstrating(false); session.setSpeed(1); }}
      onEnd={session.end}
      moduleId={config.id}
    />
    {reportControl}
    </>
  );
}

export function AnesthesiaRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={ANESTHESIA_CONFIG} />;
}

export function EmergencyMedicineRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={EMERGENCY_MEDICINE_CONFIG} />;
}

export function CriticalCareRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={CRITICAL_CARE_CONFIG} />;
}

export function CardiologyRoute({ path }: { path: string }) {
  return <ClinicalModuleRoute path={path} config={CARDIOLOGY_CONFIG} />;
}

/**
 * The scenario directory at `/anesthesia`.
 *
 * Ordered by difficulty, because the order is the teaching. Each entry says who
 * the patient is and what the scenario is for, so a learner chooses rather than
 * guesses.
 */
/**
 * A scenario id that is not in the registry.
 *
 * It names the id rather than saying "not found", because the person reading it
 * is usually the one who wrote the link, and the id is the thing they got wrong.
 */
function UnknownScenario({ id, config }: { id: string; config: ClinicalModuleConfig }) {
  return (
    <>
      <SiteBar />
      <main className="reading" id="main">
      <h1>No scenario called that</h1>
      <p>
        This link asks for a scenario with the id <code>{id}</code>, and there is not one.
        It may have been renamed, or the link may have a typo in it.
      </p>
      <p>
        If you were given this link by an instructor, the id in it is the part to check. These are
        all the scenarios there are:
      </p>
      <ul className="scenario-index">
        {config.scenarios.map((entry) => (
          <li key={entry.metadata.id} className="scenario-index__item">
            <a className="scenario-index__title" href={`${config.basePath}/scenario/${entry.metadata.id}`}>
              {entry.metadata.title}
            </a>
            <p className="scenario-index__patient"><code>{entry.metadata.id}</code></p>
          </li>
        ))}
      </ul>
      <p><a href={config.basePath}>Back to the scenario list</a></p>
      </main>
    </>
  );
}

function EmergencyMedicineScenarioIndex({ config }: { config: ClinicalModuleConfig }) {
  return (
    <>
      <SiteBar current={config.basePath} />
      <main className="reading" id="main">
        <p className="catalog-path__eyebrow">Your private practice lab</p>
        <h1>{config.heading}</h1>
        <p>
          {config.catalogIntroduction}
        </p>
        <ul className="scenario-index">
          {config.scenarios.map((entry) => (
            <li key={entry.metadata.id} className="scenario-index__item">
              <a className="scenario-index__title" href={`${config.basePath}/scenario/${entry.metadata.id}`}>
                {entry.metadata.title}
              </a>
              <p className="scenario-index__patient">
                {entry.patient.ageYears}-year-old {patientPersonNoun(entry.patient)}
                {config.id === 'cardiology' ? '.' : `, ASA ${entry.patient.asaClass}.`}{' '}
                About {entry.metadata.estimatedMinutes} simulated minutes.
              </p>
              <p className="scenario-index__teaches">{entry.metadata.objectives[0]?.statement}</p>
              <span className="badge">{entry.metadata.difficulty}</span>
              <MaturityMarker
                status={entry.metadata.maturity}
                subjectKind="scenario"
                subjectId={entry.metadata.id}
                contentVersion={entry.metadata.version}
                moduleId={config.id}
              />
            </li>
          ))}
        </ul>
        <p className="reading__aside">{config.catalogStatus}</p>
        <p className="reading__aside">{NOT_FOR_CLINICAL_USE}</p>
      </main>
    </>
  );
}

export function ScenarioIndex() {
  const [query, setQuery] = useState<CatalogQuery>(() => readCatalogQuery(
    typeof location === 'undefined' ? '' : location.search,
  ));
  const scenarios = filterCatalog(scenariosByDifficulty(), query);
  const selectedPath = query.goal === 'all' ? null : preparationPath(query.goal);
  const recommendation = selectedPath
    ? recommendNextScenario(selectedPath, scenariosByDifficulty())
    : null;
  const updateQuery = (next: CatalogQuery) => {
    setQuery(next);
    if (typeof history !== 'undefined') {
      history.replaceState(null, '', `/anesthesia${catalogQueryString(next)}`);
    }
  };
  const scenarioHref = (id: string) => `/anesthesia/scenario/${id}${
    query.goal === 'all' ? '' : `?goal=${query.goal}`
  }`;
  return (
    <>
      <SiteBar current="/anesthesia" />
      <main className="reading" id="main">
      <h1>Anesthesia simulator</h1>
      <p>
        Each scenario is a patient and a problem. Find the one that matches what you want to
        practise, or start at the top if this is your first one.
      </p>
      <section className="catalog-controls" aria-labelledby="catalog-controls-title">
        <h2 id="catalog-controls-title" className="catalog-controls__title">Find a scenario</h2>
        <Select
          label="What are you preparing for?"
          value={query.goal}
          onChange={(event) => updateQuery({
            ...query, goal: event.target.value as CatalogQuery['goal'],
          })}
          options={[
            { value: 'all', label: 'Show me everything' },
            ...PREPARATION_PATHS.map((path) => ({ value: path.id, label: path.title })),
          ]}
        />
        {selectedPath && recommendation && (
          <div className="catalog-path">
            <div>
              <p className="catalog-path__eyebrow">Your private practice path</p>
              <h3>{selectedPath.title}</h3>
              <p>{selectedPath.description}</p>
            </div>
            <dl className="catalog-path__facts">
              <div><dt>Plan</dt><dd>{selectedPath.scenarioIds.length} scenarios · {pathMinutes(selectedPath, scenariosByDifficulty())} minutes</dd></div>
              <div>
                <dt>Start here</dt>
                <dd>
                  <a href={scenarioHref(recommendation.scenario.metadata.id)}>
                    {recommendation.scenario.metadata.title}
                  </a>
                  <MaturityMarker
                    compact
                    status={recommendation.scenario.metadata.maturity}
                    subjectKind="scenario"
                    subjectId={recommendation.scenario.metadata.id}
                    contentVersion={recommendation.scenario.metadata.version}
                  />
                </dd>
              </div>
              <div><dt>Why</dt><dd>{recommendation.reason}</dd></div>
            </dl>
            <div className="catalog-path__competencies" aria-label="Path goals">
              {selectedPath.targetCompetencies.map((competency) => (
                <span className="chip" key={competency}>{competency}</span>
              ))}
            </div>
            <p className="field__hint">Assumes: {selectedPath.prerequisites.join(' ')}</p>
            <p className="reading__aside">{selectedPath.limitations}</p>
            <p className="field__hint">Nothing is locked. Choose “Show me everything” at any time.</p>
          </div>
        )}
        <div className="catalog-controls__grid">
          <div className="field catalog-controls__search">
            <label className="field__label" htmlFor="scenario-search">Patient, problem, or skill</label>
            <input
              id="scenario-search"
              className="field__input"
              type="search"
              maxLength={80}
              value={query.q}
              placeholder="Try airway, child, hemorrhage…"
              onChange={(event) => updateQuery({ ...query, q: event.target.value.slice(0, 80) })}
            />
          </div>
          <Select
            label="Difficulty"
            value={query.difficulty}
            onChange={(event) => updateQuery({
              ...query, difficulty: event.target.value as CatalogQuery['difficulty'],
            })}
            options={[
              { value: 'all', label: 'Any difficulty' },
              { value: 'introductory', label: 'Introductory' },
              { value: 'intermediate', label: 'Intermediate' },
              { value: 'advanced', label: 'Advanced' },
            ]}
          />
          <Select
            label="Duration"
            value={query.duration}
            onChange={(event) => updateQuery({
              ...query, duration: event.target.value as CatalogQuery['duration'],
            })}
            options={[
              { value: 'all', label: 'Any duration' },
              { value: 'under-10', label: 'Under 10 minutes' },
              { value: '10-plus', label: '10 minutes or more' },
            ]}
          />
          <Select
            label="Maturity"
            value={query.maturity}
            onChange={(event) => updateQuery({
              ...query, maturity: event.target.value as CatalogQuery['maturity'],
            })}
            options={[
              { value: 'all', label: 'Any maturity' },
              { value: 'draft', label: 'Draft' },
              { value: 'preview', label: 'Preview' },
              { value: 'source_checked', label: 'Sources checked' },
              { value: 'clinically_reviewed', label: 'Clinically reviewed' },
              { value: 'institution_endorsed', label: 'Institution endorsed' },
              { value: 'withdrawn', label: 'Withdrawn' },
            ]}
          />
        </div>
        <div className="catalog-controls__summary">
          <span role="status" aria-live="polite">
            <strong>{scenarios.length}</strong> {scenarios.length === 1 ? 'scenario' : 'scenarios'}
          </span>
          {hasCatalogFilters(query) && (
            <Button compact variant="ghost" onClick={() => updateQuery(EMPTY_CATALOG_QUERY)}>
              Clear filters
            </Button>
          )}
        </div>
        <noscript>
          <p className="field__hint">
            Filtering needs JavaScript. Every scenario is still listed below and each briefing
            works as a standalone page.
          </p>
        </noscript>
      </section>
      {scenarios.length > 0 && (
        <ul className="scenario-index">
          {scenarios.map((entry) => (
          <li key={entry.metadata.id} className="scenario-index__item">
            <a className="scenario-index__title" href={scenarioHref(entry.metadata.id)}>
              {entry.metadata.title}
            </a>
            <p className="scenario-index__patient">
              {entry.patient.ageYears}-year-old {patientPersonNoun(entry.patient)},
              {' '}ASA {entry.patient.asaClass}, for {entry.patient.procedure.toLowerCase()}.
              {' '}About {entry.metadata.estimatedMinutes} simulated minutes.
            </p>
            <p className="scenario-index__teaches">
              {entry.metadata.objectives[0]?.statement}
            </p>
            <span className="badge">{entry.metadata.difficulty}</span>
            <MaturityMarker
              status={entry.metadata.maturity}
              subjectKind="scenario"
              subjectId={entry.metadata.id}
              contentVersion={entry.metadata.version}
            />
          </li>
          ))}
        </ul>
      )}
      {scenarios.length === 0 && (
        <div className="catalog-empty">
          <h2>No scenarios match yet</h2>
          <p>Try a broader word or clear a filter. Nothing has been hidden from the catalog.</p>
          <Button onClick={() => updateQuery(EMPTY_CATALOG_QUERY)}>Show all scenarios</Button>
        </div>
      )}
      <p className="reading__aside">{NOT_FOR_CLINICAL_USE}</p>
      </main>
    </>
  );
}
