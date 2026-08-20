/**
 * The cockpit shell: the four regions, the keyboard layer, the live region, and
 * the overlays that open over them.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './cockpit.css';
import { Banner, Button, Drawer, Modal, SegmentedControl, usePrefersReducedMotion, useLocalPreference } from '@platform/ui';
import { useSession, sessionInternals } from '@platform/session/session-store';
import { SPEED_MULTIPLIERS, TICKS_PER_SECOND, type SpeedMultiplier } from '@platform/clock/simulation-clock';
import { PERSISTENT_MARKER_TEXT } from '@platform/safety/not-for-clinical-use';
import type { StateField } from '@anesthesia/physiology';
import type { Scenario } from '@anesthesia/engine';
import type { RegionProfile } from '@anesthesia/region/profiles';
import { StatusBar } from './StatusBar';
import { MonitorRegion } from './MonitorRegion';
import { AnalysisRegion } from './AnalysisRegion';
import { ActionCockpit } from './ActionCockpit';
import { WhyPanel } from './WhyPanel';
import { announcementsFor, stateSummary, waveformDescriptions, SHORTCUTS } from './accessibility';
import { promptFor, type Prompt } from './guidance';
import { concentrationCsv } from './ConcentrationPanel';
import { findStacking } from '@anesthesia/debrief/analysis';
import { EXPLAINERS, getExplainer } from '@anesthesia/content/explainers';
import { getDrugCard } from '@anesthesia/content/drug-cards';
import type { RhythmId } from '@anesthesia/waveforms/types';
import type { SonificationEngine } from '@platform/audio/sonification';

export interface CockpitProps {
  readonly scenario: Scenario;
  readonly region: RegionProfile;
  readonly audio: SonificationEngine;
  readonly onEnd: () => void;
}

/** Download a file locally. No network request is made. */
function downloadLocal(filename: string, contents: string, type: string): void {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * What the tray shows before the first state message arrives. Both are module
 * constants rather than inline literals: a fresh object identity on every render
 * rebuilds the track configuration, which tears down and re-creates the sweep
 * renderer, which clears the canvas before a single trace is ever drawn.
 */
const DEFAULT_VENTILATOR = {
  mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 12,
  fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0,
} as const;
const DEFAULT_AIRWAY = { intubated: false, attempts: 0, lastGrade: null } as const;

export function Cockpit({ scenario, region, audio, onEnd }: CockpitProps) {
  const session = useSession();
  const reducedMotion = usePrefersReducedMotion();
  const [colorblindSafe] = useLocalPreference('colorblind-safe', false);
  const [whyField, setWhyField] = useState<StateField | null>(null);
  const [explainerId, setExplainerId] = useState<string | null>(null);
  const [drugCardId, setDrugCardId] = useState<string | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [audioPromptDismissed, setAudioPromptDismissed] = useLocalPreference('audio-prompt-dismissed', false);
  const [announcement, setAnnouncement] = useState('');
  const [criticalAnnouncement, setCriticalAnnouncement] = useState('');
  const [selectedTick, setSelectedTick] = useState<number | null>(null);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const promptsShown = useRef(new Map<string, number>());
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);

  const previousState = useRef<Readonly<Record<string, number>> | null>(null);
  const lastFrame = useRef<number>(0);

  // Everything below reads the engine's report of what the equipment is doing.
  // Nothing here remembers what the learner asked for: a refused setting, an
  // empty syringe and a failed intubation all have to be visible as such.
  const equipment = session.equipment;
  const ventilator = equipment?.ventilator ?? DEFAULT_VENTILATOR;
  const airway = equipment?.airway ?? DEFAULT_AIRWAY;
  const rhythm = (equipment?.rhythmId ?? 'sinus') as RhythmId;
  const invalidParameters = useMemo(
    () => new Set(equipment?.invalidParameters ?? []),
    [equipment?.invalidParameters],
  );
  const artifactParameters = useMemo(
    () => new Set(equipment?.artifactParameters ?? []),
    [equipment?.artifactParameters],
  );
  const waveformArtifacts = useMemo(
    () => new Set(equipment?.waveformArtifacts ?? []),
    [equipment?.waveformArtifacts],
  );
  const infusions = useMemo(
    () => (equipment?.drugs ?? [])
      .filter((drug) => drug.infusionRate > 0)
      .map((drug) => ({
        drugId: drug.drugId,
        rate: drug.infusionRate,
        unit: drug.infusionUnit,
        elapsedSeconds: drug.infusionSinceTick === null
          ? 0
          : Math.max(0, (session.tick - drug.infusionSinceTick) / TICKS_PER_SECOND),
      })),
    [equipment?.drugs, session.tick],
  );
  const syringeRemaining = useMemo(
    () => Object.fromEntries((equipment?.drugs ?? []).map((drug) => [drug.drugId, drug.syringeRemainingMl])),
    [equipment?.drugs],
  );

  // The animation loop turns wall-clock time into ticks. The clock, not the frame
  // rate, decides how many, so the trajectory is identical at any frame rate.
  useEffect(() => {
    let handle = 0;
    const loop = (time: number) => {
      const elapsed = lastFrame.current === 0 ? 16.7 : time - lastFrame.current;
      lastFrame.current = time;
      session.frame(elapsed);
      handle = requestAnimationFrame(loop);
    };
    handle = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(handle);
    // The store's actions are stable identities, so only mount matters here.
  }, []);

  // Announce only on a clinically meaningful change, never on every tick.
  useEffect(() => {
    if (!session.state) return;
    const announcements = announcementsFor(previousState.current, session.state, session.alarms);
    previousState.current = session.state;
    if (announcements.length === 0) return;
    const critical = announcements.filter((entry) => entry.severity === 'critical');
    if (critical.length > 0) setCriticalAnnouncement(critical.map((entry) => entry.text).join('. '));
    else setAnnouncement(announcements.map((entry) => entry.text).join('. '));
  }, [session.state, session.alarms]);

  // The pulse tone sounds once per beat, at the pitch saturation implies.
  useEffect(() => {
    if (!session.state) return;
    const pulses = session.waveformBlocks.length;
    if (pulses === 0) return;
    audio.pulse(session.state.spo2Percent ?? 100);
  }, [session.tick, audio, session.state, session.waveformBlocks.length]);

  useEffect(() => {
    const highest = session.alarms[0];
    if (highest) audio.alarm(highest.priority);
  }, [session.alarms, audio]);

  // Guidance is presentational. It reads state the engine produced anyway and
  // never feeds anything back, which is what makes the trajectory identical at
  // every guidance level.
  useEffect(() => {
    const next = promptFor(session.guidance, {
      tick: session.tick,
      state: session.state,
      actions: sessionInternals().recorder?.build('pending').actions ?? [],
      ventilating: (session.state?.respiratoryRateBpm ?? 0) > 0,
      alarmCount: session.alarms.length,
    }, promptsShown.current);
    if (next && next.id !== prompt?.id) {
      promptsShown.current.set(next.id, session.tick);
      setPrompt(next);
    }
    if (!next && prompt) setPrompt(null);
  }, [session.tick, session.guidance, session.state, session.alarms.length, prompt]);

  const speak = useCallback((text: string) => setAnnouncement(text), []);

  const readSummary = useCallback(() => {
    if (!session.state) return;
    speak(stateSummary(session.state as never, {
      alarms: session.alarms,
      infusions,
      ventilator,
      invalid: invalidParameters,
    }));
  }, [session.state, session.alarms, speak, infusions, ventilator, invalidParameters]);

  const readWaveforms = useCallback(() => {
    speak(waveformDescriptions({
      rhythm,
      bronchospasmSeverity: 0,
      perfusionIndex: session.state?.perfusionIndex ?? 0.8,
      artifacts: waveformArtifacts,
      ventilating: (session.state?.respiratoryRateBpm ?? 0) > 0,
      mechanicalPulse: ventilator.delivering,
    }).map((entry) => `${entry.label}: ${entry.description}`).join(' '));
  }, [session.state, speak, rhythm, waveformArtifacts, ventilator.delivering]);

  // The keyboard layer. Every shortcut is documented in SHORTCUTS and reachable
  // from the reference without leaving the cockpit.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      switch (event.key) {
        case ' ':
          event.preventDefault();
          if (session.transport === 'running') session.pause(); else session.play();
          break;
        case '.': session.singleStep(); break;
        case 's': case 'S': readSummary(); break;
        case 'w': case 'W': readWaveforms(); break;
        case 'a': case 'A': {
          const highest = session.alarms[0];
          if (highest) session.act({ type: 'silence-alarm', payload: { alarmId: highest.alarmId } });
          break;
        }
        case 'v': case 'V':
          session.act({ type: 'ventilator', payload: { delivering: true, mode: 'volume-control' } });
          break;
        case 'l': case 'L':
          session.act({ type: 'laryngoscopy', payload: { technique: 'direct' } });
          break;
        case '?': setShortcutsOpen(true); break;
        default: break;
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [session, readSummary, readWaveforms]);

  const timeToPeak = useMemo(() => ({ propofol: 100, remifentanil: 90 }), []);

  /**
   * Boluses stacked before the previous one reached its peak, computed live from
   * the recorded actions. The debrief says this afterwards; the plot says it
   * while there is still time to act on it, which is where it teaches.
   */
  const stacking = useMemo(
    () => findStacking(
      sessionInternals().recorder?.build('pending').actions ?? [],
      session.history,
      timeToPeak,
    ),
    [session.history, timeToPeak],
  );

  const classes = [
    'cockpit',
    analysisOpen ? 'cockpit--analysis-open' : '',
    actionsOpen ? 'cockpit--actions-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <a className="skip-link" href="#monitor-region">Skip to the monitor</a>

      <div className="cockpit__status">
        <StatusBar
          scenario={scenario}
          elapsed={session.elapsed}
          transport={session.transport}
          speed={session.speed}
          onPlay={session.play}
          onPause={session.pause}
          onStep={session.singleStep}
          onReset={() => { if (confirm('Reset the scenario? The clock returns to zero, the patient returns to baseline, the log is cleared, and any running infusion stops.')) session.resetSession(); }}
          onSpeed={(speed: SpeedMultiplier) => session.setSpeed(speed)}
          onOverflow={() => setShortcutsOpen(true)}
        />
      </div>

      <div className="cockpit__monitor" id="monitor-region">
        <MonitorRegion
          state={session.state}
          blocks={session.waveformBlocks}
          alarms={session.alarms}
          tick={session.tick}
          invalidParameters={invalidParameters}
          artifactParameters={artifactParameters}
          waveformArtifacts={waveformArtifacts}
          rhythm={rhythm}
          mechanicalPulse={ventilator.delivering}
          reducedMotion={reducedMotion}
          colorblindSafe={colorblindSafe}
          showLimits
          primaryTracesOnly={false}
          canvasHeight={320}
          onSilence={(alarmId) => session.act({ type: 'silence-alarm', payload: { alarmId } })}
          onWhy={setWhyField}
          modelConfidence={{ label: 'Predicted', kind: 'default' }}
        />
      </div>

      <div className="cockpit__analysis">
        <AnalysisRegion
          scenario={scenario}
          history={session.history}
          concentrations={session.concentrations}
          attribution={session.attribution}
          log={session.log}
          unreadLog={session.unreadLog}
          tick={session.tick}
          timeToPeakSeconds={timeToPeak}
          stacking={stacking}
          wide={typeof window !== 'undefined' && window.innerWidth >= 1920}
          onSelectTick={setSelectedTick}
          selectedTick={selectedTick}
          onExportCsv={() => downloadLocal(
            `opensimlab-${scenario.metadata.id}-concentrations.csv`,
            concentrationCsv(session.history),
            'text/csv',
          )}
          onOpenExplainer={setExplainerId}
          onMarkLogRead={session.markLogRead}
        />
      </div>

      <div className="cockpit__actions">
        <ActionCockpit
          scenario={scenario}
          region={region}
          infusions={infusions}
          syringeRemaining={syringeRemaining}
          ventilator={ventilator}
          intubated={airway.intubated}
          airwayAttempts={airway.attempts}
          lastGrade={airway.lastGrade}
          onBolus={(drugId, amount, unit) => session.act({ type: 'bolus', payload: { drugId, amount, unit } })}
          onInfusion={(drugId, rate, unit) => session.act({ type: 'infusion', payload: { drugId, rate, unit } })}
          onVentilator={(settings) => session.act({ type: 'ventilator', payload: settings as never })}
          onLaryngoscopy={(technique) => session.act({ type: 'laryngoscopy', payload: { technique } })}
          onDrugCard={setDrugCardId}
        />
      </div>

      {/* Small screens: the Analysis region and the Action Cockpit open as overlays. */}
      <div className="mobile-actions">
        <Button onClick={() => setAnalysisOpen((open) => !open)}>Analysis</Button>
        <Button variant="primary" onClick={() => setActionsOpen((open) => !open)}>Actions</Button>
      </div>

      {/* Guidance. Non-blocking, dismissible, and never shown during an alarm. */}
      {prompt && (
        <div style={{ position: 'fixed', insetBlockStart: 'calc(var(--status-bar-height) + var(--space-3))', insetInlineStart: '50%', transform: 'translateX(-50%)', zIndex: 54, inlineSize: 'min(560px, 92vw)' }}>
          <Banner
            kind="advisory"
            actions={<Button compact variant="ghost" onClick={() => setPrompt(null)}>Dismiss</Button>}
          >
            <strong>{prompt.suggestion}</strong>
            <br />
            <span className="field__hint">{prompt.because}</span>
            {prompt.concept && (
              <>
                {' '}
                <Button variant="ghost" compact onClick={() => setExplainerId(prompt.concept!)}>
                  Read more about this
                </Button>
              </>
            )}
          </Banner>
        </div>
      )}

      {/* The live regions. Polite for ordinary change, assertive for critical. */}
      <div className="visually-hidden" aria-live="polite" aria-atomic="true">{announcement}</div>
      <div className="visually-hidden" role="alert">{criticalAnnouncement}</div>
      <span className="visually-hidden">{PERSISTENT_MARKER_TEXT}</span>

      <WhyPanel
        open={whyField !== null}
        field={whyField}
        value={whyField && session.state ? session.state[whyField] ?? null : null}
        attribution={session.attribution}
        onClose={() => setWhyField(null)}
        onOpenExplainer={setExplainerId}
        onOpenDrugCard={setDrugCardId}
      />

      <Drawer open={explainerId !== null} title={explainerId ? getExplainer(explainerId).title : ''} onClose={() => setExplainerId(null)}>
        {explainerId && (
          <div className="reading" style={{ padding: 0 }}>
            {getExplainer(explainerId).body.split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
            <p className="reading__aside">{getExplainer(explainerId).diagram.caption}</p>
            <p className="reading__aside">Reflects: {getExplainer(explainerId).reflects}</p>
          </div>
        )}
      </Drawer>

      <Drawer open={drugCardId !== null} title={drugCardId ? (getDrugCard(drugCardId)?.name ?? '') : ''} onClose={() => setDrugCardId(null)}>
        {drugCardId && getDrugCard(drugCardId) && <DrugCardBody drugId={drugCardId} />}
      </Drawer>

      <Modal open={shortcutsOpen} title="More options" onClose={() => setShortcutsOpen(false)}
        footer={<Button onClick={() => setShortcutsOpen(false)}>Close</Button>}>
        {/* The speed selector leaves the status bar at a phone width under the
            sacrifice order. Every removal has to stay reachable from the
            overflow, so it is here in full whatever the width. */}
        <div className="overflow-menu__speed">
          <SegmentedControl<SpeedMultiplier>
            label="Simulation speed"
            value={session.speed}
            onChange={(speed: SpeedMultiplier) => session.setSpeed(speed)}
            options={SPEED_MULTIPLIERS.map((multiplier) => ({
              value: multiplier,
              label: `${multiplier}×`,
              srLabel: `${multiplier} times speed`,
            }))}
          />
          <p className="field__hint">{scenario.patient.procedure}</p>
        </div>
        <h3>Keyboard shortcuts</h3>
        <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'var(--space-2) var(--space-4)' }}>
          {SHORTCUTS.map((shortcut) => (
            <div key={shortcut.keys} style={{ display: 'contents' }}>
              <dt><kbd>{shortcut.keys}</kbd></dt>
              <dd>{shortcut.action}</dd>
            </div>
          ))}
        </dl>
        <Button onClick={onEnd}>End the session and open the debrief</Button>
      </Modal>

      {/* The one-time, non-blocking prompt explaining what the pulse tone is for. */}
      {!audioPromptDismissed && (
        <div style={{ position: 'fixed', insetBlockEnd: 'var(--space-4)', insetInlineStart: 'var(--space-4)', zIndex: 58, maxInlineSize: '420px' }}>
          <Banner
            actions={
              <>
                <Button compact variant="primary" onClick={() => { void audio.enable(); setAudioPromptDismissed(true); }}>
                  Turn sound on
                </Button>
                <Button compact variant="ghost" onClick={() => setAudioPromptDismissed(true)}>No thanks</Button>
              </>
            }
          >
            The pulse tone falls in pitch as saturation falls. It is how anaesthetists actually
            track saturation while looking somewhere else. Sound is never the only channel: every
            alarm and cue is also shown.
          </Banner>
        </div>
      )}

      {session.phase === 'worker-lost' && (
        <Modal open title="The simulation engine stopped" dismissible={false}
          footer={<Button variant="primary" onClick={session.resumeAfterWorkerLoss}>Resume from the transcript</Button>}>
          <p>
            The background worker running the physiology terminated unexpectedly. The simulation is
            paused and your session transcript is intact.
          </p>
          <p>
            Resuming replays every action you took into a fresh worker, which reproduces the session
            exactly, because the engine is deterministic.
          </p>
        </Modal>
      )}

      {session.catchUpNotice && (
        <Modal open title="The simulation was paused while this tab was hidden" onClose={() => { /* the notice is dismissed by resuming */ }}
          footer={
            <>
              <Button variant="primary" onClick={session.play}>Resume</Button>
              <Button onClick={session.resetSession}>Reset</Button>
            </>
          }>
          <p>
            Browsers throttle hidden tabs, so the clock was capped rather than fast-forwarding the
            patient by however long you were away. At most five simulated seconds were caught up.
          </p>
        </Modal>
      )}
    </div>
  );
}

function DrugCardBody({ drugId }: { drugId: string }) {
  const card = getDrugCard(drugId);
  if (!card) return null;
  return (
    <div className="reading" style={{ padding: 0 }}>
      <p className="field__label">{card.drugClass}</p>
      <p>{card.mechanism}</p>
      <h3>Dosing</h3>
      <p>Induction: {card.inductionDose}</p>
      <p>Maintenance: {card.maintenanceDose}</p>
      <h3>Onset and duration</h3>
      <p>{card.onset}</p>
      <p>{card.duration}</p>
      <h3>What to anticipate</h3>
      <ul>{card.adverseEffects.map((effect) => <li key={effect}>{effect}</li>)}</ul>
      <h3>Contraindications and cautions</h3>
      <ul>{card.contraindications.map((item) => <li key={item}>{item}</li>)}</ul>
      <h3>What to watch on the monitor</h3>
      <p>{card.watchFor}</p>
    </div>
  );
}

/** Exposed for the tests: the internals a debrief needs after a session. */
export function debriefInputs() {
  const internals = sessionInternals();
  return {
    ticks: internals.clock.tick,
    ticksPerSecond: TICKS_PER_SECOND,
    explainers: EXPLAINERS.map((explainer) => explainer.id),
  };
}
