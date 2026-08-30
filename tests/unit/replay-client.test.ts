/**
 * The transport half of counterfactual replay.
 *
 * The engine half is covered by tests/unit/debrief.test.ts, which drives the
 * replay directly, and by tests/unit/solver-worker.test.ts, which drives the
 * `history-replay` message on the shipping worker. What is left, and what this
 * covers, is the part between them: a worker per replay, terminated whichever
 * way the replay ends, and a failure that surfaces rather than hanging.
 */
import { describe, expect, it, vi } from 'vitest';
import { WORKER_PROTOCOL_VERSION, type ToWorkerMessage } from '@platform/kernel/protocol';
import { REPLAY_TIMEOUT_MS, workerReplay } from '@anesthesia/debrief/replay-client';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';

const OPTIONS = { scenario: ROUTINE_INDUCTION, seed: 1, practiceRegion: 'US', ticks: 10 };

/** A worker that records what it was sent and answers only when told to. */
class StubWorker {
  static live = 0;
  readonly sent: ToWorkerMessage[] = [];
  terminated = false;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  constructor() { StubWorker.live += 1; }
  postMessage(message: ToWorkerMessage) { this.sent.push(message); }
  terminate() { this.terminated = true; StubWorker.live -= 1; }
}

function harness() {
  const workers: StubWorker[] = [];
  const run = workerReplay(() => {
    const worker = new StubWorker();
    workers.push(worker);
    return worker as unknown as Worker;
  });
  return { run, workers };
}

describe('Requirement: A Counterfactual Runs Where The Engine Already Is', () => {
  it('Scenario: the history the worker returns is what the caller receives', async () => {
    const { run, workers } = harness();
    const pending = run([], OPTIONS);
    const worker = workers[0]!;
    const request = worker.sent[0] as { type: string; requestId: string; ticks: number };
    expect(request.type).toBe('history-replay');
    expect(request.ticks).toBe(10);
    const history = [{ tick: 0, state: { spo2Percent: 97 }, concentrations: [] }];
    worker.onmessage?.({ data: {
      v: WORKER_PROTOCOL_VERSION, type: 'history', requestId: request.requestId, history,
    } });
    await expect(pending).resolves.toEqual(history);
    // The worker existed for one replay and no longer exists.
    expect(worker.terminated).toBe(true);
    expect(StubWorker.live).toBe(0);
  });

  it('Scenario: a reply for a different request is not mistaken for the answer', async () => {
    const { run, workers } = harness();
    const pending = run([], OPTIONS);
    const worker = workers[0]!;
    worker.onmessage?.({ data: {
      v: WORKER_PROTOCOL_VERSION, type: 'history', requestId: 'somebody-elses', history: [],
    } });
    expect(worker.terminated).toBe(false);
    const request = worker.sent[0] as { requestId: string };
    worker.onmessage?.({ data: {
      v: WORKER_PROTOCOL_VERSION, type: 'history', requestId: request.requestId, history: [],
    } });
    await expect(pending).resolves.toEqual([]);
  });

  it('Scenario: an engine failure rejects rather than waiting for the timeout', async () => {
    const { run, workers } = harness();
    const pending = run([], OPTIONS);
    // The worker's own catch reports engine failures without a request id, so an
    // error is taken at face value: this worker is running nothing else.
    workers[0]!.onmessage?.({ data: {
      v: WORKER_PROTOCOL_VERSION, type: 'error', code: 'EngineError', message: 'state went non-finite',
    } });
    await expect(pending).rejects.toThrow('state went non-finite');
    expect(workers[0]!.terminated).toBe(true);
  });

  it('Scenario: a worker that never answers is abandoned, not left pending', async () => {
    vi.useFakeTimers();
    try {
      const { run, workers } = harness();
      const pending = run([], OPTIONS);
      const settled = pending.then(() => 'resolved', () => 'rejected');
      vi.advanceTimersByTime(REPLAY_TIMEOUT_MS);
      await expect(settled).resolves.toBe('rejected');
      expect(workers[0]!.terminated).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('Scenario: a worker that fails to start rejects', async () => {
    const { run, workers } = harness();
    const pending = run([], OPTIONS);
    workers[0]!.onerror?.();
    await expect(pending).rejects.toThrow(/failed to start/);
  });
});
