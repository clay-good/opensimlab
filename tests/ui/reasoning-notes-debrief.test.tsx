/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { Debrief } from '@anesthesia/ui/Debrief';
import { ROUTINE_INDUCTION as SCENARIO } from '@anesthesia/scenarios/routine-induction';
import type { LearnerAction } from '@platform/kernel/protocol';

describe('reasoning notes in the debrief', () => {
  let root: Root; let container: HTMLDivElement;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() });
    container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
  const click = (label: string) => {
    const button = [...container.querySelectorAll('button')].find((item) => item.textContent?.trim() === label);
    expect(button, label).toBeDefined(); act(() => button!.click());
  };

  function render(notes?: readonly { tick: number; text: string }[]) {
    const frame = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1, practiceRegion: 'US' }).step();
    const actions: LearnerAction[] = [{ tick: 120, type: 'bolus', payload: { drugId: 'propofol', amount: 150 } }];
    act(() => root.render(<Debrief scenario={SCENARIO} moduleId="anesthesia"
      history={[{ tick: 0, state: frame.state, concentrations: frame.concentrations }]} actions={actions} log={[]}
      attributionByTick={(tick) => (tick === 300 ? [{ variable: 'map', terms: [{ termId: 'p', label: 'propofol vasodilation', contribution: -8, share: 0.8, teachingModel: false }] }] : [])}
      preoxygenationSeconds={0} timeToPeakSeconds={{}}
      {...(notes ? { reasoningNotes: notes } : {})}
      replayOptions={{ scenario: SCENARIO, seed: 1, practiceRegion: 'US', ticks: 600 }}
      onOpenExplainer={() => {}} onExportTranscript={() => {}} onReplayScenario={() => {}} />));
    click('Skip and continue');
  }

  it('shows each note in the analysis phase, beside the action it was written next to', () => {
    render([{ tick: 300, text: 'Waiting for the effect site before a second dose' }]);
    expect(container.textContent).not.toContain('What you wrote at the time');
    click('Continue to the analysis');
    expect(container.textContent).toContain('What you wrote at the time');
    expect(container.textContent).toContain('“Waiting for the effect site before a second dose”');
    expect(container.textContent).toContain('Beside your bolus at');
    expect(container.textContent).toContain('The engine attributed the change that followed mostly to propofol vasodilation.');
    expect(container.textContent).toContain('Nothing reads, scores, or sends them.');
  });

  it('adds nothing when no note was written', () => {
    render();
    click('Continue to the analysis');
    expect(container.textContent).not.toContain('What you wrote at the time');
  });
});
