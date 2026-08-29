/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProxyScaleTray } from '../../src/modules/medical-surgical-nursing/ProxyScaleTray';
import { ProxyScale, PROXY_SCALE_FAMILY_TICKS as FAMILY,
  PROXY_SCALE_REVIEW_TICKS as REVIEW,
  type ProxyScaleAction } from '../../src/modules/medical-surgical-nursing/proxy-scale';

const labels: Record<ProxyScaleAction, string> = {
  'attempt-self-report': 'Attempt self-report first',
  'record-the-observed-behaviours': 'Record the observed behaviours',
  'record-what-the-score-is-not': 'State what the total is not',
  'seek-the-proxy-history': 'Ask someone who knows him',
  'record-analgesic-intent': 'Record bounded analgesic intent',
  'review-boundaries': 'Review the hierarchy and its certainty',
  monitor: 'Schedule reassessment',
  'check-behaviours': 'Observe the behaviours only',
  'check-context': 'Check cause and baseline only',
  reassess: 'Reassess behaviours and context',
  handoff: 'Hand off the number as what it is',
  'read-four-as-four-out-of-ten': 'Chart it as 4 out of 10',
  'vitals-confirm-the-pain': 'Check the pulse to confirm',
  'zero-would-mean-comfortable': 'A zero would mean comfortable',
  'wait-until-they-ask': 'Wait until he asks',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: ProxyScale, tick: number, onAction = vi.fn(), demonstrating = false) => {
  act(() => root.render(<ProxyScaleTray assessment={model.snapshot(tick)}
    onAction={onAction} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Proxy pain scale tray', () => {
  it('never shows the total without saying what it counts', () => {
    render(new ProxyScale(), 0);
    const status = host.querySelector('[role="status"]')!.textContent ?? '';
    expect(status).toContain('Behavioural total 4, the sum of 5 observed items');
    expect(status).toContain('Self-report unavailable');
    // A bare "4" with no qualifier would invite being read as an intensity.
    expect(status).not.toMatch(/total 4\.$/);
  });

  it('lists every scored item with its points', () => {
    render(new ProxyScale(), 0);
    const items = [...host.querySelectorAll('li')].map((entry) => entry.textContent ?? '');
    expect(items).toHaveLength(5);
    expect(items.filter((text) => text.endsWith(': 1'))).toHaveLength(4);
    expect(items.find((text) => text.startsWith('Consolability'))).toContain(': 0');
  });

  it('withholds the limits until they are stated', () => {
    render(new ProxyScale(), 0);
    expect(host.textContent).not.toContain('no validated conversion');
    const model = new ProxyScale();
    model.apply('attempt-self-report', 0);
    model.apply('record-the-observed-behaviours', 1);
    model.apply('record-what-the-score-is-not', 2);
    render(model, 3);
    expect(host.textContent).toContain('has no validated conversion to one');
    expect(host.textContent).toContain('cannot be read downward');
  });

  it('says there is nobody to ask until the daughter arrives', () => {
    render(new ProxyScale(), 0);
    expect(host.textContent).toContain('There is nobody present who knows his baseline');
    const model = new ProxyScale();
    model.advance(FAMILY + 10);
    render(model, FAMILY + 10);
    expect(host.textContent).toContain('cared for him at home for four years');
  });

  it('shows the proxy account in her words once obtained', () => {
    const model = new ProxyScale();
    model.advance(FAMILY + 10);
    model.apply('seek-the-proxy-history', FAMILY + 11);
    render(model, FAMILY + 12);
    expect(host.textContent).toContain('goes quiet and still rather than restless');
  });

  it('keeps the review out of the tray until the learner looks', () => {
    const model = new ProxyScale();
    model.apply('record-analgesic-intent', 0);
    model.advance(REVIEW + 20);
    render(model, REVIEW + 20);
    expect(host.textContent).not.toContain('a total is not an intensity, and that the response');
    model.apply('reassess', REVIEW + 21);
    render(model, REVIEW + 22);
    expect(host.textContent).toContain('further evidence rather than confirmation');
  });

  it('offers every declared choice with an accessible label', () => {
    render(new ProxyScale(), 0);
    for (const label of Object.values(labels)) expect(button(label)).toBeTruthy();
  });

  it('dispatches the exact action a control names', () => {
    const onAction = render(new ProxyScale(), 0);
    act(() => button(labels['attempt-self-report'])!.click());
    expect(onAction).toHaveBeenCalledWith('attempt-self-report');
  });

  it('names no analgesic and disables everything during a worked example', () => {
    const model = new ProxyScale();
    model.apply('record-analgesic-intent', 0);
    render(model, 1);
    const text = (host.textContent ?? '').toLowerCase();
    for (const term of ['morphine', 'oxycodone', 'paracetamol']) expect(text).not.toContain(term);
    render(new ProxyScale(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    for (const entry of host.querySelectorAll('button')) {
      expect(entry.getAttribute('aria-disabled')).toBe('true');
    }
  });
});
