/**
 * Acceptance tests for the REAL solver worker module, driven through its message
 * interface (engine/simulation-clock → Solver Runs Off The Main Thread).
 *
 * The session integration test drives an in-process stand-in, which is fast but
 * can drift from the module that actually ships. These tests import the shipping
 * module and speak the protocol to it directly, so a divergence is caught here.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { WORKER_PROTOCOL_VERSION, type FromWorkerMessage, type ToWorkerMessage } from '@platform/kernel/protocol';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { SAMPLE_RATE_HZ } from '@anesthesia/waveforms/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';

const emitted: FromWorkerMessage<Record<string, number>>[] = [];
let deliver: (message: ToWorkerMessage) => void;

beforeAll(async () => {
  // The worker global the module expects. Nothing else about it is special.
  const scope = {
    postMessage: (message: FromWorkerMessage<Record<string, number>>) => { emitted.push(message); },
    onmessage: null as ((event: { data: ToWorkerMessage }) => void) | null,
  };
  (globalThis as { self?: unknown }).self = scope;
  await import('@anesthesia/solver.worker');
  deliver = (message) => scope.onmessage?.({ data: message });
});

const init = () => {
  emitted.length = 0;
  deliver({
    v: WORKER_PROTOCOL_VERSION, type: 'init',
    scenarioId: ROUTINE_INDUCTION.metadata.id,
    scenarioVersion: ROUTINE_INDUCTION.metadata.version,
    contentVersion: ROUTINE_INDUCTION.metadata.version,
    modelSetRevision: 'test', engineVersion: 'test',
    practiceRegion: 'US', seed: 1, scenario: ROUTINE_INDUCTION,
  } as unknown as ToWorkerMessage);
};

const lastState = () => {
  const message = emitted[emitted.length - 1];
  if (!message || message.type !== 'state') throw new Error(`expected a state message, got ${message?.type}`);
  return message;
};

/**
 * The debrief's counterfactual and the instructor review page both ask the worker
 * to re-run an action list, because the worker holds the only engine this build
 * ships. These tests drive that message on the shipping module.
 */
describe('Requirement: A Counterfactual Runs Where The Engine Already Is', () => {
  const historyReplay = (over: Partial<Record<string, unknown>> = {}) => {
    emitted.length = 0;
    deliver({
      v: WORKER_PROTOCOL_VERSION, type: 'history-replay', requestId: 'r1',
      scenario: ROUTINE_INDUCTION, seed: 1, practiceRegion: 'US',
      ticks: 30 * TICKS_PER_SECOND, actions: [], ...over,
    } as unknown as ToWorkerMessage);
    return emitted[emitted.length - 1];
  };

  it('Scenario: a replay returns one history sample per simulated second', () => {
    init();
    const message = historyReplay();
    if (message?.type !== 'history') throw new Error(`expected history, got ${message?.type}`);
    expect(message.requestId).toBe('r1');
    expect(message.history.length).toBe(30);
    expect(message.history[0]?.tick).toBe(0);
    expect(message.history[1]?.tick).toBe(TICKS_PER_SECOND);
    expect(typeof message.history[0]?.state.meanArterialMmHg).toBe('number');
  });

  it('Scenario: a replay leaves the running session untouched', () => {
    // The learner opens the debrief without ending the session, so the engine the
    // cockpit is driving must not move because a counterfactual was computed.
    init();
    deliver({ v: WORKER_PROTOCOL_VERSION, type: 'advance', ticks: 10 });
    const before = lastState().tick;
    historyReplay();
    emitted.length = 0;
    deliver({ v: WORKER_PROTOCOL_VERSION, type: 'advance', ticks: 1 });
    expect(lastState().tick).toBe(before + 1);
  });

  it('Scenario: an invalid scenario is refused against the request, not the session', () => {
    init();
    const message = historyReplay({ scenario: { schemaVersion: 1 } });
    if (message?.type !== 'error') throw new Error(`expected error, got ${message?.type}`);
    expect(message.code).toBe('InvalidScenario');
    expect(message.requestId).toBe('r1');
  });
});

describe('Requirement: The Solver Speaks A Versioned Protocol', () => {
  it('Scenario: medicines-reconciliation state has protocol version 208', () => {
    expect(WORKER_PROTOCOL_VERSION).toBe(208);
  });

  it('Scenario: init reports ready before any step runs', () => {
    init();
    expect(emitted.map((message) => message.type)).toEqual(['ready']);
  });

  it('Scenario: an unknown protocol version is refused rather than guessed at', () => {
    init();
    emitted.length = 0;
    deliver({ v: 999, type: 'advance', ticks: 1 } as unknown as ToWorkerMessage);
    const message = emitted[0];
    expect(message?.type).toBe('error');
    expect(message && 'code' in message ? message.code : '').toBe('ProtocolMismatch');
  });

  it('replay emits the recorded endpoint tick', () => {
    init();
    emitted.length = 0;
    deliver({
      v: WORKER_PROTOCOL_VERSION,
      type: 'replay',
      transcript: {
        ticks: 10,
        actions: [{ tick: 5, type: 'bolus', payload: { drugId: 'propofol', amount: 50, unit: 'mg' } }],
      },
    });
    const state = lastState();
    expect(state.tick).toBe(10);
    expect(state.concentrations.find((entry) => entry.drugId === 'propofol')?.plasma).toBeGreaterThan(0);
  });

  it.each([
    { v: WORKER_PROTOCOL_VERSION, type: 'action' },
    { v: WORKER_PROTOCOL_VERSION, type: 'action', action: null },
    { v: WORKER_PROTOCOL_VERSION, type: 'action', action: {
      tick: 0, type: 'bolus', payload: null } },
  ])('calmly refuses a malformed runtime action without ending the worker', (message) => {
    init(); emitted.length = 0;
    deliver(message as unknown as ToWorkerMessage);
    expect(emitted.some((entry) => entry.type === 'error')).toBe(false);
    deliver({ v: WORKER_PROTOCOL_VERSION, type: 'advance', ticks: 1 });
    const state = lastState();
    expect(state.tick).toBeGreaterThanOrEqual(0);
    expect(state.events.some((event) => event.eventId.startsWith('malformed-action-refused-')))
      .toBe(true);
  });
});

describe('Requirement: A Batched Advance Loses Pixels, Never Signal', () => {
  it('Scenario: one tick carries exactly one tick of samples for every signal', () => {
    init();
    deliver({ v: WORKER_PROTOCOL_VERSION, type: 'advance', ticks: 1 });
    const state = lastState();
    expect(state.waveforms.map((block) => block.signal).sort())
      .toEqual(['arterial', 'capno', 'ecg', 'pleth']);
    for (const block of state.waveforms) {
      const perTick = SAMPLE_RATE_HZ[block.signal as keyof typeof SAMPLE_RATE_HZ] / TICKS_PER_SECOND;
      expect(block.samples.length).toBe(perTick);
    }
  });

  it('Scenario: ten batched ticks carry ten ticks of samples, not one', () => {
    // This is the failure the traces die of: a late frame or a fast clock batches
    // the advance, and if only the last tick's samples are sent the sweep is asked
    // to paint a second of columns from a tenth of a second of signal.
    init();
    const ticks = 10;
    deliver({ v: WORKER_PROTOCOL_VERSION, type: 'advance', ticks });
    const state = lastState();
    for (const block of state.waveforms) {
      const perTick = SAMPLE_RATE_HZ[block.signal as keyof typeof SAMPLE_RATE_HZ] / TICKS_PER_SECOND;
      expect(block.samples.length).toBe(perTick * ticks);
    }
    // And the batch is real signal throughout, not a padded block of zeros.
    const ecg = state.waveforms.find((block) => block.signal === 'ecg')!;
    const firstHalf = ecg.samples.slice(0, ecg.samples.length / 2);
    const secondHalf = ecg.samples.slice(ecg.samples.length / 2);
    expect(firstHalf.some((value) => Math.abs(value) > 0.1)).toBe(true);
    expect(secondHalf.some((value) => Math.abs(value) > 0.1)).toBe(true);
  });

  it('Scenario: the sample rate is enough to sweep at the clinical paper speed', () => {
    // 25 mm/s at 4 px/mm is 100 columns a second; the electrocardiogram must
    // supply at least one sample per column or the trace goes sparse.
    expect(SAMPLE_RATE_HZ.ecg).toBeGreaterThanOrEqual(100);
  });
});
