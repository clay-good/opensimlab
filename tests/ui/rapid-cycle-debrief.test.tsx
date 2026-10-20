/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { Debrief } from '@anesthesia/ui/Debrief';
import type { HistorySample } from '@platform/session/session-store';
import { PERSISTENT_VF_CARDIAC_ARREST as SCENARIO } from '@anesthesia/scenarios/persistent-vf-cardiac-arrest';

describe('rapid cycle in the debrief', () => {
  let root: Root; let container: HTMLDivElement;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() });
    container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); vi.unstubAllGlobals(); });

  function summary(guidance: 'coached' | 'unassisted', onRapidCycle = vi.fn()) {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1, practiceRegion: 'US' });
    const history: HistorySample[] = [];
    let frame = engine.step();
    while (frame.tick < 900) { if (frame.tick % 10 === 0) history.push({ tick: frame.tick, state: frame.state, concentrations: frame.concentrations }); frame = engine.step(); }
    act(() => root.render(<Debrief scenario={SCENARIO} moduleId="anesthesia" history={history} actions={[]} log={frame.events}
      attributionByTick={() => []} preoxygenationSeconds={0} timeToPeakSeconds={{}} guidance={guidance} onRapidCycle={onRapidCycle}
      replayOptions={{ scenario: SCENARIO, seed: 1, practiceRegion: 'US', ticks: 900 }}
      onOpenExplainer={() => {}} onExportTranscript={() => {}} onReplayScenario={() => {}} />));
    for (const label of ['Skip and continue', 'Continue to the analysis', 'Continue']) {
      const button = [...container.querySelectorAll('button')].find((item) => item.textContent?.trim() === label);
      act(() => button?.click());
    }
    return onRapidCycle;
  }

  it('offers the unmet timed step with its one sentence of evidence, and starts it on request', () => {
    const start = summary('coached');
    expect(container.textContent).toContain('Rapid-cycle rehearsal');
    expect(container.textContent).toContain('very low certainty of evidence');
    const button = [...container.querySelectorAll('button')].find((item) => item.textContent === 'Start rapid-cycle rehearsal')!;
    act(() => button.click());
    expect(start).toHaveBeenCalledWith(SCENARIO.rapidCycle![0]);
  });

  it('is not offered in unassisted mode', () => {
    summary('unassisted');
    expect(container.textContent).not.toContain('Rapid-cycle rehearsal');
  });
});
