/**
 * The solver worker (engine/simulation-clock → Solver Runs Off The Main Thread).
 *
 * The physiological solver runs here, communicating with the interface by
 * transferring state snapshots, so solver work never blocks rendering or input.
 * It speaks the versioned protocol in `@platform/kernel/protocol`.
 */

/// <reference lib="webworker" />

import {
  WORKER_PROTOCOL_VERSION, type FromWorkerMessage, type StateMessage, type ToWorkerMessage,
} from '@platform/kernel/protocol';
import { AnesthesiaEngine, ENGINE_VERSION, type Scenario } from './engine';
import { replay as replayHistory } from './debrief/replay-engine';
import type { PatientState } from './physiology';
import { MODEL_SET_REVISION } from './pharmacology/registry';
import { validateScenario } from './scenarios/schema';

let engine: AnesthesiaEngine | null = null;

const post = (message: FromWorkerMessage<PatientState>, transfer: Transferable[] = []): void => {
  (self as unknown as DedicatedWorkerGlobalScope).postMessage(message, transfer);
};

const fail = (code: string, message: string, requestId?: string): void => {
  post({ v: WORKER_PROTOCOL_VERSION, type: 'error', code, message, ...(requestId ? { requestId } : {}) });
};

/**
 * Run `ticks` steps and emit one state message describing the last of them.
 *
 * The STATE is the last tick's — a snapshot is a snapshot. The WAVEFORM SAMPLES
 * are every tick's, concatenated in order. A batch happens whenever the clock
 * runs faster than the frame rate, or a frame is late, and dropping the samples
 * for all but the last tick would punch holes in the traces exactly when the
 * learner is watching them most closely (engine/waveform-synthesis → the sweep
 * loses pixels, never signal).
 */
function advance(ticks: number): void {
  if (!engine) { fail('NotInitialized', 'The worker received advance before init.'); return; }
  let last = engine.step();
  const events = [...last.events];
  const warnings = [...last.warnings];
  const collected: Record<SignalKey, Float32Array[]> = {
    ecg: [last.waveforms.ecg.samples],
    arterial: [last.waveforms.arterial.samples],
    capno: [last.waveforms.capno.samples],
    pleth: [last.waveforms.pleth.samples],
  };
  for (let i = 1; i < ticks; i += 1) {
    last = engine.step();
    events.push(...last.events);
    warnings.push(...last.warnings);
    for (const signal of SIGNALS) collected[signal].push(last.waveforms[signal].samples);
  }

  const message: StateMessage<PatientState> = {
    v: WORKER_PROTOCOL_VERSION,
    type: 'state',
    tick: last.tick,
    state: last.state,
    concentrations: last.concentrations,
    attribution: last.attribution,
    waveforms: SIGNALS.map((signal) => ({
      signal,
      ...blockOf(last.waveforms[signal]),
      samples: concat(collected[signal]),
    })),
    alarms: last.alarms.map((alarm) => ({
      alarmId: alarm.id, priority: alarm.priority, parameter: alarm.parameter,
      value: alarm.value, unit: alarm.unit, message: alarm.message,
      sinceTick: alarm.sinceTick, silencedUntilTick: alarm.silencedUntilTick,
    })),
    events,
    warnings,
    equipment: last.equipment,
  };
  post(message, message.waveforms.map((block) => block.samples.buffer as ArrayBuffer));
}

function blockOf(block: { sampleRateHz: number; startSeconds: number; samples: Float32Array }) {
  return { sampleRateHz: block.sampleRateHz, startSeconds: block.startSeconds, samples: block.samples };
}

/** The four synthesized signals, in the order the monitor stacks them. */
const SIGNALS = ['ecg', 'arterial', 'capno', 'pleth'] as const;
type SignalKey = (typeof SIGNALS)[number];

/** Join a batch of per-tick sample blocks into the one block the monitor receives. */
function concat(blocks: readonly Float32Array[]): Float32Array {
  if (blocks.length === 1) return blocks[0] as Float32Array;
  let total = 0;
  for (const block of blocks) total += block.length;
  const joined = new Float32Array(total);
  let offset = 0;
  for (const block of blocks) { joined.set(block, offset); offset += block.length; }
  return joined;
}

self.onmessage = (event: MessageEvent<ToWorkerMessage>) => {
  const message = event.data;
  if (message.v !== WORKER_PROTOCOL_VERSION) {
    fail('ProtocolMismatch',
      `Worker protocol mismatch: message version ${message.v}, this build speaks ${WORKER_PROTOCOL_VERSION}.`);
    return;
  }
  try {
    switch (message.type) {
      case 'init': {
        // The scenario is validated on the main thread too, but the worker never
        // trusts what it is handed: an invalid scenario stops before any step runs.
        const errors = validateScenario(message.scenario);
        if (errors.length > 0) {
          fail('InvalidScenario', errors.map((e) => `${e.pointer}: ${e.message}`).join('\n'));
          return;
        }
        engine = new AnesthesiaEngine({
          scenario: message.scenario as Scenario,
          seed: message.seed,
          practiceRegion: message.practiceRegion,
        });
        post({
          v: WORKER_PROTOCOL_VERSION, type: 'ready',
          engineVersion: ENGINE_VERSION, modelSetRevision: MODEL_SET_REVISION,
        });
        break;
      }
      case 'advance':
        advance(message.ticks);
        break;
      case 'action':
        if (!engine) { fail('NotInitialized', 'The worker received an action before init.'); return; }
        engine.apply(message.action);
        break;
      case 'replay': {
        const transcript = message.transcript as { actions?: { tick: number }[]; ticks?: number };
        if (!engine) { fail('NotInitialized', 'The worker received replay before init.'); return; }
        // Replay is the ordinary path with the recorded actions injected at their
        // recorded ticks. Nothing about it is special-cased, which is what makes
        // the reproduction exact.
        const actions = [...(transcript.actions ?? [])].sort((a, b) => a.tick - b.tick);
        let next = 0;
        for (let tick = 0; tick < (transcript.ticks ?? 0); tick += 1) {
          while (next < actions.length && (actions[next]?.tick ?? Infinity) <= tick) {
            engine.apply(actions[next] as never);
            next += 1;
          }
          engine.step();
        }
        advance(1);
        break;
      }
      case 'history-replay': {
        // Deliberately a FRESH engine and never `engine`: a counterfactual must not
        // disturb the session the learner is looking at, and the debrief asks for
        // one while that session is still open.
        const errors = validateScenario(message.scenario);
        if (errors.length > 0) {
          fail('InvalidScenario', errors.map((e) => `${e.pointer}: ${e.message}`).join('\n'), message.requestId);
          return;
        }
        post({
          v: WORKER_PROTOCOL_VERSION, type: 'history', requestId: message.requestId,
          history: replayHistory(message.actions, {
            scenario: message.scenario as Scenario, seed: message.seed,
            practiceRegion: message.practiceRegion, ticks: message.ticks,
          }),
        });
        break;
      }
      case 'reset':
        engine = null;
        break;
      default:
        fail('UnknownMessage', `Unknown message type: ${(message as { type: string }).type}`);
    }
  } catch (error) {
    fail('EngineError', error instanceof Error ? error.message : String(error));
  }
};
