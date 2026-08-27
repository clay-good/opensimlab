/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { Debrief } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import type { HistorySample } from '@platform/session/session-store';
import { RenalHypokalemia, RENAL_HYPOKALEMIA_TAKEOVER_TICKS as STOP,
  RENAL_HYPOKALEMIA_SESSION_TICKS as SESSION, RENAL_HYPOKALEMIA_RESPONSE_TICKS as RESPONSE,
  RENAL_HYPOKALEMIA_RECURRENCE_TICKS as RECURRENCE, type RenalHypokalemiaAction,
  type RenalHypokalemiaEvent } from '../../src/modules/renal-electrolyte/hypokalemia';
import { RENAL_HYPOKALEMIA_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/hypokalemia-fixtures';
import { RENAL_HYPOKALEMIA_MAGNESIUM_AND_ONGOING_LOSSES as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/hypokalemia-magnesium-and-ongoing-losses';

describe('Renal hypokalemia rendered debrief separates partial response from durable correction', () => {
  let root: Root; let container: HTMLDivElement;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() });
    container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
  function click(label: string) {
    const button = [...container.querySelectorAll('button')].find((item) => item.textContent?.trim() === label);
    expect(button).toBeDefined(); act(() => button!.click());
  }
  function renderRun(choices: readonly (readonly [number, RenalHypokalemiaAction])[], finalTick: number) {
    // Actual model transitions/events; every solver frame is verified separately by integration tests.
    const model = new RenalHypokalemia(); const log: EngineEvent[] = []; const history: HistorySample[] = [];
    const initial = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' }).step();
    const capture = (events: readonly RenalHypokalemiaEvent[], tick: number) => {
      log.push(...events.map((event) => ({ tick, severity: 'info' as const, category: 'renal-hypokalemia',
        message: event.message, eventId: `renal-hypokalemia-${event.id}-${tick}` })));
      const { alertness: _alertness, ...vitals } = model.vitals();
      history.push({ tick, state: { ...initial.state, ...vitals }, concentrations: initial.concentrations });
    };
    capture([], 0);
    const actions: LearnerAction[] = choices.map(([tick, action]) => {
      capture(model.apply(action, tick), tick);
      return { tick, type: 'renal-hypokalemia-response', payload: { action } };
    });
    capture(model.advance(finalTick), finalTick);
    expect(history.every(({ state }) => (state.meanArterialMmHg ?? 0) >= 70 && state.spo2Percent === 98)).toBe(true);
    act(() => root.render(<Debrief scenario={SCENARIO} moduleId="renal-electrolyte"
      history={history} actions={actions} log={log} attributionByTick={() => []} preoxygenationSeconds={0}
      timeToPeakSeconds={{}} replayOptions={{ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US', ticks: finalTick }}
      onOpenExplainer={() => {}} onExportTranscript={() => {}} onReplayScenario={() => {}} />));
    click('Skip and continue'); click('Continue to the analysis');
    expect(container.textContent).not.toContain('That is a good outcome');
    expect(container.textContent).toContain('does not establish a good outcome');
    click('Continue');
    expect(container.textContent).toContain('Potassium alone can partially improve the supplied deficit');
    expect(container.textContent).toContain('Magnesium is neither a substitute for potassium nor a prerequisite that delays urgent replacement');
    expect(container.textContent).toContain('does not instantly stop diarrhea');
    expect(container.textContent).toContain('Handoff ends the rehearsal, not monitoring');
    expect(container.textContent).toContain('durable safety, discharge readiness, and competence are not certified');
    return model.snapshot(finalTick);
  }
  const outcomes = () => [...container.querySelectorAll('li > strong')].map((item) => item.textContent);

  it.each(['expert', 'recovery', 'commonError', 'noAction'] as const)('renders the %s course without claiming full stores or rhythm safety', (path) => {
    const corrected = path === 'expert' || path === 'recovery';
    const choices = FIXTURES[path];
    const finalTick = corrected ? choices.at(-1)![0] : choices.some(([, action]) => action === 'potassium') ? SESSION : STOP;
    const patient = renderRun(choices, finalTick);
    expect(patient.ended).toBe(corrected ? 'handoff' : 'instructor-takeover');
    expect(outcomes()).toEqual(Array(5).fill(corrected ? 'Met' : 'Not met'));
    if (corrected) expect(container.textContent).toContain('Recovery may remain pending');
    if (path === 'recovery' || path === 'commonError') {
      expect(container.textContent).toContain('attempted unmonitored rapid-potassium shortcut was refused');
      expect(container.textContent).toContain('Attempted monitoring closure was refused');
    }
    if (path === 'recovery') expect(container.textContent).toContain('Earlier observed recurrence remains part of this run despite later care');
  });

  it('does not credit newer potassium-only and ECG-only results as a full magnesium or response assessment', () => {
    const patient = renderRun([[0, 'reassess'], [1, 'potassium'], [2, 'magnesium'], [3, 'call-support'],
      [4, 'review-context'], [5, 'manage-losses'], [6, 'monitor'], [RESPONSE + 2, 'check-potassium'],
      [RESPONSE + 2, 'check-ecg'], [RESPONSE + 3, 'handoff']], RESPONSE + 3);
    expect(patient).toMatchObject({ ended: null, responseObserved: false,
      observation: { atTick: 0, potassiumMmolL: 2.3, magnesiumMmolL: 0.40 },
      potassiumObservation: { atTick: RESPONSE + 2, potassiumMmolL: 3.1 },
      ecgObservation: { atTick: RESPONSE + 2, rhythm: 'sinus' } });
    expect(outcomes()).toEqual(['Not met', 'Not met', 'Met', 'Not met', 'Not met']);
    expect(container.textContent).toContain('did not refresh older magnesium or full bedside findings');
  });

  it('allows observed unresolved recurrence to be handed off while the later response remains pending', () => {
    const patient = renderRun([[0, 'potassium'], [0, 'magnesium'], [1, 'call-support'], [2, 'review-context'],
      [3, 'monitor'], [RECURRENCE, 'reassess'], [RECURRENCE, 'manage-losses'],
      [RECURRENCE, 'handoff']], RECURRENCE);
    expect(patient).toMatchObject({ ended: 'handoff', recurrenceObserved: true, responseObserved: false,
      observation: { potassiumMmolL: 2.5, magnesiumMmolL: 0.46, rhythm: 'hypokalemic-repolarization' },
      durableRecoveryProven: false });
    expect(outcomes()).toEqual(Array(5).fill('Met'));
    expect(container.textContent).toContain('Recovery may remain pending');
  });

  it('keeps earlier response credit historical when recurrence has only partial new findings', () => {
    const patient = renderRun([[0, 'potassium'], [0, 'magnesium'], [1, 'call-support'], [2, 'review-context'],
      [3, 'monitor'], [RESPONSE, 'reassess'], [RECURRENCE, 'check-potassium'],
      [RECURRENCE, 'check-ecg'], [RECURRENCE, 'manage-losses'], [RECURRENCE, 'handoff']], RECURRENCE);
    expect(patient).toMatchObject({ ended: null, responseObserved: true, recurrenceObserved: false,
      observation: { atTick: RESPONSE, potassiumMmolL: 3.1, magnesiumMmolL: 0.62, rhythm: 'sinus' },
      potassiumObservation: { atTick: RECURRENCE, potassiumMmolL: 2.5 },
      ecgObservation: { atTick: RECURRENCE, rhythm: 'hypokalemic-repolarization' } });
    expect(outcomes()).toEqual(['Met', 'Met', 'Met', 'Met', 'Not met']);
    expect(container.textContent).toContain('did not refresh older magnesium or full bedside findings');
  });
});
