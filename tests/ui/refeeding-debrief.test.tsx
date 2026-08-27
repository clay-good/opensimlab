/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { Debrief } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import type { HistorySample } from '@platform/session/session-store';
import { Refeeding, REFEEDING_TAKEOVER_TICKS, type RefeedingEvent } from '../../src/modules/endocrine-metabolic/refeeding';
import { REFEEDING_FIXTURES as FIXTURES } from '../../src/modules/endocrine-metabolic/refeeding-fixtures';
import { REFEEDING_ELECTROLYTE_SHIFT as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/refeeding-electrolyte-shift';

describe('Refeeding rendered debrief preserves the clinical scope of its observations', () => {
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

  it.each(['noAction', 'commonError', 'recovery', 'expert'] as const)('does not call the %s course a good outcome merely because generic thresholds were absent', (path) => {
    // Use the actual lesson transitions and event IDs; full solver replay is covered separately.
    const model = new Refeeding(); const log: EngineEvent[] = []; const history: HistorySample[] = [];
    const initial = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' }).step();
    const capture = (events: readonly RefeedingEvent[], tick: number) => {
      log.push(...events.map((event) => ({ tick, severity: 'info' as const, category: 'refeeding',
        message: event.message, eventId: `refeeding-${event.id}-${tick}` })));
      const { alertness: _alertness, ...vitals } = model.vitals();
      history.push({ tick, state: { ...initial.state, ...vitals }, concentrations: initial.concentrations });
    };
    capture([], 0);
    const actions: LearnerAction[] = FIXTURES[path].map(([tick, action]) => {
      capture(model.apply(action, tick), tick);
      return { tick, type: 'refeeding-response', payload: { action } };
    });
    const corrected = path === 'expert' || path === 'recovery';
    const finalTick = corrected ? actions.at(-1)!.tick : REFEEDING_TAKEOVER_TICKS;
    capture(model.advance(finalTick), finalTick);
    expect(model.snapshot(finalTick).ended).toBe(corrected ? 'handoff' : 'instructor-takeover');
    expect(history.every(({ state }) => (state.meanArterialMmHg ?? 0) >= 70 && state.spo2Percent === 97)).toBe(true);
    act(() => root.render(<Debrief scenario={SCENARIO} moduleId="endocrine-metabolic"
      history={history} actions={actions} log={log} attributionByTick={() => []} preoxygenationSeconds={0}
      timeToPeakSeconds={{}} replayOptions={{ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US', ticks: finalTick }}
      onOpenExplainer={() => {}} onExportTranscript={() => {}} onReplayScenario={() => {}} />));
    click('Skip and continue'); click('Continue to the analysis');
    expect(container.textContent).not.toContain('That is a good outcome');
    expect(container.textContent).toContain('does not establish a good outcome');
    click('Continue');
    expect([...container.querySelectorAll('li > strong')].map((item) => item.textContent))
      .toEqual(Array(5).fill(corrected ? 'Met' : 'Not met'));
    expect(container.textContent).toContain(corrected ? 'not normalized electrolytes or durable safety' : 'fresh combined-care assessment is missing');
    if (path === 'recovery') expect(container.textContent).toContain('An observed recurrent decline remains');
  });
});
