/**
 * The cockpit shell: the four regions, the keyboard layer, the live region, and
 * the overlays that open over them.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import './cockpit.css';
import { Banner, Button, Drawer, Modal, SegmentedControl, Toggle, usePrefersReducedMotion, useLocalPreference } from '@platform/ui';
import { useSession, sessionInternals } from '@platform/session/session-store';
import { SPEED_MULTIPLIERS, TICKS_PER_SECOND, type SpeedMultiplier } from '@platform/clock/simulation-clock';
import { PERSISTENT_MARKER_TEXT } from '@platform/safety/not-for-clinical-use';
import { LAYOUT } from '@platform/tokens/tokens';
import { useResizableRegion } from './useResizableRegion';
import { isUnreviewed, UNREVIEWED_NOTICE } from '@platform/governance/review-gate';
import { FlagControl } from '@platform/governance/FlagControl';
import { reviewModeFrom } from '@platform/governance/review-notes';
import { APP_VERSION } from '@platform/governance/status';
import type { StateField } from '@anesthesia/physiology';
import type { Scenario } from '@anesthesia/engine';
import { term, type RegionProfile } from '@anesthesia/region/profiles';
import { StatusBar } from './StatusBar';
import { MonitorRegion } from './MonitorRegion';
import { AnalysisRegion } from './AnalysisRegion';
import { ActionCockpit, crisisResponseAvailability } from './ActionCockpit';
import { DemonstrationBar } from './DemonstrationBar';
import { useDemonstration } from '@anesthesia/demo/useDemonstration';
import { WhyPanel } from './WhyPanel';
import {
  announcementsFor, mechanicalPulseFromState, stateSummary, waveformDescriptions, SHORTCUTS,
} from './accessibility';
import { promptFor, type Prompt } from './guidance';
import { concentrationCsv } from './ConcentrationPanel';
import { findStacking } from '@anesthesia/debrief/analysis';
import { EXPLAINERS, getExplainer } from '@anesthesia/content/explainers';
import { getDrugCard } from '@anesthesia/content/drug-cards';
import type { DrugConcentration } from '@platform/kernel/protocol';
import { requireSource } from '@platform/docs/sources';
import type { RhythmId } from '@anesthesia/waveforms/types';
import type { SonificationEngine } from '@platform/audio/sonification';
import { ManualCrisisInjector } from './ManualCrisisInjector';

export interface CockpitProps {
  readonly scenario: Scenario;
  readonly region: RegionProfile;
  readonly audio: SonificationEngine;
  /** True while the scripted demonstration is driving the session. */
  readonly demonstrating?: boolean;
  /** Hand the session back to the learner, wherever the demonstration got to. */
  readonly onTakeControls?: (() => void) | undefined;
  readonly onEnd: () => void;
}

export function depthConfidenceFor(
  concentrations: readonly Pick<DrugConcentration, 'drugId' | 'modelId'>[],
) {
  const propofol = concentrations.find((drug) => drug.drugId === 'propofol');
  return propofol?.modelId === 'propofol-paedfusor-2005'
    ? { label: 'Teaching model', kind: 'teaching' as const }
    : { label: 'Predicted', kind: 'default' as const };
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
  fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 1,
} as const;
const DEFAULT_AIRWAY = {
  intubated: false, attempts: 0, lastGrade: null, attemptInProgress: false, attemptSecondsRemaining: 0,
  patencyFraction: 1, bronchospasmSeverity: 0, jawThrustCpapSecondsRemaining: 0,
  device: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
} as const;
const DEFAULT_HYPNOTIC_LINE = { connected: true, inspected: false } as const;
const DEFAULT_RESUSCITATION = {
  epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
  lastEpinephrineTick: null, crystalloidTotalMl: 0,
  hemorrhageActive: false,
  packedRedBloodCellUnits: 0, bloodProductTotalMl: 0,
  freshFrozenPlasmaUnits: 0,
  dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
  lastDantroleneTick: null, activeCooling: false,
  chestCompressionsActive: false,
} as const;

export function Cockpit({
  scenario, region, audio, demonstrating = false, onTakeControls, onEnd,
}: CockpitProps) {
  const session = useSession();
  const reducedMotion = usePrefersReducedMotion();
  // The demonstration performs the same actions through the same path a learner
  // does, so what it shows is the engine and not a recording of it.
  const demonstration = useDemonstration({
    active: demonstrating,
    tick: session.tick,
    act: session.act,
    onFinished: () => onTakeControls?.(),
  });
  const [colorblindSafe] = useLocalPreference('colorblind-safe', false);
  const [whyField, setWhyField] = useState<StateField | null>(null);
  const [explainerId, setExplainerId] = useState<string | null>(null);
  const [drugCardId, setDrugCardId] = useState<string | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [crisisInjectorOpen, setCrisisInjectorOpen] = useState(false);
  // Sound is OFF until the learner asks for it, and nothing asks them.
  //
  // The pulse tone is genuinely useful — its pitch falls with saturation, which
  // is how an anaesthetist tracks saturation while looking at the airway, and it
  // is the strongest channel a low-vision learner has here. But an unsolicited
  // box on arrival is an interruption, and "nothing interrupts arrival" is a
  // rule this project holds elsewhere. It lives in the overflow menu instead.
  const [soundOn, setSoundOn] = useLocalPreference('sound-on', false);
  const [announcement, setAnnouncement] = useState('');
  const [criticalAnnouncement, setCriticalAnnouncement] = useState('');
  const [selectedTick, setSelectedTick] = useState<number | null>(null);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const promptsShown = useRef(new Map<string, number>());
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);

  // Review mode is a URL choice, not a stored one: a learner should never be
  // invited to argue with the content, and a reviewer should never hunt for the
  // way to.
  const reviewMode = useMemo(
    () => reviewModeFrom(typeof location === 'undefined' ? '' : location.search),
    [],
  );

  const previousState = useRef<Readonly<Record<string, number>> | null>(null);
  const lastFrame = useRef<number>(0);
  const cockpitRef = useRef<HTMLDivElement>(null);

  /** Read the region's real size, so a drag starts from where the region IS. */
  const measureRegion = useCallback((selector: string, axis: 'height' | 'width') => () => {
    const element = cockpitRef.current?.querySelector(selector);
    const rect = element?.getBoundingClientRect();
    return axis === 'height' ? (rect?.height ?? LAYOUT.actionCockpitHeightPx) : (rect?.width ?? 480);
  }, []);

  const actionHeight = useResizableRegion({
    storageKey: 'opensimlab.action-height',
    label: 'Height of the action region',
    axis: 'row',
    min: LAYOUT.actionCockpitMinPx,
    max: LAYOUT.actionCockpitMaxPx,
    // Dragging the handle UP makes the region taller.
    invert: true,
    measure: measureRegion('.cockpit__actions', 'height'),
  });

  const analysisWidth = useResizableRegion({
    storageKey: 'opensimlab.analysis-width',
    label: 'Width of the analysis region',
    axis: 'column',
    min: 280,
    max: 900,
    measure: measureRegion('.cockpit__analysis', 'width'),
  });

  // Everything below reads the engine's report of what the equipment is doing.
  // Nothing here remembers what the learner asked for: a refused setting, an
  // empty syringe and a failed intubation all have to be visible as such.
  const equipment = session.equipment;
  const ventilator = equipment?.ventilator ?? DEFAULT_VENTILATOR;
  const airway = equipment?.airway ?? DEFAULT_AIRWAY;
  const hypnoticLine = equipment?.hypnoticLine ?? DEFAULT_HYPNOTIC_LINE;
  const resuscitation = equipment?.resuscitation ?? DEFAULT_RESUSCITATION;
  const lastExposure = equipment?.lastExposure ?? null;
  const injectedCrises = equipment?.injectedCrisisIds ?? [];
  const {
    hasAnaphylaxisResponse, hasHypermetabolicResponse, hasCardiacArrestResponse,
  } = crisisResponseAvailability(scenario, injectedCrises);
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
  const neuromuscularConfidence = useMemo(() => {
    const confidence = session.concentrations.find((drug) => drug.drugId === 'rocuronium')?.confidence;
    if (!confidence) return undefined;
    return confidence === 'teaching'
      ? { label: 'Teaching model', kind: 'teaching' as const }
      : confidence === 'out-of-range'
        ? { label: 'Out of range', kind: 'out-of-range' as const }
        : { label: confidence === 'published' ? 'Published' : 'Pending check', kind: 'default' as const };
  }, [session.concentrations]);
  const depthModelConfidence = useMemo(() => {
    return depthConfidenceFor(session.concentrations);
  }, [session.concentrations]);

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
    if (soundOn) audio.pulse(session.state.spo2Percent ?? 100);
  }, [session.tick, audio, session.state, session.waveformBlocks.length]);

  useEffect(() => {
    const highest = session.alarms[0];
    if (soundOn && highest) audio.alarm(highest.priority);
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
      showTrainOfFour: scenario.equipment.monitoring.includes('train-of-four'),
      jawThrustCpapSecondsRemaining: airway.jawThrustCpapSecondsRemaining,
      resuscitation,
      epinephrineLabel: term(region, 'epinephrine'),
      lastExposure,
      actualBodyWeightKg: scenario.patient.weightKg,
      showEpinephrineSupport: hasAnaphylaxisResponse,
      showHypermetabolicSupport: hasHypermetabolicResponse,
      showCardiacArrestSupport: hasCardiacArrestResponse,
    }));
  }, [
    session.state, session.alarms, speak, infusions, ventilator, invalidParameters,
    scenario.equipment.monitoring, scenario.patient.weightKg, airway.jawThrustCpapSecondsRemaining,
    resuscitation, region, lastExposure, hasAnaphylaxisResponse, hasHypermetabolicResponse,
    hasCardiacArrestResponse,
  ]);

  const readWaveforms = useCallback(() => {
    speak(waveformDescriptions({
      rhythm,
      bronchospasmSeverity: airway.bronchospasmSeverity,
      airwayPatencyFraction: airway.patencyFraction,
      perfusionIndex: session.state?.perfusionIndex ?? 0.8,
      artifacts: waveformArtifacts,
      ventilating: (session.state?.respiratoryRateBpm ?? 0) > 0,
      mechanicalPulse: mechanicalPulseFromState(session.state),
    }).map((entry) => `${entry.label}: ${entry.description}`).join(' '));
  }, [session.state, speak, rhythm, waveformArtifacts, airway]);

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
        case 'c': case 'C':
          session.act({ type: 'chest-compressions', payload: {
            active: !(resuscitation.chestCompressionsActive ?? false),
          } });
          break;
        case 'e': case 'E':
          session.act({ type: 'cardiac-arrest-epinephrine', payload: { route: 'iv', doseMg: 1 } });
          break;
        case 'd': case 'D':
          session.act({ type: 'defibrillation', payload: { energyJ: 200, waveform: 'biphasic' } });
          break;
        case '?': setShortcutsOpen(true); break;
        default: break;
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [session, readSummary, readWaveforms, resuscitation.chestCompressionsActive]);

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

  // The learner's own geometry, remembered on this device. Both default to a
  // share of the viewport rather than a pixel count, so a laptop and a lecture
  // display each get a sensible layout without anyone touching anything.
  const style = {
    ...(actionHeight.size !== null ? { '--action-cockpit-height': `${actionHeight.size}px` } : {}),
    ...(analysisWidth.size !== null ? { '--analysis-fraction': `${analysisWidth.size}px` } : {}),
  } as CSSProperties;

  return (
    <div
      className={classes}
      style={style}
      ref={cockpitRef}
      {...(demonstration.beat ? { 'data-demo-focus': demonstration.beat.focus } : {})}
    >
      <a className="skip-link" href="#monitor-region">Skip to the monitor</a>

      <DemonstrationBar
        beat={demonstration.beat}
        progress={demonstration.progress}
        onTakeControls={() => onTakeControls?.()}
      />

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
          airwayPatencyFraction={airway.patencyFraction}
          bronchospasmSeverity={airway.bronchospasmSeverity}
          mechanicalPulse={mechanicalPulseFromState(session.state)}
          reducedMotion={reducedMotion}
          colorblindSafe={colorblindSafe}
          showLimits
          primaryTracesOnly={false}
          canvasHeight="fill"
          onSilence={(alarmId) => session.act({ type: 'silence-alarm', payload: { alarmId } })}
          onWhy={setWhyField}
          modelConfidence={depthModelConfidence}
          showTrainOfFour={scenario.equipment.monitoring.includes('train-of-four')}
          {...(neuromuscularConfidence ? { neuromuscularConfidence } : {})}
        />
      </div>

      {/* The separators. Real ones: focusable, arrow-key operable, announcing
          their value, and returning to the default on Home or a double-click. */}
      <div className="divider divider--vertical" {...analysisWidth.handleProps} />
      <div className="divider divider--horizontal" {...actionHeight.handleProps} />

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
          hypnoticLine={hypnoticLine}
          resuscitation={resuscitation}
          injectedCrisisIds={injectedCrises}
          lastExposure={lastExposure}
          syringeRemaining={syringeRemaining}
          ventilator={ventilator}
          intubated={airway.intubated}
          airwayAttempts={airway.attempts}
          lastGrade={airway.lastGrade}
          airwayAttemptInProgress={airway.attemptInProgress}
          airwayAttemptSecondsRemaining={airway.attemptSecondsRemaining}
          jawThrustCpapSecondsRemaining={airway.jawThrustCpapSecondsRemaining}
          airwayDevice={airway.device}
          supraglotticInsertionSecondsRemaining={airway.supraglotticInsertionSecondsRemaining}
          helpRequestedAtTick={airway.helpRequestedAtTick}
          muscleRigidityFraction={session.state?.muscleRigidityFraction ?? 0}
          trainOfFourRatio={session.state?.trainOfFourRatio ?? 1}
          trainOfFourCount={session.state?.trainOfFourCount ?? 4}
          onBolus={(drugId, amount, unit) => session.act({ type: 'bolus', payload: { drugId, amount, unit } })}
          onInfusion={(drugId, rate, unit) => session.act({ type: 'infusion', payload: { drugId, rate, unit } })}
          onHypnoticLine={(action) => session.act({ type: 'hypnotic-line', payload: { action } })}
          onFluid={(fluidId, volumeMl) => session.act({ type: 'fluid', payload: { fluidId, volumeMl } })}
          onBloodProduct={(productId, units) => session.act({
            type: 'blood-product', payload: { productId, units },
          })}
          onCoagulationLabs={() => session.act({ type: 'coagulation-labs', payload: {} })}
          onVentilator={(settings) => session.act({ type: 'ventilator', payload: settings as never })}
          onLaryngoscopy={(technique) => session.act({ type: 'laryngoscopy', payload: { technique } })}
          onAirwayManeuver={(maneuver) => session.act({ type: 'airway-maneuver', payload: { maneuver } })}
          onCallForHelp={() => session.act({ type: 'call-for-help', payload: { context: 'airway' } })}
          onAirwayDevice={(device) => session.act({ type: 'airway-device', payload: { device } })}
          onEpinephrine={(doseMicrograms) => session.act({
            type: 'epinephrine', payload: { route: 'iv', doseMicrograms },
          })}
          onDantrolene={() => session.act({
            type: 'dantrolene', payload: { route: 'iv', doseMgPerKg: 2.5 },
          })}
          onActiveCooling={(active) => session.act({ type: 'active-cooling', payload: { active } })}
          onSeizureSuppression={() => session.act({
            type: 'seizure-suppression', payload: { route: 'iv', medicationClass: 'benzodiazepine' },
          })}
          onLipidEmulsion={() => session.act({
            type: 'lipid-emulsion', payload: {
              route: 'iv', protocol: 'initial', concentrationPercent: 20,
            },
          })}
          onChestCompressions={(active) => session.act({
            type: 'chest-compressions', payload: { active },
          })}
          onArrestEpinephrine={() => session.act({
            type: 'cardiac-arrest-epinephrine', payload: { route: 'iv', doseMg: 1 },
          })}
          onDefibrillation={(energyJ) => session.act({
            type: 'defibrillation', payload: { energyJ, waveform: 'biphasic' },
          })}
          onNeuromuscularReversal={(agent, doseMgPerKg) => session.act({
            type: 'neuromuscular-reversal', payload: {
              agent, route: 'iv', ...(doseMgPerKg === undefined ? {} : { doseMgPerKg }),
              ...(agent === 'neostigmine' ? { antimuscarinic: true } : {}),
            },
          })}
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
            <UnreviewedMarker review={getExplainer(explainerId).review} />
            {reviewMode && (
              <FlagControl
                itemKey={`explainer:${explainerId}`}
                itemLabel={getExplainer(explainerId).title}
                contentVersion={getExplainer(explainerId).review.contentVersion}
                appVersion={APP_VERSION}
                now={() => new Date().toISOString()}
              />
            )}
          </div>
        )}
      </Drawer>

      <Drawer open={drugCardId !== null} title={drugCardId ? (getDrugCard(drugCardId)?.name ?? '') : ''} onClose={() => setDrugCardId(null)}>
        {drugCardId && getDrugCard(drugCardId) && (
          <DrugCardBody drugId={drugCardId} reviewMode={reviewMode} />
        )}
      </Drawer>

      <Modal open={shortcutsOpen} title="More options" onClose={() => setShortcutsOpen(false)}
        footer={<Button onClick={() => setShortcutsOpen(false)}>Close</Button>}>
        {/* The speed selector and the single-step control leave the status bar
            at a phone width under the sacrifice order. Every removal has to stay
            reachable from the overflow, so both are here in full whatever the
            width. */}
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
          <Button onClick={session.singleStep}>Advance one simulated second</Button>
        </div>
        <div className="overflow-menu__sound">
          <Toggle
            checked={soundOn}
            onChange={(next: boolean) => {
              setSoundOn(next);
              // Web Audio needs a user gesture to start, and this click is one.
              if (next) void audio.enable();
            }}
            label={soundOn ? 'Sound on' : 'Sound off'}
          />
          <p className="field__hint">
            The pulse tone falls in pitch as saturation falls, which is how anaesthetists track
            saturation while looking somewhere else. Sound is never the only channel: every alarm
            and cue is also shown.
          </p>
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
        <Button onClick={() => { setShortcutsOpen(false); setCrisisInjectorOpen(true); }}>
          Open manual crisis injector
        </Button>
      </Modal>

      <Drawer open={crisisInjectorOpen} title="Manual crisis injector"
        onClose={() => setCrisisInjectorOpen(false)}>
        <ManualCrisisInjector
          injectedCrisisIds={equipment?.injectedCrisisIds ?? []}
          onInject={(crisisId) => session.act({ type: 'inject-crisis', payload: { crisisId } })}
        />
      </Drawer>

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

function DrugCardBody({ drugId, reviewMode }: { drugId: string; reviewMode: boolean }) {
  const card = getDrugCard(drugId);
  if (!card) return null;
  return (
    <div className="reading" style={{ padding: 0 }}>
      <p className="field__label">{card.drugClass}</p>
      <p>{card.mechanism}</p>
      <h3>Dosing</h3>
      <p>Induction: {card.inductionDose}</p>
      <p>Maintenance: {card.maintenanceDose}</p>
      {/* Where these figures came from, and where they differ from the label.
          A dose is the most consequential thing on this card and was the only
          clinical content in the application a reader could not check. */}
      <p className="field__hint">
        Checked against {requireSource(card.dosing.sourceId).title}.{' '}
        {card.dosing.comparedWithLabel}
      </p>
      <h3>Onset and duration</h3>
      <p>{card.onset}</p>
      <p>{card.duration}</p>
      <h3>What to anticipate</h3>
      <ul>{card.adverseEffects.map((effect) => <li key={effect}>{effect}</li>)}</ul>
      <h3>Contraindications and cautions</h3>
      <ul>{card.contraindications.map((item) => <li key={item}>{item}</li>)}</ul>
      <h3>What to watch on the monitor</h3>
      <p>{card.watchFor}</p>
      <UnreviewedMarker review={card.review} />
      {reviewMode && (
        <FlagControl
          itemKey={`drug-card:${card.drugId}`}
          itemLabel={`${card.name} drug card`}
          contentVersion={card.review.contentVersion}
          appVersion={APP_VERSION}
          now={() => new Date().toISOString()}
        />
      )}
    </div>
  );
}

/**
 * The per-item clinical review marker.
 *
 * One line on the front page saying the whole build is unreviewed is easy to
 * scroll past, and it does not tell a reader WHICH claim in front of them nobody
 * checked. This sits at the bottom of the specific claim.
 */
export function UnreviewedMarker({ review }: { review: { reviewer: string; reviewedOn: string } }) {
  if (!isUnreviewed(review)) {
    return (
      <p className="reading__aside">
        Reviewed by {review.reviewer} on {review.reviewedOn}.
      </p>
    );
  }
  return (
    <p className="reading__aside" data-unreviewed="true">
      <strong>Not clinically reviewed.</strong> {UNREVIEWED_NOTICE}
    </p>
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
