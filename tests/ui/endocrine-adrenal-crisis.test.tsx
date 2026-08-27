/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { crisisResponseAvailability } from '@anesthesia/ui/ActionCockpit';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { Debrief } from '@anesthesia/ui/Debrief';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { AdrenalCrisisTray } from '../../src/modules/endocrine-metabolic/AdrenalCrisisTray';
import { AdrenalCrisis } from '../../src/modules/endocrine-metabolic/adrenal-crisis';
import { ADRENAL_FIXTURES } from '../../src/modules/endocrine-metabolic/adrenal-crisis-fixtures';
import { ADRENAL_CRISIS_TREATMENT_BEFORE_TESTS as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/adrenal-crisis-treatment-before-tests';

describe('Adrenal crisis experience', () => {
  it('opens the debrief in this emergency-care context rather than claiming anesthesia was performed', () => {
    const html = renderToStaticMarkup(<Debrief scenario={SCENARIO} moduleId="endocrine-metabolic"
      history={[]} actions={[]} log={[]} attributionByTick={() => []} preoxygenationSeconds={0}
      timeToPeakSeconds={{}} replayOptions={{ scenario: SCENARIO, seed: ADRENAL_FIXTURES.seed, practiceRegion: 'US', ticks: 0 }}
      onOpenExplainer={() => {}} onExportTranscript={() => {}} onReplayScenario={() => {}} />);
    expect(html).toContain('coordinating emergency treatment and reassessment');
    expect(html).not.toMatch(/anaesthetising|anesthetizing/);
  });
  it('offers non-announcing inline tutor text in guided and coached modes but not unassisted', () => {
    const patient = new AdrenalCrisis().snapshot(0);
    for (const guidance of ['guided', 'coached', 'unassisted'] as const) {
      const html = renderToStaticMarkup(<AdrenalCrisisTray assessment={patient} guidance={guidance} onAction={() => {}} />);
      expect(html.includes('aria-label="Private tutor"')).toBe(guidance !== 'unassisted');
      expect(html).not.toContain('aria-live');
      if (guidance !== 'unassisted') expect(html).toContain('Read the source (opens in a new tab)');
    }
  });
  it('prerenders the exact lesson and describes its treatment-before-tests boundary', () => {
    const html = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/endocrine-metabolic/scenario/adrenal-crisis-treatment-before-tests' }));
    expect(html).toContain('<h1>Adrenal crisis: treatment cannot wait for tests</h1>');
    expect(html).not.toContain('ASA 4');
    const briefing = renderToStaticMarkup(createElement(Prebrief, { scenario: SCENARIO, region: UNITED_STATES,
      environment: 'endocrine-metabolic', guidance: 'guided', onGuidance: () => {}, onStart: () => {} }));
    expect(briefing).toContain('No test result unlocks');
    expect(crisisResponseAvailability(SCENARIO).hasAdrenalCrisisResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasAdrenalCrisisResponse).toBe(false);
  });
  it('keeps immediate treatment enabled before the record, shows refusals, and uses accepted model state', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.append(container); const root = createRoot(container);
    const model = new AdrenalCrisis(); const pause = vi.fn();
    const render = () => act(() => root.render(<AdrenalCrisisTray assessment={model.snapshot(0)} guidance="guided" onOpenSource={pause} onAction={(action) => { model.apply(action, 0); render(); }} />));
    const button = (text: string) => [...container.querySelectorAll('button')].find((entry) => entry.textContent === text)!;
    try {
      render(); expect(container.textContent).not.toContain('126 mmol/L');
      act(() => container.querySelector('a')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
      expect(pause).toHaveBeenCalledOnce();
      expect(button('Start qualified parenteral hydrocortisone').disabled).toBe(false);
      act(() => button('Rely on oral replacement only').click()); expect(container.textContent).toContain('Oral-only treatment was not given');
      act(() => button('Start qualified parenteral hydrocortisone').click());
      expect(model.snapshot(0).hydrocortisoneAtTick).toBe(0); expect(model.snapshot(0).recordReviewed).toBe(false);
      expect(button('Start qualified parenteral hydrocortisone')).toBeUndefined();
      act(() => button('Review replacement and laboratory record').click()); expect(container.textContent).toContain('126 mmol/L');
      expect(container.textContent).toContain('not current repeat results');
    } finally { act(() => root.unmount()); container.remove(); }
  });
  it('keeps past observations distinct from new alertness and removes decisions after handoff', () => {
    const model = new AdrenalCrisis(); model.apply('reassess', 0);
    for (const [tick, action] of ADRENAL_FIXTURES.expert) model.apply(action, tick);
    const html = renderToStaticMarkup(<AdrenalCrisisTray assessment={model.snapshot(6003)} onAction={() => {}} />);
    expect(html).toContain('102/60 mmHg'); expect(html).toContain('This observation can become stale');
    expect(html).toContain('not discharge clearance'); expect(html).not.toContain('<button');
    expect(html.match(/role="status"/g)).toHaveLength(1);
  });
});
