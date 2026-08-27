/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { Debrief } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import type { HistorySample } from '@platform/session/session-store';
import { RenalHyperkalemia, RENAL_HYPERKALEMIA_TAKEOVER_TICKS as STOP,
  RENAL_HYPERKALEMIA_SHIFT_TICKS as SHIFT, RENAL_HYPERKALEMIA_REBOUND_TICKS as REBOUND,
  type RenalHyperkalemiaAction, type RenalHyperkalemiaEvent } from '../../src/modules/renal-electrolyte/hyperkalemia';
import { RENAL_HYPERKALEMIA_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/hyperkalemia-fixtures';
import { RENAL_HYPERKALEMIA_CARDIOPROTECTION_AND_REBOUND as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/hyperkalemia-cardioprotection-and-rebound';

describe('Renal hyperkalemia rendered debrief preserves temporary protection and continued ownership', () => {
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
  function renderRun(choices: readonly (readonly [number, RenalHyperkalemiaAction])[], finalTick: number) {
    // Actual model transitions/events; every solver frame is verified by separate integration tests.
    const model = new RenalHyperkalemia(); const log: EngineEvent[] = []; const history: HistorySample[] = [];
    const initial = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' }).step();
    const capture = (events: readonly RenalHyperkalemiaEvent[], tick: number) => {
      log.push(...events.map((event) => ({ tick, severity: 'info' as const, category: 'renal-hyperkalemia',
        message: event.message, eventId: `renal-hyperkalemia-${event.id}-${tick}` })));
      const { alertness: _alertness, ...vitals } = model.vitals();
      history.push({ tick, state: { ...initial.state, ...vitals }, concentrations: initial.concentrations });
    };
    capture([], 0);
    const actions: LearnerAction[] = choices.map(([tick, action]) => {
      capture(model.apply(action, tick), tick);
      return { tick, type: 'renal-hyperkalemia-response', payload: { action } };
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
    expect(container.textContent).toContain('Calcium does not lower potassium and its ECG benefit is temporary');
    expect(container.textContent).toContain('Hypoglycemia is a possible delayed complication, not an inevitable modeled outcome');
    expect(container.textContent).toContain('Handoff ends the rehearsal, not monitoring');
    expect(container.textContent).toContain('No durable safety, kidney recovery, discharge, or competence certification is implied');
    return model.snapshot(finalTick);
  }
  const outcomes = () => [...container.querySelectorAll('li > strong')].map((item) => item.textContent);

  it.each(['expert', 'recovery', 'commonError', 'noAction'] as const)('renders %s findings without treating ECG improvement as resolution', (path) => {
    const corrected = path === 'expert' || path === 'recovery';
    const choices = FIXTURES[path]; const finalTick = corrected ? choices.at(-1)![0] : STOP;
    const patient = renderRun(choices, finalTick);
    expect(patient.ended).toBe(corrected ? 'handoff' : 'instructor-takeover');
    expect(outcomes()).toEqual(corrected ? Array(5).fill('Met')
      : path === 'commonError' ? ['Met', 'Not met', 'Not met', 'Not met', 'Not met'] : Array(5).fill('Not met'));
    expect(container.textContent).toContain(corrected ? 'Planning did not lower potassium' : 'A fresh later full assessment is missing');
    if (path === 'recovery' || path === 'commonError') {
      expect(container.textContent).toContain('attempted ECG-means-resolved shortcut was refused');
      expect(container.textContent).toContain('Attempted glucose-monitoring closure was refused');
    }
    if (path === 'recovery') expect(container.textContent).toContain('Earlier observed rebound remains part of this run despite later care');
  });

  it('does not turn a newer ECG and glucose check into potassium reassessment or handoff credit', () => {
    const patient = renderRun([[0, 'reassess'], [1, 'calcium'], [2, 'shift'], [3, 'call-support'],
      [4, 'review-context'], [5, 'plan-removal'], [6, 'monitor'], [SHIFT + 2, 'check-ecg'],
      [SHIFT + 2, 'check-glucose'], [SHIFT + 3, 'deliver-removal'], [SHIFT + 4, 'handoff']], SHIFT + 4);
    expect(patient).toMatchObject({ ended: null, shiftResponseObserved: false, removalResponseObserved: false,
      observation: { atTick: 0, potassiumMmolL: 6.9, glucoseMgDl: 108 },
      ecgObservation: { atTick: SHIFT + 2, rhythm: 'sinus' },
      glucoseObservation: { atTick: SHIFT + 2, glucoseMgDl: 104 } });
    expect(outcomes()).toEqual(['Met', 'Not met', 'Met', 'Not met', 'Not met']);
    expect(container.textContent).toContain('did not refresh older potassium findings');
    expect(container.textContent).toContain('Continuing-care ownership or current full reassessment remains incomplete');
  });

  it('credits an observed unresolved-rebound handoff without falsely claiming the pending removal response', () => {
    const patient = renderRun([[0, 'calcium'], [0, 'shift'], [1, 'call-support'], [2, 'review-context'],
      [3, 'plan-removal'], [4, 'monitor'], [REBOUND, 'reassess'], [REBOUND, 'deliver-removal'],
      [REBOUND, 'handoff']], REBOUND);
    expect(patient).toMatchObject({ ended: 'handoff', reboundObserved: true, removalResponseObserved: false,
      observation: { potassiumMmolL: 6.6, rhythm: 'hyperkalemic-conduction' }, durableRecoveryProven: false });
    expect(outcomes()).toEqual(Array(5).fill('Met'));
    expect(container.textContent).toContain('Hyperkalemia or removal response may remain unresolved');
  });
});
