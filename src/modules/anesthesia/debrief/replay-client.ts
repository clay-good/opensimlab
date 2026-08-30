/**
 * Ask the solver worker to re-run an action list.
 *
 * The debrief's counterfactuals and the instructor review page both need a
 * second, independent run of the engine over a modified or submitted action
 * list. They used to construct an engine on the main thread, which meant the
 * engine — and every lesson's authored prose with it — was bundled twice and
 * precached twice for offline use. The worker already has one, so they ask it.
 *
 * A worker is spawned per replay and terminated when the replay resolves. That
 * is deliberate: a counterfactual is a rare, one-shot piece of work, and a
 * dedicated worker cannot interleave with, or outlive, the session the learner
 * is still looking at.
 */

import {
  WORKER_PROTOCOL_VERSION, type FromWorkerMessage, type HistoryReplayMessage,
} from '@platform/kernel/protocol';
import type { HistorySample } from '@platform/session/session-store';
import type { RunReplay } from './replay';

/**
 * How long a single replay may take before it is abandoned, in milliseconds.
 *
 * A replay is bounded in ticks, but a device is not bounded in how slowly it
 * runs them, and a worker that never answers would leave the debrief showing a
 * pending panel forever. Failing is the correct outcome: the counterfactual is
 * additional material, and the rest of the debrief does not depend on it.
 */
export const REPLAY_TIMEOUT_MS = 30_000;

let requests = 0;

/** Build a `RunReplay` that runs in a worker made by `createWorker`. */
export function workerReplay(createWorker: () => Worker): RunReplay {
  return (actions, options) => new Promise<readonly HistorySample[]>((resolve, reject) => {
    const worker = createWorker();
    requests += 1;
    const requestId = `replay-${requests}`;
    let settled = false;
    const finish = (settle: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      settle();
    };
    const timer = setTimeout(
      () => finish(() => reject(new Error('The replay did not finish in time.'))),
      REPLAY_TIMEOUT_MS,
    );
    worker.onerror = () => finish(() => reject(new Error('The replay worker failed to start.')));
    worker.onmessage = (event: MessageEvent<FromWorkerMessage<Readonly<Record<string, number>>>>) => {
      const message = event.data;
      // A reply from a different build is not an answer to this one, and neither
      // is a state message from a session this worker is not running.
      if (message.v !== WORKER_PROTOCOL_VERSION) return;
      if (message.type === 'history' && message.requestId === requestId) {
        finish(() => resolve(message.history));
      } else if (message.type === 'error') {
        // Any error at all, whether or not it names this request: the worker was
        // made for this replay and does nothing else, so a failure it reports is
        // this replay's failure. An engine throw arrives without a request id.
        finish(() => reject(new Error(message.message)));
      }
    };
    const request: HistoryReplayMessage = {
      v: WORKER_PROTOCOL_VERSION, type: 'history-replay', requestId,
      scenario: options.scenario, seed: options.seed,
      practiceRegion: options.practiceRegion, ticks: options.ticks, actions,
    };
    worker.postMessage(request);
  });
}

/** The worker this build's replays run in. */
export function createReplayWorker(): Worker {
  return new Worker(new URL('../solver.worker.ts', import.meta.url), { type: 'module' });
}
