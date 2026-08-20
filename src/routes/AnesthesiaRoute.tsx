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
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { ENGINE_VERSION } from '@anesthesia/engine';
import { MODEL_SET_REVISION } from '@anesthesia/pharmacology/registry';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { Cockpit } from '@anesthesia/ui/Cockpit';
import { Debrief } from '@anesthesia/ui/Debrief';
import { assertTranscriptIsAnonymous } from '@platform/transcript/transcript';

const CONTENT_VERSION = ROUTINE_INDUCTION.metadata.version;

/** A seed derived from the scenario rather than from a clock, so a session replays. */
const DEFAULT_SEED = 20260819;

export function AnesthesiaRoute({ path }: { path: string }) {
  const session = useSession();
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
        scenarioId: ROUTINE_INDUCTION.metadata.id,
        scenarioVersion: ROUTINE_INDUCTION.metadata.version,
        contentVersion: CONTENT_VERSION,
        modelSetRevision: MODEL_SET_REVISION,
        engineVersion: ENGINE_VERSION,
        practiceRegion: region.id,
        seed: DEFAULT_SEED,
        scenario: ROUTINE_INDUCTION,
      },
      () => new Worker(new URL('../modules/anesthesia/solver.worker.ts', import.meta.url), { type: 'module' }),
      {
        engine: ENGINE_VERSION, content: CONTENT_VERSION,
        modelSet: MODEL_SET_REVISION, scenario: ROUTINE_INDUCTION.metadata.version,
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
          <p>{ROUTINE_INDUCTION.metadata.title}</p>
        </main>
        <NotForClinicalUseGate
          open
          onAcknowledge={() => { recordAcknowledgement(); setAcknowledged(true); }}
        />
      </>
    );
  }

  if (session.phase === 'ended') {
    const internals = sessionInternals();
    return (
      <Debrief
        scenario={ROUTINE_INDUCTION}
        history={session.history}
        log={session.log}
        actions={internals.recorder ? internals.recorder.build('pending').actions : []}
        attributionByTick={() => session.attribution}
        timeToPeakSeconds={{ propofol: 100, remifentanil: 90 }}
        replayOptions={{
          scenario: ROUTINE_INDUCTION, seed: DEFAULT_SEED,
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
          scenario={ROUTINE_INDUCTION}
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

  return <Cockpit scenario={ROUTINE_INDUCTION} region={region} audio={audio} onEnd={session.end} />;
}
