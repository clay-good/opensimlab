/**
 * The anaesthesia module's route.
 *
 * Carries only essential metadata and never marketing copy: the descriptive
 * weight lives on the root domain. It gates INTERACTION on the
 * not-for-clinical-use acknowledgement, never the delivery of the page.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, useLocalPreference } from '@platform/ui';
import { useSession, sessionInternals } from '@platform/session/session-store';
import { NotForClinicalUseGate, hasAcknowledged, recordAcknowledgement } from '@platform/safety/not-for-clinical-use';
import { SonificationEngine } from '@platform/audio/sonification';
import { guessRegion, getRegion } from '@anesthesia/region/profiles';
import { DEFAULT_SCENARIO_ID, getScenario, scenariosByDifficulty } from '@anesthesia/scenarios';
import { ENGINE_VERSION } from '@anesthesia/engine';
import { MODEL_SET_REVISION } from '@anesthesia/pharmacology/registry';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { Cockpit } from '@anesthesia/ui/Cockpit';
import { Debrief } from '@anesthesia/ui/Debrief';
import { assertTranscriptIsAnonymous, NOT_FOR_CLINICAL_USE } from '@platform/transcript/transcript';

/** The scenario a path names, falling back to the one a learner meets first. */
function scenarioForPath(path: string) {
  const prefix = '/anesthesia/scenario/';
  const id = path.startsWith(prefix) ? path.slice(prefix.length).replace(/\/+$/, '') : '';
  return getScenario(id) ?? getScenario(DEFAULT_SCENARIO_ID)!;
}

/** A seed derived from the scenario rather than from a clock, so a session replays. */
const DEFAULT_SEED = 20260819;

export function AnesthesiaRoute({ path }: { path: string }) {
  const session = useSession();
  const scenario = useMemo(() => scenarioForPath(path), [path]);
  const contentVersion = scenario.metadata.version;
  // The index at /anesthesia lists what there is to do rather than dropping the
  // learner into whichever scenario happened to be first.
  const isIndex = !path.startsWith('/anesthesia/scenario/');
  const [acknowledged, setAcknowledged] = useState(() => hasAcknowledged());
  const [regionId, setRegionId] = useLocalPreference<string | null>('practice-region', null);
  const audio = useMemo(() => new SonificationEngine(), []);

  const guess = useMemo(() => guessRegion(
    typeof navigator === 'undefined' ? ['en-GB'] : [...navigator.languages],
  ), []);
  const region = regionId ? getRegion(regionId) : guess.profile;

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
        seed: DEFAULT_SEED,
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
          scenario, seed: DEFAULT_SEED,
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
          onStart={session.play}
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

  return <Cockpit scenario={scenario} region={region} audio={audio} onEnd={session.end} />;
}

/**
 * The scenario directory at `/anesthesia`.
 *
 * Ordered by difficulty, because the order is the teaching. Each entry says who
 * the patient is and what the scenario is for, so a learner chooses rather than
 * guesses.
 */
function ScenarioIndex() {
  return (
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
              {entry.patient.ageYears}-year-old {entry.patient.sex === 'male' ? 'man' : 'woman'},
              {' '}ASA {entry.patient.asaClass}, for {entry.patient.procedure.toLowerCase()}.
              {' '}About {entry.metadata.estimatedMinutes} simulated minutes.
            </p>
            <p className="scenario-index__teaches">
              {entry.metadata.objectives[0]?.statement}
            </p>
            <span className="badge">{entry.metadata.difficulty}</span>
          </li>
        ))}
      </ul>
      <p className="reading__aside">{NOT_FOR_CLINICAL_USE}</p>
    </main>
  );
}
