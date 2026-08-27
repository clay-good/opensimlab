/**
 * The cockpit shell: the four regions, the keyboard layer, the live region, and
 * the overlays that open over them.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import './cockpit.css';
import { Button, Drawer, Modal, SegmentedControl, Toggle, usePrefersReducedMotion, useLocalPreference } from '@platform/ui';
import { useSession, sessionInternals } from '@platform/session/session-store';
import {
  formatElapsed, SPEED_MULTIPLIERS, TICKS_PER_SECOND, type SpeedMultiplier,
} from '@platform/clock/simulation-clock';
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
  announcementsFor, arterialLineSummary, breathingCircuitSummary, mechanicalPulseFromState, stateSummary,
  waveformDescriptions, SHORTCUTS,
} from './accessibility';
import { promptFor, promptStillEligible, type Prompt } from '../tutor/guidance';
import { concentrationCsv } from './ConcentrationPanel';
import { findStacking } from '@anesthesia/debrief/analysis';
import { EXPLAINERS, getExplainer } from '@anesthesia/content/explainers';
import { getDrugCard } from '@anesthesia/content/drug-cards';
import type { DrugConcentration } from '@platform/kernel/protocol';
import { requireSource } from '@platform/docs/sources';
import type { RhythmId } from '@anesthesia/waveforms/types';
import type { SonificationEngine } from '@platform/audio/sonification';
import { ManualCrisisInjector } from './ManualCrisisInjector';
import { MaturityMarker } from '@platform/governance/MaturityMarker';
import type { ContentMaturity, MaturitySubjectKind } from '@platform/catalog/maturity';
import {
  TUTOR_INTRODUCTION_PREFERENCE, TutorIntroduction, TutorPromptCard,
} from './TutorRegion';

export interface CockpitProps {
  readonly scenario: Scenario;
  readonly region: RegionProfile;
  readonly audio: SonificationEngine;
  /** True while the scripted demonstration is driving the session. */
  readonly demonstrating?: boolean;
  /** Hand the session back to the learner, wherever the demonstration got to. */
  readonly onTakeControls?: (() => void) | undefined;
  readonly onEnd: () => void;
  readonly onReportSource?: () => void;
  readonly onSourceVisibilityChange?: (open: boolean) => void;
  readonly moduleId?: 'anesthesia' | 'emergency-medicine' | 'critical-care' | 'cardiology' | 'respiratory-medicine' | 'pediatrics' | 'neurology' | 'toxicology' | 'obstetrics' | 'neonatology';
}

export function depthConfidenceFor(
  concentrations: readonly Pick<DrugConcentration, 'drugId' | 'modelId'>[],
) {
  const propofol = concentrations.find((drug) => drug.drugId === 'propofol');
  return propofol?.modelId === 'propofol-paedfusor-2005'
    ? { label: 'Teaching model', kind: 'teaching' as const }
    : { label: 'Predicted', kind: 'default' as const };
}

export function monitorUnavailableParameters(
  equipmentInvalid: readonly string[],
  maternalArrest: boolean,
): ReadonlySet<string> {
  return new Set([
    ...equipmentInvalid,
    ...(maternalArrest ? ['meanArterialMmHg', 'spo2Percent', 'etco2MmHg'] : []),
  ]);
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
  patencyFraction: 1, postExtubationObstructionSeverity: 0,
  bronchospasmSeverity: 0, jawThrustCpapSecondsRemaining: 0,
  device: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
} as const;
const DEFAULT_HYPNOTIC_LINE = { connected: true, inspected: false } as const;
const DEFAULT_CAPNOGRAPHY_LINE = {
  obstructed: false, ventilationCrossChecked: false,
} as const;
const DEFAULT_ARTERIAL_LINE = {
  displayedMeanArterialMmHg: null, mislevelingCm: 0,
  dynamicResponse: 'normal', waveformAssessed: false, leveledAndZeroed: false,
  cuff: { status: 'idle', secondsRemaining: 0, meanArterialMmHg: null, measuredAtTick: null },
} as const;
const DEFAULT_BREATHING_CIRCUIT = {
  co2Absorbent: 'normal', inspiredCo2MmHg: 0,
  capnogramAssessed: false, absorbentReplaced: false,
} as const;
const DEFAULT_RESUSCITATION = {
  epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
  lastEpinephrineTick: null, crystalloidTotalMl: 0,
  hemorrhageActive: false,
  packedRedBloodCellUnits: 0, bloodProductTotalMl: 0,
  freshFrozenPlasmaUnits: 0,
  coagulationPanelReported: false,
  bloodProductsReleased: false,
  dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
  lastDantroleneTick: null, activeCooling: false,
  salbutamolTotalMg: 0, lastSalbutamolTick: null, bronchodilatorEffectFraction: 0,
  chestCompressionsActive: false,
  highSpinalFraction: 0, ephedrineTotalMg: 0, lastEphedrineTick: null,
  preeclampsiaBloodPressureChecks: 0, lastPreeclampsiaBloodPressure: null,
  labetalolTotalMg: 0, lastLabetalolTick: null, labetalolEffectFraction: 0,
  magnesiumSulfateTotalG: 0, lastMagnesiumSulfateTick: null,
  venousAirEmbolismFraction: 0, venousAirEntryControlled: false,
  venousAirEntryControlledAtTick: null,
} as const;

export function Cockpit({
  scenario, region, audio, demonstrating = false, onTakeControls, onEnd, onReportSource,
  onSourceVisibilityChange,
  moduleId = 'anesthesia',
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
  const [branchNoticeOpen, setBranchNoticeOpen] = useState(false);
  const [crisisInjectorOpen, setCrisisInjectorOpen] = useState(false);
  useEffect(() => {
    onSourceVisibilityChange?.(explainerId !== null || drugCardId !== null);
    return () => onSourceVisibilityChange?.(false);
  }, [drugCardId, explainerId, onSourceVisibilityChange]);
  // Sound is OFF until the learner asks for it, and nothing asks them.
  //
  // The pulse tone is genuinely useful — its pitch falls with saturation, which
  // is how a clinician tracks saturation while looking at the patient, and it
  // is the strongest channel a low-vision learner has here. But an unsolicited
  // box on arrival is an interruption, and "nothing interrupts arrival" is a
  // rule this project holds elsewhere. It lives in the overflow menu instead.
  const [soundOn, setSoundOn] = useLocalPreference('sound-on', false);
  const [announcement, setAnnouncement] = useState('');
  const [criticalAnnouncement, setCriticalAnnouncement] = useState('');
  const [selectedTick, setSelectedTick] = useState<number | null>(null);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [promptWhyOpen, setPromptWhyOpen] = useState(false);
  const [tutorCollapsed, setTutorCollapsed] = useState(false);
  const [tutorIntroductionDismissed, setTutorIntroductionDismissed] = useLocalPreference(
    TUTOR_INTRODUCTION_PREFERENCE, false,
  );
  const [tutorIntroductionOpen, setTutorIntroductionOpen] = useState(
    () => !tutorIntroductionDismissed && session.guidance !== 'unassisted',
  );
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
  const capnographyLine = equipment?.capnographyLine ?? DEFAULT_CAPNOGRAPHY_LINE;
  const arterialLine = equipment?.arterialLine ?? DEFAULT_ARTERIAL_LINE;
  const breathingCircuit = equipment?.breathingCircuit ?? DEFAULT_BREATHING_CIRCUIT;
  const hasArterialLine = scenario.equipment.monitoring.includes('arterial-line');
  const hasCircuitScenario = scenario.timeline.some((event) => event.type === 'equipment-failure'
    && event.target === 'co2-absorbent-exhaustion');
  const resuscitation = equipment?.resuscitation ?? DEFAULT_RESUSCITATION;
  const lastExposure = equipment?.lastExposure ?? null;
  const injectedCrises = equipment?.injectedCrisisIds ?? [];
  const {
    hasAnaphylaxisResponse, hasHypermetabolicResponse, hasCardiacArrestResponse,
    hasHighSpinalResponse,
    hasVenousAirEmbolismResponse,
    hasBronchospasmResponse,
    hasObstetricsMaternalArrestResponse,
  } = crisisResponseAvailability(scenario, injectedCrises);
  const rhythm = (equipment?.rhythmId ?? 'sinus') as RhythmId;
  const invalidParameters = useMemo(
    () => monitorUnavailableParameters(
      equipment?.invalidParameters ?? [], hasObstetricsMaternalArrestResponse,
    ),
    [equipment?.invalidParameters, hasObstetricsMaternalArrestResponse],
  );
  const monitorAlarms = useMemo(
    () => session.alarms.filter((alarm) => !invalidParameters.has(alarm.parameter)),
    [invalidParameters, session.alarms],
  );
  const artifactParameters = useMemo(
    () => new Set(equipment?.artifactParameters ?? []),
    [equipment?.artifactParameters],
  );
  const waveformArtifacts = useMemo(
    () => new Set(equipment?.waveformArtifacts ?? []),
    [equipment?.waveformArtifacts],
  );
  const displayedState = useMemo(() => {
    if (!session.state) return session.state;
    const pulseOx = equipment?.resuscitation.pulseOximeterArtifactAssessment;
    return {
      ...session.state,
      ...(hasArterialLine && arterialLine.displayedMeanArterialMmHg !== null
        ? { meanArterialMmHg: arterialLine.displayedMeanArterialMmHg } : {}),
      ...(pulseOx ? { spo2Percent: pulseOx.displayedSpo2Percent } : {}),
    };
  }, [hasArterialLine, session.state, arterialLine.displayedMeanArterialMmHg,
    equipment?.resuscitation.pulseOximeterArtifactAssessment]);
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
    if (tutorIntroductionOpen) return;
    const input = {
      tick: session.tick,
      state: session.state,
      actions: sessionInternals().recorder?.build('pending').actions ?? [],
      ventilating: ventilator.delivering,
      alarmCount: session.alarms.length,
      unavailableParameters: [...invalidParameters],
    };
    if (prompt) {
      if (!promptStillEligible(session.guidance, input, prompt.id)) {
        setPrompt(null);
        setPromptWhyOpen(false);
      }
      return;
    }
    const next = promptFor(session.guidance, input, promptsShown.current);
    if (next) {
      promptsShown.current.set(next.id, session.tick);
      setPromptWhyOpen(false);
      setTutorCollapsed(false);
      setPrompt(next);
    }
  }, [session.tick, session.guidance, session.state, session.alarms.length, prompt,
    tutorIntroductionOpen, invalidParameters]);

  const speak = useCallback((text: string) => setAnnouncement(text), []);

  const readSummary = useCallback(() => {
    if (!displayedState) return;
    speak(stateSummary(displayedState as never, {
      alarms: session.alarms,
      infusions,
      ventilator,
      invalid: invalidParameters,
      showTrainOfFour: scenario.equipment.monitoring.includes('train-of-four'),
      jawThrustCpapSecondsRemaining: airway.jawThrustCpapSecondsRemaining,
      capnographyLine,
      resuscitation,
      epinephrineLabel: term(region, 'epinephrine'),
      lastExposure,
      actualBodyWeightKg: scenario.patient.weightKg,
      showEpinephrineSupport: hasAnaphylaxisResponse,
      showHypermetabolicSupport: hasHypermetabolicResponse,
      showCardiacArrestSupport: hasCardiacArrestResponse,
      showHighSpinalSupport: hasHighSpinalResponse,
      showVenousAirEmbolismSupport: hasVenousAirEmbolismResponse,
      showBronchospasmSupport: hasBronchospasmResponse,
      bronchodilatorLabel: term(region, 'salbutamol'),
    })
      + (hasArterialLine ? ` ${arterialLineSummary(arterialLine)}` : '')
      + (hasCircuitScenario ? ` ${breathingCircuitSummary(breathingCircuit)}` : ''));
  }, [
    displayedState, session.alarms, speak, infusions, ventilator, invalidParameters,
    scenario.equipment.monitoring, scenario.patient.weightKg, airway.jawThrustCpapSecondsRemaining,
    resuscitation, region, lastExposure, hasAnaphylaxisResponse, hasHypermetabolicResponse,
    hasCardiacArrestResponse, hasHighSpinalResponse, hasVenousAirEmbolismResponse,
    hasBronchospasmResponse, capnographyLine, hasArterialLine,
    arterialLine.cuff.meanArterialMmHg, hasCircuitScenario, breathingCircuit,
  ]);

  const readWaveforms = useCallback(() => {
    speak(waveformDescriptions({
      rhythm,
      bronchospasmSeverity: airway.bronchospasmSeverity,
      airwayPatencyFraction: airway.patencyFraction,
      perfusionIndex: session.state?.perfusionIndex ?? 0.8,
      artifacts: waveformArtifacts,
      capnographySampleObstructed: capnographyLine.obstructed,
      tracheostomyPatencyFraction: equipment?.tracheostomy?.patencyFraction,
      arterialDamped: arterialLine.dynamicResponse === 'overdamped',
      inspiredCo2MmHg: breathingCircuit.inspiredCo2MmHg,
      ventilating: (session.state?.respiratoryRateBpm ?? 0) > 0,
      mechanicalPulse: mechanicalPulseFromState(session.state),
    }).map((entry) => `${entry.label}: ${entry.description}`).join(' '));
  }, [session.state, speak, rhythm, waveformArtifacts, airway, capnographyLine.obstructed,
    arterialLine.dynamicResponse, breathingCircuit.inspiredCo2MmHg, ventilator.delivering,
    equipment?.tracheostomy?.patencyFraction]);

  useEffect(() => {
    if (arterialLine.mislevelingCm > 0 || arterialLine.dynamicResponse === 'overdamped') {
      setAnnouncement('The invasive pressure display changed while canonical circulation remained stable. '
        + `${arterialLine.mislevelingCm > 0 ? `The transducer is ${arterialLine.mislevelingCm} centimeters above its reference level. ` : ''}`
        + `${arterialLine.dynamicResponse === 'overdamped' ? 'The arterial waveform is over-damped.' : ''}`);
    }
  }, [arterialLine.mislevelingCm, arterialLine.dynamicResponse]);

  useEffect(() => {
    if (arterialLine.cuff.status === 'complete'
      && arterialLine.cuff.meanArterialMmHg !== null) {
      setAnnouncement(`Independent cuff mean arterial pressure ${arterialLine.cuff.meanArterialMmHg.toFixed(0)} millimeters of mercury.`);
    }
  }, [arterialLine.cuff.status, arterialLine.cuff.meanArterialMmHg]);

  useEffect(() => {
    if (breathingCircuit.co2Absorbent === 'exhausted') {
      setAnnouncement('The capnogram inspiratory baseline is rising above zero while delivered breaths continue. Assess the breathing system.');
    } else if (breathingCircuit.absorbentReplaced) {
      setAnnouncement('Carbon-dioxide absorbent replacement intent accepted. Confirm the inspiratory baseline washes back toward zero.');
    }
  }, [breathingCircuit.co2Absorbent, breathingCircuit.absorbentReplaced]);

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
          if (moduleId !== 'anesthesia') break;
          session.act({ type: 'ventilator', payload: { delivering: true, mode: 'volume-control' } });
          break;
        case 'l': case 'L':
          if (moduleId !== 'anesthesia') break;
          session.act({ type: 'laryngoscopy', payload: { technique: 'direct' } });
          break;
        case 'c': case 'C':
          if (moduleId !== 'anesthesia') break;
          session.act({ type: 'chest-compressions', payload: {
            active: !(resuscitation.chestCompressionsActive ?? false),
          } });
          break;
        case 'e': case 'E':
          if (moduleId !== 'anesthesia') break;
          session.act({ type: 'cardiac-arrest-epinephrine', payload: { route: 'iv', doseMg: 1 } });
          break;
        case 'd': case 'D':
          if (moduleId !== 'anesthesia') break;
          session.act({ type: 'defibrillation', payload: { energyJ: 200, waveform: 'biphasic' } });
          break;
        case '?': setShortcutsOpen(true); break;
        default: break;
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [session, readSummary, readWaveforms, resuscitation.chestCompressionsActive, moduleId]);

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
  const resetScenario = () => {
    if (confirm('Reset the scenario? The clock returns to zero, the patient returns to baseline, the log is cleared, and any running infusion stops.')) {
      session.resetSession();
    }
  };
  const rehearsalPoint = scenario.replayPoints?.find(
    (point) => point.id === session.rehearsalBranch?.pointId,
  );
  useEffect(() => {
    setBranchNoticeOpen(session.rehearsalBranch !== null);
  }, [session.rehearsalBranch?.pointId]);

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
          onReset={resetScenario}
          onSpeed={(speed: SpeedMultiplier) => session.setSpeed(speed)}
          onOverflow={() => setShortcutsOpen(true)}
          moduleId={moduleId}
        />
      </div>

      {branchNoticeOpen && session.rehearsalBranch && rehearsalPoint && (
        <div className="rehearsal-branch" role="status">
          <span>
            <strong>Targeted repetition · {rehearsalPoint.label}</strong>
            <br />
            Rebuilt from your original run at {formatElapsed(session.rehearsalBranch.decisionTick)}.
            New actions form a separate branch.
          </span>
          <Button compact variant="ghost" onClick={() => setBranchNoticeOpen(false)}>
            Dismiss
          </Button>
        </div>
      )}

      <div className="cockpit__monitor" id="monitor-region">
        <MonitorRegion
          state={displayedState}
          blocks={session.waveformBlocks}
          alarms={monitorAlarms}
          tick={session.tick}
          invalidParameters={invalidParameters}
          invalidParameterReasons={hasObstetricsMaternalArrestResponse
            ? {
                meanArterialMmHg: 'Blood pressure not obtainable',
                spo2Percent: 'Pulse-derived saturation unavailable',
                etco2MmHg: 'Exhaled carbon dioxide not supplied',
              }
            : scenario.metadata.id === 'pediatric-foreign-body-airway-obstruction'
              ? { meanArterialMmHg: 'Pressure not supplied' } : undefined}
          artifactParameters={artifactParameters}
          waveformArtifacts={waveformArtifacts}
          capnographySampleObstructed={capnographyLine.obstructed}
          tracheostomyPatencyFraction={equipment?.tracheostomy?.patencyFraction}
          inspiredCo2MmHg={breathingCircuit.inspiredCo2MmHg}
          arterialDamped={arterialLine.dynamicResponse === 'overdamped'}
          rhythm={rhythm}
          airwayPatencyFraction={airway.patencyFraction}
          bronchospasmSeverity={airway.bronchospasmSeverity}
          ventilating={ventilator.delivering || (airway.device !== 'tracheal-tube'
            && (session.state?.respiratoryRateBpm ?? 0) > 0
            && (session.state?.tidalVolumeMl ?? 0) > 0)}
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
          showDepth={moduleId === 'anesthesia'}
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
          moduleId={moduleId}
          initialTab={moduleId === 'respiratory-medicine' || moduleId === 'pediatrics' || moduleId === 'neurology' || moduleId === 'neonatology'
            ? 'patient' : 'concentrations'}
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
          capnographyLine={capnographyLine}
          arterialLine={arterialLine}
          breathingCircuit={breathingCircuit}
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
          bronchospasmSeverity={airway.bronchospasmSeverity}
          trainOfFourRatio={session.state?.trainOfFourRatio ?? 1}
          trainOfFourCount={session.state?.trainOfFourCount ?? 4}
          prothrombinTimeRatio={session.state?.prothrombinTimeRatio}
          fibrinogenGPerL={session.state?.fibrinogenGPerL}
          onBolus={(drugId, amount, unit) => session.act({ type: 'bolus', payload: { drugId, amount, unit } })}
          onInfusion={(drugId, rate, unit) => session.act({ type: 'infusion', payload: { drugId, rate, unit } })}
          onHypnoticLine={(action) => session.act({ type: 'hypnotic-line', payload: { action } })}
          onCapnographyLine={(action) => session.act({
            type: 'capnography-line', payload: { action },
          })}
          onArterialLine={(action) => session.act({
            type: 'arterial-line', payload: { action },
          })}
          onBreathingCircuit={(action) => session.act({
            type: 'breathing-circuit', payload: { action },
          })}
          onFluid={(fluidId, volumeMl) => session.act({ type: 'fluid', payload: { fluidId, volumeMl } })}
          onBloodProduct={(productId, units) => session.act({
            type: 'blood-product', payload: { productId, units },
          })}
          onBloodBankRequest={() => session.act({ type: 'blood-bank-request', payload: {} })}
          onCoagulationLabs={() => session.act({ type: 'coagulation-labs', payload: {} })}
          onVentilator={(settings) => session.act({ type: 'ventilator', payload: settings as never })}
          onLaryngoscopy={(technique) => session.act({ type: 'laryngoscopy', payload: { technique } })}
          onAirwayManeuver={(maneuver) => session.act({ type: 'airway-maneuver', payload: { maneuver } })}
          onCallForHelp={() => session.act({ type: 'call-for-help', payload: { context: 'airway' } })}
          onAirwayDevice={(device) => session.act({ type: 'airway-device', payload: { device } })}
          onEpinephrine={(doseMicrograms) => session.act({
            type: 'epinephrine', payload: { route: 'iv', doseMicrograms },
          })}
          onEphedrine={(doseMg) => session.act({
            type: 'ephedrine', payload: { route: 'iv', doseMg },
          })}
          onPreeclampsiaResponse={(action) => session.act({
            type: 'preeclampsia-response', payload: { action },
          })}
          onHighSpinalHelp={() => session.act({
            type: 'call-for-help', payload: { context: 'high-spinal' },
          })}
          onVenousAirEmbolismHelp={() => session.act({
            type: 'call-for-help', payload: { context: 'venous-air-embolism' },
          })}
          onControlVenousAirEntry={() => session.act({
            type: 'control-venous-air-entry', payload: { method: 'stop-entry' },
          })}
          onPneumothoraxHelp={() => session.act({
            type: 'call-for-help', payload: { context: 'tension-pneumothorax' },
          })}
          onPneumothoraxResponse={(action) => session.act({
            type: 'pneumothorax-response', payload: { action },
          })}
          onAspirationRiskAssessment={(action) => session.act({
            type: 'aspiration-risk-assessment', payload: { action },
          })}
          onEmergenceResidualBlockAssessment={(action) => session.act({
            type: 'emergence-residual-block-assessment', payload: { action },
          })}
          onDelayedEmergenceAssessment={(action) => session.act({
            type: 'delayed-emergence-assessment', payload: { action },
          })}
          onExtubationReadinessAssessment={(action) => session.act({
            type: 'extubation-readiness-assessment', payload: { action },
          })}
          onOpioidVentilatoryResponse={(response) => session.act({
            type: 'opioid-ventilatory-response', payload: { response },
          })}
          onThermalResponse={(response) => session.act({
            type: 'thermal-response', payload: { response },
          })}
          onGlycemicResponse={(response) => session.act({
            type: 'glycemic-response', payload: { response },
          })}
          onCiedPlanningAssessment={(action) => session.act({
            type: 'cied-planning-assessment', payload: { action },
          })}
          onPostoperativeHandoffAssessment={(action) => session.act({
            type: 'postoperative-handoff-assessment', payload: { action },
          })}
          onUndifferentiatedShockAssessment={(action) => session.act({
            type: 'undifferentiated-shock-assessment', payload: { action },
          })}
          onSepticShockAssessment={(action) => session.act({
            type: 'septic-shock-assessment', payload: { action },
          })}
          onHemorrhagicShockAssessment={(action) => session.act({
            type: 'hemorrhagic-shock-assessment', payload: { action },
          })}
          onCardiacTamponadeAssessment={(action) => session.act({
            type: 'cardiac-tamponade-assessment', payload: { action },
          })}
          onEmergencyAnaphylaxisResponse={(action) => session.act({
            type: 'emergency-anaphylaxis-response', payload: { action },
          })}
          onAdultAsthmaResponse={(action) => session.act({
            type: 'adult-asthma-response', payload: { action },
          })}
          onCopdExacerbationResponse={(action) => session.act({
            type: 'copd-exacerbation-response', payload: { action },
          })}
          onAcutePulmonaryEdemaResponse={(action) => session.act({
            type: 'acute-pulmonary-edema-response', payload: { action },
          })}
          onPulmonaryEmbolismResponse={(action) => session.act({
            type: 'pulmonary-embolism-deterioration-response', payload: { action },
          })}
          onStemiResponse={(action) => session.act({
            type: 'stemi-response', payload: { action },
          })}
          onUnstableNarrowTachycardiaResponse={(action) => session.act({
            type: 'unstable-narrow-tachycardia-response', payload: { action },
          })}
          onUnstableBradycardiaResponse={(action) => session.act({
            type: 'unstable-bradycardia-response', payload: { action },
          })}
          onStatusEpilepticusResponse={(action) => session.act({
            type: 'status-epilepticus-response', payload: { action },
          })}
          onAcuteIschemicStrokeResponse={(action) => session.act({
            type: 'acute-ischemic-stroke-response', payload: { action },
          })}
          onIntracranialHemorrhageResponse={(action) => session.act({
            type: 'intracranial-hemorrhage-response', payload: { action },
          })}
          onDiabeticKetoacidosisResponse={(action) => session.act({
            type: 'diabetic-ketoacidosis-response', payload: { action },
          })}
          onHyperkalemiaResponse={(action) => session.act({
            type: 'hyperkalemia-response', payload: { action },
          })}
          onHyponatremiaResponse={(action) => session.act({
            type: 'hyponatremia-response', payload: { action },
          })}
          onOpioidToxicityResponse={(action) => session.act({
            type: 'opioid-toxicity-response', payload: { action },
          })}
          onHeatStrokeResponse={(action) => session.act({
            type: 'heat-stroke-response', payload: { action },
          })}
          onTraumaPrimarySurveyResponse={(action) => session.act({
            type: 'trauma-primary-survey-response', payload: { action },
          })}
          onAcuteAorticSyndromeResponse={(action) => session.act({
            type: 'acute-aortic-syndrome-response', payload: { action },
          })}
          onArdsLungProtectiveResponse={(action) => session.act({
            type: 'ards-lung-protective-response', payload: { action },
          })}
          onEscalatingHypoxemiaResponse={(action) => session.act({
            type: 'escalating-hypoxemia-response', payload: { action },
          })}
          onVentilatorDyssynchronyResponse={(action) => session.act({
            type: 'ventilator-dyssynchrony-response', payload: { action },
          })}
          onAutoPeepResponse={(action) => session.act({
            type: 'auto-peep-response', payload: { action },
          })}
          onMucusPluggingResponse={(action) => session.act({
            type: 'mucus-plugging-response', payload: { action },
          })}
          onUnplannedExtubationResponse={(action) => session.act({
            type: 'unplanned-extubation-response', payload: { action },
          })}
          onSpontaneousBreathingTrialResponse={(action) => session.act({
            type: 'spontaneous-breathing-trial-response', payload: { action },
          })}
          onPostIntubationHypotensionResponse={(action) => session.act({
            type: 'post-intubation-hypotension-response', payload: { action },
          })}
          onCardiogenicShockResponse={(action) => session.act({
            type: 'cardiogenic-shock-response', payload: { action },
          })}
          onMixedShockResponse={(action) => session.act({
            type: 'mixed-shock-response', payload: { action },
          })}
          onRightVentricularFailureResponse={(action) => session.act({
            type: 'right-ventricular-failure-response', payload: { action },
          })}
          onMassivePulmonaryEmbolismResponse={(action) => session.act({
            type: 'massive-pulmonary-embolism-response', payload: { action },
          })}
          onUpperGiHemorrhageResponse={(action) => session.act({
            type: 'upper-gi-hemorrhage-response', payload: { action },
          })}
          onCriticalCareStatusEpilepticusResponse={(action) => session.act({
            type: 'critical-care-status-epilepticus-response', payload: { action },
          })}
          onPostArrestTemperatureResponse={(action) => session.act({
            type: 'targeted-temperature-management-response', payload: { action },
          })}
          onIntracranialHypertensionResponse={(action) => session.act({
            type: 'intracranial-hypertension-response', payload: { action },
          })}
          onAkiFluidOverloadResponse={(action) => session.act({
            type: 'aki-fluid-overload-response', payload: { action },
          })}
          onSevereAcidemiaResponse={(action) => session.act({
            type: 'severe-acidemia-response', payload: { action },
          })}
          onIcuHiddenDeteriorationHandoffResponse={(action) => session.act({
            type: 'icu-hidden-deterioration-handoff-response', payload: { action },
          })}
          onVentilatorCircuitDisconnectionResponse={(action) => session.act({
            type: 'ventilator-circuit-disconnection-response', payload: { action },
          })}
          onDelayedVasopressorDeliveryResponse={(action) => session.act({
            type: 'delayed-vasopressor-delivery-response', payload: { action },
          })}
          onPulseOximeterArtifactResponse={(action) => session.act({
            type: 'pulse-oximeter-artifact-response', payload: { action },
          })}
          onEndotrachealTubeMigrationResponse={(action) => session.act({
            type: 'endotracheal-tube-migration-response', payload: { action },
          })}
          onSepticShockResuscitationResponse={(action) => session.act({
            type: 'septic-shock-resuscitation-response', payload: { action },
          })}
          onStableChestPainResponse={(action) => session.act({
            type: 'stable-chest-pain-response', payload: { action },
          })}
          onNstemiRiskResponse={(action) => session.act({
            type: 'nstemi-risk-response', payload: { action },
          })}
          onClinicStemiResponse={(action) => session.act({
            type: 'clinic-stemi-response', payload: { action },
          })}
          onHeartFailureResponse={(action) => session.act({
            type: 'heart-failure-response', payload: { action },
          })}
          onAfRvrResponse={(action) => session.act({
            type: 'af-rvr-response', payload: { action },
          })}
          onPostInfarctionShockResponse={(action) => session.act({
            type: 'post-infarction-shock-response', payload: { action },
          })}
          onStableNarrowTachycardiaResponse={(action) => session.act({
            type: 'stable-narrow-tachycardia-response', payload: { action },
          })}
          onStableWideTachycardiaResponse={(action) => session.act({
            type: 'stable-wide-tachycardia-response', payload: { action },
          })}
          onSymptomaticBradycardiaResponse={(action) => session.act({
            type: 'symptomatic-bradycardia-response', payload: { action },
          })}
          onCompleteHeartBlockResponse={(action) => session.act({
            type: 'complete-heart-block-response', payload: { action },
          })}
          onTorsadesResponse={(action) => session.act({
            type: 'torsades-response', payload: { action },
          })}
          onHyperkalemicConductionResponse={(action) => session.act({
            type: 'hyperkalemic-conduction-response', payload: { action },
          })}
          onPericardialTamponadeResponse={(action) => session.act({
            type: 'pericardial-tamponade-response', payload: { action },
          })}
          onRightVentricularInfarctionResponse={(action) => session.act({
            type: 'right-ventricular-infarction-response', payload: { action },
          })}
          onHypertensiveEmergencyResponse={(action) => session.act({
            type: 'hypertensive-emergency-response', payload: { action },
          })}
          onPacemakerCaptureFailureResponse={(action) => session.act({
            type: 'pacemaker-capture-failure-response', payload: { action },
          })}
          onTranscutaneousPacingCaptureResponse={(action) => session.act({
            type: 'transcutaneous-pacing-capture-response', payload: { action },
          })}
          onAcuteSevereAsthmaResponse={(action) => session.act({
            type: 'acute-severe-asthma-response', payload: { action },
          })}
          onCopdTransitionResponse={(action) => session.act({
            type: 'copd-exacerbation-transition-response', payload: { action },
          })}
          onCapHypoxemiaResponse={(action) => session.act({
            type: 'community-acquired-pneumonia-hypoxemia-response', payload: { action },
          })}
          onPostPeDyspneaResponse={(action) => session.act({
            type: 'post-pulmonary-embolism-persistent-dyspnea-response', payload: { action },
          })}
          onApeSupportResponse={(action) => session.act({
            type: 'acute-pulmonary-edema-respiratory-support-response', payload: { action },
          })}
          onPostTensionPneumothoraxResponse={(action) => session.act({
            type: 'spontaneous-tension-pneumothorax-post-drainage-response', payload: { action },
          })}
          onLargePleuralEffusionResponse={(action) => session.act({
            type: 'large-unilateral-pleural-effusion-response', payload: { action },
          })}
          onBronchiectasisMucusPluggingResponse={(action) => session.act({
            type: 'bronchiectasis-mucus-plugging-response', payload: { action },
          })}
          onChronicOpioidHypoventilationResponse={(action) => session.act({
            type: 'chronic-opioid-related-hypoventilation-response', payload: { action },
          })}
          onNeuromuscularRespiratoryFailureResponse={(action) => session.act({
            type: 'neuromuscular-respiratory-failure-response', payload: { action },
          })}
          onObesityHypoventilationResponse={(action) => session.act({
            type: 'obesity-hypoventilation-response', payload: { action },
          })}
          onNoninvasiveVentilationSelectionResponse={(action) => session.act({
            type: 'noninvasive-ventilation-selection-response', payload: { action },
          })}
          onHighFlowOxygenEscalationResponse={(action) => session.act({
            type: 'high-flow-nasal-oxygen-escalation-response', payload: { action },
          })}
          onOxygenDeviceFailureResponse={(action) => session.act({
            type: 'oxygen-device-failure-response', payload: { action },
          })}
          onAcuteTracheostomyObstructionResponse={(action) => session.act({
            type: 'acute-tracheostomy-obstruction-response', payload: { action },
          })}
          onPediatricRespiratoryDistressResponse={(action) => session.act({
            type: 'pediatric-respiratory-distress-response', payload: { action },
          })}
          onBronchiolitisResponse={(action) => session.act({
            type: 'bronchiolitis-response', payload: { action },
          })}
          onCroupResponse={(action) => session.act({
            type: 'croup-response', payload: { action },
          })}
          onPediatricStatusAsthmaticusResponse={(action) => session.act({
            type: 'pediatric-status-asthmaticus-response', payload: { action },
          })}
          onPediatricSepsisResponse={(action) => session.act({
            type: 'pediatric-sepsis-response', payload: { action },
          })}
          onPediatricSepticShockResponse={(action) => session.act({
            type: 'pediatric-septic-shock-response', payload: { action },
          })}
          onPediatricDehydrationResponse={(action) => session.act({
            type: 'pediatric-dehydration-response', payload: { action },
          })}
          onPediatricDiabeticKetoacidosisResponse={(action) => session.act({
            type: 'pediatric-diabetic-ketoacidosis-response', payload: { action },
          })}
          onPediatricHypoglycemicSeizureResponse={(action) => session.act({
            type: 'pediatric-hypoglycemic-seizure-response', payload: { action },
          })}
          onPediatricFebrileSeizureResponse={(action) => session.act({
            type: 'pediatric-febrile-seizure-response', payload: { action },
          })}
          onPediatricStatusEpilepticusResponse={(action) => session.act({
            type: 'pediatric-status-epilepticus-response', payload: { action },
          })}
          onPediatricAnaphylaxisResponse={(action) => session.act({
            type: 'pediatric-anaphylaxis-response', payload: { action },
          })}
          onPediatricSupraventricularTachycardiaResponse={(action) => session.act({
            type: 'pediatric-supraventricular-tachycardia-response', payload: { action },
          })}
          onPediatricBradycardicArrestResponse={(action) => session.act({
            type: 'pediatric-bradycardic-arrest-response', payload: { action },
          })}
          onPediatricForeignBodyAirwayObstructionResponse={(action) => session.act({
            type: 'pediatric-foreign-body-airway-obstruction-response', payload: { action },
          })}
          onPediatricInjurySafeguardingResponse={(action) => session.act({
            type: 'pediatric-injury-safeguarding-escalation-response', payload: { action },
          })}
          onNeurologyMinorStrokeResponse={(action) => session.act({
            type: 'minor-nondisabling-acute-ischemic-stroke-response', payload: { action },
          })}
          onNeurologyBasilarLvoResponse={(action) => session.act({
            type: 'basilar-artery-occlusion-escalation-response', payload: { action },
          })}
          onNeurologyCerebellarIchResponse={(action) => session.act({
            type: 'spontaneous-cerebellar-intracerebral-hemorrhage-response', payload: { action },
          })}
          onNeurologyAsahDeteriorationResponse={(action) => session.act({
            type: 'aneurysmal-subarachnoid-hemorrhage-deterioration-response', payload: { action },
          })}
          onNeurologyFocalMotorStatusResponse={(action) => session.act({
            type: 'focal-motor-status-epilepticus-escalation-response', payload: { action },
          })}
          onNeurologyNcseResponse={(action) => session.act({
            type: 'nonconvulsive-status-epilepticus-recognition-response', payload: { action },
          })}
          onNeurologyMyasthenicCrisisResponse={(action) => session.act({
            type: 'myasthenic-crisis-escalation-response', payload: { action },
          })}
          onNeurologyGbsResponse={(action) => session.act({
            type: 'guillain-barre-respiratory-decline-response', payload: { action },
          })}
          onNeurologyMeningitisResponse={(action) => session.act({
            type: 'acute-bacterial-meningitis-first-hour-response', payload: { action },
          })}
          onNeurologyEncephalitisResponse={(action) => session.act({
            type: 'suspected-herpes-simplex-encephalitis-response', payload: { action },
          })}
          onNeurologyRaisedIcpResponse={(action) => session.act({
            type: 'raised-intracranial-pressure-visual-threat-response', payload: { action },
          })}
          onNeurologyHerniationResponse={(action) => session.act({
            type: 'acute-transtentorial-herniation-pattern-response', payload: { action },
          })}
          onNeurologyMsccResponse={(action) => session.act({
            type: 'metastatic-spinal-cord-compression-response', payload: { action },
          })}
          onNeurologyDeliriumResponse={(action) => session.act({
            type: 'acute-delirium-reversible-causes-response', payload: { action },
          })}
          onNeurologyAutonomicDysreflexiaResponse={(action) => session.act({
            type: 'autonomic-dysreflexia-authored-trigger-response', payload: { action },
          })}
          onToxicologyMethemoglobinemiaResponse={(action) => session.act({
            type: 'methemoglobinemia-saturation-gap-response', payload: { action },
          })}
          onToxicologyCarbonMonoxideResponse={(action) => session.act({
            type: 'carbon-monoxide-reassuring-monitor-response', payload: { action },
          })}
          onToxicologyAcetaminophenResponse={(action) => session.act({
            type: 'acetaminophen-clock-and-nomogram-response', payload: { action },
          })}
          onToxicologySalicylateResponse={(action) => session.act({
            type: 'salicylate-falling-number-response', payload: { action },
          })}
          onToxicologyTricyclicResponse={(action) => session.act({
            type: 'tricyclic-sodium-channel-cardiotoxicity-response', payload: { action },
          })}
          onToxicologyBetaBlockerResponse={(action) => session.act({
            type: 'beta-blocker-cardiogenic-shock-response', payload: { action },
          })}
          onToxicologyCalciumChannelBlockerResponse={(action) => session.act({
            type: 'calcium-channel-blocker-shock-response', payload: { action },
          })}
          onToxicologyDigoxinResponse={(action) => session.act({
            type: 'digoxin-rhythm-potassium-response', payload: { action },
          })}
          onToxicologyCholinergicResponse={(action) => session.act({
            type: 'cholinergic-pesticide-respiratory-failure-response', payload: { action },
          })}
          onToxicologyAnticholinergicResponse={(action) => session.act({
            type: 'anticholinergic-hyperthermia-delirium-response', payload: { action },
          })}
          onToxicologySerotoninResponse={(action) => session.act({
            type: 'serotonin-toxicity-hyperthermia-clonus-response', payload: { action },
          })}
          onToxicologySympathomimeticResponse={(action) => session.act({
            type: 'sympathomimetic-hyperadrenergic-hyperthermia-response', payload: { action },
          })}
          onToxicologyMethanolResponse={(action) => session.act({
            type: 'methanol-visual-acidosis-gaps-response', payload: { action },
          })}
          onToxicologyDelayedLastResponse={(action) => session.act({
            type: 'delayed-local-anesthetic-cns-cardiac-toxicity-response', payload: { action },
          })}
          onToxicologyOpioidXylazineResponse={(action) => session.act({
            type: 'opioid-xylazine-persistent-sedation-response', payload: { action },
          })}
          onObstetricsAtonyResponse={(action) => session.act({
            type: 'postpartum-hemorrhage-uterine-atony-response', payload: { action },
          })}
          onObstetricsMaternalSepsisResponse={(action) => session.act({
            type: 'maternal-sepsis-postpartum-deterioration-response', payload: { action },
          })}
          onObstetricsConcealedAbruptionResponse={(action) => session.act({
            type: 'concealed-placental-abruption-hemorrhage-response', payload: { action },
          })}
          onObstetricsPostpartumPreeclampsiaResponse={(action) => session.act({
            type: 'postpartum-severe-preeclampsia-warning-signs-response', payload: { action },
          })}
          onObstetricsEclampsiaResponse={(action) => session.act({
            type: 'eclampsia-first-seizure-response', payload: { action },
          })}
          onObstetricsAfeResponse={(action) => session.act({
            type: 'suspected-amniotic-fluid-embolism-pattern-response', payload: { action },
          })}
          onObstetricsMaternalArrestResponse={(action) => session.act({
            type: 'maternal-cardiac-arrest-response', payload: { action },
          })}
          onObstetricsShoulderDystociaResponse={(action) => session.act({
            type: 'shoulder-dystocia-cognitive-sequence-response', payload: { action },
          })}
          onObstetricsCordProlapseResponse={(action) => session.act({
            type: 'umbilical-cord-prolapse-urgent-birth-coordination-response', payload: { action },
          })}
          onObstetricsUterineRuptureResponse={(action) => session.act({
            type: 'suspected-uterine-rupture-recognition-response', payload: { action },
          })}
          onObstetricsMagnesiumToxicityResponse={(action) => session.act({
            type: 'magnesium-sulfate-toxicity-recognition-response', payload: { action },
          })}
          onObstetricsHighNeuraxialResponse={(action) => session.act({
            type: 'high-neuraxial-block-obstetric-coordination-response', payload: { action },
          })}
          onObstetricsFailedIntubationResponse={(action) => session.act({
            type: 'failed-obstetric-intubation-oxygenation-first-response', payload: { action },
          })}
          onObstetricsMaternalNeonatalHandoffResponse={(action) => session.act({
            type: 'maternal-to-neonatal-resuscitation-handoff-response', payload: { action },
          })}
          onObstetricsOxytocinTachysystoleResponse={(action) => session.act({
            type: 'oxytocin-associated-uterine-tachysystole-response', payload: { action },
          })}
          onNeonatologyTermTransitionResponse={(action) => session.act({
            type: 'term-newborn-transition-response', payload: { action },
          })}
          onNeonatologyApneaResponse={(action) => session.act({
            type: 'neonatal-apnea-response', payload: { action },
          })}
          onNeonatologyIneffectiveVentilationResponse={(action) => session.act({
            type: 'ineffective-ventilation-correction-response', payload: { action },
          })}
          onNeonatologyBradycardiaResponse={(action) => session.act({
            type: 'neonatal-bradycardia-response', payload: { action },
          })}
          onNeonatologyMeconiumTransitionResponse={(action) => session.act({
            type: 'meconium-stained-transition-response', payload: { action },
          })}
          onNeonatologyPretermRespiratoryDistressResponse={(action) => session.act({
            type: 'preterm-respiratory-distress-response', payload: { action },
          })}
          onBronchospasmHelp={() => session.act({
            type: 'call-for-help', payload: { context: 'bronchospasm' },
          })}
          onInhaledBronchodilator={() => session.act({
            type: 'inhaled-bronchodilator', payload: {
              agentId: 'salbutamol', route: 'nebulized', doseMg: 5,
            },
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
        <Button onClick={() => setAnalysisOpen((open) => !open)}>
          {moduleId === 'emergency-medicine' ? 'Review' : 'Analysis'}
        </Button>
        <Button variant="primary" onClick={() => setActionsOpen((open) => !open)}>Actions</Button>
      </div>

      {/* Guidance. Non-blocking, dismissible, and never shown during an alarm. */}
      {tutorIntroductionOpen && session.alarms.length === 0 ? (
        <TutorIntroduction onDismissPermanently={() => {
          setTutorIntroductionDismissed(true);
          setTutorIntroductionOpen(false);
        }} />
      ) : !tutorIntroductionOpen && prompt ? (
        <TutorPromptCard
          prompt={prompt}
          collapsed={tutorCollapsed}
          whyOpen={promptWhyOpen}
          onToggleCollapsed={() => setTutorCollapsed((collapsed) => !collapsed)}
          onToggleWhy={() => setPromptWhyOpen((open) => !open)}
          onDismiss={() => {
            setPrompt(null);
            setPromptWhyOpen(false);
            setTutorCollapsed(false);
          }}
          onOpenSource={() => {
            session.pause();
            setExplainerId(prompt.concept!);
          }}
        />
      ) : null}

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
            {onReportSource && (
              <Button compact variant="ghost" onClick={onReportSource}>Report a problem with this source</Button>
            )}
            <UnreviewedMarker
              status={getExplainer(explainerId).maturity}
              subjectKind="explanation"
              subjectId={getExplainer(explainerId).id}
              contentVersion={getExplainer(explainerId).review.contentVersion}
              review={getExplainer(explainerId).review}
            />
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
          <>
            <DrugCardBody drugId={drugCardId} reviewMode={reviewMode} />
            {onReportSource && (
              <Button compact variant="ghost" onClick={onReportSource}>Report a problem with this source</Button>
            )}
          </>
        )}
      </Drawer>

      <Modal open={shortcutsOpen} title="More options" onClose={() => setShortcutsOpen(false)}
        footer={<Button onClick={() => setShortcutsOpen(false)}>Close</Button>}>
        {/* Speed, step, and reset leave the status bar under its phone sacrifice
            order. Every removal stays reachable here at every width. */}
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
          <Button onClick={resetScenario}>Reset the scenario</Button>
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
            The pulse tone falls in pitch as saturation falls, which is how clinicians track
            saturation while looking somewhere else. Sound is never the only channel: every alarm
            and cue is also shown.
          </p>
        </div>
        <Button onClick={() => {
          setShortcutsOpen(false);
          setTutorIntroductionOpen(true);
        }}>
          Show private tutor introduction
        </Button>
        <h3>Keyboard shortcuts</h3>
        <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'var(--space-2) var(--space-4)' }}>
          {SHORTCUTS.filter((shortcut) => moduleId === 'anesthesia'
            || !['G', 'V', 'L', 'C', 'E', 'D'].includes(shortcut.keys)).map((shortcut) => (
            <div key={shortcut.keys} style={{ display: 'contents' }}>
              <dt><kbd>{shortcut.keys}</kbd></dt>
              <dd>{moduleId === 'emergency-medicine'
                ? shortcut.action.replace('Analysis', 'Review') : shortcut.action}</dd>
            </div>
          ))}
        </dl>
        <Button onClick={onEnd}>End the session and open the debrief</Button>
        {moduleId === 'anesthesia' && (
          <Button onClick={() => { setShortcutsOpen(false); setCrisisInjectorOpen(true); }}>
            Open manual crisis injector
          </Button>
        )}
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
      <UnreviewedMarker
        status={card.maturity}
        subjectKind="drug-card"
        subjectId={card.drugId}
        contentVersion={card.review.contentVersion}
        review={card.review}
      />
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
export interface UnreviewedMarkerProps {
  readonly status: ContentMaturity;
  readonly subjectKind: MaturitySubjectKind;
  readonly subjectId: string;
  readonly contentVersion: string;
  readonly review: { readonly reviewer: string; readonly reviewedOn: string };
}

export function UnreviewedMarker({
  status, subjectKind, subjectId, contentVersion, review,
}: UnreviewedMarkerProps) {
  const reviewNotice = isUnreviewed(review) ? (
    <p className="reading__aside" data-unreviewed="true">
      <strong>Not clinically reviewed.</strong> {UNREVIEWED_NOTICE}
    </p>
  ) : (
      <p className="reading__aside">
        Reviewed by {review.reviewer} on {review.reviewedOn}.
      </p>
  );
  return (
    <>
      <MaturityMarker
        status={status}
        subjectKind={subjectKind}
        subjectId={subjectId}
        contentVersion={contentVersion}
      />
      {reviewNotice}
    </>
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
