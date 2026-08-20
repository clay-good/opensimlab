/**
 * The main-thread side of the worker protocol.
 *
 * Owns the Worker, speaks the versioned protocol, and reports a worker death
 * rather than hiding it: the simulation pauses, the transcript is preserved, and
 * the learner is offered a resume that replays the transcript into a fresh worker
 * (engine/simulation-clock → Worker failure degrades safely).
 */

import {
  WORKER_PROTOCOL_VERSION,
  type FromWorkerMessage, type LearnerAction, type StateMessage, type ToWorkerMessage,
} from '@platform/kernel/protocol';

export interface SolverClientHandlers<TState> {
  readonly onReady: (engineVersion: string, modelSetRevision: string) => void;
  readonly onState: (message: StateMessage<TState>) => void;
  readonly onError: (code: string, message: string) => void;
  /** The worker terminated unexpectedly. */
  readonly onDeath: () => void;
}

export interface SolverInit {
  readonly scenarioId: string;
  readonly scenarioVersion: string;
  readonly contentVersion: string;
  readonly modelSetRevision: string;
  readonly engineVersion: string;
  readonly practiceRegion: string;
  readonly seed: number;
  readonly scenario: unknown;
}

export class SolverClient<TState> {
  private worker: Worker | null = null;
  private readonly handlers: SolverClientHandlers<TState>;
  private readonly createWorker: () => Worker;
  private lastInit: SolverInit | null = null;

  constructor(createWorker: () => Worker, handlers: SolverClientHandlers<TState>) {
    this.createWorker = createWorker;
    this.handlers = handlers;
  }

  start(init: SolverInit): void {
    this.lastInit = init;
    this.terminate();
    const worker = this.createWorker();
    this.worker = worker;
    worker.onmessage = (event: MessageEvent<FromWorkerMessage<TState>>) => {
      const message = event.data;
      if (message.v !== WORKER_PROTOCOL_VERSION) {
        this.handlers.onError('ProtocolMismatch',
          `The worker speaks protocol ${message.v}; this build speaks ${WORKER_PROTOCOL_VERSION}.`);
        return;
      }
      if (message.type === 'ready') this.handlers.onReady(message.engineVersion, message.modelSetRevision);
      else if (message.type === 'state') this.handlers.onState(message);
      else this.handlers.onError(message.code, message.message);
    };
    worker.onerror = () => this.handlers.onDeath();
    this.post({ v: WORKER_PROTOCOL_VERSION, type: 'init', ...init });
  }

  /** Rebuild the worker and replay a transcript into it. */
  resumeFromTranscript(transcript: unknown): void {
    if (!this.lastInit) return;
    this.start(this.lastInit);
    this.post({ v: WORKER_PROTOCOL_VERSION, type: 'replay', transcript });
  }

  advance(ticks: number): void {
    if (ticks <= 0) return;
    this.post({ v: WORKER_PROTOCOL_VERSION, type: 'advance', ticks });
  }

  act(action: LearnerAction): void {
    this.post({ v: WORKER_PROTOCOL_VERSION, type: 'action', action });
  }

  reset(): void {
    this.post({ v: WORKER_PROTOCOL_VERSION, type: 'reset' });
  }

  terminate(): void {
    this.worker?.terminate();
    this.worker = null;
  }

  get alive(): boolean { return this.worker !== null; }

  private post(message: ToWorkerMessage): void {
    if (!this.worker) { this.handlers.onDeath(); return; }
    this.worker.postMessage(message);
  }
}
