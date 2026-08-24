/**
 * The solver worker protocol.
 *
 * Designed once, for the FULL specification rather than for the current slice
 * (see openspec/changes/mvp-anesthesia-alpha/design.md). It carries the complete
 * state vector, the attribution terms the Why panel needs, and the waveform sample
 * buffers, because retrofitting attribution into a worker protocol later means
 * touching every consumer.
 *
 * The protocol is generic over the module's state type. The platform holds no
 * specialty knowledge (platform/module-contract → The core has no anesthesiology
 * knowledge); the anesthesia module supplies its own state shape.
 */

/** Bumped whenever the message shape changes incompatibly. Version 11 reports cardiac-arrest response state. */
export const WORKER_PROTOCOL_VERSION = 11;

/** A single ranked contribution to a change in one state variable. */
export interface AttributionTerm {
  /** Stable identifier, for example `propofol-vasodilation`. */
  readonly termId: string;
  /** Learner-facing name. */
  readonly label: string;
  /** Signed contribution in the variable's own units. */
  readonly contribution: number;
  /** Share of the total absolute change, 0 to 1. */
  readonly share: number;
  /**
   * True when this term comes from an Open Sim Lab teaching model rather than a
   * published one, so the Why panel can say so in that line.
   */
  readonly teachingModel: boolean;
}

/** Attribution for one state variable at one tick. */
export interface Attribution {
  /** The state variable this explains, for example `map`. */
  readonly variable: string;
  /** Terms ranked by absolute contribution, largest first. */
  readonly terms: readonly AttributionTerm[];
}

/** One block of waveform samples for one signal. */
export interface WaveformBlock {
  readonly signal: string;
  readonly sampleRateHz: number;
  readonly startSeconds: number;
  readonly samples: Float32Array;
}

/** A concentration pair for one active drug. */
export interface DrugConcentration {
  readonly drugId: string;
  readonly modelId: string;
  /** `published`, `pending-check`, `out-of-range` or `teaching`. */
  readonly confidence: 'published' | 'pending-check' | 'out-of-range' | 'teaching';
  readonly plasma: number;
  readonly effectSite: number;
  readonly unit: string;
}

/** An entry destined for the event log. */
export interface EngineEvent {
  readonly tick: number;
  readonly severity: 'info' | 'advisory' | 'warning' | 'critical' | 'artifact';
  readonly category: string;
  readonly message: string;
  /** Stable id so the debrief and the transcript can refer to it. */
  readonly eventId: string;
  /** Structured payload, kept out of the message string so it stays translatable. */
  readonly data?: Readonly<Record<string, string | number | boolean>>;
}

/** An active alarm as the engine sees it. The monitor owns only the visual treatment. */
export interface EngineAlarm {
  readonly alarmId: string;
  readonly priority: 'high' | 'medium' | 'low';
  readonly parameter: string;
  readonly value: number;
  readonly unit: string;
  readonly message: string;
  readonly sinceTick: number;
  readonly silencedUntilTick: number | null;
}

/** A learner action, recorded verbatim in the transcript so replay is exact. */
export interface LearnerAction {
  readonly tick: number;
  readonly type: string;
  readonly payload: Readonly<Record<string, string | number | boolean>>;
}

// --- Messages to the worker ------------------------------------------------

export interface InitMessage {
  readonly v: number;
  readonly type: 'init';
  readonly scenarioId: string;
  readonly scenarioVersion: string;
  readonly contentVersion: string;
  readonly modelSetRevision: string;
  readonly engineVersion: string;
  readonly practiceRegion: string;
  readonly seed: number;
  /** The scenario document, already validated against the schema on the main thread. */
  readonly scenario: unknown;
}

export interface AdvanceMessage {
  readonly v: number;
  readonly type: 'advance';
  /** Number of 100 ms ticks to execute in this pass. */
  readonly ticks: number;
}

export interface ActionMessage {
  readonly v: number;
  readonly type: 'action';
  readonly action: LearnerAction;
}

export interface ReplayMessage {
  readonly v: number;
  readonly type: 'replay';
  /** A complete transcript to replay into a fresh worker. */
  readonly transcript: unknown;
}

export interface ResetMessage {
  readonly v: number;
  readonly type: 'reset';
}

export type ToWorkerMessage =
  | InitMessage | AdvanceMessage | ActionMessage | ReplayMessage | ResetMessage;

// --- Messages from the worker ----------------------------------------------

export interface ReadyMessage {
  readonly v: number;
  readonly type: 'ready';
  readonly engineVersion: string;
  readonly modelSetRevision: string;
}

/** The full per-tick emission. Every consumer reads from this one shape. */
/**
 * What the equipment is actually doing, as opposed to what the learner last
 * asked it to do.
 *
 * The action region has to render the engine's answer, not its own memory of the
 * request: a hypoxic guard can refuse an inspired oxygen fraction, a syringe can
 * run out mid-push, and an intubation attempt can fail. A control that shows the
 * request rather than the result teaches the learner to trust a number that is
 * not true (cockpit/action-cockpit → the tray reflects the patient).
 */
export interface EquipmentSnapshot {
  readonly ventilator: {
    readonly mode: 'volume-control' | 'pressure-control' | 'manual';
    readonly tidalVolumeMl: number;
    readonly respiratoryRateBpm: number;
    readonly freshGasFlowLPerMin: number;
    readonly fio2: number;
    readonly peep: number;
    readonly delivering: boolean;
    readonly sevofluranePercent: number;
  };
  readonly airway: {
    readonly intubated: boolean;
    /** The airway device actually in place; a facemask is the unsecured default. */
    readonly device: 'facemask' | 'supraglottic-airway' | 'tracheal-tube';
    readonly attempts: number;
    /** The Cormack-Lehane grade of the last attempt, or null before the first. */
    readonly lastGrade: number | null;
    /** True while an attempt is consuming simulated time. */
    readonly attemptInProgress: boolean;
    /** Whole simulated seconds remaining, or zero when no attempt is active. */
    readonly attemptSecondsRemaining: number;
    /** Whole seconds remaining in a bounded supraglottic-airway insertion. */
    readonly supraglotticInsertionSecondsRemaining: number;
    /** Accepted request for airway help, or null when none was made. */
    readonly helpRequestedAtTick: number | null;
    /** Fraction of the upper airway open to gas flow, without diagnosing its cause. */
    readonly patencyFraction: number;
    /** Lower-airway obstruction that shapes the capnogram, kept distinct from patency. */
    readonly bronchospasmSeverity: number;
    /** Whole seconds left in the bounded held jaw-thrust/CPAP maneuver. */
    readonly jawThrustCpapSecondsRemaining: number;
  };
  /** The physical delivery path for the propofol infusion. */
  readonly hypnoticLine: {
    /** False when the pump is running but its propofol is not reaching the patient. */
    readonly connected: boolean;
    /** True after the learner has deliberately inspected or reconnected the line. */
    readonly inspected: boolean;
  };
  /** Accepted crisis treatments and exposure, as distinct from requested actions. */
  readonly resuscitation: {
    readonly epinephrineEffectFraction: number;
    readonly epinephrineTotalMicrograms: number;
    readonly lastEpinephrineTick: number | null;
    readonly crystalloidTotalMl: number;
    readonly dantroleneTotalMg: number;
    readonly dantroleneEffectFraction: number;
    readonly lastDantroleneTick: number | null;
    readonly activeCooling: boolean;
    /** Bounded local-anesthetic toxicity response state. Optional for older saved snapshots. */
    readonly localAnestheticToxicityFraction?: number;
    readonly seizureActivityFraction?: number;
    readonly seizureSuppressed?: boolean;
    readonly lipidEmulsionTotalMl?: number;
    readonly lipidEmulsionBolusRemainingMl?: number;
    readonly lipidEmulsionInfusionMlPerMin?: number;
    readonly lipidEmulsionEffectFraction?: number;
    readonly lastLipidEmulsionTick?: number | null;
    /** Bounded scripted cardiac-arrest response. Optional for older saved snapshots. */
    readonly cardiacArrestActive?: boolean;
    readonly chestCompressionsActive?: boolean;
    readonly chestCompressionSeconds?: number;
    readonly compressionPerfusionFraction?: number;
    readonly arrestEpinephrineTotalMg?: number;
    readonly lastArrestEpinephrineTick?: number | null;
    readonly defibrillationShockCount?: number;
    readonly lastDefibrillationEnergyJ?: number | null;
    readonly roscAtTick?: number | null;
  };
  /** The most recent modeled trigger exposure, without diagnosing the response. */
  readonly lastExposure: { readonly agentId: string; readonly tick: number } | null;
  /** Per drug: the running infusion rate and what is left in the syringe. */
  readonly drugs: readonly {
    readonly drugId: string;
    readonly infusionRate: number;
    readonly infusionUnit: string;
    readonly infusionSinceTick: number | null;
    readonly syringeRemainingMl: number;
  }[];
  /**
   * Simulated seconds spent at an inspired oxygen fraction of 0.8 or above with
   * the airway not yet secured. The debrief judges the preoxygenation objective
   * on this, so it has to be the engine's count and not the interface's guess.
   */
  readonly preoxygenationSeconds: number;
  /** The rhythm currently driving the electrocardiogram. */
  readonly rhythmId: string;
  /** Parameters that cannot be measured right now, so the tile shows `--`. */
  readonly invalidParameters: readonly string[];
  /** Parameters a sensor artifact is currently corrupting. */
  readonly artifactParameters: readonly string[];
  /** Waveform signals a sensor artifact is currently corrupting. */
  readonly waveformArtifacts: readonly string[];
}

export interface StateMessage<TState> {
  readonly v: number;
  readonly type: 'state';
  readonly tick: number;
  readonly state: TState;
  readonly concentrations: readonly DrugConcentration[];
  readonly attribution: readonly Attribution[];
  readonly waveforms: readonly WaveformBlock[];
  readonly alarms: readonly EngineAlarm[];
  readonly events: readonly EngineEvent[];
  /** Engine warnings, such as a state variable clamped at its hard bound. */
  readonly warnings: readonly string[];
  readonly equipment: EquipmentSnapshot;
}

export interface ErrorMessage {
  readonly v: number;
  readonly type: 'error';
  readonly code: string;
  readonly message: string;
}

export type FromWorkerMessage<TState> = ReadyMessage | StateMessage<TState> | ErrorMessage;

/** Reject a message from an incompatible protocol version rather than guessing. */
export function assertProtocolVersion(message: { v: number }): void {
  if (message.v !== WORKER_PROTOCOL_VERSION) {
    throw new Error(
      `Worker protocol mismatch: message version ${message.v}, this build speaks ${WORKER_PROTOCOL_VERSION}`,
    );
  }
}

/** The transferable buffers in a state message, so the structured clone is cheap. */
export function transferablesOf<TState>(message: StateMessage<TState>): Transferable[] {
  return message.waveforms.map((block) => block.samples.buffer as ArrayBuffer);
}
