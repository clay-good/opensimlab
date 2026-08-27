/** @vitest-environment jsdom */
import { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ThyroidStormTray } from '../../src/modules/endocrine-metabolic/ThyroidStormTray';
import { ThyroidStorm, THYROID_IODINE_WAIT_TICKS, THYROID_RESPONSE_TICKS, THYROID_DELAY_TICKS,
  THYROID_TAKEOVER_TICKS, type ThyroidStormAction } from '../../src/modules/endocrine-metabolic/thyroid-storm';
import { thyroidInlinePrompt, THYROID_SOURCE_HREF } from '../../src/modules/endocrine-metabolic/tutor/thyroid-guidance';

const VERSION = '0.1.1';
const labels: Record<ThyroidStormAction, string> = {
  'call-support': 'Call qualified support',
  'synthesis-blockade': 'Start qualified synthesis blockade',
  'supportive-care': 'Start qualified supportive care',
  'assess-circulation': 'Assess perfusion and congestion',
  'rate-control-review': 'Request individualized rate-control review',
  iodine: 'Start qualified iodine pathway',
  reassess: 'Reassess temperature, breathing, and perfusion',
  handoff: 'Hand off ongoing treatment and risk',
  'wait-for-labs': 'Wait for laboratory confirmation',
  'blanket-beta-blockade': 'Choose blanket beta blockade for the fast pulse',
};

function mountPatient() {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div'); document.body.append(container);
  const root = createRoot(container); const model = new ThyroidStorm(); let tick = 0;
  const source = vi.fn();
  const dispatch = vi.fn((action: ThyroidStormAction) => { model.apply(action, tick); render(); });
  const render = () => act(() => root.render(<StrictMode><ThyroidStormTray assessment={model.snapshot(tick)}
    scenarioVersion={VERSION} guidance="guided" onOpenSource={source} onAction={dispatch} /></StrictMode>));
  const button = (action: ThyroidStormAction) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent === labels[action])!;
  render();
  return { container, model, dispatch, source, render, button,
    click: (action: ThyroidStormAction) => act(() => button(action).click()),
    advance: (nextTick: number) => { tick = nextTick; model.advance(tick); render(); },
    snapshot: () => model.snapshot(tick),
    cleanup: () => { act(() => root.unmount()); container.remove(); },
  };
}

describe('Thyroid storm experience', () => {
  it('prepares without inventing a patient or making automatic decisions in StrictMode', () => {
    const dispatch = vi.fn();
    const preparing = renderToStaticMarkup(<ThyroidStormTray scenarioVersion={VERSION} onAction={dispatch} />);
    expect(preparing).toContain('Preparing the fictional patient'); expect(preparing).not.toContain('<button');
    const view = mountPatient();
    try {
      view.render(); view.advance(10); view.render();
      expect(view.dispatch).not.toHaveBeenCalled(); expect(dispatch).not.toHaveBeenCalled();
      expect(view.snapshot().synthesisAtTick).toBeNull();
      expect(view.container.querySelectorAll('button')).toHaveLength(10);
      expect(view.container.querySelectorAll('[role="status"]')).toHaveLength(1);
      expect(view.container.querySelector('[aria-label="Private tutor"]')?.hasAttribute('aria-live')).toBe(false);
    } finally { view.cleanup(); }
  });

  it('binds calm guidance to accepted state, selected mode, and exact version', () => {
    const model = new ThyroidStorm();
    const prompt = (level: 'guided' | 'coached' | 'unassisted', version = VERSION) => thyroidInlinePrompt(level,
      { scenarioVersion: version, thyroidStorm: model.snapshot(0) });
    expect(prompt('guided')?.id).toBe('thyroid-urgent-care');
    expect(prompt('coached')?.id).toBe('thyroid-urgent-care');
    expect(prompt('unassisted')).toBeNull(); expect(prompt('guided', '0.1.2')).toBeNull();
    expect(thyroidInlinePrompt('guided', { scenarioVersion: VERSION })).toBeNull();
    for (const action of ['call-support', 'synthesis-blockade', 'supportive-care'] as const) model.apply(action, 0);
    expect(prompt('guided')?.id).toBe('thyroid-circulation');
    model.apply('assess-circulation', 0);
    expect(prompt('coached')?.id).toBe('thyroid-rate-review');
    model.apply('rate-control-review', 0);
    expect(prompt('guided')?.id).toBe('thyroid-iodine-sequence'); expect(prompt('coached')).toBeNull();
    const before = JSON.stringify(model.snapshot(0));
    for (let index = 0; index < 10; index++) prompt('guided');
    expect(JSON.stringify(model.snapshot(0))).toBe(before);
    for (const guidance of ['guided', 'coached', 'unassisted'] as const) {
      const html = renderToStaticMarkup(<ThyroidStormTray assessment={model.snapshot(0)} scenarioVersion={VERSION}
        guidance={guidance} onAction={() => {}} />);
      expect(html.includes('aria-label="Private tutor"')).toBe(guidance === 'guided');
      expect(html).toContain(THYROID_SOURCE_HREF); expect(html).not.toContain('aria-live');
    }
  });

  it('preserves a focused decision after acceptance and guards repeat clicks without removing controls', () => {
    const view = mountPatient();
    try {
      const support = view.button('call-support'); support.focus();
      view.click('call-support');
      expect(view.button('call-support')).toBe(support); expect(document.activeElement).toBe(support);
      expect(support.disabled).toBe(false); expect(support.getAttribute('aria-disabled')).toBe('true');
      expect(view.container.textContent).toContain('Support: active');
      view.click('call-support'); view.advance(10);
      expect(view.dispatch).toHaveBeenCalledExactlyOnceWith('call-support');
      expect(document.activeElement).toBe(support);
      expect(view.button('synthesis-blockade').getAttribute('aria-disabled')).toBe('false');
    } finally { view.cleanup(); }
  });

  it.each(['synthesis-blockade', 'supportive-care'] as const)('keeps laboratory deferral meaningful after only %s has started', (first) => {
    const view = mountPatient();
    try {
      view.click(first);
      expect(view.button('wait-for-labs').getAttribute('aria-disabled')).toBe('false');
      view.click('wait-for-labs');
      expect(view.snapshot().waitForLabsChosen).toBe(true);
      expect(view.dispatch.mock.calls.map(([action]) => action)).toEqual([first, 'wait-for-labs']);
      view.click(first === 'synthesis-blockade' ? 'supportive-care' : 'synthesis-blockade');
      expect(view.button('wait-for-labs').getAttribute('aria-disabled')).toBe('true');
      const acceptedCount = view.dispatch.mock.calls.length;
      view.click('wait-for-labs'); expect(view.dispatch).toHaveBeenCalledTimes(acceptedCount);
      expect(view.container.textContent).toContain('Earlier choices stay in this run: waiting for laboratory confirmation');
    } finally { view.cleanup(); }
  });

  it('records a later pulse-only choice without rewriting an already accepted individualized review', () => {
    const view = mountPatient();
    try {
      view.click('assess-circulation'); view.click('rate-control-review');
      expect(view.snapshot().blanketBetaBlockadeChosen).toBe(false);
      view.advance(10);
      expect(view.button('blanket-beta-blockade').getAttribute('aria-disabled')).toBe('false');
      view.click('blanket-beta-blockade');
      expect(view.snapshot().blanketBetaBlockadeChosen).toBe(true);
      expect(view.snapshot().rateControlReviewedAtTick).toBe(0);
      expect(view.container.textContent).toContain('Blanket beta blockade was not given');
      expect(view.container.textContent).toContain('Earlier choices stay in this run: blanket beta-blockade request');
      expect(view.dispatch.mock.calls.map(([action]) => action)).toEqual(['assess-circulation', 'rate-control-review', 'blanket-beta-blockade']);
    } finally { view.cleanup(); }
  });

  it('sends all declared choices through the real model, retains mistakes, and finishes only after fresh reassessment', () => {
    const view = mountPatient(); const sent: ThyroidStormAction[] = [];
    const choose = (action: ThyroidStormAction) => { sent.push(action); view.click(action); };
    try {
      choose('wait-for-labs'); choose('blanket-beta-blockade'); choose('iodine');
      expect(view.snapshot().iodineAtTick).toBeNull(); expect(view.snapshot().earlyIodineAttempted).toBe(true);
      expect(view.container.textContent).toContain('Iodine was not given');
      choose('rate-control-review'); expect(view.snapshot().rateControlReviewedAtTick).toBeNull();
      choose('reassess'); choose('handoff'); expect(view.snapshot().ended).toBeNull();
      for (const action of ['call-support', 'synthesis-blockade', 'supportive-care', 'assess-circulation', 'rate-control-review'] as const) choose(action);
      expect(view.container.textContent).toContain('Iodine interval: 60 simulated min remaining');
      expect(view.button('wait-for-labs').getAttribute('aria-disabled')).toBe('true');
      view.advance(THYROID_IODINE_WAIT_TICKS);
      expect(view.container.textContent).toContain('At least 1 simulated hour has elapsed');
      expect(view.snapshot().iodineAtTick).toBeNull(); choose('iodine');
      expect(view.container.textContent).toContain('checkpoint in 120 simulated min');
      expect(view.container.textContent).toContain('never wait for it if the patient worsens');
      choose('reassess'); expect(view.snapshot().responseObserved).toBe(false);
      view.advance(THYROID_IODINE_WAIT_TICKS + THYROID_RESPONSE_TICKS);
      expect(view.snapshot().ended).toBeNull();
      expect(view.container.textContent).toContain('What does a fresh bedside reassessment show now?');
      choose('reassess'); expect(view.snapshot().responseObserved).toBe(true);
      expect(view.container.textContent).toContain('temperature 39.3°C, BP 104/62 mmHg, HR 132/min');
      expect(view.container.textContent).toContain('This observation can become stale');
      const handoff = view.button('handoff'); handoff.focus(); choose('handoff');
      expect(view.snapshot().ended).toBe('handoff'); expect(view.container.textContent).toContain('not recovery or discharge clearance');
      expect(view.container.textContent).toContain('Earlier choices stay in this run: waiting for laboratory confirmation; blanket beta-blockade request; early iodine request');
      expect(view.container.querySelector('[aria-label="Private tutor"]')).toBeNull();
      expect(view.button('handoff')).toBe(handoff); expect(document.activeElement).toBe(handoff);
      expect(view.dispatch.mock.calls.map(([action]) => action)).toEqual(sent);
      expect(new Set(sent)).toEqual(new Set(Object.keys(labels)));
      for (const action of Object.keys(labels) as ThyroidStormAction[]) {
        expect(view.button(action).getAttribute('aria-disabled')).toBe('true'); view.click(action);
      }
      expect(view.dispatch).toHaveBeenCalledTimes(sent.length);
    } finally { view.cleanup(); }
  });

  it('keeps old observations visibly separate from deterioration and preserves delay after repair', () => {
    const view = mountPatient();
    try {
      view.click('reassess'); view.advance(THYROID_DELAY_TICKS);
      expect(view.container.textContent).toContain('Current alertness: more confused; poor perfusion persists');
      expect(view.container.textContent).toContain('Last bedside reassessment at simulated 0 min: temperature 39.8°C');
      view.click('synthesis-blockade'); view.click('supportive-care');
      expect(view.container.textContent).toContain('Repairing the plan does not erase that delay');
      expect(view.snapshot().urgentCoverageDelayed).toBe(true);
    } finally { view.cleanup(); }
  });

  it('describes instructor takeover honestly and disables further care without inventing recovery', () => {
    const view = mountPatient();
    try {
      view.click('wait-for-labs'); view.advance(THYROID_TAKEOVER_TICKS);
      expect(view.container.textContent).toContain('Instructor takeover ended this branch');
      expect(view.container.textContent).toContain('does not predict a patient outcome');
      expect(view.container.textContent).toContain('Earlier choices stay in this run: waiting for laboratory confirmation');
      expect(view.container.querySelector('[aria-label="Private tutor"]')).toBeNull();
      view.click('synthesis-blockade'); expect(view.dispatch).toHaveBeenCalledExactlyOnceWith('wait-for-labs');
    } finally { view.cleanup(); }
  });

  it('keeps the current primary source available and requests the shared source-pause action', () => {
    const view = mountPatient();
    try {
      const link = view.container.querySelector('a')!;
      expect(link.href).toBe(THYROID_SOURCE_HREF); expect(link.target).toBe('_blank'); expect(link.rel).toBe('noreferrer');
      expect(link.textContent).toContain('opens in a new tab');
      link.addEventListener('click', (event) => event.preventDefault());
      act(() => link.click()); expect(view.source).toHaveBeenCalledOnce(); expect(view.dispatch).not.toHaveBeenCalled();
    } finally { view.cleanup(); }
  });
});
