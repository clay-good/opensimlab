/**
 * The anaesthesia module's route.
 *
 * Carries only essential metadata and never marketing copy: the descriptive
 * weight lives on the root domain. It gates INTERACTION on the
 * not-for-clinical-use acknowledgement, never the delivery of the page.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, SiteBar, useLocalPreference } from '@platform/ui';
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
function scenarioForPath(path: string): { scenario: Scenario; missingId: string | null } {
  const fallback = getScenario(DEFAULT_SCENARIO_ID)!;
  const prefix = '/anesthesia/scenario/';
  if (!path.startsWith(prefix)) return { scenario: fallback, missingId: null };
  const id = path.slice(prefix.length).replace(/\/+$/, '');
  const found = getScenario(id);
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

export function AnesthesiaRoute({ path }: { path: string }) {
  const session = useSession();
  const { scenario, missingId } = useMemo(() => scenarioForPath(path), [path]);
  const assignment = useMemo(
    () => readAssignment(typeof location === 'undefined' ? '' : location.search),
    [],
  );
  const contentVersion = scenario.metadata.version;
  // The index at /anesthesia lists what there is to do rather than dropping the
  // learner into whichever scenario happened to be first.
  const isIndex = !path.startsWith('/anesthesia/scenario/');
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

  const guess = useMemo(() => guessRegion(
    typeof navigator === 'undefined' ? ['en-GB'] : [...navigator.languages],
  ), []);
  const region = (regionId ? getRegion(regionId) : null) ?? guess.profile;

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
    if (!acknowledged || session.phase !== 'idle') return;
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
      'anesthesia',
    );
  }, [acknowledged, session, region.id]);

  // `?demo=1`: skip the briefing and start watching. Fires once, only for the
  // scenario the script was authored against, and only once the session is
  // actually ready to run.
  useEffect(() => {
    if (!autoDemo.current) return;
    if (session.phase !== 'briefing' && session.phase !== 'idle') return;
    if (!session.ready) return;
    if (scenario.metadata.id !== DEMONSTRATION_SCENARIO_ID) return;
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

  if (!acknowledged) {
    return (
      <>
        <SiteBar />
        {/* The page content is delivered regardless; only interaction is gated. */}
        <main className="reading" id="main">
          <h1>Anesthesia simulator</h1>
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
  if (missingId !== null) return <UnknownScenario id={missingId} />;

  // The index: what there is to do, in the order it is worth doing.
  if (isIndex) return <ScenarioIndex />;

  if (session.phase === 'ended') {
    const internals = sessionInternals();
    return (
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
        onOpenExplainer={() => { /* the debrief opens explainers inline */ }}
        onExportTranscript={() => { void exportTranscript(); }}
        onReplayScenario={session.resetSession}
      />
    );
  }

  if (session.phase === 'briefing' || session.phase === 'idle') {
    return (
      <>
        <Prebrief
          scenario={scenario}
          region={region}
          guidance={session.guidance}
          onGuidance={session.setGuidance}
          onStart={() => { setDemonstrating(false); session.play(); }}
          {...(scenario.metadata.id === DEMONSTRATION_SCENARIO_ID
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
      </>
    );
  }

  return (
    <Cockpit
      scenario={scenario}
      region={region}
      audio={audio}
      demonstrating={demonstrating}
      onTakeControls={() => { setDemonstrating(false); session.setSpeed(1); }}
      onEnd={session.end}
    />
  );
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
function UnknownScenario({ id }: { id: string }) {
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
        {scenariosByDifficulty().map((entry) => (
          <li key={entry.metadata.id} className="scenario-index__item">
            <a className="scenario-index__title" href={`/anesthesia/scenario/${entry.metadata.id}`}>
              {entry.metadata.title}
            </a>
            <p className="scenario-index__patient"><code>{entry.metadata.id}</code></p>
          </li>
        ))}
      </ul>
      <p><a href="/anesthesia">Back to the scenario list</a></p>
      </main>
    </>
  );
}

function ScenarioIndex() {
  return (
    <>
      <SiteBar current="/anesthesia" />
      <main className="reading" id="main">
      <h1>Anesthesia simulator</h1>
      <p>
        Each scenario is a patient and a problem. Start at the top if this is your first one.
      </p>
      <ul className="scenario-index">
        {scenariosByDifficulty().map((entry) => (
          <li key={entry.metadata.id} className="scenario-index__item">
            <a className="scenario-index__title" href={`/anesthesia/scenario/${entry.metadata.id}`}>
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
      <p className="reading__aside">{NOT_FOR_CLINICAL_USE}</p>
      </main>
    </>
  );
}
