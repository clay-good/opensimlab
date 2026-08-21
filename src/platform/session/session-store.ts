/**
 * The session store: the one place the interface reads from.
 *
 * It owns the clock, the worker client, the accumulated history the plot and the
 * debrief need, the event log, the alarms, and the transcript recorder. Nothing
 * here reaches the network, and nothing is persisted except by an explicit
 * learner action.
 */

import { create } from 'zustand';
import { SimulationClock, TICKS_PER_SECOND, type SpeedMultiplier } from '@platform/clock/simulation-clock';
import { EventLog, type Severity } from '@platform/log/event-log';
import type {
  Attribution, DrugConcentration, EngineAlarm, EngineEvent, EquipmentSnapshot, LearnerAction, StateMessage,
} from '@platform/kernel/protocol';
import { TranscriptRecorder, type Transcript, type TranscriptVersions } from '@platform/transcript/transcript';
import { hashStateTrace } from '@platform/transcript/hash';
import { SolverClient, type SolverInit } from './solver-client';

/** One accumulated history sample, kept for the plot and the debrief. */
export interface HistorySample {
  readonly tick: number;
  readonly state: Readonly<Record<string, number>>;
  readonly concentrations: readonly DrugConcentration[];
}

export type GuidanceLevel = 'guided' | 'coached' | 'unassisted';

export interface SessionState {
  // --- Lifecycle
  readonly phase: 'idle' | 'briefing' | 'running' | 'ended' | 'worker-lost';
  readonly ready: boolean;
  readonly error: { code: string; message: string } | null;

  // --- Simulation
  readonly tick: number;
  readonly elapsed: string;
  readonly transport: 'idle' | 'running' | 'paused';
  readonly speed: SpeedMultiplier;
  readonly catchUpNotice: boolean;

  // --- Latest emission
  readonly state: Readonly<Record<string, number>> | null;
  readonly concentrations: readonly DrugConcentration[];
  readonly attribution: readonly Attribution[];
  readonly alarms: readonly EngineAlarm[];
  readonly waveformBlocks: readonly { trackId: string; samples: Float32Array }[];
  readonly warnings: readonly string[];
  /** What the equipment is actually doing, as the engine reports it. */
  readonly equipment: EquipmentSnapshot | null;

  // --- Accumulated
  readonly history: readonly HistorySample[];
  readonly log: readonly EngineEvent[];
  readonly unreadLog: boolean;

  // --- Preferences that live only on this device
  readonly guidance: GuidanceLevel;

  // --- Actions
  readonly begin: (init: SolverInit, createWorker: () => Worker, versions: TranscriptVersions, moduleId: string) => void;
  readonly play: () => void;
  readonly pause: () => void;
  readonly singleStep: () => void;
  readonly setSpeed: (speed: SpeedMultiplier) => void;
  readonly resetSession: () => void;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly frame: (elapsedMs: number) => void;
  readonly markLogRead: () => void;
  readonly setGuidance: (level: GuidanceLevel) => void;
  readonly end: () => void;
  readonly exportTranscript: () => Promise<Transcript>;
  readonly resumeAfterWorkerLoss: () => void;
}

/** How many history samples to keep. Ten simulated minutes at one per second. */
const HISTORY_LIMIT = 600;

interface Internals {
  clock: SimulationClock;
  client: SolverClient<Record<string, number>> | null;
  recorder: TranscriptRecorder | null;
  eventLog: EventLog;
  createWorker: (() => Worker) | null;
  init: SolverInit | null;
  /** Every emitted state, for the trace hash. */
  trace: Record<string, number>[];
}

const internals: Internals = {
  clock: new SimulationClock(),
  client: null,
  recorder: null,
  eventLog: new EventLog(),
  createWorker: null,
  init: null,
  trace: [],
};

/** Exposed for the debrief and the tests, which need the recorded actions. */
export function sessionInternals(): Internals {
  return internals;
}

export const useSession = create<SessionState>((set, get) => ({
  phase: 'idle',
  ready: false,
  error: null,
  tick: 0,
  elapsed: '00:00:00',
  transport: 'idle',
  speed: 1,
  catchUpNotice: false,
  state: null,
  concentrations: [],
  attribution: [],
  alarms: [],
  waveformBlocks: [],
  warnings: [],
  equipment: null,
  history: [],
  log: [],
  unreadLog: false,
  guidance: 'coached',

  begin(init, createWorker, versions, moduleId) {
    internals.clock = new SimulationClock();
    internals.eventLog = new EventLog();
    internals.trace = [];
    internals.createWorker = createWorker;
    internals.init = init;
    internals.recorder = new TranscriptRecorder({
      moduleId,
      scenarioId: init.scenarioId,
      versions,
      practiceRegion: init.practiceRegion,
      seed: init.seed,
      guidanceLevel: get().guidance,
    });

    // The reset happens BEFORE the client starts. A worker can report ready
    // synchronously — an in-process one in a test does — and resetting afterwards
    // would overwrite the report it had already made.
    set({
      phase: 'briefing', ready: false, error: null, tick: 0, elapsed: '00:00:00',
      transport: 'idle', history: [], log: [], state: null, alarms: [], warnings: [],
      waveformBlocks: [], concentrations: [], attribution: [], unreadLog: false,
      catchUpNotice: false, equipment: null,
    });

    const client = new SolverClient<Record<string, number>>(createWorker, {
      // A ready message marks the solver ready. It does NOT decide what phase
      // the session is in.
      //
      // It used to set the phase to 'briefing' unconditionally, so a ready that
      // arrived after the learner had already started dropped a running session
      // back to the briefing screen. That is how the `?demo=1` link failed:
      // the demonstration started, the phase went to 'running', and a late
      // ready put it straight back to the briefing with the clock stopped.
      onReady: () => set((state) => ({
        ready: true,
        error: null,
        phase: state.phase === 'idle' ? 'briefing' : state.phase,
      })),
      onState: (message) => applyState(set, get, message),
      onError: (code, message) => set({ error: { code, message } }),
      onDeath: () => set({ phase: 'worker-lost', transport: 'paused' }),
    });
    internals.client = client;
    client.start(init);
  },

  play() {
    internals.clock.play();
    set({ transport: 'running', phase: 'running' });
  },

  pause() {
    internals.clock.pause();
    set({ transport: 'paused' });
  },

  singleStep() {
    const ticks = internals.clock.singleStep();
    internals.client?.advance(ticks);
    set({ tick: internals.clock.tick, elapsed: internals.clock.snapshot().elapsed });
  },

  setSpeed(speed) {
    internals.clock.setSpeed(speed);
    set({ speed });
  },

  resetSession() {
    internals.clock.reset();
    internals.eventLog.clear();
    internals.trace = [];
    set({
      tick: 0, elapsed: '00:00:00', transport: 'idle', phase: 'briefing',
      history: [], log: [], state: null, alarms: [], warnings: [], unreadLog: false,
      waveformBlocks: [], concentrations: [], attribution: [], catchUpNotice: false,
      equipment: null,
    });
    if (internals.init && internals.createWorker) {
      internals.client?.start(internals.init);
    }
  },

  act(action) {
    const full: LearnerAction = { ...action, tick: internals.clock.tick };
    internals.recorder?.record(full);
    internals.client?.act(full);
  },

  /**
   * Called once per animation frame. Turns wall-clock time into ticks and asks
   * the worker to advance; the clock, not the frame rate, decides how many.
   */
  frame(elapsedMs) {
    const ticks = internals.clock.ticksFor(elapsedMs);
    if (ticks > 0) internals.client?.advance(ticks);
    const snapshot = internals.clock.snapshot();
    if (snapshot.catchUpWasCapped) set({ catchUpNotice: true, transport: 'paused' });
    if (get().tick !== snapshot.tick) set({ tick: snapshot.tick, elapsed: snapshot.elapsed });
  },

  markLogRead() { set({ unreadLog: false }); },

  setGuidance(level) { set({ guidance: level }); },

  end() {
    internals.clock.pause();
    set({ phase: 'ended', transport: 'paused' });
  },

  async exportTranscript() {
    const recorder = internals.recorder;
    if (!recorder) throw new Error('No session to export.');
    recorder.setTicks(internals.clock.tick);
    const hash = await hashStateTrace(internals.trace);
    return recorder.build(hash);
  },

  resumeAfterWorkerLoss() {
    const recorder = internals.recorder;
    if (!recorder || !internals.client) return;
    recorder.setTicks(internals.clock.tick);
    internals.client.resumeFromTranscript(recorder.build('pending'));
    set({ phase: 'running', error: null });
  },
}));

function applyState(
  set: (partial: Partial<SessionState>) => void,
  get: () => SessionState,
  message: StateMessage<Record<string, number>>,
): void {
  internals.eventLog.appendAll(message.events);
  internals.trace.push(message.state);
  const previous = get();
  const history = [...previous.history];
  // One history sample per simulated second keeps the plot cheap without losing shape.
  if (history.length === 0 || message.tick - (history[history.length - 1]?.tick ?? -Infinity) >= TICKS_PER_SECOND) {
    history.push({ tick: message.tick, state: message.state, concentrations: message.concentrations });
    if (history.length > HISTORY_LIMIT) history.shift();
  }
  const criticalArrived = message.events.some((event) => event.severity === 'critical');
  set({
    state: message.state,
    concentrations: message.concentrations,
    attribution: message.attribution,
    alarms: message.alarms,
    warnings: message.warnings,
    waveformBlocks: message.waveforms.map((block) => ({ trackId: block.signal, samples: block.samples })),
    equipment: message.equipment,
    history,
    log: [...internals.eventLog.all()],
    unreadLog: previous.unreadLog || criticalArrived,
  });
}

/** Severity filter helper for the log tab. */
export function filterLog(entries: readonly EngineEvent[], severities: ReadonlySet<Severity> | null): EngineEvent[] {
  if (!severities) return [...entries];
  return entries.filter((entry) => severities.has(entry.severity as Severity));
}
